/**
 * FÓRMULAS DE LA SEÑAL PORTADORA
 * ------------------------------------------------------------------
 * c(t) = A_c · cos(2π f_c t + φ_c)
 *
 * Esta ecuación la reutilizan todas las técnicas de modulación.
 */
import type { DefinicionFormula } from "@/tipos/tiposFormulas";

export interface VariablesPortadora {
  amplitudPortadora: number; // A_c [V]
  frecuenciaPortadora: number; // f_c [Hz]
  faseInicial: number; // φ_c [rad]
}

/** c(t) = A_c cos(2π f_c t + φ_c) */
export function senalPortadora(t: number, v: VariablesPortadora): number {
  return v.amplitudPortadora * Math.cos(2 * Math.PI * v.frecuenciaPortadora * t + v.faseInicial);
}

/** T_c = 1 / f_c */
export function periodoPortadora(frecuenciaPortadora: number): number {
  return 1 / frecuenciaPortadora;
}

/** Ciclos de portadora contenidos en un intervalo de duración T: f_c·T */
export function ciclosEnIntervalo(frecuenciaPortadora: number, duracion: number): number {
  return frecuenciaPortadora * duracion;
}

export const formulaPortadora: DefinicionFormula = {
  identificador: "portadora",
  nombre: "Señal portadora",
  ecuacion: String.raw`c(t)=A_c\cos(2\pi f_c t+\phi_c)`,
  variables: [
    { simbolo: "A_c", descripcion: "Amplitud de la portadora", unidad: "V", valor: (p) => p.amplitudPortadora },
    { simbolo: "f_c", descripcion: "Frecuencia de la portadora", unidad: "Hz", valor: (p) => p.frecuenciaPortadora },
    { simbolo: String.raw`\phi_c`, descripcion: "Fase inicial", unidad: "rad", valor: (p) => p.faseInicial },
    { simbolo: "t", descripcion: "Tiempo", unidad: "s" },
  ],
  descripcion: "Señal sinusoidal de referencia sobre la que se imprime la información.",
  unidad: "V",
  version: "1.0.0",
};
