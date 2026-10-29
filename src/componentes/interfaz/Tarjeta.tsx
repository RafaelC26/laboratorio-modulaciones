import type { ReactNode } from "react";
import { Icono } from "./Iconos";

interface PropiedadesTarjeta {
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  acciones?: ReactNode;
  /** Color del punto que identifica la señal (opcional). */
  color?: string;
  children: ReactNode;
  className?: string;
  /** Si es true, la tarjeta se puede plegar (útil en móviles). */
  plegable?: boolean;
  abierta?: boolean;
  sinRelleno?: boolean;
}

const claseContenedor = "rounded-xl border border-grafito-700/80 bg-grafito-900/90 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]";

function Encabezado({ titulo, subtitulo, acciones, color, plegable }: Omit<PropiedadesTarjeta, "children">) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 pt-3 pb-2">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-slate-100">
          {plegable && <Icono nombre="chevron" className="indicador-plegable size-3.5 text-slate-500 transition-transform" />}
          {color && <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
          {titulo}
        </h2>
        {subtitulo && <div className="mt-0.5 text-xs text-slate-400">{subtitulo}</div>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}

export function Tarjeta({ children, className = "", plegable, abierta = true, sinRelleno, ...encabezado }: PropiedadesTarjeta) {
  const cuerpo = <div className={sinRelleno ? "" : "px-4 pb-4"}>{children}</div>;
  if (plegable) {
    return (
      <details open={abierta} className={`${claseContenedor} ${className}`}>
        <summary>
          <Encabezado {...encabezado} plegable />
        </summary>
        {cuerpo}
      </details>
    );
  }
  return (
    <section className={`${claseContenedor} ${className}`}>
      {encabezado.titulo && <Encabezado {...encabezado} />}
      {cuerpo}
    </section>
  );
}

export function Insignia({ children, tono = "neutro" }: { children: ReactNode; tono?: "neutro" | "exito" | "advertencia" | "error" | "acento" }) {
  const tonos = {
    neutro: "border-grafito-600 bg-grafito-800 text-slate-300",
    exito: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    advertencia: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    error: "border-red-400/30 bg-red-400/10 text-red-300",
    acento: "border-acento/30 bg-acento/10 text-acento-claro",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tonos[tono]}`}>{children}</span>;
}

export function Boton({
  children,
  variante = "secundario",
  className = "",
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primario" | "secundario" | "fantasma" }) {
  const variantes = {
    primario: "bg-acento text-white hover:bg-acento-claro shadow-[0_0_0_1px_rgba(79,140,255,0.4),0_6px_20px_-6px_rgba(79,140,255,0.6)]",
    secundario: "border border-grafito-600 bg-grafito-800 text-slate-200 hover:border-grafito-500 hover:bg-grafito-700",
    fantasma: "text-slate-300 hover:bg-grafito-800 hover:text-white",
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento disabled:cursor-not-allowed disabled:opacity-45 ${variantes[variante]} ${className}`}
      {...resto}
    >
      {children}
    </button>
  );
}

export function MensajesValidacion({ errores, advertencias }: { errores: { mensaje: string }[]; advertencias: { mensaje: string }[] }) {
  if (!errores.length && !advertencias.length) return null;
  return (
    <ul className="space-y-1.5 text-xs">
      {errores.map((e, i) => (
        <li key={`e${i}`} className="flex gap-2 rounded-md border border-red-400/25 bg-red-400/8 px-2.5 py-1.5 text-red-200">
          <Icono nombre="alerta" className="mt-px size-3.5 shrink-0 text-error" />
          <span>{e.mensaje}</span>
        </li>
      ))}
      {advertencias.map((a, i) => (
        <li key={`a${i}`} className="flex gap-2 rounded-md border border-amber-400/25 bg-amber-400/8 px-2.5 py-1.5 text-amber-100">
          <Icono nombre="alerta" className="mt-px size-3.5 shrink-0 text-advertencia" />
          <span>{a.mensaje}</span>
        </li>
      ))}
    </ul>
  );
}
