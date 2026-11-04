/**
 * Tipos de las técnicas de modulación y de los datos que el usuario configura
 * en los formularios. Son objetos planos (serializables) para poder guardarse
 * en el estado, en el historial y en las exportaciones JSON.
 */

export type TipoModulacion = "AM" | "ASK" | "PSK" | "PSM";

export type CategoriaModulacion = "analogica" | "digital";

/**
 * Asignación entre grupos de bits e índices de fase en PSK.
 * "apuntes" es la del Tema 6 (p. 54–57); los órdenes que no define usan binario natural.
 */
export type MapeoSimbolos = "apuntes" | "gray" | "binario";

/** Configuración temporal común. En técnicas digitales el intervalo se deriva de la secuencia. */
export interface ConfiguracionTemporal {
  tiempoInicial: number; // s
  tiempoFinal: number; // s
  frecuenciaMuestreo: number; // Hz
}

export interface EntradaAM {
  tipo: "AM";
  amplitudPortadora: number; // V_p [V]
  frecuenciaPortadora: number; // f_p [Hz]
  faseInicial: number; // φ_p [rad]
  amplitudModuladora: number; // V_m [V]  (m = V_m / V_p)
  frecuenciaModuladora: number; // f_m [Hz]
  temporal: ConfiguracionTemporal;
}

export interface EntradaASK {
  tipo: "ASK";
  secuenciaBits: string;
  amplitudBit1: number; // A_1 [V]
  amplitudBit0: number; // A_0 [V]
  frecuenciaPortadora: number; // f_p [Hz]
  duracionBit: number; // T_bit [s]
  faseInicial: number; // φ_p [rad]
  temporal: ConfiguracionTemporal;
}

export interface EntradaPSK {
  tipo: "PSK";
  secuenciaBits: string;
  ordenModulacion: number; // N (2, 4, 8, 16)
  amplitudPortadora: number; // V_p [V]
  frecuenciaPortadora: number; // f_p [Hz]
  duracionSimbolo: number; // T [s]
  faseInicial: number; // φ_0 [rad], desplazamiento de la constelación
  mapeoSimbolos: MapeoSimbolos;
  temporal: ConfiguracionTemporal;
}

/** PSM: modulación de fase analógica (Phase Shift Modulation). Ver src/formulas/formulasPSM.ts */
export interface EntradaPSM {
  tipo: "PSM";
  amplitudPortadora: number; // V_p [V]
  frecuenciaPortadora: number; // f_p [Hz]
  faseInicial: number; // φ_p [rad]
  amplitudModuladora: number; // V_m [V]
  frecuenciaModuladora: number; // f_m [Hz]
  sensibilidadFase: number; // ΔΦ [rad/V], constante de desviación de fase (β = ΔΦ · V_m)
  temporal: ConfiguracionTemporal;
}

export type EntradaModulacion = EntradaAM | EntradaASK | EntradaPSK | EntradaPSM;

export interface EntradasPorTecnica {
  AM: EntradaAM;
  ASK: EntradaASK;
  PSK: EntradaPSK;
  PSM: EntradaPSM;
}

/** Límites y unidad de un parámetro configurable. */
export interface LimiteParametro {
  minimo: number;
  maximo: number;
  paso: number;
  unidad: string;
  /** Rango del deslizador, si el campo lo muestra (en unidades SI). */
  deslizador?: [number, number];
}

export interface DescripcionTecnica {
  tipo: TipoModulacion;
  sigla: string;
  nombre: string;
  categoria: CategoriaModulacion;
  caracteristica: string;
}
