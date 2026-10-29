import { describe, expect, it } from "vitest";
import { ConfiguracionSenal, calcularCantidadMuestras } from "@/clases/ConfiguracionSenal";
import { configuracionMuestreo } from "@/configuracion/configuracionMuestreo";
import { MotorMuestreo, redondearValorAgradable } from "@/motores/MotorMuestreo";

describe("Motor de muestreo", () => {
  it("Δt = 1/f_s y t_n = t_0 + n·Δt", () => {
    const configuracion = new ConfiguracionSenal(1, 1000, 0, 50_000, 0, 0.01);
    expect(configuracion.intervaloMuestreo).toBeCloseTo(2e-5, 18);
    const tiempo = MotorMuestreo.generarVectorTiempo(configuracion);
    expect(tiempo.length).toBe(500);
    expect(tiempo[0]).toBe(0);
    expect(tiempo[1]).toBeCloseTo(2e-5, 18);
    expect(tiempo[499]).toBeCloseTo(499 * 2e-5, 15);
  });

  it("no acumula error de redondeo en vectores largos", () => {
    const tiempo = MotorMuestreo.vectorTiempo(0, 1, 300_000);
    expect(tiempo.length).toBe(300_000);
    expect(Math.abs(tiempo[299_999] - 299_999 / 300_000)).toBeLessThan(1e-15);
  });

  it("respeta el tiempo inicial", () => {
    const tiempo = MotorMuestreo.vectorTiempo(0.5, 0.6, 1000);
    expect(tiempo.length).toBe(100);
    expect(tiempo[0]).toBe(0.5);
    expect(tiempo[10]).toBeCloseTo(0.51, 15);
  });

  it("calcula N = round((t_f − t_0)·f_s) sin errores por coma flotante", () => {
    expect(calcularCantidadMuestras(0, 0.02, 100_000)).toBe(2000);
    expect(calcularCantidadMuestras(0, 0.3, 10)).toBe(3); // 0.3·10 = 2.9999999999999996
    expect(calcularCantidadMuestras(1, 0, 10)).toBe(0);
  });

  it("valida la configuración", () => {
    expect(new ConfiguracionSenal(1, 1000, 0, 1000, 0, 1).validar()).toEqual([]);
    expect(new ConfiguracionSenal(1, -5, 0, 1000, 1, 0).validar()).toHaveLength(2);
    expect(new ConfiguracionSenal(Number.NaN, 1000, 0, 0, 0, 1).validar()).toHaveLength(2);
  });

  it("recomienda f_s en la serie 1-2-5 sin superar el máximo de muestras", () => {
    expect(redondearValorAgradable(1234)).toBe(2000);
    expect(redondearValorAgradable(4000)).toBe(5000);
    expect(redondearValorAgradable(10_000)).toBe(10_000);
    expect(MotorMuestreo.frecuenciaMuestreoRecomendada(1100, 0.02)).toBe(100_000);
    const limitada = MotorMuestreo.frecuenciaMuestreoRecomendada(1e6, 1);
    expect(limitada).toBeGreaterThanOrEqual(configuracionMuestreo.factorRecomendado * 1e6);
  });
});
