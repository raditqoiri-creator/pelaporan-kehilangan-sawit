"use client";

// Modal konfirmasi custom — menggantikan confirm()/alert() bawaan browser
// yang terkesan kurang matang untuk aplikasi produksi.
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink-900/50 px-5"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-paper-50 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-modal-title" className="font-display text-base font-bold text-ink-900">
          {title}
        </h3>
        {message && <p className="mt-2 text-[13.5px] text-ink-700">{message}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-ink-900/15 px-4 py-2 text-xs font-semibold text-ink-700 transition hover:bg-paper-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-paper-50 transition disabled:opacity-60 ${
              danger ? "bg-alert hover:bg-alert-dark" : "bg-canopy-900 hover:bg-canopy-800"
            }`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
