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
import { flushCollected } from "./lib/collected";
import Adjust from "./components/screens/adjust";
import Tracking from "./components/screens/tracking";
import { Button } from "./components/ui/button";
import PointsList from "./components/screens/points-list";
import { send_report_file } from "./lib/api";

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
    setActiveCode,
    setCodeOfDay,
    setCommand,
    setCoords,
    setCurrentSpeed,
    setMobileView,
    setCog,
    setCtw,
    setDtw,
    setArrowColor,
    setCpCounter,
    setTotal,
    setPartial,
    setNextPointNumber,
    setNextPointName,
    setMaxSpeed,
    setSignLimit,
    setSignState,
    setRoadbookMode,
    setRBSlidesUnlocked,
    setDssTaken,
    setReportSentAutoTime,
    setReportSentManualTime,
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
  const { showBackground, jumpMode, oncomingDetection, oncomingDetectionEnabled } =
    useSettings();
  const { width, height } = useWindowDimensions();

  // Reports are queued in the backend the moment they're generated and
  // stay queued until the server actually accepts them, so one produced
  // with no connectivity is re-sent once the device is back online. Only a
  // new day code, an admin RESET or wiping app data drops the queue.
  const flushingReportRef = useRef(false);
  const lastReportAttemptRef = useRef(0);
  const REPORT_RETRY_INTERVAL_MS = 30000;

  const flushPendingReport = async (force = false) => {
    if (flushingReportRef.current) {
      // A forced flush is the ASS capture asking for its report to go now.
      // Landing mid-attempt must not drop it: clear the throttle so the very
      // next tick picks it up instead of waiting out the full interval.
      // Not bypassing the guard outright — that would put the same file on
      // the wire twice.
      if (force) lastReportAttemptRef.current = 0;
      return;
    }
    if (!force && Date.now() - lastReportAttemptRef.current < REPORT_RETRY_INTERVAL_MS) {
      return;
    }
    flushingReportRef.current = true;
    lastReportAttemptRef.current = Date.now();
    try {
      const pending = JSON.parse(
        await invoke<string>("get_pending_report"),
      ) as { path?: string; etape?: string };
      if (!pending.path) return;

      // Every report that goes on the wire takes the collected buffer with
      // it. This is the path that needed it most: a queued report re-sent
      // later never regenerates, so the backend's own send_collected emit
      // at generation time doesn't fire again. Not awaited — the report
      // must not wait out the upload timeout on a dead network.
      void flushCollected();

      const sent = await send_report_file(pending.path, pending.etape ?? "");
      // Stays queued and is retried on a later tick. A reason means the
      // server answered and refused — that will not fix itself by waiting,
      // so it goes to the log where the next field report can find it,
      // rather than to a toast the rider would see every thirty seconds.
      if (!sent.ok) {
        if (sent.reason) {
          console.error(`Queued report refused by the server: ${sent.reason}`);
        }
        return;
      }

      await invoke<string>("mark_report_sent");
      const [auto, manual] = await Promise.all([
        invoke<string>("get_report_sent_time", { mode: "auto" }),
        invoke<string>("get_report_sent_time", { mode: "manual" }),
      ]);
      setReportSentAutoTime(auto);
      setReportSentManualTime(manual);
    } catch (e) {
      console.error("Pending report flush failed:", e);
    } finally {
      flushingReportRef.current = false;
    }
  };

  // Collected telemetry is queued the same way, but until now it only ever
  // went out on a captured point. That leaves two gaps the timer closes: the
  // long stretches between points, and a stage that ended with no coverage —
  // there is no next point left to carry the buffer to the server.
  const lastCollectedAttemptRef = useRef(0);

  const flushPendingCollected = async (force = false) => {
    if (
      !force &&
      Date.now() - lastCollectedAttemptRef.current < REPORT_RETRY_INTERVAL_MS
    ) {
      return;
    }
    lastCollectedAttemptRef.current = Date.now();
    // flushCollected holds its own in-flight guard, shared with the capture
    // and report paths, so none of them can put the same batch on the wire
    // twice.
    await flushCollected();
  };

  // The retry used to ride on GPS ticks alone, which is exactly when it
  // cannot work: the rider finishes the stage, parks, and only then reaches
  // a network — stationary, so watchPosition stops delivering updates and
  // nothing ever retried the queue. Drive it from its own timer instead,
  // and attempt immediately when the webview sees connectivity return.
  const flushPendingReportRef = useRef(flushPendingReport);
  flushPendingReportRef.current = flushPendingReport;
  const flushPendingCollectedRef = useRef(flushPendingCollected);
  flushPendingCollectedRef.current = flushPendingCollected;

  useEffect(() => {
    const retry = (force = false) => {
      void flushPendingReportRef.current(force);
      void flushPendingCollectedRef.current(force);
    };
    const timer = setInterval(() => retry(), REPORT_RETRY_INTERVAL_MS);
    const onOnline = () => retry(true);
    window.addEventListener("online", onOnline);
    // A report queued before the app was last killed is still on disk, and
    // so is any telemetry it hadn't managed to deliver.
    retry(true);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", onOnline);
    };
  }, []);

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
              // setDebugData(rawData);
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
              // Level flag, resynced every tick from already-checked
              // RBP/DSS points — not a one-shot pulse — so it's correct
              // again on the very next poll after an app restart/resume,
              // without needing a fresh RBP/DSS crossing.
              setRBSlidesUnlocked(data.roadbook_unlocked);
              setDssTaken(data.dss_taken);
              // Generating the end-of-stage report is the backend's job now:
              // it queues one in the same pass that captures the ASS point,
              // tagged "auto" so the bottom menu can show automatic and
              // manual send times separately. All that is left here is to
              // ask the queue to go out at once rather than on the next
              // tick, so `ass_captured` being a one-shot pulse this poll may
              // miss now costs an interval instead of the whole report.
              // Every other tick retries whatever is still queued (throttled
              // internally) — that is what delivers an offline report once
              // the device finds a connection again.
              flushPendingReport(data.ass_captured === true);
              setCog(data.cog);
              setCtw(data.ctw);
              setDtw(data.dtw);
              setArrowColor(data.arrow_color);
              // setTime(pos?.timestamp as number);
              setCurrentSpeed(data.sog);
              setCpCounter(data.metrics.cp_counter);
              setTotal(data.metrics.total);
              setPartial(data.metrics.partial);
              setNextPointNumber(data.next_point.split("-")[0]);
              setNextPointName(data.next_point.split("-")[1]);
              setNextPointType(data.next_point_type);
              setMaxSpeed(data.max_speed);
              setSignLimit(data.sign_limit);
              setSignState(data.sign_state);
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
      // get_race_number/get_active_code return "" (never null) when nothing
      // was persisted yet — guard anyway since Rust's Option<String> could
      // still surface as null over IPC, and setRaceNumber(null) would blow
      // up trying to re-save it. These two survive an app restart on the
      // backend already (persisted the moment they're set) but were never
      // pulled back into frontend state on mount — restoring them here is
      // what fixes "Etape/Race Number reset after restart".
      const rn = await invoke<string>("get_race_number");
      if (rn) {
        setRaceNumber(rn);
      }
      const code = await invoke<string>("get_active_code");
      if (code) {
        setActiveCode(code);
      }
      // Same idea for the report-sent indicator (bottom-menu) — it's
      // persistently visible regardless of whether the user ever opens
      // Settings, so it needs its own restore here, not just settings.tsx's.
      const [autoSent, manualSent] = await Promise.all([
        invoke<string>("get_report_sent_time", { mode: "auto" }),
        invoke<string>("get_report_sent_time", { mode: "manual" }),
      ]);
      setReportSentAutoTime(autoSent);
      setReportSentManualTime(manualSent);
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

  useEffect(() => {
    setBeeping(true);
  }, [isOncoming])

  const renderContent = () => {
    // Also gated here, not just in the backend: isOncoming latches until
    // "Mark as Passed", so without this the screen would stay up after the
    // mode is switched off mid-warning.
    if (
      oncomingDetectionEnabled &&
      isOncoming &&
      oncomingDistance > oncomingDetection
    ) {
      if (beeping) { startContinuousTone(); }
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-red-600 text-white text-center text-4xl font-bold">
          <p>ONCOMING TRAFFIC AHEAD!</p>
          <p>Distance: {oncomingDistance.toFixed(1)} m</p>
          <div className="flex mt-10 gap-5">
            <Button
              className="p-6 bg-green-600"
              onClick={() => {
                setBeeping(false);
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
