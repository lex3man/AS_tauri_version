import { useAppState } from "@/ctx/state-provider";
import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import clsx from "clsx";
import { RoadbookSlide, ImageData } from "@/types/roadbook";

export const RoadbookSlides = () => {
    const { mobileView, rbSlides, rbImages, setRBSlides, setRBImages, currentRBIndex, goNext, goPrev } = useAppState();

    const renderSlideImage = (img: ImageData, slide: RoadbookSlide, className?: string) => (
      <div className={clsx("relative inline-block", className)}>
        <img src={`data:${img.mime_type};base64,${img.data}`} alt={slide.name} className="max-w-full max-h-full object-contain" />
        {slide.marked && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="w-full h-full -rotate-14 absolute bottom-0 left-0 " style={{
                borderTop: "10px solid rgba(239, 68, 68, 1)",
                width: "200%",
            }} />
          </div>
        )}
      </div>
    );
    
    useEffect(() => {
        const loadImages = async () => {
            const loaded: Record<string, ImageData> = {};
            for (const slide of rbSlides) {
                const key = `${slide.subdir}/${slide.name}`;
                try {
                    const img: ImageData = await invoke("get_roadbook_image", {
                        subdir: slide.subdir,
                        name: slide.name,
                    });
                    loaded[key] = img;
                } catch (e) {
                    console.error(`Failed to load image ${key}:`, e);
                }
            }
            setRBImages(loaded);
        };
        if (rbSlides.length > 0) {
            loadImages();
        }
    }, [rbSlides]);

    const predictedSlides = mobileView ? [1, 2, 3] : [1, 2];

    return (
    <div className="relative flex flex-col w-full h-full">
        <div className="shrink-0 h-[15vh] w-full flex items-center justify-center overflow-hidden bg-gray-800/40">
            {rbSlides.length > 0 && currentRBIndex > 0 && (() => {
                const prevSlide = rbSlides[currentRBIndex - 1];
                const prevKey = `${prevSlide.subdir}/${prevSlide.name}`;
                const prevImg = rbImages[prevKey];
                if (prevImg) {
                    return (
                        renderSlideImage(prevImg, prevSlide, "opacity-40 scale-90")
                    );
                }
            })()}
        </div>

        <div 
            className="flex-1 flex items-center justify-center w-full overflow-hidden border-10 border-red-700 rounded-2xl z-50"
            onDoubleClick={() => {
                if (rbSlides[currentRBIndex]) {
                    if (rbSlides[currentRBIndex].marked) { rbSlides[currentRBIndex].marked = false; }
                    else { 
                        rbSlides[currentRBIndex].marked = true; 
                        goNext();
                    }
                    setRBSlides([...rbSlides]);
                }
            }}
        >
            {rbSlides.length > 0 && currentRBIndex >= 0 && currentRBIndex < rbSlides.length ? (() => {
                const slide = rbSlides[currentRBIndex];
                const key = `${slide.subdir}/${slide.name}`;
                const img = rbImages[key];
                return (
                    <div className="w-full h-full flex items-center justify-center">
                        {img
                            ? renderSlideImage(img, slide)
                            : <div className="text-gray-400">Loading...</div>
                        }
                    </div>
                );
            })() : (
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
                    <div key={offset} className="flex-1 flex items-center justify-center overflow-hidden">
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
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </button>

                <button
                    onClick={goNext}
                    disabled={currentRBIndex === rbSlides.length - 1}
                    className="absolute bottom-2 right-4 w-20 h-20 bg-black/30 hover:bg-black/50 disabled:bg-black/10 disabled:cursor-not-allowed backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-200 active:scale-95 z-50"
                >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </>
        )}
    </div>
    );
}
