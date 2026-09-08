# LAYER — Service Studio

Aplicación local de diagnóstico técnico con un despiece interactivo de una Original Prusa i3 MK3S+. Interfaz en español, Three.js 0.180.0 y servidor HTTP de Node.js. No necesita compilación ni dependencias de producción.

## Iniciar

Requiere Node.js 22.9 o posterior.

```sh
node --env-file-if-exists=.env server/index.js
```

Abrir http://localhost:3000. También funciona `npm start`. Three.js y su licencia están incluidos en `public/vendor`; el visor no depende de un CDN. Las fuentes tipográficas usan Google Fonts con alternativas del sistema.

## Conectar el LLM local

La plataforma usa **Ollama con llama3.1:8b** por defecto. Abrí Ollama y ejecutá `npm start`. No requiere claves ni envía consultas a un proveedor externo. Para personalizar la conexión, copiá `.env.example` a `.env`:

```ini
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
PORT=3000
```

Ambos modelos ya estaban instalados: Llama 3 de 8B Q4_0 (4,66 GB) y Llama 3.1 de 8B Q4_K_M (4,92 GB). Elegimos 3.1 por las mejoras multilingües y de razonamiento documentadas por [Ollama](https://ollama.com/library/llama3.1). Para probar el anterior, cambiá `OLLAMA_MODEL=llama3:latest` y reiniciá. No se descargan modelos automáticamente.

- El servidor envía el mensaje, hasta diez mensajes anteriores (1200 caracteres por mensaje en Ollama), el catálogo y cuatro resúmenes documentales a `/api/chat` de Ollama. Solicita JSON con esquema, valida IDs y exige fuentes para los procedimientos.
- La interfaz muestra el modelo y comprueba su instalación mediante `/api/tags`. Esto verifica disponibilidad, no calidad de respuestas. El botón de conexión vuelve a comprobar el estado.
- La primera consulta puede tardar por la carga del modelo. El servidor espera hasta 180 segundos y el navegador 190. Se usan 8K de contexto, temperatura 0 y hasta 700 tokens de salida.
- Si el modelo devuelve un JSON inválido o pasos sin fuentes, se solicita una única corrección al mismo LLM, dentro del límite total de 180 segundos. Si sigue fallando, se muestra el error. El servidor no inventa citas ni sustituye la respuesta por demo. Los errores de conexión y respuestas incompletas se muestran directamente.
- Para respuestas predefinidas, configurá explícitamente `LLM_PROVIDER=demo`. Este modo no es un LLM.
- OpenAI sigue disponible con `LLM_PROVIDER=openai`, `OPENAI_API_KEY` y `OPENAI_MODEL`. Solo ese modo envía consultas a OpenAI; la clave permanece en el servidor.

## Interacción

- Rotación, zoom, vista frontal/superior, restablecer cámara, etiquetas y rayos X.
- Deslizador de despiece y animación entre ensamblado y separado.
- 18 conjuntos seleccionables; aislamiento real mediante visibilidad de objetos, sin piezas fantasma ni raycasting sobre objetos ocultos.
- El carro del extrusor ofrece **Explorar 7 capas del extrusor**: carro, motor, engranajes, ventilador, disipador/boquilla, calentador y termistor. Tapas, tornillos y otros elementos tienen separación adicional.
- Cama, placa, fusibles, fuente, pantalla y bobina también separan elementos internos.
- La cámara encuadra las piezas visibles y las etiquetas se distribuyen para evitar superposición.
- Conversación, enlaces a guías oficiales, nueva sesión y exportación a Markdown. El historial vive en memoria y se borra al recargar.

## Fuentes y alcance

`public/catalog.js` contiene los IDs estables, las funciones de los componentes y resúmenes editoriales acotados de estas guías de Prusa, consultadas el 2026-09-06:

1. [Blown Fuse — MK3/MK3S/MK3S+](https://help.prusa3d.com/article/blown-fuse-mk3-mk3s-mk3s_1925).
2. [Layer shifting](https://help.prusa3d.com/article/layer-shifting_2020).
3. [Preheat error](https://help.prusa3d.com/article/preheat-error_2163).
4. [Printer does not turn on or keeps turning off](https://help.prusa3d.com/article/printer-does-not-turn-on-or-keeps-turning-off_2102).

La aplicación usa estos resúmenes en el contexto del modelo; no ingiere manuales completos ni tiene un índice vectorial. Los casos fuera de alcance requieren más documentación. El modelo geométrico es original y esquemático, sin dimensiones, tolerancias ni cableado exactos: no es un CAD de servicio ni un gemelo digital certificado. Los consejos son puntos de revisión, no causas confirmadas. La referencia visual fue la imagen proporcionada; X bloqueó el acceso al tweet.

## Verificación

```sh
node --test tests/*.test.js
```

Verificación real del 2026-09-06: Llama 3.1:8b respondió al diagnóstico de Bed preheat error a través de /api/chat en 97,8 segundos, seleccionando bed, board y fuses y citando heat-guide. Ollama estaba ejecutándose en CPU (sin VRAM). Es una prueba de integración, no un benchmark exhaustivo entre modelos.

`npm run test:local` comprueba el servidor activo y hace una consulta real a Ollama (puede tardar hasta tres minutos). `npm run test:local:browser` verifica la consulta «El motor del eje X no se mueve» con Ollama real desde el navegador, las citas y la selección en el visor. Requiere Playwright como las pruebas de navegador.

Las pruebas de navegador generales usan respuestas de demo simuladas para verificar el visor de forma reproducible.

Para pruebas de navegador, instalar las dependencias de desarrollo con `npm install`, iniciar la aplicación y ejecutar `npm run test:browser`. Por defecto usa Edge instalado. `BROWSER_CHANNEL=chrome` permite usar Chrome. `PLAYWRIGHT_MODULE_PATH` permite reutilizar una instalación de Playwright existente.

Las pruebas verifican circuitos diferentes para cama/hotend, contexto de eje, referencias del LLM, manejo de errores del proveedor, aislamiento exacto, rayos X, retorno al ensamblado, separación interna, ausencia de superposición de etiquetas del extrusor, fuentes, exportación y ancho móvil. Las capturas se guardan en `artifacts/`.

## Estructura

| Archivo | Función |
| --- | --- |
| `public/model.js` | Geometría, capas, interacción, cámara y etiquetas |
| `public/app.js` | Interfaz, conversación y sincronización del visor |
| `public/catalog.js` | Componentes y contexto documental |
| `server/diagnosis.js` | Demo y adaptadores Ollama/OpenAI |
| `server/index.js` | Archivos estáticos y API local |

El servidor escucha únicamente en `127.0.0.1`. Está pensado para uso local. Un despliegue compartido necesita autenticación, límites de consumo y gestión de usuarios.
