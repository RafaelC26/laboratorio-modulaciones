import type { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { SenalAnalogica } from "@/clases/SenalAnalogica";
import {
  amplitudBandaLateralAM,
  anchoBandaAM,
  clasificarIndiceAM,
  eficienciaAM,
  envolventeAM,
  frecuenciaMaximaAM,
  indiceModulacionAM,
  porcentajeModulacionAM,
  potenciaPortadoraAM,
  potenciaTotalAM,
  senalModuladaAM,
  senalModuladoraAM,
  textoClasificacionAM,
} from "@/formulas/formulasAM";
import { portadoraSeno } from "@/formulas/formulasPortadora";
import type { ConfiguracionTemporal } from "@/tipos/tiposModulacion";
import type { ComponenteEspectralTeorica } from "@/tipos/tiposSenal";
import type { DatosModulacion, Metrica, MotorModulacion } from "@/tipos/tiposSimulacion";
import { formatearPorcentaje } from "@/utilidades/formatoNumerico";
import { MotorMuestreo } from "./MotorMuestreo";

export class MotorModulacionAM implements MotorModulacion {
  readonly tipo = "AM" as const;

  intervaloTemporal(_parametros: ParametrosModulacion, temporal: ConfiguracionTemporal) {
    return { inicio: temporal.tiempoInicial, fin: temporal.tiempoFinal };
  }

  frecuenciaMaxima(parametros: ParametrosModulacion): number {
    return frecuenciaMaximaAM(parametros);
  }

  calcular(p: ParametrosModulacion, tiempo: Float64Array): DatosModulacion {
    const m = p.indiceModulacion ?? indiceModulacionAM(p);
    const vp = p.amplitudPortadora;
    const fp = p.frecuenciaPortadora;
    const fm = p.frecuenciaModuladora;

    const moduladora = MotorMuestreo.evaluar(tiempo, (t) => senalModuladoraAM(t, p));
    const portadora = MotorMuestreo.evaluar(tiempo, (t) => portadoraSeno(t, p));
    const modulada = MotorMuestreo.evaluar(tiempo, (t) => senalModuladaAM(t, p));
    const envolvente = MotorMuestreo.evaluar(tiempo, (t) => envolventeAM(t, p));
    const envolventeInferior = envolvente.map((valor) => -valor);

    const regiones = regionesNegativas(tiempo, envolvente);
    const fraccionSobremodulada = fraccionNegativa(envolvente);
    const clasificacion = clasificarIndiceAM(m);
    const senalModulada = new SenalAnalogica("Señal AM v(t)", tiempo, modulada, fp);

    const componentes: ComponenteEspectralTeorica[] = [{ frecuencia: fp, amplitud: vp, etiqueta: "Portadora f_p" }];
    if (m > 0) {
      const lateral = amplitudBandaLateralAM(vp, m);
      if (fp - fm > 0) componentes.push({ frecuencia: fp - fm, amplitud: lateral, etiqueta: "Frecuencia lateral inferior f_p − f_m" });
      componentes.push({ frecuencia: fp + fm, amplitud: lateral, etiqueta: "Frecuencia lateral superior f_p + f_m" });
    }

    const pp = potenciaPortadoraAM(vp);
    const pt = potenciaTotalAM(vp, m);
    const metricas: Metrica[] = [
      {
        clave: "indice",
        nombre: "Índice de modulación",
        simbolo: String.raw`m=V_m/V_p`,
        valor: m,
        estado: clasificacion === "sobremodulacion" ? "critico" : clasificacion === "modulacion-completa" ? "advertencia" : "normal",
      },
      { clave: "porcentaje", nombre: "Porcentaje de modulación", simbolo: String.raw`M\%`, valor: `${porcentajeModulacionAM(p).toLocaleString("es", { maximumFractionDigits: 2 })} %` },
      { clave: "clasificacion", nombre: "Régimen", valor: textoClasificacionAM[clasificacion], estado: clasificacion === "sobremodulacion" ? "critico" : "normal" },
      { clave: "anchoBanda", nombre: "Ancho de banda", simbolo: "BW=2f_m", valor: anchoBandaAM(fm), unidad: "Hz" },
      { clave: "bandaInferior", nombre: "Frecuencia lateral inferior", simbolo: "f_p-f_m", valor: fp - fm, unidad: "Hz" },
      { clave: "bandaSuperior", nombre: "Frecuencia lateral superior", simbolo: "f_p+f_m", valor: fp + fm, unidad: "Hz" },
      { clave: "amplitudLateral", nombre: "Amplitud de cada frecuencia lateral", simbolo: String.raw`mV_p/2`, valor: amplitudBandaLateralAM(vp, m), unidad: "V" },
      { clave: "potenciaRelativa", nombre: "Potencia total relativa a la portadora", simbolo: String.raw`P/P_p=1+m^2/2`, valor: 1 + (m * m) / 2 },
      { clave: "amplitudMaxima", nombre: "Envolvente máxima", simbolo: String.raw`V_p(1+m)`, valor: vp * (1 + m), unidad: "V", complemento: true },
      { clave: "amplitudMinima", nombre: "Envolvente mínima", simbolo: String.raw`V_p(1-m)`, valor: vp * (1 - m), unidad: "V", estado: m > 1 ? "critico" : "normal", complemento: true },
      { clave: "potenciaPortadora", nombre: "Potencia de portadora", simbolo: "P_p=V_p^2/2R", valor: pp, unidad: "W", complemento: true },
      { clave: "potenciaLaterales", nombre: "Potencia en bandas laterales", simbolo: String.raw`P_p\,m^2/2`, valor: pt - pp, unidad: "W", complemento: true },
      { clave: "potenciaTotal", nombre: "Potencia total (teórica)", simbolo: "P", valor: pt, unidad: "W", complemento: true },
      { clave: "potenciaMedida", nombre: "Potencia media medida", simbolo: String.raw`\overline{v^2}`, valor: senalModulada.potenciaMedia, unidad: "W", descripcion: "Coincide con P cuando el intervalo contiene periodos completos.", complemento: true },
      { clave: "eficiencia", nombre: "Eficiencia de transmisión", simbolo: String.raw`\eta`, valor: formatearPorcentaje(eficienciaAM(m)), complemento: true },
    ];

    const advertencias: string[] = [];
    if (clasificacion === "sobremodulacion") {
      advertencias.push(
        `Sobremodulación (m = ${m.toFixed(3)} > 1): la envolvente se invierte durante el ${formatearPorcentaje(fraccionSobremodulada)} del tiempo y aparece distorsión con frecuencias no deseadas.`,
      );
    }
    if (fp - fm <= 0) advertencias.push("La frecuencia lateral inferior cae en frecuencia negativa (f_m ≥ f_p).");

    return {
      nombreVariante: "AM de doble banda lateral con portadora",
      moduladora: new SenalAnalogica("Moduladora vm(t)", tiempo, moduladora, fm),
      portadora: new SenalAnalogica("Portadora vp(t)", tiempo, portadora, fp),
      modulada: senalModulada,
      auxiliares: [
        { identificador: "envolventeSuperior", grafica: "modulada", estilo: "envolvente", ejeSecundario: false, senal: new SenalAnalogica("Envolvente superior e(t)", tiempo, envolvente, fm) },
        { identificador: "envolventeInferior", grafica: "modulada", estilo: "envolvente", ejeSecundario: false, senal: new SenalAnalogica("Envolvente inferior −e(t)", tiempo, envolventeInferior, fm) },
      ],
      metricas,
      resumen: {
        amplitudMaxima: vp * (1 + m),
        amplitudMinima: vp * (1 - m),
        frecuenciaCentral: fp,
        anchoBandaEstimado: anchoBandaAM(fm),
        tasaBits: null,
        tasaSimbolos: null,
        estados: null,
      },
      intervalosSimbolo: [],
      constelacion: [],
      componentesTeoricos: componentes,
      marcasFrecuencia: [],
      regionesSobremodulacion: regiones,
      advertencias,
    };
  }
}

/** Intervalos contiguos donde la envolvente es negativa (1 + m·sen(2π f_m t) < 0). */
function regionesNegativas(tiempo: Float64Array, valores: Float64Array): Array<[number, number]> {
  const regiones: Array<[number, number]> = [];
  let inicio: number | null = null;
  for (let n = 0; n < valores.length; n++) {
    if (valores[n] < 0 && inicio === null) inicio = tiempo[n];
    if (valores[n] >= 0 && inicio !== null) {
      regiones.push([inicio, tiempo[n]]);
      inicio = null;
    }
  }
  if (inicio !== null && tiempo.length) regiones.push([inicio, tiempo[tiempo.length - 1]]);
  return regiones;
}

function fraccionNegativa(valores: Float64Array): number {
  if (!valores.length) return 0;
  let negativos = 0;
  for (let n = 0; n < valores.length; n++) if (valores[n] < 0) negativos++;
  return negativos / valores.length;
}
