import { useAppState } from "@/ctx/state-provider";
import { invoke } from "@tauri-apps/api/core";

export const PartialWidget = () => {
  const { partial, setPartial, mobileView } = useAppState();

  return (
    <div
      className={`flex ${!mobileView && "flex-col"} justify-between border-4 border-primary h-full bg-primary-foreground p-2`}
      onClick={async () => {
        await invoke("reset_partial");
        setPartial(0);
      }}
    >
      <div className={`font-extrabold ${mobileView ? "text-xs" : "text-md"}`}>
        PARTIAL
      </div>
      <div
        className={`${mobileView ? "text-2xl" : "text-[clamp(1.5rem,5vw,4rem)]"} my-auto leading-none`}
      >
        {partial.toFixed(2)}
      </div>
    </div>
  );
};

export const PartialLiteWidget = () => {
  const { partial, setPartial, mobileView } = useAppState();

  return (
    <div
      className={`flex justify-between border-2 border-primary h-full bg-primary-foreground p-1`}
      onClick={async () => {
        await invoke("reset_partial");
        setPartial(0);
      }}
    >
      <div className={`font-extrabold text-xs transform origin-left scale-x-75 w-1/6`}>PARTIAL</div>
      <div
        className={`${mobileView ? "text-2xl" : "text-[clamp(1.5rem,5vw,4rem)]"} my-auto leading-none transform origin-right scale-x-75`}
      >
        {partial.toFixed(2)}
      </div>
    </div>
  );
};
