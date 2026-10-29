/**
 * FÓRMULAS DE MODULACIÓN PSM
 * ------------------------------------------------------------------
 * PSM = Phase Shift Modulation: modulación de fase ANALÓGICA (PM), contraparte
 * analógica de PSK del mismo modo que AM lo es de ASK (definición del curso):
 *
 *   m(t)     = A_m cos(2π f_m t)
 *   s_PM(t)  = A_c cos(2π f_c t + φ_c + k_p m(t))
 *   β        = k_p A_m                  (índice de modulación de fase, rad)
 *   f_i(t)   = f_c − β f_m sen(2π f_m t) (frecuencia instantánea)
 *   B_Carson = 2(β + 1) f_m
 *
 * Para cambiar estas ecuaciones se edita este archivo (y MotorModulacionPSM
 * solo si cambian las señales auxiliares que se dibujan).
 */
import { formulaPortadora, type VariablesPortadora } from "./formulasPortadora";
import type { ConjuntoFormulas } from "@/tipos/tiposFormulas";
import { numeroLatex, terminoFaseLatex } from "@/utilidades/formatoNumerico";

export interface VariablesPSM extends VariablesPortadora {
  amplitudModuladora: number; // A_m [V]
  frecuenciaModuladora: number; // f_m [Hz]
  sensibilidadFase: number; // k_p [rad/V]
}

/** m(t) = A_m cos(2π f_m t) */
export function senalModuladoraPSM(t: number, v: VariablesPSM): number {
  return v.amplitudModuladora * Math.cos(2 * Math.PI * v.frecuenciaModuladora * t);
}

/** β = |k_p · A_m| [rad] */
export function indiceModulacionFase(v: { sensibilidadFase: number; amplitudModuladora: number }): number {
  return Math.abs(v.sensibilidadFase * v.amplitudModuladora);
}

/** Desviación de fase instantánea: Δφ(t) = k_p m(t) [rad] */
export function desviacionFasePSM(t: number, v: VariablesPSM): number {
  return v.sensibilidadFase * senalModuladoraPSM(t, v);
}

/** θ(t) = 2π f_c t + φ_c + k_p m(t) */
export function faseInstantaneaPSM(t: number, v: VariablesPSM): number {
  return 2 * Math.PI * v.frecuenciaPortadora * t + v.faseInicial + desviacionFasePSM(t, v);
}

/** s_PM(t) = A_c cos(2π f_c t + φ_c + k_p m(t)) */
export function senalModuladaPSM(t: number, v: VariablesPSM): number {
  return v.amplitudPortadora * Math.cos(faseInstantaneaPSM(t, v));
}

/** f_i(t) = (1/2π)·dθ/dt = f_c − k_p A_m f_m sen(2π f_m t) */
export function frecuenciaInstantaneaPSM(t: number, v: VariablesPSM): number {
  return (
    v.frecuenciaPortadora -
    v.sensibilidadFase * v.amplitudModuladora * v.frecuenciaModuladora * Math.sin(2 * Math.PI * v.frecuenciaModuladora * t)
  );
}

/** Desviación máxima de frecuencia: Δf = β f_m */
export function desviacionFrecuenciaPSM(v: VariablesPSM): number {
  return indiceModulacionFase(v) * v.frecuenciaModuladora;
}

/** Regla de Carson: B ≈ 2(β + 1) f_m */
export function anchoBandaCarson(beta: number, frecuenciaModuladora: number): number {
  return 2 * (beta + 1) * frecuenciaModuladora;
}

/** Frecuencia máxima significativa: f_c + (β + 1) f_m */
export function frecuenciaMaximaPSM(v: VariablesPSM): number {
  return v.frecuenciaPortadora + (indiceModulacionFase(v) + 1) * v.frecuenciaModuladora;
}

/**
 * Función de Bessel de primera especie J_n(x) por su serie de potencias:
 * J_n(x) = Σ_k (−1)^k / (k! (n+k)!) · (x/2)^(2k+n).
 * Adecuada para |x| ≤ 20 (los índices que admite el laboratorio).
 */
export function besselJ(orden: number, x: number): number {
  const n = Math.abs(Math.round(orden));
  const signoOrden = orden < 0 && n % 2 === 1 ? -1 : 1; // J_{−n} = (−1)^n J_n
  const mitad = x / 2;
  let termino = 1;
  for (let i = 1; i <= n; i++) termino *= mitad / i; // (x/2)^n / n!
  let suma = termino;
  const cuadrado = -mitad * mitad;
  for (let k = 1; k < 300; k++) {
    termino *= cuadrado / (k * (k + n));
    suma += termino;
    if (Math.abs(termino) < 1e-17 * Math.abs(suma) && k > Math.abs(mitad)) break;
  }
  return signoOrden * suma;
}

export function esBandaEstrecha(beta: number): boolean {
  return beta < 0.3;
}

export const formulasPSM: ConjuntoFormulas = {
  tecnica: "PSM",
  archivo: "src/formulas/formulasPSM.ts",
  version: "1.0.0",
  principal: {
    identificador: "psm-modulada",
    nombre: "Señal PSM (modulación de fase)",
    ecuacion: String.raw`s_{PM}(t)=A_c\cos\big(2\pi f_c t+\phi_c+k_p\,m(t)\big)`,
    variables: [
      { simbolo: "A_c", descripcion: "Amplitud de la portadora", unidad: "V", valor: (p) => p.amplitudPortadora },
      { simbolo: "f_c", descripcion: "Frecuencia de la portadora", unidad: "Hz", valor: (p) => p.frecuenciaPortadora },
      { simbolo: "A_m", descripcion: "Amplitud de la moduladora", unidad: "V", valor: (p) => p.amplitudModuladora },
      { simbolo: "f_m", descripcion: "Frecuencia de la moduladora", unidad: "Hz", valor: (p) => p.frecuenciaModuladora },
      { simbolo: "k_p", descripcion: "Sensibilidad de fase", unidad: "rad/V", valor: (p) => p.sensibilidadFase },
      { simbolo: String.raw`\beta`, descripcion: "Índice de modulación de fase", unidad: "rad", valor: (p) => p.indiceModulacion ?? 0 },
      { simbolo: String.raw`\phi_c`, descripcion: "Fase inicial", unidad: "rad", valor: (p) => p.faseInicial },
    ],
    descripcion: "La fase instantánea de la portadora varía proporcionalmente a m(t).",
    unidad: "V",
    version: "1.0.0",
  },
  complementarias: [
    {
      identificador: "psm-moduladora",
      nombre: "Señal moduladora",
      ecuacion: String.raw`m(t)=A_m\cos(2\pi f_m t)`,
      variables: [],
      descripcion: "Señal de información sinusoidal.",
      unidad: "V",
      version: "1.0.0",
    },
    {
      identificador: "psm-indice",
      nombre: "Índice de modulación",
      ecuacion: String.raw`\beta=k_p A_m,\qquad s_{PM}(t)=A_c\cos\big(2\pi f_c t+\phi_c+\beta\cos(2\pi f_m t)\big)`,
      variables: [],
      descripcion: "Desviación máxima de fase en radianes.",
      unidad: "rad",
      version: "1.0.0",
    },
    {
      identificador: "psm-frecuencia-instantanea",
      nombre: "Frecuencia instantánea",
      ecuacion: String.raw`f_i(t)=\frac{1}{2\pi}\frac{d\theta}{dt}=f_c-\beta f_m\sin(2\pi f_m t),\qquad \Delta f=\beta f_m`,
      variables: [],
      descripcion: "Depende de la derivada de la moduladora.",
      unidad: "Hz",
      version: "1.0.0",
    },
    {
      identificador: "psm-bessel",
      nombre: "Desarrollo en funciones de Bessel",
      ecuacion: String.raw`s_{PM}(t)=A_c\sum_{n=-\infty}^{\infty}J_n(\beta)\cos\!\Big(2\pi(f_c+nf_m)t+\phi_c+\tfrac{n\pi}{2}\Big)`,
      variables: [],
      descripcion: "Rayas espectrales en f_c ± n·f_m con amplitud A_c|J_n(β)|.",
      unidad: "V",
      version: "1.0.0",
    },
    {
      identificador: "psm-carson",
      nombre: "Regla de Carson",
      ecuacion: String.raw`B\approx 2(\beta+1)f_m`,
      variables: [],
      descripcion: "Ancho de banda que contiene aproximadamente el 98 % de la potencia.",
      unidad: "Hz",
      version: "1.0.0",
    },
    formulaPortadora,
  ],
  sustituir: (p) =>
    String.raw`s_{PM}(t)=${numeroLatex(p.amplitudPortadora)}\cos\big(2\pi\cdot ${numeroLatex(p.frecuenciaPortadora)}\,t${terminoFaseLatex(p.faseInicial)}+${numeroLatex(p.sensibilidadFase)}\cdot ${numeroLatex(p.amplitudModuladora)}\cos(2\pi\cdot ${numeroLatex(p.frecuenciaModuladora)}\,t)\big)`,
};
