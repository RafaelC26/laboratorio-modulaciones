"use client";

import { useEffect } from "react";
import { hidratarAlmacen, useAlmacenLaboratorio } from "@/estado/almacenLaboratorio";
import type { TipoModulacion } from "@/tipos/tiposModulacion";
import { useSimulacionDinamica } from "@/hooks/useSimulacion";
import { PanelCentral } from "./PanelCentral";
import { PanelLateral } from "./PanelLateral";

const TECNICAS_ENLAZABLES: TipoModulacion[] = ["AM", "ASK", "PSK", "PSM"];

/**
 * Raíz del laboratorio: parámetros a la izquierda y gráficas a la derecha en
 * escritorio; una sola columna en pantallas pequeñas.
 */
export function LaboratorioModulaciones() {
  useEffect(() => {
    // Un enlace como /laboratorio?tecnica=PSK abre directamente esa técnica.
    void hidratarAlmacen().then(() => {
      const tecnica = new URLSearchParams(window.location.search).get("tecnica")?.toUpperCase();
      if (tecnica && TECNICAS_ENLAZABLES.includes(tecnica as TipoModulacion)) {
        useAlmacenLaboratorio.getState().seleccionarTipo(tecnica as TipoModulacion);
      }
    });
  }, []);

  useSimulacionDinamica();

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <h1 className="sr-only">Laboratorio Virtual de Modulaciones</h1>
      <main className="grid flex-1 grid-cols-[minmax(0,1fr)] gap-3 p-3 lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)]">
        <PanelLateral className="lg:min-h-0 lg:overflow-y-auto lg:pr-1" />
        <PanelCentral className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:pr-1" />
      </main>
    </div>
  );
}
