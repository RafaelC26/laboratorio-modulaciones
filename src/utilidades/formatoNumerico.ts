/**
 * Formato de números para la interfaz (texto) y para las ecuaciones (LaTeX).
 * Se usa punto decimal para coincidir con los campos de entrada.
 */

const PREFIJOS_SI = [
  { factor: 1e9, simbolo: "G" },
  { factor: 1e6, simbolo: "M" },
  { factor: 1e3, simbolo: "k" },
  { factor: 1, simbolo: "" },
  { factor: 1e-3, simbolo: "m" },
  { factor: 1e-6, simbolo: "µ" },
  { factor: 1e-9, simbolo: "n" },
];

/** Unidades a las que se aplican prefijos SI (k, M, m, µ…). */
const UNIDADES_CON_PREFIJO = new Set(["Hz", "s", "V", "W", "J", "bit/s", "Bd", "V²"]);

function quitarCerosFinales(texto: string): string {
  if (!texto.includes(".") || texto.includes("e")) return texto;
  return texto.replace(/\.?0+$/, "");
}

/** Número con `cifras` cifras significativas, sin ceros sobrantes. */
export function formatearNumero(valor: number, cifras = 4): string {
  if (Number.isNaN(valor)) return "—";
  if (!Number.isFinite(valor)) return valor > 0 ? "∞" : "−∞";
  if (valor === 0) return "0";
  const absoluto = Math.abs(valor);
  if (absoluto >= 1e7 || absoluto < 1e-4) {
    const [mantisa, exponente] = valor.toExponential(cifras - 1).split("e");
    return `${quitarCerosFinales(mantisa)}e${Number(exponente)}`;
  }
  return quitarCerosFinales(valor.toPrecision(cifras));
}

/** Número con unidad y prefijo SI cuando corresponde: 0.002 s → "2 ms". */
export function formatearConUnidad(valor: number, unidad: string, cifras = 4): string {
  if (!Number.isFinite(valor)) return formatearNumero(valor, cifras);
  if (!UNIDADES_CON_PREFIJO.has(unidad) || valor === 0) {
    return unidad ? `${formatearNumero(valor, cifras)} ${unidad}` : formatearNumero(valor, cifras);
  }
  const absoluto = Math.abs(valor);
  const prefijo = PREFIJOS_SI.find((p) => absoluto >= p.factor * 0.9999999) ?? PREFIJOS_SI[PREFIJOS_SI.length - 1];
  return `${formatearNumero(valor / prefijo.factor, cifras)} ${prefijo.simbolo}${unidad}`;
}

/** Número para insertar en una expresión LaTeX: 1.5e-5 → 1.5\times10^{-5}. */
export function numeroLatex(valor: number, cifras = 4): string {
  const texto = formatearNumero(valor, cifras);
  if (texto === "—") return "\\text{—}";
  if (texto === "∞") return "\\infty";
  if (texto === "−∞") return "-\\infty";
  if (texto.includes("e")) {
    const [mantisa, exponente] = texto.split("e");
    return `${mantisa}\\times10^{${exponente}}`;
  }
  return texto;
}

/** Término de fase para LaTeX: devuelve "" si la fase es 0, o "+0.785" / "-0.785". */
export function terminoFaseLatex(radianes: number, cifras = 4): string {
  if (Math.abs(radianes) < 1e-12) return "";
  const signo = radianes > 0 ? "+" : "-";
  return `${signo}${numeroLatex(Math.abs(radianes), cifras)}`;
}

/** Tiempo de cálculo en ms; el reloj del navegador tiene una resolución de ~0.1 ms. */
export function formatearDuracionCalculo(milisegundos: number): string {
  return milisegundos < 0.1 ? "< 0.1 ms" : `${formatearNumero(milisegundos, 3)} ms`;
}

export function formatearPorcentaje(fraccion: number, cifras = 3): string {
  return `${formatearNumero(fraccion * 100, cifras)} %`;
}

export function formatearHora(fecha: Date | number): string {
  const d = typeof fecha === "number" ? new Date(fecha) : fecha;
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
