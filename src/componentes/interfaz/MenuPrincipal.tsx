import Link from "next/link";

/** Enlace de vuelta a la página de inicio. */
export function MenuPrincipal() {
  return (
    <nav aria-label="Secciones">
      <Link href="/" className="rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-grafito-800 hover:text-slate-200">
        Inicio
      </Link>
    </nav>
  );
}
