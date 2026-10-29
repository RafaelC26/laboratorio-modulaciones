/**
 * FÓRMULAS DE MODULACIÓN ASK (desplazamiento de amplitud)
 * ------------------------------------------------------------------
 * s_ASK(t) = A_i cos(2π f_c t + φ_c),   i·T_b ≤ t < (i+1)·T_b
 * A_i = A_1 si b_i = 1;  A_i = A_0 si b_i = 0
 *
 * OOK (encendido/apagado) es el caso A_1 = A_c, A_0 = 0.
 */
import { formulaPortadora } from "./formulasPortadora";
import type { ConjuntoFormulas } from "@/tipos/tiposFormulas";
import { numeroLatex, terminoFaseLatex } from "@/utilidades/formatoNumerico";

export interface VariablesASK {
  amplitudBit1: number; // A_1 [V]
  amplitudBit0: number; // A_0 [V]
  frecuenciaPortadora: number; // f_c [Hz]
  faseInicial: number; // φ_c [rad]
}

/** A_i según el bit transmitido. */
export function amplitudSimboloASK(bit: number, v: VariablesASK): number {
  return bit === 1 ? v.amplitudBit1 : v.amplitudBit0;
}

/** s_ASK(t) = A_i cos(2π f_c t + φ_c) */
export function senalModuladaASK(t: number, bit: number, v: VariablesASK): number {
  return amplitudSimboloASK(bit, v) * Math.cos(2 * Math.PI * v.frecuenciaPortadora * t + v.faseInicial);
}

/** R_b = 1 / T_b */
export function tasaBitsASK(duracionBit: number): number {
  return 1 / duracionBit;
}

/** Ancho de banda del lóbulo principal (nulo a nulo) con pulsos rectangulares: B = 2R_b */
export function anchoBandaASK(duracionBit: number): number {
  return 2 / duracionBit;
}

/** Energía de un bit de amplitud A: E = A² T_b / 2 */
export function energiaBitASK(amplitud: number, duracionBit: number): number {
  return (amplitud * amplitud * duracionBit) / 2;
}

/** Profundidad de modulación: (A_1 − A_0) / (A_1 + A_0) */
export function indiceModulacionASK(v: VariablesASK): number {
  const suma = v.amplitudBit1 + v.amplitudBit0;
  return suma === 0 ? 0 : (v.amplitudBit1 - v.amplitudBit0) / suma;
}

/** Frecuencia máxima significativa (portadora más el primer lóbulo lateral): f_c + 2R_b */
export function frecuenciaMaximaASK(frecuenciaPortadora: number, duracionBit: number): number {
  return frecuenciaPortadora + 2 / duracionBit;
}

export function esOOK(v: VariablesASK): boolean {
  return v.amplitudBit0 === 0 || v.amplitudBit1 === 0;
}

export const formulasASK: ConjuntoFormulas = {
  tecnica: "ASK",
  archivo: "src/formulas/formulasASK.ts",
  version: "1.0.0",
  principal: {
    identificador: "ask-modulada",
    nombre: "Señal ASK binaria",
    ecuacion: String.raw`s_{ASK}(t)=A_i\cos(2\pi f_c t+\phi_c),\qquad A_i=\begin{cases}A_1, & b_i=1\\ A_0, & b_i=0\end{cases}`,
    variables: [
      { simbolo: "A_1", descripcion: "Amplitud para el bit 1", unidad: "V", valor: (p) => p.amplitudBit1 },
      { simbolo: "A_0", descripcion: "Amplitud para el bit 0", unidad: "V", valor: (p) => p.amplitudBit0 },
      { simbolo: "f_c", descripcion: "Frecuencia de la portadora", unidad: "Hz", valor: (p) => p.frecuenciaPortadora },
      { simbolo: "T_b", descripcion: "Duración de bit", unidad: "s", valor: (p) => p.duracionSimbolo },
      { simbolo: "R_b", descripcion: "Tasa de bits", unidad: "bit/s", valor: (p) => p.tasaBits },
      { simbolo: String.raw`\phi_c`, descripcion: "Fase inicial", unidad: "rad", valor: (p) => p.faseInicial },
      { simbolo: "b_i", descripcion: "Bit transmitido en el intervalo i", unidad: "" },
    ],
    descripcion: "Cada bit selecciona la amplitud de la portadora durante T_b segundos.",
    unidad: "V",
    version: "1.0.0",
  },
  complementarias: [
    {
      identificador: "ask-intervalo",
      nombre: "Intervalo de cada bit",
      ecuacion: String.raw`i\,T_b\le t<(i+1)\,T_b,\qquad R_b=\frac{1}{T_b}`,
      variables: [],
      descripcion: "El bit i se transmite durante un intervalo de duración T_b.",
      unidad: "s",
      version: "1.0.0",
    },
    {
      identificador: "ask-ook",
      nombre: "Caso OOK",
      ecuacion: String.raw`A_1=A_c,\qquad A_0=0`,
      variables: [],
      descripcion: "La portadora está presente en los bits 1 y desaparece en los bits 0.",
      unidad: "V",
      version: "1.0.0",
    },
    formulaPortadora,
    {
      identificador: "ask-ancho-banda",
      nombre: "Ancho de banda (lóbulo principal)",
      ecuacion: String.raw`B_{ASK}\approx 2R_b=\frac{2}{T_b}`,
      variables: [],
      descripcion: "Para pulsos rectangulares, de nulo a nulo alrededor de f_c.",
      unidad: "Hz",
      version: "1.0.0",
    },
    {
      identificador: "ask-energia",
      nombre: "Energía por bit",
      ecuacion: String.raw`E_i=\frac{A_i^2\,T_b}{2}`,
      variables: [],
      descripcion: "Energía normalizada a 1 Ω, suponiendo un número entero de ciclos por bit.",
      unidad: "J",
      version: "1.0.0",
    },
  ],
  sustituir: (p) => {
    const fase = terminoFaseLatex(p.faseInicial);
    const fc = numeroLatex(p.frecuenciaPortadora);
    return String.raw`s_{ASK}(t)=\begin{cases}${numeroLatex(p.amplitudBit1)}\cos(2\pi\cdot ${fc}\,t${fase}), & b_i=1\\ ${numeroLatex(p.amplitudBit0)}\cos(2\pi\cdot ${fc}\,t${fase}), & b_i=0\end{cases}\quad T_b=${numeroLatex(p.duracionSimbolo)}\,\text{s}`;
  },
};
