import { useAppState } from "@/ctx/state-provider";
import { useSettings } from "@/ctx/settings-provider";
import { Button } from "../ui/button";
import { RouteMap } from "../trackMap";
import useWindowDimensions from "@/lib/viewport";
import { Minus, Plus } from "lucide-react";

const Tracking = () => {
  const { roadbookMode, trackPoints, callView } = useAppState();
  const { trackDistance, increaseTrackDist, decreaseTrackDist } = useSettings();
  const { width, height } = useWindowDimensions();

  return (
    <div className="flex flex-col">
      <div className="justify-center">
        <div className="flex justify-center m-auto w-1/3 text-center text-2xl font-extrabold p-10">
          TRACK
        </div>
        <div
          className={`absolute items-end ${roadbookMode ? "w-1/4" : "w-1/6"} right-5 top-5`}
        >
          <div className={`flex flex-col w-full`}>
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
      </div>
      <div className="flex flex-col justify-center text-center m-auto">
        <div id="canvas">
          <RouteMap trackPoints={trackPoints} width={width * 0.9} height={height * 0.7} />
        </div>
      </div>
      {/* Same TRACK DIST setting as in SETUP (shared state, so changes here
          persist identically) — laid out as − value + for one-handed use
          while the map is open. */}
      <div className="absolute bottom-5 right-5 flex flex-col items-center">
        <div className="text-center text-2xl font-extrabold">TRACK DIST</div>
        <div className="flex items-center gap-4">
          <Minus className="size-10" onClick={() => decreaseTrackDist()} />
          <div className="text-3xl font-extrabold">
            {trackDistance.value.toFixed(1)}
          </div>
          <Plus className="size-10" onClick={() => increaseTrackDist()} />
        </div>
      </div>
    </div>
  );
};

export default Tracking;
