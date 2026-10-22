import { useAppState } from "@/ctx/state-provider";
import { useTheme } from "@/ctx/theme-provider";
import { useLongPress } from "@/lib/use-long-press";
import { invoke } from "@tauri-apps/api/core";

export const MixedTotalPartialWidget = () => {
  const { theme } = useTheme();
  const { total, partial, setPartial, callView, captured } = useAppState();
  const [longPress] = useLongPress(() => callView("adjust"));

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
      {/* The whole lower half resets Partial. The 4/5-wide bordered box is
          only the visual divider, so the click target wraps it instead of
          being it — otherwise the strip to its right is dead.
          No long-press guard here: the press handlers sit on the Total row
          above, a sibling, so a long press there can never surface as a
          click on this one — but its "already fired" flag stays set until
          the next press on Total, which used to swallow taps here. */}
      <div
        className="flex flex-1"
        onClick={async () => {
          await invoke("reset_partial");
          setPartial(0);
        }}
      >
        <div className="flex w-4/5 items-center border-t border-r border-foreground">
          <div className="text-4xl py-2 font-extrabold leading-none transform origin-left scale-x-75">
            {partial.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};
