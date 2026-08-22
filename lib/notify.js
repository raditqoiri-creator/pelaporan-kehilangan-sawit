// Notifikasi email ke admin saat ada laporan baru masuk.
// Pakai Resend (https://resend.com) — API sederhana, gratis untuk volume kecil,
// tidak perlu setup SMTP manual. Kalau env var belum diisi, notifikasi cuma
// dilewati (skip) — TIDAK PERNAH membuat laporan gagal tersimpan.
//
// Env var yang dibutuhkan:
//   RESEND_API_KEY   -> API key dari dashboard Resend
//   NOTIFY_EMAIL_TO  -> alamat email admin/tim keamanan yang menerima notifikasi
//                       (boleh lebih dari satu, pisahkan dengan koma)
//   NOTIFY_EMAIL_FROM -> alamat pengirim, default pakai domain sandbox Resend
export async function notifyLaporanBaru(laporan) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL_TO;

  if (!apiKey || !to) {
    // Belum dikonfigurasi — bukan error, cukup catat di log server untuk info.
    console.log("[notify] RESEND_API_KEY / NOTIFY_EMAIL_TO belum diatur, notifikasi email dilewati.");
    return;
  }

  const from = process.env.NOTIFY_EMAIL_FROM || "SIAGA TBS <onboarding@resend.dev>";
  const recipients = to.split(",").map((s) => s.trim()).filter(Boolean);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:#0D2318;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0;">
        <p style="margin:0;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#C9A227;">
          SIAGA TBS &middot; Laporan Baru
        </p>
        <h2 style="margin:6px 0 0;font-size:18px;">${escapeHtml(laporan.kode)}</h2>
      </div>
      <div style="border:1px solid #eee;border-top:none;border-radius:0 0 10px 10px;padding:20px;">
        <table style="width:100%;font-size:13.5px;color:#222;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#666;">Pelapor</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(laporan.nama_pelapor)}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Afdeling / Blok</td><td style="padding:4px 0;">${escapeHtml(laporan.afdeling)} &middot; Blok ${escapeHtml(laporan.blok)}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Tanggal</td><td style="padding:4px 0;">${escapeHtml(laporan.tanggal)}, ${escapeHtml(laporan.pukul)}</td></tr>
          <tr><td style="padding:4px 0;color:#666;">Keterangan</td><td style="padding:4px 0;">${escapeHtml(laporan.keterangan)}</td></tr>
        </table>
        ${appUrl ? `<a href="${appUrl}/admin/dashboard" style="display:inline-block;margin-top:16px;background:#C9A227;color:#0D2318;font-weight:700;font-size:13px;padding:10px 16px;border-radius:8px;text-decoration:none;">Buka Dashboard</a>` : ""}
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: `[SIAGA TBS] Laporan baru — ${laporan.kode}`,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[notify] Gagal kirim email:", res.status, text);
    }
  } catch (err) {
    // Sengaja tidak dilempar ulang — kegagalan email tidak boleh menggagalkan
    // penyimpanan laporan.
    console.error("[notify] Error saat kirim email:", err.message);
  }
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
