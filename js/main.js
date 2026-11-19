/* Caraguá Pixel — script global */
const CONFIG = {
  instagram: "https://www.instagram.com/caraguapixel/",
  dm: "https://www.instagram.com/caraguapixel/"
};
window.CONFIG = window.CONFIG || CONFIG;

(function () {
  "use strict";

  // Links do Instagram / DM
  function aplicarRelExterno(a) {
    if (a.target === "_blank") a.rel = "noopener noreferrer nofollow";
  }
  document.querySelectorAll("[data-instagram]").forEach(function (a) {
    a.href = CONFIG.instagram;
    aplicarRelExterno(a);
  });
  document.querySelectorAll("[data-dm]").forEach(function (a) {
    a.href = a.getAttribute("data-ig-dm") || CONFIG.dm;
    aplicarRelExterno(a);
  });

  // Menu mobile
  var menuBtn = document.querySelector(".menu-btn");
  var links = document.querySelector(".links");
  if (menuBtn && links) {
    menuBtn.addEventListener("click", function () {
      var aberto = links.classList.toggle("aberto");
      menuBtn.setAttribute("aria-expanded", aberto ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        links.classList.remove("aberto");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Sincroniza --topo-h com a altura real do cabeçalho para o HUD 3D nunca ficar coberto
  var topoHeader = document.querySelector("header.topo");
  if (topoHeader) {
    var atualizarAlturaTopo = function () {
      var rect = topoHeader.getBoundingClientRect();
      if (rect && rect.height > 0) {
        document.documentElement.style.setProperty("--topo-h", Math.ceil(rect.height) + "px");
      }
    };
    atualizarAlturaTopo();
    window.addEventListener("resize", atualizarAlturaTopo, { passive: true });
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(atualizarAlturaTopo).observe(topoHeader);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(atualizarAlturaTopo).catch(function () {});
    }
  }

  // Toast
  var toastEl = null, toastTimer = null;
  window.mostrarAviso = function (texto) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "aviso";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = texto;
    void toastEl.offsetWidth;
    toastEl.classList.add("visivel");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("visivel"); }, 3200);
  };
  document.querySelectorAll("[data-em-breve]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      window.mostrarAviso(el.getAttribute("data-em-breve") || "Em breve!");
    });
  });

  // Vaga-lumes
  function vagalumes(container, qtd) {
    if (!container) return;
    for (var i = 0; i < qtd; i++) {
      var v = document.createElement("span");
      v.className = "vagalume" + (Math.random() < 0.4 ? " sobe" : "");
      v.style.left = (Math.random() * 100) + "%";
      v.style.top = (20 + Math.random() * 80) + "%";
      v.style.animationDelay = (-Math.random() * 10) + "s, " + (-Math.random() * 4) + "s";
      var t = 0.6 + Math.random() * 0.8;
      v.style.transform = "scale(" + t + ")";
      container.appendChild(v);
    }
  }
  vagalumes(document.querySelector(".vagalumes"), 24);
  var mobile = window.matchMedia("(max-width: 900px)").matches;
  vagalumes(document.querySelector(".vagalumes-site"), mobile ? 22 : 40);

  // Voltar ao topo
  var topo = document.querySelector(".voltar-topo");
  if (!topo) {
    topo = document.createElement("button");
    topo.className = "voltar-topo";
    topo.type = "button";
    topo.setAttribute("aria-label", "Voltar ao topo");
    topo.textContent = "↑";
    document.body.appendChild(topo);
  }
  topo.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  function checaScroll() { topo.classList.toggle("visivel", window.scrollY > 900); }
  window.addEventListener("scroll", checaScroll, { passive: true });
  checaScroll();

  // Contadores animados
  function formata(n, formato) {
    if (formato === "mil") return Math.round(n).toLocaleString("pt-BR");
    return String(Math.round(n));
  }
  function anima(el) {
    var alvo = parseFloat(el.getAttribute("data-contar")) || 0;
    var formato = el.getAttribute("data-formato");
    var sufixo = el.getAttribute("data-sufixo") || "";
    var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduz) { el.textContent = formata(alvo, formato) + sufixo; return; }
    var dur = 1400, ini = null;
    function passo(ts) {
      if (ini === null) ini = ts;
      var p = Math.min((ts - ini) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = formata(alvo * e, formato) + sufixo;
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }
  var contadores = document.querySelectorAll("[data-contar]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { anima(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    contadores.forEach(function (c) { io.observe(c); });
  } else {
    contadores.forEach(function (c) {
      c.textContent = formata(parseFloat(c.getAttribute("data-contar")) || 0, c.getAttribute("data-formato")) + (c.getAttribute("data-sufixo") || "");
    });
  }
})();
