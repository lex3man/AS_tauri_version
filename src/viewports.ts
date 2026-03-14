import { ViewPort } from "./types/viewport";

export const viewports: ViewPort[] = [
    ViewPort.new('request'),
    ViewPort.new('navigate'),
    ViewPort.new('tracking'),
    ViewPort.new('total'),
    ViewPort.new('settings'),
    ViewPort.new('checkpoints'),
    ViewPort.new('admin-area'),
];
