import { useAppState } from "@/ctx/state-provider";
import TotalWidget from "../widgets/total";
import PartialWidget from "../widgets/partial";
import CountdownWidget from "../widgets/countdown";
import { Arrow } from "../arrow";
import Indicators from "../widgets/indicators";

const Ride = () => {
  const { dashBoard, speed, totalWidgetShown, partialWidgetShown, countdownWidgetShown } = useAppState()
  const { mobileView } = useAppState();

  return (
    <div>
      <div className="flex justify-center h-[17vh]">
        <div className="flex pt-5 pl-5 justify-center w-1/4">
          <Indicators />
        </div>
        <div className="flex justify-center text-[clamp(2rem,5vw,3.5rem)] leading-none font-extrabold w-1/2 my-auto">
          <div className="transform scale-x-60">{dashBoard.metrics.cpCounter} CP</div>
        </div>
        <div className="flex pt-5 pr-5 justify-center w-1/4">
          <div className="flex justify-center text-[clamp(1.5rem,5vw,3rem)] leading-none font-extrabold my-auto">
            <div className="transform scale-x-60">{dashBoard.maxSpeed} V</div>
          </div>
        </div>
      </div>
      <div className="flex w-full justify-center">
        <div className="flex flex-col w-1/4 h-[85vh]">
          <div className="flex flex-col justify-start h-[30%] px-3">
            <div className={`flex justify-start ${mobileView ? 'text-6xl' : 'text-[clamp(4rem,10vw,8rem)]'} font-extrabold leading-none`}>
              <div className="transform origin-left scale-x-60">{dashBoard.cog}</div>
            </div>
            <div className={`flex justify-start ${mobileView ? 'text-xl' : 'text-2xl'} font-bold`}>COG</div>
          </div>
          <div className="h-[35%]">

          </div>
          <div className="flex flex-col justify-end h-[30%] px-3">
            <div className={`flex justify-start ${mobileView ? 'text-xl' : 'text-2xl'} font-bold`}>SOG</div>
            <div className={`flex justify-start ${mobileView ? 'text-6xl' : 'text-[clamp(4rem,10vw,8rem)]'} font-extrabold leading-none`}>
              <div className="transform origin-left scale-x-60">{speed.toFixed(0)}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between w-2/4 h-[85vh]">
          <div className="text-[clamp(1.5rem,5vw,3rem)] leading-none font-extrabold m-auto p-5">
            <div className="transform scale-x-60">WPT1 - Start</div>
          </div>
          <div className="flex h-full my-auto">
            <Arrow />
          </div>
        </div>
        <div className="flex flex-col w-1/4 h-[85vh]">
          <div className="flex flex-col justify-start h-[30%] px-3">
            <div className={`flex justify-end ${mobileView ? 'text-6xl' : 'text-[clamp(4rem,10vw,8rem)]'} font-extrabold leading-none`}>
              <div className="transform origin-right scale-x-60">{dashBoard.ctw}</div>
            </div>
            <div className={`flex justify-end ${mobileView ? 'text-xl' : 'text-2xl'} font-bold`}>CTW</div>
          </div>
          <div className="h-[35%]">
            {countdownWidgetShown ? (
              <div className="h-full"><CountdownWidget /></div>
            ) : (
              <div className="h-full">
                <div className="h-1/2">{totalWidgetShown && <TotalWidget />}</div>
                <div className="h-1/2">{partialWidgetShown && <PartialWidget />}</div>
              </div>
            )}
            
          </div>
          <div className="flex flex-col justify-end h-[30%] px-3">
            <div className={`flex justify-end ${mobileView ? 'text-xl' : 'text-2xl'} font-bold`}>DTW</div>
            <div className={`flex justify-end ${mobileView ? 'text-6xl' : 'text-[clamp(4rem,10vw,8rem)]'} font-extrabold leading-none`}>
              <div className="transform origin-right scale-x-60">{134.87}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ride;
