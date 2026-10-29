/**
 * Tipos asociados a las señales muestreadas.
 */

/** Las muestras se guardan en arreglos tipados de doble precisión. */
export type ArregloNumerico = Float64Array;

export type IdentificadorSenal = "moduladora" | "portadora" | "modulada";

/** Señal adicional que acompaña a una gráfica (envolvente, fase, frecuencia instantánea…). */
export interface SenalAuxiliar {
  identificador: string;
  /** Gráfica en la que se dibuja. */
  grafica: IdentificadorSenal;
  estilo: "envolvente" | "escalon" | "linea";
  /** Si es true se dibuja sobre el eje vertical secundario (derecho). */
  ejeSecundario: boolean;
  tituloEje?: string;
}

/** Intervalo temporal ocupado por un símbolo digital. */
export interface IntervaloSimbolo {
  indiceSimbolo: number;
  inicio: number; // s
  fin: number; // s
  bits: number[];
  /** Índice i del estado de modulación (fase o amplitud). */
  indiceEstado: number;
  amplitud: number; // V
  fase: number; // rad
  etiqueta: string;
}

/** Punto de una constelación en el plano I/Q. */
export interface PuntoConstelacion {
  indiceEstado: number;
  enFase: number; // I
  cuadratura: number; // Q
  fase: number; // rad
  amplitud: number; // V
  etiqueta: string; // bits asignados
  /** Número de veces que el símbolo aparece en la secuencia transmitida. */
  repeticiones: number;
}

/** Componente espectral calculada analíticamente (para contrastar con la FFT). */
export interface ComponenteEspectralTeorica {
  frecuencia: number; // Hz
  amplitud: number; // V (espectro de un lado)
  etiqueta: string;
}

/** Marca vertical de referencia en el espectro (portadora, nulos…). */
export interface MarcaFrecuencia {
  frecuencia: number; // Hz
  etiqueta: string;
}
