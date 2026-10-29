import { describe, expect, it } from "vitest";
import { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { valoresPredeterminados } from "@/configuracion/configuracionGeneral";
import { senalPortadora } from "@/formulas/formulasPortadora";
import { besselJ } from "@/formulas/formulasPSM";
import { motorMatematico } from "@/motores/MotorMatematico";
import { MotorTransformadaFourier } from "@/motores/MotorTransformadaFourier";
import { MotorMuestreo } from "@/motores/MotorMuestreo";
import { ServicioSimulacion } from "@/servicios/ServicioSimulacion";
import { ServicioValidacion } from "@/servicios/ServicioValidacion";
import type { TipoModulacion } from "@/tipos/tiposModulacion";

const servicio = new ServicioSimulacion();
const validacion = new ServicioValidacion();

/** Amplitud del espectro en la frecuencia f (punto más cercano). */
function amplitudEn(frecuencias: Float64Array, amplitudes: Float64Array, f: number): number {
  let mejor = 0;
  for (let k = 1; k < frecuencias.length; k++) {
    if (Math.abs(frecuencias[k] - f) < Math.abs(frecuencias[mejor] - f)) mejor = k;
  }
  return amplitudes[mejor];
}

describe("Prueba de precisión de la portadora (sección 23.4)", () => {
  it("c(0) = A_c", () => {
    expect(senalPortadora(0, { amplitudPortadora: 3.7, frecuenciaPortadora: 1234, faseInicial: 0 })).toBe(3.7);
  });

  it("c(T/4) = 0 y c(T/2) = −A_c", () => {
    const v = { amplitudPortadora: 2, frecuenciaPortadora: 500, faseInicial: 0 };
    expect(senalPortadora(1 / 2000, v)).toBeCloseTo(0, 12);
    expect(senalPortadora(1 / 1000, v)).toBeCloseTo(-2, 12);
  });
});

describe("Motor matemático", () => {
  it.each<TipoModulacion>(["AM", "ASK", "PSK", "PSM"])("simula %s con los valores predeterminados sin NaN ni infinitos", (tipo) => {
    const operacion = servicio.simular(valoresPredeterminados[tipo]);
    expect(operacion.exito).toBe(true);
    if (!operacion.exito) return;
    const r = operacion.resultado;
    expect(r.tipo).toBe(tipo);
    expect(r.senalModulada.contieneValoresInvalidos()).toBe(false);
    expect(r.senalModuladora.cantidadMuestras).toBe(r.senalModulada.cantidadMuestras);
    expect(r.ecuacion.length).toBeGreaterThan(10);
  });

  it("rechaza parámetros inválidos con mensajes por campo", () => {
    const { errores } = validacion.validar({ ...valoresPredeterminados.AM, frecuenciaPortadora: -10 });
    expect(errores.some((e) => e.campo === "frecuenciaPortadora")).toBe(true);
    const sinBits = validacion.validar({ ...valoresPredeterminados.ASK, secuenciaBits: "" });
    expect(sinBits.errores.some((e) => e.campo === "secuenciaBits")).toBe(true);
    const intervalo = validacion.validar({ ...valoresPredeterminados.AM, temporal: { tiempoInicial: 1, tiempoFinal: 0.5, frecuenciaMuestreo: 1000 } });
    expect(intervalo.errores.some((e) => e.campo === "temporal.tiempoFinal")).toBe(true);
  });

  it("rechaza un muestreo por debajo de Nyquist y avisa por debajo de 10·f_max", () => {
    const nyquist = validacion.validar({ ...valoresPredeterminados.AM, temporal: { tiempoInicial: 0, tiempoFinal: 0.5, frecuenciaMuestreo: 2000 } });
    expect(nyquist.errores.some((e) => e.campo === "temporal.frecuenciaMuestreo")).toBe(true);
    const bajo = validacion.validar({ ...valoresPredeterminados.AM, temporal: { tiempoInicial: 0, tiempoFinal: 0.05, frecuenciaMuestreo: 5000 } });
    expect(bajo.errores).toHaveLength(0);
    expect(bajo.advertencias.some((e) => e.campo === "temporal.frecuenciaMuestreo")).toBe(true);
  });

  it("rechaza simulaciones que superan el máximo de muestras", () => {
    const { errores } = validacion.validar({ ...valoresPredeterminados.AM, temporal: { tiempoInicial: 0, tiempoFinal: 10, frecuenciaMuestreo: 1e6 } });
    expect(errores.some((e) => e.mensaje.includes("muestras"))).toBe(true);
  });

  it("marca las zonas de sobremodulación cuando μ > 1", () => {
    const operacion = servicio.simular({ ...valoresPredeterminados.AM, amplitudModuladora: 1.5 });
    expect(operacion.exito).toBe(true);
    if (!operacion.exito) return;
    expect(operacion.resultado.regionesSobremodulacion.length).toBeGreaterThan(0);
    expect(operacion.advertencias.some((a) => a.mensaje.includes("Sobremodulación"))).toBe(true);
  });

  it("calcula el intervalo digital a partir de la secuencia", () => {
    const parametros = ParametrosModulacion.desdeEntrada({ ...valoresPredeterminados.PSK, ordenModulacion: 8 });
    const configuracion = motorMatematico.configuracionPara(parametros, valoresPredeterminados.PSK.temporal);
    expect(configuracion.tiempoFinal).toBeCloseTo(4 * 0.002, 15); // 12 bits / 3 = 4 símbolos
  });
});

describe("Transformada de Fourier", () => {
  it("Bluestein coincide con la DFT directa para N no potencia de 2", () => {
    const n = 30;
    const x = Float64Array.from({ length: n }, (_, i) => Math.sin(0.7 * i) + 0.3 * Math.cos(2.1 * i + 0.4) + (i % 3) * 0.1);
    const rapida = MotorTransformadaFourier.dft(x);
    const directa = MotorTransformadaFourier.dftDirecta(x);
    for (let k = 0; k < n; k++) {
      expect(rapida.re[k]).toBeCloseTo(directa.re[k], 9);
      expect(rapida.im[k]).toBeCloseTo(directa.im[k], 9);
    }
  });

  it("la FFT radix-2 coincide con la DFT directa", () => {
    const x = Float64Array.from({ length: 64 }, (_, i) => Math.cos((2 * Math.PI * 5 * i) / 64) + 0.5);
    const rapida = MotorTransformadaFourier.dft(x);
    const directa = MotorTransformadaFourier.dftDirecta(x);
    for (let k = 0; k < 64; k++) expect(rapida.re[k]).toBeCloseTo(directa.re[k], 9);
  });

  it("un coseno de amplitud A aparece con altura A en f (normalización de un lado)", () => {
    const fs = 10_000;
    const tiempo = MotorMuestreo.vectorTiempo(0, 0.1, fs); // N = 1000, Δf = 10 Hz
    const senal = MotorMuestreo.evaluar(tiempo, (t) => 2.5 * Math.cos(2 * Math.PI * 440 * t) + 0.75);
    for (const ventana of ["rectangular", "hann", "blackman"] as const) {
      const espectro = MotorTransformadaFourier.espectroAmplitud(senal, fs, ventana);
      expect(espectro.resolucion).toBeCloseTo(10, 12);
      expect(amplitudEn(espectro.frecuencias, espectro.amplitudes, 440)).toBeCloseTo(2.5, 6);
      expect(espectro.amplitudes[0]).toBeCloseTo(0.75, 6);
    }
  });

  it("cumple el teorema de Parseval", () => {
    const x = Float64Array.from({ length: 200 }, (_, i) => Math.sin(i * 0.37) * Math.exp(-i / 90));
    const { re, im } = MotorTransformadaFourier.dft(x);
    const energiaTiempo = x.reduce((s, v) => s + v * v, 0);
    let energiaFrecuencia = 0;
    for (let k = 0; k < x.length; k++) energiaFrecuencia += re[k] * re[k] + im[k] * im[k];
    expect(energiaFrecuencia / x.length).toBeCloseTo(energiaTiempo, 9);
  });

  it("el espectro AM muestra la portadora A_c y bandas laterales μA_c/2 en f_c ± f_m", () => {
    const operacion = servicio.simular(valoresPredeterminados.AM); // A_c = 1, μ = 0.5, f_c = 1 kHz, f_m = 100 Hz
    expect(operacion.exito).toBe(true);
    if (!operacion.exito) return;
    const r = operacion.resultado;
    const espectro = MotorTransformadaFourier.espectroAmplitud(r.senalModulada.amplitudes, r.frecuenciaMuestreo, "rectangular");
    expect(amplitudEn(espectro.frecuencias, espectro.amplitudes, 1000)).toBeCloseTo(1, 6);
    expect(amplitudEn(espectro.frecuencias, espectro.amplitudes, 900)).toBeCloseTo(0.25, 6);
    expect(amplitudEn(espectro.frecuencias, espectro.amplitudes, 1100)).toBeCloseTo(0.25, 6);
    for (const componente of r.componentesTeoricos) {
      expect(amplitudEn(espectro.frecuencias, espectro.amplitudes, componente.frecuencia)).toBeCloseTo(componente.amplitud, 6);
    }
  });

  it("el espectro PSM coincide con las amplitudes de Bessel A_c|J_n(β)|", () => {
    const operacion = servicio.simular(valoresPredeterminados.PSM); // β = 2
    expect(operacion.exito).toBe(true);
    if (!operacion.exito) return;
    const r = operacion.resultado;
    const espectro = MotorTransformadaFourier.espectroAmplitud(r.senalModulada.amplitudes, r.frecuenciaMuestreo, "rectangular");
    for (const componente of r.componentesTeoricos) {
      expect(amplitudEn(espectro.frecuencias, espectro.amplitudes, componente.frecuencia)).toBeCloseTo(componente.amplitud, 5);
    }
  });
});

describe("Exportación", () => {
  it("genera un CSV con una fila por muestra y un reporte con la ecuación", async () => {
    const { servicioExportacion } = await import("@/servicios/ServicioExportacion");
    const operacion = servicio.simular(valoresPredeterminados.PSK);
    expect(operacion.exito).toBe(true);
    if (!operacion.exito) return;
    const lineas = servicioExportacion.generarCSV(operacion.resultado).split("\n");
    expect(lineas).toHaveLength(operacion.resultado.cantidadMuestras + 1);
    expect(lineas[0]).toContain("t [s]");
    expect(lineas[1].split(",")).toHaveLength(5); // t, b(t), c(t), s(t), fase
    const reporte = servicioExportacion.generarReporte(operacion.resultado);
    expect(reporte).toContain(operacion.resultado.ecuacion);
    expect(JSON.parse(servicioExportacion.generarJSON(operacion.resultado)).tecnica).toBe("PSK");
  });
});

describe("Funciones de Bessel", () => {
  it("coinciden con valores tabulados", () => {
    expect(besselJ(0, 1)).toBeCloseTo(0.7651976865579666, 12);
    expect(besselJ(1, 1)).toBeCloseTo(0.4400505857449335, 12);
    expect(besselJ(2, 5)).toBeCloseTo(0.04656511627775222, 10);
    expect(Math.abs(besselJ(0, 2.404825557695773))).toBeLessThan(1e-10); // primer cero de J0
    expect(besselJ(-3, 2)).toBeCloseTo(-besselJ(3, 2), 14);
  });
});
