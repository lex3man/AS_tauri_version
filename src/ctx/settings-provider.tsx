import { invoke } from "@tauri-apps/api/core";
import { createContext, useContext, useEffect, useState } from "react"
import { useTheme } from "./theme-provider";
import { Kilometers, Meters } from "@/types/messure-units";
import { Settings } from "@/types/settings";

type SettingsProviderProps = {
    children: React.ReactNode
    storageKey?: string
}

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
    };
}

type SettingsProviderState = {
    showBackground: boolean;
    correctionDistance: Meters;
    trackDisttance: Kilometers;
    dtwEnable: boolean;
    darkMode: boolean;
    demoMode: boolean;
    jumpMode: boolean;
    roadbookMode: boolean;

    setShowBackground: (status: boolean) => void;
    setCorrectionDistance: (value: Meters) => void;
    setTrackDistance: (value: Kilometers) => void;
    setDtwEnable: (status: boolean) => void;
    setDarkMode: (status: boolean) => void;
    setDemoMode: (status: boolean) => void;
    setJumpMode: (status: boolean) => void;
    setRoadbookMode: (status: boolean) => void;
}

const initialState: SettingsProviderState = {
    showBackground: true,
    correctionDistance: new Meters(100),
    trackDisttance: new Kilometers(30),
    dtwEnable: true,
    darkMode: true,
    demoMode: false,
    jumpMode: false,
    roadbookMode: false,

    setShowBackground: () => null,
    setCorrectionDistance: () => null,
    setTrackDistance: () => null,
    setDtwEnable: () => null,
    setDarkMode: () => null,
    setDemoMode: () => null,
    setJumpMode: () => null,
    setRoadbookMode: () => null,
}

const SettingsProviderContext = createContext<SettingsProviderState>(initialState)

export function SettingsProvider({
    children, 
    storageKey = "adventuresmart-settings", 
    ...props
}: SettingsProviderProps) {
    const [showBackground, setShowBg] = useState(true)
    const [correctionDistance, setCorrectionDistance] = useState(new Meters(100))
    const [trackDisttance, setTrackDistance] = useState(new Kilometers(30))
    const [dtwEnable, setDtwEnable] = useState(true)
    const [darkMode, setDM] = useState(true)
    const [demoMode, setDemoMode] = useState(false)
    const [jumpMode, setJumpMode] = useState(false)
    const [roadbookMode, setRoadbookMode] = useState(false)
    const { setTheme } = useTheme()

    useEffect(() => {
        const getSettings = async () => {
            const config = await invoke<string>('get_settings');
            const settings = parseSettings(config);

            console.log(config)
            console.log(settings.darkMode ? "DARK" : "LIGHT")
            
            setDM(settings.darkMode);
            settings.darkMode ? ( setTheme('dark') ) : ( setTheme('light') )
            setShowBg(settings.showBackground);
            setCorrectionDistance(settings.correctionDistance);
            setTrackDistance(settings.trackDisttance);
            setDtwEnable(settings.dtwEnable);
            setDemoMode(settings.demoMode);
            setJumpMode(settings.jumpMode);
            setRoadbookMode(settings.roadbookMode);
        }
        getSettings()
    }, [])

    const setDarkMode = (status: boolean) => {
        const save = async () => await invoke('switch_theme');

        setDM(status)
        status ? ( setTheme('dark') ) : ( setTheme('light') )
        save()
    }

    const setShowBackground = (status: boolean) => {
        const save = async () => await invoke('switch_background');

        setShowBg(status)
        save()
    }

    const value = {
        darkMode,
        showBackground,
        correctionDistance,
        trackDisttance,
        dtwEnable,
        demoMode,
        jumpMode,
        roadbookMode,
        setDarkMode,
        setShowBackground,
        setCorrectionDistance,
        setTrackDistance,
        setDtwEnable,
        setDemoMode,
        setJumpMode,
        setRoadbookMode
    }

    return (
        <SettingsProviderContext.Provider {...props} value={value}>
            {children}
        </SettingsProviderContext.Provider>
    )
}

export const useSettings = () => {
  const context = useContext(SettingsProviderContext)

  if (context === undefined)
    throw new Error("useSettings must be used within a SettingsProvider")

  return context
}