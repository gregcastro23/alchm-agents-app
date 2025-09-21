export function recordElementalLogicMode(mode) {
    try {
        // Placeholder analytics hook for A/B testing; wire to real telemetry later
        // Intentionally lightweight and non-blocking
        // eslint-disable-next-line no-console
        console.log(`[analytics] elemental_logic_mode=${mode}`);
    }
    catch {
        // no-op
    }
}
//# sourceMappingURL=observability.js.map