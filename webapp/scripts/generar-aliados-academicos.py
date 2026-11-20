"""
Genera webapp/src/lib/academic-allies-data.ts a partir de la hoja «Asignación» del Excel de Apoyos Académicos.

  Uso (desde webapp/; necesita openpyxl):
    python scripts/generar-aliados-academicos.py "C:/ruta/2.3. Asignaciones AA.xlsx"

Solo lee el Excel y escribe el archivo de datos; no toca la base de datos. Del Excel conserva únicamente el nombre del
profesor (información pública), la asignatura, el programa, el software, las sesiones por semestre y el estado de las de
2026-2: nada de correos, cédulas, teléfonos ni monitores. Los nombres escritos de varias formas se unifican con los
diccionarios P (profesores) y M / SHOW (asignaturas). Si el Excel trae un profesor o una asignatura que no están en esos
diccionarios, el script lo avisa y no escribe nada: se agrega la equivalencia y se vuelve a correr.
Los semestres se leen de la columna «Semestre» (AAAAMM); para uno nuevo, agregarlo a SEM y a SUPPORT_SEMESTERS en el .ts.
"""
import openpyxl,collections as C,re,json,unicodedata,sys
import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(HERE,'..','src','lib','academic-allies-data.ts')
def n(s): return re.sub(r'\s+',' ',''.join(c for c in unicodedata.normalize('NFD',str(s)) if unicodedata.category(c)!='Mn').lower().strip())
wb=openpyxl.load_workbook(sys.argv[1],data_only=True,read_only=True)
rows=list(wb['Asignación'].iter_rows(values_only=True)); h=rows[0]
R=[dict(zip(h,r)) for r in rows[1:] if r[0] is not None]
PG={'contaduria publica':'contaduria','administracion de empresas':'administracion','economia':'economia'}
M={ # curso normalizado -> (nombre en la malla, nombre a mostrar)
 'analitica de negocios 1':('Analítica de negocios I',),
 'aplicaciones empresariales':('Aplicaciones empresariales',),
 'comportamiento organizacional':('Comportamiento organizacional',),
 'gestion de recursos humanos':('Gestión de recursos humanos',),
 'informatica aplicada para la gestion de datos e informacion':('Informática aplicada para la gestión de datos e información',),
 'contabilidad proceso contable':('Contabilidad proceso contable',),'contabilidad de proceso contable':('Contabilidad proceso contable',),
 'contabilidad de gestion avanzada':('Contabilidad de gestión avanzada',),
 'contabilidad de inversiones y financiacion':('Contabilidad de inversión y financiación',),
 'contabilidad de operaciones':('Contabilidad de operaciones',),
 'fundamentos de contabilidad financiera':('Fundamentos de contabilidad financiera',),
 'fundamentos de contabilidad de gestion':('Fundamentos de contabilidad de gestión',),
}
SHOW={'finacial management':'Financial Management','financial management':'Financial Management','gestion de operaciones ii':'Gestión de operaciones II','gestion de las operaciones 2':'Gestión de operaciones II',
 'orii':'ORII','practica profesional':'Práctica profesional','seminario de investigacion':'Seminario de investigación','sistemas de informacion':'Sistemas de información',
 'fundamentos de economia urbana':'Fundamentos de economía urbana','gestion de calidad':'Gestión de calidad','proyecto de extension':'Proyecto de extensión','semillero de investigacion m&m':'Semillero de investigación M&M',
 'planta docente':'Planta docente','escuelas':'Escuelas','area de contabilidad y finanzas':'Área de contabilidad y finanzas','trabajo de grado':'Trabajo de grado'}
P={ # profesor normalizado -> nombre
 'beatriz diaz':'Beatriz Helena Díaz Pinzón','beatriz helena diaz pinzon':'Beatriz Helena Díaz Pinzón',
 'edwin bejarano':'Edwin Santiago Bejarano Lozada','edwin santiago bejarano lozada':'Edwin Santiago Bejarano Lozada',
 'ernesto mejia':'Gerardo Ernesto Mejía Alfaro','gerardo ernesto mejia alfaro':'Gerardo Ernesto Mejía Alfaro','gerardo mejia':'Gerardo Ernesto Mejía Alfaro',
 'claudia lucia nino galeano':'Claudia Lucía Niño Galeano','claudia nino':'Claudia Lucía Niño Galeano',
 'yuly suarez':'Yuly Marcela Suárez Rico','yuly marcela suarez rico':'Yuly Marcela Suárez Rico',
 'paula andrea navarro':'Paula Andrea Navarro Pérez','paula andrea navarro perez':'Paula Andrea Navarro Pérez',
 'jairo villabona':'Jairo Orlando Villabona Robayo','jairo orlando villabona':'Jairo Orlando Villabona Robayo','jairo orlando villabona robayo':'Jairo Orlando Villabona Robayo',
 'luis alejandro rodriguez ramirez':'Luis Alejandro Rodríguez Ramírez','edwin castillo':'Edwin Santiago Castillo Dávila','edwin santiago castillo':'Edwin Santiago Castillo Dávila','edwin santiago castillo davila':'Edwin Santiago Castillo Dávila',
 'victor mauricio castaneda':'Víctor Mauricio Castañeda Rodríguez','victor mauricio castaneda rodriguez':'Víctor Mauricio Castañeda Rodríguez',
 'gustavo acuna':'Gustavo Adolfo Acuña','gustavo adolfo acuna':'Gustavo Adolfo Acuña','angie daniela araque tellez':'Angie Daniela Araque Téllez',
 'andrea gonzalez sandoval':'Andrea González Sandoval','jose yesid salazar quiroga':'José Yesid Salazar Quiroga','diana elvira forero rodriguez':'Diana Elvira Forero Rodríguez',
 'omar rodriguez torres':'Omar Rodríguez Torres','monica eunice sarmiento reyes':'Mónica Eunice Sarmiento Reyes','ruth alejandra patino jacinto':'Ruth Alejandra Patiño Jacinto',
 'isabel cristina moncayo vega':'Isabel Cristina Moncayo Vega','diego alexander quintanilla ortiz':'Diego Alexander Quintanilla Ortiz','cristian camilo urrea villalobos':'Cristian Camilo Urrea Villalobos',
 'german espinosa':'Germán Espinosa','ana maria estrada jabela':'Ana María Estrada Jabela','andrea sendoya ospina':'Andrea Sendoya Ospina','sandra patricia rojas berrio':'Sandra Patricia Rojas Berrio'}
SEM={202502:'25-2',202601:'26-1',202602:'26-2'}
agg=C.OrderedDict(); unk=set()
for r in R:
    c=n(r['Materia/Área']); pg=PG.get(n(r['Programa_curricular']),'otro')
    prof=n(re.sub(r'\s+',' ',str(r['Profesor_encargado'])))
    if prof not in P: unk.add(prof); continue
    m=None
    if c in M and pg in ('contaduria','administracion','economia'): m=M[c][0]
    disp=m or SHOW.get(c) or unk.add('curso:'+c)
    k=(disp,pg,P[prof],m)
    a=agg.setdefault(k,{'s':C.Counter(),'sw':set(),'e':C.Counter()})
    a['s'][SEM[int(r['Semestre'])]]+=1; a['sw'].add(str(r['Software']).strip())
    if int(r['Semestre'])==202602: a['e'][str(r['Estado'])]+=1
if unk:
    print('Falta agregar la equivalencia de:',sorted(unk)); sys.exit(1)
out=[]
for (disp,pg,prof,m),a in agg.items():
    out.append({'p':prof,'c':disp,'pg':pg,'m':m,'s':dict(a['s']),'w':sorted(a['sw']),'e':dict(a['e'])})
out.sort(key=lambda o:(o['pg'],o['c'],o['p']))
ts=open(OUT,encoding='utf-8').read()
cab=ts.split('export const ALLIED_SUPPORTS')[0]
NL=chr(10)
filas=NL.join('  '+json.dumps(o,ensure_ascii=False,separators=(',',':'))+',' for o in out)
cuerpo='export const ALLIED_SUPPORTS: AlliedSupport[] = ['+NL+filas+NL+'];'+NL
open(OUT,'w',encoding='utf-8',newline=NL).write(cab+cuerpo)
print(len(out),'filas;',len({o['p'] for o in out}),'profesores;',sum(sum(o['s'].values()) for o in out),'sesiones')
