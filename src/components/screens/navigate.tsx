import { useAppState } from "@/ctx/state-provider";
import TotalWidget from "../widgets/total";
import PartialWidget from "../widgets/partial";
import CountdownWidget from "../widgets/countdown";
import { Arrow } from "../arrow";

const Ride = () => {
  const { dashBoard, speed, totalWidgetShown, partialWidgetShown, countdownWidgetShown } = useAppState()
  const { mobileView } = useAppState();

  return (
    <div>
      <div className="flex justify-center h-[17vh]">
        <div className="flex pt-5 pl-5 justify-center w-1/4">
        </div>
        <div className="flex justify-center text-5xl font-extrabold w-1/2 my-auto">
          {dashBoard.metrics.cpCounter} CP
        </div>
        <div className="flex pt-5 pr-5 justify-center w-1/4">
          <div className="flex justify-center text-4xl font-extrabold my-auto">
            {dashBoard.maxSpeed} V
          </div>
        </div>
      </div>
      <div className="flex w-full justify-center">
        <div className="flex flex-col w-1/4 h-[85vh]">
          <div className="flex flex-col justify-start h-[30%] p-5">
            <div className={`flex justify-start ${mobileView ? 'text-6xl' : 'text-8xl'} font-extrabold`}>{dashBoard.cog}</div>
            <div className={`flex justify-start ${mobileView ? 'text-xl' : 'text-3xl'} font-bold`}>COG</div>
          </div>
          <div className="h-[35%]">

          </div>
          <div className="flex flex-col justify-start h-[30%] p-5">
            <div className={`flex justify-start ${mobileView ? 'text-xl' : 'text-3xl'} font-bold`}>SOG</div>
            <div className={`flex justify-start ${mobileView ? 'text-6xl' : 'text-8xl'} font-extrabold`}>{speed.toFixed(2)}</div>
          </div>
        </div>
        <div className="flex flex-col gap-10 w-2/4 h-[85vh]">
          <div className="text-4xl font-extrabold m-auto p-5">WPT1 - Start</div>
          <div className="">
            <Arrow />
          </div>
        </div>
        <div className="flex flex-col w-1/4 h-[85vh]">
          <div className="flex flex-col justify-end h-[30%] p-5">
            <div className={`flex justify-end ${mobileView ? 'text-6xl' : 'text-8xl'} font-extrabold`}>{dashBoard.ctw}</div>
            <div className={`flex justify-end ${mobileView ? 'text-xl' : 'text-3xl'} font-bold`}>CTW</div>
          </div>
          <div className="h-[35%]">
            <div className="h-1/2">{totalWidgetShown && <TotalWidget />}</div>
            <div className="h-1/2">{partialWidgetShown && <PartialWidget />}</div>
            {countdownWidgetShown && <CountdownWidget />}
          </div>
          <div className="flex flex-col justify-end h-[30%] p-5">
            <div className={`flex justify-end ${mobileView ? 'text-xl' : 'text-3xl'} font-bold`}>DTW</div>
            <div className={`flex justify-end ${mobileView ? 'text-6xl' : 'text-8xl'} font-extrabold`}>{dashBoard.dtw}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ride;
