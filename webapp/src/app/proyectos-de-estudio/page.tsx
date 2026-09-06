import { redirect } from "next/navigation";

// Los proyectos de estudio ahora viven en el panel principal, agrupados por
// semestre. Se mantiene la ruta para no romper enlaces viejos.
export default function ProyectosDeEstudioPage() {
  redirect("/#proyectos");
}
