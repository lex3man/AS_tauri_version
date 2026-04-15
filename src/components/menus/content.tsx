import { Button } from "@/components/ui/button";
import { useAppState } from "@/ctx/state-provider";
import { invoke } from "@tauri-apps/api/core";

export const LeftContent = () => {
  const { switchWidget, setPartial, setTotal } = useAppState();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <Button className="p-7 text-3xl w-1/2" onClick={async () => {
          await invoke("decrease_total");
          await invoke<string>("sync_data").then((rawData) => {
            const data = JSON.parse(rawData);
            setTotal(data.metrics.total);
          });
        }}>
          DIST-
        </Button>
        <Button className="p-7 text-3xl w-1/2" onClick={async () => {
          await invoke("increase_total");
          await invoke<string>("sync_data").then((rawData) => {
            const data = JSON.parse(rawData);
            setTotal(data.metrics.total);
          });
        }}>
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
        <Button className="p-7 text-3xl w-full" onClick={async () => {
        await invoke("reset_partial");
        setPartial(0);
      }}>
          RESET
        </Button>
      </div>
    </div>
  );
};

export const RightContent = () => {
  const { callView, adminMode, setNextPointNumber, setNextPointName } = useAppState();

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
        <Button className="p-7 text-3xl w-1/2" onClick={async () => {
          await invoke("point_switch", { moveTo: "next" });
          await invoke<string>("sync_data").then((rawData) => {
            const data = JSON.parse(rawData);
            setNextPointNumber(data.next_point.split("-")[0]);
            setNextPointName(data.next_point.split("-")[1]);
          });
        }}>
          W+
        </Button>
        <Button className="p-7 text-3xl w-1/2" onClick={async () => {
          await invoke("point_switch", { moveTo: "prev" });
          await invoke<string>("sync_data").then((rawData) => {
            const data = JSON.parse(rawData);
            setNextPointNumber(data.next_point.split("-")[0]);
            setNextPointName(data.next_point.split("-")[1]);
          });
        }}>
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