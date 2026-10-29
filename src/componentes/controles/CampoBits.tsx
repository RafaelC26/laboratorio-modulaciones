"use client";

import { useId } from "react";
import { configuracionGeneral } from "@/configuracion/configuracionGeneral";
import { limpiarSecuenciaBits } from "@/utilidades/validacionNumerica";

interface PropiedadesCampoBits {
  valor: string;
  alCambiar: (texto: string) => void;
  bitsPorSimbolo?: number;
  error?: string;
  predeterminada: string;
}

function secuenciaAleatoria(longitud: number): string {
  return Array.from({ length: longitud }, () => (Math.random() < 0.5 ? "0" : "1")).join("");
}

/** Entrada de la secuencia digital: solo admite 0, 1 y espacios. */
export function CampoBits({ valor, alCambiar, bitsPorSimbolo = 1, error, predeterminada }: PropiedadesCampoBits) {
  const id = useId();
  const bits = limpiarSecuenciaBits(valor);
  const simbolos = Math.ceil(bits.length / bitsPorSimbolo);
  const longitudAleatoria = Math.max(bits.length, 8);
  const acciones = [
    { etiqueta: "Aleatoria", accion: () => alCambiar(secuenciaAleatoria(longitudAleatoria)) },
    { etiqueta: "1010…", accion: () => alCambiar("10".repeat(Math.ceil(longitudAleatoria / 2)).slice(0, longitudAleatoria)) },
    { etiqueta: "Ejemplo", accion: () => alCambiar(predeterminada) },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs font-medium text-slate-300">
          Secuencia de bits
        </label>
        <span className="text-[11px] text-slate-500 tabular-nums">
          {bits.length} bits{bitsPorSimbolo > 1 ? ` · ${simbolos} símbolos de ${bitsPorSimbolo} bits` : ""}
        </span>
      </div>
      <input
        id={id}
        type="text"
        spellCheck={false}
        autoComplete="off"
        value={valor}
        maxLength={configuracionGeneral.maximoBits * 2}
        aria-invalid={Boolean(error)}
        onChange={(e) => alCambiar(e.target.value.replace(/[^01\s]/g, ""))}
        placeholder="10110"
        className={`mt-1 w-full rounded-md border bg-grafito-950/70 px-2.5 py-1.5 font-mono text-[13px] tracking-[0.18em] text-slate-100 outline-none ${
          error ? "border-red-400/60" : "border-grafito-600 focus:border-acento"
        }`}
      />
      <div className="mt-1.5 flex flex-wrap gap-1">
        {acciones.map((a) => (
          <button
            key={a.etiqueta}
            type="button"
            onClick={a.accion}
            className="rounded border border-grafito-600 px-1.5 py-0.5 text-[11px] text-slate-400 transition-colors hover:border-grafito-500 hover:text-slate-200"
          >
            {a.etiqueta}
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-[11px] text-red-300">{error}</p>}
    </div>
  );
}
