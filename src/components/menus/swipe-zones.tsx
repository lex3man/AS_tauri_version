import { useRef } from "react";

interface SwipeZonesProps {
  onOpenLeft: () => void;
  onOpenRight: () => void;
  onCloseLeft: () => void;
  onCloseRight: () => void;
}

export function SwipeZones({ onOpenLeft, onOpenRight, onCloseLeft, onCloseRight }: SwipeZonesProps) {
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEndLeft = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    if (swipeDistance < -50) {
      onCloseLeft();
    } else if (swipeDistance > 50) {
      onOpenLeft();
    }
  };

  const handleTouchEndRight = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    if (swipeDistance > 50) {
      onCloseRight();
    } else if (swipeDistance < -50) {
      onOpenRight();
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0  w-1/2 h-1/2 z-50 pointer-events-none">
        <div
          className="w-full h-full pointer-events-auto touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEndLeft}
        />
      </div>
      <div className="fixed top-0 right-0 w-1/2 h-1/2 z-50 pointer-events-none">
        <div
          className="w-full h-full pointer-events-auto touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEndRight}
        />
      </div>
    </>
  );
}
