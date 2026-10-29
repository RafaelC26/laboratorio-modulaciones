/**
 * FÓRMULAS DE MODULACIÓN AM (modulación de amplitud)
 * ------------------------------------------------------------------
 * m(t)    = A_m cos(2π f_m t)
 * μ       = A_m / A_c
 * s_AM(t) = A_c [1 + μ cos(2π f_m t)] cos(2π f_c t + φ_c)
 *
 * Para cambiar la ecuación de AM se edita únicamente este archivo:
 * las funciones (lo que se calcula) y las definiciones LaTeX (lo que se muestra).
 */
import { formulaPortadora, type VariablesPortadora } from "./formulasPortadora";
import { configuracionGeneral } from "@/configuracion/configuracionGeneral";
import type { ConjuntoFormulas } from "@/tipos/tiposFormulas";
import { numeroLatex, terminoFaseLatex } from "@/utilidades/formatoNumerico";

export interface VariablesAM extends VariablesPortadora {
  amplitudModuladora: number; // A_m [V]
  frecuenciaModuladora: number; // f_m [Hz]
}

/** μ = A_m / A_c */
export function indiceModulacionAM(v: { amplitudModuladora: number; amplitudPortadora: number }): number {
  return v.amplitudPortadora === 0 ? 0 : v.amplitudModuladora / v.amplitudPortadora;
}

/** m(t) = A_m cos(2π f_m t) */
export function senalModuladoraAM(t: number, v: VariablesAM): number {
  return v.amplitudModuladora * Math.cos(2 * Math.PI * v.frecuenciaModuladora * t);
}

/** e(t) = A_c [1 + μ cos(2π f_m t)]  (envolvente ideal, puede ser negativa si μ > 1) */
export function envolventeAM(t: number, v: VariablesAM): number {
  const mu = indiceModulacionAM(v);
  return v.amplitudPortadora * (1 + mu * Math.cos(2 * Math.PI * v.frecuenciaModuladora * t));
}

/** s_AM(t) = A_c [1 + μ cos(2π f_m t)] cos(2π f_c t + φ_c) */
export function senalModuladaAM(t: number, v: VariablesAM): number {
  return envolventeAM(t, v) * Math.cos(2 * Math.PI * v.frecuenciaPortadora * t + v.faseInicial);
}

/** Amplitud de cada banda lateral: μ·A_c / 2 */
export function amplitudBandaLateralAM(amplitudPortadora: number, mu: number): number {
  return (mu * amplitudPortadora) / 2;
}

/** P_c = A_c² / 2R */
export function potenciaPortadoraAM(amplitudPortadora: number, resistencia = configuracionGeneral.resistenciaReferencia): number {
  return (amplitudPortadora * amplitudPortadora) / (2 * resistencia);
}

/** P_T = P_c (1 + μ²/2) */
export function potenciaTotalAM(amplitudPortadora: number, mu: number, resistencia = configuracionGeneral.resistenciaReferencia): number {
  return potenciaPortadoraAM(amplitudPortadora, resistencia) * (1 + (mu * mu) / 2);
}

/** η = μ² / (2 + μ²): fracción de la potencia que transportan las bandas laterales. */
export function eficienciaAM(mu: number): number {
  return (mu * mu) / (2 + mu * mu);
}

/** B = 2 f_m */
export function anchoBandaAM(frecuenciaModuladora: number): number {
  return 2 * frecuenciaModuladora;
}

/** Frecuencia más alta presente en la señal: f_c + f_m */
export function frecuenciaMaximaAM(v: VariablesAM): number {
  return v.frecuenciaPortadora + v.frecuenciaModuladora;
}

export type ClasificacionAM = "sin-modulacion" | "submodulacion" | "modulacion-completa" | "sobremodulacion";

export function clasificarIndiceAM(mu: number, tolerancia = 1e-9): ClasificacionAM {
  if (Math.abs(mu) <= tolerancia) return "sin-modulacion";
  if (Math.abs(mu - 1) <= tolerancia) return "modulacion-completa";
  return mu < 1 ? "submodulacion" : "sobremodulacion";
}

export const textoClasificacionAM: Record<ClasificacionAM, string> = {
  "sin-modulacion": "Sin modulación (μ = 0)",
  submodulacion: "Modulación convencional (0 < μ < 1)",
  "modulacion-completa": "Modulación al 100 % (μ = 1)",
  sobremodulacion: "Sobremodulación (μ > 1)",
};

export const formulasAM: ConjuntoFormulas = {
  tecnica: "AM",
  archivo: "src/formulas/formulasAM.ts",
  version: "1.0.0",
  principal: {
    identificador: "am-modulada",
    nombre: "Señal AM",
    ecuacion: String.raw`s_{AM}(t)=A_c\left[1+\mu\cos(2\pi f_m t)\right]\cos(2\pi f_c t+\phi_c)`,
    variables: [
      { simbolo: "A_c", descripcion: "Amplitud de la portadora", unidad: "V", valor: (p) => p.amplitudPortadora },
      { simbolo: "A_m", descripcion: "Amplitud de la moduladora", unidad: "V", valor: (p) => p.amplitudModuladora },
      { simbolo: "f_c", descripcion: "Frecuencia de la portadora", unidad: "Hz", valor: (p) => p.frecuenciaPortadora },
      { simbolo: "f_m", descripcion: "Frecuencia de la moduladora", unidad: "Hz", valor: (p) => p.frecuenciaModuladora },
      { simbolo: String.raw`\mu`, descripcion: "Índice de modulación", unidad: "", valor: (p) => p.indiceModulacion ?? 0 },
      { simbolo: String.raw`\phi_c`, descripcion: "Fase inicial de la portadora", unidad: "rad", valor: (p) => p.faseInicial },
    ],
    descripcion: "La envolvente de la portadora sigue a la señal moduladora.",
    unidad: "V",
    version: "1.0.0",
  },
  complementarias: [
    {
      identificador: "am-moduladora",
      nombre: "Señal moduladora",
      ecuacion: String.raw`m(t)=A_m\cos(2\pi f_m t)`,
      variables: [],
      descripcion: "Señal de información sinusoidal.",
      unidad: "V",
      version: "1.0.0",
    },
    formulaPortadora,
    {
      identificador: "am-indice",
      nombre: "Índice de modulación",
      ecuacion: String.raw`\mu=\frac{A_m}{A_c}`,
      variables: [],
      descripcion: "μ > 1 produce sobremodulación.",
      unidad: "",
      version: "1.0.0",
    },
    {
      identificador: "am-espectro",
      nombre: "Desarrollo espectral",
      ecuacion: String.raw`s_{AM}(t)=A_c\cos(\omega_c t)+\frac{\mu A_c}{2}\cos\big((\omega_c+\omega_m)t\big)+\frac{\mu A_c}{2}\cos\big((\omega_c-\omega_m)t\big)`,
      variables: [],
      descripcion: "Portadora más dos bandas laterales en f_c ± f_m (con φ_c = 0).",
      unidad: "V",
      version: "1.0.0",
    },
    {
      identificador: "am-potencia",
      nombre: "Potencia y eficiencia",
      ecuacion: String.raw`P_T=P_c\left(1+\frac{\mu^2}{2}\right),\quad P_c=\frac{A_c^2}{2R},\quad \eta=\frac{\mu^2}{2+\mu^2}`,
      variables: [],
      descripcion: "Potencias normalizadas a R = 1 Ω.",
      unidad: "W",
      version: "1.0.0",
    },
    {
      identificador: "am-ancho-banda",
      nombre: "Ancho de banda",
      ecuacion: String.raw`B_{AM}=2f_m`,
      variables: [],
      descripcion: "Distancia entre la banda lateral inferior y la superior.",
      unidad: "Hz",
      version: "1.0.0",
    },
  ],
  sustituir: (p) => {
    const mu = p.indiceModulacion ?? 0;
    return String.raw`s_{AM}(t)=${numeroLatex(p.amplitudPortadora)}\left[1+${numeroLatex(mu)}\cos(2\pi\cdot ${numeroLatex(p.frecuenciaModuladora)}\,t)\right]\cos(2\pi\cdot ${numeroLatex(p.frecuenciaPortadora)}\,t${terminoFaseLatex(p.faseInicial)})`;
  },
};
