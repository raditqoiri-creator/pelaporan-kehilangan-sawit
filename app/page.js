import Link from "next/link";
import ReportForm from "@/components/ReportForm";
import { BrandMark, COMPANY_NAME, UNIT_NAME, APP_NAME, APP_FULL_NAME } from "@/components/BrandMark";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper-100 lg:flex">
      {/* Panel bermerek — hanya tampil di layar desktop (lg ke atas) */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-canopy-950 via-canopy-900 to-canopy-800 px-10 py-12 text-paper-50 lg:flex lg:w-[38%] lg:min-h-screen lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/10" />
        <div className="absolute -left-16 bottom-10 h-56 w-56 rotate-12 rounded-3xl bg-gold/5" />

        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-600 shadow-lg shadow-black/20">
            <BrandMark size={26} />
          </div>
          <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-widest text-gold">
            {COMPANY_NAME}
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-bold leading-tight">
            {APP_NAME}
          </h1>
          <p className="mt-1 text-[13px] font-medium text-paper-50/60">
            {APP_FULL_NAME}
          </p>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-paper-50/75">
            Sistem pelaporan resmi untuk {UNIT_NAME.toLowerCase()}.
            Laporkan kejadian langsung dari lapangan, lengkap dengan lokasi,
            bukti foto, dan tanda tangan digital.
          </p>
        </div>

        <div className="relative space-y-4">
          <InfoRow text="Tandai lokasi kejadian langsung dari peta interaktif" />
          <InfoRow text="Sahkan laporan dengan tanda tangan digital" />
          <InfoRow text="Tim keamanan menerima notifikasi laporan secara real-time" />
        </div>
      </aside>

      {/* Kolom form */}
      <div className="min-h-screen flex-1 pb-10">
        {/* App bar — hanya tampil di mobile/tablet, digantikan panel di desktop */}
        <header className="sticky top-0 z-[1000] border-b border-ink-900/10 bg-canopy-900 text-paper-50 lg:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-600">
                <BrandMark />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                  {COMPANY_NAME}
                </p>
                <p className="font-display text-[15px] font-bold leading-tight">
                  {APP_NAME}
                </p>
              </div>
            </div>
            <Link
              href="/cek-status"
              className="shrink-0 rounded-md border border-paper-50/25 px-2.5 py-1.5 text-[11px] font-semibold text-paper-50 transition hover:bg-paper-50/10"
            >
              Cek Status
            </Link>
          </div>
        </header>

        {/* Slim top bar khusus desktop — branding sudah ada di panel kiri */}
        <div className="hidden items-center justify-end gap-3 border-b border-ink-900/10 bg-paper-50 px-10 py-4 lg:flex">
          <Link
            href="/cek-status"
            className="rounded-md border border-ink-900/15 px-3 py-1.5 text-[12px] font-semibold text-ink-700 transition hover:border-canopy-600 hover:text-canopy-700"
          >
            Cek Status Laporan
          </Link>
        </div>

        {/* Hero strip */}
        <div className="mx-auto max-w-xl px-5 pb-2 pt-5 lg:max-w-2xl lg:px-10 lg:pt-8">
          <div className="card-shell relative overflow-hidden p-5">
            <div className="absolute -right-6 -top-6 h-24 w-24 rotate-12 rounded-2xl bg-gold/10" />
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-gold-dark">
              Formulir Resmi
            </p>
            <h1 className="mt-1.5 font-display text-xl font-bold leading-snug text-canopy-900 lg:hidden">
              Laporkan kehilangan atau pencurian sawit di lapangan
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-700">
              Isi selengkap mungkin. Sertakan koordinat, tanda tangan, dan foto
              bila memungkinkan agar tim keamanan dapat menindaklanjuti dengan cepat.
            </p>
          </div>
        </div>

        <div className="px-5 lg:max-w-2xl lg:px-10">
          <ReportForm />
        </div>

        <footer className="mx-auto max-w-xl px-5 pt-2 text-center text-[11px] text-ink-500 lg:max-w-2xl lg:px-10 lg:text-left">
          Data terenkripsi &amp; hanya dapat diakses oleh tim keamanan berwenang.
        </footer>
      </div>
    </main>
  );
}

function InfoRow({ text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
      <p className="text-[13.5px] leading-relaxed text-paper-50/80">{text}</p>
    </div>
  );
}

