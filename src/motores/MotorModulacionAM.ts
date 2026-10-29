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
  potenciaPortadoraAM,
  potenciaTotalAM,
  senalModuladaAM,
  senalModuladoraAM,
  textoClasificacionAM,
} from "@/formulas/formulasAM";
import { senalPortadora } from "@/formulas/formulasPortadora";
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
    const mu = p.indiceModulacion ?? indiceModulacionAM(p);
    const ac = p.amplitudPortadora;
    const fc = p.frecuenciaPortadora;
    const fm = p.frecuenciaModuladora;

    const moduladora = MotorMuestreo.evaluar(tiempo, (t) => senalModuladoraAM(t, p));
    const portadora = MotorMuestreo.evaluar(tiempo, (t) => senalPortadora(t, p));
    const modulada = MotorMuestreo.evaluar(tiempo, (t) => senalModuladaAM(t, p));
    const envolvente = MotorMuestreo.evaluar(tiempo, (t) => envolventeAM(t, p));
    const envolventeInferior = envolvente.map((valor) => -valor);

    const regiones = regionesNegativas(tiempo, envolvente);
    const fraccionSobremodulada = fraccionNegativa(envolvente);
    const clasificacion = clasificarIndiceAM(mu);
    const senalModulada = new SenalAnalogica("Señal AM s(t)", tiempo, modulada, fc);

    const componentes: ComponenteEspectralTeorica[] = [{ frecuencia: fc, amplitud: ac, etiqueta: "Portadora f_c" }];
    if (mu > 0) {
      const lateral = amplitudBandaLateralAM(ac, mu);
      if (fc - fm > 0) componentes.push({ frecuencia: fc - fm, amplitud: lateral, etiqueta: "Banda lateral inferior f_c − f_m" });
      componentes.push({ frecuencia: fc + fm, amplitud: lateral, etiqueta: "Banda lateral superior f_c + f_m" });
    }

    const pc = potenciaPortadoraAM(ac);
    const pt = potenciaTotalAM(ac, mu);
    const metricas: Metrica[] = [
      {
        clave: "indice",
        nombre: "Índice de modulación",
        simbolo: String.raw`\mu`,
        valor: mu,
        estado: clasificacion === "sobremodulacion" ? "critico" : clasificacion === "modulacion-completa" ? "advertencia" : "normal",
      },
      { clave: "clasificacion", nombre: "Régimen", valor: textoClasificacionAM[clasificacion], estado: clasificacion === "sobremodulacion" ? "critico" : "normal" },
      { clave: "amplitudMaxima", nombre: "Envolvente máxima", simbolo: String.raw`A_c(1+\mu)`, valor: ac * (1 + mu), unidad: "V" },
      { clave: "amplitudMinima", nombre: "Envolvente mínima", simbolo: String.raw`A_c(1-\mu)`, valor: ac * (1 - mu), unidad: "V", estado: mu > 1 ? "critico" : "normal" },
      { clave: "anchoBanda", nombre: "Ancho de banda", simbolo: "B=2f_m", valor: anchoBandaAM(fm), unidad: "Hz" },
      { clave: "bandaInferior", nombre: "Banda lateral inferior", simbolo: "f_c-f_m", valor: fc - fm, unidad: "Hz" },
      { clave: "bandaSuperior", nombre: "Banda lateral superior", simbolo: "f_c+f_m", valor: fc + fm, unidad: "Hz" },
      { clave: "amplitudLateral", nombre: "Amplitud de cada banda lateral", simbolo: String.raw`\mu A_c/2`, valor: amplitudBandaLateralAM(ac, mu), unidad: "V" },
      { clave: "potenciaPortadora", nombre: "Potencia de portadora", simbolo: "P_c", valor: pc, unidad: "W" },
      { clave: "potenciaLaterales", nombre: "Potencia en bandas laterales", simbolo: String.raw`P_c\mu^2/2`, valor: pt - pc, unidad: "W" },
      { clave: "potenciaTotal", nombre: "Potencia total (teórica)", simbolo: "P_T", valor: pt, unidad: "W" },
      { clave: "potenciaMedida", nombre: "Potencia media medida", simbolo: String.raw`\overline{s^2}`, valor: senalModulada.potenciaMedia, unidad: "W", descripcion: "Coincide con P_T cuando el intervalo contiene periodos completos." },
      { clave: "eficiencia", nombre: "Eficiencia de transmisión", simbolo: String.raw`\eta`, valor: formatearPorcentaje(eficienciaAM(mu)) },
    ];

    const advertencias: string[] = [];
    if (clasificacion === "sobremodulacion") {
      advertencias.push(
        `Sobremodulación (μ = ${mu.toFixed(3)} > 1): la envolvente se invierte durante el ${formatearPorcentaje(fraccionSobremodulada)} del tiempo y un detector de envolvente distorsionaría el mensaje.`,
      );
    }
    if (fc - fm <= 0) advertencias.push("La banda lateral inferior cae en frecuencia negativa (f_m ≥ f_c).");

    return {
      nombreVariante: "AM de doble banda lateral con portadora",
      moduladora: new SenalAnalogica("Moduladora m(t)", tiempo, moduladora, fm),
      portadora: new SenalAnalogica("Portadora c(t)", tiempo, portadora, fc),
      modulada: senalModulada,
      auxiliares: [
        { identificador: "envolventeSuperior", grafica: "modulada", estilo: "envolvente", ejeSecundario: false, senal: new SenalAnalogica("Envolvente superior e(t)", tiempo, envolvente, fm) },
        { identificador: "envolventeInferior", grafica: "modulada", estilo: "envolvente", ejeSecundario: false, senal: new SenalAnalogica("Envolvente inferior −e(t)", tiempo, envolventeInferior, fm) },
      ],
      metricas,
      resumen: {
        amplitudMaxima: ac * (1 + mu),
        amplitudMinima: ac * (1 - mu),
        frecuenciaCentral: fc,
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

/** Intervalos contiguos donde la envolvente es negativa (1 + μ·m(t) < 0). */
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
