"use client";

import { useEffect, useState } from "react";

type Scale = {
  name: string;
  value: number;
  startValue?: number;
};

type StationStatus = "Hazır" | "Çalışıyor" | "Tamamlandı";

type Station = {
  id: number;
  name: string;
  status: StationStatus;
  workOrderNo?: string;
  startTime?: string;
  consumption?: number;
  scales: Scale[];
};

const initialStations: Station[] = [
  {
    id: 1,
    name: "İstasyon 1",
    status: "Hazır",
    scales: [
      { name: "Tartı 1", value: 125.4 },
      { name: "Tartı 2", value: 98.75 },
    ],
  },
  {
    id: 2,
    name: "İstasyon 2",
    status: "Hazır",
    scales: [
      { name: "Tartı 3", value: 210.3 },
      { name: "Tartı 4", value: 185.6 },
    ],
  },
  {
    id: 3,
    name: "İstasyon 3",
    status: "Hazır",
    scales: [{ name: "Tartı 5", value: 76.2 }],
  },
];

function formatKg(value: number) {
  return `${value.toFixed(2).replace(".", ",")} kg`;
}

export default function Home() {
  const [stations, setStations] = useState(initialStations);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [simulationSeconds, setSimulationSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSimulationSeconds((current) => current + simulationSpeed);

      setStations((currentStations) =>
        currentStations.map((station) => {
          if (station.status !== "Çalışıyor") return station;

          return {
            ...station,
            scales: station.scales.map((scale, index) => {
              const consumptionRate = 0.002 + index * 0.0005;
              const decrease = consumptionRate * simulationSpeed;

              return {
                ...scale,
                value: Math.max(0, Number((scale.value - decrease).toFixed(3))),
              };
            }),
          };
        }),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [simulationSpeed]);

  function startWorkOrder(stationId: number) {
    setStations((currentStations) =>
      currentStations.map((station) => {
        if (station.id !== stationId || station.status === "Çalışıyor") {
          return station;
        }

        return {
          ...station,
          status: "Çalışıyor",
          workOrderNo: `ERP-${Date.now().toString().slice(-6)}`,
          startTime: new Date().toLocaleTimeString("tr-TR"),
          consumption: undefined,
          scales: station.scales.map((scale) => ({
            ...scale,
            startValue: scale.value,
          })),
        };
      }),
    );
  }

  function finishWorkOrder(stationId: number) {
    setStations((currentStations) =>
      currentStations.map((station) => {
        if (station.id !== stationId || station.status !== "Çalışıyor") {
          return station;
        }

        const totalConsumption = station.scales.reduce((total, scale) => {
          return total + ((scale.startValue ?? scale.value) - scale.value);
        }, 0);

        return {
          ...station,
          status: "Tamamlandı",
          consumption: Number(totalConsumption.toFixed(3)),
        };
      }),
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100 md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium tracking-widest text-cyan-400">
              ENDÜSTRİYEL TARTIM SİMÜLASYONU
            </p>
            <h1 className="text-3xl font-bold">ERP Tüketim Takip Paneli</h1>
            <p className="mt-2 text-sm text-slate-400">
              Simülasyon süresi: {simulationSeconds} saniye
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2">
            {[1, 10, 30].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimulationSpeed(speed)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  simulationSpeed === speed
                    ? "bg-cyan-400 text-slate-950"
                    : "text-cyan-100 hover:bg-cyan-500/20"
                }`}
              >
                x{speed}
              </button>
            ))}
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {stations.map((station) => {
            const isRunning = station.status === "Çalışıyor";
            const isFinished = station.status === "Tamamlandı";

            return (
              <article
                key={station.id}
                className={`rounded-2xl border p-5 shadow-lg ${
                  isRunning
                    ? "border-amber-400/60 bg-amber-500/10"
                    : isFinished
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-900"
                }`}
              >
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{station.name}</h2>

                    {isRunning && (
                      <>
                        <p className="mt-1 text-sm text-amber-300">
                          İş emri aktif: {station.workOrderNo}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Başlangıç: {station.startTime}
                        </p>
                      </>
                    )}

                    {isFinished && (
                      <p className="mt-1 text-sm font-semibold text-emerald-300">
                        Toplam tüketim: {formatKg(station.consumption ?? 0)}
                      </p>
                    )}

                    {station.status === "Hazır" && (
                      <p className="mt-1 text-sm text-slate-400">
                        ERP iş emri bekleniyor
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isRunning
                        ? "bg-amber-500/20 text-amber-300"
                        : isFinished
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-emerald-500/15 text-emerald-400"
                    }`}
                  >
                    {station.status}
                  </span>
                </div>

                <div className="space-y-3">
                  {station.scales.map((scale) => (
                    <div
                      key={scale.name}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <p className="text-sm text-slate-400">{scale.name}</p>
                      <p className="mt-1 text-2xl font-bold text-cyan-300">
                        {formatKg(scale.value)}
                      </p>

                      {scale.startValue !== undefined && (
                        <p className="mt-1 text-xs text-slate-500">
                          Başlangıç: {formatKg(scale.startValue)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {station.status === "Hazır" && (
                  <button
                    onClick={() => startWorkOrder(station.id)}
                    className="mt-6 w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    İş Emri Başlat
                  </button>
                )}

                {isRunning && (
                  <button
                    onClick={() => finishWorkOrder(station.id)}
                    className="mt-6 w-full rounded-lg bg-amber-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-300"
                  >
                    İşi Bitir ve Tüketimi Hesapla
                  </button>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}