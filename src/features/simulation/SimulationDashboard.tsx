"use client";

import Link from "next/link";
import {
  SIMULATION_SPEED,
  SIMULATION_TICK_MS,
  simulateScaleTick,
} from "./simulator";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  DEMO_RECIPE,
  INITIAL_WEIGHTS,
  REAL_JOB_DURATION_SECONDS,
  SCALE_DEFINITIONS,
  createInitialScales,
  formatSimulationTime,
} from "./data";

import {
  CompletedJobRecord,
  ErpSignal,
  EventLevel,
  EventLog,
  JobOrder,
  OutgoingMessage,
  ScaleState,
  SimulationState,
  StartJobSignal,
  EndJobSignal,
} from "./types";

import {
  saveCompletedJob,
} from "./storage";

import {
  Arrow,
  EmptyMessage,
  EventRow,
  FlowBox,
  Info,
  JsonViewer,
  MainButton,
  MessageBox,
  Metric,
  Panel,
  ScaleRow,
  StatusBadge,
  StatusItem,
  TableCell,
  TableHeader,
} from "./ui";

export default function SimulationDashboard() {
  const [scales, setScales] =
    useState<ScaleState[]>(
      createInitialScales()
    );

  const [jobOrder, setJobOrder] =
    useState<JobOrder | null>(null);

  const [systemState, setSystemState] =
    useState<SimulationState>("IDLE");

  const [
    simulatedSeconds,
    setSimulatedSeconds,
  ] = useState(0);

  const [
    nextJobNumber,
    setNextJobNumber,
  ] = useState(1);

  const [
    erpSignals,
    setErpSignals,
  ] = useState<ErpSignal[]>([]);

  const [
    outgoingMessage,
    setOutgoingMessage,
  ] =
    useState<OutgoingMessage | null>(
      null
    );

  const [eventLogs, setEventLogs] =
    useState<EventLog[]>([]);

  const intervalRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  const logIdRef = useRef(1);

  const running =
    systemState === "RUNNING";

  const finished =
    systemState === "COMPLETED";

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(
          intervalRef.current
        );
      }
    };
  }, []);

  function addEvent(
    message: string,
    level: EventLevel = "INFO",
    timeSeconds = simulatedSeconds
  ) {
    const event: EventLog = {
      id: logIdRef.current++,

      time:
        formatSimulationTime(
          timeSeconds
        ),

      level,

      message,
    };

    setEventLogs(
      (previous) => [
        ...previous,
        event,
      ]
    );
  }

  /*
    GERÇEK SİSTEM MANTIĞI:

    ERP'den START_JOB gelir.

    O anda:
    - iş emri alınır
    - tartıların başlangıç değerleri okunur
    - üretim başlar
  */
  function startJobFromERP() {
    if (systemState !== "IDLE") {
      return;
    }

    const newJob: JobOrder = {
      workOrderNo: `WO-2026-${String(
        nextJobNumber
      ).padStart(3, "0")}`,

      productCode: "HEX-001",

      productName:
        "Klima Eşanjörü",

      quantity: 250,

      recipeCode:
        "REC-RAL9010-001",

      recipe: DEMO_RECIPE,
    };

    const preparedScales =
      SCALE_DEFINITIONS.map(
        (scale) => {
          const recipeItem =
            newJob.recipe.find(
              (item) =>
                item.scaleNo ===
                scale.scale_no
            );

          const startWeight =
            INITIAL_WEIGHTS[
              scale.scale_no
            ] ?? 100;

          const actualTarget =
            recipeItem
              ?.actualTargetConsumption ??
            0;

          return {
            ...scale,

            materialCode:
              recipeItem
                ?.materialCode ?? "-",

            materialName:
              recipeItem
                ?.materialName ??
              "Malzeme tanımsız",

            plannedConsumption:
              recipeItem
                ?.plannedConsumption ??
              0,

            /*
              Demo için nominal tüketim
              yaklaşık 15 simülasyon
              dakikasına göre ayarlanıyor.

              Ancak işi bitiren şey süre değil,
              ERP END_JOB sinyali.
            */
            consumptionPerRealSecond:
              actualTarget /
              REAL_JOB_DURATION_SECONDS,

            startWeight,

processWeight:
  startWeight,

currentWeight:
  startWeight,

consumption: 0,
          };
        }
      );

    const startSignal: StartJobSignal = {
      messageType: "START_JOB",

      source: "ERP",

      workOrderNo:
        newJob.workOrderNo,

      productCode:
        newJob.productCode,

      productName:
        newJob.productName,

      quantity:
        newJob.quantity,

      recipeCode:
        newJob.recipeCode,
    };

    setJobOrder(newJob);

    setNextJobNumber(
      (previous) =>
        previous + 1
    );

    setScales(
      preparedScales
    );

    setErpSignals([
      startSignal,
    ]);

    setOutgoingMessage(
      null
    );

    setSimulatedSeconds(
      0
    );

    setSystemState(
      "RUNNING"
    );

    setEventLogs([
      {
        id:
          logIdRef.current++,

        time:
          "0 dk 0 sn",

        level:
          "SUCCESS",

        message:
          `ERP START_JOB sinyali alındı. İş Emri: ${newJob.workOrderNo}`,
      },

      {
        id:
          logIdRef.current++,

        time:
          "0 dk 0 sn",

        level:
          "INFO",

        message:
          "5 tartının başlangıç ağırlıkları kaydedildi.",
      },

      {
        id:
          logIdRef.current++,

        time:
          "0 dk 0 sn",

        level:
          "SUCCESS",

        message:
          "Üretim simülasyonu başlatıldı.",
      },
    ]);

    intervalRef.current =
      setInterval(() => {
        setSimulatedSeconds(
          (previous) =>
            previous +
            SIMULATION_SPEED
        );

        setScales(
          (previousScales) =>
            previousScales.map(
              (scale) => {
                const newWeight =
                  Math.max(
                    0,

                    scale.currentWeight -
                      scale.consumptionPerRealSecond
                  );

                return {
                  ...scale,

                  currentWeight:
                    newWeight,

                  consumption:
                    scale.startWeight -
                    newWeight,
                };
              }
            )
        );
      }, 1000);
  }

  /*
    ERP'den END_JOB gelir.

    O anda:
    - tartıların bitiş değerleri okunur
    - tüketim hesaplanır
    - ERP cevabı hazırlanır
  */
  function endJobFromERP() {
    if (
      systemState !==
        "RUNNING" ||
      !jobOrder
    ) {
      return;
    }

    if (intervalRef.current) {
      clearInterval(
        intervalRef.current
      );

      intervalRef.current =
        null;
    }

    const endSignal: EndJobSignal = {
      messageType: "END_JOB",

      source: "ERP",

      workOrderNo:
        jobOrder.workOrderNo,
    };

    setErpSignals(
      (previous) => [
        ...previous,
        endSignal,
      ]
    );

    const totalActual =
      scales.reduce(
        (total, scale) =>
          total +
          scale.consumption,
        0
      );

    const totalPlanned =
      scales.reduce(
        (total, scale) =>
          total +
          scale.plannedConsumption,
        0
      );

    const message: OutgoingMessage = {
      messageType:
        "JOB_COMPLETED",

      target: "ERP",

      workOrderNo:
        jobOrder.workOrderNo,

      status:
        "COMPLETED",

      completionReason:
        "ERP_END_SIGNAL",

      simulatedDurationSeconds:
        simulatedSeconds,

      totalPlannedConsumption:
        Number(
          totalPlanned.toFixed(3)
        ),

      totalActualConsumption:
        Number(
          totalActual.toFixed(3)
        ),

      totalDeviation:
        Number(
          (
            totalActual -
            totalPlanned
          ).toFixed(3)
        ),

      scaleResults:
        scales.map(
          (scale) => ({
            stationNo:
              scale.station_no,

            scaleNo:
              scale.scale_no,

            materialCode:
              scale.materialCode,

            startWeight:
              Number(
                scale.startWeight.toFixed(
                  3
                )
              ),

            endWeight:
              Number(
                scale.currentWeight.toFixed(
                  3
                )
              ),

            consumption:
              Number(
                scale.consumption.toFixed(
                  3
                )
              ),
          })
        ),
    };

    setOutgoingMessage(
      message
    );

    const historyRecord: CompletedJobRecord = {
      ...message,

      id:
        `${jobOrder.workOrderNo}-${Date.now()}`,

      productCode:
        jobOrder.productCode,

      productName:
        jobOrder.productName,

      quantity:
        jobOrder.quantity,

      recipeCode:
        jobOrder.recipeCode,

      completedAt:
        new Date().toISOString(),
    };

    saveCompletedJob(
      historyRecord
    );

    setSystemState(
      "COMPLETED"
    );

    addEvent(
      "ERP END_JOB sinyali alındı.",
      "INFO"
    );

    addEvent(
      "5 tartının bitiş ağırlıkları kaydedildi.",
      "INFO"
    );

    addEvent(
      "Tüketim = Başlangıç ağırlığı - Bitiş ağırlığı hesaplandı.",
      "SUCCESS"
    );

    addEvent(
      "JOB_COMPLETED cevabı ERP için hazırlandı.",
      "SUCCESS"
    );

    addEvent(
      "İş sonucu geçmişe kaydedildi.",
      "SUCCESS"
    );
  }

  function resetSimulation() {
    if (intervalRef.current) {
      clearInterval(
        intervalRef.current
      );

      intervalRef.current =
        null;
    }

    setSystemState(
      "IDLE"
    );

    setJobOrder(
      null
    );

    setErpSignals([]);

    setOutgoingMessage(
      null
    );

    setSimulatedSeconds(
      0
    );

    setEventLogs([]);

    setScales(
      createInitialScales()
    );
  }

  const totalConsumption =
    scales.reduce(
      (total, scale) =>
        total +
        scale.consumption,
      0
    );

  const totalPlannedConsumption =
    scales.reduce(
      (total, scale) =>
        total +
        scale.plannedConsumption,
      0
    );

  const totalDeviation =
    totalConsumption -
    totalPlannedConsumption;

  const consumptionProgress =
    totalPlannedConsumption >
    0
      ? Math.min(
          100,

          (totalConsumption /
            totalPlannedConsumption) *
            100
        )
      : 0;

  function processStatus() {
    if (
      systemState ===
      "RUNNING"
    ) {
      return "ÜRETİM ÇALIŞIYOR";
    }

    if (
      systemState ===
      "COMPLETED"
    ) {
      return "İŞ TAMAMLANDI";
    }

    return "ERP START_JOB BEKLENİYOR";
  }

  return (
    <main
      style={{
        minHeight:
          "100vh",

        background:
          "#0f172a",

        color:
          "white",

        padding:
          "32px",

        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      {/* BAŞLIK */}

      <header
        style={{
          marginBottom:
            "25px",
        }}
      >
        <h1
          style={{
            marginBottom:
              "6px",
          }}
        >
          Endüstriyel Tartım
          Simülatörü
        </h1>

        <p
          style={{
            color:
              "#94a3b8",

            margin: 0,
          }}
        >
          Node-RED Tartım ve ERP
          Entegrasyon Demo Sistemi
        </p>

        <Link
          href="/history"
          style={{
            display:
              "inline-block",

            marginTop:
              "15px",

            padding:
              "10px 16px",

            background:
              "#334155",

            color:
              "white",

            textDecoration:
              "none",

            borderRadius:
              "8px",

            fontWeight:
              "bold",

            fontSize:
              "13px",
          }}
        >
          İŞ GEÇMİŞİ
        </Link>
      </header>

      {/* ERP SİNYAL PANELİ */}

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
            color:
              "#94a3b8",
          }}
        >
          Gerçek sistemde ERP tarafından
          gönderilen başlangıç ve bitiş
          sinyallerini burada simüle ediyoruz.
        </p>

        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            gap:
              "15px",

            flexWrap:
              "wrap",
          }}
        >
          <MainButton
            onClick={
              startJobFromERP
            }
            disabled={
              systemState !==
              "IDLE"
            }
          >
            ERP → İŞ BAŞLAT
          </MainButton>

          <MainButton
            onClick={
              endJobFromERP
            }
            disabled={
              systemState !==
              "RUNNING"
            }
          >
            ERP → İŞ BİTİR
          </MainButton>

          <MainButton
            onClick={
              resetSimulation
            }
          >
            SIFIRLA
          </MainButton>

          <StatusItem
            label="Durum"
            value={
              processStatus()
            }
          />

          <StatusItem
            label="Simülasyon Süresi"
            value={
              formatSimulationTime(
                simulatedSeconds
              )
            }
          />

          <StatusItem
            label="Hız"
            value="x30"
          />
        </div>
      </Panel>

      {/* AKTİF İŞ */}

      <Panel>
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Aktif İş Emri
        </h2>

        {!jobOrder ? (
          <div
            style={{
              color:
                "#64748b",

              padding:
                "15px 0",
            }}
          >
            ERP START_JOB sinyali
            bekleniyor.
          </div>
        ) : (
          <div
            style={{
              display:
                "flex",

              gap:
                "45px",

              flexWrap:
                "wrap",
            }}
          >
            <Info
              title="İş Emri"
              value={
                jobOrder.workOrderNo
              }
            />

            <Info
              title="Ürün Kodu"
              value={
                jobOrder.productCode
              }
            />

            <Info
              title="Ürün"
              value={
                jobOrder.productName
              }
            />

            <Info
              title="Üretim Adedi"
              value={String(
                jobOrder.quantity
              )}
            />

            <Info
              title="Reçete"
              value={
                jobOrder.recipeCode
              }
            />
          </div>
        )}
      </Panel>

      {/* MESAJ MONİTÖRÜ */}

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
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(420px, 1fr))",

            gap:
              "20px",
          }}
        >
          <MessageBox
            title="ERP → Tartım Sistemi"
            badge="GELEN SİNYALLER"
          >
            {erpSignals.length >
            0 ? (
              <JsonViewer
                data={
                  erpSignals
                }
              />
            ) : (
              <EmptyMessage>
                ERP sinyali
                bekleniyor...
              </EmptyMessage>
            )}
          </MessageBox>

          <MessageBox
            title="Tartım Sistemi → ERP"
            badge={
              outgoingMessage
                ? "CEVAP HAZIR"
                : "BEKLİYOR"
            }
          >
            {outgoingMessage ? (
              <JsonViewer
                data={
                  outgoingMessage
                }
              />
            ) : (
              <EmptyMessage>
                İş bitiş sinyali
                bekleniyor...
              </EmptyMessage>
            )}
          </MessageBox>
        </div>
      </Panel>

      {/* PROSES AKIŞI */}

      <Panel>
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Sistem Akışı
        </h2>

        <div
          style={{
            display:
              "flex",

            alignItems:
              "stretch",

            gap:
              "12px",

            flexWrap:
              "wrap",
          }}
        >
          <FlowBox
            title="ERP"
            subtitle="START_JOB"
            status={
              running ||
              finished
                ? "ALINDI"
                : "BEKLİYOR"
            }
            active={
              running ||
              finished
            }
          />

          <Arrow />

          <FlowBox
            title="İstasyon 1"
            subtitle="Tartı 1 + Tartı 2"
            status={
              running
                ? "ÖLÇÜM AKTİF"
                : finished
                ? "TAMAMLANDI"
                : "BEKLEME"
            }
            active={
              running
            }
          />

          <Arrow />

          <FlowBox
            title="İstasyon 2"
            subtitle="Tartı 3 + Tartı 4"
            status={
              running
                ? "ÖLÇÜM AKTİF"
                : finished
                ? "TAMAMLANDI"
                : "BEKLEME"
            }
            active={
              running
            }
          />

          <Arrow />

          <FlowBox
            title="İstasyon 3"
            subtitle="Tartı 5"
            status={
              running
                ? "ÖLÇÜM AKTİF"
                : finished
                ? "TAMAMLANDI"
                : "BEKLEME"
            }
            active={
              running
            }
          />

          <Arrow />

          <FlowBox
            title="ERP"
            subtitle="Tüketim Cevabı"
            status={
              finished
                ? "CEVAP HAZIR"
                : "BEKLİYOR"
            }
            active={
              finished
            }
          />
        </div>
      </Panel>

      {/* CANLI ÖZET */}

      <Panel>
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Canlı Tüketim Özeti
        </h2>

        <div
          style={{
            display:
              "flex",

            gap:
              "50px",

            flexWrap:
              "wrap",
          }}
        >
          <Metric
            title="Planlanan"
            value={`${totalPlannedConsumption.toFixed(
              3
            )} kg`}
          />

          <Metric
            title="Anlık Tüketim"
            value={`${totalConsumption.toFixed(
              3
            )} kg`}
          />

          <Metric
            title="Gerçekleşme"
            value={`${consumptionProgress.toFixed(
              1
            )} %`}
          />
        </div>
      </Panel>

      {/* TARTILAR */}

      {[1, 2, 3].map(
        (stationNo) => {
          const stationScales =
            scales.filter(
              (scale) =>
                scale.station_no ===
                stationNo
            );

          return (
            <section
              key={
                stationNo
              }
              style={{
                marginBottom:
                  "22px",

                background:
                  "#1e293b",

                padding:
                  "22px",

                borderRadius:
                  "14px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  marginBottom:
                    "20px",
                }}
              >
                <h2
                  style={{
                    margin:
                      0,
                  }}
                >
                  İstasyon{" "}
                  {stationNo}
                </h2>

                <StatusBadge
                  text={
                    running
                      ? "CANLI"
                      : finished
                      ? "TAMAMLANDI"
                      : "BEKLEME"
                  }
                  active={
                    running
                  }
                />
              </div>

              <div
                style={{
                  display:
                    "flex",

                  gap:
                    "20px",

                  flexWrap:
                    "wrap",
                }}
              >
                {stationScales.map(
                  (scale) => (
                    <div
                      key={
                        scale.id
                      }
                      style={{
                        width:
                          "310px",

                        padding:
                          "22px",

                        background:
                          "#334155",

                        borderRadius:
                          "12px",
                      }}
                    >
                      <strong>
                        {
                          scale.scale_name
                        }
                      </strong>

                      <div
                        style={{
                          color:
                            "#94a3b8",

                          marginTop:
                            "10px",
                        }}
                      >
                        {
                          scale.materialCode
                        }
                      </div>

                      <div
                        style={{
                          marginTop:
                            "5px",
                        }}
                      >
                        {
                          scale.materialName
                        }
                      </div>

                      <div
                        style={{
                          fontSize:
                            "34px",

                          fontWeight:
                            "bold",

                          margin:
                            "18px 0",
                        }}
                      >
                        {scale.currentWeight.toFixed(
                          3
                        )}{" "}
                        kg
                      </div>

                      <ScaleRow
                        label="Başlangıç"
                        value={`${scale.startWeight.toFixed(
                          3
                        )} kg`}
                      />

                      <ScaleRow
                        label="Anlık"
                        value={`${scale.currentWeight.toFixed(
                          3
                        )} kg`}
                      />

                      <ScaleRow
                        label="Tüketim"
                        value={`${scale.consumption.toFixed(
                          3
                        )} kg`}
                      />
                    </div>
                  )
                )}
              </div>
            </section>
          );
        }
      )}

      {/* EVENT LOG */}

      <Panel>
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Sistem Günlüğü
        </h2>

        {eventLogs.length ===
        0 ? (
          <div
            style={{
              color:
                "#64748b",
            }}
          >
            Sistem olayı
            bulunmuyor.
          </div>
        ) : (
          eventLogs
            .slice()
            .reverse()
            .map(
              (event) => (
                <EventRow
                  key={
                    event.id
                  }
                  event={
                    event
                  }
                />
              )
            )
        )}
      </Panel>

      {/* SONUÇ */}

      {finished &&
        jobOrder && (
          <Panel>
            <h2
              style={{
                marginTop: 0,
              }}
            >
              ERP&apos;ye
              Gönderilecek
              Tüketim Sonucu
            </h2>

            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table
                style={{
                  width:
                    "100%",

                  borderCollapse:
                    "collapse",
                }}
              >
                <thead>
                  <tr>
                    <TableHeader>
                      İstasyon
                    </TableHeader>

                    <TableHeader>
                      Tartı
                    </TableHeader>

                    <TableHeader>
                      Başlangıç
                    </TableHeader>

                    <TableHeader>
                      Bitiş
                    </TableHeader>

                    <TableHeader>
                      Tüketim
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {scales.map(
                    (scale) => (
                      <tr
                        key={
                          scale.id
                        }
                      >
                        <TableCell>
                          İstasyon{" "}
                          {
                            scale.station_no
                          }
                        </TableCell>

                        <TableCell>
                          {
                            scale.scale_name
                          }
                        </TableCell>

                        <TableCell>
                          {scale.startWeight.toFixed(
                            3
                          )}{" "}
                          kg
                        </TableCell>

                        <TableCell>
                          {scale.currentWeight.toFixed(
                            3
                          )}{" "}
                          kg
                        </TableCell>

                        <TableCell>
                          {scale.consumption.toFixed(
                            3
                          )}{" "}
                          kg
                        </TableCell>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display:
                  "flex",

                gap:
                  "50px",

                marginTop:
                  "30px",

                flexWrap:
                  "wrap",
              }}
            >
              <Metric
                title="Planlanan Toplam"
                value={`${totalPlannedConsumption.toFixed(
                  3
                )} kg`}
              />

              <Metric
                title="Gerçek Tüketim"
                value={`${totalConsumption.toFixed(
                  3
                )} kg`}
              />

              <Metric
                title="Sapma"
                value={`${
                  totalDeviation >=
                  0
                    ? "+"
                    : ""
                }${totalDeviation.toFixed(
                  3
                )} kg`}
              />
            </div>
          </Panel>
        )}
    </main>
  );
}