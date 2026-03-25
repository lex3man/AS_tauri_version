import { useAppState } from "@/ctx/state-provider";

const CountdownWidget = () => {
  const { mobileView } = useAppState();

  return (
    <div className="flex flex-col gap-2 border-4 border-primary h-full bg-primary-foreground p-2">
      <div
        className={`font-extrabold text-center ${mobileView ? "text-xs" : "text-xl"}`}
      >
        NEUTRALIZATION TIME
      </div>
      <div
        className={`transform scale-x-70 flex justify-center ${mobileView ? "text-6xl" : "text-[clamp(4rem,10vw,8rem)]"} font-extrabold leading-none my-auto`}
      >
        15:00
      </div>
    </div>
  );
};

export default CountdownWidget;
