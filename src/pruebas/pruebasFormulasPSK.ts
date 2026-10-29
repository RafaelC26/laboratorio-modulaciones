import { describe, expect, it } from "vitest";
import { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import {
  binarioAGray,
  bitsDeEstadoPSK,
  distanciaMinimaPSK,
  faseSimboloPSK,
  grayABinario,
  indiceEstadoPSK,
  nombreVariantePSK,
  senalModuladaPSK,
} from "@/formulas/formulasPSK";
import { MotorConstelacion } from "@/motores/MotorConstelacion";
import { MotorModulacionPSK } from "@/motores/MotorModulacionPSK";
import { MotorMuestreo } from "@/motores/MotorMuestreo";
import type { EntradaPSK } from "@/tipos/tiposModulacion";

const entradaBase: EntradaPSK = {
  tipo: "PSK",
  secuenciaBits: "101101001110",
  ordenModulacion: 2,
  amplitudPortadora: 1,
  frecuenciaPortadora: 1000,
  duracionSimbolo: 0.002,
  faseInicial: 0,
  mapeoSimbolos: "gray",
  temporal: { tiempoInicial: 0, tiempoFinal: 1, frecuenciaMuestreo: 100_000 },
};

describe("Fórmulas PSK", () => {
  it("BPSK usa las fases 0 y π", () => {
    expect(faseSimboloPSK(0, 2, 0)).toBe(0);
    expect(faseSimboloPSK(1, 2, 0)).toBeCloseTo(Math.PI, 15);
  });

  it("QPSK usa las fases 0, π/2, π y 3π/2", () => {
    const fases = [0, 1, 2, 3].map((i) => faseSimboloPSK(i, 4, 0));
    expect(fases[1]).toBeCloseTo(Math.PI / 2, 15);
    expect(fases[2]).toBeCloseTo(Math.PI, 15);
    expect(fases[3]).toBeCloseTo((3 * Math.PI) / 2, 15);
  });

  it("BPSK con bit 1 es la portadora invertida: A_c cos(2πf_c t + π b)", () => {
    const v = { amplitudPortadora: 1.5, frecuenciaPortadora: 1000 };
    for (const t of [0, 1.7e-4, 9.1e-4]) {
      const portadora = 1.5 * Math.cos(2 * Math.PI * 1000 * t);
      expect(senalModuladaPSK(t, faseSimboloPSK(1, 2, 0), v)).toBeCloseTo(-portadora, 12);
      expect(senalModuladaPSK(t, Math.PI * 1, v)).toBeCloseTo(-portadora, 12);
    }
  });

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

  it("el mapeo bits → índice → bits es consistente", () => {
    for (const mapeo of ["gray", "binario"] as const) {
      for (let i = 0; i < 8; i++) expect(indiceEstadoPSK(bitsDeEstadoPSK(i, 3, mapeo), mapeo)).toBe(i);
    }
    expect(indiceEstadoPSK([1, 1], "gray")).toBe(2); // 11 → fase π en QPSK Gray
    expect(indiceEstadoPSK([1, 1], "binario")).toBe(3);
  });

  it("los puntos de la constelación están sobre un círculo de radio A_c", () => {
    const parametros = ParametrosModulacion.desdeEntrada({ ...entradaBase, ordenModulacion: 8, amplitudPortadora: 2 });
    const puntos = MotorConstelacion.constelacionPSK(parametros, []);
    expect(puntos).toHaveLength(8);
    for (const p of puntos) expect(Math.hypot(p.enFase, p.cuadratura)).toBeCloseTo(2, 12);
    expect(distanciaMinimaPSK(2, 8)).toBeCloseTo(Math.hypot(puntos[0].enFase - puntos[1].enFase, puntos[0].cuadratura - puntos[1].cuadratura), 12);
  });

  it("nombra las variantes", () => {
    expect(nombreVariantePSK(2)).toBe("BPSK");
    expect(nombreVariantePSK(4)).toBe("QPSK");
    expect(nombreVariantePSK(8)).toBe("8-PSK");
  });

  it("el motor QPSK aplica la fase de cada símbolo y mantiene la envolvente constante", () => {
    const entrada = { ...entradaBase, ordenModulacion: 4 };
    const parametros = ParametrosModulacion.desdeEntrada(entrada);
    const motor = new MotorModulacionPSK();
    const { inicio, fin } = motor.intervaloTemporal(parametros, entrada.temporal);
    expect(fin).toBeCloseTo(6 * 0.002, 15); // 12 bits / 2 = 6 símbolos
    const tiempo = MotorMuestreo.vectorTiempo(inicio, fin, 100_000);
    const datos = motor.calcular(parametros, tiempo);
    expect(datos.intervalosSimbolo.map((s) => s.etiqueta)).toEqual(["10", "11", "01", "00", "11", "10"]);
    // Primer símbolo "10" → Gray → i = 3 → φ = 3π/2: s(0) = cos(3π/2) = 0
    expect(datos.modulada.amplitudes[0]).toBeCloseTo(0, 12);
    expect(datos.modulada.amplitudMaxima).toBeLessThanOrEqual(1 + 1e-12);
    expect(datos.metricas.find((m) => m.clave === "bitsRelleno")?.valor).toBe(0);
  });
});
