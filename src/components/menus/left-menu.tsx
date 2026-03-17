import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function LeftMenu() {
  const [open, setOpen] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    if (swipeDistance > 50) {
      setOpen(true);
    }
    if (swipeDistance < -50) {
      setOpen(false);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-1/2 h-full z-0 pointer-events-none">
        <div
          className="w-full h-full pointer-events-auto"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      <Drawer
        key={"left"}
        direction={"left"}
        open={open}
        onOpenChange={setOpen}
        fixed={true}
      >
        <DrawerTrigger asChild>
          <Button variant="secondary" className="capitalize">
            {">"}
          </Button>
        </DrawerTrigger>
        <DrawerContent className="p-5 gap-3 data-[vaul-drawer-direction=bottom]:max-h-[50vh] data-[vaul-drawer-direction=top]:max-h-[50vh]">
          <DrawerHeader hidden={true}>
            <DrawerTitle>MENU</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <div className="flex justify-between">
            <Button
              className="p-7 text-3xl w-1/2"
              onClick={() => {}}
            >
              DIST-
            </Button>
            <Button 
              className="p-7 text-3xl w-1/2" 
              onClick={() => {}}
            >
              DIST+
            </Button>
          </div>
          <div className="py-2 w-full">
          <Button
            className="p-7 text-3xl w-full"
            onClick={() => {}}
          >
            TOTAL
          </Button>
          <Button 
            className="p-7 text-3xl w-full" 
            onClick={() => {}}
          >
            ADJUST
          </Button>
          </div>
          <div className="py-2 w-full">
          <Button 
            className="p-7 text-3xl w-full" 
            onClick={() => {}}
          >
            PARTIAL
          </Button>
          <Button
            className="p-7 text-3xl w-full"
            onClick={() => {}}
          >
            RESET
          </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}