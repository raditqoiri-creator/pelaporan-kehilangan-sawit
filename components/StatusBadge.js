export const STATUS_CONFIG = {
  baru: {
    label: "Baru",
    className: "border-alert text-alert",
  },
  diproses: {
    label: "Diproses",
    className: "border-gold text-gold",
  },
  selesai: {
    label: "Selesai",
    className: "border-canopy-700 text-canopy-700",
  },
};

export default function StatusBadge({ status, className = "" }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.baru;
  return (
    <span
      className={`inline-flex -rotate-3 items-center rounded border-2 border-dashed px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-wider ${cfg.className} ${className}`}
    >
      {cfg.label}
    </span>
  );
}
