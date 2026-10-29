"use client";

import { useCallback, useEffect } from "react";
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

/** Estado de la simulación y acción para ejecutarla (modo manual). */
export function useSimulacion() {
  const resultado = useAlmacenLaboratorio((s) => s.resultado);
  const estadoEjecucion = useAlmacenLaboratorio((s) => s.estadoEjecucion);
  const errores = useAlmacenLaboratorio((s) => s.errores);
  const advertencias = useAlmacenLaboratorio((s) => s.advertencias);
  const modoDinamico = useAlmacenLaboratorio((s) => s.modoDinamico);
  const establecerModoDinamico = useAlmacenLaboratorio((s) => s.establecerModoDinamico);
  const entradaActual = useAlmacenLaboratorio((s) => s.entradas[s.tipoSeleccionado]);
  const tipoSeleccionado = useAlmacenLaboratorio((s) => s.tipoSeleccionado);

  const ejecutar = useCallback(() => ejecutarSimulacion(), []);

  const hayCambiosPendientes =
    !resultado || resultado.tipo !== tipoSeleccionado || JSON.stringify(resultado.entrada) !== JSON.stringify(entradaActual);

  return {
    resultado,
    estadoEjecucion,
    errores,
    advertencias,
    modoDinamico,
    establecerModoDinamico,
    ejecutar,
    hayCambiosPendientes,
  };
}

/**
 * Modo dinámico (sección 18.2): recalcula automáticamente tras un breve
 * retardo desde el último cambio. Al cambiar de técnica se simula de inmediato.
 * Debe montarse una sola vez, en el componente raíz del laboratorio.
 */
export function useSimulacionDinamica(): void {
  const hidratado = useAlmacenLaboratorio((s) => s.hidratado);
  const tipo = useAlmacenLaboratorio((s) => s.tipoSeleccionado);
  const entrada = useAlmacenLaboratorio((s) => s.entradas[s.tipoSeleccionado]);
  const modoDinamico = useAlmacenLaboratorio((s) => s.modoDinamico);

  useEffect(() => {
    if (hidratado) ejecutarSimulacion({ soloSiCambio: true });
  }, [hidratado, tipo]);

  useEffect(() => {
    if (!hidratado || !modoDinamico) return;
    const temporizador = setTimeout(() => ejecutarSimulacion({ soloSiCambio: true }), configuracionInterfaz.retardoModoDinamico);
    return () => clearTimeout(temporizador);
  }, [hidratado, modoDinamico, entrada]);
}
