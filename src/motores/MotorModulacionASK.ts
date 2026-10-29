import type { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { SenalAnalogica } from "@/clases/SenalAnalogica";
import { SenalDigital } from "@/clases/SenalDigital";
import {
  amplitudSimboloASK,
  anchoBandaASK,
  energiaBitASK,
  esOOK,
  frecuenciaMaximaASK,
  indiceModulacionASK,
  senalModuladaASK,
  tasaBitsASK,
} from "@/formulas/formulasASK";
import { ciclosEnIntervalo, senalPortadora } from "@/formulas/formulasPortadora";
import type { ConfiguracionTemporal } from "@/tipos/tiposModulacion";
import type { IntervaloSimbolo } from "@/tipos/tiposSenal";
import type { DatosModulacion, Metrica, MotorModulacion } from "@/tipos/tiposSimulacion";
import { formatearNumero } from "@/utilidades/formatoNumerico";
import { esEnteroAproximado } from "@/utilidades/validacionNumerica";
import { MotorConstelacion } from "./MotorConstelacion";
import { MotorMuestreo } from "./MotorMuestreo";

export class MotorModulacionASK implements MotorModulacion {
  readonly tipo = "ASK" as const;

  /** La simulación cubre exactamente la secuencia: [0, N·T_b). */
  intervaloTemporal(parametros: ParametrosModulacion, _temporal: ConfiguracionTemporal) {
    return { inicio: 0, fin: parametros.secuenciaBits.length * parametros.duracionSimbolo };
  }

  frecuenciaMaxima(parametros: ParametrosModulacion): number {
    return frecuenciaMaximaASK(parametros.frecuenciaPortadora, parametros.duracionSimbolo);
  }

  calcular(p: ParametrosModulacion, tiempo: Float64Array): DatosModulacion {
    const tb = p.duracionSimbolo;
    const fc = p.frecuenciaPortadora;
    const digital = new SenalDigital(p.secuenciaBits, tb);

    const bits = MotorMuestreo.evaluar(tiempo, (t) => digital.bitEn(t));
    const portadora = MotorMuestreo.evaluar(tiempo, (t) => senalPortadora(t, p));
    const modulada = MotorMuestreo.evaluar(tiempo, (t, n) => senalModuladaASK(t, bits[n], p));
    const amplitud = MotorMuestreo.evaluar(tiempo, (_t, n) => amplitudSimboloASK(bits[n], p));
    const amplitudInferior = amplitud.map((valor) => -valor);

    const intervalos: IntervaloSimbolo[] = digital.bits.map((bit, indice) => {
      const [inicio, fin] = digital.intervaloBit(indice);
      return { indiceSimbolo: indice, inicio, fin, bits: [bit], indiceEstado: bit, amplitud: amplitudSimboloASK(bit, p), fase: p.faseInicial, etiqueta: String(bit) };
    });

    const unos = digital.bits.filter((b) => b === 1).length;
    const ceros = digital.cantidadBits - unos;
    const e1 = energiaBitASK(p.amplitudBit1, tb);
    const e0 = energiaBitASK(p.amplitudBit0, tb);
    const ciclos = ciclosEnIntervalo(fc, tb);
    const potenciaTeorica = (unos * p.amplitudBit1 ** 2 + ceros * p.amplitudBit0 ** 2) / (2 * Math.max(1, digital.cantidadBits));
    const senalModulada = new SenalAnalogica("Señal ASK s(t)", tiempo, modulada, fc);
    const variante = esOOK(p) ? "OOK (encendido/apagado)" : "ASK binaria";
    const rb = tasaBitsASK(tb);

    const metricas: Metrica[] = [
      { clave: "variante", nombre: "Variante", valor: variante },
      { clave: "cantidadBits", nombre: "Bits transmitidos", simbolo: "N_b", valor: digital.cantidadBits },
      { clave: "duracionBit", nombre: "Duración de bit", simbolo: "T_b", valor: tb, unidad: "s" },
      { clave: "tasaBits", nombre: "Tasa de bits", simbolo: "R_b=1/T_b", valor: rb, unidad: "bit/s" },
      { clave: "tasaSimbolos", nombre: "Tasa de símbolos", simbolo: "R_s", valor: rb, unidad: "Bd" },
      { clave: "ciclosBit", nombre: "Ciclos de portadora por bit", simbolo: "f_cT_b", valor: ciclos, estado: esEnteroAproximado(ciclos) ? "normal" : "advertencia" },
      { clave: "anchoBanda", nombre: "Ancho de banda (nulo a nulo)", simbolo: "B=2R_b", valor: anchoBandaASK(tb), unidad: "Hz" },
      { clave: "profundidad", nombre: "Profundidad de modulación", simbolo: String.raw`\frac{A_1-A_0}{A_1+A_0}`, valor: indiceModulacionASK(p) },
      { clave: "energiaBit1", nombre: "Energía del bit 1", simbolo: "E_1", valor: e1, unidad: "J" },
      { clave: "energiaBit0", nombre: "Energía del bit 0", simbolo: "E_0", valor: e0, unidad: "J" },
      { clave: "potenciaTeorica", nombre: "Potencia media (teórica)", simbolo: String.raw`\bar P`, valor: potenciaTeorica, unidad: "W" },
      { clave: "potenciaMedida", nombre: "Potencia media medida", simbolo: String.raw`\overline{s^2}`, valor: senalModulada.potenciaMedia, unidad: "W" },
    ];

    const advertencias: string[] = [];
    if (!esEnteroAproximado(ciclos)) {
      advertencias.push(`f_c·T_b = ${formatearNumero(ciclos)} no es entero: cada bit no contiene un número exacto de ciclos de portadora.`);
    }
    if (p.amplitudBit0 === p.amplitudBit1) advertencias.push("A₁ = A₀: los dos bits producen la misma señal y no se pueden distinguir.");

    return {
      nombreVariante: variante,
      moduladora: new SenalAnalogica("Secuencia digital b(t)", tiempo, bits, rb, "bit"),
      portadora: new SenalAnalogica("Portadora c(t)", tiempo, portadora, fc),
      modulada: senalModulada,
      auxiliares: [
        { identificador: "amplitudSuperior", grafica: "modulada", estilo: "envolvente", ejeSecundario: false, senal: new SenalAnalogica("Amplitud del bit +Aᵢ", tiempo, amplitud, rb) },
        { identificador: "amplitudInferior", grafica: "modulada", estilo: "envolvente", ejeSecundario: false, senal: new SenalAnalogica("Amplitud del bit −Aᵢ", tiempo, amplitudInferior, rb) },
      ],
      metricas,
      resumen: {
        amplitudMaxima: Math.max(Math.abs(p.amplitudBit1), Math.abs(p.amplitudBit0)),
        amplitudMinima: Math.min(Math.abs(p.amplitudBit1), Math.abs(p.amplitudBit0)),
        frecuenciaCentral: fc,
        anchoBandaEstimado: anchoBandaASK(tb),
        tasaBits: rb,
        tasaSimbolos: rb,
        estados: 2,
      },
      intervalosSimbolo: intervalos,
      constelacion: MotorConstelacion.constelacionASK(p, digital.bits),
      componentesTeoricos: [],
      marcasFrecuencia: [
        { frecuencia: fc, etiqueta: "f_c" },
        ...(fc - rb > 0 ? [{ frecuencia: fc - rb, etiqueta: "f_c − R_b" }] : []),
        { frecuencia: fc + rb, etiqueta: "f_c + R_b" },
      ],
      regionesSobremodulacion: [],
      advertencias,
    };
  }
}
