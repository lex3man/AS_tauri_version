import arrow from "@/assets/arrow.png";
import { useAppState } from "@/ctx/state-provider";
import { useEffect, useState } from "react";

export const Arrow = () => {
  const { ctw, cog } = useAppState();
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setRotation(ctw - cog);
  }, [ctw, cog]);

  return (
    <div className="h-[80%] aspect-square flex justify-center items-center m-auto bg-[url('@/assets/tricks.png')] bg-cover bg-no-repeat">
      <img
        className="w-full h-full"
        style={{ transform: `rotate(${rotation}deg) scale(0.8)` }}
        src={arrow}
        alt="arrow"
      ></img>
    </div>
  );
};
