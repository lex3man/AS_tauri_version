import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

interface Exceed {
    time: number,
    speed: number,
    limit: number,
    km: number,
}

const SpeedExceedsScreen = () => {
  const { callView, speedExceeds } = useAppState();
  const [exceeds, setExceeds] = useState<Record<string, Exceed>>();

  useEffect(() => {
    setExceeds(JSON.parse(speedExceeds));
  }, [speedExceeds]);

  return (
    <div>
      <div className="flex h-1/4 justify-end">
        <div className="flex justify-center text-3xl font-extrabold w-1/3 pt-10">
          Speed Exceeds
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
      <div className="flex justify-center m-auto p-5 w-2/3 overflow-y-auto">
        <div className="flex flex-wrap h-[75vh] text-xl overflow-y-auto">
          {exceeds ? Object.entries(exceeds).map(([id, ex]) => (
            <div key={id} className="w-full p-4 mb-4 bg-gray-800/40 rounded-lg">
              <div className="flex justify-between">
                <div className="font-extrabold">Exceed km: {ex.km}</div>
                {/* <div>Time: {new Date(ex.time).toLocaleTimeString()}</div> */}
                <div>Speed: {ex.speed} km/h</div>
                <div>Limit: {ex.limit} km/h</div>
              </div>
            </div>
          )) : (
            <div className="w-full p-4 mb-4 bg-gray-800/40 rounded-lg text-center">
              No speed exceeds recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeedExceedsScreen;