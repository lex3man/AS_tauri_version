import { toast } from "sonner";
import { fetch } from "@tauri-apps/plugin-http";
import { getDeviceInfo } from "tauri-plugin-device-info-api";
import { platform, version } from "@tauri-apps/plugin-os";
import { invoke } from "@tauri-apps/api/core";
import { stop_polling } from "./utils";
import { TelemetryData } from "@/types/state";
import { BaseDirectory, readFile } from '@tauri-apps/plugin-fs';

const TOKEN =
  "f7c8fe93f15af81dab45215fceb36401baf6b5753e67e1f295391aaf1fe3ec6d";
const HOST = "map.rostexcabinet.ru";
const SCHEME = "https";

export const server_init = async (raceNumber: string, password: string) => {
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
      password: password,
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
        toast.error(`Device initialization faild with status ${response.status}`, {
          position: "bottom-center",
          duration: 5000,
        });
        throw new Error("Device initialization faild");
      }
    })
    .catch((e) => {
      toast.error(`Request faild with error: ${e}`, {
        position: "bottom-center",
        duration: 5000,
      });
      throw new Error(`Request faild with error: ${e}`);
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

export const send_collected = async (data: any) => {
  const url = `${SCHEME}://${HOST}/api/report/collected`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      authentication: TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (resp.status === 200) {
    // toast.success(`Collected data with sent successfully`, { 
    //   position: "bottom-center",
    //   duration: 3000,
    // });
    return true;
  } else {
    return false;
  }
}

export const send_report = async (data: any) => {
  const url = `${SCHEME}://${HOST}/api/report/checkpoint`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      authentication: TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (resp.status === 200) {
    // toast.success(`Report data with sent successfully`, { 
    //   position: "bottom-center",
    //   duration: 3000,
    // });
    return true;
  } else {
    return false;
  }
}

export const send_report_file = async (filePath: string, etape: string) => {
  const url = `${SCHEME}://${HOST}/api/report/checkpoint-file`;
  const device = await getDeviceInfo();
  const device_id = `${device.uuid}`;

  const formData = new FormData();
  formData.append("file", new Blob([await readFile(filePath, { baseDir: BaseDirectory.AppLocalData })], { type: "application/octet-stream" }), "report.xlsx");
  formData.append("device_id", device_id);
  formData.append("etape", etape);
  formData.append("time", Date.now().toString());

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      authentication: TOKEN,
    },
    body: formData,
  });

  if (resp.status === 200) {
    // toast.success(`Report file sent successfully`, { 
    //   position: "bottom-center",
    //   duration: 3000,
    // });
    return true;
  } else {
    return false;
  }
}
