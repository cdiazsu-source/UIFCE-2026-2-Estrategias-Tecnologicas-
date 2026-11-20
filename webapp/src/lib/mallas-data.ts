/** Mallas curriculares de los tres pregrados de la FCE (Economía, Administración de Empresas y Contaduría Pública), tomadas de los planes de estudio vigentes.
 *  Una asignatura es [nombre, créditos, código, componente, marca, subtítulo]: componente F = fundamentación, D = disciplinar, L = libre elección;
 *  marca 1 = optativa, "tall" = tarjeta alta (libre elección de Economía). El código viene vacío donde el plan no lo muestra (solo Economía lo trae).
 *  Los créditos por semestre NO incluyen el inglés: sus 4 niveles van aparte (`ing`). Para actualizarlas, editar este archivo. */

export type ProgramKey = "economia" | "administracion" | "contaduria";
export type Component = "F" | "D" | "L";
export type Course = [name: string, credits: number, code: string, component: Component, flag?: 0 | 1 | "tall", subtitle?: string];
export type Program = { key: ProgramKey; tab: string; name: string; roman: string[]; sems: Course[][]; ing: [string, number, string][]; note: string };

export const PROGRAM_ORDER: ProgramKey[] = ["economia", "administracion", "contaduria"];

export const PROGRAMS: Record<ProgramKey, Program> = {
  economia: {
    key: "economia",
    tab: "Economía",
    name: "Economía",
    roman: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"],
    sems: [
      [
        ["Fundamentos de economía", 3, "2015270", "F"],
        ["Fundamentos de administración", 4, "2016002", "F"],
        ["Fundamentos de contabilidad financiera", 4, "2006086", "F"],
        ["Metodología de la investigación I", 2, "2016015", "F"],
        ["Cálculo diferencial", 4, "1000004", "F"],
      ],
      [
        ["Macroeconomía I", 4, "2016012", "D"],
        ["Microeconomía I", 4, "2016017", "D"],
        ["Historia económica general", 4, "2016011", "D"],
        ["Modelación estática", 4, "2016021", "F"],
      ],
      [
        ["Macroeconomía II", 4, "2016013", "D"],
        ["Microeconomía II", 4, "2016018", "D"],
        ["Historia del pensamiento económico", 4, "2016009", "D"],
        ["Optativa de contenido cuantitativo", 3, "", "F", 1],
        ["Modelación dinámica", 4, "2016020", "F"],
      ],
      [
        ["Macroeconomía III", 4, "2016014", "D"],
        ["Microeconomía III", 4, "2016019", "D"],
        ["Economía política I", 4, "2016005", "D"],
        ["Econometría I", 4, "2016002", "D"],
      ],
      [
        ["Política macroeconómica", 4, "2016022", "D"],
        ["Teoría moderna de la firma", 4, "2016023", "D"],
        ["Economía política II", 4, "2016006", "D"],
        ["Econometría II", 4, "2016003", "D"],
        ["Desarrollo económico", 4, "2016001", "D"],
      ],
      [
        ["Economía colombiana", 4, "2016004", "D"],
        ["Historia económica de Colombia (siglos XIX y XX)", 4, "2016010", "D"],
        ["Teorías del comercio internacional", 4, "2016024", "D"],
        ["Metodología de la investigación II", 3, "2016016", "F"],
      ],
      [
        ["Optativa interdisciplinar", 3, "", "D", 1],
        ["Optativa interdisciplinar", 3, "", "D", 1],
      ],
      [
        ["Optativa interdisciplinar", 3, "", "D", 1],
        ["Optativa interdisciplinar", 3, "", "D", 1],
      ],
      [
        ["Libre elección", 30, "", "L", "tall"],
      ],
      [
        ["Trabajo de grado", 6, "2015300", "D"],
      ],
    ],
    ing: [["Inglés I", 3, "1000044"], ["Inglés II", 3, "1000045"], ["Inglés III", 3, "1000046"], ["Inglés IV", 3, "1000047"]],
    note:
      "Verificación: el archivo indica 19 créditos para el semestre I, pero sus asignaturas suman 17, y solo con 17 el programa da los 151 que declara. Los 12 créditos de inglés se cuentan aparte, para 163 en total. El código 2016002 aparece en Fundamentos de administración y en Econometría I; uno de los dos es un error de transcripción. El archivo solo da los totales por componente (28 + 3 de fundamentación y 78 + 12 disciplinar); la clasificación por asignatura se dedujo de esos totales.",
  },
  administracion: {
    key: "administracion",
    tab: "Administración de Empresas",
    name: "Administración de Empresas",
    roman: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"],
    sems: [
      [
        ["Fundamentos de administración", 4, "", "F"],
        ["Fundamentos de contabilidad financiera", 4, "", "F"],
        ["Fundamentos en economía", 3, "", "F"],
        ["Habilidades comunicativas en ciencias de gestión", 3, "", "F"],
        ["Cálculo diferencial", 4, "", "F"],
      ],
      [
        ["Teoría organizacional I", 4, "", "F"],
        ["Fundamentos de contabilidad de gestión", 4, "", "F"],
        ["Macroeconomía I", 4, "", "F"],
        ["Informática aplicada para la gestión de datos e información", 4, "", "F"],
        ["Probabilidad y estadística fundamental", 3, "", "F"],
      ],
      [
        ["Teoría organizacional II", 4, "", "D"],
        ["Optativa disciplinar", 3, "", "D", 1],
        ["Microeconomía I", 4, "", "F"],
        ["Analítica de negocios I", 4, "", "F"],
        ["Libre elección", 3, "", "L"],
      ],
      [
        ["Internacionalización de la empresa", 4, "", "D"],
        ["Fundamentos de finanzas", 4, "", "F"],
        ["Libre elección", 3, "", "L"],
        ["Optativa disciplinar", 3, "", "D", 1],
        ["Derecho comercial, general y sociedades", 3, "", "D"],
      ],
      [
        ["Derecho de las relaciones laborales", 3, "", "D"],
        ["Fundamentos de mercadeo", 4, "", "D"],
        ["Gestión de recursos humanos", 4, "", "D"],
        ["Optativa de formación básica", 4, "", "F", 1],
        ["Gestión de las operaciones I", 4, "", "D"],
      ],
      [
        ["Emprendimiento enfocado en la generación de valor", 4, "", "D"],
        ["Finanzas avanzadas", 4, "", "D"],
        ["Comportamiento organizacional", 3, "", "D"],
        ["Sistemas de información gerencial", 4, "", "D"],
        ["Gestión de las operaciones II", 3, "", "D"],
      ],
      [
        ["Estrategia", 4, "", "D"],
        ["Estrategia de mercadeo", 3, "", "D"],
        ["Optativa de formación básica", 4, "", "F", 1],
        ["Aplicaciones empresariales", 4, "", "D"],
        ["Diseño, gestión y evaluación de proyectos", 4, "", "D"],
      ],
      [
        ["Libre elección", 3, "", "L"],
        ["Libre elección", 3, "", "L"],
        ["Libre elección", 3, "", "L"],
        ["Libre elección", 3, "", "L"],
        ["Optativa disciplinar", 3, "", "D", 1],
      ],
      [
        ["Libre elección", 3, "", "L"],
        ["Libre elección", 3, "", "L"],
        ["Libre elección", 3, "", "L"],
        ["Libre elección", 3, "", "L"],
        ["Libre elección", 3, "", "L"],
      ],
      [
        ["Trabajo de grado", 6, "", "D", 0, "Pasantía, monografía, postgrado o preparatorios"],
      ],
    ],
    ing: [["Inglés I", 0, ""], ["Inglés II", 0, ""], ["Inglés III", 0, ""], ["Inglés IV", 0, ""]],
    note:
      "Verificación: los semestres suman 164 créditos, igual que el total del PDF, con 57 de fundamentación, 74 disciplinares y 33 de libre elección. El PDF no muestra créditos ni códigos de inglés, y no los incluye en esos 164. Las asignaturas con borde punteado son optativas.",
  },
  contaduria: {
    key: "contaduria",
    tab: "Contaduría Pública",
    name: "Contaduría Pública",
    roman: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"],
    sems: [
      [
        ["Fundamentos de contabilidad financiera", 4, "", "F"],
        ["Fundamentos de economía", 3, "", "F"],
        ["Fundamentos de administración", 4, "", "F"],
        ["Cálculo diferencial", 4, "", "F"],
        ["Español y comunicación", 3, "", "F"],
      ],
      [
        ["Contabilidad de operaciones", 3, "", "D"],
        ["Microeconomía I", 4, "", "F"],
        ["Fundamentos de contabilidad de gestión", 4, "", "F"],
        ["Modelación estática", 4, "", "F"],
        ["Libre elección", 3, "", "L"],
      ],
      [
        ["Contabilidad de inversión y financiación", 3, "", "D"],
        ["Macroeconomía I", 4, "", "F"],
        ["Contabilidad de gestión avanzada", 4, "", "D"],
        ["Optativa cuantitativa", 4, "", "F", 1],
        ["Optativa de formación básica universitaria", 4, "", "F", 1],
      ],
      [
        ["Contabilidad proceso contable", 3, "", "D"],
        ["Teoría moderna de la firma", 4, "", "F"],
        ["Fundamentos de finanzas", 4, "", "F"],
        ["Optativa cuantitativa", 3, "", "F", 1],
        ["Libre elección", 3, "", "L"],
      ],
      [
        ["Control interno", 3, "", "D"],
        ["Problemas económicos colombianos", 4, "", "F"],
        ["Finanzas avanzadas", 4, "", "D"],
        ["Teoría de la contabilidad I", 4, "", "D"],
        ["Derecho comercial, general y sociedades", 3, "", "D"],
      ],
      [
        ["Regulación y contabilidad tributaria I", 4, "", "D"],
        ["Optativa: teorías y modelos contables", 3, "", "D", 1],
        ["Auditoría financiera I", 4, "", "D"],
        ["Teoría de la contabilidad II", 4, "", "D"],
        ["Libre elección", 3, "", "L"],
      ],
      [
        ["Regulación y contabilidad tributaria II", 4, "", "D"],
        ["Contabilidad pública", 3, "", "D"],
        ["Auditoría financiera II", 4, "", "D"],
        ["Optativa: ética y responsabilidad social", 3, "", "D", 1],
        ["Libre elección", 3, "", "L"],
      ],
      [
        ["Optativa: regulación", 3, "", "D", 1],
        ["Optativa interdisciplinaria", 3, "", "D", 1],
        ["Optativa: información y control público", 3, "", "D", 1],
        ["Optativa interdisciplinaria", 3, "", "D", 1],
        ["Optativa interdisciplinaria", 3, "", "D", 1],
      ],
      [
        ["Libre elección", 3, "", "L"],
        ["Libre elección", 3, "", "L"],
        ["Libre elección", 3, "", "L"],
        ["Libre elección", 3, "", "L"],
        ["Libre elección", 3, "", "L"],
      ],
      [
        ["Opción de grado", 6, "", "D"],
        ["Libre elección", 3, "", "L"],
        ["Libre elección", 3, "", "L"],
      ],
    ],
    ing: [["Inglés I", 3, ""], ["Inglés II", 3, ""], ["Inglés III", 3, ""], ["Inglés IV", 3, ""]],
    note:
      "Verificación: los semestres suman 167 créditos, igual que el total del PDF, con 57 de fundamentación, 77 disciplinares y 33 de libre elección. El PDF incluye los 12 créditos de inglés en los totales por semestre; aquí van aparte, para 179 en total. No incluí las horas presenciales ni independientes de cada asignatura.",
  },
};

/** Asignaturas que comparten programas: [nombre, [semestre en Economía, en Administración, en Contaduría]]; vacío = no está. */
export const COMMON_COURSES: [string, [string, string, string]][] = [
  ["Fundamentos de economía", ["I", "I", "I"]],
  ["Fundamentos de administración", ["I", "I", "I"]],
  ["Fundamentos de contabilidad financiera", ["I", "I", "I"]],
  ["Cálculo diferencial", ["I", "I", "I"]],
  ["Macroeconomía I", ["II", "II", "III"]],
  ["Microeconomía I", ["II", "III", "II"]],
  ["Inglés I a IV", ["I a IV", "I a IV", "I a IV"]],
  ["Fundamentos de finanzas", ["", "IV", "IV"]],
  ["Fundamentos de contabilidad de gestión", ["", "II", "II"]],
  ["Finanzas avanzadas", ["", "VI", "V"]],
  ["Derecho comercial, general y sociedades", ["", "IV", "V"]],
  ["Modelación estática", ["II", "", "II"]],
  ["Teoría moderna de la firma", ["V", "", "IV"]],
];
