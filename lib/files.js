import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "lapor-kehilangan-sawit";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[storage] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diatur. Tambahkan di .env.local / Vercel Environment Variables."
  );
}

// Placeholder agar build tidak gagal saat env belum di-set — createClient()
// tidak langsung konek ke jaringan, jadi aman dipakai saat build time.
const supabase = createClient(
  process.env.SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key",
  { auth: { persistSession: false } }
);

async function uploadToBucket(path, bytes, contentType) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (error) {
    throw new Error(`Gagal mengunggah file ke Supabase Storage: ${error.message}`);
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function saveUploadedPhoto(file) {
  const ext = (file.type?.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const filename = `foto/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  return uploadToBucket(filename, bytes, file.type || "image/jpeg");
}

export async function saveSignatureDataUrl(dataUrl) {
  const match = /^data:image\/(png|jpeg);base64,(.+)$/.exec(dataUrl || "");
  if (!match) return null;
  const [, ext, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  const filename = `ttd/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  return uploadToBucket(filename, bytes, `image/${ext}`);
}
