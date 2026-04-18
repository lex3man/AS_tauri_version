import { request_config, send_report, send_telemetry } from "@/lib/api";
import { TypeOfRequest } from "@/types/request";
import { RoadbookSlide, ImageData } from "@/types/roadbook";
import { AppState, Coords, DashBoard, TelemetryData } from "@/types/state";
import { ViewPort } from "@/types/viewport";
import Viewports from "@/viewports";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import { getBatteryInfo, getDeviceInfo } from "tauri-plugin-device-info-api";

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
  debugData: string;
  activeCode: string;

  adminMode: boolean;
  navMode: boolean;
  demoMode: boolean;
  roadbookMode: boolean;
  mobileView: boolean;
  requestMode: boolean;
  configLoading: boolean;
  visiable: boolean;

  dashBoard: DashBoard;
  activeViewPort: ViewPort;

  gpsAccurancy: number;
  batteryLevel: number;
  charging: boolean;

  totalWidgetShown: boolean;
  partialWidgetShown: boolean;
  countdownWidgetShown: boolean;

  rbSlides: RoadbookSlide[];
  rbImages: Record<string, ImageData>;
  currentRBIndex: number;

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
  nextPointType: string;
  jumpPointID: string;
  total: number;
  partial: number;
  speedExceeds: string;
  jumpSuggestion: boolean;
  telemetry: TelemetryData[];
  captured: boolean;

  setRaceNumber: (rn: string) => void;
  setRoadbookMode: (status: boolean) => void;
  setDebugData: (data: string) => void;
  setCodeOfDay: (code: string) => void;
  setMobileView: (status: boolean) => void;
  setDemoMode: (status: boolean) => void;
  setRequestMode: (status: boolean) => void;
  setVisiable: (status: boolean) => void;
  callView: (name: string, type?: TypeOfRequest) => void;
  setCommand: (cmd: string) => void;
  switchWidget: (caption: "total" | "partial" | "countdown") => void;
  setCoords: (update: Coords) => void;
  setCurrentSpeed: (update: number) => void;
  setGpsAccuracy: (val: number) => void;
  setDtw: (val: number) => void;
  setCog: (val: number) => void;
  setCtw: (val: number) => void;
  setCpCounter: (val: number) => void;
  setNextPointNumber: (val: number) => void;
  setNextPointName: (val: string) => void;
  setMaxSpeed: (val: number) => void;
  setTotal: (val: number) => void;
  setPartial: (val: number) => void;
  setTelemetry: (val: TelemetryData[]) => void;
  setSpeedExceeds: (val: string) => void;
  setNextPointType: (val: string) => void;
  setRBSlides: (val: RoadbookSlide[]) => void;
  setRBImages: (val: Record<string, ImageData>) => void;
  setCurrentRBIndex: (val: number) => void;
  goNext: () => void;
  goPrev: () => void;
  setJumpPointID: (val: string) => void;
  setJumpSuggestion: (status: boolean) => void;
  setCaptured: (status: boolean) => void;
};

const initialState: AppStateProviderState = {
  raceNumber: "",
  debugData: "",
  activeCode: "",

  adminMode: false,
  navMode: false,
  demoMode: false,
  roadbookMode: false,
  mobileView: false,
  requestMode: true,
  configLoading: false,
  visiable: false,

  gpsAccurancy: 5,
  batteryLevel: 100,
  charging: false,

  totalWidgetShown: false,
  partialWidgetShown: false,
  countdownWidgetShown: false,

  rbSlides: [],
  rbImages: {},
  currentRBIndex: 0,

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
  nextPointType: "",
  jumpPointID: "",
  total: 0,
  partial: 0,
  jumpSuggestion: false,
  telemetry: [],
  speedExceeds: "",
  captured: false,

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
  setDebugData: () => null,
  setCodeOfDay: () => null,
  callView: () => null,
  setCommand: () => null,
  switchWidget: () => null,
  setMobileView: () => null,
  setDemoMode: () => null,
  setRoadbookMode: () => null,
  setCoords: () => null,
  setCurrentSpeed: () => null,
  setGpsAccuracy: () => null,
  setRequestMode: () => null,
  setDtw: () => null,
  setCog: () => null,
  setCtw: () => null,
  setCpCounter: () => null,
  setNextPointNumber: () => null,
  setNextPointName: () => null,
  setMaxSpeed: () => null,
  setTotal: () => null,
  setPartial: () => null,
  setVisiable: () => null,
  setTelemetry: () => null,
  setSpeedExceeds: () => null,
  setNextPointType: () => null,
  setRBSlides: () => null,
  setRBImages: () => null,
  setCurrentRBIndex: () => null,
  goNext: () => null,
  goPrev: () => null,
  setJumpPointID: () => null,
  setJumpSuggestion: () => null,
  setCaptured: () => null,
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
  const [roadbookMode, setRoadbookMode] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [requestMode, setRM] = useState(true);
  const [configLoading, setCL] = useState(false);
  const [visiable, setVisiable] = useState(false);

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
  const [maxSpeed, setMaxSpeed] = useState(140);
  const [cpCounter, setCpCounter] = useState(0);
  const [nextPointNumber, setNextPointNumber] = useState(0);
  const [nextPointName, setNextPointName] = useState("");
  const [nextPointType, setNextPointType] = useState("");
  const [jumpPointID, setJumpPointID] = useState("");
  const [debugData, setDebugData] = useState("");
  const [total, setTotal] = useState(0);
  const [partial, setPartial] = useState(0);
  const [telemetry, setTelemetry] = useState<TelemetryData[]>([]);
  const [speedExceeds, setSpeedExceeds] = useState("");
  const [jumpSuggestion, setJumpSuggestion] = useState(false);
  const [captured, setCaptured] = useState(false);

  // roadbook
  const [rbSlides, setRBSlides] = useState<RoadbookSlide[]>([]);
  const [rbImages, setRBImages] = useState<Record<string, ImageData>>({});
  const [currentRBIndex, setCurrentRBIndex] = useState(0);

  const goNext = useCallback(() => {
    setCurrentRBIndex((prev) => Math.min(prev + 1, rbSlides.length - 1));
  }, [rbSlides.length]);

  const goPrev = useCallback(() => {
    setCurrentRBIndex((prev) => Math.max(prev - 1, 0));
  }, []);

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
      const rawState = await invoke<string>("get_snapshot");
      if (rawState) {
        const state: AppState = parseState(rawState);
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

    const fetchRoadbook = async () => {
      const slidesList: RoadbookSlide[] = JSON.parse(
        await invoke("get_roadbook"),
      );
      setRBSlides(slidesList);
    };

    fetchRoadbook();
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

    const fetchRoadbook = async () => {
      const slidesList: RoadbookSlide[] = JSON.parse(
        await invoke("get_roadbook"),
      );
      setRBSlides(slidesList);
    };

    fetchRoadbook();
    adminCheck();
    setCurrentRBIndex(0);
  }, [coad]);

  useEffect(() => {
    const loadImages = async () => {
      const loaded: Record<string, ImageData> = {};
      for (const slide of rbSlides) {
        const key = `${slide.subdir}/${slide.name}`;
        try {
          const img: ImageData = await invoke("get_roadbook_image", {
            subdir: slide.subdir,
            name: slide.name,
          });
          loaded[key] = img;
        } catch (e) {
          console.error(`Failed to load image ${key}:`, e);
        }
      }
      setRBImages(loaded);
    };
    if (rbSlides.length > 0) {
      loadImages();
    }
  }, [rbSlides]);

  useEffect(() => {
    const batteryCheck = async () => {
      const battery = await getBatteryInfo();
      setBatteryLevel(battery.level ? battery.level : 0);
      setCharging(battery.isCharging ? battery.isCharging : false);
    };
    batteryCheck();
  }, [speed]);

  useEffect(() => {
    const unlistenTelemetry = listen<string>("send_telemetry", async (event) => {
      try {
        const telemetryData = JSON.parse(event.payload) as TelemetryData;
        const device = await getDeviceInfo();

        telemetryData.device_id = device.uuid as string;
        telemetryData.time = Date.now();

        await send_telemetry(telemetryData);
        setTelemetry((prev) => [...prev, telemetryData]);
      } catch (e) {
        console.error("Failed to parse telemetry event:", e);
      }
    });

    const unlistenReport = listen<string>("send_report", async (event) => {
      try {
        const reportData = JSON.parse(event.payload);
        const device = await getDeviceInfo();

        reportData.device_id = device.uuid as string;
        reportData.time = Date.now();

        await send_report(reportData);
      } catch (e) {
        console.error("Failed to parse report event:", e);
      }
    });

    return () => {
      unlistenTelemetry.then((u) => u());
      unlistenReport.then((u) => u());
    };
  }, []);

  const setRaceNumber = async (rn: string) => {
    setRN(rn);
    await invoke("set_race_number", { value: rn });
    adminMode ? callView("admin-area") : callView("navigate");
  };

  const setCodeOfDay = async (code: string) => {
    const device = await getDeviceInfo();
    if (code === "") {
      callView("navigate");
      setAM(false);
      await invoke<string>("activate_code", { code: "" });
      return;
    }
    if (code === "007") {
      await invoke<string>("activate_code", { code: code });
      toast.success(`ADMIN mode activated`, {
        position: "bottom-center",
        duration: 5000,
      });
      setAM(true);
      callView("navigate");
      return;
    }
    setCL(true);
    request_config(device.uuid as string)
      .then(async (resp) => {
        if (resp) {
          await invoke<string>("activate_code", { code: code });
          toast.success(`Config updated`, {
            position: "bottom-center",
            duration: 5000,
          });
        }
      })
      .catch(async (_) => {
        await invoke<string>("activate_code", { code: code });
        toast.error(`Loaded config without update`, {
          position: "bottom-center",
          duration: 5000,
        });
      })
      .finally(async () => {
        setCL(false);
        setCoad(code);
        if (code === "DEMO") {
          setDemoMode(true);
        }
        callView("navigate");
      });
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
    debugData,
    activeCode: coad,

    adminMode,
    navMode,
    demoMode,
    roadbookMode,
    mobileView,
    requestMode,
    configLoading,
    visiable,

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
    nextPointType,
    jumpPointID,
    total,
    partial,
    jumpSuggestion,
    telemetry,
    speedExceeds,
    captured,

    rbSlides,
    rbImages,
    currentRBIndex,

    gpsAccurancy,
    batteryLevel,
    charging,

    setRaceNumber,
    setDebugData,
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
    setRoadbookMode,
    setDtw,
    setCog,
    setCtw,
    setCpCounter,
    setNextPointNumber,
    setNextPointName,
    setMaxSpeed,
    setTotal,
    setPartial,
    setVisiable,
    setTelemetry,
    setSpeedExceeds,
    setNextPointType,
    setRBSlides,
    setRBImages,
    setCurrentRBIndex,
    goNext,
    goPrev,
    setJumpPointID,
    setJumpSuggestion,
    setCaptured,
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
