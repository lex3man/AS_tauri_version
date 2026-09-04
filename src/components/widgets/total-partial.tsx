import { useAppState } from "@/ctx/state-provider";
import { useTheme } from "@/ctx/theme-provider";
import { useLongPress } from "@/lib/use-long-press";
import { invoke } from "@tauri-apps/api/core";

export const MixedTotalPartialWidget = () => {
  const { theme } = useTheme();
  const { total, partial, setPartial, mobileView, callView } = useAppState();
  const longPress = useLongPress(() => callView("adjust"));

  return (
    <div
      {...longPress}
      className={`flex flex-col border-2 border-primary h-full ${theme === "dark" ? "bg-gray-700" : "bg-cyan-300"} select-none`}
    >
      <div
        className={`${mobileView ? "text-5xl font-extrabold" : "text-[clamp(1.6rem,5vw,4rem)]"} my-auto py-2 leading-none transform scale-x-60`}
      >
        {total.toFixed(2)}
      </div>
      <div
        className={`${mobileView ? "text-3xl font-extrabold" : "text-[clamp(1.3rem,4vw,3.5rem)]"} my-auto py-2 leading-none transform border-t border-r border-foreground origin-left scale-x-75`}
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
