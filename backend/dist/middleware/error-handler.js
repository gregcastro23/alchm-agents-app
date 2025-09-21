import { logger } from '../utils/logger.js';
export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
export const errorHandler = (error, req, res, next) => {
    const { statusCode = 500, message, stack } = error;
    logger.error('API Error:', {
        statusCode,
        message,
        stack: process.env.NODE_ENV === 'development' ? stack : undefined,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    // Don't leak error details in production
    const response = {
        success: false,
        error: {
            message: statusCode >= 500 && process.env.NODE_ENV === 'production'
                ? 'Internal Server Error'
                : message,
            statusCode,
            timestamp: new Date().toISOString(),
            path: req.path
        },
        ...(process.env.NODE_ENV === 'development' && { stack })
    };
    res.status(statusCode).json(response);
};
export const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
//# sourceMappingURL=error-handler.js.map