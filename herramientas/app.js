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
    s = s.replace(/<(https?:\/\/[^>\s]+)>/g, "$1");
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
      /* el HTML suelto del README (la imagen del logotipo) no se muestra aqui:
         la app ya tiene su propia portada */
      if(/^<[a-zA-Z!\/]/.test(b) && /&gt;$|>$/.test(b)) continue;
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
    h += '<a href="#linea">Línea de tiempo</a>';
    h += '<a href="#" id="btn-azar">Documento al azar</a></div>';
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


  /* ---------- campo: fondo vivo detras de todo ---------- */
  var CAMPO = { cv:null, g:null, t:0, corriendo:false, ultimo:0, tonos:["--t01","--t02","--t00"] };
  function quietud(){
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function dosisActual(){ return leer("ep.dosis", "normal"); }

  function medirCampo(){
    var cv = CAMPO.cv; if(!cv) return;
    var dpr = Math.min(1.5, window.devicePixelRatio || 1);
    cv.width = Math.round(window.innerWidth * dpr);
    cv.height = Math.round(window.innerHeight * dpr);
    CAMPO.g = cv.getContext("2d");
    CAMPO.g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function dibujarCampo(){
    var g = CAMPO.g; if(!g) return;
    var w = window.innerWidth, h = window.innerHeight;
    g.clearRect(0, 0, w, h);
    var colores = CAMPO.tonos.map(leeColor);
    var n = 16, t = CAMPO.t;
    for(var i = 0; i < n; i++){
      var k = i / (n - 1);
      var base = h * (0.04 + k * 0.94);
      var amp = h * (0.05 + 0.09 * Math.sin(i * 1.7));
      var frec = 0.0016 + 0.0013 * ((i % 4) + 1);
      var fase = t * (0.22 + i * 0.015) + i * 0.9;
      g.beginPath();
      for(var x = -40; x <= w + 40; x += 14){
        var y = base
              + Math.sin(x * frec + fase) * amp
              + Math.sin(x * frec * 2.1 - fase * 0.7) * amp * 0.35;
        if(x === -40) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokeStyle = colores[i % colores.length];
      g.lineWidth = 2 + (i % 3) * 2.4;
      g.lineCap = "round";
      g.stroke();
    }
  }
  function cicloCampo(ahora){
    if(!CAMPO.corriendo) return;
    if(ahora - CAMPO.ultimo > 42){           /* ~24 cuadros por segundo, de sobra */
      CAMPO.ultimo = ahora;
      CAMPO.t += 0.055;
      dibujarCampo();
    }
    requestAnimationFrame(cicloCampo);
  }
  function arrancarCampo(){
    var d = dosisActual();
    if(d === "sobrio" || !CAMPO.cv){ pararCampo(); return; }
    medirCampo();
    if(quietud()){ CAMPO.t = 1.3; dibujarCampo(); pararCampo(); return; }  /* dibujo fijo */
    if(CAMPO.corriendo) return;
    CAMPO.corriendo = true;
    requestAnimationFrame(cicloCampo);
  }
  function pararCampo(){ CAMPO.corriendo = false; }
  function tonosDeVista(hash){
    var num = null;
    if(porId[hash]) num = numDeCarpeta(porId[hash].sec);
    else if(/^s\d\d$/.test(hash)) num = hash.slice(1);
    else if(hash === "linea") num = "02";
    var clave = TONOS[num];
    CAMPO.tonos = clave ? [clave, "--t02", "--t00"] : ["--t01", "--t04", "--t02"];
    if(!CAMPO.corriendo) dibujarCampo();
  }

  /* ---------- avance de lectura ---------- */
  function pintarAvance(){
    var barra = $("#avance"); if(!barra) return;
    var alto = document.documentElement.scrollHeight - window.innerHeight;
    var p = alto > 40 ? Math.min(1, Math.max(0, window.scrollY / alto)) : 0;
    barra.style.width = (p * 100).toFixed(1) + "%";
  }

  /* ---------- control de dosis ---------- */
  var DOSIS = ["sobrio", "normal", "intenso"];
  var ETIQUETA = { sobrio:"Sobrio", normal:"Normal", intenso:"Intenso" };
  function aplicarDosis(d){
    if(DOSIS.indexOf(d) < 0) d = "normal";
    document.documentElement.setAttribute("data-dosis", d);
    guardar("ep.dosis", d);
    var b = $("#btn-dosis");
    if(b){ b.innerHTML = 'Dosis <b>' + ETIQUETA[d] + '</b>'; b.setAttribute("aria-label", "Dosis visual: " + ETIQUETA[d]); }
    if(d === "sobrio") pararCampo(); else arrancarCampo();
  }


  /* ===================== figuras =====================
     Formas: intervalos para una estimacion con su margen, barras para magnitud.
     Color: una serie usa un solo tono; dos series usan la paleta categorica,
     que esta validada aparte para claro y para oscuro. Toda figura trae
     etiquetas directas, tabla alternativa y globo al pasar el cursor. */

  var PAL = ["--g1", "--g2", "--g3", "--g4"];
  function pal(i){ return "var(" + PAL[i % PAL.length] + ")"; }

  function ejeBonito(max){
    var pasos = [1, 2, 2.5, 5, 10, 20, 25, 50];
    for(var i = 0; i < pasos.length; i++){
      var p = pasos[i];
      if(max / p <= 5) return { paso:p, tope:Math.ceil(max / p) * p };
    }
    return { paso:50, tope:Math.ceil(max / 50) * 50 };
  }

  function svgIntervalos(f){
    var filas = f.filas, n = filas.length;
    var izq = 0, alto = 62, anchoTotal = 760, der = 64;
    var eje = ejeBonito(Math.max.apply(null, filas.map(function(r){ return r.hi || r.v; })));
    var x0 = izq, x1 = anchoTotal - der;
    var esc = function(v){ return x0 + (v / eje.tope) * (x1 - x0); };
    var h = n * alto + 30;
    var s = '<svg viewBox="0 0 ' + anchoTotal + ' ' + h + '" role="img" aria-label="' + esc_(f.titulo) + '">';
    for(var t = 0; t <= eje.tope + 0.001; t += eje.paso){
      var x = esc(t);
      s += '<line x1="'+x.toFixed(1)+'" y1="0" x2="'+x.toFixed(1)+'" y2="'+(n*alto-8)+'" stroke="var(--g-rejilla)" stroke-width="1"/>';
      s += '<text x="'+x.toFixed(1)+'" y="'+(n*alto+14)+'" text-anchor="middle" font-size="13" fill="var(--tenue)" class="val">'+t+'</text>';
    }
    filas.forEach(function(r, i){
      var y = i * alto + alto / 2 + 8;
      if(r.lo != null){
        s += '<line x1="'+esc(r.lo).toFixed(1)+'" y1="'+y+'" x2="'+esc(r.hi).toFixed(1)+'" y2="'+y+'" stroke="'+pal(0)+'" stroke-width="3" stroke-linecap="round" opacity=".45"/>';
      }
      s += '<circle class="marca" data-g="'+esc_(r.et + ' — ' + (r.glob || (r.v + ' puntos')))+'" cx="'+esc(r.v).toFixed(1)+'" cy="'+y+'" r="7" fill="'+pal(0)+'" stroke="var(--tarjeta)" stroke-width="2"/>';
      s += '<text x="'+(esc(r.v)+13).toFixed(1)+'" y="'+(y+5)+'" font-size="15" fill="var(--tinta)" class="val">'+r.v.toFixed(1)+'</text>';
      s += '<text x="0" y="'+(y-16)+'" font-size="15" fill="var(--tinta)">'+esc_(r.et)+'</text>';
      if(r.sub) s += '<text x="0" y="'+(y+22)+'" font-size="13" fill="var(--tenue)">'+esc_(r.sub)+'</text>';
    });
    return s + "</svg>";
  }

  function svgBarras(f){
    var filas = f.filas, series = f.series || [""], n = filas.length;
    var altoFila = series.length > 1 ? 80 : 46, barra = series.length > 1 ? 20 : 22;
    var anchoTotal = 760, etq = f.etqAncho || 200, der = 66;
    var eje = ejeBonito(Math.max.apply(null, filas.map(function(r){
      return Math.max.apply(null, [].concat(r.v)); })));
    var x0 = etq, x1 = anchoTotal - der;
    var esc = function(v){ return (v / eje.tope) * (x1 - x0); };
    var h = n * altoFila + 32;
    var s = '<svg viewBox="0 0 ' + anchoTotal + ' ' + h + '" role="img" aria-label="' + esc_(f.titulo) + '">';
    for(var t = 0; t <= eje.tope + 0.001; t += eje.paso){
      var x = x0 + esc(t);
      s += '<line x1="'+x.toFixed(1)+'" y1="0" x2="'+x.toFixed(1)+'" y2="'+(n*altoFila-14)+'" stroke="var(--g-rejilla)" stroke-width="1"/>';
      s += '<text x="'+x.toFixed(1)+'" y="'+(n*altoFila+16)+'" text-anchor="middle" font-size="13" fill="var(--tenue)" class="val">'+(f.formatoEje ? f.formatoEje(t) : t)+'</text>';
    }
    filas.forEach(function(r, i){
      var vs = [].concat(r.v);
      var base = i * altoFila;
      s += '<text x="0" y="'+(base + (series.length > 1 ? 18 : altoFila/2 + 5))+'" font-size="15" fill="var(--tinta)">'+esc_(r.et)+'</text>';
      vs.forEach(function(v, k){
        var y = series.length > 1 ? base + 26 + k * (barra + 3) : base + (altoFila - barra) / 2;
        var w = Math.max(2, esc(v));
        var txt = (f.formato ? f.formato(v) : String(v));
        s += '<rect class="marca" data-g="'+esc_(r.et + (series[k] ? " · " + series[k] : "") + " — " + txt)+'" x="'+x0+'" y="'+y+'" width="'+w.toFixed(1)+'" height="'+barra+'" rx="4" fill="'+pal(k)+'"/>';
        s += '<rect x="'+x0+'" y="'+y+'" width="4" height="'+barra+'" fill="'+pal(k)+'"/>';
        s += '<text x="'+(x0 + w + 7).toFixed(1)+'" y="'+(y + barra - 5)+'" font-size="14" fill="var(--tinta)" class="val">'+esc_(txt)+'</text>';
      });
    });
    return s + "</svg>";
  }

  function esc_(x){ return esc(String(x)); }

  function tablaDe(f){
    var series = f.series || ["Valor"];
    var s = '<div class="tabla-vista" hidden><table><thead><tr><th>' + esc_(f.ejeEt || "Categoría") + "</th>";
    series.forEach(function(x){ s += "<th>" + esc_(x || "Valor") + "</th>"; });
    if(f.filas.some(function(r){ return r.lo != null; })) s += "<th>Intervalo de confianza</th>";
    s += "</tr></thead><tbody>";
    f.filas.forEach(function(r){
      s += "<tr><td>" + esc_(r.et + (r.sub ? " (" + r.sub + ")" : "")) + "</td>";
      [].concat(r.v).forEach(function(v){ s += '<td class="n">' + esc_(f.formato ? f.formato(v) : v) + "</td>"; });
      if(f.filas.some(function(q){ return q.lo != null; }))
        s += '<td class="n">' + (r.lo != null ? r.lo + " a " + r.hi : "—") + "</td>";
      s += "</tr>";
    });
    return s + "</tbody></table></div>";
  }

  function figura(f){
    var cuerpo = f.tipo === "intervalos" ? svgIntervalos(f) : svgBarras(f);
    var leyenda = "";
    if((f.series || []).length > 1){
      leyenda = '<div class="leyenda">' + f.series.map(function(x, i){
        return '<span><i style="background:' + pal(i) + '"></i>' + esc_(x) + "</span>"; }).join("") + "</div>";
    }
    return '<figure class="figura"><h4>' + esc_(f.titulo) + "</h4>"
      + (f.sub ? '<p class="sub">' + esc_(f.sub) + "</p>" : "")
      + leyenda + cuerpo + tablaDe(f)
      + '<figcaption class="fuente">' + esc_(f.fuente)
      + ' · <button type="button" class="ver-tabla">Ver los datos en tabla</button></figcaption></figure>';
  }

  function kpis(lista){
    return '<div class="kpi">' + lista.map(function(t){
      return '<div class="tile"><span class="n">' + esc_(t.n) + '</span><span class="e">' + esc_(t.e) + "</span></div>";
    }).join("") + "</div>";
  }

  /* ---------- que figura va en que documento ---------- */
  var DONDE = { "03-ciencia-ensayos-clinicos":1, "04-microdosis-evidencia":2 };
  var FIGURAS = {
    "03-ciencia-ensayos-clinicos": function(){
      return kpis([
        { n:"258", e:"participantes en el COMP005" },
        { n:"581", e:"participantes en el COMP006" },
        { n:"25 %", e:"respondedores con 25 mg en el COMP005, semana 6" },
        { n:"39 %", e:"respondedores con 25 mg en el COMP006, semana 6" }
      ]) + figura({
        tipo:"intervalos",
        titulo:"Cuánto mejora la psilocibina frente a su control, en la escala MADRS",
        sub:"Puntos de diferencia a favor de la dosis alta. La escala va de 0 a 60, así que estas distancias son la razón del desacuerdo sobre su relevancia clínica. La barra tenue es el intervalo de confianza del 95 %.",
        ejeEt:"Ensayo",
        filas:[
          { et:"COMP005, 25 mg contra placebo", sub:"semana 6", v:3.6, lo:1.5, hi:5.7, glob:"3.6 puntos (IC 1.5 a 5.7)" },
          { et:"COMP006, 25 mg contra 1 mg",    sub:"semana 6", v:3.8, lo:1.8, hi:5.8, glob:"3.8 puntos (IC 1.8 a 5.8)" },
          { et:"Fase 2b, 25 mg contra 1 mg",    sub:"semana 3, se atenúa hacia la semana 12", v:6.6, glob:"6.6 puntos" }
        ],
        fuente:"Compass Pathways, resultados de fase 3 (2025 y 2026) y ensayo de fase 2b publicado en el New England Journal of Medicine (2022). Solo se grafican cifras que aparecen en este acervo."
      });
    },
    "04-microdosis-evidencia": function(){
      return figura({
        tipo:"barras",
        titulo:"Qué pasa cuando se compara la microdosis contra placebo",
        sub:"Reducción de síntomas depresivos en el ensayo de fase 2, en puntos de escala. Los dos grupos bajaron casi igual, y el placebo bajó un poco más. Esa es la forma que tiene un resultado sin señal.",
        ejeEt:"Ensayo", etqAncho:200,
        series:["Microdosis de psilocibina", "Placebo"],
        filas:[{ et:"Depresión mayor, fase 2", v:[5.4, 6.0] }],
        formato:function(v){ return v.toFixed(1) + " pts"; },
        fuente:"Ensayo de fase 2 doble ciego con control de placebo en depresión mayor."
      }) + figura({
        tipo:"barras",
        titulo:"Cuánta gente microdosea, en Estados Unidos",
        sub:"Porcentaje de adultos que reportó haber usado cada sustancia en el año previo. El dato importa porque mide una práctica masiva que sigue sin evidencia de eficacia.",
        ejeEt:"Sustancia", etqAncho:150,
        filas:[
          { et:"Psilocibina",   v:4.26 },
          { et:"MDMA o MDA",    v:1.81 },
          { et:"Amanita muscaria", v:1.34 },
          { et:"Ketamina",      v:1.26 },
          { et:"LSD",           v:1.15 }
        ],
        formato:function(v){ return v.toFixed(2) + " %"; },
        formatoEje:function(v){ return v + " %"; },
        fuente:"Encuesta probabilística nacional de RAND, levantada entre septiembre y octubre de 2025 y publicada en enero de 2026."
      }) + kpis([
        { n:"≈10 M", e:"adultos microdosearon psilocibina, LSD o MDMA en el año previo" },
        { n:"69 %", e:"de quienes usaron psilocibina microdosearon al menos una vez" },
        { n:"47 %", e:"de los días de uso de psilocibina fueron microdosis" }
      ]);
    }
  };

  /* ---------- tablero del estatus legal ---------- */
  var REGIMENES = [
    { k:"A", et:"Prohibición", c:"--g1" },
    { k:"B", et:"Programa regulado para adultos", c:"--g2" },
    { k:"C", et:"Acceso médico con diagnóstico", c:"--g3" },
    { k:"D", et:"Marco internacional", c:"--g4" }
  ];
  var JURISDICCIONES = [
    { lugar:"México", r:"A", nota:"Prohibición sin excepción sanitaria. El Código Penal Federal sí ordena no perseguir la posesión para ceremonias de pueblos indígenas y afromexicanos. Sin umbral de consumo personal en la ley." },
    { lugar:"Estados Unidos, federal", r:"A", nota:"Lista I desde 1970. Ningún psicodélico clásico aprobado todavía como medicamento." },
    { lugar:"Oregón", r:"B", nota:"Medida 109, en operación desde enero de 2023. Sin diagnóstico, con facilitador capacitado y análisis obligatorio de potencia." },
    { lugar:"Colorado", r:"B", nota:"Proposición 122, de 2022. Es el único que además despenaliza la posesión para adultos." },
    { lugar:"Nuevo México", r:"C", nota:"Ley de Psilocibina Médica de 2025, la primera aprobada por una legislatura. Exige diagnóstico calificante y profesional de la salud." },
    { lugar:"Australia", r:"C", nota:"Desde julio de 2023, prescriptores habilitados en indicaciones específicas. Primer país en hacerlo." },
    { lugar:"Convenio de 1971", r:"D", nota:"Fiscaliza la psilocibina como sustancia. Según el comentario oficial y la Junta de Fiscalización, no fiscaliza los hongos que la contienen: eso lo decidió cada legislador nacional." }
  ];
  function tablero(){
    var reg = {}; REGIMENES.forEach(function(x){ reg[x.k] = x; });
    var h = '<div class="figura"><h4>Dónde está permitido, dónde no, y con qué condición</h4>'
      + '<p class="sub">Las jurisdicciones que este acervo documenta, agrupadas por el tipo de régimen. El color repite lo que ya dice la etiqueta, nunca lo sustituye.</p>'
      + '<div class="leyenda">' + REGIMENES.map(function(x){
          return '<span><i style="background:var(' + x.c + ')"></i>' + esc_(x.et) + "</span>"; }).join("") + "</div>"
      + '<div class="tablero">';
    JURISDICCIONES.forEach(function(j){
      h += '<div class="casilla" style="--c:var(' + reg[j.r].c + ')"><span class="lugar">' + esc_(j.lugar) + "</span>"
        + '<span class="reg"><i></i>' + esc_(reg[j.r].et) + "</span>"
        + '<span class="nota">' + esc_(j.nota) + "</span></div>";
    });
    return h + '</div><p class="fuente">Fecha de corte: 22 de octubre de 2026. El detalle de cada régimen está en los documentos de esta sección.</p></div>';
  }

  /* ---------- globo de las figuras ---------- */
  var GLOBO = null;
  function conectarGlobo(){
    if(!GLOBO){
      GLOBO = document.createElement("div");
      GLOBO.className = "globo";
      document.body.appendChild(GLOBO);
    }
    Array.prototype.forEach.call(document.querySelectorAll(".figura .marca"), function(m){
      m.addEventListener("mouseenter", function(e){
        GLOBO.textContent = m.getAttribute("data-g");
        GLOBO.setAttribute("data-ver", "si");
      });
      m.addEventListener("mousemove", function(e){
        GLOBO.style.left = Math.min(window.innerWidth - 250, e.clientX + 14) + "px";
        GLOBO.style.top = (e.clientY - 34) + "px";
      });
      m.addEventListener("mouseleave", function(){ GLOBO.removeAttribute("data-ver"); });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".ver-tabla"), function(b){
      b.addEventListener("click", function(){
        var t = b.closest(".figura").querySelector(".tabla-vista");
        if(!t) return;
        t.hidden = !t.hidden;
        b.textContent = t.hidden ? "Ver los datos en tabla" : "Ocultar la tabla";
      });
    });
  }

  /* ---------- brindis: aviso breve al pie ---------- */
  var BRINDIS = null, relojBrindis = null;
  function brindar(texto){
    if(!BRINDIS){
      BRINDIS = document.createElement("div");
      BRINDIS.className = "brindis";
      BRINDIS.setAttribute("role", "status");
      document.body.appendChild(BRINDIS);
    }
    BRINDIS.textContent = texto;
    BRINDIS.setAttribute("data-ver", "si");
    clearTimeout(relojBrindis);
    relojBrindis = setTimeout(function(){ BRINDIS.removeAttribute("data-ver"); }, 2400);
  }
  function copiarEnlace(){
    var url = location.href;
    function respaldo(){
      brindar("No se pudo copiar. El enlace es: " + url);
    }
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(url).then(function(){ brindar("Enlace copiado"); }, respaldo);
      } else respaldo();
    }catch(e){ respaldo(); }
  }
  function alAzar(){
    var l = D.docs.filter(function(d){ return d.ruta.split("/").pop() !== "README.md"; });
    var d = l[Math.floor(Math.random() * l.length)];
    location.hash = d.id;
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
      + '<span>·</span><span>'+d.pal.toLocaleString("es-MX")+" palabras</span>"
      + '<span class="acciones"><button type="button" id="btn-copiar">Copiar enlace</button></span></div>';
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
    var cuerpo = md(d.md);
    if(FIGURAS[d.id]){
      var bloque = FIGURAS[d.id]();
      var corte = -1, busca = 0, k = DONDE[d.id] || 1;
      for(var q = 0; q < k; q++){
        corte = cuerpo.indexOf("<h2>", busca);
        if(corte < 0) break;
        busca = corte + 4;
      }
      cuerpo = corte >= 0 ? cuerpo.slice(0, corte) + bloque + cuerpo.slice(corte) : cuerpo + bloque;
    }
    var menc = "";
    if((d.mencionado_en || []).length){
      menc = '<div class="menciones"><h4>También aparece en</h4><ul>'
        + d.mencionado_en.map(function(x){
            var o = porId[x]; if(!o) return "";
            return '<li><a href="#' + o.id + '">' + esc(o.t) + "</a></li>";
          }).join("") + "</ul></div>";
    }
    return '<div' + tn + ">" + migas + '<div class="doc">' + cuerpo + "</div>" + menc + vecinos + "</div>";
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
      + (s.n === "05" ? tablero() : "")
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
    conectarGlobo();
    var bc = $("#btn-copiar"); if(bc) bc.addEventListener("click", copiarEnlace);
    tonosDeVista(hash);
    pintarAvance();
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
  CAMPO.cv = $("#campo");
  aplicarDosis(leer("ep.dosis", "normal"));
  window.addEventListener("scroll", pintarAvance, { passive:true });
  document.addEventListener("visibilitychange", function(){
    if(document.hidden) pararCampo(); else arrancarCampo();
  });
  $("#btn-dosis").addEventListener("click", function(){
    var i = DOSIS.indexOf(dosisActual());
    aplicarDosis(DOSIS[(i + 1) % DOSIS.length]);
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
      conectarGlobo();
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
    if(a.id === "btn-azar"){ e.preventDefault(); caja.value = ""; alAzar(); return; }
    if(href.charAt(0) === "#"){ caja.value = ""; }
  });

  var relojTela = null;
  window.addEventListener("resize", function(){
    clearTimeout(relojTela);
    relojTela = setTimeout(function(){ pintarTelas(); medirCampo(); dibujarCampo(); pintarAvance(); }, 180);
  });
  if(window.matchMedia){
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if(mq.addEventListener) mq.addEventListener("change", function(){ pintarTelas(); dibujarCampo(); });
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
