import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { LeftContent } from "./content";

interface LeftMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function LeftMenu({ open, setOpen }: LeftMenuProps) {

  return (
    <div className="w-1/2">
      <Drawer
        key={"left"}
        direction={"left"}
        open={open}
        onOpenChange={setOpen}
        fixed={true}
      >
        <DrawerTrigger asChild>
          {/* <Button variant="secondary" className="capitalize">
            {">"}
          </Button> */}
        </DrawerTrigger>
        <DrawerContent className="p-5 gap-3 data-[vaul-drawer-direction=bottom]:max-h-[50vh] data-[vaul-drawer-direction=top]:max-h-[50vh]">
          <DrawerHeader hidden={true}>
            <DrawerTitle>MENU</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <LeftContent />
        </DrawerContent>
      </Drawer>
    </div>
  );
}