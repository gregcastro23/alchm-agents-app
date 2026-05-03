import math

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
