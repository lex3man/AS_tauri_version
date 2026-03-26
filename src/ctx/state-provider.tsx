import { TypeOfRequest } from "@/types/request";
import { AppState, Coords, DashBoard } from "@/types/state";
import { ViewPort } from "@/types/viewport";
import Viewports from "@/viewports";
import { invoke } from "@tauri-apps/api/core";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { getBatteryInfo } from "tauri-plugin-device-info-api";

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
  demoMode: boolean;
  mobileView: boolean;
  requestMode: boolean;

  dashBoard: DashBoard;
  activeViewPort: ViewPort;

  gpsAccurancy: number;
  batteryLevel: number;
  charging: boolean;

  totalWidgetShown: boolean;
  partialWidgetShown: boolean;
  countdownWidgetShown: boolean;

  lat: number;
  lon: number;
  speed: number;
  cog: number;
  ctw: number;
  dtw: number;
  maxSpeed: number;
  cpCounter: number;
  nextPointNumber: number;
  nextPointName: string;

  setRaceNumber: (rn: string) => void;
  setCodeOfDay: (code: string) => void;
  setMobileView: (status: boolean) => void;
  setDemoMode: (status: boolean) => void;
  setRequestMode: (status: boolean) => void;
  callView: (name: string, type?: TypeOfRequest) => void;
  setCommand: (cmd: string) => void;
  switchWidget: (caption: "total" | "partial" | "countdown") => void;
  setCoords: (update: Coords) => void;
  setCurrentSpeed: (update: number) => void;
  setGpsAccuracy: (val: number) => void;
};

const initialState: AppStateProviderState = {
  raceNumber: await invoke<string>("get_race_number"),

  adminMode: false,
  navMode: false,
  demoMode: false,
  mobileView: false,
  requestMode: true,

  gpsAccurancy: 5,
  batteryLevel: 100,
  charging: false,

  totalWidgetShown: false,
  partialWidgetShown: false,
  countdownWidgetShown: false,

  lat: 0,
  lon: 0,
  speed: 0,
  cog: 0,
  ctw: 0,
  dtw: 0,
  maxSpeed: 140,
  cpCounter: 0,
  nextPointNumber: 0,
  nextPointName: "",

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
  setDemoMode: () => null,
  setCoords: () => null,
  setCurrentSpeed: () => null,
  setGpsAccuracy: () => null,
  setRequestMode: () => null,
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
  const [demoMode, setDM] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [requestMode, setRM] = useState(true);

  // widgets state
  const [totalWidgetShown, setTotalShow] = useState(false);
  const [partialWidgetShown, setPartialShow] = useState(false);
  const [countdownWidgetShown, setCountdownShow] = useState(false);

  // data
  const [lat, setLat] = useState(0);
  const [lon, setLon] = useState(0);
  const [cog, setCog] = useState(0);
  const [ctw, setCtw] = useState(0);
  const [dtw, setDtw] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [maxSpeed, _setMaxSpeed] = useState(140);
  const [cpCounter, setCpCounter] = useState(0);
  const [nextPointNumber, _setNextPointNumber] = useState(0);
  const [nextPointName, _setNextPointName] = useState("");

  // indicators
  const [gpsAccurancy, setGpsAccuracy] = useState(5);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [charging, setCharging] = useState(false);

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

        setCog(state.dashBoard.cog);
        setCtw(state.dashBoard.ctw);
        setDtw(state.dashBoard.dtw);
        setCpCounter(state.dashBoard.metrics.cpCounter);
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

  useEffect(() => {
    const batteryCheck = async () => {
      const battery = await getBatteryInfo();
      setBatteryLevel(battery.level ? battery.level : 0);
      setCharging(battery.isCharging ? battery.isCharging : false);
    };
    batteryCheck();
  }, [speed]);

  const setRaceNumber = async (rn: string) => {
    setRN(rn);
    await invoke("set_race_number", { value: rn });

    adminMode ? callView("admin-area") : callView("navigate");
  };

  const setCodeOfDay = async (code: string) => {
    const resp = await invoke<string>("activate_code", { code: code });
    setCoad(code);
    if (resp) toast.info(resp, { position: "bottom-center" });
    if (code == "DEMO") {
      setDemoMode(true);
    }
    callView("navigate");
  };

  const setCommand = async (cmd: string) => {
    invoke<string>("activate_cmd", { cmd: cmd })
      .then((response) => {
        toast.info(response, { position: "bottom-center" });
      })
      .catch((err) => {
        toast.error(err, { position: "bottom-center" });
      });
    callView("navigate");
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
  };

  const setCurrentSpeed = (update: number) => {
    let db = dashBoard;
    db.sog = update;
    setSpeed(update);

    setDB(db);
  };

  const setDemoMode = (status: boolean) => {
    setDM(status);
  };

  const setRequestMode = (status: boolean) => {
    setRM(status);
  };

  const switchWidget = (caption: "total" | "partial" | "countdown") => {
    let db = dashBoard;
    switch (caption) {
      case "total": {
        if (db.widgetShown.total) {
          db.widgetShown.total = false;
          setTotalShow(false);
        } else {
          db.widgetShown.total = true;
          setTotalShow(true);
        }
        setDB(db);
        return;
      }
      case "countdown": {
        if (db.widgetShown.countdown) {
          db.widgetShown.countdown = false;
          setCountdownShow(false);
        } else {
          db.widgetShown.countdown = true;
          db.widgetShown.total = false;
          db.widgetShown.partial = false;
          setCountdownShow(true);
          setPartialShow(false);
          setTotalShow(false);
        }
        setDB(db);
        return;
      }
      case "partial": {
        if (db.widgetShown.partial) {
          db.widgetShown.partial = false;
          setPartialShow(false);
        } else {
          db.widgetShown.partial = true;
          setPartialShow(true);
        }
        setDB(db);
        return;
      }
    }
  };

  const value = {
    raceNumber,

    adminMode,
    navMode,
    demoMode,
    mobileView,
    requestMode,

    dashBoard,
    activeViewPort,

    totalWidgetShown,
    partialWidgetShown,
    countdownWidgetShown,

    lat,
    lon,
    speed,
    cog,
    ctw,
    dtw,

    maxSpeed,
    cpCounter,
    nextPointNumber,
    nextPointName,

    gpsAccurancy,
    batteryLevel,
    charging,

    setRaceNumber,
    callView,
    setCodeOfDay,
    setCommand,
    switchWidget,
    setMobileView,
    setCoords,
    setCurrentSpeed,
    setGpsAccuracy,
    setDemoMode,
    setRequestMode,
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
