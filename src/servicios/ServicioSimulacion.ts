import { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { motorMatematico, type MotorMatematico } from "@/motores/MotorMatematico";
import type { EntradaModulacion } from "@/tipos/tiposModulacion";
import type { ResultadoOperacionSimulacion } from "@/tipos/tiposSimulacion";
import { ServicioValidacion } from "./ServicioValidacion";

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
