from __future__ import annotations

import asyncio
import json
import os
import sys
from typing import Any, Dict, List, Optional

import httpx

import alchm_mcp


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


async def _backend_chat(
    agent_name: str,
    message: str,
    conversation_history: Optional[List[str]] = None,
    context: Optional[Dict[str, Any]] = None,
    model_tier: Optional[str] = None,
) -> Dict[str, Any]:
    agent_id = _agent_id(agent_name)
    merged_context = dict(context or {})
    if conversation_history:
        merged_context["conversationHistory"] = conversation_history[-12:]
    merged_context["mcpTool"] = "chat_with_planetary_agent"

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

    try:
        result = await _backend_chat(
            agent_name=agent_name,
            message=message,
            conversation_history=arguments.get("conversationHistory"),
            context=arguments.get("context") if isinstance(arguments.get("context"), dict) else None,
            model_tier=arguments.get("modelTier"),
        )
        return _text_result(result)
    except Exception as exc:
        return _text_result(
            {
                "error": "chat_with_planetary_agent failed",
                "message": str(exc),
                "backendUrl": BACKEND_URL,
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

    try:
        alchemical_scan = await alchm_mcp.alchemize_ingredients(ingredients)
    except Exception as exc:
        data_errors.append(f"alchemize_ingredients: {exc}")

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

    async def _stance(agent: str) -> Dict[str, Any]:
        try:
            return await _backend_chat(
                agent_name=agent,
                message=debate_prompt,
                context=context,
                model_tier=model_tier,
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
            handler = TOOL_HANDLERS.get(name)
            if handler is None:
                raise ValueError(f"Unknown tool: {name}")
            result = await handler(arguments)
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
