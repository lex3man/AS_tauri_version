import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { CheckPoint } from "@/types/state";
import { invoke } from "@tauri-apps/api/core";

const CheckPoints = () => {
  const { callView, mobileView } = useAppState();
  const [points, setPoints] = useState<CheckPoint[]>([]);
  // const [raw, setRaw] = useState<string>("");
  const [raceInfo, setRaceInfo] = useState({
    name: "",
    serial: "",
    raceNumber: "",
    raceCode: "",
    updateTime: "",
  });

  useEffect(() => {
    const getPoints = async () => {
      const resp = await invoke<string>("get_current_cp_list");
      // setRaw(resp);
      setPoints([]);
      const checkPoints: CheckPoint[] = JSON.parse(resp);
      setPoints(checkPoints);

      const raceInfoRaw = await invoke<string>("get_race_info");
      setRaceInfo({
        name: raceInfoRaw.split("-")[0],
        serial: raceInfoRaw.split("-")[1],
        raceNumber: raceInfoRaw.split("-")[2],
        raceCode: raceInfoRaw.split("-")[3],
        updateTime: raceInfoRaw.split("-")[4],
      });
    };
    getPoints();
  }, []);

  return (
    <div>
      <div className="flex justify-end">
        <div className="flex justify-start w-1/3">
          <div className="flex flex-col p-5">
            <span>RACE NUMBER: {raceInfo.raceNumber}</span>
            <span>SERIAL: {raceInfo.serial}</span>
            <span>EVENT NAME: {raceInfo.name}</span>
            <span>ROUTE: {raceInfo.raceCode}</span>
            <span>CONFIG UPDATED: {raceInfo.updateTime}</span>
          </div>
        </div>
        <div className="flex flex-col m-auto justify-center w-1/3 pt-5">
          <div className="text-3xl font-extrabold text-center">
            CHECK POINTS
          </div>
          <div className="flex flex-col m-auto justify-center p-5">
            <span className="text-xl text-center font-extrabold font-sans">
              {points.filter((p) => p.checked).length}/{points.length}
            </span>
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
          <Button
            className="p-7 text-2xl"
            onClick={() => {
              callView("exceeds");
            }}
          >
            EXCEEDS
          </Button>
        </div>
      </div>
      <div
        className={`flex flex-wrap justify-center ${mobileView ? "max-h-[50vh]" : "max-h-[70vh]"} overflow-y-auto`}
      >
        {points.map((point) => (
          <div
            className={`m-2 p-5 gap-15 border-2 ${(point.next && !point.checked) && "bg-gray-500"} ${point.checked && "bg-green-500"} border-foreground rounded-xl w-1/6`}
            key={point.num}
          >
            <div className="flex justify-between">
              <div className="text-sm font-extrabold">{point.num}</div>
              <div className="text-xl">{point.ptype}</div>
            </div>
            <div className="flex justify-center">
              <div className="text-xl text-center font-extrabold">
                {point.name}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* <div>{raw}</div> */}
    </div>
  );
};

export default CheckPoints;
