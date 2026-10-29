"use client";

import { Icono } from "@/componentes/interfaz/Iconos";
import { Tarjeta } from "@/componentes/interfaz/Tarjeta";
import { useAlmacenLaboratorio } from "@/estado/almacenLaboratorio";
import { ejecutarSimulacion } from "@/hooks/useSimulacion";
import { formatearHora } from "@/utilidades/formatoNumerico";

/** Acceso a simulaciones anteriores (se guardan en el navegador). */
export function HistorialSimulaciones() {
  const historial = useAlmacenLaboratorio((s) => s.historial);
  const cargarDesdeHistorial = useAlmacenLaboratorio((s) => s.cargarDesdeHistorial);
  const limpiarHistorial = useAlmacenLaboratorio((s) => s.limpiarHistorial);

  return (
    <Tarjeta
      titulo={
        <span className="flex items-center gap-1.5">
          <Icono nombre="historial" className="size-3.5 text-slate-400" />
          Simulaciones anteriores
          <span className="font-normal text-slate-500">({historial.length})</span>
        </span>
      }
      plegable
      abierta={false}
      acciones={
        historial.length > 0 ? (
          <button type="button" onClick={limpiarHistorial} className="text-[11px] text-slate-500 hover:text-slate-300">
            Vaciar
          </button>
        ) : undefined
      }
    >
      {historial.length === 0 ? (
        <p className="text-xs text-slate-500">Aún no hay simulaciones guardadas.</p>
      ) : (
        <ul className="space-y-1">
          {historial.map((registro) => (
            <li key={registro.id}>
              <button
                type="button"
                onClick={() => {
                  cargarDesdeHistorial(registro.id);
                  ejecutarSimulacion();
                }}
                className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-grafito-800"
              >
                <span className="mt-px rounded bg-grafito-700 px-1.5 py-px font-mono text-[10px] font-semibold text-slate-200">{registro.tipo}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-slate-300">{registro.etiqueta}</span>
                  <span className="block text-[10px] text-slate-500">{formatearHora(registro.fecha)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}
