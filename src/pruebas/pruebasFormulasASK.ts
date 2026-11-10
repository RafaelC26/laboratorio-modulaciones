import { describe, expect, it } from "vitest";
import { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { SenalDigital } from "@/clases/SenalDigital";
import {
  amplitudSimboloASK,
  anchoBandaASK,
  anchoLobuloPrincipalASK,
  energiaBitASK,
  esOOK,
  senalModuladaASK,
  velocidadTransmisionASK,
} from "@/formulas/formulasASK";
import { anchoBandaPSK } from "@/formulas/formulasPSK";
import { MotorModulacionASK } from "@/motores/MotorModulacionASK";
import { MotorMuestreo } from "@/motores/MotorMuestreo";
import type { EntradaASK } from "@/tipos/tiposModulacion";

const ook = { amplitudBit1: 1, amplitudBit0: 0, frecuenciaPortadora: 1000, faseInicial: 0 };

describe("Fórmulas ASK (Tema 6, p. 49–51)", () => {
  it("elige A_1 para el bit 1 y A_0 para el bit 0", () => {
    const v = { ...ook, amplitudBit0: 0.25 };
    expect(amplitudSimboloASK(1, v)).toBe(1);
    expect(amplitudSimboloASK(0, v)).toBe(0.25);
  });

  it("con A_1 = V_p y A_0 = 0: v(t) = V_p sen(2π f_p t) para un 1 y 0 para un 0", () => {
    expect(esOOK(ook)).toBe(true);
    for (const t of [0, 1e-4, 3.3e-4]) {
      expect(senalModuladaASK(t, 0, ook)).toBeCloseTo(0, 15);
      expect(senalModuladaASK(t, 1, ook)).toBeCloseTo(Math.sin(2 * Math.PI * 1000 * t), 12);
    }
    expect(senalModuladaASK(0, 1, ook)).toBe(0);
    expect(senalModuladaASK(1 / 4000, 1, ook)).toBeCloseTo(1, 12);
  });

  it("asigna correctamente cada instante a su bit, incluso en los límites", () => {
    const digital = SenalDigital.desdeTexto("1 0 1 1 0", 0.005);
    expect(digital.bits).toEqual([1, 0, 1, 1, 0]);
    expect(digital.tiempoTotal).toBeCloseTo(0.025, 15);
    expect(digital.indiceBitEn(0)).toBe(0);
    expect(digital.indiceBitEn(0.0049999)).toBe(0);
    // 0.015 / 0.005 = 2.9999999999999996 en coma flotante: debe pertenecer al bit 3.
    expect(digital.indiceBitEn(0.015)).toBe(3);
    expect(digital.indiceBitEn(0.03)).toBe(4); // fuera de rango se limita al último bit
  });

  it("agrupa bits en símbolos y completa con ceros", () => {
    const { grupos, bitsRelleno } = SenalDigital.desdeTexto("10110", 1).agruparEnSimbolos(2);
    expect(grupos).toEqual([[1, 0], [1, 1], [0, 0]]);
    expect(bitsRelleno).toBe(1);
  });

  it("calcula velocidad de transmisión, ancho de banda y energía por bit", () => {
    expect(velocidadTransmisionASK(0.005)).toBeCloseTo(200, 10);
    expect(anchoBandaASK(0.005)).toBeCloseTo(200, 10);
    expect(anchoLobuloPrincipalASK(0.005)).toBeCloseTo(400, 10);
    expect(energiaBitASK(2, 0.01)).toBeCloseTo(0.02, 15);
  });

  it("con el mismo T_bit, ASK y 2PSK tienen el mismo ancho de banda BW = 1/T_bit", () => {
    for (const tBit of [0.001, 0.002, 0.005]) {
      expect(anchoBandaASK(tBit)).toBeCloseTo(anchoBandaPSK(tBit), 10);
    }
  });

  it("el motor genera la señal muestra a muestra según la secuencia 10110", () => {
    const entrada: EntradaASK = {
      tipo: "ASK",
      secuenciaBits: "10110",
      amplitudBit1: 1,
      amplitudBit0: 0,
      frecuenciaPortadora: 1000,
      duracionBit: 0.005,
      faseInicial: 0,
      temporal: { tiempoInicial: 0, tiempoFinal: 1, frecuenciaMuestreo: 100_000 },
    };
    const parametros = ParametrosModulacion.desdeEntrada(entrada);
    const motor = new MotorModulacionASK();
    const { inicio, fin } = motor.intervaloTemporal(parametros, entrada.temporal);
    expect(fin - inicio).toBeCloseTo(0.025, 15);
    const tiempo = MotorMuestreo.vectorTiempo(inicio, fin, entrada.temporal.frecuenciaMuestreo);
    const datos = motor.calcular(parametros, tiempo);
    expect(datos.modulada.cantidadMuestras).toBe(2500);
    // La moduladora toma los valores 1 y 0 (p. 49).
    expect(datos.moduladora.amplitudes[0]).toBe(1);
    expect(datos.moduladora.amplitudes[500]).toBe(0);
    // Durante el segundo bit (0) la señal es nula.
    for (let n = 500; n < 1000; n++) expect(Math.abs(datos.modulada.amplitudes[n])).toBe(0);
    // Durante el primer bit (1) coincide con la portadora.
    for (let n = 0; n < 500; n += 37) expect(datos.modulada.amplitudes[n]).toBeCloseTo(datos.portadora.amplitudes[n], 12);
    expect(datos.constelacion.map((p) => p.repeticiones)).toEqual([2, 3]);
    expect(datos.metricas.find((m) => m.clave === "anchoBanda")?.valor).toBeCloseTo(200, 10);
    expect(datos.metricas.find((m) => m.clave === "lobuloPrincipal")?.valor).toBeCloseTo(400, 10);
    expect(datos.resumen.anchoBandaEstimado).toBeCloseTo(200, 10);
  });
});
