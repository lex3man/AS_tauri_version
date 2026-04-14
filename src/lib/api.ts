import { toast } from "sonner";
import { fetch } from "@tauri-apps/plugin-http";
import { getDeviceInfo } from "tauri-plugin-device-info-api";
import { platform, version } from "@tauri-apps/plugin-os";
import { invoke } from "@tauri-apps/api/core";
import { stop_polling } from "./utils";
import { TelemetryData } from "@/types/state";

const TOKEN =
  "f7c8fe93f15af81dab45215fceb36401baf6b5753e67e1f295391aaf1fe3ec6d";
const HOST = "map.rostexcabinet.ru";
const SCHEME = "https";

export const server_init = async (raceNumber: string) => {
  const url = `${SCHEME}://${HOST}/api/init`;
  const device = await getDeviceInfo();
  const os = `${platform()} ${version()}`;

  fetch(url, {
    method: "POST",
    headers: {
      authentication: TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      race_number: raceNumber,
      device_id: `${device.uuid}`,
      device_name: `${device.device_name}`,
      os: `${os}`,
      timestamp: Date.now(),
    }),
  })
    .then((response) => {
      if (response.status === 200) {
        toast.info("Device initialization success", {
          position: "bottom-center",
          duration: 5000,
        });
      } else {
        toast.error("Device initialization faild", {
          position: "bottom-center",
          duration: 5000,
        });
      }
    })
    .catch((e) => {
      toast.error(`Request faild with error: ${e}`, {
        position: "bottom-center",
        duration: 5000,
      });
    });
};

export const request_config = async (device_id: string) => {
  const url = `${SCHEME}://${HOST}/api/config-all?device_id=${device_id}`;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      authentication: TOKEN,
      "Content-Type": "application/json",
    },
  });

  if (resp.status === 200) {
    let data = await resp.json();
    await invoke<string>("update_config", { data: JSON.stringify(data) });
    stop_polling();
    return true; 
  } else {
    return false;
  }
};

export const send_telemetry = async (data: TelemetryData) => {
  const url = `${SCHEME}://${HOST}/api/report/secondly`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      authentication: TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (resp.status === 200) {
    // toast.success(`Telemetry data with lat: ${data.lat}, lon: ${data.lon} sent successfully`, { 
    //   position: "bottom-center",
    //   duration: 3000,
    // });
    return true;
  } else {
    return false;
  }
}