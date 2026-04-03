import { useSettings } from "@/ctx/settings-provider";
import { useAppState } from "@/ctx/state-provider";
import Indicators from "../widgets/indicators";
import CountdownWidget from "../widgets/countdown";
import { TotalLiteWidget } from "../widgets/total";
import { PartialLiteWidget } from "../widgets/partial";
import { Arrow } from "../arrow";

const Roadbook = () => {
  const {
    // cog,
    ctw,
    dtw,
    // speed,
    maxSpeed,
    cpCounter,
    totalWidgetShown,
    partialWidgetShown,
    countdownWidgetShown,
  } = useAppState();
  const { showBackground } = useSettings();

  return (
    <>
      <div
        className={`relative h-[30vh] w-full border-2 border-foreground ${showBackground ? 'bg-cover bg-center bg-no-repeat bg-[url("./assets/background_rb.png")]' : ""}`}
      >
        <div className={`flex justify-center h-[6hv]`}>
          <div className="flex pt-2 pl-2 justify-center w-1/4">
            <Indicators />
          </div>
          <div className="flex justify-center text-xl leading-none font-extrabold w-1/2 my-auto pt-2">
            <div className="">{cpCounter} / 37</div>
          </div>
          <div className="flex pt-2 pr-5 justify-center w-1/4">
            <div className="flex justify-center text-xl leading-none font-extrabold my-auto">
              <div className="transform scale-x-60">{maxSpeed} V</div>
            </div>
          </div>
        </div>
        <div className="flex w-full justify-center">
          <div className={`flex flex-col w-1/4 h-[25vh]`}>
            <div className="h-[50%]"></div>
            <div className="h-[50%] p-1">
              {countdownWidgetShown ? (
                <div className="h-full">
                  <CountdownWidget />
                </div>
              ) : (
                <div className="h-full">
                  <div className="h-1/2">
                    {totalWidgetShown && <TotalLiteWidget />}
                  </div>
                  <div className="h-1/2">
                    {partialWidgetShown && <PartialLiteWidget />}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col w-1/2 h-[25vh]">
            <div
              className={`text-[clamp(1.5rem,5vw,3rem)] leading-none mx-auto font-extrabold p-5`}
            >
              <div className="transform scale-x-60">WPT1 - Start</div>
            </div>
            <div className={`flex h-[20vh] justify-center pb-1`}>
              <Arrow />
            </div>
          </div>
          <div className="flex flex-col w-1/4 h-[25vh] gap-5">
            <div className="flex flex-col justify-start h-[50%] p-3">
              <div
                className={`flex justify-end text-6xl font-extrabold leading-none`}
              >
                <div className="transform origin-right scale-x-60">{ctw}</div>
              </div>
              <div className={`flex justify-end text-xl font-bold`}>CTW</div>
            </div>
            <div className="flex flex-col justify-end h-[50%] p-3">
              <div className={`flex justify-end text-xl font-bold`}>DTW</div>
              <div
                className={`flex justify-end text-6xl font-extrabold leading-none`}
              >
                <div className="transform origin-right scale-x-60">
                  {dtw.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Roadbook;
