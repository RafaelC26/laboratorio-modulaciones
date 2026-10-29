"use client";

import { limitesParametros } from "@/configuracion/configuracionGeneral";
import { CampoNumerico, type PropiedadesCampoNumerico } from "./CampoNumerico";

/** Campo de amplitud en voltios; el rango del deslizador sale de la configuración. */
export function ControlAmplitud({
  campo,
  ...propiedades
}: Omit<PropiedadesCampoNumerico, "unidades" | "unidad"> & { campo: string }) {
  const limite = limitesParametros[campo];
  return (
    <CampoNumerico
      unidad="V"
      deslizador={limite?.deslizador}
      pasoDeslizador={limite?.paso}
      {...propiedades}
    />
  );
}
