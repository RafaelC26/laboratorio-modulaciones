import {
  amplitudUnLado,
  frecuenciaDeIndice,
  gananciaCoherente,
  generarVentana,
  resolucionFrecuencial,
} from "@/formulas/formulasEspectro";
import type { AnalisisEspectral, ResultadoEspectro, TipoVentana } from "@/tipos/tiposGraficas";
import { esPotenciaDeDos } from "@/utilidades/validacionNumerica";

interface Complejos {
  re: Float64Array;
  im: Float64Array;
}

/**
 * Transformada de Fourier discreta exacta de N puntos:
 *  - N potencia de 2 → FFT radix-2 iterativa (Cooley-Tukey).
 *  - Cualquier otro N → algoritmo de Bluestein (chirp-z), que calcula la misma
 *    DFT de N puntos mediante convoluciones FFT. No se rellena con ceros, así
 *    que las frecuencias f_k = k·f_s/N son las de la señal original.
 */
export class MotorTransformadaFourier {
  /** FFT radix-2 en el lugar. `inversa` usa e^{+j…} y NO divide entre N. */
  static fftRadix2(re: Float64Array, im: Float64Array, inversa = false): void {
    const n = re.length;
    if (!esPotenciaDeDos(n)) throw new Error(`La FFT radix-2 requiere una longitud potencia de 2 (N = ${n}).`);
    if (n <= 1) return;

    // Reordenamiento por inversión de bits.
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        const tr = re[i];
        re[i] = re[j];
        re[j] = tr;
        const ti = im[i];
        im[i] = im[j];
        im[j] = ti;
      }
    }

    // Tabla de factores de giro calculados directamente (más precisos que por recurrencia).
    const mitadN = n >> 1;
    const tablaCos = new Float64Array(mitadN);
    const tablaSen = new Float64Array(mitadN);
    for (let k = 0; k < mitadN; k++) {
      const angulo = (2 * Math.PI * k) / n;
      tablaCos[k] = Math.cos(angulo);
      tablaSen[k] = Math.sin(angulo);
    }
    const signo = inversa ? 1 : -1;

    for (let tamano = 2; tamano <= n; tamano <<= 1) {
      const mitad = tamano >> 1;
      const paso = n / tamano;
      for (let inicio = 0; inicio < n; inicio += tamano) {
        for (let k = 0; k < mitad; k++) {
          const wr = tablaCos[k * paso];
          const wi = signo * tablaSen[k * paso];
          const a = inicio + k;
          const b = a + mitad;
          const tr = re[b] * wr - im[b] * wi;
          const ti = re[b] * wi + im[b] * wr;
          re[b] = re[a] - tr;
          im[b] = im[a] - ti;
          re[a] += tr;
          im[a] += ti;
        }
      }
    }
  }

  /** DFT exacta de N puntos para cualquier N. Devuelve arreglos nuevos. */
  static dft(entradaRe: Float64Array, entradaIm?: Float64Array): Complejos {
    const n = entradaRe.length;
    const re = Float64Array.from(entradaRe);
    const im = entradaIm ? Float64Array.from(entradaIm) : new Float64Array(n);
    if (n <= 1) return { re, im };
    if (esPotenciaDeDos(n)) {
      MotorTransformadaFourier.fftRadix2(re, im);
      return { re, im };
    }
    return MotorTransformadaFourier.bluestein(re, im);
  }

  /** Algoritmo de Bluestein: X[k] = w[k]·Σ (x[n]·w[n])·w*[k−n], con w[n] = e^{−jπn²/N}. */
  private static bluestein(xr: Float64Array, xi: Float64Array): Complejos {
    const n = xr.length;
    let m = 1;
    while (m < 2 * n - 1) m <<= 1;

    const chirpRe = new Float64Array(n);
    const chirpIm = new Float64Array(n);
    const periodo = 2 * n;
    for (let k = 0; k < n; k++) {
      // n² se reduce módulo 2N para conservar precisión en el argumento.
      const angulo = (Math.PI * ((k * k) % periodo)) / n;
      chirpRe[k] = Math.cos(angulo);
      chirpIm[k] = -Math.sin(angulo);
    }

    const aRe = new Float64Array(m);
    const aIm = new Float64Array(m);
    for (let k = 0; k < n; k++) {
      aRe[k] = xr[k] * chirpRe[k] - xi[k] * chirpIm[k];
      aIm[k] = xr[k] * chirpIm[k] + xi[k] * chirpRe[k];
    }

    const bRe = new Float64Array(m);
    const bIm = new Float64Array(m);
    bRe[0] = chirpRe[0];
    bIm[0] = -chirpIm[0];
    for (let k = 1; k < n; k++) {
      bRe[k] = bRe[m - k] = chirpRe[k];
      bIm[k] = bIm[m - k] = -chirpIm[k];
    }

    MotorTransformadaFourier.fftRadix2(aRe, aIm);
    MotorTransformadaFourier.fftRadix2(bRe, bIm);
    for (let k = 0; k < m; k++) {
      const r = aRe[k] * bRe[k] - aIm[k] * bIm[k];
      const i = aRe[k] * bIm[k] + aIm[k] * bRe[k];
      aRe[k] = r;
      aIm[k] = i;
    }
    MotorTransformadaFourier.fftRadix2(aRe, aIm, true);

    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let k = 0; k < n; k++) {
      const cr = aRe[k] / m;
      const ci = aIm[k] / m;
      re[k] = cr * chirpRe[k] - ci * chirpIm[k];
      im[k] = cr * chirpIm[k] + ci * chirpRe[k];
    }
    return { re, im };
  }

  /** DFT por definición, O(N²). Se usa como referencia en las pruebas. */
  static dftDirecta(x: Float64Array): Complejos {
    const n = x.length;
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let k = 0; k < n; k++) {
      let sumaRe = 0;
      let sumaIm = 0;
      for (let j = 0; j < n; j++) {
        const angulo = (-2 * Math.PI * ((k * j) % n)) / n;
        sumaRe += x[j] * Math.cos(angulo);
        sumaIm += x[j] * Math.sin(angulo);
      }
      re[k] = sumaRe;
      im[k] = sumaIm;
    }
    return { re, im };
  }

  /** Espectro de amplitud de un lado, normalizado para que un coseno de amplitud A mida A. */
  static espectroAmplitud(senal: Float64Array, frecuenciaMuestreo: number, tipoVentana: TipoVentana): ResultadoEspectro {
    const n = senal.length;
    const ventana = generarVentana(tipoVentana, n);
    const ganancia = gananciaCoherente(ventana);
    const ponderada = new Float64Array(n);
    for (let i = 0; i < n; i++) ponderada[i] = senal[i] * ventana[i];

    const { re, im } = MotorTransformadaFourier.dft(ponderada);
    const puntos = Math.floor(n / 2) + 1;
    const frecuencias = new Float64Array(puntos);
    const amplitudes = new Float64Array(puntos);
    for (let k = 0; k < puntos; k++) {
      frecuencias[k] = frecuenciaDeIndice(k, frecuenciaMuestreo, n);
      amplitudes[k] = amplitudUnLado(Math.hypot(re[k], im[k]), k, n, ganancia);
    }
    return {
      frecuencias,
      amplitudes,
      resolucion: resolucionFrecuencial(frecuenciaMuestreo, n),
      frecuenciaMuestreo,
      cantidadMuestras: n,
      ventana: tipoVentana,
    };
  }

  /**
   * Medidas sobre el espectro: pico, centroide y ancho de banda ocupado
   * (banda que contiene la fracción indicada de la potencia, excluyendo
   * colas iguales a cada lado).
   */
  static analizar(espectro: ResultadoEspectro, fraccionPotencia = 0.99): AnalisisEspectral {
    const { frecuencias, amplitudes } = espectro;
    let total = 0;
    let momento = 0;
    let indicePico = 0;
    for (let k = 0; k < amplitudes.length; k++) {
      const potencia = amplitudes[k] * amplitudes[k];
      total += potencia;
      momento += potencia * frecuencias[k];
      if (amplitudes[k] > amplitudes[indicePico]) indicePico = k;
    }
    const cola = ((1 - fraccionPotencia) / 2) * total;
    let acumulado = 0;
    let limiteInferior = frecuencias[0] ?? 0;
    let limiteSuperior = frecuencias[frecuencias.length - 1] ?? 0;
    let inferiorEncontrado = false;
    for (let k = 0; k < amplitudes.length; k++) {
      acumulado += amplitudes[k] * amplitudes[k];
      if (!inferiorEncontrado && acumulado >= cola) {
        limiteInferior = frecuencias[k];
        inferiorEncontrado = true;
      }
      if (acumulado >= total - cola) {
        limiteSuperior = frecuencias[k];
        break;
      }
    }
    return {
      frecuenciaPico: frecuencias[indicePico] ?? 0,
      amplitudPico: amplitudes[indicePico] ?? 0,
      frecuenciaCentroide: total > 0 ? momento / total : 0,
      anchoBandaOcupado: Math.max(0, limiteSuperior - limiteInferior),
      limiteInferior,
      limiteSuperior,
      fraccionPotencia,
    };
  }
}
