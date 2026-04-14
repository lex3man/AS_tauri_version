import { useSettings } from "@/ctx/settings-provider";
import { useAppState } from "@/ctx/state-provider";
import Indicators from "../widgets/indicators";
import CountdownWidget from "../widgets/countdown";
import { TotalLiteWidget } from "../widgets/total";
import { PartialLiteWidget } from "../widgets/partial";
import { Arrow } from "../arrow";
import { RoadbookSlides } from "../roadbook";
import { BtmMenu } from "../menus/bottom-menu";
import { useCallback, useEffect, useRef, useState } from "react";

const Roadbook = () => {
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
    nextPointName,
    nextPointNumber,
    nextPointType,
    visiable,
  } = useAppState();
  const { showBackground } = useSettings();
  const [exceeding, setExceeding] = useState(false);
  const [preExceeding, setPreExceeding] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const continuousOscRef = useRef<OscillatorNode | null>(null);
    const continuousGainRef = useRef<GainNode | null>(null);
  
    const getAudioContext = useCallback(() => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      return ctx;
    }, []);
  
    const playBeep = useCallback(() => {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
  
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
  
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    }, [getAudioContext]);
  
    const startContinuousTone = useCallback(() => {
      if (continuousOscRef.current) return;
  
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
  
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
  
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  
      oscillator.start();
      continuousOscRef.current = oscillator;
      continuousGainRef.current = gainNode;
    }, [getAudioContext]);
  
    const stopContinuousTone = useCallback(() => {
      if (continuousOscRef.current) {
        continuousOscRef.current.stop();
        continuousOscRef.current.disconnect();
        continuousOscRef.current = null;
      }
      if (continuousGainRef.current) {
        continuousGainRef.current.disconnect();
        continuousGainRef.current = null;
      }
    }, []);
  
    const stopBeeping = useCallback(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, []);
  
    useEffect(() => {
      setExceeding(speed > maxSpeed && maxSpeed > 0);
      setPreExceeding(speed > maxSpeed - 2 && maxSpeed > 0);
    }, [speed, maxSpeed]);
  
    useEffect(() => {
      if (exceeding) {
        stopBeeping();
        startContinuousTone();
      } else if (preExceeding) {
        stopContinuousTone();
        playBeep();
        intervalRef.current = setInterval(playBeep, 500);
      } else {
        stopBeeping();
        stopContinuousTone();
      }
  
      return () => {
        stopBeeping();
        stopContinuousTone();
      };
    }, [exceeding, preExceeding, playBeep, startContinuousTone, stopBeeping, stopContinuousTone]);

  return (
    <div className="flex flex-col">
      <div
        className={`h-[35vh] w-full border-2 border-foreground ${showBackground ? 'bg-cover bg-center bg-no-repeat bg-[url("./assets/background_rb.png")]' : ""}`}
      >
        <div className={`flex justify-center h-[12%]`}>
          <div className="flex pt-2 pl-2 justify-center w-1/4">
            <Indicators />
          </div>
          <div className="flex justify-center text-[clamp(1rem,5vw,4rem)] leading-none font-extrabold w-1/2 my-auto pt-2">
            <div className="">{cpCounter} CP</div>
          </div>
          <div className="flex pt-2 pr-5 justify-center w-1/4">
            <div className="flex justify-center text-[clamp(1rem,5vw,4rem)] leading-none font-extrabold my-auto">
              {exceeding ? (<div className="transform scale-x-60 font-extrabold text-red-600 animate-caret-blink">! ! !</div>) : (<div className="transform scale-x-60">{maxSpeed} V</div>)}
            </div>
          </div>
        </div>
        <div className="flex w-full justify-center">
          <div className={`flex flex-col w-1/4 h-[30vh] gap-2`}>
            {visiable ? (
              <div className="flex flex-col justify-start h-[33%] p-3">
                <div
                  className={`flex justify-start text-6xl font-extrabold leading-none`}
                >
                  <div className="transform origin-left scale-x-60">{cog}</div>
                </div>
                <div className={`flex justify-start text-xl font-bold`}>COG</div>
              </div>
            ) : (
              <div className="flex flex-col justify-start h-[33%] p-3"></div>
            )}
            <div className="h-[33%]">
              {((preExceeding || nextPointType === "FZ") && !exceeding) && (
                <div className={`flex items-center justify-center m-auto h-full border-15 border-zinc-600 rounded-full aspect-square`}>
                  <div className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold">
                    {maxSpeed}
                  </div>
                </div>
              )}
              {exceeding && (
                <div className={`flex items-center justify-center m-auto h-full border-15 border-red-500 rounded-full animate-caret-blink aspect-square`}>
                  <div className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold">
                    {maxSpeed}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-end h-[33%] p-3">
              <div className={`flex justify-start text-xl font-bold`}>SOG</div>
              <div
                className={`flex justify-start text-6xl font-extrabold leading-none`}
              >
                <div className="transform origin-left scale-x-60">
                  {speed.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-1/2 h-[30vh]">
            <div
              className={`text-[clamp(1.5rem,5vw,3rem)] leading-none mx-auto font-extrabold py-5`}
            >
              <div className="transform scale-x-60 text-center">WTP{nextPointNumber} {nextPointName}</div>
            </div>
            {visiable ? (
              <div className={`flex h-[25vh] justify-center mb-5`}>
                <Arrow />
              </div>
            ) : (
              <div className={`flex h-[25vh] justify-center mb-5`}>
                <div className="text-[clamp(10rem,5vw,22rem)] font-extrabold leading-none transform scale-x-60">
                  {cog.toFixed(0)}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col w-1/4 h-[30vh] gap-2">
            <div className="flex flex-col justify-start h-[33%] p-3">
              <div
                className={`flex justify-end text-6xl font-extrabold leading-none`}
              >
                <div className="transform origin-right scale-x-60">{visiable ? ctw : nextPointType}</div>
              </div>
              {visiable && <div className={`flex justify-end text-xl font-bold`}>CTW</div>}
            </div>
            <div className="h-[33%] p-1">
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
            <div className="flex flex-col justify-end h-[33%] p-3">
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
      <BtmMenu />
      <RoadbookSlides />
    </div>
  );
};

export default Roadbook;
