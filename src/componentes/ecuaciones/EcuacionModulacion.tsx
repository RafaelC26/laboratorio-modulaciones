import katex from "katex";

interface PropiedadesEcuacion {
  latex: string;
  /** true: dentro del texto; false: ecuación en bloque. */
  enLinea?: boolean;
  className?: string;
}

/** Representa una expresión LaTeX con KaTeX. Funciona en servidor y en cliente. */
export function EcuacionModulacion({ latex, enLinea = false, className = "" }: PropiedadesEcuacion) {
  const html = katex.renderToString(latex, {
    displayMode: !enLinea,
    throwOnError: false,
    strict: "ignore",
    output: "htmlAndMathml",
  });
  const Etiqueta = enLinea ? "span" : "div";
  return <Etiqueta className={`ecuacion ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
