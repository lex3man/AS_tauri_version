import { TypeOfRequest } from "@/types/request";
import { AppState, DashBoard } from "@/types/state";
import { ViewPort } from "@/types/viewport";
import Viewports from "@/viewports";
import { invoke } from "@tauri-apps/api/core";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner"

type AppStateProviderProps = {
  children: React.ReactNode;
  storageKey?: string;
};

function parseState(json: string): AppState {
  const parsed = JSON.parse(json) as AppState;
  return parsed;
}

type AppStateProviderState = {
  raceNumber: string;
  adminMode: boolean;
  navMode: boolean;
  dashBoard: DashBoard;
  activeViewPort: ViewPort;

  setRaceNumber: (rn: string) => void;
  setCodeOfDay: (code: string) => void;
  callView: (name: string, type?: TypeOfRequest) => void;
  setCommand: (cmd: string) => void;
};

const initialState: AppStateProviderState = {
  raceNumber: await invoke<string>("get_race_number"),
  adminMode: false,
  navMode: false,
  dashBoard: {
    cog: 0,
    sog: 0,
    ctw: 0,
    dtw: 0,
    maxSpeed: 140,
    coords: { lat: 0, lon: 0 },
    metrics: {
      absTotal: 0,
      total: 0,
      partial: 0,
      countdown: 0,
      cpCounter: 0,
    },
    widgetShown: {
      total: false,
      partial: false,
      countdown: false,
    },
  },
  activeViewPort: ViewPort.new("request", "race number"),

  setRaceNumber: () => null,
  setCodeOfDay: () => null,
  callView: () => null,
  setCommand: () => null,
};

const AppStateProviderContext =
  createContext<AppStateProviderState>(initialState);

export function StateProvider({
  children,
  storageKey = "adventuresmart-state",
  ...props
}: AppStateProviderProps) {
  const [coad, setCoad] = useState<string>("");
  const [raceNumber, setRN] = useState<string>("");
  const [adminMode, setAM] = useState(false);
  const [navMode, setNM] = useState(false);
  const [dashBoard, setDB] = useState<DashBoard>({
    cog: 0,
    sog: 0,
    ctw: 0,
    dtw: 0,
    maxSpeed: 140,
    coords: { lat: 0, lon: 0 },
    metrics: {
      absTotal: 0,
      total: 0,
      partial: 0,
      countdown: 0,
      cpCounter: 0,
    },
    widgetShown: {
      total: false,
      partial: false,
      countdown: false,
    },
  });
  const [activeViewPort, setAVP] = useState<ViewPort>(
    ViewPort.new("request", "race number"),
  );

  let screenState = new Viewports();

  useEffect(() => {
    const getState = async () => {
      const stateString = await invoke<string>("get_snapshot");
      if (stateString) {
        const state: AppState = parseState(stateString);
        setRN(state.raceNumber);
        setNM(state.navMode);
        setDB(state.dashBoard);
        setAVP(state.activeViewPort);
      }
    };

    getState();
  }, []);

  useEffect(() => {
    const adminCheck = async () => {
      if (await invoke<boolean>("is_admin")) {
        setAM(true);
        callView("admin-area");
      } else {
        setAM(false);
      }
    };
    adminCheck();
  }, [coad]);

  const setRaceNumber = async (rn: string) => {
    setRN(rn);
    await invoke("set_race_number", { value: rn });

    adminMode ? callView("admin-area") : callView("navigate");
  };

  const setCodeOfDay = async (code: string) => {
    await invoke("activate_code", { code: code });
    setCoad(code);
    callView('navigate')
  };

  const setCommand = async (cmd: string) => {
    invoke<string>("activate_cmd", { cmd: cmd }).then((response) => {
      toast.info(response, { position: "bottom-center" })
    }).catch((err) => {
      toast.error(err, { position: "bottom-center" })
    });
    callView('navigate')
  };

  const callView = (name: string, type?: TypeOfRequest) => {
    setAVP(ViewPort.new(name, type));
    screenState.activate(name, type);
  };

  const value = {
    raceNumber,
    adminMode,
    navMode,
    dashBoard,
    activeViewPort,

    setRaceNumber,
    callView,
    setCodeOfDay,
    setCommand,
  };

  return (
    <AppStateProviderContext.Provider {...props} value={value}>
      {children}
    </AppStateProviderContext.Provider>
  );
}

export const useAppState = () => {
  const context = useContext(AppStateProviderContext);

  if (context === undefined)
    throw new Error("useAppState must be used within a StateProvider");

  return context;
};
