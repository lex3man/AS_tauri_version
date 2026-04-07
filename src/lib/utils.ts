import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getDeviceInfo } from "tauri-plugin-device-info-api";
import { request_config } from "./api";

let pollingInterval: ReturnType<typeof setInterval> | null = null;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const start_polling = (sec: number) => {
  if (pollingInterval) return;

  pollingInterval = setInterval(async () => {
    const device = await getDeviceInfo();
    await request_config(device.uuid as string);
  }, sec * 1000);
};

export const stop_polling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
