import { Request, Response, NextFunction } from 'express';
/**
 * Additional security middleware for production hardening
 */
/**
 * Remove sensitive headers and add security headers
 */
export declare function securityHeaders(req: Request, res: Response, next: NextFunction): void;
/**
 * Validate request content type for POST/PUT requests
 */
export declare function validateContentType(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Sanitize request parameters to prevent injection attacks
 */
export declare function sanitizeInput(req: Request, res: Response, next: NextFunction): void;
/**
 * Request timeout middleware
 */
export declare function requestTimeout(timeoutMs?: number): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Log suspicious activity
 */
export declare function suspiciousActivityLogger(req: Request, res: Response, next: NextFunction): void;
/**
 * Block common attack patterns
 */
export declare function blockAttacks(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
