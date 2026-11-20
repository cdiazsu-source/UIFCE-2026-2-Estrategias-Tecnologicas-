/** Apoyos Académicos por asignatura y profesor, de 2025-2 a 2026-2, tomados de la hoja «Asignación» del Excel «2.3. Asignaciones AA».
 *  Lo genera webapp/scripts/generar-aliados-academicos.py: no se edita a mano; al cargar un Excel nuevo se regenera. Solo trae el nombre del profesor
 *  (información pública), sin correos, cédulas ni teléfonos, y nada de los monitores.
 *  p = profesor, c = asignatura, pg = programa del Excel, m = nombre exacto de la asignatura en la malla (null = sin malla),
 *  s = sesiones por semestre, w = software, e = estado de las sesiones de 2026-2. */

export type AlliedSupport = {
  p: string;
  c: string;
  pg: "economia" | "administracion" | "contaduria" | "otro";
  m: string | null;
  s: Partial<Record<"25-2" | "26-1" | "26-2", number>>;
  w: string[];
  e: Partial<Record<"DICTADA" | "ASIGNADA" | "SIN ASIGNAR" | "CANCELADA", number>>;
};

export const SUPPORT_SEMESTERS = ["25-2", "26-1", "26-2"] as const;

export const ALLIED_SUPPORTS: AlliedSupport[] = [
  {"p":"José Yesid Salazar Quiroga","c":"Analítica de negocios I","pg":"administracion","m":"Analítica de negocios I","s":{"26-2":10},"w":["MySQL","Python"],"e":{"DICTADA":2,"ASIGNADA":8}},
  {"p":"Angie Daniela Araque Téllez","c":"Aplicaciones empresariales","pg":"administracion","m":"Aplicaciones empresariales","s":{"25-2":2},"w":["Odoo"],"e":{}},
  {"p":"Beatriz Helena Díaz Pinzón","c":"Aplicaciones empresariales","pg":"administracion","m":"Aplicaciones empresariales","s":{"25-2":2,"26-1":2,"26-2":2},"w":["Odoo","SAP","Tableau"],"e":{"ASIGNADA":2}},
  {"p":"Andrea González Sandoval","c":"Comportamiento organizacional","pg":"administracion","m":"Comportamiento organizacional","s":{"25-2":1,"26-1":4,"26-2":2},"w":["NVivo"],"e":{"ASIGNADA":2}},
  {"p":"Diana Elvira Forero Rodríguez","c":"Gestión de recursos humanos","pg":"administracion","m":"Gestión de recursos humanos","s":{"25-2":3},"w":["Power BI"],"e":{}},
  {"p":"Angie Daniela Araque Téllez","c":"Informática aplicada para la gestión de datos e información","pg":"administracion","m":"Informática aplicada para la gestión de datos e información","s":{"26-1":6},"w":["Access","Excel"],"e":{}},
  {"p":"Sandra Patricia Rojas Berrio","c":"Semillero de investigación M&M","pg":"administracion","m":null,"s":{"25-2":1},"w":["NVivo"],"e":{}},
  {"p":"Gerardo Ernesto Mejía Alfaro","c":"Contabilidad de gestión avanzada","pg":"contaduria","m":"Contabilidad de gestión avanzada","s":{"25-2":2,"26-1":3,"26-2":1},"w":["SAP"],"e":{"DICTADA":1}},
  {"p":"Cristian Camilo Urrea Villalobos","c":"Contabilidad de inversión y financiación","pg":"contaduria","m":"Contabilidad de inversión y financiación","s":{"25-2":2},"w":["SAP"],"e":{}},
  {"p":"Claudia Lucía Niño Galeano","c":"Contabilidad de operaciones","pg":"contaduria","m":"Contabilidad de operaciones","s":{"25-2":1,"26-1":1},"w":["Excel","SAP"],"e":{}},
  {"p":"Mónica Eunice Sarmiento Reyes","c":"Contabilidad de operaciones","pg":"contaduria","m":"Contabilidad de operaciones","s":{"26-2":2},"w":["Siigo"],"e":{"ASIGNADA":2}},
  {"p":"Yuly Marcela Suárez Rico","c":"Contabilidad de operaciones","pg":"contaduria","m":"Contabilidad de operaciones","s":{"26-1":2,"26-2":1},"w":["SAP","Siigo"],"e":{"ASIGNADA":1}},
  {"p":"Edwin Santiago Bejarano Lozada","c":"Contabilidad proceso contable","pg":"contaduria","m":"Contabilidad proceso contable","s":{"25-2":2,"26-2":6},"w":["Siigo"],"e":{"ASIGNADA":6}},
  {"p":"Ruth Alejandra Patiño Jacinto","c":"Contabilidad proceso contable","pg":"contaduria","m":"Contabilidad proceso contable","s":{"25-2":1},"w":["SAP"],"e":{}},
  {"p":"Germán Espinosa","c":"Escuelas","pg":"contaduria","m":null,"s":{"26-2":5},"w":["IA"],"e":{"ASIGNADA":5}},
  {"p":"Paula Andrea Navarro Pérez","c":"Financial Management","pg":"contaduria","m":null,"s":{"26-1":2,"26-2":2},"w":["Power BI"],"e":{"ASIGNADA":2}},
  {"p":"Diego Alexander Quintanilla Ortiz","c":"Fundamentos de contabilidad de gestión","pg":"contaduria","m":"Fundamentos de contabilidad de gestión","s":{"25-2":2},"w":["SAP"],"e":{}},
  {"p":"Jairo Orlando Villabona Robayo","c":"Fundamentos de contabilidad de gestión","pg":"contaduria","m":"Fundamentos de contabilidad de gestión","s":{"25-2":4,"26-1":4},"w":["SAP"],"e":{}},
  {"p":"Isabel Cristina Moncayo Vega","c":"Fundamentos de contabilidad financiera","pg":"contaduria","m":"Fundamentos de contabilidad financiera","s":{"25-2":2,"26-1":2},"w":["Excel"],"e":{}},
  {"p":"Ruth Alejandra Patiño Jacinto","c":"Fundamentos de contabilidad financiera","pg":"contaduria","m":"Fundamentos de contabilidad financiera","s":{"25-2":1},"w":["Excel"],"e":{}},
  {"p":"Luis Alejandro Rodríguez Ramírez","c":"Gestión de operaciones II","pg":"contaduria","m":null,"s":{"25-2":2,"26-1":3},"w":["SAP"],"e":{}},
  {"p":"Gustavo Adolfo Acuña","c":"Planta docente","pg":"contaduria","m":null,"s":{"26-1":2},"w":["Canva","IA"],"e":{}},
  {"p":"Jairo Orlando Villabona Robayo","c":"Planta docente","pg":"contaduria","m":null,"s":{"26-1":2},"w":["IA"],"e":{}},
  {"p":"Yuly Marcela Suárez Rico","c":"Planta docente","pg":"contaduria","m":null,"s":{"26-1":1},"w":["Excel"],"e":{}},
  {"p":"Jairo Orlando Villabona Robayo","c":"Práctica profesional","pg":"contaduria","m":null,"s":{"25-2":2},"w":["Excel"],"e":{}},
  {"p":"Edwin Santiago Castillo Dávila","c":"Sistemas de información","pg":"contaduria","m":null,"s":{"25-2":2,"26-1":2,"26-2":2},"w":["Odoo"],"e":{"ASIGNADA":2}},
  {"p":"Paula Andrea Navarro Pérez","c":"Trabajo de grado","pg":"contaduria","m":null,"s":{"26-1":1},"w":["Google Suite"],"e":{}},
  {"p":"Gustavo Adolfo Acuña","c":"Área de contabilidad y finanzas","pg":"contaduria","m":null,"s":{"26-2":2},"w":["Herramientas para la productividad académica"],"e":{"ASIGNADA":2}},
  {"p":"Omar Rodríguez Torres","c":"Fundamentos de economía urbana","pg":"economia","m":null,"s":{"25-2":5,"26-1":3,"26-2":2},"w":["QGIS"],"e":{"DICTADA":2}},
  {"p":"Ana María Estrada Jabela","c":"Gestión de calidad","pg":"otro","m":null,"s":{"25-2":3},"w":["Google Suite"],"e":{}},
  {"p":"Andrea Sendoya Ospina","c":"ORII","pg":"otro","m":null,"s":{"26-1":2},"w":["Power BI"],"e":{}},
  {"p":"Paula Andrea Navarro Pérez","c":"Proyecto de extensión","pg":"otro","m":null,"s":{"25-2":1},"w":["Power BI"],"e":{}},
  {"p":"Mónica Eunice Sarmiento Reyes","c":"Práctica profesional","pg":"otro","m":null,"s":{"26-2":1},"w":["Excel"],"e":{"ASIGNADA":1}},
  {"p":"Víctor Mauricio Castañeda Rodríguez","c":"Seminario de investigación","pg":"otro","m":null,"s":{"26-2":3},"w":["NVivo","STATA"],"e":{"ASIGNADA":1,"SIN ASIGNAR":2}},
];
