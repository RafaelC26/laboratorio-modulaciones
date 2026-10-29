import type { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import type { TipoModulacion } from "./tiposModulacion";

/** Variable que aparece en una ecuación. */
export interface VariableFormula {
  /** Símbolo en LaTeX, por ejemplo "A_c". */
  simbolo: string;
  descripcion: string;
  unidad: string;
  /** Obtiene el valor numérico usado en la simulación (si aplica). */
  valor?: (parametros: ParametrosModulacion) => number;
}

/** Definición documentada de una fórmula (sección 10.2 del documento del proyecto). */
export interface DefinicionFormula {
  identificador: string;
  nombre: string;
  /** Expresión en LaTeX, representada con KaTeX. */
  ecuacion: string;
  variables: VariableFormula[];
  descripcion: string;
  /** Unidad del resultado de la fórmula. */
  unidad: string;
  version: string;
}

/** Conjunto de fórmulas de una técnica: la principal y sus complementarias. */
export interface ConjuntoFormulas {
  tecnica: TipoModulacion;
  /** Archivo donde se editan las ecuaciones de esta técnica. */
  archivo: string;
  version: string;
  principal: DefinicionFormula;
  complementarias: DefinicionFormula[];
  /** Devuelve la ecuación principal con los valores numéricos sustituidos (LaTeX). */
  sustituir: (parametros: ParametrosModulacion) => string;
}
