"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { EcuacionModulacion } from "@/componentes/ecuaciones/EcuacionModulacion";
import { elegirUnidadAdecuada, type UnidadVisual } from "@/utilidades/conversionUnidades";
import { interpretarNumero } from "@/utilidades/validacionNumerica";

export interface PropiedadesCampoNumerico {
  etiqueta: string;
  /** Símbolo en LaTeX que relaciona el campo con la ecuación. */
  simbolo?: string;
  /** Valor en unidades SI. */
  valor: number;
  alCambiar: (valorSI: number) => void;
  /** Unidades seleccionables (Hz/kHz/MHz, s/ms/µs, °/rad). */
  unidades?: UnidadVisual[];
  /** Unidad fija cuando no hay selector. */
  unidad?: string;
  deslizador?: [number, number];
  pasoDeslizador?: number;
  error?: string;
  aviso?: string;
  ayuda?: string;
  deshabilitado?: boolean;
  accesorio?: ReactNode;
}

function aTexto(valor: number, unidad: UnidadVisual): string {
  return Number.isFinite(valor) ? String(Number((valor * unidad.factor).toPrecision(10))) : "";
}

/**
 * Campo numérico con unidad seleccionable y deslizador opcional. Guarda el
 * texto que escribe el usuario y entrega el valor convertido a unidades SI.
 */
export function CampoNumerico({
  etiqueta,
  simbolo,
  valor,
  alCambiar,
  unidades,
  unidad: unidadFija,
  deslizador,
  pasoDeslizador,
  error,
  aviso,
  ayuda,
  deshabilitado,
  accesorio,
}: PropiedadesCampoNumerico) {
  const id = useId();
  const [unidad, setUnidad] = useState<UnidadVisual>(() =>
    unidades ? elegirUnidadAdecuada(valor, unidades) : { etiqueta: unidadFija ?? "", factor: 1 },
  );
  const [texto, setTexto] = useState(() => aTexto(valor, unidad));
  const enfocado = useRef(false);

  useEffect(() => {
    if (!enfocado.current) setTexto(aTexto(valor, unidad));
  }, [valor, unidad]);

  const cambiarTexto = (nuevo: string) => {
    setTexto(nuevo);
    const numero = interpretarNumero(nuevo);
    if (numero !== null) alCambiar(Number((numero / unidad.factor).toPrecision(12)));
  };

  const borde = error ? "border-red-400/60" : aviso ? "border-amber-400/50" : "border-grafito-600 focus-within:border-acento";
  const valorDeslizador = deslizador ? Math.min(Math.max(valor, deslizador[0]), deslizador[1]) : 0;

  return (
    <div className={deshabilitado ? "opacity-50" : ""}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-slate-300">
          {etiqueta}
        </label>
        {simbolo && <EcuacionModulacion latex={simbolo} enLinea className="ecuacion-pequena shrink-0 text-slate-400" />}
      </div>
      <div className={`mt-1 flex overflow-hidden rounded-md border bg-grafito-950/70 transition-colors ${borde}`}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          disabled={deshabilitado}
          value={texto}
          aria-invalid={Boolean(error)}
          onFocus={() => (enfocado.current = true)}
          onBlur={() => {
            enfocado.current = false;
            setTexto(aTexto(valor, unidad));
          }}
          onChange={(e) => cambiarTexto(e.target.value)}
          className="w-full min-w-0 bg-transparent px-2.5 py-1.5 font-mono text-[13px] text-slate-100 tabular-nums outline-none"
        />
        {unidades ? (
          <select
            aria-label={`Unidad de ${etiqueta}`}
            value={unidad.etiqueta}
            disabled={deshabilitado}
            onChange={(e) => setUnidad(unidades.find((u) => u.etiqueta === e.target.value) ?? unidades[0])}
            className="border-l border-grafito-600 bg-grafito-800 px-2 text-xs text-slate-300 outline-none"
          >
            {unidades.map((u) => (
              <option key={u.etiqueta} value={u.etiqueta}>
                {u.etiqueta}
              </option>
            ))}
          </select>
        ) : unidadFija ? (
          <span className="flex items-center border-l border-grafito-600 bg-grafito-800 px-2.5 text-xs text-slate-400">{unidadFija}</span>
        ) : null}
      </div>
      {deslizador && (
        <input
          type="range"
          aria-label={`${etiqueta} (deslizador)`}
          min={deslizador[0]}
          max={deslizador[1]}
          step={pasoDeslizador ?? (deslizador[1] - deslizador[0]) / 500}
          value={valorDeslizador}
          disabled={deshabilitado}
          onChange={(e) => alCambiar(Number(e.target.value))}
          className="mt-2 h-1 w-full cursor-pointer"
        />
      )}
      {error ? (
        <p className="mt-1 text-[11px] leading-snug text-red-300">{error}</p>
      ) : aviso ? (
        <p className="mt-1 text-[11px] leading-snug text-amber-200">{aviso}</p>
      ) : ayuda ? (
        <p className="mt-1 text-[11px] leading-snug text-slate-500">{ayuda}</p>
      ) : null}
      {accesorio}
    </div>
  );
}
