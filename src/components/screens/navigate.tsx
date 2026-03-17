import { LeftMenu } from "../menus/left-menu";
import { RightMenu } from "../menus/right-menu";

const Ride = () => {
  return (
    <div>
        <div className="flex justify-end">
          <div className="flex pt-5 pl-5 justify-start w-1/3">
            <LeftMenu />
          </div>
          <div className="flex justify-center text-3xl font-extrabold w-1/3 pt-10">
            RIDE
          </div>
          <div className="flex pt-5 pr-5 justify-end w-1/3">
            <RightMenu />
          </div>
        </div>
        <div>
          asdasd
        </div>
    </div>
  );
};

export default Ride;
