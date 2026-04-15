"use client";

import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";

const AdminPanel = () => {
  const { callView } = useAppState();

  return (
    <div>
      <div className="flex justify-end">
        <div className="flex justify-center text-3xl font-extrabold w-1/3 pt-10">
          ADMIN AREA
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
      <div className="flex w-1/2 m-auto">
        <div className="flex flex-col justify-center pt-28 gap-10 m-auto">
          <Button onClick={() => callView("checkpoints")}>Check Points</Button>
          <Button onClick={() => callView("debug")}>Debug</Button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
