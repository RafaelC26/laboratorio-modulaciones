export const configuracionInterfaz = {
  /** Espera tras el último cambio antes de recalcular en modo dinámico [ms]. */
  retardoModoDinamico: 250,
  maximoHistorial: 15,
  /** Simulaciones de la misma técnica dentro de esta ventana reemplazan la última del historial [ms]. */
  ventanaAgrupacionHistorial: 4000,
  claveAlmacenamiento: "laboratorio-modulaciones",
  versionAlmacenamiento: 2,
} as const;
