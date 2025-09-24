/**
 * Kinetics API Client
 * Centralized wrapper for GET/POST/PUT endpoints in /api/alchm-kinetics
 */
export class AlchemicalKineticsClient {
    static async get(params) {
        try {
            const url = new URL('/api/alchm-kinetics', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
            url.searchParams.set('lat', String(params.lat));
            url.searchParams.set('lon', String(params.lon));
            url.searchParams.set('date', params.date);
            if (params.window)
                url.searchParams.set('window', String(params.window));
            url.searchParams.set('includeElemental', String(params.includeElemental !== false));
            url.searchParams.set('includePlanetary', String(params.includePlanetary !== false));
            url.searchParams.set('validateTraditional', String(params.validateTraditional === true));
            const res = await fetch(url.toString());
            if (!res.ok) {
                // Return fallback data instead of throwing
                return AlchemicalKineticsClient.getFallbackData(params);
            }
            return res.json();
        }
        catch (error) {
            console.warn('Kinetics API unavailable, using fallback data:', error);
            return AlchemicalKineticsClient.getFallbackData(params);
        }
    }
    static async post(body) {
        try {
            const res = await fetch('/api/alchm-kinetics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                return AlchemicalKineticsClient.getFallbackData({
                    lat: body.lat,
                    lon: body.lon,
                    date: body.startTime.split('T')[0],
                    includeElemental: body.includeElemental,
                    includePlanetary: body.includePlanetary,
                });
            }
            return res.json();
        }
        catch (error) {
            console.warn('Kinetics POST API unavailable, using fallback data:', error);
            return AlchemicalKineticsClient.getFallbackData({
                lat: body.lat,
                lon: body.lon,
                date: body.startTime.split('T')[0],
                includeElemental: body.includeElemental,
                includePlanetary: body.includePlanetary,
            });
        }
    }
    static async put(body) {
        try {
            return await fetch('/api/alchm-kinetics', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        }
        catch (error) {
            console.warn('Kinetics PUT API unavailable:', error);
            // Return a mock Response object for consistency
            return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }
    /**
     * Fallback data for when kinetics API is unavailable
     */
    static getFallbackData(params) {
        const now = new Date();
        const elementalTotals = { Fire: 5, Water: 4, Air: 6, Earth: 5 };
        return {
            timing: {
                planetaryHours: ['Sun', 'Venus', 'Mercury'],
                currentHour: 'Sun',
            },
            elemental: {
                totals: elementalTotals,
            },
            power: [
                {
                    timestamp: now.toISOString(),
                    power: 0.6 + Math.random() * 0.3,
                    alchemicalNumbers: {
                        spirit: 4.2 + Math.random() * 2,
                        essence: 3.8 + Math.random() * 2,
                        matter: 4.1 + Math.random() * 2,
                        substance: 3.9 + Math.random() * 2,
                    },
                },
            ],
            elementalVelocity: [
                {
                    timestamp: now.toISOString(),
                    magnitude: 0.5 + Math.random() * 0.4,
                    Fire: elementalTotals.Fire / 20,
                    Water: elementalTotals.Water / 20,
                    Air: elementalTotals.Air / 20,
                    Earth: elementalTotals.Earth / 20,
                },
            ],
            degraded: true,
            fallback: true,
        };
    }
}
//# sourceMappingURL=kinetics-client.js.map