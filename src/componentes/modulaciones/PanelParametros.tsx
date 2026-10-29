"use client";

import { Boton, MensajesValidacion, Tarjeta } from "@/componentes/interfaz/Tarjeta";
import { Icono } from "@/componentes/interfaz/Iconos";
import { useConfiguracionModulacion } from "@/hooks/useConfiguracionModulacion";
import { useParametros } from "@/hooks/useParametros";
import type { TipoModulacion } from "@/tipos/tiposModulacion";
import { FormularioAM } from "./FormularioAM";
import { FormularioASK } from "./FormularioASK";
import { FormularioPSK } from "./FormularioPSK";
import { FormularioPSM } from "./FormularioPSM";

const FORMULARIOS: Record<TipoModulacion, () => React.JSX.Element> = {
  AM: FormularioAM,
  ASK: FormularioASK,
  PSK: FormularioPSK,
  PSM: FormularioPSM,
};

/** Muestra el formulario especializado de la técnica seleccionada (sección 12). */
export function PanelParametros() {
  const { tipo, descripcion } = useConfiguracionModulacion();
  const { validacion, reiniciar } = useParametros(tipo);
  const Formulario = FORMULARIOS[tipo];

  return (
    <Tarjeta
      titulo={`Parámetros · ${descripcion.sigla}`}
      subtitulo={descripcion.caracteristica}
      plegable
      acciones={
        <Boton variante="fantasma" className="px-2 py-1 text-xs" onClick={reiniciar} title="Restaurar los valores predeterminados de esta técnica">
          <Icono nombre="reiniciar" className="size-3.5" />
          Reiniciar
        </Boton>
      }
    >
      <div className="space-y-3">
        <Formulario />
        {validacion.errores.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-red-300 uppercase">
              {validacion.errores.length === 1 ? "1 parámetro por corregir" : `${validacion.errores.length} parámetros por corregir`}
            </p>
            <MensajesValidacion errores={validacion.errores} advertencias={[]} />
          </div>
        )}
      </div>
    </Tarjeta>
  );
}
