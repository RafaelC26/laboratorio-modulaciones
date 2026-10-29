import type { Annotations, Data, Layout, LayoutAxis, Shape } from "plotly.js";
import type { ResultadoSimulacion } from "@/clases/ResultadoSimulacion";
import type { SenalAnalogica } from "@/clases/SenalAnalogica";
import {
  coloresSenales,
  rangoDinamicoDecibelios,
  temaGraficas,
  umbralWebGL,
  ventanasDisponibles,
} from "@/configuracion/configuracionGraficas";
import { MotorTransformadaFourier } from "@/motores/MotorTransformadaFourier";
import type { AnalisisEspectral, EscalaEspectro, ResultadoEspectro, SenalEspectro, TipoVentana } from "@/tipos/tiposGraficas";
import type { SenalAuxiliarCalculada } from "@/tipos/tiposSimulacion";
import { amplitudADecibelios } from "@/utilidades/calculoDecibelios";
import {
  escalaFrecuenciaParaMaximo,
  escalaTiempoParaDuracion,
  normalizarAngulo,
  radianesAGrados,
  type UnidadVisual,
} from "@/utilidades/conversionUnidades";

export interface FiguraPlotly {
  datos: Data[];
  diseno: Partial<Layout>;
}

export type RangoTiempo = [number, number] | null;

interface OpcionesDiseno {
  tituloX: string;
  tituloY: string;
  altura: number;
  tituloY2?: string;
}

/** Máximo de etiquetas de bits y de líneas de límite de símbolo que se dibujan. */
const MAXIMO_ETIQUETAS_SIMBOLO = 48;
const MAXIMO_LIMITES_SIMBOLO = 200;

const cacheTiempo = new WeakMap<ResultadoSimulacion, Float64Array>();
const cacheEspectros = new WeakMap<ResultadoSimulacion, Map<string, ResultadoEspectro>>();

/**
 * Prepara los datos y el diseño de cada gráfica a partir de un resultado.
 * No calcula señales: solo transforma resultados ya calculados en figuras.
 */
export class ServicioGraficas {
  escalaTiempo(resultado: ResultadoSimulacion): UnidadVisual {
    return escalaTiempoParaDuracion(resultado.configuracion.duracion);
  }

  /** Vector de tiempo en la unidad del eje (ms, µs…). */
  ejeTiempo(resultado: ResultadoSimulacion): Float64Array {
    let valores = cacheTiempo.get(resultado);
    if (!valores) {
      const { factor } = this.escalaTiempo(resultado);
      valores = resultado.tiempo.map((t) => t * factor);
      cacheTiempo.set(resultado, valores);
    }
    return valores;
  }

  tipoTraza(cantidad: number): "scatter" | "scattergl" {
    return cantidad > umbralWebGL ? "scattergl" : "scatter";
  }

  disenoBase({ tituloX, tituloY, altura, tituloY2 }: OpcionesDiseno): Partial<Layout> {
    const eje: Partial<LayoutAxis> = {
      gridcolor: temaGraficas.colorRejilla,
      zerolinecolor: temaGraficas.colorEjeCero,
      linecolor: temaGraficas.colorEjeCero,
      tickcolor: temaGraficas.colorEjeCero,
      automargin: true,
    };
    const diseno: Partial<Layout> = {
      height: altura,
      autosize: true,
      margin: { l: 58, r: tituloY2 ? 62 : 18, t: 30, b: 44 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: temaGraficas.fondoGrafica,
      font: { family: temaGraficas.fuente, color: temaGraficas.colorTexto, size: 11 },
      hovermode: "x unified",
      hoverlabel: { bgcolor: "#161a23", bordercolor: "#343b4d", font: { color: "#e2e8f0", size: 11 } },
      legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", bgcolor: "rgba(0,0,0,0)", font: { size: 10 } },
      xaxis: { ...eje, title: { text: tituloX, standoff: 6 } },
      yaxis: { ...eje, title: { text: tituloY, standoff: 4 } },
      uirevision: "laboratorio",
      modebar: { bgcolor: "rgba(0,0,0,0)", color: "#64748b", activecolor: "#cbd5e1", orientation: "h" },
    };
    if (tituloY2) {
      diseno.yaxis2 = {
        ...eje,
        title: { text: tituloY2 },
        overlaying: "y",
        side: "right",
        showgrid: false,
        zeroline: false,
      };
    }
    return diseno;
  }

  private aplicarRango(diseno: Partial<Layout>, resultado: ResultadoSimulacion, rango: RangoTiempo): void {
    const { factor } = this.escalaTiempo(resultado);
    diseno.xaxis = rango
      ? { ...diseno.xaxis, range: [rango[0] * factor, rango[1] * factor], autorange: false }
      : { ...diseno.xaxis, autorange: true };
  }

  private trazaSenal(resultado: ResultadoSimulacion, senal: SenalAnalogica, color: string, nombreCorto: string): Data {
    return {
      type: this.tipoTraza(senal.cantidadMuestras),
      mode: "lines",
      x: this.ejeTiempo(resultado),
      y: senal.amplitudes,
      name: senal.nombre,
      line: { color, width: 1.8 },
      hovertemplate: `%{y:.4g} ${senal.unidad}<extra>${nombreCorto}</extra>`,
    };
  }

  private trazaAuxiliar(resultado: ResultadoSimulacion, auxiliar: SenalAuxiliarCalculada): Data {
    const esEnvolvente = auxiliar.estilo === "envolvente";
    return {
      type: this.tipoTraza(auxiliar.senal.cantidadMuestras),
      mode: "lines",
      x: this.ejeTiempo(resultado),
      y: auxiliar.senal.amplitudes,
      name: auxiliar.senal.nombre,
      yaxis: auxiliar.ejeSecundario ? "y2" : "y",
      line: {
        color: esEnvolvente ? coloresSenales.envolvente : coloresSenales.secundaria,
        width: esEnvolvente ? 1.2 : 1.5,
        dash: esEnvolvente ? "dash" : "dot",
      },
      hovertemplate: `%{y:.4g} ${auxiliar.senal.unidad}<extra>${auxiliar.senal.nombre}</extra>`,
    };
  }

  /** Líneas verticales punteadas en los límites de cada símbolo. */
  private formasLimitesSimbolo(resultado: ResultadoSimulacion): Partial<Shape>[] {
    const intervalos = resultado.intervalosSimbolo;
    if (intervalos.length < 2 || intervalos.length > MAXIMO_LIMITES_SIMBOLO) return [];
    const { factor } = this.escalaTiempo(resultado);
    return intervalos.slice(1).map((intervalo) => ({
      type: "line",
      xref: "x",
      yref: "paper",
      x0: intervalo.inicio * factor,
      x1: intervalo.inicio * factor,
      y0: 0,
      y1: 1,
      line: { color: coloresSenales.limiteSimbolo, width: 1, dash: "dot" },
      layer: "below",
    }));
  }

  /** Etiqueta de bits encima de cada símbolo. */
  private anotacionesSimbolos(resultado: ResultadoSimulacion): Partial<Annotations>[] {
    const intervalos = resultado.intervalosSimbolo;
    if (!intervalos.length || intervalos.length > MAXIMO_ETIQUETAS_SIMBOLO) return [];
    const { factor } = this.escalaTiempo(resultado);
    return intervalos.map((intervalo) => ({
      x: ((intervalo.inicio + intervalo.fin) / 2) * factor,
      y: 0.98,
      xref: "x",
      yref: "paper",
      yanchor: "top",
      text: intervalo.etiqueta,
      showarrow: false,
      font: { family: "JetBrains Mono, ui-monospace, monospace", size: 11, color: "#e2e8f0" },
      bgcolor: "rgba(79, 140, 255, 0.18)",
      borderpad: 2,
    }));
  }

  figuraModuladora(resultado: ResultadoSimulacion, rango: RangoTiempo): FiguraPlotly {
    const digital = resultado.parametros.esDigital;
    const auxiliares = resultado.auxiliares.filter((a) => a.grafica === "moduladora");
    const secundario = auxiliares.find((a) => a.ejeSecundario);
    const { etiqueta } = this.escalaTiempo(resultado);

    const datos: Data[] = [
      this.trazaSenal(resultado, resultado.senalModuladora, coloresSenales.moduladora, digital ? "b(t)" : "m(t)"),
      ...auxiliares.map((a) => this.trazaAuxiliar(resultado, a)),
    ];
    const diseno = this.disenoBase({
      tituloX: `Tiempo [${etiqueta}]`,
      tituloY: digital ? "b(t)" : "m(t) [V]",
      altura: temaGraficas.alturaTiempo,
      tituloY2: secundario?.tituloEje,
    });
    if (digital) {
      diseno.yaxis = { ...diseno.yaxis, range: [-0.25, 1.55], tickvals: [0, 1], autorange: false };
      diseno.shapes = this.formasLimitesSimbolo(resultado);
      diseno.annotations = this.anotacionesSimbolos(resultado);
    }
    if (secundario && resultado.tipo === "PSK") {
      const fases = [...new Set(resultado.constelacion.map((p) => Math.round(radianesAGrados(normalizarAngulo(p.fase)) * 100) / 100))].sort((a, b) => a - b);
      diseno.yaxis2 = {
        ...diseno.yaxis2,
        range: [-20, 420],
        autorange: false,
        tickvals: fases.length <= 8 ? fases : [0, 90, 180, 270, 360],
        ticksuffix: "°",
      };
    }
    this.aplicarRango(diseno, resultado, rango);
    return { datos, diseno };
  }

  figuraPortadora(resultado: ResultadoSimulacion, rango: RangoTiempo): FiguraPlotly {
    const { etiqueta } = this.escalaTiempo(resultado);
    const diseno = this.disenoBase({ tituloX: `Tiempo [${etiqueta}]`, tituloY: "c(t) [V]", altura: temaGraficas.alturaTiempo });
    diseno.shapes = this.formasLimitesSimbolo(resultado);
    this.aplicarRango(diseno, resultado, rango);
    return { datos: [this.trazaSenal(resultado, resultado.senalPortadora, coloresSenales.portadora, "c(t)")], diseno };
  }

  figuraModulada(resultado: ResultadoSimulacion, rango: RangoTiempo): FiguraPlotly {
    const { etiqueta, factor } = this.escalaTiempo(resultado);
    const auxiliares = resultado.auxiliares.filter((a) => a.grafica === "modulada");
    const datos: Data[] = [
      this.trazaSenal(resultado, resultado.senalModulada, coloresSenales.modulada, "s(t)"),
      ...auxiliares.map((a) => this.trazaAuxiliar(resultado, a)),
    ];
    const diseno = this.disenoBase({ tituloX: `Tiempo [${etiqueta}]`, tituloY: "s(t) [V]", altura: temaGraficas.alturaTiempo + 30 });

    const regiones: Partial<Shape>[] = resultado.regionesSobremodulacion.map(([inicio, fin]) => ({
      type: "rect",
      xref: "x",
      yref: "paper",
      x0: inicio * factor,
      x1: fin * factor,
      y0: 0,
      y1: 1,
      fillcolor: coloresSenales.sobremodulacion,
      line: { width: 0 },
      layer: "below",
    }));
    diseno.shapes = [...regiones, ...this.formasLimitesSimbolo(resultado)];
    if (regiones.length) {
      diseno.annotations = [
        {
          x: 1,
          y: 1,
          xref: "paper",
          yref: "paper",
          xanchor: "right",
          yanchor: "bottom",
          text: "Zonas rojas: sobremodulación (1 + μ·m(t) < 0)",
          showarrow: false,
          font: { size: 10, color: coloresSenales.error },
        },
      ];
    }
    this.aplicarRango(diseno, resultado, rango);
    return { datos, diseno };
  }

  calcularEspectro(resultado: ResultadoSimulacion, senal: SenalEspectro, ventana: TipoVentana): ResultadoEspectro {
    let porResultado = cacheEspectros.get(resultado);
    if (!porResultado) {
      porResultado = new Map();
      cacheEspectros.set(resultado, porResultado);
    }
    const clave = `${senal}|${ventana}`;
    let espectro = porResultado.get(clave);
    if (!espectro) {
      espectro = MotorTransformadaFourier.espectroAmplitud(resultado.obtenerSenal(senal).amplitudes, resultado.frecuenciaMuestreo, ventana);
      porResultado.set(clave, espectro);
    }
    return espectro;
  }

  analizarEspectro(espectro: ResultadoEspectro): AnalisisEspectral {
    return MotorTransformadaFourier.analizar(espectro);
  }

  /** Intervalo de frecuencias que se muestra inicialmente en el espectro [Hz]. */
  rangoFrecuenciaSugerido(resultado: ResultadoSimulacion, senal: SenalEspectro): [number, number] {
    const nyquist = resultado.frecuenciaMuestreo / 2;
    const fc = resultado.resumen.frecuenciaCentral;
    const ancho = Math.max(resultado.resumen.anchoBandaEstimado, 1e-12);
    let rango: [number, number];
    if (senal === "modulada") {
      rango = [Math.max(0, fc - 3 * ancho), fc + 3 * ancho];
    } else if (senal === "portadora") {
      rango = [0, 2 * fc];
    } else {
      const referencia = resultado.parametros.esDigital ? resultado.parametros.tasaBits : resultado.parametros.frecuenciaModuladora;
      rango = [0, 8 * referencia];
    }
    return [rango[0], Math.min(rango[1], nyquist)];
  }

  figuraEspectro(
    resultado: ResultadoSimulacion,
    espectro: ResultadoEspectro,
    opciones: { escala: EscalaEspectro; mostrarTeorico: boolean; senal: SenalEspectro },
  ): FiguraPlotly {
    const sugerido = this.rangoFrecuenciaSugerido(resultado, opciones.senal);
    const escalaF = escalaFrecuenciaParaMaximo(sugerido[1]);
    const enDecibelios = opciones.escala === "decibelios";
    const convertir = (amplitud: number) => (enDecibelios ? amplitudADecibelios(amplitud) : amplitud);
    const colores: Record<SenalEspectro, string> = {
      modulada: coloresSenales.modulada,
      moduladora: coloresSenales.moduladora,
      portadora: coloresSenales.portadora,
    };
    const nombreVentana = ventanasDisponibles.find((v) => v.valor === espectro.ventana)?.nombre ?? espectro.ventana;
    const y = espectro.amplitudes.map(convertir);

    const datos: Data[] = [
      {
        type: this.tipoTraza(espectro.amplitudes.length),
        mode: "lines",
        x: espectro.frecuencias.map((f) => f * escalaF.factor),
        y,
        name: `|S(f)| medido (FFT, ventana ${nombreVentana})`,
        line: { color: colores[opciones.senal], width: 1.6 },
        fill: enDecibelios ? "none" : "tozeroy",
        fillcolor: "rgba(34, 211, 238, 0.08)",
        hovertemplate: `%{x:.5g} ${escalaF.etiqueta}: %{y:.4g} ${enDecibelios ? "dBV" : "V"}<extra></extra>`,
      },
    ];

    if (opciones.mostrarTeorico && opciones.senal === "modulada" && resultado.componentesTeoricos.length) {
      const componentes = resultado.componentesTeoricos;
      datos.push({
        type: "scatter",
        mode: "markers",
        x: componentes.map((c) => c.frecuencia * escalaF.factor),
        y: componentes.map((c) => convertir(c.amplitud)),
        text: componentes.map((c) => c.etiqueta),
        name: "Valor teórico",
        marker: { symbol: "diamond-open", size: 10, color: coloresSenales.teorico, line: { width: 2 } },
        hovertemplate: `%{text}<br>%{x:.5g} ${escalaF.etiqueta}: %{y:.4g} ${enDecibelios ? "dBV" : "V"}<extra>Teórico</extra>`,
      });
    }

    const diseno = this.disenoBase({
      tituloX: `Frecuencia [${escalaF.etiqueta}]`,
      tituloY: enDecibelios ? "Amplitud [dBV]" : "Amplitud [V]",
      altura: temaGraficas.alturaEspectro,
    });
    diseno.hovermode = "closest";
    diseno.xaxis = { ...diseno.xaxis, range: [sugerido[0] * escalaF.factor, sugerido[1] * escalaF.factor], autorange: false };
    if (enDecibelios) {
      let maximo = -Infinity;
      for (let i = 0; i < y.length; i++) if (y[i] > maximo) maximo = y[i];
      diseno.yaxis = { ...diseno.yaxis, range: [maximo - rangoDinamicoDecibelios, maximo + 6], autorange: false };
    }
    if (opciones.senal === "modulada" && opciones.mostrarTeorico) {
      diseno.shapes = resultado.marcasFrecuencia.map((marca) => ({
        type: "line",
        xref: "x",
        yref: "paper",
        x0: marca.frecuencia * escalaF.factor,
        x1: marca.frecuencia * escalaF.factor,
        y0: 0,
        y1: 1,
        line: { color: coloresSenales.teorico, width: 1, dash: "dash" },
        layer: "below",
      }));
      diseno.annotations = resultado.marcasFrecuencia.map((marca) => ({
        x: marca.frecuencia * escalaF.factor,
        y: 1,
        xref: "x",
        yref: "paper",
        yanchor: "bottom",
        text: marca.etiqueta,
        showarrow: false,
        font: { size: 10, color: coloresSenales.teorico },
      }));
    }
    return { datos, diseno };
  }

  /** Diagrama de constelación (null para técnicas analógicas). */
  figuraConstelacion(resultado: ResultadoSimulacion): FiguraPlotly | null {
    const puntos = resultado.constelacion;
    if (!puntos.length) return null;
    const amplitudMaxima = Math.max(...puntos.map((p) => Math.hypot(p.enFase, p.cuadratura)), 1e-6);
    const limite = amplitudMaxima * 1.45;
    const transmitidos = puntos.filter((p) => p.repeticiones > 0);
    const datosPunto = (p: (typeof puntos)[number]) => [p.indiceEstado, radianesAGrados(normalizarAngulo(p.fase)), p.repeticiones];

    const datos: Data[] = [
      {
        type: "scatter",
        mode: "text+markers",
        x: puntos.map((p) => p.enFase),
        y: puntos.map((p) => p.cuadratura),
        text: puntos.map((p) => p.etiqueta),
        customdata: puntos.map(datosPunto),
        textposition: "top center",
        textfont: { family: "JetBrains Mono, ui-monospace, monospace", size: 12, color: "#e2e8f0" },
        name: "Estados posibles",
        marker: { size: 12, color: "rgba(0,0,0,0)", line: { color: coloresSenales.idealConstelacion, width: 1.5 } },
        hovertemplate: "Estado i = %{customdata[0]}<br>Bits: %{text}<br>φ = %{customdata[1]:.2f}°<br>I = %{x:.4g} V, Q = %{y:.4g} V<extra></extra>",
      },
      {
        type: "scatter",
        mode: "markers",
        x: transmitidos.map((p) => p.enFase),
        y: transmitidos.map((p) => p.cuadratura),
        text: transmitidos.map((p) => p.etiqueta),
        customdata: transmitidos.map(datosPunto),
        name: "Símbolos transmitidos",
        marker: { size: transmitidos.map((p) => 9 + 3 * Math.sqrt(p.repeticiones)), color: coloresSenales.modulada, opacity: 0.9 },
        hovertemplate: "Bits %{text}: transmitido %{customdata[2]} vez/veces<extra></extra>",
      },
    ];

    const diseno = this.disenoBase({ tituloX: "I (en fase) [V]", tituloY: "Q (cuadratura) [V]", altura: temaGraficas.alturaConstelacion });
    diseno.hovermode = "closest";
    diseno.xaxis = { ...diseno.xaxis, range: [-limite, limite], autorange: false, zeroline: true };
    diseno.yaxis = { ...diseno.yaxis, range: [-limite, limite], autorange: false, zeroline: true, scaleanchor: "x", scaleratio: 1 };
    if (resultado.tipo === "PSK") {
      const radio = resultado.parametros.amplitudPortadora;
      diseno.shapes = [
        {
          type: "circle",
          xref: "x",
          yref: "y",
          x0: -radio,
          y0: -radio,
          x1: radio,
          y1: radio,
          line: { color: coloresSenales.limiteSimbolo, width: 1, dash: "dot" },
          layer: "below",
        },
      ];
    }
    return { datos, diseno };
  }
}

export const servicioGraficas = new ServicioGraficas();
