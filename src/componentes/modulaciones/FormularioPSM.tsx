"use client";

import { CampoNumerico } from "@/componentes/controles/CampoNumerico";
import { ControlAmplitud } from "@/componentes/controles/ControlAmplitud";
import { ControlFase } from "@/componentes/controles/ControlFase";
import { ControlFrecuencia } from "@/componentes/controles/ControlFrecuencia";
import { ControlTiempo } from "@/componentes/controles/ControlTiempo";
import { GrupoCampos } from "@/componentes/controles/GrupoCampos";
import { Insignia } from "@/componentes/interfaz/Tarjeta";
import { limitesParametros } from "@/configuracion/configuracionGeneral";
import { coloresSenales } from "@/configuracion/configuracionGraficas";
import { esBandaEstrecha, indiceModulacionFase } from "@/formulas/formulasPSM";
import { useParametros } from "@/hooks/useParametros";

export function FormularioPSM() {
  const { entrada, actualizar, errorDe, avisoDe } = useParametros("PSM");
  const beta = indiceModulacionFase(entrada);

  const cambiarBeta = (nuevoBeta: number) => {
    if (entrada.amplitudModuladora > 0) actualizar({ sensibilidadFase: nuevoBeta / entrada.amplitudModuladora });
    else actualizar({ amplitudModuladora: 1, sensibilidadFase: nuevoBeta });
  };

  return (
    <div className="space-y-3">
      <p className="rounded-md border border-violeta/30 bg-violeta/10 px-2.5 py-2 text-[11px] leading-relaxed text-violet-200">
        PSM es la <strong>modulación de fase analógica</strong> (Phase Shift Modulation): la fase instantánea de la portadora sigue a m(t),
        con una desviación máxima β = k<sub>p</sub>·A<sub>m</sub>.
      </p>

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
          etiqueta="Sensibilidad de fase"
          simbolo="k_p"
          unidad="rad/V"
          valor={entrada.sensibilidadFase}
          alCambiar={(v) => actualizar({ sensibilidadFase: v })}
          deslizador={limitesParametros.sensibilidadFase.deslizador}
          pasoDeslizador={0.01}
          error={errorDe("sensibilidadFase")}
        />
        <CampoNumerico
          etiqueta="Índice de modulación de fase"
          simbolo={String.raw`\beta=k_pA_m`}
          unidad="rad"
          valor={beta}
          alCambiar={cambiarBeta}
          deslizador={limitesParametros.indiceModulacionFase.deslizador}
          pasoDeslizador={0.01}
          ayuda="Al cambiar β se ajusta k_p = β/A_m."
          accesorio={
            <div className="mt-1.5">
              <Insignia tono={esBandaEstrecha(beta) ? "acento" : "neutro"}>
                {esBandaEstrecha(beta) ? "Banda estrecha (β < 0.3)" : "Banda ancha"}
              </Insignia>
            </div>
          }
        />
      </GrupoCampos>

      <ControlTiempo tipo="PSM" />
    </div>
  );
}
