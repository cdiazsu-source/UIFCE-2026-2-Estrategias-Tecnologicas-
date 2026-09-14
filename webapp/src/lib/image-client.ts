/** Utilidades de imagen que solo corren en el navegador (Canvas, Image). Se
 *  extrajo de templates-panel.tsx para que Difusión física reutilice la misma
 *  lógica en vez de duplicarla. */

/** Reduce una imagen a JPEG con el lado mayor <= `max` px y la devuelve como
 *  data URL. Mantiene el peso de la fila bajo (~30-70 KB) para no inflar la BD. */
export function downscaleToDataUrl(file: Blob, max = 640, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("sin canvas"));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("no es una imagen válida"));
    };
    img.src = objectUrl;
  });
}
