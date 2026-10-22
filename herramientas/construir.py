#!/usr/bin/env python3
"""Construye la app del Expediente a partir de los markdown del acervo.

   python3 herramientas/construir.py

Produce dist/ con el sitio completo (index.html, manifest, service worker, iconos)
y ademas dist/artefacto.html, que es la misma pagina sin el esqueleto del documento,
que es lo que espera el publicador de artefactos de Claude.
"""
import os, re, json, hashlib, shutil, unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
DIST = os.path.join(RAIZ, "dist")

SECCIONES = [
    ("00-referencia",          "00", "Referencia",         "La linea de tiempo y el glosario."),
    ("01-precursores",         "01", "Precursores",        "Veintiocho fichas y cinco capitulos largos."),
    ("02-historia",            "02", "Historia",           "Cuatro etapas, de 1947 a hoy."),
    ("03-ciencia",             "03", "Ciencia",            "Farmacologia, ensayos, seguridad y critica."),
    ("04-microdosis",          "04", "Microdosis",         "Donde la distancia entre lo que se cree y lo que se sabe es mayor."),
    ("05-marco-legal",         "05", "Marco legal",        "Mexico, el regimen internacional y Estados Unidos."),
    ("99-bibliografia",        "99", "Bibliografia",       "Todas las fuentes en un solo lugar."),
]
RAIZ_DOCS = ["README.md", "AVISO.md"]


def slug(p):
    s = p.replace(".md", "").replace("/", "-").replace("_", "-")
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z0-9.~-]", "-", s).strip("-").lower() or "doc"


def titulo(md, path):
    m = re.search(r"^#\s+(.+)$", md, re.M)
    return m.group(1).strip() if m else os.path.basename(path).replace(".md", "")


def bajada(md):
    cuerpo = re.sub(r"^#\s+.+$", "", md, count=1, flags=re.M)
    for bloque in [b.strip() for b in cuerpo.split("\n\n")]:
        if not bloque or bloque.startswith(("#", "-", "---")):
            continue
        t = re.sub(r"\*\*(.+?)\*\*", r"\1", bloque)
        t = re.sub(r"\*(.+?)\*", r"\1", t)
        t = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", t)
        t = " ".join(t.split())
        return t[:240] + ("..." if len(t) > 240 else "")
    return ""


def recoger():
    rutas = [d for d in RAIZ_DOCS if os.path.exists(os.path.join(RAIZ, d))]
    for carpeta, _, _, _ in SECCIONES:
        base = os.path.join(RAIZ, carpeta)
        if not os.path.isdir(base):
            continue
        enc = []
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames.sort()
            for fn in sorted(filenames):
                if fn.endswith(".md"):
                    enc.append(os.path.relpath(os.path.join(dirpath, fn), RAIZ))
        enc.sort(key=lambda p: (0 if os.path.basename(p) == "README.md" else 1, p))
        rutas += enc
    return rutas


def construir_datos():
    rutas = recoger()
    mapa = {r: slug(r) for r in rutas}
    carpetas = [s[0] for s in SECCIONES]

    def resolver(origen, destino):
        d = destino.split("#")[0]
        if not d:
            return None
        cand = os.path.normpath(os.path.join(os.path.dirname(origen), d))
        if cand in mapa:
            return "doc:" + mapa[cand]
        nombre = cand.rstrip("/")
        if d.endswith("/") or nombre in carpetas:
            for carpeta, num, _, _ in SECCIONES:
                if nombre == carpeta:
                    return "sec:" + num
        return None

    docs = []
    for r in rutas:
        md = open(os.path.join(RAIZ, r), encoding="utf-8").read()

        def rep(m):
            txt, dest = m.group(1), m.group(2)
            if dest.startswith(("http", "mailto")):
                return m.group(0)
            nuevo = resolver(r, dest)
            return "[%s](%s)" % (txt, nuevo) if nuevo else txt

        md = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", rep, md)
        mc = re.search(r"[Ff]echa de (?:este archivo|corte)\s*:?\s*([^.\n]+)", md)
        docs.append({
            "id": mapa[r], "ruta": r, "sec": r.split("/")[0] if "/" in r else "",
            "t": titulo(md, r), "md": md, "pal": len(md.split()),
            "corte": mc.group(1).strip().rstrip(".") if mc else "",
            "bajada": bajada(md),
        })

    tl = [d for d in docs if d["ruta"].endswith("linea-de-tiempo.md")]
    eras, era = [], None
    if tl:
        for bloque in tl[0]["md"].split("\n\n"):
            b = bloque.strip()
            if b.startswith("## "):
                era = {"era": b[3:].strip(), "e": []}
                eras.append(era)
            elif era is not None and b.startswith("**"):
                m = re.match(r"\*\*(.+?)\*\*\s*(.*)$", b, re.S)
                if m:
                    era["e"].append({"f": m.group(1).strip().rstrip("."),
                                     "x": " ".join(m.group(2).split())})

    return {
        "docs": docs,
        "secs": [{"n": n, "carpeta": c, "t": t, "d": d} for c, n, t, d in SECCIONES],
        "eras": eras,
        "total": sum(d["pal"] for d in docs),
        "n": len(docs),
    }


def main():
    datos = construir_datos()
    json_datos = json.dumps(datos, ensure_ascii=False, separators=(",", ":"))
    css = open(os.path.join(AQUI, "estilo.css"), encoding="utf-8").read()
    js = open(os.path.join(AQUI, "app.js"), encoding="utf-8").read()
    cuerpo = open(os.path.join(AQUI, "cuerpo.html"), encoding="utf-8").read()
    plantilla = open(os.path.join(AQUI, "plantilla.html"), encoding="utf-8").read()

    version = hashlib.sha256((json_datos + css + js).encode("utf-8")).hexdigest()[:12]

    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    os.makedirs(os.path.join(DIST, "iconos"), exist_ok=True)

    pagina = (plantilla
              .replace("__CSS__", css)
              .replace("__CUERPO__", cuerpo)
              .replace("__JSON_DATOS__", json_datos)
              .replace("__JS__", js))
    open(os.path.join(DIST, "index.html"), "w", encoding="utf-8").write(pagina)

    # la version para el publicador de artefactos: sin esqueleto, sin service worker
    sin_sw = js.split("/* ---------- actualizacion automatica")[0]
    artefacto = ('<title>Expediente psicodélicos</title>\n'
                 '<meta name="claude:viewport-fit-sides" content="cover">\n'
                 '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
                 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,600;1,400'
                 '&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">\n'
                 "<style>\n" + css + "\n</style>\n\n" + cuerpo +
                 "\n<script>window.__DATOS__ = " + json_datos + ";</script>\n<script>\n" + sin_sw + "\n</script>\n")
    open(os.path.join(DIST, "artefacto.html"), "w", encoding="utf-8").write(artefacto)

    sw = open(os.path.join(AQUI, "sw.js"), encoding="utf-8").read().replace("__VERSION__", version)
    open(os.path.join(DIST, "sw.js"), "w", encoding="utf-8").write(sw)
    shutil.copy(os.path.join(AQUI, "manifest.webmanifest"), os.path.join(DIST, "manifest.webmanifest"))
    for ic in sorted(os.listdir(os.path.join(AQUI, "iconos"))):
        shutil.copy(os.path.join(AQUI, "iconos", ic), os.path.join(DIST, "iconos", ic))
    kb = os.path.getsize(os.path.join(DIST, "index.html")) / 1024
    print("documentos: %d" % datos["n"])
    print("palabras:   %d" % datos["total"])
    print("version:    %s" % version)
    print("index.html: %.1f KB" % kb)
    print("salida:     %s" % DIST)


if __name__ == "__main__":
    main()
