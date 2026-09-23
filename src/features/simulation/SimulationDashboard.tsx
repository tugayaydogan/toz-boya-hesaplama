"use client";

import Link from "next/link";

import { useEffect, useRef, useState } from "react";

import {
  createInitialScales,
  formatSimulationTime,
  STATION_NAMES,
} from "./data";

import {
  SIMULATION_SPEED,
  SIMULATION_TICK_MS,
  simulateScaleTick,
} from "./simulator";

import type {
  CompletedJobRecord,
  EndJobSignal,
  ErpSignal,
  EventLevel,
  EventLog,
  Job,
  OutgoingMessage,
  ScaleState,
  SimulationState,
  StartJobSignal,
} from "./types";

import { getCompletedJobs, saveCompletedJob } from "./storage";

import {
  EmptyMessage,
  EventRow,
  JsonViewer,
  MessageBox,
  Metric,
  Panel,
  TableCell,
  TableHeader,
} from "./ui";

import ScaleCard from "./ScaleCard";
import ProcessOverview from "./ProcessOverview";
import DemoControlBar from "./DemoControlBar";

export default function SimulationDashboard() {
  const [scales, setScales] = useState<ScaleState[]>(createInitialScales());

  const [job, setJob] = useState<Job | null>(null);

  const [systemState, setSystemState] = useState<SimulationState>("IDLE");

  const [simulatedSeconds, setSimulatedSeconds] = useState(0);

  const [erpSignals, setErpSignals] = useState<ErpSignal[]>([]);

  const [outgoingMessage, setOutgoingMessage] =
    useState<OutgoingMessage | null>(null);

  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);

  const [presentationMode, setPresentationMode] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logIdRef = useRef(1);

  const running = systemState === "RUNNING";

  const finished = systemState === "COMPLETED";

  /*
    Sayfadan çıkıldığında çalışan
    interval varsa temizlenir.
  */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  function addEvent(
    message: string,
    level: EventLevel = "INFO",
    time = simulatedSeconds,
  ) {
    setEventLogs((previous) => [
      ...previous,
      {
        id: logIdRef.current++,

        time: formatSimulationTime(time),

        level,

        message,
      },
    ]);
  }

  /*
    ERP START_JOB
  */

  async function startJobFromERP() {
    if (systemState !== "IDLE") {
      return;
    }

    /*
      Geçmiş işlere bakıp
      sıradaki iş emri numarasını üret.
    */
    const previousJobs = await getCompletedJobs();

    const highestJobNumber = previousJobs.reduce((highest, previousJob) => {
      const match = previousJob.workOrderNo.match(/WO-2026-(\d+)/);

      if (!match) {
        return highest;
      }

      const number = Number(match[1]);

      return Math.max(highest, number);
    }, 0);

    const nextJobNumber = highestJobNumber + 1;

    const workOrderNo = `WO-2026-${String(nextJobNumber).padStart(3, "0")}`;

    const startedAt = new Date().toISOString();

    const newJob: Job = {
      workOrderNo,
      startedAt,
    };

    const startSignal: StartJobSignal = {
      messageType: "START_JOB",

      source: "ERP",

      workOrderNo,
    };

    /*
      START_JOB anında
      tartıların başlangıç değerleri alınır.
    */
    const initialScales = createInitialScales();

    setScales(initialScales);

    setJob(newJob);

    setErpSignals([startSignal]);

    setOutgoingMessage(null);

    setSimulatedSeconds(0);

    setSystemState("RUNNING");

    setEventLogs([
      {
        id: logIdRef.current++,

        time: "0 dk 0 sn",

        level: "SUCCESS",

        message: `ERP START_JOB sinyali alındı. İş Emri: ${workOrderNo}`,
      },

      {
        id: logIdRef.current++,

        time: "0 dk 0 sn",

        level: "INFO",

        message: "5 tartının başlangıç değerleri kaydedildi.",
      },

      {
        id: logIdRef.current++,

        time: "0 dk 0 sn",

        level: "SUCCESS",

        message: "x30 tartım simülasyonu başlatıldı.",
      },
    ]);

    /*
      Sanal tartım motoru.
    */

    intervalRef.current = setInterval(() => {
      setSimulatedSeconds(
        (previous) => previous + (SIMULATION_TICK_MS / 1000) * SIMULATION_SPEED,
      );

      setScales((previous) =>
        previous.map((scale) => simulateScaleTick(scale)),
      );
    }, SIMULATION_TICK_MS);
  }

  /*
    ERP END_JOB
  */

  async function endJobFromERP() {
    if (!job || systemState !== "RUNNING") {
      return;
    }

    /*
      END_JOB geldiği anda
      tartılar durdurulur.
    */

    if (intervalRef.current) {
      clearInterval(intervalRef.current);

      intervalRef.current = null;
    }

    const endSignal: EndJobSignal = {
      messageType: "END_JOB",

      source: "ERP",

      workOrderNo: job.workOrderNo,
    };

    setErpSignals((previous) => [...previous, endSignal]);

    /*
      GERÇEK SİSTEM MANTIĞI

      TÜKETİM =
      BAŞLANGIÇ AĞIRLIĞI
      -
      BİTİŞ AĞIRLIĞI
    */

    const scaleResults = scales.map((scale) => {
      const consumption = Math.max(0, scale.startWeight - scale.currentWeight);

      return {
        stationNo: scale.station_no,

        scaleNo: scale.scale_no,

        startWeight: Number(scale.startWeight.toFixed(3)),

        endWeight: Number(scale.currentWeight.toFixed(3)),

        consumption: Number(consumption.toFixed(3)),
      };
    });

    /*
      5 tartının toplam tüketimi.
    */

    const totalConsumption = scaleResults.reduce(
      (total, result) => total + result.consumption,
      0,
    );

    /*
      ERP'ye gönderilecek
      simüle edilmiş cevap.
    */

    const message: OutgoingMessage = {
      messageType: "JOB_COMPLETED",

      target: "ERP",

      workOrderNo: job.workOrderNo,

      status: "COMPLETED",

      simulatedDurationSeconds: simulatedSeconds,

      totalConsumption: Number(totalConsumption.toFixed(3)),

      scaleResults,
    };

    setOutgoingMessage(message);

    /*
      IndexedDB kayıt modeli.
    */

    const historyRecord: CompletedJobRecord = {
      ...message,

      id: `${job.workOrderNo}-${Date.now()}`,

      startedAt: job.startedAt,

      completedAt: new Date().toISOString(),
    };

    /*
      İş sonucu lokal veritabanına
      kaydedilir.
    */

    await saveCompletedJob(historyRecord);

    setSystemState("COMPLETED");

    addEvent("ERP END_JOB sinyali alındı.", "INFO");

    addEvent("5 tartının bitiş değerleri kaydedildi.", "INFO");

    addEvent("Tüketim = Başlangıç - Bitiş hesaplandı.", "SUCCESS");

    addEvent("JOB_COMPLETED cevabı ERP için hazırlandı.", "SUCCESS");

    addEvent("Simülasyon sonucu IndexedDB veritabanına kaydedildi.", "SUCCESS");
  }

  /*
    SIMÜLASYONU SIFIRLA
  */

  function resetSimulation() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);

      intervalRef.current = null;
    }

    setSystemState("IDLE");

    setJob(null);

    setScales(createInitialScales());

    setSimulatedSeconds(0);

    setErpSignals([]);

    setOutgoingMessage(null);

    setEventLogs([]);
  }

  /*
    CANLI TOPLAM TÜKETİM
  */

  const totalConsumption = scales.reduce(
    (total, scale) => total + scale.consumption,
    0,
  );

  return (
    <main
      style={{
        minHeight: "100vh",

        background: "#0f172a",

        color: "white",

        padding: "26px",

        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* ========================= */}
      {/* HEADER                    */}
      {/* ========================= */}

      <header
        style={{
          display: "flex",

          justifyContent: "space-between",

          alignItems: "flex-start",

          gap: "20px",

          flexWrap: "wrap",

          marginBottom: "20px",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 6px 0",

              fontSize: "22px",
            }}
          >
            Endüstriyel Tartım Simülatörü
          </h1>

          <p
            style={{
              margin: 0,

              color: "#94a3b8",
            }}
          >
            Node-RED Tartım ve ERP Entegrasyon Demo Sistemi
          </p>

          {!presentationMode && (
            <Link
              href="/history"
              style={{
                display: "inline-block",

                marginTop: "12px",

                padding: "9px 14px",

                background: "#334155",

                color: "white",

                textDecoration: "none",

                borderRadius: "8px",

                fontWeight: "bold",

                fontSize: "12px",
              }}
            >
              İŞ GEÇMİŞİ
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setPresentationMode((previous) => !previous)}
          style={{
            padding: "11px 18px",

            background: presentationMode ? "#1d4ed8" : "#334155",

            border: "1px solid #475569",

            borderRadius: "9px",

            color: "white",

            cursor: "pointer",

            fontWeight: "bold",
          }}
        >
          {presentationMode ? "TEKNİK MODA DÖN" : "SUNUM MODU"}
        </button>
      </header>

      {/* ========================= */}
      {/* ÜST KONTROL MERKEZİ       */}
      {/* ========================= */}

      <DemoControlBar
        job={job}
        scales={scales}
        systemState={systemState}
        simulatedSeconds={simulatedSeconds}
        totalConsumption={totalConsumption}
        onStart={() => {
          void startJobFromERP();
        }}
        onFinish={() => {
          void endJobFromERP();
        }}
        onReset={resetSimulation}
      />

      {/* ========================= */}
      {/* TEKNİK ERP MESAJLARI      */}
      {/* ========================= */}

      {!presentationMode && (
        <Panel>
          <h2
            style={{
              marginTop: 0,
            }}
          >
            ERP Mesaj Monitörü
          </h2>

          <p
            style={{
              color: "#94a3b8",

              fontSize: "13px",
            }}
          >
            Simülasyonda ERP ile tartım sistemi arasında gerçekleşen START_JOB,
            END_JOB ve JOB_COMPLETED mesajları.
          </p>

          <div
            style={{
              display: "grid",

              gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",

              gap: "20px",
            }}
          >
            <MessageBox title="ERP → Tartım Sistemi" badge="GELEN">
              {erpSignals.length > 0 ? (
                <JsonViewer data={erpSignals} />
              ) : (
                <EmptyMessage>ERP sinyali bekleniyor...</EmptyMessage>
              )}
            </MessageBox>

            <MessageBox
              title="Tartım Sistemi → ERP"
              badge={outgoingMessage ? "CEVAP HAZIR" : "BEKLİYOR"}
            >
              {outgoingMessage ? (
                <JsonViewer data={outgoingMessage} />
              ) : (
                <EmptyMessage>END_JOB sinyali bekleniyor...</EmptyMessage>
              )}
            </MessageBox>
          </div>
        </Panel>
      )}

      {/* ========================= */}
      {/* CANLI PROSES              */}
      {/* ========================= */}

      <ProcessOverview scales={scales} running={running} finished={finished} />

      {/* ========================= */}
      {/* CANLI ÖZET                */}
      {/* ========================= */}

      <Panel>
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Canlı Simülasyon Özeti
        </h2>

        <div
          style={{
            display: "flex",

            gap: "50px",

            flexWrap: "wrap",
          }}
        >
          <Metric
            title="Toplam Tüketim"
            value={`${totalConsumption.toFixed(3)} kg`}
          />

          <Metric
            title="Simülasyon Süresi"
            value={formatSimulationTime(simulatedSeconds)}
          />

          <Metric title="Tartı Sayısı" value="5" />

          <Metric title="İstasyon Sayısı" value="3" />
        </div>
      </Panel>

      {/* ========================= */}
      {/* İSTASYONLAR               */}
      {/* ========================= */}

      {[1, 2, 3].map((stationNo) => {
        const stationScales = scales.filter(
          (scale) => scale.station_no === stationNo,
        );

        return (
          <section
            key={stationNo}
            style={{
              marginBottom: "22px",

              background: "#1e293b",

              padding: "22px",

              borderRadius: "14px",
            }}
          >
            {/* İSTASYON BAŞLIĞI */}

            <div
              style={{
                display: "flex",

                justifyContent: "space-between",

                alignItems: "center",

                gap: "15px",

                marginBottom: "18px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  {STATION_NAMES[stationNo]}
                </h2>

                <div
                  style={{
                    color: "#94a3b8",

                    fontSize: "12px",

                    marginTop: "4px",
                  }}
                >
                  İstasyon {stationNo}
                </div>
              </div>

              <span
                style={{
                  padding: "6px 11px",

                  borderRadius: "20px",

                  background: running
                    ? "#14532d"
                    : finished
                      ? "#1e3a5f"
                      : "#334155",

                  fontSize: "11px",

                  fontWeight: "bold",
                }}
              >
                {running ? "CANLI" : finished ? "TAMAMLANDI" : "BEKLEME"}
              </span>
            </div>

            {/* TARTILAR */}

            <div
              style={{
                display: "flex",

                gap: "20px",

                flexWrap: "wrap",
              }}
            >
              {stationScales.map((scale) => (
                <ScaleCard
                  key={scale.id}
                  scale={scale}
                  running={running}
                  finished={finished}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* ========================= */}
      {/* TEKNİK EVENT LOG          */}
      {/* ========================= */}

      {!presentationMode && (
        <Panel>
          <h2
            style={{
              marginTop: 0,
            }}
          >
            Sistem Günlüğü
          </h2>

          {eventLogs.length > 0 ? (
            eventLogs
              .slice()
              .reverse()
              .map((event) => <EventRow key={event.id} event={event} />)
          ) : (
            <div
              style={{
                color: "#64748b",
              }}
            >
              Henüz sistem olayı yok.
            </div>
          )}
        </Panel>
      )}

      {/* ========================= */}
      {/* ERP SONUCU                */}
      {/* ========================= */}

      {finished && outgoingMessage && (
        <Panel>
          <div
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",

              gap: "20px",

              flexWrap: "wrap",

              marginBottom: "22px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                ERP&apos;ye Gönderilecek Tüketim Sonucu
              </h2>

              <div
                style={{
                  marginTop: "6px",

                  color: "#94a3b8",
                }}
              >
                İş Emri:{" "}
                <strong
                  style={{
                    color: "white",
                  }}
                >
                  {outgoingMessage.workOrderNo}
                </strong>
              </div>
            </div>

            <div
              style={{
                background: "#14532d",

                padding: "9px 15px",

                borderRadius: "20px",

                fontWeight: "bold",

                fontSize: "12px",
              }}
            >
              JOB_COMPLETED ✓
            </div>
          </div>

          {/* SONUÇ TABLOSU */}

          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",

                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <TableHeader>İstasyon</TableHeader>

                  <TableHeader>Tartı</TableHeader>

                  <TableHeader>Başlangıç</TableHeader>

                  <TableHeader>Bitiş</TableHeader>

                  <TableHeader>Tüketim</TableHeader>
                </tr>
              </thead>

              <tbody>
                {outgoingMessage.scaleResults.map((result) => (
                  <tr key={result.scaleNo}>
                    <TableCell>{STATION_NAMES[result.stationNo]}</TableCell>

                    <TableCell>Tartı {result.scaleNo}</TableCell>

                    <TableCell>{result.startWeight.toFixed(3)} kg</TableCell>

                    <TableCell>{result.endWeight.toFixed(3)} kg</TableCell>

                    <TableCell>
                      <strong>{result.consumption.toFixed(3)} kg</strong>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOPLAM */}

          <div
            style={{
              marginTop: "28px",
            }}
          >
            <Metric
              title="ERP'ye Gönderilecek Toplam Tüketim"
              value={`${outgoingMessage.totalConsumption.toFixed(3)} kg`}
            />
          </div>
        </Panel>
      )}
    </main>
  );
}
