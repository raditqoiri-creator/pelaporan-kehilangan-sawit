import { NextResponse } from "next/server";
import { sql, ensureSchema, generateKode } from "@/lib/db";
import { saveUploadedPhoto, saveSignatureDataUrl } from "@/lib/files";
import { getSession } from "@/lib/auth";
import { notifyLaporanBaru } from "@/lib/notify";

const REQUIRED_FIELDS = [
  "tanggal",
  "pukul",
  "nama_pelapor",
  "afdeling",
  "blok",
  "keterangan",
  "lat",
  "lng",
];
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB
const MIN_SUBMIT_MS = 2500; // formulir diisi manusia butuh > 2.5 detik

export async function POST(request) {
  try {
    await ensureSchema();

    const form = await request.formData();
    const data = {};
    for (const key of REQUIRED_FIELDS.concat(["tm", "tahun_tanam", "kategori", "ttd", "website", "render_ts", "estimasi_kerugian", "saksi"])) {
      data[key] = form.get(key);
    }

    // Anti-spam lapis 1: honeypot — field ini disembunyikan dari manusia lewat
    // CSS, kalau terisi berarti bot. Balas seolah sukses (kode palsu) supaya
    // bot tidak tahu ditolak dan tidak mencoba pola lain.
    if (data.website && String(data.website).trim() !== "") {
      return NextResponse.json({ ok: true, kode: generateKode() }, { status: 201 });
    }

    // Anti-spam lapis 2: submit terlalu cepat setelah form dimuat = kemungkinan bot.
    const renderTs = Number(data.render_ts);
    if (renderTs && Date.now() - renderTs < MIN_SUBMIT_MS) {
      return NextResponse.json({ ok: true, kode: generateKode() }, { status: 201 });
    }

    const missing = REQUIRED_FIELDS.filter((f) => !data[f] || String(data[f]).trim() === "");
    if (missing.length) {
      return NextResponse.json(
        { error: `Field wajib belum lengkap: ${missing.join(", ")}` },
        { status: 400 }
      );
    }
    if (String(data.nama_pelapor).trim().length < 3) {
      return NextResponse.json(
        { error: "Nama pelapor terlalu pendek." },
        { status: 400 }
      );
    }
    if (String(data.keterangan).trim().length < 10) {
      return NextResponse.json(
        { error: "Keterangan kejadian terlalu singkat, mohon dijelaskan lebih detail." },
        { status: 400 }
      );
    }
    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        { error: "Koordinat lokasi tidak valid. Tentukan ulang di peta." },
        { status: 400 }
      );
    }
    if (!data.ttd) {
      return NextResponse.json(
        { error: "Tanda tangan pelapor wajib diisi." },
        { status: 400 }
      );
    }

    const photos = form.getAll("foto").filter((f) => f && f.size > 0);
    const oversized = photos.filter((f) => f.size > MAX_PHOTO_BYTES);
    if (oversized.length > 0) {
      return NextResponse.json(
        { error: `Ada foto yang melebihi 8MB. Kompres atau pilih foto lain (${oversized.length} foto bermasalah).` },
        { status: 400 }
      );
    }

    const kode = generateKode();
    const ttdUrl = await saveSignatureDataUrl(data.ttd);

    // Terima input bebas seperti "Rp 2.500.000" atau "2500000" — ambil angkanya saja.
    const kerugianRaw = String(data.estimasi_kerugian || "").replace(/[^0-9]/g, "");
    const estimasiKerugian = kerugianRaw ? Number(kerugianRaw) : null;

    const [laporan] = await sql`
      INSERT INTO laporan
        (kode, tanggal, pukul, nama_pelapor, afdeling, blok, tm, tahun_tanam, kategori, keterangan, lat, lng, ttd_path, estimasi_kerugian, saksi)
      VALUES
        (${kode}, ${data.tanggal}, ${data.pukul}, ${String(data.nama_pelapor).trim()}, ${data.afdeling}, ${data.blok},
         ${data.tm || null}, ${data.tahun_tanam || null}, ${data.kategori || "pencurian"}, ${String(data.keterangan).trim()},
         ${lat}, ${lng}, ${ttdUrl}, ${estimasiKerugian}, ${data.saksi ? String(data.saksi).trim() : null})
      RETURNING id
    `;

    for (const photo of photos.slice(0, 6)) {
      const url = await saveUploadedPhoto(photo);
      await sql`INSERT INTO dokumentasi (laporan_id, file_path) VALUES (${laporan.id}, ${url})`;
    }

    // Notifikasi email — sengaja tidak di-await supaya respons ke pelapor tetap
    // cepat; kegagalan kirim email ditangani sendiri di dalam notifyLaporanBaru
    // dan tidak akan pernah menggagalkan penyimpanan laporan.
    notifyLaporanBaru({
      kode,
      nama_pelapor: data.nama_pelapor,
      afdeling: data.afdeling,
      blok: data.blok,
      tanggal: data.tanggal,
      pukul: data.pukul,
      keterangan: data.keterangan,
    });

    return NextResponse.json({ ok: true, kode }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Coba lagi." },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  await ensureSchema();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");

  let query = "SELECT * FROM laporan WHERE 1=1";
  const params = [];

  if (status && status !== "semua") {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  if (dari) {
    params.push(dari);
    query += ` AND tanggal >= $${params.length}`;
  }
  if (sampai) {
    params.push(sampai);
    query += ` AND tanggal <= $${params.length}`;
  }
  if (q) {
    const like = `%${q}%`;
    params.push(like, like, like, like);
    const base = params.length - 3;
    query += ` AND (kode ILIKE $${base} OR nama_pelapor ILIKE $${base + 1} OR afdeling ILIKE $${base + 2} OR blok ILIKE $${base + 3})`;
  }
  query += " ORDER BY dibuat_pada DESC";

  const rows = await sql.unsafe(query, params);
  return NextResponse.json({ data: rows });
}
