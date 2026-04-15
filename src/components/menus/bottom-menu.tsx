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
      
      if (diff > 50) {
        setOpen(true);
      }
    }
  }, [open]);

  return (
    <div className="m-auto flex justify-center">
      <div
        className="fixed bottom-0 left-0 right-0 h-2/3 z-40 touch-pan-y"
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