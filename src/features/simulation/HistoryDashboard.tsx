"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CompletedJobRecord } from "./types";

import {
  clearCompletedJobs,
  getCompletedJobs,
} from "./storage";

export default function HistoryDashboard() {
  const [jobs, setJobs] = useState<CompletedJobRecord[]>([]);

  useEffect(() => {
    setJobs(getCompletedJobs());
  }, []);

  function clearHistory() {
    const confirmed = window.confirm(
      "Tüm iş geçmişi silinsin mi?"
    );

    if (!confirmed) {
      return;
    }

    clearCompletedJobs();
    setJobs([]);
  }

  const totalActual = jobs.reduce(
    (total, job) => total + job.totalActualConsumption,
    0
  );

  const totalPlanned = jobs.reduce(
    (total, job) => total + job.totalPlannedConsumption,
    0
  );

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
      <header
        style={{
          marginBottom: "25px",
        }}
      >
        <h1
          style={{
            marginBottom: "6px",
          }}
        >
          İş Geçmişi
        </h1>

        <p
          style={{
            margin: 0,
            color: "#94a3b8",
          }}
        >
          Tamamlanan üretim simülasyonları
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "18px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              padding: "10px 16px",
              background: "#2563eb",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "bold",
            }}
          >
            ← SİMÜLASYONA DÖN
          </Link>

          {jobs.length > 0 && (
            <button
              onClick={clearHistory}
              style={{
                padding: "10px 16px",
                background: "#334155",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              GEÇMİŞİ TEMİZLE
            </button>
          )}
        </div>
      </header>

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
            gap: "50px",
            flexWrap: "wrap",
          }}
        >
          <Metric
            title="Tamamlanan İş"
            value={String(jobs.length)}
          />

          <Metric
            title="Toplam Planlanan"
            value={`${totalPlanned.toFixed(3)} kg`}
          />

          <Metric
            title="Toplam Gerçekleşen"
            value={`${totalActual.toFixed(3)} kg`}
          />

          <Metric
            title="Toplam Sapma"
            value={`${totalActual - totalPlanned >= 0 ? "+" : ""}${(
              totalActual - totalPlanned
            ).toFixed(3)} kg`}
          />
        </div>
      </section>

      <section
        style={{
          background: "#1e293b",
          padding: "22px",
          borderRadius: "14px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Tamamlanan İşler
        </h2>

        {jobs.length === 0 ? (
          <div
            style={{
              padding: "30px 0",
              color: "#64748b",
            }}
          >
            Henüz tamamlanan iş bulunmuyor.
          </div>
        ) : (
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
                  <TableHeader>Tarih</TableHeader>
                  <TableHeader>İş Emri</TableHeader>
                  <TableHeader>Ürün</TableHeader>
                  <TableHeader>Reçete</TableHeader>
                  <TableHeader>Adet</TableHeader>
                  <TableHeader>Süre</TableHeader>
                  <TableHeader>Planlanan</TableHeader>
                  <TableHeader>Gerçekleşen</TableHeader>
                  <TableHeader>Sapma</TableHeader>
                  <TableHeader>Bitiş</TableHeader>
                </tr>
              </thead>

              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <TableCell>
                      {new Date(job.completedAt).toLocaleString("tr-TR")}
                    </TableCell>

                    <TableCell>
                      <strong>{job.workOrderNo}</strong>
                    </TableCell>

                    <TableCell>{job.productName}</TableCell>

                    <TableCell>{job.recipeCode}</TableCell>

                    <TableCell>{job.quantity}</TableCell>

                    <TableCell>
                      {formatDuration(job.simulatedDurationSeconds)}
                    </TableCell>

                    <TableCell>
                      {job.totalPlannedConsumption.toFixed(3)} kg
                    </TableCell>

                    <TableCell>
                      {job.totalActualConsumption.toFixed(3)} kg
                    </TableCell>

                    <TableCell>
                      {job.totalDeviation >= 0 ? "+" : ""}
                      {job.totalDeviation.toFixed(3)} kg
                    </TableCell>

                    <TableCell>
                      ERP İş Bitir Sinyali
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes} dk ${remainingSeconds} sn`;
}

function Metric({
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

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "12px",
        color: "#94a3b8",
        borderBottom: "1px solid #475569",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td
      style={{
        padding: "12px",
        borderBottom: "1px solid #334155",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </td>
  );
}