/**
 * FÓRMULAS DE MODULACIÓN PSM (modulación de fase, PM; Tema 6, p. 46–48)
 * ------------------------------------------------------------------
 * El curso usa PSM para la modulación de fase analógica, que el Tema 6 llama PM:
 *
 *   v_p(t) = V_p cos(2π f_p t)
 *   v_m(t) = V_m sen(2π f_m t)
 *   Φ(t)   = ΔΦ v_m(t)             (ΔΦ: constante de desviación de fase)
 *   v(t)   = V_p cos[2π f_p t + Φ(t)]
 *   β      = ΔΦ V_m                (índice de modulación)
 *   v(t)   = V_p cos[2π f_p t + β sen(2π f_m t)]
 *
 * Ancho de banda: el Tema 6 remite a FM (p. 45, 48): BW = 2 f_m si el índice es
 * menor que π/2 (banda angosta).
 *
 * Complementos que no están en el Tema 6: frecuencia instantánea, desarrollo en
 * funciones de Bessel y regla de Carson.
 *
 * Para cambiar estas ecuaciones se edita este archivo (y MotorModulacionPSM
 * solo si cambian las señales auxiliares que se dibujan).
 */
import { formulaPortadoraCoseno, type VariablesPortadora } from "./formulasPortadora";
import type { ConjuntoFormulas } from "@/tipos/tiposFormulas";
import { numeroLatex, terminoFaseLatex } from "@/utilidades/formatoNumerico";

export interface VariablesPSM extends VariablesPortadora {
  amplitudModuladora: number; // V_m [V]
  frecuenciaModuladora: number; // f_m [Hz]
  sensibilidadFase: number; // ΔΦ [rad/V]
}

/** v_m(t) = V_m sen(2π f_m t) */
export function senalModuladoraPSM(t: number, v: VariablesPSM): number {
  return v.amplitudModuladora * Math.sin(2 * Math.PI * v.frecuenciaModuladora * t);
}

/** β = |ΔΦ · V_m| [rad] */
export function indiceModulacionFase(v: { sensibilidadFase: number; amplitudModuladora: number }): number {
  return Math.abs(v.sensibilidadFase * v.amplitudModuladora);
}

/** Φ(t) = ΔΦ v_m(t) [rad] */
export function desviacionFasePSM(t: number, v: VariablesPSM): number {
  return v.sensibilidadFase * senalModuladoraPSM(t, v);
}

/** θ(t) = 2π f_p t + φ_p + Φ(t) */
export function faseInstantaneaPSM(t: number, v: VariablesPSM): number {
  return 2 * Math.PI * v.frecuenciaPortadora * t + v.faseInicial + desviacionFasePSM(t, v);
}

/** v(t) = V_p cos[2π f_p t + φ_p + ΔΦ v_m(t)] */
export function senalModuladaPSM(t: number, v: VariablesPSM): number {
  return v.amplitudPortadora * Math.cos(faseInstantaneaPSM(t, v));
}

/** f_i(t) = (1/2π)·dθ/dt = f_p + ΔΦ V_m f_m cos(2π f_m t) */
export function frecuenciaInstantaneaPSM(t: number, v: VariablesPSM): number {
  return (
    v.frecuenciaPortadora +
    v.sensibilidadFase * v.amplitudModuladora * v.frecuenciaModuladora * Math.cos(2 * Math.PI * v.frecuenciaModuladora * t)
  );
}

/** Desviación máxima de frecuencia: Δf = β f_m */
export function desviacionFrecuenciaPSM(v: VariablesPSM): number {
  return indiceModulacionFase(v) * v.frecuenciaModuladora;
}

/** Banda angosta (índice < π/2): BW = 2 f_m */
export function anchoBandaAngostaPM(frecuenciaModuladora: number): number {
  return 2 * frecuenciaModuladora;
}

/** Regla de Carson: BW ≈ 2(β + 1) f_m */
export function anchoBandaCarson(beta: number, frecuenciaModuladora: number): number {
  return 2 * (beta + 1) * frecuenciaModuladora;
}

/** Ancho de banda estimado: Tema 6 en banda angosta, regla de Carson en banda ancha. */
export function anchoBandaEstimadoPM(beta: number, frecuenciaModuladora: number): number {
  return esBandaAngosta(beta) ? anchoBandaAngostaPM(frecuenciaModuladora) : anchoBandaCarson(beta, frecuenciaModuladora);
}

/** Frecuencia máxima significativa: f_p + (β + 1) f_m */
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

/** Banda angosta: índice de modulación menor que π/2 (Tema 6, p. 45). */
export function esBandaAngosta(beta: number): boolean {
  return beta < Math.PI / 2;
}

export const formulasPSM: ConjuntoFormulas = {
  tecnica: "PSM",
  archivo: "src/formulas/formulasPSM.ts",
  version: "2.0.0",
  principal: {
    identificador: "psm-modulada",
    nombre: "Señal PSM (modulación de fase, PM)",
    ecuacion: String.raw`v(t)=V_p\cos\big[2\pi f_p t+\phi_p+\Delta\Phi\,v_m(t)\big]`,
    variables: [
      { simbolo: "V_p", descripcion: "Valor pico de la portadora", unidad: "V", valor: (p) => p.amplitudPortadora },
      { simbolo: "f_p", descripcion: "Frecuencia de la portadora", unidad: "Hz", valor: (p) => p.frecuenciaPortadora },
      { simbolo: "V_m", descripcion: "Valor pico de la moduladora", unidad: "V", valor: (p) => p.amplitudModuladora },
      { simbolo: "f_m", descripcion: "Frecuencia de la moduladora", unidad: "Hz", valor: (p) => p.frecuenciaModuladora },
      { simbolo: String.raw`\Delta\Phi`, descripcion: "Constante de desviación de fase", unidad: "rad/V", valor: (p) => p.sensibilidadFase },
      { simbolo: String.raw`\beta`, descripcion: "Índice de modulación", unidad: "rad", valor: (p) => p.indiceModulacion ?? 0 },
      { simbolo: String.raw`\phi_p`, descripcion: "Fase inicial (parámetro adicional, 0 por defecto)", unidad: "rad", valor: (p) => p.faseInicial },
    ],
    descripcion: "La fase de la portadora varía proporcionalmente a la amplitud de la moduladora.",
    unidad: "V",
    version: "2.0.0",
    paginaTema6: "48",
  },
  complementarias: [
    {
      identificador: "psm-moduladora",
      nombre: "Señal moduladora",
      ecuacion: String.raw`v_m(t)=V_m\operatorname{sen}(2\pi f_m t)`,
      variables: [],
      descripcion: "Señal de información sinusoidal.",
      unidad: "V",
      version: "2.0.0",
      paginaTema6: "48",
    },
    formulaPortadoraCoseno,
    {
      identificador: "psm-desviacion",
      nombre: "Variación de la fase",
      ecuacion: String.raw`\Phi(t)=\Delta\Phi\,v_m(t),\qquad -V_m\Delta\Phi\le\Phi(t)\le V_m\Delta\Phi`,
      variables: [],
      descripcion: "ΔΦ es la constante de desviación de fase.",
      unidad: "rad",
      version: "2.0.0",
      paginaTema6: "48",
    },
    {
      identificador: "psm-indice",
      nombre: "Índice de modulación",
      ecuacion: String.raw`\beta=\Delta\Phi\,V_m,\qquad v(t)=V_p\cos\big[2\pi f_p t+\beta\operatorname{sen}(2\pi f_m t)\big]`,
      variables: [],
      descripcion: "β no depende de la frecuencia de la moduladora.",
      unidad: "rad",
      version: "2.0.0",
      paginaTema6: "48",
    },
    {
      identificador: "psm-banda-angosta",
      nombre: "Ancho de banda en banda angosta",
      ecuacion: String.raw`BW=2f_m\quad\text{para}\quad m_f<\frac{\pi}{2}`,
      variables: [],
      descripcion: "Dado para FM; en PM el índice es β y el ancho de banda se trata de forma similar (p. 48).",
      unidad: "Hz",
      version: "2.0.0",
      paginaTema6: "45, 48",
    },
    {
      identificador: "psm-frecuencia-instantanea",
      nombre: "Frecuencia instantánea",
      ecuacion: String.raw`f_i(t)=\frac{1}{2\pi}\frac{d\theta}{dt}=f_p+\beta f_m\cos(2\pi f_m t),\qquad \Delta f=\beta f_m`,
      variables: [],
      descripcion: "Depende de la derivada de la moduladora (con ΔΦ positiva).",
      unidad: "Hz",
      version: "2.0.0",
    },
    {
      identificador: "psm-bessel",
      nombre: "Desarrollo en funciones de Bessel",
      ecuacion: String.raw`v(t)=V_p\sum_{n=-\infty}^{\infty}J_n(\beta)\cos\big[2\pi(f_p+nf_m)t+\phi_p\big]`,
      variables: [],
      descripcion: "Rayas espectrales en f_p ± n·f_m con amplitud V_p|J_n(β)|. Son los marcadores teóricos del espectro.",
      unidad: "V",
      version: "2.0.0",
    },
    {
      identificador: "psm-carson",
      nombre: "Regla de Carson",
      ecuacion: String.raw`BW\approx 2(\beta+1)f_m`,
      variables: [],
      descripcion: "Estimación para banda ancha. El Tema 6 usa en su lugar la curva de Schwartz (p. 44–45).",
      unidad: "Hz",
      version: "2.0.0",
    },
  ],
  sustituir: (p) =>
    String.raw`v(t)=${numeroLatex(p.amplitudPortadora)}\cos\big[2\pi\cdot ${numeroLatex(p.frecuenciaPortadora)}\,t${terminoFaseLatex(p.faseInicial)}+${numeroLatex(p.sensibilidadFase)}\cdot ${numeroLatex(p.amplitudModuladora)}\operatorname{sen}(2\pi\cdot ${numeroLatex(p.frecuenciaModuladora)}\,t)\big]`,
};
