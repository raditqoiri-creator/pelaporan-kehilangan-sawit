"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Login gagal.");
      router.push(params.get("next") || "/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-canopy-950 via-canopy-900 to-canopy-800 px-5">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/10" />
      <div className="absolute -left-16 bottom-10 h-56 w-56 rotate-12 rounded-3xl bg-gold/5" />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold-600 shadow-lg shadow-black/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" fill="#0D2318" />
            </svg>
          </div>
          <h1 className="font-display text-lg font-bold text-paper-50">
            Portal Admin Keamanan
          </h1>
          <p className="mt-1 text-[13px] text-paper-50/60">
            Lapor Kehilangan Sawit
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-paper-50 p-6 shadow-2xl">
          <label className="field-label">Username</label>
          <input
            type="text"
            required
            autoFocus
            className="field-shell"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label className="field-label mt-4">Password</label>
          <input
            type="password"
            required
            className="field-shell"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="mt-3 rounded-lg bg-alert-light px-3 py-2 text-xs text-alert-dark">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-gold-600 py-3 text-sm font-semibold text-canopy-950 shadow-sm transition hover:bg-gold active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-paper-50/50">
          <Link href="/" className="hover:text-paper-50/80 hover:underline">
            ← Kembali ke formulir laporan
          </Link>
        </p>
      </div>
    </main>
  );
}
