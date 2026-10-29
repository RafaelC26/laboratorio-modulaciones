import type { ReactNode } from "react";

/** Agrupa visualmente los campos de una misma señal. */
export function GrupoCampos({ titulo, color, children }: { titulo: string; color?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-lg border border-grafito-700/70 bg-grafito-850/60 p-3">
      <legend className="flex items-center gap-1.5 px-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
        {color && <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />}
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}
