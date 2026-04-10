import { ViewPort } from "./viewport";

export type GPSData = {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitudeAccuracy: number;
    altitude: number;
    speed: number;
    heading: number;
};

export type Coords = {
    lat: number;
    lon: number;
};

export type Metrics = {
    absTotal: number;
    total: number;
    partial: number;
    countdown: number;
    cpCounter: number;
};

export type DashBoard = {
    cog: number;
    sog: number;
    ctw: number;
    dtw: number;

    maxSpeed: number;
    coords: Coords;
    metrics: Metrics;

    widgetShown: {
        total: boolean;
        partial: boolean;
        countdown: boolean;
    };
};

export type AppState = {
    raceNumber: string;
    adminMode: boolean;
    navMode: boolean;
    dashBoard: DashBoard;
    activeViewPort: ViewPort;
};

export type CheckPoint = {
    num: number;
    name: string;
    ptype: string;
    checked: boolean;
    next: boolean;
};

export type TelemetryData = {
    race_number: string;
    device_id: string;
    etape: string;
    exceeding: boolean;
    speed: number;
    lat: number;
    lon: number;
    accuracy: number;
    point_name: string;
    checked: boolean;
    time: number;
}