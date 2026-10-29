/**
 * Una muestra individual de una señal: instante, valor y, cuando corresponde,
 * la fase y el símbolo digital que la generan.
 */
export class MuestraSenal {
  constructor(
    readonly tiempo: number,
    readonly amplitud: number,
    readonly fase: number | null = null,
    readonly simbolo: number | null = null,
  ) {}

  esValida(): boolean {
    return Number.isFinite(this.tiempo) && Number.isFinite(this.amplitud);
  }
}
