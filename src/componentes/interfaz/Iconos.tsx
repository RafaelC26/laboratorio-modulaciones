import type { SVGProps } from "react";

export type NombreIcono =
  | "ejecutar"
  | "pausa"
  | "reiniciar"
  | "descargar"
  | "comparar"
  | "historial"
  | "chevron"
  | "cerrar"
  | "alerta"
  | "informacion"
  | "onda"
  | "zoom"
  | "papelera"
  | "flecha";

const trazos: Record<NombreIcono, string> = {
  ejecutar: "M7 5v14l11-7z",
  pausa: "M8 5v14M16 5v14",
  reiniciar: "M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0 0 12.4 1.6M18.5 9A7 7 0 0 0 6.1 7.4",
  descargar: "M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14",
  comparar: "M4 6h7M4 12h7M4 18h7M15 6l3 3 3-3M18 9V4M15 18l3-3 3 3M18 15v5",
  historial: "M12 7v5l3 2M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v4h4",
  chevron: "m9 6 6 6-6 6",
  cerrar: "M6 6l12 12M18 6 6 18",
  alerta: "M12 8v5m0 3.5v.01M10.3 3.8 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z",
  informacion: "M12 11v6m0-9.5v.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  onda: "M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0 2 3 2 3",
  zoom: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 2-4-4M8 11h6",
  papelera: "M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  flecha: "M5 12h14m-6-6 6 6-6 6",
};

export function Icono({ nombre, className = "size-4", ...resto }: { nombre: NombreIcono } & SVGProps<SVGSVGElement>) {
  const relleno = nombre === "ejecutar";
  return (
    <svg
      viewBox="0 0 24 24"
      fill={relleno ? "currentColor" : "none"}
      stroke={relleno ? "none" : "currentColor"}
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
