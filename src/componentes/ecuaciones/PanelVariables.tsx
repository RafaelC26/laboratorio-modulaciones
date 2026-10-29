"use client";

import { Tarjeta } from "@/componentes/interfaz/Tarjeta";
import { useConfiguracionModulacion, useParametrosVigentes } from "@/hooks/useConfiguracionModulacion";
import { radianesAGrados } from "@/utilidades/conversionUnidades";
import { formatearConUnidad, formatearNumero } from "@/utilidades/formatoNumerico";
import { EcuacionModulacion } from "./EcuacionModulacion";

function formatearValor(valor: number, unidad: string): string {
  if (unidad === "rad") return `${formatearNumero(valor)} rad (${formatearNumero(radianesAGrados(valor), 4)}°)`;
  return formatearConUnidad(valor, unidad);
}

/** Variables de la ecuación principal con el valor utilizado (RF-16). */
export function PanelVariables() {
  const { formulas } = useConfiguracionModulacion();
  const { parametros, deSimulacion } = useParametrosVigentes();

  return (
    <Tarjeta titulo="Variables" subtitulo={deSimulacion ? "Valores utilizados en la última simulación" : "Valores del formulario (aún sin simular)"} plegable>
      <table className="w-full text-xs">
        <tbody className="divide-y divide-grafito-700/60">
          {formulas.principal.variables.map((variable) => (
            <tr key={variable.simbolo}>
              <td className="w-12 py-1.5 pr-2 align-top">
                <EcuacionModulacion latex={variable.simbolo} enLinea className="ecuacion-pequena" />
              </td>
              <td className="py-1.5 pr-2 text-slate-400">{variable.descripcion}</td>
              <td className="py-1.5 text-right font-mono whitespace-nowrap text-slate-100 tabular-nums">
                {variable.valor ? formatearValor(variable.valor(parametros), variable.unidad) : <span className="text-slate-600">—</span>}
              </td>
            </tr>
          ))}
          {parametros.esDigital && (
            <tr>
              <td className="py-1.5 pr-2 align-top">
                <EcuacionModulacion latex="b" enLinea className="ecuacion-pequena" />
              </td>
              <td className="py-1.5 pr-2 text-slate-400">Secuencia transmitida</td>
              <td className="py-1.5 text-right font-mono break-all text-slate-100">{parametros.secuenciaBits.join("")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </Tarjeta>
  );
}
