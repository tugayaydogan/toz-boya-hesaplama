"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import type { CompletedJobRecord } from "./types";

import { clearCompletedJobs, getCompletedJobs } from "./storage";

export default function HistoryDashboard() {
  const [jobs, setJobs] = useState<CompletedJobRecord[]>([]);

  const [selectedJob, setSelectedJob] = useState<CompletedJobRecord | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        const storedJobs = await getCompletedJobs();

        setJobs(storedJobs);
      } catch (error) {
        console.error("IndexedDB kayıtları okunamadı:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadJobs();
  }, []);

  async function clearHistory() {
    const confirmed = window.confirm("Tüm simülasyon geçmişi silinsin mi?");

    if (!confirmed) {
      return;
    }

    try {
      await clearCompletedJobs();

      setJobs([]);
      setSelectedJob(null);
    } catch (error) {
      console.error("Geçmiş temizlenemedi:", error);
    }
  }

  const totalConsumption = jobs.reduce(
    (total, job) => total + job.totalConsumption,
    0,
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
      {/* HEADER */}

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
          Simülasyon Geçmişi
        </h1>

        <p
          style={{
            color: "#94a3b8",
            marginTop: 0,
          }}
        >
          IndexedDB veritabanına kaydedilen tamamlanmış tartım simülasyonları
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
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
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              GEÇMİŞİ TEMİZLE
            </button>
          )}
        </div>
      </header>

      {/* ÖZET */}

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
          <Metric title="Kayıtlı İş" value={String(jobs.length)} />

          <Metric
            title="Toplam Tüketim"
            value={`${totalConsumption.toFixed(3)} kg`}
          />

          <Metric title="Veritabanı" value="IndexedDB" />
        </div>
      </section>

      {/* İŞ LİSTESİ */}

      <section
        style={{
          background: "#1e293b",
          padding: "22px",
          borderRadius: "14px",
          marginBottom: "22px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Tamamlanan İşler
        </h2>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "13px",
          }}
        >
          Detaylarını görmek için bir iş kaydına tıkla.
        </p>

        {loading ? (
          <div
            style={{
              color: "#94a3b8",
              padding: "20px 0",
            }}
          >
            Veritabanı okunuyor...
          </div>
        ) : jobs.length === 0 ? (
          <div
            style={{
              color: "#64748b",
              padding: "20px 0",
            }}
          >
            Henüz kayıtlı simülasyon bulunmuyor.
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
                  <TableHeader>İş Emri</TableHeader>

                  <TableHeader>Başlangıç</TableHeader>

                  <TableHeader>Bitiş</TableHeader>

                  <TableHeader>Simülasyon Süresi</TableHeader>

                  <TableHeader>Toplam Tüketim</TableHeader>

                  <TableHeader>Tartı</TableHeader>
                </tr>
              </thead>

              <tbody>
                {jobs.map((job) => {
                  const selected = selectedJob?.id === job.id;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      style={{
                        cursor: "pointer",

                        background: selected ? "#334155" : "transparent",
                      }}
                    >
                      <TableCell>
                        <strong>{job.workOrderNo}</strong>
                      </TableCell>

                      <TableCell>
                        {new Date(job.startedAt).toLocaleString("tr-TR")}
                      </TableCell>

                      <TableCell>
                        {new Date(job.completedAt).toLocaleString("tr-TR")}
                      </TableCell>

                      <TableCell>
                        {formatDuration(job.simulatedDurationSeconds)}
                      </TableCell>

                      <TableCell>
                        {job.totalConsumption.toFixed(3)} kg
                      </TableCell>

                      <TableCell>{job.scaleResults.length}</TableCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SEÇİLİ İŞ DETAYI */}

      {selectedJob && (
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
                İş Detayı
              </h2>

              <div
                style={{
                  color: "#94a3b8",
                  marginTop: "6px",
                }}
              >
                {selectedJob.workOrderNo}
              </div>
            </div>

            <button
              onClick={() => setSelectedJob(null)}
              style={{
                padding: "8px 14px",
                background: "#334155",
                color: "white",
                border: "1px solid #475569",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              DETAYI KAPAT
            </button>
          </div>

          {/* İŞ ÖZETİ */}

          <div
            style={{
              display: "flex",
              gap: "45px",
              flexWrap: "wrap",
              marginBottom: "28px",
            }}
          >
            <Metric title="İş Emri" value={selectedJob.workOrderNo} />

            <Metric
              title="Simülasyon Süresi"
              value={formatDuration(selectedJob.simulatedDurationSeconds)}
            />

            <Metric
              title="Toplam Tüketim"
              value={`${selectedJob.totalConsumption.toFixed(3)} kg`}
            />
          </div>

          {/* TARTI SONUÇLARI */}

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
                {selectedJob.scaleResults.map((result) => (
                  <tr key={result.scaleNo}>
                    <TableCell>İstasyon {result.stationNo}</TableCell>

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

          {/* KONTROL TOPLAMI */}

          <div
            style={{
              marginTop: "25px",
              padding: "16px",
              background: "#0f172a",
              borderRadius: "10px",
            }}
          >
            Tartılardan hesaplanan toplam:{" "}
            <strong>
              {selectedJob.scaleResults
                .reduce((total, result) => total + result.consumption, 0)
                .toFixed(3)}{" "}
              kg
            </strong>
          </div>
        </section>
      )}
    </main>
  );
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.floor(seconds);

  const hours = Math.floor(safeSeconds / 3600);

  const minutes = Math.floor((safeSeconds % 3600) / 60);

  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours} sa ${minutes} dk ${remainingSeconds} sn`;
  }

  return `${minutes} dk ${remainingSeconds} sn`;
}

function Metric({ title, value }: { title: string; value: string }) {
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
          fontSize: "22px",
          fontWeight: "bold",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
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

function TableCell({ children }: { children: React.ReactNode }) {
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
