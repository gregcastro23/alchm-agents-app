export declare function logEvent(eventType: string, data: any): Promise<boolean>;
export declare function logInfo(message: string, metadata?: Record<string, any>): Promise<boolean>;
export declare function logError(message: string, metadata?: Record<string, any>): Promise<boolean>;
export declare function logWarn(message: string, metadata?: Record<string, any>): Promise<boolean>;
export declare function logDebug(message: string, metadata?: Record<string, any>): Promise<boolean>;
export declare function logQuantities(quantities: Record<string, number>, metadata?: Record<string, any>): Promise<boolean>;
export declare function logAgentInteraction(agentId: string, input: any, output: any, metadata?: Record<string, any>): Promise<boolean>;
export declare const galileoConfig: {
    apiKey: string;
    project: string;
    stream: string;
    baseUrl: string;
    failSilently: boolean;
};
