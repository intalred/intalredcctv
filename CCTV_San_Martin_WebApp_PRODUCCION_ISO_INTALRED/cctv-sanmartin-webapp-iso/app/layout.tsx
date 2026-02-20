import "./globals.css";
export const metadata = { title: "CCTV San Martín - ISO", description: "Gestión CCTV certificable" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="es"><body>{children}</body></html>);
}
