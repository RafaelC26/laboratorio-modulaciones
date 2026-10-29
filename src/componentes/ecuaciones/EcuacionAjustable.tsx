"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { EcuacionModulacion } from "./EcuacionModulacion";

/**
 * Ecuación en bloque que reduce su tamaño (hasta `escalaMinima`) para caber en
 * el ancho disponible; por debajo de ese mínimo se desplaza horizontalmente.
 */
export function EcuacionAjustable({ latex, escalaMinima = 0.6 }: { latex: string; escalaMinima?: number }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const escalaActual = useRef(1);
  const [escala, setEscala] = useState(1);

  useLayoutEffect(() => {
    const elemento = contenedor.current;
    if (!elemento) return;
    const medir = () => {
      // Cada hijo de .katex-html es un tramo horizontal de la expresión (.base / .katex-base según la versión).
      const bloques = elemento.querySelectorAll<HTMLElement>(".katex-html > *");
      let anchoActual = 0;
      bloques.forEach((bloque) => (anchoActual += bloque.getBoundingClientRect().width));
      if (!anchoActual) return;
      const anchoNatural = anchoActual / escalaActual.current;
      const disponible = elemento.clientWidth - 4;
      const nueva = Math.max(escalaMinima, Math.min(1, disponible / anchoNatural));
      if (Math.abs(nueva - escalaActual.current) > 0.005) {
        escalaActual.current = nueva;
        setEscala(nueva);
      }
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [latex, escalaMinima]);

  return (
    <div ref={contenedor} style={{ fontSize: `${escala}em` }}>
      <EcuacionModulacion latex={latex} />
    </div>
  );
}
