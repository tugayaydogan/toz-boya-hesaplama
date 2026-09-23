import type { Job, ScaleState, SimulationState } from "./types";

import { formatSimulationTime, STATION_NAMES } from "./data";

type Props = {
  job: Job | null;

  scales: ScaleState[];

  systemState: SimulationState;

  simulatedSeconds: number;

  totalConsumption: number;

  onStart: () => void;

  onFinish: () => void;

  onReset: () => void;
};

export default function DemoControlBar({
  job,
  scales,
  systemState,
  simulatedSeconds,
  totalConsumption,
  onStart,
  onFinish,
  onReset,
}: Props) {
  const running = systemState === "RUNNING";

  const finished = systemState === "COMPLETED";

  function getStationScales(stationNo: number) {
    return scales.filter((scale) => scale.station_no === stationNo);
  }

  return (
    <section
      style={{
        position: "sticky",
        top: "10px",
        zIndex: 100,

        background: "#1e293b",

        border: running
          ? "1px solid #2563eb"
          : finished
            ? "1px solid #16a34a"
            : "1px solid #334155",

        borderRadius: "16px",

        padding: "18px",

        marginBottom: "22px",

        boxShadow: "0 15px 35px rgba(0,0,0,0.28)",
      }}
    >
      {/* KONTROL SATIRI */}

      <div
        style={{
          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          gap: "20px",

          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <ActionButton
            onClick={onStart}
            disabled={systemState !== "IDLE"}
            primary
          >
            ▶ ERP → İŞ BAŞLAT
          </ActionButton>

          <ActionButton onClick={onFinish} disabled={!running}>
            ■ ERP → İŞ BİTİR
          </ActionButton>

          <ActionButton onClick={onReset}>↻ SIFIRLA</ActionButton>
        </div>

        {/* DURUM */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",

              borderRadius: "50%",

              background: running
                ? "#22c55e"
                : finished
                  ? "#3b82f6"
                  : "#94a3b8",
            }}
          />

          <strong>
            {running
              ? "ÜRETİM ÇALIŞIYOR"
              : finished
                ? "İŞ TAMAMLANDI"
                : "ERP START_JOB BEKLENİYOR"}
          </strong>
        </div>
      </div>

      {/* KPI */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",

          gap: "10px",

          marginTop: "15px",
        }}
      >
        <MiniMetric label="İş Emri" value={job ? job.workOrderNo : "-"} />

        <MiniMetric
          label="Simülasyon"
          value={formatSimulationTime(simulatedSeconds)}
        />

        <MiniMetric label="Hız" value="x30" />

        <MiniMetric
          label="Toplam Tüketim"
          value={`${totalConsumption.toFixed(3)} kg`}
        />

        <MiniMetric
          label="ERP Çıkışı"
          value={
            finished
              ? "JOB_COMPLETED ✓"
              : running
                ? "END_JOB BEKLENİYOR"
                : "BEKLİYOR"
          }
          highlight={finished}
        />
      </div>

      {/* İSTASYONLAR */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",

          gap: "10px",

          marginTop: "14px",
        }}
      >
        {[1, 2, 3].map((stationNo) => {
          const stationScales = getStationScales(stationNo);

          return (
            <div
              key={stationNo}
              style={{
                background: "#0f172a",

                border: running ? "1px solid #2563eb" : "1px solid #334155",

                borderRadius: "11px",

                padding: "11px",
              }}
            >
              {/* İSTASYON BAŞLIĞI */}

              <div
                style={{
                  display: "flex",

                  justifyContent: "space-between",

                  alignItems: "center",

                  marginBottom: "9px",
                }}
              >
                <div>
                  <strong
                    style={{
                      fontSize: "13px",
                    }}
                  >
                    {STATION_NAMES[stationNo]}
                  </strong>

                  <div
                    style={{
                      color: "#64748b",

                      fontSize: "10px",

                      marginTop: "2px",
                    }}
                  >
                    İSTASYON {stationNo}
                  </div>
                </div>

                <span
                  style={{
                    width: "8px",

                    height: "8px",

                    borderRadius: "50%",

                    background: running
                      ? "#22c55e"
                      : finished
                        ? "#3b82f6"
                        : "#64748b",
                  }}
                />
              </div>

              {/* TARTILAR */}

              <div
                style={{
                  display: "grid",

                  gridTemplateColumns:
                    stationScales.length > 1 ? "repeat(2, 1fr)" : "1fr",

                  gap: "7px",
                }}
              >
                {stationScales.map((scale) => (
                  <div
                    key={scale.id}
                    style={{
                      background: "#111827",

                      padding: "8px",

                      borderRadius: "7px",
                    }}
                  >
                    <div
                      style={{
                        color: "#94a3b8",

                        fontSize: "10px",
                      }}
                    >
                      {scale.scale_name}
                    </div>

                    <strong
                      style={{
                        display: "block",

                        marginTop: "3px",

                        fontFamily: "monospace",

                        fontSize: "14px",
                      }}
                    >
                      {scale.currentWeight.toFixed(3)} kg
                    </strong>

                    {(running || finished) && (
                      <div
                        style={{
                          marginTop: "3px",

                          color: "#60a5fa",

                          fontSize: "9px",
                        }}
                      >
                        Tüketim {scale.consumption.toFixed(3)} kg
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* BİTİŞ */}

      {finished && (
        <div
          style={{
            marginTop: "12px",

            padding: "10px 14px",

            background: "#052e16",

            border: "1px solid #16a34a",

            borderRadius: "8px",

            fontWeight: "bold",
          }}
        >
          ✓ İş tamamlandı — ERP&apos;ye gönderilecek toplam tüketim:{" "}
          {totalConsumption.toFixed(3)} kg
        </div>
      )}
    </section>
  );
}

function MiniMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: highlight ? "#052e16" : "#0f172a",

        border: highlight ? "1px solid #16a34a" : "1px solid #334155",

        borderRadius: "9px",

        padding: "9px 11px",
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "10px",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>

      <strong
        style={{
          fontSize: "13px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled = false,
  primary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 14px",

        border: "none",

        borderRadius: "8px",

        background: disabled ? "#475569" : primary ? "#2563eb" : "#334155",

        color: disabled ? "#94a3b8" : "white",

        fontWeight: "bold",

        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
