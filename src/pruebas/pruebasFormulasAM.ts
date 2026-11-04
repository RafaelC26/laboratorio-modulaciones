import { describe, expect, it } from "vitest";
import {
  amplitudBandaLateralAM,
  anchoBandaAM,
  clasificarIndiceAM,
  eficienciaAM,
  envolventeAM,
  indiceModulacionAM,
  porcentajeModulacionAM,
  potenciaPortadoraAM,
  potenciaTotalAM,
  senalModuladaAM,
  senalModuladoraAM,
  type VariablesAM,
} from "@/formulas/formulasAM";
import { portadoraSeno } from "@/formulas/formulasPortadora";

const base: VariablesAM = {
  amplitudPortadora: 2,
  frecuenciaPortadora: 1000,
  faseInicial: 0,
  amplitudModuladora: 1,
  frecuenciaModuladora: 100,
};

const instantes = [0.00031, 0.0042, 0.0177];

describe("Fórmulas AM (Tema 6, p. 35–40)", () => {
  it("calcula m = V_m / V_p y M % = (V_m / V_p)·100", () => {
    expect(indiceModulacionAM(base)).toBeCloseTo(0.5, 15);
    expect(indiceModulacionAM({ amplitudModuladora: 3, amplitudPortadora: 2 })).toBeCloseTo(1.5, 15);
    expect(porcentajeModulacionAM(base)).toBeCloseTo(50, 12);
  });

  it("la portadora y la moduladora usan seno: valen 0 en t = 0", () => {
    expect(portadoraSeno(0, base)).toBe(0);
    expect(senalModuladoraAM(0, base)).toBe(0);
    expect(senalModuladaAM(0, base)).toBe(0);
    expect(portadoraSeno(1 / (4 * base.frecuenciaPortadora), base)).toBeCloseTo(2, 12);
    expect(senalModuladoraAM(1 / (4 * base.frecuenciaModuladora), base)).toBeCloseTo(1, 12);
  });

  it("cumple la ecuación (5): v(t) = V_p(1 + m sen(2π f_m t)) sen(2π f_p t)", () => {
    for (const t of instantes) {
      const esperado = 2 * (1 + 0.5 * Math.sin(2 * Math.PI * 100 * t)) * Math.sin(2 * Math.PI * 1000 * t);
      expect(senalModuladaAM(t, base)).toBeCloseTo(esperado, 12);
    }
  });

  it("cumple la ecuación (3): v(t) = (V_p + v_m(t)) sen(2π f_p t)", () => {
    for (const t of instantes) {
      const esperado = (base.amplitudPortadora + senalModuladoraAM(t, base)) * Math.sin(2 * Math.PI * base.frecuenciaPortadora * t);
      expect(senalModuladaAM(t, base)).toBeCloseTo(esperado, 12);
    }
  });

  it("cumple la ecuación (6): portadora más frecuencias laterales con amplitud mV_p/2", () => {
    const lateral = (0.5 * 2) / 2;
    for (const t of instantes) {
      const esperado =
        2 * Math.sin(2 * Math.PI * 1000 * t) + lateral * Math.cos(2 * Math.PI * (1000 - 100) * t) - lateral * Math.cos(2 * Math.PI * (1000 + 100) * t);
      expect(senalModuladaAM(t, base)).toBeCloseTo(esperado, 12);
    }
  });

  it("con m = 0 coincide con la portadora", () => {
    const sinModular = { ...base, amplitudModuladora: 0 };
    for (const t of [0, 1.3e-4, 7.7e-4, 0.0123]) {
      expect(senalModuladaAM(t, sinModular)).toBeCloseTo(portadoraSeno(t, sinModular), 12);
    }
  });

  it("la envolvente alcanza V_p(1 + m) en T_m/4 y V_p(1 − m) en 3T_m/4", () => {
    const periodo = 1 / base.frecuenciaModuladora;
    expect(envolventeAM(periodo / 4, base)).toBeCloseTo(2 * 1.5, 12);
    expect(envolventeAM((3 * periodo) / 4, base)).toBeCloseTo(2 * 0.5, 12);
  });

  it("clasifica los regímenes M < 100 %, M = 100 % y M > 100 %", () => {
    expect(clasificarIndiceAM(0)).toBe("sin-modulacion");
    expect(clasificarIndiceAM(0.5)).toBe("submodulacion");
    expect(clasificarIndiceAM(1)).toBe("modulacion-completa");
    expect(clasificarIndiceAM(1.2)).toBe("sobremodulacion");
  });

  it("detecta envolvente negativa con sobremodulación", () => {
    const sobremodulada = { ...base, amplitudModuladora: 3 }; // m = 1.5
    expect(envolventeAM(3 / (4 * base.frecuenciaModuladora), sobremodulada)).toBeLessThan(0);
  });

  it("con m = 1 la potencia es 3/2 de la portadora: 2/3 en portadora y 1/3 en bandas laterales", () => {
    const pp = potenciaPortadoraAM(2);
    const p = potenciaTotalAM(2, 1);
    expect(p).toBeCloseTo((3 / 2) * pp, 12);
    expect(pp / p).toBeCloseTo(2 / 3, 12);
    expect(eficienciaAM(1)).toBeCloseTo(1 / 3, 12);
  });

  it("calcula la amplitud de las frecuencias laterales y el ancho de banda", () => {
    expect(amplitudBandaLateralAM(2, 0.5)).toBeCloseTo(0.5, 12);
    expect(anchoBandaAM(10_000)).toBe(20_000); // ejemplo del Tema 6: 10 kHz → 20 kHz
  });
});
