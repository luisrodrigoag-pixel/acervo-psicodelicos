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
                "04":"--t04", "05":"--t05", "06":"--ocre", "07":"--t07", "99":"--t99" };
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
  function semillaDe(txt){
    var h = 2166136261 >>> 0;
    for(var i = 0; i < txt.length; i++){ h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  /* Placa: floracion radial entre impresion de esporas y caleidoscopio.
     Cada ficha recibe una distinta, derivada de su propio nombre. */
  function placa(cv){
    var lado = cv.clientWidth || 96;
    if(!lado) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(lado * dpr); cv.height = Math.round(lado * dpr);
    var g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var r = azar(semillaDe(cv.getAttribute("data-nombre") || "placa"));
    var colores = (cv.getAttribute("data-tonos") || "--t01,--t02,--t00").split(",").map(leeColor);
    g.fillStyle = "#130a20"; g.fillRect(0, 0, lado, lado);
    var cx = lado / 2, cy = lado / 2, R = lado * 0.46;
    var pliegues = 5 + Math.floor(r() * 7), anillos = 7 + Math.floor(r() * 5), giro = r() * 6.2832;
    for(var i = anillos; i >= 1; i--){
      var base = R * (i / anillos);
      var amp = base * (0.10 + r() * 0.26);
      var fase = giro + i * (0.18 + r() * 0.5);
      var pl = pliegues + (i % 2 ? 0 : 1);
      g.beginPath();
      for(var a = 0; a <= 360; a += 2){
        var th = a * Math.PI / 180;
        var rad = base + Math.sin(th * pl + fase) * amp + Math.sin(th * pl * 2 + fase * 1.7) * amp * 0.3;
        var x = cx + Math.cos(th) * rad, y = cy + Math.sin(th) * rad;
        if(a === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath();
      g.strokeStyle = colores[i % colores.length];
      g.globalAlpha = 0.45 + r() * 0.5;
      g.lineWidth = 1 + r() * 2.6;
      g.lineJoin = "round";
      g.stroke();
    }
    g.globalAlpha = 1;
    g.beginPath(); g.arc(cx, cy, lado * 0.035, 0, 6.2832);
    g.fillStyle = colores[0]; g.fill();
  }
  function pintarTelas(){
    Array.prototype.forEach.call(document.querySelectorAll("canvas.tela,canvas.cinta"), tela);
    Array.prototype.forEach.call(document.querySelectorAll("canvas.placa"), placa);
  }
  /* Un emblema por persona, dibujado a linea. Cada objeto sale de un hecho que
     ya esta escrito en su propia ficha. */
  var EMBLEMAS = {
  "albert-hofmann": '<circle cx="26" cy="70" r="16"/><circle cx="74" cy="70" r="16"/><path d="M26 70 L44 44 L62 70 M44 44 L70 44 L74 70 M44 44 L38 36"/><path d="M30 34 L46 34 M70 44 L70 36 M62 34 L78 34"/>',
  "wasson-y-maria-sabina": '<path d="M40 88 L40 48 L60 48 L60 88 Z"/><path d="M50 48 L50 44"/><path d="M50 44 C42 34 50 28 50 20 C50 28 58 34 50 44 Z"/><path d="M32 88 L68 88"/>',
  "timothy-leary": '<path d="M50 24 L86 42 L50 60 L14 42 Z"/><path d="M30 50 L30 66 C30 76 70 76 70 66 L70 50"/><path d="M86 42 L86 62"/><circle cx="86" cy="68" r="5"/>',
  "james-fadiman": '<rect x="14" y="26" width="72" height="60" rx="6"/><path d="M14 44 L86 44 M32 18 L32 32 M68 18 L68 32"/><circle cx="28" cy="58" r="4.5"/><circle cx="50" cy="58" r="4.5" fill="currentColor"/><circle cx="72" cy="58" r="4.5"/><circle cx="28" cy="74" r="4.5" fill="currentColor"/><circle cx="50" cy="74" r="4.5"/><circle cx="72" cy="74" r="4.5"/>',
  "michael-pollan": '<path d="M50 32 C40 24 22 24 14 28 L14 78 C22 74 40 74 50 82"/><path d="M50 32 C60 24 78 24 86 28 L86 78 C78 74 60 74 50 82"/><path d="M50 32 L50 82"/>',
  "arthur-heffter": '<circle cx="50" cy="54" r="30"/><path d="M50 54 L50 24 M50 54 L76 39 M50 54 L76 69 M50 54 L50 84 M50 54 L24 69 M50 54 L24 39"/><circle cx="50" cy="36" r="3.4"/><circle cx="64" cy="44" r="3.4"/><circle cx="64" cy="62" r="3.4"/><circle cx="50" cy="71" r="3.4"/><circle cx="36" cy="62" r="3.4"/><circle cx="36" cy="44" r="3.4"/><circle cx="50" cy="54" r="5" fill="currentColor"/>',
  "werner-stoll": '<rect x="24" y="16" width="54" height="70" rx="3"/><path d="M34 34 L68 34 M34 46 L68 46 M34 58 L58 58 M34 70 L62 70"/>',
  "humphry-osmond": '<path d="M20 82 C40 70 62 44 80 22"/><path d="M80 22 C78 38 70 50 60 58"/><path d="M20 82 L34 78 M28 72 L38 82"/>',
  "abram-hoffer": '<rect x="34" y="34" width="32" height="52" rx="5"/><rect x="40" y="20" width="20" height="14" rx="3"/><path d="M50 50 L50 72 M39 61 L61 61"/>',
  "sidney-cohen": '<path d="M24 34 L24 64 M34 34 L34 64 M44 34 L44 64 M54 34 L54 64 M20 66 L58 32"/><path d="M70 44 L70 64 M80 44 L80 64"/>',
  "oscar-janiger": '<ellipse cx="50" cy="56" rx="32" ry="24"/><circle cx="62" cy="64" r="6"/><circle cx="36" cy="46" r="4" fill="currentColor"/><circle cx="49" cy="42" r="4" fill="currentColor"/><circle cx="62" cy="47" r="4" fill="currentColor"/>',
  "betty-eisner": '<circle cx="50" cy="24" r="6"/><circle cx="71" cy="33" r="6"/><circle cx="80" cy="54" r="6"/><circle cx="71" cy="75" r="6"/><circle cx="50" cy="84" r="6"/><circle cx="29" cy="75" r="6"/><circle cx="20" cy="54" r="6"/><circle cx="29" cy="33" r="6"/>',
  "walter-pahnke": '<path d="M26 86 L26 50 C26 30 74 30 74 50 L74 86"/><path d="M40 86 L40 56 C40 46 60 46 60 56 L60 86"/><path d="M50 18 L50 30 M43 24 L57 24"/>',
  "stanislav-grof": '<path d="M52.0 50.0 L52.4 50.3 L52.8 50.8 L53.1 51.4 L53.2 52.0 L53.2 52.7 L53.1 53.5 L52.9 54.3 L52.4 55.0 L51.9 55.7 L51.1 56.4 L50.2 56.9 L49.2 57.3 L48.1 57.6 L46.9 57.7 L45.6 57.6 L44.4 57.2 L43.1 56.7 L41.9 55.9 L40.7 54.9 L39.7 53.7 L38.8 52.4 L38.2 50.8 L37.7 49.1 L37.5 47.3 L37.6 45.5 L37.9 43.6 L38.6 41.7 L39.5 39.9 L40.8 38.2 L42.3 36.6 L44.0 35.3 L46.0 34.1 L48.2 33.3 L50.6 32.8 L53.1 32.6 L55.6 32.8 L58.1 33.3 L60.6 34.2 L63.0 35.5 L65.3 37.2 L67.3 39.2 L69.0 41.5 L70.4 44.1 L71.5 47.0 L72.2 50.0 L72.4 53.1 L72.2 56.4 L71.5 59.6 L70.3 62.7 L68.7 65.7 L66.6 68.5 L64.1 71.0 L61.3 73.1 L58.1 74.9 L54.6 76.2 L50.9 77.1 L47.1 77.4 L43.2 77.2 L39.3 76.4 L35.6 75.0 L31.9 73.1 L28.6 70.7 L25.5 67.8 L22.9 64.4 L20.8 60.6 L19.1 56.6 L18.1 52.2 L17.6 47.7 L17.8 43.2 L18.7 38.6 L20.1 34.1 L22.3 29.9 L25.0 25.9 L28.4 22.3 L32.2 19.2 L36.5 16.6 L41.2 14.6 L46.1 13.3 L51.3 12.6 L56.6 12.7 L61.8 13.6 L67.0 15.2 L71.9 17.5 L76.5 20.5 L80.7 24.2 L84.4 28.5 L87.4 33.3 L89.8 38.6 L91.5 44.2 L92.3 50.0 L92.4 56.0 L91.5 61.9 L89.9 67.8 L87.4 73.4"/>',
  "aldous-huxley": '<path d="M22 88 L22 18 L64 12 L64 88"/><path d="M64 24 L88 16 L88 84 L64 88"/><circle cx="71" cy="54" r="3.5" fill="currentColor"/>',
  "robert-gordon-wasson": '<rect x="18" y="16" width="64" height="72" rx="3"/><rect x="18" y="16" width="64" height="12" fill="currentColor"/><rect x="28" y="36" width="44" height="28" rx="2"/><path d="M28 44 L40 54 L48 48 L58 58 L72 46"/><path d="M28 74 L72 74 M28 81 L56 81"/>',
  "ram-dass": '<ellipse cx="50" cy="74" rx="30" ry="11"/><path d="M50 62 C38 50 34 34 50 20 C66 34 62 50 50 62 Z"/><path d="M50 60 C34 56 22 44 26 32 C40 34 50 46 50 60 Z"/><path d="M50 60 C66 56 78 44 74 32 C60 34 50 46 50 60 Z"/>',
  "terence-mckenna": '<rect x="42" y="16" width="16" height="34" rx="8"/><path d="M32 46 C32 64 68 64 68 46"/><path d="M50 64 L50 80 M36 84 L64 84"/>',
  "rick-strassman": '<rect x="26" y="42" width="44" height="16" rx="2"/><path d="M14 50 L26 50 M14 40 L14 60 M70 50 L90 50"/><path d="M38 42 L38 50 M48 42 L48 50 M58 42 L58 50"/>',
  "myron-stolaroff": '<rect x="18" y="36" width="64" height="48" rx="3"/><path d="M14 24 L86 24 L86 36 L14 36 Z"/><path d="M42 50 L58 50"/><path d="M34 36 L34 64 M66 36 L66 64"/>',
  "al-hubbard": '<rect x="18" y="38" width="64" height="44" rx="5"/><path d="M42 38 L42 28 C42 23 58 23 58 28 L58 38"/><path d="M44 56 L56 56"/>',
  "rick-doblin": '<rect x="16" y="30" width="68" height="46" rx="3"/><path d="M16 30 L50 56 L84 30"/>',
  "ken-kesey": '<rect x="12" y="32" width="76" height="38" rx="6"/><rect x="20" y="40" width="15" height="13" rx="2"/><rect x="42" y="40" width="15" height="13" rx="2"/><rect x="64" y="40" width="15" height="13" rx="2"/><circle cx="30" cy="78" r="8"/><circle cx="70" cy="78" r="8"/><path d="M12 32 L88 32"/>',
  "roland-griffiths": '<rect x="22" y="20" width="56" height="68" rx="4"/><rect x="40" y="13" width="20" height="11" rx="3"/><path d="M38 44 L70 44 M38 58 L70 58 M38 72 L70 72"/><path d="M28 40 L32 46 L38 36"/>',
  "robin-carhart-harris": '<path d="M64 86 C64 62 76 56 74 42 C72 24 52 16 40 24 C26 32 24 48 30 58 L24 64 L32 66 L32 78 C32 84 42 86 48 84"/><path d="M40 48 C46 40 52 54 58 46"/>',
  "david-nutt": '<path d="M50 18 L50 70 M34 82 L66 82 M50 70 L40 82 M50 70 L60 82"/><path d="M18 32 L82 32"/><path d="M10 34 C12 48 28 48 30 34"/><path d="M70 34 C72 48 88 48 90 34"/><path d="M20 32 L20 36 M80 32 L80 36"/>',
  "charles-grob": '<path d="M28 16 L72 16 L52 50 L72 84 L28 84 L48 50 Z"/><path d="M22 16 L78 16 M22 84 L78 84"/><path d="M38 30 L62 30 M42 74 L58 74"/>',
  "stephen-ross-y-jeffrey-guss": '<path d="M26 74 L26 40 M26 58 L46 58 M46 58 L46 74"/><path d="M74 74 L74 40 M74 58 L54 58 M54 58 L54 74"/>',
  "matthew-johnson": '<rect x="18" y="48" width="54" height="13" rx="2"/><path d="M60 48 L60 61"/><path d="M78 44 C84 38 78 32 84 26"/><path d="M16 76 L84 32"/>',
  "paul-stamets": '<circle cx="50" cy="48" r="26"/><path d="M34 52 L34 72 M42 50 L42 78 M50 50 L50 82 M58 50 L58 78 M66 52 L66 72"/>',
  "balazs-szigeti": '<rect x="14" y="28" width="72" height="18" rx="9"/><path d="M50 28 L50 46"/><rect x="14" y="58" width="72" height="18" rx="9"/><path d="M50 58 L50 76"/>',
  "alexander-y-ann-shulgin": '<path d="M40 18 L40 40 L22 78 C19 84 23 88 29 88 L71 88 C77 88 81 84 78 78 L60 40 L60 18"/><path d="M35 18 L65 18 M29 68 L71 68"/><circle cx="43" cy="77" r="3"/><circle cx="56" cy="81" r="2.5"/>',
  "franz-vollenweider": '<circle cx="30" cy="50" r="17"/><circle cx="30" cy="50" r="7"/><path d="M47 50 L86 50 M76 50 L76 63 M64 50 L64 60"/>'
  };

  function esPersona(d){ return d.ruta.indexOf("/fichas/") > 0 || d.ruta.indexOf("/capitulos/") > 0; }
  function tallo(d){ var p = d.ruta.split("/").pop(); return p.slice(0, -3); }

  /* --- tapas: portadas tipograficas generadas.
     No se reproduce ninguna portada, cartel ni caratula real: cada tapa se dibuja
     aqui con la tipografia del acervo y el color del registro al que pertenece. --- */
  var REGISTROS = { evidencia:"--t03", divulgacion:"--t07", testimonio:"--t04", entretenimiento:"--tenue" };
  var NOMREG    = { evidencia:"Evidencia", divulgacion:"Divulgación", testimonio:"Testimonio", entretenimiento:"Entretenimiento" };

  var TAPAS = {
    "cambiar-tu-mente":      { t:"Cómo cambiar tu mente",              a:"Michael Pollan",             y:"2018",        r:"divulgacion" },
    "mente-bajo-plantas":    { t:"Esto es tu mente bajo las plantas",  a:"Michael Pollan",             y:"2021",        r:"divulgacion" },
    "lsd-hofmann":           { t:"LSD, mi hijo problemático",          a:"Albert Hofmann",             y:"1979",        r:"testimonio" },
    "puertas-percepcion":    { t:"Las puertas de la percepción",       a:"Aldous Huxley",              y:"1954",        r:"testimonio" },
    "vida-maria-sabina":     { t:"Vida de María Sabina",               a:"Álvaro Estrada",             y:"1977",        r:"testimonio" },
    "experimento-psicodelico":{t:"El experimento psicodélico",         a:"Leary, Metzner y Alpert",    y:"1964",        r:"testimonio" },
    "be-here-now":           { t:"Be Here Now",                        a:"Ram Dass",                   y:"1971",        r:"testimonio" },
    "pihkal":                { t:"PIHKAL · TIHKAL",                    a:"Alexander y Ann Shulgin",    y:"1991 · 1997", r:"testimonio" },
    "spirit-molecule":       { t:"DMT: The Spirit Molecule",           a:"Rick Strassman",             y:"2001",        r:"divulgacion" },
    "explorers-guide":       { t:"The Psychedelic Explorer's Guide",   a:"James Fadiman",              y:"2011",        r:"testimonio" },
    "manchurian":            { t:"The Search for the Manchurian Candidate", a:"John Marks",            y:"1979",        r:"evidencia" },
    "kool-aid":              { t:"The Electric Kool-Aid Acid Test",    a:"Tom Wolfe",                  y:"1968",        r:"testimonio" },
    "plants-of-the-gods":    { t:"Plants of the Gods",                 a:"Schultes, Hofmann y Rätsch", y:"",            r:"divulgacion" },
    "mescaline-jay":         { t:"Mescaline",                          a:"Mike Jay",                   y:"2019",        r:"evidencia" },
    "drugs-hot-air":         { t:"Drugs Without the Hot Air",          a:"David Nutt",                 y:"2020",        r:"evidencia" },

    "maria-sabina-pelicula": { t:"María Sabina, mujer espíritu",       a:"Nicolás Echeverría",         y:"1979",        r:"testimonio" },
    "sunshine-makers":       { t:"The Sunshine Makers",                a:"Cosmo Feilding-Mellen",      y:"2015",        r:"testimonio" },
    "how-to-change":         { t:"How to Change Your Mind",            a:"Alex Gibney y Michael Pollan", y:"2022",      r:"divulgacion" },
    "fantastic-fungi":       { t:"Fantastic Fungi",                    a:"Louie Schwartzberg",         y:"2019",        r:"divulgacion" },
    "dosed":                 { t:"Dosed",                              a:"Tyler Chandler",             y:"2019",        r:"testimonio" },
    "have-a-good-trip":      { t:"Have a Good Trip",                   a:"Donick Cary",                y:"2020",        r:"entretenimiento" },

    "xamanic":               { t:"Xamanic, camino al despertar",       a:"DMT Creativos",              y:"desde 2023",  r:"testimonio" },
    "psychedelics-today":    { t:"Psychedelics Today",                 a:"Joe Moore y Kyle Buller",    y:"desde 2016",  r:"divulgacion" },
    "hamilton-morris":       { t:"The Hamilton Morris Podcast",        a:"Hamilton Morris",            y:"desde 2021",  r:"divulgacion" }
  };

  function cortar(txt, max){
    var pal = String(txt).split(/\s+/), ln = [], act = "";
    for(var i=0;i<pal.length;i++){
      if(!act){ act = pal[i]; }
      else if((act + " " + pal[i]).length <= max){ act += " " + pal[i]; }
      else { ln.push(act); act = pal[i]; }
    }
    if(act) ln.push(act);
    return ln;
  }

  function tapa(clave){
    var d = TAPAS[clave];
    if(!d) return "";
    var tn = REGISTROS[d.r] || "--t07";
    var ruta = (D.portadas || {})[clave];
    if(ruta){
      /* portada verificada: dominio publico o licencia libre.
         Se conserva el lomo de color para que el registro siga leyendose. */
      return '<div class="tapa portada" style="--tono:var(' + tn + ')">'
        + '<img src="' + esc(ruta) + '" alt="' + esc("Portada de " + d.t) + '" loading="lazy">'
        + '<span class="pie">' + (d.y ? esc(d.y) + " · " : "") + esc(NOMREG[d.r] || "") + '</span>'
        + '</div>';
    }
    var n   = d.t.length;
    var fs  = n <= 16 ? 22 : n <= 30 ? 18.5 : n <= 48 ? 15 : 12.5;
    var anc = 132;
    function reparte(s){ return cortar(d.t, Math.max(9, Math.round(anc / (s * 0.52)))); }
    var ln = reparte(fs);
    while(ln.length > 5 && fs > 10){ fs -= 1.5; ln = reparte(fs); }
    var paso  = fs * 1.18;
    var la    = cortar(String(d.a).toUpperCase(), 25).slice(0, 2);
    var altoT = (ln.length - 1) * paso;
    var alto  = altoT + 20 + (la.length - 1) * 10;
    var y0    = 126.5 + 0.39 * fs - alto / 2;
    var tt = ln.map(function(l, k){
      return '<tspan x="26" y="' + (y0 + k * paso).toFixed(1) + '">' + esc(l) + '</tspan>';
    }).join("");
    var yR = y0 + altoT + 13;
    var ta = la.map(function(l, k){
      return '<tspan x="26" y="' + (yR + 15 + k * 10).toFixed(1) + '">' + esc(l) + '</tspan>';
    }).join("");
    return '<svg class="tapa" viewBox="0 0 180 270" role="img" aria-label="'
      + esc("Tapa de " + d.t + ", de " + d.a) + '" style="--tono:var(' + (REGISTROS[d.r] || "--t07") + ')">'
      + '<rect x="0" y="0" width="180" height="270" fill="currentColor" opacity=".11"/>'
      + '<rect x="0" y="0" width="10" height="270" fill="currentColor" opacity=".82"/>'
      + '<g filter="url(#lapiz)" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".5">'
      +   '<rect x="20" y="18" width="146" height="234"/>'
      +   '<path d="M26 ' + yR.toFixed(1) + ' H120"/>'
      +   '<path d="M26 228 H160"/>'
      + '</g>'
      + '<text class="tt" font-size="' + fs + '">' + tt + '</text>'
      + '<text class="ta">' + ta + '</text>'
      + (d.y ? '<text class="ty" x="26" y="243">' + esc(d.y) + '</text>' : "")
      + '<text class="tr" x="160" y="243" text-anchor="end">' + esc((NOMREG[d.r] || "").toUpperCase()) + '</text>'
      + '</svg>';
  }

  function marcaDe(d, num, lado){
    var tonos = (TONOS[num] || "--acento") + ",--t02,--t00";
    if(d.retrato)
      return '<img class="placa" src="' + esc(d.retrato) + '" alt="Retrato de ' + esc(d.t) + '" width="' + lado + '" height="' + lado + '">';
    var em = EMBLEMAS[tallo(d)];
    if(em)
      return '<span class="emblema" role="img" aria-label="Emblema de ' + esc(d.t) + '">'
           + '<svg viewBox="0 0 100 100"><g filter="url(#lapiz)" fill="none" stroke="currentColor" '
           + 'stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">' + em + "</g></svg></span>";
    return '<canvas class="placa" data-nombre="' + esc(d.t) + '" data-tonos="' + tonos + '" aria-hidden="true"></canvas>';
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
      var mt = /^::tapa\s+([a-z0-9-]+)::$/.exec(b);
      if(mt){
        var trozos = [];
        while(i + 1 < bloques.length){
          var sg = bloques[i+1].trim();
          if(!sg){ i++; continue; }
          if(/^::tapa\s/.test(sg) || /^#{1,6}\s/.test(sg) || /^---+$/.test(sg)) break;
          trozos.push(sg); i++;
        }
        out += '<figure class="obra">' + tapa(mt[1])
             + '<div class="obratxt">' + md(trozos.join("\n\n")) + '</div></figure>';
        continue;
      }
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
    return m.replace(/^::tapa\s+\S+::$/gm," ").replace(/^#\s+.+$/m,"").replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/[*#>`]/g," ").replace(/\s+/g," ").trim();
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
    h += '<div class="aviso"><b>Qué no es</b>No es consejo médico ni legal, y no es material de instrucción. En México las sustancias de las que trata están prohibidas. El <a href="doc:aviso">aviso completo</a> explica el alcance y los criterios editoriales.</div>';
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
    var cabeza = "";
    if(s && esPersona(d)){
      var pie = d.retrato ? "" : (EMBLEMAS[tallo(d)] ? "Emblema" : "Placa generada");
      cabeza = '<div class="retrato">' + marcaDe(d, s.n, 104)
             + (pie ? '<span class="pie-placa">' + pie + "</span>" : "") + "</div>";
    }
    return '<div' + tn + ">" + migas + cabeza + '<div class="doc">' + cuerpo + "</div>" + menc + vecinos + "</div>";
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
      var conPlaca = esPersona(d);
      var partes = d.ruta.split("/");
      var rotulo = conPlaca ? (partes[1] === "capitulos" ? "Capítulo" : "Ficha")
                            : partes.slice(1).join("/");
      h += '<a class="ficha ensec'+(s.n==="06"?" privada":"")+(conPlaca?" conplaca":"")+'" href="#'+d.id+'">'
        + (conPlaca ? marcaDe(d, s.n, 64) : "")
        + '<div class="cuerpoficha"><span class="cn">'+esc(rotulo)+"</span><b>"+esc(et)+"</b>"
        + "<span>"+esc(d.bajada)+"</span>"
        + '<span class="cuenta">'+d.pal.toLocaleString("es-MX")+" palabras</span></div></a>";
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
