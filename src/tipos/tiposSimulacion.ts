import type { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import type { ResultadoSimulacion } from "@/clases/ResultadoSimulacion";
import type { SenalAnalogica } from "@/clases/SenalAnalogica";
import type { ConfiguracionTemporal, EntradaModulacion, TipoModulacion } from "./tiposModulacion";
import type {
  ComponenteEspectralTeorica,
  IntervaloSimbolo,
  MarcaFrecuencia,
  PuntoConstelacion,
  SenalAuxiliar,
} from "./tiposSenal";

export type NivelMensaje = "error" | "advertencia";

export interface MensajeValidacion {
  nivel: NivelMensaje;
  mensaje: string;
  /** Campo del formulario relacionado, por ejemplo "frecuenciaPortadora" o "temporal.frecuenciaMuestreo". */
  campo?: string;
}

export interface ResultadoValidacion {
  errores: MensajeValidacion[];
  advertencias: MensajeValidacion[];
}

export interface Metrica {
  clave: string;
  nombre: string;
  /** Símbolo en LaTeX (opcional). */
  simbolo?: string;
  valor: number | string;
  unidad?: string;
  estado?: "normal" | "advertencia" | "critico";
  descripcion?: string;
}

/** Datos homogéneos para comparar técnicas (sección 16.3 del documento). */
export interface ResumenComparativo {
  amplitudMaxima: number;
  amplitudMinima: number;
  frecuenciaCentral: number;
  anchoBandaEstimado: number;
  tasaBits: number | null;
  tasaSimbolos: number | null;
  estados: number | null;
}

export type SenalAuxiliarCalculada = SenalAuxiliar & { senal: SenalAnalogica };

/** Lo que devuelve cada motor especializado. */
export interface DatosModulacion {
  nombreVariante: string;
  moduladora: SenalAnalogica;
  portadora: SenalAnalogica;
  modulada: SenalAnalogica;
  auxiliares: SenalAuxiliarCalculada[];
  metricas: Metrica[];
  resumen: ResumenComparativo;
  intervalosSimbolo: IntervaloSimbolo[];
  constelacion: PuntoConstelacion[];
  componentesTeoricos: ComponenteEspectralTeorica[];
  marcasFrecuencia: MarcaFrecuencia[];
  /** Intervalos [inicio, fin] en segundos donde 1 + μ·m(t) < 0 (solo AM). */
  regionesSobremodulacion: Array<[number, number]>;
  advertencias: string[];
}

/** Contrato que cumple cada motor de modulación (AM, ASK, PSK, PSM y futuros). */
export interface MotorModulacion {
  readonly tipo: TipoModulacion;
  /** Intervalo de tiempo a simular. Las técnicas digitales lo derivan de la secuencia. */
  intervaloTemporal(parametros: ParametrosModulacion, temporal: ConfiguracionTemporal): { inicio: number; fin: number };
  /** Frecuencia máxima significativa de la señal, usada para validar el muestreo. */
  frecuenciaMaxima(parametros: ParametrosModulacion): number;
  calcular(parametros: ParametrosModulacion, tiempo: Float64Array): DatosModulacion;
}

export type EstadoEjecucion = "inactivo" | "calculando" | "listo" | "error";

export type ResultadoOperacionSimulacion =
  | { exito: true; resultado: ResultadoSimulacion; advertencias: MensajeValidacion[] }
  | { exito: false; errores: MensajeValidacion[]; advertencias: MensajeValidacion[] };

/** Registro serializable de una simulación anterior. */
export interface RegistroHistorial {
  id: string;
  fecha: number;
  tipo: TipoModulacion;
  etiqueta: string;
  entrada: EntradaModulacion;
}
