import { type RequestHandler, type ErrorRequestHandler } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
export declare class AppError extends Error implements ApiError {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
export declare const errorHandler: ErrorRequestHandler;
export declare const notFoundHandler: RequestHandler;
export declare const asyncHandler: (fn: RequestHandler) => RequestHandler;
