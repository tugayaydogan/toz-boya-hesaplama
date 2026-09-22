import { ScaleState } from "./types";

export const SIMULATION_TICK_MS = 250;

export const SIMULATION_SPEED = 30;

/*
  kg / simülasyon dakikası
*/
const CONSUMPTION_RATE: Record<number, number> = {
  1: 0.3,
  2: 0.14,
  3: 0.35,
  4: 0.17,
  5: 0.2,
};

function randomBetween(
  min: number,
  max: number
) {
  return (
    Math.random() * (max - min) + min
  );
}

export function simulateScaleTick(
  scale: ScaleState
): ScaleState {
  const baseRate =
    CONSUMPTION_RATE[scale.scale_no] ?? 0.1;

  /*
    250 ms gerçek zaman
    ×30 hız
    = 7.5 simülasyon saniyesi
    = 0.125 simülasyon dakikası
  */
  const simulatedMinutes =
    (SIMULATION_TICK_MS / 1000) *
    SIMULATION_SPEED /
    60;

  /*
    Proses tüketiminde küçük doğal değişim.
    ±%4
  */
  const processVariation =
    randomBetween(0.96, 1.04);

  const consumptionDelta =
    baseRate *
    simulatedMinutes *
    processVariation;

  /*
    Gerçek sanal fiziksel ağırlık.

    Ölçüm gürültüsü buna eklenmez.
  */
  const newProcessWeight =
    Math.max(
      0,
      scale.processWeight -
        consumptionDelta
    );

  /*
    Tartının anlık okuma gürültüsü:
    ±3 gram.

    Bu yalnızca gösterilen ölçümü etkiler.
  */
  const measurementNoise =
    randomBetween(-0.003, 0.003);

  const measuredWeight =
    Math.max(
      0,
      newProcessWeight +
        measurementNoise
    );

  /*
    Gerçek sistemde tüketim başlangıç
    ve anlık tartı okumasının farkıdır.
  */
  const consumption =
    Math.max(
      0,
      scale.startWeight -
        measuredWeight
    );

  return {
    ...scale,

    processWeight:
      newProcessWeight,

    currentWeight:
      measuredWeight,

    consumption,
  };
}