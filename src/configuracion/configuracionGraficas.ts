import type { EstadoVisualizacion } from "@/tipos/tiposGraficas";

/** Colores consistentes por tipo de señal (sección 19.1). */
export const coloresSenales = {
  moduladora: "#4f8cff",
  portadora: "#a78bfa",
  modulada: "#22d3ee",
  envolvente: "#f59e0b",
  secundaria: "#f472b6",
  teorico: "#facc15",
  advertencia: "#facc15",
  error: "#f87171",
  sobremodulacion: "rgba(248, 113, 113, 0.16)",
  limiteSimbolo: "rgba(148, 163, 184, 0.35)",
  idealConstelacion: "#64748b",
} as const;

export const temaGraficas = {
  fuente: "Inter, ui-sans-serif, system-ui, sans-serif",
  colorTexto: "#cbd5e1",
  colorTextoTenue: "#94a3b8",
  fondoGrafica: "#0d1017",
  colorRejilla: "#232937",
  colorEjeCero: "#3b4354",
  alturaTiempo: 230,
  alturaEspectro: 280,
  alturaConstelacion: 340,
} as const;

/** A partir de este número de puntos se usa WebGL (scattergl) para dibujar. */
export const umbralWebGL = 20_000;

/** Rango dinámico mostrado en escala logarítmica [dB]. */
export const rangoDinamicoDecibelios = 100;

export const visualizacionPredeterminada: EstadoVisualizacion = {
  visibles: { moduladora: true, portadora: true, modulada: true, espectro: true, constelacion: true },
  escalaEspectro: "lineal",
  mostrarTeorico: true,
  rangoTiempo: null,
};
