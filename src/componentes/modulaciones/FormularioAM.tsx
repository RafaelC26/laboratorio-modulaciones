"use client";

import { ControlAmplitud } from "@/componentes/controles/ControlAmplitud";
import { ControlFase } from "@/componentes/controles/ControlFase";
import { ControlFrecuencia } from "@/componentes/controles/ControlFrecuencia";
import { ControlTiempo } from "@/componentes/controles/ControlTiempo";
import { CampoNumerico } from "@/componentes/controles/CampoNumerico";
import { GrupoCampos } from "@/componentes/controles/GrupoCampos";
import { Insignia } from "@/componentes/interfaz/Tarjeta";
import { limitesParametros } from "@/configuracion/configuracionGeneral";
import { coloresSenales } from "@/configuracion/configuracionGraficas";
import { clasificarIndiceAM, indiceModulacionAM, porcentajeModulacionAM, textoClasificacionAM } from "@/formulas/formulasAM";
import { useParametros } from "@/hooks/useParametros";
import { formatearNumero } from "@/utilidades/formatoNumerico";

const TONO_CLASIFICACION = {
  "sin-modulacion": "neutro",
  submodulacion: "exito",
  "modulacion-completa": "advertencia",
  sobremodulacion: "error",
} as const;

export function FormularioAM() {
  const { entrada, actualizar, errorDe, avisoDe } = useParametros("AM");
  const m = indiceModulacionAM(entrada);
  const clasificacion = clasificarIndiceAM(m);

  return (
    <div className="space-y-3">
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
          etiqueta="Fase inicial (adicional)"
          simbolo={String.raw`\phi_p`}
          valor={entrada.faseInicial}
          alCambiar={(v) => actualizar({ faseInicial: v })}
          error={errorDe("faseInicial")}
        />
      </GrupoCampos>

      <GrupoCampos titulo="Moduladora" color={coloresSenales.moduladora}>
        <ControlAmplitud
          campo="amplitudModuladora"
          etiqueta="Valor pico de la moduladora"
          simbolo="V_m"
          valor={entrada.amplitudModuladora}
          alCambiar={(v) => actualizar({ amplitudModuladora: v })}
          error={errorDe("amplitudModuladora")}
        />
        <ControlFrecuencia
          etiqueta="Frecuencia de la moduladora"
          simbolo="f_m"
          valor={entrada.frecuenciaModuladora}
          alCambiar={(v) => actualizar({ frecuenciaModuladora: v })}
          error={errorDe("frecuenciaModuladora")}
          aviso={avisoDe("frecuenciaModuladora")}
        />
        <CampoNumerico
          etiqueta="Índice de modulación"
          simbolo={String.raw`m=V_m/V_p`}
          valor={m}
          alCambiar={(v) => actualizar({ amplitudModuladora: v * entrada.amplitudPortadora })}
          deslizador={limitesParametros.indiceModulacion.deslizador}
          pasoDeslizador={0.01}
          aviso={avisoDe("amplitudModuladora")}
          ayuda="Al cambiar m se ajusta V_m = m·V_p."
          accesorio={
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Insignia tono="neutro">M = {formatearNumero(porcentajeModulacionAM(entrada), 4)} %</Insignia>
              <Insignia tono={TONO_CLASIFICACION[clasificacion]}>{textoClasificacionAM[clasificacion]}</Insignia>
            </div>
          }
        />
      </GrupoCampos>

      <ControlTiempo tipo="AM" />
    </div>
  );
}
