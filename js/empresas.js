(function () {
  "use strict";

  var API_URL = "api/economia.php";
  var STORAGE_PEDIDO = "caragua_empresa_pedido_v1";
  var STORAGE_PERFIL = "caragua_chat_perfil_v1";
  var INSTAGRAM_PROFILE_URL = "https://www.instagram.com/caraguapixel/";
  function isWhatsappUrl(url) {
    return /^https?:\/\/(?:chat\.whatsapp\.com\/|wa\.me\/|api\.whatsapp\.com\/send)/i.test(String(url || "").trim());
  }
  var EXPIRA_MS = 45 * 60 * 1000;

  var state = {
    itemSelecionado: "loja_empresa_vip",
    precosPlanos: {
      loja_bronze: 19.90,
      loja_empresa_vip: 29.90,
      loja_ouro: 50.00
    },
    precoLoja: 29.90,
    vagasTotal: 20,
    vagasOcupadas: 0,
    vagasRestantes: 20,
    whatsappVipUrl: "",
    pedido: null,
    pollTimer: null,
    countdownTimer: null,
    verificando: false
  };

  var els = {
    vagasTexto: document.getElementById("vagasTexto"),
    vagasProgressBar: document.getElementById("vagasProgressBar"),
    vagasFill: document.getElementById("vagasFill"),
    heroPreco: document.getElementById("heroPreco"),
    checkoutTopoPreco: document.getElementById("checkoutTopoPreco"),
    form: document.getElementById("formEmpresa"),
    empresa: document.getElementById("empresa"),
    responsavel: document.getElementById("responsavel"),
    cnpj: document.getElementById("cnpj"),
    whatsapp: document.getElementById("whatsapp"),
    arroba: document.getElementById("arroba"),
    ramo: document.getElementById("ramo"),
    localPreferido: document.getElementById("local_preferido"),
    observacoes: document.getElementById("observacoes"),
    erroForm: document.getElementById("erroForm"),
    btnGerarPix: document.getElementById("btnGerarPix"),
    viewPix: document.getElementById("viewPix"),
    mpSelo: document.getElementById("mpSelo"),
    pixPedidoId: document.getElementById("pixPedidoId"),
    pixTimer: document.getElementById("pixTimer"),
    pixAreaPadrao: document.getElementById("pixAreaPadrao"),
    pixQrContainer: document.getElementById("pixQrContainer"),
    pixValorDisplay: document.getElementById("pixValorDisplay"),
    pixEmpresaDisplay: document.getElementById("pixEmpresaDisplay"),
    pixArrobaDisplay: document.getElementById("pixArrobaDisplay"),
    pixBrcodeInput: document.getElementById("pixBrcodeInput"),
    btnCopiarPix: document.getElementById("btnCopiarPix"),
    pixAreaReserva: document.getElementById("pixAreaReserva"),
    reservaPedidoId: document.getElementById("reservaPedidoId"),
    reservaValor: document.getElementById("reservaValor"),
    btnCopiarProtocolo: document.getElementById("btnCopiarProtocolo"),
    btnReservaAtendimento: document.getElementById("btnReservaAtendimento"),
    pixPollingStatus: document.getElementById("pixPollingStatus"),
    btnVerificarAgora: document.getElementById("btnVerificarAgora"),
    btnCancelarPedido: document.getElementById("btnCancelarPedido"),
    viewAprovado: document.getElementById("viewAprovado"),
    aprPedidoId: document.getElementById("aprPedidoId"),
    aprEmpresaInfo: document.getElementById("aprEmpresaInfo"),
    aprLocalInfo: document.getElementById("aprLocalInfo"),
    aprPasseWrap: document.getElementById("aprPasseWrap"),
    aprPassCode: document.getElementById("aprPassCode"),
    btnCopiarPasse: document.getElementById("btnCopiarPasse"),
    aprSlaPedido: document.getElementById("aprSlaPedido"),
    btnWhatsappVip: document.getElementById("btnWhatsappVip"),
    boxMsgGrupoVip: document.getElementById("boxMsgGrupoVip"),
    txtMsgGrupoVip: document.getElementById("txtMsgGrupoVip"),
    btnCopiarMsgGrupo: document.getElementById("btnCopiarMsgGrupo"),
    btnInstaDmVip: document.getElementById("btnInstaDmVip"),
    btnNovaEmpresa: document.getElementById("btnNovaEmpresa")
  };

  function formatarBRL(valor) {
    var n = Number(valor);
    if (!Number.isFinite(n) || n <= 0) n = 29.90;
    return "R$ " + n.toFixed(2).replace(".", ",");
  }

  function apenasDigitos(str) {
    return String(str || "").replace(/\D/g, "");
  }

  function aplicarMascaraCnpjCpf(valor) {
    var d = apenasDigitos(valor).slice(0, 14);
    if (d.length <= 11) {
      if (d.length <= 3) return d;
      if (d.length <= 6) return d.slice(0, 3) + "." + d.slice(3);
      if (d.length <= 9) return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6);
      return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9);
    }
    if (d.length <= 12) {
      return d.slice(0, 2) + "." + d.slice(2, 5) + "." + d.slice(5, 8) + "/" + d.slice(8);
    }
    return d.slice(0, 2) + "." + d.slice(2, 5) + "." + d.slice(5, 8) + "/" + d.slice(8, 12) + "-" + d.slice(12);
  }

  function aplicarMascaraWhatsapp(valor) {
    var d = apenasDigitos(valor);
    if (d.length > 11 && d.slice(0, 2) === "55") {
      d = d.slice(2);
    }
    d = d.slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return "(" + d;
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  function limparArroba(valor) {
    return String(valor || "").trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9._]/g, "").slice(0, 30);
  }

  function obterPidJogador() {
    try {
      var raw = localStorage.getItem(STORAGE_PERFIL);
      if (!raw) return "";
      var obj = JSON.parse(raw);
      return (obj && typeof obj.pid === "string") ? obj.pid : "";
    } catch (e) {
      return "";
    }
  }

  function copiarTexto(texto, aoCopiar) {
    var str = String(texto || "");
    if (!str) return;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(str).then(
        function () { if (aoCopiar) aoCopiar(true); },
        function () { copiarTextoFallback(str, aoCopiar); }
      );
      return;
    }
    copiarTextoFallback(str, aoCopiar);
  }

  function copiarTextoFallback(str, aoCopiar) {
    try {
      var ta = document.createElement("textarea");
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

  function feedbackBotao(btn, textoConfirmacao) {
    if (!btn) return;
    var original = btn.getAttribute("data-orig-txt") || btn.textContent;
    btn.setAttribute("data-orig-txt", original);
    btn.textContent = textoConfirmacao;
    setTimeout(function () {
      btn.textContent = original;
    }, 2200);
  }

  // ---------- Gerador de QR Code Canvas (Fallback caso manual PIX sem base64) ----------
  var QR_VERSOES_L = [
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
  var GF_EXP = new Uint8Array(512);
  var GF_LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) GF_EXP[j] = GF_EXP[j - 255];
  })();
  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }
  function rsGerador(grau) {
    var poly = [1];
    for (var i = 0; i < grau; i++) {
      var prox = new Array(poly.length + 1).fill(0);
      var raiz = GF_EXP[i];
      for (var j = 0; j < poly.length; j++) {
        prox[j] ^= poly[j];
        prox[j + 1] ^= gfMul(poly[j], raiz);
      }
      poly = prox;
    }
    return poly;
  }
  function rsResto(dados, grau) {
    var gen = rsGerador(grau);
    var res = new Uint8Array(grau);
    for (var i = 0; i < dados.length; i++) {
      var fator = dados[i] ^ res[0];
      for (var j = 0; j < grau - 1; j++) res[j] = res[j + 1];
      res[grau - 1] = 0;
      if (fator !== 0) {
        for (var k = 0; k < grau; k++) res[k] ^= gfMul(gen[k + 1], fator);
      }
    }
    return res;
  }
  function gerarMatrizQR(texto) {
    if (typeof TextEncoder === "undefined") return null;
    var bytes = new TextEncoder().encode(String(texto || ""));
    var ver = 0, cfg = null, capDados = 0;
    for (var v = 1; v <= 10; v++) {
      var c = QR_VERSOES_L[v];
      var soma = 0;
      for (var g = 0; g < c.grupos.length; g++) soma += c.grupos[g][0] * c.grupos[g][1];
      var bitsCab = v <= 9 ? 12 : 20;
      if ((bytes.length * 8 + bitsCab) <= soma * 8) {
        ver = v; cfg = c; capDados = soma; break;
      }
    }
    if (!cfg) return null;
    var bits = [];
    function pushBits(val, len) {
      for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
    }
    pushBits(4, 4);
    pushBits(bytes.length, ver <= 9 ? 8 : 16);
    for (var i = 0; i < bytes.length; i++) pushBits(bytes[i], 8);
    var maxBits = capDados * 8;
    for (var p0 = 0; p0 < 4 && bits.length < maxBits; p0++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);
    var codewords = new Uint8Array(capDados);
    for (var i1 = 0; i1 < bits.length / 8; i1++) {
      var b = 0;
      for (var j1 = 0; j1 < 8; j1++) b = (b << 1) | bits[i1 * 8 + j1];
      codewords[i1] = b;
    }
    var pads = [0xec, 0x11];
    for (var i2 = bits.length / 8, p = 0; i2 < capDados; i2++, p ^= 1) codewords[i2] = pads[p];
    var blocosDados = [], blocosEc = [], offset = 0, maxLenBloco = 0;
    for (var g1 = 0; g1 < cfg.grupos.length; g1++) {
      var qtd = cfg.grupos[g1][0], tam = cfg.grupos[g1][1];
      if (tam > maxLenBloco) maxLenBloco = tam;
      for (var bl = 0; bl < qtd; bl++) {
        var fatia = codewords.slice(offset, offset + tam);
        offset += tam;
        blocosDados.push(fatia);
        blocosEc.push(rsResto(fatia, cfg.ec));
      }
    }
    var finalBytes = [];
    for (var m = 0; m < maxLenBloco; m++) {
      for (var bd = 0; bd < blocosDados.length; bd++) {
        if (m < blocosDados[bd].length) finalBytes.push(blocosDados[bd][m]);
      }
    }
    for (var e = 0; e < cfg.ec; e++) {
      for (var be = 0; be < blocosEc.length; be++) finalBytes.push(blocosEc[be][e]);
    }
    var N = 17 + 4 * ver, mat = [], resv = [];
    for (var r = 0; r < N; r++) { mat.push(new Uint8Array(N)); resv.push(new Uint8Array(N)); }
    function setFunc(row, col, escuro) {
      if (row < 0 || col < 0 || row >= N || col >= N) return;
      mat[row][col] = escuro ? 1 : 0; resv[row][col] = 1;
    }
    function finder(r0, c0) {
      for (var dr = -1; dr <= 7; dr++) {
        for (var dc = -1; dc <= 7; dc++) {
          var rr = r0 + dr, cc = c0 + dc;
          if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
          var dentro7 = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
          var borda7 = dr === 0 || dr === 6 || dc === 0 || dc === 6;
          var miolo3 = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          setFunc(rr, cc, dentro7 && (borda7 || miolo3));
        }
      }
    }
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
    var al = cfg.align;
    for (var ai = 0; ai < al.length; ai++) {
      for (var aj = 0; aj < al.length; aj++) {
        var cr = al[ai], cc2 = al[aj];
        if ((cr <= 8 && cc2 <= 8) || (cr <= 8 && cc2 >= N - 9) || (cr >= N - 9 && cc2 <= 8)) continue;
        for (var dr2 = -2; dr2 <= 2; dr2++) {
          for (var dc2 = -2; dc2 <= 2; dc2++) setFunc(cr + dr2, cc2 + dc2, Math.max(Math.abs(dr2), Math.abs(dc2)) !== 1);
        }
      }
    }
    for (var t = 8; t < N - 8; t++) {
      if (!resv[6][t]) setFunc(6, t, t % 2 === 0);
      if (!resv[t][6]) setFunc(t, 6, t % 2 === 0);
    }
    setFunc(N - 8, 8, true);
    var fmt = 0x77c4;
    var coordsTL = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
    for (var fi = 0; fi < 15; fi++) setFunc(coordsTL[fi][0], coordsTL[fi][1], ((fmt >>> (14 - fi)) & 1) === 1);
    for (var fi2 = 0; fi2 < 7; fi2++) setFunc(N - 1 - fi2, 8, ((fmt >>> (14 - fi2)) & 1) === 1);
    for (var fi3 = 7; fi3 < 15; fi3++) setFunc(8, N - 15 + fi3, ((fmt >>> (14 - fi3)) & 1) === 1);
    if (cfg.vInfo) {
      for (var vi = 0; vi < 18; vi++) {
        var vbit = ((cfg.vInfo >>> vi) & 1) === 1;
        var va = Math.floor(vi / 3), vb = (vi % 3) + N - 11;
        setFunc(va, vb, vbit); setFunc(vb, va, vbit);
      }
    }
    var bitIdx = 0, totalBitsFinal = finalBytes.length * 8, paraCima = true;
    for (var col = N - 1; col >= 1; col -= 2) {
      if (col === 6) col = 5;
      for (var passo = 0; passo < N; passo++) {
        var row = paraCima ? (N - 1 - passo) : passo;
        for (var dc3 = 0; dc3 < 2; dc3++) {
          var c3 = col - dc3;
          if (resv[row][c3]) continue;
          var escuro = 0;
          if (bitIdx < totalBitsFinal) {
            escuro = (finalBytes[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1;
            bitIdx++;
          }
          if ((row + c3) % 2 === 0) escuro ^= 1;
          mat[row][c3] = escuro;
        }
      }
      paraCima = !paraCima;
    }
    return mat;
  }

  function renderizarQrCode(container, brcode, qrBase64) {
    while (container.firstChild) container.removeChild(container.firstChild);
    if (qrBase64) {
      var img = document.createElement("img");
      img.width = 210;
      img.height = 210;
      img.alt = "QR Code PIX Mercado Pago";
      img.src = qrBase64.indexOf("data:image/") === 0 ? qrBase64 : ("data:image/png;base64," + qrBase64);
      container.appendChild(img);
      return;
    }
    if (!brcode) return;
    var mat = gerarMatrizQR(brcode);
    if (mat) {
      var canvas = document.createElement("canvas");
      var W = 210;
      canvas.width = W;
      canvas.height = W;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, W);
      var N = mat.length;
      var margem = 3;
      var escala = Math.floor(W / (N + margem * 2));
      var offset = Math.floor((W - N * escala) / 2);
      ctx.fillStyle = "#0a0f1d";
      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          if (mat[r][c]) ctx.fillRect(offset + c * escala, offset + r * escala, escala, escala);
        }
      }
      container.appendChild(canvas);
    } else {
      var imgFb = document.createElement("img");
      imgFb.width = 210;
      imgFb.height = 210;
      imgFb.alt = "QR Code PIX";
      imgFb.src = "https://api.qrserver.com/v1/create-qr-code/?size=210x210&margin=4&data=" + encodeURIComponent(brcode);
      container.appendChild(imgFb);
    }
  }

  // ---------- Estado Público & UI ----------
  function atualizarVagasEPrecoUI() {
    var total = state.vagasTotal || 20;
    var ocupadas = Math.max(0, Number(state.vagasOcupadas) || 0);
    var restantes = Math.max(0, Number(state.vagasRestantes));
    var pct = Math.min(100, Math.max(4, Math.round((ocupadas / total) * 100)));

    els.vagasTexto.textContent = ocupadas + " / " + total + " vagas preenchidas · Restam " + restantes + " vagas";
    els.vagasProgressBar.setAttribute("aria-valuemax", String(total));
    els.vagasProgressBar.setAttribute("aria-valuenow", String(ocupadas));
    els.vagasFill.style.width = (ocupadas === 0 ? 5 : pct) + "%";

    ["loja_bronze", "loja_empresa_vip", "loja_ouro"].forEach(function (id) {
      var elP = document.getElementById("precoPlano_" + id);
      if (elP) elP.textContent = formatarBRL(state.precosPlanos[id]);
    });

    state.precoLoja = state.precosPlanos[state.itemSelecionado] || 29.90;
    var precoFmt = formatarBRL(state.precoLoja);
    els.heroPreco.textContent = "A partir de " + formatarBRL(state.precosPlanos.loja_bronze);
    els.checkoutTopoPreco.textContent = precoFmt;
    if (!els.btnGerarPix.disabled) {
      els.btnGerarPix.textContent = "💠 Gerar PIX Automático · " + precoFmt;
    }
  }

  function selecionarPlano(planoId) {
    if (!state.precosPlanos[planoId]) return;
    state.itemSelecionado = planoId;
    var cards = document.querySelectorAll(".plano-card[data-plano-id]");
    cards.forEach(function (card) {
      var ativo = card.getAttribute("data-plano-id") === planoId;
      card.classList.toggle("ativo", ativo);
      card.setAttribute("aria-pressed", ativo ? "true" : "false");
    });
    atualizarVagasEPrecoUI();
  }

  document.querySelectorAll(".plano-card[data-plano-id]").forEach(function (card) {
    card.addEventListener("click", function () {
      selecionarPlano(card.getAttribute("data-plano-id"));
    });
  });

  async function carregarEstadoPublico() {
    try {
      var res = await fetch(API_URL + "?action=public_state", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      var data = await res.json();
      if (!data || !data.ok) return;

      if (data.prices) {
        ["loja_bronze", "loja_empresa_vip", "loja_ouro"].forEach(function (id) {
          if (Number.isFinite(Number(data.prices[id]))) {
            state.precosPlanos[id] = Number(data.prices[id]);
          }
        });
      }
      if (Number.isFinite(Number(data.vagas_empresas_total))) {
        state.vagasTotal = Number(data.vagas_empresas_total);
      }
      if (Number.isFinite(Number(data.vagas_empresas_ocupadas))) {
        state.vagasOcupadas = Number(data.vagas_empresas_ocupadas);
      }
      if (Number.isFinite(Number(data.vagas_empresas_restantes))) {
        state.vagasRestantes = Number(data.vagas_empresas_restantes);
      }
      if (typeof data.whatsapp_vip_url === "string" && isWhatsappUrl(data.whatsapp_vip_url)) {
        state.whatsappVipUrl = data.whatsapp_vip_url.trim();
      } else if (typeof data.whatsapp_vip_url === "string" && data.whatsapp_vip_url.trim() === "") {
        state.whatsappVipUrl = "";
      }
      atualizarVagasEPrecoUI();

      // Se já estiver na tela aprovada ou em Reserva VIP pendente, atualiza os links com whatsappVipUrl recente
      if (state.pedido && state.pedido.status === "approved") {
        configurarBotoesAprovados(state.pedido);
      } else if (state.pedido && state.pedido.status === "pending" && !state.pedido.pix_brcode) {
        var msgRes = "Olá Caraguá Pixel! Fiz o cadastro da loja " + ((state.pedido.payload && state.pedido.payload.empresa) || "") + " (Pedido: " + state.pedido.id + ").";
        els.btnReservaAtendimento.href = isWhatsappUrl(state.whatsappVipUrl) ? construirUrlVip(state.whatsappVipUrl, msgRes) : INSTAGRAM_PROFILE_URL;
      }
    } catch (e) {}
  }

  // ---------- Persistência local do Pedido Ativo ----------
  function salvarPedidoStorage(ped) {
    try {
      if (!ped) {
        localStorage.removeItem(STORAGE_PEDIDO);
        return;
      }
      localStorage.setItem(STORAGE_PEDIDO, JSON.stringify(ped));
    } catch (e) {}
  }

  function carregarPedidoStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_PEDIDO);
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (!p || !p.id) {
        localStorage.removeItem(STORAGE_PEDIDO);
        return null;
      }
      if (p.status === "pending" && p.iniciadoEm && (Date.now() - Number(p.iniciadoEm)) > EXPIRA_MS) {
        localStorage.removeItem(STORAGE_PEDIDO);
        return null;
      }
      return p;
    } catch (e) {
      return null;
    }
  }

  // ---------- Timers & Polling ----------
  function pararTimers() {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
    if (state.countdownTimer) {
      clearInterval(state.countdownTimer);
      state.countdownTimer = null;
    }
  }

  function atualizarCountdown() {
    if (!state.pedido || state.pedido.status !== "pending") return;
    var iniciado = Number(state.pedido.iniciadoEm) || Date.now();
    var restanteMs = Math.max(0, EXPIRA_MS - (Date.now() - iniciado));
    if (restanteMs <= 0) {
      els.pixTimer.textContent = "⌛ Tempo esgotado";
      els.pixPollingStatus.textContent = "⏳ Este código PIX expirou após 45 minutos. Clique em Alterar cadastro para gerar um novo.";
      pararTimers();
      salvarPedidoStorage(null);
      return;
    }
    var segTotal = Math.floor(restanteMs / 1000);
    var min = Math.floor(segTotal / 60);
    var seg = segTotal % 60;
    els.pixTimer.textContent = "⏱️ Expira em " + (min < 10 ? "0" : "") + min + ":" + (seg < 10 ? "0" : "") + seg;
  }

  function iniciarTimers(orderId) {
    pararTimers();
    atualizarCountdown();
    state.countdownTimer = setInterval(atualizarCountdown, 1000);
    state.pollTimer = setInterval(function () {
      if (!state.pedido || state.pedido.id !== orderId || state.pedido.status !== "pending") {
        pararTimers();
        return;
      }
      verificarPedido(orderId, true);
    }, 2500);
  }

  // ---------- Views Checkout ----------
  function mostrarErroForm(msg) {
    if (!msg) {
      els.erroForm.hidden = true;
      els.erroForm.textContent = "";
      return;
    }
    els.erroForm.textContent = msg;
    els.erroForm.hidden = false;
  }

  function mostrarView(nome) {
    els.form.hidden = nome !== "form";
    els.viewPix.hidden = nome !== "pix";
    els.viewAprovado.hidden = nome !== "aprovado";
  }

  function renderizarViewPix(ped) {
    mostrarView("pix");
    els.pixPedidoId.textContent = "Pedido: " + ped.id;
    els.mpSelo.hidden = !ped.mp_enabled;
    var temPix = !!ped.pix_brcode;

    if (temPix) {
      els.pixAreaPadrao.hidden = false;
      els.pixAreaReserva.hidden = true;
      els.pixValorDisplay.textContent = formatarBRL(ped.amount);
      els.pixEmpresaDisplay.textContent = (ped.payload && ped.payload.empresa) ? ped.payload.empresa : "Sua Empresa";
      els.pixArrobaDisplay.textContent = ped.buyer_handle ? ("@" + ped.buyer_handle) : "";
      els.pixBrcodeInput.value = ped.pix_brcode;
      renderizarQrCode(els.pixQrContainer, ped.pix_brcode, ped.pix_qr_base64 || "");
    } else {
      els.pixAreaPadrao.hidden = true;
      els.pixAreaReserva.hidden = false;
      els.reservaPedidoId.textContent = ped.id;
      els.reservaValor.textContent = formatarBRL(ped.amount);
      var msgReserva = "Olá Caraguá Pixel! Fiz o cadastro da loja " + ((ped.payload && ped.payload.empresa) || "") + " (Pedido: " + ped.id + ").";
      els.btnReservaAtendimento.href = isWhatsappUrl(state.whatsappVipUrl) ? construirUrlVip(state.whatsappVipUrl, msgReserva) : INSTAGRAM_PROFILE_URL;
    }

    els.pixPollingStatus.textContent = "🔄 Verificando pagamento automaticamente a cada 2,5s...";
    iniciarTimers(ped.id);
  }

  function montarMensagemGrupoVip(ped) {
    var payload = ped.payload || {};
    var empresa = payload.empresa || "Minha Loja";
    var arroba = ped.buyer_handle ? ("@" + limparArroba(ped.buyer_handle)) : "(sem @)";
    var local = payload.local_preferido || "Galeria Pixel";
    var passe = ped.pass_code ? ped.pass_code : "Em geração";
    return (
      "Olá equipe Caraguá Pixel! Acabei de confirmar minha Loja Real VIP 🏢✨\n" +
      "• Pedido: " + ped.id + "\n" +
      "• Passe VIP: " + passe + "\n" +
      "• Loja: " + empresa + "\n" +
      "• Instagram: " + arroba + "\n" +
      "• Local preferido: " + local + "\n" +
      "Vou enviar minha logo e detalhes da fachada por aqui (prazo de até 2 dias úteis)!"
    );
  }

  function construirUrlVip(baseUrl, mensagem) {
    var url = String(baseUrl || "").trim();
    if (!isWhatsappUrl(url)) return INSTAGRAM_PROFILE_URL;
    if (/(?:wa\.me\/|api\.whatsapp\.com\/send)/i.test(url)) {
      var sep = url.indexOf("?") !== -1 ? "&" : "?";
      return url + sep + "text=" + encodeURIComponent(mensagem);
    }
    return url;
  }

  function configurarBotoesAprovados(ped) {
    var msgPronta = montarMensagemGrupoVip(ped);
    var urlBase = isWhatsappUrl(state.whatsappVipUrl) ? state.whatsappVipUrl : "";
    var ehGrupoWhatsapp = /chat\.whatsapp\.com/i.test(urlBase);
    var ehWhatsappDireto = /(?:wa\.me\/|api\.whatsapp\.com\/send)/i.test(urlBase);

    els.btnWhatsappVip.href = urlBase ? construirUrlVip(urlBase, msgPronta) : INSTAGRAM_PROFILE_URL;

    if (ehGrupoWhatsapp) {
      els.btnWhatsappVip.textContent = "💬 Entrar no Grupo VIP no WhatsApp →";
      els.boxMsgGrupoVip.hidden = false;
      els.txtMsgGrupoVip.value = msgPronta;
    } else if (ehWhatsappDireto) {
      els.btnWhatsappVip.textContent = "📲 Enviar Pedido e Logo no WhatsApp VIP →";
      els.boxMsgGrupoVip.hidden = true;
    } else {
      els.btnWhatsappVip.textContent = "📩 Enviar Pedido e Logo no Instagram @caraguapixel →";
      els.boxMsgGrupoVip.hidden = false;
      els.txtMsgGrupoVip.value = msgPronta;
    }

    els.btnInstaDmVip.href = INSTAGRAM_PROFILE_URL;
  }

  function renderizarViewAprovado(ped) {
    pararTimers();
    mostrarView("aprovado");
    var payload = ped.payload || {};
    var empresa = payload.empresa || "Sua Loja";
    var arroba = ped.buyer_handle ? (" @" + limparArroba(ped.buyer_handle)) : "";
    els.aprPedidoId.textContent = ped.id;
    els.aprEmpresaInfo.textContent = empresa + arroba;
    els.aprLocalInfo.textContent = payload.local_preferido || "Galeria Pixel";
    els.aprSlaPedido.textContent = ped.id;

    if (ped.pass_code) {
      els.aprPasseWrap.hidden = false;
      els.aprPassCode.textContent = ped.pass_code;
    } else {
      els.aprPasseWrap.hidden = true;
    }

    configurarBotoesAprovados(ped);
  }

  async function verificarPedido(orderId, silencioso) {
    if (!orderId || state.verificando) return;
    state.verificando = true;
    if (!silencioso) {
      els.btnVerificarAgora.disabled = true;
      els.btnVerificarAgora.textContent = "⏳ Verificando...";
    }

    try {
      var res = await fetch(API_URL + "?action=check_order&id=" + encodeURIComponent(orderId), {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      var data = await res.json();

      if (data && data.ok) {
        if (!state.pedido || state.pedido.id !== orderId) return;
        state.pedido.status = data.status || state.pedido.status;
        if (data.pass_code) state.pedido.pass_code = data.pass_code;
        if (data.payload && typeof data.payload === "object") {
          state.pedido.payload = Object.assign({}, state.pedido.payload || {}, data.payload);
        }
        salvarPedidoStorage(state.pedido);

        if (data.status === "approved") {
          renderizarViewAprovado(state.pedido);
          carregarEstadoPublico();
          if (typeof window.mostrarAviso === "function") {
            window.mostrarAviso("🎉 Pagamento aprovado! Entre no Grupo VIP para enviar sua logo.");
          }
          return;
        }

        if (data.status === "rejected") {
          pararTimers();
          salvarPedidoStorage(null);
          els.pixPollingStatus.textContent = "❌ Este pedido foi cancelado ou expirou. Clique em Alterar cadastro para gerar um novo.";
          return;
        }

        if (!silencioso) {
          els.pixPollingStatus.textContent = "⏳ Pagamento ainda não compensado. Assim que pagar no app do banco, confirmamos aqui em segundos!";
        }
      } else if (!silencioso) {
        els.pixPollingStatus.textContent = (data && (data.erro || data.error)) || "Não foi possível consultar o pedido agora.";
      }
    } catch (e) {
      if (!silencioso) {
        els.pixPollingStatus.textContent = "Erro de conexão ao verificar. Tentando novamente em instantes...";
      }
    } finally {
      state.verificando = false;
      els.btnVerificarAgora.disabled = false;
      els.btnVerificarAgora.textContent = "⚡ Já paguei, verificar agora";
    }
  }

  // ---------- Máscaras & Submissão ----------
  els.cnpj.addEventListener("input", function () {
    els.cnpj.value = aplicarMascaraCnpjCpf(els.cnpj.value);
    els.cnpj.classList.remove("invalido");
  });

  els.whatsapp.addEventListener("input", function () {
    els.whatsapp.value = aplicarMascaraWhatsapp(els.whatsapp.value);
    els.whatsapp.classList.remove("invalido");
  });

  els.arroba.addEventListener("input", function () {
    els.arroba.value = els.arroba.value.replace(/^@+/, "").replace(/\s+/g, "");
    els.arroba.classList.remove("invalido");
  });

  els.empresa.addEventListener("input", function () {
    els.empresa.classList.remove("invalido");
  });

  els.form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    mostrarErroForm("");
    [els.empresa, els.cnpj, els.whatsapp, els.arroba].forEach(function (el) {
      el.classList.remove("invalido");
    });

    var empresa = els.empresa.value.trim();
    var responsavel = els.responsavel.value.trim();
    var cnpj = els.cnpj.value.trim();
    var cnpjDigitos = apenasDigitos(cnpj);
    var whatsapp = els.whatsapp.value.trim();
    var whatsappDigitos = apenasDigitos(whatsapp);
    var arroba = limparArroba(els.arroba.value);
    var ramo = els.ramo.value;
    var localPreferido = els.localPreferido.value;
    var observacoes = els.observacoes.value.trim();

    if (empresa.length < 2) {
      els.empresa.classList.add("invalido");
      mostrarErroForm("Informe o nome da sua Loja ou Empresa.");
      els.empresa.focus();
      return;
    }

    if (cnpjDigitos.length !== 11 && cnpjDigitos.length !== 14) {
      els.cnpj.classList.add("invalido");
      mostrarErroForm("Informe um CNPJ válido (14 dígitos) ou CPF válido (11 dígitos).");
      els.cnpj.focus();
      return;
    }

    if (whatsappDigitos.length < 10 || whatsappDigitos.length > 11) {
      els.whatsapp.classList.add("invalido");
      mostrarErroForm("Informe um WhatsApp válido com DDD (10 ou 11 dígitos).");
      els.whatsapp.focus();
      return;
    }

    if (arroba.length < 2) {
      els.arroba.classList.add("invalido");
      mostrarErroForm("Informe o @Instagram da sua loja (mínimo 2 caracteres).");
      els.arroba.focus();
      return;
    }

    var buyerName = (responsavel || empresa).slice(0, 32);
    var reqBody = {
      action: "create_order",
      item_id: state.itemSelecionado || "loja_empresa_vip",
      kind: "loja",
      buyer_name: buyerName,
      buyer_handle: arroba,
      buyer_pid: obterPidJogador(),
      payload: {
        plano_id: state.itemSelecionado || "loja_empresa_vip",
        empresa: empresa,
        cnpj: cnpj,
        whatsapp: whatsapp,
        ramo: ramo,
        local_preferido: localPreferido,
        observacoes: observacoes
      }
    };

    els.btnGerarPix.disabled = true;
    els.btnGerarPix.textContent = "⏳ Gerando PIX Automático...";

    try {
      var resp = await fetch(API_URL + "?action=create_order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(reqBody)
      });
      var data = await resp.json();

      if (!resp.ok || !data || !data.ok) {
        mostrarErroForm((data && (data.erro || data.error)) || "Não foi possível gerar o pedido agora. Tente novamente.");
        return;
      }

      state.pedido = {
        id: data.id || data.order_id,
        kind: data.kind || "loja",
        item_id: data.item_id || state.itemSelecionado || "loja_empresa_vip",
        amount: Number.isFinite(Number(data.amount)) ? Number(data.amount) : state.precoLoja,
        pix_configured: !!data.pix_configured,
        mp_enabled: !!data.mp_enabled,
        pix_brcode: data.pix_brcode || "",
        pix_qr_base64: data.pix_qr_base64 || "",
        status: data.status || "pending",
        pass_code: "",
        buyer_handle: arroba,
        payload: reqBody.payload,
        iniciadoEm: Date.now()
      };

      salvarPedidoStorage(state.pedido);
      renderizarViewPix(state.pedido);
      document.getElementById("cadastro").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      mostrarErroForm("Erro de conexão com o servidor ao gerar o PIX. Verifique sua internet e tente novamente.");
    } finally {
      els.btnGerarPix.disabled = false;
      els.btnGerarPix.textContent = "💠 Gerar PIX Automático · " + formatarBRL(state.precoLoja);
    }
  });

  // ---------- Botões de Ação ----------
  els.btnCopiarPix.addEventListener("click", function () {
    copiarTexto(els.pixBrcodeInput.value, function () {
      feedbackBotao(els.btnCopiarPix, "✅ Código PIX Copiado!");
    });
  });

  els.btnCopiarProtocolo.addEventListener("click", function () {
    if (state.pedido) {
      copiarTexto(state.pedido.id, function () {
        feedbackBotao(els.btnCopiarProtocolo, "✅ Pedido Copiado!");
      });
    }
  });

  els.btnCopiarPasse.addEventListener("click", function () {
    if (state.pedido && state.pedido.pass_code) {
      copiarTexto(state.pedido.pass_code, function () {
        feedbackBotao(els.btnCopiarPasse, "✅ Passe Copiado!");
      });
    }
  });

  els.btnCopiarMsgGrupo.addEventListener("click", function () {
    copiarTexto(els.txtMsgGrupoVip.value, function () {
      feedbackBotao(els.btnCopiarMsgGrupo, "✅ Mensagem Copiada! Agora cole no Grupo");
    });
  });

  els.btnVerificarAgora.addEventListener("click", function () {
    if (state.pedido && state.pedido.id) {
      verificarPedido(state.pedido.id, false);
    }
  });

  function preencherFormDoPedido(ped) {
    if (!ped || !ped.payload) return;
    var p = ped.payload;
    if (!els.empresa.value && p.empresa) els.empresa.value = p.empresa;
    if (!els.cnpj.value && p.cnpj) els.cnpj.value = p.cnpj;
    if (!els.whatsapp.value && p.whatsapp) els.whatsapp.value = p.whatsapp;
    if (!els.arroba.value && ped.buyer_handle) els.arroba.value = ped.buyer_handle;
    if (p.ramo) els.ramo.value = p.ramo;
    if (p.local_preferido) els.localPreferido.value = p.local_preferido;
    if (!els.observacoes.value && p.observacoes) els.observacoes.value = p.observacoes;
  }

  function reiniciarCadastro(preservarCampos) {
    if (preservarCampos && state.pedido) {
      preencherFormDoPedido(state.pedido);
    }
    pararTimers();
    state.pedido = null;
    salvarPedidoStorage(null);
    mostrarErroForm("");
    mostrarView("form");
  }

  els.btnCancelarPedido.addEventListener("click", function () {
    reiniciarCadastro(true);
  });
  els.btnNovaEmpresa.addEventListener("click", function () {
    els.form.reset();
    reiniciarCadastro(false);
  });

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && state.pedido && state.pedido.status === "pending" && state.pedido.id) {
      verificarPedido(state.pedido.id, true);
    }
  });

  // ---------- Inicialização ----------
  atualizarVagasEPrecoUI();
  carregarEstadoPublico();

  var pedidoSalvo = carregarPedidoStorage();
  if (pedidoSalvo) {
    state.pedido = pedidoSalvo;
    if (pedidoSalvo.status === "approved") {
      renderizarViewAprovado(pedidoSalvo);
    } else if (pedidoSalvo.status === "pending") {
      renderizarViewPix(pedidoSalvo);
      verificarPedido(pedidoSalvo.id, true);
    }
  }
})();
