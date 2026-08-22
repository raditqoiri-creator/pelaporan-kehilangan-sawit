// Kompres & resize foto di browser sebelum diupload — supaya foto besar dari
// kamera HP (sering 4-10MB) tidak membuat request ditolak server (Vercel
// membatasi ukuran request serverless function ke ~4.5MB). Hasilnya file
// JPEG baru, jauh lebih kecil, kualitas tetap cukup untuk dokumentasi.
export async function compressImage(file, { maxDimension = 1600, quality = 0.72 } = {}) {
  // Bukan gambar (jarang terjadi karena input sudah accept="image/*") — lewati saja.
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmapSafe(file);
  if (!bitmap) return file; // gagal decode — kirim apa adanya, biarkan validasi server yang menolak kalau perlu

  let { width, height } = bitmap;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;

  // Kalau hasil kompres justru lebih besar dari aslinya (jarang, biasanya file
  // asli sudah kecil), pakai yang asli saja.
  if (blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
}

async function createImageBitmapSafe(file) {
  try {
    if (window.createImageBitmap) {
      return await createImageBitmap(file);
    }
  } catch {
    // fallback di bawah
  }
  // Fallback untuk browser lama tanpa createImageBitmap
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}
