# La app

Convierte los markdown del acervo en una aplicación web instalable: una sola página con buscador, índice navegable, línea de tiempo y lectura sin internet. Se despliega sola en GitHub Pages con cada push a `main`.

## Construirla en local

    python3 herramientas/construir.py

Lee los markdown del repositorio y escribe `dist/`, que no se versiona. Dentro quedan:

- `index.html` — la app completa, con el acervo incrustado
- `sw.js` — el service worker, con una versión derivada del contenido, de modo que cada cambio invalida la caché anterior
- `manifest.webmanifest`, `iconos/` — lo que necesita el iPad para instalarla
- `artefacto.html` — la misma página sin el esqueleto del documento, que es lo que espera el publicador de artefactos de Claude

Para verla en local hace falta un servidor, porque el service worker no funciona con `file://`:

    cd dist && python3 -m http.server 8000

## Qué archivo tocar

- **Contenido**: cualquier `.md` del acervo. No hay que tocar nada más.
- **Diseño**: `herramientas/estilo.css`
- **Comportamiento** (buscador, rutas, línea de tiempo): `herramientas/app.js`
- **Cabecera del documento**: `herramientas/plantilla.html` y `herramientas/cuerpo.html`
- **Icono**: reemplazar los tres PNG de `herramientas/iconos/` conservando los nombres y los tamaños (192, 512 y 180 píxeles, cuadrados, sin esquinas redondeadas, porque iOS aplica su propia máscara). No hace falta cambiar nada más.

## Despliegue

La acción `.github/workflows/publicar.yml` construye el sitio y lo publica en GitHub Pages en cada push a `main`. No necesita secretos ni servicios de terceros.

Si Pages no estuviera activado, se activa en Settings, Pages, eligiendo **GitHub Actions** como origen.

## Instalarla en el iPad

Abrir la dirección del sitio en Safari y después Compartir, Añadir a pantalla de inicio. Queda con icono propio y se abre a pantalla completa.

A partir de ahí, cada push reconstruye y despliega. El service worker detecta la versión nueva al abrir la app con internet y recarga una vez. Sin internet, se lee la última versión guardada.

## Lo que no hace

No sincroniza nada entre dispositivos: las preferencias de tema, el modo lectura y el último documento abierto viven en el navegador de cada aparato. Tampoco edita el acervo; la app es de lectura.
