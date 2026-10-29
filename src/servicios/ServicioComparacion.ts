import type { Data } from "plotly.js";
import type { ResultadoSimulacion } from "@/clases/ResultadoSimulacion";
import { coloresComparacion, temaGraficas } from "@/configuracion/configuracionGraficas";
import { nombreVariantePSK } from "@/formulas/formulasPSK";
import { indiceModulacionAM } from "@/formulas/formulasAM";
import { indiceModulacionFase } from "@/formulas/formulasPSM";
import type { EntradaModulacion } from "@/tipos/tiposModulacion";
import { amplitudADecibelios } from "@/utilidades/calculoDecibelios";
import { escalaFrecuenciaParaMaximo, escalaTiempoParaDuracion } from "@/utilidades/conversionUnidades";
import { formatearConUnidad, formatearNumero } from "@/utilidades/formatoNumerico";
import { limpiarSecuenciaBits } from "@/utilidades/validacionNumerica";
import { servicioGraficas, type FiguraPlotly } from "./ServicioGraficas";

export interface FilaComparacion {
  clave: string;
  nombre: string;
  valores: string[];
}

/** Ventana usada en todas las comparaciones espectrales para que la escala sea consistente. */
const VENTANA_COMPARACION = "hann" as const;

/**
 * Comparación de varias simulaciones (sección 16): tabla de resultados y
 * superposición de señales y espectros con la misma escala.
 */
export class ServicioComparacion {
  colorDe(indice: number): string {
    return coloresComparacion[indice % coloresComparacion.length];
  }

  /** Descripción corta de una configuración (historial y leyendas). */
  etiquetaEntrada(entrada: EntradaModulacion): string {
    const fc = formatearConUnidad(entrada.frecuenciaPortadora, "Hz", 3);
    switch (entrada.tipo) {
      case "AM":
        return `AM · μ=${formatearNumero(indiceModulacionAM(entrada), 3)} · fc=${fc} · fm=${formatearConUnidad(entrada.frecuenciaModuladora, "Hz", 3)}`;
      case "ASK": {
        const bits = limpiarSecuenciaBits(entrada.secuenciaBits);
        const resumenBits = bits.length > 12 ? `${bits.slice(0, 12)}…` : bits;
        return `${entrada.amplitudBit0 === 0 ? "OOK" : "ASK"} · ${resumenBits} · Tb=${formatearConUnidad(entrada.duracionBit, "s", 3)} · fc=${fc}`;
      }
      case "PSK":
        return `${nombreVariantePSK(entrada.ordenModulacion)} · ${limpiarSecuenciaBits(entrada.secuenciaBits).length} bits · Ts=${formatearConUnidad(entrada.duracionSimbolo, "s", 3)} · fc=${fc}`;
      case "PSM":
        return `PSM · β=${formatearNumero(indiceModulacionFase(entrada), 3)} rad · fc=${fc} · fm=${formatearConUnidad(entrada.frecuenciaModuladora, "Hz", 3)}`;
    }
  }

  tabla(resultados: ResultadoSimulacion[]): FilaComparacion[] {
    const opcional = (valor: number | null, unidad: string) => (valor === null ? "—" : formatearConUnidad(valor, unidad));
    const analisis = resultados.map((r) =>
      servicioGraficas.analizarEspectro(servicioGraficas.calcularEspectro(r, "modulada", VENTANA_COMPARACION)),
    );
    const filas: Array<[string, string, (r: ResultadoSimulacion, i: number) => string]> = [
      ["tecnica", "Técnica", (r) => `${r.tipo} — ${r.nombreVariante}`],
      ["amplitudMaxima", "Amplitud máxima (envolvente)", (r) => formatearConUnidad(r.resumen.amplitudMaxima, "V")],
      ["amplitudMinima", "Amplitud mínima (envolvente)", (r) => formatearConUnidad(r.resumen.amplitudMinima, "V")],
      ["frecuenciaCentral", "Frecuencia central", (r) => formatearConUnidad(r.resumen.frecuenciaCentral, "Hz")],
      ["anchoBanda", "Ancho de banda estimado (teórico)", (r) => formatearConUnidad(r.resumen.anchoBandaEstimado, "Hz")],
      ["anchoBandaMedido", "Ancho de banda medido (99 % potencia)", (_r, i) => formatearConUnidad(analisis[i].anchoBandaOcupado, "Hz")],
      ["tasaBits", "Tasa de bits", (r) => opcional(r.resumen.tasaBits, "bit/s")],
      ["tasaSimbolos", "Tasa de símbolos", (r) => opcional(r.resumen.tasaSimbolos, "Bd")],
      ["estados", "Estados de modulación", (r) => (r.resumen.estados === null ? "—" : String(r.resumen.estados))],
      ["potencia", "Potencia media medida", (r) => formatearConUnidad(r.senalModulada.potenciaMedia, "W")],
      ["muestreo", "Frecuencia de muestreo", (r) => formatearConUnidad(r.frecuenciaMuestreo, "Hz")],
      ["muestras", "Muestras", (r) => r.cantidadMuestras.toLocaleString("es")],
    ];
    return filas.map(([clave, nombre, obtener]) => ({ clave, nombre, valores: resultados.map(obtener) }));
  }

  figuraTiempo(resultados: ResultadoSimulacion[]): FiguraPlotly {
    const duracion = Math.max(...resultados.map((r) => r.configuracion.duracion), 0);
    const escala = escalaTiempoParaDuracion(duracion);
    const datos: Data[] = resultados.map((r, i) => ({
      type: servicioGraficas.tipoTraza(r.cantidadMuestras),
      mode: "lines",
      x: r.tiempo.map((t) => t * escala.factor),
      y: r.senalModulada.amplitudes,
      name: `${i + 1}. ${this.etiquetaEntrada(r.entrada)}`,
      line: { color: this.colorDe(i), width: 1.5 },
      opacity: 0.9,
    }));
    const diseno = servicioGraficas.disenoBase({
      tituloX: `Tiempo [${escala.etiqueta}]`,
      tituloY: "s(t) [V]",
      altura: temaGraficas.alturaComparacion,
    });
    diseno.legend = { ...diseno.legend, y: -0.32, yanchor: "top" };
    diseno.margin = { ...diseno.margin, b: 40 };
    diseno.height = temaGraficas.alturaComparacion + 22 * resultados.length;
    return { datos, diseno };
  }

  figuraEspectro(resultados: ResultadoSimulacion[]): FiguraPlotly {
    const rangos = resultados.map((r) => servicioGraficas.rangoFrecuenciaSugerido(r, "modulada"));
    const minimo = Math.min(...rangos.map((r) => r[0]));
    const maximo = Math.max(...rangos.map((r) => r[1]));
    const escala = escalaFrecuenciaParaMaximo(maximo);
    let pico = -Infinity;
    const datos: Data[] = resultados.map((r, i) => {
      const espectro = servicioGraficas.calcularEspectro(r, "modulada", VENTANA_COMPARACION);
      const y = espectro.amplitudes.map((a) => amplitudADecibelios(a));
      for (let k = 0; k < y.length; k++) if (y[k] > pico) pico = y[k];
      return {
        type: servicioGraficas.tipoTraza(y.length),
        mode: "lines",
        x: espectro.frecuencias.map((f) => f * escala.factor),
        y,
        name: `${i + 1}. ${this.etiquetaEntrada(r.entrada)}`,
        line: { color: this.colorDe(i), width: 1.4 },
      };
    });
    const diseno = servicioGraficas.disenoBase({
      tituloX: `Frecuencia [${escala.etiqueta}]`,
      tituloY: "Amplitud [dBV] (ventana Hann)",
      altura: temaGraficas.alturaComparacion,
    });
    diseno.hovermode = "closest";
    diseno.xaxis = { ...diseno.xaxis, range: [minimo * escala.factor, maximo * escala.factor], autorange: false };
    diseno.yaxis = { ...diseno.yaxis, range: [pico - 90, pico + 6], autorange: false };
    diseno.legend = { ...diseno.legend, y: -0.32, yanchor: "top" };
    diseno.height = temaGraficas.alturaComparacion + 22 * resultados.length;
    return { datos, diseno };
  }
}

export const servicioComparacion = new ServicioComparacion();
