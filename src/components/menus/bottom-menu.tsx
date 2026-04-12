import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { LeftContent, RightContent } from "./content"
import { useAppState } from "@/ctx/state-provider"
import { useState, useRef, useCallback } from "react"

export const BtmMenu = () => {
  const { mobileView } = useAppState();
  const [open, setOpen] = useState(false);
  const touchStartRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    touchStartRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!open) {
      const startY = touchStartYRef.current;
      const currentY = e.touches[0].clientY;
      const diff = startY - currentY;
      
      // Если свайп вверх больше 50px — открываем меню
      if (diff > 50) {
        setOpen(true);
      }
    }
  }, [open]);

  return (
    <div className="m-auto flex justify-center">
      {/* Зона свайпа внизу экрана */}
      <div
        className="fixed bottom-1/3 left-0 right-0 h-1/3 z-40 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      />
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader hidden={true}>
            <DrawerTitle>Menu</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <div className="flex justify-center h-[60vh]">
            <div className={`w-1/2 ${mobileView ? 'p-2' : 'p-10'}`}><LeftContent /></div>
            <div className={`w-1/2 ${mobileView ? 'p-2' : 'p-10'}`}><RightContent /></div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}