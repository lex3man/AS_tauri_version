import { useAppState } from "@/ctx/state-provider";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState, useCallback } from "react";

type RoadbookSlide = {
    subdir: string,
    name: string,
}

type ImageData = {
    data: string,
    mime_type: string,
}

export const RoadbookSlides = () => {
    const [slides, setSlides] = useState<RoadbookSlide[]>([]);
    const [images, setImages] = useState<Record<string, ImageData>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const { mobileView } = useAppState();

    useEffect(() => {
        const fetchRoadbook = async () => {
            const slidesList: RoadbookSlide[] = JSON.parse(await invoke("get_roadbook"));
            setSlides(slidesList);
        }
        fetchRoadbook();
    }, []);

    useEffect(() => {
        const loadImages = async () => {
            const loaded: Record<string, ImageData> = {};
            for (const slide of slides) {
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
            setImages(loaded);
        };
        if (slides.length > 0) {
            loadImages();
        }
    }, [slides]);

    const goNext = useCallback(() => {
        setCurrentIndex(prev => Math.min(prev + 1, slides.length - 1));
    }, [slides.length]);

    const goPrev = useCallback(() => {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
    }, []);

    const predictedSlides = mobileView ? [1, 2, 3] : [1, 2];

    return (
    <div className="relative flex flex-col w-full h-full">
        {/* Previous slide zone */}
        <div className="flex-shrink-0 h-[15vh] w-full flex items-center justify-center overflow-hidden bg-gray-800/40">
            {slides.length > 0 && currentIndex > 0 && (() => {
                const prevSlide = slides[currentIndex - 1];
                const prevKey = `${prevSlide.subdir}/${prevSlide.name}`;
                const prevImg = images[prevKey];
                if (prevImg) {
                    return (
                        <img src={`data:${prevImg.mime_type};base64,${prevImg.data}`} alt={`previous slide`} className="max-w-full max-h-full object-contain opacity-40 scale-90" />
                    );
                }
            })()}
        </div>

        {/* Current slide zone */}
        <div className="flex-1 flex items-center justify-center w-full overflow-hidden border-10 border-red-700 rounded-2xl">
            {slides.length > 0 && currentIndex >= 0 && currentIndex < slides.length ? (() => {
                const slide = slides[currentIndex];
                const key = `${slide.subdir}/${slide.name}`;
                const img = images[key];
                return (
                    <div className="w-full h-full flex items-center justify-center">
                        {img
                            ? <img src={`data:${img.mime_type};base64,${img.data}`} alt={`slide ${currentIndex}`} className="max-w-full max-h-full object-contain" />
                            : <div className="text-gray-400">Loading...</div>
                        }
                    </div>
                );
            })() : (
                <div className="text-gray-400">No slides</div>
            )}
        </div>

        {/* Next slides zone */}
        <div className="shrink-0 h-[32vh] w-full flex flex-col gap-1 p-1">
            {predictedSlides.map((offset) => {
                const nextSlide = slides[currentIndex + offset];
                if (!nextSlide) {
                    return <div key={offset} className="flex-1 bg-gray-800/30" />;
                }
                const nextKey = `${nextSlide.subdir}/${nextSlide.name}`;
                const nextImg = images[nextKey];
                return (
                    <div key={offset} className="flex-1 flex items-center justify-center overflow-hidden">
                        {nextImg ? (
                            <img src={`data:${nextImg.mime_type};base64,${nextImg.data}`} alt={`next slide ${offset}`} className="max-w-full max-h-full object-contain" />
                        ) : (
                            <div className="text-gray-500 text-xs">Loading...</div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Control Buttons */}
        {slides.length > 1 && (
            <>
                <button
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className="absolute bottom-2 left-4 w-20 h-20 bg-black/30 hover:bg-black/50 disabled:bg-black/10 disabled:cursor-not-allowed backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-200 active:scale-95 z-10"
                >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </button>

                <button
                    onClick={goNext}
                    disabled={currentIndex === slides.length - 1}
                    className="absolute bottom-2 right-4 w-20 h-20 bg-black/30 hover:bg-black/50 disabled:bg-black/10 disabled:cursor-not-allowed backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-200 active:scale-95 z-10"
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
