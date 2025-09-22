export declare const galileoConfig: {
    url: string;
    apiKeyConfigured: boolean;
    project: string;
    stream: string;
    failSilently: boolean;
};
export declare function logInfo(message: string, metadata?: any): Promise<void>;
export declare function logError(message: string, metadata?: any): Promise<void>;
export declare function logWarn(message: string, metadata?: any): Promise<void>;
export declare function logDebug(message: string, metadata?: any): Promise<void>;
export declare function logQuantities(quantities: any): Promise<void>;
export declare function logAgentInteraction(interaction: any): Promise<void>;
