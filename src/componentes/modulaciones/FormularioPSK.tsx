"use client";

import { CampoBits } from "@/componentes/controles/CampoBits";
import { CampoNumerico } from "@/componentes/controles/CampoNumerico";
import { CampoSeleccion } from "@/componentes/controles/CampoSeleccion";
import { ControlAmplitud } from "@/componentes/controles/ControlAmplitud";
import { ControlFase } from "@/componentes/controles/ControlFase";
import { ControlFrecuencia } from "@/componentes/controles/ControlFrecuencia";
import { ControlTiempo } from "@/componentes/controles/ControlTiempo";
import { GrupoCampos } from "@/componentes/controles/GrupoCampos";
import { configuracionGeneral, valoresPredeterminados } from "@/configuracion/configuracionGeneral";
import { coloresSenales } from "@/configuracion/configuracionGraficas";
import { bitsPorSimboloPSK, nombreVariantePSK } from "@/formulas/formulasPSK";
import { useParametros } from "@/hooks/useParametros";
import type { MapeoSimbolos } from "@/tipos/tiposModulacion";
import { UNIDADES_TIEMPO } from "@/utilidades/conversionUnidades";

export function FormularioPSK() {
  const { entrada, actualizar, errorDe, avisoDe } = useParametros("PSK");
  const k = bitsPorSimboloPSK(entrada.ordenModulacion);

  return (
    <div className="space-y-3">
      <GrupoCampos titulo="Información digital" color={coloresSenales.moduladora}>
        <CampoBits
          valor={entrada.secuenciaBits}
          alCambiar={(texto) => actualizar({ secuenciaBits: texto })}
          bitsPorSimbolo={k}
          error={errorDe("secuenciaBits")}
          predeterminada={valoresPredeterminados.PSK.secuenciaBits}
        />
        <CampoSeleccion
          etiqueta="Orden de modulación M"
          valor={entrada.ordenModulacion}
          opciones={configuracionGeneral.ordenesPSK.map((m) => ({
            valor: m as number,
            etiqueta: `${nombreVariantePSK(m)} — M = ${m} (${bitsPorSimboloPSK(m)} bit/símbolo)`,
          }))}
          alCambiar={(m) => actualizar({ ordenModulacion: m })}
          error={errorDe("ordenModulacion")}
        />
        <CampoSeleccion<MapeoSimbolos>
          etiqueta="Mapeo de símbolos"
          valor={entrada.mapeoSimbolos}
          opciones={[
            { valor: "gray", etiqueta: "Gray (vecinos difieren en 1 bit)" },
            { valor: "binario", etiqueta: "Binario natural" },
          ]}
          alCambiar={(mapeo) => actualizar({ mapeoSimbolos: mapeo })}
          ayuda={entrada.ordenModulacion === 2 ? "En BPSK ambos mapeos coinciden: bit 0 → 0, bit 1 → π." : undefined}
        />
        <CampoNumerico
          etiqueta="Duración de símbolo"
          simbolo="T_s"
          unidades={UNIDADES_TIEMPO}
          valor={entrada.duracionSimbolo}
          alCambiar={(v) => actualizar({ duracionSimbolo: v })}
          error={errorDe("duracionSimbolo")}
          aviso={avisoDe("duracionSimbolo")}
          ayuda={`T_b = T_s/k = T_s/${k}`}
        />
      </GrupoCampos>

      <GrupoCampos titulo="Portadora c(t)" color={coloresSenales.portadora}>
        <ControlAmplitud
          campo="amplitudPortadora"
          etiqueta="Amplitud de la portadora"
          simbolo="A_c"
          valor={entrada.amplitudPortadora}
          alCambiar={(v) => actualizar({ amplitudPortadora: v })}
          error={errorDe("amplitudPortadora")}
        />
        <ControlFrecuencia
          etiqueta="Frecuencia de la portadora"
          simbolo="f_c"
          valor={entrada.frecuenciaPortadora}
          alCambiar={(v) => actualizar({ frecuenciaPortadora: v })}
          error={errorDe("frecuenciaPortadora")}
        />
        <ControlFase
          etiqueta="Fase de referencia de la constelación"
          simbolo={String.raw`\phi_0`}
          valor={entrada.faseInicial}
          alCambiar={(v) => actualizar({ faseInicial: v })}
          error={errorDe("faseInicial")}
          ayuda="φᵢ = 2πi/M + φ₀. Con QPSK y φ₀ = π/4 se obtiene la constelación diagonal."
        />
      </GrupoCampos>

      <ControlTiempo tipo="PSK" />
    </div>
  );
}
