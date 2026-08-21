import "./globals.css";

export const metadata = {
  title: "Lapor Kehilangan Sawit",
  description:
    "Sistem pelaporan kehilangan dan pencurian sawit untuk unit kebun perusahaan.",
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
