import express from 'express';
/**
 * Test server helper for integration tests
 * Manages server lifecycle and provides utilities
 */
export declare class TestServer {
    private app;
    private server;
    private port;
    constructor(app: express.Application, port?: number);
    /**
     * Start the test server
     */
    start(): Promise<string>;
    /**
     * Stop the test server
     */
    stop(): Promise<void>;
    /**
     * Get the server URL
     */
    getUrl(): string;
}
/**
 * Setup integration test environment
 */
export declare function setupIntegrationTestEnv(): Promise<void>;
/**
 * Cleanup integration test environment
 */
export declare function cleanupIntegrationTestEnv(): Promise<void>;
/**
 * Wait for a condition to be true
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<void>;
/**
 * Generate test JWT token
 */
export declare function generateTestToken(payload?: object): string;
