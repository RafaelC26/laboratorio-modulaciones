import type { SVGProps } from "react";

export type NombreIcono = "reiniciar" | "historial" | "chevron" | "alerta" | "onda" | "zoom";

const trazos: Record<NombreIcono, string> = {
  reiniciar: "M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0 0 12.4 1.6M18.5 9A7 7 0 0 0 6.1 7.4",
  historial: "M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v4h4",
  chevron: "m9 6 6 6-6 6",
  alerta: "M12 8v5m0 3.5v.01M10.3 3.8 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z",
  onda: "M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0 2 3 2 3",
  zoom: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 2-4-4M8 11h6",
};

export function Icono({ nombre, className = "size-4", ...resto }: { nombre: NombreIcono } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...resto}
    >
      <path d={trazos[nombre]} />
    </svg>
  );
}
