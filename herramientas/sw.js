/* Service worker del Expediente. La version la inyecta construir.py en cada compilacion. */
var VERSION = "__VERSION__";
var CACHE = "expediente-" + VERSION;
var BASE = ["./", "./index.html", "./manifest.webmanifest",
            "./iconos/icono-192.png", "./iconos/icono-512.png", "./iconos/icono-apple-180.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(BASE); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* Solo se guarda lo que es seguro guardar: respuestas 200 que no son una redireccion
   (una sesion de Cloudflare Access vencida responde con redireccion al login, y
   guardarla dejaria la app mostrando la pantalla de inicio de sesion para siempre). */
function guardable(r){
  return r && r.status === 200 && !r.redirected && (r.type === "basic" || r.type === "cors" || r.type === "opaque");
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  if (req.mode === "navigate") {
    /* primero la red, para recibir despliegues nuevos; la cache es el respaldo sin internet */
    e.respondWith(
      fetch(req).then(function(r){
        if (guardable(r)) { var c = r.clone(); caches.open(CACHE).then(function(k){ k.put("./index.html", c); }); }
        return r;
      }).catch(function(){
        return caches.match("./index.html").then(function(r){ return r || Response.error(); });
      })
    );
    return;
  }

  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(function(enCache){
        var red = fetch(req).then(function(r){
          if (guardable(r)) { var c = r.clone(); caches.open(CACHE).then(function(k){ k.put(req, c); }); }
          return r;
        }).catch(function(){ return enCache; });
        return enCache || red;
      })
    );
    return;
  }

  /* tipografias de Google: cache primero, para que la lectura sin internet conserve la tipografia */
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.match(req).then(function(enCache){
        return enCache || fetch(req).then(function(r){
          if (guardable(r)) { var c = r.clone(); caches.open(CACHE).then(function(k){ k.put(req, c); }); }
          return r;
        }).catch(function(){ return enCache || Response.error(); });
      })
    );
  }
});
