"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";

const KATEGORI_LABEL = {
  pencurian: "Pencurian TBS",
  kehilangan: "Kehilangan",
  percobaan: "Percobaan / mencurigakan",
};

function formatTanggal(str) {
  if (!str) return "-";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

const STATUS_STEPS = ["baru", "diproses", "selesai"];
const STATUS_STEP_LABEL = {
  baru: "Laporan diterima",
  diproses: "Sedang ditindaklanjuti",
  selesai: "Selesai ditangani",
};

export default function CekStatusForm() {
  const [kode, setKode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!kode.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/laporan/cek?kode=${encodeURIComponent(kode.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Laporan tidak ditemukan.");
      setResult(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const currentStepIdx = result ? STATUS_STEPS.indexOf(result.status) : -1;

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="card-shell p-5">
        <label className="field-label">Kode Laporan</label>
        <div className="flex gap-2">
          <input
            type="text"
            required
            placeholder="cth. KHS-20260820-1234"
            className="field-shell font-mono uppercase"
            value={kode}
            onChange={(e) => setKode(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-lg bg-canopy-900 px-4 text-sm font-semibold text-paper-50 transition active:scale-95 disabled:opacity-60"
          >
            {loading ? "..." : "Cek"}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-ink-500">
          Kode diberikan setelah kamu mengirim laporan (format KHS-tanggal-angka).
        </p>
      </form>

      {error && (
        <div className="mt-3 rounded-lg border border-alert/30 bg-alert-light px-4 py-3 text-sm text-alert-dark">
          {error}
        </div>
      )}

      {result && (
        <div className="card-shell mt-4 p-5">
          <div className="flex items-start justify-between gap-3 border-b border-dashed border-ink-900/15 pb-4">
            <div>
              <p className="font-mono text-xs font-semibold text-gold-dark">{result.kode}</p>
              <p className="mt-1 text-[13px] text-ink-700">
                {KATEGORI_LABEL[result.kategori] || result.kategori} &middot; {result.afdeling} &middot; Blok {result.blok}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-500">
                Dilaporkan {formatTanggal(result.tanggal)}, {result.pukul}
              </p>
            </div>
            <StatusBadge status={result.status} className="rotate-0" />
          </div>

          <div className="mt-5">
            {STATUS_STEPS.map((s, idx) => (
              <div key={s} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                      idx <= currentStepIdx
                        ? "border-canopy-700 bg-canopy-700 text-paper-50"
                        : "border-ink-900/20 text-ink-500"
                    }`}
                  >
                    {idx <= currentStepIdx ? "✓" : idx + 1}
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 ${idx < currentStepIdx ? "bg-canopy-700" : "bg-ink-900/15"}`}
                      style={{ minHeight: "24px" }}
                    />
                  )}
                </div>
                <div className="pb-5">
                  <p
                    className={`text-[13.5px] font-semibold ${
                      idx <= currentStepIdx ? "text-canopy-900" : "text-ink-500"
                    }`}
                  >
                    {STATUS_STEP_LABEL[s]}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-ink-500">
            Terakhir diperbarui: {new Date(result.diperbarui_pada).toLocaleString("id-ID")}
          </p>
        </div>
      )}
    </div>
  );
}
