import { type Request, type Response, type NextFunction } from 'express';
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
