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

function App() {
  const { activeViewPort, setRaceNumber } = useAppState()

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
    case 'request':
      return (
        <main className="container gap-3 items-center justify-center">
          <DataRequest typeOfData={activeViewPort.type as TypeOfRequest} setAnswer={setRaceNumber} />
        </main>
      )
    case 'admin-area':
      return (
        <AdminPanel />
      )
  }
  return (
    <main className="container gap-3 items-center justify-center">
      {}
    </main>
  );
}

export default App;