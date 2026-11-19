(function () {
  'use strict';

  var VEREADORES = [['Enzo','pescador'],['Marco','professor'],['Chris','médico'],['Bruno','fisioterapeuta'],['Vitória','fisioterapeuta'],['Julia','professora'],['Mayck','advogado'],['Vinicius','mecânico'],['Pedro','salva-vidas'],['Wesley','entregador'],['Breno','engenheiro civil'],['Vitor','gari'],['Francesco','tele-entrega'],['Artur','salva-vidas'],['Erick','policial']];

  var LUGARES = [
    { id: 'praca', name: 'Praça de Natal', x: 147, y: 190, kind: 'new', tag: 'NOVO NA CIDADE', ep: 'Especial de Natal · em breve', lore: 'lore.html#ep05', text: 'O coração de Caraguá Pixel. A maior árvore de Natal da cidade fica acesa toda noite, com presentes embaixo, luzinhas em todas as árvores da praça e o arco vermelho na entrada. É aqui que os moradores se encontram depois do trabalho.' },
    { id: 'camara', name: 'Câmara Municipal', x: 75, y: 178, kind: 'place', tag: 'LUGAR DA CIDADE', ep: 'Dia 1 · A cidade vazia', lore: 'lore.html#ep02', text: 'Os 15 primeiros moradores que comentaram nome e profissão viraram vereadores. Cada um tem uma cadeira no plenário e um projeto por semana para defender.', people: VEREADORES.map(function (p, i) { return [i + 1, p[0], p[1]]; }), note: 'Lista provisória: ainda depende da enquete sobre profissões de crime.' },
    { id: 'prefeitura', name: 'Prefeitura', x: 148, y: 258, kind: 'place', tag: 'PREFEITA ELEITA', ep: 'Prefeita: Julia', lore: 'lore.html#ep07', text: 'Com 1.149 moradores na cidade, @julia_silxo assumiu o trono da Prefeitura como Prefeita de Caraguá Pixel!' },
    { id: 'forum', name: 'Fórum', x: 75, y: 258, kind: 'place', tag: 'LUGAR DA CIDADE', ep: 'Ainda não apareceu', lore: 'lore.html#ep03', text: 'Onde a cidade resolve as brigas. Tem vaga para advogado, juiz, promotor e defensor. O primeiro caso ainda não chegou.' },
    { id: 'escola', name: 'Escola e quadra', x: 74, y: 92, kind: 'place', tag: 'LUGAR DA CIDADE', ep: 'Dia 1 · A cidade vazia', lore: 'lore.html#ep03', text: 'A primeira escola da cidade, com quadra coberta do lado. Os professores que comentaram no Dia 1 dão aula aqui.' },
    { id: 'upa', name: 'Hospital e UPA 24h', x: 147, y: 90, kind: 'place', tag: 'LUGAR DA CIDADE', ep: 'Saúde 24h', lore: 'lore.html#ep07', text: 'Agora com Hospital Municipal de 4 andares (heliponto no teto e ambulância) além da UPA 24h! Médicos, enfermeiros e fisioterapeutas da cidade atendem aqui.' },
    { id: 'comercio', name: 'Galeria & Boulevard', x: 75, y: 346, kind: 'place', tag: '12 VAGAS ABERTAS', ep: '12 lojas ALUGA-SE', lore: 'lore.html#ep04', text: 'São 12 lojas disponíveis com placa de ALUGA-SE: 8 na Galeria Pixel e 4 no Boulevard da Praia (ao lado de Pizzaria Bella Caragua, Pixel Burger, Yakisoba Caiçara e Temakeria Sol Nascente). Empresário: mande o CNPJ, o nome da loja e o @ na DM da @caraguapixel.' },
    { id: 'predios', name: 'Prédios da orla', x: 148, y: 372, kind: 'place', tag: 'LUGAR DA CIDADE', ep: 'Ainda não apareceu', lore: 'lore.html#ep03', text: 'Seis prédios de frente pro mar, onde mora a maior parte da cidade. Cada janela acesa é um morador, e quem enfeitou a varanda já colocou o pisca-pisca.' },
    { id: 'praia', name: 'Praia e salva-vidas', x: 204, y: 326, kind: 'place', tag: 'LUGAR DA CIDADE', ep: 'Dia 1 · A cidade vazia', lore: 'lore.html#ep03', text: 'A orla inteira da cidade, com o posto de salva-vidas no meio. Dois vereadores trabalham aqui: Pedro e Artur.' },
    { id: 'porto', name: 'Mar dos pescadores', x: 234, y: 398, kind: 'place', tag: 'LUGAR DA CIDADE', ep: 'Dia 1 · A cidade vazia', lore: 'lore.html#ep01', text: 'O barco sai antes do sol nascer. O primeiro vereador da cidade, Enzo, é pescador.' },
    { id: 'obras', name: 'Bairro Novo & Expansão', x: 75, y: 426, kind: 'new', tag: 'GRANDE EXPANSÃO', ep: '1.149 moradores', lore: 'lore.html#ep07', text: 'A cidade cresceu para 1.149 moradores (136 quarteirões) e inaugurou o Shopping Caragua Pixel (com cinema e praça de alimentação), o Parque de Diversões com Roda-Gigante e Carreta da Alegria na praia, a Pixel Motors, o Boulevard da Praia e a Academia Pixel Fit!' },
    { id: 'morro', name: 'Morro Santo Antônio', x: 18, y: 56, kind: 'mystery', tag: 'MISTÉRIO', ep: '?', lore: 'lore.html#ep07', text: 'Dá para ver uma luz piscando lá em cima toda noite. Nenhum morador subiu ainda.' },
    { id: 'ilha', name: 'A ilha do outro lado', x: 256, y: 196, kind: 'mystery', tag: 'MISTÉRIO', ep: '?', lore: 'lore.html#ep07', text: 'Do outro lado do canal. Ninguém da cidade atravessou, e ninguém sabe quem mora lá.' }
  ];

  var CLS = { place: 'conhecido', 'new': 'novo', mystery: 'misterio' };
  var ICON = { place: '■', 'new': '★', mystery: '?' };

  function $(id) { return document.getElementById(id); }
  var pinos = $('pinos'), mapbox = $('mapbox'), painel = $('painel'), zoomBtn = $('zoom');
  if (!pinos || !painel) return;

  var pinEls = {}, chipEls = {}, current = null, timer = null;

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  LUGARES.forEach(function (p) {
    var pin = el('button', 'pino ' + CLS[p.kind]);
    pin.type = 'button';
    pin.dataset.id = p.id;
    pin.style.left = (p.x / 270 * 100) + '%';
    pin.style.top = (p.y / 480 * 100) + '%';
    if (p.x / 270 < 0.22) pin.classList.add('borda-esq');
    if (p.x / 270 > 0.78) pin.classList.add('borda-dir');
    pin.setAttribute('aria-label', p.name);
    pin.appendChild(el('span', 'pino-icone', ICON[p.kind]));
    pin.appendChild(el('span', 'pino-nome', p.name));
    pin.addEventListener('click', function () { select(p.id, true); });
    pinos.appendChild(pin);
    pinEls[p.id] = pin;

    var chip = el('button', 'botao-lugar ' + CLS[p.kind], p.name);
    chip.type = 'button';
    chip.dataset.id = p.id;
    chip.addEventListener('click', function () { select(p.id, true); });
    var box = $(p.kind === 'place' ? 'chipsPlaces' : p.kind === 'new' ? 'chipsNew' : 'chipsMyst');
    if (box) box.appendChild(chip);
    chipEls[p.id] = chip;
  });

  function center(id) {
    var p = pinEls[id];
    if (!p || !mapbox.classList.contains('zoomed')) return;
    var left = p.offsetLeft - mapbox.clientWidth / 2;
    var top = p.offsetTop - mapbox.clientHeight / 2;
    if (mapbox.scrollTo) mapbox.scrollTo({ left: left, top: top, behavior: 'smooth' });
    else { mapbox.scrollLeft = left; mapbox.scrollTop = top; }
  }

  function render(p) {
    $('shot').src = 'img/' + p.id + '.jpg';
    $('shot').alt = p.name;
    $('tag').textContent = p.tag;
    $('name').textContent = p.name;
    $('text').textContent = p.text;

    var ul = $('people'), note = $('note');
    ul.innerHTML = '';
    if (p.people) {
      p.people.forEach(function (r) {
        var li = el('li');
        li.appendChild(el('b', null, r[0] + '. ' + r[1]));
        li.appendChild(document.createTextNode(' · ' + r[2]));
        ul.appendChild(li);
      });
      ul.hidden = false;
    } else ul.hidden = true;
    if (p.note) { note.textContent = p.note; note.hidden = false; } else note.hidden = true;

    var eps = $('eps');
    eps.innerHTML = '';
    eps.appendChild(el('span', 'ep-badge', p.ep));
    var a = el('a', 'btn btn-pequeno', 'Ver na Lore →');
    a.href = p.lore;
    eps.appendChild(a);
    if (p.id === 'comercio') {
      var b = el('a', 'btn btn-escuro btn-pequeno', 'Quero uma loja →');
      b.href = 'sugestoes.html?tema=Comércio';
      eps.appendChild(b);
    }
  }

  function select(id, scroll) {
    var p = LUGARES.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    current = id;
    Object.keys(pinEls).forEach(function (k) {
      var on = k === id;
      pinEls[k].classList.toggle('ativo', on);
      chipEls[k].classList.toggle('ativo', on);
      chipEls[k].setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    painel.classList.remove('e-misterio', 'e-novo', 'trocando');
    if (p.kind === 'mystery') painel.classList.add('e-misterio');
    if (p.kind === 'new') painel.classList.add('e-novo');
    void painel.offsetWidth;
    painel.classList.add('trocando');
    clearTimeout(timer);
    timer = setTimeout(function () { painel.classList.remove('trocando'); }, 450);
    render(p);
    center(id);
    if (scroll && history.replaceState) history.replaceState(null, '', '#' + id);
  }

  if (zoomBtn) zoomBtn.addEventListener('click', function () {
    var z = mapbox.classList.toggle('zoomed');
    zoomBtn.setAttribute('aria-pressed', z ? 'true' : 'false');
    zoomBtn.textContent = z ? '− Reduzir mapa' : '+ Ampliar mapa';
    if (z && current) setTimeout(function () { center(current); }, 60);
    else { mapbox.scrollLeft = 0; mapbox.scrollTop = 0; }
  });

  function fromHash() {
    var h = decodeURIComponent((location.hash || '').slice(1));
    return pinEls[h] ? h : null;
  }
  window.addEventListener('hashchange', function () { var h = fromHash(); if (h) select(h, false); });

  select(fromHash() || 'praca', false);
})();
