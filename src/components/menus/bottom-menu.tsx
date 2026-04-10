import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "../ui/button"
import { LeftContent, RightContent } from "./content"
import { useAppState } from "@/ctx/state-provider"

export const BtmMenu = () => {
  const { mobileView } = useAppState();

  return (
    <div className="m-auto flex justify-center">
      <Drawer>
        <DrawerTrigger>
          <Button className="absolute z-50 left-[50%] top-[34vh] translate-x-[-50%] text-2xl p-5" variant={"outline"}>MENU</Button>
        </DrawerTrigger>
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