"use client";

import { useMemo } from "react";
import type { ResultadoSimulacion } from "@/clases/ResultadoSimulacion";
import { EcuacionModulacion } from "@/componentes/ecuaciones/EcuacionModulacion";
import { Tarjeta } from "@/componentes/interfaz/Tarjeta";
import { coloresSenales } from "@/configuracion/configuracionGraficas";
import { servicioGraficas, type RangoTiempo } from "@/servicios/ServicioGraficas";
import { GraficaPlotly } from "./GraficaPlotly";

export interface PropiedadesGraficaTiempo {
  resultado: ResultadoSimulacion;
  rango: RangoTiempo;
  alCambiarRango: (rango: RangoTiempo) => void;
}

function subtitulo(resultado: ResultadoSimulacion): string {
  switch (resultado.tipo) {
    case "AM":
      return String.raw`v_m(t)=V_m\operatorname{sen}(2\pi f_m t)`;
    case "PSM":
      return String.raw`v_m(t)=V_m\operatorname{sen}(2\pi f_m t)\ \text{y}\ f_i(t)`;
    case "ASK":
      return String.raw`v_m(t)\in\{1,0\}`;
    case "PSK":
      return resultado.parametros.ordenModulacion === 2
        ? String.raw`v_m(t)\in\{1,-1\}\ \text{y fase}\ \phi_i`
        : String.raw`\text{señal multinivel y fase}\ \phi_i`;
  }
}

export function GraficaSenalModuladora({ resultado, rango, alCambiarRango }: PropiedadesGraficaTiempo) {
  const figura = useMemo(() => servicioGraficas.figuraModuladora(resultado, rango), [resultado, rango]);
  const digital = resultado.parametros.esDigital;
  return (
    <Tarjeta
      titulo={digital ? "Señal moduladora (datos)" : "Señal moduladora"}
      color={coloresSenales.moduladora}
      subtitulo={<EcuacionModulacion latex={subtitulo(resultado)} enLinea className="ecuacion-pequena" />}
    >
      <GraficaPlotly datos={figura.datos} diseno={figura.diseno} identificador="moduladora" alCambiarRangoX={alCambiarRango} />
    </Tarjeta>
  );
}
