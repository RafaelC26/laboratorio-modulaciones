"use client";

import { EcuacionModulacion } from "@/componentes/ecuaciones/EcuacionModulacion";
import { MensajesValidacion, Tarjeta } from "@/componentes/interfaz/Tarjeta";
import { useConfiguracionModulacion } from "@/hooks/useConfiguracionModulacion";
import { useSimulacion } from "@/hooks/useSimulacion";
import type { Metrica } from "@/tipos/tiposSimulacion";
import { formatearConUnidad, formatearDuracionCalculo, formatearNumero } from "@/utilidades/formatoNumerico";

function valorMetrica(metrica: Metrica): string {
  if (typeof metrica.valor === "string") return metrica.valor;
  if (metrica.unidad === "°") return `${formatearNumero(metrica.valor)}°`;
  return metrica.unidad ? formatearConUnidad(metrica.valor, metrica.unidad) : formatearNumero(metrica.valor);
}

const COLOR_ESTADO = {
  normal: "text-slate-100",
  advertencia: "text-amber-200",
  critico: "text-red-300",
};

/** Resultados matemáticos de la simulación (sección 11.1, panel derecho). */
export function PanelResultados() {
  const { resultado, advertencias } = useSimulacion();
  const { tipo } = useConfiguracionModulacion();
  if (!resultado || resultado.tipo !== tipo) return null;

  return (
    <Tarjeta titulo="Resultados" subtitulo={`${resultado.nombreVariante} · calculado en ${formatearDuracionCalculo(resultado.tiempoSimulacion)}`} plegable>
      {advertencias.length > 0 && (
        <div className="mb-3">
          <MensajesValidacion errores={[]} advertencias={advertencias} />
        </div>
      )}
      <dl className="divide-y divide-grafito-700/60 text-xs">
        {resultado.metricas.map((metrica) => (
          <div key={metrica.clave} className="flex items-baseline justify-between gap-3 py-1.5" title={metrica.descripcion}>
            <dt className="min-w-0 text-slate-400">
              {metrica.nombre}
              {metrica.simbolo && (
                <span className="ml-1.5 text-slate-500">
                  <EcuacionModulacion latex={metrica.simbolo} enLinea className="ecuacion-pequena" />
                </span>
              )}
            </dt>
            <dd className={`text-right font-mono whitespace-nowrap tabular-nums ${COLOR_ESTADO[metrica.estado ?? "normal"]}`}>{valorMetrica(metrica)}</dd>
          </div>
        ))}
      </dl>
    </Tarjeta>
  );
}
