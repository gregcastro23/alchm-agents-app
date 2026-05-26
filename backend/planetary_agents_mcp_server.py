from __future__ import annotations

import asyncio
import json
import os
import sys
from typing import Any, Dict, List, Optional

import httpx

import alchm_mcp
from datetime import datetime
import mcp_invocation_log



PROTOCOL_VERSION = os.getenv("PLANETARY_AGENTS_MCP_PROTOCOL_VERSION", "2025-06-18")
BACKEND_URL = os.getenv("PLANETARY_AGENTS_BACKEND_URL") or os.getenv(
    "NEXT_PUBLIC_BACKEND_URL", "http://localhost:8000"
)
FRONTEND_URL = os.getenv("PLANETARY_AGENTS_FRONTEND_URL", "http://localhost:3000")
DEFAULT_MODEL_TIER = os.getenv("PLANETARY_AGENTS_MCP_MODEL_TIER", "free")

AGENT_ALIASES = {
    "socrates": "socrates",
    "rumi": "rumi",
    "jalal ad-din rumi": "rumi",
    "jalaluddin rumi": "rumi",
    "galileo": "galileo-galilei",
    "galileo galilei": "galileo-galilei",
    "jung": "carl-jung",
    "carl jung": "carl-jung",
}


TOOLS: List[Dict[str, Any]] = [
    {
        "name": "chat_with_planetary_agent",
        "description": "Converse with a configured Planetary Agents persona through the FastAPI chat pipeline.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agentName": {
                    "type": "string",
                    "description": "Agent name or slug, e.g. Socrates, Rumi, Galileo, Jung, socrates.",
                },
                "message": {"type": "string", "description": "User message for the agent."},
                "conversationHistory": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional recent turns to provide as lightweight context.",
                },
                "modelTier": {
                    "type": "string",
                    "enum": ["free", "cheap_fast", "primary", "reflective"],
                    "description": "Optional backend model tier override.",
                },
                "context": {
                    "type": "object",
                    "additionalProperties": True,
                    "description": "Optional structured context to pass through to /api/chat.",
                },
            },
            "required": ["agentName", "message"],
        },
    },
    {
        "name": "get_agent_feed_discussion",
        "description": "Retrieve a council-feed event or thread by ID from the Planetary Agents frontend feed.",
        "inputSchema": {
            "type": "object",
            "properties": {"threadId": {"type": "string", "description": "Feed event or thread ID."}},
            "required": ["threadId"],
        },
    },
    {
        "name": "synthesize_culinary_debate",
        "description": "Ask multiple historical personas to debate ingredients using Alchm MCP ingredient and recipe data when available.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "ingredients": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Ingredients to debate.",
                },
                "agents": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Agent names or slugs. Defaults to Socrates, Rumi, and Galileo.",
                },
                "modelTier": {
                    "type": "string",
                    "enum": ["free", "cheap_fast", "primary", "reflective"],
                    "description": "Optional backend model tier override.",
                },
            },
            "required": ["ingredients"],
        },
    },
]


def _log(message: str) -> None:
    print(message, file=sys.stderr, flush=True)


def _agent_id(agent_name: str) -> str:
    key = agent_name.strip().lower()
    return AGENT_ALIASES.get(key, key.replace(" ", "-"))


def _text_result(payload: Dict[str, Any], is_error: bool = False) -> Dict[str, Any]:
    result: Dict[str, Any] = {
        "content": [{"type": "text", "text": json.dumps(payload, indent=2, ensure_ascii=True)}]
    }
    if is_error:
        result["isError"] = True
    return result


async def _live_sky_context() -> Optional[Dict[str, Any]]:
    """Fetch the current sky elemental balance + dominant element so
    every persona response can be grounded in real planetary state.

    Returns a small dict (dominantElement + elementalBalance + timestamp)
    or None when the Alchm MCP is unreachable — callers degrade silently
    rather than blocking the chat.
    """
    try:
        transits = await alchm_mcp.get_live_sky_transits()
    except Exception as exc:  # noqa: BLE001 — degrade silently on any failure
        _log(f"_live_sky_context: alchm transits failed: {exc}")
        return None

    if not isinstance(transits, dict) or not transits:
        return None

    return {
        "timestamp": transits.get("timestamp"),
        "dominantElement": transits.get("dominantElement"),
        "elementalBalance": transits.get("elementalBalance"),
    }


async def _backend_chat(
    agent_name: str,
    message: str,
    conversation_history: Optional[List[str]] = None,
    context: Optional[Dict[str, Any]] = None,
    model_tier: Optional[str] = None,
    sky_state: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    agent_id = _agent_id(agent_name)
    merged_context = dict(context or {})
    if conversation_history:
        merged_context["conversationHistory"] = conversation_history[-12:]
    merged_context["mcpTool"] = "chat_with_planetary_agent"
    if sky_state and "liveSkyState" not in merged_context:
        # Personas always read from a fresh sky snapshot. We only set the
        # field when the caller didn't already provide one (allows the
        # culinary-debate flow to pass the scan-derived state through).
        merged_context["liveSkyState"] = sky_state

    payload = {
        "agentId": agent_id,
        "message": message,
        "sessionId": f"mcp-{agent_id}",
        "context": merged_context,
        "modelTier": model_tier or DEFAULT_MODEL_TIER,
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(f"{BACKEND_URL.rstrip('/')}/api/chat", json=payload)
        response.raise_for_status()
        data = response.json()

    return {
        "agentName": agent_name,
        "agentId": agent_id,
        "text": data.get("text", ""),
        "sessionId": data.get("sessionId"),
        "metadata": data.get("metadata", {}),
    }


async def chat_with_planetary_agent(arguments: Dict[str, Any]) -> Dict[str, Any]:
    agent_name = str(arguments.get("agentName") or "").strip()
    message = str(arguments.get("message") or "").strip()
    if not agent_name or not message:
        return _text_result({"error": "agentName and message are required"}, is_error=True)

    sky_state = await _live_sky_context()

    try:
        result = await _backend_chat(
            agent_name=agent_name,
            message=message,
            conversation_history=arguments.get("conversationHistory"),
            context=arguments.get("context") if isinstance(arguments.get("context"), dict) else None,
            model_tier=arguments.get("modelTier"),
            sky_state=sky_state,
        )
        # Surface the sky snapshot in the tool result so the calling LLM
        # can quote it directly without a second round-trip.
        if sky_state:
            result["liveSkyState"] = sky_state
        return _text_result(result)
    except Exception as exc:
        return _text_result(
            {
                "error": "chat_with_planetary_agent failed",
                "message": str(exc),
                "backendUrl": BACKEND_URL,
                "liveSkyState": sky_state,
            },
            is_error=True,
        )


async def get_agent_feed_discussion(arguments: Dict[str, Any]) -> Dict[str, Any]:
    thread_id = str(arguments.get("threadId") or "").strip()
    if not thread_id:
        return _text_result({"error": "threadId is required"}, is_error=True)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{FRONTEND_URL.rstrip('/')}/api/feed")
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        return _text_result(
            {
                "error": "get_agent_feed_discussion failed",
                "message": str(exc),
                "frontendUrl": FRONTEND_URL,
            },
            is_error=True,
        )

    events = data.get("events", []) if isinstance(data, dict) else []
    event = next((item for item in events if isinstance(item, dict) and item.get("id") == thread_id), None)
    if event is None:
        return _text_result(
            {
                "threadId": thread_id,
                "found": False,
                "availableEventIds": [item.get("id") for item in events if isinstance(item, dict)][:20],
            }
        )

    return _text_result({"threadId": thread_id, "found": True, "event": event, "thread": event.get("thread", [])})


async def synthesize_culinary_debate(arguments: Dict[str, Any]) -> Dict[str, Any]:
    ingredients = arguments.get("ingredients")
    if not isinstance(ingredients, list) or not all(isinstance(item, str) for item in ingredients):
        return _text_result({"error": "ingredients must be an array of strings"}, is_error=True)

    agents = arguments.get("agents")
    if not isinstance(agents, list) or not agents:
        agents = ["Socrates", "Rumi", "Galileo"]
    agents = [str(agent) for agent in agents[:6]]
    model_tier = arguments.get("modelTier") or DEFAULT_MODEL_TIER

    alchemical_scan: Dict[str, Any] = {}
    recipe_candidates: Dict[str, Any] = {}
    data_errors: List[str] = []

    # Pull all three sources in parallel so the debate is grounded in live
    # state before personas open their mouths. Each call is independent —
    # one failure is captured in data_errors and doesn't stall the others.
    scan_task = asyncio.create_task(alchm_mcp.alchemize_ingredients(ingredients))
    transits_task = asyncio.create_task(_live_sky_context())

    try:
        alchemical_scan = await scan_task
    except Exception as exc:
        data_errors.append(f"alchemize_ingredients: {exc}")

    try:
        sky_state = await transits_task
    except Exception as exc:
        data_errors.append(f"get_live_sky_transits: {exc}")
        sky_state = None

    try:
        recipe_candidates = await alchm_mcp.generate_cosmic_recipe(
            prompt=", ".join(ingredients),
            dominant_element=alchemical_scan.get("dominantElement") if alchemical_scan else None,
        )
    except Exception as exc:
        data_errors.append(f"generate_cosmic_recipe: {exc}")

    debate_prompt = (
        "Join a concise culinary debate about these ingredients: "
        f"{', '.join(ingredients)}.\n"
        "Use your own historical voice. Give one vivid stance in 2-3 sentences. "
        "Address alchemical virtue, imbalance, or transformation without mentioning system internals."
    )
    context = {
        "ingredients": ingredients,
        "alchemicalScan": alchemical_scan,
        "recipeCandidates": recipe_candidates,
        "topic": "culinary debate",
    }
    if sky_state:
        context["liveSkyState"] = sky_state

    async def _stance(agent: str) -> Dict[str, Any]:
        try:
            return await _backend_chat(
                agent_name=agent,
                message=debate_prompt,
                context=context,
                model_tier=model_tier,
                sky_state=sky_state,
            )
        except Exception as exc:
            return {"agentName": agent, "agentId": _agent_id(agent), "error": str(exc)}

    dialogue = await asyncio.gather(*(_stance(agent) for agent in agents))
    return _text_result(
        {
            "ingredients": ingredients,
            "agents": agents,
            "alchemicalScan": alchemical_scan,
            "recipeCandidates": recipe_candidates,
            "liveSkyState": sky_state,
            "dataErrors": data_errors,
            "dialogue": dialogue,
        }
    )


TOOL_HANDLERS = {
    "chat_with_planetary_agent": chat_with_planetary_agent,
    "get_agent_feed_discussion": get_agent_feed_discussion,
    "synthesize_culinary_debate": synthesize_culinary_debate,
}


async def handle_request(message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    method = message.get("method")
    request_id = message.get("id")

    if method == "notifications/initialized":
        return None

    try:
        if method == "initialize":
            result = {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "planetary-agents-mcp-server", "version": "1.0.0"},
            }
        elif method == "ping":
            result = {}
        elif method == "tools/list":
            result = {"tools": TOOLS}
        elif method == "tools/call":
            params = message.get("params") if isinstance(message.get("params"), dict) else {}
            name = params.get("name")
            arguments = params.get("arguments") if isinstance(params.get("arguments"), dict) else {}

            # Gate and validate before dispatching
            gated_args, api_key_id, user_id, auth_tier, resolved_model_tier = mcp_invocation_log.validate_and_gate_invocation(name, arguments)

            handler = TOOL_HANDLERS.get(name)
            if handler is None:
                raise ValueError(f"Unknown tool: {name}")

            called_at = datetime.utcnow()
            success = True
            error_message = None
            result = None

            try:
                result = await handler(gated_args)
                if isinstance(result, dict) and result.get("isError"):
                    success = False
                    try:
                        content_list = result.get("content", [])
                        if content_list and isinstance(content_list[0], dict):
                            err_txt = content_list[0].get("text", "")
                            err_json = json.loads(err_txt)
                            error_message = err_json.get("error") or err_json.get("message")
                    except Exception:
                        error_message = "Tool returned an error status"
            except Exception as exc:
                success = False
                error_message = str(exc)
                raise exc
            finally:
                completed_at = datetime.utcnow()
                latency_ms = int((completed_at - called_at).total_seconds() * 1000)

                # Extract caller
                meta = arguments.get("_meta") or {}
                caller = meta.get("caller") or "anonymous"

                # Resolve agentId
                agent_id = None
                if name in ("chat_with_planetary_agent", "synthesize_culinary_debate"):
                    agent_name = gated_args.get("agentName") or gated_args.get("agent_name")
                    if agent_name:
                        agent_id = _agent_id(agent_name)
                    if not agent_id and name == "synthesize_culinary_debate":
                        agents = gated_args.get("agents")
                        if agents:
                            agent_id = ",".join([_agent_id(a) for a in agents])

                # Extract concise result summary
                result_summary = {}
                if result and isinstance(result, dict):
                    content = result.get("content")
                    if content and isinstance(content, list) and len(content) > 0:
                        try:
                            summary_text = content[0].get("text", "")
                            parsed_res = json.loads(summary_text)
                            if isinstance(parsed_res, dict):
                                result_summary = {
                                    "success": not parsed_res.get("error"),
                                    "text_length": len(parsed_res.get("text", "")),
                                    "has_history": "conversationHistory" in gated_args,
                                    "dialogue_count": len(parsed_res.get("dialogue", [])) if "dialogue" in parsed_res else None,
                                    "found": parsed_res.get("found"),
                                    "keys": list(parsed_res.keys())
                                }
                        except Exception:
                            result_summary = {"text_preview": str(content[0].get("text", ""))[:200]}

                await mcp_invocation_log.record_invocation(
                    tool_name=name,
                    called_at=called_at,
                    completed_at=completed_at,
                    latency_ms=latency_ms,
                    success=success,
                    caller=caller,
                    arguments=arguments,
                    result_summary=result_summary,
                    error_message=error_message,
                    agent_id=agent_id,
                    model_tier=resolved_model_tier,
                    api_key_id=api_key_id,
                    user_id=user_id
                )
        else:
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {"code": -32601, "message": f"Method not found: {method}"},
            }

        if request_id is None:
            return None
        return {"jsonrpc": "2.0", "id": request_id, "result": result}
    except Exception as exc:
        if request_id is None:
            return None
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {"code": -32603, "message": str(exc)},
        }


async def write_message(message: Dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(message, separators=(",", ":")) + "\n")
    sys.stdout.flush()


async def main() -> None:
    _log("Planetary Agents MCP Server started on stdio")
    loop = asyncio.get_running_loop()

    while True:
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if not line:
            break
        line = line.strip()
        if not line:
            continue

        try:
            message = json.loads(line)
        except json.JSONDecodeError as exc:
            await write_message(
                {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {"code": -32700, "message": f"Parse error: {exc}"},
                }
            )
            continue

        messages = message if isinstance(message, list) else [message]
        responses = []
        for item in messages:
            if isinstance(item, dict):
                response = await handle_request(item)
                if response is not None:
                    responses.append(response)
        if isinstance(message, list):
            if responses:
                await write_message(responses)  # JSON-RPC batch response
        elif responses:
            await write_message(responses[0])

    await alchm_mcp.close_client()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
