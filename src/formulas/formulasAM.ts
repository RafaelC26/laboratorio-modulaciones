/**
 * FÓRMULAS DE MODULACIÓN AM (Tema 6, p. 33–40)
 * ------------------------------------------------------------------
 * v_p(t) = V_p sen(2π f_p t)
 * v_m(t) = V_m sen(2π f_m t)
 * m      = V_m / V_p
 * v(t)   = V_p [1 + m sen(2π f_m t)] sen(2π f_p t)
 *
 * Para cambiar la ecuación de AM se edita únicamente este archivo:
 * las funciones (lo que se calcula) y las definiciones LaTeX (lo que se muestra).
 */
import { formulaPortadoraSeno, type VariablesPortadora } from "./formulasPortadora";
import { configuracionGeneral } from "@/configuracion/configuracionGeneral";
import type { ConjuntoFormulas } from "@/tipos/tiposFormulas";
import { numeroLatex, terminoFaseLatex } from "@/utilidades/formatoNumerico";

export interface VariablesAM extends VariablesPortadora {
  amplitudModuladora: number; // V_m [V]
  frecuenciaModuladora: number; // f_m [Hz]
}

/** m = V_m / V_p */
export function indiceModulacionAM(v: { amplitudModuladora: number; amplitudPortadora: number }): number {
  return v.amplitudPortadora === 0 ? 0 : v.amplitudModuladora / v.amplitudPortadora;
}

/** M % = (V_m / V_p) · 100 */
export function porcentajeModulacionAM(v: { amplitudModuladora: number; amplitudPortadora: number }): number {
  return indiceModulacionAM(v) * 100;
}

/** v_m(t) = V_m sen(2π f_m t) */
export function senalModuladoraAM(t: number, v: VariablesAM): number {
  return v.amplitudModuladora * Math.sin(2 * Math.PI * v.frecuenciaModuladora * t);
}

/** e(t) = V_p [1 + m sen(2π f_m t)]  (envolvente ideal, puede ser negativa si m > 1) */
export function envolventeAM(t: number, v: VariablesAM): number {
  const m = indiceModulacionAM(v);
  return v.amplitudPortadora * (1 + m * Math.sin(2 * Math.PI * v.frecuenciaModuladora * t));
}

/** v(t) = V_p [1 + m sen(2π f_m t)] sen(2π f_p t + φ_p) */
export function senalModuladaAM(t: number, v: VariablesAM): number {
  return envolventeAM(t, v) * Math.sin(2 * Math.PI * v.frecuenciaPortadora * t + v.faseInicial);
}

/** Amplitud de cada frecuencia lateral: m·V_p / 2 */
export function amplitudBandaLateralAM(amplitudPortadora: number, m: number): number {
  return (m * amplitudPortadora) / 2;
}

/** P_p = V_p² / 2R */
export function potenciaPortadoraAM(amplitudPortadora: number, resistencia = configuracionGeneral.resistenciaReferencia): number {
  return (amplitudPortadora * amplitudPortadora) / (2 * resistencia);
}

/** P = P_p (1 + m²/2) */
export function potenciaTotalAM(amplitudPortadora: number, m: number, resistencia = configuracionGeneral.resistenciaReferencia): number {
  return potenciaPortadoraAM(amplitudPortadora, resistencia) * (1 + (m * m) / 2);
}

/** η = m² / (2 + m²): fracción de la potencia que transportan las bandas laterales. */
export function eficienciaAM(m: number): number {
  return (m * m) / (2 + m * m);
}

/** BW = 2 f_m */
export function anchoBandaAM(frecuenciaModuladora: number): number {
  return 2 * frecuenciaModuladora;
}

/** Frecuencia más alta presente en la señal: f_p + f_m */
export function frecuenciaMaximaAM(v: VariablesAM): number {
  return v.frecuenciaPortadora + v.frecuenciaModuladora;
}

export type ClasificacionAM = "sin-modulacion" | "submodulacion" | "modulacion-completa" | "sobremodulacion";

export function clasificarIndiceAM(m: number, tolerancia = 1e-9): ClasificacionAM {
  if (Math.abs(m) <= tolerancia) return "sin-modulacion";
  if (Math.abs(m - 1) <= tolerancia) return "modulacion-completa";
  return m < 1 ? "submodulacion" : "sobremodulacion";
}

export const textoClasificacionAM: Record<ClasificacionAM, string> = {
  "sin-modulacion": "Sin modulación (m = 0)",
  submodulacion: "Sin distorsión (M < 100 %)",
  "modulacion-completa": "Modulación al 100 % (M = 100 %)",
  sobremodulacion: "Sobremodulación (M > 100 %)",
};

export const formulasAM: ConjuntoFormulas = {
  tecnica: "AM",
  archivo: "src/formulas/formulasAM.ts",
  version: "2.0.0",
  principal: {
    identificador: "am-modulada",
    nombre: "Señal AM",
    ecuacion: String.raw`v(t)=V_p\left[1+m\operatorname{sen}(2\pi f_m t)\right]\operatorname{sen}(2\pi f_p t+\phi_p)`,
    variables: [
      { simbolo: "V_p", descripcion: "Valor pico de la portadora", unidad: "V", valor: (p) => p.amplitudPortadora },
      { simbolo: "V_m", descripcion: "Valor pico de la moduladora", unidad: "V", valor: (p) => p.amplitudModuladora },
      { simbolo: "f_p", descripcion: "Frecuencia de la portadora", unidad: "Hz", valor: (p) => p.frecuenciaPortadora },
      { simbolo: "f_m", descripcion: "Frecuencia de la moduladora", unidad: "Hz", valor: (p) => p.frecuenciaModuladora },
      { simbolo: "m", descripcion: "Índice de modulación", unidad: "", valor: (p) => p.indiceModulacion ?? 0 },
      { simbolo: String.raw`\phi_p`, descripcion: "Fase inicial (parámetro adicional, 0 por defecto)", unidad: "rad", valor: (p) => p.faseInicial },
    ],
    descripcion: "La amplitud de la portadora sigue a la señal moduladora.",
    unidad: "V",
    version: "2.0.0",
    paginaTema6: "36",
  },
  complementarias: [
    {
      identificador: "am-moduladora",
      nombre: "Señal moduladora",
      ecuacion: String.raw`v_m(t)=V_m\operatorname{sen}(2\pi f_m t)`,
      variables: [],
      descripcion: "Señal de información sinusoidal.",
      unidad: "V",
      version: "2.0.0",
      paginaTema6: "35",
    },
    formulaPortadoraSeno,
    {
      identificador: "am-indice",
      nombre: "Índice y porcentaje de modulación",
      ecuacion: String.raw`m=\frac{V_m}{V_p},\qquad M\%=\frac{V_m}{V_p}\cdot 100`,
      variables: [],
      descripcion: "M puede variar de 0 % a 100 % sin distorsión; por encima hay sobremodulación.",
      unidad: "",
      version: "2.0.0",
      paginaTema6: "36",
    },
    {
      identificador: "am-espectro",
      nombre: "Desarrollo de la señal modulada",
      ecuacion: String.raw`v(t)=V_p\operatorname{sen}(2\pi f_p t)+\frac{mV_p}{2}\cos\big[2\pi(f_p-f_m)t\big]-\frac{mV_p}{2}\cos\big[2\pi(f_p+f_m)t\big]`,
      variables: [],
      descripcion: "Portadora más las frecuencias laterales f_p ± f_m, de amplitud mV_p/2 (con φ_p = 0).",
      unidad: "V",
      version: "2.0.0",
      paginaTema6: "36, 38",
    },
    {
      identificador: "am-potencia",
      nombre: "Potencia de la señal modulada",
      ecuacion: String.raw`P=P_p\left(1+\frac{m^2}{2}\right)`,
      variables: [],
      descripcion: "Con m = 1, la portadora consume 2/3 de la potencia y las bandas laterales 1/3.",
      unidad: "W",
      version: "2.0.0",
      paginaTema6: "40",
    },
    {
      identificador: "am-ancho-banda",
      nombre: "Ancho de banda",
      ecuacion: String.raw`BW=2f_m`,
      variables: [],
      descripcion: "Se necesita f_m para cada banda lateral (el Tema 6 lo muestra con un ejemplo de 10 kHz → 20 kHz).",
      unidad: "Hz",
      version: "2.0.0",
      paginaTema6: "39",
    },
    {
      identificador: "am-potencia-absoluta",
      nombre: "Potencia de portadora y eficiencia",
      ecuacion: String.raw`P_p=\frac{V_p^2}{2R},\qquad \eta=\frac{m^2}{2+m^2}`,
      variables: [],
      descripcion: "Potencia normalizada a R = 1 Ω. Con m = 1 da η = 1/3, igual que el Tema 6 (p. 40).",
      unidad: "W",
      version: "2.0.0",
    },
    {
      identificador: "am-envolvente",
      nombre: "Envolvente",
      ecuacion: String.raw`e(t)=V_p\left[1+m\operatorname{sen}(2\pi f_m t)\right]`,
      variables: [],
      descripcion: "Curva punteada de la gráfica; si se hace negativa hay sobremodulación.",
      unidad: "V",
      version: "2.0.0",
    },
  ],
  sustituir: (p) => {
    const m = p.indiceModulacion ?? 0;
    return String.raw`v(t)=${numeroLatex(p.amplitudPortadora)}\left[1+${numeroLatex(m)}\operatorname{sen}(2\pi\cdot ${numeroLatex(p.frecuenciaModuladora)}\,t)\right]\operatorname{sen}(2\pi\cdot ${numeroLatex(p.frecuenciaPortadora)}\,t${terminoFaseLatex(p.faseInicial)})`;
  },
};
