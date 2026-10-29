"use client";

import { ControlSimulacion } from "@/componentes/controles/ControlSimulacion";

/** Barra inferior con los controles de simulación; queda fija abajo en pantallas pequeñas. */
export function PieAplicacion() {
  return (
    <footer className="sticky bottom-0 z-20 border-t border-grafito-700/80 bg-grafito-900/95 px-4 py-2.5 backdrop-blur">
      <ControlSimulacion />
    </footer>
  );
}
