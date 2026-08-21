"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const STATUS_COLOR = {
  baru: "#C2410C",
  diproses: "#B7791F",
  selesai: "#1B4332",
};

function markerIcon(status) {
  const color = STATUS_COLOR[status] || STATUS_COLOR.baru;
  return L.divIcon({
    className: "",
    html: `<div style="
        width:18px;height:18px;border-radius:50%;
        background:${color};border:2.5px solid #FBFAF7;
        box-shadow:0 1px 4px rgba(0,0,0,0.4);
      "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const DEFAULT_CENTER = [3.074572, 99.508756];

export default function AdminMapView({ rows, onSelect }) {
  const points = useMemo(
    () => rows.filter((r) => typeof r.lat === "number" && typeof r.lng === "number"),
    [rows]
  );

  const center = points.length > 0 ? [points[0].lat, points[0].lng] : DEFAULT_CENTER;

  return (
    <div className="relative isolate z-0 overflow-hidden rounded-2xl border border-ink-900/10">
      <div className="flex items-center gap-4 border-b border-ink-900/10 bg-paper-50 px-4 py-2.5 text-[11px] font-semibold text-ink-700">
        <LegendDot color={STATUS_COLOR.baru} label="Baru" />
        <LegendDot color={STATUS_COLOR.diproses} label="Diproses" />
        <LegendDot color={STATUS_COLOR.selesai} label="Selesai" />
        <span className="ml-auto text-ink-500">{points.length} laporan bertitik lokasi</span>
      </div>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-[60vh] w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((r) => (
          <Marker key={r.id} position={[r.lat, r.lng]} icon={markerIcon(r.status)}>
            <Popup>
              <div className="min-w-[160px] text-sm">
                <p className="font-mono text-[11px] font-semibold text-alert">{r.kode}</p>
                <p className="font-semibold text-canopy-900">{r.nama_pelapor}</p>
                <p className="text-xs text-ink-700">
                  {r.afdeling} &middot; Blok {r.blok}
                </p>
                <button
                  onClick={() => onSelect(r.id)}
                  className="mt-2 w-full rounded-md bg-canopy-900 py-1.5 text-xs font-semibold text-paper-50"
                >
                  Lihat detail
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
