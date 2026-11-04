import { describe, expect, it } from "vitest";
import { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { valoresPredeterminados } from "@/configuracion/configuracionGeneral";
import { portadoraCoseno } from "@/formulas/formulasPortadora";
import {
  anchoBandaAngostaPM,
  anchoBandaCarson,
  anchoBandaEstimadoPM,
  besselJ,
  desviacionFasePSM,
  esBandaAngosta,
  faseInstantaneaPSM,
  frecuenciaInstantaneaPSM,
  indiceModulacionFase,
  senalModuladaPSM,
  senalModuladoraPSM,
  type VariablesPSM,
} from "@/formulas/formulasPSM";
import { MotorModulacionPSM } from "@/motores/MotorModulacionPSM";
import { MotorMuestreo } from "@/motores/MotorMuestreo";

const base: VariablesPSM = {
  amplitudPortadora: 1.5,
  frecuenciaPortadora: 1000,
  faseInicial: 0,
  amplitudModuladora: 2,
  frecuenciaModuladora: 100,
  sensibilidadFase: 0.75,
};

const instantes = [0.00031, 0.0042, 0.0177];

describe("Modulación de fase PM (Tema 6, p. 46–48)", () => {
  it("la portadora usa coseno y la moduladora usa seno", () => {
    expect(portadoraCoseno(0, base)).toBe(1.5);
    expect(senalModuladoraPSM(0, base)).toBe(0);
    expect(senalModuladoraPSM(1 / 400, base)).toBeCloseTo(2, 12);
  });

  it("calcula β = ΔΦ·V_m, que no depende de f_m", () => {
    expect(indiceModulacionFase(base)).toBeCloseTo(1.5, 15);
    expect(indiceModulacionFase({ ...base, frecuenciaModuladora: 900 } as VariablesPSM)).toBeCloseTo(1.5, 15);
  });

  it("cumple Φ(t) = ΔΦ·v_m(t) y −V_m·ΔΦ ≤ Φ(t) ≤ V_m·ΔΦ", () => {
    for (let t = 0; t < 0.01; t += 1.7e-4) {
      expect(desviacionFasePSM(t, base)).toBeCloseTo(0.75 * senalModuladoraPSM(t, base), 12);
      expect(Math.abs(desviacionFasePSM(t, base))).toBeLessThanOrEqual(2 * 0.75 + 1e-12);
    }
  });

  it("cumple v(t) = V_p cos[2π f_p t + β sen(2π f_m t)]", () => {
    for (const t of instantes) {
      const esperado = 1.5 * Math.cos(2 * Math.PI * 1000 * t + 1.5 * Math.sin(2 * Math.PI * 100 * t));
      expect(senalModuladaPSM(t, base)).toBeCloseTo(esperado, 12);
    }
    expect(senalModuladaPSM(0, base)).toBe(1.5);
  });

  it("es banda angosta si β < π/2, y entonces BW = 2 f_m", () => {
    expect(esBandaAngosta(1.5)).toBe(true);
    expect(esBandaAngosta(Math.PI / 2)).toBe(false);
    expect(esBandaAngosta(2)).toBe(false);
    expect(anchoBandaAngostaPM(100)).toBe(200);
    expect(anchoBandaEstimadoPM(1.5, 100)).toBe(200);
  });
});

describe("Complementos de PM (no están en el Tema 6)", () => {
  it("la frecuencia instantánea es la derivada de la fase: f_i(t) = f_p + β f_m cos(2π f_m t)", () => {
    expect(frecuenciaInstantaneaPSM(0, base)).toBeCloseTo(1000 + 1.5 * 100, 10);
    const h = 1e-7;
    for (const t of instantes) {
      const derivada = (faseInstantaneaPSM(t + h, base) - faseInstantaneaPSM(t - h, base)) / (2 * h) / (2 * Math.PI);
      expect(derivada).toBeCloseTo(frecuenciaInstantaneaPSM(t, base), 3);
    }
  });

  it("en banda ancha estima el ancho de banda con la regla de Carson", () => {
    expect(anchoBandaCarson(2, 100)).toBe(600);
    expect(anchoBandaEstimadoPM(2, 100)).toBe(600);
  });

  it("la suma de Bessel reproduce la señal: V_p Σ J_n(β) cos[2π(f_p + n f_m)t]", () => {
    const beta = indiceModulacionFase(base);
    for (const t of instantes) {
      let suma = 0;
      for (let n = -15; n <= 15; n++) suma += besselJ(n, beta) * Math.cos(2 * Math.PI * (1000 + n * 100) * t);
      expect(1.5 * suma).toBeCloseTo(senalModuladaPSM(t, base), 10);
    }
  });

  it("el motor marca banda ancha con los valores predeterminados (β = 2)", () => {
    const entrada = valoresPredeterminados.PSM;
    const parametros = ParametrosModulacion.desdeEntrada(entrada);
    const motor = new MotorModulacionPSM();
    const tiempo = MotorMuestreo.vectorTiempo(0, 0.02, entrada.temporal.frecuenciaMuestreo);
    const datos = motor.calcular(parametros, tiempo);
    expect(datos.nombreVariante).toBe("PM de banda ancha");
    expect(datos.resumen.anchoBandaEstimado).toBe(600);
    expect(datos.metricas.find((m) => m.clave === "anchoBandaCarson")?.complemento).toBe(true);
  });
});
