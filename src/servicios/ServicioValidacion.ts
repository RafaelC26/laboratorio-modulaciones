import { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { configuracionGeneral, etiquetasParametros, limitesParametros } from "@/configuracion/configuracionGeneral";
import { configuracionMuestreo } from "@/configuracion/configuracionMuestreo";
import { indiceModulacionAM } from "@/formulas/formulasAM";
import { indiceModulacionFase } from "@/formulas/formulasPSM";
import { motorMatematico, type MotorMatematico } from "@/motores/MotorMatematico";
import type { EntradaModulacion } from "@/tipos/tiposModulacion";
import type { MensajeValidacion, ResultadoValidacion } from "@/tipos/tiposSimulacion";
import { formatearConUnidad, formatearNumero } from "@/utilidades/formatoNumerico";
import { contieneSoloBits, esNumeroFinito, limpiarSecuenciaBits } from "@/utilidades/validacionNumerica";

type Restriccion = "positivo" | "noNegativo" | "finito";

/**
 * Verifica que una configuración sea matemáticamente válida antes de simular
 * (sección 8.4): números finitos, frecuencias positivas, intervalos coherentes,
 * secuencias digitales válidas y muestreo suficiente.
 */
export class ServicioValidacion {
  constructor(private readonly motor: MotorMatematico = motorMatematico) {}

  validar(entrada: EntradaModulacion): ResultadoValidacion {
    const errores: MensajeValidacion[] = [];
    const advertencias: MensajeValidacion[] = [];
    const error = (campo: string, mensaje: string) => errores.push({ nivel: "error", campo, mensaje });
    const aviso = (campo: string, mensaje: string) => advertencias.push({ nivel: "advertencia", campo, mensaje });

    const revisar = (campo: string, valor: number, restriccion: Restriccion) => {
      const clave = campo.replace("temporal.", "");
      const nombre = etiquetasParametros[clave] ?? clave;
      if (!esNumeroFinito(valor)) return error(campo, `${nombre}: debe ser un número válido.`);
      if (restriccion === "positivo" && valor <= 0) return error(campo, `${nombre}: debe ser mayor que cero.`);
      if (restriccion === "noNegativo" && valor < 0) return error(campo, `${nombre}: no puede ser negativa.`);
      const limite = limitesParametros[clave];
      if (limite && (valor < limite.minimo || valor > limite.maximo)) {
        error(
          campo,
          `${nombre}: debe estar entre ${formatearConUnidad(limite.minimo, limite.unidad)} y ${formatearConUnidad(limite.maximo, limite.unidad)}.`,
        );
      }
    };

    const revisarBits = (texto: string) => {
      const limpio = limpiarSecuenciaBits(texto);
      if (!limpio.length) return error("secuenciaBits", "Ingrese al menos un bit.");
      if (!contieneSoloBits(limpio)) return error("secuenciaBits", "La secuencia solo puede contener los símbolos 0 y 1.");
      if (limpio.length > configuracionGeneral.maximoBits) {
        error("secuenciaBits", `La secuencia admite como máximo ${configuracionGeneral.maximoBits} bits.`);
      }
    };

    const revisarTemporalAnalogico = () => {
      revisar("temporal.tiempoInicial", entrada.temporal.tiempoInicial, "finito");
      revisar("temporal.tiempoFinal", entrada.temporal.tiempoFinal, "finito");
      if (entrada.temporal.tiempoFinal <= entrada.temporal.tiempoInicial) {
        error("temporal.tiempoFinal", "El tiempo final debe ser mayor que el tiempo inicial.");
      }
    };

    revisar("temporal.frecuenciaMuestreo", entrada.temporal.frecuenciaMuestreo, "positivo");

    switch (entrada.tipo) {
      case "AM": {
        revisar("amplitudPortadora", entrada.amplitudPortadora, "positivo");
        revisar("amplitudModuladora", entrada.amplitudModuladora, "noNegativo");
        revisar("frecuenciaPortadora", entrada.frecuenciaPortadora, "positivo");
        revisar("frecuenciaModuladora", entrada.frecuenciaModuladora, "positivo");
        revisar("faseInicial", entrada.faseInicial, "finito");
        revisarTemporalAnalogico();
        const mu = indiceModulacionAM(entrada);
        if (mu > 1) aviso("amplitudModuladora", `μ = ${formatearNumero(mu)} > 1: se producirá sobremodulación.`);
        if (entrada.frecuenciaModuladora >= entrada.frecuenciaPortadora) {
          aviso("frecuenciaModuladora", "La frecuencia moduladora debería ser bastante menor que la de la portadora.");
        }
        break;
      }
      case "ASK": {
        revisarBits(entrada.secuenciaBits);
        revisar("amplitudBit1", entrada.amplitudBit1, "noNegativo");
        revisar("amplitudBit0", entrada.amplitudBit0, "noNegativo");
        revisar("frecuenciaPortadora", entrada.frecuenciaPortadora, "positivo");
        revisar("duracionBit", entrada.duracionBit, "positivo");
        revisar("faseInicial", entrada.faseInicial, "finito");
        if (entrada.frecuenciaPortadora * entrada.duracionBit < 1) {
          aviso("duracionBit", "Cada bit contiene menos de un ciclo de portadora.");
        }
        break;
      }
      case "PSK": {
        revisarBits(entrada.secuenciaBits);
        if (!(configuracionGeneral.ordenesPSK as readonly number[]).includes(entrada.ordenModulacion)) {
          error("ordenModulacion", `El orden M debe ser uno de: ${configuracionGeneral.ordenesPSK.join(", ")}.`);
        }
        if (entrada.mapeoSimbolos !== "binario" && entrada.mapeoSimbolos !== "gray") {
          error("mapeoSimbolos", "El mapeo debe ser binario o Gray.");
        }
        revisar("amplitudPortadora", entrada.amplitudPortadora, "positivo");
        revisar("frecuenciaPortadora", entrada.frecuenciaPortadora, "positivo");
        revisar("duracionSimbolo", entrada.duracionSimbolo, "positivo");
        revisar("faseInicial", entrada.faseInicial, "finito");
        if (entrada.frecuenciaPortadora * entrada.duracionSimbolo < 1) {
          aviso("duracionSimbolo", "Cada símbolo contiene menos de un ciclo de portadora: los saltos de fase serán difíciles de apreciar.");
        }
        break;
      }
      case "PSM": {
        revisar("amplitudPortadora", entrada.amplitudPortadora, "positivo");
        revisar("amplitudModuladora", entrada.amplitudModuladora, "noNegativo");
        revisar("frecuenciaPortadora", entrada.frecuenciaPortadora, "positivo");
        revisar("frecuenciaModuladora", entrada.frecuenciaModuladora, "positivo");
        revisar("sensibilidadFase", entrada.sensibilidadFase, "finito");
        revisar("faseInicial", entrada.faseInicial, "finito");
        revisarTemporalAnalogico();
        const beta = indiceModulacionFase(entrada);
        const limiteBeta = limitesParametros.indiceModulacionFase.maximo;
        if (beta > limiteBeta) error("sensibilidadFase", `β = k_p·A_m = ${formatearNumero(beta)} rad supera el máximo de ${limiteBeta} rad.`);
        if (entrada.frecuenciaModuladora >= entrada.frecuenciaPortadora) {
          aviso("frecuenciaModuladora", "La frecuencia moduladora debería ser bastante menor que la de la portadora.");
        }
        break;
      }
    }

    if (!errores.length) this.validarMuestreo(entrada, error, aviso);
    return { errores, advertencias };
  }

  /** Cantidad de muestras y criterio de muestreo f_s ≥ 10·f_max (mínimo de Nyquist como error). */
  private validarMuestreo(
    entrada: EntradaModulacion,
    error: (campo: string, mensaje: string) => void,
    aviso: (campo: string, mensaje: string) => void,
  ): void {
    const parametros = ParametrosModulacion.desdeEntrada(entrada);
    const configuracion = this.motor.configuracionPara(parametros, entrada.temporal);
    const fs = configuracion.frecuenciaMuestreo;
    const cantidad = configuracion.cantidadMuestras;
    const campo = "temporal.frecuenciaMuestreo";

    if (cantidad > configuracionMuestreo.maximoMuestras) {
      error(
        campo,
        `Se generarían ${cantidad.toLocaleString("es")} muestras (máximo ${configuracionMuestreo.maximoMuestras.toLocaleString("es")}). Reduzca f_s o la duración.`,
      );
      return;
    }
    if (cantidad < configuracionMuestreo.minimoMuestras) {
      error(campo, `Solo se generarían ${cantidad} muestras (mínimo ${configuracionMuestreo.minimoMuestras}). Aumente f_s o la duración.`);
      return;
    }

    const fmax = this.motor.obtenerMotor(entrada.tipo).frecuenciaMaxima(parametros);
    if (fs <= configuracionMuestreo.factorNyquist * fmax) {
      error(
        campo,
        `f_s = ${formatearConUnidad(fs, "Hz")} no supera el mínimo de Nyquist 2·f_max = ${formatearConUnidad(2 * fmax, "Hz")}: habría aliasing.`,
      );
    } else if (fs < configuracionMuestreo.factorRecomendado * fmax) {
      aviso(
        campo,
        `f_s está por debajo del criterio recomendado ${configuracionMuestreo.factorRecomendado}·f_max = ${formatearConUnidad(configuracionMuestreo.factorRecomendado * fmax, "Hz")}: la forma de onda se verá poco detallada.`,
      );
    }
  }
}

export const servicioValidacion = new ServicioValidacion();
