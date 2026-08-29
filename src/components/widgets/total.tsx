import { useAppState } from "@/ctx/state-provider";
import { useLongPress } from "@/lib/use-long-press";

export const TotalWidget = () => {
  const { total, mobileView, captured, callView } = useAppState();
  const longPress = useLongPress(() => callView("adjust"));

  return (
    <div
      {...longPress}
      className={`flex ${!mobileView && "flex-col"} justify-between border-4 border-primary h-full ${captured ? "bg-green-600" : "bg-primary-foreground"} p-2 select-none`}
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
  const { total, mobileView, captured, callView } = useAppState();
  const longPress = useLongPress(() => callView("adjust"));

  return (
    <div
      {...longPress}
      className={`flex justify-between border-2 border-primary h-full ${captured ? "bg-green-400" : "bg-primary-foreground"} p-1 select-none`}
    >
      <div className={`font-extrabold text-xs transform origin-left scale-x-75 w-1/6`}>TOTAL</div>
      <div
        className={`${mobileView ? "text-2xl" : "text-[clamp(1.5rem,5vw,4rem)]"} my-auto leading-none transform origin-right scale-x-75`}
      >
        {total.toFixed(2)}
      </div>
    </div>
  );
};
