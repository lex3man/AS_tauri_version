import { useAppState } from "@/ctx/state-provider";

export const TotalWidget = () => {
  const { total, mobileView } = useAppState();

  return (
    <div
      className={`flex ${!mobileView && "flex-col"} justify-between border-4 border-primary h-full bg-primary-foreground p-2`}
    >
      <div className={`font-extrabold ${mobileView ? "text-xs" : "text-md"}`}>
        TOTAL
      </div>
      <div
        className={`${mobileView ? "text-2xl" : "text-[clamp(1.5rem,5vw,4rem)]"} my-auto leading-none`}
      >
        {total.toFixed(2)}
      </div>
    </div>
  );
};

export const TotalLiteWidget = () => {
  const { total, mobileView } = useAppState();

  return (
    <div
      className={`flex justify-between border-2 border-primary h-full bg-primary-foreground p-1`}
    >
      <div className={`font-extrabold text-xs`}>TOTAL</div>
      <div
        className={`${mobileView ? "text-2xl" : "text-[clamp(1.5rem,5vw,4rem)]"} my-auto leading-none`}
      >
        {total.toFixed(2)}
      </div>
    </div>
  );
};
