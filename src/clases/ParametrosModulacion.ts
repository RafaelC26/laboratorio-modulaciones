import { indiceModulacionAM } from "@/formulas/formulasAM";
import { indiceModulacionFase } from "@/formulas/formulasPSM";
import { SenalDigital } from "./SenalDigital";
import type { EntradaModulacion, MapeoSimbolos, TipoModulacion } from "@/tipos/tiposModulacion";

interface CamposParametros {
  tipoModulacion: TipoModulacion;
  amplitudPortadora: number;
  frecuenciaPortadora: number;
  faseInicial: number;
  amplitudModuladora: number;
  frecuenciaModuladora: number;
  indiceModulacion: number | null;
  sensibilidadFase: number;
  secuenciaBits: number[];
  amplitudBit1: number;
  amplitudBit0: number;
  duracionSimbolo: number;
  ordenModulacion: number;
  mapeoSimbolos: MapeoSimbolos;
}

/**
 * Parámetros normalizados que reciben los motores matemáticos. Se construyen a
 * partir de lo que el usuario escribe en el formulario de cada técnica; los
 * campos que no aplican a una técnica quedan en 0 o vacíos.
 */
export class ParametrosModulacion implements CamposParametros {
  readonly tipoModulacion: TipoModulacion;
  readonly amplitudPortadora: number;
  readonly frecuenciaPortadora: number;
  readonly faseInicial: number;
  readonly amplitudModuladora: number;
  readonly frecuenciaModuladora: number;
  /** AM: μ = A_m/A_c. PSM: β = k_p·A_m [rad]. Digitales: null. */
  readonly indiceModulacion: number | null;
  readonly sensibilidadFase: number;
  readonly secuenciaBits: number[];
  readonly amplitudBit1: number;
  readonly amplitudBit0: number;
  /** ASK: T_b. PSK: T_s. */
  readonly duracionSimbolo: number;
  /** Número de estados M. */
  readonly ordenModulacion: number;
  readonly mapeoSimbolos: MapeoSimbolos;

  constructor(campos: CamposParametros) {
    this.tipoModulacion = campos.tipoModulacion;
    this.amplitudPortadora = campos.amplitudPortadora;
    this.frecuenciaPortadora = campos.frecuenciaPortadora;
    this.faseInicial = campos.faseInicial;
    this.amplitudModuladora = campos.amplitudModuladora;
    this.frecuenciaModuladora = campos.frecuenciaModuladora;
    this.indiceModulacion = campos.indiceModulacion;
    this.sensibilidadFase = campos.sensibilidadFase;
    this.secuenciaBits = [...campos.secuenciaBits];
    this.amplitudBit1 = campos.amplitudBit1;
    this.amplitudBit0 = campos.amplitudBit0;
    this.duracionSimbolo = campos.duracionSimbolo;
    this.ordenModulacion = campos.ordenModulacion;
    this.mapeoSimbolos = campos.mapeoSimbolos;
  }

  static desdeEntrada(entrada: EntradaModulacion): ParametrosModulacion {
    const base = {
      amplitudModuladora: 0,
      frecuenciaModuladora: 0,
      indiceModulacion: null,
      sensibilidadFase: 0,
      secuenciaBits: [] as number[],
      amplitudBit1: 0,
      amplitudBit0: 0,
      duracionSimbolo: 0,
      ordenModulacion: 1,
      mapeoSimbolos: "binario" as MapeoSimbolos,
    };
    switch (entrada.tipo) {
      case "AM":
        return new ParametrosModulacion({
          ...base,
          tipoModulacion: "AM",
          amplitudPortadora: entrada.amplitudPortadora,
          frecuenciaPortadora: entrada.frecuenciaPortadora,
          faseInicial: entrada.faseInicial,
          amplitudModuladora: entrada.amplitudModuladora,
          frecuenciaModuladora: entrada.frecuenciaModuladora,
          indiceModulacion: indiceModulacionAM(entrada),
        });
      case "ASK":
        return new ParametrosModulacion({
          ...base,
          tipoModulacion: "ASK",
          // La portadora de referencia usa la mayor de las dos amplitudes (A_1 en OOK).
          amplitudPortadora: Math.max(Math.abs(entrada.amplitudBit1), Math.abs(entrada.amplitudBit0)),
          frecuenciaPortadora: entrada.frecuenciaPortadora,
          faseInicial: entrada.faseInicial,
          secuenciaBits: SenalDigital.desdeTexto(entrada.secuenciaBits, entrada.duracionBit).bits,
          amplitudBit1: entrada.amplitudBit1,
          amplitudBit0: entrada.amplitudBit0,
          duracionSimbolo: entrada.duracionBit,
          ordenModulacion: 2,
        });
      case "PSK":
        return new ParametrosModulacion({
          ...base,
          tipoModulacion: "PSK",
          amplitudPortadora: entrada.amplitudPortadora,
          frecuenciaPortadora: entrada.frecuenciaPortadora,
          faseInicial: entrada.faseInicial,
          secuenciaBits: SenalDigital.desdeTexto(entrada.secuenciaBits, entrada.duracionSimbolo).bits,
          duracionSimbolo: entrada.duracionSimbolo,
          ordenModulacion: entrada.ordenModulacion,
          mapeoSimbolos: entrada.mapeoSimbolos,
        });
      case "PSM":
        return new ParametrosModulacion({
          ...base,
          tipoModulacion: "PSM",
          amplitudPortadora: entrada.amplitudPortadora,
          frecuenciaPortadora: entrada.frecuenciaPortadora,
          faseInicial: entrada.faseInicial,
          amplitudModuladora: entrada.amplitudModuladora,
          frecuenciaModuladora: entrada.frecuenciaModuladora,
          sensibilidadFase: entrada.sensibilidadFase,
          indiceModulacion: indiceModulacionFase(entrada),
        });
    }
  }

  /** k = log₂M */
  get bitsPorSimbolo(): number {
    return Math.max(1, Math.round(Math.log2(this.ordenModulacion)));
  }

  /** R_s = 1/T_s */
  get tasaSimbolos(): number {
    return this.duracionSimbolo > 0 ? 1 / this.duracionSimbolo : 0;
  }

  /** R_b = k·R_s */
  get tasaBits(): number {
    return this.bitsPorSimbolo * this.tasaSimbolos;
  }

  /** T_b = T_s / k */
  get duracionBit(): number {
    return this.duracionSimbolo / this.bitsPorSimbolo;
  }

  get esDigital(): boolean {
    return this.tipoModulacion === "ASK" || this.tipoModulacion === "PSK";
  }

  aObjetoPlano(): CamposParametros {
    return {
      tipoModulacion: this.tipoModulacion,
      amplitudPortadora: this.amplitudPortadora,
      frecuenciaPortadora: this.frecuenciaPortadora,
      faseInicial: this.faseInicial,
      amplitudModuladora: this.amplitudModuladora,
      frecuenciaModuladora: this.frecuenciaModuladora,
      indiceModulacion: this.indiceModulacion,
      sensibilidadFase: this.sensibilidadFase,
      secuenciaBits: [...this.secuenciaBits],
      amplitudBit1: this.amplitudBit1,
      amplitudBit0: this.amplitudBit0,
      duracionSimbolo: this.duracionSimbolo,
      ordenModulacion: this.ordenModulacion,
      mapeoSimbolos: this.mapeoSimbolos,
    };
  }
}
