import { Coords } from "@/types/state";
import { useMemo } from "react";

type Props = {
  trackPoints: Coords[];
  width?: number;
  height?: number;
};

type PointM = {
  x: number;
  y: number;
};

const METERS_PER_DEGREE_LAT = 111320;

function metersPerDegreeLon(lat: number) {
  return 111320 * Math.cos((lat * Math.PI) / 180);
}

function toMeters(point: Coords, refLat: number, refLon: number): PointM {
  const mPerLon = metersPerDegreeLon(refLat);
  return {
    x: (point.lon - refLon) * mPerLon,
    y: (point.lat - refLat) * METERS_PER_DEGREE_LAT,
  };
}

export function RouteMap({
  trackPoints,
  width = 800,
  height = 500,
}: Props) {
  const { polylinePoints, scaleBarWidth, scaleBarLabel } = useMemo(() => {
    if (trackPoints.length < 2) {
      return {
        polylinePoints: "",
        scaleBarWidth: 0,
        scaleBarLabel: "500 m",
        view: null as null | {
          offsetX: number;
          offsetY: number;
          contentWidthPx: number;
          contentHeightPx: number;
        },
      };
    }

    const minLat = Math.min(...trackPoints.map((p) => p.lat));
    const maxLat = Math.max(...trackPoints.map((p) => p.lat));
    const minLon = Math.min(...trackPoints.map((p) => p.lon));
    // const maxLon = Math.max(...trackPoints.map((p) => p.lon));

    const refLat = (minLat + maxLat) / 2;
    const refLon = minLon;

    const pointsM = trackPoints.map((p) => toMeters(p, refLat, refLon));

    const minX = Math.min(...pointsM.map((p) => p.x));
    const maxX = Math.max(...pointsM.map((p) => p.x));
    const minY = Math.min(...pointsM.map((p) => p.y));
    const maxY = Math.max(...pointsM.map((p) => p.y));

    const contentWidthMeters = Math.max(maxX - minX, 1);
    const contentHeightMeters = Math.max(maxY - minY, 1);

    const padding = 24;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2 - 40;

    const pixelsPerMeter = Math.min(
      usableWidth / contentWidthMeters,
      usableHeight / contentHeightMeters
    ) * 0.95;

    const contentWidthPx = contentWidthMeters * pixelsPerMeter;
    const contentHeightPx = contentHeightMeters * pixelsPerMeter;

    const offsetX = padding + (usableWidth - contentWidthPx) / 2;
    const offsetY = padding + (usableHeight - contentHeightPx) / 2;

    const polylinePoints = pointsM
      .map((p) => {
        const x = offsetX + (p.x - minX) * pixelsPerMeter;
        const y = offsetY + contentHeightPx - (p.y - minY) * pixelsPerMeter;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    let barWidth = 500

    if (pixelsPerMeter < 10) {
      barWidth = 1000
    }
    if (pixelsPerMeter < 1) {
      barWidth = 5000
    }

    const scaleBarWidth = barWidth * pixelsPerMeter;

    return {
      polylinePoints,
      scaleBarWidth,
      scaleBarLabel: `${barWidth} m ${pixelsPerMeter.toFixed(2)}`,
      view: { offsetX, offsetY, contentWidthPx, contentHeightPx },
    };
  }, [trackPoints, width, height]);

  if (trackPoints.length < 2) {
    return <div>Not enough points to draw route</div>;
  }

  const scaleBarX = 24;
  const scaleBarY = height - 28;

  return (
    <svg width={width} height={height} style={{ background: "#fff", display: "block" }}>
      <polyline
        points={polylinePoints}
        fill="none"
        stroke="#2563eb"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <circle
        cx={polylinePoints ? Number(polylinePoints.split(" ").at(-1)?.split(",")[0]) : 0}
        cy={polylinePoints ? Number(polylinePoints.split(" ").at(-1)?.split(",")[1]) : 0}
        r={5}
        fill="#ef4444"
      />

      <g>
        <line
          x1={scaleBarX}
          y1={scaleBarY}
          x2={scaleBarX + scaleBarWidth}
          y2={scaleBarY}
          stroke="#111"
          strokeWidth={2}
        />
        <line
          x1={scaleBarX}
          y1={scaleBarY - 7}
          x2={scaleBarX}
          y2={scaleBarY + 7}
          stroke="#111"
          strokeWidth={2}
        />
        <line
          x1={scaleBarX + scaleBarWidth}
          y1={scaleBarY - 7}
          x2={scaleBarX + scaleBarWidth}
          y2={scaleBarY + 7}
          stroke="#111"
          strokeWidth={2}
        />
        <text
          x={scaleBarX + scaleBarWidth / 2}
          y={scaleBarY - 10}
          textAnchor="middle"
          dominantBaseline="ideographic"
          fontSize="14"
          fill="#111"
        >
          {scaleBarLabel}
        </text>
      </g>
    </svg>
  );
}