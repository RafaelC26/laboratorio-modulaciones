import { PanelGraficas } from "@/componentes/graficas/PanelGraficas";

/** Panel central: gráficas del laboratorio. */
export function PanelCentral({ className = "" }: { className?: string }) {
  return (
    <section aria-label="Visualización" className={`desplazable ${className}`}>
      <PanelGraficas />
    </section>
  );
}
