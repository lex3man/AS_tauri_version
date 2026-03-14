import { ViewPort } from "./viewport";

export type Coords = {
    lat: number;
    lon: number;
}

export type Metrics = {
    absTotal: number;
    total: number;
    partial: number;
    countdown: number;
    cpCounter: number;
}

export type DashBoard = {
    cog: number,
    sog: number,
    ctw: number,
    dtw: number,

    maxSpeed: number,
    coords: Coords,
    metrics: Metrics,

    widgetShown: {
        "total": boolean,
        "partial": boolean,
        "countdown": boolean,
    }
}

export type AppState = {
    raceNumber: string;
    adminMode: boolean;
    navMode: boolean;
    dashBoard: DashBoard;
    activeViewPort: ViewPort;
}
