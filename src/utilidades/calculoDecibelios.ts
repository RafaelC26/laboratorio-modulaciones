/**
 * Conversiones a decibelios. Se usa un piso para evitar log10(0) = -∞.
 */

export const PISO_DECIBELIOS = -160;

/** 20·log10(A / Aref): para amplitudes (V). */
export function amplitudADecibelios(amplitud: number, referencia = 1, piso = PISO_DECIBELIOS): number {
  const relacion = Math.abs(amplitud) / referencia;
  if (relacion <= 0 || !Number.isFinite(relacion)) return piso;
  return Math.max(20 * Math.log10(relacion), piso);
}

/** 10·log10(P / Pref): para potencias (W). */
export function potenciaADecibelios(potencia: number, referencia = 1, piso = PISO_DECIBELIOS): number {
  const relacion = potencia / referencia;
  if (relacion <= 0 || !Number.isFinite(relacion)) return piso;
  return Math.max(10 * Math.log10(relacion), piso);
}

export function decibeliosAAmplitud(decibelios: number, referencia = 1): number {
  return referencia * Math.pow(10, decibelios / 20);
}

export function decibeliosAPotencia(decibelios: number, referencia = 1): number {
  return referencia * Math.pow(10, decibelios / 10);
}
