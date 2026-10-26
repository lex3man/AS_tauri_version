import { useAppState } from "@/ctx/state-provider";
import { useTheme } from "@/ctx/theme-provider";
import { useLongPress } from "@/lib/use-long-press";
import { invoke } from "@tauri-apps/api/core";

export const MixedTotalPartialWidget = () => {
  const { theme } = useTheme();
  const { total, partial, setPartial, callView, captured } = useAppState();
  const [longPress] = useLongPress(() => callView("adjust"));

  // min-h-36 is what makes the two flex-1 halves real: this screen's height
  // chain is all percentages of an auto-height parent, so h-full resolves to
  // auto and each half would otherwise collapse to its own text, leaving the
  // Partial tap zone no taller than the number itself.
  return (
    <div
      className={`flex flex-col border-2 border-primary h-full min-h-36 ${captured ? "bg-green-600" : theme === "dark" ? "bg-gray-700" : "bg-cyan-300"} select-none`}
    >
      <div {...longPress} className="flex flex-1 items-center">
        <div
          className={`w-full text-5xl py-2 font-extrabold leading-none transform scale-x-60`}
        >
          {total.toFixed(2)}
        </div>
      </div>
      <div
        className="flex flex-1"
        onClick={async () => {
          await invoke("reset_partial");
          setPartial(0);
        }}
      >
        <div className="flex w-4/5 items-center border-t border-r border-foreground">
          <div className="text-4xl py-1 font-extrabold leading-none transform origin-left scale-x-75">
            {partial.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};
