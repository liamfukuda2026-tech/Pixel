/* Caraguá Pixel · montador de moradores e mural offline/estático (localStorage)
   Depende de: js/personagem.js (desenharMorador, aparenciaAleatoria, OFICIOS, OPCOES, PALETA, TRAJES)
   e opcionalmente js/main.js (window.mostrarAviso). */
(function () {
  'use strict';

  var STORAGE_LISTA = 'caragua_moradores_v1';
  var STORAGE_MEU = 'caragua_meu_id';
  var POR_PAGINA = 12;

  /* 15 Vereadores Oficiais do Dia 1 */
  var VEREADORES_DIA1 = [
    {
      id: 'ver-01', numero: 1, nome: 'Enzo', oficio: 'Pescador(a)', instagram: '',
      vereador: true, selo: '#01 Vereador',
      aparencia: { sexo: 'homem', corpo: 'normal', pele: 2, olhos: 'redondo', corOlhos: 0, sobrancelha: 'normal', boca: 'sorriso', corLabios: 0, barba: 'rala', marca: 'nenhuma', cabelo: 'curto', corCabelo: 1, baixo: 'calca', manga: 'comprida', camisa: 5, calca: 12, sapato: 1 }
    },
    {
      id: 'ver-02', numero: 2, nome: 'Marco', oficio: 'Professor(a)', instagram: '',
      vereador: true, selo: '#02 Vereador',
      aparencia: { sexo: 'homem', corpo: 'normal', pele: 1, olhos: 'redondo', corOlhos: 0, sobrancelha: 'grossa', boca: 'sorriso', corLabios: 0, barba: 'bigode', marca: 'oculos', cabelo: 'social', corCabelo: 2, baixo: 'calca', manga: 'comprida', camisa: 8, calca: 2, sapato: 0 }
    },
    {
      id: 'ver-03', numero: 3, nome: 'Chris', oficio: 'Médico(a)', instagram: '',
      vereador: true, selo: '#03 Vereador',
      aparencia: { sexo: 'homem', corpo: 'normal', pele: 0, olhos: 'grande', corOlhos: 2, sobrancelha: 'normal', boca: 'sorriso', corLabios: 0, barba: 'nenhuma', marca: 'oculos', cabelo: 'topete', corCabelo: 1, baixo: 'calca', manga: 'comprida', camisa: 0, calca: 8, sapato: 2 }
    },
    {
      id: 'ver-04', numero: 4, nome: 'Bruno', oficio: 'Fisioterapeuta', instagram: '',
      vereador: true, selo: '#04 Vereador',
      aparencia: { sexo: 'homem', corpo: 'robusto', pele: 3, olhos: 'feliz', corOlhos: 0, sobrancelha: 'grossa', boca: 'sorrisao', corLabios: 0, barba: 'cavanhaque', marca: 'nenhuma', cabelo: 'cacheado', corCabelo: 0, baixo: 'calca', manga: 'curta', camisa: 7, calca: 0, sapato: 2 }
    },
    {
      id: 'ver-05', numero: 5, nome: 'Vitória', oficio: 'Fisioterapeuta', instagram: '',
      vereador: true, selo: '#05 Vereadora',
      aparencia: { sexo: 'mulher', corpo: 'normal', pele: 2, olhos: 'cilios', corOlhos: 3, sobrancelha: 'fina', boca: 'sorriso', corLabios: 1, barba: 'nenhuma', marca: 'bochechas', cabelo: 'rabo', corCabelo: 2, baixo: 'calca', manga: 'curta', camisa: 7, calca: 0, sapato: 2 }
    },
    {
      id: 'ver-06', numero: 6, nome: 'Julia', oficio: 'Professor(a)', instagram: 'julia_silxo',
      vereador: true, selo: '👑 Prefeita · #06 Vereadora',
      aparencia: { sexo: 'mulher', corpo: 'normal', pele: 1, olhos: 'grande', corOlhos: 0, sobrancelha: 'fina', boca: 'sorriso', corLabios: 2, barba: 'nenhuma', marca: 'sardas', cabelo: 'franja', corCabelo: 3, baixo: 'saia', manga: 'comprida', camisa: 8, calca: 2, sapato: 1 }
    },
    {
      id: 'ver-07', numero: 7, nome: 'Mayck', oficio: 'Advogado(a)', instagram: '',
      vereador: true, selo: '#07 Vereador',
      aparencia: { sexo: 'homem', corpo: 'normal', pele: 4, olhos: 'redondo', corOlhos: 1, sobrancelha: 'normal', boca: 'neutra', corLabios: 0, barba: 'barba', marca: 'oculos', cabelo: 'social', corCabelo: 0, baixo: 'calca', manga: 'comprida', camisa: 1, calca: 1, sapato: 0 }
    },
    {
      id: 'ver-08', numero: 8, nome: 'Vinicius', oficio: 'Mecânico(a)', instagram: '',
      vereador: true, selo: '#08 Vereador',
      aparencia: { sexo: 'homem', corpo: 'robusto', pele: 3, olhos: 'redondo', corOlhos: 0, sobrancelha: 'grossa', boca: 'sorriso', corLabios: 0, barba: 'rala', marca: 'nenhuma', cabelo: 'raspado', corCabelo: 0, baixo: 'calca', manga: 'comprida', camisa: 9, calca: 9, sapato: 1 }
    },
    {
      id: 'ver-09', numero: 9, nome: 'Pedro', oficio: 'Salva-vidas', instagram: '',
      vereador: true, selo: '#09 Vereador',
      aparencia: { sexo: 'homem', corpo: 'normal', pele: 2, olhos: 'feliz', corOlhos: 4, sobrancelha: 'normal', boca: 'sorrisao', corLabios: 0, barba: 'nenhuma', marca: 'oculosSol', cabelo: 'topete', corCabelo: 4, baixo: 'short', manga: 'regata', camisa: 3, calca: 3, sapato: 2 }
    },
    {
      id: 'ver-10', numero: 10, nome: 'Wesley', oficio: 'Entregador(a)', instagram: '',
      vereador: true, selo: '#10 Vereador',
      aparencia: { sexo: 'homem', corpo: 'normal', pele: 5, olhos: 'redondo', corOlhos: 1, sobrancelha: 'normal', boca: 'aberta', corLabios: 0, barba: 'nenhuma', marca: 'nenhuma', cabelo: 'afro', corCabelo: 0, baixo: 'calca', manga: 'curta', camisa: 3, calca: 1, sapato: 0 }
    },
    {
      id: 'ver-11', numero: 11, nome: 'Breno', oficio: 'Engenheiro(a)', instagram: '',
      vereador: true, selo: '#11 Vereador',
      aparencia: { sexo: 'homem', corpo: 'normal', pele: 1, olhos: 'redondo', corOlhos: 2, sobrancelha: 'normal', boca: 'sorriso', corLabios: 0, barba: 'cavanhaque', marca: 'oculos', cabelo: 'curto', corCabelo: 1, baixo: 'calca', manga: 'comprida', camisa: 8, calca: 13, sapato: 1 }
    },
    {
      id: 'ver-12', numero: 12, nome: 'Vitor', oficio: 'Gari', instagram: '',
      vereador: true, selo: '#12 Vereador',
      aparencia: { sexo: 'homem', corpo: 'normal', pele: 4, olhos: 'feliz', corOlhos: 0, sobrancelha: 'grossa', boca: 'sorrisao', corLabios: 0, barba: 'bigode', marca: 'nenhuma', cabelo: 'curto', corCabelo: 0, baixo: 'calca', manga: 'comprida', camisa: 4, calca: 4, sapato: 1 }
    },
    {
      id: 'ver-13', numero: 13, nome: 'Francesco', oficio: 'Entregador(a)', instagram: '',
      vereador: true, selo: '#13 Vereador · tele-entrega',
      aparencia: { sexo: 'homem', corpo: 'normal', pele: 0, olhos: 'redondo', corOlhos: 3, sobrancelha: 'normal', boca: 'sorriso', corLabios: 0, barba: 'rala', marca: 'pinta', cabelo: 'cacheado', corCabelo: 2, baixo: 'calca', manga: 'curta', camisa: 3, calca: 1, sapato: 0 }
    },
    {
      id: 'ver-14', numero: 14, nome: 'Artur', oficio: 'Salva-vidas', instagram: '',
      vereador: true, selo: '#14 Vereador',
      aparencia: { sexo: 'homem', corpo: 'robusto', pele: 3, olhos: 'grande', corOlhos: 0, sobrancelha: 'grossa', boca: 'sorriso', corLabios: 0, barba: 'barba', marca: 'nenhuma', cabelo: 'moicano', corCabelo: 1, baixo: 'short', manga: 'regata', camisa: 3, calca: 3, sapato: 2 }
    },
    {
      id: 'ver-15', numero: 15, nome: 'Erick', oficio: 'Policial', instagram: '',
      vereador: true, selo: '#15 Vereador',
      aparencia: { sexo: 'homem', corpo: 'normal', pele: 2, olhos: 'redondo', corOlhos: 1, sobrancelha: 'brava', boca: 'neutra', corLabios: 0, barba: 'nenhuma', marca: 'oculosSol', cabelo: 'raspado', corCabelo: 0, baixo: 'calca', manga: 'curta', camisa: 9, calca: 9, sapato: 0 }
    }
  ];

  function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function normTexto(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function avisar(texto) {
    if (typeof window.mostrarAviso === 'function') {
      window.mostrarAviso(texto);
      return;
    }
    var el = document.querySelector('.aviso');
    if (!el) return;
    el.textContent = texto;
    el.classList.add('visivel');
    clearTimeout(avisar._t);
    avisar._t = setTimeout(function () { el.classList.remove('visivel'); }, 3200);
  }

  function carregarCustom() {
    try {
      var raw = localStorage.getItem(STORAGE_LISTA);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function salvarCustom(lista) {
    try {
      localStorage.setItem(STORAGE_LISTA, JSON.stringify(lista));
    } catch (e) { /* storage cheio/indisponível */ }
  }

  function pegarMeuId() {
    try { return localStorage.getItem(STORAGE_MEU) || ''; } catch (e) { return ''; }
  }

  function salvarMeuId(id) {
    try { localStorage.setItem(STORAGE_MEU, id); } catch (e) { /* noop */ }
  }

  /* ───────── Estado do montador ───────── */
  var form = document.querySelector('.montador');
  if (!form || typeof desenharMorador !== 'function') return;

  var canvasPrevia = form.querySelector('.previa');
  var placaNome = form.querySelector('.placa-nome');
  var placaOficio = form.querySelector('.placa-oficio');
  var boxOficios = form.querySelector('.oficios');
  var paineisAbas = form.querySelector('.paineis-abas');
  var botoesSexo = form.querySelectorAll('.aba-sexo');
  var botoesAba = form.querySelectorAll('.aba');
  var inputNome = form.querySelector('#nome');
  var inputInsta = form.querySelector('#instagram');
  var erroForm = form.querySelector('.erro-form');
  var btnSortear = form.querySelector('.sortear');
  var btnBaixar = form.querySelector('.baixar');

  var estado = {
    oficio: OFICIOS[0].id,
    aba: 'corpo',
    aparencia: aparenciaAleatoria('homem')
  };

  var listaCustom = carregarCustom();
  var meuId = pegarMeuId();
  var recemId = '';
  var limiteVisivel = POR_PAGINA;

  /* ───────── Renderização do montador ───────── */
  function oficioAtual() {
    return acharOficio(estado.oficio);
  }

  function renderPrevia() {
    desenharMorador(canvasPrevia, estado.aparencia, 6, estado.oficio);
    var nome = (inputNome.value || '').trim();
    placaNome.textContent = nome || 'Seu nome';
    placaOficio.textContent = rotuloOficio(estado.oficio, estado.aparencia.sexo);
  }

  function montarOficios() {
    boxOficios.innerHTML = '';
    OFICIOS.forEach(function (of) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'oficio' + (of.id === estado.oficio ? ' ativo' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', of.id === estado.oficio ? 'true' : 'false');
      btn.dataset.oficio = of.id;

      var mini = document.createElement('canvas');
      mini.className = 'mini';
      mini.width = 40;
      mini.height = 44;
      desenharMorador(mini, estado.aparencia, 1, of.id);

      var sp = document.createElement('span');
      sp.textContent = rotuloOficio(of.id, estado.aparencia.sexo);

      btn.appendChild(mini);
      btn.appendChild(sp);
      btn.addEventListener('click', function () {
        estado.oficio = of.id;
        atualizarBotoesOficio();
        renderPrevia();
        renderAba();
      });
      boxOficios.appendChild(btn);
    });
  }

  function atualizarBotoesOficio() {
    var btns = boxOficios.querySelectorAll('.oficio');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var on = b.dataset.oficio === estado.oficio;
      b.classList.toggle('ativo', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      var mini = b.querySelector('canvas');
      if (mini) desenharMorador(mini, estado.aparencia, 1, b.dataset.oficio);
      var sp = b.querySelector('span');
      if (sp) sp.textContent = rotuloOficio(b.dataset.oficio, estado.aparencia.sexo);
    }
  }

  function renderAba() {
    paineisAbas.innerHTML = '';
    var grupos = OPCOES[estado.aba] || [];
    var tr = TRAJES[estado.oficio] || TRAJES.morador;
    var uniforme = tr.camisa != null;

    if (estado.aba === 'roupa' && uniforme) {
      var nota = document.createElement('p');
      nota.className = 'aviso-teste';
      nota.textContent = oficioAtual().nome + ' usa uniforme próprio (' + tr.desc + '). Você ainda pode escolher o sapato ou trocar para Morador(a) para vestir livremente.';
      paineisAbas.appendChild(nota);
    }

    grupos.forEach(function (g) {
      if (g.chave === 'barba' && estado.aparencia.sexo === 'mulher') return;
      if (estado.aba === 'roupa' && uniforme && g.chave !== 'sapato') return;

      var wrap = document.createElement('div');
      wrap.className = 'grupo';

      var tit = document.createElement('p');
      tit.className = 'rotulo';
      tit.textContent = g.rotulo;
      wrap.appendChild(tit);

      if (g.tipo === 'cor') {
        var boxCor = document.createElement('div');
        boxCor.className = 'amostras';
        g.valores.forEach(function (item, idx) {
          var btn = document.createElement('button');
          btn.type = 'button';
          var ativo = estado.aparencia[g.chave] === idx;
          btn.className = 'amostra' + (ativo ? ' ativo' : '');
          btn.style.backgroundColor = item.c;
          btn.title = item.nome;
          btn.setAttribute('aria-label', g.rotulo + ': ' + item.nome);
          btn.setAttribute('aria-pressed', ativo ? 'true' : 'false');
          btn.addEventListener('click', function () {
            estado.aparencia[g.chave] = idx;
            renderPrevia();
            atualizarBotoesOficio();
            renderAba();
          });
          boxCor.appendChild(btn);
        });
        wrap.appendChild(boxCor);
      } else {
        var boxOp = document.createElement('div');
        boxOp.className = 'opcoes minis';
        g.valores.forEach(function (item) {
          var btn = document.createElement('button');
          btn.type = 'button';
          var ativo = estado.aparencia[g.chave] === item.id;
          btn.className = 'opcao' + (ativo ? ' ativo' : '');
          btn.setAttribute('aria-pressed', ativo ? 'true' : 'false');

          var mini = document.createElement('canvas');
          mini.className = 'mini';
          var apTeste = clonar(estado.aparencia);
          apTeste[g.chave] = item.id;
          var recorte = (estado.aba === 'rosto' || estado.aba === 'cabelo')
            ? { x: 6, y: 0, w: 28, h: 22 }
            : { x: 0, y: 0, w: 40, h: 44 };
          desenharMorador(mini, apTeste, 2, estado.oficio, recorte);

          var sp = document.createElement('span');
          sp.textContent = item.nome;

          btn.appendChild(mini);
          btn.appendChild(sp);
          btn.addEventListener('click', function () {
            estado.aparencia[g.chave] = item.id;
            renderPrevia();
            atualizarBotoesOficio();
            renderAba();
          });
          boxOp.appendChild(btn);
        });
        wrap.appendChild(boxOp);
      }

      paineisAbas.appendChild(wrap);
    });
  }

  for (var i = 0; i < botoesSexo.length; i++) {
    botoesSexo[i].addEventListener('click', function () {
      var s = this.dataset.sexo;
      if (estado.aparencia.sexo === s) return;
      estado.aparencia.sexo = s;
      if (s === 'mulher') {
        estado.aparencia.barba = 'nenhuma';
        if (['curto', 'raspado', 'moicano', 'careca'].indexOf(estado.aparencia.cabelo) !== -1) {
          estado.aparencia.cabelo = 'longo';
        }
      } else {
        if (['longo', 'franja', 'rabo', 'coque', 'bob'].indexOf(estado.aparencia.cabelo) !== -1) {
          estado.aparencia.cabelo = 'curto';
        }
      }
      for (var j = 0; j < botoesSexo.length; j++) {
        var on = botoesSexo[j].dataset.sexo === s;
        botoesSexo[j].setAttribute('aria-checked', on ? 'true' : 'false');
        botoesSexo[j].classList.toggle('ativo', on);
      }
      atualizarBotoesOficio();
      renderPrevia();
      renderAba();
    });
  }
  if (botoesSexo[0]) botoesSexo[0].classList.add('ativo');

  for (var a = 0; a < botoesAba.length; a++) {
    botoesAba[a].addEventListener('click', function () {
      estado.aba = this.dataset.aba;
      for (var k = 0; k < botoesAba.length; k++) {
        botoesAba[k].classList.toggle('ativa', botoesAba[k] === this);
      }
      renderAba();
    });
  }

  inputNome.addEventListener('input', function () {
    erroForm.textContent = '';
    inputNome.classList.remove('invalido');
    renderPrevia();
  });

  btnSortear.addEventListener('click', function () {
    estado.aparencia = aparenciaAleatoria(estado.aparencia.sexo);
    atualizarBotoesOficio();
    renderPrevia();
    renderAba();
  });

  btnBaixar.addEventListener('click', function () {
    var nomeArq = (inputNome.value || 'morador').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-') || 'morador';
    var url = canvasPrevia.toDataURL('image/png');
    var link = document.createElement('a');
    link.download = 'caragua-pixel-' + nomeArq + '.png';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    avisar('PNG do seu morador baixado!');
  });

  /* ───────── Mural e filtros ───────── */
  var muralEl = document.querySelector('.mural');
  var muralTotalEl = document.querySelector('.mural-total');
  var muralVazioEl = document.querySelector('.mural-vazio');
  var buscaEl = document.querySelector('.busca');
  var filtroOficioEl = document.querySelector('.filtro-oficio');
  var btnVerMais = document.querySelector('.ver-mais');

  function popularFiltroOficios() {
    if (!filtroOficioEl) return;
    OFICIOS.forEach(function (of) {
      var opt = document.createElement('option');
      opt.value = of.id;
      opt.textContent = of.nome;
      filtroOficioEl.appendChild(opt);
    });
  }

  var VEREADORES_OFICIAIS = Array.isArray(window.VEREADORES_OFICIAIS) ? window.VEREADORES_OFICIAIS : [];
  for (var vIdx = 0; vIdx < VEREADORES_DIA1.length; vIdx++) {
    if (!VEREADORES_DIA1[vIdx].instagram && VEREADORES_OFICIAIS[vIdx] && VEREADORES_OFICIAIS[vIdx].h) {
      VEREADORES_DIA1[vIdx].instagram = String(VEREADORES_OFICIAIS[vIdx].h).replace(/^@+/, '');
    }
  }

  var OFICIAL_HANDLES = new Set();
  for (var oh = 0; oh < VEREADORES_DIA1.length; oh++) {
    if (VEREADORES_DIA1[oh].instagram) OFICIAL_HANDLES.add(VEREADORES_DIA1[oh].instagram.toLowerCase());
  }

  var dadosPublicosCache = null;

  function hashTextoMorador(str) {
    var h = 2166136261;
    var s = String(str || '');
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function pareceMulher(t) {
    var s = normTexto(t);
    var femRe = /(^|[^a-z])(medica|dona|professora|delegada|juiza|enfermeira|arquiteta|moradora|bombeira|cozinheira|confeiteira|costureira|bancaria|quimica|veterinaria|tatuadora|agronoma|cabeleireira|advogada|adevogada|bibliotecaria|perita|nail|mae|operadora|vendedora|caixa|atentende|dentista pediatra|policial feminina)([^a-z]|$)/;
    if (femRe.test(s)) return true;
    var m = s.match(/[a-z]+/);
    var nome = m ? m[0] : '';
    var nomesF = ['yasmin','raquel','evellyne','jheniffer','kemilly','lary','yngrid','michele','suzane','lidiane','hevillyn','isabel','thais','carol','emilly','arielly','fabielly','grazi','jazz','evelyn','karoll','kelly','daiane','tati','gabi','julia','vitoria','maria','anna','ana','beatriz','bianca','carla','rebeka','lavinha','barbara','miya','leticia','gabriela','helena','clara','laura','eduarda','andrea','mariana','tayna','rafaela','natalia','camila','amanda','fernanda'];
    if (nomesF.indexOf(nome) >= 0) return true;
    var naoF = ['serralheria','eletricista','motorista','phmidia','sts','juca','luca'];
    return nome.length > 2 && nome.charAt(nome.length - 1) === 'a' && naoF.indexOf(nome) < 0 && !/ista$/.test(nome);
  }

  function inferirOficio(t, k) {
    if (k === 'camara') return 'Vereador(a)';
    if (k === 'uber') return 'Entregador(a)';
    var s = normTexto(t);
    if (/pescad/.test(s)) return 'Pescador(a)';
    if (/salva.?vid/.test(s)) return 'Salva-vidas';
    if (/professor/.test(s)) return 'Professor(a)';
    if (/(^|[^a-z])medic[oa]([^a-z]|$)|ginecologista/.test(s)) return 'Médico(a)';
    if (/fisioterap/.test(s)) return 'Fisioterapeuta';
    if (/advogad|adevogad/.test(s)) return 'Advogado(a)';
    if (/mecanic|macanic/.test(s)) return 'Mecânico(a)';
    if (/moto.?boy|entregador|tele.?entrega/.test(s)) return 'Entregador(a)';
    if (/engenheir/.test(s)) return 'Engenheiro(a)';
    if (/(^|[^a-z])gari([^a-z]|$)/.test(s)) return 'Gari';
    if (/polic|delegad|bope|gcm|guardinha|xerife|cherife/.test(s)) return 'Policial';
    if (/comerciant|mercado|loja|restaurante|panificadora|hamburgueria|acougue|barbeir/.test(s)) return 'Comerciante';
    if (/vereador/.test(s)) return 'Vereador(a)';
    return 'Morador(a)';
  }

  function extrairNomeComentario(t, handle) {
    var bruto = String(t || '').trim();
    if (!bruto) return '@' + handle;
    var limpo = bruto
      .replace(/^(meu nome [eé]|nome\s*:|eu sou|quero ser|morador\(a\)? n[º°\.]?\s*\d+[,:\s]*)/i, '')
      .trim();
    var parte = limpo.split(/[,\/\-:(·]/)[0].trim();
    if (parte.length >= 2 && parte.length <= 24) return parte;
    return bruto.slice(0, 24).trim() || ('@' + handle);
  }

  function gerarAparenciaDeterministica(chave, fem) {
    var seed = hashTextoMorador(chave) || 1;
    function rnd() {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    function pick(arr) { return arr[Math.floor(rnd() * arr.length) % arr.length]; }
    var idsH = ['curto', 'topete', 'social', 'raspado', 'moicano', 'cacheado', 'afro', 'curto', 'topete', 'careca'];
    var idsM = ['bob', 'longo', 'franja', 'rabo', 'coque', 'cacheado', 'afro', 'longo', 'bob', 'curto'];
    var marcas = ['nenhuma', 'nenhuma', 'nenhuma', 'sardas', 'bochechas', 'oculos', 'oculosSol', 'pinta'];
    var olhosH = ['redondo', 'redondo', 'grande', 'feliz', 'sono'];
    var olhosM = ['redondo', 'cilios', 'cilios', 'grande', 'feliz'];
    return {
      sexo: fem ? 'mulher' : 'homem',
      corpo: rnd() < 0.22 ? 'robusto' : 'normal',
      pele: Math.floor(rnd() * PALETA.pele.length),
      olhos: pick(fem ? olhosM : olhosH),
      corOlhos: Math.floor(rnd() * PALETA.olhos.length),
      sobrancelha: pick(['normal', 'normal', 'grossa', 'fina', 'brava']),
      boca: pick(['sorriso', 'sorriso', 'neutra', 'aberta', 'sorrisao']),
      corLabios: fem ? pick([0, 1, 2, 3, 4]) : 0,
      barba: fem ? 'nenhuma' : pick(['nenhuma', 'nenhuma', 'nenhuma', 'rala', 'bigode', 'cavanhaque', 'barba']),
      marca: pick(marcas),
      cabelo: pick(fem ? idsM : idsH),
      corCabelo: rnd() < 0.8 ? Math.floor(rnd() * 8) : Math.floor(rnd() * PALETA.cabelo.length),
      baixo: fem ? pick(['calca', 'saia', 'saia', 'short']) : pick(['calca', 'calca', 'short']),
      manga: pick(['curta', 'curta', 'comprida', 'regata']),
      camisa: Math.floor(rnd() * PALETA.roupa.length),
      calca: pick([1, 2, 9, 12, 13, 13, 1]),
      sapato: Math.floor(rnd() * PALETA.sapato.length)
    };
  }

  function obterMoradoresCidade() {
    if (dadosPublicosCache) return dadosPublicosCache;
    var fonte = Array.isArray(window.JOGO_DADOS) ? window.JOGO_DADOS : [];
    var out = [];
    var vistos = new Set(OFICIAL_HANDLES);
    for (var i = 0; i < fonte.length; i++) {
      var d = fonte[i];
      if (!d || d.oculto) continue;
      var handle = String(d.h || '').replace(/^@+/, '').trim();
      var handleKey = handle.toLowerCase();
      if (!handle || vistos.has(handleKey)) continue;
      vistos.add(handleKey);
      var fem = pareceMulher(d.t || '');
      out.push({
        id: 'cid-' + i,
        nome: extrairNomeComentario(d.t, handle),
        oficio: inferirOficio(d.t, d.k),
        descricao: String(d.t || '').slice(0, 72),
        instagram: handle,
        selo: d.novo ? '🆕 Novo morador' : (d.k === 'uber' ? '🚕 Uber' : ''),
        aparencia: gerarAparenciaDeterministica(handle + '|' + (d.t || ''), fem)
      });
    }
    dadosPublicosCache = out;
    return dadosPublicosCache;
  }

  function todosMoradores() {
    var lista = [];
    var customHandles = new Set();
    for (var i = listaCustom.length - 1; i >= 0; i--) {
      lista.push(listaCustom[i]);
      if (listaCustom[i].instagram) {
        customHandles.add(String(listaCustom[i].instagram).replace(/^@+/, '').toLowerCase());
      }
    }
    for (var j = 0; j < VEREADORES_DIA1.length; j++) {
      lista.push(VEREADORES_DIA1[j]);
    }
    var daCidade = obterMoradoresCidade();
    for (var k = 0; k < daCidade.length; k++) {
      var m = daCidade[k];
      if (m.instagram && customHandles.has(m.instagram.toLowerCase())) continue;
      lista.push(m);
    }
    return lista;
  }

  function renderMural() {
    if (!muralEl) return;
    var todos = todosMoradores();
    var q = normTexto(buscaEl ? buscaEl.value : '');
    var ofFiltro = filtroOficioEl ? filtroOficioEl.value : '';

    var filtrados = todos.filter(function (m) {
      if (ofFiltro) {
        var ofM = acharOficio(m.oficio).id;
        if (ofM !== ofFiltro) return false;
      }
      if (q) {
        var alvo = normTexto(m.nome + ' ' + (m.instagram || '') + ' ' + m.oficio + ' ' + (m.descricao || ''));
        if (alvo.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (muralTotalEl) {
      var nCustom = listaCustom.length;
      muralTotalEl.textContent = todos.length.toLocaleString('pt-BR') + ' moradores públicos no mural · Prefeita Julia + 15 vereadores oficiais' +
        (nCustom > 0 ? (' + ' + nCustom + (nCustom === 1 ? ' criado por você' : ' criados por você')) : '');
    }

    muralEl.innerHTML = '';
    if (filtrados.length === 0) {
      if (muralVazioEl) {
        muralVazioEl.hidden = false;
        muralVazioEl.textContent = 'Nenhum morador encontrado com esse filtro.';
      }
      if (btnVerMais) btnVerMais.hidden = true;
      return;
    }

    if (muralVazioEl) muralVazioEl.hidden = true;
    var visiveis = filtrados.slice(0, limiteVisivel);

    visiveis.forEach(function (m) {
      var card = document.createElement('article');
      var ehMeu = Boolean(meuId && m.id === meuId);
      var ehRecem = Boolean(recemId && m.id === recemId);
      card.className = 'morador card' + (ehMeu ? ' e-meu' : '') + (ehRecem ? ' recem-chegado' : '');

      if (ehMeu) {
        var selo = document.createElement('span');
        selo.className = 'selo-voce';
        selo.textContent = 'Você';
        card.appendChild(selo);
      } else if (m.selo) {
        var seloV = document.createElement('span');
        seloV.className = 'selo-voce';
        seloV.textContent = m.selo;
        card.appendChild(seloV);
      }

      var sprite = document.createElement('canvas');
      sprite.className = 'morador-sprite';
      sprite.width = 120;
      sprite.height = 132;
      sprite.setAttribute('aria-label', m.nome);
      desenharMorador(sprite, m.aparencia, 3, m.oficio);
      card.appendChild(sprite);

      var nomeEl = document.createElement('h3');
      nomeEl.textContent = m.nome;
      card.appendChild(nomeEl);

      var ofEl = document.createElement('p');
      ofEl.className = 'morador-oficio';
      ofEl.textContent = m.descricao || rotuloOficio(m.oficio, m.aparencia && m.aparencia.sexo);
      card.appendChild(ofEl);

      if (m.instagram) {
        var insta = m.instagram.replace(/^@+/, '');
        if (insta) {
          var link = document.createElement('a');
          link.className = 'morador-insta';
          link.href = 'https://www.instagram.com/' + encodeURIComponent(insta) + '/';
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = '@' + insta;
          card.appendChild(link);
        }
      }

      muralEl.appendChild(card);
    });

    if (btnVerMais) {
      var temMais = filtrados.length > limiteVisivel;
      btnVerMais.hidden = !temMais;
      if (temMais) {
        btnVerMais.textContent = 'Ver mais moradores (' + (filtrados.length - limiteVisivel) + ')';
      }
    }
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var nome = (inputNome.value || '').trim();
    if (nome.length < 2) {
      erroForm.textContent = 'Digite um nome com pelo menos 2 letras para entrar no mural.';
      inputNome.classList.add('invalido');
      inputNome.focus();
      return;
    }

    var insta = (inputInsta.value || '').trim().replace(/^@+/, '').replace(/\s+/g, '');
    var novoId = 'mor-' + Date.now();
    var registro = {
      id: novoId,
      nome: nome,
      oficio: oficioAtual().nome,
      instagram: insta,
      aparencia: clonar(estado.aparencia),
      criadoEm: new Date().toISOString()
    };

    listaCustom.push(registro);
    salvarCustom(listaCustom);
    meuId = novoId;
    recemId = novoId;
    salvarMeuId(meuId);

    erroForm.textContent = '';
    limiteVisivel = Math.max(limiteVisivel, POR_PAGINA);
    renderMural();

    var muralSecao = document.getElementById('mural');
    if (muralSecao) muralSecao.scrollIntoView({ behavior: 'smooth', block: 'start' });
    avisar(nome + ' entrou no mural de Caraguá Pixel!');
  });

  if (buscaEl) {
    buscaEl.addEventListener('input', function () {
      limiteVisivel = POR_PAGINA;
      renderMural();
    });
  }
  if (filtroOficioEl) {
    filtroOficioEl.addEventListener('change', function () {
      limiteVisivel = POR_PAGINA;
      renderMural();
    });
  }
  if (btnVerMais) {
    btnVerMais.addEventListener('click', function () {
      limiteVisivel += POR_PAGINA;
      renderMural();
    });
  }

  /* Inicialização */
  montarOficios();
  renderPrevia();
  renderAba();
  popularFiltroOficios();
  renderMural();
})();
