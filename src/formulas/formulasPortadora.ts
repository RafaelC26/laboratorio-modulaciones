/**
 * FÓRMULAS DE LA SEÑAL PORTADORA (Tema 6)
 * ------------------------------------------------------------------
 * AM y ASK:  v_p(t) = V_p sen(2π f_p t)   (p. 35 y 49)
 * PM y PSK:  v_p(t) = V_p cos(2π f_p t)   (p. 47 y 54)
 *
 * La fase inicial φ_p es un parámetro adicional del laboratorio (vale 0 por
 * defecto); en el Tema 6 la portadora no la incluye.
 */
import type { DefinicionFormula } from "@/tipos/tiposFormulas";
import type { TipoModulacion } from "@/tipos/tiposModulacion";

export interface VariablesPortadora {
  amplitudPortadora: number; // V_p [V]
  frecuenciaPortadora: number; // f_p [Hz]
  faseInicial: number; // φ_p [rad]
}

/** v_p(t) = V_p sen(2π f_p t + φ_p) */
export function portadoraSeno(t: number, v: VariablesPortadora): number {
  return v.amplitudPortadora * Math.sin(2 * Math.PI * v.frecuenciaPortadora * t + v.faseInicial);
}

/** v_p(t) = V_p cos(2π f_p t + φ_p) */
export function portadoraCoseno(t: number, v: VariablesPortadora): number {
  return v.amplitudPortadora * Math.cos(2 * Math.PI * v.frecuenciaPortadora * t + v.faseInicial);
}

/** T_p = 1 / f_p */
export function periodoPortadora(frecuenciaPortadora: number): number {
  return 1 / frecuenciaPortadora;
}

/** Ciclos de portadora contenidos en un intervalo de duración T: f_p·T */
export function ciclosEnIntervalo(frecuenciaPortadora: number, duracion: number): number {
  return frecuenciaPortadora * duracion;
}

const variablesPortadora: DefinicionFormula["variables"] = [
  { simbolo: "V_p", descripcion: "Valor pico de la portadora", unidad: "V", valor: (p) => p.amplitudPortadora },
  { simbolo: "f_p", descripcion: "Frecuencia de la portadora", unidad: "Hz", valor: (p) => p.frecuenciaPortadora },
  { simbolo: String.raw`\phi_p`, descripcion: "Fase inicial (parámetro adicional, 0 por defecto)", unidad: "rad", valor: (p) => p.faseInicial },
  { simbolo: "t", descripcion: "Tiempo", unidad: "s" },
];

export const formulaPortadoraSeno: DefinicionFormula = {
  identificador: "portadora-seno",
  nombre: "Señal portadora (AM y ASK)",
  ecuacion: String.raw`v_p(t)=V_p\operatorname{sen}(2\pi f_p t+\phi_p)`,
  variables: variablesPortadora,
  descripcion: "Señal sinusoidal de referencia sobre la que se imprime la información.",
  unidad: "V",
  version: "2.0.0",
  paginaTema6: "35, 49",
};

export const formulaPortadoraCoseno: DefinicionFormula = {
  identificador: "portadora-coseno",
  nombre: "Señal portadora (PM)",
  ecuacion: String.raw`v_p(t)=V_p\cos(2\pi f_p t+\phi_p)`,
  variables: variablesPortadora,
  descripcion: "En modulación de fase el Tema 6 expresa la portadora con coseno.",
  unidad: "V",
  version: "2.0.0",
  paginaTema6: "47",
};

export const formulaPortadoraReferencia: DefinicionFormula = {
  identificador: "portadora-referencia",
  nombre: "Portadora de referencia (PSK)",
  ecuacion: String.raw`v_p(t)=V_p\cos(2\pi f_p t)`,
  variables: variablesPortadora,
  descripcion: "Se dibuja con fase 0 para que se aprecie el desplazamiento de cada símbolo.",
  unidad: "V",
  version: "2.0.0",
  paginaTema6: "54",
};

/** Portadora que usa el Tema 6 en cada técnica. */
export function formulaPortadoraDe(tipo: TipoModulacion): DefinicionFormula {
  if (tipo === "PSK") return formulaPortadoraReferencia;
  return tipo === "PSM" ? formulaPortadoraCoseno : formulaPortadoraSeno;
}
