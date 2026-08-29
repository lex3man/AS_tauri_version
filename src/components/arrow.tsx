import arrow from "@/assets/arrow.png";
import { useAppState } from "@/ctx/state-provider";
import { useEffect, useState } from "react";

// "Keep pointing at WPT" mode tints the arrow to signal its state relative to
// the point it's tracking: black while approaching (default/unmodified look),
// green while held and still closing in, orange while held but drifting away.
const ARROW_COLORS: Record<string, string> = {
  black: "#000000",
  green: "#16a34a",
  orange: "#f97316",
};

export const Arrow = () => {
  const { ctw, cog, arrowColor } = useAppState();
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setRotation(ctw - cog);
  }, [ctw, cog]);

  const color = ARROW_COLORS[arrowColor] ?? ARROW_COLORS.black;

  return (
    <div className="h-[80%] aspect-square flex justify-center items-center m-auto bg-[url('@/assets/tricks.png')] bg-cover bg-no-repeat">
      <div
        className="w-full h-full"
        style={{
          transform: `rotate(${rotation}deg) scale(0.8)`,
          backgroundColor: color,
          WebkitMaskImage: `url(${arrow})`,
          maskImage: `url(${arrow})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
        role="img"
        aria-label="arrow"
      ></div>
    </div>
  );
};
