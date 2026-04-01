import { Button } from "@/components/ui/button";
import { useAppState } from "@/ctx/state-provider";
import { request_config } from "@/lib/api";
import { toast } from "sonner";
import { getDeviceInfo } from "tauri-plugin-device-info-api";

export const LeftContent = () => {
  const { switchWidget, setDebugData } = useAppState();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <Button className="p-7 text-3xl w-1/2" onClick={() => { }}>
          DIST-
        </Button>
        <Button className="p-7 text-3xl w-1/2" onClick={() => { }}>
          DIST+
        </Button>
      </div>
      <div className="py-2 w-full">
        <Button
          className="p-7 text-3xl w-full"
          onClick={() => {
            switchWidget("total");
          }}
        >
          TOTAL
        </Button>
        <Button className="p-7 text-3xl w-full" onClick={() => { }}>
          ADJUST
        </Button>
      </div>
      <div className="py-2 w-full">
        <Button
          className="p-7 text-3xl w-full"
          onClick={() => {
            switchWidget("partial");
          }}
        >
          PARTIAL
        </Button>
        <Button className="p-7 text-3xl w-full" onClick={() => { }}>
          RESET
        </Button>
      </div>
      <div className="py-2 w-full">
        <Button
          className="p-7 text-3xl w-full"
          onClick={() => {
            const make_request = async () => {
              const device = await getDeviceInfo();
              request_config(device.uuid as string)
                .then((resp) => {
                  toast.info(`Config setted at debug store`, {
                    position: "bottom-center",
                    duration: 5000,
                  });
                  setDebugData(resp);
                })
                .catch((e) => {
                  toast.error(`Request faild with error: ${e}`, {
                    position: "bottom-center",
                    duration: 5000,
                  });
                });
            };
            make_request();
          }}
        >
          TEST CFG REQUEST
        </Button>
      </div>
    </div>
  );
};

export const RightContent = () => {
  const { callView, adminMode } = useAppState();

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="p-7 text-3xl"
        size={"lg"}
        onClick={() => {
          callView("checkpoints");
        }}
      >
        CHECK
      </Button>
      <div className="flex justify-between">
        <Button className="p-7 text-3xl w-1/2" onClick={() => { }}>
          W+
        </Button>
        <Button className="p-7 text-3xl w-1/2" onClick={() => { }}>
          W-
        </Button>
      </div>
      <Button
        className="p-7 text-3xl"
        onClick={() => {
          callView("request", "code of a day");
        }}
      >
        CODE
      </Button>
      <Button className="p-7 text-3xl" onClick={() => { }}>
        TRACK
      </Button>
      <Button
        className="p-7 text-3xl"
        onClick={() => {
          callView("position");
        }}
      >
        POSITION
      </Button>
      <Button
        className="p-7 text-3xl"
        onClick={() => {
          callView("settings");
        }}
      >
        SETUP
      </Button>
      {adminMode && (
        <Button
          className="p-7 text-3xl"
          onClick={() => {
            callView("request", "command");
          }}
        >
          COMMAND
        </Button>
      )}
      {adminMode && (
        <Button
          className="p-7 text-3xl"
          onClick={() => {
            callView("debug");
          }}
        >
          DEBUG
        </Button>
      )}
    </div>
  );
};
