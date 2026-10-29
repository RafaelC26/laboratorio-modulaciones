"use client";

import { useEffect, useRef, useState } from "react";
import { Icono } from "@/componentes/interfaz/Iconos";
import { Boton } from "@/componentes/interfaz/Tarjeta";
import { configuracionInterfaz } from "@/configuracion/configuracionInterfaz";
import { useAlmacenLaboratorio } from "@/estado/almacenLaboratorio";
import { useSimulacion } from "@/hooks/useSimulacion";
import { servicioExportacion } from "@/servicios/ServicioExportacion";
import { formatearDuracionCalculo, formatearHora } from "@/utilidades/formatoNumerico";

/** Ejecutar, modo dinámico, reiniciar, exportar y comparar (sección 18.3). */
export function ControlSimulacion() {
  const { resultado, estadoEjecucion, errores, modoDinamico, establecerModoDinamico, ejecutar, hayCambiosPendientes } = useSimulacion();
  const tipo = useAlmacenLaboratorio((s) => s.tipoSeleccionado);
  const reiniciarTecnica = useAlmacenLaboratorio((s) => s.reiniciarTecnica);
  const restaurarTodo = useAlmacenLaboratorio((s) => s.restaurarTodo);
  const agregarAComparacion = useAlmacenLaboratorio((s) => s.agregarAComparacion);
  const cantidadComparacion = useAlmacenLaboratorio((s) => s.comparacion.length);
  const establecerVista = useAlmacenLaboratorio((s) => s.establecerVista);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuAbierto) return;
    const cerrar = (evento: MouseEvent) => {
      if (menu.current && !menu.current.contains(evento.target as Node)) setMenuAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [menuAbierto]);

  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const resultadoActual = resultado && resultado.tipo === tipo ? resultado : null;

  const exportar = async (formato: "csv" | "json" | "reporte" | "png") => {
    setMenuAbierto(false);
    if (!resultadoActual) return;
    if (formato === "csv") servicioExportacion.exportarCSV(resultadoActual);
    if (formato === "json") servicioExportacion.exportarJSON(resultadoActual);
    if (formato === "reporte") servicioExportacion.exportarReporte(resultadoActual);
    if (formato === "png") {
      const cantidad = await servicioExportacion.exportarGraficasPNG(servicioExportacion.nombreBase(resultadoActual));
      setAviso(cantidad ? `${cantidad} gráfica(s) exportada(s) como PNG.` : "No hay gráficas visibles para exportar.");
    }
  };

  const comparar = () => {
    if (!resultadoActual) return;
    const agregado = agregarAComparacion(resultadoActual);
    setAviso(
      agregado
        ? `Agregada a la comparación (${cantidadComparacion + 1}/${configuracionInterfaz.maximoComparacion}).`
        : cantidadComparacion >= configuracionInterfaz.maximoComparacion
          ? "La comparación está llena: quite alguna simulación."
          : "Esta simulación ya está en la comparación.",
    );
  };

  let estadoTexto: React.ReactNode = null;
  if (estadoEjecucion === "calculando") estadoTexto = <span className="text-slate-400">Calculando…</span>;
  else if (errores.length) estadoTexto = <span className="text-red-300">Simulación no ejecutada: revise los parámetros</span>;
  else if (resultadoActual)
    estadoTexto = (
      <span className="text-slate-400">
        {formatearDuracionCalculo(resultadoActual.tiempoSimulacion)} · {resultadoActual.cantidadMuestras.toLocaleString("es")} muestras ·{" "}
        {formatearHora(resultadoActual.fechaEjecucion)}
      </span>
    );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Boton variante="primario" onClick={ejecutar} title="Ejecutar simulación (Ctrl + Enter)">
        <Icono nombre="ejecutar" className="size-3.5" />
        Ejecutar<span className="hidden sm:inline"> simulación</span>
      </Boton>

      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-grafito-600 bg-grafito-800 px-2.5 py-1.5 text-[13px] text-slate-200 select-none">
        <span className="relative inline-flex h-4 w-7 items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={modoDinamico}
            onChange={(e) => establecerModoDinamico(e.target.checked)}
          />
          <span className="absolute inset-0 rounded-full bg-grafito-600 transition-colors peer-checked:bg-acento" />
          <span className="absolute left-0.5 size-3 rounded-full bg-white transition-transform peer-checked:translate-x-3" />
        </span>
        <span className="sm:hidden">Automática</span>
        <span className="hidden sm:inline">Actualización automática</span>
      </label>

      <Boton onClick={() => reiniciarTecnica(tipo)} title="Volver a los valores predeterminados de la técnica actual" aria-label="Reiniciar">
        <Icono nombre="reiniciar" className="size-3.5" />
        <span className="hidden sm:inline">Reiniciar</span>
      </Boton>

      <div ref={menu} className="relative">
        <Boton
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          disabled={!resultadoActual}
          aria-expanded={menuAbierto}
          aria-haspopup="menu"
          aria-label="Exportar"
          title="Exportar"
        >
          <Icono nombre="descargar" className="size-3.5" />
          <span className="hidden sm:inline">Exportar</span>
        </Boton>
        {menuAbierto && (
          <div role="menu" className="absolute bottom-full left-0 z-30 mb-2 w-60 overflow-hidden rounded-lg border border-grafito-600 bg-grafito-850 py-1 shadow-2xl">
            {[
              { formato: "csv" as const, nombre: "Datos de las señales (CSV)" },
              { formato: "json" as const, nombre: "Parámetros y resultados (JSON)" },
              { formato: "reporte" as const, nombre: "Reporte de la simulación (Markdown)" },
              { formato: "png" as const, nombre: "Gráficas visibles (PNG)" },
            ].map((opcion) => (
              <button
                key={opcion.formato}
                type="button"
                role="menuitem"
                onClick={() => void exportar(opcion.formato)}
                className="block w-full px-3 py-1.5 text-left text-[13px] text-slate-200 hover:bg-grafito-700"
              >
                {opcion.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      <Boton onClick={comparar} disabled={!resultadoActual} aria-label="Agregar a comparación" title="Agregar a comparación">
        <Icono nombre="comparar" className="size-3.5" />
        <span className="hidden sm:inline">Agregar a comparación</span>
      </Boton>
      {cantidadComparacion > 0 && (
        <Boton variante="fantasma" onClick={() => establecerVista("comparacion")}>
          Ver comparación ({cantidadComparacion})
          <Icono nombre="flecha" className="size-3.5" />
        </Boton>
      )}

      <Boton
        variante="fantasma"
        className="max-sm:hidden"
        onClick={restaurarTodo}
        title="Restaurar los valores predeterminados de todas las técnicas y de las gráficas"
      >
        Restaurar todo
      </Boton>

      <div className="flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:ml-auto sm:w-auto">
        {aviso && <span className="text-acento-claro">{aviso}</span>}
        {!modoDinamico && hayCambiosPendientes && !errores.length && resultadoActual && (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-amber-200">Cambios sin simular</span>
        )}
        {estadoTexto}
      </div>
    </div>
  );
}
