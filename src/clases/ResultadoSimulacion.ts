import type { ConfiguracionSenal } from "./ConfiguracionSenal";
import type { ParametrosModulacion } from "./ParametrosModulacion";
import type { SenalAnalogica } from "./SenalAnalogica";
import type { EntradaModulacion, TipoModulacion } from "@/tipos/tiposModulacion";
import type { DatosModulacion, MensajeValidacion, Metrica, ResumenComparativo, SenalAuxiliarCalculada } from "@/tipos/tiposSimulacion";
import type {
  ComponenteEspectralTeorica,
  IntervaloSimbolo,
  MarcaFrecuencia,
  PuntoConstelacion,
} from "@/tipos/tiposSenal";

let contadorResultados = 0;

function generarIdentificador(): string {
  contadorResultados += 1;
  return `sim-${Date.now().toString(36)}-${contadorResultados}`;
}

export interface DatosResultado extends DatosModulacion {
  parametros: ParametrosModulacion;
  entrada: EntradaModulacion;
  configuracion: ConfiguracionSenal;
  ecuacion: string;
  tiempoSimulacion: number;
  advertenciasValidacion: MensajeValidacion[];
}

/**
 * Todos los resultados de una simulación. Es inmutable: cada ejecución crea uno nuevo.
 */
export class ResultadoSimulacion {
  readonly id: string;
  readonly fechaEjecucion: Date;
  readonly nombreVariante: string;
  readonly senalModuladora: SenalAnalogica;
  readonly senalPortadora: SenalAnalogica;
  readonly senalModulada: SenalAnalogica;
  readonly auxiliares: SenalAuxiliarCalculada[];
  readonly parametros: ParametrosModulacion;
  readonly entrada: EntradaModulacion;
  readonly configuracion: ConfiguracionSenal;
  /** Ecuación principal aplicada (LaTeX). */
  readonly ecuacion: string;
  /** Tiempo empleado en el cálculo [ms]. */
  readonly tiempoSimulacion: number;
  readonly metricas: Metrica[];
  readonly resumen: ResumenComparativo;
  readonly intervalosSimbolo: IntervaloSimbolo[];
  readonly constelacion: PuntoConstelacion[];
  readonly componentesTeoricos: ComponenteEspectralTeorica[];
  readonly marcasFrecuencia: MarcaFrecuencia[];
  readonly regionesSobremodulacion: Array<[number, number]>;
  readonly advertencias: MensajeValidacion[];

  constructor(datos: DatosResultado) {
    this.id = generarIdentificador();
    this.fechaEjecucion = new Date();
    this.nombreVariante = datos.nombreVariante;
    this.senalModuladora = datos.moduladora;
    this.senalPortadora = datos.portadora;
    this.senalModulada = datos.modulada;
    this.auxiliares = datos.auxiliares;
    this.parametros = datos.parametros;
    this.entrada = datos.entrada;
    this.configuracion = datos.configuracion;
    this.ecuacion = datos.ecuacion;
    this.tiempoSimulacion = datos.tiempoSimulacion;
    this.metricas = datos.metricas;
    this.resumen = datos.resumen;
    this.intervalosSimbolo = datos.intervalosSimbolo;
    this.constelacion = datos.constelacion;
    this.componentesTeoricos = datos.componentesTeoricos;
    this.marcasFrecuencia = datos.marcasFrecuencia;
    this.regionesSobremodulacion = datos.regionesSobremodulacion;
    this.advertencias = [
      ...datos.advertenciasValidacion,
      ...datos.advertencias.map((mensaje): MensajeValidacion => ({ nivel: "advertencia", mensaje })),
    ];
  }

  get tipo(): TipoModulacion {
    return this.parametros.tipoModulacion;
  }

  get frecuenciaMuestreo(): number {
    return this.configuracion.frecuenciaMuestreo;
  }

  get cantidadMuestras(): number {
    return this.senalModulada.cantidadMuestras;
  }

  get tiempo(): Float64Array {
    return this.senalModulada.tiempo;
  }

  obtenerSenal(identificador: "moduladora" | "portadora" | "modulada"): SenalAnalogica {
    if (identificador === "moduladora") return this.senalModuladora;
    if (identificador === "portadora") return this.senalPortadora;
    return this.senalModulada;
  }
}
