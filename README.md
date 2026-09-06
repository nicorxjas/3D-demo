# LAYER — Service Studio

Aplicación local de diagnóstico técnico con un despiece interactivo de una Original Prusa i3 MK3S+. Interfaz en español, Three.js 0.180.0 y servidor HTTP de Node.js. No necesita compilación ni dependencias de producción.

## Iniciar

Requiere Node.js 22.9 o posterior.

```sh
node --env-file-if-exists=.env server/index.js
```

Abrir http://localhost:3000. También funciona `npm start`. Three.js y su licencia están incluidos en `public/vendor`; el visor no depende de un CDN. Las fuentes tipográficas usan Google Fonts con alternativas del sistema.

## Conectar el LLM

Copiar `.env.example` a `.env`, completar `OPENAI_API_KEY` y reiniciar el servidor. `OPENAI_MODEL` permite elegir un modelo compatible con Responses API y Structured Outputs; el valor de ejemplo es `gpt-4.1-mini`.

- La clave permanece en el servidor; `.env` no se sirve como archivo público.
- El chat envía a OpenAI el mensaje, los últimos diez mensajes del historial, el catálogo de componentes y cuatro resúmenes documentales. Se solicita `store: false`.
- El modelo devuelve texto, pasos, IDs de componentes y IDs de fuentes bajo un esquema JSON. El servidor valida las referencias y la interfaz toma las URLs únicamente del catálogo conocido.
- Sin clave, se activa **Demo documentada**: selección determinista de respuestas predefinidas por palabras del síntoma. Este modo no es un LLM. Los errores del proveedor se muestran y no se sustituyen silenciosamente por respuestas de demo.
- La integración con el proveedor se verificó con respuestas simuladas. Una llamada real requiere una clave y cuota disponibles.

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
node --test tests/diagnosis.test.js
```

Para pruebas de navegador, instalar las dependencias de desarrollo con `npm install`, iniciar la aplicación y ejecutar `npm run test:browser`. Por defecto usa Edge instalado. `BROWSER_CHANNEL=chrome` permite usar Chrome. `PLAYWRIGHT_MODULE_PATH` permite reutilizar una instalación de Playwright existente.

Las pruebas verifican circuitos diferentes para cama/hotend, contexto de eje, referencias del LLM, manejo de errores del proveedor, aislamiento exacto, rayos X, retorno al ensamblado, separación interna, ausencia de superposición de etiquetas del extrusor, fuentes, exportación y ancho móvil. Las capturas se guardan en `artifacts/`.

## Estructura

| Archivo | Función |
| --- | --- |
| `public/model.js` | Geometría, capas, interacción, cámara y etiquetas |
| `public/app.js` | Interfaz, conversación y sincronización del visor |
| `public/catalog.js` | Componentes y contexto documental |
| `server/diagnosis.js` | Demo y adaptador OpenAI |
| `server/index.js` | Archivos estáticos y API local |

El servidor escucha únicamente en `127.0.0.1`. Está pensado para uso local. Un despliegue compartido necesita autenticación, límites de consumo y gestión de usuarios.
