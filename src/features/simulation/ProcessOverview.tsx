import type { ScaleState } from "./types";

type Props = {
  scales: ScaleState[];
  running: boolean;
  finished: boolean;
};

export default function ProcessOverview({ scales, running, finished }: Props) {
  function stationScales(stationNo: number) {
    return scales.filter((scale) => scale.station_no === stationNo);
  }

  return (
    <section
      style={{
        background: "#1e293b",
        padding: "22px",
        borderRadius: "14px",
        marginBottom: "22px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            Canlı Proses Görünümü
          </h2>

          <div
            style={{
              color: "#94a3b8",
              fontSize: "13px",
              marginTop: "6px",
            }}
          >
            ERP başlangıç sinyalinden bitiş tüketim sonucuna kadar simülasyon
            akışı
          </div>
        </div>

        <strong>
          {running
            ? "● HAT ÇALIŞIYOR"
            : finished
              ? "● İŞ TAMAMLANDI"
              : "● ERP BEKLENİYOR"}
        </strong>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <ErpBox title="ERP" subtitle="START_JOB" active={running || finished} />

        <Arrow active={running} />

        <StationBox
          stationNo={1}
          scales={stationScales(1)}
          running={running}
          finished={finished}
        />

        <Arrow active={running} />

        <StationBox
          stationNo={2}
          scales={stationScales(2)}
          running={running}
          finished={finished}
        />

        <Arrow active={running} />

        <StationBox
          stationNo={3}
          scales={stationScales(3)}
          running={running}
          finished={finished}
        />

        <Arrow active={finished} />

        <ErpBox title="ERP" subtitle="JOB_COMPLETED" active={finished} />
      </div>
    </section>
  );
}

function StationBox({
  stationNo,
  scales,
  running,
  finished,
}: {
  stationNo: number;
  scales: ScaleState[];
  running: boolean;
  finished: boolean;
}) {
  return (
    <div
      style={{
        minWidth: "215px",
        flex: 1,

        background: "#334155",

        padding: "16px",

        borderRadius: "12px",

        border: running ? "1px solid #3b82f6" : "1px solid #475569",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <strong>İstasyon {stationNo}</strong>

        <span>{running ? "●" : finished ? "✓" : "○"}</span>
      </div>

      {scales.map((scale) => (
        <div
          key={scale.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",

            background: "#0f172a",

            borderRadius: "8px",

            padding: "10px 12px",

            marginBottom: "8px",
          }}
        >
          <strong
            style={{
              fontSize: "12px",
            }}
          >
            {scale.scale_name}
          </strong>

          <span
            style={{
              fontFamily: "monospace",
              fontWeight: "bold",
            }}
          >
            {scale.currentWeight.toFixed(3)} kg
          </span>
        </div>
      ))}

      <div
        style={{
          marginTop: "12px",
          fontSize: "11px",
          color: "#94a3b8",
        }}
      >
        {running
          ? "Canlı tartım devam ediyor"
          : finished
            ? "Bitiş değerleri alındı"
            : "START_JOB bekleniyor"}
      </div>
    </div>
  );
}

function ErpBox({
  title,
  subtitle,
  active,
}: {
  title: string;
  subtitle: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        minWidth: "150px",

        padding: "18px",

        background: active ? "#1d4ed8" : "#334155",

        borderRadius: "12px",

        border: "1px solid #475569",
      }}
    >
      <strong>{title}</strong>

      <div
        style={{
          marginTop: "7px",
          color: "#cbd5e1",
          fontSize: "12px",
        }}
      >
        {subtitle}
      </div>

      <div
        style={{
          marginTop: "15px",
          fontSize: "11px",
          fontWeight: "bold",
        }}
      >
        {active ? "● AKTİF" : "● BEKLİYOR"}
      </div>
    </div>
  );
}

function Arrow({ active }: { active: boolean }) {
  return (
    <div
      style={{
        fontSize: "28px",

        color: active ? "#3b82f6" : "#64748b",
      }}
    >
      →
    </div>
  );
}
