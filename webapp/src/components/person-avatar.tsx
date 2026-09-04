export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Resuelve el valor de photoUrl: URL completa, data URL o ruta absoluta tal
 *  cual; un nombre de archivo suelto se busca en /public/avatares/. */
export function resolvePhoto(photoUrl: string) {
  if (/^(https?:\/\/|data:|\/)/.test(photoUrl)) return photoUrl;
  return `/avatares/${photoUrl}`;
}

const SIZES = {
  sm: { box: "h-7 w-7", text: "text-[11px]" },
  md: { box: "h-11 w-11", text: "text-sm" },
} as const;

/** Avatar circular: la foto si hay photoUrl, o las iniciales si no.
 *  `size` "sm" (28px, por defecto) o "md" (44px). */
export function PersonAvatar({
  name,
  photoUrl,
  size = "sm",
}: {
  name: string;
  photoUrl: string | null;
  size?: keyof typeof SIZES;
}) {
  const s = SIZES[size];
  if (photoUrl && photoUrl.trim().length > 0) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvePhoto(photoUrl.trim())}
        alt={name}
        className={`${s.box} shrink-0 rounded-full border border-border object-cover`}
      />
    );
  }
  return (
    <span
      className={`${s.box} ${s.text} flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary`}
    >
      {initials(name)}
    </span>
  );
}
