import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

const DebugScreen = () => {
  const { callView, debugData, setDebugData } = useAppState();
  const [pasedkey, setPassedkey] = useState("")

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPassedkey(e.key.toString())
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [debugData, setDebugData]);

  return (
    <div>
      <div className="flex justify-end">
        <div className="flex justify-center text-3xl font-extrabold w-1/3 pt-10">
          DEBUG
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
      <div className="scrollable p-20">
        <div className="text-xl">
          <p>{debugData}</p>
          <p>{pasedkey}</p>
        </div>
      </div>
    </div>
  );
};

export default DebugScreen;
