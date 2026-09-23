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
export const PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    key: "headline",
    prompt: "En una frase: ¿qué haces en la UIFCE y para quién?",
    hint: "Con esto armamos tu titular: la línea que aparece justo bajo tu nombre y foto, y lo primero que la gente lee en los resultados de búsqueda. En LinkedIn se edita tocando el lápiz junto a tu foto de perfil. Ejemplo: «Apoyo la comunicación digital de la Unidad de Informática de la Facultad de Ciencias Económicas, UNAL».",
    placeholder: "Una frase corta, sin pulir…",
  },
  {
    key: "about",
    prompt: "En 2 o 3 frases: ¿cómo llegaste a la UIFCE y qué te gusta de lo que haces ahí?",
    hint: "Es el borrador de tu sección «Acerca de» (el bloque de texto debajo del titular). No tiene que sonar perfecto todavía, solo la idea — luego se pule entre todos.",
    placeholder: "Unas líneas sueltas están bien…",
  },
  {
    key: "achievement",
    prompt: "Cuenta un logro concreto de este semestre. Si puedes, con un número.",
    hint: "Sirve para una viñeta de tu experiencia en la sección «Experiencia» → UIFCE. Un número lo hace más creíble: «llegamos a 500 seguidores», «hicimos 3 microtalleres»…",
    placeholder: "Ej: aumentamos las impresiones un 40%…",
  },
  {
    key: "favoriteProject",
    prompt: "¿Qué proyecto de la UIFCE te gustaría mostrar en tu perfil?",
    hint: "LinkedIn permite agregar «Proyectos destacados» dentro de una experiencia laboral. Con el nombre ya tenemos el candidato — la fecha y una foto o enlace se completan después.",
    placeholder: "Nombre del proyecto…",
  },
  {
    key: "skills",
    prompt: "Nombra 3 habilidades que quieres que la gente vea primero en tu perfil.",
    hint: "Van a «Aptitudes» — LinkedIn deja fijar 3 arriba de todas las demás. Pueden ser técnicas (edición de video, Excel) o blandas (gestión de proyectos, hablar en público).",
    placeholder: "Ej: Canva, edición de video, trabajo en equipo…",
  },
  {
    key: "experienceListed",
    prompt: "¿Ya tienes a la UIFCE agregada en la sección «Experiencia» de tu perfil?",
    hint: "Si todavía no, escribe aquí qué cargo pondrías (ej. «Monitor de Artes») y desde cuándo, para copiarlo fácil después. Si ya está, basta con «Sí, ya está».",
    placeholder: "Sí / No — y el cargo si falta…",
  },
  {
    key: "goal",
    prompt: "Si alguien ve tu perfil dentro de un año, ¿qué te gustaría que piense de ti?",
    hint: "No hay respuesta correcta — ayuda a decidir el tono del resto del perfil (más técnico, más creativo, más de liderazgo…).",
    placeholder: "Una idea, aunque sea vaga…",
  },
  {
    key: "stuck",
    prompt: "¿Qué parte de tu perfil de LinkedIn te da más pereza o no sabes cómo llenar?",
    hint: "Así quien te ayude a organizarlo sabe por dónde empezar contigo, sin que tengas que explicarlo cada vez.",
    placeholder: "Foto, redactar, banner, no sé por dónde empezar…",
  },
];

export const PROFILE_QUESTION_KEYS = new Set(PROFILE_QUESTIONS.map((q) => q.key));
