/**
 * FÓRMULAS DEL ANÁLISIS ESPECTRAL
 * ------------------------------------------------------------------
 * X[k]  = Σ_{n=0}^{N−1} x[n]·w[n]·e^{−j2πkn/N}
 * f_k   = k·f_s / N
 * Δf    = f_s / N
 * A_k   = c_k·|X[k]| / (N·G_c),  c_k = 1 en k = 0 y k = N/2, c_k = 2 en el resto
 *         G_c = (1/N)·Σ w[n]  (ganancia coherente de la ventana)
 *
 * Con esta normalización, un coseno de amplitud A que cae exactamente en un
 * punto de la FFT aparece con altura A en el espectro de un lado.
 */
import type { DefinicionFormula } from "@/tipos/tiposFormulas";
import type { TipoVentana } from "@/tipos/tiposGraficas";

/** Ventanas en su forma periódica (adecuada para la DFT). */
export function valorVentana(tipo: TipoVentana, n: number, total: number): number {
  const angulo = (2 * Math.PI * n) / total;
  switch (tipo) {
    case "rectangular":
      return 1;
    case "hann":
      return 0.5 - 0.5 * Math.cos(angulo);
    case "hamming":
      return 0.54 - 0.46 * Math.cos(angulo);
    case "blackman":
      return 0.42 - 0.5 * Math.cos(angulo) + 0.08 * Math.cos(2 * angulo);
  }
}

export function generarVentana(tipo: TipoVentana, total: number): Float64Array {
  const ventana = new Float64Array(total);
  for (let n = 0; n < total; n++) ventana[n] = valorVentana(tipo, n, total);
  return ventana;
}

/** G_c = (1/N) Σ w[n] */
export function gananciaCoherente(ventana: Float64Array): number {
  let suma = 0;
  for (let n = 0; n < ventana.length; n++) suma += ventana[n];
  return ventana.length ? suma / ventana.length : 1;
}

/** f_k = k·f_s / N */
export function frecuenciaDeIndice(indice: number, frecuenciaMuestreo: number, total: number): number {
  return (indice * frecuenciaMuestreo) / total;
}

/** Δf = f_s / N */
export function resolucionFrecuencial(frecuenciaMuestreo: number, total: number): number {
  return frecuenciaMuestreo / total;
}

/** Amplitud de pico en el espectro de un lado a partir de |X[k]|. */
export function amplitudUnLado(magnitud: number, indice: number, total: number, ganancia: number): number {
  const esExtremo = indice === 0 || (total % 2 === 0 && indice === total / 2);
  return ((esExtremo ? 1 : 2) * magnitud) / (total * ganancia);
}

export const formulasEspectro: DefinicionFormula[] = [
  {
    identificador: "espectro-dft",
    nombre: "Transformada discreta de Fourier",
    ecuacion: String.raw`X[k]=\sum_{n=0}^{N-1}x[n]\,w[n]\,e^{-j2\pi kn/N}`,
    variables: [],
    descripcion: "Se calcula con FFT radix-2 (o Bluestein si N no es potencia de 2) sin rellenar con ceros.",
    unidad: "V",
    version: "1.0.0",
  },
  {
    identificador: "espectro-frecuencias",
    nombre: "Frecuencia de cada punto",
    ecuacion: String.raw`f_k=\frac{k\,f_s}{N},\qquad \Delta f=\frac{f_s}{N}`,
    variables: [],
    descripcion: "Resolución frecuencial del análisis.",
    unidad: "Hz",
    version: "1.0.0",
  },
  {
    identificador: "espectro-amplitud",
    nombre: "Normalización (espectro de un lado)",
    ecuacion: String.raw`A_k=\frac{2\,|X[k]|}{N\,G_c},\qquad G_c=\frac{1}{N}\sum_{n}w[n]`,
    variables: [],
    descripcion: "Un coseno de amplitud A aparece con altura A (para k ≠ 0, N/2).",
    unidad: "V",
    version: "1.0.0",
  },
];
