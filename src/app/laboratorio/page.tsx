import type { Metadata } from "next";
import { LaboratorioModulaciones } from "@/componentes/interfaz/LaboratorioModulaciones";

export const metadata: Metadata = {
  title: "Simulador",
};

export default function PaginaLaboratorio() {
  return <LaboratorioModulaciones />;
}
