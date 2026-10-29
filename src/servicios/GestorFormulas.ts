import type { ParametrosModulacion } from "@/clases/ParametrosModulacion";
import { formulasEspectro } from "@/formulas/formulasEspectro";
import { listarConjuntosFormulas, obtenerConjuntoFormulas } from "@/formulas/repositorioFormulas";
import type { ConjuntoFormulas, DefinicionFormula } from "@/tipos/tiposFormulas";
import type { TipoModulacion } from "@/tipos/tiposModulacion";

/**
 * Selecciona las fórmulas de cada técnica (sección 10.1). La interfaz consulta
 * las ecuaciones a través de este gestor y nunca las escribe directamente.
 */
export class GestorFormulas {
  obtener(tipo: TipoModulacion): ConjuntoFormulas {
    return obtenerConjuntoFormulas(tipo);
  }

  ecuacionPrincipal(tipo: TipoModulacion): string {
    return this.obtener(tipo).principal.ecuacion;
  }

  ecuacionSustituida(parametros: ParametrosModulacion): string {
    return this.obtener(parametros.tipoModulacion).sustituir(parametros);
  }

  formulasEspectrales(): DefinicionFormula[] {
    return formulasEspectro;
  }

  listar(): ConjuntoFormulas[] {
    return listarConjuntosFormulas();
  }
}

export const gestorFormulas = new GestorFormulas();
