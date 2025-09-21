import { Request, Response, NextFunction } from 'express';
export interface FeatureFlags {
    planetaryHoursBackend: boolean;
    thermodynamicsBackend: boolean;
    tokenCalculationsBackend: boolean;
    kineticsBackend: boolean;
}
declare global {
    namespace Express {
        interface Request {
            featureFlags: FeatureFlags;
        }
    }
}
export declare const featureFlagMiddleware: (req: Request, res: Response, next: NextFunction) => void;
