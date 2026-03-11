import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import {
  checkPermissions,
  requestPermissions,
  getCurrentPosition,
  watchPosition,
} from '@tauri-apps/plugin-geolocation';
import { useTheme } from "./ctx/theme-provider";
import { Button } from "./components/ui/button";

function App() {
  const { theme, setTheme } = useTheme()
  const [raceNumber, setRaceNumber] = useState("")
  const [settings, setSettings] = useState("")
  const [rnInput, setRNInput] = useState("")
  const [coords, setCoords] = useState("")

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
          const gpsPosition = await invoke<string>('get_coords')
          setCoords(gpsPosition)
          console.log(pos);
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

  const setRN = async () => {
    await invoke('set_race_number', { value: rnInput });
    const rn = await invoke<string>("get_race_number")
    setRaceNumber(rn)
  }


  const switchBackground = async () => {
    await invoke('switch_background');
    const config = await invoke<string>('get_settings');
    setSettings(config)
  }

  const switchTheme = async () => {
    await invoke('switch_theme')
    const config = await invoke<string>('get_settings');
    if (theme === "dark") setTheme("light")
    if (theme === "light") setTheme("dark")
    setSettings(config)
  }

  return (
    <main className="container gap-3">
      <input className="border rounded-md p-3 m-auto w-sm" value={rnInput} onChange={(e) => setRNInput(e.target.value)}></input>
      <Button variant="outline" onClick={setRN}>Задать</Button>
      <Button variant="outline" onClick={switchTheme}>Сменить тему</Button>
      <Button variant="outline" onClick={switchBackground}>Включить фон</Button>
      <div className="p-5">{raceNumber}</div>
      <div className="p-5">{settings}</div>
      <div className="p-5">{coords}</div>

    </main>
  );
}

export default App;