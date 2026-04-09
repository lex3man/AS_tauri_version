import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { TopContent } from "./content";
// import { Button } from "../ui/button";

interface TopMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function TopMenu({ open, setOpen }: TopMenuProps) {
  return (
    <div className="w-1/2">
      <Drawer
        key={"top"}
        direction={"top"}
        open={open}
        onOpenChange={setOpen}
        fixed={true}
      >
        <DrawerTrigger asChild>
          {/* <Button variant="secondary" className="capitalize">
            {"<"}
          </Button> */}
        </DrawerTrigger>
        <DrawerContent className="p-5 gap-3 max-h-[35vh]">
          <DrawerHeader hidden={true}>
            <DrawerTitle>MENU</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <TopContent />
        </DrawerContent>
      </Drawer>
    </div>
  );
}