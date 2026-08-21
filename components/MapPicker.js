"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.divIcon({
  className: "",
  html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:#C2410C;border:3px solid #FBFAF7;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const DEFAULT_CENTER = [3.074572, 99.508756]; // fallback: area kebun

function ClickCapture({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function MapPicker({ value, onChange }) {
  const [center, setCenter] = useState(value || DEFAULT_CENTER);
  const mapRef = useRef(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (value) setCenter(value);
  }, [value]);

  function locateMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = [pos.coords.latitude, pos.coords.longitude];
        setCenter(next);
        onChange(next);
        mapRef.current?.flyTo(next, 17);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div>
      <div className="relative isolate z-0 h-52 w-full overflow-hidden rounded-lg border border-ink-900/15">
        <MapContainer
          center={center}
          zoom={16}
          scrollWheelZoom={false}
          className="h-full w-full"
          whenCreated={(map) => (mapRef.current = map)}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={center}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                setCenter([lat, lng]);
                onChange([lat, lng]);
              },
            }}
          />
          <ClickCapture
            onPick={(pos) => {
              setCenter(pos);
              onChange(pos);
            }}
          />
        </MapContainer>
        <button
          type="button"
          onClick={locateMe}
          className="absolute right-2 top-2 z-[1000] rounded-md bg-canopy-900 px-2.5 py-1.5 text-xs font-semibold text-paper-50 shadow-md active:scale-95"
        >
          {locating ? "Mencari..." : "Titik saya"}
        </button>
      </div>
      <p className="mt-1.5 font-mono text-xs text-ink-700">
        {center[0].toFixed(6)}, {center[1].toFixed(6)}
        <span className="ml-2 text-ink-500">
          (tap peta atau geser pin untuk koreksi)
        </span>
      </p>
    </div>
  );
}
