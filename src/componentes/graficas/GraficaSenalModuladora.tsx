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

const SUBTITULOS: Record<string, string> = {
  AM: String.raw`m(t)=A_m\cos(2\pi f_m t)`,
  PSM: String.raw`m(t)=A_m\cos(2\pi f_m t)\ \text{y}\ f_i(t)`,
  ASK: String.raw`b(t)\in\{0,1\}`,
  PSK: String.raw`b(t)\ \text{y fase}\ \phi_i`,
};

export function GraficaSenalModuladora({ resultado, rango, alCambiarRango }: PropiedadesGraficaTiempo) {
  const figura = useMemo(() => servicioGraficas.figuraModuladora(resultado, rango), [resultado, rango]);
  const digital = resultado.parametros.esDigital;
  return (
    <Tarjeta
      titulo={digital ? "Señal de información (secuencia digital)" : "Señal moduladora"}
      color={coloresSenales.moduladora}
      subtitulo={<EcuacionModulacion latex={SUBTITULOS[resultado.tipo]} enLinea className="ecuacion-pequena" />}
    >
      <GraficaPlotly datos={figura.datos} diseno={figura.diseno} identificador="moduladora" alCambiarRangoX={alCambiarRango} />
    </Tarjeta>
  );
}
