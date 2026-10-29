"use client";

import { UNIDADES_FRECUENCIA } from "@/utilidades/conversionUnidades";
import { CampoNumerico, type PropiedadesCampoNumerico } from "./CampoNumerico";

/** Campo de frecuencia con unidades Hz / kHz / MHz. */
export function ControlFrecuencia(propiedades: Omit<PropiedadesCampoNumerico, "unidades" | "unidad">) {
  return <CampoNumerico {...propiedades} unidades={UNIDADES_FRECUENCIA} />;
}
