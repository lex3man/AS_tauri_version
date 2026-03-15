import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import {
  checkPermissions,
  requestPermissions,
  getCurrentPosition,
  watchPosition,
} from '@tauri-apps/plugin-geolocation';
import { DataRequest } from "./components/screens/request";
import { useAppState } from "./ctx/state-provider";
import { TypeOfRequest } from "./types/request";
import AdminPanel from "./components/screens/admin-area";
import CheckPoints from "./components/screens/checkpoints";
import Ride from "./components/screens/navigate";

function App() {
  const { activeViewPort, setRaceNumber, setCodeOfDay, setCommand } = useAppState()

  const geoloc = async () => {
    let permissions = await checkPermissions();
    if (
      permissions.location === 'prompt' ||
      permissions.location === 'prompt-with-rationale'
    ) {
      permissions = await requestPermissions(['location']);
    }

    if (permissions.location === 'granted') {
      const pos = await getCurrentPosition();
      await invoke('location_update', { data: JSON.stringify(pos) })

      await watchPosition(
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        async (pos) => {
          await invoke('location_update', { data: JSON.stringify(pos) })
          // const gpsPosition = await invoke<string>('get_coords')
        }
      );
    }
  }

  useEffect(() => {
    const check = async () => {
      const rn = await invoke<string>("get_race_number")
      setRaceNumber(rn)
    }
    check();
    geoloc();
  }, [])

  switch (activeViewPort.name) {
    case 'request': {
      let answerFunc = setCodeOfDay
      if (activeViewPort.type == "race number") answerFunc = setRaceNumber
      if (activeViewPort.type == "command") answerFunc = setCommand
      return (
        <main className="gap-3 items-center justify-center">
          <DataRequest typeOfData={activeViewPort.type as TypeOfRequest} setAnswer={answerFunc} />
        </main>
      )
    }
    case 'admin-area':
      return (
        <AdminPanel />
      )
    case 'checkpoints':
      return (
        <CheckPoints />
      )
    case 'navigate':
      return (
        <main className="gap-3 items-center justify-center">
          <Ride />
        </main>
      )
  }
  return (
    <main className="gap-3 items-center justify-center">
      {}
    </main>
  );
}

export default App;