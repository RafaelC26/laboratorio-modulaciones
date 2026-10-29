import { calcularCantidadMuestras, type ConfiguracionSenal } from "@/clases/ConfiguracionSenal";
import { configuracionMuestreo } from "@/configuracion/configuracionMuestreo";

/**
 * Genera los instantes de muestreo (sección 8.1):
 *   Δt = 1/f_s,   t_n = t_0 + n·Δt,   n = 0, 1, …, N−1
 * Cada instante se calcula directamente a partir de n (no por acumulación),
 * para que el error de redondeo no crezca a lo largo del vector.
 */
export class MotorMuestreo {
  static generarVectorTiempo(configuracion: ConfiguracionSenal): Float64Array {
    return MotorMuestreo.vectorTiempo(
      configuracion.tiempoInicial,
      configuracion.tiempoFinal,
      configuracion.frecuenciaMuestreo,
    );
  }

  static vectorTiempo(tiempoInicial: number, tiempoFinal: number, frecuenciaMuestreo: number): Float64Array {
    const cantidad = calcularCantidadMuestras(tiempoInicial, tiempoFinal, frecuenciaMuestreo);
    const tiempo = new Float64Array(cantidad);
    for (let n = 0; n < cantidad; n++) tiempo[n] = tiempoInicial + n / frecuenciaMuestreo;
    return tiempo;
  }

  /** Evalúa una función del tiempo en cada instante del vector. */
  static evaluar(tiempo: Float64Array, funcion: (t: number, n: number) => number): Float64Array {
    const valores = new Float64Array(tiempo.length);
    for (let n = 0; n < tiempo.length; n++) valores[n] = funcion(tiempo[n], n);
    return valores;
  }

  /**
   * Frecuencia de muestreo sugerida: factor·f_max redondeada a 1, 2 o 5 × 10^k,
   * limitada para no superar el máximo de muestras en la duración indicada.
   */
  static frecuenciaMuestreoRecomendada(
    frecuenciaMaxima: number,
    duracion: number,
    factor: number = configuracionMuestreo.factorAutomatico,
  ): number {
    const objetivo = redondearValorAgradable(frecuenciaMaxima * factor);
    const minimoAceptable = frecuenciaMaxima * configuracionMuestreo.factorRecomendado;
    const limitePorMuestras = duracion > 0 ? configuracionMuestreo.maximoMuestras / duracion : Infinity;
    if (objetivo <= limitePorMuestras) return objetivo;
    // Si no cabe, se usa la mayor frecuencia permitida que siga cumpliendo el criterio recomendado.
    const reducida = Math.floor(limitePorMuestras);
    return Math.max(reducida, Math.ceil(minimoAceptable));
  }
}

/** Redondea hacia arriba a la serie 1-2-5. */
export function redondearValorAgradable(valor: number): number {
  if (!(valor > 0) || !Number.isFinite(valor)) return valor;
  const exponente = Math.floor(Math.log10(valor));
  const base = Math.pow(10, exponente);
  const mantisa = valor / base;
  const escalon = mantisa <= 1 ? 1 : mantisa <= 2 ? 2 : mantisa <= 5 ? 5 : 10;
  return escalon * base;
}
