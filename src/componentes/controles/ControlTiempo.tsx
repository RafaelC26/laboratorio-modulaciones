"use client";

import { useMemo } from "react";
import { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { useParametros } from "@/hooks/useParametros";
import { motorMatematico } from "@/motores/MotorMatematico";
import { MotorMuestreo } from "@/motores/MotorMuestreo";
import type { TipoModulacion } from "@/tipos/tiposModulacion";
import { UNIDADES_TIEMPO } from "@/utilidades/conversionUnidades";
import { formatearConUnidad, formatearNumero } from "@/utilidades/formatoNumerico";
import { CampoNumerico } from "./CampoNumerico";
import { ControlFrecuencia } from "./ControlFrecuencia";
import { GrupoCampos } from "./GrupoCampos";

const PERIODOS_RAPIDOS = [1, 2, 5, 10];

/**
 * Configuración temporal (sección 8.3): la frecuencia de muestreo es el
 * parámetro principal y la cantidad de muestras se deriva del intervalo.
 */
export function ControlTiempo({ tipo }: { tipo: TipoModulacion }) {
  const { entrada, actualizarTemporal, errorDe, avisoDe } = useParametros(tipo);
  const digital = tipo === "ASK" || tipo === "PSK";

  const informacion = useMemo(() => {
    try {
      const parametros = ParametrosModulacion.desdeEntrada(entrada);
      const configuracion = motorMatematico.configuracionPara(parametros, entrada.temporal);
      const frecuenciaMaxima = motorMatematico.obtenerMotor(tipo).frecuenciaMaxima(parametros);
      return {
        configuracion,
        frecuenciaMaxima,
        recomendada: MotorMuestreo.frecuenciaMuestreoRecomendada(frecuenciaMaxima, configuracion.duracion),
        frecuenciaPortadora: parametros.frecuenciaPortadora,
      };
    } catch {
      return null;
    }
  }, [entrada, tipo]);

  const periodoModuladora = entrada.tipo === "AM" || entrada.tipo === "PSM" ? 1 / entrada.frecuenciaModuladora : null;
  const fs = entrada.temporal.frecuenciaMuestreo;
  const errorMuestreo = errorDe("temporal.frecuenciaMuestreo");

  return (
    <GrupoCampos titulo="Muestreo y tiempo">
      {!digital && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <CampoNumerico
              etiqueta="Tiempo inicial"
              simbolo="t_0"
              unidades={UNIDADES_TIEMPO}
              valor={entrada.temporal.tiempoInicial}
              alCambiar={(v) => actualizarTemporal({ tiempoInicial: v })}
              error={errorDe("temporal.tiempoInicial")}
            />
            <CampoNumerico
              etiqueta="Tiempo final"
              simbolo="t_f"
              unidades={UNIDADES_TIEMPO}
              valor={entrada.temporal.tiempoFinal}
              alCambiar={(v) => actualizarTemporal({ tiempoFinal: v })}
              error={errorDe("temporal.tiempoFinal")}
            />
          </div>
          {periodoModuladora !== null && Number.isFinite(periodoModuladora) && periodoModuladora > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
              <span className="mr-0.5">Duración:</span>
              {PERIODOS_RAPIDOS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => actualizarTemporal({ tiempoFinal: entrada.temporal.tiempoInicial + n * periodoModuladora })}
                  className="rounded border border-grafito-600 px-1.5 py-0.5 text-slate-400 transition-colors hover:border-grafito-500 hover:text-slate-200"
                >
                  {n}·T<sub>m</sub>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {digital && informacion && (
        <p className="text-[11px] leading-relaxed text-slate-400">
          Duración derivada de la secuencia:{" "}
          <span className="font-mono text-slate-200">{formatearConUnidad(informacion.configuracion.duracion, "s")}</span>
          {" "}(desde 0 hasta el final del último símbolo).
        </p>
      )}
      <ControlFrecuencia
        etiqueta="Frecuencia de muestreo"
        simbolo="f_s"
        valor={fs}
        alCambiar={(v) => actualizarTemporal({ frecuenciaMuestreo: v })}
        error={errorMuestreo}
        aviso={avisoDe("temporal.frecuenciaMuestreo")}
        accesorio={
          informacion && Math.abs(informacion.recomendada - fs) > 1e-9 ? (
            <button
              type="button"
              onClick={() => actualizarTemporal({ frecuenciaMuestreo: informacion.recomendada })}
              className="mt-1.5 rounded border border-acento/40 bg-acento/10 px-2 py-0.5 text-[11px] text-acento-claro transition-colors hover:bg-acento/20"
            >
              Usar recomendada: {formatearConUnidad(informacion.recomendada, "Hz")}
            </button>
          ) : null
        }
      />
      {informacion && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-md bg-grafito-950/50 px-2.5 py-2 text-[11px]">
          <dt className="text-slate-500">Muestras N</dt>
          <dd className="text-right font-mono text-slate-300 tabular-nums">{informacion.configuracion.cantidadMuestras.toLocaleString("es")}</dd>
          <dt className="text-slate-500">Δt = 1/f_s</dt>
          <dd className="text-right font-mono text-slate-300">{formatearConUnidad(informacion.configuracion.intervaloMuestreo, "s")}</dd>
          <dt className="text-slate-500">Δf = f_s/N</dt>
          <dd className="text-right font-mono text-slate-300">
            {informacion.configuracion.cantidadMuestras ? formatearConUnidad(fs / informacion.configuracion.cantidadMuestras, "Hz") : "—"}
          </dd>
          <dt className="text-slate-500">Muestras por ciclo de f_c</dt>
          <dd className="text-right font-mono text-slate-300">{formatearNumero(fs / informacion.frecuenciaPortadora, 3)}</dd>
          <dt className="text-slate-500">f_s / f_max</dt>
          <dd className="text-right font-mono text-slate-300">{formatearNumero(fs / informacion.frecuenciaMaxima, 3)}</dd>
        </dl>
      )}
    </GrupoCampos>
  );
}
