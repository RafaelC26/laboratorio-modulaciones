"use client";

import { useMemo } from "react";
import { GraficaPlotly } from "@/componentes/graficas/GraficaPlotly";
import { Icono } from "@/componentes/interfaz/Iconos";
import { Boton, Tarjeta } from "@/componentes/interfaz/Tarjeta";
import { configuracionInterfaz } from "@/configuracion/configuracionInterfaz";
import { useAlmacenLaboratorio } from "@/estado/almacenLaboratorio";
import { servicioComparacion } from "@/servicios/ServicioComparacion";

/** Comparación de varias simulaciones (sección 16, RF-13). */
export function PanelComparacion() {
  const comparacion = useAlmacenLaboratorio((s) => s.comparacion);
  const quitarDeComparacion = useAlmacenLaboratorio((s) => s.quitarDeComparacion);
  const limpiarComparacion = useAlmacenLaboratorio((s) => s.limpiarComparacion);
  const establecerVista = useAlmacenLaboratorio((s) => s.establecerVista);

  const tabla = useMemo(() => (comparacion.length ? servicioComparacion.tabla(comparacion) : []), [comparacion]);
  const figuraTiempo = useMemo(() => (comparacion.length ? servicioComparacion.figuraTiempo(comparacion) : null), [comparacion]);
  const figuraEspectro = useMemo(() => (comparacion.length ? servicioComparacion.figuraEspectro(comparacion) : null), [comparacion]);

  if (!comparacion.length) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-grafito-700 p-8 text-center">
        <Icono nombre="comparar" className="size-10 text-grafito-500" />
        <h2 className="text-sm font-semibold text-slate-200">No hay simulaciones para comparar</h2>
        <p className="max-w-md text-sm text-slate-400">
          Configure una simulación en el laboratorio y pulse <strong className="text-slate-200">Agregar a comparación</strong>. Puede comparar hasta{" "}
          {configuracionInterfaz.maximoComparacion} configuraciones: distintos índices de modulación, BPSK frente a QPSK, distintas tasas de bits…
        </p>
        <Boton variante="primario" onClick={() => establecerVista("laboratorio")}>
          Volver al laboratorio
        </Boton>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Tarjeta
        titulo={`Simulaciones en comparación (${comparacion.length}/${configuracionInterfaz.maximoComparacion})`}
        acciones={
          <Boton variante="fantasma" className="px-2 py-1 text-xs" onClick={limpiarComparacion}>
            <Icono nombre="papelera" className="size-3.5" />
            Vaciar
          </Boton>
        }
      >
        <ul className="flex flex-wrap gap-2">
          {comparacion.map((resultado, i) => (
            <li key={resultado.id} className="flex items-center gap-2 rounded-full border border-grafito-600 bg-grafito-850 py-1 pr-1 pl-2.5 text-xs">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: servicioComparacion.colorDe(i) }} />
              <span className="text-slate-200">
                {i + 1}. {servicioComparacion.etiquetaEntrada(resultado.entrada)}
              </span>
              <button
                type="button"
                aria-label="Quitar de la comparación"
                onClick={() => quitarDeComparacion(resultado.id)}
                className="rounded-full p-1 text-slate-500 hover:bg-grafito-700 hover:text-slate-200"
              >
                <Icono nombre="cerrar" className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      </Tarjeta>

      <Tarjeta titulo="Resultados comparativos" subtitulo="Ancho de banda medido con ventana Hann sobre la señal modulada" sinRelleno>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="text-left text-[11px] text-slate-500">
                <th className="py-1.5 pr-3 font-medium">Magnitud</th>
                {comparacion.map((resultado, i) => (
                  <th key={resultado.id} className="py-1.5 pr-3 font-medium whitespace-nowrap">
                    <span className="mr-1.5 inline-block size-2 rounded-full" style={{ backgroundColor: servicioComparacion.colorDe(i) }} />
                    Simulación {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-grafito-700/60">
              {tabla.map((fila) => (
                <tr key={fila.clave}>
                  <td className="py-1.5 pr-3 text-slate-400">{fila.nombre}</td>
                  {fila.valores.map((valor, i) => (
                    <td key={i} className="py-1.5 pr-3 font-mono text-slate-100 tabular-nums">
                      {valor}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>

      {figuraTiempo && (
        <Tarjeta titulo="Señales moduladas superpuestas" subtitulo="Dominio del tiempo">
          <GraficaPlotly datos={figuraTiempo.datos} diseno={figuraTiempo.diseno} identificador="comparacion-tiempo" />
        </Tarjeta>
      )}
      {figuraEspectro && (
        <Tarjeta titulo="Espectros superpuestos" subtitulo="Misma ventana (Hann) y misma referencia (dBV = dB respecto a 1 V) para todas las señales">
          <GraficaPlotly datos={figuraEspectro.datos} diseno={figuraEspectro.diseno} identificador="comparacion-espectro" />
        </Tarjeta>
      )}
    </div>
  );
}
