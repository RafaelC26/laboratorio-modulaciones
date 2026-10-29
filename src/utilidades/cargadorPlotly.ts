/**
 * Carga diferida de Plotly (solo en el navegador). Plotly ocupa varios MB, así
 * que se descarga una única vez cuando la primera gráfica lo necesita.
 */
export type ModuloPlotly = typeof import("plotly.js-dist-min");

let promesaPlotly: Promise<ModuloPlotly> | null = null;

export function cargarPlotly(): Promise<ModuloPlotly> {
  if (!promesaPlotly) {
    promesaPlotly = import("plotly.js-dist-min").then(
      (modulo) => ((modulo as unknown as { default?: ModuloPlotly }).default ?? modulo) as ModuloPlotly,
    );
  }
  return promesaPlotly;
}
