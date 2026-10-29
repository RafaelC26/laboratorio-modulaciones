/**
 * Repositorio central de fórmulas: asocia cada técnica con su conjunto de
 * ecuaciones. Para incorporar una técnica nueva se crea su archivo
 * formulasXXX.ts y se registra aquí.
 */
import { formulasAM } from "./formulasAM";
import { formulasASK } from "./formulasASK";
import { formulasPSK } from "./formulasPSK";
import { formulasPSM } from "./formulasPSM";
import type { ConjuntoFormulas } from "@/tipos/tiposFormulas";
import type { TipoModulacion } from "@/tipos/tiposModulacion";

const repositorio = new Map<TipoModulacion, ConjuntoFormulas>([
  ["AM", formulasAM],
  ["ASK", formulasASK],
  ["PSK", formulasPSK],
  ["PSM", formulasPSM],
]);

export function obtenerConjuntoFormulas(tipo: TipoModulacion): ConjuntoFormulas {
  const conjunto = repositorio.get(tipo);
  if (!conjunto) throw new Error(`No hay fórmulas registradas para ${tipo}.`);
  return conjunto;
}

export function registrarConjuntoFormulas(conjunto: ConjuntoFormulas): void {
  repositorio.set(conjunto.tecnica, conjunto);
}

export function listarConjuntosFormulas(): ConjuntoFormulas[] {
  return [...repositorio.values()];
}
