import {
  RecipeItem,
  ScaleDefinition,
  ScaleState,
} from "./types";

import { SIMULATION_SPEED } from "./simulator";



export const JOB_DURATION_SIM_SECONDS =
  15 * 60;

export const REAL_JOB_DURATION_SECONDS =
  JOB_DURATION_SIM_SECONDS /
  SIMULATION_SPEED;

export const SCALE_DEFINITIONS: ScaleDefinition[] =
  [
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

export const INITIAL_WEIGHTS: Record<
  number,
  number
> = {
  1: 120.5,
  2: 96.8,
  3: 140.25,
  4: 110.4,
  5: 85.75,
};

export const DEMO_RECIPE: RecipeItem[] = [
  {
    scaleNo: 1,
    materialCode: "TB-9010-V",
    materialName:
      "RAL 9010 Beyaz - Taze Toz",
    plannedConsumption: 4.5,
    actualTargetConsumption: 4.62,
  },
  {
    scaleNo: 2,
    materialCode: "TB-9010-R",
    materialName:
      "RAL 9010 Beyaz - Geri Kazanım",
    plannedConsumption: 2.2,
    actualTargetConsumption: 2.1,
  },
  {
    scaleNo: 3,
    materialCode: "TB-9010-V",
    materialName:
      "RAL 9010 Beyaz - Taze Toz",
    plannedConsumption: 5.2,
    actualTargetConsumption: 5.34,
  },
  {
    scaleNo: 4,
    materialCode: "TB-9010-R",
    materialName:
      "RAL 9010 Beyaz - Geri Kazanım",
    plannedConsumption: 2.6,
    actualTargetConsumption: 2.48,
  },
  {
    scaleNo: 5,
    materialCode: "TB-9010-V",
    materialName:
      "RAL 9010 Beyaz - Taze Toz",
    plannedConsumption: 3,
    actualTargetConsumption: 3.05,
  },
];

export function createInitialScales(): ScaleState[] {
  return SCALE_DEFINITIONS.map(
    (scale) => {
      const startWeight =
        INITIAL_WEIGHTS[
          scale.scale_no
        ] ?? 100;

      return {
        ...scale,

        materialCode: "-",

        materialName:
          "ERP reçetesi bekleniyor",

        plannedConsumption: 0,

        startWeight,

processWeight: startWeight,

currentWeight: startWeight,

consumption: 0,

        consumptionPerRealSecond:
          0,
      };
    }
  );
}

export function formatSimulationTime(
  seconds: number
) {
  const hours =
    Math.floor(seconds / 3600);

  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    );

  const remainingSeconds =
    seconds % 60;

  if (hours > 0) {
    return `${hours} sa ${minutes} dk ${remainingSeconds} sn`;
  }

  return `${minutes} dk ${remainingSeconds} sn`;
}