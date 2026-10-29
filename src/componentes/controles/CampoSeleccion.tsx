"use client";

import { useId } from "react";

interface Opcion<T extends string | number> {
  valor: T;
  etiqueta: string;
}

interface PropiedadesCampoSeleccion<T extends string | number> {
  etiqueta: string;
  valor: T;
  opciones: Opcion<T>[];
  alCambiar: (valor: T) => void;
  ayuda?: string;
  error?: string;
}

export function CampoSeleccion<T extends string | number>({ etiqueta, valor, opciones, alCambiar, ayuda, error }: PropiedadesCampoSeleccion<T>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-slate-300">
        {etiqueta}
      </label>
      <select
        id={id}
        value={String(valor)}
        onChange={(e) => {
          const elegida = opciones.find((o) => String(o.valor) === e.target.value);
          if (elegida) alCambiar(elegida.valor);
        }}
        className="mt-1 w-full rounded-md border border-grafito-600 bg-grafito-950/70 px-2.5 py-1.5 text-[13px] text-slate-100 outline-none focus:border-acento"
      >
        {opciones.map((o) => (
          <option key={String(o.valor)} value={String(o.valor)}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-[11px] text-red-300">{error}</p> : ayuda ? <p className="mt-1 text-[11px] text-slate-500">{ayuda}</p> : null}
    </div>
  );
}

/** Selector compacto de opciones excluyentes (por ejemplo, escala lineal / dB). */
export function SelectorSegmentado<T extends string>({
  valor,
  opciones,
  alCambiar,
  etiqueta,
}: {
  valor: T;
  opciones: Opcion<T>[];
  alCambiar: (valor: T) => void;
  etiqueta: string;
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="inline-flex rounded-md border border-grafito-600 bg-grafito-950/60 p-0.5">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={o.valor === valor}
          onClick={() => alCambiar(o.valor)}
          className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
            o.valor === valor ? "bg-grafito-700 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}
