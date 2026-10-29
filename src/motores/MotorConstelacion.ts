import type { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { bitsDeEstadoPSK, faseSimboloPSK, puntoConstelacionPSK } from "@/formulas/formulasPSK";
import type { PuntoConstelacion } from "@/tipos/tiposSenal";

/**
 * Coordenadas de los símbolos en el plano complejo (I = en fase, Q = cuadratura).
 */
export class MotorConstelacion {
  /** Los M puntos ideales de M-PSK con los bits asignados y cuántas veces se transmitió cada uno. */
  static constelacionPSK(parametros: ParametrosModulacion, indicesTransmitidos: number[]): PuntoConstelacion[] {
    const orden = parametros.ordenModulacion;
    const repeticiones = contarRepeticiones(indicesTransmitidos, orden);
    return Array.from({ length: orden }, (_, indice) => {
      const fase = faseSimboloPSK(indice, orden, parametros.faseInicial);
      const { enFase, cuadratura } = puntoConstelacionPSK(fase, parametros.amplitudPortadora);
      return {
        indiceEstado: indice,
        enFase: limpiarCero(enFase),
        cuadratura: limpiarCero(cuadratura),
        fase,
        amplitud: parametros.amplitudPortadora,
        etiqueta: bitsDeEstadoPSK(indice, parametros.bitsPorSimbolo, parametros.mapeoSimbolos).join(""),
        repeticiones: repeticiones[indice],
      };
    });
  }

  /** ASK binaria: dos puntos sobre el eje I en A_0 y A_1. */
  static constelacionASK(parametros: ParametrosModulacion, bitsTransmitidos: number[]): PuntoConstelacion[] {
    const repeticiones = contarRepeticiones(bitsTransmitidos, 2);
    return [parametros.amplitudBit0, parametros.amplitudBit1].map((amplitud, indice) => ({
      indiceEstado: indice,
      enFase: amplitud,
      cuadratura: 0,
      fase: amplitud < 0 ? Math.PI : 0,
      amplitud: Math.abs(amplitud),
      etiqueta: String(indice),
      repeticiones: repeticiones[indice],
    }));
  }
}

function contarRepeticiones(indices: number[], cantidad: number): number[] {
  const conteo = new Array<number>(cantidad).fill(0);
  for (const indice of indices) if (indice >= 0 && indice < cantidad) conteo[indice] += 1;
  return conteo;
}

/** Evita mostrar valores como 6.1e-17 donde el resultado exacto es 0. */
function limpiarCero(valor: number): number {
  return Math.abs(valor) < 1e-12 ? 0 : valor;
}
