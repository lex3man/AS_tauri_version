import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import {
  checkPermissions,
  requestPermissions,
  watchPosition,
} from "@tauri-apps/plugin-geolocation";
import { DataRequest } from "./components/screens/request";
import { useAppState } from "./ctx/state-provider";
import { TypeOfRequest } from "./types/request";
import AdminPanel from "./components/screens/admin-area";
import CheckPoints from "./components/screens/checkpoints";
import Ride from "./components/screens/navigate";
import Settings from "./components/screens/settings";
import { useSettings } from "./ctx/settings-provider";
import useWindowDimensions from "./lib/viewport";
import { LeftMenu } from "./components/menus/left-menu";
import { RightMenu } from "./components/menus/right-menu";
import { SwipeZones } from "./components/menus/swipe-zones";
import { LeftContent, RightContent } from "./components/menus/content";
import { Coords } from "./types/state";
import Position from "./components/screens/position";
import DebugScreen from "./components/screens/debug";
import Roadbook from "./components/screens/roadbook";
import SpeedExceedsScreen from "./components/screens/speed-exceeds";
import JumpSuggestion from "./components/screens/jump";
import { playBeep } from "./lib/sound";
import Adjust from "./components/screens/adjust";
import Tracking from "./components/screens/tracking";
import { Button } from "./components/ui/button";
import PointsList from "./components/screens/points-list";

function App() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [beeping, setBeeping] = useState(true);
  const {
    roadbookMode,
    activeViewPort,
    mobileView,
    configLoading,
    nextPointName,
    jumpSuggestion,
    jumpPointID,
    isOncoming,
    oncomingDistance,
    callView,
    setGpsAccuracy,
    setRaceNumber,
    setCodeOfDay,
    setCommand,
    setCoords,
    setCurrentSpeed,
    setMobileView,
    setCog,
    setCtw,
    setDtw,
    setCpCounter,
    setTotal,
    setPartial,
    setNextPointNumber,
    setNextPointName,
    setMaxSpeed,
    setRoadbookMode,
    setDebugData,
    setVisiable,
    setSpeedExceeds,
    setNextPointType,
    setJumpSuggestion,
    setJumpPointID,
    setCaptured,
    setTrackPoints,
    setCountdown,
    switchWidget,
    setGPSData,
    setIsOncoming,
    resetOncomingDistance,
  } = useAppState();
  const { showBackground, jumpMode, oncomingDetection } = useSettings();
  const { width, height } = useWindowDimensions();

  const geoloc = async () => {
    let permissions = await checkPermissions();
    if (
      permissions.location === "prompt" ||
      permissions.location === "prompt-with-rationale"
    ) {
      permissions = await requestPermissions(["location"]);
    }

    if (permissions.location === "granted") {
      await watchPosition(
        { enableHighAccuracy: true, timeout: 1000, maximumAge: 0 },
        async (pos) => {
          await invoke("location_update", { data: JSON.stringify(pos) });
          const gpsPosition = await invoke<string>("get_coords");
          const geoData = JSON.parse(gpsPosition);
          const coords: Coords = {
            lat: geoData["latitude"],
            lon: geoData["longitude"],
          };
          if (pos) {
            const gpsData = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              altitude: pos.coords.altitude,
              speed: pos.coords.speed,
              heading: pos.coords.heading,
              timestamp: pos.timestamp,
            };
            setGPSData(gpsData);
          }
          setCoords(coords);
          invoke<string>("sync_data")
            .then((rawData) => {
              setDebugData(rawData);
              const data = JSON.parse(rawData);
              setCaptured(false);
              if (data.capture) {
                // toast.info(`ADJUST OK`, {
                //   position: "top-center",
                //   duration: 5000,
                // })
                setCaptured(true);
                if (data.metrics.countdown > 0) {
                  switchWidget("countdown", "on");
                  setCountdown(data.metrics.countdown * 60);
                }
                playBeep();
              }
              setCog(data.cog);
              setCtw(data.ctw);
              setDtw(data.dtw);
              // setTime(pos?.timestamp as number);
              setCurrentSpeed(data.sog);
              setCpCounter(data.metrics.cp_counter);
              setTotal(data.metrics.total);
              setPartial(data.metrics.partial);
              setNextPointNumber(data.next_point.split("-")[0]);
              setNextPointName(data.next_point.split("-")[1]);
              setNextPointType(data.next_point_type);
              setMaxSpeed(data.max_speed);
              setVisiable(data.visiable);
              setJumpSuggestion(data.jump_suggestion);
              setJumpPointID(data.jump_point);

              if (!data.oncoming) {
                resetOncomingDistance();
              } else {
                setIsOncoming(true);
              }

              const getPoints = async () => {
                try {
                  const result = await invoke<string>("get_location_history");
                  const coords: Coords[] = JSON.parse(result);
                  setTrackPoints(coords);
                } catch (e) {
                  console.log(e);
                }
              };
              getPoints();

              // toast.success(`Got data with jumpsuggestion: ${data.jump_suggestion}, for point: ${data.jump_point}`, {
              //   position: "bottom-center",
              //   duration: 3000,
              // });
            })
            .catch((_) => {
              setDebugData("Failed to sync data");
            });
          if (pos) {
            setGpsAccuracy(pos.coords.accuracy as number);
          }

          invoke<string>("get_exceeds").then((exceeds) => {
            setSpeedExceeds(exceeds);
          });
        },
      );
    }
  };

  useEffect(() => {
    if (
      jumpSuggestion &&
      jumpMode &&
      jumpPointID.split("-")[1] !== nextPointName
    ) {
      callView("jump");
    } else if (activeViewPort.name === "jump") {
      callView("navigate");
    }
  }, [jumpSuggestion]);

  useEffect(() => {
    const orientationChangeHandle = () => {
      const orientation = screen.orientation.type;
      setRoadbookMode(orientation.includes("portrait"));
    };
    const check = async () => {
      const rn = await invoke<string>("get_race_number");
      setRaceNumber(rn);
    };
    setMobileView(width / height > 2 || height / width > 2);
    setRoadbookMode(width < height);
    check();
    geoloc();
    screen.orientation.addEventListener("change", orientationChangeHandle);

    return () => {
      screen.orientation.removeEventListener("change", orientationChangeHandle);
    };
  }, []);

  const audioContextRef = useRef<AudioContext | null>(null);
  const continuousOscRef = useRef<OscillatorNode | null>(null);
  const continuousGainRef = useRef<GainNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }, []);

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

  const renderContent = () => {
    if (isOncoming && oncomingDistance > oncomingDetection) {
      beeping && startContinuousTone();
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-red-600 text-white text-center text-4xl font-bold">
          <p>ONCOMING TRAFFIC AHEAD!</p>
          <p>Distance: {oncomingDistance.toFixed(1)} m</p>
          <div className="flex mt-10 gap-5">
            <Button
              className="p-6 bg-green-600"
              onClick={() => {
                setIsOncoming(false);
                resetOncomingDistance();
                stopContinuousTone();
              }}
            >
              Mark as Passed
            </Button>
            <Button
              className="p-6"
              onClick={() => {
                setBeeping(false);
                stopContinuousTone();
              }}
            >
              MUTE
            </Button>
          </div>
        </div>
      );
    } else {
      setBeeping(true);
    }
    switch (activeViewPort.name) {
      case "request": {
        let answerFunc = setCodeOfDay;
        if (activeViewPort.type == "race number") answerFunc = setRaceNumber;
        if (activeViewPort.type == "command") answerFunc = setCommand;
        return (
          <main className="gap-3 items-center justify-center">
            <DataRequest
              typeOfData={activeViewPort.type as TypeOfRequest}
              setAnswer={answerFunc}
            />
          </main>
        );
      }
      case "settings":
        return (
          <div className="relative h-screen">
            <Settings />
          </div>
        );
      case "admin-area":
        return (
          <div className="relative h-screen">
            <AdminPanel />
          </div>
        );
      case "position":
        return (
          <div className="relative h-screen">
            <Position />
          </div>
        );
      case "checkpoints":
        return (
          <div className="relative h-screen">
            <CheckPoints />
          </div>
        );
      case "exceeds":
        return (
          <div className="relative h-screen">
            <SpeedExceedsScreen />
          </div>
        );
      case "points-list":
        return (
          <div className="relative h-screen">
            <PointsList />
          </div>
        );
      case "jump":
        return (
          <div className="relative h-screen">
            <JumpSuggestion />
          </div>
        );
      case "adjust":
        return (
          <div className="relative h-screen">
            <Adjust />
          </div>
        );
      case "tracking":
        return (
          <div className="relative h-screen">
            <Tracking />
          </div>
        );
      case "debug":
        return (
          <div className="relative h-screen">
            <DebugScreen />
          </div>
        );
      case "navigate":
        return (
          <>
            {!mobileView && !roadbookMode && (
              <SwipeZones
                onOpenLeft={() => setLeftOpen(true)}
                onOpenRight={() => setRightOpen(true)}
                onCloseLeft={() => setLeftOpen(false)}
                onCloseRight={() => setRightOpen(false)}
              />
            )}
            {roadbookMode ? (
              <main className="h-full gap-3 items-center justify-center overflow-hidden">
                <Roadbook />
              </main>
            ) : (
              <main
                className={`${mobileView && "flex"} h-full gap-3 items-start justify-center overflow-hidden`}
              >
                {mobileView && (
                  <div className="w-1/6">
                    <LeftContent />
                  </div>
                )}
                <div
                  className={`relative h-screen ${mobileView ? "w-2/3" : "w-full"} border-2 border-foreground ${showBackground ? 'bg-cover bg-center bg-no-repeat bg-[url("./assets/background.png")]' : ""}`}
                >
                  <Ride />
                </div>
                {mobileView && (
                  <div className="w-1/6">
                    <RightContent />
                  </div>
                )}
                <div className="flex">
                  <LeftMenu open={leftOpen} setOpen={setLeftOpen} />
                  <RightMenu open={rightOpen} setOpen={setRightOpen} />
                </div>
              </main>
            )}
          </>
        );
    }
    return <main className="gap-3 items-center justify-center">{ }</main>;
  };

  return (
    <>
      {configLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-lg font-medium">
              Request for config update...
            </span>
          </div>
        </div>
      )}
      {renderContent()}
    </>
  );
}

export default App;
