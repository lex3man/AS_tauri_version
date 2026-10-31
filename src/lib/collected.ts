import { invoke } from "@tauri-apps/api/core";
import { getDeviceInfo } from "tauri-plugin-device-info-api";
import { send_collected } from "./api";

/// A batch of pending telemetry as the backend hands it over: the records
/// themselves plus the sequence number of the last one, which is what gets
/// acked back once the server has them.
export type CollectedBatch = {
  last_seq: number;
  records: string[];
};

// One upload at a time. Two paths reach this — the capture event and the
// retry timer — and they can line up, which without a guard would put the
// same batch on the wire twice. Module scope because the two callers sit in
// different components.
let uploading = false;

/**
 * Upload a pending batch and, only if the server accepted it, tell the
 * backend to drop those records. Anything else — no network, a refusal, a
 * timeout, an upload already running — leaves the buffer untouched for the
 * next attempt.
 *
 * Returns whether the batch was delivered and acked.
 */
export const uploadCollected = async (
  batch: CollectedBatch | null | undefined,
): Promise<boolean> => {
  if (!batch?.records?.length) return false;
  if (uploading) return false;

  uploading = true;
  try {
    const device = await getDeviceInfo();

    // The records are built in the backend, which has no device id to put in
    // them — the same gap the telemetry listener fills for its own payload.
    // Each one is a JSON string rather than an object, which is the shape
    // the endpoint expects, so stamp them and put them back the way they
    // came.
    const stamped = batch.records.map((record) => {
      const parsed = JSON.parse(record);
      parsed.device_id = device.uuid as string;
      return JSON.stringify(parsed);
    });

    if (!(await send_collected(stamped))) return false;

    await invoke("ack_collected", { lastSeq: batch.last_seq });
    return true;
  } finally {
    uploading = false;
  }
};

/**
 * Ask the backend what is still pending and upload it. This is the entry
 * point for every caller that isn't reacting to a `send_collected` event:
 * the retry timer, and each of the three places a report goes on the wire.
 *
 * Fire-and-forget by design — callers that are sending a report must not
 * wait on it, or a dead network would hold the report back for the length
 * of the upload timeout.
 */
export const flushCollected = async (): Promise<boolean> => {
  try {
    const batch = JSON.parse(
      await invoke<string>("get_pending_collected"),
    ) as CollectedBatch;
    return await uploadCollected(batch);
  } catch (e) {
    console.error("Pending collected telemetry flush failed:", e);
    return false;
  }
};
