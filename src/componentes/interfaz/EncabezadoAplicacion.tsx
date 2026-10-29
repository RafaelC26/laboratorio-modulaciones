import { configuracionGeneral } from "@/configuracion/configuracionGeneral";
import { MenuPrincipal } from "./MenuPrincipal";

export function LogoLaboratorio({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#141820" stroke="#2f3647" />
      <path d="M4 16c2.5-7 5-7 7.5 0s5 7 7.5 0 5-7 7.5 0" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 16c2.5-3.5 5-3.5 7.5 0s5 3.5 7.5 0 5-3.5 7.5 0" fill="none" stroke="#4f8cff" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function EncabezadoAplicacion() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-grafito-700/80 bg-grafito-900/80 px-4 py-2.5 backdrop-blur">
      <div className="flex items-center gap-3">
        <LogoLaboratorio />
        <div>
          <h1 className="text-sm font-bold tracking-[0.12em] text-slate-100 uppercase">{configuracionGeneral.nombreAplicacion}</h1>
          <p className="text-[11px] text-slate-500">AM · ASK · PSK · PSM — {configuracionGeneral.descripcion.toLowerCase()}</p>
        </div>
      </div>
      <MenuPrincipal />
    </header>
  );
}
