# Kinetic Profiles Data
# Central repository for agent kinetic evolution characteristics

AGENT_KINETIC_PROFILES = {
    "leonardo-da-vinci": {
        "id": "leonardo-da-vinci",
        "name": "Leonardo da Vinci",
        "alignment": "harmonious",
        "velocity_signature": "rapid_expansion",
        "components": {
            "consciousness_velocity": 0.8,
            "interaction_momentum": 0.6,
            "aspect_sensitivity": 0.9,
            "evolution_rate": 0.7,
        }
    },
    "carl-jung": {
        "id": "carl-jung",
        "name": "Carl Jung",
        "alignment": "contemplative",
        "velocity_signature": "deep_integration",
        "components": {
            "consciousness_velocity": 0.6,
            "interaction_momentum": 0.7,
            "aspect_sensitivity": 0.95,
            "evolution_rate": 0.5,
        }
    },
    "monica-001": {
        "id": "monica-001",
        "name": "Monica",
        "alignment": "synthesizer",
        "velocity_signature": "unified_field",
        "components": {
            "consciousness_velocity": 0.9,
            "interaction_momentum": 0.9,
            "aspect_sensitivity": 1.0,
            "evolution_rate": 0.9,
        }
    }
}

def get_kinetic_profile(agent_id: str) -> dict:
    return AGENT_KINETIC_PROFILES.get(agent_id, {
        "id": agent_id,
        "name": "Unknown Entity",
        "alignment": "neutral",
        "velocity_signature": "steady_state",
        "components": {
            "consciousness_velocity": 0.5,
            "interaction_momentum": 0.5,
            "aspect_sensitivity": 0.5,
            "evolution_rate": 0.5,
        }
    })

def get_momentum_type(velocity: float) -> str:
    if velocity > 0.8:
        return "accelerating"
    elif velocity > 0.5:
        return "steady"
    return "gathering"
