/** CSV mínimo, sin librería: separador coma, comillas dobles cuando el campo
 *  trae coma/comilla/salto de línea. BOM UTF-8 al inicio para que Excel/Sheets
 *  no rompan las tildes al abrir el archivo directamente. */
function csvField(value: string): string {
  const v = value ?? "";
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(rows: string[][]): string {
  return "﻿" + rows.map((row) => row.map(csvField).join(",")).join("\r\n");
}

/** Descarga un CSV en el navegador (sin ida y vuelta al servidor: la data ya
 *  está en el cliente). */
export function downloadCsv(filename: string, rows: string[][]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
