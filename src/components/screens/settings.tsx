import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSettings } from "@/ctx/settings-provider";
import { ChevronDown, ChevronUp } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { send_report_file } from "@/lib/api";
import { useEffect } from "react";

const Settings = () => {
  const {
    callView,
    roadbookMode,
    mobileView,
    activeCode,
    reportSentTime,
    setReportSentTime,
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
    correctionDistance,
    trackDistance,
    increaseDistStep,
    decreaseDistStep,
    increaseTrackDist,
    decreaseTrackDist,
    oncomingAngle,
    increaseOncomingAngle,
    decreaseOncomingAngle,
    oncomingDetection,
    increaseOncomingDetection,
    decreaseOncomingDetection,
    getSettings,
  } = useSettings();

  useEffect(() => {
    const fetchReportSentTime = async () => {
      try {
        const time = await invoke<string>("get_report_sent_time");
        setReportSentTime(time);
      } catch (e) {
        toast.error(`Failed to fetch report sent time: ${e}`);
      }
    };
    fetchReportSentTime();
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
            className="p-6 text-2xl"
            onClick={async () => {
              invoke("export_telemetry_report")
                .then((resp) => {
                  toast.info(`report saved at ${resp}`);
                  send_report_file(resp as string, activeCode)
                    .then(() => {
                      toast.success("Report file sent successfully");
                    })
                    .catch((e) => {
                      toast.error(`Report file sending error: ${e}`);
                    });
                })
                .catch((e) =>
                  toast.error(`Report file generating error: ${e}`),
                );
            }}
          >
            GET REPORT
          </Button>
          <div className="text-center text-2xl font-extrabold">
            Last getting report: {reportSentTime}
          </div>
          <Button
            className="p-6 text-2xl"
            onClick={() => {
              callView("request", "race number");
            }}
          >
            SET RACE NUMBER
          </Button>
          {adminMode && (
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
                  <Button
                    className="p-6 text-2xl bg-green-600"
                    onClick={() => {
                      callView("settings");
                    }}
                  >
                    CANCEL
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
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
                {trackDistance.value}
              </div>
              <ChevronDown onClick={() => decreaseTrackDist()} />
            </div>
            <div className="flex flex-col"></div>
          </div>
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
    </div>
  );
};

export default Settings;
