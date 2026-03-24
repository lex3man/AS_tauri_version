import { useAppState } from "@/ctx/state-provider";
import {
    SignalHigh,
    SignalMedium,
    SignalLow,
    SignalZero,
    BatteryFull,
    BatteryMedium,
    BatteryLow,
    BatteryWarning,
    BatteryCharging,
} from "lucide-react";

const Indicators = () => {
    const { gpsAccurancy, batteryLevel, charging } = useAppState();

    const getSignalIcon = () => {
        if (gpsAccurancy === null || gpsAccurancy === undefined) {
            return <SignalZero className="h-full w-full text-muted-foreground" />;
        }

        if (gpsAccurancy <= 6) {
            return <SignalHigh className="h-full w-full" />;
        }

        if (gpsAccurancy <= 20) {
            return <SignalMedium className="h-full" />;
        }

        return <SignalLow className="h-full" />;
    };

    const getBatteryIcon = () => {
        if (charging) {
            return <BatteryCharging className="h-full w-full" />;
        }

        if (batteryLevel === null || batteryLevel === undefined) {
            return <BatteryWarning className="h-full text-muted-foreground" />;
        }

        if (batteryLevel >= 75) {
            return <BatteryFull className="h-full w-full" />;
        }

        if (batteryLevel >= 25) {
            return <BatteryMedium className="h-full" />;
        }

        return <BatteryLow className=" h-full" />;
    };

    return (
        <div className="flex gap-2 h-1/2 my-auto">
            {getSignalIcon()}
            {getBatteryIcon()}
        </div>
    );
};

export default Indicators;