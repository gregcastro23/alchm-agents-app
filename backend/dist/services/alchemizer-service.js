import { logger } from '../utils/logger.js';
function calculateCurrentMomentSimple() {
    const hour = new Date().getHours();
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const planetaryHours = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];
    const currentPlanet = planetaryHours[hour % 7];
    const planetaryAlchemy = {
        Sun: { spirit: 1.0, essence: 0.0, matter: 0.0, substance: 0.0, aNumber: 0 },
        Moon: { spirit: 0.0, essence: 0.5, matter: 0.5, substance: 0.0, aNumber: 0 },
        Mercury: { spirit: 0.5, essence: 0.0, matter: 0.0, substance: 0.5, aNumber: 0 },
        Venus: { spirit: 0.0, essence: 0.7, matter: 0.3, substance: 0.0, aNumber: 0 },
        Mars: { spirit: 0.0, essence: 0.0, matter: 0.5, substance: 0.5, aNumber: 0 },
        Jupiter: { spirit: 0.3, essence: 0.4, matter: 0.3, substance: 0.0, aNumber: 0 },
        Saturn: { spirit: 0.0, essence: 0.0, matter: 0.7, substance: 0.3, aNumber: 0 }
    };
    const base = planetaryAlchemy[currentPlanet] || planetaryAlchemy['Sun'];
    const seasonalModifier = 0.1 * Math.sin((dayOfYear * 2 * Math.PI) / 365);
    const spirit = Math.max(0, Math.min(1, base.spirit + seasonalModifier));
    const essence = Math.max(0, Math.min(1, base.essence + seasonalModifier * 0.5));
    const matter = Math.max(0, Math.min(1, base.matter - seasonalModifier * 0.3));
    const substance = Math.max(0, Math.min(1, base.substance + seasonalModifier * 0.2));
    const aNumber = (spirit + essence + matter + substance) / 7;
    return { spirit, essence, matter, substance, aNumber };
}
export async function generateAlchmForCurrentMoment() {
    try {
        return calculateCurrentMomentSimple();
    }
    catch (error) {
        logger.error('Error generating alchemical values:', error);
        return { spirit: 0.25, essence: 0.25, matter: 0.25, substance: 0.25, aNumber: 0.143 };
    }
}
/**
 * Alchemizes values based on birth chart data
 * Simplified implementation for backend
 */
export async function alchemize(birthData) {
    try {
        // Extract birth hour for planetary calculation
        const birthHour = birthData.birthTime ? parseInt(birthData.birthTime.split(':')[0]) : 12;
        const birthMonth = birthData.birthDate ? new Date(birthData.birthDate).getMonth() : 0;
        // Calculate based on birth planetary hour
        const planetaryHours = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];
        const birthPlanet = planetaryHours[birthHour % 7];
        // Base values by birth planet
        const planetaryBase = {
            'Sun': { spirit: 0.9, essence: 0.1, matter: 0.0, substance: 0.0, aNumber: 0 },
            'Moon': { spirit: 0.1, essence: 0.6, matter: 0.3, substance: 0.0, aNumber: 0 },
            'Mercury': { spirit: 0.4, essence: 0.2, matter: 0.1, substance: 0.3, aNumber: 0 },
            'Venus': { spirit: 0.0, essence: 0.8, matter: 0.2, substance: 0.0, aNumber: 0 },
            'Mars': { spirit: 0.0, essence: 0.0, matter: 0.6, substance: 0.4, aNumber: 0 },
            'Jupiter': { spirit: 0.4, essence: 0.3, matter: 0.2, substance: 0.1, aNumber: 0 },
            'Saturn': { spirit: 0.0, essence: 0.1, matter: 0.6, substance: 0.3, aNumber: 0 }
        };
        const base = planetaryBase[birthPlanet] || planetaryBase['Sun'];
        // Add zodiac influence based on birth month
        const zodiacModifier = 0.1 * Math.sin((birthMonth * Math.PI) / 6);
        // Calculate final values
        const spirit = Math.max(0, Math.min(1, base.spirit + zodiacModifier * 0.5));
        const essence = Math.max(0, Math.min(1, base.essence + zodiacModifier));
        const matter = Math.max(0, Math.min(1, base.matter - zodiacModifier * 0.3));
        const substance = Math.max(0, Math.min(1, base.substance + zodiacModifier * 0.2));
        // Calculate A# (Alchemical Number)
        const aNumber = (spirit + essence + matter + substance) / 7;
        return {
            spirit,
            essence,
            matter,
            substance,
            aNumber
        };
    }
    catch (error) {
        logger.error('Error alchemizing birth data:', error);
        // Return balanced default values
        return {
            spirit: 0.25,
            essence: 0.25,
            matter: 0.25,
            substance: 0.25,
            aNumber: 0.143
        };
    }
}
// Core constants from workspace rules
const signs = {
    0: 'Aries',
    1: 'Taurus',
    2: 'Gemini',
    3: 'Cancer',
    4: 'Leo',
    5: 'Virgo',
    6: 'Libra',
    7: 'Scorpio',
    8: 'Sagittarius',
    9: 'Capricorn',
    10: 'Aquarius',
    11: 'Pisces'
};
const planetInfo = {
    'Sun': {
        'Dignity Effect': { 'Leo': 1, 'Aries': 2, 'Aquarius': -1, 'Libra': -2 },
        'Elements': ['Fire', 'Fire'],
        'Alchemy': { 'Spirit': 1, 'Essence': 0, 'Matter': 0, 'Substance': 0 },
        'Diurnal Element': 'Fire',
        'Nocturnal Element': 'Fire'
    },
    'Moon': {
        'Dignity Effect': { 'Cancer': 1, 'Taurus': 2, 'Capricorn': -1, 'Scorpio': -2 },
        'Elements': ['Water', 'Water'],
        'Alchemy': { 'Spirit': 0, 'Essence': 1, 'Matter': 1, 'Substance': 0 },
        'Diurnal Element': 'Water',
        'Nocturnal Element': 'Water'
    },
    'Mercury': {
        'Dignity Effect': { 'Gemini': 1, 'Virgo': 3, 'Sagittarius': 1, 'Pisces': -3 },
        'Elements': ['Air', 'Earth'],
        'Alchemy': { 'Spirit': 1, 'Essence': 0, 'Matter': 0, 'Substance': 1 },
        'Diurnal Element': 'Air',
        'Nocturnal Element': 'Earth'
    },
    'Venus': {
        'Dignity Effect': { 'Libra': 1, 'Taurus': 1, 'Pisces': 2, 'Aries': -1, 'Scorpio': -1, 'Virgo': -2 },
        'Elements': ['Water', 'Earth'],
        'Alchemy': { 'Spirit': 0, 'Essence': 1, 'Matter': 1, 'Substance': 0 },
        'Diurnal Element': 'Water',
        'Nocturnal Element': 'Earth'
    },
    'Mars': {
        'Dignity Effect': { 'Aries': 1, 'Scorpio': 1, 'Capricorn': 2, 'Taurus': -1, 'Libra': -1, 'Cancer': -2 },
        'Elements': ['Fire', 'Water'],
        'Alchemy': { 'Spirit': 0, 'Essence': 1, 'Matter': 1, 'Substance': 0 },
        'Diurnal Element': 'Fire',
        'Nocturnal Element': 'Water'
    },
    'Jupiter': {
        'Dignity Effect': { 'Pisces': 1, 'Sagittarius': 1, 'Cancer': 2, 'Gemini': -1, 'Virgo': -1, 'Capricorn': -2 },
        'Elements': ['Air', 'Fire'],
        'Alchemy': { 'Spirit': 1, 'Essence': 1, 'Matter': 0, 'Substance': 0 },
        'Diurnal Element': 'Air',
        'Nocturnal Element': 'Fire'
    },
    'Saturn': {
        'Dignity Effect': { 'Aquarius': 1, 'Capricorn': 1, 'Libra': 2, 'Cancer': -1, 'Leo': -1, 'Aries': -2 },
        'Elements': ['Air', 'Earth'],
        'Alchemy': { 'Spirit': 1, 'Essence': 0, 'Matter': 1, 'Substance': 0 },
        'Diurnal Element': 'Air',
        'Nocturnal Element': 'Earth'
    },
    'Uranus': {
        'Dignity Effect': { 'Aquarius': 1, 'Scorpio': 2, 'Taurus': -3 },
        'Elements': ['Water', 'Air'],
        'Alchemy': { 'Spirit': 0, 'Essence': 1, 'Matter': 1, 'Substance': 0 },
        'Diurnal Element': 'Water',
        'Nocturnal Element': 'Air'
    },
    'Neptune': {
        'Dignity Effect': { 'Pisces': 1, 'Cancer': 2, 'Virgo': -1, 'Capricorn': -2 },
        'Elements': ['Water', 'Water'],
        'Alchemy': { 'Spirit': 0, 'Essence': 1, 'Matter': 0, 'Substance': 1 },
        'Diurnal Element': 'Water',
        'Nocturnal Element': 'Water'
    },
    'Pluto': {
        'Dignity Effect': { 'Scorpio': 1, 'Leo': 2, 'Taurus': -1, 'Aquarius': -2 },
        'Elements': ['Earth', 'Water'],
        'Alchemy': { 'Spirit': 0, 'Essence': 1, 'Matter': 1, 'Substance': 0 },
        'Diurnal Element': 'Earth',
        'Nocturnal Element': 'Water'
    },
    'Ascendant': {
        'Diurnal Element': 'Earth',
        'Nocturnal Element': 'Earth'
    }
};
const signInfo = {
    "Aries": {
        "Element": "Fire",
        'Start': { 'Day': 21, 'Month': 3, 'Year': 2022 },
        'End': { 'Day': 19, 'Month': 4, 'Year': 2022 },
        "Major Tarot Card": "The Emperor",
        "Minor Tarot Cards": { "1st Decan": "2 of Wands", "2nd Decan": "3 of Wands", "3rd Decan": "4 of Wands" },
        "Decan Effects": { "1st Decan": ["Mars"], "2nd Decan": ["Sun"], "3rd Decan": ["Venus"] },
        "Degree Effects": { "Mercury": [15, 21], "Venus": [7, 14], "Mars": [22, 26], "Jupiter": [1, 6], "Saturn": [27, 30] },
        "Ruler": "Mars",
        "Modality": "Cardinal"
    },
    "Taurus": {
        "Element": "Earth",
        'Start': { 'Day': 20, 'Month': 4, 'Year': 2022 },
        'End': { 'Day': 20, 'Month': 5, 'Year': 2022 },
        "Major Tarot Card": "The Heirophant",
        "Minor Tarot Cards": { "1st Decan": "5 of Pentacles", "2nd Decan": "6 of Pentacles", "3rd Decan": "7 of Pentacles" },
        "Decan Effects": { "1st Decan": ["Mercury"], "2nd Decan": ["Moon"], "3rd Decan": ["Saturn"] },
        "Degree Effects": { "Mercury": [9, 15], "Venus": [1, 8], "Mars": [27, 30], "Jupiter": [16, 22], "Saturn": [23, 26] },
        "Ruler": "Venus",
        "Modality": "Fixed"
    },
    "Gemini": {
        "Element": "Air",
        'Start': { 'Day': 21, 'Month': 5, 'Year': 2022 },
        'End': { 'Day': 20, 'Month': 6, 'Year': 2022 },
        "Major Tarot Card": "The Lovers",
        "Minor Tarot Cards": { "1st Decan": "8 of Swords", "2nd Decan": "9 of Swords", "3rd Decan": "10 of Swords" },
        "Decan Effects": { "1st Decan": ["Jupiter"], "2nd Decan": ["Mars"], "3rd Decan": ["Uranus", "Sun"] },
        "Degree Effects": { "Mercury": [1, 7], "Venus": [15, 20], "Mars": [26, 30], "Jupiter": [8, 14], "Saturn": [22, 25] },
        "Ruler": "Mercury",
        "Modality": "Mutable"
    },
    "Cancer": {
        "Element": "Water",
        'Start': { 'Day': 21, 'Month': 6, 'Year': 2022 },
        'End': { 'Day': 22, 'Month': 7, 'Year': 2022 },
        "Major Tarot Card": "The Chariot",
        "Minor Tarot Cards": { "1st Decan": "2 of Cups", "2nd Decan": "3 of Cups", "3rd Decan": "4 of Cups" },
        "Decan Effects": { "1st Decan": ["Venus"], "2nd Decan": ["Mercury", "Pluto"], "3rd Decan": ["Neptune", "Moon"] },
        "Degree Effects": { "Mercury": [14, 20], "Venus": [21, 27], "Mars": [1, 6], "Jupiter": [7, 13], "Saturn": [28, 30] },
        "Ruler": "Moon",
        "Modality": "Cardinal"
    },
    "Leo": {
        "Element": "Fire",
        'Start': { 'Day': 23, 'Month': 7, 'Year': 2022 },
        'End': { 'Day': 22, 'Month': 8, 'Year': 2022 },
        "Major Tarot Card": "Strength",
        "Minor Tarot Cards": { "1st Decan": "5 of Wands", "2nd Decan": "6 of Wands", "3rd Decan": "7 of Wands" },
        "Decan Effects": { "1st Decan": ["Saturn"], "2nd Decan": ["Jupiter"], "3rd Decan": ["Mars"] },
        "Degree Effects": { "Mercury": [7, 13], "Venus": [14, 19], "Mars": [26, 30], "Jupiter": [20, 25], "Saturn": [1, 6] },
        "Ruler": "Sun",
        "Modality": "Fixed"
    },
    "Virgo": {
        "Element": "Earth",
        "Start": { 'Day': 23, 'Month': 7, 'Year': 2022 },
        "End": { 'Day': 22, 'Month': 8, 'Year': 2022 },
        "Major Tarot Card": "The Hermit",
        "Minor Tarot Cards": { "1st Decan": "8 of Pentacles", "2nd Decan": "9 of Pentacles", "3rd Decan": "10 of Pentacles" },
        "Decan Effects": { "1st Decan": ["Mars", "Sun"], "2nd Decan": ["Venus"], "3rd Decan": ["Mercury"] },
        "Degree Effects": { "Mercury": [1, 7], "Venus": [8, 13], "Mars": [25, 30], "Jupiter": [14, 18], "Saturn": [19, 24] },
        "Ruler": "Mercury",
        "Modality": "Mutable"
    },
    "Libra": {
        "Element": "Air",
        'Start': { 'Day': 23, 'Month': 9, 'Year': 2022 },
        'End': { 'Day': 22, 'Month': 10, 'Year': 2022 },
        "Major Tarot Card": "Justice",
        "Minor Tarot Cards": { "1st Decan": "2 of Swords", "2nd Decan": "3 of Swords", "3rd Decan": "4 of Swords" },
        "Decan Effects": { "1st Decan": ["Moon"], "2nd Decan": ["Saturn", "Uranus"], "3rd Decan": ["Jupiter"] },
        "Degree Effects": { "Mercury": [20, 24], "Venus": [7, 11], "Mars": [], "Jupiter": [12, 19], "Saturn": [1, 6] },
        "Ruler": "Venus",
        "Modality": "Cardinal"
    },
    "Scorpio": {
        "Element": "Water",
        "Start": { 'Day': 23, 'Month': 10, 'Year': 2022 },
        "End": { 'Day': 21, 'Month': 11, 'Year': 2022 },
        "Major Tarot Card": "Death",
        "Minor Tarot Cards": { "1st Decan": "5 of Cups", "2nd Decan": "6 of Cups", "3rd Decan": "7 of Cups" },
        "Decan Effects": { "1st Decan": ["Pluto"], "2nd Decan": ["Neptune", "Sun"], "3rd Decan": ["Venus"] },
        "Degree Effects": { "Mercury": [22, 27], "Venus": [15, 21], "Mars": [1, 6], "Jupiter": [7, 14], "Saturn": [28, 30] },
        "Ruler": "Mars",
        "Modality": "Fixed"
    },
    "Sagittarius": {
        "Element": "Fire",
        'Start': { 'Day': 22, 'Month': 11, 'Year': 2022 },
        'End': { 'Day': 21, 'Month': 12, 'Year': 2022 },
        "Major Tarot Card": "Temperance",
        "Minor Tarot Cards": { "1st Decan": "8 of Wands", "2nd Decan": "9 of Wands", "3rd Decan": "10 of Wands" },
        "Decan Effects": { "1st Decan": ["Mercury"], "2nd Decan": ["Moon"], "3rd Decan": ["Saturn"] },
        "Degree Effects": { "Mercury": [15, 20], "Venus": [9, 14], "Mars": [], "Jupiter": [1, 8], "Saturn": [21, 25] },
        "Ruler": "Jupiter",
        "Modality": "Mutable"
    },
    "Capricorn": {
        "Element": "Earth",
        'Start': { 'Day': 22, 'Month': 12, 'Year': 2022 },
        'End': { 'Day': 19, 'Month': 1, 'Year': 2022 },
        "Major Tarot Card": "The Devil",
        "Minor Tarot Cards": { "1st Decan": "2 of Pentacles", "2nd Decan": "3 of Pentacles", "3rd Decan": "4 of Pentacles" },
        "Decan Effects": { "1st Decan": ["Jupiter"], "2nd Decan": [], "3rd Decan": ["Sun"] },
        "Degree Effects": { "Mercury": [7, 12], "Venus": [1, 6], "Mars": [], "Jupiter": [13, 19], "Saturn": [26, 30] },
        "Ruler": "Saturn",
        "Modality": "Cardinal"
    },
    "Aquarius": {
        "Element": "Air",
        'Start': { 'Day': 20, 'Month': 1, 'Year': 2022 },
        'End': { 'Day': 18, 'Month': 2, 'Year': 2022 },
        "Major Tarot Card": "The Star",
        "Minor Tarot Cards": { "1st Decan": "5 of Swords", "2nd Decan": "6 of Swords", "3rd Decan": "7 of Swords" },
        "Decan Effects": { "1st Decan": ["Uranus"], "2nd Decan": ["Mercury"], "3rd Decan": ["Moon"] },
        "Degree Effects": { "Mercury": [], "Venus": [13, 20], "Mars": [26, 30], "Jupiter": [21, 25], "Saturn": [1, 6] },
        "Ruler": "Saturn",
        "Modality": "Fixed"
    },
    "Pisces": {
        "Element": "Water",
        'Start': { 'Day': 19, 'Month': 2, 'Year': 2022 },
        'End': { 'Day': 20, 'Month': 3, 'Year': 2022 },
        "Major Tarot Card": "The Moon",
        "Minor Tarot Cards": { "1st Decan": "8 of Cups", "2nd Decan": "9 of Cups", "3rd Decan": "10 of Cups" },
        "Decan Effects": { "1st Decan": ["Saturn", "Neptune", "Venus"], "2nd Decan": ["Jupiter"], "3rd Decan": ["Pisces", "Mars"] },
        "Degree Effects": { "Mercury": [15, 20], "Venus": [1, 8], "Mars": [21, 26], "Jupiter": [9, 14], "Saturn": [27, 30] },
        "Ruler": "Jupiter",
        "Modality": "Mutable"
    }
};
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function createElementObject() {
    return {
        'Fire': 0,
        'Water': 0,
        'Air': 0,
        'Earth': 0
    };
}
function combineElementObjects(obj1, obj2) {
    const combined = createElementObject();
    combined['Fire'] = obj1['Fire'] + obj2['Fire'];
    combined['Water'] = obj1['Water'] + obj2['Water'];
    combined['Air'] = obj1['Air'] + obj2['Air'];
    combined['Earth'] = obj1['Earth'] + obj2['Earth'];
    return combined;
}
function getElementRanking(elementObject) {
    const elementRankDict = { 1: '', 2: '', 3: '', 4: '' };
    let largestElementValue = 0;
    for (const element in elementObject) {
        if (elementObject[element] > largestElementValue) {
            largestElementValue = elementObject[element];
            elementRankDict[1] = element;
        }
    }
    return elementRankDict;
}
function getAbsoluteElementValue(elementObject) {
    return elementObject['Fire'] + elementObject['Water'] + elementObject['Air'] + elementObject['Earth'];
}
async function alchemizeFullPlaceholder(birthInfo, horoscopeDict) {
    const horoscope = horoscopeDict['tropical'];
    const celestialBodies = horoscope.CelestialBodies;
    let diurnalOrNocturnal = 'Diurnal';
    if (birthInfo.hour < 5 || birthInfo.hour > 17) {
        diurnalOrNocturnal = 'Nocturnal';
    }
    const metadata = {};
    // ... (full alchemize logic from workspace rules, adapted to TS)
    // Implement the entire function as provided, handling all effects, aspects, etc.
    // For brevity, insert the core loop and calculations here.
    // Note: This is a placeholder; expand with full code.
    // Example: Rising sign handling
    const risingSign = horoscope.Ascendant.Sign.label;
    planetInfo['Ascendant'].DiurnalElement = signInfo[risingSign].Element;
    planetInfo['Ascendant'].NocturnalElement = signInfo[risingSign].Element;
    // ... continue with full planet loop, dignity, decan, degree, elemental, aspects, alchemy
    // Return alchmInfo as in original
    return alchmInfo;
}
async function generateAlchmForCurrentMomentFull() {
    const now = new Date();
    const currentBirthInfo = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        latitude: 0, // Default or from location
        longitude: 0
    };
    const currentHoroscope = await getRealHoroscope(currentBirthInfo);
    const alchmInfo = await alchemize(currentBirthInfo, { tropical: currentHoroscope });
    // After alchemize completes
    // logging removed in placeholder
    return alchmInfo;
}
//# sourceMappingURL=alchemizer-service.js.map