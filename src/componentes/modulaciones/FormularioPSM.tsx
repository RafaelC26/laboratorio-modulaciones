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
import { esBandaAngosta, indiceModulacionFase } from "@/formulas/formulasPSM";
import { useParametros } from "@/hooks/useParametros";

export function FormularioPSM() {
  const { entrada, actualizar, errorDe, avisoDe } = useParametros("PSM");
  const beta = indiceModulacionFase(entrada);
  const angosta = esBandaAngosta(beta);

  const cambiarBeta = (nuevoBeta: number) => {
    if (entrada.amplitudModuladora > 0) actualizar({ sensibilidadFase: nuevoBeta / entrada.amplitudModuladora });
    else actualizar({ amplitudModuladora: 1, sensibilidadFase: nuevoBeta });
  };

  return (
    <div className="space-y-3">
      <p className="rounded-md border border-violeta/30 bg-violeta/10 px-2.5 py-2 text-[11px] leading-relaxed text-violet-200">
        PSM es la <strong>modulación de fase analógica</strong>, que el Tema 6 llama PM (p. 46): la fase de la portadora varía de forma proporcional a
        la amplitud de la moduladora, con índice β = ΔΦ·V<sub>m</sub>.
      </p>

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
          etiqueta="Constante de desviación de fase"
          simbolo={String.raw`\Delta\Phi`}
          unidad="rad/V"
          valor={entrada.sensibilidadFase}
          alCambiar={(v) => actualizar({ sensibilidadFase: v })}
          deslizador={limitesParametros.sensibilidadFase.deslizador}
          pasoDeslizador={0.01}
          error={errorDe("sensibilidadFase")}
        />
        <CampoNumerico
          etiqueta="Índice de modulación"
          simbolo={String.raw`\beta=\Delta\Phi\,V_m`}
          unidad="rad"
          valor={beta}
          alCambiar={cambiarBeta}
          deslizador={limitesParametros.indiceModulacionFase.deslizador}
          pasoDeslizador={0.01}
          ayuda="Al cambiar β se ajusta ΔΦ = β/V_m."
          accesorio={
            <div className="mt-1.5">
              <Insignia tono={angosta ? "acento" : "neutro"}>{angosta ? "Banda angosta (β < π/2)" : "Banda ancha (β > π/2)"}</Insignia>
            </div>
          }
        />
      </GrupoCampos>

      <ControlTiempo tipo="PSM" />
    </div>
  );
}
