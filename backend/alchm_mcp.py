from __future__ import annotations

import asyncio
import json
import os
import shlex
from collections import deque
from pathlib import Path
from typing import Any, Dict, List, Optional


ALCHM_MCP_TOOL_NAMES = {
    "get_live_sky_transits",
    "alchemize_ingredients",
    "generate_cosmic_recipe",
}

DEFAULT_PROTOCOL_VERSION = "2025-06-18"


class AlchmMCPError(RuntimeError):
    pass


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() not in {"0", "false", "no", "off"}


def is_enabled() -> bool:
    return _env_bool("ALCHM_MCP_ENABLED", True)


def _default_server_path() -> Path:
    explicit = os.getenv("ALCHM_MCP_SERVER_PATH")
    if explicit:
        return Path(explicit).expanduser()

    here = Path(__file__).resolve()
    candidates = [
        here.parents[1] / "mcp-server" / "src" / "index.ts",
        here.parents[2] / "WhatToEatNext-master" / "mcp-server" / "src" / "index.ts",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[-1]


def _command_args(server_path: Path) -> tuple[str, List[str]]:
    command = os.getenv("ALCHM_MCP_COMMAND", "bun")
    args_env = os.getenv("ALCHM_MCP_ARGS")
    if args_env:
        return command, shlex.split(args_env)
    return command, ["run", str(server_path)]


def config_status() -> Dict[str, Any]:
    server_path = _default_server_path()
    command, args = _command_args(server_path)
    return {
        "enabled": is_enabled(),
        "command": command,
        "args": args,
        "serverPath": str(server_path),
        "serverPathExists": server_path.exists(),
        "databaseUrlConfigured": bool(os.getenv("ALCHM_MCP_DATABASE_URL") or os.getenv("DATABASE_URL")),
        "protocolVersion": os.getenv("ALCHM_MCP_PROTOCOL_VERSION", DEFAULT_PROTOCOL_VERSION),
    }


def _content_text(result: Dict[str, Any]) -> str:
    content = result.get("content")
    if not isinstance(content, list):
        return ""
    chunks = []
    for item in content:
        if isinstance(item, dict) and item.get("type") == "text":
            text = item.get("text")
            if isinstance(text, str):
                chunks.append(text)
    return "\n".join(chunks).strip()


def parse_tool_json(result: Dict[str, Any]) -> Dict[str, Any]:
    text = _content_text(result)
    if not text:
        return {}
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return {"text": text}
    if isinstance(parsed, dict):
        return parsed
    return {"value": parsed}


class AlchmMCPClient:
    def __init__(self) -> None:
        self._proc: Optional[asyncio.subprocess.Process] = None
        self._request_id = 0
        self._start_lock = asyncio.Lock()
        self._request_lock = asyncio.Lock()
        self._stderr_task: Optional[asyncio.Task[None]] = None
        self._stderr_tail: deque[str] = deque(maxlen=20)
        self._stdout_tail: deque[str] = deque(maxlen=20)
        self._tools: Optional[List[Dict[str, Any]]] = None

    @property
    def connected(self) -> bool:
        return self._proc is not None and self._proc.returncode is None

    async def ensure_started(self) -> None:
        if self.connected:
            return

        async with self._start_lock:
            if self.connected:
                return
            if not is_enabled():
                raise AlchmMCPError("Alchm MCP integration is disabled")

            server_path = _default_server_path()
            if not server_path.exists():
                raise AlchmMCPError(f"Alchm MCP server not found at {server_path}")

            command, args = _command_args(server_path)
            env = os.environ.copy()
            database_url = os.getenv("ALCHM_MCP_DATABASE_URL") or os.getenv("DATABASE_URL")
            if database_url:
                env["DATABASE_URL"] = database_url

            try:
                self._proc = await asyncio.create_subprocess_exec(
                    command,
                    *args,
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=str(server_path.parents[1]),
                    env=env,
                )
            except FileNotFoundError as exc:
                raise AlchmMCPError(f"Unable to start Alchm MCP command: {command}") from exc

            self._stderr_task = asyncio.create_task(self._drain_stderr())
            try:
                await self._initialize()
            except Exception:
                await self.close()
                raise

    async def _drain_stderr(self) -> None:
        proc = self._proc
        if not proc or not proc.stderr:
            return
        while True:
            line = await proc.stderr.readline()
            if not line:
                break
            decoded = line.decode("utf-8", errors="replace").strip()
            if decoded:
                self._stderr_tail.append(decoded)

    async def _initialize(self) -> None:
        protocol_version = os.getenv("ALCHM_MCP_PROTOCOL_VERSION", DEFAULT_PROTOCOL_VERSION)
        await self._request(
            "initialize",
            {
                "protocolVersion": protocol_version,
                "capabilities": {},
                "clientInfo": {"name": "planetary-agents-backend", "version": "1.0.0"},
            },
        )
        await self._notify("notifications/initialized")
        await self.list_tools(refresh=True)

    async def _notify(self, method: str, params: Optional[Dict[str, Any]] = None) -> None:
        await self._write({"jsonrpc": "2.0", "method": method, **({"params": params} if params else {})})

    async def _request(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self._proc or not self._proc.stdout:
            raise AlchmMCPError("Alchm MCP process is not running")

        async with self._request_lock:
            self._request_id += 1
            request_id = self._request_id
            await self._write(
                {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "method": method,
                    **({"params": params} if params is not None else {}),
                }
            )

            timeout = float(os.getenv("ALCHM_MCP_TIMEOUT_SECONDS", "8"))
            while True:
                try:
                    line = await asyncio.wait_for(self._proc.stdout.readline(), timeout=timeout)
                except asyncio.TimeoutError as exc:
                    raise AlchmMCPError(f"Alchm MCP request timed out: {method}") from exc

                if not line:
                    stderr_tail = "; ".join(self._stderr_tail)
                    stdout_tail = "; ".join(self._stdout_tail)
                    raise AlchmMCPError(
                        f"Alchm MCP process exited while waiting for {method}: "
                        f"stderr={stderr_tail} stdout={stdout_tail}"
                    )

                try:
                    message = json.loads(line.decode("utf-8"))
                except json.JSONDecodeError:
                    decoded = line.decode("utf-8", errors="replace").strip()
                    if decoded:
                        self._stdout_tail.append(decoded)
                    continue

                if message.get("id") != request_id:
                    continue
                if "error" in message:
                    error = message["error"]
                    detail = error.get("message") if isinstance(error, dict) else str(error)
                    raise AlchmMCPError(f"Alchm MCP {method} failed: {detail}")

                result = message.get("result")
                return result if isinstance(result, dict) else {}

    async def _write(self, message: Dict[str, Any]) -> None:
        if not self._proc or not self._proc.stdin:
            raise AlchmMCPError("Alchm MCP stdin is not available")
        payload = json.dumps(message, separators=(",", ":")) + "\n"
        self._proc.stdin.write(payload.encode("utf-8"))
        await self._proc.stdin.drain()

    async def list_tools(self, refresh: bool = False) -> List[Dict[str, Any]]:
        if self._tools is not None and not refresh:
            return self._tools
        result = await self._request("tools/list")
        tools = result.get("tools", [])
        if not isinstance(tools, list):
            raise AlchmMCPError("Alchm MCP returned invalid tools/list payload")

        names = {tool.get("name") for tool in tools if isinstance(tool, dict)}
        missing = sorted(ALCHM_MCP_TOOL_NAMES - names)
        if missing:
            raise AlchmMCPError(f"Alchm MCP is missing expected tools: {', '.join(missing)}")

        self._tools = [tool for tool in tools if isinstance(tool, dict)]
        return self._tools

    async def call_tool(self, name: str, arguments: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if name not in ALCHM_MCP_TOOL_NAMES:
            raise AlchmMCPError(f"Unsupported Alchm MCP tool: {name}")
        await self.ensure_started()
        result = await self._request("tools/call", {"name": name, "arguments": arguments or {}})
        if result.get("isError"):
            raise AlchmMCPError(_content_text(result) or f"Alchm MCP tool failed: {name}")
        return result

    async def call_tool_json(self, name: str, arguments: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return parse_tool_json(await self.call_tool(name, arguments))

    async def close(self) -> None:
        proc = self._proc
        self._proc = None
        self._tools = None

        if proc and proc.returncode is None:
            proc.terminate()
            try:
                await asyncio.wait_for(proc.wait(), timeout=3)
            except asyncio.TimeoutError:
                proc.kill()
                await proc.wait()

        if self._stderr_task:
            self._stderr_task.cancel()
            try:
                await self._stderr_task
            except asyncio.CancelledError:
                pass
            self._stderr_task = None


_CLIENT = AlchmMCPClient()


async def warmup() -> None:
    await _CLIENT.ensure_started()


async def list_tools() -> List[Dict[str, Any]]:
    await _CLIENT.ensure_started()
    return await _CLIENT.list_tools()


async def call_tool_json(name: str, arguments: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return await _CLIENT.call_tool_json(name, arguments)


async def get_live_sky_transits(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
) -> Dict[str, Any]:
    args: Dict[str, Any] = {}
    if latitude is not None:
        args["latitude"] = latitude
    if longitude is not None:
        args["longitude"] = longitude
    return await call_tool_json("get_live_sky_transits", args)


async def alchemize_ingredients(ingredients: List[str]) -> Dict[str, Any]:
    return await call_tool_json("alchemize_ingredients", {"ingredients": ingredients})


async def generate_cosmic_recipe(
    prompt: Optional[str] = None,
    cuisine: Optional[str] = None,
    dietary: Optional[List[str]] = None,
    dominant_element: Optional[str] = None,
) -> Dict[str, Any]:
    args: Dict[str, Any] = {}
    if prompt:
        args["prompt"] = prompt
    if cuisine:
        args["cuisine"] = cuisine
    if dietary:
        args["dietary"] = dietary
    if dominant_element:
        args["dominantElement"] = dominant_element
    return await call_tool_json("generate_cosmic_recipe", args)


async def status(include_tools: bool = True) -> Dict[str, Any]:
    info = config_status()
    info["connected"] = _CLIENT.connected
    if not info["enabled"]:
        info["status"] = "disabled"
        return info

    try:
        if include_tools:
            info["tools"] = await list_tools()
        info["connected"] = _CLIENT.connected
        info["status"] = "ready"
    except Exception as exc:
        info["status"] = "unavailable"
        info["error"] = str(exc)
    return info


async def close_client() -> None:
    await _CLIENT.close()
