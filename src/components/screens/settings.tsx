import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";
import { useSettings } from "@/ctx/settings-provider";
import { ChevronDown, ChevronUp } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { send_report_file } from "@/lib/api";

const Settings = () => {
  const { callView, roadbookMode, mobileView, activeCode } = useAppState();
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
  } = useSettings();
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
        className={`flex flex-col justify-center w-full m-auto ${roadbookMode ? "max-h-[90vh] pt-[10vh]" : "max-h-[70vh] pt-[30vh]"} overflow-y-auto`}
      >
        <div className="flex flex-col justify-center m-auto md:w-1/2 sm:w-2/3 gap-2">
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
                  send_report_file(resp as string, activeCode).then(() => {
                    toast.success("Report file sent successfully");
                  }).catch((e) => {
                    toast.error(`Report file sending error: ${e}`);
                  });
                })
                .catch((e) => toast.error(`Report file generating error: ${e}`));
            }}
          >
            GET REPORT
          </Button>
          <Button
            className="p-6 text-2xl"
            onClick={() => {
              callView("request", "race number");
            }}
          >
            SET RACE NUMBER
          </Button>
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
        </div>
      </div>
    </div>
  );
};

export default Settings;
