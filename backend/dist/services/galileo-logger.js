import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
// Simple retry utility function
async function withRetries(fn, maxRetries = 3, baseDelayMs = 1000) {
    let attempt = 0;
    let lastError;
    while (attempt <= maxRetries) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxRetries)
                break;
            const backoff = baseDelayMs * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, backoff));
            attempt += 1;
        }
    }
    throw lastError;
}
// Galileo configuration from environment variables
const GALILEO_API_KEY = process.env.GALILEO_API_KEY;
const GALILEO_PROJECT = process.env.GALILEO_PROJECT || 'AlchmPlanetaryAgents';
const GALILEO_LOG_STREAM = process.env.GALILEO_LOG_STREAM || 'test';
const GALILEO_BASE_URL = 'https://console.rungalileo.io/api';
const GALILEO_FAIL_SILENTLY = process.env.GALILEO_FAIL_SILENTLY === 'true';
// Helper function to check if Galileo is configured
function isGalileoConfigured() {
    return !!GALILEO_API_KEY;
}
// Main logging function with proper error handling and retry logic
export async function logEvent(eventType, data) {
    if (!isGalileoConfigured()) {
        if (!GALILEO_FAIL_SILENTLY) {
            console.warn('Galileo API key not configured, cannot log to stream');
        }
        return false;
    }
    const logEntry = {
        message: `Event: ${eventType}`,
        level: 'info',
        metadata: {
            eventType,
            data: typeof data === 'object' ? JSON.stringify(data) : data,
            source: 'planetary-agents-backend',
        },
        timestamp: new Date().toISOString(),
    };
    try {
        // Use retry logic with exponential backoff
        const result = await withRetries(async () => {
            const payload = {
                timestamp: logEntry.timestamp,
                project: GALILEO_PROJECT,
                stream: GALILEO_LOG_STREAM,
                message: logEntry.message,
                level: logEntry.level,
                metadata: logEntry.metadata,
            };
            const response = await fetch(`${GALILEO_BASE_URL}/logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GALILEO_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                // Handle specific 422 error for project type
                if (response.status === 422 && errorText.includes('not of type Observe')) {
                    const message = `Galileo API error: 422 unknown - ${errorText}`;
                    if (GALILEO_FAIL_SILENTLY) {
                        return false;
                    }
                    throw new Error(`${message}\nHint: Configure GALILEO_PROJECT as an Observe project or set GALILEO_FAIL_SILENTLY=true`);
                }
                throw new Error(`Galileo API error: ${response.status} ${response.statusText} - ${errorText}`);
            }
            return true;
        }, 3, // max retries
        1000 // base delay in ms
        );
        return result;
    }
    catch (error) {
        if (GALILEO_FAIL_SILENTLY) {
            console.warn('Galileo logging failed after retries, falling back to console:', error instanceof Error ? error.message : error);
            console.log('====== GALILEO LOG (FALLBACK) ======');
            console.log(JSON.stringify(logEntry, null, 2));
            console.log('=====================================');
            return false;
        }
        else {
            console.error('Galileo log error after retries:', error);
            throw error;
        }
    }
}
// Convenience functions for different log levels
export async function logInfo(message, metadata) {
    return logEvent('info', { message, metadata });
}
export async function logError(message, metadata) {
    return logEvent('error', { message, metadata });
}
export async function logWarn(message, metadata) {
    return logEvent('warn', { message, metadata });
}
export async function logDebug(message, metadata) {
    return logEvent('debug', { message, metadata });
}
// Quantities-specific logging
export async function logQuantities(quantities, metadata) {
    return logEvent('quantities', { quantities, metadata });
}
// Agent interaction logging
export async function logAgentInteraction(agentId, input, output, metadata) {
    return logEvent('agent-interaction', {
        agentId,
        input: typeof input === 'object' ? JSON.stringify(input) : input,
        output: typeof output === 'object' ? JSON.stringify(output) : output,
        metadata,
    });
}
// Export configuration for debugging
export const galileoConfig = {
    apiKey: GALILEO_API_KEY ? '***configured***' : 'not configured',
    project: GALILEO_PROJECT,
    stream: GALILEO_LOG_STREAM,
    baseUrl: GALILEO_BASE_URL,
    failSilently: GALILEO_FAIL_SILENTLY,
};
//# sourceMappingURL=galileo-logger.js.map