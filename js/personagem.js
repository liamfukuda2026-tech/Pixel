/* Caraguá Pixel · motor de desenho dos moradores (Canvas 2D puro, pixel art nítida)
   Grade lógica 40×44, desenhada com imageSmoothingEnabled=false em escala inteira.
   Globais: desenharMorador, aparenciaAleatoria, PALETA, ESTILOS_CABELO, OPCOES, OFICIOS, TRAJES */
(function () {
  'use strict';

  var LARG = 40, ALT = 44;
  var CONTORNO = '#1a1420';

  /* ───────── Paletas ───────── */
  var PALETA = {
    pele: [
      { nome: 'Clara',       c: '#ffe3cf', s: '#eebf9f' },
      { nome: 'Rosada',      c: '#fbd0b4', s: '#e3a98a' },
      { nome: 'Bege',        c: '#f1c08f', s: '#d29c6a' },
      { nome: 'Morena',      c: '#d99a6a', s: '#b87848' },
      { nome: 'Parda',       c: '#b97a4e', s: '#965a34' },
      { nome: 'Marrom',      c: '#8f5a38', s: '#6f4126' },
      { nome: 'Escura',      c: '#6a4026', s: '#4d2c18' },
      { nome: 'Muito escura', c: '#4a2c1a', s: '#341d10' }
    ],
    cabelo: [
      { nome: 'Preto',     c: '#1c1a24' },
      { nome: 'Castanho escuro', c: '#3b2415' },
      { nome: 'Castanho',  c: '#6a4326' },
      { nome: 'Ruivo',     c: '#b2501f' },
      { nome: 'Loiro escuro', c: '#b08a3c' },
      { nome: 'Loiro',     c: '#e6c76a' },
      { nome: 'Grisalho',  c: '#a9adb8' },
      { nome: 'Branco',    c: '#eceef4' },
      { nome: 'Rosa',      c: '#e86aa6' },
      { nome: 'Azul',      c: '#3a7ae0' },
      { nome: 'Verde',     c: '#3fbf6a' },
      { nome: 'Roxo',      c: '#8a4ad8' }
    ],
    olhos: [
      { nome: 'Castanho', c: '#4a2e1a' },
      { nome: 'Preto',    c: '#1a1420' },
      { nome: 'Azul',     c: '#3a72c8' },
      { nome: 'Verde',    c: '#3a9a52' },
      { nome: 'Mel',      c: '#b0762a' },
      { nome: 'Cinza',    c: '#6c7c8e' }
    ],
    labios: [
      { nome: 'Natural',  c: '#b4655a' },
      { nome: 'Rosa',     c: '#e07a9a' },
      { nome: 'Vermelho', c: '#d02a38' },
      { nome: 'Coral',    c: '#ee7a62' },
      { nome: 'Vinho',    c: '#7a2038' },
      { nome: 'Escuro',   c: '#5a3a46' }
    ],
    roupa: [
      { nome: 'Branco',   c: '#f2f2f4' },
      { nome: 'Preto',    c: '#26262e' },
      { nome: 'Cinza',    c: '#8a90a2' },
      { nome: 'Vermelho', c: '#c8363a' },
      { nome: 'Laranja',  c: '#ee8a2c' },
      { nome: 'Amarelo',  c: '#f0d060' },
      { nome: 'Verde',    c: '#3fae5e' },
      { nome: 'Turquesa', c: '#2fb5a4' },
      { nome: 'Azul',     c: '#3a72c8' },
      { nome: 'Marinho',  c: '#1f2f5e' },
      { nome: 'Roxo',     c: '#7a4ac0' },
      { nome: 'Rosa',     c: '#e86aa6' },
      { nome: 'Marrom',   c: '#7a4a2a' },
      { nome: 'Jeans',    c: '#3d5a8a' }
    ],
    sapato: [
      { nome: 'Preto',    c: '#22222a' },
      { nome: 'Marrom',   c: '#6a4426' },
      { nome: 'Branco',   c: '#ececf0' },
      { nome: 'Vermelho', c: '#b83038' },
      { nome: 'Azul',     c: '#2e56a8' }
    ]
  };

  var ESTILOS_CABELO = [
    { id: 'curto',    nome: 'Curto' },
    { id: 'topete',   nome: 'Topete' },
    { id: 'social',   nome: 'Social' },
    { id: 'raspado',  nome: 'Raspado' },
    { id: 'moicano',  nome: 'Moicano' },
    { id: 'cacheado', nome: 'Cacheado' },
    { id: 'afro',     nome: 'Black power' },
    { id: 'bob',      nome: 'Chanel' },
    { id: 'longo',    nome: 'Longo' },
    { id: 'franja',   nome: 'Longo c/ franja' },
    { id: 'rabo',     nome: 'Rabo de cavalo' },
    { id: 'coque',    nome: 'Coque' },
    { id: 'careca',   nome: 'Careca' }
  ];

  var OPCOES = {
    corpo: [
      { chave: 'corpo', rotulo: 'Corpo', tipo: 'opcao', valores: [{ id: 'normal', nome: 'Normal' }, { id: 'robusto', nome: 'Robusto' }] },
      { chave: 'pele', rotulo: 'Tom de pele', tipo: 'cor', valores: PALETA.pele }
    ],
    rosto: [
      { chave: 'olhos', rotulo: 'Olhos', tipo: 'opcao', valores: [
        { id: 'redondo', nome: 'Redondo' }, { id: 'grande', nome: 'Grande' }, { id: 'feliz', nome: 'Feliz' },
        { id: 'sono', nome: 'Sonolento' }, { id: 'cilios', nome: 'Cílios' }] },
      { chave: 'corOlhos', rotulo: 'Cor dos olhos', tipo: 'cor', valores: PALETA.olhos },
      { chave: 'sobrancelha', rotulo: 'Sobrancelha', tipo: 'opcao', valores: [
        { id: 'normal', nome: 'Normal' }, { id: 'grossa', nome: 'Grossa' }, { id: 'fina', nome: 'Fina' },
        { id: 'brava', nome: 'Brava' }, { id: 'nenhuma', nome: 'Nenhuma' }] },
      { chave: 'boca', rotulo: 'Boca', tipo: 'opcao', valores: [
        { id: 'sorriso', nome: 'Sorriso' }, { id: 'neutra', nome: 'Neutra' }, { id: 'aberta', nome: 'Aberta' }, { id: 'sorrisao', nome: 'Sorrisão' }] },
      { chave: 'corLabios', rotulo: 'Cor da boca', tipo: 'cor', valores: PALETA.labios },
      { chave: 'barba', rotulo: 'Barba', tipo: 'opcao', valores: [
        { id: 'nenhuma', nome: 'Sem barba' }, { id: 'rala', nome: 'Rala' }, { id: 'bigode', nome: 'Bigode' },
        { id: 'cavanhaque', nome: 'Cavanhaque' }, { id: 'barba', nome: 'Barba cheia' }] },
      { chave: 'marca', rotulo: 'Detalhe', tipo: 'opcao', valores: [
        { id: 'nenhuma', nome: 'Nenhum' }, { id: 'sardas', nome: 'Sardas' }, { id: 'bochechas', nome: 'Bochechas' },
        { id: 'oculos', nome: 'Óculos' }, { id: 'oculosSol', nome: 'Óculos escuros' }, { id: 'pinta', nome: 'Pinta' }, { id: 'bone', nome: 'Boné' }] }
    ],
    cabelo: [
      { chave: 'cabelo', rotulo: 'Estilo', tipo: 'opcao', valores: ESTILOS_CABELO },
      { chave: 'corCabelo', rotulo: 'Cor do cabelo', tipo: 'cor', valores: PALETA.cabelo }
    ],
    roupa: [
      { chave: 'baixo', rotulo: 'Parte de baixo', tipo: 'opcao', valores: [{ id: 'calca', nome: 'Calça' }, { id: 'short', nome: 'Bermuda' }, { id: 'saia', nome: 'Saia' }] },
      { chave: 'manga', rotulo: 'Manga', tipo: 'opcao', valores: [{ id: 'curta', nome: 'Curta' }, { id: 'comprida', nome: 'Comprida' }, { id: 'regata', nome: 'Regata' }] },
      { chave: 'camisa', rotulo: 'Cor da camisa', tipo: 'cor', valores: PALETA.roupa },
      { chave: 'calca', rotulo: 'Cor da calça/saia', tipo: 'cor', valores: PALETA.roupa },
      { chave: 'sapato', rotulo: 'Sapato', tipo: 'cor', valores: PALETA.sapato }
    ]
  };

  /* ───────── Profissões ───────── */
  var OFICIOS = [
    { id: 'morador',       nome: 'Morador(a)',     masc: 'Morador',        fem: 'Moradora' },
    { id: 'pescador',      nome: 'Pescador(a)',    masc: 'Pescador',       fem: 'Pescadora' },
    { id: 'salvavidas',    nome: 'Salva-vidas',    masc: 'Salva-vidas',    fem: 'Salva-vidas' },
    { id: 'professor',     nome: 'Professor(a)',   masc: 'Professor',      fem: 'Professora' },
    { id: 'medico',        nome: 'Médico(a)',      masc: 'Médico',         fem: 'Médica' },
    { id: 'fisio',         nome: 'Fisioterapeuta', masc: 'Fisioterapeuta', fem: 'Fisioterapeuta' },
    { id: 'advogado',      nome: 'Advogado(a)',    masc: 'Advogado',       fem: 'Advogada' },
    { id: 'mecanico',      nome: 'Mecânico(a)',    masc: 'Mecânico',       fem: 'Mecânica' },
    { id: 'entregador',    nome: 'Entregador(a)',  masc: 'Entregador',     fem: 'Entregadora' },
    { id: 'engenheiro',    nome: 'Engenheiro(a)',  masc: 'Engenheiro',     fem: 'Engenheira' },
    { id: 'gari',          nome: 'Gari',           masc: 'Gari',           fem: 'Gari' },
    { id: 'policial',      nome: 'Policial',       masc: 'Policial',       fem: 'Policial' },
    { id: 'comerciante',   nome: 'Comerciante',    masc: 'Comerciante',    fem: 'Comerciante' },
    { id: 'vereador',      nome: 'Vereador(a)',    masc: 'Vereador',       fem: 'Vereadora' }
  ];

  /* camisa/calca fixos = uniforme; null = escolha livre do jogador.
     chapeu: bucket | bone | capacete | quepe | bandana | visor */
  var TRAJES = {
    morador:     { camisa: null, calca: null, manga: null, chapeu: null, desc: 'Roupa do dia a dia, do seu jeito.' },
    pescador:    { camisa: '#d8c88a', calca: '#7a6a3a', manga: 'comprida', chapeu: 'bucket', chapeuCor: '#f0d060', desc: 'Chapéu, colete laranja e vara de pescar.' },
    salvavidas:  { camisa: '#d8323a', calca: '#d8323a', manga: 'regata', baixo: 'short', chapeu: 'visor', chapeuCor: '#f4f4f6', desc: 'Regata vermelha, bermuda e boia de resgate.' },
    professor:   { camisa: '#7aa8d8', calca: '#6a6e7c', manga: 'comprida', chapeu: null, desc: 'Camisa social, gravata e livro.' },
    medico:      { camisa: '#f4f6fa', calca: '#5aa8d0', manga: 'comprida', chapeu: null, desc: 'Jaleco branco, estetoscópio e prancheta.' },
    fisio:       { camisa: '#2fb5a4', calca: '#f4f6fa', manga: 'curta', chapeu: null, desc: 'Polo turquesa, calça branca e faixa elástica.' },
    advogado:    { camisa: '#2a2f3d', calca: '#2a2f3d', manga: 'comprida', chapeu: null, desc: 'Terno, gravata vermelha e pasta.' },
    mecanico:    { camisa: '#2f5fa8', calca: '#2f5fa8', manga: 'comprida', chapeu: 'bandana', chapeuCor: '#c8363a', desc: 'Macacão azul, bandana e chave inglesa.' },
    entregador:  { camisa: '#e8302a', calca: '#2a2f3d', manga: 'curta', chapeu: 'bone', chapeuCor: '#e8302a', desc: 'Mochila de entrega, boné e caixa.' },
    engenheiro:  { camisa: '#8ab4e0', calca: '#3d5a8a', manga: 'comprida', chapeu: 'capacete', chapeuCor: '#f4f4f6', desc: 'Capacete, colete refletivo e planta.' },
    gari:        { camisa: '#ff6a1a', calca: '#ff6a1a', manga: 'comprida', chapeu: 'bone', chapeuCor: '#ff6a1a', desc: 'Uniforme laranja com faixas e vassoura.' },
    policial:    { camisa: '#1f3560', calca: '#16213d', manga: 'curta', chapeu: 'quepe', chapeuCor: '#16213d', desc: 'Farda azul, quepe, distintivo e cassetete.' },
    comerciante: { camisa: null, calca: null, manga: null, chapeu: null, desc: 'Avental verde e sacola da loja.' },
    vereador:    { camisa: '#7a1f2b', calca: '#2a2a3a', manga: 'comprida', chapeu: null, desc: 'Blazer, gravata dourada e projeto de lei.' }
  };

  /* ───────── Utilidades ───────── */
  function mistura(hex, alvo, t) {
    var a = parseInt(hex.slice(1), 16), b = parseInt(alvo.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
    var g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
    var l = Math.round((a & 255) * (1 - t) + (b & 255) * t);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | l).toString(16).slice(1);
  }
  function escurece(h, t) { return mistura(h, '#0a0810', t == null ? 0.28 : t); }
  function clareia(h, t) { return mistura(h, '#ffffff', t == null ? 0.25 : t); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, ''); }

  function acharOficio(o) {
    if (!o) return OFICIOS[0];
    if (typeof o === 'object' && o.id) return o;
    var n = norm(o);
    for (var i = 0; i < OFICIOS.length; i++) {
      var f = OFICIOS[i];
      if (norm(f.id) === n || norm(f.nome) === n || norm(f.masc) === n || norm(f.fem) === n) return f;
    }
    return OFICIOS[0];
  }
  function rotuloOficio(o, sexo) {
    var f = acharOficio(o);
    return sexo === 'mulher' ? f.fem : f.masc;
  }
  function pega(lista, i) { return lista[((i % lista.length) + lista.length) % lista.length]; }

  /* ───────── Desenho em grade lógica ───────── */
  function pintar(ctx, x, y, w, h, c, a) {
    if (w <= 0 || h <= 0) return;
    ctx.globalAlpha = a == null ? 1 : a;
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
  }
  function cantos(ctx, x, y, w, h, c, a) {
    if (w < 4 || h < 4) { pintar(ctx, x, y, w, h, c, a); return; }
    pintar(ctx, x + 1, y, w - 2, h, c, a);
    pintar(ctx, x, y + 1, w, h - 2, c, a);
  }
  // forma com contorno escuro (arredondada)
  function forma(ctx, x, y, w, h, c) {
    cantos(ctx, x - 1, y - 1, w + 2, h + 2, CONTORNO);
    cantos(ctx, x, y, w, h, c);
  }

  function desenharGrade(ctx, ap, oficio) {
    var of = acharOficio(oficio);
    var tr = TRAJES[of.id] || TRAJES.morador;
    var fem = ap.sexo === 'mulher';
    var robusto = ap.corpo === 'robusto';
    var pele = pega(PALETA.pele, ap.pele), P = pele.c, PS = pele.s;
    var hc = pega(PALETA.cabelo, ap.corCabelo).c;
    var hs = escurece(hc, 0.25), hl = clareia(hc, 0.3);
    var careca = ap.cabelo === 'careca';
    var cb = careca ? '#3a2a1c' : hc;

    var uniforme = tr.camisa != null;
    var camisa = uniforme ? tr.camisa : pega(PALETA.roupa, ap.camisa).c;
    var calcaC = tr.calca != null ? tr.calca : pega(PALETA.roupa, ap.calca).c;
    var manga = tr.manga || ap.manga || 'curta';
    var baixo = tr.baixo || (uniforme ? 'calca' : (ap.baixo || 'calca'));
    var sapato = pega(PALETA.sapato, ap.sapato).c;
    if (of.id === 'pescador') sapato = '#3b5a2a';
    if (of.id === 'policial') sapato = '#16161c';
    if (of.id === 'gari' || of.id === 'engenheiro' || of.id === 'mecanico') sapato = '#4a3a2a';
    if (of.id === 'salvavidas') sapato = '#f4f4f6';

    // geometria do corpo
    var tx, tw;
    if (robusto) { tx = 11; tw = 18; } else if (fem) { tx = 14; tw = 12; } else { tx = 13; tw = 14; }
    var lw = (tw - 4) / 2;
    var lx1 = tx + 1, lx2 = tx + tw - 1 - lw;
    var alx = tx - 4, arx = tx + tw;
    var hxD = arx + 2, hxE = alx + 1;      // mãos (centro visível)
    var luva = (of.id === 'gari') ? '#3fae5e' : P;

    ctx.clearRect(0, 0, LARG, ALT);

    // sombra no chão
    pintar(ctx, tx - 2, 42, tw + 4, 1, '#000', 0.35);
    pintar(ctx, tx, 43, tw, 1, '#000', 0.22);

    /* camadas de trás */
    desenharCabeloTras(ctx, ap.cabelo, hc, hs);
    if (of.id === 'entregador') {
      forma(ctx, tx - 5, 17, tw + 10, 16, '#ff3b30');
      pintar(ctx, tx - 4, 18, tw + 8, 1, clareia('#ff3b30', 0.3));
      pintar(ctx, tx - 3, 27, 2, 2, '#fff');
    }

    /* pernas */
    var pernaBaixo = (baixo === 'saia' || baixo === 'short');
    function perna(x) {
      forma(ctx, x, 33, lw, 6, P);
      if (baixo === 'calca') pintar(ctx, x, 33, lw, 6, calcaC);
      else if (baixo === 'short') { pintar(ctx, x, 33, lw, 3, calcaC); pintar(ctx, x, 36, lw, 3, PS, 0.35); }
      else pintar(ctx, x, 36, lw, 3, PS, 0.35);
      // sapato
      forma(ctx, x - 1, 39, lw + 2, 3, sapato);
      pintar(ctx, x - 1, 41, lw + 2, 1, escurece(sapato, 0.35));
      pintar(ctx, x, 39, 2, 1, clareia(sapato, 0.3));
      if (of.id === 'pescador') pintar(ctx, x - 1, 38, lw + 2, 1, '#2a4020');
    }
    perna(lx1); perna(lx2);

    /* braços */
    function braco(x, esq) {
      forma(ctx, x, 22, 4, 10, P);
      var m = manga;
      if (m === 'curta') pintar(ctx, x, 22, 4, 4, camisa);
      else if (m === 'comprida') pintar(ctx, x, 22, 4, 8, camisa);
      else { pintar(ctx, x, 22, 4, 2, camisa); }
      if (m === 'comprida') pintar(ctx, x, 29, 4, 1, escurece(camisa, 0.25));
      if (luva !== P) pintar(ctx, x, 29, 4, 3, luva);
      pintar(ctx, esq ? x : x + 3, 24, 1, 6, '#000', 0.08);
    }
    braco(alx, true); braco(arx, false);

    /* tronco */
    forma(ctx, tx, 21, tw, 12, camisa);
    pintar(ctx, tx + 1, 22, 2, 1, clareia(camisa, 0.3));
    pintar(ctx, tx, 30, tw, 3, escurece(camisa, 0.12));

    /* parte de baixo */
    if (baixo === 'saia') {
      forma(ctx, tx - 1, 31, tw + 2, 5, calcaC);
      pintar(ctx, tx - 2, 35, tw + 4, 1, escurece(calcaC, 0.2));
      pintar(ctx, tx - 1, 31, tw + 2, 1, escurece(calcaC, 0.25));
    } else {
      pintar(ctx, tx, 31, tw, 2, calcaC);
      pintar(ctx, tx, 31, tw, 1, escurece(calcaC, 0.25));
    }

    /* detalhes do uniforme sobre o tronco */
    var cx = tx + (tw >> 1);       // coluna central-direita do tronco
    switch (of.id) {
      case 'pescador':
        pintar(ctx, tx, 21, 4, 11, '#ff8a1a'); pintar(ctx, tx + tw - 4, 21, 4, 11, '#ff8a1a');
        pintar(ctx, tx + 1, 25, 2, 1, '#ffd06a'); pintar(ctx, tx + tw - 3, 25, 2, 1, '#ffd06a');
        pintar(ctx, tx + 1, 21, 1, 11, '#cc6a10'); pintar(ctx, tx + tw - 2, 21, 1, 11, '#cc6a10');
        pintar(ctx, tx + 4, 31, tw - 8, 1, '#7a6a3a');
        break;
      case 'salvavidas':
        pintar(ctx, cx - 1, 24, 2, 6, '#fff'); pintar(ctx, cx - 2, 26, 4, 2, '#fff');
        pintar(ctx, cx - 4, 21, 1, 3, '#f4f4f6'); pintar(ctx, cx + 3, 21, 1, 3, '#f4f4f6');
        pintar(ctx, cx - 1, 21, 2, 1, '#ffd23f'); pintar(ctx, cx, 22, 1, 2, '#ffd23f'); // apito
        break;
      case 'professor':
        pintar(ctx, tx, 24, 4, 8, '#8a5a34'); pintar(ctx, tx + tw - 4, 24, 4, 8, '#8a5a34'); // colete
        pintar(ctx, cx - 1, 21, 2, 2, '#fff'); pintar(ctx, cx - 1, 23, 2, 8, '#c0403a'); pintar(ctx, cx - 1, 23, 2, 1, '#e86a5a');
        break;
      case 'medico':
        pintar(ctx, tx, 21, tw, 12, '#f4f6fa');
        pintar(ctx, cx - 2, 21, 4, 11, '#5aa8d0');          // camisa por baixo
        pintar(ctx, cx - 2, 21, 1, 11, '#cfd6e2'); pintar(ctx, cx + 1, 21, 1, 11, '#cfd6e2');
        pintar(ctx, tx + 1, 27, 3, 3, '#dfe4ee'); pintar(ctx, tx + 1, 27, 3, 1, '#b8c0d0');   // bolso
        pintar(ctx, cx - 3, 21, 1, 6, '#444'); pintar(ctx, cx + 2, 21, 1, 6, '#444');          // estetoscópio
        pintar(ctx, cx - 3, 27, 6, 1, '#444'); pintar(ctx, cx - 1, 28, 2, 2, '#9aa2b0');
        break;
      case 'fisio':
        pintar(ctx, cx - 1, 21, 2, 3, escurece('#2fb5a4', 0.2));
        pintar(ctx, tx + tw - 4, 25, 3, 2, '#f4f6fa'); pintar(ctx, tx + tw - 4, 25, 3, 1, '#2f6ad8'); // crachá
        pintar(ctx, cx - 4, 27, 1, 2, '#fff'); pintar(ctx, cx - 5, 28, 3, 1, '#fff');                  // cruz
        break;
      case 'advogado':
        pintar(ctx, cx - 2, 21, 4, 6, '#f4f6fa');
        pintar(ctx, cx - 1, 22, 2, 8, '#c0403a'); pintar(ctx, cx - 1, 22, 2, 1, '#e86a5a');
        pintar(ctx, cx - 3, 21, 1, 7, '#14161e'); pintar(ctx, cx + 2, 21, 1, 7, '#14161e');
        pintar(ctx, tx + tw - 4, 26, 3, 1, '#f4f6fa');
        break;
      case 'mecanico':
        pintar(ctx, tx + 2, 25, 4, 3, '#244a88'); pintar(ctx, tx + 2, 25, 4, 1, '#1a3a6a');
        pintar(ctx, cx, 21, 1, 11, '#1a3a6a'); pintar(ctx, cx - 2, 21, 5, 1, '#e8b030');
        pintar(ctx, tx + 3, 29, 3, 2, '#222', 0.6);
        break;
      case 'entregador':
        pintar(ctx, cx - 2, 24, 4, 3, '#fff'); pintar(ctx, cx - 1, 25, 2, 1, '#e8302a');
        pintar(ctx, tx + 1, 21, 1, 9, '#a01c18'); pintar(ctx, tx + tw - 2, 21, 1, 9, '#a01c18');
        break;
      case 'engenheiro':
        pintar(ctx, tx, 21, 4, 11, '#ff7a1a'); pintar(ctx, tx + tw - 4, 21, 4, 11, '#ff7a1a');
        pintar(ctx, tx, 27, tw, 1, '#e8f0a0'); pintar(ctx, tx, 29, tw, 1, '#e8f0a0');
        pintar(ctx, cx - 1, 21, 2, 1, '#8ab4e0');
        break;
      case 'gari':
        pintar(ctx, tx, 26, tw, 1, '#e8f0a0'); pintar(ctx, tx, 28, tw, 1, '#e8f0a0');
        pintar(ctx, tx + 3, 21, 1, 5, '#cc4a10'); pintar(ctx, tx + tw - 4, 21, 1, 5, '#cc4a10');
        pintar(ctx, 0 + alx, 26, 4, 1, '#e8f0a0'); pintar(ctx, arx, 26, 4, 1, '#e8f0a0');
        pintar(ctx, lx1, 35, lw, 1, '#e8f0a0'); pintar(ctx, lx2, 35, lw, 1, '#e8f0a0');
        break;
      case 'policial':
        pintar(ctx, tx, 30, tw, 2, '#0e0e14'); pintar(ctx, cx - 1, 30, 2, 2, '#f0d060');           // cinto
        pintar(ctx, tx + tw - 5, 24, 3, 3, '#f0d060'); pintar(ctx, tx + tw - 4, 25, 1, 1, '#a07c24'); // distintivo
        pintar(ctx, tx + 2, 23, 2, 2, '#9aa2b0'); pintar(ctx, tx + 2, 25, 1, 3, '#222');            // rádio
        pintar(ctx, cx - 1, 21, 2, 2, '#f4f6fa');
        break;
      case 'comerciante':
        pintar(ctx, tx + 2, 24, tw - 4, 8, '#2e8b57');
        pintar(ctx, tx + 3, 21, 1, 3, '#2e8b57'); pintar(ctx, tx + tw - 4, 21, 1, 3, '#2e8b57');
        pintar(ctx, tx + 4, 27, 4, 3, '#24724a'); pintar(ctx, tx + 4, 27, 4, 1, '#1a5a38');
        pintar(ctx, tx + 2, 24, tw - 4, 1, '#6ad89a');
        break;
      case 'vereador':
        pintar(ctx, cx - 2, 21, 4, 6, '#f4f6fa');
        pintar(ctx, cx - 1, 22, 2, 8, '#f0d060'); pintar(ctx, cx - 1, 22, 2, 1, '#fff3a0');
        pintar(ctx, cx - 3, 21, 1, 7, '#4a1018'); pintar(ctx, cx + 2, 21, 1, 7, '#4a1018');
        pintar(ctx, tx + tw - 4, 25, 3, 2, '#f0d060'); // crachá/pin
        break;
      default: break;
    }

    /* pescoço */
    forma(ctx, 18, 19, 4, 3, P);
    pintar(ctx, 18, 19, 4, 2, PS);
    if (of.id === 'medico' || of.id === 'advogado' || of.id === 'vereador' || of.id === 'professor') { /* gola */
      pintar(ctx, 17, 21, 2, 1, '#f4f6fa'); pintar(ctx, 21, 21, 2, 1, '#f4f6fa');
    }

    /* cabeça */
    pintar(ctx, 10, 10, 3, 4, CONTORNO); pintar(ctx, 11, 11, 1, 2, P);        // orelha esq.
    pintar(ctx, 27, 10, 3, 4, CONTORNO); pintar(ctx, 28, 11, 1, 2, P);        // orelha dir.
    forma(ctx, 12, 3, 16, 16, P);
    pintar(ctx, 13, 17, 14, 1, PS, 0.4);

    /* rosto */
    var marca = ap.marca || 'nenhuma';
    if (marca === 'bochechas' || fem) {
      var rosa = marca === 'bochechas' ? '#f06a8a' : '#f09a9a';
      pintar(ctx, 13, 13, 2, 1, rosa, marca === 'bochechas' ? 0.75 : 0.45);
      pintar(ctx, 25, 13, 2, 1, rosa, marca === 'bochechas' ? 0.75 : 0.45);
    }
    if (marca === 'sardas') {
      var sc = escurece(PS, 0.2);
      [[14, 12], [16, 13], [15, 14], [24, 12], [26, 13], [23, 14], [19, 12], [20, 13]].forEach(function (p) { pintar(ctx, p[0], p[1], 1, 1, sc); });
    }
    if (marca === 'pinta') pintar(ctx, 24, 15, 1, 1, '#4a2a1a');
    pintar(ctx, 19, 13, 2, 1, PS);                                           // nariz
    if (of.id === 'salvavidas') pintar(ctx, 19, 12, 2, 2, '#f4f4f6');         // zinco no nariz
    if (of.id === 'mecanico') { pintar(ctx, 14, 14, 2, 1, '#222', 0.55); pintar(ctx, 24, 12, 1, 1, '#222', 0.45); }

    desenharOlhos(ctx, ap, cb, fem);
    desenharBoca(ctx, ap, P, PS);
    desenharBarba(ctx, ap, hc, fem);

    /* cabelo da frente, acessórios de rosto e chapéus */
    desenharCabeloFrente(ctx, ap.cabelo, hc, hs, hl);

    if (marca === 'oculos') {
      var ar = '#262630';
      [[14, 9], [22, 9]].forEach(function (p) {
        pintar(ctx, p[0], p[1], 4, 1, ar); pintar(ctx, p[0], p[1] + 3, 4, 1, ar);
        pintar(ctx, p[0], p[1], 1, 4, ar); pintar(ctx, p[0] + 3, p[1], 1, 4, ar);
        pintar(ctx, p[0] + 1, p[1] + 1, 2, 2, '#cfe6ff', 0.35);
      });
      pintar(ctx, 18, 10, 4, 1, ar); pintar(ctx, 12, 10, 2, 1, ar); pintar(ctx, 26, 10, 2, 1, ar);
    } else if (marca === 'oculosSol') {
      var so = '#14141c';
      pintar(ctx, 14, 9, 5, 4, so); pintar(ctx, 21, 9, 5, 4, so); pintar(ctx, 19, 10, 2, 1, so);
      pintar(ctx, 12, 10, 2, 1, so); pintar(ctx, 26, 10, 2, 1, so);
      pintar(ctx, 15, 10, 1, 1, '#5a6a8a'); pintar(ctx, 22, 10, 1, 1, '#5a6a8a');
    }

    var chapeu = tr.chapeu;
    if (!chapeu && marca === 'bone') chapeu = 'bone';
    var chapeuCor = tr.chapeuCor || camisa;
    if (marca === 'bone' && !tr.chapeu) chapeuCor = pega(PALETA.roupa, ap.camisa).c;
    desenharChapeu(ctx, chapeu, chapeuCor);

    /* itens da profissão */
    desenharItem(ctx, of.id, hxD, hxE, alx, arx, tx, tw, P);
  }

  /* ───────── Cabelo ───────── */
  function desenharCabeloTras(ctx, est, c, s) {
    switch (est) {
      case 'longo': case 'franja':
        forma(ctx, 10, 4, 20, 25, c); pintar(ctx, 11, 22, 18, 6, s, 0.5);
        break;
      case 'bob':
        forma(ctx, 11, 4, 18, 15, c);
        break;
      case 'rabo':
        forma(ctx, 28, 5, 4, 3, c); forma(ctx, 30, 8, 3, 9, c); pintar(ctx, 31, 10, 1, 6, s);
        pintar(ctx, 28, 6, 3, 1, '#e86aa6');
        break;
      case 'cacheado':
        forma(ctx, 9, 3, 22, 13, c);
        break;
      case 'afro':
        forma(ctx, 7, 2, 26, 15, c);
        break;
      default: break;
    }
  }
  function desenharCabeloFrente(ctx, est, c, s, hl) {
    switch (est) {
      case 'careca': break;
      case 'raspado':
        cantos(ctx, 12, 3, 16, 3, c, 0.85); pintar(ctx, 14, 3, 4, 1, hl, 0.5);
        break;
      case 'curto':
        forma(ctx, 12, 2, 16, 5, c); pintar(ctx, 12, 7, 2, 3, c); pintar(ctx, 26, 7, 2, 3, c);
        pintar(ctx, 14, 3, 4, 1, hl); pintar(ctx, 19, 6, 8, 1, s);
        break;
      case 'topete':
        forma(ctx, 12, 2, 16, 5, c); forma(ctx, 14, 0, 11, 3, c); pintar(ctx, 12, 7, 2, 3, c); pintar(ctx, 26, 7, 2, 3, c);
        pintar(ctx, 16, 1, 4, 1, hl); pintar(ctx, 19, 6, 8, 1, s);
        break;
      case 'social':
        forma(ctx, 12, 2, 16, 5, c); pintar(ctx, 12, 7, 6, 1, c); pintar(ctx, 12, 7, 2, 3, c); pintar(ctx, 26, 7, 2, 3, c);
        pintar(ctx, 20, 2, 1, 4, s); pintar(ctx, 14, 3, 5, 1, hl);
        break;
      case 'moicano':
        cantos(ctx, 12, 3, 16, 3, c, 0.6);
        forma(ctx, 18, 0, 4, 7, c); pintar(ctx, 19, 1, 1, 4, hl);
        break;
      case 'cacheado':
        forma(ctx, 10, 0, 20, 8, c); pintar(ctx, 10, 6, 4, 8, c); pintar(ctx, 26, 6, 4, 8, c);
        pintar(ctx, 13, 2, 2, 2, hl); pintar(ctx, 19, 1, 3, 2, hl); pintar(ctx, 24, 3, 2, 2, hl);
        pintar(ctx, 15, 5, 3, 1, s); pintar(ctx, 22, 5, 4, 1, s);
        break;
      case 'afro':
        forma(ctx, 8, 0, 24, 9, c); pintar(ctx, 8, 6, 5, 8, c); pintar(ctx, 27, 6, 5, 8, c);
        pintar(ctx, 12, 2, 3, 2, hl); pintar(ctx, 20, 1, 4, 2, hl); pintar(ctx, 26, 3, 2, 2, hl);
        pintar(ctx, 15, 6, 3, 1, s); pintar(ctx, 22, 6, 4, 1, s);
        break;
      case 'bob':
        forma(ctx, 12, 2, 16, 6, c); pintar(ctx, 11, 7, 3, 10, c); pintar(ctx, 26, 7, 3, 10, c);
        pintar(ctx, 14, 3, 5, 1, hl); pintar(ctx, 14, 7, 12, 1, s);
        break;
      case 'longo':
        forma(ctx, 12, 2, 16, 5, c); pintar(ctx, 11, 6, 3, 14, c); pintar(ctx, 26, 6, 3, 14, c);
        pintar(ctx, 19, 2, 2, 4, s); pintar(ctx, 14, 3, 4, 1, hl);
        break;
      case 'franja':
        forma(ctx, 12, 2, 16, 6, c); pintar(ctx, 11, 6, 3, 14, c); pintar(ctx, 26, 6, 3, 14, c);
        pintar(ctx, 13, 7, 14, 1, s); pintar(ctx, 14, 3, 4, 1, hl);
        break;
      case 'rabo':
        forma(ctx, 12, 2, 16, 5, c); pintar(ctx, 12, 7, 2, 3, c); pintar(ctx, 26, 7, 2, 3, c);
        pintar(ctx, 14, 3, 4, 1, hl); pintar(ctx, 19, 6, 8, 1, s);
        break;
      case 'coque':
        forma(ctx, 12, 2, 16, 5, c); forma(ctx, 16, 0, 8, 3, c); pintar(ctx, 12, 7, 2, 3, c); pintar(ctx, 26, 7, 2, 3, c);
        pintar(ctx, 17, 1, 3, 1, hl); pintar(ctx, 14, 3, 4, 1, hl);
        break;
      default:
        forma(ctx, 12, 2, 16, 5, c); break;
    }
  }

  /* ───────── Rosto ───────── */
  function desenharOlhos(ctx, ap, cb, fem) {
    var ec = pega(PALETA.olhos, ap.corOlhos).c;
    var est = ap.olhos || 'redondo';
    var D = CONTORNO;
    [15, 23].forEach(function (ex, i) {
      if (est === 'feliz') {
        pintar(ctx, ex - 1, 11, 1, 1, D); pintar(ctx, ex, 10, 2, 1, D); pintar(ctx, ex + 2, 11, 1, 1, D);
      } else if (est === 'sono') {
        pintar(ctx, ex - 1, 11, 4, 1, D); pintar(ctx, ex, 12, 2, 1, D, 0.4);
      } else if (est === 'grande') {
        pintar(ctx, ex - 1, 10, 4, 4, '#fff'); pintar(ctx, ex - 1, 10, 4, 1, D);
        pintar(ctx, ex, 10, 2, 3, ec); pintar(ctx, ex, 11, 2, 1, D, 0.55); pintar(ctx, ex, 10, 1, 1, '#fff');
      } else {
        pintar(ctx, ex, 10, 2, 3, ec); pintar(ctx, ex, 11, 2, 2, D, 0.55); pintar(ctx, ex, 10, 1, 1, '#fff');
        if (est === 'cilios') { pintar(ctx, i === 0 ? ex - 1 : ex + 2, 9, 1, 2, D); pintar(ctx, i === 0 ? ex - 2 : ex + 3, 9, 1, 1, D); }
      }
    });
    if (fem && est !== 'cilios' && est !== 'feliz' && est !== 'sono') {
      pintar(ctx, 14, 10, 1, 1, D); pintar(ctx, 25, 10, 1, 1, D);
    }
    // sobrancelhas
    var sb = ap.sobrancelha || 'normal';
    var bc = cb;
    switch (sb) {
      case 'grossa': pintar(ctx, 14, 7, 4, 2, bc); pintar(ctx, 22, 7, 4, 2, bc); break;
      case 'fina': pintar(ctx, 14, 8, 3, 1, bc, 0.9); pintar(ctx, 23, 8, 3, 1, bc, 0.9); break;
      case 'brava':
        [[14, 7], [15, 8], [16, 8], [17, 9]].forEach(function (p) { pintar(ctx, p[0], p[1], 1, 1, bc); });
        [[25, 7], [24, 8], [23, 8], [22, 9]].forEach(function (p) { pintar(ctx, p[0], p[1], 1, 1, bc); });
        break;
      case 'nenhuma': break;
      default: pintar(ctx, 14, 8, 4, 1, bc); pintar(ctx, 22, 8, 4, 1, bc); break;
    }
  }
  function desenharBoca(ctx, ap, P, PS) {
    var lab = pega(PALETA.labios, ap.corLabios).c;
    var D = escurece(lab, 0.45);
    switch (ap.boca || 'sorriso') {
      case 'neutra': pintar(ctx, 18, 15, 4, 1, lab); pintar(ctx, 18, 16, 4, 1, PS, 0.3); break;
      case 'aberta':
        pintar(ctx, 18, 15, 4, 3, D); pintar(ctx, 18, 15, 4, 1, '#fff'); pintar(ctx, 19, 17, 2, 1, '#e86a7a');
        break;
      case 'sorrisao':
        pintar(ctx, 17, 14, 1, 1, lab); pintar(ctx, 22, 14, 1, 1, lab);
        pintar(ctx, 18, 15, 4, 2, D); pintar(ctx, 18, 15, 4, 1, '#fff');
        break;
      default:
        pintar(ctx, 17, 14, 1, 1, lab); pintar(ctx, 22, 14, 1, 1, lab); pintar(ctx, 18, 15, 4, 1, lab);
        break;
    }
  }
  function desenharBarba(ctx, ap, hc, fem) {
    var b = ap.barba || 'nenhuma';
    if (b === 'nenhuma' || fem) return;
    var c = hc;
    if (b === 'bigode') { pintar(ctx, 16, 14, 8, 1, c); pintar(ctx, 15, 15, 1, 1, c); pintar(ctx, 24, 15, 1, 1, c); return; }
    if (b === 'cavanhaque') { pintar(ctx, 16, 14, 8, 1, c); pintar(ctx, 18, 17, 4, 2, c); return; }
    var a = (b === 'rala') ? 0.45 : 1;
    pintar(ctx, 12, 11, 3, 8, c, a); pintar(ctx, 25, 11, 3, 8, c, a);
    pintar(ctx, 13, 16, 14, 3, c, a);
    if (b === 'barba') { pintar(ctx, 16, 14, 8, 1, c); pintar(ctx, 15, 15, 1, 1, c); pintar(ctx, 24, 15, 1, 1, c); }
    else { pintar(ctx, 16, 14, 8, 1, c, a); }
  }

  /* ───────── Chapéus ───────── */
  function desenharChapeu(ctx, tipo, c) {
    if (!tipo) return;
    var esc = escurece(c, 0.3), cla = clareia(c, 0.3);
    switch (tipo) {
      case 'bucket':
        forma(ctx, 9, 6, 22, 2, esc); forma(ctx, 13, 0, 14, 7, c);
        pintar(ctx, 13, 5, 14, 1, '#7a5a2a'); pintar(ctx, 15, 1, 4, 1, cla);
        break;
      case 'bone':
        forma(ctx, 12, 1, 16, 6, c); pintar(ctx, 14, 2, 4, 1, cla);
        forma(ctx, 11, 7, 18, 1, esc); pintar(ctx, 19, 3, 2, 2, clareia(c, 0.55));
        break;
      case 'visor':
        forma(ctx, 11, 6, 18, 2, c); pintar(ctx, 11, 8, 18, 1, '#000', 0.15);
        pintar(ctx, 12, 5, 16, 1, '#d8323a');
        break;
      case 'capacete':
        forma(ctx, 11, 0, 18, 8, c); pintar(ctx, 19, 0, 2, 7, cla); pintar(ctx, 13, 2, 3, 1, '#fff');
        pintar(ctx, 11, 7, 18, 1, esc);
        break;
      case 'quepe':
        forma(ctx, 11, 1, 18, 5, c); pintar(ctx, 11, 5, 18, 2, '#0a0e1c');
        pintar(ctx, 19, 2, 2, 3, '#f0d060'); pintar(ctx, 19, 3, 2, 1, '#a07c24');
        forma(ctx, 12, 7, 16, 1, '#0a0a10');
        break;
      case 'bandana':
        forma(ctx, 12, 2, 16, 4, c); pintar(ctx, 14, 3, 1, 1, '#fff'); pintar(ctx, 18, 4, 1, 1, '#fff'); pintar(ctx, 23, 3, 1, 1, '#fff');
        forma(ctx, 28, 4, 3, 3, c); pintar(ctx, 28, 7, 2, 2, c);
        break;
      default: break;
    }
  }

  /* ───────── Itens segurados ───────── */
  function desenharItem(ctx, id, hx, hxE, alx, arx, tx, tw, P) {
    var L = pintar;
    switch (id) {
      case 'pescador': {
        var x0 = hx + 1, y0 = 30, i;
        for (i = 0; i < 9; i++) L(ctx, x0 + i, y0 - ((i * 3) >> 1), 1, 2, i < 3 ? '#4a2e16' : '#8a6030');
        var tx2 = x0 + 8, ty = y0 - 12;
        L(ctx, tx2, ty + 2, 1, 7, '#d8dce8');
        L(ctx, tx2 - 1, ty + 9, 4, 2, '#ff8a3a'); L(ctx, tx2 + 3, ty + 9, 1, 1, '#ff8a3a'); L(ctx, tx2 - 1, ty + 9, 1, 1, '#fff');
        L(ctx, hx, 30, 3, 2, P);
        break;
      }
      case 'salvavidas': {
        var cx = hxE - 3, cy = 32, dx, dy;
        for (dx = -4; dx <= 4; dx++) for (dy = -4; dy <= 4; dy++) {
          var r = Math.sqrt(dx * dx + dy * dy);
          if (r <= 4.3 && r >= 2.1) {
            var seg = (dx < 0 ? 0 : 1) + (dy < 0 ? 0 : 1);
            L(ctx, cx + dx, cy + dy, 1, 1, (seg % 2 === 0) ? '#e8302a' : '#f6f6f8');
          } else if (r <= 5.1 && r > 4.3) L(ctx, cx + dx, cy + dy, 1, 1, CONTORNO);
        }
        L(ctx, hxE, 31, 3, 2, P);
        break;
      }
      case 'professor':
        forma(ctx, hx - 2, 27, 6, 7, '#c0403a'); L(ctx, hx - 2, 27, 1, 7, '#8a2a28'); L(ctx, hx + 3, 28, 1, 5, '#fff3d0');
        L(ctx, hx - 1, 29, 3, 1, '#f0d060'); L(ctx, hx, 31, 3, 2, P);
        break;
      case 'medico':
        forma(ctx, hx - 2, 26, 6, 8, '#a8774a'); L(ctx, hx - 1, 28, 4, 5, '#f6f6f8');
        L(ctx, hx - 1, 29, 3, 1, '#9aa2b0'); L(ctx, hx - 1, 31, 3, 1, '#9aa2b0'); L(ctx, hx, 26, 2, 1, '#9aa2b0');
        L(ctx, hx, 31, 3, 2, P);
        break;
      case 'fisio':
        forma(ctx, hx - 1, 30, 4, 4, '#ff8a1a'); L(ctx, hx, 31, 2, 2, '#ffb04a'); L(ctx, hx, 31, 2, 2, '#fff', 0.0);
        break;
      case 'advogado':
        forma(ctx, hx - 3, 31, 8, 6, '#8b5a2b'); L(ctx, hx - 1, 29, 4, 2, CONTORNO); L(ctx, hx, 30, 2, 1, '#5a3a1a');
        L(ctx, hx - 3, 33, 8, 1, '#6a4420'); L(ctx, hx, 33, 2, 2, '#f0d060');
        break;
      case 'mecanico':
        L(ctx, hx, 27, 2, 8, '#9aa2b0'); L(ctx, hx, 27, 1, 8, '#c6ccd8');
        forma(ctx, hx - 1, 23, 4, 4, '#9aa2b0'); L(ctx, hx, 23, 2, 2, CONTORNO); L(ctx, hx, 24, 2, 1, '#14141c');
        L(ctx, hx, 31, 3, 2, P);
        break;
      case 'entregador':
        forma(ctx, hx - 3, 28, 9, 8, '#c8914a'); L(ctx, hx, 28, 3, 8, '#e8d0a0'); L(ctx, hx - 3, 28, 9, 1, '#a8722e');
        L(ctx, hx + 3, 31, 2, 3, '#fff'); L(ctx, hx, 31, 3, 2, P);
        break;
      case 'engenheiro':
        forma(ctx, hx - 1, 23, 4, 12, '#eae6d0'); L(ctx, hx - 1, 23, 4, 1, '#3a72c8'); L(ctx, hx - 1, 34, 4, 1, '#3a72c8');
        L(ctx, hx, 26, 2, 1, '#5a8ad8'); L(ctx, hx, 29, 2, 1, '#5a8ad8'); L(ctx, hx, 31, 3, 2, P);
        break;
      case 'gari':
        L(ctx, hx, 14, 1, 22, '#8a6a3a'); L(ctx, hx + 1, 14, 1, 22, '#5a4220');
        forma(ctx, hx - 3, 36, 8, 4, '#d8b04a'); L(ctx, hx - 3, 36, 8, 1, '#f0d070'); L(ctx, hx - 2, 38, 1, 2, '#a07c24');
        L(ctx, hx + 2, 38, 1, 2, '#a07c24'); L(ctx, hx - 1, 30, 4, 2, '#3fae5e');
        break;
      case 'policial':
        forma(ctx, hx, 28, 2, 7, '#18181e'); L(ctx, hx, 28, 1, 7, '#44444e'); L(ctx, hx - 1, 31, 4, 2, P);
        break;
      case 'comerciante':
        forma(ctx, hx - 2, 30, 7, 7, '#4fd06f'); L(ctx, hx - 2, 30, 7, 1, '#2e9a4a'); L(ctx, hx - 1, 28, 1, 3, CONTORNO); L(ctx, hx + 3, 28, 1, 3, CONTORNO);
        L(ctx, hx, 33, 3, 2, '#fff3d0'); L(ctx, hx, 33, 1, 1, '#c0403a');
        break;
      case 'vereador':
        forma(ctx, hx - 1, 27, 5, 6, '#fff3d0'); L(ctx, hx, 28, 3, 1, '#8a8a9a'); L(ctx, hx, 30, 3, 1, '#8a8a9a'); L(ctx, hx, 32, 2, 1, '#c0403a');
        L(ctx, hx, 31, 3, 2, P);
        break;
      default: break;
    }
  }

  /* ───────── API pública ───────── */
  var buffer = null;
  function desenharMorador(canvas, aparencia, escala, oficio, recorte) {
    var ap = aparencia || aparenciaAleatoria();
    var esc = Math.max(1, Math.floor(escala || 6));
    if (!buffer) { buffer = document.createElement('canvas'); buffer.width = LARG; buffer.height = ALT; }
    var bctx = buffer.getContext('2d');
    bctx.imageSmoothingEnabled = false;
    desenharGrade(bctx, ap, oficio);

    var r = recorte || { x: 0, y: 0, w: LARG, h: ALT };
    var cw = r.w * esc, ch = r.h * esc;
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(buffer, r.x, r.y, r.w, r.h, 0, 0, cw, ch);
    return canvas;
  }

  function sorteia(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function aparenciaAleatoria(sexo) {
    var s = sexo || (Math.random() < 0.5 ? 'homem' : 'mulher');
    var fem = s === 'mulher';
    var idsH = ['curto', 'topete', 'social', 'raspado', 'moicano', 'cacheado', 'afro', 'curto', 'topete', 'careca'];
    var idsM = ['bob', 'longo', 'franja', 'rabo', 'coque', 'cacheado', 'afro', 'longo', 'bob', 'curto'];
    var peleIdx = Math.floor(Math.random() * PALETA.pele.length);
    var corCab = Math.random() < 0.8 ? Math.floor(Math.random() * 8) : Math.floor(Math.random() * PALETA.cabelo.length);
    var marcas = ['nenhuma', 'nenhuma', 'nenhuma', 'sardas', 'bochechas', 'oculos', 'oculosSol', 'pinta'];
    return {
      sexo: s,
      corpo: Math.random() < 0.22 ? 'robusto' : 'normal',
      pele: peleIdx,
      olhos: fem ? sorteia(['redondo', 'cilios', 'cilios', 'grande', 'feliz']) : sorteia(['redondo', 'redondo', 'grande', 'feliz', 'sono']),
      corOlhos: Math.floor(Math.random() * PALETA.olhos.length),
      sobrancelha: sorteia(['normal', 'normal', 'grossa', 'fina', 'brava']),
      boca: sorteia(['sorriso', 'sorriso', 'neutra', 'aberta', 'sorrisao']),
      corLabios: fem ? sorteia([0, 1, 2, 3, 4]) : 0,
      barba: fem ? 'nenhuma' : sorteia(['nenhuma', 'nenhuma', 'nenhuma', 'rala', 'bigode', 'cavanhaque', 'barba']),
      marca: sorteia(marcas),
      cabelo: sorteia(fem ? idsM : idsH),
      corCabelo: corCab,
      baixo: fem ? sorteia(['calca', 'saia', 'saia', 'short']) : sorteia(['calca', 'calca', 'short']),
      manga: sorteia(['curta', 'curta', 'comprida', 'regata']),
      camisa: Math.floor(Math.random() * PALETA.roupa.length),
      calca: sorteia([1, 2, 9, 12, 13, 13, 1]),
      sapato: Math.floor(Math.random() * PALETA.sapato.length)
    };
  }

  var api = {
    LARG: LARG, ALT: ALT,
    desenharMorador: desenharMorador, aparenciaAleatoria: aparenciaAleatoria,
    PALETA: PALETA, ESTILOS_CABELO: ESTILOS_CABELO, OPCOES: OPCOES, OFICIOS: OFICIOS, TRAJES: TRAJES,
    acharOficio: acharOficio, rotuloOficio: rotuloOficio
  };
  var alvo = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  Object.keys(api).forEach(function (k) { alvo[k] = api[k]; });
  alvo.Personagem = api;
})();
