"use client";

import { useCallback, useMemo } from "react";
import { useAlmacenLaboratorio } from "@/estado/almacenLaboratorio";
import { servicioValidacion } from "@/servicios/ServicioValidacion";
import type { ConfiguracionTemporal, EntradasPorTecnica, TipoModulacion } from "@/tipos/tiposModulacion";

/** Parámetros editables de una técnica, con su validación en vivo. */
export function useParametros<T extends TipoModulacion>(tipo: T) {
  const entrada = useAlmacenLaboratorio((s) => s.entradas[tipo]) as EntradasPorTecnica[T];
  const actualizarEntrada = useAlmacenLaboratorio((s) => s.actualizarEntrada);
  const actualizarTemporalAlmacen = useAlmacenLaboratorio((s) => s.actualizarTemporal);
  const reiniciarTecnica = useAlmacenLaboratorio((s) => s.reiniciarTecnica);

  const validacion = useMemo(() => servicioValidacion.validar(entrada), [entrada]);

  const actualizar = useCallback(
    (cambios: Partial<EntradasPorTecnica[T]>) => actualizarEntrada(tipo, cambios),
    [actualizarEntrada, tipo],
  );
  const actualizarTemporal = useCallback(
    (cambios: Partial<ConfiguracionTemporal>) => actualizarTemporalAlmacen(tipo, cambios),
    [actualizarTemporalAlmacen, tipo],
  );
  const errorDe = useCallback(
    (campo: string) => validacion.errores.find((e) => e.campo === campo)?.mensaje,
    [validacion],
  );
  const avisoDe = useCallback(
    (campo: string) => validacion.advertencias.find((e) => e.campo === campo)?.mensaje,
    [validacion],
  );

  return {
    entrada,
    actualizar,
    actualizarTemporal,
    validacion,
    errorDe,
    avisoDe,
    reiniciar: () => reiniciarTecnica(tipo),
  };
}
