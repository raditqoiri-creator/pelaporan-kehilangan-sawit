import Link from "next/link";
import CekStatusForm from "@/components/CekStatusForm";

export const metadata = {
  title: "Cek Status Laporan — Lapor Kehilangan Sawit",
};

export default function CekStatusPage() {
  return (
    <main className="min-h-screen bg-paper-100 pb-10">
      <header className="sticky top-0 z-[1000] border-b border-ink-900/10 bg-canopy-900 text-paper-50">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-5 py-4 lg:max-w-2xl lg:px-10">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-paper-50/25 transition hover:bg-paper-50/10"
          >
            ←
          </Link>
          <div>
            <p className="font-display text-[15px] font-bold leading-tight">
              Cek Status Laporan
            </p>
            <p className="text-[11.5px] text-paper-50/70">
              Lapor Kehilangan Sawit
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 pt-6 lg:mx-auto lg:max-w-2xl lg:px-10">
        <CekStatusForm />
      </div>
    </main>
  );
}
