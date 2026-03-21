import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { RightContent } from "./content";

interface RightMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function RightMenu({ open, setOpen }: RightMenuProps) {

  return (
    <div className="w-1/2">
      <Drawer
        key={"right"}
        direction={"right"}
        open={open}
        onOpenChange={setOpen}
        fixed={true}
      >
        <DrawerTrigger asChild>
          {/* <Button variant="secondary" className="capitalize">
            {"<"}
          </Button> */}
        </DrawerTrigger>
        <DrawerContent className="p-5 gap-3 data-[vaul-drawer-direction=bottom]:max-h-[50vh] data-[vaul-drawer-direction=top]:max-h-[50vh]">
          <DrawerHeader hidden={true}>
            <DrawerTitle>MENU</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <RightContent />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
