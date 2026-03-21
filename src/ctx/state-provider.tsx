import { TypeOfRequest } from "@/types/request";
import { AppState, Coords, DashBoard } from "@/types/state";
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
  mobileView: boolean;
  dashBoard: DashBoard;
  activeViewPort: ViewPort;

  totalWidgetShown: boolean;
  partialWidgetShown: boolean;
  countdownWidgetShown: boolean;

  lat: number;
  lon: number;
  speed: number;

  setRaceNumber: (rn: string) => void;
  setCodeOfDay: (code: string) => void;
  setMobileView: (satus: boolean) => void;
  callView: (name: string, type?: TypeOfRequest) => void;
  setCommand: (cmd: string) => void;
  switchWidget: (caption: "total" | "partial" | "countdown") => void;
  setCoords: (update: Coords) => void;
};

const initialState: AppStateProviderState = {
  raceNumber: await invoke<string>("get_race_number"),
  adminMode: false,
  navMode: false,
  mobileView: false,

  totalWidgetShown: false,
  partialWidgetShown: false,
  countdownWidgetShown: false,

  lat: 0,
  lon: 0,
  speed: 0,

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
  switchWidget: () => null,
  setMobileView: () => null,
  setCoords: () => null,
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

  // modes
  const [adminMode, setAM] = useState(false);
  const [navMode, setNM] = useState(false);
  const [mobileView, setMobileView] = useState(false);


  // widgets state
  const [totalWidgetShown, setTotalShow] = useState(false);
  const [partialWidgetShown, setPartialShow] = useState(false);
  const [countdownWidgetShown, setCountdownShow] = useState(false);

  // data
  const [lat, setLat] = useState(0);
  const [lon, setLon] = useState(0);
  const [speed, _setSpeed] = useState(0);

  // sync state
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
        setPartialShow(state.dashBoard.widgetShown["partial"]);
        setTotalShow(state.dashBoard.widgetShown["total"]);
        setCountdownShow(state.dashBoard.widgetShown["countdown"]);
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

  const setCoords = (update: Coords) => {
    let db = dashBoard;
    db.coords = update;
    setLat(update.lat);
    setLon(update.lon);

    setDB(db);
  }

  const switchWidget = (caption: "total" | "partial" | "countdown") => {
    let db = dashBoard
    switch (caption) {
      case "total": {
        if (db.widgetShown.total) {
          db.widgetShown.total = false;
          setTotalShow(false)
        } else {
          db.widgetShown.total = true;
          setTotalShow(true)
        }
        setDB(db)
        return
      }
      case "countdown": {
        if (db.widgetShown.countdown) {
          db.widgetShown.countdown = false;
          setCountdownShow(false)
        } else {
          db.widgetShown.countdown = true;
          setCountdownShow(true)
        }
        setDB(db)
        return
      }
      case "partial": {
        if (db.widgetShown.partial) {
          db.widgetShown.partial = false;
          setPartialShow(false)
        } else {
          db.widgetShown.partial = true;
          setPartialShow(true)
        }
        setDB(db)
        return
      }
    }
  }

  const value = {
    raceNumber,
    adminMode,
    navMode,
    mobileView,
    dashBoard,
    activeViewPort,
    totalWidgetShown,
    partialWidgetShown,
    countdownWidgetShown,
    lat,
    lon, 
    speed,

    setRaceNumber,
    callView,
    setCodeOfDay,
    setCommand,
    switchWidget,
    setMobileView,
    setCoords,
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
