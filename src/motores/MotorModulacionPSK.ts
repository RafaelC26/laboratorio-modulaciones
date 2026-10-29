import type { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { SenalAnalogica } from "@/clases/SenalAnalogica";
import { indiceIntervalo, SenalDigital } from "@/clases/SenalDigital";
import { ciclosEnIntervalo, senalPortadora } from "@/formulas/formulasPortadora";
import {
  anchoBandaPSK,
  distanciaMinimaPSK,
  eficienciaEspectralPSK,
  energiaSimboloPSK,
  faseSimboloPSK,
  frecuenciaMaximaPSK,
  indiceEstadoPSK,
  nombreVariantePSK,
  senalModuladaPSK,
} from "@/formulas/formulasPSK";
import type { ConfiguracionTemporal } from "@/tipos/tiposModulacion";
import type { IntervaloSimbolo } from "@/tipos/tiposSenal";
import type { DatosModulacion, Metrica, MotorModulacion } from "@/tipos/tiposSimulacion";
import { normalizarAngulo, radianesAGrados } from "@/utilidades/conversionUnidades";
import { formatearNumero } from "@/utilidades/formatoNumerico";
import { esEnteroAproximado } from "@/utilidades/validacionNumerica";
import { MotorConstelacion } from "./MotorConstelacion";
import { MotorMuestreo } from "./MotorMuestreo";

export class MotorModulacionPSK implements MotorModulacion {
  readonly tipo = "PSK" as const;

  /** [0, N_s·T_s), con N_s = ⌈bits / k⌉ símbolos. */
  intervaloTemporal(parametros: ParametrosModulacion, _temporal: ConfiguracionTemporal) {
    const simbolos = Math.ceil(parametros.secuenciaBits.length / parametros.bitsPorSimbolo);
    return { inicio: 0, fin: simbolos * parametros.duracionSimbolo };
  }

  frecuenciaMaxima(parametros: ParametrosModulacion): number {
    return frecuenciaMaximaPSK(parametros.frecuenciaPortadora, parametros.duracionSimbolo);
  }

  calcular(p: ParametrosModulacion, tiempo: Float64Array): DatosModulacion {
    const orden = p.ordenModulacion;
    const k = p.bitsPorSimbolo;
    const ts = p.duracionSimbolo;
    const fc = p.frecuenciaPortadora;

    const { grupos, bitsRelleno } = new SenalDigital(p.secuenciaBits, p.duracionBit).agruparEnSimbolos(k);
    const indices = grupos.map((grupo) => indiceEstadoPSK(grupo, p.mapeoSimbolos));
    const fases = indices.map((indice) => faseSimboloPSK(indice, orden, p.faseInicial));
    const bitsCompletos = new SenalDigital(grupos.flat(), p.duracionBit);
    const cantidadSimbolos = grupos.length;

    // La portadora de referencia se dibuja con fase 0 para que se aprecie el desplazamiento φ_i.
    const referencia = { amplitudPortadora: p.amplitudPortadora, frecuenciaPortadora: fc, faseInicial: 0 };
    const simboloEn = (t: number) => indiceIntervalo(t, ts, cantidadSimbolos);

    const bits = MotorMuestreo.evaluar(tiempo, (t) => bitsCompletos.bitEn(t));
    const portadora = MotorMuestreo.evaluar(tiempo, (t) => senalPortadora(t, referencia));
    const modulada = MotorMuestreo.evaluar(tiempo, (t) => senalModuladaPSK(t, fases[simboloEn(t)], p));
    const faseGrados = MotorMuestreo.evaluar(tiempo, (t) => radianesAGrados(normalizarAngulo(fases[simboloEn(t)])));

    const intervalos: IntervaloSimbolo[] = grupos.map((grupo, j) => ({
      indiceSimbolo: j,
      inicio: j * ts,
      fin: (j + 1) * ts,
      bits: grupo,
      indiceEstado: indices[j],
      amplitud: p.amplitudPortadora,
      fase: fases[j],
      etiqueta: grupo.join(""),
    }));

    const rs = p.tasaSimbolos;
    const rb = p.tasaBits;
    const es = energiaSimboloPSK(p.amplitudPortadora, ts);
    const ciclos = ciclosEnIntervalo(fc, ts);
    const variante = nombreVariantePSK(orden);
    const senalModulada = new SenalAnalogica(`Señal ${variante} s(t)`, tiempo, modulada, fc);

    const metricas: Metrica[] = [
      { clave: "variante", nombre: "Variante", valor: variante },
      { clave: "orden", nombre: "Estados de fase", simbolo: "M", valor: orden },
      { clave: "bitsPorSimbolo", nombre: "Bits por símbolo", simbolo: String.raw`k=\log_2M`, valor: k },
      { clave: "cantidadSimbolos", nombre: "Símbolos transmitidos", simbolo: "N_s", valor: cantidadSimbolos },
      { clave: "bitsRelleno", nombre: "Bits de relleno", valor: bitsRelleno, estado: bitsRelleno ? "advertencia" : "normal" },
      { clave: "duracionSimbolo", nombre: "Duración de símbolo", simbolo: "T_s", valor: ts, unidad: "s" },
      { clave: "duracionBit", nombre: "Duración de bit", simbolo: "T_b=T_s/k", valor: p.duracionBit, unidad: "s" },
      { clave: "tasaSimbolos", nombre: "Tasa de símbolos", simbolo: "R_s", valor: rs, unidad: "Bd" },
      { clave: "tasaBits", nombre: "Tasa de bits", simbolo: "R_b=kR_s", valor: rb, unidad: "bit/s" },
      { clave: "separacionFase", nombre: "Separación entre fases", simbolo: String.raw`2\pi/M`, valor: 360 / orden, unidad: "°" },
      { clave: "anchoBanda", nombre: "Ancho de banda (nulo a nulo)", simbolo: "B=2R_s", valor: anchoBandaPSK(rs), unidad: "Hz" },
      { clave: "eficienciaEspectral", nombre: "Eficiencia espectral", simbolo: "R_b/B", valor: eficienciaEspectralPSK(orden), unidad: "bit/s/Hz" },
      { clave: "distanciaMinima", nombre: "Distancia mínima", simbolo: "d_{min}", valor: distanciaMinimaPSK(p.amplitudPortadora, orden), unidad: "V" },
      { clave: "ciclosSimbolo", nombre: "Ciclos de portadora por símbolo", simbolo: "f_cT_s", valor: ciclos, estado: esEnteroAproximado(ciclos) ? "normal" : "advertencia" },
      { clave: "energiaSimbolo", nombre: "Energía por símbolo", simbolo: "E_s", valor: es, unidad: "J" },
      { clave: "energiaBit", nombre: "Energía por bit", simbolo: "E_b=E_s/k", valor: es / k, unidad: "J" },
      { clave: "potenciaMedida", nombre: "Potencia media medida", simbolo: String.raw`\overline{s^2}`, valor: senalModulada.potenciaMedia, unidad: "W" },
    ];

    const advertencias: string[] = [];
    if (bitsRelleno) {
      advertencias.push(`La secuencia no es múltiplo de k = ${k}: se añadieron ${bitsRelleno} bit(s) 0 para completar el último símbolo.`);
    }
    if (!esEnteroAproximado(ciclos)) {
      advertencias.push(`f_c·T_s = ${formatearNumero(ciclos)} no es entero: la portadora no completa ciclos exactos en cada símbolo.`);
    }

    return {
      nombreVariante: variante,
      moduladora: new SenalAnalogica("Secuencia digital b(t)", tiempo, bits, rb, "bit"),
      portadora: new SenalAnalogica("Portadora de referencia c(t)", tiempo, portadora, fc),
      modulada: senalModulada,
      auxiliares: [
        {
          identificador: "faseSimbolo",
          grafica: "moduladora",
          estilo: "escalon",
          ejeSecundario: true,
          tituloEje: "φᵢ [°]",
          senal: new SenalAnalogica("Fase del símbolo φᵢ", tiempo, faseGrados, rs, "°"),
        },
      ],
      metricas,
      resumen: {
        amplitudMaxima: p.amplitudPortadora,
        amplitudMinima: p.amplitudPortadora,
        frecuenciaCentral: fc,
        anchoBandaEstimado: anchoBandaPSK(rs),
        tasaBits: rb,
        tasaSimbolos: rs,
        estados: orden,
      },
      intervalosSimbolo: intervalos,
      constelacion: MotorConstelacion.constelacionPSK(p, indices),
      componentesTeoricos: [],
      marcasFrecuencia: [
        { frecuencia: fc, etiqueta: "f_c" },
        ...(fc - rs > 0 ? [{ frecuencia: fc - rs, etiqueta: "f_c − R_s" }] : []),
        { frecuencia: fc + rs, etiqueta: "f_c + R_s" },
      ],
      regionesSobremodulacion: [],
      advertencias,
    };
  }
}
