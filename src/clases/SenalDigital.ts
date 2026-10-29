import { configuracionMuestreo } from "@/configuracion/configuracionMuestreo";
import { limpiarSecuenciaBits } from "@/utilidades/validacionNumerica";

/**
 * Secuencia digital de información con su temporización.
 * El bit i ocupa el intervalo [i·T_b, (i+1)·T_b).
 */
export class SenalDigital {
  readonly bits: number[];

  constructor(
    bits: number[],
    readonly duracionBit: number,
    readonly tiempoInicial = 0,
  ) {
    this.bits = bits.map((b) => (b ? 1 : 0));
  }

  /** Crea la secuencia desde texto ("10110", "1 0 1 1 0"…). */
  static desdeTexto(texto: string, duracionBit: number): SenalDigital {
    const limpio = limpiarSecuenciaBits(texto);
    return new SenalDigital(
      Array.from(limpio, (c) => (c === "1" ? 1 : 0)),
      duracionBit,
    );
  }

  get cantidadBits(): number {
    return this.bits.length;
  }

  get tasaBits(): number {
    return 1 / this.duracionBit;
  }

  get tiempoTotal(): number {
    return this.cantidadBits * this.duracionBit;
  }

  /** Índice del bit que se transmite en el instante t (limitado a la secuencia). */
  indiceBitEn(t: number): number {
    return indiceIntervalo(t - this.tiempoInicial, this.duracionBit, this.cantidadBits);
  }

  bitEn(t: number): number {
    return this.bits[this.indiceBitEn(t)] ?? 0;
  }

  intervaloBit(indice: number): [number, number] {
    const inicio = this.tiempoInicial + indice * this.duracionBit;
    return [inicio, inicio + this.duracionBit];
  }

  /**
   * Agrupa los bits en símbolos de k bits (MSB primero). Si la cantidad de bits
   * no es múltiplo de k, se completan con ceros al final.
   */
  agruparEnSimbolos(bitsPorSimbolo: number): { grupos: number[][]; bitsRelleno: number } {
    const k = Math.max(1, Math.floor(bitsPorSimbolo));
    const resto = this.bits.length % k;
    const bitsRelleno = resto === 0 ? 0 : k - resto;
    const completos = [...this.bits, ...new Array<number>(bitsRelleno).fill(0)];
    const grupos: number[][] = [];
    for (let i = 0; i < completos.length; i += k) grupos.push(completos.slice(i, i + k));
    return { grupos, bitsRelleno };
  }

  comoTexto(): string {
    return this.bits.join("");
  }
}

/**
 * Índice del intervalo de duración `duracion` que contiene al instante t ≥ 0.
 * Se suma una tolerancia para que una muestra que cae justo en el límite
 * (por ejemplo 0.015 / 0.005 = 2.9999999999999996) pertenezca al intervalo siguiente.
 */
export function indiceIntervalo(t: number, duracion: number, cantidad: number): number {
  const indice = Math.floor(t / duracion + configuracionMuestreo.toleranciaLimiteSimbolo);
  return Math.min(Math.max(indice, 0), Math.max(cantidad - 1, 0));
}
