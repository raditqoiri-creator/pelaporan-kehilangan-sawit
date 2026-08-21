"use client";

import { useState } from "react";
import Link from "next/link";

export default function UsersClient({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nama: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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
      setForm({ nama: "", username: "", password: "" });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Hapus akun admin ini? Tindakan tidak bisa dibatalkan.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus admin.");
      setUsers((u) => u.filter((x) => x.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-paper-100">
      <header className="sticky top-0 z-20 border-b border-ink-900/10 bg-canopy-900">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3.5">
          <Link
            href="/admin/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-paper-50/25 text-paper-50"
          >
            ←
          </Link>
          <div>
            <p className="font-display text-sm font-bold text-paper-50">Kelola Akun Admin</p>
            <p className="text-[11px] text-paper-50/60">Lapor Kehilangan Sawit</p>
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
            <div className="mt-4">
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

        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-xl border border-ink-900/10 bg-paper-50 p-4"
            >
              <div>
                <p className="font-display text-sm font-bold text-canopy-900">{u.nama}</p>
                <p className="font-mono text-xs text-ink-500">@{u.username}</p>
              </div>
              <button
                onClick={() => handleDelete(u.id)}
                disabled={deletingId === u.id}
                className="rounded-md border border-alert/30 px-3 py-1.5 text-xs font-semibold text-alert-dark transition hover:bg-alert-light disabled:opacity-50"
              >
                {deletingId === u.id ? "..." : "Hapus"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
