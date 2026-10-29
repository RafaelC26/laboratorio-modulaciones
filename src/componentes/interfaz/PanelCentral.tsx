"use client";

import { PanelComparacion } from "@/componentes/comparacion/PanelComparacion";
import { PanelGraficas } from "@/componentes/graficas/PanelGraficas";
import { useAlmacenLaboratorio } from "@/estado/almacenLaboratorio";

/** Panel central: gráficas del laboratorio o vista de comparación. */
export function PanelCentral({ className = "" }: { className?: string }) {
  const vista = useAlmacenLaboratorio((s) => s.vista);
  return (
    <section aria-label={vista === "laboratorio" ? "Visualización" : "Comparación"} className={`desplazable ${className}`}>
      {vista === "laboratorio" ? <PanelGraficas /> : <PanelComparacion />}
    </section>
  );
}
