"use client";

import { useMemo } from "react";
import type { ResultadoSimulacion } from "@/clases/ResultadoSimulacion";
import { EcuacionModulacion } from "@/componentes/ecuaciones/EcuacionModulacion";
import { Tarjeta } from "@/componentes/interfaz/Tarjeta";
import { coloresSenales } from "@/configuracion/configuracionGraficas";
import { servicioGraficas } from "@/servicios/ServicioGraficas";
import { GraficaPlotly } from "./GraficaPlotly";

/** Símbolos en el plano I/Q (solo técnicas digitales). */
export function GraficaConstelacion({ resultado }: { resultado: ResultadoSimulacion }) {
  const figura = useMemo(() => servicioGraficas.figuraConstelacion(resultado), [resultado]);
  if (!figura) return null;
  return (
    <Tarjeta titulo="Diagrama de constelación" color={coloresSenales.modulada} subtitulo={`${resultado.constelacion.length} estados · ${resultado.nombreVariante}`}>
      <GraficaPlotly datos={figura.datos} diseno={figura.diseno} identificador="constelacion" />
      <div className="mt-1 text-[11px] text-slate-500">
        Convención: <EcuacionModulacion latex={String.raw`s(t)=I\cos(2\pi f_ct)-Q\sin(2\pi f_ct)`} enLinea className="ecuacion-pequena text-slate-400" />
      </div>
    </Tarjeta>
  );
}
