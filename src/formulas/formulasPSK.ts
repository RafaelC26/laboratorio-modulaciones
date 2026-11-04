/**
 * FÓRMULAS DE MODULACIÓN PSK Y MPSK (Tema 6, p. 53–58)
 * ------------------------------------------------------------------
 * 2PSK:  v_m(t) = 1 para un "1", −1 para un "0"
 *        v(t) = v_p(t)·v_m(t) = V_p V_m cos(2π f_p t)
 *        "1" → V_p cos(2π f_p t);  "0" → V_p cos(2π f_p t + π)
 * MPSK:  fases separadas θ = 2π/N
 *        V_t = (1/T) log₂ N,  T_dibit = 2 T_bit,  BW_dibit = 1/T_dibit = BW_bit/2
 *
 * En el laboratorio: v(t) = V_p cos(2π f_p t + φ_i), con φ_i = i·θ + φ_0.
 * Convención I/Q: v(t) = I·cos(2π f_p t) − Q·sen(2π f_p t), con
 * I = V_p cos φ_i y Q = V_p sen φ_i.
 *
 * Mapeo de bits a índices de fase:
 *  - apuntes: el del Tema 6 ("1"→0°, "0"→180°; 10→0°, 01→90°, 11→180°, 00→270°).
 *             La figura de la p. 57 repite "10" en 270°: es una errata, y por
 *             descarte corresponde 00. Los órdenes mayores que el Tema 6 no
 *             define (N = 8, 16) usan binario natural.
 *  - binario: el grupo de bits, leído como número (MSB primero), es el índice i.
 *  - gray:    el índice i recibe el código Gray de i, de modo que fases vecinas
 *             difieren en un solo bit.
 */
import { formulaPortadoraReferencia } from "./formulasPortadora";
import type { ConjuntoFormulas } from "@/tipos/tiposFormulas";
import type { MapeoSimbolos } from "@/tipos/tiposModulacion";
import { numeroLatex, terminoFaseLatex } from "@/utilidades/formatoNumerico";

export interface VariablesPSK {
  amplitudPortadora: number; // V_p [V]
  frecuenciaPortadora: number; // f_p [Hz]
}

/** Bits asignados a cada índice de fase en el Tema 6 (p. 54–55 y 57). */
const MAPEO_TEMA6: Record<number, number[][]> = {
  2: [[1], [0]],
  4: [
    [1, 0],
    [0, 1],
    [1, 1],
    [0, 0],
  ],
};

/** k = log₂ N */
export function bitsPorSimboloPSK(orden: number): number {
  return Math.round(Math.log2(orden));
}

/** θ = 2π / N */
export function separacionFasePSK(orden: number): number {
  return (2 * Math.PI) / orden;
}

/** φ_i = i·θ + φ_0 */
export function faseSimboloPSK(indice: number, orden: number, faseReferencia: number): number {
  return indice * separacionFasePSK(orden) + faseReferencia;
}

/** v(t) = V_p cos(2π f_p t + φ_i) */
export function senalModuladaPSK(t: number, fase: number, v: VariablesPSK): number {
  return v.amplitudPortadora * Math.cos(2 * Math.PI * v.frecuenciaPortadora * t + fase);
}

/** Moduladora de 2PSK según el estado: V_m = 1 (fase φ_0) o V_m = −1 (fase φ_0 + π). */
export function moduladoraBinariaPSK(indiceEstado: number): number {
  return indiceEstado === 0 ? 1 : -1;
}

/** Nivel de la señal multinivel: 00 → 0, 01 → 1, 10 → 2, 11 → 3 (Tema 6, p. 56). */
export function nivelSimboloPSK(bits: number[]): number {
  return bitsAEntero(bits);
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
  if (mapeo === "gray") return grayABinario(valor);
  if (mapeo === "apuntes") {
    const tabla = MAPEO_TEMA6[2 ** bits.length];
    if (tabla) return tabla.findIndex((grupo) => bitsAEntero(grupo) === valor);
  }
  return valor;
}

/** Grupo de bits asignado al índice de fase i. */
export function bitsDeEstadoPSK(indice: number, bitsPorSimbolo: number, mapeo: MapeoSimbolos): number[] {
  if (mapeo === "gray") return enteroABits(binarioAGray(indice), bitsPorSimbolo);
  if (mapeo === "apuntes") {
    const tabla = MAPEO_TEMA6[2 ** bitsPorSimbolo];
    if (tabla) return [...tabla[indice]];
  }
  return enteroABits(indice, bitsPorSimbolo);
}

/** Coordenadas I/Q del símbolo: (V_p cos φ_i, V_p sen φ_i) */
export function puntoConstelacionPSK(fase: number, amplitud: number): { enFase: number; cuadratura: number } {
  return { enFase: amplitud * Math.cos(fase), cuadratura: amplitud * Math.sin(fase) };
}

/** Distancia mínima entre símbolos: d_min = 2 V_p sen(π/N) */
export function distanciaMinimaPSK(amplitud: number, orden: number): number {
  return 2 * amplitud * Math.sin(Math.PI / orden);
}

/** V_t = (1/T) log₂ N */
export function velocidadTransmisionPSK(orden: number, duracionSimbolo: number): number {
  return Math.log2(orden) / duracionSimbolo;
}

/** BW = 1/T: BW_dibit = 1/T_dibit = 1/(2 T_bit) = BW_bit/2 */
export function anchoBandaPSK(duracionSimbolo: number): number {
  return 1 / duracionSimbolo;
}

/** Eficiencia espectral V_t / BW = log₂ N [bit/s/Hz] (con BW = 1/T) */
export function eficienciaEspectralPSK(orden: number): number {
  return Math.log2(orden);
}

/** Energía por símbolo E_s = V_p² T / 2 */
export function energiaSimboloPSK(amplitud: number, duracionSimbolo: number): number {
  return (amplitud * amplitud * duracionSimbolo) / 2;
}

/** Frecuencia máxima significativa (portadora más el primer lóbulo lateral): f_p + 2/T */
export function frecuenciaMaximaPSK(frecuenciaPortadora: number, duracionSimbolo: number): number {
  return frecuenciaPortadora + 2 / duracionSimbolo;
}

export function nombreVariantePSK(orden: number): string {
  if (orden === 2) return "2PSK (BPSK)";
  if (orden === 4) return "4PSK (QPSK)";
  return `${orden}PSK`;
}

export const formulasPSK: ConjuntoFormulas = {
  tecnica: "PSK",
  archivo: "src/formulas/formulasPSK.ts",
  version: "2.0.0",
  principal: {
    identificador: "psk-modulada",
    nombre: "Señal MPSK",
    ecuacion: String.raw`v(t)=V_p\cos(2\pi f_p t+\phi_i),\qquad \phi_i=i\,\theta+\phi_0,\qquad \theta=\frac{2\pi}{N}`,
    variables: [
      { simbolo: "V_p", descripcion: "Valor pico de la portadora", unidad: "V", valor: (p) => p.amplitudPortadora },
      { simbolo: "f_p", descripcion: "Frecuencia de la portadora", unidad: "Hz", valor: (p) => p.frecuenciaPortadora },
      { simbolo: "N", descripcion: "Fases posibles (orden de modulación)", unidad: "", valor: (p) => p.ordenModulacion },
      { simbolo: "k", descripcion: "Bits por símbolo, log₂N", unidad: "bit", valor: (p) => p.bitsPorSimbolo },
      { simbolo: "T", descripcion: "Duración de símbolo", unidad: "s", valor: (p) => p.duracionSimbolo },
      { simbolo: String.raw`\theta`, descripcion: "Separación entre fases", unidad: "rad", valor: (p) => separacionFasePSK(p.ordenModulacion) },
      { simbolo: String.raw`\phi_0`, descripcion: "Fase de referencia (parámetro adicional, 0 por defecto)", unidad: "rad", valor: (p) => p.faseInicial },
      { simbolo: "i", descripcion: "Índice del estado de fase, 0 … N−1", unidad: "" },
    ],
    descripcion: "Amplitud y frecuencia constantes; la fase toma N valores separados θ.",
    unidad: "V",
    version: "2.0.0",
    paginaTema6: "55–56",
  },
  complementarias: [
    {
      identificador: "psk-moduladora",
      nombre: "Señal moduladora (2PSK)",
      ecuacion: String.raw`v_m(t)=\begin{cases}1 & \text{para un 1 binario}\\ -1 & \text{para un 0 binario}\end{cases}`,
      variables: [],
      descripcion: "En 2PSK la moduladora es bipolar.",
      unidad: "",
      version: "2.0.0",
      paginaTema6: "54",
    },
    {
      identificador: "psk-2psk",
      nombre: "Señal 2PSK",
      ecuacion: String.raw`v(t)=v_p(t)\,v_m(t)=\begin{cases}V_p\cos(2\pi f_p t) & V_m=1\\ V_p\cos(2\pi f_p t+\pi) & V_m=-1\end{cases}`,
      variables: [],
      descripcion: "Las dos expresiones difieren 180°. Es el producto de la portadora por la moduladora.",
      unidad: "V",
      version: "2.0.0",
      paginaTema6: "54–55",
    },
    {
      identificador: "psk-qpsk",
      nombre: "Fases de 4PSK (QPSK)",
      ecuacion: String.raw`10\to 0^\circ,\quad 01\to 90^\circ,\quad 11\to 180^\circ,\quad 00\to 270^\circ`,
      variables: [],
      descripcion: "La figura del Tema 6 repite 10 en 270° (errata); por descarte corresponde 00.",
      unidad: "°",
      version: "2.0.0",
      paginaTema6: "57",
    },
    {
      identificador: "psk-niveles",
      nombre: "Niveles de la señal multinivel",
      ecuacion: String.raw`00\to 0,\quad 01\to 1,\quad 10\to 2,\quad 11\to 3`,
      variables: [],
      descripcion: "Cada dibit se asigna a un nivel de la señal moduladora.",
      unidad: "",
      version: "2.0.0",
      paginaTema6: "56",
    },
    {
      identificador: "psk-velocidad",
      nombre: "Velocidad de transmisión",
      ecuacion: String.raw`V_t=\frac{1}{T}\log_2 N,\qquad T_{dibit}=2\,T_{bit}`,
      variables: [],
      descripcion: "Al aumentar N sube la velocidad de transmisión sin cambiar la de modulación.",
      unidad: "bit/s",
      version: "2.0.0",
      paginaTema6: "57",
    },
    {
      identificador: "psk-ancho-banda",
      nombre: "Ancho de banda",
      ecuacion: String.raw`BW_{dibit}=\frac{1}{T_{dibit}}=\frac{1}{2\,T_{bit}}=\frac{BW_{bit}}{2}`,
      variables: [],
      descripcion: "Para la misma V_t, los dibits requieren la mitad del ancho de banda que los bits.",
      unidad: "Hz",
      version: "2.0.0",
      paginaTema6: "58",
    },
    formulaPortadoraReferencia,
    {
      identificador: "psk-iq",
      nombre: "Componentes en fase y cuadratura",
      ecuacion: String.raw`v(t)=I_i\cos(2\pi f_p t)-Q_i\operatorname{sen}(2\pi f_p t),\quad I_i=V_p\cos\phi_i,\ Q_i=V_p\operatorname{sen}\phi_i`,
      variables: [],
      descripcion: "Coordenadas de cada símbolo en el diagrama de constelación.",
      unidad: "V",
      version: "2.0.0",
    },
    {
      identificador: "psk-distancia",
      nombre: "Distancia mínima, energía y eficiencia",
      ecuacion: String.raw`d_{min}=2V_p\operatorname{sen}\frac{\pi}{N},\quad E_s=\frac{V_p^2\,T}{2},\quad \frac{V_t}{BW}=\log_2 N`,
      variables: [],
      descripcion: "Magnitudes adicionales para analizar la constelación y el enlace.",
      unidad: "",
      version: "2.0.0",
    },
  ],
  sustituir: (p) =>
    String.raw`v(t)=${numeroLatex(p.amplitudPortadora)}\cos(2\pi\cdot ${numeroLatex(p.frecuenciaPortadora)}\,t+\phi_i),\quad \phi_i=i\cdot\frac{2\pi}{${p.ordenModulacion}}${terminoFaseLatex(p.faseInicial)}`,
};
