"use client";

import { CampoBits } from "@/componentes/controles/CampoBits";
import { CampoNumerico } from "@/componentes/controles/CampoNumerico";
import { ControlAmplitud } from "@/componentes/controles/ControlAmplitud";
import { ControlFase } from "@/componentes/controles/ControlFase";
import { ControlFrecuencia } from "@/componentes/controles/ControlFrecuencia";
import { ControlTiempo } from "@/componentes/controles/ControlTiempo";
import { GrupoCampos } from "@/componentes/controles/GrupoCampos";
import { Insignia } from "@/componentes/interfaz/Tarjeta";
import { valoresPredeterminados } from "@/configuracion/configuracionGeneral";
import { coloresSenales } from "@/configuracion/configuracionGraficas";
import { esOOK } from "@/formulas/formulasASK";
import { useParametros } from "@/hooks/useParametros";
import { UNIDADES_TIEMPO } from "@/utilidades/conversionUnidades";

export function FormularioASK() {
  const { entrada, actualizar, errorDe, avisoDe } = useParametros("ASK");

  return (
    <div className="space-y-3">
      <GrupoCampos titulo="Moduladora (datos)" color={coloresSenales.moduladora}>
        <CampoBits
          valor={entrada.secuenciaBits}
          alCambiar={(texto) => actualizar({ secuenciaBits: texto })}
          error={errorDe("secuenciaBits")}
          predeterminada={valoresPredeterminados.ASK.secuenciaBits}
        />
        <CampoNumerico
          etiqueta="Duración de bit"
          simbolo="T_{bit}"
          unidades={UNIDADES_TIEMPO}
          valor={entrada.duracionBit}
          alCambiar={(v) => actualizar({ duracionBit: v })}
          error={errorDe("duracionBit")}
          aviso={avisoDe("duracionBit")}
          ayuda={Number.isFinite(1 / entrada.duracionBit) ? `Velocidad de transmisión V_t = 1/T_bit = ${Number((1 / entrada.duracionBit).toPrecision(6))} bit/s` : undefined}
        />
      </GrupoCampos>

      <GrupoCampos titulo="Amplitudes por bit" color={coloresSenales.modulada}>
        <ControlAmplitud
          campo="amplitudBit1"
          etiqueta="Amplitud para el bit 1"
          simbolo="A_1"
          valor={entrada.amplitudBit1}
          alCambiar={(v) => actualizar({ amplitudBit1: v })}
          error={errorDe("amplitudBit1")}
        />
        <ControlAmplitud
          campo="amplitudBit0"
          etiqueta="Amplitud para el bit 0"
          simbolo="A_0"
          valor={entrada.amplitudBit0}
          alCambiar={(v) => actualizar({ amplitudBit0: v })}
          error={errorDe("amplitudBit0")}
          accesorio={
            <div className="mt-1.5 flex items-center gap-2">
              {esOOK(entrada) ? (
                <Insignia tono="acento">Caso del Tema 6: portadora presente o ausente</Insignia>
              ) : (
                <button
                  type="button"
                  onClick={() => actualizar({ amplitudBit0: 0 })}
                  className="rounded border border-grafito-600 px-1.5 py-0.5 text-[11px] text-slate-400 hover:border-grafito-500 hover:text-slate-200"
                >
                  Usar el caso del Tema 6 (A₀ = 0)
                </button>
              )}
            </div>
          }
        />
      </GrupoCampos>

      <GrupoCampos titulo="Portadora" color={coloresSenales.portadora}>
        <ControlFrecuencia
          etiqueta="Frecuencia de la portadora"
          simbolo="f_p"
          valor={entrada.frecuenciaPortadora}
          alCambiar={(v) => actualizar({ frecuenciaPortadora: v })}
          error={errorDe("frecuenciaPortadora")}
        />
        <ControlFase
          etiqueta="Fase inicial (adicional)"
          simbolo={String.raw`\phi_p`}
          valor={entrada.faseInicial}
          alCambiar={(v) => actualizar({ faseInicial: v })}
          error={errorDe("faseInicial")}
        />
      </GrupoCampos>

      <ControlTiempo tipo="ASK" />
    </div>
  );
}
