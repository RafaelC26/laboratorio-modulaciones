"use client";

import { useMemo } from "react";
import type { ResultadoSimulacion } from "@/clases/ResultadoSimulacion";
import { CampoSeleccion, SelectorSegmentado } from "@/componentes/controles/CampoSeleccion";
import { Tarjeta } from "@/componentes/interfaz/Tarjeta";
import { coloresSenales, ventanasDisponibles } from "@/configuracion/configuracionGraficas";
import { servicioGraficas } from "@/servicios/ServicioGraficas";
import type { AnalisisEspectral, EscalaEspectro, EstadoVisualizacion, ResultadoEspectro, SenalEspectro, TipoVentana } from "@/tipos/tiposGraficas";
import { formatearConUnidad } from "@/utilidades/formatoNumerico";
import { GraficaPlotly } from "./GraficaPlotly";

interface PropiedadesGraficaEspectral {
  resultado: ResultadoSimulacion;
  espectro: ResultadoEspectro;
  analisis: AnalisisEspectral | null;
  visualizacion: EstadoVisualizacion;
  actualizar: (cambios: Partial<EstadoVisualizacion>) => void;
}

/** Contenido frecuencial de la señal elegida (FFT, espectro de un lado). */
export function GraficaEspectral({ resultado, espectro, analisis, visualizacion, actualizar }: PropiedadesGraficaEspectral) {
  const figura = useMemo(
    () =>
      servicioGraficas.figuraEspectro(resultado, espectro, {
        escala: visualizacion.escalaEspectro,
        mostrarTeorico: visualizacion.mostrarTeorico,
        senal: visualizacion.senalEspectro,
      }),
    [resultado, espectro, visualizacion.escalaEspectro, visualizacion.mostrarTeorico, visualizacion.senalEspectro],
  );
  const hayTeoricos = resultado.componentesTeoricos.length > 0 || resultado.marcasFrecuencia.length > 0;

  return (
    <Tarjeta
      titulo="Espectro de amplitud"
      color={coloresSenales.teorico}
      subtitulo={`FFT de ${espectro.cantidadMuestras.toLocaleString("es")} puntos · Δf = ${formatearConUnidad(espectro.resolucion, "Hz")}`}
      acciones={
        <SelectorSegmentado<EscalaEspectro>
          etiqueta="Escala del espectro"
          valor={visualizacion.escalaEspectro}
          opciones={[
            { valor: "lineal", etiqueta: "Lineal" },
            { valor: "decibelios", etiqueta: "dB" },
          ]}
          alCambiar={(escala) => actualizar({ escalaEspectro: escala })}
        />
      }
    >
      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <CampoSeleccion<SenalEspectro>
          etiqueta="Señal analizada"
          valor={visualizacion.senalEspectro}
          opciones={[
            { valor: "modulada", etiqueta: "Modulada s(t)" },
            { valor: "moduladora", etiqueta: resultado.parametros.esDigital ? "Secuencia b(t)" : "Moduladora m(t)" },
            { valor: "portadora", etiqueta: "Portadora c(t)" },
          ]}
          alCambiar={(senal) => actualizar({ senalEspectro: senal })}
        />
        <CampoSeleccion<TipoVentana>
          etiqueta="Ventana"
          valor={visualizacion.ventana}
          opciones={ventanasDisponibles.map((v) => ({ valor: v.valor, etiqueta: v.nombre }))}
          alCambiar={(ventana) => actualizar({ ventana })}
        />
        {hayTeoricos && (
          <label className="col-span-2 flex items-center gap-2 pb-1.5 text-xs text-slate-300 sm:col-span-1">
            <input
              type="checkbox"
              checked={visualizacion.mostrarTeorico}
              onChange={(e) => actualizar({ mostrarTeorico: e.target.checked })}
              className="size-3.5 accent-amber-400"
            />
            Valores teóricos
          </label>
        )}
      </div>
      <GraficaPlotly datos={figura.datos} diseno={figura.diseno} identificador="espectro" />
      {analisis && (
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">Componente principal</dt>
            <dd className="font-mono text-slate-200">{formatearConUnidad(analisis.frecuenciaPico, "Hz")}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Amplitud del pico</dt>
            <dd className="font-mono text-slate-200">{formatearConUnidad(analisis.amplitudPico, "V")}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Centroide espectral</dt>
            <dd className="font-mono text-slate-200">{formatearConUnidad(analisis.frecuenciaCentroide, "Hz")}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Ancho de banda (99 % potencia)</dt>
            <dd className="font-mono text-slate-200">{formatearConUnidad(analisis.anchoBandaOcupado, "Hz")}</dd>
          </div>
        </dl>
      )}
    </Tarjeta>
  );
}
