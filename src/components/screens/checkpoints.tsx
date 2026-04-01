import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { CheckPoint } from "@/types/state";
import { invoke } from "@tauri-apps/api/core";

const CheckPoints = () => {
  const { callView } = useAppState();
  const [points, setPoints] = useState<CheckPoint[]>([]);

  useEffect(() => {
    const getPoints = async () => {
      const resp = await invoke<string>("get_current_cp_list");
      const checkPoints: CheckPoint[] = JSON.parse(resp);
      setPoints(checkPoints);
    };
    getPoints();
  }, []);

  return (
    <div>
      <div className="flex justify-end">
        <div className="flex justify-center text-3xl font-extrabold w-1/3 pt-10">
          CHECK POINTS
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
      <div className="flex gap-2 flex-wrap">
        {points.map((point) => (
          <div
            className="m-2 p-5 border-2 border-foreground rounded-xl"
            key={point.num}
          >
            <div className="flex gap-5">
              <div className="text-xl">{point.name}</div>
              <div className="text-xl">{point.ptype}</div>
            </div>
            <div className="flex gap-5">
              <div className="text-xl">{point.num}</div>
              <div className="text-xl">
                {point.checked ? "Checked" : "Unchecked"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckPoints;
