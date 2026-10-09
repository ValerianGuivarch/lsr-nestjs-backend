/// <reference types="vite/client" />

declare global {
    const BUILD_DATA_HASH:number;
    const HOST:string;

    interface Window {
        GOLARION_MAP_CONFIG?: {
            placesUrl?: string;
            sourcePointsUrl?: string;
            searchUrl?: string;
            visibilityUrl?: string;
            curationUrl?: string;
        };
    }
}

export {};
