"use client";

import { Icono } from "@/componentes/interfaz/Iconos";
import { Tarjeta } from "@/componentes/interfaz/Tarjeta";
import { useConfiguracionModulacion, useParametrosVigentes } from "@/hooks/useConfiguracionModulacion";
import { gestorFormulas } from "@/servicios/GestorFormulas";
import { EcuacionAjustable } from "./EcuacionAjustable";
import { EcuacionModulacion } from "./EcuacionModulacion";

/** Ecuación principal, ecuación con valores y ecuaciones complementarias (RF-09). */
export function PanelEcuaciones() {
  const { descripcion, formulas } = useConfiguracionModulacion();
  const { parametros, deSimulacion } = useParametrosVigentes();

  return (
    <Tarjeta titulo="Ecuación de la modulación" subtitulo={`${descripcion.nombre} (${descripcion.sigla})`} plegable>
      <div className="rounded-lg border border-grafito-700 bg-grafito-950/70 px-3 py-2">
        <EcuacionAjustable latex={formulas.principal.ecuacion} />
      </div>
      <p className="mt-3 mb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
        {deSimulacion ? "Con los valores simulados" : "Con los valores del formulario"}
      </p>
      <div className="ecuacion-pequena rounded-lg border border-grafito-700/60 bg-grafito-950/40 px-3 py-1.5">
        <EcuacionAjustable latex={formulas.sustituir(parametros)} />
      </div>

      <details className="mt-3 rounded-lg border border-grafito-700/60">
        <summary className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300">
          <Icono nombre="chevron" className="indicador-plegable size-3.5 text-slate-500 transition-transform" />
          Ecuaciones complementarias ({formulas.complementarias.length})
        </summary>
        <ul className="space-y-3 border-t border-grafito-700/60 px-3 py-3">
          {formulas.complementarias.map((formula) => (
            <li key={formula.identificador}>
              <p className="text-xs font-medium text-slate-200">{formula.nombre}</p>
              <div className="ecuacion-pequena">
                <EcuacionModulacion latex={formula.ecuacion} />
              </div>
              <p className="text-[11px] text-slate-500">{formula.descripcion}</p>
            </li>
          ))}
        </ul>
      </details>

      <details className="mt-2 rounded-lg border border-grafito-700/60">
        <summary className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300">
          <Icono nombre="chevron" className="indicador-plegable size-3.5 text-slate-500 transition-transform" />
          Análisis espectral (FFT)
        </summary>
        <ul className="space-y-3 border-t border-grafito-700/60 px-3 py-3">
          {gestorFormulas.formulasEspectrales().map((formula) => (
            <li key={formula.identificador}>
              <p className="text-xs font-medium text-slate-200">{formula.nombre}</p>
              <div className="ecuacion-pequena">
                <EcuacionModulacion latex={formula.ecuacion} />
              </div>
              <p className="text-[11px] text-slate-500">{formula.descripcion}</p>
            </li>
          ))}
        </ul>
      </details>

      <p className="mt-3 text-[11px] text-slate-500">
        Fórmulas en <code className="rounded bg-grafito-800 px-1 py-px font-mono text-slate-300">{formulas.archivo}</code> · versión {formulas.version}
      </p>
    </Tarjeta>
  );
}
