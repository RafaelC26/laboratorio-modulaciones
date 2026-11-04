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

function ayudaMapeo(mapeo: MapeoSimbolos, orden: number): string {
  if (mapeo !== "apuntes") return orden === 2 ? "Es el inverso de los apuntes: 0 → 0°, 1 → 180°." : "No es el mapeo del Tema 6.";
  if (orden === 2) return "Tema 6, p. 54–55: 1 → 0°, 0 → 180°.";
  if (orden === 4) return "Tema 6, p. 57: 10 → 0°, 01 → 90°, 11 → 180°, 00 → 270° (la figura repite 10 en 270°; es una errata).";
  return "El Tema 6 no define este orden: se usa binario natural.";
}

export function FormularioPSK() {
  const { entrada, actualizar, errorDe, avisoDe } = useParametros("PSK");
  const k = bitsPorSimboloPSK(entrada.ordenModulacion);

  return (
    <div className="space-y-3">
      <GrupoCampos titulo="Moduladora (datos)" color={coloresSenales.moduladora}>
        <CampoBits
          valor={entrada.secuenciaBits}
          alCambiar={(texto) => actualizar({ secuenciaBits: texto })}
          bitsPorSimbolo={k}
          error={errorDe("secuenciaBits")}
          predeterminada={valoresPredeterminados.PSK.secuenciaBits}
        />
        <CampoSeleccion
          etiqueta="Fases posibles N"
          valor={entrada.ordenModulacion}
          opciones={configuracionGeneral.ordenesPSK.map((orden) => ({
            valor: orden as number,
            etiqueta: `${nombreVariantePSK(orden)}: N = ${orden} (${bitsPorSimboloPSK(orden)} bit/símbolo)`,
          }))}
          alCambiar={(orden) => actualizar({ ordenModulacion: orden })}
          error={errorDe("ordenModulacion")}
        />
        <CampoSeleccion<MapeoSimbolos>
          etiqueta="Mapeo de símbolos"
          valor={entrada.mapeoSimbolos}
          opciones={[
            { valor: "apuntes", etiqueta: "Apuntes (Tema 6)" },
            { valor: "gray", etiqueta: "Gray (vecinos difieren en 1 bit)" },
            { valor: "binario", etiqueta: "Binario natural" },
          ]}
          alCambiar={(mapeo) => actualizar({ mapeoSimbolos: mapeo })}
          ayuda={ayudaMapeo(entrada.mapeoSimbolos, entrada.ordenModulacion)}
        />
        <CampoNumerico
          etiqueta="Duración de símbolo"
          simbolo="T"
          unidades={UNIDADES_TIEMPO}
          valor={entrada.duracionSimbolo}
          alCambiar={(v) => actualizar({ duracionSimbolo: v })}
          error={errorDe("duracionSimbolo")}
          aviso={avisoDe("duracionSimbolo")}
          ayuda={`T_bit = T/k = T/${k}`}
        />
      </GrupoCampos>

      <GrupoCampos titulo="Portadora" color={coloresSenales.portadora}>
        <ControlAmplitud
          campo="amplitudPortadora"
          etiqueta="Valor pico de la portadora"
          simbolo="V_p"
          valor={entrada.amplitudPortadora}
          alCambiar={(v) => actualizar({ amplitudPortadora: v })}
          error={errorDe("amplitudPortadora")}
        />
        <ControlFrecuencia
          etiqueta="Frecuencia de la portadora"
          simbolo="f_p"
          valor={entrada.frecuenciaPortadora}
          alCambiar={(v) => actualizar({ frecuenciaPortadora: v })}
          error={errorDe("frecuenciaPortadora")}
        />
        <ControlFase
          etiqueta="Fase de referencia (adicional)"
          simbolo={String.raw`\phi_0`}
          valor={entrada.faseInicial}
          alCambiar={(v) => actualizar({ faseInicial: v })}
          error={errorDe("faseInicial")}
          ayuda="φᵢ = i·θ + φ₀, con θ = 2π/N. El Tema 6 usa φ₀ = 0."
        />
      </GrupoCampos>

      <ControlTiempo tipo="PSK" />
    </div>
  );
}
