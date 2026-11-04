import { describe, expect, it } from "vitest";
import { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { valoresPredeterminados } from "@/configuracion/configuracionGeneral";
import {
  anchoBandaPSK,
  binarioAGray,
  bitsDeEstadoPSK,
  distanciaMinimaPSK,
  eficienciaEspectralPSK,
  faseSimboloPSK,
  grayABinario,
  indiceEstadoPSK,
  moduladoraBinariaPSK,
  nivelSimboloPSK,
  nombreVariantePSK,
  senalModuladaPSK,
  separacionFasePSK,
  velocidadTransmisionPSK,
} from "@/formulas/formulasPSK";
import { MotorConstelacion } from "@/motores/MotorConstelacion";
import { MotorModulacionPSK } from "@/motores/MotorModulacionPSK";
import { MotorMuestreo } from "@/motores/MotorMuestreo";
import type { EntradaPSK } from "@/tipos/tiposModulacion";

const entradaBase: EntradaPSK = {
  tipo: "PSK",
  secuenciaBits: "101101001001",
  ordenModulacion: 2,
  amplitudPortadora: 1,
  frecuenciaPortadora: 1000,
  duracionSimbolo: 0.002,
  faseInicial: 0,
  mapeoSimbolos: "apuntes",
  temporal: { tiempoInicial: 0, tiempoFinal: 1, frecuenciaMuestreo: 100_000 },
};

function simular(entrada: EntradaPSK) {
  const parametros = ParametrosModulacion.desdeEntrada(entrada);
  const motor = new MotorModulacionPSK();
  const { inicio, fin } = motor.intervaloTemporal(parametros, entrada.temporal);
  return { fin, datos: motor.calcular(parametros, MotorMuestreo.vectorTiempo(inicio, fin, entrada.temporal.frecuenciaMuestreo)) };
}

describe("2PSK (Tema 6, p. 54–55)", () => {
  it("usa las fases 0 y π", () => {
    expect(faseSimboloPSK(0, 2, 0)).toBe(0);
    expect(faseSimboloPSK(1, 2, 0)).toBeCloseTo(Math.PI, 15);
  });

  it("asigna 1 → fase 0 y 0 → fase π", () => {
    expect(indiceEstadoPSK([1], "apuntes")).toBe(0);
    expect(indiceEstadoPSK([0], "apuntes")).toBe(1);
    expect(moduladoraBinariaPSK(indiceEstadoPSK([1], "apuntes"))).toBe(1);
    expect(moduladoraBinariaPSK(indiceEstadoPSK([0], "apuntes"))).toBe(-1);
  });

  it("un 1 da V_p cos(2π f_p t) y un 0 da −V_p cos(2π f_p t) = V_p cos(2π f_p t + π)", () => {
    const v = { amplitudPortadora: 1.5, frecuenciaPortadora: 1000 };
    for (const t of [0, 1.7e-4, 9.1e-4]) {
      const portadora = 1.5 * Math.cos(2 * Math.PI * 1000 * t);
      expect(senalModuladaPSK(t, faseSimboloPSK(indiceEstadoPSK([1], "apuntes"), 2, 0), v)).toBeCloseTo(portadora, 12);
      expect(senalModuladaPSK(t, faseSimboloPSK(indiceEstadoPSK([0], "apuntes"), 2, 0), v)).toBeCloseTo(-portadora, 12);
    }
  });

  it("el motor cumple v(t) = v_p(t)·v_m(t), con v_m = 1 para un 1 y −1 para un 0", () => {
    const { datos } = simular(entradaBase);
    // Secuencia 1 0 1 1 …: cada bit dura 200 muestras.
    expect(datos.moduladora.amplitudes[0]).toBe(1);
    expect(datos.moduladora.amplitudes[200]).toBe(-1);
    expect(datos.moduladora.amplitudes[400]).toBe(1);
    expect(datos.modulada.amplitudes[0]).toBeCloseTo(1, 12);
    for (let n = 0; n < datos.modulada.cantidadMuestras; n += 53) {
      expect(datos.modulada.amplitudes[n]).toBeCloseTo(datos.portadora.amplitudes[n] * datos.moduladora.amplitudes[n], 10);
    }
  });
});

describe("MPSK (Tema 6, p. 55–58)", () => {
  it("separa las fases θ = 2π/N: 4PSK usa 0°, 90°, 180° y 270°", () => {
    expect(separacionFasePSK(4)).toBeCloseTo(Math.PI / 2, 15);
    const fases = [0, 1, 2, 3].map((i) => faseSimboloPSK(i, 4, 0));
    expect(fases[1]).toBeCloseTo(Math.PI / 2, 15);
    expect(fases[2]).toBeCloseTo(Math.PI, 15);
    expect(fases[3]).toBeCloseTo((3 * Math.PI) / 2, 15);
  });

  it("usa el mapeo del Tema 6: 10 → 0°, 01 → 90°, 11 → 180°, 00 → 270°", () => {
    expect(indiceEstadoPSK([1, 0], "apuntes")).toBe(0);
    expect(indiceEstadoPSK([0, 1], "apuntes")).toBe(1);
    expect(indiceEstadoPSK([1, 1], "apuntes")).toBe(2);
    expect(indiceEstadoPSK([0, 0], "apuntes")).toBe(3);
  });

  it("asigna los niveles 00 → 0, 01 → 1, 10 → 2, 11 → 3 a la señal multinivel", () => {
    expect([[0, 0], [0, 1], [1, 0], [1, 1]].map(nivelSimboloPSK)).toEqual([0, 1, 2, 3]);
  });

  it("calcula V_t = (1/T) log₂ N", () => {
    expect(velocidadTransmisionPSK(2, 0.002)).toBeCloseTo(500, 10);
    expect(velocidadTransmisionPSK(4, 0.002)).toBeCloseTo(1000, 10);
  });

  it("calcula BW = 1/T: BW_dibit = 1/(2 T_bit) = BW_bit/2", () => {
    const tBit = 0.001;
    expect(anchoBandaPSK(tBit)).toBeCloseTo(1000, 10);
    expect(anchoBandaPSK(2 * tBit)).toBeCloseTo(anchoBandaPSK(tBit) / 2, 10);
    expect(eficienciaEspectralPSK(4)).toBe(2);
  });

  it("nombra las variantes como el Tema 6", () => {
    expect(nombreVariantePSK(2)).toBe("2PSK (BPSK)");
    expect(nombreVariantePSK(4)).toBe("4PSK (QPSK)");
    expect(nombreVariantePSK(8)).toBe("8PSK");
  });

  it("el motor 4PSK reproduce el ejemplo 10 | 11 | 01 | 00 | 10 | 01 del Tema 6", () => {
    expect(valoresPredeterminados.PSK.secuenciaBits).toBe(entradaBase.secuenciaBits);
    expect(valoresPredeterminados.PSK.mapeoSimbolos).toBe("apuntes");
    const { fin, datos } = simular({ ...entradaBase, ordenModulacion: 4 });
    expect(fin).toBeCloseTo(6 * 0.002, 15); // 12 bits / 2 = 6 símbolos
    expect(datos.intervalosSimbolo.map((s) => s.etiqueta)).toEqual(["10", "11", "01", "00", "10", "01"]);
    // Niveles de la p. 56: 2, 3, 1, 0, 2, 1 (cada símbolo dura 200 muestras).
    expect([0, 200, 400, 600, 800, 1000].map((n) => datos.moduladora.amplitudes[n])).toEqual([2, 3, 1, 0, 2, 1]);
    // Primer símbolo 10 → 0°: v(0) = V_p.
    expect(datos.modulada.amplitudes[0]).toBeCloseTo(1, 12);
    expect(datos.modulada.amplitudMaxima).toBeLessThanOrEqual(1 + 1e-12);
    expect(datos.metricas.find((m) => m.clave === "bitsRelleno")?.valor).toBe(0);
    expect(datos.metricas.find((m) => m.clave === "anchoBanda")?.valor).toBeCloseTo(500, 10);
  });
});

describe("Mapeos adicionales y constelación (complementos)", () => {
  it("el código Gray es reversible y los estados vecinos difieren en un bit", () => {
    for (let n = 0; n < 64; n++) expect(grayABinario(binarioAGray(n))).toBe(n);
    for (const orden of [4, 8, 16]) {
      const k = Math.log2(orden);
      for (let i = 0; i < orden; i++) {
        const actual = bitsDeEstadoPSK(i, k, "gray");
        const siguiente = bitsDeEstadoPSK((i + 1) % orden, k, "gray");
        const diferencias = actual.filter((bit, j) => bit !== siguiente[j]).length;
        expect(diferencias).toBe(1);
      }
    }
  });

  it("el mapeo bits → índice → bits es consistente en todos los órdenes", () => {
    for (const mapeo of ["apuntes", "gray", "binario"] as const) {
      for (const [orden, k] of [[2, 1], [4, 2], [8, 3], [16, 4]]) {
        for (let i = 0; i < orden; i++) expect(indiceEstadoPSK(bitsDeEstadoPSK(i, k, mapeo), mapeo)).toBe(i);
      }
    }
    expect(indiceEstadoPSK([1, 1], "gray")).toBe(2);
    expect(indiceEstadoPSK([1, 1], "binario")).toBe(3);
  });

  it("los órdenes que el Tema 6 no define usan binario natural", () => {
    expect(bitsDeEstadoPSK(5, 3, "apuntes")).toEqual(bitsDeEstadoPSK(5, 3, "binario"));
  });

  it("los puntos de la constelación están sobre un círculo de radio V_p", () => {
    const parametros = ParametrosModulacion.desdeEntrada({ ...entradaBase, ordenModulacion: 8, amplitudPortadora: 2 });
    const puntos = MotorConstelacion.constelacionPSK(parametros, []);
    expect(puntos).toHaveLength(8);
    for (const p of puntos) expect(Math.hypot(p.enFase, p.cuadratura)).toBeCloseTo(2, 12);
    expect(distanciaMinimaPSK(2, 8)).toBeCloseTo(Math.hypot(puntos[0].enFase - puntos[1].enFase, puntos[0].cuadratura - puntos[1].cuadratura), 12);
  });

  it("la tabla de símbolos de 4PSK muestra el mapeo del Tema 6", () => {
    const { datos } = simular({ ...entradaBase, ordenModulacion: 4 });
    expect(datos.constelacion.map((p) => p.etiqueta)).toEqual(["10", "01", "11", "00"]);
    expect(datos.constelacion.map((p) => p.repeticiones)).toEqual([2, 2, 1, 1]);
  });
});
