/**
 * FÓRMULAS DE MODULACIÓN ASK (Tema 6, p. 49–51)
 * ------------------------------------------------------------------
 * v_p(t) = V_p sen(2π f_p t)
 * v_m(t) = 1 para un "1" binario, 0 para un "0" binario
 * v(t)   = V_p v_m(t) sen(2π f_p t)
 *
 * El Tema 6 indica que los dos valores binarios se representan con dos
 * amplitudes diferentes y que es usual que una sea cero. El laboratorio permite
 * configurar ambas: A_1 = V_p y A_0 = 0 reproducen exactamente su expresión.
 */
import { formulaPortadoraSeno } from "./formulasPortadora";
import type { ConjuntoFormulas } from "@/tipos/tiposFormulas";
import { numeroLatex, terminoFaseLatex } from "@/utilidades/formatoNumerico";

export interface VariablesASK {
  amplitudBit1: number; // A_1 [V]
  amplitudBit0: number; // A_0 [V]
  frecuenciaPortadora: number; // f_p [Hz]
  faseInicial: number; // φ_p [rad]
}

/** A_i según el bit transmitido. */
export function amplitudSimboloASK(bit: number, v: VariablesASK): number {
  return bit === 1 ? v.amplitudBit1 : v.amplitudBit0;
}

/** v(t) = A_i sen(2π f_p t + φ_p) */
export function senalModuladaASK(t: number, bit: number, v: VariablesASK): number {
  return amplitudSimboloASK(bit, v) * Math.sin(2 * Math.PI * v.frecuenciaPortadora * t + v.faseInicial);
}

/** V_t = (1/T_bit) log₂ 2 = 1 / T_bit */
export function velocidadTransmisionASK(duracionBit: number): number {
  return 1 / duracionBit;
}

/**
 * BW = 1 / T_bit. El Tema 6 no da una fórmula para ASK; se usa el mismo criterio
 * que da para PSK (BW = 1/T, p. 58), así ASK y 2PSK coinciden con el mismo T_bit.
 */
export function anchoBandaASK(duracionBit: number): number {
  return 1 / duracionBit;
}

/** Ancho del lóbulo principal (de nulo a nulo, entre f_p ± 1/T_bit) con pulsos rectangulares: 2 / T_bit */
export function anchoLobuloPrincipalASK(duracionBit: number): number {
  return 2 / duracionBit;
}

/** Energía de un bit de amplitud A: E = A² T_bit / 2 */
export function energiaBitASK(amplitud: number, duracionBit: number): number {
  return (amplitud * amplitud * duracionBit) / 2;
}

/** Profundidad de modulación: (A_1 − A_0) / (A_1 + A_0) */
export function indiceModulacionASK(v: VariablesASK): number {
  const suma = v.amplitudBit1 + v.amplitudBit0;
  return suma === 0 ? 0 : (v.amplitudBit1 - v.amplitudBit0) / suma;
}

/** Frecuencia máxima significativa (portadora más el primer lóbulo lateral): f_p + 2/T_bit */
export function frecuenciaMaximaASK(frecuenciaPortadora: number, duracionBit: number): number {
  return frecuenciaPortadora + 2 / duracionBit;
}

export function esOOK(v: VariablesASK): boolean {
  return v.amplitudBit0 === 0 || v.amplitudBit1 === 0;
}

export const formulasASK: ConjuntoFormulas = {
  tecnica: "ASK",
  archivo: "src/formulas/formulasASK.ts",
  version: "2.0.0",
  principal: {
    identificador: "ask-modulada",
    nombre: "Señal ASK",
    ecuacion: String.raw`v(t)=A_i\operatorname{sen}(2\pi f_p t+\phi_p),\qquad A_i=\begin{cases}A_1, & \text{para un 1}\\ A_0, & \text{para un 0}\end{cases}`,
    variables: [
      { simbolo: "A_1", descripcion: "Amplitud para el bit 1", unidad: "V", valor: (p) => p.amplitudBit1 },
      { simbolo: "A_0", descripcion: "Amplitud para el bit 0", unidad: "V", valor: (p) => p.amplitudBit0 },
      { simbolo: "f_p", descripcion: "Frecuencia de la portadora", unidad: "Hz", valor: (p) => p.frecuenciaPortadora },
      { simbolo: "T_{bit}", descripcion: "Duración de bit", unidad: "s", valor: (p) => p.duracionSimbolo },
      { simbolo: "V_t", descripcion: "Velocidad de transmisión", unidad: "bit/s", valor: (p) => p.tasaBits },
      { simbolo: String.raw`\phi_p`, descripcion: "Fase inicial (parámetro adicional, 0 por defecto)", unidad: "rad", valor: (p) => p.faseInicial },
    ],
    descripcion: "Cada bit selecciona la amplitud de la portadora durante T_bit segundos.",
    unidad: "V",
    version: "2.0.0",
    paginaTema6: "49–50",
  },
  complementarias: [
    {
      identificador: "ask-moduladora",
      nombre: "Señal moduladora",
      ecuacion: String.raw`v_m(t)=\begin{cases}1 & \text{para un 1 binario}\\ 0 & \text{para un 0 binario}\end{cases}`,
      variables: [],
      descripcion: "Al ser digital, la moduladora solo toma los valores 0 y 1.",
      unidad: "",
      version: "2.0.0",
      paginaTema6: "49",
    },
    {
      identificador: "ask-tema6",
      nombre: "Expresión del Tema 6 (A₁ = V_p, A₀ = 0)",
      ecuacion: String.raw`v(t)=V_p\,v_m(t)\operatorname{sen}(2\pi f_p t)=\begin{cases}V_p\operatorname{sen}(2\pi f_p t) & \text{para un 1}\\ 0 & \text{para un 0}\end{cases}`,
      variables: [],
      descripcion: "Un dígito se representa con la portadora y el otro con su ausencia (OOK).",
      unidad: "V",
      version: "2.0.0",
      paginaTema6: "50",
    },
    formulaPortadoraSeno,
    {
      identificador: "ask-velocidad",
      nombre: "Velocidad de transmisión",
      ecuacion: String.raw`V_t=\frac{1}{T_{bit}}\log_2 2=\frac{1}{T_{bit}}`,
      variables: [],
      descripcion: "Con dos niveles, la velocidad de transmisión y la de modulación coinciden.",
      unidad: "bit/s",
      version: "2.0.0",
      paginaTema6: "15, 57",
    },
    {
      identificador: "ask-intervalo",
      nombre: "Intervalo de cada bit",
      ecuacion: String.raw`i\,T_{bit}\le t<(i+1)\,T_{bit}`,
      variables: [],
      descripcion: "El bit i se transmite durante un intervalo de duración T_bit.",
      unidad: "s",
      version: "2.0.0",
    },
    {
      identificador: "ask-ancho-banda",
      nombre: "Ancho de banda",
      ecuacion: String.raw`BW=\frac{1}{T_{bit}}`,
      variables: [],
      descripcion: "El Tema 6 no da una fórmula para ASK: se aplica la misma que usa en PSK (BW = 1/T, p. 58).",
      unidad: "Hz",
      version: "2.1.0",
    },
    {
      identificador: "ask-lobulo-principal",
      nombre: "Lóbulo principal (de nulo a nulo)",
      ecuacion: String.raw`\frac{2}{T_{bit}}`,
      variables: [],
      descripcion: "Distancia entre los primeros nulos f_p ± 1/T_bit con pulsos rectangulares. El Tema 6 solo muestra la forma sen x/x (p. 50–51).",
      unidad: "Hz",
      version: "2.1.0",
    },
    {
      identificador: "ask-energia",
      nombre: "Energía por bit",
      ecuacion: String.raw`E_i=\frac{A_i^2\,T_{bit}}{2}`,
      variables: [],
      descripcion: "Energía normalizada a 1 Ω, suponiendo un número entero de ciclos por bit.",
      unidad: "J",
      version: "2.0.0",
    },
  ],
  sustituir: (p) => {
    const fase = terminoFaseLatex(p.faseInicial);
    const fp = numeroLatex(p.frecuenciaPortadora);
    return String.raw`v(t)=\begin{cases}${numeroLatex(p.amplitudBit1)}\operatorname{sen}(2\pi\cdot ${fp}\,t${fase}), & \text{para un 1}\\ ${numeroLatex(p.amplitudBit0)}\operatorname{sen}(2\pi\cdot ${fp}\,t${fase}), & \text{para un 0}\end{cases}\quad T_{bit}=${numeroLatex(p.duracionSimbolo)}\,\text{s}`;
  },
};
