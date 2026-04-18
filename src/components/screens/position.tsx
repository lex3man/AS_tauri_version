import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";
import { formatDate } from "react-dateformat";

const Position = () => {
  const { roadbookMode, callView, lat, lon } = useAppState();

  return (
    <div>
      <div className="flex justify-end">
        <div className="flex justify-center text-3xl font-extrabold w-1/3 pt-10">
          POSITION
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
      <div
        className={`flex flex-col justify-center m-auto p-10 ${roadbookMode ? "w-full" : "w-2/3"}`}
      >
        {roadbookMode ? (
          <div className="flex justify-between">
            <div className="text-2xl font-extrabold">LATITUDE:</div>
            <div className="text-2xl font-extrabold">{lat}</div>
          </div>
        ) : (
          <div className="flex justify-between">
            <div className="text-2xl font-extrabold">LATITUDE:</div>
            <div className="text-2xl font-extrabold">LONGITUDE:</div>
          </div>
        )}
        {roadbookMode ? (
          <div className="flex justify-between">
            <div className="text-2xl font-extrabold">LONGITUDE:</div>
            <div className="text-2xl font-extrabold">{lon}</div>
          </div>
        ) : (
          <div className="flex justify-between">
            <div className="text-4xl font-bold">{lat}</div>
            <div className="text-4xl font-bold">{lon}</div>
          </div>
        )}
        <div className="flex justify-center m-auto text-3xl font-extrabold mt-10">
          DATE:
        </div>
        <div className="flex justify-center m-auto text-2xl font-bold">
          {formatDate(new Date(), "DD month YYYY")}
        </div>
        <div className="flex justify-center m-auto text-3xl font-extrabold mt-5">
          TIME:
        </div>
        <div className="flex justify-center m-auto text-2xl font-bold">
          {formatDate(new Date(), "HH:MM:ss")}
        </div>
      </div>
    </div>
  );
};

export default Position;
