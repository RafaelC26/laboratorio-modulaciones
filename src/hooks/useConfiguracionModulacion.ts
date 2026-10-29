"use client";

import { useMemo } from "react";
import { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { obtenerDescripcionTecnica, tecnicasDisponibles } from "@/configuracion/configuracionGeneral";
import { useAlmacenLaboratorio } from "@/estado/almacenLaboratorio";
import { gestorFormulas } from "@/servicios/GestorFormulas";

/**
 * Parámetros que se muestran en ecuaciones y variables: los de la última
 * simulación de la técnica seleccionada o, si no la hay, los del formulario.
 */
export function useParametrosVigentes(): { parametros: ParametrosModulacion; deSimulacion: boolean } {
  const tipo = useAlmacenLaboratorio((s) => s.tipoSeleccionado);
  const resultado = useAlmacenLaboratorio((s) => s.resultado);
  const entrada = useAlmacenLaboratorio((s) => s.entradas[s.tipoSeleccionado]);
  return useMemo(
    () =>
      resultado && resultado.tipo === tipo
        ? { parametros: resultado.parametros, deSimulacion: true }
        : { parametros: ParametrosModulacion.desdeEntrada(entrada), deSimulacion: false },
    [resultado, tipo, entrada],
  );
}

/** Técnica seleccionada, su descripción y sus fórmulas. */
export function useConfiguracionModulacion() {
  const tipo = useAlmacenLaboratorio((s) => s.tipoSeleccionado);
  const seleccionarTipo = useAlmacenLaboratorio((s) => s.seleccionarTipo);
  return {
    tipo,
    seleccionarTipo,
    descripcion: obtenerDescripcionTecnica(tipo),
    formulas: gestorFormulas.obtener(tipo),
    tecnicas: tecnicasDisponibles,
  };
}
