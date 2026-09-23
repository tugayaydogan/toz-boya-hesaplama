import { ScaleDefinition, ScaleState } from "./types";

export const SCALE_DEFINITIONS: ScaleDefinition[] = [
  {
    id: 1,
    scale_no: 1,
    scale_name: "Tartı 1",
    station_no: 1,
  },
  {
    id: 2,
    scale_no: 2,
    scale_name: "Tartı 2",
    station_no: 1,
  },
  {
    id: 3,
    scale_no: 3,
    scale_name: "Tartı 3",
    station_no: 2,
  },
  {
    id: 4,
    scale_no: 4,
    scale_name: "Tartı 4",
    station_no: 2,
  },
  {
    id: 5,
    scale_no: 5,
    scale_name: "Tartı 5",
    station_no: 3,
  },
];

export const INITIAL_WEIGHTS: Record<number, number> = {
  1: 120.5,
  2: 96.8,
  3: 140.25,
  4: 110.4,
  5: 85.75,
};

export function createInitialScales(): ScaleState[] {
  return SCALE_DEFINITIONS.map((scale) => {
    const initialWeight = INITIAL_WEIGHTS[scale.scale_no] ?? 100;

    return {
      ...scale,

      startWeight: initialWeight,

      processWeight: initialWeight,

      currentWeight: initialWeight,

      consumption: 0,
    };
  });
}

export function formatSimulationTime(seconds: number) {
  const safeSeconds = Math.floor(seconds);

  const hours = Math.floor(safeSeconds / 3600);

  const minutes = Math.floor((safeSeconds % 3600) / 60);

  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours} sa ${minutes} dk ${remainingSeconds} sn`;
  }

  return `${minutes} dk ${remainingSeconds} sn`;
}
