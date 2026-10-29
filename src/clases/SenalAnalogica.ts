import { MuestraSenal } from "./MuestraSenal";
import { todosFinitos } from "@/utilidades/validacionNumerica";

/**
 * Señal representada por sus muestras: vector de tiempos y vector de amplitudes.
 */
export class SenalAnalogica {
  readonly amplitudMaxima: number;
  readonly amplitudMinima: number;

  constructor(
    readonly nombre: string,
    readonly tiempo: Float64Array,
    readonly amplitudes: Float64Array,
    readonly frecuencia: number,
    readonly unidad = "V",
  ) {
    if (tiempo.length !== amplitudes.length) {
      throw new Error(`La señal "${nombre}" tiene ${tiempo.length} tiempos y ${amplitudes.length} amplitudes.`);
    }
    let maximo = -Infinity;
    let minimo = Infinity;
    for (let i = 0; i < amplitudes.length; i++) {
      const valor = amplitudes[i];
      if (valor > maximo) maximo = valor;
      if (valor < minimo) minimo = valor;
    }
    this.amplitudMaxima = amplitudes.length ? maximo : 0;
    this.amplitudMinima = amplitudes.length ? minimo : 0;
  }

  get cantidadMuestras(): number {
    return this.amplitudes.length;
  }

  /** Mayor valor absoluto observado. */
  get valorPico(): number {
    return Math.max(Math.abs(this.amplitudMaxima), Math.abs(this.amplitudMinima));
  }

  /** Valor eficaz calculado sobre las muestras. */
  get valorRMS(): number {
    if (!this.amplitudes.length) return 0;
    let suma = 0;
    for (let i = 0; i < this.amplitudes.length; i++) suma += this.amplitudes[i] * this.amplitudes[i];
    return Math.sqrt(suma / this.amplitudes.length);
  }

  /** Potencia media normalizada a 1 Ω. */
  get potenciaMedia(): number {
    const rms = this.valorRMS;
    return rms * rms;
  }

  muestra(indice: number): MuestraSenal {
    return new MuestraSenal(this.tiempo[indice], this.amplitudes[indice]);
  }

  contieneValoresInvalidos(): boolean {
    return !todosFinitos(this.amplitudes) || !todosFinitos(this.tiempo);
  }
}
