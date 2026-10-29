import { esNumeroFinito, esPositivo } from "@/utilidades/validacionNumerica";

/**
 * Configuración necesaria para generar una señal en el dominio del tiempo.
 * La frecuencia de muestreo es el parámetro principal; la cantidad de muestras
 * se deriva del intervalo temporal (sección 8.3).
 */
export class ConfiguracionSenal {
  constructor(
    readonly amplitud: number,
    readonly frecuencia: number,
    readonly fase: number,
    readonly frecuenciaMuestreo: number,
    readonly tiempoInicial: number,
    readonly tiempoFinal: number,
  ) {}

  /** Δt = 1 / f_s */
  get intervaloMuestreo(): number {
    return 1 / this.frecuenciaMuestreo;
  }

  get duracion(): number {
    return this.tiempoFinal - this.tiempoInicial;
  }

  /** N = round((t_f − t_0)·f_s): muestras en [t_0, t_f). */
  get cantidadMuestras(): number {
    return calcularCantidadMuestras(this.tiempoInicial, this.tiempoFinal, this.frecuenciaMuestreo);
  }

  validar(): string[] {
    const errores: string[] = [];
    if (!esNumeroFinito(this.amplitud)) errores.push("La amplitud debe ser un número válido.");
    if (!esPositivo(this.frecuencia)) errores.push("La frecuencia debe ser positiva.");
    if (!esNumeroFinito(this.fase)) errores.push("La fase debe ser un número válido.");
    if (!esPositivo(this.frecuenciaMuestreo)) errores.push("La frecuencia de muestreo debe ser positiva.");
    if (!(this.tiempoFinal > this.tiempoInicial)) errores.push("El tiempo final debe ser mayor que el inicial.");
    return errores;
  }

  conCambios(cambios: Partial<ConfiguracionSenal>): ConfiguracionSenal {
    return new ConfiguracionSenal(
      cambios.amplitud ?? this.amplitud,
      cambios.frecuencia ?? this.frecuencia,
      cambios.fase ?? this.fase,
      cambios.frecuenciaMuestreo ?? this.frecuenciaMuestreo,
      cambios.tiempoInicial ?? this.tiempoInicial,
      cambios.tiempoFinal ?? this.tiempoFinal,
    );
  }
}

export function calcularCantidadMuestras(tiempoInicial: number, tiempoFinal: number, frecuenciaMuestreo: number): number {
  const cantidad = Math.round((tiempoFinal - tiempoInicial) * frecuenciaMuestreo);
  return Number.isFinite(cantidad) ? Math.max(0, cantidad) : 0;
}
