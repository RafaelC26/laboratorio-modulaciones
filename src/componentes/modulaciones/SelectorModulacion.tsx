"use client";

import { useConfiguracionModulacion } from "@/hooks/useConfiguracionModulacion";

/** Menú de técnicas de modulación (RF-01). */
export function SelectorModulacion() {
  const { tipo, seleccionarTipo, tecnicas } = useConfiguracionModulacion();
  return (
    <div role="tablist" aria-label="Técnica de modulación" className="grid grid-cols-2 gap-2">
      {tecnicas.map((tecnica) => {
        const activa = tecnica.tipo === tipo;
        return (
          <button
            key={tecnica.tipo}
            type="button"
            role="tab"
            aria-selected={activa}
            aria-label={`${tecnica.sigla}: ${tecnica.nombre}`}
            onClick={() => seleccionarTipo(tecnica.tipo)}
            className={`group rounded-lg border px-3 py-2 text-left transition-all ${
              activa
                ? "border-acento/70 bg-acento/12 shadow-[0_0_0_1px_rgba(79,140,255,0.35),0_8px_24px_-12px_rgba(79,140,255,0.7)]"
                : "border-grafito-700 bg-grafito-850 hover:border-grafito-500 hover:bg-grafito-800"
            }`}
          >
            <div className="flex items-baseline justify-between gap-1">
              <span className={`text-base font-bold tracking-tight ${activa ? "text-white" : "text-slate-200"}`}>{tecnica.sigla}</span>
              <span className={`text-[10px] font-medium tracking-wide uppercase ${activa ? "text-acento-claro" : "text-slate-500"}`}>
                {tecnica.categoria === "analogica" ? "Analógica" : "Digital"}
              </span>
            </div>
            <div className="mt-0.5 text-[11px] leading-tight text-slate-400">{tecnica.nombre}</div>
          </button>
        );
      })}
    </div>
  );
}
