import { useAppState } from "@/ctx/state-provider";
import { PartialWidget } from "../widgets/partial";
import CountdownWidget from "../widgets/countdown";
import { Arrow } from "../arrow";
import Indicators from "../widgets/indicators";
import { TotalWidget } from "../widgets/total";

const Ride = () => {
  const {
    cog,
    ctw,
    dtw,
    speed,
    maxSpeed,
    cpCounter,
    totalWidgetShown,
    partialWidgetShown,
    countdownWidgetShown,
    mobileView,
    roadbookMode,
    nextPointNumber,
    nextPointName,
    visiable
  } = useAppState();

  return (
    <div>
      <div className={`flex justify-center h-[17vh]`}>
        <div
          className={`flex ${mobileView ? "p-4" : "p-8"} justify-center w-1/4`}
        >
          <Indicators />
        </div>
        <div className="flex justify-center text-[clamp(2rem,5vw,3.5rem)] leading-none font-extrabold w-1/2 my-auto">
          <div className="transform scale-x-60">{cpCounter} CP</div>
        </div>
        <div className="flex pt-5 pr-5 justify-center w-1/4">
          <div className="flex justify-center text-[clamp(1.5rem,5vw,3rem)] leading-none font-extrabold my-auto">
            <div className="transform scale-x-60">{maxSpeed} V</div>
          </div>
        </div>
      </div>
      <div className="flex w-full justify-center">
        <div className={`flex flex-col w-1/4 h-[85vh]`}>
          {!visiable ? (
            <div className="flex flex-col justify-start h-[30%] px-3"></div>
          ) : (
            <div className="flex flex-col justify-start h-[30%] px-3">
              <div
                className={`flex justify-start ${mobileView ? "text-6xl" : "text-[clamp(4rem,10vw,8rem)]"} font-extrabold leading-none`}
              >
                <div className="transform origin-left scale-x-60">{cog}</div>
              </div>
              <div
                className={`flex justify-start ${mobileView ? "text-xl" : "text-2xl"} font-bold`}
              >
                COG
              </div>
            </div>
          )}
          <div className="h-[35%]"></div>
          <div className="flex flex-col justify-end h-[30%] px-3">
            <div
              className={`flex justify-start ${mobileView ? "text-xl" : "text-2xl"} font-bold`}
            >
              SOG
            </div>
            <div
              className={`flex justify-start ${mobileView ? "text-6xl" : "text-[clamp(4rem,10vw,8rem)]"} font-extrabold leading-none`}
            >
              <div className="transform origin-left scale-x-60">
                {speed.toFixed(0)}
              </div>
            </div>
          </div>
        </div>
        <div
          className={`flex flex-col justify-between ${roadbookMode ? "h-[25vh]" : "h-[85vh]"} w-2/4`}
        >
          <div
            className={`${mobileView ? "text-3xl" : "text-[clamp(1.5rem,5vw,3rem)]"} leading-none mx-auto font-extrabold ${mobileView ? "p-2" : "p-5"}`}
          >
            <div className="transform scale-x-60">WPT{nextPointNumber} {nextPointName}</div>
          </div>
          {visiable ? (
            <div
              className={`flex ${roadbookMode ? "h-[30vh]" : "h-full"} w-full justify-center pb-5`}
            >
              <Arrow />
            </div>
          ) : (
            <div className={`flex ${roadbookMode ? "h-[30vh]" : "h-full"} w-full justify-center pb-5`}>
              <div className="text-[clamp(10rem,5vw,45rem)] font-extrabold leading-none transform scale-x-50">
                {cog.toFixed(0)}
              </div>
            </div>
          )}
        </div>
        <div
          className={`flex flex-col w-1/4 ${roadbookMode ? "h-[25vh]" : "h-[85vh]"}`}
        >
          <div className="flex flex-col justify-start h-[30%] px-3">
            <div
              className={`flex justify-end ${mobileView ? "text-6xl" : "text-[clamp(4rem,10vw,8rem)]"} font-extrabold leading-none`}
            >
              <div className="transform origin-right scale-x-60">{ctw}</div>
            </div>
            <div
              className={`flex justify-end ${mobileView ? "text-xl" : "text-2xl"} font-bold`}
            >
              CTW
            </div>
          </div>
          <div className="h-[35%]">
            {countdownWidgetShown ? (
              <div className="h-full">
                <CountdownWidget />
              </div>
            ) : (
              <div className="h-full">
                <div className="h-1/2">
                  {totalWidgetShown && <TotalWidget />}
                </div>
                <div className="h-1/2">
                  {partialWidgetShown && <PartialWidget />}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-end h-[30%] px-3">
            <div
              className={`flex justify-end ${mobileView ? "text-xl" : "text-2xl"} font-bold`}
            >
              DTW
            </div>
            <div
              className={`flex justify-end ${mobileView ? "text-6xl" : "text-[clamp(4rem,10vw,8rem)]"} font-extrabold leading-none`}
            >
              <div className="transform origin-right scale-x-60">
                {dtw.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ride;
