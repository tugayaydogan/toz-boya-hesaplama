import {
  type ReactNode,
} from "react";

import {
  EventLog,
} from "./types";

export function Panel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <section
      style={{
        background: "#1e293b",
        padding: "22px",
        borderRadius: "14px",
        marginBottom: "22px",
      }}
    >
      {children}
    </section>
  );
}

export function MainButton({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "12px 22px",
        border: "none",
        borderRadius: "8px",
        fontWeight: "bold",

        cursor: disabled
          ? "not-allowed"
          : "pointer",

        opacity: disabled
          ? 0.4
          : 1,
      }}
    >
      {children}
    </button>
  );
}

export function Info({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          color: "#94a3b8",
          fontSize: "13px",
          marginBottom: "5px",
        }}
      >
        {title}
      </div>

      <strong>{value}</strong>
    </div>
  );
}

export function StatusItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      {label}:{" "}
      <strong>{value}</strong>
    </div>
  );
}

export function StatusBadge({
  text,
  active,
}: {
  text: string;
  active: boolean;
}) {
  return (
    <span
      style={{
        padding: "6px 12px",
        borderRadius: "20px",

        background: active
          ? "#14532d"
          : "#334155",

        fontSize: "12px",
        fontWeight: "bold",
      }}
    >
      {text}
    </span>
  );
}

export function FlowBox({
  title,
  subtitle,
  status,
  active,
}: {
  title: string;
  subtitle: string;
  status: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        minWidth: "165px",
        flex: 1,
        padding: "18px",
        borderRadius: "12px",

        background: active
          ? "#1d4ed8"
          : "#334155",
      }}
    >
      <strong>{title}</strong>

      <div
        style={{
          marginTop: "6px",

          color: active
            ? "#dbeafe"
            : "#94a3b8",

          fontSize: "13px",
        }}
      >
        {subtitle}
      </div>

      <div
        style={{
          marginTop: "14px",
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        ● {status}
      </div>
    </div>
  );
}

export function Arrow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        color: "#64748b",
        fontSize: "28px",
      }}
    >
      →
    </div>
  );
}

export function Metric({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          color: "#94a3b8",
          fontSize: "13px",
          marginBottom: "7px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "25px",
          fontWeight: "bold",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function ProgressBar({
  progress,
}: {
  progress: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "16px",
        background: "#334155",
        borderRadius: "20px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",

          width: `${Math.min(
            100,
            progress
          )}%`,

          background:
            progress >= 100
              ? "#22c55e"
              : "#3b82f6",

          transition:
            "width 0.4s ease",
        }}
      />
    </div>
  );
}

export function ScaleRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",

        justifyContent:
          "space-between",

        gap: "15px",

        padding: "5px 0",

        color: "#cbd5e1",
      }}
    >
      <span>{label}</span>

      <strong
        style={{
          color: "white",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

export function MessageBox({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: "#0f172a",

        border:
          "1px solid #334155",

        borderRadius: "12px",

        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",

          borderBottom:
            "1px solid #334155",

          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center",
        }}
      >
        <strong>{title}</strong>

        <span
          style={{
            padding: "5px 9px",
            borderRadius: "20px",
            background: "#334155",
            fontSize: "11px",
          }}
        >
          {badge}
        </span>
      </div>

      {children}
    </div>
  );
}

export function JsonViewer({
  data,
}: {
  data: unknown;
}) {
  return (
    <pre
      style={{
        margin: 0,
        padding: "18px",
        color: "#93c5fd",
        fontFamily: "monospace",
        fontSize: "13px",
        lineHeight: "1.6",
        overflowX: "auto",
        overflowY: "auto",
        maxHeight: "300px",
      }}
    >
      {JSON.stringify(
        data,
        null,
        2
      )}
    </pre>
  );
}

export function EmptyMessage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      style={{
        padding: "30px 18px",
        color: "#64748b",
        fontFamily: "monospace",
      }}
    >
      {children}
    </div>
  );
}

export function EventRow({
  event,
}: {
  event: EventLog;
}) {
  let badgeBackground =
    "#334155";

  if (
    event.level === "SUCCESS"
  ) {
    badgeBackground =
      "#14532d";
  }

  if (
    event.level === "WARNING"
  ) {
    badgeBackground =
      "#78350f";
  }

  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns:
          "100px 100px 1fr",

        gap: "15px",

        alignItems: "center",

        padding: "12px 0",

        borderBottom:
          "1px solid #334155",
      }}
    >
      <span
        style={{
          color: "#94a3b8",
          fontFamily: "monospace",
        }}
      >
        {event.time}
      </span>

      <span
        style={{
          width: "fit-content",

          padding: "5px 9px",

          borderRadius: "20px",

          background:
            badgeBackground,

          fontSize: "11px",

          fontWeight: "bold",
        }}
      >
        {event.level}
      </span>

      <span>
        {event.message}
      </span>
    </div>
  );
}

export function TableHeader({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th
      style={{
        textAlign: "left",

        padding: "12px",

        borderBottom:
          "1px solid #475569",

        color: "#94a3b8",

        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <td
      style={{
        padding: "12px",

        borderBottom:
          "1px solid #334155",

        whiteSpace: "nowrap",
      }}
    >
      {children}
    </td>
  );
}