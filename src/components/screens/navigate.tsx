import { LeftMenu } from "../menus/left-menu";
import { RightMenu } from "../menus/right-menu";
import { Label } from "../ui/label";

const Ride = () => {
  return (
    <div className="flex flex-col gap-5 justify-center">
      <div className="flex justify-center gap-10 py-20">
        <LeftMenu />
        <Label htmlFor="check points">RIDE</Label>
        <RightMenu />
      </div>
    </div>
  );
};

export default Ride;
