"use client";

import { useEffect } from "react";
import { configuracionInterfaz } from "@/configuracion/configuracionInterfaz";
import { useAlmacenLaboratorio } from "@/estado/almacenLaboratorio";
import { servicioSimulacion } from "@/servicios/ServicioSimulacion";
import type { EntradaModulacion } from "@/tipos/tiposModulacion";

let ultimaEntradaSimulada: EntradaModulacion | null = null;

/**
 * Ejecuta la simulación de la técnica seleccionada con los parámetros actuales.
 * Con `soloSiCambio`, no repite el cálculo si la entrada es la misma que la última simulada.
 */
export function ejecutarSimulacion({ soloSiCambio = false } = {}): void {
  const estado = useAlmacenLaboratorio.getState();
  const entrada = estado.entradas[estado.tipoSeleccionado];
  if (soloSiCambio && entrada === ultimaEntradaSimulada) return;
  ultimaEntradaSimulada = entrada;

  estado.iniciarEjecucion();
  const operacion = servicioSimulacion.simular(entrada);
  const actual = useAlmacenLaboratorio.getState();
  actual.finalizarEjecucion(operacion);
  if (operacion.exito) actual.agregarAlHistorial(operacion.resultado);
}

/** Estado de la última simulación. */
export function useSimulacion() {
  const estadoEjecucion = useAlmacenLaboratorio((s) => s.estadoEjecucion);
  const errores = useAlmacenLaboratorio((s) => s.errores);
  const advertencias = useAlmacenLaboratorio((s) => s.advertencias);
  return { estadoEjecucion, errores, advertencias };
}

/**
 * Recalcula automáticamente tras un breve retardo desde el último cambio de
 * parámetros. Al cambiar de técnica se simula de inmediato.
 * Debe montarse una sola vez, en el componente raíz del laboratorio.
 */
export function useSimulacionDinamica(): void {
  const hidratado = useAlmacenLaboratorio((s) => s.hidratado);
  const tipo = useAlmacenLaboratorio((s) => s.tipoSeleccionado);
  const entrada = useAlmacenLaboratorio((s) => s.entradas[s.tipoSeleccionado]);

  useEffect(() => {
    if (hidratado) ejecutarSimulacion({ soloSiCambio: true });
  }, [hidratado, tipo]);

  useEffect(() => {
    if (!hidratado) return;
    const temporizador = setTimeout(() => ejecutarSimulacion({ soloSiCambio: true }), configuracionInterfaz.retardoModoDinamico);
    return () => clearTimeout(temporizador);
  }, [hidratado, entrada]);
}
