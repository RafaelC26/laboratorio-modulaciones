"use client";

import { useMemo } from "react";
import type { ResultadoSimulacion } from "@/clases/ResultadoSimulacion";
import { SelectorSegmentado } from "@/componentes/controles/CampoSeleccion";
import { Tarjeta } from "@/componentes/interfaz/Tarjeta";
import { coloresSenales } from "@/configuracion/configuracionGraficas";
import { servicioGraficas } from "@/servicios/ServicioGraficas";
import type { EscalaEspectro, EstadoVisualizacion, ResultadoEspectro } from "@/tipos/tiposGraficas";
import { GraficaPlotly } from "./GraficaPlotly";

interface PropiedadesGraficaEspectral {
  resultado: ResultadoSimulacion;
  espectro: ResultadoEspectro;
  visualizacion: EstadoVisualizacion;
  actualizar: (cambios: Partial<EstadoVisualizacion>) => void;
}

/** Contenido frecuencial de la señal modulada (espectro de un lado). */
export function GraficaEspectral({ resultado, espectro, visualizacion, actualizar }: PropiedadesGraficaEspectral) {
  const figura = useMemo(
    () =>
      servicioGraficas.figuraEspectro(resultado, espectro, {
        escala: visualizacion.escalaEspectro,
        mostrarTeorico: visualizacion.mostrarTeorico,
        senal: "modulada",
      }),
    [resultado, espectro, visualizacion.escalaEspectro, visualizacion.mostrarTeorico],
  );
  const hayTeoricos = resultado.componentesTeoricos.length > 0 || resultado.marcasFrecuencia.length > 0;

  return (
    <Tarjeta
      titulo="Espectro de amplitud"
      color={coloresSenales.teorico}
      subtitulo="Señal modulada v(t)"
      acciones={
        <>
          {hayTeoricos && (
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={visualizacion.mostrarTeorico}
                onChange={(e) => actualizar({ mostrarTeorico: e.target.checked })}
                className="size-3.5 accent-amber-400"
              />
              Valores teóricos
            </label>
          )}
          <SelectorSegmentado<EscalaEspectro>
            etiqueta="Escala del espectro"
            valor={visualizacion.escalaEspectro}
            opciones={[
              { valor: "lineal", etiqueta: "Lineal" },
              { valor: "decibelios", etiqueta: "dB" },
            ]}
            alCambiar={(escala) => actualizar({ escalaEspectro: escala })}
          />
        </>
      }
    >
      <GraficaPlotly datos={figura.datos} diseno={figura.diseno} identificador="espectro" />
    </Tarjeta>
  );
}
