"use client";

import { useEffect, useRef, useState } from "react";
import type { Config, Data, Layout, PlotlyHTMLElement } from "plotly.js";
import { servicioExportacion } from "@/servicios/ServicioExportacion";
import type { RangoTiempo } from "@/servicios/ServicioGraficas";
import { cargarPlotly } from "@/utilidades/cargadorPlotly";

interface PropiedadesGraficaPlotly {
  datos: Data[];
  diseno: Partial<Layout>;
  /** Identificador único: nombre del PNG exportado y registro para "Exportar gráficas". */
  identificador: string;
  /** Recibe el rango del eje x (en sus unidades) cuando el usuario hace zoom; null al restablecer. */
  alCambiarRangoX?: (rango: RangoTiempo) => void;
}

const configuracionBase: Partial<Config> = {
  responsive: true,
  displaylogo: false,
  scrollZoom: false,
  modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d"],
};

function extraerRangoX(evento: Record<string, unknown>): RangoTiempo | undefined {
  if (evento["xaxis.autorange"] === true) return null;
  const inicio = evento["xaxis.range[0]"];
  const fin = evento["xaxis.range[1]"];
  if (typeof inicio === "number" && typeof fin === "number") return [inicio, fin];
  const rango = evento["xaxis.range"];
  if (Array.isArray(rango) && rango.length === 2) return [Number(rango[0]), Number(rango[1])];
  return undefined;
}

/**
 * Envoltorio de Plotly.js para React: dibuja con Plotly.react (actualización
 * incremental), se adapta al tamaño del contenedor y libera la gráfica al desmontarse.
 */
export function GraficaPlotly({ datos, diseno, identificador, alCambiarRangoX }: PropiedadesGraficaPlotly) {
  const contenedor = useRef<HTMLDivElement>(null);
  const callbackRango = useRef(alCambiarRangoX);
  const eventosRegistrados = useRef(false);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useEffect(() => {
    callbackRango.current = alCambiarRangoX;
  }, [alCambiarRangoX]);

  useEffect(() => {
    const elemento = contenedor.current;
    if (!elemento) return;
    let cancelado = false;
    cargarPlotly()
      .then(async (Plotly) => {
        if (cancelado) return;
        await Plotly.react(elemento, datos, diseno, {
          ...configuracionBase,
          toImageButtonOptions: { format: "png", filename: identificador, scale: 2 } as Config["toImageButtonOptions"],
        });
        if (cancelado) return;
        setCargando(false);
        if (!eventosRegistrados.current) {
          eventosRegistrados.current = true;
          (elemento as unknown as PlotlyHTMLElement).on("plotly_relayout", (evento) => {
            const rango = extraerRangoX(evento as unknown as Record<string, unknown>);
            if (rango !== undefined) callbackRango.current?.(rango);
          });
        }
      })
      .catch((error: unknown) => setErrorCarga(error instanceof Error ? error.message : String(error)));
    return () => {
      cancelado = true;
    };
  }, [datos, diseno, identificador]);

  useEffect(() => {
    const elemento = contenedor.current;
    if (!elemento) return;
    servicioExportacion.registrarGrafica(identificador, elemento);
    const observador = new ResizeObserver(() => {
      cargarPlotly().then((Plotly) => {
        if (elemento.isConnected && (elemento as unknown as { _fullLayout?: unknown })._fullLayout) {
          void Plotly.Plots.resize(elemento);
        }
      });
    });
    observador.observe(elemento);
    return () => {
      observador.disconnect();
      servicioExportacion.eliminarGrafica(identificador);
      eventosRegistrados.current = false;
      cargarPlotly().then((Plotly) => Plotly.purge(elemento));
    };
  }, [identificador]);

  return (
    <div className="relative w-full" style={{ minHeight: diseno.height }}>
      {cargando && !errorCarga && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">Cargando gráfica…</div>
      )}
      {errorCarga && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-red-300">No se pudo cargar Plotly: {errorCarga}</div>
      )}
      <div ref={contenedor} className="w-full" />
    </div>
  );
}
