"use client";

import { useEffect, useState } from "react";

type StationStatus = "ready" | "running" | "completed";
type Scale = {
  id: number;
  name: string;
  currentWeight: number;
  startWeight?: number;
};
type Station = {
  id: number;
  name: string;
  scales: Scale[];
  status: StationStatus;
  workOrderNo?: string;
  startedAt?: string;
  totalConsumption?: number;
};
type ErpEvent = {
  id: number;
  time: string;
  stationName: string;
  type: "start" | "finish";
  message: string;
};

const initialStations: Station[] = [
  {
    id: 1,
    name: "İstasyon 1",
    status: "ready",
    scales: [
      { id: 1, name: "Tartı 1", currentWeight: 125.4 },
      { id: 2, name: "Tartı 2", currentWeight: 98.75 },
    ],
  },
  {
    id: 2,
    name: "İstasyon 2",
    status: "ready",
    scales: [
      { id: 3, name: "Tartı 3", currentWeight: 210.3 },
      { id: 4, name: "Tartı 4", currentWeight: 185.6 },
    ],
  },
  {
    id: 3,
    name: "İstasyon 3",
    status: "ready",
    scales: [{ id: 5, name: "Tartı 5", currentWeight: 76.2 }],
  },
];

const formatWeight = (weight: number) =>
  `${weight.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kg`;

const currentTime = () =>
  new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export default function Home() {
  const [stations, setStations] = useState<Station[]>(initialStations);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [erpEvents, setErpEvents] = useState<ErpEvent[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((previous) => previous + simulationSpeed);

      setStations((previousStations) =>
        previousStations.map((station) => {
          if (station.status !== "running") return station;

          return {
            ...station,
            scales: station.scales.map((scale) => ({
              ...scale,
              currentWeight: Math.max(
                0,
                Number(
                  (
                    scale.currentWeight -
                    (Math.random() * 0.012 + 0.003) * simulationSpeed
                  ).toFixed(2),
                ),
              ),
            })),
          };
        }),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [simulationSpeed]);

  const addErpEvent = (
    stationName: string,
    type: ErpEvent["type"],
    message: string,
  ) => {
    setErpEvents((previous) => [
      {
        id: Date.now() + Math.random(),
        time: currentTime(),
        stationName,
        type,
        message,
      },
      ...previous,
    ]);
  };

    const startWorkOrder = (stationId: number) => {
    const station = stations.find((item) => item.id === stationId);
    if (!station) return;

    const workOrderNo = `ERP-${Math.floor(100000 + Math.random() * 900000)}`;
    const startedAt = currentTime();

    addErpEvent(
      station.name,
      "start",
      `${workOrderNo} iş emri ERP'den alındı. Başlangıç tartıları kaydedildi.`,
    );

    setStations((previousStations) =>
      previousStations.map((item) =>
        item.id !== stationId
          ? item
          : {
              ...item,
              status: "running",
              workOrderNo,
              startedAt,
              totalConsumption: undefined,
              scales: item.scales.map((scale) => ({
                ...scale,
                startWeight: scale.currentWeight,
              })),
            },
      ),
    );
  };

  const finishWorkOrder = (stationId: number) => {
    const station = stations.find((item) => item.id === stationId);
    if (!station || station.status !== "running") return;

    const totalConsumption = station.scales.reduce(
      (total, scale) =>
        total +
        Math.max(
          0,
          (scale.startWeight ?? scale.currentWeight) - scale.currentWeight,
        ),
      0,
    );

    addErpEvent(
      station.name,
      "finish",
      `${station.workOrderNo} tamamlandı. ${formatWeight(totalConsumption)} tüketim bilgisi ERP'ye iletildi.`,
    );

    setStations((previousStations) =>
      previousStations.map((item) =>
        item.id !== stationId
          ? item
          : {
              ...item,
              status: "completed",
              totalConsumption,
            },
      ),
    );
  };
    const resetSimulation = () => {
    setStations(
      initialStations.map((station) => ({
        ...station,
        scales: station.scales.map((scale) => ({ ...scale })),
      })),
    );
    setErpEvents([]);
    setElapsedSeconds(0);
  };

  const statusLabel: Record<StationStatus, string> = {
    ready: "Hazır",
    running: "Çalışıyor",
    completed: "Tamamlandı",
  };

  const statusStyle: Record<StationStatus, string> = {
    ready: "bg-emerald-950 text-emerald-300",
    running: "bg-amber-950 text-amber-300",
    completed: "bg-cyan-950 text-cyan-300",
  };

  return (
    <main className="min-h-screen bg-[#020617] px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-slate-800 pb-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold tracking-wider text-cyan-400">
                ENDÜSTRİYEL TOZ BOYA SİMÜLASYONU
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                ERP Tüketim Takip Paneli
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Simülasyon süresi: {elapsedSeconds} saniye
              </p>
            </div>

                        <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={resetSimulation}
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-800"
              >
                Simülasyonu Sıfırla
              </button>

              <div className="flex overflow-hidden rounded-lg border border-cyan-900">
                {[1, 10, 30].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setSimulationSpeed(speed)}
                    className={`px-5 py-3 text-sm font-bold transition ${
                      simulationSpeed === speed
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-950 text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    x{speed}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section className="mt-10 grid gap-5 lg:grid-cols-3">
          {stations.map((station) => {
            const isRunning = station.status === "running";

            return (
              <article
                key={station.id}
                className={`rounded-2xl border p-5 ${
                  station.status === "running"
                    ? "border-amber-700 bg-amber-950/20"
                    : station.status === "completed"
                      ? "border-cyan-800 bg-cyan-950/20"
                      : "border-slate-800 bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{station.name}</h2>
                    {isRunning ? (
                      <>
                        <p className="mt-1 text-sm font-semibold text-amber-300">
                          İş emri aktif: {station.workOrderNo}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Başlangıç: {station.startedAt}
                        </p>
                      </>
                    ) : station.status === "completed" ? (
                      <p className="mt-1 text-sm font-semibold text-cyan-300">
                        Toplam tüketim: {formatWeight(station.totalConsumption ?? 0)}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-slate-400">
                        ERP iş emri bekleniyor
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[station.status]}`}
                  >
                    {statusLabel[station.status]}
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {station.scales.map((scale) => (
                    <div
                      key={scale.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <p className="text-sm text-slate-400">{scale.name}</p>
                      <p className="mt-1 text-2xl font-bold text-cyan-400">
                        {formatWeight(scale.currentWeight)}
                      </p>
                      {scale.startWeight !== undefined && (
                        <p className="mt-1 text-xs text-slate-500">
                          Başlangıç: {formatWeight(scale.startWeight)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  {station.status === "ready" && (
                    <button
                      onClick={() => startWorkOrder(station.id)}
                      className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
                    >
                      ERP İş Emri Başlat
                    </button>
                  )}

                  {isRunning && (
                    <button
                      onClick={() => finishWorkOrder(station.id)}
                      className="w-full rounded-lg bg-amber-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-300"
                    >
                      İşi Bitir ve Tüketimi Hesapla
                    </button>
                  )}

                  {station.status === "completed" && (
                    <p className="rounded-lg bg-cyan-950 px-4 py-3 text-center text-sm font-semibold text-cyan-200">
                      ERP’ye tüketim yanıtı gönderildi
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wider text-cyan-400">
                SİMÜLE ERP İLETİŞİM KAYDI
              </p>
              <h2 className="mt-1 text-xl font-bold">Olay Akışı</h2>
            </div>
            <span className="text-sm text-slate-400">
              {erpEvents.length} kayıt
            </span>
          </div>

          {erpEvents.length === 0 ? (
            <p className="mt-5 rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">
              Bir istasyonda iş emri başlattığında ERP olayları burada görünecek.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {erpEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950 p-4 md:flex-row md:items-center"
                >
                  <span className="w-16 font-mono text-xs text-slate-500">
                    {event.time}
                  </span>
                  <span
                    className={`w-fit rounded-full px-2 py-1 text-xs font-bold ${
                      event.type === "start"
                        ? "bg-amber-950 text-amber-300"
                        : "bg-cyan-950 text-cyan-300"
                    }`}
                  >
                    {event.type === "start" ? "ERP → İSTASYON" : "İSTASYON → ERP"}
                  </span>
                  <p className="text-sm text-slate-200">
                    <span className="font-semibold">{event.stationName}: </span>
                    {event.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}