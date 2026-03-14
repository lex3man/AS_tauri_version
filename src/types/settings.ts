import { Kilometers, Meters } from "./messure-units";

export type Settings = {
    showBackground: boolean;
    correctionDistance: Meters;
    trackDisttance: Kilometers;
    dtwEnable: boolean;
    darkMode: boolean;
    demoMode: boolean;
    jumpMode: boolean;
    roadbookMode: boolean;
}