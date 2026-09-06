/** Proyecto al que pertenece el panel de consentimientos de uso de imagen. */
export const CONSENT_PROJECT_ID = "consentimiento-imagen-micrositio";

/** Texto del documento a firmar, tal cual lo definió el área. Los marcadores
 *  «XXX» los completa cada persona al firmar (el nombre se puede autocompletar
 *  desde el panel; la cédula no se guarda en la app). */
export const CONSENT_DOC_TEXT = `Bogotá D.C., 31 Agosto de 2026


Yo, XXX, identificado/a con cédula de ciudadanía XXX, otorgo mi consentimiento para el uso de mi imagen, nombre y cargo dentro de la Unidad de Informática de la Facultad de Ciencias Económicas (UIFCE) durante el periodo 2026-1S en el micrositio web de la UIFCE, alojado en la página oficial de la Facultad de Ciencias Económicas.
Declaro que comprendo que la finalidad de esta autorización es la presentación de los miembros del equipo de la UIFCE para el periodo 2026-2S. Por lo tanto, doy este consentimiento de manera libre y consciente, reconociendo el alcance de esta autorización.
Asimismo, autorizo el uso de mi imagen, nombre y cargo en dicho micrositio web por el tiempo necesario para cumplir con el propósito mencionado.






____________________________
XXXXXX
C.C. XXXX
`;

/** Devuelve el texto con el nombre de la persona en lugar de los marcadores de
 *  nombre (la cédula se mantiene como «XXX»). */
export function consentTextFor(name: string): string {
  return CONSENT_DOC_TEXT.replace("Yo, XXX,", `Yo, ${name},`).replace("\n____________________________\nXXXXXX\n", `\n____________________________\n${name}\n`);
}
