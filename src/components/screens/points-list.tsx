import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { PointDebugInfo } from "@/types/state";
import { invoke } from "@tauri-apps/api/core";

const PointsList = () => {
  const { callView, mobileView } = useAppState();
  const [points, setPoints] = useState<PointDebugInfo[]>([]);

  useEffect(() => {
    const getPoints = async () => {
      const resp = await invoke<string>("get_points_list");
      // setRaw(resp);
      setPoints([]);
      const checkPoints: PointDebugInfo[] = JSON.parse(resp);
      setPoints(checkPoints);
    };
    getPoints();
  }, []);

  return (
    <div>
      <div className="flex justify-end">
        <div className="flex justify-start w-1/3">
        </div>
        <div className="flex flex-col m-auto justify-center w-1/3 pt-5">
          <div className="text-3xl font-extrabold text-center">
            POINTS LIST
          </div>
        </div>
        <div className="flex flex-col pt-5 pr-5 justify-start w-1/3">
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
        className={`flex flex-wrap justify-center pt-2 max-h-[70vh] overflow-y-auto`}
      >
        {points.map((point) => (
          <div key={point.num} className="w-full p-4 mb-4 bg-gray-800/40 rounded-lg">
              <div className="flex justify-between">
                <div>{point.num}</div>
                <div className="font-extrabold">Name: {point.name}</div>
                <div>Odo: {point.odo} m</div>
                <div>Type: {point.point_type}</div>
                <div>Limit: {point.speed_limit} km/h</div>
              </div>
              <div className="flex justify-between mt-2">
                <div>Lat: {point.lat}</div>
                <div>Lon: {point.lon}</div>
                <div>Capture Radius: {point.capture_radius} m</div>
                <div>Visible Radius: {point.visible_radius} m</div>
              </div>
            </div>
        ))}
      </div>
      {/* <div>{raw}</div> */}
    </div>
  );
};

export default PointsList;
