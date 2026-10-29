/**
 * Criterios de muestreo (sección 8 del documento del proyecto).
 */
export const configuracionMuestreo = {
  /** Límite de muestras por señal para no bloquear el navegador. */
  maximoMuestras: 400_000,
  /** Mínimo de muestras para que la simulación tenga sentido. */
  minimoMuestras: 32,
  /** Criterio inicial de visualización: f_s ≥ 10·f_max. */
  factorRecomendado: 10,
  /** Mínimo de Nyquist: f_s > 2·f_max. Por debajo hay aliasing y se rechaza la simulación. */
  factorNyquist: 2,
  /** Factor usado por el botón "Usar recomendada" (más detalle que el mínimo recomendado). */
  factorAutomatico: 50,
  /** Tolerancia relativa para asignar una muestra que cae justo en un límite de símbolo. */
  toleranciaLimiteSimbolo: 1e-9,
} as const;
