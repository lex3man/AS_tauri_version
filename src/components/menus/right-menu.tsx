import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

export function RightMenu() {
    const [open, setOpen] = useState(false)
    const touchStartX = useRef<number>(0)
    const touchEndX = useRef<number>(0)

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX
    }

    const handleTouchEnd = () => {
        const swipeDistance = touchEndX.current - touchStartX.current
        if (swipeDistance < -50) {
            setOpen(true)
        }
        if (swipeDistance > 50) {
            setOpen(false)
        }
    }

    return (
        <>
            <div className="fixed top-0 right-0 w-1/2 h-full z-0 pointer-events-none">
                <div
                    className="w-full h-full pointer-events-auto"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                />
            </div>

            <Drawer
                key={"right"}
                direction={"right"}
                open={open}
                onOpenChange={setOpen}
                fixed={true}
            >
                <DrawerTrigger asChild>
                    <Button variant="secondary" className="capitalize">
                        {"<"}
                    </Button>
                </DrawerTrigger>
                <DrawerContent className="p-5 gap-3 data-[vaul-drawer-direction=bottom]:max-h-[50vh] data-[vaul-drawer-direction=top]:max-h-[50vh]">
                    <DrawerHeader hidden={true}>
                        <DrawerTitle>MENU</DrawerTitle>
                        <DrawerDescription></DrawerDescription>
                    </DrawerHeader>
                    <Button className="p-7 text-3xl" size={'lg'} onClick={() => {}}>CHECK</Button>
                    <div className="flex justify-between">
                        <Button className="p-7 text-3xl w-1/2" onClick={() => {}}>W+</Button>
                        <Button className="p-7 text-3xl w-1/2" onClick={() => {}}>W-</Button>
                    </div>
                    <Button className="p-7 text-3xl" onClick={() => {}}>CODE</Button>
                    <Button className="p-7 text-3xl" onClick={() => {}}>TRACK</Button>
                    <Button className="p-7 text-3xl" onClick={() => {}}>POSITION</Button>
                    <Button className="p-7 text-3xl" onClick={() => {}}>SETUP</Button>
                    <Button className="p-7 text-3xl" onClick={() => {}}>COMMAND</Button>
                </DrawerContent>
            </Drawer>
        </>
    )
}