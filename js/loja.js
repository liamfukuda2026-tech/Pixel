/* Caraguá Pixel · Loja VIP, Barra Rápida, Terrenos, Passes e Checkout PIX */
(function () {
  "use strict";

  const ENDPOINT_ECONOMIA = "api/economia.php";
  const CHAVE_INVENTARIO = "caragua_inventario_v1";
  const CHAVE_CREATOR_KEY = "caragua_creator_key_v1";
  const CHAVE_PERFIL_CHAT = "caragua_chat_perfil_v1";
  const CHAVE_MOEDAS = "caragua_moedas_v1";
  const CHAVE_PEDIDO_ATIVO = "caragua_pedido_ativo_v1";

  const PRECOS_PADRAO = {
    moto: 0.99,
    bugue: 1.99,
    esportivo: 2.99,
    caminhonete: 3.99,
    casa_simples: 2.99,
    casa_solar: 3.99,
    sobrado: 4.99,
    mansao: 6.99,
    profissao_medica: 2.99,
    profissao_barbeiro: 2.99,
    profissao_corretor: 2.99,
    profissao_empresario: 4.99,
    combo_vip: 22.00,
    loja_bronze: 19.90,
    loja_empresa_vip: 29.90,
    loja_ouro: 50.00,
    policia_vida_extra: 1.50,
    policia_moedas_500: 2.00,
    policia_arma_vip: 3.00,
    policia_moedas_1500: 5.00
  };

  const ESTILOS_CASA = [
    {
      id: "casa_simples",
      icone: "🏡",
      titulo: "Casa Caiçara",
      desc: "Térrea charmosa com varanda, fachada personalizada e porta entrável exclusiva."
    },
    {
      id: "casa_solar",
      icone: "🌴",
      titulo: "Casa Solar da Orla",
      desc: "Ampla e iluminada com jardim costeiro, placa com seu @ e sala interna 3D."
    },
    {
      id: "sobrado",
      icone: "🏢",
      titulo: "Sobrado Panorâmico",
      desc: "Dois andares em voxel art com sacada superior, destaque na rua e sala VIP."
    },
    {
      id: "mansao",
      icone: "🏰",
      titulo: "Mansão Imperial",
      desc: "Arquitetura imponente de alto padrão para marcar presença permanente na cidade."
    }
  ];

  const CORES_PAREDE = [
    "#f59e0b",
    "#38bdf8",
    "#4fd06f",
    "#fb7185",
    "#a78bfa",
    "#facc15",
    "#f97316",
    "#e2e8f0"
  ];

  const CARROS_CATALOGO = [
    {
      id: "moto",
      icone: "🛵",
      titulo: "Moto Caiçara",
      desc: "Ágil para cortar o trânsito da avenida e passear pela ciclovia da praia."
    },
    {
      id: "bugue",
      icone: "🏖️",
      titulo: "Bugue das Praias",
      desc: "Clássico aberto da orla com som de motor, buzina [H] e banco de carona [F]."
    },
    {
      id: "esportivo",
      icone: "🏎️",
      titulo: "Esportivo Turbo",
      desc: "Velocidade máxima nas avenidas de Caraguá com visual rebaixado e carona [F]."
    },
    {
      id: "caminhonete",
      icone: "🛻",
      titulo: "Caminhonete 4x4",
      desc: "Forte e imponente para explorar do centro até a Fazenda e levar amigos."
    }
  ];

  const PROFISSOES_CATALOGO = [
    {
      id: "profissao_medica",
      icone: "🩺",
      titulo: "Médica(o) da Cidade",
      rotuloPlaca: "🩺 Médica(o)",
      desc: "Exibe tag oficial na sua placa 3D e destaque nos atendimentos do Consultório."
    },
    {
      id: "profissao_barbeiro",
      icone: "💈",
      titulo: "Barbeiro(a) Oficial",
      rotuloPlaca: "💈 Barbeiro(a)",
      desc: "Tag exclusiva na placa acima do seu personagem e presença na Barbearia."
    },
    {
      id: "profissao_corretor",
      icone: "🏠",
      titulo: "Corretor(a) Imobiliário",
      rotuloPlaca: "🏠 Corretor(a)",
      desc: "Negocie terrenos e receba moradores com selo oficial de Corretor na cabeça."
    },
    {
      id: "profissao_empresario",
      icone: "💼",
      titulo: "Empresário(a) VIP",
      rotuloPlaca: "💼 Empresário(a)",
      desc: "Status executivo em toda a cidade, salas da Prefeitura e eventos."
    }
  ];

  // ---------- Acessores dinâmicos seguros ----------
  function getMundo() {
    return window.CARAGUA_MUNDO || null;
  }

  function getOnline() {
    return window.CARAGUA_ONLINE || null;
  }

  function getInteracoes() {
    return window.CARAGUA_INTERACOES || null;
  }

  function avisar(msg) {
    const m = getMundo();
    if (m && typeof m.avisa === "function") {
      m.avisa(msg);
    }
  }

  // ---------- Construtor DOM Seguro ----------
  function h(tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) {
      const keys = Object.keys(attrs);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const v = attrs[k];
        if (v === undefined || v === null || v === false) continue;
        if (k === "className") {
          el.className = v;
        } else if (k === "text") {
          el.textContent = String(v);
        } else if (k === "style" && typeof v === "object") {
          Object.assign(el.style, v);
        } else if (k === "dataset" && typeof v === "object") {
          const dks = Object.keys(v);
          for (let j = 0; j < dks.length; j++) {
            el.dataset[dks[j]] = String(v[dks[j]]);
          }
        } else if (k.slice(0, 2) === "on" && typeof v === "function") {
          el.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (v === true) {
          el.setAttribute(k, "");
        } else {
          el.setAttribute(k, String(v));
        }
      }
    }
    for (let i = 2; i < arguments.length; i++) {
      anexarFilho(el, arguments[i]);
    }
    return el;
  }

  function anexarFilho(pai, filho) {
    if (filho === null || filho === undefined || filho === false) return;
    if (Array.isArray(filho)) {
      for (let i = 0; i < filho.length; i++) anexarFilho(pai, filho[i]);
      return;
    }
    if (filho instanceof Node) {
      pai.appendChild(filho);
    } else {
      pai.appendChild(document.createTextNode(String(filho)));
    }
  }

  function limparElemento(el) {
    while (el && el.firstChild) el.removeChild(el.firstChild);
  }

  function formatarBRL(valor) {
    const num = Number(valor);
    const v = Number.isFinite(num) ? num : 0;
    return "R$ " + v.toFixed(2).replace(".", ",");
  }

  function copiarTexto(texto, aoCopiar) {
    const str = String(texto || "");
    if (!str) return;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(str).then(
        function () {
          if (aoCopiar) aoCopiar(true);
        },
        function () {
          copiarFallback(str, aoCopiar);
        }
      );
      return;
    }
    copiarFallback(str, aoCopiar);
  }

  function copiarFallback(str, aoCopiar) {
    try {
      const ta = document.createElement("textarea");
      ta.value = str;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      if (aoCopiar) aoCopiar(true);
    } catch (e) {
      if (aoCopiar) aoCopiar(false);
    }
  }

  // ---------- Gerador QR Code ISO/IEC 18004 Puro em Canvas (Versões 1..10, Nível L) ----------
  const QR_VERSOES_L = [
    null,
    { total: 26, ec: 7, grupos: [[1, 19]], align: [] },
    { total: 44, ec: 10, grupos: [[1, 34]], align: [6, 18] },
    { total: 70, ec: 15, grupos: [[1, 55]], align: [6, 22] },
    { total: 100, ec: 20, grupos: [[1, 80]], align: [6, 26] },
    { total: 134, ec: 26, grupos: [[1, 108]], align: [6, 30] },
    { total: 172, ec: 18, grupos: [[2, 68]], align: [6, 34] },
    { total: 196, ec: 20, grupos: [[2, 78]], align: [6, 22, 38], vInfo: 0x07c94 },
    { total: 242, ec: 24, grupos: [[2, 97]], align: [6, 24, 42], vInfo: 0x085bc },
    { total: 292, ec: 30, grupos: [[2, 116]], align: [6, 26, 46], vInfo: 0x09a99 },
    { total: 346, ec: 18, grupos: [[2, 68], [2, 69]], align: [6, 28, 50], vInfo: 0x0a4d3 }
  ];

  const GF_EXP = new Uint8Array(512);
  const GF_LOG = new Uint8Array(256);
  (function initGF() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function rsGerador(grau) {
    let poly = [1];
    for (let i = 0; i < grau; i++) {
      const prox = new Array(poly.length + 1).fill(0);
      const raiz = GF_EXP[i];
      for (let j = 0; j < poly.length; j++) {
        prox[j] ^= poly[j];
        prox[j + 1] ^= gfMul(poly[j], raiz);
      }
      poly = prox;
    }
    return poly;
  }

  function rsResto(dados, grau) {
    const gen = rsGerador(grau);
    const res = new Uint8Array(grau);
    for (let i = 0; i < dados.length; i++) {
      const fator = dados[i] ^ res[0];
      for (let j = 0; j < grau - 1; j++) res[j] = res[j + 1];
      res[grau - 1] = 0;
      if (fator !== 0) {
        for (let j = 0; j < grau; j++) {
          res[j] ^= gfMul(gen[j + 1], fator);
        }
      }
    }
    return res;
  }

  function gerarMatrizQR(texto) {
    const bytes = new TextEncoder().encode(String(texto || ""));
    let ver = 0;
    let cfg = null;
    let capDados = 0;

    for (let v = 1; v <= 10; v++) {
      const c = QR_VERSOES_L[v];
      let soma = 0;
      for (let g = 0; g < c.grupos.length; g++) {
        soma += c.grupos[g][0] * c.grupos[g][1];
      }
      const bitsCab = v <= 9 ? 12 : 20;
      if ((bytes.length * 8 + bitsCab) <= soma * 8) {
        ver = v;
        cfg = c;
        capDados = soma;
        break;
      }
    }
    if (!cfg) return null;

    const bits = [];
    function pushBits(val, len) {
      for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
    }
    pushBits(0b0100, 4);
    pushBits(bytes.length, ver <= 9 ? 8 : 16);
    for (let i = 0; i < bytes.length; i++) pushBits(bytes[i], 8);

    const maxBits = capDados * 8;
    for (let i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    const codewords = new Uint8Array(capDados);
    for (let i = 0; i < bits.length / 8; i++) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
      codewords[i] = b;
    }
    const pads = [0xec, 0x11];
    for (let i = bits.length / 8, p = 0; i < capDados; i++, p ^= 1) {
      codewords[i] = pads[p];
    }

    const blocosDados = [];
    const blocosEc = [];
    let offset = 0;
    let maxLenBloco = 0;
    for (let g = 0; g < cfg.grupos.length; g++) {
      const qtd = cfg.grupos[g][0];
      const tam = cfg.grupos[g][1];
      if (tam > maxLenBloco) maxLenBloco = tam;
      for (let b = 0; b < qtd; b++) {
        const fatia = codewords.slice(offset, offset + tam);
        offset += tam;
        blocosDados.push(fatia);
        blocosEc.push(rsResto(fatia, cfg.ec));
      }
    }

    const finalBytes = [];
    for (let i = 0; i < maxLenBloco; i++) {
      for (let b = 0; b < blocosDados.length; b++) {
        if (i < blocosDados[b].length) finalBytes.push(blocosDados[b][i]);
      }
    }
    for (let i = 0; i < cfg.ec; i++) {
      for (let b = 0; b < blocosEc.length; b++) {
        finalBytes.push(blocosEc[b][i]);
      }
    }

    const N = 17 + 4 * ver;
    const mat = [];
    const resv = [];
    for (let r = 0; r < N; r++) {
      mat.push(new Uint8Array(N));
      resv.push(new Uint8Array(N));
    }

    function setFunc(r, c, escuro) {
      if (r < 0 || c < 0 || r >= N || c >= N) return;
      mat[r][c] = escuro ? 1 : 0;
      resv[r][c] = 1;
    }

    function finder(r0, c0) {
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          const r = r0 + dr;
          const c = c0 + dc;
          if (r < 0 || c < 0 || r >= N || c >= N) continue;
          const dentro7 = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
          const borda7 = dr === 0 || dr === 6 || dc === 0 || dc === 6;
          const miolo3 = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          setFunc(r, c, dentro7 && (borda7 || miolo3));
        }
      }
    }

    finder(0, 0);
    finder(0, N - 7);
    finder(N - 7, 0);

    const al = cfg.align;
    for (let i = 0; i < al.length; i++) {
      for (let j = 0; j < al.length; j++) {
        const cr = al[i];
        const cc = al[j];
        if ((cr <= 8 && cc <= 8) || (cr <= 8 && cc >= N - 9) || (cr >= N - 9 && cc <= 8)) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const escuro = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
            setFunc(cr + dr, cc + dc, escuro);
          }
        }
      }
    }

    for (let i = 8; i < N - 8; i++) {
      if (!resv[6][i]) setFunc(6, i, i % 2 === 0);
      if (!resv[i][6]) setFunc(i, 6, i % 2 === 0);
    }

    setFunc(N - 8, 8, true);

    // Reserva áreas de formato (Level L = 01, Mask 0 = 000 -> 0x77C4)
    const fmt = 0x77c4;
    const coordsTL = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    for (let i = 0; i < 15; i++) {
      const bit = (fmt >>> (14 - i)) & 1;
      setFunc(coordsTL[i][0], coordsTL[i][1], bit === 1);
    }
    for (let i = 0; i < 7; i++) {
      const bit = (fmt >>> (14 - i)) & 1;
      setFunc(N - 1 - i, 8, bit === 1);
    }
    for (let i = 7; i < 15; i++) {
      const bit = (fmt >>> (14 - i)) & 1;
      setFunc(8, N - 15 + i, bit === 1);
    }

    if (cfg.vInfo) {
      for (let i = 0; i < 18; i++) {
        const bit = ((cfg.vInfo >>> i) & 1) === 1;
        const a = Math.floor(i / 3);
        const b = (i % 3) + N - 11;
        setFunc(a, b, bit);
        setFunc(b, a, bit);
      }
    }

    let bitIdx = 0;
    const totalBitsFinal = finalBytes.length * 8;
    let paraCima = true;
    for (let col = N - 1; col >= 1; col -= 2) {
      if (col === 6) col = 5;
      for (let passo = 0; passo < N; passo++) {
        const r = paraCima ? (N - 1 - passo) : passo;
        for (let dc = 0; dc < 2; dc++) {
          const c = col - dc;
          if (resv[r][c]) continue;
          let escuro = 0;
          if (bitIdx < totalBitsFinal) {
            escuro = (finalBytes[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1;
            bitIdx++;
          }
          if ((r + c) % 2 === 0) escuro ^= 1;
          mat[r][c] = escuro;
        }
      }
      paraCima = !paraCima;
    }

    return mat;
  }

  function desenharQRCanvas(canvas, brcode) {
    const ctx = canvas.getContext("2d");
    const W = 220;
    canvas.width = W;
    canvas.height = W;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, W);

    const mat = gerarMatrizQR(brcode);
    if (!mat) {
      // Caso o código ultrapasse 271 bytes, carrega imagem QR limpa no canvas
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, W);
        ctx.drawImage(img, 8, 8, W - 16, W - 16);
      };
      img.src = "https://api.qrserver.com/v1/create-qr-code/?size=204x204&margin=0&data=" + encodeURIComponent(brcode);
      return;
    }

    const N = mat.length;
    const margemModulos = 3;
    const escala = Math.floor(W / (N + margemModulos * 2));
    const offset = Math.floor((W - N * escala) / 2);

    ctx.fillStyle = "#0a0f1d";
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (mat[r][c]) {
          ctx.fillRect(offset + c * escala, offset + r * escala, escala, escala);
        }
      }
    }
  }

  // ---------- Inventário Local (localStorage.caragua_inventario_v1) ----------
  function carregarInventario() {
    const padrao = {
      carros: [],
      carroPreferido: "",
      profissoes: [],
      profissaoAtiva: "",
      profissaoId: "",
      casas: [],
      vip: false,
      criador: false,
      badge: "",
      passes: []
    };
    try {
      const raw = localStorage.getItem(CHAVE_INVENTARIO);
      if (!raw) return padrao;
      const p = JSON.parse(raw);
      if (!p || typeof p !== "object") return padrao;
      return {
        carros: Array.isArray(p.carros) ? p.carros.filter(Boolean) : [],
        carroPreferido: typeof p.carroPreferido === "string" ? p.carroPreferido : "",
        profissoes: Array.isArray(p.profissoes) ? p.profissoes.filter(Boolean) : [],
        profissaoAtiva: typeof p.profissaoAtiva === "string" ? p.profissaoAtiva : "",
        profissaoId: typeof p.profissaoId === "string" ? p.profissaoId : "",
        casas: Array.isArray(p.casas) ? p.casas.filter(Boolean) : [],
        vip: !!p.vip,
        criador: !!p.criador,
        badge: typeof p.badge === "string" ? p.badge : "",
        passes: Array.isArray(p.passes) ? p.passes.filter(Boolean) : []
      };
    } catch (e) {
      return padrao;
    }
  }

  function salvarInventario() {
    try {
      localStorage.setItem(CHAVE_INVENTARIO, JSON.stringify(inventario));
    } catch (e) {}
  }

  function addUnico(lista, item) {
    if (item && lista.indexOf(item) === -1) lista.push(item);
  }

  let inventario = carregarInventario();
  const codigosEmResgate = new Set();

  function salvarPedidoAtivoStorage(ped) {
    try {
      if (!ped || ped.status !== "pending") {
        localStorage.removeItem(CHAVE_PEDIDO_ATIVO);
        return;
      }
      localStorage.setItem(CHAVE_PEDIDO_ATIVO, JSON.stringify({
        id: ped.id,
        kind: ped.kind || "",
        item_id: ped.item_id || "",
        amount: ped.amount || 0,
        pix_configured: !!ped.pix_configured,
        mp_enabled: !!ped.mp_enabled,
        pix_brcode: ped.pix_brcode || "",
        pix_qr_base64: ped.pix_qr_base64 || "",
        status: ped.status,
        pass_code: ped.pass_code || "",
        payload: ped.payload || {},
        iniciadoEm: ped.iniciadoEm || Date.now()
      }));
    } catch (e) {}
  }

  function carregarPedidoAtivoStorage() {
    try {
      const raw = localStorage.getItem(CHAVE_PEDIDO_ATIVO);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p || !p.id || p.status !== "pending") {
        localStorage.removeItem(CHAVE_PEDIDO_ATIVO);
        return null;
      }
      const iniciado = Number(p.iniciadoEm) || 0;
      if (!iniciado || (Date.now() - iniciado) > 45 * 60 * 1000) {
        localStorage.removeItem(CHAVE_PEDIDO_ATIVO);
        return null;
      }
      return p;
    } catch (e) {
      return null;
    }
  }

  // ---------- Identidade do Comprador ----------
  function obterIdentidadeJogador() {
    const online = getOnline();
    let pid = "";
    let nome = "";
    let arroba = "";

    if (online) {
      if (typeof online.getPid === "function") pid = online.getPid() || "";
      if (typeof online.getPerfil === "function") {
        const pf = online.getPerfil();
        if (pf) {
          nome = pf.nome || "";
          arroba = pf.arroba || "";
          if (!pid && pf.pid) pid = pf.pid;
        }
      }
    }

    if (!nome || !pid) {
      try {
        const raw = localStorage.getItem(CHAVE_PERFIL_CHAT);
        if (raw) {
          const salvo = JSON.parse(raw);
          if (salvo) {
            if (!pid && salvo.pid) pid = salvo.pid;
            if (!nome && salvo.nome) nome = salvo.nome;
            if (!arroba && salvo.arroba) arroba = salvo.arroba;
          }
        }
      } catch (e) {}
    }

    const m = getMundo();
    if (!nome && m && m.meuMorador && m.meuMorador.nome) {
      nome = m.meuMorador.nome;
    }
    if (!arroba && m && m.meuMorador && m.meuMorador.insta) {
      arroba = String(m.meuMorador.insta).replace(/^@+/, "");
    }

    return {
      pid: pid || "visitante",
      nome: nome || "Morador",
      arroba: String(arroba || "").replace(/^@+/, "")
    };
  }

  // ---------- Chamadas HTTP para api/economia.php ----------
  async function apiGet(action, params) {
    const qs = new URLSearchParams(Object.assign({ action: action }, params || {}));
    const resp = await fetch(ENDPOINT_ECONOMIA + "?" + qs.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    const json = await resp.json().catch(function () {
      return { ok: false, erro: "Resposta inválida do servidor." };
    });
    if (!resp.ok && json && json.ok !== false) json.ok = false;
    return json;
  }

  async function apiPost(action, payload) {
    const body = Object.assign({ action: action }, payload || {});
    const resp = await fetch(ENDPOINT_ECONOMIA + "?action=" + encodeURIComponent(action), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(body)
    });
    const json = await resp.json().catch(function () {
      return { ok: false, erro: "Resposta inválida do servidor." };
    });
    if (!resp.ok && json && json.ok !== false) json.ok = false;
    return json;
  }

  function msgErroApi(res, padrao) {
    if (!res) return padrao || "Falha de conexão com o servidor.";
    return res.erro || res.error || res.message || padrao || "Não foi possível concluir.";
  }

  // ---------- Estado da Loja e Economia ----------
  const estado = {
    pixConfigured: false,
    prices: Object.assign({}, PRECOS_PADRAO),
    catalog: [],
    ownedLots: [],
    creatorHint: "@caraguapixel",
    vagasEmpresasTotal: 20,
    vagasEmpresasOcupadas: 0,
    vagasEmpresasRestantes: 20,
    modalAberto: false,
    abaAtiva: "casas",
    loteSelecionado: "",
    estiloCasa: "casa_solar",
    corCasa: "#f59e0b",
    tituloCasa: "",
    nomeComprador: "",
    arrobaComprador: "",
    comboLoteId: "",
    comboProfissao: "profissao_empresario",
    comboCor: "#f59e0b",
    codigoInput: "",
    feedback: null, // { tipo: 'sucesso'|'erro'|'alerta', texto: '' }
    carregando: false,
    pedidoAtivo: null, // { id, kind, item_id, amount, pix_configured, pix_brcode, status, pass_code, iniciadoEm }
    exibindoCheckout: false,
    timerCheckOrder: null,
    testDriveAte: 0
  };

  function precoDe(itemId) {
    if (estado.prices && Number.isFinite(Number(estado.prices[itemId]))) {
      return Number(estado.prices[itemId]);
    }
    return PRECOS_PADRAO[itemId] || 19.90;
  }

  function kindDeCatalogo(itemId, fallbackKind) {
    if (Array.isArray(estado.catalog)) {
      for (let i = 0; i < estado.catalog.length; i++) {
        const c = estado.catalog[i];
        if (c && (c.id === itemId || c.item_id === itemId) && c.kind) {
          return c.kind;
        }
      }
    }
    return fallbackKind;
  }

  function rotuloProfissaoPorId(itemId) {
    for (let i = 0; i < PROFISSOES_CATALOGO.length; i++) {
      if (PROFISSOES_CATALOGO[i].id === itemId) return PROFISSOES_CATALOGO[i].rotuloPlaca;
    }
    return "💼 VIP";
  }

  function obterLotesInfo() {
    const m = getMundo();
    const listaMundo = m && Array.isArray(m.lotesLivres) ? m.lotesLivres : [];
    const ocupadosSet = new Set();
    for (let i = 0; i < estado.ownedLots.length; i++) {
      if (estado.ownedLots[i] && estado.ownedLots[i].lot_id) {
        ocupadosSet.add(String(estado.ownedLots[i].lot_id));
      }
    }

    const livres = [];
    const todosIds = new Set();

    for (let i = 0; i < listaMundo.length; i++) {
      const l = listaMundo[i];
      if (!l || !l.id) continue;
      const idStr = String(l.id);
      todosIds.add(idStr);
      if (!l.ocupada && !ocupadosSet.has(idStr)) {
        livres.push(l);
      }
    }
    ocupadosSet.forEach(function (id) {
      todosIds.add(id);
    });

    return {
      livres: livres,
      total: Math.max(todosIds.size, livres.length + ocupadosSet.size)
    };
  }

  // ---------- Sincronização com Online / Mundo ----------
  function sincronizarInventarioNaRede() {
    const online = getOnline();
    if (!online || typeof online.setEstadoInteracao !== "function") return;

    const patch = {};
    const creatorKeySalva = (function () {
      try {
        return localStorage.getItem(CHAVE_CREATOR_KEY) || "";
      } catch (e) {
        return "";
      }
    })();

    const estadoAtual = typeof online.getEstadoInteracao === "function" ? (online.getEstadoInteracao() || {}) : {};

    if (inventario.criador && creatorKeySalva) {
      patch.badge = "criador";
      patch.creator_key = creatorKeySalva;
    } else if (inventario.vip) {
      if (estadoAtual.badge !== "criador" && estadoAtual.badge !== "coroa") {
        patch.badge = "vip";
      }
    }

    if (inventario.profissaoAtiva) {
      patch.profissao = inventario.profissaoAtiva;
    }

    if (Object.keys(patch).length > 0) {
      online.setEstadoInteracao(patch);
    }
  }

  function aplicarCasasCompradasNoMundo() {
    const m = getMundo();
    if (!m || typeof m.construirCasaComprada !== "function") return;
    for (let i = 0; i < estado.ownedLots.length; i++) {
      const lot = estado.ownedLots[i];
      if (lot && lot.lot_id) {
        try {
          m.construirCasaComprada(lot);
        } catch (e) {}
      }
    }
  }

  let sincronizandoPublico = false;

  async function sincronizarEstadoPublico() {
    if (sincronizandoPublico) return;
    sincronizandoPublico = true;
    try {
      const ident = obterIdentidadeJogador();
      const params = (ident.pid && ident.pid !== "visitante") ? { pid: ident.pid } : undefined;
      const res = await apiGet("public_state", params);
      if (!res || !res.ok) return;

      estado.pixConfigured = !!res.pix_configured;
      if (res.prices && typeof res.prices === "object") {
        estado.prices = Object.assign({}, PRECOS_PADRAO, res.prices);
      }
      if (Array.isArray(res.catalog)) {
        estado.catalog = res.catalog;
      }
      if (Array.isArray(res.owned_lots)) {
        estado.ownedLots = res.owned_lots;
      }
      if (res.creator_hint) {
        estado.creatorHint = String(res.creator_hint);
      }
      if (Number.isFinite(Number(res.vagas_empresas_total))) {
        estado.vagasEmpresasTotal = Math.max(1, Number(res.vagas_empresas_total));
      }
      if (Number.isFinite(Number(res.vagas_empresas_ocupadas))) {
        estado.vagasEmpresasOcupadas = Math.max(0, Number(res.vagas_empresas_ocupadas));
      }
      if (Number.isFinite(Number(res.vagas_empresas_restantes))) {
        estado.vagasEmpresasRestantes = Math.max(0, Number(res.vagas_empresas_restantes));
      }

      aplicarCasasCompradasNoMundo();

      if (Array.isArray(res.my_passes) && res.my_passes.length > 0) {
        let liberouNovo = false;
        for (let i = 0; i < res.my_passes.length; i++) {
          const mp = res.my_passes[i];
          const code = mp && mp.code ? String(mp.code).trim().toUpperCase() : "";
          if (!code || inventario.passes.indexOf(code) !== -1 || codigosEmResgate.has(code)) {
            continue;
          }
          const ok = await aplicarResgateDeCodigo(code, true);
          if (ok) liberouNovo = true;
        }
        if (liberouNovo) {
          atualizarBarraRapida();
          avisar("🎉 Compra PIX confirmada! Seu item VIP foi liberado automaticamente!");
        }
      }

      if (estado.modalAberto && (!estado.pedidoAtivo || !estado.exibindoCheckout)) {
        renderizarCorpoModal();
      }
    } catch (e) {
      // Silencioso caso rode offline sem PHP local
    } finally {
      sincronizandoPublico = false;
    }
  }

  // ---------- Leitura de Moedas e Carro Ativo ----------
  function lerMoedasInfo() {
    const inter = getInteracoes();
    if (inter && typeof inter.getMoedasInfo === "function") {
      try {
        const info = inter.getMoedasInfo();
        if (typeof info === "number") return { n: info, total: 10 };
        if (Array.isArray(info)) return { n: info.length, total: 10 };
        if (info && typeof info === "object") {
          const n =
            info.coletadas !== undefined ? info.coletadas :
            info.count !== undefined ? info.count :
            info.qtd !== undefined ? info.qtd :
            info.collected !== undefined ? info.collected :
            Array.isArray(info.ids) ? info.ids.length :
            Array.isArray(info.moedas) ? info.moedas.length : 0;
          return { n: Number(n) || 0, total: Number(info.total) || 10 };
        }
      } catch (e) {}
    }

    try {
      const raw = localStorage.getItem(CHAVE_MOEDAS);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) return { n: p.length, total: 10 };
        if (p && typeof p === "object") {
          const arr = p.ids || p.coletadas || p.moedas;
          if (Array.isArray(arr)) return { n: arr.length, total: 10 };
        }
      }
    } catch (e) {}

    return { n: 0, total: 10 };
  }

  function estaEmVeiculoOuCarona() {
    const online = getOnline();
    if (online && typeof online.getEstadoInteracao === "function") {
      const st = online.getEstadoInteracao();
      if (st && (st.car_type || st.ride_of)) return true;
    }
    if (estado.testDriveAte > Date.now()) return true;
    return false;
  }

  // ---------- Construção da Barra Rápida e HUD ----------
  let hudRoot = null;
  let barraEl = null;
  let btnAbrirLoja = null;
  let btnContaArroba = null;
  let spanContaTxt = null;
  let btnMenuMobile = null;
  let drawerMobileEl = null;
  let drawerGridEl = null;
  let drawerControlesEl = null;
  let drawerInfoNumsEl = null;
  let btnMapaMob = null;
  let btnFecharMapaMob = null;
  let btnAbrirDom = null;
  let spanAbrirTexto = null;
  let qtdDom = null;
  let btnApoiarDom = null;
  let grupoUtil = null;
  let grupoEmotes = null;
  let mobPainelPlacaEl = null;
  let mobPainelNumsEl = null;
  let mobPainelLugaresEl = null;
  let obsInfoCidade = null;
  let padMobile = null;
  let btnPuloMob = null;
  let btnBuzinaMob = null;
  let btnDiaNoite = null;
  let btnSom = null;
  let btnMoedas = null;
  let btnCarro = null;
  let btnJetski = null;
  let btnPedidoVivo = null;
  let pillContexto = null;
  let pillCtxTecla = null;
  let pillCtxTexto = null;
  let modalOverlay = null;
  let modalCorpo = null;
  let botoesAbas = {};

  function fecharPainelBusca() {
    const painelEl = document.getElementById("painel");
    if (painelEl && !painelEl.hidden) {
      painelEl.hidden = true;
    }
    if (btnAbrirDom) {
      btnAbrirDom.setAttribute("aria-expanded", "false");
    }
  }

  function posicionarFecharMapaMob() {
    if (!btnFecharMapaMob || btnFecharMapaMob.hidden) return;
    const mapaEl = document.getElementById("mapa");
    if (!mapaEl) return;
    const r = mapaEl.getBoundingClientRect();
    if (r && r.height > 0) {
      const topPos = Math.max(88, Math.round(r.top - 36));
      btnFecharMapaMob.style.top = topPos + "px";
    }
  }

  function fecharMapaMobile() {
    const mapaEl = document.getElementById("mapa");
    if (mapaEl) {
      mapaEl.classList.remove("mob-mapa-aberto");
      mapaEl.classList.remove("expandido");
    }
    if (btnFecharMapaMob) {
      btnFecharMapaMob.hidden = true;
    }
    if (btnMapaMob) {
      btnMapaMob.classList.remove("ativo");
      btnMapaMob.textContent = "🗺️ Mapa";
      btnMapaMob.setAttribute("aria-pressed", "false");
    }
  }

  function abrirMapaMobile() {
    const mapaEl = document.getElementById("mapa");
    if (!mapaEl) return;
    fecharMenuMobile();
    fecharPainelBusca();
    mapaEl.classList.add("mob-mapa-aberto");
    mapaEl.classList.add("expandido");
    if (btnFecharMapaMob) {
      btnFecharMapaMob.hidden = false;
      requestAnimationFrame(posicionarFecharMapaMob);
    }
    if (btnMapaMob) {
      btnMapaMob.classList.add("ativo");
      btnMapaMob.textContent = "🗺️ Ocultar Mapa";
      btnMapaMob.setAttribute("aria-pressed", "true");
    }
    avisar("🗺️ Toque em um ponto do mapa para ir até lá!");
  }

  function fecharMenuMobile() {
    if (barraEl) barraEl.classList.remove("menu-mob-aberto");
    if (drawerMobileEl) drawerMobileEl.hidden = true;
    if (btnMenuMobile) {
      btnMenuMobile.setAttribute("aria-expanded", "false");
      btnMenuMobile.textContent = "☰ Mais";
    }
  }

  function abrirMenuMobile() {
    if (!drawerMobileEl) return;
    fecharPainelBusca();
    fecharMapaMobile();
    sincronizarInfoCidadeMobile();
    if (barraEl) barraEl.classList.add("menu-mob-aberto");
    drawerMobileEl.hidden = false;
    if (btnMenuMobile) {
      btnMenuMobile.setAttribute("aria-expanded", "true");
      btnMenuMobile.textContent = "✕ Fechar";
    }
  }

  function sincronizarInfoCidadeMobile() {
    const numsEl = document.getElementById("numeros");
    const txtNums = numsEl && numsEl.textContent ? numsEl.textContent.trim() : "Carregando a cidade…";
    if (drawerInfoNumsEl && drawerInfoNumsEl.textContent !== txtNums) {
      drawerInfoNumsEl.textContent = txtNums;
    }
    if (mobPainelNumsEl && mobPainelNumsEl.textContent !== txtNums) {
      mobPainelNumsEl.textContent = txtNums;
    }
    const lugaresSrc = document.getElementById("lugares");
    if (lugaresSrc && mobPainelLugaresEl) {
      const qtdSrc = lugaresSrc.children ? lugaresSrc.children.length : 0;
      if (qtdSrc > 0 && mobPainelLugaresEl.dataset.syncedCount !== String(qtdSrc)) {
        limparElemento(mobPainelLugaresEl);
        for (let i = 0; i < qtdSrc; i++) {
          mobPainelLugaresEl.appendChild(lugaresSrc.children[i].cloneNode(true));
        }
        mobPainelLugaresEl.dataset.syncedCount = String(qtdSrc);
      }
    }
  }

  function garantirPainelPlacaMobile() {
    const painelEl = document.getElementById("painel");
    if (!painelEl) return;
    if (!mobPainelPlacaEl || mobPainelPlacaEl.parentElement !== painelEl) {
      mobPainelNumsEl = h("p", { className: "mob-painel-numeros", text: "Carregando a cidade…" });
      mobPainelLugaresEl = h("ul", { className: "mob-lugares-lista" });
      mobPainelPlacaEl = h(
        "div",
        { className: "mob-painel-placa" },
        h(
          "div",
          { className: "mob-painel-topo" },
          h(
            "div",
            null,
            h("div", { className: "mob-painel-titulo" }, "Caragua ", h("span", null, "Pixel")),
            h("p", { className: "mob-painel-sobre", text: "Caraguatatuba · 23°37′ S · 45°25′ O" })
          ),
          h(
            "button",
            {
              type: "button",
              className: "mob-painel-fechar",
              "aria-label": "Fechar busca",
              onClick: fecharPainelBusca
            },
            "✕"
          )
        ),
        mobPainelNumsEl,
        h(
          "details",
          { className: "mob-painel-bairros" },
          h("summary", null, "ℹ️ Pontos e bairros"),
          mobPainelLugaresEl
        )
      );
      painelEl.insertBefore(mobPainelPlacaEl, painelEl.firstChild || null);
    }
    sincronizarInfoCidadeMobile();
  }

  function montarHUD() {
    hudRoot = document.getElementById("loja-hud");
    if (!hudRoot) {
      hudRoot = document.createElement("div");
      hudRoot.id = "loja-hud";
      hudRoot.setAttribute("aria-label", "Loja, ações rápidas e controles");
      document.body.appendChild(hudRoot);
    }

    const acoesOrig = document.querySelector(".hud-acoes");
    if (acoesOrig) {
      if (btnAbrirDom && btnAbrirDom.parentElement && btnAbrirDom.parentElement.closest("#loja-hud")) {
        acoesOrig.appendChild(btnAbrirDom);
      }
      if (btnApoiarDom && btnApoiarDom.parentElement && btnApoiarDom.parentElement.closest("#loja-hud")) {
        acoesOrig.appendChild(btnApoiarDom);
      }
    }
    limparElemento(hudRoot);

    btnAbrirDom = document.getElementById("abrir");
    qtdDom = document.getElementById("qtd");
    btnApoiarDom = document.getElementById("btnApoiar");

    if (btnAbrirDom && !btnAbrirDom.dataset.mobWrapped) {
      btnAbrirDom.dataset.mobWrapped = "1";
      limparElemento(btnAbrirDom);
      spanAbrirTexto = h("span", { className: "abrir-txt" }, " Ache seu @");
      btnAbrirDom.appendChild(document.createTextNode("🔍"));
      btnAbrirDom.appendChild(spanAbrirTexto);
      if (qtdDom) {
        btnAbrirDom.appendChild(document.createTextNode(" "));
        btnAbrirDom.appendChild(qtdDom);
      }
      btnAbrirDom.setAttribute("title", "Ache seu @ na cidade");
      btnAbrirDom.setAttribute("aria-label", "Ache seu @ na cidade");
      btnAbrirDom.addEventListener("click", function () {
        fecharMenuMobile();
        fecharMapaMobile();
        sincronizarInfoCidadeMobile();
      });
    } else if (btnAbrirDom) {
      spanAbrirTexto = btnAbrirDom.querySelector(".abrir-txt");
    }

    if (btnApoiarDom && !btnApoiarDom.dataset.mobBound) {
      btnApoiarDom.dataset.mobBound = "1";
      btnApoiarDom.addEventListener("click", fecharMenuMobile);
    }

    garantirPainelPlacaMobile();

    btnAbrirLoja = h(
      "button",
      {
        type: "button",
        className: "loja-pilula loja-pilula-vip",
        title: "Abrir Loja VIP de Caraguá Pixel",
        onClick: function () {
          fecharMenuMobile();
          fecharMapaMobile();
          abrirLoja();
        }
      },
      ehLayoutMobileHud() ? "🛒 VIP" : "🛒 Loja VIP"
    );

    btnDiaNoite = h(
      "button",
      {
        type: "button",
        className: "loja-mini-btn",
        title: "Alternar Dia / Noite",
        "aria-label": "Alternar Dia ou Noite",
        onClick: function () {
          const m = getMundo();
          if (m && typeof m.setNoite === "function" && typeof m.isNoite === "function") {
            m.setNoite(!m.isNoite());
            atualizarBarraRapida();
          }
        }
      },
      "☀️"
    );

    btnSom = h(
      "button",
      {
        type: "button",
        className: "loja-mini-btn",
        title: "Ativar / Silenciar Som",
        "aria-label": "Alternar Som",
        onClick: function () {
          const inter = getInteracoes();
          if (inter && typeof inter.toggleSom === "function") {
            inter.toggleSom();
            atualizarBarraRapida();
          }
        }
      },
      "🔊"
    );

    const btnFoto = h(
      "button",
      {
        type: "button",
        className: "loja-mini-btn",
        title: "Modo Foto Stories",
        "aria-label": "Modo Foto",
        onClick: function () {
          const inter = getInteracoes();
          if (inter && typeof inter.toggleModoFoto === "function") {
            inter.toggleModoFoto();
          }
          fecharMenuMobile();
          fecharMapaMobile();
        }
      },
      "📸"
    );

    grupoUtil = h("div", { className: "loja-grupo" }, btnDiaNoite, btnSom, btnFoto);

    const btnPulo = h(
      "button",
      {
        type: "button",
        className: "loja-mini-btn",
        title: "Pular [Espaço]",
        "aria-label": "Pular",
        onClick: function () {
          const m = getMundo();
          if (m && typeof m.pular === "function") m.pular();
        }
      },
      "⬆️"
    );

    const emotesDef = [
      { icone: "👋", tipo: "acenar", dica: "Acenar [1]" },
      { icone: "💃", tipo: "dancar", dica: "Dançar [2]" },
      { icone: "❤️", tipo: "coracao", dica: "Coração [3]" },
      { icone: "😂", tipo: "rir", dica: "Rir [4]" }
    ];

    const botoesEmote = emotesDef.map(function (em) {
      return h(
        "button",
        {
          type: "button",
          className: "loja-mini-btn",
          title: em.dica,
          "aria-label": em.dica,
          onClick: function () {
            const m = getMundo();
            if (m && typeof m.fazerEmote === "function") m.fazerEmote(em.tipo);
            fecharMenuMobile();
          }
        },
        em.icone
      );
    });

    grupoEmotes = h("div", { className: "loja-grupo" }, btnPulo, botoesEmote);

    btnMenuMobile = h(
      "button",
      {
        type: "button",
        className: "loja-pilula loja-btn-menu-mob",
        "aria-expanded": "false",
        title: "Mapa, Jet Ski, Moedas, Apoie e Emotes",
        onClick: function () {
          if (!drawerMobileEl) return;
          if (drawerMobileEl.hidden) {
            abrirMenuMobile();
          } else {
            fecharMenuMobile();
          }
        }
      },
      "☰ Mais"
    );

    btnMoedas = h(
      "button",
      {
        type: "button",
        className: "loja-pilula loja-pilula-moedas",
        title: "Caça às 10 Moedas Douradas pela cidade",
        onClick: function () {
          const info = lerMoedasInfo();
          if (ehLayoutMobileHud()) fecharMenuMobile();
          if (info.n >= info.total) {
            avisar("👑 Você encontrou todas as " + info.total + " moedas douradas de Caraguá!");
          } else {
            avisar("🪙 Moedas coletadas: " + info.n + "/" + info.total + " — explore os pontos da cidade!");
          }
        }
      },
      "🪙 0/10"
    );

    btnJetski = h(
      "button",
      {
        type: "button",
        className: "loja-pilula loja-pilula-jetski",
        title: "Pilotar Jet Ski & Corrida Aquática na Praia",
        onClick: function () {
          const inter = getInteracoes();
          if (!inter) return;
          const atual = typeof inter.getCarroAtual === "function" ? inter.getCarroAtual() : "";
          if (atual === "jetski") {
            if (typeof inter.sairCarro === "function") inter.sairCarro();
          } else if (typeof inter.iniciarCorridaJetski === "function") {
            inter.iniciarCorridaJetski();
          }
          if (ehLayoutMobileHud()) fecharMenuMobile();
          atualizarBarraRapida();
        }
      },
      "🌊 Jet Ski"
    );

    btnCarro = h(
      "button",
      {
        type: "button",
        className: "loja-pilula loja-pilula-carro",
        hidden: true,
        onClick: function () {
          const inter = getInteracoes();
          if (!inter) return;
          if (ehLayoutMobileHud()) fecharMenuMobile();
          if (estaEmVeiculoOuCarona()) {
            estado.testDriveAte = 0;
            if (typeof inter.sairCarro === "function") inter.sairCarro();
            atualizarBarraRapida();
            return;
          }
          const carroEscolhido =
            (inventario.carroPreferido && inventario.carros.indexOf(inventario.carroPreferido) !== -1)
              ? inventario.carroPreferido
              : inventario.carros[0];
          if (carroEscolhido && typeof inter.embarcarMeuCarro === "function") {
            inter.embarcarMeuCarro(carroEscolhido);
            atualizarBarraRapida();
          } else {
            abrirLoja({ tab: "carros" });
          }
        }
      },
      "🚗 Carro"
    );

    btnPedidoVivo = h(
      "button",
      {
        type: "button",
        className: "loja-pilula loja-pedido-vivo",
        hidden: true,
        onClick: function () {
          fecharMenuMobile();
          estado.exibindoCheckout = true;
          abrirLoja();
        }
      },
      "⏳ Pedido VIP"
    );

    spanContaTxt = h("span", { className: "loja-conta-txt" }, "🪪 Entrar @");
    btnContaArroba = h(
      "button",
      {
        type: "button",
        className: "loja-pilula loja-pilula-conta",
        title: "Entrar com seu @ do Instagram + PIN de 4 dígitos",
        onClick: function () {
          fecharMenuMobile();
          fecharMapaMobile();
          fecharPainelBusca();
          if (estado.modalAberto) fecharLoja();
          const online = getOnline();
          if (online && typeof online.abrirLoginArroba === "function") {
            online.abrirLoginArroba();
          }
        }
      },
      spanContaTxt
    );

    btnMapaMob = h(
      "button",
      {
        type: "button",
        className: "loja-pilula loja-btn-mapa-mob",
        "aria-pressed": "false",
        title: "Abrir ou fechar minimapa de teleporte",
        onClick: function () {
          const mapaEl = document.getElementById("mapa");
          if (mapaEl && mapaEl.classList.contains("mob-mapa-aberto")) {
            fecharMapaMobile();
          } else {
            abrirMapaMobile();
          }
        }
      },
      "🗺️ Mapa"
    );

    btnFecharMapaMob = h(
      "button",
      {
        type: "button",
        className: "loja-mapa-fechar-mob",
        hidden: true,
        "aria-label": "Fechar mapa da cidade",
        onClick: fecharMapaMobile
      },
      "🗺️ Toque no mapa p/ ir · ✕"
    );

    barraEl = h(
      "div",
      { className: "loja-bar", role: "toolbar", "aria-label": "Ações rápidas da cidade" },
      btnAbrirLoja,
      btnContaArroba,
      btnMoedas,
      btnJetski,
      btnCarro,
      btnMenuMobile,
      btnPedidoVivo,
      grupoUtil,
      grupoEmotes
    );

    drawerGridEl = h("div", { className: "loja-drawer-grid" });
    drawerControlesEl = h("div", { className: "loja-drawer-controles" });
    drawerInfoNumsEl = h("span", { text: "Carregando a cidade…" });
    drawerMobileEl = h(
      "div",
      { className: "loja-drawer-mob", hidden: true, role: "region", "aria-label": "Mais opções da cidade" },
      drawerGridEl,
      h(
        "div",
        { className: "loja-drawer-acoes-sec" },
        h("span", { className: "loja-drawer-rotulo", text: "😊 Ações, clima & foto" }),
        drawerControlesEl
      ),
      h(
        "div",
        { className: "loja-drawer-info" },
        h("strong", { text: "Caraguá Pixel · Caraguatatuba 23°37′ S" }),
        drawerInfoNumsEl
      )
    );

    btnBuzinaMob = h(
      "button",
      {
        type: "button",
        className: "loja-pad-btn loja-pad-buzina",
        hidden: true,
        title: "Buzinar",
        "aria-label": "Buzinar",
        onPointerdown: function (ev) {
          ev.preventDefault();
          const inter = getInteracoes();
          if (inter && typeof inter.buzinar === "function") inter.buzinar();
          if (navigator.vibrate) { try { navigator.vibrate(15); } catch (e) {} }
        }
      },
      "📯"
    );

    btnPuloMob = h(
      "button",
      {
        type: "button",
        className: "loja-pad-btn loja-pad-pulo",
        title: "Pular",
        "aria-label": "Pular",
        onPointerdown: function (ev) {
          ev.preventDefault();
          const m = getMundo();
          if (m && typeof m.pular === "function") m.pular();
          if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
        }
      },
      "⬆️"
    );

    padMobile = h("div", { className: "loja-pad-mobile" }, btnBuzinaMob, btnPuloMob);

    const cenaEl = document.getElementById("cena");
    if (cenaEl) {
      cenaEl.addEventListener("pointerdown", function () {
        fecharMenuMobile();
        fecharMapaMobile();
      });
    }

    const mapaEl = document.getElementById("mapa");
    if (mapaEl && !mapaEl.dataset.mobBind) {
      mapaEl.dataset.mobBind = "1";
      mapaEl.addEventListener("pointerup", function () {
        if (ehLayoutMobileHud() && mapaEl.classList.contains("mob-mapa-aberto")) {
          setTimeout(fecharMapaMobile, 320);
        }
      });
    }

    if (!obsInfoCidade && typeof MutationObserver === "function") {
      const numsEl = document.getElementById("numeros");
      const lugaresEl = document.getElementById("lugares");
      obsInfoCidade = new MutationObserver(sincronizarInfoCidadeMobile);
      if (numsEl) obsInfoCidade.observe(numsEl, { childList: true, characterData: true, subtree: true });
      if (lugaresEl) obsInfoCidade.observe(lugaresEl, { childList: true });
    }

    pillCtxTecla = h("span", { className: "loja-ctx-tecla", hidden: true }, "E");
    pillCtxTexto = h("span", null, "");
    pillContexto = h(
      "button",
      {
        type: "button",
        className: "loja-ctx-pill",
        hidden: true,
        onClick: function () {
          const inter = getInteracoes();
          if (!inter || typeof inter.getContexto !== "function") return;
          const ctx = inter.getContexto();
          if (ctx && ctx.lotId && ctx.tipo === "lote") {
            abrirLoja({ tab: "casas", lotId: ctx.lotId });
            return;
          }
          if (typeof inter.acionarContexto === "function") {
            inter.acionarContexto();
          }
        }
      },
      pillCtxTecla,
      pillCtxTexto
    );

    // Modal da Loja VIP
    const listaAbas = [
      { id: "casas", label: "🏠 Casas & Terrenos" },
      { id: "carros", label: "🚗 Carros & Motos" },
      { id: "profissoes", label: "💼 Profissões & VIP" },
      { id: "empresas", label: "🏢 Sua Loja" },
      { id: "codigo", label: "🔑 Ativar Código" }
    ];

    const containerAbas = h("div", { className: "loja-abas", role: "tablist" });
    botoesAbas = {};
    for (let i = 0; i < listaAbas.length; i++) {
      (function (aba) {
        const btn = h(
          "button",
          {
            type: "button",
            role: "tab",
            className: "loja-aba" + (estado.abaAtiva === aba.id ? " ativa" : ""),
            onClick: function () {
              estado.abaAtiva = aba.id;
              estado.feedback = null;
              estado.exibindoCheckout = false;
              atualizarAbasVisuais();
              renderizarCorpoModal();
            }
          },
          aba.label
        );
        botoesAbas[aba.id] = btn;
        containerAbas.appendChild(btn);
      })(listaAbas[i]);
    }

    modalCorpo = h("div", { className: "loja-corpo" });

    const modalCaixa = h(
      "div",
      {
        className: "loja-modal",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Loja VIP Caraguá Pixel",
        onClick: function (ev) {
          ev.stopPropagation();
        }
      },
      h(
        "div",
        { className: "loja-modal-topo" },
        h(
          "div",
          { className: "loja-titulo-bloco" },
          h("span", { className: "loja-kicker", text: "IMOBILIÁRIA, CONCESSIONÁRIA & PASSES" }),
          h("h2", { className: "loja-titulo" }, "Caraguá ", h("span", null, "Loja VIP"))
        ),
        h(
          "button",
          {
            type: "button",
            className: "loja-fechar",
            "aria-label": "Fechar Loja VIP",
            onClick: fecharLoja
          },
          "✕"
        )
      ),
      containerAbas,
      modalCorpo
    );

    modalOverlay = h(
      "div",
      {
        className: "loja-overlay",
        hidden: true,
        onClick: fecharLoja
      },
      modalCaixa
    );

    hudRoot.appendChild(barraEl);
    hudRoot.appendChild(drawerMobileEl);
    hudRoot.appendChild(btnFecharMapaMob);
    hudRoot.appendChild(padMobile);
    hudRoot.appendChild(pillContexto);
    hudRoot.appendChild(modalOverlay);

    if (!window.__caraguaLojaMobGlobalListeners) {
      window.__caraguaLojaMobGlobalListeners = true;
      document.addEventListener("pointerdown", function (ev) {
        const tgt = ev.target;
        if (drawerMobileEl && !drawerMobileEl.hidden) {
          if (!tgt || !tgt.closest || !tgt.closest("#loja-hud .loja-drawer-mob, #loja-hud .loja-btn-menu-mob")) {
            fecharMenuMobile();
          }
        }
        const mEl = document.getElementById("mapa");
        if (mEl && mEl.classList.contains("mob-mapa-aberto")) {
          if (!tgt || !tgt.closest || !tgt.closest("#mapa, #loja-hud .loja-btn-mapa-mob, #loja-hud .loja-mapa-fechar-mob")) {
            fecharMapaMobile();
          }
        }
      });
      window.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape") {
          if (estado.modalAberto) {
            fecharLoja();
          } else {
            fecharMenuMobile();
            fecharMapaMobile();
          }
        }
      });
    }
  }

  function atualizarAbasVisuais() {
    const ids = Object.keys(botoesAbas);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      botoesAbas[id].classList.toggle("ativa", estado.abaAtiva === id);
    }
  }

  function atualizarBarraRapida() {
    if (!hudRoot) return;
    const ehMob = ehLayoutMobileHud();

    const m = getMundo();
    if (btnDiaNoite && m && typeof m.isNoite === "function") {
      const noite = !!m.isNoite();
      btnDiaNoite.textContent = noite ? "🌙" : "☀️";
      btnDiaNoite.classList.toggle("ativo", noite);
      btnDiaNoite.title = noite ? "Noite ativa (clique para Dia)" : "Dia ativo (clique para Noite)";
    }

    const inter = getInteracoes();
    if (btnSom) {
      const ativo = inter && typeof inter.isSomAtivo === "function" ? !!inter.isSomAtivo() : true;
      btnSom.textContent = ativo ? "🔊" : "🔇";
      btnSom.classList.toggle("ativo", ativo);
    }

    if (btnMoedas) {
      const info = lerMoedasInfo();
      const completo = info.n >= info.total;
      btnMoedas.textContent = (completo ? "👑 " : "🪙 ") + info.n + "/" + info.total;
      btnMoedas.classList.toggle("completa", completo);
    }

    if (btnContaArroba) {
      const online = getOnline();
      const pf = online && typeof online.getPerfil === "function" ? online.getPerfil() : null;
      const txtConta = (pf && pf.arroba)
        ? ("🪪 @" + (pf.arroba.length > 13 ? (pf.arroba.slice(0, 12) + "…") : pf.arroba) + (pf.verificadoPin ? " ✓" : ""))
        : "🪪 Entrar @";
      if (spanContaTxt) {
        spanContaTxt.textContent = txtConta;
      } else {
        btnContaArroba.textContent = txtConta;
      }
      sincronizarClasseContaArroba(pf);
    }

    if (btnAbrirLoja) {
      const pendenteVip = !!(estado.pedidoAtivo && estado.pedidoAtivo.status === "pending" && !estado.modalAberto);
      const rotuloLoja = ehMob ? "🛒 VIP" : "🛒 Loja VIP";
      if (btnAbrirLoja.textContent !== rotuloLoja) btnAbrirLoja.textContent = rotuloLoja;
      btnAbrirLoja.classList.toggle("tem-pedido", pendenteVip);
    }

    if (btnJetski) {
      const noJetski = inter && typeof inter.getCarroAtual === "function" && inter.getCarroAtual() === "jetski";
      btnJetski.textContent = noJetski ? "🌊 Sair" : "🌊 Jet Ski";
      btnJetski.classList.toggle("ativo", !!noJetski);
    }

    if (btnCarro) {
      const dirigindo = estaEmVeiculoOuCarona();
      const temCarro = inventario.carros.length > 0;
      if (dirigindo) {
        btnCarro.hidden = false;
        btnCarro.textContent = "🚗 Sair";
        btnCarro.classList.add("ativo");
      } else if (temCarro) {
        btnCarro.hidden = false;
        btnCarro.textContent = "🚗 Carro";
        btnCarro.classList.remove("ativo");
      } else {
        btnCarro.hidden = true;
        btnCarro.classList.remove("ativo");
      }
    }

    if (btnPedidoVivo) {
      const pendente = estado.pedidoAtivo && estado.pedidoAtivo.status === "pending" && !estado.modalAberto;
      btnPedidoVivo.hidden = !pendente;
      if (pendente) {
        btnPedidoVivo.textContent = "⏳ " + estado.pedidoAtivo.id;
      }
    }

    if (btnBuzinaMob) {
      btnBuzinaMob.hidden = !(inter && typeof inter.isDirigindo === "function" && inter.isDirigindo());
    }

    const emFoto = !!(inter && typeof inter.isModoFoto === "function" && inter.isModoFoto());
    if (padMobile) {
      padMobile.hidden = !!estado.modalAberto || emFoto;
    }

    const mapaEl = document.getElementById("mapa");
    const mapaAbertoMob = !!(ehMob && mapaEl && mapaEl.classList.contains("mob-mapa-aberto") && !emFoto && !estado.modalAberto);
    if (btnMapaMob) {
      btnMapaMob.classList.toggle("ativo", mapaAbertoMob);
      btnMapaMob.setAttribute("aria-pressed", mapaAbertoMob ? "true" : "false");
      btnMapaMob.textContent = mapaAbertoMob ? "🗺️ Ocultar Mapa" : "🗺️ Mapa";
    }
    if (btnFecharMapaMob) {
      btnFecharMapaMob.hidden = !mapaAbertoMob;
      if (mapaAbertoMob) posicionarFecharMapaMob();
    }
    if ((estado.modalAberto || emFoto) && drawerMobileEl && !drawerMobileEl.hidden) {
      fecharMenuMobile();
    }
  }

  function atualizarPillContexto() {
    if (!pillContexto) return;
    if (estado.modalAberto) {
      pillContexto.hidden = true;
      return;
    }

    const inter = getInteracoes();
    const ctx = inter && typeof inter.getContexto === "function" ? inter.getContexto() : null;
    if (!ctx) {
      pillContexto.hidden = true;
      return;
    }

    let label = String(ctx.acaoLabel || ctx.label || ctx.texto || "").trim();
    if (!label) {
      pillContexto.hidden = true;
      return;
    }

    let tecla = String(ctx.tecla || ctx.key || "").trim().toUpperCase();
    const matchColchete = label.match(/^\[([A-Z0-9]+)\]\s*(.+)$/i);
    if (matchColchete) {
      tecla = matchColchete[1].toUpperCase();
      label = matchColchete[2];
    }

    if (tecla) {
      pillCtxTecla.hidden = false;
      pillCtxTecla.textContent = "[" + tecla + "]";
    } else {
      pillCtxTecla.hidden = true;
    }
    pillCtxTexto.textContent = label;
    const fabPol = document.getElementById("policia-fab-atirar");
    pillContexto.classList.toggle("com-fab-policia", !!(fabPol && !fabPol.hidden));
    pillContexto.hidden = false;
  }

  // ---------- Abrir / Fechar Loja ----------
  function abrirLoja(opts) {
    if (!hudRoot) montarHUD();
    fecharMenuMobile();
    fecharMapaMobile();
    fecharPainelBusca();

    const ident = obterIdentidadeJogador();
    if (!estado.nomeComprador) estado.nomeComprador = ident.nome;
    if (!estado.arrobaComprador) estado.arrobaComprador = ident.arroba;

    if (opts && typeof opts === "object") {
      const abaPedida = opts.tab || opts.aba;
      if (abaPedida && botoesAbas[abaPedida]) {
        estado.abaAtiva = abaPedida;
        estado.exibindoCheckout = false;
      }
      const lotePedido = opts.lotId || opts.lot_id;
      if (lotePedido) {
        estado.abaAtiva = "casas";
        estado.loteSelecionado = String(lotePedido);
        estado.comboLoteId = String(lotePedido);
        estado.exibindoCheckout = false;
      }
    } else if (estado.pedidoAtivo && estado.pedidoAtivo.status === "pending" && !estado.exibindoCheckout) {
      // Ao clicar no botão da barra rápida ou no modal com pedido pendente, mantém banner no topo ou checkout
    }

    estado.feedback = null;
    estado.modalAberto = true;
    modalOverlay.hidden = false;
    atualizarAbasVisuais();
    sincronizarEstadoPublico();
    renderizarCorpoModal();
    atualizarBarraRapida();
    atualizarPillContexto();
  }

  function fecharLoja() {
    if (!modalOverlay) return;
    estado.modalAberto = false;
    modalOverlay.hidden = true;
    atualizarBarraRapida();
  }

  window.CARAGUA_ABRIR_LOJA = abrirLoja;

  // ---------- Renderização do Modal ----------
  function blocoIdentidadeComprador() {
    return h(
      "div",
      { className: "loja-grid-2" },
      h(
        "div",
        { className: "loja-campo" },
        h("label", { className: "loja-rotulo", text: "Seu nome na cidade" }),
        h("input", {
          type: "text",
          className: "loja-input",
          maxlength: "28",
          placeholder: "Ex.: Elton",
          value: estado.nomeComprador,
          onInput: function (e) {
            estado.nomeComprador = e.target.value;
          }
        })
      ),
      h(
        "div",
        { className: "loja-campo" },
        h("label", { className: "loja-rotulo", text: "Seu @ do Instagram" }),
        h("input", {
          type: "text",
          className: "loja-input",
          maxlength: "32",
          placeholder: "@seuusuario",
          value: estado.arrobaComprador,
          onInput: function (e) {
            estado.arrobaComprador = e.target.value.replace(/^@+/, "");
          }
        })
      )
    );
  }

  function renderizarFeedback() {
    if (!estado.feedback || !estado.feedback.texto) return null;
    return h(
      "div",
      { className: "loja-msg " + (estado.feedback.tipo || "") },
      estado.feedback.texto
    );
  }

  function renderizarCorpoModal() {
    if (!modalCorpo) return;
    limparElemento(modalCorpo);

    const fb = renderizarFeedback();
    if (fb) modalCorpo.appendChild(fb);

    if (estado.pedidoAtivo && estado.exibindoCheckout) {
      modalCorpo.appendChild(renderizarCheckoutPIX(estado.pedidoAtivo));
      return;
    }

    if (estado.pedidoAtivo && estado.pedidoAtivo.status === "pending") {
      modalCorpo.appendChild(
        h(
          "div",
          {
            className: "loja-msg",
            style: {
              background: "linear-gradient(90deg, rgba(0,158,227,0.22), rgba(0,196,160,0.18))",
              border: "1px solid rgba(56,189,248,0.65)",
              color: "#e0f2fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              flexWrap: "wrap",
              cursor: "pointer"
            },
            onClick: function () {
              estado.exibindoCheckout = true;
              renderizarCorpoModal();
              verificarStatusPedido(estado.pedidoAtivo.id, true);
            }
          },
          h("span", null, "⚡ Você tem um pagamento PIX aguardando confirmação (" + estado.pedidoAtivo.id + ") — Toque aqui para abrir o QR Code"),
          h("span", { className: "loja-btn loja-btn-ciano", text: "Abrir PIX" })
        )
      );
    }

    if (estado.abaAtiva === "casas") {
      modalCorpo.appendChild(renderizarAbaCasas());
    } else if (estado.abaAtiva === "carros") {
      modalCorpo.appendChild(renderizarAbaCarros());
    } else if (estado.abaAtiva === "profissoes") {
      modalCorpo.appendChild(renderizarAbaProfissoes());
    } else if (estado.abaAtiva === "empresas") {
      modalCorpo.appendChild(renderizarAbaEmpresas());
    } else {
      modalCorpo.appendChild(renderizarAbaCodigo());
    }
  }

  // Aba 1: Casas & Terrenos
  function renderizarAbaCasas() {
    const infoLotes = obterLotesInfo();
    const livres = infoLotes.livres;
    const total = Math.max(infoLotes.total, 1);
    const ocupados = Math.max(0, total - livres.length);
    const pctOcupado = Math.min(100, Math.max(6, Math.round((ocupados / total) * 100)));

    if ((!estado.loteSelecionado || !livres.some(function (l) { return String(l.id) === estado.loteSelecionado; })) && livres.length > 0) {
      estado.loteSelecionado = String(livres[0].id);
    }

    const escassez = h(
      "div",
      { className: "loja-escassez" },
      h(
        "div",
        { className: "loja-escassez-txt" },
        h(
          "strong",
          null,
          livres.length > 0
            ? "🔥 Restam " + livres.length + " de " + infoLotes.total + " terrenos livres em Caraguá Pixel!"
            : "🏙️ Todos os terrenos disponíveis no momento já foram ocupados!"
        ),
        h("span", null, "Cada terreno é único no mapa 3D: sua casa fica visível para todos os jogadores online e tem sala interna própria.")
      ),
      h(
        "div",
        { className: "loja-barra-progresso", title: ocupados + " ocupados de " + infoLotes.total },
        h("div", { className: "loja-barra-preenchimento", style: { width: pctOcupado + "%" } })
      )
    );

    const selectLote = h("select", {
      className: "loja-select",
      onChange: function (e) {
        estado.loteSelecionado = e.target.value;
      }
    });

    if (livres.length === 0) {
      selectLote.appendChild(h("option", { value: "", text: "Nenhum terreno livre no momento" }));
      selectLote.disabled = true;
    } else {
      for (let i = 0; i < livres.length; i++) {
        const l = livres[i];
        const idStr = String(l.id);
        const opt = h("option", {
          value: idStr,
          text: "Terreno " + idStr + " · Rua (x: " + Math.round(l.x) + ", z: " + Math.round(l.z) + ")"
        });
        if (idStr === estado.loteSelecionado) opt.selected = true;
        selectLote.appendChild(opt);
      }
    }

    const btnVerLote = h(
      "button",
      {
        type: "button",
        className: "loja-btn loja-btn-ciano",
        disabled: livres.length === 0,
        onClick: function () {
          const m = getMundo();
          const lote = livres.find(function (l) { return String(l.id) === estado.loteSelecionado; });
          if (lote && m && typeof m.voarAte === "function") {
            fecharLoja();
            m.voarAte(lote.x, lote.z);
            avisar("📍 Terreno " + lote.id + " — clique na placa À VENDA ou abra a Loja VIP!");
          }
        }
      },
      "👁️ Ver no Mapa"
    );

    const cardsEstilo = h(
      "div",
      { className: "loja-cards" },
      ESTILOS_CASA.map(function (est) {
        const ativo = estado.estiloCasa === est.id;
        return h(
          "div",
          {
            className: "loja-card" + (ativo ? " selecionado" : ""),
            onClick: function () {
              estado.estiloCasa = est.id;
              renderizarCorpoModal();
            }
          },
          h(
            "div",
            { className: "loja-card-cab" },
            h("span", { className: "loja-card-icone", text: est.icone }),
            h("span", { className: "loja-preco", text: formatarBRL(precoDe(est.id)) })
          ),
          h("h3", { className: "loja-card-titulo", text: est.titulo }),
          h("p", { className: "loja-card-desc", text: est.desc })
        );
      })
    );

    const amostrasCor = CORES_PAREDE.map(function (cor) {
      return h("button", {
        type: "button",
        className: "loja-cor-amostra" + (estado.corCasa.toLowerCase() === cor.toLowerCase() ? " ativa" : ""),
        style: { backgroundColor: cor },
        title: "Cor " + cor,
        onClick: function () {
          estado.corCasa = cor;
          renderizarCorpoModal();
        }
      });
    });

    const inputCorCustom = h("input", {
      type: "color",
      className: "loja-cor-custom",
      value: /^#[0-9a-fA-F]{6}$/.test(estado.corCasa) ? estado.corCasa : "#f59e0b",
      title: "Escolher cor personalizada",
      onInput: function (e) {
        estado.corCasa = e.target.value;
      }
    });

    const precoAtual = precoDe(estado.estiloCasa);

    const btnGerarPix = h(
      "button",
      {
        type: "button",
        className: "loja-btn loja-btn-ouro",
        disabled: estado.carregando || livres.length === 0,
        onClick: function () {
          const lote = livres.find(function (l) { return String(l.id) === estado.loteSelecionado; });
          if (!lote) {
            estado.feedback = { tipo: "erro", texto: "Selecione um terreno livre antes de continuar." };
            renderizarCorpoModal();
            return;
          }
          const ident = obterIdentidadeJogador();
          const nomeFinal = String(estado.nomeComprador || ident.nome || "Morador").trim().slice(0, 28);
          const arrobaFinal = String(estado.arrobaComprador || ident.arroba || "").trim().replace(/^@+/, "").slice(0, 30);
          const tituloFinal = String(estado.tituloCasa || ("Casa de " + nomeFinal)).trim().slice(0, 36);

          criarPedidoPIX({
            kind: kindDeCatalogo(estado.estiloCasa, "casa"),
            item_id: estado.estiloCasa,
            buyer_name: nomeFinal,
            buyer_handle: arrobaFinal,
            buyer_pid: ident.pid,
            payload: {
              lot_id: String(lote.id),
              style: estado.estiloCasa,
              color: estado.corCasa,
              title: tituloFinal,
              x: Number(lote.x) || 0,
              z: Number(lote.z) || 0,
              rot: Number(lote.rot) || 0,
              door_room: "casa_" + String(lote.id)
            }
          });
        }
      },
      estado.carregando ? "⏳ Gerando..." : "💠 Gerar PIX · " + formatarBRL(precoAtual)
    );

    return h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "14px" } },
      escassez,
      h(
        "div",
        { className: "loja-campo" },
        h("label", { className: "loja-rotulo", text: "1. Escolha seu Terreno Livre" }),
        h("div", { className: "loja-lote-linha" }, selectLote, btnVerLote)
      ),
      h(
        "div",
        { className: "loja-campo" },
        h("label", { className: "loja-rotulo", text: "2. Escolha a Arquitetura da Casa" }),
        cardsEstilo
      ),
      h(
        "div",
        { className: "loja-grid-2" },
        h(
          "div",
          { className: "loja-campo" },
          h("label", { className: "loja-rotulo", text: "3. Cor da Parede" }),
          h("div", { className: "loja-cores" }, amostrasCor, inputCorCustom)
        ),
        h(
          "div",
          { className: "loja-campo" },
          h("label", { className: "loja-rotulo", text: "4. Nome na Placa da Fachada" }),
          h("input", {
            type: "text",
            className: "loja-input",
            maxlength: "36",
            placeholder: "Ex.: Casa Solar da Família",
            value: estado.tituloCasa,
            onInput: function (e) {
              estado.tituloCasa = e.target.value;
            }
          })
        )
      ),
      blocoIdentidadeComprador(),
      h(
        "div",
        { className: "loja-resumo-compra" },
        h(
          "div",
          { className: "loja-resumo-valor" },
          h("small", null, "Terreno permanente + Sala 3D privativa"),
          h("strong", null, formatarBRL(precoAtual))
        ),
        btnGerarPix
      )
    );
  }

  // Aba 2: Carros & Motos
  function renderizarAbaCarros() {
    const cards = CARROS_CATALOGO.map(function (car) {
      const desbloqueado = inventario.carros.indexOf(car.id) !== -1;

      const btnTestDrive = h(
        "button",
        {
          type: "button",
          className: "loja-btn loja-btn-ciano",
          onClick: function () {
            const inter = getInteracoes();
            fecharLoja();
            estado.testDriveAte = Date.now() + 60000;
            if (inter && typeof inter.iniciarTestDrive === "function") {
              inter.iniciarTestDrive(car.id);
            } else {
              avisar("🏁 Aproxime-se da rua para iniciar o Test-Drive!");
            }
            atualizarBarraRapida();
          }
        },
        "🏁 Test-Drive Grátis (60s)"
      );

      const btnPrincipal = desbloqueado
        ? h(
            "button",
            {
              type: "button",
              className: "loja-btn loja-btn-verde",
              onClick: function () {
                inventario.carroPreferido = car.id;
                salvarInventario();
                const inter = getInteracoes();
                fecharLoja();
                if (inter && typeof inter.embarcarMeuCarro === "function") {
                  inter.embarcarMeuCarro(car.id);
                }
                atualizarBarraRapida();
              }
            },
            "🚗 Dirigir"
          )
        : h(
            "button",
            {
              type: "button",
              className: "loja-btn loja-btn-ouro",
              disabled: estado.carregando,
              onClick: function () {
                const ident = obterIdentidadeJogador();
                const nomeFinal = String(estado.nomeComprador || ident.nome || "Morador").trim().slice(0, 28);
                const arrobaFinal = String(estado.arrobaComprador || ident.arroba || "").trim().replace(/^@+/, "").slice(0, 30);
                criarPedidoPIX({
                  kind: kindDeCatalogo(car.id, "carro"),
                  item_id: car.id,
                  buyer_name: nomeFinal,
                  buyer_handle: arrobaFinal,
                  buyer_pid: ident.pid,
                  payload: { car_type: car.id }
                });
              }
            },
            "💠 Comprar via PIX"
          );

      return h(
        "div",
        { className: "loja-card" + (desbloqueado ? " selecionado" : "") },
        h(
          "div",
          { className: "loja-card-cab" },
          h("span", { className: "loja-card-icone", text: car.icone }),
          desbloqueado
            ? h("span", { className: "loja-tag-ok", text: "✅ NA GARAGEM" })
            : h("span", { className: "loja-preco", text: formatarBRL(precoDe(car.id)) })
        ),
        h("h3", { className: "loja-card-titulo", text: car.titulo }),
        h("p", { className: "loja-card-desc", text: car.desc }),
        h("div", { className: "loja-card-acoes" }, btnTestDrive, btnPrincipal)
      );
    });

    return h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "14px" } },
      blocoIdentidadeComprador(),
      h("div", { className: "loja-cards" }, cards)
    );
  }

  // Aba 3: Profissões & VIP
  function renderizarAbaProfissoes() {
    const online = getOnline();
    const stRede = online && typeof online.getEstadoInteracao === "function" ? (online.getEstadoInteracao() || {}) : {};
    const profRedeAtual = stRede.profissao || inventario.profissaoAtiva || "";

    const cardsProf = PROFISSOES_CATALOGO.map(function (prof) {
      const liberada = inventario.criador || inventario.profissoes.indexOf(prof.id) !== -1;
      const ativaNaPlaca = liberada && profRedeAtual === prof.rotuloPlaca;

      const acao = liberada
        ? h(
            "button",
            {
              type: "button",
              className: "loja-btn " + (ativaNaPlaca ? "loja-btn-ciano" : "loja-btn-verde"),
              onClick: function () {
                const novoValor = ativaNaPlaca ? "" : prof.rotuloPlaca;
                inventario.profissaoAtiva = novoValor;
                inventario.profissaoId = ativaNaPlaca ? "" : prof.id;
                salvarInventario();
                if (online && typeof online.setEstadoInteracao === "function") {
                  online.setEstadoInteracao({ profissao: novoValor });
                }
                avisar(novoValor ? "✨ Placa atualizada: " + novoValor : "Placa de profissão ocultada.");
                renderizarCorpoModal();
              }
            },
            ativaNaPlaca ? "✅ Ativa na Placa (Ocultar)" : "✨ Exibir na Placa"
          )
        : h(
            "button",
            {
              type: "button",
              className: "loja-btn loja-btn-ouro",
              disabled: estado.carregando,
              onClick: function () {
                const ident = obterIdentidadeJogador();
                criarPedidoPIX({
                  kind: kindDeCatalogo(prof.id, "profissao"),
                  item_id: prof.id,
                  buyer_name: String(estado.nomeComprador || ident.nome || "Morador").trim().slice(0, 28),
                  buyer_handle: String(estado.arrobaComprador || ident.arroba || "").trim().replace(/^@+/, "").slice(0, 30),
                  buyer_pid: ident.pid,
                  payload: { profissao: prof.rotuloPlaca, profissao_id: prof.id }
                });
              }
            },
            "💠 Desbloquear · " + formatarBRL(precoDe(prof.id))
          );

      return h(
        "div",
        { className: "loja-card" + (ativaNaPlaca ? " selecionado" : "") },
        h(
          "div",
          { className: "loja-card-cab" },
          h("span", { className: "loja-card-icone", text: prof.icone }),
          liberada
            ? h("span", { className: "loja-tag-ok", text: "✅ LIBERADA" })
            : h("span", { className: "loja-preco", text: formatarBRL(precoDe(prof.id)) })
        ),
        h("h3", { className: "loja-card-titulo", text: prof.titulo }),
        h("p", { className: "loja-card-desc", text: prof.desc }),
        h("div", { className: "loja-card-acoes" }, acao)
      );
    });

    // Card Especial Combo VIP
    const infoLotes = obterLotesInfo();
    const livres = infoLotes.livres;
    if ((!estado.comboLoteId || !livres.some(function (l) { return String(l.id) === estado.comboLoteId; })) && livres.length > 0) {
      estado.comboLoteId = String(livres[0].id);
    }

    const selectComboLote = h("select", {
      className: "loja-select",
      onChange: function (e) {
        estado.comboLoteId = e.target.value;
      }
    });
    if (livres.length === 0) {
      selectComboLote.appendChild(h("option", { value: "", text: "Sem terreno livre (libera Esportivo + Profissão + VIP)" }));
    } else {
      for (let i = 0; i < livres.length; i++) {
        const l = livres[i];
        const idStr = String(l.id);
        const opt = h("option", { value: idStr, text: "Terreno " + idStr + " (x:" + Math.round(l.x) + ", z:" + Math.round(l.z) + ")" });
        if (idStr === estado.comboLoteId) opt.selected = true;
        selectComboLote.appendChild(opt);
      }
    }

    const selectComboProf = h("select", {
      className: "loja-select",
      onChange: function (e) {
        estado.comboProfissao = e.target.value;
      }
    });
    for (let i = 0; i < PROFISSOES_CATALOGO.length; i++) {
      const pf = PROFISSOES_CATALOGO[i];
      const opt = h("option", { value: pf.id, text: pf.titulo });
      if (pf.id === estado.comboProfissao) opt.selected = true;
      selectComboProf.appendChild(opt);
    }

    const cardCombo = h(
      "div",
      { className: "loja-card destaque-combo" },
      h(
        "div",
        { className: "loja-card-cab" },
        h("span", { className: "loja-card-icone", text: "👑" }),
        h("span", { className: "loja-preco", text: formatarBRL(precoDe("combo_vip")) })
      ),
      h("h3", { className: "loja-card-titulo", text: "Combo Fundador VIP (Casa + Esportivo + Profissão + Selo VIP)" }),
      h(
        "p",
        { className: "loja-card-desc" },
        "Pacote completo com Sobrado no terreno escolhido, Esportivo Turbo na garagem, todas as vantagens de Profissão na placa e Selo VIP permanente."
      ),
      h(
        "div",
        { className: "loja-grid-2" },
        h(
          "div",
          { className: "loja-campo" },
          h("label", { className: "loja-rotulo", text: "Terreno da Casa VIP" }),
          selectComboLote
        ),
        h(
          "div",
          { className: "loja-campo" },
          h("label", { className: "loja-rotulo", text: "Profissão Inicial" }),
          selectComboProf
        )
      ),
      h(
        "div",
        { className: "loja-card-acoes" },
        h(
          "button",
          {
            type: "button",
            className: "loja-btn loja-btn-ouro loja-btn-bloco",
            disabled: estado.carregando,
            onClick: function () {
              const ident = obterIdentidadeJogador();
              const nomeFinal = String(estado.nomeComprador || ident.nome || "Morador").trim().slice(0, 28);
              const arrobaFinal = String(estado.arrobaComprador || ident.arroba || "").trim().replace(/^@+/, "").slice(0, 30);
              const lote = livres.find(function (l) { return String(l.id) === estado.comboLoteId; });
              const payload = {
                car_type: "esportivo",
                profissao_id: estado.comboProfissao,
                profissao: rotuloProfissaoPorId(estado.comboProfissao)
              };
              if (lote) {
                payload.lot_id = String(lote.id);
                payload.style = "sobrado";
                payload.color = estado.comboCor || "#f59e0b";
                payload.title = "Mansão VIP de " + nomeFinal;
                payload.x = Number(lote.x) || 0;
                payload.z = Number(lote.z) || 0;
                payload.rot = Number(lote.rot) || 0;
                payload.door_room = "casa_" + String(lote.id);
              }
              criarPedidoPIX({
                kind: kindDeCatalogo("combo_vip", "combo"),
                item_id: "combo_vip",
                buyer_name: nomeFinal,
                buyer_handle: arrobaFinal,
                buyer_pid: ident.pid,
                payload: payload
              });
            }
          },
          "👑 Garantir Combo VIP · " + formatarBRL(precoDe("combo_vip"))
        )
      )
    );

    return h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "14px" } },
      blocoIdentidadeComprador(),
      h("div", { className: "loja-cards" }, cardCombo, cardsProf)
    );
  }

  // Aba 4: Sua Loja Real VIP (Empresas)
  function renderizarAbaEmpresas() {
    const precoBronze = (estado.prices && Number.isFinite(Number(estado.prices.loja_bronze)))
      ? Number(estado.prices.loja_bronze)
      : PRECOS_PADRAO.loja_bronze;
    const precoLoja = (estado.prices && Number.isFinite(Number(estado.prices.loja_empresa_vip)))
      ? Number(estado.prices.loja_empresa_vip)
      : PRECOS_PADRAO.loja_empresa_vip;
    const precoOuro = (estado.prices && Number.isFinite(Number(estado.prices.loja_ouro)))
      ? Number(estado.prices.loja_ouro)
      : PRECOS_PADRAO.loja_ouro;
    const totalVagas = Math.max(1, Number(estado.vagasEmpresasTotal) || 20);
    const ocupadas = Math.min(totalVagas, Math.max(0, Number(estado.vagasEmpresasOcupadas) || 0));
    const restantes = Math.max(0, Number.isFinite(Number(estado.vagasEmpresasRestantes))
      ? Number(estado.vagasEmpresasRestantes)
      : (totalVagas - ocupadas));
    const pctOcupado = Math.min(100, Math.max(8, Math.round((ocupadas / totalVagas) * 100)));

    const faixaVagas = h(
      "div",
      { className: "loja-escassez" },
      h(
        "div",
        { className: "loja-escassez-txt" },
        h(
          "strong",
          null,
          restantes > 0
            ? "🔥 OS 20 PRIMEIROS QUE AJUDAREM: VIP 1 MÊS · Restam " + restantes + " de " + totalVagas + " vagas!"
            : "🏢 Lote inicial de " + totalVagas + " lojas VIP em fechamento!"
        ),
        h(
          "span",
          null,
          ocupadas + " / " + totalVagas + " vagas preenchidas · Destaque inaugural na Galeria Pixel, Boulevard da Praia e Centro."
        )
      ),
      h(
        "div",
        { className: "loja-barra-progresso", title: ocupadas + " de " + totalVagas + " vagas preenchidas" },
        h("div", { className: "loja-barra-preenchimento", style: { width: pctOcupado + "%" } })
      )
    );

    const beneficios = [
      {
        icone: "🏬",
        titulo: "Sua loja no centro da cidade",
        desc: "Fachada de destaque na Galeria Pixel, Boulevard da Praia ou Centro da Cidade."
      },
      {
        icone: "🎨",
        titulo: "Seu logo e marca na fachada 3D",
        desc: "Nossa equipe desenha sua vitrine no estilo pixel/voxel art oficial de Caraguá Pixel."
      },
      {
        icone: "📲",
        titulo: "Loja real com link e localização",
        desc: "Moradores clicam na fachada e abrem direto o WhatsApp ou Instagram da sua empresa."
      },
      {
        icone: "📸",
        titulo: "Stories em @caraguapixel",
        desc: "Divulgação oficial da inauguração nos Stories + criação rápida em até 2 dias úteis."
      }
    ];

    const gridBeneficios = h(
      "div",
      { className: "loja-empresa-beneficios" },
      beneficios.map(function (b) {
        return h(
          "div",
          { className: "loja-empresa-beneficio" },
          h("span", { className: "loja-empresa-benef-icone", text: b.icone }),
          h(
            "div",
            { className: "loja-empresa-benef-txt" },
            h("strong", { text: b.titulo }),
            h("span", { text: b.desc })
          )
        );
      })
    );

    const bannerSla = h(
      "div",
      { className: "loja-empresa-sla" },
      h("strong", { text: "⚡ Criação em até 2 dias úteis após enviar a logo no grupo VIP" }),
      h(
        "span",
        null,
        "Cadastre sua empresa, pague via PIX e entre no grupo VIP do WhatsApp para enviar sua logo e preferências. Sem burocracia!"
      )
    );

    const cardShowcase = h(
      "div",
      { className: "loja-card destaque-combo loja-empresa-showcase" },
      h(
        "div",
        { className: "loja-card-cab" },
        h("span", { className: "loja-kicker", text: "⚠️ ATENÇÃO, EMPRESÁRIOS · 3 PLANOS DE LANÇAMENTO" }),
        h("span", { className: "loja-preco", text: "A partir de " + formatarBRL(precoBronze) + " · 1 MÊS VIP" })
      ),
      h("h3", { className: "loja-card-titulo loja-empresa-titulo", text: "TEM CNPJ? SUA LOJA REAL NA NOSSA CIDADE" }),
      h(
        "p",
        { className: "loja-card-desc" },
        "Escolha entre 3 planos acessíveis: Essencial (" + formatarBRL(precoBronze) + "), Destaque + Stories (" + formatarBRL(precoLoja) + ") ou Master (" + formatarBRL(precoOuro) + "). Ao aprovar o PIX, já libera seu Passe VIP no jogo na hora e sua loja entra no ar em até 2 dias úteis!"
      ),
      bannerSla,
      gridBeneficios,
      h(
        "div",
        { className: "loja-resumo-compra" },
        h(
          "div",
          { className: "loja-resumo-valor" },
          h("small", null, "Recomendado (Destaque + Stories + Bugue VIP)"),
          h("strong", null, formatarBRL(precoLoja))
        ),
        h(
          "a",
          {
            className: "loja-btn loja-btn-ouro",
            href: "empresas.html",
            target: "_blank",
            rel: "noopener"
          },
          "🏢 Cadastrar Minha Empresa e Pagar PIX →"
        )
      )
    );

    return h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "14px" } },
      faixaVagas,
      cardShowcase
    );
  }

  // Aba 5: Ativar Código (CPX-... ou CRG-...)
  function renderizarAbaCodigo() {
    const inputCod = h("input", {
      type: "text",
      className: "loja-input",
      maxlength: "40",
      placeholder: "CPX-XXXX-XXXX",
      value: estado.codigoInput,
      style: { fontFamily: '"Silkscreen", "Courier New", monospace', letterSpacing: "0.06em", textTransform: "uppercase" },
      onInput: function (e) {
        estado.codigoInput = e.target.value.toUpperCase();
      },
      onKeydown: function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          resgatarCodigoManual(estado.codigoInput);
        }
      }
    });

    const resumoInv = [];
    if (inventario.criador) resumoInv.push("👑 Criador Oficial (" + estado.creatorHint + ")");
    if (inventario.vip) resumoInv.push("⭐ Selo VIP Ativo");
    if (inventario.carros.length > 0) resumoInv.push("🚗 Veículos: " + inventario.carros.join(", "));
    if (inventario.profissoes.length > 0) resumoInv.push("💼 Profissões: " + inventario.profissoes.length + " liberada(s)");
    if (inventario.casas.length > 0) resumoInv.push("🏠 Imóveis: " + inventario.casas.join(", "));

    return h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "14px" } },
      h(
        "div",
        { className: "loja-card" },
        h("h3", { className: "loja-card-titulo", text: "🔑 Ativar Passe VIP ou Código Oficial" }),
        h(
          "p",
          { className: "loja-card-desc" },
          "Digite seu código de passe (CPX-XXXX-XXXX) recebido após aprovação do PIX ou apoio para liberar instantaneamente casas, carros e profissões neste dispositivo."
        ),
        blocoIdentidadeComprador(),
        h(
          "div",
          { className: "loja-campo" },
          h("label", { className: "loja-rotulo", text: "Código de Ativação" }),
          inputCod
        ),
        h(
          "button",
          {
            type: "button",
            className: "loja-btn loja-btn-ouro loja-btn-bloco",
            disabled: estado.carregando,
            onClick: function () {
              resgatarCodigoManual(estado.codigoInput);
            }
          },
          estado.carregando ? "⏳ Validando código..." : "🔓 Ativar Código Agora"
        )
      ),
      h(
        "div",
        { className: "loja-card" },
        h("h3", { className: "loja-card-titulo", text: "🎒 Meu Inventário Salvo" }),
        resumoInv.length > 0
          ? h(
              "ul",
              { style: { display: "flex", flexDirection: "column", gap: "6px" } },
              resumoInv.map(function (txt) {
                return h("li", { className: "loja-card-desc", text: txt });
              })
            )
          : h("p", { className: "loja-card-desc", text: "Você ainda não ativou itens pagos neste navegador. Experimente o Test-Drive grátis na aba Carros!" })
      )
    );
  }

  // ---------- Criação de Pedido PIX e Polling ----------
  async function criarPedidoPIX(dados) {
    estado.carregando = true;
    estado.feedback = null;
    renderizarCorpoModal();

    try {
      const res = await apiPost("create_order", dados);
      estado.carregando = false;

      if (!res || !res.ok) {
        estado.feedback = { tipo: "erro", texto: msgErroApi(res, "Não foi possível gerar o pedido.") };
        renderizarCorpoModal();
        return;
      }

      const idPedido = res.id || res.order_id;
      estado.pedidoAtivo = {
        id: idPedido,
        kind: res.kind || dados.kind,
        item_id: res.item_id || dados.item_id,
        amount: Number.isFinite(Number(res.amount)) ? Number(res.amount) : precoDe(dados.item_id),
        pix_configured: !!res.pix_configured,
        mp_enabled: !!res.mp_enabled,
        pix_brcode: res.pix_brcode || "",
        pix_qr_base64: res.pix_qr_base64 || "",
        status: res.status || "pending",
        pass_code: res.pass_code || "",
        payload: dados.payload || {},
        iniciadoEm: Date.now()
      };
      estado.exibindoCheckout = true;
      salvarPedidoAtivoStorage(estado.pedidoAtivo);

      iniciarPollingPedido(idPedido);
      renderizarCorpoModal();
      atualizarBarraRapida();
    } catch (e) {
      estado.carregando = false;
      estado.feedback = { tipo: "erro", texto: "Erro de rede ao criar pedido. Tente novamente." };
      renderizarCorpoModal();
    }
  }

  function pararPollingPedido() {
    if (estado.timerCheckOrder) {
      clearInterval(estado.timerCheckOrder);
      estado.timerCheckOrder = null;
    }
  }

  function iniciarPollingPedido(orderId) {
    pararPollingPedido();
    if (!orderId) return;

    estado.timerCheckOrder = setInterval(function () {
      if (!estado.pedidoAtivo || estado.pedidoAtivo.id !== orderId) {
        pararPollingPedido();
        return;
      }
      // Encerra polling automático após 45 minutos sem pagamento
      if (Date.now() - estado.pedidoAtivo.iniciadoEm > 45 * 60 * 1000) {
        pararPollingPedido();
        salvarPedidoAtivoStorage(null);
        return;
      }
      verificarStatusPedido(orderId, true);
    }, 2500);
  }

  function entregarItemAprovadoNoMundo(ped, resCheck) {
    const kind = String((resCheck && resCheck.kind) || (ped && ped.kind) || "");
    const itemId = String((resCheck && resCheck.item_id) || (ped && ped.item_id) || "");
    const idsCarros = CARROS_CATALOGO.map(function (c) { return c.id; });
    const ehCarro = kind === "carro" || idsCarros.indexOf(itemId) !== -1;
    const loteInfo = (resCheck && resCheck.owned_lot) || (ped && ped.payload && ped.payload.lot_id ? ped.payload : null);
    const ehCasa = kind === "casa" || (itemId === "combo_vip" && loteInfo && Number.isFinite(Number(loteInfo.x)) && Number.isFinite(Number(loteInfo.z)));

    setTimeout(function () {
      if (estado.pedidoAtivo && ped && estado.pedidoAtivo.id === ped.id) {
        estado.exibindoCheckout = false;
        estado.pedidoAtivo = null;
      }
      if (estado.modalAberto) {
        fecharLoja();
      } else {
        atualizarBarraRapida();
      }

      const inter = getInteracoes();
      const m = getMundo();
      if (ehCarro) {
        if (inter && typeof inter.embarcarMeuCarro === "function") {
          inter.embarcarMeuCarro(itemId);
          avisar("🚗 PIX aprovado! Seu veículo VIP foi entregue — boa viagem por Caraguá!");
        }
      } else if (ehCasa) {
        if (loteInfo && Number.isFinite(Number(loteInfo.x)) && Number.isFinite(Number(loteInfo.z)) && m && typeof m.voarAte === "function") {
          m.voarAte(
            Number(loteInfo.x),
            Number(loteInfo.z),
            itemId === "combo_vip"
              ? "👑 Combo VIP liberado! Bem-vindo à sua nova casa!"
              : "🏠 Casa construída! Aproxime-se da porta e aperte [E] para entrar!"
          );
        }
      } else if (itemId === "combo_vip") {
        if (inter && typeof inter.embarcarMeuCarro === "function") {
          inter.embarcarMeuCarro("esportivo");
          avisar("👑 Combo VIP liberado! Esportivo Turbo entregue e profissões ativas!");
        }
      } else if (kind === "profissao" || itemId.indexOf("profissao_") === 0) {
        avisar("💼 PIX aprovado! Sua nova profissão já está ativa na sua placa!");
      } else if (kind === "evento" || itemId.indexOf("policia_") === 0) {
        const online = getOnline();
        if (online && typeof online.requisitarStateGet === "function") {
          online.requisitarStateGet();
        }
        try {
          window.dispatchEvent(new CustomEvent("caragua:pix_evento_aprovado", { detail: { item_id: itemId, res: resCheck } }));
        } catch (e) {}
        avisar("🎉 PIX aprovado! Suas moedas/vidas/arminhas de Polícia e Ladrão já foram creditadas!");
      }
    }, 1100);
  }

  async function verificarStatusPedido(orderId, silencioso) {
    try {
      const res = await apiGet("check_order", { id: orderId });
      if (!res || !res.ok) {
        if (!silencioso) {
          estado.feedback = { tipo: "alerta", texto: msgErroApi(res, "Pedido ainda em processamento.") };
          renderizarCorpoModal();
        }
        return;
      }

      if (!estado.pedidoAtivo || estado.pedidoAtivo.id !== orderId) return;
      estado.pedidoAtivo.status = res.status || estado.pedidoAtivo.status;

      if (res.status === "approved") {
        pararPollingPedido();
        salvarPedidoAtivoStorage(null);
        const passCode = res.pass_code || "";
        estado.pedidoAtivo.pass_code = passCode;
        const pedidoAprovado = Object.assign({}, estado.pedidoAtivo);

        if (passCode) {
          await aplicarResgateDeCodigo(passCode, true);
        } else {
          await sincronizarEstadoPublico();
        }

        estado.feedback = {
          tipo: "sucesso",
          texto: "🎉 Pagamento confirmado! Entregando seu item VIP automaticamente!"
        };
        avisar("🎉 Pedido " + orderId + " aprovado! Seu item VIP já está liberado!");
        atualizarBarraRapida();
        if (estado.modalAberto && estado.exibindoCheckout) renderizarCorpoModal();
        entregarItemAprovadoNoMundo(pedidoAprovado, res);
      } else if (res.status === "rejected") {
        pararPollingPedido();
        salvarPedidoAtivoStorage(null);
        estado.feedback = {
          tipo: "erro",
          texto: "Este pedido (" + orderId + ") foi cancelado ou expirou."
        };
        atualizarBarraRapida();
        if (estado.modalAberto && estado.exibindoCheckout) renderizarCorpoModal();
      } else if (!silencioso) {
        estado.feedback = {
          tipo: "alerta",
          texto: "⏳ Aguardando confirmação do pedido " + orderId + ". Assim que pagar, liberaremos automaticamente!"
        };
        if (estado.modalAberto && estado.exibindoCheckout) renderizarCorpoModal();
      }
    } catch (e) {}
  }

  function renderizarCheckoutPIX(ped) {
    const aprovado = ped.status === "approved";
    const rejeitado = ped.status === "rejected";
    const temPix = ped.pix_configured === true && !!ped.pix_brcode;

    const btnVoltar = h(
      "button",
      {
        type: "button",
        className: "loja-btn",
        onClick: function () {
          if (aprovado || rejeitado) {
            pararPollingPedido();
            salvarPedidoAtivoStorage(null);
            estado.pedidoAtivo = null;
            estado.exibindoCheckout = false;
            estado.feedback = null;
          } else {
            // Permite voltar para navegar nas abas mantendo o pedido e polling ativos em background
            estado.exibindoCheckout = false;
          }
          renderizarCorpoModal();
          atualizarBarraRapida();
        }
      },
      "← Voltar para os Itens"
    );

    if (aprovado) {
      return h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "14px" } },
        h(
          "div",
          { className: "loja-card selecionado" },
          h("h3", { className: "loja-card-titulo", text: "✅ Pagamento Confirmado e Item Entregue!" }),
          h(
            "p",
            { className: "loja-card-desc" },
            "Seu pedido " + ped.id + " foi confirmado automaticamente pelo Mercado Pago e já está ativo na sua conta! Guarde seu código apenas como comprovante:"
          ),
          ped.pass_code
            ? h(
                "div",
                { className: "loja-protocolo-box" },
                h("span", { className: "loja-protocolo-cod", text: ped.pass_code }),
                h(
                  "button",
                  {
                    type: "button",
                    className: "loja-btn loja-btn-ouro",
                    onClick: function (ev) {
                      const btn = ev.currentTarget;
                      copiarTexto(ped.pass_code, function () {
                        btn.textContent = "✅ Passe Copiado!";
                      });
                    }
                  },
                  "📋 Copiar Passe"
                )
              )
            : null,
          h(
            "div",
            { className: "loja-card-acoes" },
            h(
              "button",
              {
                type: "button",
                className: "loja-btn loja-btn-verde",
                onClick: fecharLoja
              },
              "🎮 Voltar para a Cidade"
            )
          )
        )
      );
    }

    // Modo Reserva VIP / Pré-Venda amigável quando pix_configured === false
    if (!temPix) {
      const btnCopiarProt = h(
        "button",
        {
          type: "button",
          className: "loja-btn loja-btn-ouro",
          onClick: function (ev) {
            const b = ev.currentTarget;
            copiarTexto(ped.id, function () {
              b.textContent = "✅ Protocolo Copiado!";
              setTimeout(function () {
                b.textContent = "📋 Copiar Protocolo";
              }, 2200);
            });
          }
        },
        "📋 Copiar Protocolo"
      );

      return h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "14px" } },
        h(
          "div",
          { className: "loja-card destaque-combo" },
          h(
            "div",
            { className: "loja-card-cab" },
            h("span", { className: "loja-kicker", text: "MODO RESERVA VIP / PRÉ-VENDA" }),
            h("span", { className: "loja-preco", text: formatarBRL(ped.amount) })
          ),
          h("h3", { className: "loja-card-titulo", text: "🎟️ Reserva VIP Registrada!" }),
          h(
            "div",
            { className: "loja-protocolo-box" },
            h("span", { className: "loja-protocolo-cod", text: ped.id }),
            btnCopiarProt
          ),
          h(
            "p",
            { className: "loja-card-desc", style: { color: "#eef2fa", fontSize: "13.5px" } },
            "Reserva registrada! Envie o protocolo " +
              ped.id +
              " na DM do Instagram @caraguapixel ou apoie em apoia.se/caraguapixel para liberar seu código VIP — ou aguarde aprovação instantânea aqui na tela."
          ),
          h(
            "div",
            { className: "loja-card-acoes" },
            h(
              "a",
              {
                className: "loja-btn loja-btn-ciano",
                href: "https://instagram.com/caraguapixel",
                target: "_blank",
                rel: "noopener"
              },
              "📸 Enviar DM no Instagram @caraguapixel ↗"
            ),
            h(
              "a",
              {
                className: "loja-btn loja-btn-roxo",
                href: "https://apoia.se/caraguapixel",
                target: "_blank",
                rel: "noopener"
              },
              "💜 Apoiar em apoia.se/caraguapixel ↗"
            )
          ),
          h(
            "div",
            { className: "loja-status-linha" },
            h("span", null, "🔄 Verificando liberação automática a cada 4 segundos..."),
            h(
              "button",
              {
                type: "button",
                className: "loja-btn",
                onClick: function () {
                  verificarStatusPedido(ped.id, false);
                }
              },
              "Verificar Agora"
            )
          )
        ),
        h("div", null, btnVoltar)
      );
    }

    // Checkout PIX Completo com QR Code + Copia e Cola
    // Preferir imagem base64 do Mercado Pago; fallback para canvas gerado localmente
    var qrEl;
    if (ped.pix_qr_base64) {
      qrEl = h("img", {
        className: "loja-qr-canvas",
        src: "data:image/png;base64," + ped.pix_qr_base64,
        width: "220",
        height: "220",
        alt: "QR Code PIX"
      });
    } else {
      qrEl = h("canvas", { className: "loja-qr-canvas", width: "220", height: "220" });
      desenharQRCanvas(qrEl, ped.pix_brcode);
    }

    var mpSeloEl = ped.mp_enabled
      ? h(
          "div",
          {
            className: "loja-mp-selo",
            style: {
              background: "linear-gradient(90deg,#009ee3 0%,#00c4a0 100%)",
              borderRadius: "8px",
              padding: "8px 14px",
              color: "#fff",
              fontWeight: "700",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              marginBottom: "4px"
            }
          },
          h("span", { text: "⚡" }),
          h("span", { text: "PIX Automático Mercado Pago — Liberação em segundos após pagar!" })
        )
      : null;

    const btnCopiarPix = h(
      "button",
      {
        type: "button",
        className: "loja-btn loja-btn-ouro loja-btn-bloco",
        onClick: function (ev) {
          const b = ev.currentTarget;
          copiarTexto(ped.pix_brcode, function () {
            b.textContent = "✅ Código PIX Copia e Cola Copiado!";
            setTimeout(function () {
              b.textContent = "📋 Copiar PIX Copia e Cola (1-Clique)";
            }, 2400);
          });
        }
      },
      "📋 Copiar PIX Copia e Cola (1-Clique)"
    );

    return h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "14px" } },
      mpSeloEl,
      h(
        "div",
        { className: "loja-pix-box" },
        h(
          "div",
          { className: "loja-qr-quadro" },
          qrEl,
          h("span", { className: "loja-qr-legenda", text: "ESCANEIE NO APP DO BANCO" })
        ),
        h(
          "div",
          { className: "loja-pix-detalhes" },
          h(
            "div",
            { className: "loja-card-cab" },
            h("span", { className: "loja-protocolo-cod", text: ped.id }),
            h("span", { className: "loja-preco", text: formatarBRL(ped.amount) })
          ),
          h(
            "p",
            { className: "loja-card-desc" },
            "Escaneie o QR Code ao lado ou copie o código PIX Copia e Cola abaixo. Assim que confirmado, seu passe VIP é entregue e ativado automaticamente nesta tela!"
          ),
          h("textarea", {
            className: "loja-pix-codigo",
            readonly: true,
            value: ped.pix_brcode,
            onClick: function (e) {
              e.target.select();
            }
          }),
          btnCopiarPix
        )
      ),
      h(
        "div",
        { className: "loja-status-linha" },
        h("span", null, "⏳ Aguardando confirmação automática (atualiza a cada 2,5s)..."),
        h(
          "button",
          {
            type: "button",
            className: "loja-btn loja-btn-ciano",
            onClick: function () {
              verificarStatusPedido(ped.id, false);
            }
          },
          "🔄 Já paguei, verificar"
        )
      ),
      h("div", null, btnVoltar)
    );
  }

  // ---------- Resgate de Código (CPX-... ou CRG-...) ----------
  async function resgatarCodigoManual(codigoBruto) {
    const code = String(codigoBruto || "").trim().toUpperCase();
    if (!code) {
      estado.feedback = { tipo: "erro", texto: "Digite um código válido para ativar." };
      renderizarCorpoModal();
      return;
    }

    estado.carregando = true;
    estado.feedback = null;
    renderizarCorpoModal();

    const ok = await aplicarResgateDeCodigo(code, false);
    estado.carregando = false;
    if (ok) {
      estado.codigoInput = "";
    }
    renderizarCorpoModal();
    atualizarBarraRapida();
  }

  async function aplicarResgateDeCodigo(code, automatico) {
    const codeNorm = String(code || "").trim().toUpperCase();
    if (!codeNorm || codigosEmResgate.has(codeNorm)) return false;
    codigosEmResgate.add(codeNorm);

    const ident = obterIdentidadeJogador();
    const nome = String(estado.nomeComprador || ident.nome || "Morador").trim().slice(0, 28);
    const arroba = String(estado.arrobaComprador || ident.arroba || "").trim().replace(/^@+/, "").slice(0, 30);

    try {
      const res = await apiPost("redeem_code", {
        code: codeNorm,
        pid: ident.pid,
        nome: nome,
        arroba: arroba,
        extra: (estado.pedidoAtivo && estado.pedidoAtivo.payload) ? estado.pedidoAtivo.payload : {}
      });

      if (!res || !res.ok) {
        if (!automatico) {
          estado.feedback = { tipo: "erro", texto: msgErroApi(res, "Código inválido ou já utilizado.") };
        }
        return false;
      }

      const online = getOnline();

      // 1) Código Secreto do Criador (@caraguapixel)
      if (res.creator === true || res.badge === "criador") {
        const chaveCriador = res.creator_key || code;
        try {
          localStorage.setItem(CHAVE_CREATOR_KEY, chaveCriador);
        } catch (e) {}

        inventario.criador = true;
        inventario.vip = true;
        inventario.badge = "criador";
        CARROS_CATALOGO.forEach(function (c) { addUnico(inventario.carros, c.id); });
        PROFISSOES_CATALOGO.forEach(function (p) { addUnico(inventario.profissoes, p.id); });
        if (!inventario.carroPreferido) inventario.carroPreferido = "esportivo";
        salvarInventario();

        if (online) {
          if (typeof online.atualizarPerfilExterno === "function") {
            online.atualizarPerfilExterno({ arroba: "caraguapixel" });
          }
          if (typeof online.setEstadoInteracao === "function") {
            online.setEstadoInteracao({
              badge: "criador",
              creator_key: chaveCriador
            });
          }
        }

        await sincronizarEstadoPublico();
        estado.feedback = {
          tipo: "sucesso",
          texto: "👑 Bem-vindo, Criador Oficial @caraguapixel! Coroa dourada 3D, selo oficial e garagem completa ativados!"
        };
        avisar("👑 Modo Criador @caraguapixel ativado com sucesso!");
        return true;
      }

      // 2) Passe VIP Padrão (CPX-XXXX-XXXX)
      const pass = res.pass || res;
      const itemId = String(pass.item_id || "").trim();
      const kind = String(pass.kind || "").trim();
      let meta = pass.metadata || {};
      if (typeof meta === "string") {
        try {
          meta = JSON.parse(meta);
        } catch (e) {
          meta = {};
        }
      }

      addUnico(inventario.passes, pass.code || code);
      inventario.vip = true;
      if (inventario.badge !== "criador") inventario.badge = "vip";

      // Desbloqueio conforme item_id / kind
      const idsCarros = CARROS_CATALOGO.map(function (c) { return c.id; });
      if (kind === "carro" || idsCarros.indexOf(itemId) !== -1) {
        const cId = idsCarros.indexOf(itemId) !== -1 ? itemId : (meta.car_type || "bugue");
        addUnico(inventario.carros, cId);
        inventario.carroPreferido = cId;
      }

      const idsProf = PROFISSOES_CATALOGO.map(function (p) { return p.id; });
      if (kind === "profissao" || idsProf.indexOf(itemId) !== -1) {
        const pId = idsProf.indexOf(itemId) !== -1 ? itemId : (meta.profissao_id || "profissao_empresario");
        addUnico(inventario.profissoes, pId);
        inventario.profissaoId = pId;
        inventario.profissaoAtiva = rotuloProfissaoPorId(pId);
      }

      if (itemId === "combo_vip" || kind === "combo" || kind === "vip") {
        addUnico(inventario.carros, meta.car_type || "esportivo");
        inventario.carroPreferido = meta.car_type || "esportivo";
        PROFISSOES_CATALOGO.forEach(function (p) { addUnico(inventario.profissoes, p.id); });
        const pEscolhida = meta.profissao_id || "profissao_empresario";
        inventario.profissaoId = pEscolhida;
        inventario.profissaoAtiva = (meta.profissao && meta.profissao !== "VIP")
          ? String(meta.profissao)
          : rotuloProfissaoPorId(pEscolhida);
      }

      if (kind === "loja" || itemId === "loja_empresa_vip" || itemId === "loja_bronze" || itemId === "loja_ouro" || (meta && meta.empresa_vip)) {
        if (itemId === "loja_ouro" || (meta && meta.combo)) {
          PROFISSOES_CATALOGO.forEach(function (p) { addUnico(inventario.profissoes, p.id); });
        } else {
          addUnico(inventario.profissoes, "profissao_empresario");
        }
        inventario.profissaoId = "profissao_empresario";
        inventario.profissaoAtiva = (meta && meta.profissao) ? String(meta.profissao) : "🏢 Lojista VIP";
        const carroLoja = (meta && meta.car_type)
          ? String(meta.car_type)
          : (itemId === "loja_ouro" ? "esportivo" : (itemId === "loja_bronze" ? "moto" : "bugue"));
        addUnico(inventario.carros, carroLoja);
        inventario.carroPreferido = carroLoja;
      }

      const loteConstruir = (res.owned_lot && res.owned_lot.lot_id) ? res.owned_lot : null;
      if (loteConstruir || (meta && meta.lot_id)) {
        const idLoteFinal = String(loteConstruir ? loteConstruir.lot_id : meta.lot_id);
        addUnico(inventario.casas, idLoteFinal);
        const m = getMundo();
        if (m && typeof m.construirCasaComprada === "function") {
          m.construirCasaComprada(
            loteConstruir || {
              lot_id: idLoteFinal,
              style: meta.style || (itemId.indexOf("casa_") === 0 || itemId === "sobrado" || itemId === "mansao" ? itemId : "sobrado"),
              color: meta.color || "#f59e0b",
              title: meta.title || ("Casa de " + nome),
              owner_name: nome,
              owner_handle: arroba,
              x: Number(meta.x) || 0,
              z: Number(meta.z) || 0,
              rot: Number(meta.rot) || 0,
              door_room: meta.door_room || ("casa_" + idLoteFinal)
            }
          );
        }
      }

      salvarInventario();
      sincronizarInventarioNaRede();
      await sincronizarEstadoPublico();

      if (!automatico) {
        estado.feedback = {
          tipo: "sucesso",
          texto: "🎉 Código " + (pass.code || code) + " ativado com sucesso! Aproveite seus benefícios VIP!"
        };
      }
      avisar("🎉 Passe VIP ativado com sucesso!");
      return true;
    } catch (e) {
      if (!automatico) {
        estado.feedback = { tipo: "erro", texto: "Falha de conexão ao validar o código." };
      }
      return false;
    } finally {
      codigosEmResgate.delete(codeNorm);
    }
  }

  let slotArrobaResizeBound = false;
  let mobObsBarra = null;

  function ehLayoutMobileHud() {
    if (typeof window.matchMedia === "function") {
      return window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
    }
    return window.innerWidth <= 760;
  }

  function garantirOrdemFilhos(pai, lista) {
    if (!pai) return;
    const desejados = [];
    for (let i = 0; i < lista.length; i++) {
      if (lista[i]) desejados.push(lista[i]);
    }
    let igual = pai.children.length === desejados.length;
    if (igual) {
      for (let i = 0; i < desejados.length; i++) {
        if (pai.children[i] !== desejados[i]) {
          igual = false;
          break;
        }
      }
    }
    if (igual) return;
    for (let i = 0; i < desejados.length; i++) {
      pai.appendChild(desejados[i]);
    }
  }

  function atualizarMetricasMob() {
    if (!ehLayoutMobileHud()) {
      document.documentElement.style.removeProperty("--mob-hud-top");
      document.documentElement.style.removeProperty("--policia-mob-top");
      return;
    }
    if (!barraEl || typeof barraEl.getBoundingClientRect !== "function") return;
    const r = barraEl.getBoundingClientRect();
    if (r && r.height > 0 && r.bottom > 40) {
      const off = Math.ceil(r.bottom + 6) + "px";
      document.documentElement.style.setProperty("--mob-hud-top", off);
      document.documentElement.style.setProperty("--policia-mob-top", off);
    }
  }

  function sincronizarClasseContaArroba(pf) {
    if (!btnContaArroba) return;
    if (!pf) {
      const online = getOnline();
      pf = online && typeof online.getPerfil === "function" ? online.getPerfil() : null;
    }
    const verificado = !!(pf && pf.verificadoPin);
    if (ehLayoutMobileHud()) {
      btnContaArroba.className = "loja-pilula loja-pilula-conta" + (verificado ? " verificado" : "");
    } else {
      btnContaArroba.className = "botao botao-conta-topo" + (verificado ? " verificado" : "");
    }
  }

  function sincronizarSlotContaArroba() {
    if (!btnContaArroba) return;
    const ehMob = ehLayoutMobileHud();
    if (ehMob) {
      if (spanAbrirTexto) spanAbrirTexto.hidden = true;
      garantirOrdemFilhos(barraEl, [btnAbrirDom, btnContaArroba, btnAbrirLoja, btnMenuMobile]);
      garantirOrdemFilhos(drawerGridEl, [btnMapaMob, btnJetski, btnMoedas, btnApoiarDom, btnCarro, btnPedidoVivo]);
      garantirOrdemFilhos(drawerControlesEl, [grupoUtil, grupoEmotes]);
      sincronizarInfoCidadeMobile();
      requestAnimationFrame(atualizarMetricasMob);
      posicionarFecharMapaMob();
    } else {
      fecharMenuMobile();
      fecharMapaMobile();
      if (spanAbrirTexto) spanAbrirTexto.hidden = false;
      const acoesEl = document.querySelector(".hud-acoes");
      garantirOrdemFilhos(acoesEl, [btnContaArroba, btnApoiarDom, btnAbrirDom]);
      garantirOrdemFilhos(barraEl, [btnAbrirLoja, btnMoedas, btnJetski, btnCarro, btnMenuMobile, btnPedidoVivo, grupoUtil, grupoEmotes]);
      atualizarMetricasMob();
    }
    sincronizarClasseContaArroba();
    atualizarBarraRapida();
  }

  // ---------- Inicialização ----------
  function iniciar() {
    montarHUD();
    sincronizarSlotContaArroba();
    if (!slotArrobaResizeBound) {
      slotArrobaResizeBound = true;
      window.addEventListener("resize", sincronizarSlotContaArroba, { passive: true });
      if (typeof window.matchMedia === "function") {
        const mq = window.matchMedia("(max-width: 760px), (pointer: coarse)");
        if (typeof mq.addEventListener === "function") {
          mq.addEventListener("change", sincronizarSlotContaArroba);
        } else if (typeof mq.addListener === "function") {
          mq.addListener(sincronizarSlotContaArroba);
        }
      }
      if (typeof ResizeObserver === "function" && !mobObsBarra) {
        mobObsBarra = new ResizeObserver(atualizarMetricasMob);
        if (barraEl) mobObsBarra.observe(barraEl);
        const topoEl = document.querySelector("header.topo");
        if (topoEl) mobObsBarra.observe(topoEl);
      }
    }
    sincronizarInventarioNaRede();

    const pedidoSalvo = carregarPedidoAtivoStorage();
    if (pedidoSalvo && pedidoSalvo.status === "pending") {
      estado.pedidoAtivo = pedidoSalvo;
      iniciarPollingPedido(pedidoSalvo.id);
      verificarStatusPedido(pedidoSalvo.id, true);
    }

    atualizarBarraRapida();
    atualizarPillContexto();
    sincronizarEstadoPublico();

    // Reaplica estado de inventário caso online.js termine de conectar logo em seguida
    setTimeout(sincronizarInventarioNaRede, 1200);
    setTimeout(aplicarCasasCompradasNoMundo, 1500);

    let ultimaChecagemFoco = 0;
    function checarAoVoltarParaAba() {
      const agora = Date.now();
      if (agora - ultimaChecagemFoco < 800) return;
      ultimaChecagemFoco = agora;
      if (estado.pedidoAtivo && estado.pedidoAtivo.status === "pending") {
        verificarStatusPedido(estado.pedidoAtivo.id, true);
      }
      sincronizarEstadoPublico();
    }

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) checarAoVoltarParaAba();
    });
    window.addEventListener("focus", checarAoVoltarParaAba);
    window.addEventListener("pageshow", checarAoVoltarParaAba);

    // Pill contextual e barra rápida a ~150ms
    setInterval(function () {
      atualizarPillContexto();
      atualizarBarraRapida();
    }, 150);

    // Sincronização de terrenos ocupados e passes a cada 20s
    setInterval(sincronizarEstadoPublico, 20000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }

  function abrirCheckoutRapido(itemId) {
    if (!itemId) return;
    abrirLoja({ tab: "carros" });
    const ident = obterIdentidadeJogador();
    const nomeFinal = String(estado.nomeComprador || ident.nome || "Morador").trim().slice(0, 28);
    const arrobaFinal = String(estado.arrobaComprador || ident.arroba || "").trim().replace(/^@+/, "").slice(0, 30);
    criarPedidoPIX({
      kind: kindDeCatalogo(itemId, "evento"),
      item_id: String(itemId),
      buyer_name: nomeFinal,
      buyer_handle: arrobaFinal,
      buyer_pid: ident.pid,
      payload: {}
    });
  }

  window.CARAGUA_LOJA = {
    abrir: abrirLoja,
    abrirCheckoutRapido: abrirCheckoutRapido,
    fechar: fecharLoja,
    sincronizar: sincronizarEstadoPublico,
    getPrices: function () {
      return Object.assign({}, PRECOS_PADRAO, estado.prices || {});
    },
    getInventario: function () {
      return Object.assign({}, inventario);
    }
  };
})();
