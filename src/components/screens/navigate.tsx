import { useAppState } from "@/ctx/state-provider";
import { PartialWidget } from "../widgets/partial";
import CountdownWidget from "../widgets/countdown";
import { Arrow } from "../arrow";
import Indicators from "../widgets/indicators";
import { TotalWidget } from "../widgets/total";
import { useEffect, useRef, useState, useCallback } from "react";

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
    nextPointType,
    visiable
  } = useAppState();
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
    <div>
      <div className={`flex justify-center h-[17vh]`}>
        <div
          className={`flex ${mobileView ? "p-4" : "p-8"} justify-center w-1/4`}
        >
          <Indicators />
        </div>
        <div className="flex justify-center text-[clamp(2rem,5vw,5.5rem)] leading-none font-extrabold w-1/2 my-auto">
          <div className="transform scale-x-60">{cpCounter} CP</div>
        </div>
        <div className="flex pt-5 pr-5 justify-center w-1/4">
          <div className="flex justify-center text-[clamp(1.5rem,5vw,5rem)] leading-none font-extrabold my-auto">     
            {exceeding ? (<div className="transform scale-x-60 font-extrabold text-red-600 animate-caret-blink">! ! !</div>) : (<div className="transform scale-x-60">{maxSpeed} V</div>)}
          </div>
        </div>
      </div>
      <div className="flex w-full justify-center">
        <div className={`flex flex-col w-1/4 h-[85vh]`}>
          {!visiable ? (
            <div className={`flex flex-col justify-start h-[32%] px-3`}></div>
          ) : (
            <div className={`flex flex-col justify-start h-[32%] px-3`}>
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
          <div className="h-[30%]">
            {((preExceeding || nextPointType === "FZ") && !exceeding) && (
              <div className={`flex items-center justify-center ${!mobileView && "m-auto"} h-full ${mobileView ? "border-15" : "border-25"} border-zinc-600 rounded-full aspect-square`}>
                <div className="text-[clamp(1rem,5vw,3.5rem)] font-extrabold">
                  {maxSpeed}
                </div>
              </div>
            )}
            {exceeding && (
              <div className={`flex items-center justify-center ${!mobileView && "m-auto"} h-full ${mobileView ? "border-15" : "border-25"} border-red-500 rounded-full animate-caret-blink aspect-square`}>
                <div className="text-[clamp(1rem,5vw,3.5rem)] font-extrabold">
                  {maxSpeed}
                </div>
              </div>
            )}
          </div>
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
            className={`${mobileView ? "text-3xl" : "text-[clamp(1.5rem,5vw,4rem)]"} leading-none mx-auto font-extrabold ${mobileView ? "p-2" : "p-5"}`}
          >
            <div className="transform scale-x-60">WPT{nextPointNumber} {nextPointName}</div>
          </div>
          {visiable ? (
            <div
              className={`m-auto flex h-full w-[30vw] justify-center`}
            >
              <Arrow />
            </div>
          ) : (
            <div className={`flex h-full w-[30vw] justify-center m-auto`}>
              <div className="text-[clamp(20rem,5vw,30rem)] font-extrabold leading-none transform scale-x-50 my-auto">
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
              <div className="transform origin-right scale-x-60">{visiable ? ctw : nextPointType}</div>
            </div>
            {visiable && (
              <div className={`flex justify-end ${mobileView ? "text-xl" : "text-2xl"} font-bold`}>
                CTW
              </div>
            )}
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
