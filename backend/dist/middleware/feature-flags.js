export const featureFlagMiddleware = (req, res, next) => {
    req.featureFlags = {
        planetaryHoursBackend: process.env.PLANETARY_HOURS_BACKEND === 'true',
        thermodynamicsBackend: process.env.THERMODYNAMICS_BACKEND === 'true',
        tokenCalculationsBackend: process.env.TOKEN_CALCULATIONS_BACKEND === 'true',
        kineticsBackend: process.env.KINETICS_BACKEND === 'true'
    };
    next();
};
//# sourceMappingURL=feature-flags.js.map