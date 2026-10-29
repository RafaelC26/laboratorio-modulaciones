"use client";

import Link from "next/link";
import { useAlmacenLaboratorio } from "@/estado/almacenLaboratorio";
import type { VistaLaboratorio } from "@/tipos/tiposGraficas";

/** Navegación entre el laboratorio y la vista de comparación. */
export function MenuPrincipal() {
  const vista = useAlmacenLaboratorio((s) => s.vista);
  const establecerVista = useAlmacenLaboratorio((s) => s.establecerVista);
  const cantidadComparacion = useAlmacenLaboratorio((s) => s.comparacion.length);

  const pestanas: { valor: VistaLaboratorio; nombre: string }[] = [
    { valor: "laboratorio", nombre: "Laboratorio" },
    { valor: "comparacion", nombre: cantidadComparacion ? `Comparación (${cantidadComparacion})` : "Comparación" },
  ];

  return (
    <nav aria-label="Secciones" className="flex items-center gap-1">
      {pestanas.map((pestana) => (
        <button
          key={pestana.valor}
          type="button"
          aria-current={vista === pestana.valor ? "page" : undefined}
          onClick={() => establecerVista(pestana.valor)}
          className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
            vista === pestana.valor ? "bg-grafito-700 text-white" : "text-slate-400 hover:bg-grafito-800 hover:text-slate-200"
          }`}
        >
          {pestana.nombre}
        </button>
      ))}
      <Link href="/" className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-grafito-800 hover:text-slate-200">
        Inicio
      </Link>
    </nav>
  );
}
