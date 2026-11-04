import type { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { SenalAnalogica } from "@/clases/SenalAnalogica";
import { indiceIntervalo, SenalDigital } from "@/clases/SenalDigital";
import { ciclosEnIntervalo, portadoraCoseno } from "@/formulas/formulasPortadora";
import {
  anchoBandaPSK,
  distanciaMinimaPSK,
  eficienciaEspectralPSK,
  energiaSimboloPSK,
  faseSimboloPSK,
  frecuenciaMaximaPSK,
  indiceEstadoPSK,
  moduladoraBinariaPSK,
  nivelSimboloPSK,
  nombreVariantePSK,
  senalModuladaPSK,
  velocidadTransmisionPSK,
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

  /** [0, N_s·T), con N_s = ⌈bits / k⌉ símbolos. */
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
    const periodo = p.duracionSimbolo;
    const fp = p.frecuenciaPortadora;

    const { grupos, bitsRelleno } = new SenalDigital(p.secuenciaBits, p.duracionBit).agruparEnSimbolos(k);
    const indices = grupos.map((grupo) => indiceEstadoPSK(grupo, p.mapeoSimbolos));
    const fases = indices.map((indice) => faseSimboloPSK(indice, orden, p.faseInicial));
    // 2PSK: moduladora bipolar (p. 54). MPSK: señal multinivel 00→0 … 11→3 (p. 56).
    const valoresModuladora = orden === 2 ? indices.map(moduladoraBinariaPSK) : grupos.map(nivelSimboloPSK);
    const cantidadSimbolos = grupos.length;

    // La portadora de referencia se dibuja con fase 0 para que se aprecie el desplazamiento φ_i.
    const referencia = { amplitudPortadora: p.amplitudPortadora, frecuenciaPortadora: fp, faseInicial: 0 };
    const simboloEn = (t: number) => indiceIntervalo(t, periodo, cantidadSimbolos);

    const moduladora = MotorMuestreo.evaluar(tiempo, (t) => valoresModuladora[simboloEn(t)]);
    const portadora = MotorMuestreo.evaluar(tiempo, (t) => portadoraCoseno(t, referencia));
    const modulada = MotorMuestreo.evaluar(tiempo, (t) => senalModuladaPSK(t, fases[simboloEn(t)], p));
    const faseGrados = MotorMuestreo.evaluar(tiempo, (t) => radianesAGrados(normalizarAngulo(fases[simboloEn(t)])));

    const intervalos: IntervaloSimbolo[] = grupos.map((grupo, j) => ({
      indiceSimbolo: j,
      inicio: j * periodo,
      fin: (j + 1) * periodo,
      bits: grupo,
      indiceEstado: indices[j],
      amplitud: p.amplitudPortadora,
      fase: fases[j],
      etiqueta: grupo.join(""),
    }));

    const velocidadModulacion = p.tasaSimbolos;
    const vt = velocidadTransmisionPSK(orden, periodo);
    const es = energiaSimboloPSK(p.amplitudPortadora, periodo);
    const ciclos = ciclosEnIntervalo(fp, periodo);
    const variante = nombreVariantePSK(orden);
    const senalModulada = new SenalAnalogica(`Señal ${variante} v(t)`, tiempo, modulada, fp);

    const metricas: Metrica[] = [
      { clave: "variante", nombre: "Variante", valor: variante },
      { clave: "orden", nombre: "Fases posibles", simbolo: "N", valor: orden },
      { clave: "bitsPorSimbolo", nombre: "Bits por símbolo", simbolo: String.raw`k=\log_2N`, valor: k },
      { clave: "cantidadSimbolos", nombre: "Símbolos transmitidos", valor: cantidadSimbolos },
      { clave: "duracionSimbolo", nombre: "Duración de símbolo", simbolo: "T", valor: periodo, unidad: "s" },
      { clave: "duracionBit", nombre: "Duración de bit", simbolo: "T_{bit}=T/k", valor: p.duracionBit, unidad: "s" },
      { clave: "velocidadModulacion", nombre: "Velocidad de modulación", simbolo: "1/T", valor: velocidadModulacion, unidad: "Bd" },
      { clave: "velocidadTransmision", nombre: "Velocidad de transmisión", simbolo: String.raw`V_t=\frac{1}{T}\log_2N`, valor: vt, unidad: "bit/s" },
      { clave: "separacionFase", nombre: "Separación entre fases", simbolo: String.raw`\theta=2\pi/N`, valor: 360 / orden, unidad: "°" },
      { clave: "anchoBanda", nombre: "Ancho de banda", simbolo: "BW=1/T", valor: anchoBandaPSK(periodo), unidad: "Hz" },
      { clave: "bitsRelleno", nombre: "Bits de relleno", valor: bitsRelleno, estado: bitsRelleno ? "advertencia" : "normal", complemento: true },
      { clave: "eficienciaEspectral", nombre: "Eficiencia espectral", simbolo: "V_t/BW", valor: eficienciaEspectralPSK(orden), unidad: "bit/s/Hz", complemento: true },
      { clave: "distanciaMinima", nombre: "Distancia mínima", simbolo: "d_{min}", valor: distanciaMinimaPSK(p.amplitudPortadora, orden), unidad: "V", complemento: true },
      { clave: "ciclosSimbolo", nombre: "Ciclos de portadora por símbolo", simbolo: "f_pT", valor: ciclos, estado: esEnteroAproximado(ciclos) ? "normal" : "advertencia", complemento: true },
      { clave: "energiaSimbolo", nombre: "Energía por símbolo", simbolo: "E_s", valor: es, unidad: "J", complemento: true },
      { clave: "energiaBit", nombre: "Energía por bit", simbolo: "E_b=E_s/k", valor: es / k, unidad: "J", complemento: true },
      { clave: "potenciaMedida", nombre: "Potencia media medida", simbolo: String.raw`\overline{v^2}`, valor: senalModulada.potenciaMedia, unidad: "W", complemento: true },
    ];

    const advertencias: string[] = [];
    if (bitsRelleno) {
      advertencias.push(`La secuencia no es múltiplo de k = ${k}: se añadieron ${bitsRelleno} bit(s) 0 para completar el último símbolo.`);
    }
    if (!esEnteroAproximado(ciclos)) {
      advertencias.push(`f_p·T = ${formatearNumero(ciclos)} no es entero: la portadora no completa ciclos exactos en cada símbolo.`);
    }

    return {
      nombreVariante: variante,
      moduladora: new SenalAnalogica(orden === 2 ? "Moduladora vm(t)" : "Señal multinivel vm(t)", tiempo, moduladora, vt, "nivel"),
      portadora: new SenalAnalogica("Portadora de referencia vp(t)", tiempo, portadora, fp),
      modulada: senalModulada,
      auxiliares: [
        {
          identificador: "faseSimbolo",
          grafica: "moduladora",
          estilo: "escalon",
          ejeSecundario: true,
          tituloEje: "φᵢ [°]",
          senal: new SenalAnalogica("Fase del símbolo φᵢ", tiempo, faseGrados, velocidadModulacion, "°"),
        },
      ],
      metricas,
      resumen: {
        amplitudMaxima: p.amplitudPortadora,
        amplitudMinima: p.amplitudPortadora,
        frecuenciaCentral: fp,
        anchoBandaEstimado: anchoBandaPSK(periodo),
        tasaBits: vt,
        tasaSimbolos: velocidadModulacion,
        estados: orden,
      },
      intervalosSimbolo: intervalos,
      constelacion: MotorConstelacion.constelacionPSK(p, indices),
      componentesTeoricos: [],
      marcasFrecuencia: [
        { frecuencia: fp, etiqueta: "f_p" },
        ...(fp - velocidadModulacion > 0 ? [{ frecuencia: fp - velocidadModulacion, etiqueta: "f_p − 1/T" }] : []),
        { frecuencia: fp + velocidadModulacion, etiqueta: "f_p + 1/T" },
      ],
      regionesSobremodulacion: [],
      advertencias,
    };
  }
}
