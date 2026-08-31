import { useAppState } from "@/ctx/state-provider";
import { useLongPress } from "@/lib/use-long-press";
import { invoke } from "@tauri-apps/api/core";

export const MixedTotalPartialWidget = () => {
  const { total, partial, setPartial, mobileView, callView } = useAppState();
  const longPress = useLongPress(() => callView("adjust"));

  return (
    <div
      {...longPress}
      className={`flex flex-col border border-primary h-full bg-cyan-300 select-none`}
    >
      <div
        className={`${mobileView ? "text-3xl font-extrabold" : "text-[clamp(1.6rem,5vw,4rem)]"} my-auto leading-none transform origin-right scale-x-75`}
      >
        {total.toFixed(2)}
      </div>
      <div
        className={`${mobileView ? "text-xl font-extrabold" : "text-[clamp(1.25rem,4vw,3.5rem)]"} my-auto p-1 leading-none transform border-t border-r border-foreground origin-left scale-x-75`}
        onClick={async () => {
          await invoke("reset_partial");
          setPartial(0);
        }}
      >
        {partial.toFixed(2)}
      </div>
    </div>
  );
};
