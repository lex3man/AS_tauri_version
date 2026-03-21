import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import {
  checkPermissions,
  requestPermissions,
  getCurrentPosition,
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


function App() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const { mobileView, setMobileView } = useAppState();
  const { activeViewPort, setRaceNumber, setCodeOfDay, setCommand, setCoords } =
    useAppState();
  const { showBackground } = useSettings();
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
      const pos = await getCurrentPosition();
      await invoke("location_update", { data: JSON.stringify(pos) });

      await watchPosition(
        { enableHighAccuracy: true, timeout: 1000, maximumAge: 0 },
        async (pos) => {
          await invoke("location_update", { data: JSON.stringify(pos) });
          const gpsPosition = await invoke<string>('get_coords')
          const geoData = JSON.parse(gpsPosition)
          const coords: Coords = {
            lat: geoData["latitude"],
            lon: geoData["longitude"],
          }
          setCoords(coords);
        },
      );
    }
  };

  useEffect(() => {
    const check = async () => {
      const rn = await invoke<string>("get_race_number");
      setRaceNumber(rn);
    };
    setMobileView(width/height > 2)
    check();
    geoloc();
  }, []);

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
    case "navigate":
      return (
        <>
          {!mobileView && <SwipeZones 
            onOpenLeft={() => setLeftOpen(true)}
            onOpenRight={() => setRightOpen(true)}
            onCloseLeft={() => setLeftOpen(false)}
            onCloseRight={() => setRightOpen(false)}
          />}
          <main className={`${mobileView && 'flex'} h-full gap-3 items-center justify-center overflow-hidden`}>
            {mobileView && ( <div className="w-1/6"><LeftContent /></div> )}
            <div className={`relative h-screen w-full ${showBackground ? 'bg-cover bg-center bg-no-repeat bg-[url("./assets/background.png")]' : ''}`}>
              <Ride />
            </div>
            {mobileView ? ( <div className="w-1/6"><RightContent /></div> ) : (
              <div className="flex">
                <LeftMenu open={leftOpen} setOpen={setLeftOpen} />
                <RightMenu open={rightOpen} setOpen={setRightOpen} />
              </div>
            )}
          </main>
        </>
      );
  }
  return <main className="gap-3 items-center justify-center">{}</main>;
}

export default App;
