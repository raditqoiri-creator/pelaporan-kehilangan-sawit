"use client";

import { useState } from "react";
import Link from "next/link";
import { COMPANY_NAME, APP_NAME } from "@/components/BrandMark";
import ConfirmModal from "@/components/ConfirmModal";

export default function UsersClient({ initialUsers, currentUsername }) {
  const [users, setUsers] = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nama: "", username: "", password: "", role: "admin" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, nama }
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambah admin.");
      setUsers((u) => [...u, json.data]);
      setForm({ nama: "", username: "", password: "", role: "admin" });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus admin.");
      setUsers((u) => u.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper-100">
      <header className="sticky top-0 z-20 border-b border-ink-900/10 bg-canopy-900">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3.5">
          <Link
            href="/admin/dashboard"
            aria-label="Kembali ke dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-paper-50/25 text-paper-50"
          >
            ←
          </Link>
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-wider text-gold">
              {COMPANY_NAME}
            </p>
            <p className="font-display text-sm font-bold text-paper-50">Kelola Akun Admin</p>
            <p className="text-[11px] text-paper-50/60">{APP_NAME}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-700">{users.length} akun admin terdaftar</p>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-lg bg-canopy-900 px-4 py-2 text-xs font-semibold text-paper-50"
          >
            {showForm ? "Batal" : "+ Tambah admin"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="card-shell mb-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Nama</label>
                <input
                  type="text"
                  required
                  className="field-shell"
                  value={form.nama}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                />
              </div>
              <div>
                <label className="field-label">Username</label>
                <input
                  type="text"
                  required
                  className="field-shell"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Password (min. 8 karakter)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="field-shell"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div>
                <label className="field-label">Peran</label>
                <select
                  className="field-shell"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="admin">Admin (petugas)</option>
                  <option value="superadmin">Superadmin</option>
                </select>
                <p className="mt-1 text-[11px] text-ink-500">
                  Superadmin bisa kelola akun admin lain &amp; hapus laporan.
                </p>
              </div>
            </div>
            {error && (
              <p className="mt-3 rounded-lg bg-alert-light px-3 py-2 text-xs text-alert-dark">{error}</p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="mt-4 rounded-lg bg-alert px-4 py-2 text-xs font-semibold text-paper-50 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan admin baru"}
            </button>
          </form>
        )}

        {deleteError && (
          <p className="mb-3 rounded-lg bg-alert-light px-3 py-2 text-xs text-alert-dark">{deleteError}</p>
        )}

        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-xl border border-ink-900/10 bg-paper-50 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-sm font-bold text-canopy-900">{u.nama}</p>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      u.role === "superadmin"
                        ? "bg-gold-600/20 text-gold-dark"
                        : "bg-ink-900/5 text-ink-500"
                    }`}
                  >
                    {u.role === "superadmin" ? "Superadmin" : "Admin"}
                  </span>
                  {u.username === currentUsername && (
                    <span className="rounded bg-canopy-700/10 px-1.5 py-0.5 text-[10px] font-semibold text-canopy-700">
                      Kamu
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-ink-500">@{u.username}</p>
              </div>
              <button
                onClick={() => setDeleteTarget({ id: u.id, nama: u.nama })}
                aria-label={`Hapus admin ${u.nama}`}
                className="rounded-md border border-alert/30 px-3 py-1.5 text-xs font-semibold text-alert-dark transition hover:bg-alert-light"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={`Hapus akun ${deleteTarget?.nama || ""}?`}
        message="Tindakan ini tidak bisa dibatalkan. Akun tidak akan bisa login lagi setelah dihapus."
        confirmLabel="Ya, hapus"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
