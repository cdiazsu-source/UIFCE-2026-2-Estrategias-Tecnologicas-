export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Resuelve el valor de photoUrl: URL completa o ruta absoluta tal cual;
 *  un nombre de archivo suelto se busca en /public/avatares/. */
export function resolvePhoto(photoUrl: string) {
  if (/^(https?:\/\/|\/)/.test(photoUrl)) return photoUrl;
  return `/avatares/${photoUrl}`;
}

/** Avatar de 28px: la foto si hay photoUrl, o las iniciales si no.
 *  Se usa igual en Contactos y en Equipo. */
export function PersonAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl && photoUrl.trim().length > 0) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvePhoto(photoUrl.trim())}
        alt={name}
        className="h-7 w-7 shrink-0 rounded-full border border-border object-cover"
      />
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
      {initials(name)}
    </span>
  );
}
