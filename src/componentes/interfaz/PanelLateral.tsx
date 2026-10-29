"use client";

import { HistorialSimulaciones } from "@/componentes/modulaciones/HistorialSimulaciones";
import { PanelParametros } from "@/componentes/modulaciones/PanelParametros";
import { SelectorModulacion } from "@/componentes/modulaciones/SelectorModulacion";
import { Tarjeta } from "./Tarjeta";

/** Panel izquierdo: técnica, parámetros e historial. */
export function PanelLateral({ className = "" }: { className?: string }) {
  return (
    <aside aria-label="Configuración" className={`desplazable space-y-3 ${className}`}>
      <Tarjeta titulo="Técnica de modulación">
        <SelectorModulacion />
      </Tarjeta>
      <PanelParametros />
      <HistorialSimulaciones />
    </aside>
  );
}
