import type { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { SenalAnalogica } from "@/clases/SenalAnalogica";
import { SenalDigital } from "@/clases/SenalDigital";
import {
  amplitudSimboloASK,
  anchoBandaASK,
  anchoLobuloPrincipalASK,
  energiaBitASK,
  esOOK,
  frecuenciaMaximaASK,
  indiceModulacionASK,
  senalModuladaASK,
  velocidadTransmisionASK,
} from "@/formulas/formulasASK";
import { ciclosEnIntervalo, portadoraSeno } from "@/formulas/formulasPortadora";
import type { ConfiguracionTemporal } from "@/tipos/tiposModulacion";
import type { IntervaloSimbolo } from "@/tipos/tiposSenal";
import type { DatosModulacion, Metrica, MotorModulacion } from "@/tipos/tiposSimulacion";
import { formatearNumero } from "@/utilidades/formatoNumerico";
import { esEnteroAproximado } from "@/utilidades/validacionNumerica";
import { MotorConstelacion } from "./MotorConstelacion";
import { MotorMuestreo } from "./MotorMuestreo";

export class MotorModulacionASK implements MotorModulacion {
  readonly tipo = "ASK" as const;

  /** La simulación cubre exactamente la secuencia: [0, N_bits·T_bit). */
  intervaloTemporal(parametros: ParametrosModulacion, _temporal: ConfiguracionTemporal) {
    return { inicio: 0, fin: parametros.secuenciaBits.length * parametros.duracionSimbolo };
  }

  frecuenciaMaxima(parametros: ParametrosModulacion): number {
    return frecuenciaMaximaASK(parametros.frecuenciaPortadora, parametros.duracionSimbolo);
  }

  calcular(p: ParametrosModulacion, tiempo: Float64Array): DatosModulacion {
    const tb = p.duracionSimbolo;
    const fp = p.frecuenciaPortadora;
    const digital = new SenalDigital(p.secuenciaBits, tb);

    const bits = MotorMuestreo.evaluar(tiempo, (t) => digital.bitEn(t));
    const portadora = MotorMuestreo.evaluar(tiempo, (t) => portadoraSeno(t, p));
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
    const ciclos = ciclosEnIntervalo(fp, tb);
    const potenciaTeorica = (unos * p.amplitudBit1 ** 2 + ceros * p.amplitudBit0 ** 2) / (2 * Math.max(1, digital.cantidadBits));
    const senalModulada = new SenalAnalogica("Señal ASK v(t)", tiempo, modulada, fp);
    const variante = esOOK(p) ? "OOK (presencia o ausencia de portadora)" : "ASK con dos amplitudes";
    const vt = velocidadTransmisionASK(tb);

    const metricas: Metrica[] = [
      { clave: "variante", nombre: "Variante", valor: variante },
      { clave: "cantidadBits", nombre: "Bits transmitidos", valor: digital.cantidadBits },
      { clave: "duracionBit", nombre: "Duración de bit", simbolo: "T_{bit}", valor: tb, unidad: "s" },
      { clave: "velocidadTransmision", nombre: "Velocidad de transmisión", simbolo: "V_t=1/T_{bit}", valor: vt, unidad: "bit/s" },
      { clave: "velocidadModulacion", nombre: "Velocidad de modulación", valor: vt, unidad: "Bd" },
      { clave: "ciclosBit", nombre: "Ciclos de portadora por bit", simbolo: "f_pT_{bit}", valor: ciclos, estado: esEnteroAproximado(ciclos) ? "normal" : "advertencia", complemento: true },
      { clave: "anchoBanda", nombre: "Ancho de banda", simbolo: "BW=1/T_{bit}", valor: anchoBandaASK(tb), unidad: "Hz", complemento: true },
      { clave: "lobuloPrincipal", nombre: "Lóbulo principal (de nulo a nulo)", simbolo: "2/T_{bit}", valor: anchoLobuloPrincipalASK(tb), unidad: "Hz", complemento: true },
      { clave: "profundidad", nombre: "Profundidad de modulación", simbolo: String.raw`\frac{A_1-A_0}{A_1+A_0}`, valor: indiceModulacionASK(p), complemento: true },
      { clave: "energiaBit1", nombre: "Energía del bit 1", simbolo: "E_1", valor: e1, unidad: "J", complemento: true },
      { clave: "energiaBit0", nombre: "Energía del bit 0", simbolo: "E_0", valor: e0, unidad: "J", complemento: true },
      { clave: "potenciaTeorica", nombre: "Potencia media (teórica)", simbolo: String.raw`\bar P`, valor: potenciaTeorica, unidad: "W", complemento: true },
      { clave: "potenciaMedida", nombre: "Potencia media medida", simbolo: String.raw`\overline{v^2}`, valor: senalModulada.potenciaMedia, unidad: "W", complemento: true },
    ];

    const advertencias: string[] = [];
    if (!esEnteroAproximado(ciclos)) {
      advertencias.push(`f_p·T_bit = ${formatearNumero(ciclos)} no es entero: cada bit no contiene un número exacto de ciclos de portadora.`);
    }
    if (p.amplitudBit0 === p.amplitudBit1) advertencias.push("A₁ = A₀: los dos bits producen la misma señal y no se pueden distinguir.");

    return {
      nombreVariante: variante,
      moduladora: new SenalAnalogica("Moduladora vm(t)", tiempo, bits, vt, "nivel"),
      portadora: new SenalAnalogica("Portadora vp(t)", tiempo, portadora, fp),
      modulada: senalModulada,
      auxiliares: [
        { identificador: "amplitudSuperior", grafica: "modulada", estilo: "envolvente", ejeSecundario: false, senal: new SenalAnalogica("Amplitud del bit +Aᵢ", tiempo, amplitud, vt) },
        { identificador: "amplitudInferior", grafica: "modulada", estilo: "envolvente", ejeSecundario: false, senal: new SenalAnalogica("Amplitud del bit −Aᵢ", tiempo, amplitudInferior, vt) },
      ],
      metricas,
      resumen: {
        amplitudMaxima: Math.max(Math.abs(p.amplitudBit1), Math.abs(p.amplitudBit0)),
        amplitudMinima: Math.min(Math.abs(p.amplitudBit1), Math.abs(p.amplitudBit0)),
        frecuenciaCentral: fp,
        anchoBandaEstimado: anchoBandaASK(tb),
        tasaBits: vt,
        tasaSimbolos: vt,
        estados: 2,
      },
      intervalosSimbolo: intervalos,
      constelacion: MotorConstelacion.constelacionASK(p, digital.bits),
      componentesTeoricos: [],
      marcasFrecuencia: [
        { frecuencia: fp, etiqueta: "f_p" },
        ...(fp - vt > 0 ? [{ frecuencia: fp - vt, etiqueta: "f_p − 1/T_bit" }] : []),
        { frecuencia: fp + vt, etiqueta: "f_p + 1/T_bit" },
      ],
      regionesSobremodulacion: [],
      advertencias,
    };
  }
}
