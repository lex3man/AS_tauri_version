import { useAppState } from "@/ctx/state-provider";
import clsx from "clsx";
import { RoadbookSlide, ImageData } from "@/types/roadbook";
import { useGamepads } from "react-gamepads";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
// import { useSettings } from "@/ctx/settings-provider";

export const RoadbookSlides = () => {
  const {
    mobileView,
    rbSlides,
    rbImages,
    setRBSlides,
    currentRBIndex,
    goNext,
    goPrev,
    setNextPointNumber,
    setNextPointName,
    setPartial,
  } = useAppState();
  // const { autoMove } = useSettings();
  const [gamepads, setGamepads] = useState({});
  useGamepads((gamepads) => setGamepads(gamepads));

  const handleMark = () => {
    if (rbSlides[currentRBIndex]) {
      if (rbSlides[currentRBIndex].marked) {
        rbSlides[currentRBIndex].marked = false;
      } else {
        rbSlides[currentRBIndex].marked = true;
        goNext();
      }
      setRBSlides([...rbSlides]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (rbSlides.length === 0) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          goPrev();
          break;

        case "":
          e.preventDefault();
          goPrev();
          break;

        case "ArrowDown":
          e.preventDefault();
          goNext();
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
  }, [rbSlides, currentRBIndex, goPrev, goNext, handleMark]);

  useEffect(() => {
    const deadzone = 0.5;
    const pad = Object.values(gamepads)[0] as any | undefined;
    if (!pad || !pad.buttons) return;

    const up = pad.buttons[12]?.pressed || (pad.axes?.[1] ?? 0) < -deadzone; // D‑pad Up / left stick up
    const down = pad.buttons[13]?.pressed || (pad.axes?.[1] ?? 0) > deadzone; // D‑pad Down / left stick down
    const a = pad.buttons[0]?.pressed;
    const x = pad.buttons[2]?.pressed;

    if (up) goPrev();
    if (down) goNext();
    if ((a || x) && rbSlides[currentRBIndex]) {
      handleMark();
    }
  }, [gamepads, rbSlides, currentRBIndex, goPrev, goNext, handleMark]);

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
    </div>
  );

  const predictedSlides = mobileView ? [1, 2, 3] : [1, 2];

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
        className="flex-1 flex items-center justify-center w-full overflow-hidden border-10 border-red-700 rounded-2xl z-50"
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
            onClick={goPrev}
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
            onClick={goNext}
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
