/**
 * Tipos de las técnicas de modulación y de los datos que el usuario configura
 * en los formularios. Son objetos planos (serializables) para poder guardarse
 * en el estado, en el historial y en las exportaciones JSON.
 */

export type TipoModulacion = "AM" | "ASK" | "PSK" | "PSM";

export type CategoriaModulacion = "analogica" | "digital";

/** Asignación entre grupos de bits e índices de fase en PSK. */
export type MapeoSimbolos = "binario" | "gray";

/** Configuración temporal común. En técnicas digitales el intervalo se deriva de la secuencia. */
export interface ConfiguracionTemporal {
  tiempoInicial: number; // s
  tiempoFinal: number; // s
  frecuenciaMuestreo: number; // Hz
}

export interface EntradaAM {
  tipo: "AM";
  amplitudPortadora: number; // A_c [V]
  frecuenciaPortadora: number; // f_c [Hz]
  faseInicial: number; // φ_c [rad]
  amplitudModuladora: number; // A_m [V]  (μ = A_m / A_c)
  frecuenciaModuladora: number; // f_m [Hz]
  temporal: ConfiguracionTemporal;
}

export interface EntradaASK {
  tipo: "ASK";
  secuenciaBits: string;
  amplitudBit1: number; // A_1 [V]
  amplitudBit0: number; // A_0 [V]
  frecuenciaPortadora: number; // f_c [Hz]
  duracionBit: number; // T_b [s]
  faseInicial: number; // φ_c [rad]
  temporal: ConfiguracionTemporal;
}

export interface EntradaPSK {
  tipo: "PSK";
  secuenciaBits: string;
  ordenModulacion: number; // M (2, 4, 8, 16)
  amplitudPortadora: number; // A_c [V]
  frecuenciaPortadora: number; // f_c [Hz]
  duracionSimbolo: number; // T_s [s]
  faseInicial: number; // φ_0 [rad], desplazamiento de la constelación
  mapeoSimbolos: MapeoSimbolos;
  temporal: ConfiguracionTemporal;
}

/** PSM: modulación de fase analógica (Phase Shift Modulation). Ver src/formulas/formulasPSM.ts */
export interface EntradaPSM {
  tipo: "PSM";
  amplitudPortadora: number; // A_c [V]
  frecuenciaPortadora: number; // f_c [Hz]
  faseInicial: number; // φ_c [rad]
  amplitudModuladora: number; // A_m [V]
  frecuenciaModuladora: number; // f_m [Hz]
  sensibilidadFase: number; // k_p [rad/V]  (β = k_p · A_m)
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
  /** Observaciones didácticas que se muestran en el panel de información. */
  observaciones: string[];
}
