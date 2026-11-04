import type {
  DescripcionTecnica,
  EntradasPorTecnica,
  LimiteParametro,
  TipoModulacion,
} from "@/tipos/tiposModulacion";

export const configuracionGeneral = {
  nombreAplicacion: "Laboratorio Virtual de Modulaciones",
  version: "1.0.0",
  /** Órdenes de modulación PSK disponibles (M = 2^k). */
  ordenesPSK: [2, 4, 8, 16] as const,
  maximoBits: 256,
  /** Impedancia de referencia para potencias normalizadas [Ω]. */
  resistenciaReferencia: 1,
} as const;

export const tecnicasDisponibles: DescripcionTecnica[] = [
  {
    tipo: "AM",
    sigla: "AM",
    nombre: "Modulación de amplitud",
    categoria: "analogica",
    caracteristica: "La amplitud de la portadora varía según la señal moduladora.",
  },
  {
    tipo: "ASK",
    sigla: "ASK",
    nombre: "Modulación por desplazamiento de amplitud",
    categoria: "digital",
    caracteristica: "La amplitud de la portadora cambia según los símbolos digitales.",
  },
  {
    tipo: "PSK",
    sigla: "PSK",
    nombre: "Modulación por desplazamiento de fase",
    categoria: "digital",
    caracteristica: "La fase de la portadora cambia entre N valores; amplitud y frecuencia constantes.",
  },
  {
    tipo: "PSM",
    sigla: "PSM",
    nombre: "Modulación de fase (PM)",
    categoria: "analogica",
    caracteristica: "La fase de la portadora varía proporcionalmente a la moduladora: Φ(t) = ΔΦ·v_m(t).",
  },
];

export function obtenerDescripcionTecnica(tipo: TipoModulacion): DescripcionTecnica {
  const descripcion = tecnicasDisponibles.find((t) => t.tipo === tipo);
  if (!descripcion) throw new Error(`Técnica no registrada: ${tipo}`);
  return descripcion;
}

/** Valores con los que se inicia cada técnica (y a los que vuelve "Reiniciar"). */
export const valoresPredeterminados: EntradasPorTecnica = {
  AM: {
    tipo: "AM",
    amplitudPortadora: 1,
    frecuenciaPortadora: 1000,
    faseInicial: 0,
    amplitudModuladora: 0.5,
    frecuenciaModuladora: 100,
    temporal: { tiempoInicial: 0, tiempoFinal: 0.02, frecuenciaMuestreo: 100_000 },
  },
  ASK: {
    tipo: "ASK",
    secuenciaBits: "10110",
    amplitudBit1: 1,
    amplitudBit0: 0,
    frecuenciaPortadora: 1000,
    duracionBit: 0.005,
    faseInicial: 0,
    temporal: { tiempoInicial: 0, tiempoFinal: 0.025, frecuenciaMuestreo: 100_000 },
  },
  PSK: {
    tipo: "PSK",
    secuenciaBits: "101101001001",
    ordenModulacion: 2,
    amplitudPortadora: 1,
    frecuenciaPortadora: 1000,
    duracionSimbolo: 0.002,
    faseInicial: 0,
    mapeoSimbolos: "apuntes",
    temporal: { tiempoInicial: 0, tiempoFinal: 0.024, frecuenciaMuestreo: 100_000 },
  },
  PSM: {
    tipo: "PSM",
    amplitudPortadora: 1,
    frecuenciaPortadora: 1000,
    faseInicial: 0,
    amplitudModuladora: 1,
    frecuenciaModuladora: 100,
    sensibilidadFase: 2,
    temporal: { tiempoInicial: 0, tiempoFinal: 0.02, frecuenciaMuestreo: 100_000 },
  },
};

/** Nombres legibles de cada parámetro (formularios y mensajes de validación). */
export const etiquetasParametros: Record<string, string> = {
  amplitudPortadora: "Amplitud de la portadora",
  amplitudModuladora: "Amplitud de la moduladora",
  amplitudBit1: "Amplitud para el bit 1",
  amplitudBit0: "Amplitud para el bit 0",
  frecuenciaPortadora: "Frecuencia de la portadora",
  frecuenciaModuladora: "Frecuencia de la moduladora",
  faseInicial: "Fase inicial",
  duracionBit: "Duración de bit",
  duracionSimbolo: "Duración de símbolo",
  sensibilidadFase: "Constante de desviación de fase",
  indiceModulacion: "Índice de modulación",
  indiceModulacionFase: "Índice de modulación",
  secuenciaBits: "Secuencia de bits",
  ordenModulacion: "Orden de modulación",
  mapeoSimbolos: "Mapeo de símbolos",
  tiempoInicial: "Tiempo inicial",
  tiempoFinal: "Tiempo final",
  frecuenciaMuestreo: "Frecuencia de muestreo",
};

/** Límites de configuración y unidades (SI) de cada parámetro. */
export const limitesParametros: Record<string, LimiteParametro> = {
  amplitudPortadora: { minimo: 0, maximo: 1000, paso: 0.01, unidad: "V", deslizador: [0, 5] },
  amplitudModuladora: { minimo: 0, maximo: 1000, paso: 0.01, unidad: "V", deslizador: [0, 5] },
  amplitudBit1: { minimo: 0, maximo: 1000, paso: 0.01, unidad: "V", deslizador: [0, 5] },
  amplitudBit0: { minimo: 0, maximo: 1000, paso: 0.01, unidad: "V", deslizador: [0, 5] },
  frecuenciaPortadora: { minimo: 1e-3, maximo: 1e9, paso: 1, unidad: "Hz" },
  frecuenciaModuladora: { minimo: 1e-3, maximo: 1e9, paso: 1, unidad: "Hz" },
  faseInicial: { minimo: -4 * Math.PI, maximo: 4 * Math.PI, paso: Math.PI / 180, unidad: "rad", deslizador: [-Math.PI, Math.PI] },
  duracionBit: { minimo: 1e-9, maximo: 100, paso: 1e-4, unidad: "s" },
  duracionSimbolo: { minimo: 1e-9, maximo: 100, paso: 1e-4, unidad: "s" },
  sensibilidadFase: { minimo: -1000, maximo: 1000, paso: 0.01, unidad: "rad/V", deslizador: [0, 10] },
  indiceModulacion: { minimo: 0, maximo: 10, paso: 0.01, unidad: "", deslizador: [0, 2] },
  indiceModulacionFase: { minimo: 0, maximo: 20, paso: 0.01, unidad: "rad", deslizador: [0, 10] },
  tiempoInicial: { minimo: -1e6, maximo: 1e6, paso: 1e-3, unidad: "s" },
  tiempoFinal: { minimo: -1e6, maximo: 1e6, paso: 1e-3, unidad: "s" },
  frecuenciaMuestreo: { minimo: 1, maximo: 1e11, paso: 1000, unidad: "Hz" },
};
