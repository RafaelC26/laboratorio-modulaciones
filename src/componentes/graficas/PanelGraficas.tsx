"use client";

import { Icono } from "@/componentes/interfaz/Iconos";
import { MensajesValidacion } from "@/componentes/interfaz/Tarjeta";
import { coloresSenales } from "@/configuracion/configuracionGraficas";
import { useGraficas } from "@/hooks/useGraficas";
import { useSimulacion } from "@/hooks/useSimulacion";
import { servicioGraficas } from "@/servicios/ServicioGraficas";
import type { IdGrafica } from "@/tipos/tiposGraficas";
import { formatearNumero } from "@/utilidades/formatoNumerico";
import { GraficaConstelacion } from "./GraficaConstelacion";
import { GraficaEspectral } from "./GraficaEspectral";
import { GraficaSenalModulada } from "./GraficaSenalModulada";
import { GraficaSenalModuladora } from "./GraficaSenalModuladora";
import { GraficaSenalPortadora } from "./GraficaSenalPortadora";

/** Distribución de las gráficas y selección de las señales visibles. */
export function PanelGraficas() {
  const { resultado, visualizacion, alternarGrafica, establecerRangoTiempo, actualizarVisualizacion, espectro, analisis } = useGraficas();
  const { estadoEjecucion, errores } = useSimulacion();

  if (!resultado) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-grafito-700 p-8 text-center">
        <Icono nombre="onda" className="size-10 text-grafito-500" />
        {errores.length ? (
          <div className="max-w-md text-left">
            <MensajesValidacion errores={errores} advertencias={[]} />
          </div>
        ) : (
          <p className="text-sm text-slate-400">{estadoEjecucion === "calculando" ? "Calculando…" : "Preparando la primera simulación…"}</p>
        )}
      </div>
    );
  }

  const digital = resultado.parametros.esDigital;
  const opciones: { id: IdGrafica; nombre: string; color: string; disponible: boolean }[] = [
    { id: "moduladora", nombre: digital ? "Información" : "Moduladora", color: coloresSenales.moduladora, disponible: true },
    { id: "portadora", nombre: "Portadora", color: coloresSenales.portadora, disponible: true },
    { id: "modulada", nombre: "Modulada", color: coloresSenales.modulada, disponible: true },
    { id: "espectro", nombre: "Espectro", color: coloresSenales.teorico, disponible: true },
    { id: "constelacion", nombre: "Constelación", color: coloresSenales.secundaria, disponible: digital },
  ];
  const { visibles, rangoTiempo } = visualizacion;
  const escala = servicioGraficas.escalaTiempo(resultado);
  const propiedadesTiempo = { resultado, rango: rangoTiempo, alCambiarRango: establecerRangoTiempo };
  const mostrarEspectro = visibles.espectro && espectro;
  const mostrarConstelacion = visibles.constelacion && digital;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Gráficas</span>
        {opciones
          .filter((o) => o.disponible)
          .map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={visibles[o.id]}
              onClick={() => alternarGrafica(o.id)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                visibles[o.id] ? "border-grafito-500 bg-grafito-800 text-slate-100" : "border-grafito-700 text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: visibles[o.id] ? o.color : "transparent", border: `1px solid ${o.color}` }} />
              {o.nombre}
            </button>
          ))}
        {rangoTiempo && (
          <button
            type="button"
            onClick={() => establecerRangoTiempo(null)}
            className="ml-auto flex items-center gap-1 rounded-full border border-acento/40 bg-acento/10 px-2.5 py-1 text-xs text-acento-claro hover:bg-acento/20"
          >
            <Icono nombre="zoom" className="size-3.5" />
            Zoom sincronizado {formatearNumero(rangoTiempo[0] * escala.factor, 4)}–{formatearNumero(rangoTiempo[1] * escala.factor, 4)} {escala.etiqueta} · Restablecer
          </button>
        )}
      </div>

      {errores.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-400">La última simulación no se ejecutó; se muestra el resultado válido anterior.</p>
          <MensajesValidacion errores={errores} advertencias={[]} />
        </div>
      )}

      {visibles.moduladora && <GraficaSenalModuladora {...propiedadesTiempo} />}
      {visibles.portadora && <GraficaSenalPortadora {...propiedadesTiempo} />}
      {visibles.modulada && <GraficaSenalModulada {...propiedadesTiempo} />}

      {(mostrarEspectro || mostrarConstelacion) && (
        <div className={`grid gap-3 ${mostrarEspectro && mostrarConstelacion ? "min-[1800px]:grid-cols-[minmax(0,1fr)_420px]" : ""}`}>
          {mostrarEspectro && (
            <GraficaEspectral resultado={resultado} espectro={espectro} analisis={analisis} visualizacion={visualizacion} actualizar={actualizarVisualizacion} />
          )}
          {mostrarConstelacion && <GraficaConstelacion resultado={resultado} />}
        </div>
      )}

      {!Object.entries(visibles).some(([id, visible]) => visible && opciones.find((o) => o.id === id)?.disponible) && (
        <p className="rounded-xl border border-dashed border-grafito-700 p-6 text-center text-sm text-slate-500">
          Todas las gráficas están ocultas. Actívelas con los botones de arriba.
        </p>
      )}
    </div>
  );
}
