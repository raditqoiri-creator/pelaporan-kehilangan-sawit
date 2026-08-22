import "./globals.css";

export const metadata = {
  title: "SIAGA TBS — Sistem Informasi Pengamanan dan Pelaporan TBS",
  description:
    "Sistem pelaporan resmi kehilangan dan pencurian TBS (Tandan Buah Segar) untuk unit keamanan kebun PT Perkebunan Nusantara IV.",
};

export const viewport = {
  themeColor: "#0F2A1D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="font-body bg-paper-100 text-ink-900 antialiased">
        {children}
      </body>
    </html>
  );
}
