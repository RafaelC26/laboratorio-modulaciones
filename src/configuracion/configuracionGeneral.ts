import type {
  DescripcionTecnica,
  EntradasPorTecnica,
  LimiteParametro,
  TipoModulacion,
} from "@/tipos/tiposModulacion";

export const configuracionGeneral = {
  nombreAplicacion: "Laboratorio Virtual de Modulaciones",
  descripcion: "Sistema interactivo de simulación y visualización de señales de comunicaciones",
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
    observaciones: [
      "Con μ = 0 la señal modulada es la portadora sin cambios.",
      "Con 0 < μ < 1 la envolvente reproduce fielmente la moduladora.",
      "Con μ = 1 la envolvente llega a cero: modulación al 100 %.",
      "Con μ > 1 la envolvente cruza por cero (zonas rojas): hay sobremodulación e inversión de fase.",
      "En el espectro aparecen la portadora en f_c y dos bandas laterales en f_c ± f_m de amplitud μA_c/2.",
    ],
  },
  {
    tipo: "ASK",
    sigla: "ASK",
    nombre: "Modulación por desplazamiento de amplitud",
    categoria: "digital",
    caracteristica: "La amplitud de la portadora cambia según los símbolos digitales.",
    observaciones: [
      "Con A₀ = 0 se obtiene OOK (encendido/apagado): la portadora desaparece en los bits 0.",
      "Si f_c·T_b es entero, cada bit contiene un número exacto de ciclos de portadora.",
      "El lóbulo principal del espectro ocupa f_c ± R_b (ancho nulo a nulo 2R_b).",
      "En la constelación, ASK binaria es un conjunto de puntos sobre el eje I.",
    ],
  },
  {
    tipo: "PSK",
    sigla: "PSK",
    nombre: "Modulación por desplazamiento de fase",
    categoria: "digital",
    caracteristica: "La fase de la portadora cambia entre M estados; amplitud y frecuencia constantes.",
    observaciones: [
      "M = 2 (BPSK): dos fases, 0 y π. M = 4 (QPSK): cuatro fases separadas π/2.",
      "Cada símbolo transporta k = log₂M bits, por lo que R_b = k·R_s.",
      "Con el mapeo Gray, los símbolos vecinos en la constelación difieren en un solo bit.",
      "Los saltos de fase aparecen en los límites de símbolo (líneas punteadas verticales).",
      "La envolvente es constante: todos los puntos de la constelación están en un círculo de radio A_c.",
    ],
  },
  {
    tipo: "PSM",
    sigla: "PSM",
    nombre: "Modulación por desplazamiento de fase (analógica)",
    categoria: "analogica",
    caracteristica: "La fase instantánea de la portadora sigue a la señal moduladora: φ(t) = k_p·m(t).",
    observaciones: [
      "PSM es la modulación de fase analógica (PM): la contraparte analógica de PSK, como AM lo es de ASK.",
      "La amplitud es constante; la información está en la fase.",
      "La frecuencia instantánea depende de la derivada de m(t): f_i(t) = f_c − βf_m·sen(2πf_mt).",
      "El espectro tiene rayas en f_c ± n·f_m con amplitudes A_c|J_n(β)| (funciones de Bessel).",
      "Regla de Carson: B ≈ 2(β + 1)f_m. Con β < 0.3 se considera de banda estrecha.",
    ],
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
    secuenciaBits: "101101001110",
    ordenModulacion: 2,
    amplitudPortadora: 1,
    frecuenciaPortadora: 1000,
    duracionSimbolo: 0.002,
    faseInicial: 0,
    mapeoSimbolos: "gray",
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
  sensibilidadFase: "Sensibilidad de fase",
  indiceModulacion: "Índice de modulación",
  indiceModulacionFase: "Índice de modulación de fase",
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
