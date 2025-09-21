import { WebSocketServer } from 'ws';
export declare function setupWebSocketHandlers(wss: WebSocketServer): void;
export declare function getWebSocketStats(): {
    totalClients: number;
    activeChannels: number;
    channelSubscriptions: Record<string, number>;
};
export declare function shutdownWebSocket(): void;
