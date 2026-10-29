import type { ResultadoSimulacion } from "@/clases/ResultadoSimulacion";
import { configuracionGeneral, obtenerDescripcionTecnica } from "@/configuracion/configuracionGeneral";
import { obtenerConjuntoFormulas } from "@/formulas/repositorioFormulas";
import { cargarPlotly } from "@/utilidades/cargadorPlotly";
import { formatearConUnidad, formatearDuracionCalculo, formatearNumero } from "@/utilidades/formatoNumerico";

const graficasRegistradas = new Map<string, HTMLElement>();

function valorCSV(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : String(Number(valor.toPrecision(12)));
}

function marcaTemporal(fecha: Date): string {
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}${dos(fecha.getMonth() + 1)}${dos(fecha.getDate())}-${dos(fecha.getHours())}${dos(fecha.getMinutes())}${dos(fecha.getSeconds())}`;
}

/**
 * Exportación de resultados: datos CSV, parámetros JSON, reporte Markdown e
 * imágenes PNG de las gráficas (sección 13.4).
 */
export class ServicioExportacion {
  registrarGrafica(identificador: string, elemento: HTMLElement): void {
    graficasRegistradas.set(identificador, elemento);
  }

  eliminarGrafica(identificador: string): void {
    graficasRegistradas.delete(identificador);
  }

  nombreBase(resultado: ResultadoSimulacion): string {
    return `simulacion-${resultado.tipo.toLowerCase()}-${marcaTemporal(resultado.fechaEjecucion)}`;
  }

  generarCSV(resultado: ResultadoSimulacion): string {
    const columnas = [
      { titulo: "t [s]", valores: resultado.tiempo },
      { titulo: `${resultado.senalModuladora.nombre} [${resultado.senalModuladora.unidad}]`, valores: resultado.senalModuladora.amplitudes },
      { titulo: `${resultado.senalPortadora.nombre} [V]`, valores: resultado.senalPortadora.amplitudes },
      { titulo: `${resultado.senalModulada.nombre} [V]`, valores: resultado.senalModulada.amplitudes },
      ...resultado.auxiliares.map((a) => ({ titulo: `${a.senal.nombre} [${a.senal.unidad}]`, valores: a.senal.amplitudes })),
    ];
    const lineas = [columnas.map((c) => `"${c.titulo.replace(/"/g, "'")}"`).join(",")];
    for (let n = 0; n < resultado.cantidadMuestras; n++) {
      lineas.push(columnas.map((c) => valorCSV(c.valores[n])).join(","));
    }
    return lineas.join("\n");
  }

  generarJSON(resultado: ResultadoSimulacion): string {
    return JSON.stringify(
      {
        aplicacion: configuracionGeneral.nombreAplicacion,
        version: configuracionGeneral.version,
        fecha: resultado.fechaEjecucion.toISOString(),
        tecnica: resultado.tipo,
        variante: resultado.nombreVariante,
        ecuacion: resultado.ecuacion,
        archivoFormulas: obtenerConjuntoFormulas(resultado.tipo).archivo,
        entrada: resultado.entrada,
        parametros: resultado.parametros.aObjetoPlano(),
        muestreo: {
          frecuenciaMuestreo: resultado.frecuenciaMuestreo,
          tiempoInicial: resultado.configuracion.tiempoInicial,
          tiempoFinal: resultado.configuracion.tiempoFinal,
          intervaloMuestreo: resultado.configuracion.intervaloMuestreo,
          cantidadMuestras: resultado.cantidadMuestras,
        },
        resumen: resultado.resumen,
        metricas: resultado.metricas,
        advertencias: resultado.advertencias.map((a) => a.mensaje),
      },
      null,
      2,
    );
  }

  generarReporte(resultado: ResultadoSimulacion): string {
    const formulas = obtenerConjuntoFormulas(resultado.tipo);
    const tecnica = obtenerDescripcionTecnica(resultado.tipo);
    const valorMetrica = (valor: number | string, unidad?: string) =>
      typeof valor === "number" ? (unidad ? formatearConUnidad(valor, unidad) : formatearNumero(valor)) : valor;
    const lineas = [
      `# Reporte de simulación — ${tecnica.nombre} (${tecnica.sigla})`,
      "",
      `- **Fecha:** ${resultado.fechaEjecucion.toLocaleString("es")}`,
      `- **Variante:** ${resultado.nombreVariante}`,
      `- **Archivo de fórmulas:** \`${formulas.archivo}\` (versión ${formulas.version})`,
      "",
      "## Ecuación aplicada",
      "",
      `$$${formulas.principal.ecuacion}$$`,
      "",
      "Con los valores de la simulación:",
      "",
      `$$${formulas.sustituir(resultado.parametros)}$$`,
      "",
      "## Parámetros",
      "",
      "| Variable | Descripción | Valor |",
      "|---|---|---|",
      ...formulas.principal.variables
        .filter((v) => v.valor)
        .map((v) => `| $${v.simbolo}$ | ${v.descripcion} | ${formatearConUnidad(v.valor!(resultado.parametros), v.unidad)} |`),
      ...(resultado.parametros.esDigital ? [`| — | Secuencia de bits | \`${resultado.parametros.secuenciaBits.join("")}\` |`] : []),
      "",
      "## Muestreo",
      "",
      `- Frecuencia de muestreo: ${formatearConUnidad(resultado.frecuenciaMuestreo, "Hz")}`,
      `- Intervalo: ${formatearConUnidad(resultado.configuracion.tiempoInicial, "s")} a ${formatearConUnidad(resultado.configuracion.tiempoFinal, "s")}`,
      `- Δt = ${formatearConUnidad(resultado.configuracion.intervaloMuestreo, "s")}, N = ${resultado.cantidadMuestras} muestras`,
      `- Tiempo de cálculo: ${formatearDuracionCalculo(resultado.tiempoSimulacion)}`,
      "",
      "## Resultados",
      "",
      "| Magnitud | Valor |",
      "|---|---|",
      ...resultado.metricas.map((m) => `| ${m.nombre} | ${valorMetrica(m.valor, m.unidad)} |`),
      "",
    ];
    if (resultado.advertencias.length) {
      lineas.push("## Advertencias", "", ...resultado.advertencias.map((a) => `- ${a.mensaje}`), "");
    }
    return lineas.join("\n");
  }

  descargar(nombreArchivo: string, contenido: string, tipoMime: string): void {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  exportarCSV(resultado: ResultadoSimulacion): void {
    this.descargar(`${this.nombreBase(resultado)}.csv`, this.generarCSV(resultado), "text/csv;charset=utf-8");
  }

  exportarJSON(resultado: ResultadoSimulacion): void {
    this.descargar(`${this.nombreBase(resultado)}.json`, this.generarJSON(resultado), "application/json");
  }

  exportarReporte(resultado: ResultadoSimulacion): void {
    this.descargar(`${this.nombreBase(resultado)}.md`, this.generarReporte(resultado), "text/markdown;charset=utf-8");
  }

  /** Descarga cada gráfica visible como PNG. Devuelve cuántas se exportaron. */
  async exportarGraficasPNG(prefijo: string): Promise<number> {
    const Plotly = await cargarPlotly();
    let exportadas = 0;
    for (const [identificador, elemento] of graficasRegistradas) {
      if (!elemento.isConnected) continue;
      await Plotly.downloadImage(elemento as Parameters<typeof Plotly.downloadImage>[0], {
        format: "png",
        filename: `${prefijo}-${identificador}`,
        width: Math.max(elemento.clientWidth, 600),
        height: Math.max(elemento.clientHeight, 300),
      });
      exportadas++;
    }
    return exportadas;
  }
}

export const servicioExportacion = new ServicioExportacion();
