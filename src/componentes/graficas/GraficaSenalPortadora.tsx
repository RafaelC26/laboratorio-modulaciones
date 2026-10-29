"use client";

import { useMemo } from "react";
import { EcuacionModulacion } from "@/componentes/ecuaciones/EcuacionModulacion";
import { Tarjeta } from "@/componentes/interfaz/Tarjeta";
import { coloresSenales } from "@/configuracion/configuracionGraficas";
import { formulaPortadora } from "@/formulas/formulasPortadora";
import { servicioGraficas } from "@/servicios/ServicioGraficas";
import { GraficaPlotly } from "./GraficaPlotly";
import type { PropiedadesGraficaTiempo } from "./GraficaSenalModuladora";

export function GraficaSenalPortadora({ resultado, rango, alCambiarRango }: PropiedadesGraficaTiempo) {
  const figura = useMemo(() => servicioGraficas.figuraPortadora(resultado, rango), [resultado, rango]);
  return (
    <Tarjeta
      titulo={resultado.tipo === "PSK" ? "Portadora de referencia (fase 0)" : "Señal portadora"}
      color={coloresSenales.portadora}
      subtitulo={<EcuacionModulacion latex={formulaPortadora.ecuacion} enLinea className="ecuacion-pequena" />}
    >
      <GraficaPlotly datos={figura.datos} diseno={figura.diseno} identificador="portadora" alCambiarRangoX={alCambiarRango} />
    </Tarjeta>
  );
}
