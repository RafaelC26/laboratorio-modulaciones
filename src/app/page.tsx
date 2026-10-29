import Link from "next/link";
import { EcuacionModulacion } from "@/componentes/ecuaciones/EcuacionModulacion";
import { LogoLaboratorio } from "@/componentes/interfaz/EncabezadoAplicacion";
import { configuracionGeneral, tecnicasDisponibles } from "@/configuracion/configuracionGeneral";
import { obtenerConjuntoFormulas } from "@/formulas/repositorioFormulas";

const CAPACIDADES = [
  "Señales moduladora, portadora y modulada calculadas muestra a muestra",
  "Espectro por FFT con ventanas y contraste con valores teóricos",
  "Constelaciones I/Q y tablas de mapeo para ASK y PSK",
  "Comparación de configuraciones y exportación CSV, JSON, reporte y PNG",
];

export default function PaginaInicio() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-10 sm:px-6 lg:py-16">
      <div className="flex items-center gap-3">
        <LogoLaboratorio className="size-10" />
        <span className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">Ingeniería de comunicaciones</span>
      </div>

      <h1 className="mt-8 max-w-3xl text-4xl font-bold tracking-tight text-balance text-slate-50 sm:text-5xl">
        {configuracionGeneral.nombreAplicacion}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-pretty text-slate-400">
        Configure una técnica de modulación, cambie sus parámetros y observe cómo la información modifica la amplitud o la fase de la portadora,
        en el tiempo y en la frecuencia.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/laboratorio"
          className="inline-flex items-center gap-2 rounded-lg bg-acento px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(79,140,255,0.8)] transition-colors hover:bg-acento-claro"
        >
          Entrar al laboratorio
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <section aria-label="Técnicas disponibles" className="mt-14 grid gap-4 sm:grid-cols-2">
        {tecnicasDisponibles.map((tecnica) => (
          <article key={tecnica.tipo} className="rounded-xl border border-grafito-700 bg-grafito-900/80 p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold text-slate-100">{tecnica.sigla}</h2>
              <span className="text-[11px] font-medium tracking-wider text-slate-500 uppercase">
                {tecnica.categoria === "analogica" ? "Analógica" : "Digital"}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-300">{tecnica.nombre}</p>
            <p className="mt-2 text-sm text-slate-400">{tecnica.caracteristica}</p>
            <div className="ecuacion-pequena mt-3 overflow-x-auto rounded-lg border border-grafito-700/70 bg-grafito-950/60 px-3 py-1">
              <EcuacionModulacion latex={obtenerConjuntoFormulas(tecnica.tipo).principal.ecuacion} />
            </div>
          </article>
        ))}
      </section>

      <section aria-label="Capacidades" className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CAPACIDADES.map((capacidad) => (
          <p key={capacidad} className="rounded-lg border border-grafito-700/60 bg-grafito-900/50 p-4 text-sm text-slate-400">
            {capacidad}
          </p>
        ))}
      </section>

      <p className="mt-auto pt-12 text-xs text-slate-600">
        Versión {configuracionGeneral.version} · Las ecuaciones de cada técnica se editan en <code className="font-mono">src/formulas/</code>
      </p>
    </main>
  );
}
