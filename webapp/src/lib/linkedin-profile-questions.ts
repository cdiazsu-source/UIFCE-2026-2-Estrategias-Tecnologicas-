export type ProfileQuestion = {
  key: string;
  /** La pregunta, corta y de una sola idea — una por pantalla. */
  prompt: string;
  /** Qué se hace con la respuesta y en qué parte de LinkedIn se usa. */
  hint: string;
  placeholder: string;
};

/** Plantilla de preguntas para armar el perfil de LinkedIn de una persona —
 *  el insumo inicial que luego se traduce a titular, extracto, experiencia y
 *  habilidades. Se responde pregunta por pregunta (no como un formulario
 *  largo de una sola vez) y cada una se guarda sola, sin botón de "enviar":
 *  se puede dejar a la mitad y retomar cuando sea, sin perder nada y sin
 *  presión de terminarla de una sentada.
 *
 *  Claves fijas: se usan como llave en LinkedInProfileAnswer, así que un
 *  cambio de redacción no pierde respuestas ya guardadas; agregar preguntas
 *  al final es seguro, pero no reutilizar una key para algo distinto. */
/** Nota sobre la redacción y el orden: las preguntas se redactaron en un tono corporativo y se pueden retocar (o
 *  reordenar) sin perder respuestas, porque lo que se guarda es la clave. «experienceListed» conserva su clave pero ahora
 *  recoge toda la trayectoria laboral (cargos en la UIFCE por área y semestre, y experiencia previa en otras
 *  organizaciones), no solo si la UIFCE ya figura en «Experiencia»: las respuestas antiguas, que eran «sí / no», siguen
 *  guardadas y se pueden ampliar. */
export const PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    key: "headline",
    prompt: "En una frase: ¿cuál es tu rol en la UIFCE y a quién beneficia tu trabajo?",
    hint: "Con esto se redacta tu titular profesional: la línea que aparece bajo tu nombre y tu foto, y lo primero que se lee en los resultados de búsqueda. En LinkedIn se edita con el lápiz junto a tu foto de perfil. Ejemplo: «Apoyo la comunicación digital de la Unidad de Informática de la Facultad de Ciencias Económicas, UNAL».",
    placeholder: "Una frase breve; se afina después…",
  },
  {
    key: "about",
    prompt: "En 2 o 3 frases: ¿cómo te vinculaste a la UIFCE y qué valor aporta tu trabajo?",
    hint: "Es el borrador de la sección «Acerca de» (el texto que aparece bajo el titular). No necesita estar pulido: lo importante es la idea; luego se revisa en equipo.",
    placeholder: "Unas líneas son suficientes…",
  },
  {
    key: "experienceListed",
    prompt: "¿Cuál es tu trayectoria laboral? Indica los cargos que has ocupado en la UIFCE (área, semestre y funciones principales) y tu experiencia previa en otras organizaciones.",
    hint: "Alimenta la sección «Experiencia» de LinkedIn: cada cargo en la UIFCE y cada trabajo anterior puede ser una entrada con sus funciones. Si has pasado por varias áreas o semestres de la Unidad, enuméralos por separado (área · semestre: qué hiciste) y menciona también tus prácticas y empleos fuera de ella. Si la UIFCE ya figura en tu perfil, indica qué falta por actualizar.",
    placeholder: "Ej: Área · 2025-1: funciones y resultados. Otra organización: cargo y funciones…",
  },
  {
    key: "achievement",
    prompt: "Describe un logro concreto de este semestre. Si es posible, cuantifícalo.",
    hint: "Se convierte en una viñeta de la sección «Experiencia» → UIFCE. Un dato numérico aumenta su credibilidad: «alcanzamos 500 seguidores», «realizamos 3 microtalleres»…",
    placeholder: "Ej: incrementamos las impresiones en un 40 %…",
  },
  {
    key: "favoriteProject",
    prompt: "¿Qué proyecto desarrollado en la UIFCE te gustaría destacar en tu perfil?",
    hint: "LinkedIn permite agregar «Proyectos destacados» dentro de una experiencia. Con el nombre ya tenemos el candidato; la fecha y una imagen o enlace se completan después.",
    placeholder: "Nombre del proyecto…",
  },
  {
    key: "skills",
    prompt: "Indica 3 competencias que quieres que se vean primero en tu perfil.",
    hint: "Van a «Aptitudes»: LinkedIn permite fijar 3 en la parte superior. Pueden ser técnicas (edición de video, Excel) o transversales (gestión de proyectos, comunicación oral).",
    placeholder: "Ej: Canva, edición de video, trabajo en equipo…",
  },
  {
    key: "goal",
    prompt: "Dentro de un año, ¿qué percepción profesional te gustaría que genere tu perfil?",
    hint: "No hay respuesta correcta: orienta el tono del resto del perfil (más técnico, más creativo, de liderazgo…).",
    placeholder: "Una idea, aunque sea general…",
  },
  {
    key: "stuck",
    prompt: "¿Qué sección de tu perfil de LinkedIn te resulta más difícil de completar?",
    hint: "Permite que quien te acompañe sepa por dónde empezar contigo, sin que tengas que explicarlo cada vez.",
    placeholder: "Foto, redacción, banner, no sé por dónde empezar…",
  },
  {
    key: "dreamCompanies",
    prompt: "¿En qué empresas u organizaciones te gustaría desarrollar tu carrera profesional?",
    hint: "Menciona 2 o 3: sirven para seguir sus páginas en LinkedIn, definir las palabras clave de tu perfil y alimentar las empresas de interés del equipo.",
    placeholder: "Ej: Bancolombia, una ONG, una empresa de tecnología…",
  },
  {
    key: "microtallerTopic",
    prompt: "Si dictaras un microtaller para la UIFCE, ¿sobre qué tema sería?",
    hint: "Es el punto de partida de una propuesta de microtaller a tu nombre; no requiere estar desarrollada, solo el tema que te interesaría compartir.",
    placeholder: "Ej: edición de video, Excel avanzado, diseño en Canva…",
  },
];

export const PROFILE_QUESTION_KEYS = new Set(PROFILE_QUESTIONS.map((q) => q.key));
