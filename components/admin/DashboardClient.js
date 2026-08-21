"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";

const AdminMapView = dynamic(() => import("./AdminMapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] w-full items-center justify-center rounded-2xl border border-ink-900/10 bg-paper-50 text-sm text-ink-500">
      Memuat peta...
    </div>
  ),
});

const TABS = [
  { key: "semua", label: "Semua" },
  { key: "baru", label: "Baru" },
  { key: "diproses", label: "Diproses" },
  { key: "selesai", label: "Selesai" },
];

const KATEGORI_LABEL = {
  pencurian: "Pencurian TBS",
  kehilangan: "Kehilangan",
  percobaan: "Percobaan / mencurigakan",
};

const POLL_INTERVAL_MS = 12000;
const BASE_TITLE = "Panel Keamanan · Lapor Kehilangan Sawit";

function formatTanggal(str) {
  if (!str) return "-";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // audio bisa gagal di beberapa browser tanpa interaksi user dulu — abaikan saja
  }
}

export default function DashboardClient({ initialData, adminName }) {
  const router = useRouter();
  const [tab, setTab] = useState("semua");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("daftar"); // daftar | peta
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [rows, setRows] = useState(initialData);
  const [pendingNew, setPendingNew] = useState([]);
  const [lastSynced, setLastSynced] = useState(new Date());
  const knownIds = useRef(new Set(initialData.map((r) => r.id)));
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const counts = useMemo(
    () => ({
      semua: rows.length,
      baru: rows.filter((r) => r.status === "baru").length,
      diproses: rows.filter((r) => r.status === "diproses").length,
      selesai: rows.filter((r) => r.status === "selesai").length,
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchTab = tab === "semua" || r.status === tab;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        r.kode.toLowerCase().includes(q) ||
        r.nama_pelapor.toLowerCase().includes(q) ||
        r.afdeling.toLowerCase().includes(q) ||
        r.blok.toLowerCase().includes(q);
      return matchTab && matchQuery;
    });
  }, [rows, tab, query]);

  // Polling: cek laporan baru secara berkala tanpa mengganggu tampilan yang sedang dibuka
  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/laporan", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      const latest = json.data || [];

      const fresh = latest.filter((r) => !knownIds.current.has(r.id));

      // Sinkronkan perubahan status/catatan pada laporan yang sudah dikenal (tanpa reorder)
      setRows((prev) => {
        const latestById = new Map(latest.map((r) => [r.id, r]));
        return prev.map((r) => latestById.get(r.id) || r);
      });

      if (fresh.length > 0) {
        setPendingNew((prev) => {
          const prevIds = new Set(prev.map((r) => r.id));
          const merged = [...fresh.filter((r) => !prevIds.has(r.id)), ...prev];
          return merged;
        });
        playChime();
      }
      setLastSynced(new Date());
    } catch {
      // koneksi sempat gagal — coba lagi di siklus polling berikutnya
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  useEffect(() => {
    document.title =
      pendingNew.length > 0 ? `(${pendingNew.length}) ${BASE_TITLE}` : BASE_TITLE;
  }, [pendingNew.length]);

  function loadPendingNew() {
    setRows((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const toAdd = pendingNew.filter((r) => !existingIds.has(r.id));
      toAdd.forEach((r) => knownIds.current.add(r.id));
      return [...toAdd, ...prev];
    });
    setPendingNew([]);
    setTab("baru");
  }

  async function openDetail(id) {
    setSelected(id);
    setLoadingDetail(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/laporan/${id}`);
      const json = await res.json();
      if (res.ok) setDetail(json.data);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function updateStatus(status) {
    if (!selected) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/laporan/${selected}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (res.ok) {
        setDetail((d) => ({ ...d, status: json.data.status }));
        setRows((rs) =>
          rs.map((r) => (r.id === selected ? { ...r, status: json.data.status } : r))
        );
      }
    } finally {
      setSavingStatus(false);
    }
  }

  async function saveCatatan(catatan) {
    if (!selected) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/laporan/${selected}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catatan_admin: catatan }),
      });
      const json = await res.json();
      if (res.ok) setDetail((d) => ({ ...d, catatan_admin: json.data.catatan_admin }));
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper-100">
      {/* Top bar */}
      <header className="sticky top-0 z-[1000] border-b border-ink-900/10 bg-canopy-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-600">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" fill="#0D2318" />
              </svg>
            </div>
            <div>
              <p className="font-display text-sm font-bold text-paper-50">
                Panel Keamanan
              </p>
              <p className="text-[11px] text-paper-50/60">Lapor Kehilangan Sawit</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] text-paper-50/80 sm:inline">
              {adminName}
            </span>
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-paper-50/25 text-paper-50">
                <BellIcon />
              </div>
              {pendingNew.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-alert px-1 text-[10px] font-bold text-paper-50">
                  {pendingNew.length}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md border border-paper-50/25 px-3 py-1.5 text-xs font-semibold text-paper-50 transition hover:bg-paper-50/10"
            >
              Keluar
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-2.5">
          <Link
            href="/admin/dashboard/users"
            className="text-[11px] font-semibold text-paper-50/70 hover:text-paper-50 hover:underline"
          >
            ⚙ Kelola akun admin
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-5 px-5 py-5">
        {/* List column */}
        <section
          className={`w-full ${viewMode === "peta" ? "" : "lg:max-w-md"} ${
            selected ? "hidden lg:block" : ""
          }`}
        >
          {pendingNew.length > 0 && (
            <button
              onClick={loadPendingNew}
              className="mb-3 flex w-full items-center justify-between rounded-xl border-2 border-dashed border-alert bg-alert-light px-4 py-3 text-left transition hover:bg-alert-light/70"
            >
              <span className="flex items-center gap-2 text-[13px] font-semibold text-alert-dark">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-alert opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-alert" />
                </span>
                {pendingNew.length} laporan baru masuk
              </span>
              <span className="text-xs font-semibold text-alert-dark underline">
                Muat sekarang
              </span>
            </button>
          )}

          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex gap-1.5 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    tab === t.key
                      ? "bg-canopy-900 text-paper-50"
                      : "bg-paper-50 text-ink-700 border border-ink-900/10"
                  }`}
                >
                  {t.label}{" "}
                  <span className="opacity-70">({counts[t.key] ?? 0})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-ink-900/10">
              <button
                onClick={() => setViewMode("daftar")}
                className={`px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "daftar" ? "bg-canopy-900 text-paper-50" : "bg-paper-50 text-ink-700"
                }`}
              >
                Daftar
              </button>
              <button
                onClick={() => setViewMode("peta")}
                className={`px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "peta" ? "bg-canopy-900 text-paper-50" : "bg-paper-50 text-ink-700"
                }`}
              >
                Peta
              </button>
            </div>
            <a
              href={`/api/laporan/export${tab !== "semua" ? `?status=${tab}` : ""}`}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-ink-900/10 bg-paper-50 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-canopy-600"
            >
              <DownloadIcon />
              Export CSV
            </a>
          </div>

          <p className="mb-3 text-[11px] text-ink-500">
            Auto-sinkron tiap {POLL_INTERVAL_MS / 1000} detik &middot; terakhir:{" "}
            {lastSynced.toLocaleTimeString("id-ID")}
          </p>

          <input
            type="text"
            placeholder="Cari kode, nama, afdeling, blok..."
            className="field-shell mb-4"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {viewMode === "peta" ? (
            <AdminMapView rows={filtered} onSelect={openDetail} />
          ) : (
            <div className="space-y-2.5">
              {filtered.length === 0 && (
                <p className="rounded-lg border border-dashed border-ink-900/15 bg-paper-50 py-10 text-center text-sm text-ink-500">
                  Tidak ada laporan yang cocok.
                </p>
              )}
              {filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => openDetail(r.id)}
                  className={`block w-full rounded-xl border bg-paper-50 p-4 text-left transition hover:border-canopy-600/50 hover:shadow-[0_2px_10px_rgba(20,31,25,0.08)] ${
                    selected === r.id ? "border-canopy-700 ring-1 ring-canopy-700" : "border-ink-900/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-xs font-semibold text-ink-700">{r.kode}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1.5 font-display text-[15px] font-bold text-canopy-900">
                    {r.nama_pelapor}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-700">
                    {r.afdeling} &middot; Blok {r.blok}
                  </p>
                  <p className="mt-1.5 text-[11px] text-ink-500">
                    {formatTanggal(r.tanggal)} &middot; {r.pukul}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Detail column */}
        <section className={`w-full flex-1 ${selected ? "" : "hidden lg:block"}`}>
          {!selected && (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-900/15 bg-paper-50 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-canopy-700/10">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 12h6m-6 4h4m-7 5l3-3h9a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h1z"
                    stroke="#1B4332"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-sm text-ink-500">Pilih laporan di sebelah kiri untuk melihat detail</p>
            </div>
          )}

          {selected && (
            <div className="rounded-2xl border border-ink-900/10 bg-paper-50">
              <div className="flex items-center gap-3 border-b border-ink-900/10 p-4 lg:hidden">
                <button
                  onClick={() => setSelected(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-900/15"
                >
                  ←
                </button>
                <span className="text-sm font-semibold text-ink-900">Detail Laporan</span>
              </div>

              {loadingDetail && (
                <p className="p-6 text-sm text-ink-500">Memuat detail laporan...</p>
              )}

              {detail && !loadingDetail && (
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-ink-900/15 pb-4">
                    <div>
                      <p className="font-mono text-xs font-semibold text-alert">{detail.kode}</p>
                      <h2 className="mt-1 font-display text-lg font-bold text-canopy-900">
                        {detail.nama_pelapor}
                      </h2>
                      <p className="mt-0.5 text-[13px] text-ink-700">
                        {KATEGORI_LABEL[detail.kategori] || detail.kategori}
                      </p>
                    </div>
                    <StatusBadge status={detail.status} className="rotate-0" />
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[13.5px]">
                    <Field label="Tanggal" value={formatTanggal(detail.tanggal)} />
                    <Field label="Pukul" value={detail.pukul} />
                    <Field label="Afdeling" value={detail.afdeling} />
                    <Field label="Blok" value={detail.blok} />
                    <Field label="TM" value={detail.tm || "-"} />
                    <Field
                      label="Koordinat"
                      value={`${Number(detail.lat).toFixed(6)}, ${Number(detail.lng).toFixed(6)}`}
                      mono
                    />
                  </dl>

                  <a
                    href={`https://www.google.com/maps?q=${detail.lat},${detail.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-canopy-700 hover:underline"
                  >
                    Buka di Google Maps ↗
                  </a>

                  <div className="mt-4">
                    <p className="field-label">Keterangan</p>
                    <p className="rounded-lg bg-paper-100 p-3 text-[13.5px] leading-relaxed text-ink-900">
                      {detail.keterangan}
                    </p>
                  </div>

                  {detail.ttd_path && (
                    <div className="mt-4">
                      <p className="field-label">Tanda Tangan Pelapor</p>
                      <div className="w-40 rounded-lg border border-ink-900/10 bg-white p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={detail.ttd_path} alt="Tanda tangan" className="w-full" />
                      </div>
                    </div>
                  )}

                  {detail.foto?.length > 0 && (
                    <div className="mt-4">
                      <p className="field-label">Dokumentasi</p>
                      <div className="grid grid-cols-3 gap-2">
                        {detail.foto.map((f) => (
                          <a
                            key={f.id}
                            href={f.file_path}
                            target="_blank"
                            rel="noreferrer"
                            className="aspect-square overflow-hidden rounded-lg border border-ink-900/10"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={f.file_path}
                              alt="Dokumentasi"
                              className="h-full w-full object-cover transition hover:scale-105"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 border-t border-dashed border-ink-900/15 pt-4">
                    <p className="field-label">Ubah status</p>
                    <div className="flex gap-2">
                      {["baru", "diproses", "selesai"].map((s) => (
                        <button
                          key={s}
                          disabled={savingStatus}
                          onClick={() => updateStatus(s)}
                          className={`flex-1 rounded-lg border py-2 text-xs font-semibold capitalize transition disabled:opacity-50 ${
                            detail.status === s
                              ? "border-canopy-700 bg-canopy-700 text-paper-50"
                              : "border-ink-900/15 bg-paper-50 text-ink-700 hover:border-canopy-600"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <CatatanAdmin
                    initial={detail.catatan_admin || ""}
                    onSave={saveCatatan}
                    saving={savingStatus}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 8a6 6 0 1112 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M10 20a2 2 0 004 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </dt>
      <dd className={`mt-0.5 text-ink-900 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function CatatanAdmin({ initial, onSave, saving }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="mt-5 border-t border-dashed border-ink-900/15 pt-4">
      <p className="field-label">Catatan internal admin</p>
      <textarea
        rows={3}
        className="field-shell resize-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Catatan tindak lanjut, hasil investigasi, dsb."
      />
      <button
        onClick={() => onSave(value)}
        disabled={saving}
        className="mt-2 rounded-lg bg-canopy-900 px-4 py-2 text-xs font-semibold text-paper-50 disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : "Simpan catatan"}
      </button>
    </div>
  );
}
