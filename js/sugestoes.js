(function () {
  'use strict';
  var CHAVE = 'caragua_cartas_v1';
  var DM = 'https://www.instagram.com/caraguapixel/';
  var form = document.getElementById('formCarta');
  if (!form) return;
  var msg = document.getElementById('mensagem');
  var autor = document.getElementById('autor');
  var aceite = document.getElementById('aceite');
  var erro = document.getElementById('erroCarta');
  var contador = document.getElementById('contador');
  var resposta = document.getElementById('resposta');
  var recentes = document.getElementById('recentes');
  var lista = document.getElementById('listaCartas');
  var abrirDM = document.getElementById('abrirDM');

  function obterUrlDm() {
    var attr = abrirDM && abrirDM.getAttribute('data-ig-dm');
    return attr || (window.CONFIG && window.CONFIG.instagram) || DM;
  }

  function aviso(t) {
    var el = document.querySelector('.aviso');
    if (!el) return;
    el.textContent = t;
    el.classList.add('mostra', 'ativo');
    setTimeout(function () { el.classList.remove('mostra', 'ativo'); }, 2800);
  }

  function ler() {
    try { var v = JSON.parse(localStorage.getItem(CHAVE)); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function gravar(l) {
    try { localStorage.setItem(CHAVE, JSON.stringify(l.slice(0, 20))); } catch (e) {}
  }

  function tema() {
    var r = form.querySelector('input[name="tema"]:checked');
    return r ? r.value : 'História';
  }
  function setTema(t) {
    var rs = form.querySelectorAll('input[name="tema"]');
    for (var i = 0; i < rs.length; i++) {
      if (rs[i].value.toLowerCase() === String(t).toLowerCase()) { rs[i].checked = true; return; }
    }
  }

  function render() {
    var l = ler();
    lista.innerHTML = '';
    recentes.hidden = l.length === 0;
    l.slice(0, 5).forEach(function (c) {
      var li = document.createElement('li');
      var d = new Date(c.data).toLocaleDateString('pt-BR');
      var txt = c.mensagem.length > 90 ? c.mensagem.slice(0, 90) + '…' : c.mensagem;
      li.textContent = '[' + c.tema + '] ' + txt + ' (' + d + ')';
      lista.appendChild(li);
    });
  }

  function copiar(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto);
    }
    return new Promise(function (ok, no) {
      try {
        var ta = document.createElement('textarea');
        ta.value = texto; document.body.appendChild(ta); ta.select();
        var r = document.execCommand('copy'); document.body.removeChild(ta);
        r ? ok() : no();
      } catch (e) { no(e); }
    });
  }

  msg.addEventListener('input', function () { contador.textContent = msg.value.length; });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var texto = msg.value.trim();
    erro.hidden = true;
    if (texto.length < 10) { erro.textContent = 'Escreva uma carta com pelo menos 10 caracteres.'; erro.hidden = false; msg.focus(); return; }
    if (!aceite.checked) { erro.textContent = 'Marque o aceite para enviar sua carta.'; erro.hidden = false; return; }

    var carta = { tema: tema(), autor: autor.value.trim(), mensagem: texto, data: new Date().toISOString() };
    var l = ler(); l.unshift(carta); gravar(l);

    var pacote = 'Carta à Caraguá Pixel\nTema: ' + carta.tema + (carta.autor ? '\nDe: ' + carta.autor : '') + '\n\n' + carta.mensagem;
    copiar(pacote).then(function () { aviso('Carta copiada! Cole na DM da @caraguapixel.'); },
                        function () { aviso('Carta guardada. Copie o texto manualmente.'); });
    if (abrirDM) {
      abrirDM.href = obterUrlDm();
      abrirDM.rel = 'noopener noreferrer nofollow';
    }
    form.hidden = true;
    resposta.hidden = false;
    render();
  });

  abrirDM.addEventListener('click', function () {
    var c = ler()[0];
    if (c) copiar('Carta à Caraguá Pixel\nTema: ' + c.tema + (c.autor ? '\nDe: ' + c.autor : '') + '\n\n' + c.mensagem).catch(function () {});
  });

  document.getElementById('outra').addEventListener('click', function () {
    form.reset();
    contador.textContent = '0';
    resposta.hidden = true;
    form.hidden = false;
    msg.focus();
  });

  var q = new URLSearchParams(location.search).get('tema');
  if (q) setTema(q);
  render();
})();
