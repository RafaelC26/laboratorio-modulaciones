/**
 * Tipos del estado de visualización. Cambiarlos no recalcula las señales.
 */

export type IdGrafica = "moduladora" | "portadora" | "modulada" | "espectro" | "constelacion";

export type TipoVentana = "rectangular" | "hann" | "hamming" | "blackman";

export type EscalaEspectro = "lineal" | "decibelios";

export type SenalEspectro = "modulada" | "moduladora" | "portadora";

export type VistaLaboratorio = "laboratorio" | "comparacion";

export interface EstadoVisualizacion {
  visibles: Record<IdGrafica, boolean>;
  ventana: TipoVentana;
  escalaEspectro: EscalaEspectro;
  senalEspectro: SenalEspectro;
  mostrarTeorico: boolean;
  /** Rango temporal sincronizado entre las gráficas de tiempo [s]; null = rango completo. */
  rangoTiempo: [number, number] | null;
}

export interface ResultadoEspectro {
  /** Frecuencias de cada punto (espectro de un lado) [Hz]. */
  frecuencias: Float64Array;
  /** Amplitud de pico de cada componente [V], corregida por la ganancia coherente de la ventana. */
  amplitudes: Float64Array;
  /** Resolución frecuencial Δf = fs / N [Hz]. */
  resolucion: number;
  frecuenciaMuestreo: number;
  cantidadMuestras: number;
  ventana: TipoVentana;
}

export interface AnalisisEspectral {
  frecuenciaPico: number;
  amplitudPico: number;
  frecuenciaCentroide: number;
  anchoBandaOcupado: number;
  limiteInferior: number;
  limiteSuperior: number;
  fraccionPotencia: number;
}
