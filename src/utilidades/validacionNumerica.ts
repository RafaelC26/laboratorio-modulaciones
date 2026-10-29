/**
 * Comprobaciones numéricas básicas reutilizadas por la validación de parámetros
 * y por el motor matemático para verificar los resultados.
 */

export function esNumeroFinito(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

export function esPositivo(valor: unknown): valor is number {
  return esNumeroFinito(valor) && valor > 0;
}

export function esNoNegativo(valor: unknown): valor is number {
  return esNumeroFinito(valor) && valor >= 0;
}

export function estaEnRango(valor: number, minimo: number, maximo: number): boolean {
  return esNumeroFinito(valor) && valor >= minimo && valor <= maximo;
}

export function esPotenciaDeDos(valor: number): boolean {
  return Number.isInteger(valor) && valor > 0 && (valor & (valor - 1)) === 0;
}

export function esEnteroAproximado(valor: number, tolerancia = 1e-9): boolean {
  return Math.abs(valor - Math.round(valor)) <= tolerancia * Math.max(1, Math.abs(valor));
}

/** Elimina espacios, guiones bajos y separadores para dejar solo los símbolos escritos. */
export function limpiarSecuenciaBits(texto: string): string {
  return texto.replace(/[\s,_-]+/g, "");
}

export function contieneSoloBits(texto: string): boolean {
  return /^[01]+$/.test(limpiarSecuenciaBits(texto));
}

/** Devuelve true si todas las muestras del arreglo son números finitos (sin NaN ni ±∞). */
export function todosFinitos(valores: ArrayLike<number>): boolean {
  for (let i = 0; i < valores.length; i++) {
    if (!Number.isFinite(valores[i])) return false;
  }
  return true;
}

/** Convierte texto escrito por el usuario en número; acepta coma decimal. */
export function interpretarNumero(texto: string): number | null {
  const normalizado = texto.trim().replace(",", ".");
  if (normalizado === "" || normalizado === "-" || normalizado === ".") return null;
  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : null;
}
