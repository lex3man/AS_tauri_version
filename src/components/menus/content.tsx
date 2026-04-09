import { Button } from "@/components/ui/button";
import { useAppState } from "@/ctx/state-provider";
import { invoke } from "@tauri-apps/api/core";

export const LeftContent = () => {
  const { switchWidget, setPartial } = useAppState();

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
        <Button className="p-7 text-3xl w-1/2" onClick={async () => { await invoke("point_switch", { moveTo: "next" }) }}>
          W+
        </Button>
        <Button className="p-7 text-3xl w-1/2" onClick={async () => { await invoke("point_switch", { moveTo: "prev" }) }}>
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

export const TopContent = () => {
  const { callView, switchWidget, setPartial, adminMode } = useAppState();

  return (
    <div className="flex gap-5 justify-center">
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
          <Button className="p-7 text-3xl w-full" onClick={async () => {
          await invoke("reset_partial");
          setPartial(0);
        }}>
            RESET
          </Button>
        </div>
      </div>
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
        <Button className="p-7 text-3xl w-1/2" onClick={async () => { await invoke("point_switch", { moveTo: "next" }) }}>
          W+
        </Button>
        <Button className="p-7 text-3xl w-1/2" onClick={async () => { await invoke("point_switch", { moveTo: "prev" }) }}>
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
    </div>
  );
};