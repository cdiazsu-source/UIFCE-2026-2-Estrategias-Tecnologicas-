"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { RETURN_SECONDS, clearReturn, readReturn, type ReunionReturn } from "@/lib/reunion-return";

/** Botón flotante «Volver a la reunión»: aparece fuera de /reunion cuando se llegó desde la presentación y dura 30 segundos. */
export function ReunionReturnButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [info, setInfo] = useState<ReunionReturn | null>(null);
  const [left, setLeft] = useState(0);

  // Al cambiar de pantalla: de vuelta en la reunión se limpia; en otra pantalla se lee si queda tiempo.
  useEffect(() => {
    if (pathname.startsWith("/reunion")) {
      clearReturn();
      setInfo(null);
      return;
    }
    const r = readReturn();
    if (r && r.until > Date.now()) {
      setInfo(r);
      setLeft(Math.ceil((r.until - Date.now()) / 1000));
    } else {
      if (r) clearReturn();
      setInfo(null);
    }
  }, [pathname]);

  // Cuenta regresiva; al llegar a cero el botón desaparece.
  useEffect(() => {
    if (!info) return;
    const t = setInterval(() => {
      const s = Math.ceil((info.until - Date.now()) / 1000);
      if (s <= 0) {
        clearReturn();
        setInfo(null);
      } else setLeft(s);
    }, 500);
    return () => clearInterval(t);
  }, [info]);

  if (!info) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[80] flex flex-col gap-1 overflow-hidden rounded-full shadow-lg">
      <button
        type="button"
        onClick={() => {
          clearReturn();
          router.push(info.href);
        }}
        className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-brand-accent"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a la reunión{info.label ? ` · ${info.label}` : ""}
        <span className="tabular-nums text-primary-foreground/70">{left} s</span>
      </button>
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 origin-left bg-brand-accent" style={{ transform: `scaleX(${Math.min(1, left / RETURN_SECONDS)})`, transition: "transform 0.5s linear" }} />
    </div>
  );
}
