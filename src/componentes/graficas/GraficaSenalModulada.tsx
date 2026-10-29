"use client";

import { useMemo } from "react";
import { Insignia, Tarjeta } from "@/componentes/interfaz/Tarjeta";
import { coloresSenales } from "@/configuracion/configuracionGraficas";
import { servicioGraficas } from "@/servicios/ServicioGraficas";
import { GraficaPlotly } from "./GraficaPlotly";
import type { PropiedadesGraficaTiempo } from "./GraficaSenalModuladora";

/** Gráfica principal del laboratorio. */
export function GraficaSenalModulada({ resultado, rango, alCambiarRango }: PropiedadesGraficaTiempo) {
  const figura = useMemo(() => servicioGraficas.figuraModulada(resultado, rango), [resultado, rango]);
  const sobremodulada = resultado.regionesSobremodulacion.length > 0;
  return (
    <Tarjeta
      titulo="Señal modulada s(t)"
      color={coloresSenales.modulada}
      subtitulo={resultado.nombreVariante}
      acciones={sobremodulada ? <Insignia tono="error">Sobremodulación</Insignia> : undefined}
      className="border-senal-modulada/25"
    >
      <GraficaPlotly datos={figura.datos} diseno={figura.diseno} identificador="modulada" alCambiarRangoX={alCambiarRango} />
    </Tarjeta>
  );
}
