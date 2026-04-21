import { useAppState } from "@/ctx/state-provider";
import { useEffect, useState } from "react";

const CountdownWidget = () => {
  const {
    mobileView,
    countdown,
    roadbookMode,
    switchWidget,
    setCountdown,
    time,
  } = useAppState();
  const [counter, setCounter] = useState("");

  useEffect(() => {
    const totalSeconds = countdown;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    setCounter(
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    );
  }, [countdown]);

  useEffect(() => {
    if (countdown <= 0) {
      switchWidget("countdown", "off");
      return;
    }
    setCountdown(countdown - 1);
  }, [time]);

  return (
    <div className="flex flex-col gap-2 border-4 border-primary h-full bg-primary-foreground p-2">
      <div
        className={`font-extrabold text-center ${mobileView ? "text-xs" : "text-xl"} leading-none`}
      >
        NEUTRO TIME
      </div>
      <div
        className={`transform scale-x-70 flex justify-center ${mobileView ? (roadbookMode ? "text-4xl" : "text-6xl") : "text-[clamp(3rem,7vw,10rem)]"} font-extrabold leading-none my-auto`}
      >
        {counter}
      </div>
    </div>
  );
};

export default CountdownWidget;
