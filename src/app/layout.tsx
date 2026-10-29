import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const fuenteInterfaz = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fuenteMonoespaciada = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

const descripcion =
  "Laboratorio interactivo para simular y visualizar modulaciones AM, ASK, PSK y PSM: señales en el tiempo, espectro por FFT y constelaciones.";

export const metadata: Metadata = {
  title: { default: "Laboratorio Virtual de Modulaciones", template: "%s · Laboratorio de Modulaciones" },
  description: descripcion,
  applicationName: "Laboratorio Virtual de Modulaciones",
  keywords: ["modulación", "AM", "ASK", "PSK", "PSM", "QPSK", "comunicaciones", "FFT", "constelación", "laboratorio virtual"],
  openGraph: {
    title: "Laboratorio Virtual de Modulaciones",
    description: descripcion,
    type: "website",
    locale: "es",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c10",
};

export default function DisenoRaiz({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fuenteInterfaz.variable} ${fuenteMonoespaciada.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
