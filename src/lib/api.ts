import { toast } from "sonner";
import { fetch } from "@tauri-apps/plugin-http";
import { getDeviceInfo } from "tauri-plugin-device-info-api";
import { platform, version } from "@tauri-apps/plugin-os";
import { invoke } from "@tauri-apps/api/core";
import { stop_polling } from "./utils";
import { TelemetryData } from "@/types/state";
import { readFile } from '@tauri-apps/plugin-fs';

const TOKEN =
  "f7c8fe93f15af81dab45215fceb36401baf6b5753e67e1f295391aaf1fe3ec6d";
const HOST = "advsmart.net";
const SCHEME = "https";

/// Whether the server actually accepted a request, and why not when it
/// didn't.
///
/// A bare `status === 200` is not enough against this backend: the report
/// endpoint answers a rejected payload with **HTTP 200** and an `error`
/// field in the body ({"error":"Поле race_number обязательно."}), so a
/// report that the server threw away looked to the app exactly like one it
/// had stored. Silent loss — nothing queued, nothing retried, nothing
/// logged. The file endpoint, by contrast, does use real status codes, so
/// both have to be checked.
///
/// Anything that is not JSON falls back to the status code: an nginx error
/// page or an SPA fallback must not count as an acceptance either.
const accepted = async (
  resp: Response,
  what: string,
): Promise<{ ok: boolean; reason: string }> => {
  let text = "";
  try {
    text = await resp.text();
  } catch {
    // Body already consumed or unreadable — judge on the status alone.
    const ok = resp.status === 200;
    return { ok, reason: ok ? "" : `HTTP ${resp.status}` };
  }

  let payload: any = null;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = null;
  }

  const serverError =
    payload && typeof payload === "object"
      ? payload.error || (payload.status === "error" ? payload.message : "")
      : "";

  if (resp.status === 200 && !serverError) {
    return { ok: true, reason: "" };
  }

  const reason = serverError
    ? String(serverError)
    : `HTTP ${resp.status} ${text.slice(0, 200)}`.trim();
  console.error(`${what} rejected by the server: ${reason}`);
  return { ok: false, reason };
};

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
  // format=svg asks the server to prefer vector roadbook slides — it falls
  // back to PNG per-slide on its own when no SVG exists, so this is a safe
  // priority-with-fallback rather than an all-or-nothing switch.
  const url = `${SCHEME}://${HOST}/api/config-all?device_id=${device_id}&format=svg`;

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

  return (await accepted(resp, "Telemetry")).ok;
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
    // Without this a connection that never answers — the usual shape of a
    // dead cell on a stage, as opposed to a clean refusal — leaves the call
    // hanging indefinitely, and the batch is neither delivered nor retried.
    connectTimeout: 15000,
  });

  return (await accepted(resp, "Collected batch")).ok;
}

export const send_report = async (data: any) => {
  const url = `${SCHEME}://${HOST}/api/report/checkpoint`;

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        authentication: TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      // Same reason as the other senders: a socket that never answers is
      // the usual shape of a dead cell, and without a bound this call
      // never comes back at all.
      connectTimeout: 15000,
    });

    return (await accepted(resp, "Checkpoint report")).ok;
  } catch (e) {
    console.error("Checkpoint report could not be sent:", e);
    return false;
  }
}

/// Upload the stage report workbook. Returns whether the server stored it,
/// and, when it refused, what it said — the caller decides whether a human
/// needs to see that (the manual button does; the background retry does not).
export const send_report_file = async (
  filePath: string,
  etape: string,
): Promise<{ ok: boolean; reason: string }> => {
  const url = `${SCHEME}://${HOST}/api/report/checkpoint-file`;
  const device = await getDeviceInfo();
  const device_id = `${device.uuid}`;

  let fileBytes: Uint8Array;
  try {
    // No baseDir: the backend builds this path from document_dir(), so it is
    // already absolute. Passing AppLocalData alongside it only worked because
    // joining a base onto an absolute path discards the base — a coincidence,
    // and one that pointed the reader at the wrong directory.
    fileBytes = await readFile(filePath);
  } catch (e) {
    console.error("Report file is not readable:", e);
    return { ok: false, reason: `Report file is not readable: ${e}` };
  }

  const formData = new FormData();
  formData.append("file", new Blob([fileBytes], { type: "application/octet-stream" }), "report.xlsx");
  formData.append("device_id", device_id);
  formData.append("etape", etape);
  formData.append("time", Date.now().toString());

  // Resolve instead of rejecting on a transport error: with no connectivity
  // on the stage this is the normal case, and callers decide whether to keep
  // the report queued for a later retry.
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        authentication: TOKEN,
      },
      body: formData,
      // Bound the attempt: an unreachable host can otherwise hang for
      // minutes, and the caller's in-flight guard would block every retry
      // for that whole time.
      connectTimeout: 15000,
    });

    return await accepted(resp, "Report file");
  } catch (e) {
    console.error("Report file upload failed:", e);
    // No answer at all — the offline case. Left without a reason on
    // purpose: the callers treat that as "retry later, say nothing", and
    // a rider out of coverage does not need a toast every thirty seconds.
    return { ok: false, reason: "" };
  }
}
