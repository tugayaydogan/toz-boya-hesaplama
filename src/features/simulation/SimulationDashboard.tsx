"use client";

import Link from "next/link";

import { useEffect, useRef, useState } from "react";

import { createInitialScales, formatSimulationTime } from "./data";

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
  Info,
  JsonViewer,
  MainButton,
  MessageBox,
  Metric,
  Panel,
  StatusItem,
  TableCell,
  TableHeader,
} from "./ui";

import ScaleCard from "./ScaleCard";
import ProcessOverview from "./ProcessOverview";

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

  async function startJobFromERP() {
    if (systemState !== "IDLE") {
      return;
    }

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
      START_JOB geldiği anda
      başlangıç tartı değerlerini alıyoruz.
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

        message: `ERP START_JOB alındı. İş Emri: ${workOrderNo}`,
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

        message: "x30 simülasyon başlatıldı.",
      },
    ]);

    intervalRef.current = setInterval(() => {
      setSimulatedSeconds(
        (previous) => previous + (SIMULATION_TICK_MS / 1000) * SIMULATION_SPEED,
      );

      setScales((previous) =>
        previous.map((scale) => simulateScaleTick(scale)),
      );
    }, SIMULATION_TICK_MS);
  }

  function endJobFromERP() {
    if (!job || systemState !== "RUNNING") {
      return;
    }

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
      Gerçek sistem mantığı:

      consumption =
      startWeight - endWeight
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

    const totalConsumption = scaleResults.reduce(
      (total, result) => total + result.consumption,
      0,
    );

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

    const historyRecord: CompletedJobRecord = {
      ...message,

      id: `${job.workOrderNo}-${Date.now()}`,

      startedAt: job.startedAt,

      completedAt: new Date().toISOString(),
    };

    void saveCompletedJob(historyRecord);

    setSystemState("COMPLETED");

    addEvent("ERP END_JOB sinyali alındı.", "INFO");

    addEvent("5 tartının bitiş değerleri kaydedildi.", "INFO");

    addEvent("Tüketim = Başlangıç - Bitiş hesaplandı.", "SUCCESS");

    addEvent("JOB_COMPLETED cevabı ERP için hazırlandı.", "SUCCESS");

    addEvent("Simülasyon sonucu iş geçmişine kaydedildi.", "SUCCESS");
  }

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

  const totalConsumption = scales.reduce(
    (total, scale) => total + scale.consumption,
    0,
  );

  function statusText() {
    if (running) {
      return "ÜRETİM ÇALIŞIYOR";
    }

    if (finished) {
      return "İŞ TAMAMLANDI";
    }

    return "ERP START_JOB BEKLENİYOR";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "32px",

        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* HEADER */}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          flexWrap: "wrap",

          marginBottom: "25px",
        }}
      >
        <div>
          <h1
            style={{
              marginBottom: "6px",
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

                marginTop: "15px",

                padding: "10px 16px",

                background: "#334155",

                color: "white",

                textDecoration: "none",

                borderRadius: "8px",

                fontWeight: "bold",
              }}
            >
              İŞ GEÇMİŞİ
            </Link>
          )}
        </div>

        <button
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

      {/* ERP KONTROL */}

      <Panel>
        <h2
          style={{
            marginTop: 0,
          }}
        >
          ERP Sinyal Simülatörü
        </h2>

        <p
          style={{
            color: "#94a3b8",
          }}
        >
          Gerçek sistemde ERP tarafından gönderilen START_JOB ve END_JOB
          sinyallerini simüle eder.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          <MainButton
            onClick={startJobFromERP}
            disabled={systemState !== "IDLE"}
          >
            ERP → İŞ BAŞLAT
          </MainButton>

          <MainButton onClick={endJobFromERP} disabled={!running}>
            ERP → İŞ BİTİR
          </MainButton>

          <MainButton onClick={resetSimulation}>SIFIRLA</MainButton>

          <StatusItem label="Durum" value={statusText()} />

          <StatusItem
            label="Simülasyon"
            value={formatSimulationTime(simulatedSeconds)}
          />

          <StatusItem label="Hız" value="x30" />
        </div>
      </Panel>

      {/* AKTİF İŞ */}

      <Panel>
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Aktif İş
        </h2>

        {job ? (
          <div
            style={{
              display: "flex",
              gap: "50px",
              flexWrap: "wrap",
            }}
          >
            <Info title="İş Emri" value={job.workOrderNo} />

            <Info
              title="Başlangıç"
              value={new Date(job.startedAt).toLocaleString("tr-TR")}
            />

            <Info title="Durum" value={statusText()} />
          </div>
        ) : (
          <div
            style={{
              color: "#64748b",
            }}
          >
            ERP START_JOB sinyali bekleniyor.
          </div>
        )}
      </Panel>

      {/* TEKNİK ERP MESAJLARI */}

      {!presentationMode && (
        <Panel>
          <h2
            style={{
              marginTop: 0,
            }}
          >
            ERP Mesaj Monitörü
          </h2>

          <div
            style={{
              display: "grid",

              gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",

              gap: "20px",
            }}
          >
            <MessageBox title="ERP → Tartım Sistemi" badge="GELEN">
              {erpSignals.length ? (
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

      {/* PROSES */}

      <ProcessOverview scales={scales} running={running} finished={finished} />

      {/* ÖZET */}

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

          <Metric title="Aktif Tartı" value="5" />
        </div>
      </Panel>

      {/* İSTASYONLAR */}

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
            <h2>İstasyon {stationNo}</h2>

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

      {/* EVENT LOG */}

      {!presentationMode && (
        <Panel>
          <h2
            style={{
              marginTop: 0,
            }}
          >
            Sistem Günlüğü
          </h2>

          {eventLogs.length ? (
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

      {/* SONUÇ */}

      {finished && outgoingMessage && (
        <Panel>
          <h2
            style={{
              marginTop: 0,
            }}
          >
            ERP&apos;ye Gönderilecek Tüketim Sonucu
          </h2>

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
                    <TableCell>İstasyon {result.stationNo}</TableCell>

                    <TableCell>Tartı {result.scaleNo}</TableCell>

                    <TableCell>{result.startWeight.toFixed(3)} kg</TableCell>

                    <TableCell>{result.endWeight.toFixed(3)} kg</TableCell>

                    <TableCell>{result.consumption.toFixed(3)} kg</TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: "30px",
            }}
          >
            <Metric
              title="Toplam Tüketim"
              value={`${outgoingMessage.totalConsumption.toFixed(3)} kg`}
            />
          </div>
        </Panel>
      )}
    </main>
  );
}
