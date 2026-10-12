import { useAppState } from "@/ctx/state-provider";
import { useTheme } from "@/ctx/theme-provider";
import { useLongPress } from "@/lib/use-long-press";
import { invoke } from "@tauri-apps/api/core";

export const MixedTotalPartialWidget = () => {
  const { theme } = useTheme();
  const { total, partial, setPartial, callView, captured } = useAppState();
  const [longPress, longPressFired] = useLongPress(() => callView("adjust"));

  return (
    <div
      className={`flex flex-col border-2 border-primary h-full ${captured ? "bg-green-600" : theme === "dark" ? "bg-gray-700" : "bg-cyan-300"} select-none`}
    >
      <div {...longPress} className="flex flex-1 items-center">
        <div
          className={`w-full text-5xl py-2 font-extrabold leading-none transform scale-x-60`}
        >
          {total.toFixed(2)}
        </div>
      </div>
      <div
        className="flex w-4/5 flex-1 items-center border-t border-r border-foreground"
        onClick={async () => {
          if (longPressFired()) return;
          await invoke("reset_partial");
          setPartial(0);
        }}
      >
        <div className="text-4xl py-2 font-extrabold leading-none transform origin-left scale-x-75">
          {partial.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
