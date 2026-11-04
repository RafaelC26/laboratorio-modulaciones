import type { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { SenalAnalogica } from "@/clases/SenalAnalogica";
import { portadoraCoseno } from "@/formulas/formulasPortadora";
import {
  anchoBandaAngostaPM,
  anchoBandaCarson,
  anchoBandaEstimadoPM,
  besselJ,
  desviacionFrecuenciaPSM,
  esBandaAngosta,
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
    const vp = p.amplitudPortadora;
    const fp = p.frecuenciaPortadora;
    const fm = p.frecuenciaModuladora;

    const moduladora = MotorMuestreo.evaluar(tiempo, (t) => senalModuladoraPSM(t, p));
    const portadora = MotorMuestreo.evaluar(tiempo, (t) => portadoraCoseno(t, p));
    const modulada = MotorMuestreo.evaluar(tiempo, (t) => senalModuladaPSM(t, p));
    const frecuenciaInstantanea = MotorMuestreo.evaluar(tiempo, (t) => frecuenciaInstantaneaPSM(t, p));

    const componentes: ComponenteEspectralTeorica[] = [];
    const maximoOrden = Math.ceil(beta) + 6;
    for (let n = -maximoOrden; n <= maximoOrden; n++) {
      const frecuencia = fp + n * fm;
      const amplitud = vp * Math.abs(besselJ(n, beta));
      if (frecuencia <= 0 || amplitud < UMBRAL_COMPONENTE_BESSEL * vp) continue;
      const etiqueta = n === 0 ? "Portadora V_p|J₀(β)|" : `f_p ${n > 0 ? "+" : "−"} ${Math.abs(n)}f_m: V_p|J${Math.abs(n)}(β)|`;
      componentes.push({ frecuencia, amplitud, etiqueta });
    }

    const deltaF = desviacionFrecuenciaPSM(p);
    const carson = anchoBandaCarson(beta, fm);
    const angosta = esBandaAngosta(beta);
    const j0 = besselJ(0, beta);
    const senalModulada = new SenalAnalogica("Señal PSM v(t)", tiempo, modulada, fp);

    const metricas: Metrica[] = [
      { clave: "indice", nombre: "Índice de modulación", simbolo: String.raw`\beta=\Delta\Phi\,V_m`, valor: beta, unidad: "rad" },
      { clave: "indiceGrados", nombre: "Variación máxima de fase", simbolo: String.raw`\Phi_{max}=V_m\Delta\Phi`, valor: radianesAGrados(beta), unidad: "°" },
      { clave: "regimen", nombre: "Régimen", valor: angosta ? "Banda angosta (β < π/2)" : "Banda ancha (β > π/2)" },
      ...(angosta ? ([{ clave: "anchoBanda", nombre: "Ancho de banda", simbolo: "BW=2f_m", valor: anchoBandaAngostaPM(fm), unidad: "Hz" }] satisfies Metrica[]) : []),
      { clave: "anchoBandaCarson", nombre: "Ancho de banda (Carson)", simbolo: String.raw`2(\beta+1)f_m`, valor: carson, unidad: "Hz", complemento: true },
      { clave: "desviacionFrecuencia", nombre: "Desviación máxima de frecuencia", simbolo: String.raw`\Delta f=\beta f_m`, valor: deltaF, unidad: "Hz", complemento: true },
      { clave: "frecuenciaMaxima", nombre: "Frecuencia instantánea máxima", simbolo: String.raw`f_p+\Delta f`, valor: fp + deltaF, unidad: "Hz", complemento: true },
      { clave: "frecuenciaMinima", nombre: "Frecuencia instantánea mínima", simbolo: String.raw`f_p-\Delta f`, valor: fp - deltaF, unidad: "Hz", complemento: true },
      { clave: "bessel0", nombre: "Amplitud relativa de portadora", simbolo: String.raw`J_0(\beta)`, valor: j0, complemento: true },
      { clave: "bessel1", nombre: "Primer par de bandas", simbolo: String.raw`J_1(\beta)`, valor: besselJ(1, beta), complemento: true },
      { clave: "bessel2", nombre: "Segundo par de bandas", simbolo: String.raw`J_2(\beta)`, valor: besselJ(2, beta), complemento: true },
      { clave: "fraccionPortadora", nombre: "Potencia en la portadora", simbolo: String.raw`J_0^2(\beta)`, valor: formatearPorcentaje(j0 * j0), complemento: true },
      { clave: "potenciaTotal", nombre: "Potencia total (constante)", simbolo: "V_p^2/2", valor: (vp * vp) / 2, unidad: "W", complemento: true },
      { clave: "potenciaMedida", nombre: "Potencia media medida", simbolo: String.raw`\overline{v^2}`, valor: senalModulada.potenciaMedia, unidad: "W", complemento: true },
    ];

    const advertencias: string[] = [];
    if (fp - (beta + 1) * fm <= 0) {
      advertencias.push("Parte del ancho de banda de Carson cae en frecuencias negativas (f_p ≤ (β+1)f_m): las rayas se pliegan en el espectro.");
    }
    if (beta > 10) advertencias.push("β > 10: la serie de Bessel pierde precisión y el ancho de banda es muy grande.");

    return {
      nombreVariante: angosta ? "PM de banda angosta" : "PM de banda ancha",
      moduladora: new SenalAnalogica("Moduladora vm(t)", tiempo, moduladora, fm),
      portadora: new SenalAnalogica("Portadora vp(t)", tiempo, portadora, fp),
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
        amplitudMaxima: vp,
        amplitudMinima: vp,
        frecuenciaCentral: fp,
        anchoBandaEstimado: anchoBandaEstimadoPM(beta, fm),
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
