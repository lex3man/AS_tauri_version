import { AppState, DashBoard } from "@/types/state";
import { ViewPort } from "@/types/viewport";
import { invoke } from "@tauri-apps/api/core";
import { createContext, useContext, useEffect, useState } from "react"

type AppStateProviderProps = {
    children: React.ReactNode
    storageKey?: string
}

function parseState(json: string): AppState {
    const parsed = JSON.parse(json) as AppState;
    return parsed
}

type AppStateProviderState = {
    raceNumber: string;
    adminMode: boolean;
    navMode: boolean;
    dashBoard: DashBoard;
    activeViewPort: ViewPort;

    setRaceNumber: (rn: string) => void;
}

const initialState: AppStateProviderState = {
    raceNumber: await invoke<string>('get_race_number'),
    adminMode: false,
    navMode: false,
    dashBoard: {
        cog: 0,
        sog: 0,
        ctw: 0,
        dtw: 0,
        maxSpeed: 140,
        coords: {lat: 0, lon: 0},
        metrics: {
            absTotal: 0,
            total: 0,
            partial: 0,
            countdown: 0,
            cpCounter: 0,
        },
        widgetShown: {
            "total": false,
            "partial": false,
            "countdown": false,
        },
    },
    activeViewPort: ViewPort.new('request', 'race number'),
    
    setRaceNumber: () => null,
}

const AppStateProviderContext = createContext<AppStateProviderState>(initialState)

export function StateProvider({
    children, 
    storageKey = "adventuresmart-state", 
    ...props
}: AppStateProviderProps) {
    const [raceNumber, setRN] = useState<string>("")
    const [adminMode, setAM] = useState(false)
    const [navMode, setNM] = useState(false)
    const [dashBoard, setDB] = useState<DashBoard>({
            cog: 0,
            sog: 0,
            ctw: 0,
            dtw: 0,
            maxSpeed: 140,
            coords: {lat: 0, lon: 0},
            metrics: {
                absTotal: 0,
                total: 0,
                partial: 0,
                countdown: 0,
                cpCounter: 0,
            },
            widgetShown: {
                "total": false,
                "partial": false,
                "countdown": false,
            },
        }
    )
    const [activeViewPort, setAVP] = useState<ViewPort>(
        ViewPort.new('request', 'race number')
    )

    useEffect(() => {
        const getState = async () => {
            const stateString = await invoke<string>('get_snapshot');
            if (stateString) {
                const state: AppState = parseState(stateString);
                setRN(state.raceNumber)
                setAM(state.adminMode)
                setNM(state.navMode)
                setDB(state.dashBoard)
                setAVP(state.activeViewPort)
            }
        }
        getState()
    }, [])

    const setRaceNumber = async (rn: string) => {
        setRN(rn)
        await await invoke('set_race_number', { value: rn });
    }

    const value = {
        raceNumber,
        adminMode,
        navMode,
        dashBoard,
        activeViewPort,
        setRaceNumber
    }

    return (
        <AppStateProviderContext.Provider {...props} value={value}>
            {children}
        </AppStateProviderContext.Provider>
    )
}

export const useAppState = () => {
  const context = useContext(AppStateProviderContext)

  if (context === undefined)
    throw new Error("useAppState must be used within a StateProvider")

  return context
}