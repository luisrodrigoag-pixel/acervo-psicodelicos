(function(){
  "use strict";
  var D = window.__DATOS__;
  var porId = {}, porSec = {};
  D.docs.forEach(function(d){
    porId[d.id] = d;
    (porSec[d.sec] = porSec[d.sec] || []).push(d);
  });
  var secPorNum = {}; D.secs.forEach(function(s){ secPorNum[s.n] = s; });
  var $ = function(s){ return document.querySelector(s); };
  var NOMBRES = { capitulos: "Capítulos", fichas: "Fichas" };

  /* ---------- tono por seccion ---------- */
  var TONOS = { "00":"--t00", "01":"--t01", "02":"--t02", "03":"--t03",
                "04":"--t04", "05":"--t05", "06":"--ocre", "99":"--t99" };
  function tono(num){ return "var(" + (TONOS[num] || "--acento") + ")"; }
  function numDeCarpeta(carpeta){
    for(var i=0;i<D.secs.length;i++) if(D.secs[i].carpeta === carpeta) return D.secs[i].n;
    return null;
  }
  function leeColor(nombre){
    return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim() || "#1C5A4C";
  }

  /* ---------- tela: patron psicodelico dibujado, distinto por seccion ---------- */
  function azar(semilla){
    var s = semilla >>> 0;
    return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function tela(cv){
    if(!cv || !cv.getContext) return;
    var ancho = cv.clientWidth || 600, alto = cv.clientHeight || 160;
    if(!ancho || !alto) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(ancho * dpr); cv.height = Math.round(alto * dpr);
    var g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var r = azar(parseInt(cv.getAttribute("data-semilla"), 10) || 7);
    var claves = (cv.getAttribute("data-tonos") || "--t01,--t02,--t00").split(",");
    var colores = claves.map(leeColor);
    g.fillStyle = leeColor("--sobre-acento") === "#FFFFFF" ? "#140A22" : "#0B0F12";
    g.fillStyle = "#130a20";
    g.fillRect(0, 0, ancho, alto);
    var n = Math.max(14, Math.round(alto / 7));
    for(var i = 0; i < n; i++){
      var t = i / (n - 1);
      var amp = alto * (0.10 + r() * 0.30);
      var fase = r() * 6.283, frec = 0.006 + r() * 0.016;
      g.beginPath();
      for(var x = 0; x <= ancho; x += 3){
        var y = alto * t
              + Math.sin(x * frec + fase) * amp * Math.sin(x * 0.0023 + fase * 0.5)
              + Math.sin(x * frec * 2.3 + fase) * amp * 0.22;
        if(x === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokeStyle = colores[i % colores.length];
      g.globalAlpha = 0.5 + r() * 0.45;
      g.lineWidth = 1.2 + r() * 3.2;
      g.lineCap = "round";
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  function pintarTelas(){
    Array.prototype.forEach.call(document.querySelectorAll("canvas.tela,canvas.cinta"), tela);
  }

  /* ---------- almacenamiento tolerante ---------- */
  function leer(k, def){ try{ var v = localStorage.getItem(k); return v === null ? def : v; }catch(e){ return def; } }
  function guardar(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }

  /* ---------- markdown ---------- */
  function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function inl(s){
    s = esc(s)
      .replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g,"<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(m,t,u){
        if(/^https?:/.test(u)) return '<a href="'+u+'" target="_blank" rel="noopener">'+t+"</a>";
        return '<a href="'+u+'">'+t+"</a>";
      });
    return s;
  }
  function md(src){
    var out = "", bloques = src.replace(/\r/g,"").split(/\n{2,}/);
    for(var i=0;i<bloques.length;i++){
      var b = bloques[i].trim();
      if(!b) continue;
      if(/^---+$/.test(b)){ out += "<hr>"; continue; }
      if(b.indexOf("### ") === 0){ out += "<h3>"+inl(b.slice(4))+"</h3>"; continue; }
      if(b.indexOf("## ") === 0){ out += "<h2>"+inl(b.slice(3))+"</h2>"; continue; }
      if(b.indexOf("# ") === 0){ out += "<h1>"+inl(b.slice(2))+"</h1>"; continue; }
      var lineas = b.split("\n");
      if(/^-\s/.test(lineas[0])){
        out += "<ul>" + lineas.map(function(l){ return "<li>"+inl(l.replace(/^-\s+/,""))+"</li>"; }).join("") + "</ul>";
        continue;
      }
      if(/^\d+\.\s/.test(lineas[0])){
        out += "<ol>" + lineas.map(function(l){ return "<li>"+inl(l.replace(/^\d+\.\s+/,""))+"</li>"; }).join("") + "</ol>";
        continue;
      }
      out += "<p>"+inl(lineas.join(" "))+"</p>";
    }
    return out;
  }

  /* ---------- texto plano para buscar ---------- */
  function plano(m){
    return m.replace(/^#\s+.+$/m,"").replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/[*#>`]/g," ").replace(/\s+/g," ").trim();
  }
  function pliega(s){
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  }
  D.docs.forEach(function(d){ d.pl = plano(d.md); d.fp = pliega(d.pl); d.ft = pliega(d.t); });

  function escRe(t){ return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); }
  function ocurrencias(txt, t){
    var re = new RegExp("(?:^|[^a-z0-9])" + escRe(t), "g"), n = 0, primera = -1, m;
    while((m = re.exec(txt)) !== null){
      if(primera < 0) primera = m.index;
      n++;
      if(re.lastIndex === m.index) re.lastIndex++;
    }
    return { n: n, i: primera };
  }
  function buscar(q){
    var terminos = pliega(q).split(/\s+/).filter(function(t){ return t.length > 1; });
    if(!terminos.length) return [];
    var res = [];
    D.docs.forEach(function(d){
      var puntos = 0, primera = -1, completo = true;
      for(var i=0;i<terminos.length;i++){
        var t = terminos[i];
        var c = ocurrencias(d.fp, t), ct = ocurrencias(d.ft, t);
        if(!c.n && !ct.n){ completo = false; break; }
        if(c.i >= 0 && (primera < 0 || c.i < primera)) primera = c.i;
        puntos += c.n + (ct.n ? 24 : 0);
      }
      if(completo) res.push({ d: d, p: puntos, i: primera < 0 ? 0 : primera });
    });
    res.sort(function(a,b){ return b.p - a.p; });
    return res.slice(0, 40).map(function(r){
      var ini = Math.max(0, r.i - 95);
      var frag = r.d.pl.slice(ini, ini + 260);
      if(ini > 0) frag = "..." + frag;
      if(ini + 260 < r.d.pl.length) frag += "...";
      var h = esc(frag);
      terminos.forEach(function(t){
        h = h.replace(new RegExp("(" + escRe(t) + ")","gi"), "<mark>$1</mark>");
      });
      return { d: r.d, frag: h, p: r.p };
    });
  }

  /* ---------- riel ---------- */
  function pintarRiel(activo){
    var h = '<h3>Expediente</h3><div class="grupo suelto">';
    h += '<a href="#inicio">Portada</a>';
    D.docs.filter(function(d){ return !d.sec; }).forEach(function(d){
      var et = d.id === "readme" ? "Índice general" : d.t;
      h += '<a href="#'+d.id+'"'+(d.id===activo?' aria-current="page"':'')+'>'+esc(et)+"</a>";
    });
    h += '<a href="#linea">Línea de tiempo</a></div>';
    D.secs.forEach(function(s){
      var lista = porSec[s.carpeta] || [];
      if(!lista.length) return;
      h += '<div class="grupo" style="--tono:'+tono(s.n)+'"><div class="cab"><span class="cn">'+s.n+'</span><a href="#s'+s.n+'">'+esc(s.t)+"</a></div><ul>";
      var subActual = null;
      lista.forEach(function(d){
        var partes = d.ruta.split("/");
        var sub = partes.length > 2 ? partes[1] : "";
        if(sub !== subActual){
          subActual = sub;
          if(sub) h += '<li class="sub">'+esc(NOMBRES[sub] || sub)+"</li>";
        }
        var etiqueta = partes[partes.length-1] === "README.md" ? "Índice de la sección" : d.t;
        h += '<li><a href="#'+d.id+'"'+(d.id===activo?' aria-current="page"':'')+">"+esc(etiqueta)+"</a></li>";
      });
      h += "</ul></div>";
    });
    $("#riel").innerHTML = h;
  }

  /* ---------- vistas ---------- */
  function vistaPortada(){
    var h = '<div class="portada">'
      + '<div class="hero"><canvas class="tela" data-semilla="1897" data-tonos="--t01,--t04,--t02,--t00,--t99"></canvas>'
      + '<div class="rotulo"><h1>Expedientes psicodélicos</h1></div></div>'
      + '<span class="sello">Acervo documental</span>'
      + '<p class="entrada">Quiénes abrieron el campo, qué pasó con él, qué dice la evidencia hoy y qué dice la ley en México. Donde no hay evidencia, lo dice.</p>'
      + '<div class="cifras">'
      + '<div><span class="n">'+D.n+'</span><span class="e">documentos</span></div>'
      + '<div><span class="n">'+D.total.toLocaleString("es-MX")+'</span><span class="e">palabras</span></div>'
      + '<div><span class="n">'+D.secs.length+'</span><span class="e">secciones</span></div>'
      + '<div><span class="n">22 oct 2026</span><span class="e">corte</span></div>'
      + "</div>";
    h += '<div class="rejilla">';
    D.secs.forEach(function(s){
      var lista = porSec[s.carpeta] || [];
      if(!lista.length) return;
      var pal = lista.reduce(function(a,d){ return a + d.pal; }, 0);
      h += '<a class="ficha'+(s.n==="06"?" privada":"")+'" href="#s'+s.n+'" style="--tono:'+tono(s.n)+'">'
        + '<canvas class="cinta" data-semilla="'+(parseInt(s.n,10)+13)+'" data-tonos="'+(TONOS[s.n]||"--acento")+',--t02,--t00"></canvas>'
        + '<span class="cn">'+s.n+"</span><b>"+esc(s.t)+"</b><span>"+esc(s.d)+"</span>"
        + '<span class="cuenta">'+lista.length+" doc · "+pal.toLocaleString("es-MX")+" palabras</span></a>";
    });
    h += "</div>";
    h += '<div class="orden"><h2>Por dónde entrar</h2><p>Si es la primera vez, la <a href="#linea">línea de tiempo</a> y luego el capítulo de <a href="doc:01-precursores-capitulos-albert-hofmann">Hofmann</a>. Si lo que te trajo es la microdosis, empieza por <a href="doc:04-microdosis-evidencia">la evidencia</a> y no por los protocolos: el orden importa. Si lo que te interesa es México, el <a href="doc:01-precursores-capitulos-wasson-y-maria-sabina">capítulo de Wasson y María Sabina</a> y luego el <a href="doc:05-marco-legal-mexico">marco legal</a>.</p></div>';
    h += '<div class="aviso"><b>Qué no es</b>No es consejo médico ni legal, y no es material de instrucción. En México las sustancias de las que trata están prohibidas. La sección 06 contiene información privada de salud: esta página es privada y el enlace no debería compartirse. El <a href="doc:aviso">aviso completo</a> explica el alcance y los criterios editoriales.</div>';
    h += "</div>";
    return h;
  }

  function vistaDoc(id){
    var d = porId[id];
    if(!d) return '<div class="vacio">Ese documento no existe en este acervo.</div>';
    var s = null;
    D.secs.forEach(function(x){ if(x.carpeta === d.sec) s = x; });
    var migas = '<div class="migas"><a href="#inicio">Portada</a><span>/</span>'
      + (s ? '<a href="#s'+s.n+'">'+s.n+" "+esc(s.t)+"</a><span>/</span>" : "")
      + "<span>"+esc(d.ruta)+"</span>"
      + (d.corte ? '<span>·</span><span>corte: '+esc(d.corte)+"</span>" : "")
      + '<span>·</span><span>'+d.pal.toLocaleString("es-MX")+" palabras</span></div>";
    var vecinos = "";
    if(s){
      var lista = porSec[s.carpeta], k = lista.indexOf(d);
      var ant = k > 0 ? lista[k-1] : null, sig = k < lista.length-1 ? lista[k+1] : null;
      vecinos = '<div class="pie-doc">'
        + (ant ? '<a href="#'+ant.id+'">← '+esc(ant.t)+"</a>" : "<span></span>")
        + (sig ? '<a href="#'+sig.id+'">'+esc(sig.t)+" →</a>" : "<span></span>")
        + "</div>";
    }
    var tn = s ? ' style="--tono:' + tono(s.n) + '"' : "";
    return '<div' + tn + ">" + migas + '<div class="doc">' + md(d.md) + "</div>" + vecinos + "</div>";
  }

  function vistaSec(num){
    var s = secPorNum[num];
    if(!s) return '<div class="vacio">Esa sección no existe.</div>';
    var lista = porSec[s.carpeta] || [];
    var h = '<div class="migas"><a href="#inicio">Portada</a><span>/</span><span>'+s.n+"</span></div>"
      + '<div class="portada" style="--tono:'+tono(s.n)+'">'
      + '<div class="hero"><canvas class="tela" data-semilla="'+(parseInt(s.n,10)*37+5)+'" data-tonos="'+(TONOS[s.n]||"--acento")+',--t02,--t00,--t04"></canvas>'
      + '<div class="rotulo"><h1>'+esc(s.t)+'</h1></div></div>'
      + '<span class="sello">Sección '+s.n+'</span>'
      + '<p class="entrada">'+esc(s.d)+"</p>"
      + (s.n === "06" ? '<div class="aviso"><b>Privado</b>Información de salud y de hábitos. No forma parte del acervo y no debería salir de aquí.</div>' : "")
      + '<div class="rejilla">';
    lista.forEach(function(d){
      var et = d.ruta.split("/").pop() === "README.md" ? "Índice de la sección" : d.t;
      h += '<a class="ficha'+(s.n==="06"?" privada":"")+'" href="#'+d.id+'">'
        + '<span class="cn">'+esc(d.ruta.split("/").slice(1).join("/"))+"</span><b>"+esc(et)+"</b>"
        + "<span>"+esc(d.bajada)+"</span>"
        + '<span class="cuenta">'+d.pal.toLocaleString("es-MX")+" palabras</span></a>";
    });
    return h + "</div></div>";
  }

  var eraActiva = "todas";
  function vistaLinea(){
    var h = '<div class="migas"><a href="#inicio">Portada</a><span>/</span><span>00-referencia/linea-de-tiempo.md</span></div>'
      + '<div class="linea" style="--tono:var(--t02)"><h1>Línea de tiempo</h1>'
      + '<p class="entrada">De 1897 a 2026. Las fechas que importan, con el dato mínimo para situarlas.</p>'
      + '<div class="filtros" id="filtros"><button type="button" data-era="todas">Todas</button>';
    D.eras.forEach(function(e){
      h += '<button type="button" data-era="'+esc(e.era)+'">'+esc(e.era)+"</button>";
    });
    h += "</div>";
    D.eras.forEach(function(e){
      if(eraActiva !== "todas" && eraActiva !== e.era) return;
      h += '<section class="era"><h2>'+esc(e.era)+'</h2><div class="hitos">';
      e.e.forEach(function(x){
        h += '<div class="hito"><span class="f">'+inl(x.f)+'</span><div class="x">'+inl(x.x)+"</div></div>";
      });
      h += "</div></section>";
    });
    return h + "</div>";
  }

  function vistaBuscar(q){
    var r = buscar(q);
    var h = '<div class="res"><h1>Resultados</h1><p class="cuantos">'
      + (r.length ? r.length + (r.length === 40 ? "+ documentos" : " documento" + (r.length>1?"s":"")) + " para «" + esc(q) + "»"
                  : "Nada para «" + esc(q) + "»")
      + "</p>";
    if(!r.length){
      h += '<div class="vacio">Prueba con una sola palabra, o con un apellido. El buscador recorre las '
        + D.total.toLocaleString("es-MX") + " palabras del acervo, sin acentos ni mayúsculas.</div>";
    }
    r.forEach(function(x){
      h += '<a class="hit" href="#'+x.d.id+'"><span class="hc">'+esc(x.d.ruta)+'</span><span class="ht">'
        + esc(x.d.t)+'</span><span class="hx">'+x.frag+"</span></a>";
    });
    return h + "</div>";
  }

  /* ---------- enrutado ---------- */
  function pintar(){
    var hash = (location.hash || "").replace(/^#/,"");
    var html, activo = null;
    if(!hash || hash === "inicio"){ html = vistaPortada(); }
    else if(hash === "linea"){ html = vistaLinea(); }
    else if(/^s\d\d$/.test(hash)){ html = vistaSec(hash.slice(1)); }
    else if(porId[hash]){ html = vistaDoc(hash); activo = hash; guardar("ep.doc", hash); }
    else { html = vistaPortada(); }
    $("#vista").innerHTML = html;
    pintarRiel(activo);
    pintarTelas();
    if(hash === "linea") conectarFiltros();
    window.scrollTo(0, 0);
    cerrarRiel();
  }
  function conectarFiltros(){
    var f = $("#filtros");
    if(!f) return;
    Array.prototype.forEach.call(f.querySelectorAll("button"), function(b){
      b.setAttribute("aria-pressed", String(b.getAttribute("data-era") === eraActiva));
      b.addEventListener("click", function(){
        eraActiva = b.getAttribute("data-era");
        $("#vista").innerHTML = vistaLinea();
        conectarFiltros();
        pintarTelas();
      });
    });
  }

  /* ---------- riel en teléfono ---------- */
  function abrirRiel(){
    $("#riel").setAttribute("data-abierto","si");
    if(!$("#velo")){
      var v = document.createElement("div");
      v.id = "velo"; v.className = "velo";
      v.addEventListener("click", cerrarRiel);
      document.body.appendChild(v);
    }
  }
  function cerrarRiel(){
    $("#riel").removeAttribute("data-abierto");
    var v = $("#velo"); if(v) v.remove();
  }

  /* ---------- tema y lectura ---------- */
  function aplicarTema(t){
    if(t === "claro" || t === "oscuro"){
      document.documentElement.setAttribute("data-theme", t === "claro" ? "light" : "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    guardar("ep.tema", t);
    $("#btn-tema").textContent = t === "claro" ? "Claro" : (t === "oscuro" ? "Oscuro" : "Sistema");
  }
  function aplicarLectura(on){
    document.documentElement.setAttribute("data-lectura", on ? "si" : "no");
    $("#btn-lectura").setAttribute("aria-pressed", String(on));
    guardar("ep.lectura", on ? "si" : "no");
  }

  /* ---------- arranque ---------- */
  var tema = leer("ep.tema","sistema");
  aplicarTema(tema);
  aplicarLectura(leer("ep.lectura","no") === "si");

  $("#btn-tema").addEventListener("click", function(){
    var t = leer("ep.tema","sistema");
    aplicarTema(t === "sistema" ? "oscuro" : (t === "oscuro" ? "claro" : "sistema"));
  });
  $("#btn-lectura").addEventListener("click", function(){
    aplicarLectura(document.documentElement.getAttribute("data-lectura") !== "si");
  });
  $("#btn-riel").addEventListener("click", function(){
    if($("#riel").getAttribute("data-abierto") === "si") cerrarRiel(); else abrirRiel();
  });

  var caja = $("#q"), reloj = null;
  caja.addEventListener("input", function(){
    clearTimeout(reloj);
    reloj = setTimeout(function(){
      var q = caja.value.trim();
      if(q.length < 2){ pintar(); return; }
      $("#vista").innerHTML = vistaBuscar(q);
      pintarRiel(null);
      pintarTelas();
      window.scrollTo(0,0);
    }, 160);
  });
  caja.addEventListener("keydown", function(e){
    if(e.key === "Escape"){ caja.value = ""; caja.blur(); pintar(); }
  });
  document.addEventListener("keydown", function(e){
    if(e.key === "/" && document.activeElement !== caja){ e.preventDefault(); caja.focus(); }
  });

  document.addEventListener("click", function(e){
    var a = e.target.closest ? e.target.closest("a") : null;
    if(!a) return;
    var href = a.getAttribute("href") || "";
    if(href.indexOf("doc:") === 0){ e.preventDefault(); caja.value=""; location.hash = href.slice(4); if((location.hash||"").slice(1) === href.slice(4)) pintar(); return; }
    if(href.indexOf("sec:") === 0){ e.preventDefault(); caja.value=""; location.hash = "s" + href.slice(4); return; }
    if(href.charAt(0) === "#"){ caja.value = ""; }
  });

  var relojTela = null;
  window.addEventListener("resize", function(){
    clearTimeout(relojTela); relojTela = setTimeout(pintarTelas, 180);
  });
  if(window.matchMedia){
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if(mq.addEventListener) mq.addEventListener("change", pintarTelas);
  }

  window.addEventListener("hashchange", pintar);

  var inicial = (location.hash || "").replace(/^#/,"");
  if(!inicial){
    var ultimo = leer("ep.doc","");
    if(ultimo && porId[ultimo]) { location.hash = ultimo; }
  }
  pintar();
})();

/* ---------- actualizacion automatica (solo en el sitio alojado) ---------- */
if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
  window.addEventListener("load", function(){
    navigator.serviceWorker.register("sw.js").catch(function(){});
    var recargado = false;
    navigator.serviceWorker.addEventListener("controllerchange", function(){
      if (recargado) return;
      recargado = true;
      location.reload();
    });
  });
}
