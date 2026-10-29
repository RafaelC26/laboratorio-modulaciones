"use client";

import { useEffect } from "react";
import { hidratarAlmacen, useAlmacenLaboratorio } from "@/estado/almacenLaboratorio";
import type { TipoModulacion } from "@/tipos/tiposModulacion";
import { ejecutarSimulacion, useSimulacionDinamica } from "@/hooks/useSimulacion";
import { EncabezadoAplicacion } from "./EncabezadoAplicacion";
import { PanelCentral } from "./PanelCentral";
import { PanelInformacion } from "./PanelInformacion";
import { PanelLateral } from "./PanelLateral";
import { PieAplicacion } from "./PieAplicacion";

const TECNICAS_ENLAZABLES: TipoModulacion[] = ["AM", "ASK", "PSK", "PSM"];

/**
 * Raíz del laboratorio: tres paneles en escritorio (sección 11.1) y una sola
 * columna en pantallas pequeñas.
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

  useEffect(() => {
    const atajo = (evento: KeyboardEvent) => {
      if ((evento.ctrlKey || evento.metaKey) && evento.key === "Enter") {
        evento.preventDefault();
        ejecutarSimulacion();
      }
    };
    window.addEventListener("keydown", atajo);
    return () => window.removeEventListener("keydown", atajo);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col xl:h-dvh">
      <EncabezadoAplicacion />
      <main className="grid flex-1 grid-cols-[minmax(0,1fr)] gap-3 p-3 lg:grid-cols-[320px_minmax(0,1fr)] xl:min-h-0 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
        <PanelLateral className="xl:min-h-0 xl:overflow-y-auto xl:pr-1" />
        <PanelCentral className="min-w-0 xl:min-h-0 xl:overflow-y-auto xl:pr-1" />
        <PanelInformacion className="lg:col-span-2 xl:col-span-1 xl:min-h-0 xl:overflow-y-auto xl:pr-1" />
      </main>
      <PieAplicacion />
    </div>
  );
}
