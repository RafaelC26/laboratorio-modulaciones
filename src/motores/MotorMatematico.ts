import { ConfiguracionSenal } from "@/clases/ConfiguracionSenal";
import type { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { ResultadoSimulacion } from "@/clases/ResultadoSimulacion";
import { obtenerConjuntoFormulas } from "@/formulas/repositorioFormulas";
import type { ConfiguracionTemporal, EntradaModulacion, TipoModulacion } from "@/tipos/tiposModulacion";
import type { MensajeValidacion, MotorModulacion } from "@/tipos/tiposSimulacion";
import { MotorModulacionAM } from "./MotorModulacionAM";
import { MotorModulacionASK } from "./MotorModulacionASK";
import { MotorModulacionPSK } from "./MotorModulacionPSK";
import { MotorModulacionPSM } from "./MotorModulacionPSM";
import { MotorMuestreo } from "./MotorMuestreo";

export class ErrorCalculo extends Error {}

/**
 * Coordina la simulación: identifica la técnica, genera el vector de tiempo,
 * delega el cálculo en el motor especializado y verifica los resultados.
 */
export class MotorMatematico {
  private readonly motores = new Map<TipoModulacion, MotorModulacion>();

  constructor(motores: MotorModulacion[] = [
    new MotorModulacionAM(),
    new MotorModulacionASK(),
    new MotorModulacionPSK(),
    new MotorModulacionPSM(),
  ]) {
    for (const motor of motores) this.registrarMotor(motor);
  }

  /** Permite incorporar nuevas técnicas sin modificar el resto del sistema (RF-18). */
  registrarMotor(motor: MotorModulacion): void {
    this.motores.set(motor.tipo, motor);
  }

  obtenerMotor(tipo: TipoModulacion): MotorModulacion {
    const motor = this.motores.get(tipo);
    if (!motor) throw new ErrorCalculo(`No existe un motor registrado para ${tipo}.`);
    return motor;
  }

  /** Configuración temporal efectiva (las técnicas digitales derivan el intervalo de la secuencia). */
  configuracionPara(parametros: ParametrosModulacion, temporal: ConfiguracionTemporal): ConfiguracionSenal {
    const { inicio, fin } = this.obtenerMotor(parametros.tipoModulacion).intervaloTemporal(parametros, temporal);
    return new ConfiguracionSenal(
      parametros.amplitudPortadora,
      parametros.frecuenciaPortadora,
      parametros.faseInicial,
      temporal.frecuenciaMuestreo,
      inicio,
      fin,
    );
  }

  ejecutar(
    parametros: ParametrosModulacion,
    entrada: EntradaModulacion,
    advertenciasValidacion: MensajeValidacion[] = [],
  ): ResultadoSimulacion {
    const motor = this.obtenerMotor(parametros.tipoModulacion);
    const configuracion = this.configuracionPara(parametros, entrada.temporal);
    const erroresConfiguracion = configuracion.validar();
    if (erroresConfiguracion.length) throw new ErrorCalculo(erroresConfiguracion.join(" "));

    const inicio = performance.now();
    const tiempo = MotorMuestreo.generarVectorTiempo(configuracion);
    const datos = motor.calcular(parametros, tiempo);
    const duracion = performance.now() - inicio;

    const senales = [datos.moduladora, datos.portadora, datos.modulada, ...datos.auxiliares.map((a) => a.senal)];
    const invalida = senales.find((senal) => senal.contieneValoresInvalidos());
    if (invalida) {
      throw new ErrorCalculo(`La señal "${invalida.nombre}" contiene valores no válidos (NaN o infinitos).`);
    }

    return new ResultadoSimulacion({
      ...datos,
      parametros,
      entrada,
      configuracion,
      ecuacion: obtenerConjuntoFormulas(parametros.tipoModulacion).principal.ecuacion,
      tiempoSimulacion: duracion,
      advertenciasValidacion,
    });
  }
}

/** Instancia compartida por los servicios. */
export const motorMatematico = new MotorMatematico();
