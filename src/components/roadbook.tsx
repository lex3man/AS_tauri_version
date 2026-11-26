import { useAppState } from "@/ctx/state-provider";
import clsx from "clsx";
import { RoadbookSlide, ImageData } from "@/types/roadbook";
import { useGamepads } from "react-gamepads";
import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettings } from "@/ctx/settings-provider";
import { useLongPressFor } from "@/lib/use-long-press";

export const RoadbookSlides = () => {
  const {
    mobileView,
    rbSlides,
    rbImages,
    total,
    setTotal,
    setRBSlides,
    currentRBIndex,
    setCurrentRBIndex,
    rbSlidesUnlocked,
    dssTaken,
    goNext,
    goPrev,
    setNextPointNumber,
    setNextPointName,
    setPartial,
  } = useAppState();
  const { autoMove, autoMoveAfterDss } = useSettings();
  const [gamepads, setGamepads] = useState({});
  useGamepads((gamepads) => setGamepads(gamepads));

  const AUTO_MOVE_DEBOUNCE_MS = 5000;
  const suppressAutoMoveUntilRef = useRef(0);

  const manualGoNext = () => {
    suppressAutoMoveUntilRef.current = Date.now() + AUTO_MOVE_DEBOUNCE_MS;
    goNext();
  };

  const manualGoPrev = () => {
    suppressAutoMoveUntilRef.current = Date.now() + AUTO_MOVE_DEBOUNCE_MS;
    goPrev();
  };

  const handleMark = () => {
    if (rbSlides[currentRBIndex]) {
      if (rbSlides[currentRBIndex].marked) {
        rbSlides[currentRBIndex].marked = false;
      } else {
        rbSlides[currentRBIndex].marked = true;
        manualGoNext();
      }
      setRBSlides([...rbSlides]);
    }
  };

  useEffect(() => {
    if (!autoMove) return;
    // Roadbook slide odo values are relative to the DSS (special stage
    // start) — before DSS is taken, `total` doesn't correspond to them at
    // all (e.g. still on the liaison road to the stage). The "After DSS"
    // setting (default) keeps auto-scroll off until then even if RBP
    // already made the roadbook visible; "Always" skips this wait.
    if (autoMoveAfterDss && !dssTaken) return;
    if (rbSlides.length === 0) return;
    if (Date.now() < suppressAutoMoveUntilRef.current) return;

    let idx = currentRBIndex;
    let changed = false;
    while (
      idx < rbSlides.length - 1 &&
      rbSlides[idx] &&
      total * 1000 > rbSlides[idx].odo
    ) {
      rbSlides[idx].marked = true;
      idx++;
      changed = true;
    }

    // Backward: mirror of the forward loop above, using each slide's own
    // odo threshold — not a nearest-of-all-slides search. A nearest-match
    // search creates a switching boundary at the MIDPOINT between two
    // slides' odo values, which made the previous slide "win" for the
    // entire first half of the gap to the next one every tick until total
    // passed that midpoint. Retreating while total has dropped back below
    // the previous slide's own threshold keeps the same boundary the
    // forward loop used to get here, so there's no dead zone either way.
    // `marked` is intentionally left untouched on retreat — once a slide is
    // marked passed, it stays marked; only the current index moves back.
    while (
      idx > 0 &&
      rbSlides[idx - 1] &&
      total * 1000 <= rbSlides[idx - 1].odo
    ) {
      idx--;
      changed = true;
    }

    if (changed) {
      setRBSlides([...rbSlides]);
      setCurrentRBIndex(idx);
    }
  }, [total]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (rbSlides.length === 0) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          manualGoPrev();
          break;

        case "":
          e.preventDefault();
          manualGoPrev();
          break;

        case "ArrowDown":
          e.preventDefault();
          manualGoNext();
          break;

        case "ArrowRight":
          e.preventDefault();
          const nextPoint = async () => {
            await invoke("point_switch", { moveTo: "next" });
            await invoke<string>("sync_data").then((rawData) => {
              const data = JSON.parse(rawData);
              setNextPointNumber(data.next_point.split("-")[0]);
              setNextPointName(data.next_point.split("-")[1]);
            });
          };
          nextPoint();
          break;

        case "ArrowLeft":
          e.preventDefault();
          const prevPoint = async () => {
            await invoke("point_switch", { moveTo: "prev" });
            await invoke<string>("sync_data").then((rawData) => {
              const data = JSON.parse(rawData);
              setNextPointNumber(data.next_point.split("-")[0]);
              setNextPointName(data.next_point.split("-")[1]);
            });
          };
          prevPoint();
          break;

        case "Backspace":
          e.preventDefault();
          const reset = async () => {
            await invoke("reset_partial");
            setPartial(0);
          };
          reset();
          break;

        case "Enter":
          e.preventDefault();
          if (rbSlides[currentRBIndex]) {
            handleMark();
          }
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [rbSlides, currentRBIndex, manualGoPrev, manualGoNext, handleMark]);

  useEffect(() => {
    const deadzone = 0.5;
    const pad = Object.values(gamepads)[0] as any | undefined;
    if (!pad || !pad.buttons) return;

    const up = pad.buttons[12]?.pressed || (pad.axes?.[1] ?? 0) < -deadzone; // D‑pad Up / left stick up
    const down = pad.buttons[13]?.pressed || (pad.axes?.[1] ?? 0) > deadzone; // D‑pad Down / left stick down
    const a = pad.buttons[0]?.pressed;
    const x = pad.buttons[2]?.pressed;

    if (up) manualGoPrev();
    if (down) manualGoNext();
    if ((a || x) && rbSlides[currentRBIndex]) {
      handleMark();
    }
  }, [gamepads, rbSlides, currentRBIndex, manualGoPrev, manualGoNext, handleMark]);

  const applyOdoToTotal = async (slide: RoadbookSlide) => {
    const newTotal = slide.odo / 1000;
    await invoke("update_total", { total: newTotal });
    setTotal(newTotal);
  };
  const bindTotalZone = useLongPressFor(applyOdoToTotal);

  const renderSlideImage = (
    img: ImageData,
    slide: RoadbookSlide,
    className?: string,
  ) => (
    <div className={clsx("relative inline-block", className)}>
      <img
        src={`data:${img.mime_type};base64,${img.data}`}
        alt={slide.name}
        className="max-w-full max-h-full object-contain"
      />
      {slide.marked && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="w-full h-full -rotate-13 absolute bottom-0 left-0 "
            style={{
              borderTop: "10px solid rgba(239, 68, 68, 1)",
              width: "200%",
            }}
          />
        </div>
      )}
      <div
        {...bindTotalZone(slide)}
        className="absolute left-0 top-0 h-full w-1/4 select-none"
      />
    </div>
  );

  const predictedSlides = mobileView ? [1, 2, 3] : [1, 2];

  if (!rbSlidesUnlocked) {
    return (
      <div className="relative flex flex-col w-full h-full text-center items-center justify-center text-gray-400 text-xl">
        Road Book temporarily locked. Please, keep moving to DSS point to unlock it. <br />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col w-full h-full">
      <div className="shrink-0 h-[15vh] w-full flex items-center justify-center overflow-hidden bg-gray-800/40">
        {rbSlides.length > 0 &&
          currentRBIndex > 0 &&
          (() => {
            const prevSlide = rbSlides[currentRBIndex - 1];
            const prevKey = `${prevSlide.subdir}/${prevSlide.name}`;
            const prevImg = rbImages[prevKey];
            if (prevImg) {
              return renderSlideImage(
                prevImg,
                prevSlide,
                "opacity-40 scale-90",
              );
            }
          })()}
      </div>

      <div
        className="relative flex-1 flex items-center justify-center w-full overflow-hidden border-10 border-red-700 rounded-2xl z-50"
        onDoubleClick={handleMark}
      >
        {rbSlides.length > 0 &&
          currentRBIndex >= 0 &&
          currentRBIndex < rbSlides.length ? (
          (() => {
            const slide = rbSlides[currentRBIndex];
            const key = `${slide.subdir}/${slide.name}`;
            const img = rbImages[key];
            return (
              <div className="w-full h-full flex items-center justify-center">
                {img ? (
                  renderSlideImage(img, slide)
                ) : (
                  <div className="text-gray-400">Loading...</div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="text-gray-400">No slides</div>
        )}
      </div>

      <div className="shrink-0 h-[32vh] w-full flex flex-col gap-1 p-1">
        {predictedSlides.map((offset) => {
          const nextSlide = rbSlides[currentRBIndex + offset];
          if (!nextSlide) {
            return <div key={offset} className="flex-1 bg-gray-800/30" />;
          }
          const nextKey = `${nextSlide.subdir}/${nextSlide.name}`;
          const nextImg = rbImages[nextKey];
          return (
            <div
              key={offset}
              className="flex-1 flex items-center justify-center overflow-hidden"
            >
              {nextImg ? (
                renderSlideImage(nextImg, nextSlide)
              ) : (
                <div className="text-gray-500 text-xs">Loading...</div>
              )}
            </div>
          );
        })}
      </div>

      {rbSlides.length > 1 && (
        <>
          <button
            onClick={manualGoPrev}
            disabled={currentRBIndex === 0}
            className="absolute bottom-2 left-4 w-20 h-20 bg-black/30 hover:bg-black/50 disabled:bg-black/10 disabled:cursor-not-allowed backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-200 active:scale-95 z-50"
          >
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
          <button
            onClick={manualGoNext}
            disabled={currentRBIndex === rbSlides.length - 1}
            className="absolute bottom-2 right-4 w-20 h-20 bg-black/30 hover:bg-black/50 disabled:bg-black/10 disabled:cursor-not-allowed backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-200 active:scale-95 z-50"
          >
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};
