import { useAppState } from "@/ctx/state-provider";
import { useTheme } from "@/ctx/theme-provider";
import { LONG_PRESS_MS, useLongPress } from "@/lib/use-long-press";
import { invoke } from "@tauri-apps/api/core";
import { useRef } from "react";

export const MixedTotalPartialWidget = () => {
  const { theme } = useTheme();
  const { total, partial, setPartial, callView } = useAppState();
  const longPress = useLongPress(() => callView("adjust"));
  const pressStartedAtRef = useRef(0);

  return (
    <div
      {...longPress}
      className={`flex flex-col border-2 border-primary h-full ${theme === "dark" ? "bg-gray-700" : "bg-cyan-300"} select-none`}
    >
      {/* Each half fills its share of the widget so the partial row below is
          tappable across its whole area, not just where the digits are. The
          scale transform stays on the inner text: applied to the row itself
          it would shrink the hit area along with the glyphs. */}
      <div className="flex flex-1 items-center">
        <div className="w-full text-5xl py-2 font-extrabold leading-none transform scale-x-60">
          {total.toFixed(2)}
        </div>
      </div>
      <div
        className="flex flex-1 items-center border-t border-r border-foreground"
        onPointerDown={() => {
          pressStartedAtRef.current = Date.now();
        }}
        onClick={async () => {
          // A long press anywhere on the widget is the "open adjust"
          // gesture — it must not also wipe the partial odometer on release.
          if (Date.now() - pressStartedAtRef.current >= LONG_PRESS_MS) return;
          await invoke("reset_partial");
          setPartial(0);
        }}
      >
        <div className="w-full text-3xl py-2 font-extrabold leading-none transform origin-left scale-x-75">
          {partial.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
