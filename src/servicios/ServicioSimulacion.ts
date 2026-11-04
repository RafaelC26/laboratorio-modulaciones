import { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { indiceModulacionAM } from "@/formulas/formulasAM";
import { nombreVariantePSK } from "@/formulas/formulasPSK";
import { indiceModulacionFase } from "@/formulas/formulasPSM";
import { motorMatematico, type MotorMatematico } from "@/motores/MotorMatematico";
import type { EntradaModulacion } from "@/tipos/tiposModulacion";
import type { ResultadoOperacionSimulacion } from "@/tipos/tiposSimulacion";
import { formatearConUnidad, formatearNumero } from "@/utilidades/formatoNumerico";
import { limpiarSecuenciaBits } from "@/utilidades/validacionNumerica";
import { ServicioValidacion } from "./ServicioValidacion";

/** Descripción corta de una configuración, para el historial de simulaciones. */
export function etiquetaEntrada(entrada: EntradaModulacion): string {
  const fp = formatearConUnidad(entrada.frecuenciaPortadora, "Hz", 3);
  switch (entrada.tipo) {
    case "AM":
      return `AM · m=${formatearNumero(indiceModulacionAM(entrada), 3)} · fp=${fp} · fm=${formatearConUnidad(entrada.frecuenciaModuladora, "Hz", 3)}`;
    case "ASK": {
      const bits = limpiarSecuenciaBits(entrada.secuenciaBits);
      const resumenBits = bits.length > 12 ? `${bits.slice(0, 12)}…` : bits;
      return `${entrada.amplitudBit0 === 0 ? "OOK" : "ASK"} · ${resumenBits} · Tbit=${formatearConUnidad(entrada.duracionBit, "s", 3)} · fp=${fp}`;
    }
    case "PSK":
      return `${nombreVariantePSK(entrada.ordenModulacion)} · ${limpiarSecuenciaBits(entrada.secuenciaBits).length} bits · T=${formatearConUnidad(entrada.duracionSimbolo, "s", 3)} · fp=${fp}`;
    case "PSM":
      return `PSM · β=${formatearNumero(indiceModulacionFase(entrada), 3)} rad · fp=${fp} · fm=${formatearConUnidad(entrada.frecuenciaModuladora, "Hz", 3)}`;
  }
}

/**
 * Punto de entrada de la interfaz al cálculo: valida, convierte la entrada del
 * formulario en parámetros, invoca el motor matemático y devuelve el resultado
 * o los errores encontrados.
 */
export class ServicioSimulacion {
  private readonly validacion: ServicioValidacion;

  constructor(private readonly motor: MotorMatematico = motorMatematico) {
    this.validacion = new ServicioValidacion(motor);
  }

  simular(entrada: EntradaModulacion): ResultadoOperacionSimulacion {
    const { errores, advertencias } = this.validacion.validar(entrada);
    if (errores.length) return { exito: false, errores, advertencias };

    try {
      const parametros = ParametrosModulacion.desdeEntrada(entrada);
      const resultado = this.motor.ejecutar(parametros, structuredClone(entrada), advertencias);
      return { exito: true, resultado, advertencias: resultado.advertencias };
    } catch (excepcion) {
      const mensaje = excepcion instanceof Error ? excepcion.message : String(excepcion);
      return { exito: false, errores: [{ nivel: "error", mensaje: `Error de cálculo: ${mensaje}` }], advertencias };
    }
  }

  validar(entrada: EntradaModulacion) {
    return this.validacion.validar(entrada);
  }
}

export const servicioSimulacion = new ServicioSimulacion();
