import { invoke } from "@tauri-apps/api/core";
import { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "./theme-provider";
import { Kilometers, Meters } from "@/types/messure-units";
import { Settings } from "@/types/settings";

type SettingsProviderProps = {
  children: React.ReactNode;
  storageKey?: string;
};

function parseSettings(json: string): Settings {
  const parsed = JSON.parse(json) as {
    background: boolean;
    correction_distance: number;
    dark_mode: boolean;
    demo_mode: boolean;
    dtw_enabled: boolean;
    jump_mode: boolean;
    road_book: boolean;
    track_distance: number;
    oncoming_angle: number;
    oncoming_detection: number;
    autoMove: boolean;
  };

  return {
    showBackground: parsed.background,
    correctionDistance: Meters.from(parsed.correction_distance),
    trackDisttance: Kilometers.from(parsed.track_distance),
    dtwEnable: parsed.dtw_enabled,
    darkMode: parsed.dark_mode,
    demoMode: parsed.demo_mode,
    jumpMode: parsed.jump_mode,
    roadbookMode: parsed.road_book,
    oncomingAngle: parsed.oncoming_angle,
    oncomingDetection: parsed.oncoming_detection,
    autoMove: parsed.autoMove,
  };
}

type SettingsProviderState = {
  showBackground: boolean;
  correctionDistance: Meters;
  trackDistance: Kilometers;
  dtwEnable: boolean;
  darkMode: boolean;
  demoMode: boolean;
  jumpMode: boolean;
  roadbookMode: boolean;
  oncomingAngle: number;
  oncomingDetection: number;
  autoMove: boolean;
  setShowBackground: (status: boolean) => void;
  setDtwEnable: (status: boolean) => void;
  setDarkMode: (status: boolean) => void;
  setDemoMode: (status: boolean) => void;
  setJumpMode: (status: boolean) => void;
  setRoadbookMode: (status: boolean) => void;
  setAutoMove: (status: boolean) => void;
  increaseDistStep: () => void;
  decreaseDistStep: () => void;
  increaseTrackDist: () => void;
  decreaseTrackDist: () => void;
  increaseOncomingAngle: () => void;
  decreaseOncomingAngle: () => void;
  increaseOncomingDetection: () => void;
  decreaseOncomingDetection: () => void;
  getSettings: () => void;
};

const initialState: SettingsProviderState = {
  showBackground: true,
  correctionDistance: new Meters(100),
  trackDistance: new Kilometers(30),
  dtwEnable: true,
  darkMode: true,
  demoMode: false,
  jumpMode: false,
  roadbookMode: false,
  oncomingAngle: 60,
  oncomingDetection: 300,
  autoMove: true,

  setShowBackground: () => null,
  setDtwEnable: () => null,
  setDarkMode: () => null,
  setDemoMode: () => null,
  setJumpMode: () => null,
  setRoadbookMode: () => null,
  setAutoMove: () => null,
  increaseDistStep: () => null,
  decreaseDistStep: () => null,
  increaseTrackDist: () => null,
  decreaseTrackDist: () => null,
  increaseOncomingAngle: () => null,
  decreaseOncomingAngle: () => null,
  increaseOncomingDetection: () => null,
  decreaseOncomingDetection: () => null,
  getSettings: () => null,
};

const SettingsProviderContext =
  createContext<SettingsProviderState>(initialState);

export function SettingsProvider({
  children,
  storageKey = "adventuresmart-settings",
  ...props
}: SettingsProviderProps) {
  const [showBackground, setShowBg] = useState(true);
  const [correctionDistance, setCorrectionDistance] = useState(new Meters(100));
  const [trackDistance, setTrackDistance] = useState(new Kilometers(30));
  const [dtwEnable, setDtwEnable] = useState(true);
  const [darkMode, setDM] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [jumpMode, setJumpMode] = useState(false);
  const [roadbookMode, setRoadbookMode] = useState(false);
  const [autoMove, setAutoMove] = useState(true);
  const [oncomingAngle, setOncomingAngle] = useState(60);
  const [oncomingDetection, setOncomingDetection] = useState(300);
  const { setTheme } = useTheme();

  const getSettings = () => {
    const update = async () => {
      const config = await invoke<string>("get_settings");
      const settings = parseSettings(config);

      setDM(settings.darkMode);
      settings.darkMode ? setTheme("dark") : setTheme("light");
      setShowBg(settings.showBackground);
      setCorrectionDistance(settings.correctionDistance);
      setTrackDistance(settings.trackDisttance);
      setDtwEnable(settings.dtwEnable);
      setDemoMode(settings.demoMode);
      setJumpMode(settings.jumpMode);
      setRoadbookMode(settings.roadbookMode);
    }
    update();
  }

  useEffect(() => {
    getSettings();
  }, []);

  const setDarkMode = (status: boolean) => {
    const save = async () => await invoke("switch_theme");
    if (darkMode != status) {
      save();
    }
    setDM(status);
    status ? setTheme("dark") : setTheme("light");
  };

  const setShowBackground = (status: boolean) => {
    const save = async () => await invoke("switch_background");
    if (showBackground != status) {
      save();
    }
    setShowBg(status);
  };

  const increaseDistStep = async () => {
    invoke("set_dist_step", { c: "up" }).then(() => {
      setCorrectionDistance(new Meters(correctionDistance.value + 10));
    });
  };

  const decreaseDistStep = async () => {
    invoke("set_dist_step", { c: "down" }).then(() => {
      if (correctionDistance.value > 0) {
        setCorrectionDistance(new Meters(correctionDistance.value - 10));
      }
    });
  };

  const increaseTrackDist = async () => {
    invoke("set_track_dist", { c: "up" }).then(() => {
      setTrackDistance(new Kilometers(trackDistance.value + 5));
    });
  };

  const decreaseTrackDist = async () => {
    invoke("set_track_dist", { c: "down" }).then(() => {
      if (trackDistance.value > 0) {
        setTrackDistance(new Kilometers(trackDistance.value - 5));
      }
    });
  };

  const increaseOncomingAngle = async () => {
    invoke("increase_angle").then(() => {
      if (oncomingAngle < 180) {
        setOncomingAngle(oncomingAngle + 5);
      }
    });
  };

  const decreaseOncomingAngle = async () => {
    invoke("decrease_angle").then(() => {
      if (oncomingAngle > 10) {
        setOncomingAngle(oncomingAngle - 5);
      }
    });
  };

  const increaseOncomingDetection = async () => {
    invoke("increase_detection").then(() => {
      if (oncomingDetection < 1000) {
        setOncomingDetection(oncomingDetection + 50);
      }
    });
  };

  const decreaseOncomingDetection = async () => {
    invoke("decrease_detection").then(() => {
      if (oncomingDetection >= 50) {
        setOncomingDetection(oncomingDetection - 50);
      }
    });
  };

  const value = {
    darkMode,
    showBackground,
    correctionDistance,
    trackDistance,
    dtwEnable,
    demoMode,
    jumpMode,
    roadbookMode,
    oncomingAngle,
    oncomingDetection,
    autoMove,
    setDarkMode,
    setShowBackground,
    setDtwEnable,
    setDemoMode,
    setJumpMode,
    setRoadbookMode,
    setAutoMove,
    increaseDistStep,
    decreaseDistStep,
    increaseTrackDist,
    decreaseTrackDist,
    increaseOncomingAngle,
    decreaseOncomingAngle,
    increaseOncomingDetection,
    decreaseOncomingDetection,
    getSettings,
  };

  return (
    <SettingsProviderContext.Provider {...props} value={value}>
      {children}
    </SettingsProviderContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsProviderContext);

  if (context === undefined)
    throw new Error("useSettings must be used within a SettingsProvider");

  return context;
};
