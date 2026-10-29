"use client";

import { PanelEcuaciones } from "@/componentes/ecuaciones/PanelEcuaciones";
import { PanelVariables } from "@/componentes/ecuaciones/PanelVariables";
import { PanelResultados } from "@/componentes/resultados/PanelResultados";
import { TablaSimbolos } from "@/componentes/resultados/TablaSimbolos";
import { useConfiguracionModulacion } from "@/hooks/useConfiguracionModulacion";
import { Icono } from "./Iconos";
import { Tarjeta } from "./Tarjeta";

/** Panel derecho: ecuación, variables, resultados e información de la técnica. */
export function PanelInformacion({ className = "" }: { className?: string }) {
  const { descripcion } = useConfiguracionModulacion();
  return (
    <aside aria-label="Ecuaciones y resultados" className={`desplazable space-y-3 ${className}`}>
      <PanelEcuaciones />
      <PanelVariables />
      <PanelResultados />
      <TablaSimbolos />
      <Tarjeta
        titulo={
          <span className="flex items-center gap-1.5">
            <Icono nombre="informacion" className="size-3.5 text-acento-claro" />
            Qué observar en {descripcion.sigla}
          </span>
        }
        plegable
      >
        <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-400 marker:text-grafito-500">
          {descripcion.observaciones.map((observacion) => (
            <li key={observacion}>{observacion}</li>
          ))}
        </ul>
      </Tarjeta>
    </aside>
  );
}
