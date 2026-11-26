import { useAppState } from "@/ctx/state-provider";
import { useTheme } from "@/ctx/theme-provider";
import { useLongPress } from "@/lib/use-long-press";
import { invoke } from "@tauri-apps/api/core";

export const MixedTotalPartialWidget = () => {
  const { theme } = useTheme();
  const { total, partial, setPartial, callView, captured } = useAppState();
  const [longPress] = useLongPress(() => callView("adjust"));

  const resetPartial = async () => {
    await invoke("reset_partial");
    setPartial(0);
  };

  // z-50 is what makes this widget pressable at all. BtmMenu lays an invisible
  // swipe-up catcher over the bottom two thirds of the viewport at z-40, and
  // measured against the real layout it covers this widget whole — every press
  // was landing on the catcher, never here. The roadbook slide controls get out
  // from under it the same way. Raising it costs nothing: the drawer portal
  // mounts after #root, so it still paints over this once it is open.
  return (
    <div
      className={`relative z-50 flex flex-col h-full border-2 border-primary select-none touch-manipulation ${captured ? "bg-green-600" : theme === "dark" ? "bg-gray-700" : "bg-cyan-300"}`}
    >
      <button
        {...longPress}
        type="button"
        className="flex flex-1 w-full items-center text-left active:brightness-90"
      >
        <div className="w-full text-5xl py-2 font-extrabold leading-none transform scale-x-60">
          {total.toFixed(2)}
        </div>
      </button>
      <button
        type="button"
        onClick={resetPartial}
        className="flex flex-1 w-full text-left active:brightness-90"
      >
        <div className="flex w-4/5 items-center border-t border-r border-foreground">
          <div className="text-4xl py-1 font-extrabold leading-none transform origin-left scale-x-75">
            {partial.toFixed(2)}
          </div>
        </div>
      </button>
    </div>
  );
};
