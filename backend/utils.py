import math
from typing import Dict, Any, List

def calculate_monica_constant(spirit: float, essence: float, matter: float, substance: float) -> float:
    """
    Reverse engineered Monica Constant: MC = φ * (1 + E/T) * (1 + C/10)
    Wait, the TS code says: (spirit * phi + essence) / (matter + substance + 1)
    Let's stick to the TS implementation for consistency.
    """
    phi = 1.618033988749 # Golden ratio
    return (spirit * phi + essence) / (matter + substance + 1)

def get_consciousness_level(monica_constant: float) -> str:
    if monica_constant >= 6.0: return 'Transcendent'
    if monica_constant >= 5.5: return 'Illuminated'
    if monica_constant >= 4.5: return 'Advanced'
    if monica_constant >= 3.5: return 'Elevated'
    if monica_constant >= 2.5: return 'Active'
    if monica_constant >= 1.5: return 'Awakening'
    return 'Dormant'

def determine_historical_era(birth_year: int, agent_id: str) -> dict:
    agent_id_lower = agent_id.lower()
    
    # Handle Monica specially
    if agent_id_lower == 'monica-001':
        return {
            'era': 'monica_special',
            'culture': 'Consciousness Crafter',
            'geography': 'Interdimensional',
            'deathYear': None
        }

    # Determine era based on birth year
    if birth_year < 500:
        era = 'ancient'
        geography = 'Mediterranean/Classical World'
    elif birth_year < 1500:
        era = 'medieval'
        geography = 'Medieval Europe'
    elif birth_year < 1650:
        era = 'renaissance'
        geography = 'Renaissance Europe'
    elif birth_year < 1800:
        era = 'enlightenment'
        geography = 'Enlightenment Europe/Americas'
    else:
        era = 'modern_pre1950'
        geography = 'Modern World'
        
    return {
        'era': era,
        'culture': determine_culture(agent_id_lower, birth_year),
        'geography': geography,
        'deathYear': None # Placeholder
    }

def determine_culture(agent_id: str, birth_year: int) -> str:
    if 'shakespeare' in agent_id or 'chaucer' in agent_id: return 'English'
    if any(name in agent_id for name in ['leonardo', 'dante', 'michelangelo']):
        return 'Italian Renaissance'
    if any(name in agent_id for name in ['descartes', 'voltaire']):
        return 'French'
    if any(name in agent_id for name in ['kant', 'einstein']):
        return 'German'
    if any(name in agent_id for name in ['aristotle', 'plato', 'homer']):
        return 'Ancient Greek'
    if any(name in agent_id for name in ['caesar', 'cicero']):
        return 'Ancient Roman'
    if any(name in agent_id for name in ['dickens', 'austen']):
        return 'Victorian British'
    if any(name in agent_id for name in ['twain', 'dickinson']):
        return 'American'

    if birth_year < 500: return 'Classical'
    if birth_year < 1500: return 'Medieval European'
    if birth_year < 1650: return 'Renaissance European'
    if birth_year < 1800: return 'Enlightenment European'
    return 'Modern International'

def detect_rune_context(alchm_data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        if not alchm_data or "Alchemy Effects" not in alchm_data:
            return {"active": False, "reason": "no_alchemical_data"}

        effects = alchm_data["Alchemy Effects"]
        spirit = effects.get("Total Spirit", 0)
        essence = effects.get("Total Essence", 0)
        matter = effects.get("Total Matter", 0)
        substance = effects.get("Total Substance", 0)

        elements = {"spirit": spirit, "essence": essence, "matter": matter, "substance": substance}
        dominant = max(elements, key=elements.get)

        rune_mapping = {
            "spirit": {"rune": "Fehu", "meaning": "wealth_creation", "power": "manifestation"},
            "essence": {"rune": "Laguz", "meaning": "flow_intuition", "power": "emotional_healing"},
            "matter": {"rune": "Uruz", "meaning": "strength_grounding", "power": "physical_manifestation"},
            "substance": {"rune": "Dagaz", "meaning": "transformation", "power": "breakthrough_catalyst"},
        }

        active_rune = rune_mapping.get(dominant)

        return {
            "active": True,
            "dominantElement": dominant,
            "elementalValue": elements[dominant],
            "activeRune": active_rune,
            "runeStrength": min(elements[dominant] / 10, 1),
        }
    except Exception:
        return {"active": False, "reason": "detection_error"}

def calculate_moment_synergy(natal_chart: Dict[str, Any], current_planets: Dict[str, Any]) -> Dict[str, Any]:
    # Simplified synergy calculation based on signs
    # Real version would use longitudes and aspects
    harmonic_count = 0
    challenging_count = 0
    
    # Simple elemental matching
    element_map = {
        "aries": "fire", "leo": "fire", "sagittarius": "fire",
        "taurus": "earth", "virgo": "earth", "capricorn": "earth",
        "gemini": "air", "libra": "air", "aquarius": "air",
        "cancer": "water", "scorpio": "water", "pisces": "water"
    }
    
    # Just compare Sun and Moon for now
    for body in ["Sun", "Moon"]:
        if body in natal_chart and body in current_planets:
            natal_sign = natal_chart[body].get("sign", "").lower()
            current_sign = current_planets[body].get("sign", "").lower()
            
            if natal_sign == current_sign:
                harmonic_count += 2
            elif element_map.get(natal_sign) == element_map.get(current_sign):
                harmonic_count += 1
            else:
                challenging_count += 1
                
    score = 50 + (harmonic_count * 10) - (challenging_count * 5)
    score = max(0, min(100, score))
    
    return {
        "score": score,
        "description": "Harmonious" if score > 70 else "Challenging" if score < 40 else "Neutral",
        "harmonicCount": harmonic_count,
        "challengingCount": challenging_count
    }
