"use client";

import { limitesParametros } from "@/configuracion/configuracionGeneral";
import { UNIDADES_FASE } from "@/utilidades/conversionUnidades";
import { CampoNumerico, type PropiedadesCampoNumerico } from "./CampoNumerico";

const FASES_RAPIDAS = [
  { etiqueta: "0", valor: 0 },
  { etiqueta: "π/4", valor: Math.PI / 4 },
  { etiqueta: "π/2", valor: Math.PI / 2 },
  { etiqueta: "π", valor: Math.PI },
];

/** Campo de fase (grados o radianes) con accesos rápidos a fases notables. */
export function ControlFase(propiedades: Omit<PropiedadesCampoNumerico, "unidades" | "unidad">) {
  const { valor, alCambiar } = propiedades;
  return (
    <CampoNumerico
      unidades={UNIDADES_FASE}
      deslizador={limitesParametros.faseInicial.deslizador}
      pasoDeslizador={Math.PI / 180}
      {...propiedades}
      accesorio={
        <div className="mt-1.5 flex flex-wrap gap-1">
          {FASES_RAPIDAS.map((fase) => (
            <button
              key={fase.etiqueta}
              type="button"
              onClick={() => alCambiar(fase.valor)}
              className={`rounded border px-1.5 py-0.5 font-mono text-[11px] transition-colors ${
                Math.abs(valor - fase.valor) < 1e-9
                  ? "border-acento/60 bg-acento/15 text-acento-claro"
                  : "border-grafito-600 text-slate-400 hover:border-grafito-500 hover:text-slate-200"
              }`}
            >
              {fase.etiqueta}
            </button>
          ))}
        </div>
      }
    />
  );
}
