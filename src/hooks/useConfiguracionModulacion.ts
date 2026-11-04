"use client";

import { obtenerDescripcionTecnica, tecnicasDisponibles } from "@/configuracion/configuracionGeneral";
import { useAlmacenLaboratorio } from "@/estado/almacenLaboratorio";

/** Técnica seleccionada y su descripción. */
export function useConfiguracionModulacion() {
  const tipo = useAlmacenLaboratorio((s) => s.tipoSeleccionado);
  const seleccionarTipo = useAlmacenLaboratorio((s) => s.seleccionarTipo);
  return {
    tipo,
    seleccionarTipo,
    descripcion: obtenerDescripcionTecnica(tipo),
    tecnicas: tecnicasDisponibles,
  };
}
