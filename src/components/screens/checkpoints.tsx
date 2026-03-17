import { useAppState } from "@/ctx/state-provider";
import { Button } from "../ui/button";

const CheckPoints = () => {
  const { callView } = useAppState();

  return (
    <div>
      <div className="flex justify-end">
        <div className="flex justify-center text-3xl font-extrabold w-1/3 pt-10">
          CHECK POINTS
        </div>
        <div className="flex pt-5 pr-5 justify-end w-1/3">
          <Button
            className="p-7 text-2xl"
            onClick={() => {
              callView("navigate");
            }}
          >
            BACK
          </Button>
        </div>
      </div>
      <div></div>
    </div>
  );
};

export default CheckPoints;
