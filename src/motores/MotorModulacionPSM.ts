import type { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { SenalAnalogica } from "@/clases/SenalAnalogica";
import { senalPortadora } from "@/formulas/formulasPortadora";
import {
  anchoBandaCarson,
  besselJ,
  desviacionFrecuenciaPSM,
  esBandaEstrecha,
  frecuenciaInstantaneaPSM,
  frecuenciaMaximaPSM,
  indiceModulacionFase,
  senalModuladaPSM,
  senalModuladoraPSM,
} from "@/formulas/formulasPSM";
import type { ConfiguracionTemporal } from "@/tipos/tiposModulacion";
import type { ComponenteEspectralTeorica } from "@/tipos/tiposSenal";
import type { DatosModulacion, Metrica, MotorModulacion } from "@/tipos/tiposSimulacion";
import { radianesAGrados } from "@/utilidades/conversionUnidades";
import { formatearPorcentaje } from "@/utilidades/formatoNumerico";
import { MotorMuestreo } from "./MotorMuestreo";

/** Componentes de Bessel por debajo de este valor relativo no se dibujan. */
const UMBRAL_COMPONENTE_BESSEL = 1e-3;

export class MotorModulacionPSM implements MotorModulacion {
  readonly tipo = "PSM" as const;

  intervaloTemporal(_parametros: ParametrosModulacion, temporal: ConfiguracionTemporal) {
    return { inicio: temporal.tiempoInicial, fin: temporal.tiempoFinal };
  }

  frecuenciaMaxima(parametros: ParametrosModulacion): number {
    return frecuenciaMaximaPSM(parametros);
  }

  calcular(p: ParametrosModulacion, tiempo: Float64Array): DatosModulacion {
    const beta = p.indiceModulacion ?? indiceModulacionFase(p);
    const ac = p.amplitudPortadora;
    const fc = p.frecuenciaPortadora;
    const fm = p.frecuenciaModuladora;

    const moduladora = MotorMuestreo.evaluar(tiempo, (t) => senalModuladoraPSM(t, p));
    const portadora = MotorMuestreo.evaluar(tiempo, (t) => senalPortadora(t, p));
    const modulada = MotorMuestreo.evaluar(tiempo, (t) => senalModuladaPSM(t, p));
    const frecuenciaInstantanea = MotorMuestreo.evaluar(tiempo, (t) => frecuenciaInstantaneaPSM(t, p));

    const componentes: ComponenteEspectralTeorica[] = [];
    const maximoOrden = Math.ceil(beta) + 6;
    for (let n = -maximoOrden; n <= maximoOrden; n++) {
      const frecuencia = fc + n * fm;
      const amplitud = ac * Math.abs(besselJ(n, beta));
      if (frecuencia <= 0 || amplitud < UMBRAL_COMPONENTE_BESSEL * ac) continue;
      const etiqueta = n === 0 ? "Portadora A_c|J₀(β)|" : `f_c ${n > 0 ? "+" : "−"} ${Math.abs(n)}f_m: A_c|J${Math.abs(n)}(β)|`;
      componentes.push({ frecuencia, amplitud, etiqueta });
    }

    const deltaF = desviacionFrecuenciaPSM(p);
    const carson = anchoBandaCarson(beta, fm);
    const j0 = besselJ(0, beta);
    const senalModulada = new SenalAnalogica("Señal PSM s(t)", tiempo, modulada, fc);

    const metricas: Metrica[] = [
      { clave: "indice", nombre: "Índice de modulación de fase", simbolo: String.raw`\beta=k_pA_m`, valor: beta, unidad: "rad" },
      { clave: "indiceGrados", nombre: "Desviación máxima de fase", simbolo: String.raw`\Delta\phi_{max}`, valor: radianesAGrados(beta), unidad: "°" },
      { clave: "regimen", nombre: "Régimen", valor: esBandaEstrecha(beta) ? "Banda estrecha (β < 0.3)" : "Banda ancha" },
      { clave: "desviacionFrecuencia", nombre: "Desviación máxima de frecuencia", simbolo: String.raw`\Delta f=\beta f_m`, valor: deltaF, unidad: "Hz" },
      { clave: "frecuenciaMaxima", nombre: "Frecuencia instantánea máxima", simbolo: String.raw`f_c+\Delta f`, valor: fc + deltaF, unidad: "Hz" },
      { clave: "frecuenciaMinima", nombre: "Frecuencia instantánea mínima", simbolo: String.raw`f_c-\Delta f`, valor: fc - deltaF, unidad: "Hz" },
      { clave: "anchoBanda", nombre: "Ancho de banda (Carson)", simbolo: String.raw`2(\beta+1)f_m`, valor: carson, unidad: "Hz" },
      { clave: "bessel0", nombre: "Amplitud relativa de portadora", simbolo: String.raw`J_0(\beta)`, valor: j0 },
      { clave: "bessel1", nombre: "Primer par de bandas", simbolo: String.raw`J_1(\beta)`, valor: besselJ(1, beta) },
      { clave: "bessel2", nombre: "Segundo par de bandas", simbolo: String.raw`J_2(\beta)`, valor: besselJ(2, beta) },
      { clave: "fraccionPortadora", nombre: "Potencia en la portadora", simbolo: String.raw`J_0^2(\beta)`, valor: formatearPorcentaje(j0 * j0) },
      { clave: "potenciaTotal", nombre: "Potencia total (constante)", simbolo: "A_c^2/2", valor: (ac * ac) / 2, unidad: "W" },
      { clave: "potenciaMedida", nombre: "Potencia media medida", simbolo: String.raw`\overline{s^2}`, valor: senalModulada.potenciaMedia, unidad: "W" },
    ];

    const advertencias: string[] = [];
    if (fc - (beta + 1) * fm <= 0) {
      advertencias.push("Parte del ancho de banda de Carson cae en frecuencias negativas (f_c ≤ (β+1)f_m): las rayas se pliegan en el espectro.");
    }
    if (beta > 10) advertencias.push("β > 10: la serie de Bessel pierde precisión y el ancho de banda es muy grande.");

    return {
      nombreVariante: esBandaEstrecha(beta) ? "PM de banda estrecha" : "PM de banda ancha",
      moduladora: new SenalAnalogica("Moduladora m(t)", tiempo, moduladora, fm),
      portadora: new SenalAnalogica("Portadora c(t)", tiempo, portadora, fc),
      modulada: senalModulada,
      auxiliares: [
        {
          identificador: "frecuenciaInstantanea",
          grafica: "moduladora",
          estilo: "linea",
          ejeSecundario: true,
          tituloEje: "fᵢ(t) [Hz]",
          senal: new SenalAnalogica("Frecuencia instantánea fᵢ(t)", tiempo, frecuenciaInstantanea, fm, "Hz"),
        },
      ],
      metricas,
      resumen: {
        amplitudMaxima: ac,
        amplitudMinima: ac,
        frecuenciaCentral: fc,
        anchoBandaEstimado: carson,
        tasaBits: null,
        tasaSimbolos: null,
        estados: null,
      },
      intervalosSimbolo: [],
      constelacion: [],
      componentesTeoricos: componentes,
      marcasFrecuencia: [],
      regionesSobremodulacion: [],
      advertencias,
    };
  }
}
