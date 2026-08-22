// Identitas & lambang bersama — dipakai di semua halaman (form publik, cek
// status, login admin, dashboard admin) supaya tampilannya konsisten dan
// terasa resmi/institusional, selayaknya sistem internal perusahaan.
//
// CATATAN: nama unit/kebun di bawah ini contoh, sesuaikan dengan unit kerja
// yang sebenarnya sebelum publish (mis. "Regional I" atau nama kebun spesifik).
export const COMPANY_NAME = "PT Perkebunan Nusantara IV";
export const UNIT_NAME = "Unit Keamanan & Pengamanan Kebun";
export const APP_NAME = "SIAGA TBS";
export const APP_FULL_NAME = "Sistem Informasi Pengamanan dan Pelaporan TBS";

// Lambang perisai + daun sawit — identitas visual orisinal bertema
// keamanan & perkebunan, bukan reproduksi logo resmi perusahaan manapun.
export function BrandMark({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" fill="#0D2318" />
      <path
        d="M12 6.2c1.6 1.3 2.6 2.9 2.6 4.7 0 .5-.08.95-.22 1.35.6-.15 1.15-.5 1.6-1.02.86-1 1.1-2.35.6-3.85C15.9 5.7 14.1 4.6 12 4.4c-2.1.2-3.9 1.3-4.6 2.98-.5 1.5-.26 2.85.6 3.85.45.52 1 .87 1.6 1.02a3.6 3.6 0 01-.22-1.35c0-1.8 1-3.4 2.62-4.7z"
        fill="#C9A227"
      />
      <path d="M12 11.4v6.4" stroke="#C9A227" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
