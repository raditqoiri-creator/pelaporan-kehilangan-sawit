"use client";

import { useEffect, useRef, useState } from "react";

export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const drawing = useRef(false);
  const hasStroke = useRef(false);
  const lastPoint = useRef(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    function resize() {
      const { width, height } = wrap.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      const imgData = canvas.toDataURL();
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#141F19";
      if (hasStroke.current) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, width, height);
        img.src = imgData;
      }
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function start(e) {
    e.preventDefault();
    drawing.current = true;
    lastPoint.current = getPos(e);
  }

  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPoint.current = pos;
    hasStroke.current = true;
    setEmpty(false);
  }

  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    if (hasStroke.current) {
      onChange?.(canvasRef.current.toDataURL("image/png"));
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStroke.current = false;
    setEmpty(true);
    onChange?.(null);
  }

  return (
    <div>
      <div
        ref={wrapRef}
        className="relative h-40 w-full overflow-hidden rounded-lg border border-dashed border-ink-900/25 bg-paper-50"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        {empty && (
          <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-ink-500">
            Bubuhkan tanda tangan di area ini
          </p>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-ink-500">
          Tanda tangan sebagai bukti sah pelaporan
        </span>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-semibold text-alert hover:underline"
        >
          Hapus &amp; ulangi
        </button>
      </div>
    </div>
  );
}
