import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

interface Coords {
  lat: number;
  lon: number;
}

const Tracking = () => {
  const { roadbookMode, callView } = useAppState();
  const [points, setPoints] = useState<Coords[]>([]);

  useEffect(() => {
    const getPoints = async () => {
      try {
        const result = await invoke<string>("get_location_history");
        const coords: Coords[] = JSON.parse(result);
        setPoints(coords);
      } catch (error) {
        toast.error(`Error fetching location history: ${error}`);
      }
    }
    getPoints();

  }, []);

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
      <div className="flex justify-center text-center m-auto">
        {points.toString()}
      </div>
    </div>
  );
};

export default Tracking;
