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
import { clasificarIndiceAM, indiceModulacionAM, textoClasificacionAM } from "@/formulas/formulasAM";
import { useParametros } from "@/hooks/useParametros";

const TONO_CLASIFICACION = {
  "sin-modulacion": "neutro",
  submodulacion: "exito",
  "modulacion-completa": "advertencia",
  sobremodulacion: "error",
} as const;

export function FormularioAM() {
  const { entrada, actualizar, errorDe, avisoDe } = useParametros("AM");
  const mu = indiceModulacionAM(entrada);
  const clasificacion = clasificarIndiceAM(mu);

  return (
    <div className="space-y-3">
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
          etiqueta="Fase inicial"
          simbolo={String.raw`\phi_c`}
          valor={entrada.faseInicial}
          alCambiar={(v) => actualizar({ faseInicial: v })}
          error={errorDe("faseInicial")}
        />
      </GrupoCampos>

      <GrupoCampos titulo="Moduladora m(t)" color={coloresSenales.moduladora}>
        <ControlAmplitud
          campo="amplitudModuladora"
          etiqueta="Amplitud de la moduladora"
          simbolo="A_m"
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
          simbolo={String.raw`\mu=A_m/A_c`}
          valor={mu}
          alCambiar={(v) => actualizar({ amplitudModuladora: v * entrada.amplitudPortadora })}
          deslizador={limitesParametros.indiceModulacion.deslizador}
          pasoDeslizador={0.01}
          aviso={avisoDe("amplitudModuladora")}
          ayuda="Al cambiar μ se ajusta A_m = μ·A_c."
          accesorio={
            <div className="mt-1.5">
              <Insignia tono={TONO_CLASIFICACION[clasificacion]}>{textoClasificacionAM[clasificacion]}</Insignia>
            </div>
          }
        />
      </GrupoCampos>

      <ControlTiempo tipo="AM" />
    </div>
  );
}
