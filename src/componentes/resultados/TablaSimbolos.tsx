"use client";

import { Tarjeta } from "@/componentes/interfaz/Tarjeta";
import { useConfiguracionModulacion } from "@/hooks/useConfiguracionModulacion";
import { useSimulacion } from "@/hooks/useSimulacion";
import { normalizarAngulo, radianesAGrados } from "@/utilidades/conversionUnidades";
import { formatearNumero } from "@/utilidades/formatoNumerico";

/** Mapeo de bits a estados (fase o amplitud) y coordenadas I/Q de cada símbolo. */
export function TablaSimbolos() {
  const { resultado } = useSimulacion();
  const { tipo } = useConfiguracionModulacion();
  if (!resultado || resultado.tipo !== tipo || !resultado.constelacion.length) return null;
  const esPSK = resultado.tipo === "PSK";

  return (
    <Tarjeta
      titulo="Tabla de símbolos"
      subtitulo={esPSK ? `Mapeo ${resultado.parametros.mapeoSimbolos === "gray" ? "Gray" : "binario"} · φᵢ = 2πi/M + φ₀` : "A_i según el bit"}
      plegable
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="text-left text-[11px] text-slate-500">
              <th className="py-1 pr-2 font-medium">i</th>
              <th className="py-1 pr-2 font-medium">Bits</th>
              <th className="py-1 pr-2 text-right font-medium">{esPSK ? "φᵢ" : "Aᵢ"}</th>
              <th className="py-1 pr-2 text-right font-medium">I</th>
              <th className="py-1 pr-2 text-right font-medium">Q</th>
              <th className="py-1 text-right font-medium">Veces</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grafito-700/60 font-mono">
            {resultado.constelacion.map((punto) => (
              <tr key={punto.indiceEstado} className={punto.repeticiones ? "text-slate-100" : "text-slate-500"}>
                <td className="py-1 pr-2">{punto.indiceEstado}</td>
                <td className="py-1 pr-2 text-acento-claro">{punto.etiqueta}</td>
                <td className="py-1 pr-2 text-right">
                  {esPSK ? `${formatearNumero(radianesAGrados(normalizarAngulo(punto.fase)), 5)}°` : `${formatearNumero(punto.enFase)} V`}
                </td>
                <td className="py-1 pr-2 text-right">{formatearNumero(punto.enFase)}</td>
                <td className="py-1 pr-2 text-right">{formatearNumero(punto.cuadratura)}</td>
                <td className="py-1 text-right">{punto.repeticiones}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {resultado.intervalosSimbolo.length > 0 && resultado.intervalosSimbolo.length <= 64 && (
        <p className="mt-2 text-[11px] leading-relaxed break-all text-slate-500">
          Secuencia de símbolos:{" "}
          <span className="font-mono text-slate-300">{resultado.intervalosSimbolo.map((s) => s.etiqueta).join(" · ")}</span>
        </p>
      )}
    </Tarjeta>
  );
}
