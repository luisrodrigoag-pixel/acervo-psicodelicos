<img src="recursos/logotipo.jpg" alt="Expedientes psicodélicos" width="260">

# Expedientes psicodélicos

Acervo documental de consulta sobre psicodélicos: quiénes abrieron el campo, qué pasó con él, qué dice la evidencia hoy, y qué dice la ley en México.

No es un manual de uso. No es consejo médico ni legal. Lo que intenta ser es una fuente honesta: cada afirmación fuerte lleva su referencia, y donde no hay evidencia se dice que no hay.

Lee primero el [aviso](AVISO.md). Explica el alcance, los criterios editoriales y qué queda deliberadamente fuera.

## Cómo está organizado

**[00-referencia](00-referencia/)** — La línea de tiempo de 1897 a 2026 y un glosario de los términos que se repiten en todo el acervo. Si algo no se entiende en otra carpeta, probablemente esté explicado aquí.

**[01-precursores](01-precursores/)** — Las personas. Veintiocho fichas breves de quienes hicieron el campo, y cinco capítulos largos para los que no caben en una ficha: Hofmann, Wasson y María Sabina, Leary, Fadiman y Pollan.

**[02-historia](02-historia/)** — Las cuatro etapas del campo: la primera ola de investigación clínica, el episodio de los servicios de inteligencia, el cierre de los setenta y el renacimiento que llega hasta hoy.

**[03-ciencia](03-ciencia/)** — Farmacología y mecanismo, el estado de los ensayos clínicos, el perfil de seguridad y las críticas metodológicas que el campo todavía no resuelve.

**[04-microdosis](04-microdosis/)** — La sección más larga, porque es donde la distancia entre lo que se cree y lo que se sabe es mayor. Protocolos, la evidencia completa, el diseño de auto-ciego, interacciones, qué medir, mecanismo y el problema del producto.

**[05-marco-legal](05-marco-legal/)** — México con su texto legal citado, el régimen internacional de los tratados y el mapa de Estados Unidos.

**[07-biblioteca](07-biblioteca/)** — Libros, documentales y podcasts, cada uno con el registro al que pertenece: evidencia, divulgación o testimonio.

**[99-bibliografia](99-bibliografia/)** — Todas las fuentes en un solo lugar, con enlace y, donde existe, DOI.

## Cómo leerlo

Si es la primera vez, el orden natural es la [línea de tiempo](00-referencia/linea-de-tiempo.md), luego el capítulo de [Hofmann](01-precursores/capitulos/albert-hofmann.md) y de ahí los demás capítulos largos. Si lo que te trajo aquí es la microdosis, empieza por [la evidencia](04-microdosis/evidencia.md) y no por los protocolos: el orden importa.

## La app

El acervo tambien se lee como aplicacion instalable: una sola pagina con buscador sobre las 47,626 palabras, indice navegable, la linea de tiempo como riel filtrable, modo lectura y lectura sin internet. Se construye desde estos mismos markdown con `python3 herramientas/construir.py` y se despliega sola en cada push a `main`.

Las instrucciones de construccion, de puesta en marcha y de instalacion en el iPad estan en [herramientas/LEEME.md](herramientas/LEEME.md).

## Estado

Las secciones de precursores, historia, ciencia, microdosis y marco legal están completas al 22 de octubre de 2026. Lo que cambia rápido —ensayos en curso, el expediente de la Corte, los programas estatales en Estados Unidos— lleva fecha de corte en el propio archivo.
