export type ProfileQuestion = {
  key: string;
  /** La pregunta, corta y de una sola idea — una por pantalla. */
  prompt: string;
  /** Qué se hace con la respuesta y en qué parte de LinkedIn se usa. */
  hint: string;
  placeholder: string;
  /** Opciones sugeridas que se ven de entrada: botones que se marcan (una o varias). La respuesta se guarda como texto, con
   *  lo elegido separado por coma; además se puede escribir otra en un campo «Otra». Las etiquetas no llevan comas ni
   *  punto y coma, porque son los separadores. */
  options?: string[];
  /** Más opciones, agrupadas, bajo un desplegable que arranca contraído (menos ruido). */
  moreOptions?: { group: string; items: string[] }[];
  /** Tope de opciones elegidas (las de los botones y las que se escriban). Al llegar, los demás botones se desactivan. */
  maxOptions?: number;
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
 *  al final es seguro, pero no reutilizar una key para algo distinto.
 *
 *  Nota sobre la redacción y el orden: las preguntas se redactaron en un tono corporativo y se pueden retocar (o
 *  reordenar) sin perder respuestas, porque lo que se guarda es la clave. «experienceListed» conserva su clave pero ahora
 *  recoge toda la trayectoria laboral (cargos en la UIFCE por área y semestre, y experiencia previa en otras
 *  organizaciones), no solo si la UIFCE ya figura en «Experiencia»: las respuestas antiguas, que eran «sí / no», siguen
 *  guardadas y se pueden ampliar. «workLines» (líneas de trabajo) se eligen con botones, hasta 3. */
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
    prompt:
      "¿Cuál es tu trayectoria laboral? Indica los cargos que has ocupado en la UIFCE (área, semestre y funciones principales) y tu experiencia previa en otras organizaciones.",
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
    key: "workLines",
    prompt: "¿En qué líneas de trabajo te gustaría desempeñarte profesionalmente? Elige hasta 3.",
    hint: "Orientan tu titular, tus aptitudes y las empresas que seguimos para ti. Si no encuentras la tuya, escríbela en «Otra».",
    placeholder: "Otra línea de trabajo (opcional)…",
    maxOptions: 3,
    options: [
      "Gestión humana y talento (Recursos Humanos)",
      "Econometría y modelación económica",
      "Análisis de datos y analítica de negocios (BI)",
      "Finanzas corporativas",
      "Banca e inversión (mercado de capitales)",
      "Contabilidad y auditoría (control de gestión)",
      "Estrategia y consultoría",
      "Gestión de proyectos (PMO)",
      "Mercadeo y analítica del consumidor",
      "Política pública y desarrollo económico",
    ],
    moreOptions: [
      { group: "Datos y tecnología", items: ["Ciencia de datos e IA aplicada", "Transformación digital y automatización de procesos"] },
      { group: "Finanzas y control", items: ["Gestión de riesgos y cumplimiento", "Tributaria y revisoría fiscal", "Presupuesto y planeación financiera"] },
      {
        group: "Operación y mercado",
        items: ["Operaciones y logística (cadena de suministro)", "Ventas y desarrollo de negocios", "Comunicación corporativa y marca"],
      },
      { group: "Gente y organización", items: ["Desarrollo organizacional y cultura"] },
      {
        group: "Impacto y conocimiento",
        items: [
          "Sostenibilidad y responsabilidad social (ESG)",
          "Emprendimiento e innovación",
          "Investigación y docencia académica",
          "Investigación de mercados y economía aplicada",
        ],
      },
    ],
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

/** Quita tildes y mayúsculas para comparar opciones. */
const foldOption = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

/** Separa una respuesta guardada («A, B; C») en sus elementos. */
export const splitAnswer = (answer: string) =>
  answer
    .split(/[,;\n]/)
    .map((t) => t.trim())
    .filter(Boolean);

/** ¿Son la misma opción? (sin importar tildes ni mayúsculas) */
export const sameOption = (a: string, b: string) => foldOption(a) === foldOption(b);

export const PROFILE_QUESTION_KEYS = new Set(PROFILE_QUESTIONS.map((q) => q.key));
