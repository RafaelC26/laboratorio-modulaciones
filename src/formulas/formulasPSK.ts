/**
 * FÓRMULAS DE MODULACIÓN PSK (desplazamiento de fase: BPSK, QPSK, M-PSK)
 * ------------------------------------------------------------------
 * s(t)  = A_c cos(2π f_c t + φ_i)
 * φ_i   = 2π i / M + φ_0,      i ∈ {0, 1, …, M−1}
 * k     = log₂ M bits por símbolo
 *
 * Convención I/Q: s(t) = I·cos(2π f_c t) − Q·sen(2π f_c t), con
 * I = A_c cos φ_i y Q = A_c sen φ_i.
 *
 * Mapeo de bits a índices de fase:
 *  - binario: el grupo de bits, leído como número (MSB primero), es el índice i.
 *  - gray:    el índice i recibe el código Gray de i, de modo que fases vecinas
 *             difieren en un solo bit.
 */
import { formulaPortadora } from "./formulasPortadora";
import type { ConjuntoFormulas } from "@/tipos/tiposFormulas";
import type { MapeoSimbolos } from "@/tipos/tiposModulacion";
import { numeroLatex, terminoFaseLatex } from "@/utilidades/formatoNumerico";

export interface VariablesPSK {
  amplitudPortadora: number; // A_c [V]
  frecuenciaPortadora: number; // f_c [Hz]
}

/** k = log₂ M */
export function bitsPorSimboloPSK(orden: number): number {
  return Math.round(Math.log2(orden));
}

/** φ_i = 2π i / M + φ_0 */
export function faseSimboloPSK(indice: number, orden: number, faseReferencia: number): number {
  return (2 * Math.PI * indice) / orden + faseReferencia;
}

/** s(t) = A_c cos(2π f_c t + φ_i) */
export function senalModuladaPSK(t: number, fase: number, v: VariablesPSK): number {
  return v.amplitudPortadora * Math.cos(2 * Math.PI * v.frecuenciaPortadora * t + fase);
}

export function binarioAGray(valor: number): number {
  return valor ^ (valor >> 1);
}

export function grayABinario(codigo: number): number {
  let valor = codigo;
  for (let desplazado = codigo >> 1; desplazado > 0; desplazado >>= 1) valor ^= desplazado;
  return valor;
}

/** Lee un grupo de bits como entero (el primer bit es el más significativo). */
export function bitsAEntero(bits: number[]): number {
  return bits.reduce((acumulado, bit) => acumulado * 2 + (bit ? 1 : 0), 0);
}

export function enteroABits(valor: number, cantidadBits: number): number[] {
  const bits: number[] = [];
  for (let i = cantidadBits - 1; i >= 0; i--) bits.push((valor >> i) & 1);
  return bits;
}

/** Índice de fase i que corresponde a un grupo de bits. */
export function indiceEstadoPSK(bits: number[], mapeo: MapeoSimbolos): number {
  const valor = bitsAEntero(bits);
  return mapeo === "gray" ? grayABinario(valor) : valor;
}

/** Grupo de bits asignado al índice de fase i. */
export function bitsDeEstadoPSK(indice: number, bitsPorSimbolo: number, mapeo: MapeoSimbolos): number[] {
  return enteroABits(mapeo === "gray" ? binarioAGray(indice) : indice, bitsPorSimbolo);
}

/** Coordenadas I/Q del símbolo: (A_c cos φ_i, A_c sen φ_i) */
export function puntoConstelacionPSK(fase: number, amplitud: number): { enFase: number; cuadratura: number } {
  return { enFase: amplitud * Math.cos(fase), cuadratura: amplitud * Math.sin(fase) };
}

/** Distancia mínima entre símbolos: d_min = 2 A_c sen(π/M) */
export function distanciaMinimaPSK(amplitud: number, orden: number): number {
  return 2 * amplitud * Math.sin(Math.PI / orden);
}

/** Ancho de banda del lóbulo principal con pulsos rectangulares: B ≈ 2 R_s */
export function anchoBandaPSK(tasaSimbolos: number): number {
  return 2 * tasaSimbolos;
}

/** Eficiencia espectral R_b / B = k / 2 [bit/s/Hz] (con B = 2R_s) */
export function eficienciaEspectralPSK(orden: number): number {
  return bitsPorSimboloPSK(orden) / 2;
}

/** Energía por símbolo E_s = A_c² T_s / 2 */
export function energiaSimboloPSK(amplitud: number, duracionSimbolo: number): number {
  return (amplitud * amplitud * duracionSimbolo) / 2;
}

/** Frecuencia máxima significativa: f_c + 2R_s */
export function frecuenciaMaximaPSK(frecuenciaPortadora: number, duracionSimbolo: number): number {
  return frecuenciaPortadora + 2 / duracionSimbolo;
}

export function nombreVariantePSK(orden: number): string {
  if (orden === 2) return "BPSK";
  if (orden === 4) return "QPSK";
  return `${orden}-PSK`;
}

export const formulasPSK: ConjuntoFormulas = {
  tecnica: "PSK",
  archivo: "src/formulas/formulasPSK.ts",
  version: "1.0.0",
  principal: {
    identificador: "psk-modulada",
    nombre: "Señal M-PSK",
    ecuacion: String.raw`s(t)=A_c\cos(2\pi f_c t+\phi_i),\qquad \phi_i=\frac{2\pi i}{M}+\phi_0`,
    variables: [
      { simbolo: "A_c", descripcion: "Amplitud de la portadora", unidad: "V", valor: (p) => p.amplitudPortadora },
      { simbolo: "f_c", descripcion: "Frecuencia de la portadora", unidad: "Hz", valor: (p) => p.frecuenciaPortadora },
      { simbolo: "M", descripcion: "Orden de modulación (estados de fase)", unidad: "", valor: (p) => p.ordenModulacion },
      { simbolo: "k", descripcion: "Bits por símbolo, log₂M", unidad: "bit", valor: (p) => p.bitsPorSimbolo },
      { simbolo: "T_s", descripcion: "Duración de símbolo", unidad: "s", valor: (p) => p.duracionSimbolo },
      { simbolo: String.raw`\phi_0`, descripcion: "Fase de referencia de la constelación", unidad: "rad", valor: (p) => p.faseInicial },
      { simbolo: "i", descripcion: "Índice del símbolo, 0 … M−1", unidad: "" },
    ],
    descripcion: "Amplitud y frecuencia constantes; la fase depende del símbolo.",
    unidad: "V",
    version: "1.0.0",
  },
  complementarias: [
    {
      identificador: "psk-indices",
      nombre: "Estados de fase",
      ecuacion: String.raw`i\in\{0,1,\ldots,M-1\},\qquad k=\log_2 M`,
      variables: [],
      descripcion: "Cada símbolo agrupa k bits.",
      unidad: "",
      version: "1.0.0",
    },
    {
      identificador: "psk-bpsk",
      nombre: "BPSK (M = 2)",
      ecuacion: String.raw`s(t)=A_c\cos(2\pi f_c t+\pi b_i),\qquad \phi\in\{0,\pi\}`,
      variables: [],
      descripcion: "Asignación bit 0 → fase 0, bit 1 → fase π (con φ_0 = 0).",
      unidad: "V",
      version: "1.0.0",
    },
    {
      identificador: "psk-qpsk",
      nombre: "QPSK (M = 4)",
      ecuacion: String.raw`\phi_i\in\left\{0,\tfrac{\pi}{2},\pi,\tfrac{3\pi}{2}\right\}+\phi_0`,
      variables: [],
      descripcion: "Con φ_0 = π/4 se obtiene la constelación QPSK clásica en diagonal.",
      unidad: "rad",
      version: "1.0.0",
    },
    {
      identificador: "psk-iq",
      nombre: "Componentes en fase y cuadratura",
      ecuacion: String.raw`s(t)=I_i\cos(2\pi f_c t)-Q_i\sin(2\pi f_c t),\quad I_i=A_c\cos\phi_i,\ Q_i=A_c\sin\phi_i`,
      variables: [],
      descripcion: "Coordenadas de cada símbolo en el diagrama de constelación.",
      unidad: "V",
      version: "1.0.0",
    },
    {
      identificador: "psk-tasas",
      nombre: "Tasas y ancho de banda",
      ecuacion: String.raw`R_s=\frac{1}{T_s},\quad R_b=k\,R_s,\quad B\approx 2R_s,\quad d_{min}=2A_c\sin\frac{\pi}{M}`,
      variables: [],
      descripcion: "Ancho de banda del lóbulo principal para pulsos rectangulares.",
      unidad: "",
      version: "1.0.0",
    },
    formulaPortadora,
  ],
  sustituir: (p) =>
    String.raw`s(t)=${numeroLatex(p.amplitudPortadora)}\cos(2\pi\cdot ${numeroLatex(p.frecuenciaPortadora)}\,t+\phi_i),\quad \phi_i=\frac{2\pi i}{${p.ordenModulacion}}${terminoFaseLatex(p.faseInicial)}`,
};
