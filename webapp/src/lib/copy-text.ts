/** Copia texto al portapapeles. Intenta la API moderna y, si el navegador no la
 *  permite (iframe, contexto sin permiso, navegador antiguo), copia por selección.
 *  Devuelve si se pudo copiar. Solo para usar desde el navegador. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }
}
