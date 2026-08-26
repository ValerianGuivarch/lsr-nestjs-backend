/// <reference types="vite/client" />

declare global {
    const BUILD_DATA_HASH:number;
    const HOST:string;

    interface Window {
        GOLARION_MAP_CONFIG?: {
            playerDetail: 'essential' | 'standard' | 'detailed';
        };
    }
}

export {};
