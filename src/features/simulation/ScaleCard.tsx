import type { ScaleState } from "./types";

type ScaleCardProps = {
  scale: ScaleState;
  running: boolean;
  finished: boolean;
};

export default function ScaleCard({
  scale,
  running,
  finished,
}: ScaleCardProps) {
  const measurementDifference = Math.abs(
    scale.currentWeight - scale.processWeight,
  );

  const stable = !running || measurementDifference < 0.0015;

  return (
    <div
      style={{
        width: "330px",
        background: "#334155",
        borderRadius: "14px",
        padding: "20px",

        border: running ? "1px solid #3b82f6" : "1px solid #475569",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          gap: "15px",
        }}
      >
        <div>
          <strong
            style={{
              fontSize: "17px",
            }}
          >
            {scale.scale_name}
          </strong>

          <div
            style={{
              color: "#94a3b8",
              fontSize: "12px",
              marginTop: "4px",
            }}
          >
            İSTASYON {scale.station_no}
          </div>
        </div>

        <span
          style={{
            padding: "6px 10px",
            borderRadius: "20px",

            background: running ? "#14532d" : "#475569",

            fontSize: "11px",
            fontWeight: "bold",
          }}
        >
          {running ? "ÖLÇÜM AKTİF" : finished ? "TAMAMLANDI" : "BEKLEME"}
        </span>
      </div>

      {/* TARTI GÖSTERGESİ */}

      <div
        style={{
          background: "#0f172a",
          borderRadius: "10px",
          border: "1px solid #475569",
          padding: "20px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            color: "#64748b",
            fontSize: "11px",
            letterSpacing: "1px",
          }}
        >
          WEIGHT
        </div>

        <div
          style={{
            textAlign: "right",
            marginTop: "10px",

            fontFamily: "'Courier New', monospace",

            fontSize: "36px",
            fontWeight: "bold",
          }}
        >
          {scale.currentWeight.toFixed(3)}

          <span
            style={{
              marginLeft: "8px",
              fontSize: "16px",
              color: "#94a3b8",
            }}
          >
            kg
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "18px",
            fontSize: "11px",
            fontWeight: "bold",
          }}
        >
          <Led label="CONNECTED" active />

          <Led
            label={stable ? "STABLE" : "UNSTABLE"}
            active
            warning={!stable}
          />
        </div>
      </div>

      {/* DEĞERLER */}

      <ValueRow
        label="Başlangıç"
        value={`${scale.startWeight.toFixed(3)} kg`}
      />

      <ValueRow label="Anlık" value={`${scale.currentWeight.toFixed(3)} kg`} />

      <ValueRow
        label="Tüketim"
        value={`${scale.consumption.toFixed(3)} kg`}
        important
      />
    </div>
  );
}

function Led({
  label,
  active,
  warning = false,
}: {
  label: string;
  active: boolean;
  warning?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
      }}
    >
      <span
        style={{
          width: "9px",
          height: "9px",
          borderRadius: "50%",

          background: active ? (warning ? "#f59e0b" : "#22c55e") : "#64748b",
        }}
      />

      {label}
    </div>
  );
}

function ValueRow({
  label,
  value,
  important = false,
}: {
  label: string;
  value: string;
  important?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",

        padding: "7px 0",
      }}
    >
      <span
        style={{
          color: "#94a3b8",
          fontSize: "13px",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          fontSize: important ? "16px" : "13px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}
