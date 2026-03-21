import { Button } from "@/components/ui/button";
import { useAppState } from "@/ctx/state-provider";

export const LeftContent = () => {
  const { switchWidget } = useAppState();

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between">
            <Button
              className="p-7 text-3xl w-1/2"
              onClick={() => {}}
            >
              DIST-
            </Button>
            <Button
              className="p-7 text-3xl w-1/2"
              onClick={() => {}}
            >
              DIST+
            </Button>
          </div>
          <div className="py-2 w-full">
          <Button
            className="p-7 text-3xl w-full"
            onClick={() => {switchWidget('total')}}
          >
            TOTAL
          </Button>
          <Button
            className="p-7 text-3xl w-full"
            onClick={() => {}}
          >
            ADJUST
          </Button>
          </div>
          <div className="py-2 w-full">
          <Button
            className="p-7 text-3xl w-full"
            onClick={() => {switchWidget('partial')}}
          >
            PARTIAL
          </Button>
          <Button
            className="p-7 text-3xl w-full"
            onClick={() => {}}
          >
            RESET
          </Button>
          </div>
        </div>
    )
}

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
            <Button className="p-7 text-3xl w-1/2" onClick={() => {}}>
              W+
            </Button>
            <Button className="p-7 text-3xl w-1/2" onClick={() => {}}>
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
          <Button className="p-7 text-3xl" onClick={() => {}}>
            TRACK
          </Button>
          <Button className="p-7 text-3xl" onClick={() => {
            callView("position")
          }}>
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
          {adminMode && <Button
            className="p-7 text-3xl"
            onClick={() => {
              callView("request", "command");
            }}
          >
            COMMAND
          </Button>}
        </div>
    )
}