/**
 * Conversiones de unidades usadas en formularios y gráficas.
 * Internamente el sistema trabaja siempre en unidades SI: s, Hz, V y rad.
 */

export function gradosARadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

export function radianesAGrados(radianes: number): number {
  return (radianes * 180) / Math.PI;
}

/** Normaliza un ángulo en radianes al intervalo [0, 2π). */
export function normalizarAngulo(radianes: number): number {
  const vuelta = 2 * Math.PI;
  const resto = radianes % vuelta;
  const normalizado = resto < 0 ? resto + vuelta : resto;
  // Evita devolver 2π por errores de redondeo.
  return Math.abs(normalizado - vuelta) < 1e-12 ? 0 : normalizado;
}

export interface UnidadVisual {
  etiqueta: string;
  /** valorMostrado = valorSI × factor */
  factor: number;
}

export const UNIDADES_FRECUENCIA: UnidadVisual[] = [
  { etiqueta: "Hz", factor: 1 },
  { etiqueta: "kHz", factor: 1e-3 },
  { etiqueta: "MHz", factor: 1e-6 },
];

export const UNIDADES_TIEMPO: UnidadVisual[] = [
  { etiqueta: "s", factor: 1 },
  { etiqueta: "ms", factor: 1e3 },
  { etiqueta: "µs", factor: 1e6 },
];

export const UNIDADES_FASE: UnidadVisual[] = [
  { etiqueta: "°", factor: 180 / Math.PI },
  { etiqueta: "rad", factor: 1 },
];

/** Elige la unidad cuyo valor mostrado queda entre 1 y 1000 (o la más cercana). */
export function elegirUnidadAdecuada(valorSI: number, unidades: UnidadVisual[]): UnidadVisual {
  const absoluto = Math.abs(valorSI);
  if (absoluto === 0 || !Number.isFinite(absoluto)) return unidades[0];
  let mejor = unidades[0];
  let mejorDistancia = Infinity;
  for (const unidad of unidades) {
    const mostrado = absoluto * unidad.factor;
    const distancia = mostrado >= 1 && mostrado < 1000 ? 0 : Math.abs(Math.log10(mostrado) - 1.5);
    if (distancia < mejorDistancia) {
      mejor = unidad;
      mejorDistancia = distancia;
    }
  }
  return mejor;
}

/** Escala de tiempo para los ejes de las gráficas según la duración simulada. */
export function escalaTiempoParaDuracion(duracion: number): UnidadVisual {
  if (duracion < 2e-3) return { etiqueta: "µs", factor: 1e6 };
  if (duracion < 2) return { etiqueta: "ms", factor: 1e3 };
  return { etiqueta: "s", factor: 1 };
}

/** Escala de frecuencia para los ejes espectrales según la frecuencia máxima visible. */
export function escalaFrecuenciaParaMaximo(frecuenciaMaxima: number): UnidadVisual {
  if (frecuenciaMaxima >= 2e6) return { etiqueta: "MHz", factor: 1e-6 };
  if (frecuenciaMaxima >= 2e3) return { etiqueta: "kHz", factor: 1e-3 };
  return { etiqueta: "Hz", factor: 1 };
}
