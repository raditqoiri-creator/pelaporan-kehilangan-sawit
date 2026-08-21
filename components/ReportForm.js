"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import SignaturePad from "./SignaturePad";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-52 w-full items-center justify-center rounded-lg border border-ink-900/15 bg-paper-100 text-sm text-ink-500">
      Memuat peta...
    </div>
  ),
});

const AFDELING_OPTIONS = ["Afdeling I", "Afdeling II", "Afdeling III", "Afdeling IV", "Afdeling V"];
const KATEGORI_OPTIONS = [
  { value: "pencurian", label: "Pencurian TBS" },
  { value: "kehilangan", label: "Kehilangan (bukan indikasi pencurian)" },
  { value: "percobaan", label: "Percobaan pencurian / mencurigakan" },
];
const MAX_PHOTO_MB = 8;
const SECTIONS = ["waktu", "lokasi", "rincian", "bukti"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function friendlyError(err) {
  if (err instanceof TypeError || /fetch/i.test(err?.message || "")) {
    return "Tidak bisa terhubung ke server. Periksa koneksi internet lalu coba lagi.";
  }
  return err?.message || "Terjadi kesalahan. Coba lagi.";
}

export default function ReportForm() {
  const [step, setStep] = useState("form"); // form | success
  const [submitting, setSubmitting] = useState(false);
  const [kode, setKode] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [coords, setCoords] = useState(null);
  const [signature, setSignature] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);
  const mountedAt = useRef(Date.now());
  const formRef = useRef(null);

  const [fields, setFields] = useState({
    tanggal: todayISO(),
    pukul: nowHHMM(),
    nama_pelapor: "",
    afdeling: "",
    blok: "",
    tm: "",
    kategori: "pencurian",
    keterangan: "",
    website: "", // honeypot — kosongkan selalu, hanya bot yang mengisi ini
  });

  const progress = SECTIONS.filter((s) => {
    if (s === "waktu") return fields.tanggal && fields.pukul && fields.nama_pelapor;
    if (s === "lokasi") return fields.afdeling && fields.blok && coords;
    if (s === "rincian") return fields.keterangan.trim().length > 0;
    if (s === "bukti") return !!signature;
    return false;
  }).length;

  function update(key, value) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handlePhotoSelect(e) {
    const files = Array.from(e.target.files || []).slice(0, 6);
    const tooBig = files.filter((f) => f.size > MAX_PHOTO_MB * 1024 * 1024);
    if (tooBig.length > 0) {
      setPhotoError(
        `${tooBig.length} foto melebihi ${MAX_PHOTO_MB}MB dan tidak disertakan. Kompres atau pilih foto lain.`
      );
    } else {
      setPhotoError("");
    }
    setPhotoFiles(files.filter((f) => f.size <= MAX_PHOTO_MB * 1024 * 1024));
  }

  function removePhoto(idx) {
    setPhotoFiles((files) => files.filter((_, i) => i !== idx));
  }

  function focusFirstInvalid() {
    const invalid = formRef.current?.querySelector(":invalid");
    if (invalid) {
      invalid.scrollIntoView({ behavior: "smooth", block: "center" });
      invalid.focus({ preventScroll: true });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!formRef.current?.reportValidity()) {
      focusFirstInvalid();
      return;
    }
    if (!coords) {
      setErrorMsg("Tentukan koordinat lokasi kejadian pada peta terlebih dahulu.");
      return;
    }
    if (!signature) {
      setErrorMsg("Tanda tangan wajib dibubuhkan sebelum mengirim laporan.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
      formData.append("lat", String(coords[0]));
      formData.append("lng", String(coords[1]));
      formData.append("ttd", signature);
      formData.append("render_ts", String(mountedAt.current));
      photoFiles.forEach((file) => formData.append("foto", file));

      const res = await fetch("/api/laporan", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Gagal mengirim laporan.");
      }

      setKode(json.kode);
      setStep("success");
    } catch (err) {
      setErrorMsg(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setFields({
      tanggal: todayISO(),
      pukul: nowHHMM(),
      nama_pelapor: "",
      afdeling: "",
      blok: "",
      tm: "",
      kategori: "pencurian",
      keterangan: "",
      website: "",
    });
    setCoords(null);
    setSignature(null);
    setPhotoFiles([]);
    setPhotoError("");
    setKode(null);
    setCopied(false);
    mountedAt.current = Date.now();
    setStep("form");
  }

  function copyKode() {
    if (!kode) return;
    navigator.clipboard?.writeText(kode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (step === "success") {
    const waMessage = encodeURIComponent(
      `Laporan kehilangan/pencurian sawit sudah dikirim.\nKode laporan: ${kode}\nCek status di: ${typeof window !== "undefined" ? window.location.origin : ""}/cek-status`
    );
    return (
      <div className="card-shell mx-auto max-w-md px-6 py-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-canopy-700/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#1B4332"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="font-display text-xl font-bold text-canopy-900">
          Laporan terkirim
        </h2>
        <p className="mt-2 text-sm text-ink-700">
          Simpan kode laporan berikut untuk cek status atau tindak lanjut petugas keamanan.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-lg border-2 border-dashed border-canopy-700/40 bg-canopy-700/5 py-3 pl-4 pr-2">
          <p className="flex-1 text-left font-mono text-lg font-semibold tracking-wider text-canopy-900">
            {kode}
          </p>
          <button
            type="button"
            onClick={copyKode}
            className="shrink-0 rounded-md border border-canopy-700/30 bg-paper-50 px-2.5 py-1.5 text-xs font-semibold text-canopy-800 transition hover:bg-canopy-700/10"
          >
            {copied ? "Tersalin ✓" : "Salin"}
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <Link
            href="/cek-status"
            className="flex-1 rounded-lg border border-ink-900/15 bg-paper-50 py-2.5 text-xs font-semibold text-ink-700 transition hover:border-canopy-600"
          >
            Cek status laporan
          </Link>
          <a
            href={`https://wa.me/?text=${waMessage}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg border border-ink-900/15 bg-paper-50 py-2.5 text-xs font-semibold text-ink-700 transition hover:border-canopy-600"
          >
            Kirim ke WhatsApp
          </a>
        </div>

        <button
          onClick={resetForm}
          className="mt-3 w-full rounded-lg bg-canopy-900 py-3 text-sm font-semibold text-paper-50 transition active:scale-[0.99]"
        >
          Buat laporan baru
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate={false} className="mx-auto max-w-xl space-y-5 pb-16">
      {/* Progress indicator */}
      <div className="mx-auto flex max-w-xl items-center gap-1.5 px-0.5">
        {SECTIONS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < progress ? "bg-gold-600" : "bg-ink-900/10"
            }`}
          />
        ))}
      </div>

      {/* Honeypot anti-spam — disembunyikan dari manusia lewat CSS, terlihat oleh bot */}
      <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Jangan isi ini</label>
        <input
          id="website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={fields.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      {/* Section: Identitas & Waktu */}
      <section className="card-shell p-5">
        <SectionHeading eyebrow="01" title="Waktu &amp; Identitas Pelapor" />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">
              Tanggal <span className="text-alert">*</span>
            </label>
            <input
              type="date"
              required
              className="field-shell"
              value={fields.tanggal}
              onChange={(e) => update("tanggal", e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">
              Pukul <span className="text-alert">*</span>
            </label>
            <input
              type="time"
              required
              className="field-shell"
              value={fields.pukul}
              onChange={(e) => update("pukul", e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="field-label">
            Nama Pelapor <span className="text-alert">*</span>
          </label>
          <input
            type="text"
            required
            minLength={3}
            placeholder="Nama lengkap sesuai identitas"
            className="field-shell"
            value={fields.nama_pelapor}
            onChange={(e) => update("nama_pelapor", e.target.value)}
          />
        </div>
      </section>

      {/* Section: Lokasi */}
      <section className="card-shell p-5">
        <SectionHeading eyebrow="02" title="Lokasi Kejadian" />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">
              Afdeling <span className="text-alert">*</span>
            </label>
            <select
              required
              className="field-shell"
              value={fields.afdeling}
              onChange={(e) => update("afdeling", e.target.value)}
            >
              <option value="" disabled>
                Pilih afdeling
              </option>
              {AFDELING_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">
              Blok <span className="text-alert">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="cth. B-14"
              className="field-shell"
              value={fields.blok}
              onChange={(e) => update("blok", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="field-label">TM</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => update("tm", String(Math.max(0, Number(fields.tm || 0) - 1)))}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-900/15 bg-paper-50 text-lg font-semibold text-ink-700 transition hover:border-canopy-600 active:scale-95"
            >
              −
            </button>
            <input
              type="number"
              min="0"
              className="field-shell text-center"
              value={fields.tm}
              onChange={(e) => update("tm", e.target.value)}
            />
            <button
              type="button"
              onClick={() => update("tm", String(Number(fields.tm || 0) + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-900/15 bg-paper-50 text-lg font-semibold text-ink-700 transition hover:border-canopy-600 active:scale-95"
            >
              +
            </button>
          </div>
          <p className="mt-1 text-xs text-ink-500">Sesuaikan dengan satuan pencatatan internal kebun</p>
        </div>

        <div className="mt-4">
          <label className="field-label">
            Koordinat <span className="text-alert">*</span>
          </label>
          <MapPicker value={coords} onChange={setCoords} />
        </div>
      </section>

      {/* Section: Rincian */}
      <section className="card-shell p-5">
        <SectionHeading eyebrow="03" title="Rincian Kejadian" />
        <div className="mt-4">
          <label className="field-label">Kategori</label>
          <select
            className="field-shell"
            value={fields.kategori}
            onChange={(e) => update("kategori", e.target.value)}
          >
            {KATEGORI_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          <label className="field-label">
            Keterangan <span className="text-alert">*</span>
          </label>
          <textarea
            required
            minLength={10}
            rows={4}
            placeholder="Jelaskan kronologi kejadian secara singkat dan jelas (minimal 10 karakter)"
            className="field-shell resize-none"
            value={fields.keterangan}
            onChange={(e) => update("keterangan", e.target.value)}
          />
        </div>
      </section>

      {/* Section: Bukti */}
      <section className="card-shell p-5">
        <SectionHeading eyebrow="04" title="Bukti &amp; Pengesahan" />

        <div className="mt-4">
          <label className="field-label">
            Tanda Tangan <span className="text-alert">*</span>
          </label>
          <SignaturePad onChange={setSignature} />
        </div>

        <div className="mt-5">
          <label className="field-label">
            Dokumentasi (opsional, maks. 6 foto, {MAX_PHOTO_MB}MB/foto)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink-900/20 bg-paper-100 py-4 text-sm font-medium text-ink-700 transition hover:border-canopy-600 hover:text-canopy-700"
          >
            <CameraIcon />
            Ambil / pilih foto lokasi
          </button>

          {photoError && (
            <p className="mt-2 text-xs font-medium text-alert-dark">{photoError}</p>
          )}

          {photoFiles.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {photoFiles.map((file, idx) => (
                <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-ink-900/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Dokumentasi ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900/70 text-[10px] font-bold text-paper-50"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-alert/30 bg-alert-light px-4 py-3 text-sm text-alert-dark"
        >
          <span aria-hidden="true">⚠</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-600 py-3.5 text-sm font-semibold uppercase tracking-wide text-canopy-950 shadow-sm transition hover:bg-gold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <SendIcon />
        )}
        {submitting ? "Mengirim laporan..." : "Kirim Laporan"}
      </button>

      <p className="text-center text-xs text-ink-500">
        Sudah pernah lapor?{" "}
        <Link href="/cek-status" className="font-semibold text-canopy-700 hover:underline">
          Cek status laporan di sini
        </Link>
      </p>
    </form>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div className="flex items-baseline gap-2.5 border-b border-ink-900/10 pb-3">
      <span className="font-mono text-xs font-semibold text-gold-dark">{eyebrow}</span>
      <h2 className="font-display text-[15px] font-bold text-canopy-900">{title}</h2>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.5" r="3.3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12l16-8-6 8 6 8-16-8zm0 0h9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
