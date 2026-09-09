# Equipo y documentación de Kernium

La demo usa **Jungheinrich EFG 216**, carretilla eléctrica de la serie cubierta desde 06.08. Capacidad nominal del modelo: 1.600 kg a centro de carga de 500 mm (B 1, PDF 14); la placa real y el diagrama de cargas determinan la capacidad aplicable. No se mezcla esta generación con una variante actual de litio.

Fuente primaria: manual original de Jungheinrich **51099986, edición 07.11**, en inglés. La copia completa de 109 páginas fue descargada el 2026-09-08 desde [Fallsway](https://www.fallsway.com/hubfs/Fallsway_January2022/Pdf/efg-213-220-316k-320.pdf). El copyright pertenece a Jungheinrich. La edición debe contrastarse con el número de serie del equipo del cliente.

`manual.pdf` es la copia de referencia. `index.json` contiene páginas, fragmentos y procedencia. SHA-256 del PDF: `6e9ba799c01b23a1e70c0cd381b7fb74fa914a4f89a9b12945d55193595429e2`.

## Alcance de los diez conjuntos

Selección editorial para la demo, basada en funciones y controles documentados, **sin ranking estadístico**. Los números son identificadores visuales, no frecuencia ni prioridad de reemplazo. No hay datos que demuestren que cubren el 70% de las fallas.

| ID | Subsistema de nivel 1 | Conjunto visual | Revisión que motiva incluirlo | Referencia PDF |
| --- | --- | --- | --- | --- |
| 01 | Elevación y mástil | Mástil y cadenas | Desgaste, guiado y transmisión de elevación | 77, 80 |
| 02 | Elevación y mástil | Cilindros de elevación | Daños y fugas en cilindros y vástagos | 80 |
| 03 | Potencia y tracción | Banco de baterías | Carga, conexiones y habilitación del equipo | 36–45, 75 |
| 04 | Potencia y tracción | Accionamientos de tracción | Ruido, fugas de transmisión y fijación de motores | 16, 79 |
| 05 | Circuito hidráulico central | Grupo motor-bomba | Función de la unidad hidráulica; revisión del sistema | 16, 80 |
| 06 | Circuito hidráulico central | Bloque distribuidor | Localización funcional del circuito hidráulico | 80 |
| 07 | Circuito hidráulico central | Depósito y filtración | Nivel de aceite, filtración y mantenimiento | 80, 84–85 |
| 08 | Electrónica y mandos | Mandos e interbloqueos | Display, mandos, habilitación y códigos informativos | 47–54, 79 |
| 09 | Electrónica y mandos | Controlador electrónico | Diagnóstico de control y sobretemperatura | 16, 52, 75, 79 |
| 10 | Chasis y tren de rodaje | Conjuntos de ruedas | Desgaste, daños y fijación | 77, 79, 83 |

Se modelan unidades completas, sin separar tornillos, bobinas o elementos internos de una válvula. Algunos conjuntos agrupan varias LRU: mástil/cadenas, mandos/interbloqueos, depósito/filtro y ruedas. La agrupación sirve para localizar síntomas; **no implica reemplazar todo el grupo**. El catálogo OEM y los procedimientos de taller deben definir la unidad de recambio exacta. La ubicación del distribuidor, bomba y controlador es ilustrativa, no está deducida de un plano de servicio. El chasis y techo permanecen como contexto estructural y desaparecen al aislar conjuntos. Frenos, cargador y otros conjuntos no están desglosados en esta primera selección.

## Validación del Pareto

Para comprobar el objetivo de cobertura del 70%, hacen falta órdenes de trabajo cerradas con identificador de incidente, equipo/serie, fecha, síntoma, causa principal confirmada, conjunto intervenido y horas de indisponibilidad. Definir flota y período; excluir mantenimiento preventivo de la frecuencia de averías; deduplicar reaperturas y visitas del mismo incidente. Registrar una causa principal por incidente, o declarar otra metodología antes de contar.

Ordenar los conjuntos por número de incidentes y calcular acumulado / total de incidentes de esa flota y período. Comparar por separado frecuencia y horas de parada. Hasta disponer de esos datos, la selección es una hipótesis de alcance, no un Pareto medido.

## Recuperación para el asistente

La ingesta genera 105 fragmentos de hasta 3.000 caracteres, sin cruzar páginas, con 300 caracteres de solapamiento para páginas largas. Algunas páginas vacías o solo con una ilustración no producen fragmentos. El índice conserva las 109 páginas. La consulta busca en los capítulos técnicos del cuerpo del manual (PDF 14–93); el apéndice de baterías está preservado, pero no entra en la recuperación inicial.

La búsqueda léxica pondera términos, amplía vocabulario español a inglés y agrega afinidad por síntoma. Recupera hasta dos páginas relevantes más el fragmento de preparación segura F 8. Es RAG léxico local, sin embeddings ni base vectorial. Kernium usa 4K de contexto (8K si la consulta o el contexto es largo), hasta 450 tokens de salida y cuatro mensajes de historial de hasta 500 caracteres en Ollama para acotar la latencia en CPU. El LLM recibe únicamente ese contexto, el catálogo de Kernium y el historial acotado. Se valida que los IDs de los conjuntos pertenezcan al EFG y que las citas provengan de los fragmentos recuperados. Esto verifica referencias, no garantiza que toda afirmación generada quede demostrada por ellas.

Reconstruir el índice con Python y `pypdf`:

```sh
python scripts/index-kernium.py
```

`--download` vuelve a descargar la fuente pública antes de indexar. Revisar edición, hash, páginas y pruebas si cambia el documento.

El manual es de uso y mantenimiento. La checklist no aporta por sí sola instrucciones de sustitución o parametrización del controlador, bloque distribuidor o grupo motor-bomba. El asistente debe pedir documentación de taller cuando esos procedimientos no estén respaldados.
