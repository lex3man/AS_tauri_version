import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useSettings } from "@/ctx/settings-provider";
import { ChevronDown, ChevronUp } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { toast } from "sonner";
import { send_report_file } from "@/lib/api";
import { flushCollected } from "@/lib/collected";
import { useEffect, useState } from "react";

const Settings = () => {
  const {
    callView,
    roadbookMode,
    mobileView,
    activeCode,
    reportSentManualTime,
    setReportSentAutoTime,
    setReportSentManualTime,
    adminMode,
    sync,
  } = useAppState();
  const {
    showBackground,
    setShowBackground,
    darkMode,
    setDarkMode,
    jumpMode,
    setJumpMode,
    keepPointingAtWpt,
    setKeepPointingAtWpt,
    correctionDistance,
    trackDistance,
    increaseDistStep,
    decreaseDistStep,
    increaseTrackDist,
    decreaseTrackDist,
    oncomingAngle,
    oncomingDetectionEnabled,
    setOncomingDetectionEnabled,
    autoMove,
    setAutoMove,
    autoMoveAfterDss,
    setAutoMoveAfterDss,
    increaseOncomingAngle,
    decreaseOncomingAngle,
    oncomingDetection,
    increaseOncomingDetection,
    decreaseOncomingDetection,
    getSettings,
  } = useSettings();

  // Straight from tauri.conf.json, so what is on screen is the version that
  // was actually built — no second number in the frontend to drift out of
  // step with it. Failing quietly: an empty corner is better than a toast
  // over the settings every time the screen opens.
  const [appVersion, setAppVersion] = useState("");

  // What the report queue is actually holding. The automatic report is made
  // and sent with nobody watching, so when one fails to arrive there is no
  // way to tell from the outside whether the workbook was never built, was
  // built and never read, or was read and refused. This line says which.
  const [reportQueue, setReportQueue] = useState("");

  const refreshReportQueue = async () => {
    try {
      const pending = JSON.parse(
        await invoke<string>("get_pending_report"),
      ) as {
        path?: string;
        mode?: string;
        exists?: boolean;
        size?: number;
        status?: string;
      };
      const queue = !pending.path
        ? "queue empty"
        : pending.exists
          ? `queued ${pending.mode} ${pending.path.split("/").pop()} ${pending.size} B`
          : `queued ${pending.mode} ${pending.path.split("/").pop()} FILE MISSING`;
      setReportQueue(pending.status ? `${queue} | ${pending.status}` : queue);
    } catch (e) {
      setReportQueue(`Report queue unreadable: ${e}`);
    }
  };

  useEffect(() => {
    getVersion()
      .then(setAppVersion)
      .catch((e) => console.error("App version is unavailable:", e));
  }, []);

  useEffect(() => {
    const fetchReportSentTime = async () => {
      try {
        const [auto, manual] = await Promise.all([
          invoke<string>("get_report_sent_time", { mode: "auto" }),
          invoke<string>("get_report_sent_time", { mode: "manual" }),
        ]);
        setReportSentAutoTime(auto);
        setReportSentManualTime(manual);
      } catch (e) {
        toast.error(`Failed to fetch report sent time: ${e}`);
      }
    };
    fetchReportSentTime();
    refreshReportQueue();
  }, []);

  return (
    <div className="flex flex-col">
      <div className="flex justify-end">
        <div className="flex justify-center text-3xl font-extrabold w-1/3 pt-10">
          SETTINGS
        </div>
        <div className="flex pt-5 pr-5 justify-end w-1/3">
          <Button
            className="p-7 text-2xl"
            onClick={() => {
              callView("navigate");
            }}
          >
            BACK
          </Button>
        </div>
      </div>
      <div
        className={`flex flex-col justify-center w-full m-auto ${roadbookMode ? "max-h-[90vh] pt-[10vh]" : "max-h-[70vh] pt-30"} overflow-y-auto`}
      >
        <div
          className={`flex flex-col justify-center m-auto md:w-1/2 sm:w-2/3 gap-2 ${roadbookMode ? "max-h-[90vh] pt-[10vh]" : "max-h-[70vh] pt-30"}`}
        >
          <Button
            className="p-6 text-2xl"
            onClick={() => {
              if (darkMode) {
                setDarkMode(false);
              } else {
                setDarkMode(true);
                setShowBackground(false);
              }
            }}
          >
            Dark Mode ON/OFF
          </Button>
          <Button
            className={`p-6 text-2xl ${showBackground ? "bg-emerald-600" : "bg-red-500"}`}
            onClick={() => {
              if (showBackground) {
                setShowBackground(false);
              } else {
                setShowBackground(true);
                setDarkMode(false);
              }
              // callView("navigate");
            }}
          >
            Background ON/OFF
          </Button>
          <Button
            className={`p-6 text-2xl ${autoMove ? "bg-emerald-600" : "bg-red-500"}`}
            onClick={() => {
              if (autoMove) {
                setAutoMove(false);
              } else {
                setAutoMove(true);
              }
            }}
          >
            Auto scroll RoadBook ON/OFF
          </Button>
          <Button
            className={`p-6 text-2xl ${autoMoveAfterDss ? "bg-emerald-600" : "bg-red-500"}`}
            onClick={() => {
              if (autoMoveAfterDss) {
                setAutoMoveAfterDss(false);
              } else {
                setAutoMoveAfterDss(true);
              }
            }}
          >
            {autoMoveAfterDss ? "Auto Scroll: After DSS" : "Auto Scroll: Always"}
          </Button>
          <Button
            className={`p-6 text-2xl ${jumpMode ? "bg-emerald-600" : "bg-red-500"}`}
            onClick={() => {
              if (jumpMode) {
                setJumpMode(false);
              } else {
                setJumpMode(true);
              }
            }}
          >
            Jump Mode ON/OFF
          </Button>
          <Button
            className={`p-6 text-2xl ${keepPointingAtWpt ? "bg-emerald-600" : "bg-red-500"}`}
            onClick={() => {
              if (keepPointingAtWpt) {
                setKeepPointingAtWpt(false);
              } else {
                setKeepPointingAtWpt(true);
              }
            }}
          >
            Keep pointing at WPT
          </Button>
          <Button
            className="p-6 text-2xl"
            onClick={async () => {
              if (!activeCode) {
                toast.error(
                  "Activate a day code before sending the report",
                );
                return;
              }
              invoke("export_telemetry_report", { mode: "manual" })
                .then(async (resp) => {
                  toast.info(`report saved at ${resp}`);
                  // Take the path and the stage from the queue entry the
                  // build just wrote, not from this screen's own state: the
                  // backend decided both, and reading them back is what
                  // keeps the manual send and the automatic retry sending
                  // the same file under the same stage.
                  const pending = JSON.parse(
                    await invoke<string>("get_pending_report"),
                  ) as { path?: string; etape?: string };
                  // The report is now queued in the backend. If this send
                  // fails it stays queued and the app keeps retrying it in
                  // the background, so the timestamp below only ever shows
                  // a delivery the server actually accepted.
                  // The collected buffer goes out alongside it, the same as
                  // on the automatic paths. Not awaited, so a dead network
                  // doesn't stall the toast behind the upload timeout.
                  void flushCollected();
                  const sent = await send_report_file(
                    pending.path ?? (resp as string),
                    pending.etape ?? activeCode,
                  );
                  await invoke("set_report_status", {
                    status: `manual ${new Date().toLocaleTimeString()} ${sent.detail}`,
                  });
                  if (sent.ok) {
                    await invoke<string>("mark_report_sent");
                    toast.success("Report file sent successfully");
                  } else if (sent.reason) {
                    // The server answered and refused. Waiting will not
                    // help, and the rider is standing right here having
                    // pressed the button — show them what it said.
                    toast.error(`Report refused: ${sent.reason}`, {
                      duration: 10000,
                    });
                  } else {
                    toast.error(
                      "No connection — report queued, will be sent automatically",
                    );
                  }
                  const [auto, manual] = await Promise.all([
                    invoke<string>("get_report_sent_time", { mode: "auto" }),
                    invoke<string>("get_report_sent_time", { mode: "manual" }),
                  ]);
                  setReportSentAutoTime(auto);
                  setReportSentManualTime(manual);
                  await refreshReportQueue();
                })
                .catch((e) => {
                  toast.error(`Report file generating error: ${e}`, {
                    duration: 10000,
                  });
                  refreshReportQueue();
                });
            }}
          >
            SEND REPORT
          </Button>
          <div className="text-center text-2xl font-extrabold">
            Last manual report: {reportSentManualTime}
          </div>
          {reportQueue && (
            <div
              className="text-center text-sm opacity-70 break-all"
              onClick={() => refreshReportQueue()}
            >
              {reportQueue}
            </div>
          )}
          <Button
            className="p-6 text-2xl"
            onClick={() => {
              callView("request", "race number");
            }}
          >
            SET RACE NUMBER
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="p-6 text-2xl">RESET</Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  This action will prune all reports, telemetry and race
                  state!
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-10">
                <Button
                  className="p-6 text-2xl bg-red-600"
                  onClick={async () => {
                    await invoke("state_reset");
                    getSettings();
                    sync();
                    await invoke("close_app");
                  }}
                >
                  RESET
                </Button>
                <DialogClose asChild>
                  <Button
                    className="p-6 text-2xl bg-green-600"
                  >
                    CANCEL
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
          <div
            className={`flex ${roadbookMode && mobileView ? "flex-col justify-center gap-10 items-center" : "justify-between"} pt-5`}
          >
            <div className="flex flex-col w-1/2 items-center">
              <div className="text-center text-2xl font-extrabold">
                DIST STEP
              </div>
              <ChevronUp onClick={() => increaseDistStep()} />
              <div className="text-3xl font-extrabold">
                {correctionDistance.value}
              </div>
              <ChevronDown onClick={() => decreaseDistStep()} />
            </div>
            <div className="flex flex-col w-1/2 items-center">
              <div className="text-center text-2xl font-extrabold">
                TRACK DIST
              </div>
              <ChevronUp onClick={() => increaseTrackDist()} />
              <div className="text-3xl font-extrabold">
                {trackDistance.value.toFixed(1)}
              </div>
              <ChevronDown onClick={() => decreaseTrackDist()} />
            </div>
            <div className="flex flex-col"></div>
          </div>
          {adminMode && (
            <Button
              className={`p-6 text-2xl ${oncomingDetectionEnabled ? "bg-emerald-600" : "bg-red-500"}`}
              onClick={() => setOncomingDetectionEnabled(!oncomingDetectionEnabled)}
            >
              Oncoming Detection ON/OFF
            </Button>
          )}
          {adminMode && (
            <div
              className={`flex ${roadbookMode && mobileView ? "flex-col justify-center gap-5 items-center" : "justify-between pt-5"}`}
            >
              <div
                className={`flex flex-col items-center border-2 rounded-xl p-5 ${!roadbookMode && "w-1/2"}`}
              >
                <div className="text-center text-2xl font-extrabold">
                  ONCOMING ANGLE
                </div>
                <ChevronUp onClick={() => increaseOncomingAngle()} />
                <div className="text-3xl font-extrabold">{oncomingAngle}°</div>
                <ChevronDown onClick={() => decreaseOncomingAngle()} />
              </div>
              <div
                className={`flex flex-col items-center border-2 rounded-xl p-5 ${!roadbookMode && "w-1/2"}`}
              >
                <div className="text-center text-2xl font-extrabold">
                  ONCOMING DIST
                </div>
                <ChevronUp onClick={() => increaseOncomingDetection()} />
                <div className="text-3xl font-extrabold">
                  {oncomingDetection}
                </div>
                <ChevronDown onClick={() => decreaseOncomingDetection()} />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* pointer-events-none so the corner never eats a tap meant for
          whatever the settings list grows into next. */}
      {appVersion && (
        <div className="fixed bottom-0 right-0 z-30 pr-3 pb-1 text-xs opacity-60 pointer-events-none">
          v{appVersion}
        </div>
      )}
    </div>
  );
};

export default Settings;
