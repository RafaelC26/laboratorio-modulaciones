import { describe, expect, it } from "vitest";
import {
  amplitudBandaLateralAM,
  anchoBandaAM,
  clasificarIndiceAM,
  eficienciaAM,
  envolventeAM,
  indiceModulacionAM,
  potenciaTotalAM,
  senalModuladaAM,
  senalModuladoraAM,
  type VariablesAM,
} from "@/formulas/formulasAM";
import { senalPortadora } from "@/formulas/formulasPortadora";

const base: VariablesAM = {
  amplitudPortadora: 2,
  frecuenciaPortadora: 1000,
  faseInicial: 0,
  amplitudModuladora: 1,
  frecuenciaModuladora: 100,
};

describe("Fórmulas AM", () => {
  it("calcula el índice de modulación μ = A_m / A_c", () => {
    expect(indiceModulacionAM(base)).toBeCloseTo(0.5, 15);
    expect(indiceModulacionAM({ amplitudModuladora: 3, amplitudPortadora: 2 })).toBeCloseTo(1.5, 15);
  });

  it("en t = 0 vale A_c(1 + μ)", () => {
    expect(senalModuladaAM(0, base)).toBeCloseTo(2 * 1.5, 12);
    expect(envolventeAM(0, base)).toBeCloseTo(3, 12);
  });

  it("con μ = 0 coincide con la portadora", () => {
    const sinModular = { ...base, amplitudModuladora: 0 };
    for (const t of [0, 1.3e-4, 7.7e-4, 0.0123]) {
      expect(senalModuladaAM(t, sinModular)).toBeCloseTo(senalPortadora(t, sinModular), 12);
    }
  });

  it("equivale a (A_c + m(t))·cos(2πf_c t + φ_c)", () => {
    const v = { ...base, faseInicial: 0.4 };
    for (const t of [0.00031, 0.0042, 0.0177]) {
      const esperado = (v.amplitudPortadora + senalModuladoraAM(t, v)) * Math.cos(2 * Math.PI * v.frecuenciaPortadora * t + v.faseInicial);
      expect(senalModuladaAM(t, v)).toBeCloseTo(esperado, 12);
    }
  });

  it("la envolvente alcanza su mínimo A_c(1 − μ) en medio periodo de la moduladora", () => {
    expect(envolventeAM(1 / (2 * base.frecuenciaModuladora), base)).toBeCloseTo(2 * 0.5, 12);
  });

  it("clasifica los regímenes de modulación", () => {
    expect(clasificarIndiceAM(0)).toBe("sin-modulacion");
    expect(clasificarIndiceAM(0.5)).toBe("submodulacion");
    expect(clasificarIndiceAM(1)).toBe("modulacion-completa");
    expect(clasificarIndiceAM(1.2)).toBe("sobremodulacion");
  });

  it("detecta envolvente negativa con sobremodulación", () => {
    const sobremodulada = { ...base, amplitudModuladora: 3 }; // μ = 1.5
    expect(envolventeAM(1 / (2 * base.frecuenciaModuladora), sobremodulada)).toBeLessThan(0);
  });

  it("calcula potencia, eficiencia, bandas laterales y ancho de banda", () => {
    expect(potenciaTotalAM(2, 1)).toBeCloseTo(2 * 1.5, 12); // P_c = 2 W, P_T = P_c(1 + 1/2)
    expect(eficienciaAM(1)).toBeCloseTo(1 / 3, 12);
    expect(amplitudBandaLateralAM(2, 0.5)).toBeCloseTo(0.5, 12);
    expect(anchoBandaAM(100)).toBe(200);
  });
});
