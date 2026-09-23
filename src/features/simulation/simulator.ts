import type { ScaleState } from "./types";

export const SIMULATION_TICK_MS = 250;
export const SIMULATION_SPEED = 30;

/*
  Birim:
  kg / simülasyon dakikası

  Her tartının tüketim hızı birbirinden farklı.
*/
const CONSUMPTION_RATE: Record<number, number> = {
  1: 0.3,
  2: 0.14,
  3: 0.35,
  4: 0.17,
  5: 0.2,
};

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function simulateScaleTick(scale: ScaleState): ScaleState {
  const baseRate = CONSUMPTION_RATE[scale.scale_no] ?? 0.1;

  /*
    250 ms gerçek zaman
    x30 hız
    = 7.5 simülasyon saniyesi
  */
  const simulatedMinutes =
    ((SIMULATION_TICK_MS / 1000) * SIMULATION_SPEED) / 60;

  /*
    Proseste küçük doğal tüketim farkları.
  */
  const processVariation = randomBetween(0.96, 1.04);

  const consumptionDelta = baseRate * simulatedMinutes * processVariation;

  /*
    Sanal fiziksel ağırlık.
  */
  const newProcessWeight = Math.max(0, scale.processWeight - consumptionDelta);

  /*
    Tartı okumasında ±3 gram noise.
  */
  const measurementNoise = randomBetween(-0.003, 0.003);

  const measuredWeight = Math.max(0, newProcessWeight + measurementNoise);

  /*
    Gerçek sistemdeki temel hesap:
    tüketim = başlangıç - güncel ağırlık
  */
  const consumption = Math.max(0, scale.startWeight - measuredWeight);

  return {
    ...scale,

    processWeight: newProcessWeight,

    currentWeight: measuredWeight,

    consumption,
  };
}
