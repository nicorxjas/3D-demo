export const manualUrl = '/api/kernium/manual';
export const subsystems = [
 {id:'lift',name:'Elevación y mástil',short:'Elevación',color:'#ba8a42'},
 {id:'traction',name:'Potencia y tracción',short:'Tracción',color:'#748b68'},
 {id:'hydraulics',name:'Circuito hidráulico central',short:'Hidráulica',color:'#608f9c'},
 {id:'electronics',name:'Electrónica y mandos',short:'Mandos',color:'#9382a6'},
 {id:'chassis',name:'Chasis y tren de rodaje',short:'Rodaje',color:'#858b91'},
];
export const parts = [
 {id:'mast',name:'Mástil y cadenas',subsystem:'lift',detail:'Conjunto de guiado y transmisión de elevación. Se representa como unidad funcional; el alcance de reemplazo del mástil o del juego de cadenas se define con el catálogo de servicio.',symptoms:'Elevación irregular · Ruido en el mástil',pages:[80,83]},
 {id:'cylinders',name:'Cilindros de elevación',subsystem:'lift',detail:'Cilindros hidráulicos completos. Inspección de estanqueidad y funcionamiento; sin despiece de sellos, pistones ni válvulas internas.',symptoms:'Descenso involuntario · Fuga visible',pages:[80,84]},
 {id:'battery',name:'Banco de baterías',subsystem:'traction',detail:'Batería de tracción de plomo-ácido de la generación del manual. No se representa una batería de litio ni se presupone un BMS de litio.',symptoms:'Sin autonomía · No habilita elevación',pages:[36,37,75]},
 {id:'drive',name:'Accionamientos de tracción',subsystem:'traction',detail:'Motores eléctricos con transmisión delantera, agrupados como conjunto funcional. La selección de un recambio exige identificar el accionamiento y número de serie.',symptoms:'No avanza · Pérdida de potencia',pages:[16,79,75]},
 {id:'pump',name:'Grupo motor-bomba',subsystem:'hydraulics',detail:'Unidad de potencia hidráulica. El manual orienta comprobaciones; no aporta un procedimiento de sustitución ni presiones de diagnóstico para este conjunto.',symptoms:'Elevación lenta · Ruido hidráulico',pages:[16,75,80]},
 {id:'valves',name:'Bloque distribuidor',subsystem:'hydraulics',detail:'Bloque de válvulas completo como candidato LRU. No se modelan pernos ni partes internas. Su posición en el visor es ilustrativa.',symptoms:'No eleva · Movimiento irregular',pages:[80,75]},
 {id:'reservoir',name:'Depósito y filtración',subsystem:'hydraulics',detail:'Módulo funcional de depósito y filtro hidráulico. El filtro es un elemento de servicio independiente; el conjunto visual no implica reemplazar el depósito al cambiar el filtro.',symptoms:'Nivel bajo · Aceite contaminado',pages:[84,80]},
 {id:'controls',name:'Mandos e interbloqueos',subsystem:'electronics',detail:'SOLOPILOT, display y puesto del operador, agrupados para localizar síntomas. Los mandos y sensores son recambios distintos; no se deben puentear los interbloqueos.',symptoms:'No habilita marcha · Código en pantalla',pages:[47,49,54,75]},
 {id:'controller',name:'Controlador electrónico',subsystem:'electronics',detail:'Electrónica de control representada como módulo completo. Leer y registrar el código exacto antes de atribuir una avería; parametrización y sustitución requieren documentación de taller.',symptoms:'Error de control · Sobretemperatura',pages:[52,54,79]},
 {id:'wheels',name:'Conjuntos de ruedas',subsystem:'chassis',detail:'Ruedas delanteras y conjunto direccional trasero agrupados por función. Chasis y techo son contexto estructural. El sistema de frenos no está desglosado en esta selección.',symptoms:'Vibración · Desgaste de rodaje',pages:[79,83]},
].map((p,i)=>({...p,number:String(i+1).padStart(2,'0'),category:subsystems.find(s=>s.id===p.subsystem).short}));
export const sources = [
 {id:'overview',title:'Descripción del equipo',section:'B 1–3 · Configuración y conjuntos',page:14},
 {id:'battery-guide',title:'Batería de tracción',section:'D · Seguridad, carga y sustitución',page:36},
 {id:'controls-guide',title:'Mandos y mensajes',section:'E 2–9 · Display e interbloqueos',page:47},
 {id:'fault-guide',title:'Localización de fallas',section:'E 30 · Marcha y elevación',page:75},
 {id:'maintenance-guide',title:'Inspección y mantenimiento',section:'F 1–5 · Seguridad y checklist',page:76},
 {id:'hydraulic-guide',title:'Preparación y nivel hidráulico',section:'F 8–9 · Preparación del equipo',page:83},
].map(s=>({...s,url:`${manualUrl}#page=${s.page}`}));
export const pareto = {validated:false,target:70,description:'10 conjuntos priorizados para la demo. Cobertura de fallas pendiente de validar con órdenes de trabajo de Kernium; el manual no contiene frecuencias de averías.'};
