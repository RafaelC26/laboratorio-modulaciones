"use client";

import { useCallback, useMemo } from "react";
import { useAlmacenLaboratorio } from "@/estado/almacenLaboratorio";
import { servicioGraficas, type RangoTiempo } from "@/servicios/ServicioGraficas";

/**
 * Estado de visualización y espectro de la señal elegida. Cambiar la ventana,
 * la escala o las gráficas visibles no vuelve a simular las señales.
 */
export function useGraficas() {
  const resultado = useAlmacenLaboratorio((s) => s.resultado);
  const visualizacion = useAlmacenLaboratorio((s) => s.visualizacion);
  const actualizarVisualizacion = useAlmacenLaboratorio((s) => s.actualizarVisualizacion);
  const alternarGrafica = useAlmacenLaboratorio((s) => s.alternarGrafica);

  const espectro = useMemo(
    () => (resultado ? servicioGraficas.calcularEspectro(resultado, visualizacion.senalEspectro, visualizacion.ventana) : null),
    [resultado, visualizacion.senalEspectro, visualizacion.ventana],
  );
  const analisis = useMemo(() => (espectro ? servicioGraficas.analizarEspectro(espectro) : null), [espectro]);

  /** Recibe el rango en la unidad del eje (ms, µs…) y lo guarda en segundos. */
  const establecerRangoTiempo = useCallback(
    (rangoEje: RangoTiempo) => {
      if (!resultado) return;
      const { factor } = servicioGraficas.escalaTiempo(resultado);
      const rango: RangoTiempo = rangoEje ? [rangoEje[0] / factor, rangoEje[1] / factor] : null;
      const actual = useAlmacenLaboratorio.getState().visualizacion.rangoTiempo;
      const igual =
        (rango === null && actual === null) ||
        (rango !== null && actual !== null && Math.abs(rango[0] - actual[0]) < 1e-15 && Math.abs(rango[1] - actual[1]) < 1e-15);
      if (!igual) actualizarVisualizacion({ rangoTiempo: rango });
    },
    [resultado, actualizarVisualizacion],
  );

  return { resultado, visualizacion, actualizarVisualizacion, alternarGrafica, establecerRangoTiempo, espectro, analisis };
}
