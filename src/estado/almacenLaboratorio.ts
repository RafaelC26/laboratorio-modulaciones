import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ResultadoSimulacion } from "@/clases/ResultadoSimulacion";
import { valoresPredeterminados } from "@/configuracion/configuracionGeneral";
import { visualizacionPredeterminada } from "@/configuracion/configuracionGraficas";
import { configuracionInterfaz } from "@/configuracion/configuracionInterfaz";
import { servicioComparacion } from "@/servicios/ServicioComparacion";
import type { EstadoVisualizacion, IdGrafica, VistaLaboratorio } from "@/tipos/tiposGraficas";
import type { ConfiguracionTemporal, EntradasPorTecnica, TipoModulacion } from "@/tipos/tiposModulacion";
import type {
  EstadoEjecucion,
  MensajeValidacion,
  RegistroHistorial,
  ResultadoOperacionSimulacion,
} from "@/tipos/tiposSimulacion";

/**
 * Estado global del laboratorio (sección 15): configuración, simulación,
 * historial, comparación y visualización. La configuración, el historial y las
 * preferencias de visualización se guardan en el navegador.
 */
export interface EstadoLaboratorio {
  // Estado de configuración
  tipoSeleccionado: TipoModulacion;
  entradas: EntradasPorTecnica;
  modoDinamico: boolean;
  vista: VistaLaboratorio;
  // Estado de simulación
  resultado: ResultadoSimulacion | null;
  estadoEjecucion: EstadoEjecucion;
  errores: MensajeValidacion[];
  advertencias: MensajeValidacion[];
  // Historial y comparación
  historial: RegistroHistorial[];
  comparacion: ResultadoSimulacion[];
  // Estado de visualización
  visualizacion: EstadoVisualizacion;
  hidratado: boolean;

  seleccionarTipo: (tipo: TipoModulacion) => void;
  actualizarEntrada: <T extends TipoModulacion>(tipo: T, cambios: Partial<EntradasPorTecnica[T]>) => void;
  actualizarTemporal: (tipo: TipoModulacion, cambios: Partial<ConfiguracionTemporal>) => void;
  reiniciarTecnica: (tipo: TipoModulacion) => void;
  restaurarTodo: () => void;
  establecerModoDinamico: (activo: boolean) => void;
  establecerVista: (vista: VistaLaboratorio) => void;
  iniciarEjecucion: () => void;
  finalizarEjecucion: (operacion: ResultadoOperacionSimulacion) => void;
  agregarAlHistorial: (resultado: ResultadoSimulacion) => void;
  cargarDesdeHistorial: (id: string) => void;
  limpiarHistorial: () => void;
  agregarAComparacion: (resultado: ResultadoSimulacion) => boolean;
  quitarDeComparacion: (id: string) => void;
  limpiarComparacion: () => void;
  actualizarVisualizacion: (cambios: Partial<EstadoVisualizacion>) => void;
  alternarGrafica: (id: IdGrafica) => void;
}

function copiaPredeterminados(): EntradasPorTecnica {
  return structuredClone(valoresPredeterminados);
}

type EstadoPersistido = Pick<EstadoLaboratorio, "tipoSeleccionado" | "entradas" | "modoDinamico" | "historial"> & {
  visualizacion: Omit<EstadoVisualizacion, "rangoTiempo">;
};

export const useAlmacenLaboratorio = create<EstadoLaboratorio>()(
  persist(
    (set, get) => ({
      tipoSeleccionado: "AM",
      entradas: copiaPredeterminados(),
      modoDinamico: true,
      vista: "laboratorio",
      resultado: null,
      estadoEjecucion: "inactivo",
      errores: [],
      advertencias: [],
      historial: [],
      comparacion: [],
      visualizacion: structuredClone(visualizacionPredeterminada),
      hidratado: false,

      seleccionarTipo: (tipo) => set({ tipoSeleccionado: tipo, vista: "laboratorio" }),

      actualizarEntrada: (tipo, cambios) =>
        set((estado) => ({
          entradas: { ...estado.entradas, [tipo]: { ...estado.entradas[tipo], ...cambios } },
        })),

      actualizarTemporal: (tipo, cambios) =>
        set((estado) => ({
          entradas: {
            ...estado.entradas,
            [tipo]: { ...estado.entradas[tipo], temporal: { ...estado.entradas[tipo].temporal, ...cambios } },
          },
        })),

      reiniciarTecnica: (tipo) =>
        set((estado) => ({ entradas: { ...estado.entradas, [tipo]: structuredClone(valoresPredeterminados[tipo]) } })),

      restaurarTodo: () =>
        set({
          entradas: copiaPredeterminados(),
          visualizacion: structuredClone(visualizacionPredeterminada),
          modoDinamico: true,
        }),

      establecerModoDinamico: (activo) => set({ modoDinamico: activo }),

      establecerVista: (vista) => set({ vista }),

      iniciarEjecucion: () => set({ estadoEjecucion: "calculando" }),

      finalizarEjecucion: (operacion) => {
        if (!operacion.exito) {
          set({ estadoEjecucion: "error", errores: operacion.errores, advertencias: operacion.advertencias });
          return;
        }
        const anterior = get().resultado?.configuracion;
        const nueva = operacion.resultado.configuracion;
        const mismoIntervalo =
          anterior && anterior.tiempoInicial === nueva.tiempoInicial && anterior.tiempoFinal === nueva.tiempoFinal;
        set((estado) => ({
          resultado: operacion.resultado,
          estadoEjecucion: "listo",
          errores: [],
          advertencias: operacion.advertencias,
          visualizacion: mismoIntervalo ? estado.visualizacion : { ...estado.visualizacion, rangoTiempo: null },
        }));
      },

      agregarAlHistorial: (resultado) =>
        set((estado) => {
          const registro: RegistroHistorial = {
            id: resultado.id,
            fecha: resultado.fechaEjecucion.getTime(),
            tipo: resultado.tipo,
            etiqueta: servicioComparacion.etiquetaEntrada(resultado.entrada),
            entrada: structuredClone(resultado.entrada),
          };
          const [ultimo, ...resto] = estado.historial;
          const reemplazar =
            ultimo &&
            ultimo.tipo === registro.tipo &&
            (registro.fecha - ultimo.fecha < configuracionInterfaz.ventanaAgrupacionHistorial ||
              JSON.stringify(ultimo.entrada) === JSON.stringify(registro.entrada));
          const historial = reemplazar ? [registro, ...resto] : [registro, ...estado.historial];
          return { historial: historial.slice(0, configuracionInterfaz.maximoHistorial) };
        }),

      cargarDesdeHistorial: (id) =>
        set((estado) => {
          const registro = estado.historial.find((r) => r.id === id);
          if (!registro) return {};
          return {
            tipoSeleccionado: registro.tipo,
            vista: "laboratorio",
            entradas: { ...estado.entradas, [registro.tipo]: structuredClone(registro.entrada) },
          };
        }),

      limpiarHistorial: () => set({ historial: [] }),

      agregarAComparacion: (resultado) => {
        const { comparacion } = get();
        if (comparacion.some((r) => r.id === resultado.id)) return false;
        if (comparacion.length >= configuracionInterfaz.maximoComparacion) return false;
        set({ comparacion: [...comparacion, resultado] });
        return true;
      },

      quitarDeComparacion: (id) => set((estado) => ({ comparacion: estado.comparacion.filter((r) => r.id !== id) })),

      limpiarComparacion: () => set({ comparacion: [] }),

      actualizarVisualizacion: (cambios) => set((estado) => ({ visualizacion: { ...estado.visualizacion, ...cambios } })),

      alternarGrafica: (id) =>
        set((estado) => ({
          visualizacion: {
            ...estado.visualizacion,
            visibles: { ...estado.visualizacion.visibles, [id]: !estado.visualizacion.visibles[id] },
          },
        })),
    }),
    {
      name: configuracionInterfaz.claveAlmacenamiento,
      version: configuracionInterfaz.versionAlmacenamiento,
      storage: createJSONStorage(() => localStorage),
      // La hidratación se hace en el cliente tras el primer render (evita diferencias con el HTML del servidor).
      skipHydration: true,
      partialize: (estado): EstadoPersistido => ({
        tipoSeleccionado: estado.tipoSeleccionado,
        entradas: estado.entradas,
        modoDinamico: estado.modoDinamico,
        historial: estado.historial,
        visualizacion: {
          visibles: estado.visualizacion.visibles,
          ventana: estado.visualizacion.ventana,
          escalaEspectro: estado.visualizacion.escalaEspectro,
          senalEspectro: estado.visualizacion.senalEspectro,
          mostrarTeorico: estado.visualizacion.mostrarTeorico,
        },
      }),
      // Fusión profunda: si una versión futura agrega parámetros, se completan con los predeterminados.
      merge: (persistido, actual) => {
        const guardado = (persistido ?? {}) as Partial<EstadoPersistido>;
        const entradas = copiaPredeterminados();
        for (const tipo of Object.keys(entradas) as TipoModulacion[]) {
          const previa = guardado.entradas?.[tipo];
          if (previa && previa.tipo === tipo) {
            Object.assign(entradas[tipo], previa, { temporal: { ...entradas[tipo].temporal, ...previa.temporal } });
          }
        }
        return {
          ...actual,
          tipoSeleccionado: guardado.tipoSeleccionado ?? actual.tipoSeleccionado,
          modoDinamico: guardado.modoDinamico ?? actual.modoDinamico,
          historial: Array.isArray(guardado.historial) ? guardado.historial : [],
          entradas,
          visualizacion: {
            ...actual.visualizacion,
            ...guardado.visualizacion,
            visibles: { ...actual.visualizacion.visibles, ...guardado.visualizacion?.visibles },
            rangoTiempo: null,
          },
        };
      },
      onRehydrateStorage: () => () => {
        useAlmacenLaboratorio.setState({ hidratado: true });
      },
    },
  ),
);

/** Restaura lo guardado en el navegador; si el almacenamiento no está disponible, continúa sin él. */
export async function hidratarAlmacen(): Promise<void> {
  const api = (useAlmacenLaboratorio as Partial<typeof useAlmacenLaboratorio>).persist;
  try {
    if (api) await api.rehydrate();
  } catch {
    // Almacenamiento bloqueado o datos corruptos: se usan los valores predeterminados.
  } finally {
    useAlmacenLaboratorio.setState({ hidratado: true });
  }
}
