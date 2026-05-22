import pytest
from uuid import uuid4
from fastapi.testclient import TestClient

from main import app
import providers
import feed_emitter

client = TestClient(app)


def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Planetary Agents Core API is operational"}


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


# --- Provider fallback chain rotation tests --------------------------------
#
# Five scenarios, walking the chain Anthropic → Groq → Cerebras → Gemini →
# OpenRouter → OpenAI. Each scenario marks N providers as rate-limited and
# asserts run_chain settles on the first survivor. We mock at
# providers.call_provider so the test never touches a real network client.


@pytest.fixture
def all_keys_set(monkeypatch):
    """Wire keys for every provider so build_chain emits all six."""
    monkeypatch.setenv("ANTHROPIC_API_KEY", "ak")
    monkeypatch.setenv("GROQ_API_KEY", "gk")
    monkeypatch.setenv("CEREBRAS_API_KEY", "ck")
    monkeypatch.setenv("GEMINI_API_KEY", "gmk")
    monkeypatch.setenv("OPENROUTER_API_KEY", "ork")
    monkeypatch.setenv("OPENAI_API_KEY", "oak")


def _selective_failure(failing_names):
    async def fake_call(cfg, persona_block, rag_block, user_message):
        if cfg.name in failing_names:
            raise Exception("429 rate limit exceeded")
        return providers.CallResult(
            text=f"hello from {cfg.name}",
            provider=cfg.name,
            model=cfg.model,
        )

    return fake_call


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("failing", "expected_provider"),
    [
        # Scenario 1 — anthropic fails, groq succeeds.
        (["anthropic"], "groq"),
        # Scenario 2 — anthropic + groq fail, cerebras succeeds.
        (["anthropic", "groq"], "cerebras"),
        # Scenario 3 — anthropic + groq + cerebras fail, gemini succeeds.
        (["anthropic", "groq", "cerebras"], "gemini"),
        # Scenario 4 — only openrouter survives.
        (["anthropic", "groq", "cerebras", "gemini"], "openrouter"),
        # Scenario 5 — every free provider rate-limited; paid OpenAI catches.
        (["anthropic", "groq", "cerebras", "gemini", "openrouter"], "openai"),
    ],
)
async def test_chain_walks_to_first_survivor(
    all_keys_set, monkeypatch, failing, expected_provider
):
    monkeypatch.setattr(providers, "call_provider", _selective_failure(failing))
    chain = providers.build_chain("cheap_fast", "claude-haiku-4-5-20251001")
    result = await providers.run_chain(
        chain=chain,
        persona_block="PERSONA",
        rag_block="",
        user_message="hi",
        agent_id="test-agent",
        tier="cheap_fast",
        persona_cache_key="abcd1234",
    )
    assert result is not None
    assert result.provider == expected_provider


@pytest.mark.asyncio
async def test_chain_returns_none_when_every_provider_fails(all_keys_set, monkeypatch):
    """Last-line: total outage → run_chain returns None (handler emits a stub)."""
    every_provider = ["anthropic", "groq", "cerebras", "gemini", "openrouter", "openai"]
    monkeypatch.setattr(providers, "call_provider", _selective_failure(every_provider))
    chain = providers.build_chain("cheap_fast", "claude-haiku-4-5-20251001")
    result = await providers.run_chain(
        chain=chain,
        persona_block="P",
        rag_block="",
        user_message="hi",
        agent_id="t",
        tier="cheap_fast",
    )
    assert result is None


@pytest.mark.asyncio
async def test_free_tier_skips_anthropic_entirely(all_keys_set, monkeypatch):
    """tier=='free' must not include anthropic in the chain at all."""
    monkeypatch.setattr(providers, "call_provider", _selective_failure([]))
    chain = providers.build_chain("free", anthropic_model=None)
    assert "anthropic" not in [c.name for c in chain]
    result = await providers.run_chain(
        chain=chain,
        persona_block="P",
        rag_block="",
        user_message="hi",
        agent_id="t",
        tier="free",
    )
    assert result is not None
    assert result.provider == "groq"


@pytest.mark.asyncio
async def test_chain_skips_providers_with_missing_keys(monkeypatch):
    """If GROQ_API_KEY is unset, chain should jump straight to cerebras."""
    monkeypatch.setenv("ANTHROPIC_API_KEY", "ak")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.setenv("CEREBRAS_API_KEY", "ck")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(providers, "call_provider", _selective_failure(["anthropic"]))
    chain = providers.build_chain("cheap_fast", "claude-haiku-4-5-20251001")
    result = await providers.run_chain(
        chain=chain,
        persona_block="P",
        rag_block="",
        user_message="hi",
        agent_id="t",
        tier="cheap_fast",
    )
    assert result is not None
    assert result.provider == "cerebras"


@pytest.mark.asyncio
async def test_paid_fallback_emits_alert_event(all_keys_set, monkeypatch, capsys):
    """When OpenAI catches the request, an alert_event log line must fire."""
    every_free = ["anthropic", "groq", "cerebras", "gemini", "openrouter"]
    monkeypatch.setattr(providers, "call_provider", _selective_failure(every_free))
    chain = providers.build_chain("cheap_fast", "claude-haiku-4-5-20251001")
    await providers.run_chain(
        chain=chain,
        persona_block="P",
        rag_block="",
        user_message="hi",
        agent_id="t",
        tier="cheap_fast",
    )
    captured = capsys.readouterr()
    assert "alert_event reason=paid_fallback provider=openai" in captured.out


@pytest.mark.asyncio
async def test_no_alert_when_free_provider_succeeds(all_keys_set, monkeypatch, capsys):
    """Successful free-tier provider must NOT emit the paid-fallback alert."""
    monkeypatch.setattr(providers, "call_provider", _selective_failure([]))
    chain = providers.build_chain("free", anthropic_model=None)
    await providers.run_chain(
        chain=chain,
        persona_block="P",
        rag_block="",
        user_message="hi",
        agent_id="t",
        tier="free",
    )
    captured = capsys.readouterr()
    assert "alert_event" not in captured.out


def test_is_quota_error_recognises_common_phrasings():
    samples = [
        "Error code: 429 - rate limit",
        "Insufficient credit balance",
        "You have exceeded your monthly quota",
        "billing issue with your account",
    ]
    for s in samples:
        assert providers.is_quota_error(Exception(s)), s

    # Non-quota errors must NOT trip the heuristic.
    assert not providers.is_quota_error(Exception("Connection refused"))
    assert not providers.is_quota_error(Exception("Invalid JSON"))


def test_philosophers_stone_positions_get():
    response = client.get("/api/philosophers-stone/positions?year=2026&month=5&day=21&hour=8&minute=0")
    assert response.status_code == 200
    data = response.json()
    assert "elementalProperties" in data
    assert "thermodynamicProperties" in data
    assert "esms" in data
    assert "kalchm" in data
    assert "monica" in data
    assert "perPlanet" in data
    assert data["normalized"] is True

def test_philosophers_stone_positions_post():
    response = client.post("/api/philosophers-stone/positions", json={})
    assert response.status_code == 200
    data = response.json()
    assert "elementalProperties" in data
    
    custom_planets = {
        "Sun": {"sign": "Leo", "degree": 15, "minute": 30, "exactLongitude": 135.5},
        "Moon": {"sign": "Cancer", "degree": 12, "minute": 0, "exactLongitude": 102.0}
    }
    response = client.post(
        "/api/philosophers-stone/positions",
        json={"year": 2026, "month": 5, "day": 21, "customPlanets": custom_planets}
    )
    assert response.status_code == 200
    data = response.json()
    assert "Sun" in data["perPlanet"]
    assert data["perPlanet"]["Sun"]["sign"] == "Leo"

def test_internal_agent_sync_security():
    response = client.post("/api/internal/agent-sync", json={
        "agentId": "sync-test-agent",
        "displayName": "Sync Test Agent"
    })
    assert response.status_code == 403

    response = client.post(
        "/api/internal/agent-sync",
        headers={"X-Sync-Secret": "wrong-secret"},
        json={
            "agentId": "sync-test-agent",
            "displayName": "Sync Test Agent"
        }
    )
    assert response.status_code == 403

def test_internal_agent_sync_success_and_kinetics():
    from main import INTERNAL_API_SECRET
    agent_id = f"sync-test-agent-{uuid4().hex[:8]}"
    
    response = client.post(
        "/api/internal/agent-sync",
        headers={"X-Sync-Secret": INTERNAL_API_SECRET},
        json={
            "agentId": agent_id,
            "displayName": "Original Sync Agent",
            "title": "First Master of Sync",
            "avatar": "sync_avatar.png",
            "color": "#ff00ff",
            "symbol": "Sun"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["agentId"] == agent_id
    assert data["action"] == "created"

    response = client.post(
        "/api/internal/agent-sync",
        headers={"X-Internal-Secret": INTERNAL_API_SECRET},
        json={
            "agentId": agent_id,
            "displayName": "Updated Sync Agent",
            "title": "Grandmaster of Sync"
        }
    )
    assert response.status_code == 200
    assert response.json()["action"] == "updated"

    response = client.get(f"/api/agents/{agent_id}/kinetics")
    assert response.status_code == 200
    data = response.json()
    assert "velocity" in data
    assert "momentum" in data
    assert "potentialDifference" in data
    assert "power" in data
    assert "force" in data


def test_feed_emitter_builds_wten_compatible_payload():
    payload = feed_emitter.build_feed_payload(
        "galileo@agentic.alchm.kitchen",
        "agent_chat",
        {
            "agentName": "Galileo",
            "messagePreview": "Observe the moons.",
            "timestamp": "2026-05-22T00:00:00Z",
        },
    )

    assert payload["agentEmail"] == "galileo@agentic.alchm.kitchen"
    assert payload["eventType"] == "agent_chat"
    assert payload["actionType"] == "agent_chat"
    assert payload["agentDisplayName"] == "Galileo"
    assert payload["timestamp"] == "2026-05-22T00:00:00Z"
    assert payload["activityDetails"]["messagePreview"] == "Observe the moons."
    assert payload["metadataPayload"]["actionType"] == "agent_chat"
    assert payload["metadataPayload"]["activityDetails"]["messagePreview"] == "Observe the moons."
    assert payload["metadataPayload"]["timestamp"] == "2026-05-22T00:00:00Z"


@pytest.mark.asyncio
async def test_feed_emitter_posts_to_wten_with_bearer_header(monkeypatch, caplog):
    captured = {}

    class FakeResponse:
        status_code = 200
        reason_phrase = "OK"
        text = '{"success":true}'

    class FakeAsyncClient:
        def __init__(self, timeout):
            captured["timeout"] = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return None

        async def post(self, url, json, headers):
            captured["url"] = url
            captured["json"] = json
            captured["headers"] = headers
            return FakeResponse()

    monkeypatch.setattr(feed_emitter, "ALCHM_KITCHEN_URL", "https://alchm.kitchen")
    monkeypatch.setattr(feed_emitter, "INTERNAL_API_SECRET", "test-secret")
    monkeypatch.setattr(feed_emitter.httpx, "AsyncClient", FakeAsyncClient)

    with caplog.at_level("INFO"):
        await feed_emitter._post_feed_event(
            "galileo@agentic.alchm.kitchen",
            "agent_chat",
            {"activityDetails": {"messagePreview": "observe"}, "timestamp": "2026-05-22T00:00:00Z"},
        )

    assert captured["url"] == "https://alchm.kitchen/api/feed"
    assert captured["headers"]["Authorization"] == "Bearer test-secret"
    assert captured["json"]["agentEmail"] == "galileo@agentic.alchm.kitchen"
    assert captured["json"]["eventType"] == "agent_chat"
    assert captured["json"]["actionType"] == "agent_chat"
    assert captured["json"]["activityDetails"]["messagePreview"] == "observe"
    assert captured["json"]["metadataPayload"]["timestamp"] == "2026-05-22T00:00:00Z"
    assert "feed_emit ok: galileo@agentic.alchm.kitchen/agent_chat -> 200" in caplog.text
