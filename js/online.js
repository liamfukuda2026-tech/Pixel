/* Caraguá Pixel · Multiplayer leve, bonecos 3D remotos, salas, carros, coroas, balões HQ e chat da cidade */
(function () {
  "use strict";

  const CHAVE_PERFIL = "caragua_chat_perfil_v1";
  const CHAVE_CREATOR_KEY = "caragua_creator_key_v1";
  const CHAVE_INVENTARIO = "caragua_inventario_v1";
  const CHAVE_MOEDAS = "caragua_moedas_v1";
  const ENDPOINT_CHAT = "api/chat.php";
  const CANAL_LOCAL = "caragua_online_v1";
  const CORES_CAMISA = [0x1c7ed6, 0xe03131, 0x2f9e44, 0xf0d060, 0x9c36b5, 0xff7a59];
  const NOMES_CAMISA = ["Azul", "Vermelho", "Verde", "Amarelo", "Roxo", "Coral"];
  const CARROS_VALIDOS = new Set(["", "moto", "bugue", "esportivo", "caminhonete", "jetski", "viatura"]);
  const BADGES_VALIDOS = new Set(["", "coroa", "vip", "criador", "xerife"]);
  const DURACAO_BALAO_MS = 9000;
  const DIST_PLACA_REMOTA = 120;
  const MAX_MENSAGENS_DOM = 120;
  const Y_SALA_INTERIOR = 140;
  const ALFABETO_ID = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

  const MUNDO = window.CARAGUA_MUNDO || null;
  const TEM_3D = !!(MUNDO && MUNDO.scene && MUNDO.cam && MUNDO.jog && typeof THREE !== "undefined");

  // ---------- Utilidades ----------
  function gerarAleatorio(tamanho) {
    let out = "";
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      const buf = new Uint8Array(tamanho);
      window.crypto.getRandomValues(buf);
      for (let i = 0; i < tamanho; i++) out += ALFABETO_ID[buf[i] % ALFABETO_ID.length];
      return out;
    }
    for (let i = 0; i < tamanho; i++) out += ALFABETO_ID[Math.floor(Math.random() * ALFABETO_ID.length)];
    return out;
  }

  function limparNome(valor, fallback) {
    const limpo = String(valor || "")
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 24);
    return limpo || fallback;
  }

  function limparArroba(valor) {
    return String(valor || "")
      .trim()
      .replace(/^@+/, "")
      .replace(/[^a-zA-Z0-9._]/g, "")
      .slice(0, 30);
  }

  function limparTextoChat(valor) {
    return String(valor || "")
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
  }

  function limparRoom(valor) {
    return String(valor || "")
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 40);
  }

  function limparEmote(valor) {
    return String(valor || "")
      .replace(/[\x00-\x1F\x7F]/g, "")
      .trim()
      .slice(0, 16);
  }

  function limparCarType(valor) {
    const v = String(valor || "").trim().toLowerCase();
    return CARROS_VALIDOS.has(v) ? v : "";
  }

  function limparRideOf(valor) {
    return String(valor || "")
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 48);
  }

  function limparProfissao(valor) {
    return String(valor || "")
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 32);
  }

  function rotuloProfissao(valor) {
    const p = limparProfissao(valor);
    if (!p) return "";
    const mapa = {
      profissao_medica: "🩺 Médica(o)",
      profissao_barbeiro: "💈 Barbeiro",
      profissao_corretor: "🏠 Corretor(a)",
      profissao_empresario: "💼 Empresário(a)",
      combo_vip: "💎 VIP Caraguá"
    };
    return mapa[p.toLowerCase()] || p;
  }

  function limparBadge(valor) {
    const v = String(valor || "").trim().toLowerCase();
    return BADGES_VALIDOS.has(v) ? v : "";
  }

  function lerCreatorKeyLocal() {
    try {
      const v = localStorage.getItem(CHAVE_CREATOR_KEY);
      return v ? String(v).trim().slice(0, 80) : "";
    } catch (e) {
      return "";
    }
  }

  function corIntSegura(valor, fallback) {
    const n = Number(valor);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(0xffffff, Math.round(n)));
  }

  function intParaHex(n) {
    return "#" + corIntSegura(n, 0x1c7ed6).toString(16).padStart(6, "0");
  }

  function corHexSegura(valor, fallback) {
    return typeof valor === "string" && /^#[0-9a-fA-F]{6}$/.test(valor) ? valor : (fallback || "#1f8a9e");
  }

  function formataHora(tsSegundos) {
    const ms = Number.isFinite(Number(tsSegundos)) ? Number(tsSegundos) * 1000 : Date.now();
    const d = new Date(ms);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return hh + ":" + mm;
  }

  function angDif(a, b) {
    return Math.atan2(Math.sin(b - a), Math.cos(b - a));
  }

  function ehMobileInicial() {
    if (MUNDO && MUNDO.toque) return true;
    try {
      return window.matchMedia("(max-width: 760px)").matches || window.matchMedia("(pointer: coarse)").matches;
    } catch (e) {
      return false;
    }
  }

  // ---------- Materiais compartilhados seguros (NUNCA sofrem .dispose()) ----------
  const matsLocais = new Map();
  function matSeguro(cor, extra) {
    const chave = cor + (extra && extra.emissive ? ":" + extra.emissive : "");
    if (!extra && MUNDO && typeof MUNDO.mat === "function") {
      return MUNDO.mat(cor);
    }
    if (!matsLocais.has(chave)) {
      matsLocais.set(
        chave,
        new THREE.MeshStandardMaterial(
          Object.assign({ color: cor, flatShading: true, roughness: 0.85, metalness: 0.08 }, extra || {})
        )
      );
    }
    return matsLocais.get(chave);
  }

  let matHitInvisivel = null;
  function getMatHitInvisivel() {
    if (!matHitInvisivel && typeof THREE !== "undefined") {
      matHitInvisivel = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
    }
    return matHitInvisivel;
  }

  // ---------- Identidade rápida (localStorage.caragua_chat_perfil_v1) ----------
  function carregarExtrasIniciais(salvo) {
    let profissao = limparProfissao(salvo && salvo.profissao);
    let badge = limparBadge(salvo && salvo.badge);

    try {
      const invRaw = localStorage.getItem(CHAVE_INVENTARIO);
      if (invRaw) {
        const inv = JSON.parse(invRaw);
        if (inv && typeof inv === "object") {
          if (!profissao && inv.profissaoAtiva) profissao = limparProfissao(inv.profissaoAtiva);
          if (!badge && inv.badge) badge = limparBadge(inv.badge);
        }
      }
    } catch (e) { /* noop */ }

    const ck = lerCreatorKeyLocal();
    if (ck) {
      badge = "criador";
    } else if (!badge) {
      try {
        const moedas = JSON.parse(localStorage.getItem(CHAVE_MOEDAS) || "[]");
        if (Array.isArray(moedas) && moedas.length >= 10) {
          badge = "coroa";
        }
      } catch (e) { /* noop */ }
    }

    return { profissao, badge };
  }

  function carregarPerfil() {
    let salvo = null;
    try {
      const raw = localStorage.getItem(CHAVE_PERFIL);
      if (raw) salvo = JSON.parse(raw);
    } catch (e) {
      salvo = null;
    }

    const pidValido = salvo && typeof salvo.pid === "string" && /^[a-zA-Z0-9_-]{12,24}$/.test(salvo.pid);
    const tokenValido = salvo && typeof salvo.token === "string" && salvo.token.length >= 16 && /^[a-zA-Z0-9_-]+$/.test(salvo.token);

    const pid = pidValido ? salvo.pid : ("p_" + gerarAleatorio(14));
    const token = tokenValido ? salvo.token : ("sec_" + gerarAleatorio(24));
    const nomePadrao = "Visitante #" + pid.slice(-3);

    const morador = MUNDO && MUNDO.meuMorador ? MUNDO.meuMorador : null;
    const editado = !!(salvo && salvo.editado);

    let nome = nomePadrao;
    let arroba = "";
    let mostrarBarraInicial = true;

    if (editado && salvo.nome) {
      nome = limparNome(salvo.nome, nomePadrao);
      arroba = limparArroba(salvo.arroba || "");
      mostrarBarraInicial = false;
    } else if (morador && morador.nome) {
      nome = limparNome(morador.nome, nomePadrao);
      arroba = limparArroba((morador.insta || morador.instagram || "").replace(/^@/, ""));
      mostrarBarraInicial = false;
    }

    const camisaSalva = salvo && salvo.camisa != null && Number.isFinite(Number(salvo.camisa))
      ? corIntSegura(salvo.camisa, 0x1c7ed6)
      : null;

    if (camisaSalva !== null && MUNDO && typeof MUNDO.setEstiloLocal === "function") {
      MUNDO.setEstiloLocal({ camisa: camisaSalva });
    }

    const extras = carregarExtrasIniciais(salvo);

    const perfilObj = {
      pid,
      token,
      nome,
      arroba,
      camisa: camisaSalva,
      profissao: extras.profissao,
      badge: extras.badge,
      editado,
      verificadoPin: !!(salvo && salvo.verificadoPin)
    };
    salvarPerfil(perfilObj);
    return { perfil: perfilObj, mostrarBarraInicial };
  }

  function salvarPerfil(p) {
    try {
      localStorage.setItem(CHAVE_PERFIL, JSON.stringify({
        pid: p.pid,
        token: p.token,
        nome: p.nome,
        arroba: p.arroba,
        camisa: p.camisa,
        profissao: p.profissao || "",
        badge: p.badge || "",
        editado: !!p.editado,
        verificadoPin: !!p.verificadoPin
      }));
    } catch (e) { /* storage indisponível */ }
  }

  function buscarMoradorCanonica(arroba) {
    const limpo = limparArroba(arroba).toLowerCase();
    if (!limpo || !Array.isArray(window.JOGO_DADOS)) return null;
    for (let i = 0; i < window.JOGO_DADOS.length; i++) {
      const d = window.JOGO_DADOS[i];
      if (!d || d.oculto || !d.h) continue;
      if (limparArroba(d.h).toLowerCase() === limpo) {
        const bruto = String(d.t || "").trim();
        const primeiroNome = limparNome(bruto.split(/[,/\-–—]/)[0], "@" + limpo);
        return { h: limparArroba(d.h), t: bruto, nomeSugerido: primeiroNome, k: d.k || "casa" };
      }
    }
    return null;
  }

  function lerMoedasIdsLocais() {
    try {
      const raw = localStorage.getItem(CHAVE_MOEDAS);
      if (!raw) return [];
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.filter(n => Number.isInteger(n) && n >= 0 && n < 20);
      if (p && typeof p === "object") {
        const arr = p.ids || p.coletadas || p.moedas;
        if (Array.isArray(arr)) return arr.filter(n => Number.isInteger(n) && n >= 0 && n < 20);
      }
    } catch (e) {}
    return [];
  }

  const init = carregarPerfil();
  const perfil = init.perfil;

  // Estado sincronizado de gameplay/interação local
  const estadoInteracao = {
    jump: 0,
    emote: "",
    car_type: "",
    ride_of: "",
    room: "",
    profissao: perfil.profissao || "",
    badge: perfil.badge || ""
  };

  const bolaListeners = new Set();
  const policiaListeners = new Set();
  const somMensagemListeners = new Set();
  let ultimoBallServidor = null;
  let ultimoPoliciaServidor = null;
  let ultimoWalletServidor = null;
  const criadoresAnunciados = new Set();

  function obterPvpInfoDe(pidAlvo) {
    if (!ultimoPoliciaServidor || ultimoPoliciaServidor.status !== "active") return null;
    const pvpMap = ultimoPoliciaServidor.pvp;
    if (!pvpMap || typeof pvpMap !== "object") return null;
    const entry = pvpMap[pidAlvo];
    if (!entry || typeof entry !== "object") return null;
    const nowTs = Math.floor(Date.now() / 1000);
    return {
      team: entry.team === "ladrao" ? "ladrao" : "policia",
      hp: Math.max(0, Math.min(100, Number(entry.hp) || 0)),
      lives: Math.max(0, Number(entry.lives) || 0),
      weapon: entry.weapon || "base",
      jailed: (Number(entry.jailed_until) || 0) > nowTs || (Number(entry.lives) || 0) <= 0
    };
  }

  function chavePoliciaPlaca(info) {
    if (!info) return "";
    return info.team + ":" + info.hp + ":" + info.lives + ":" + (info.jailed ? 1 : 0);
  }

  // Pistolinha de água voxel presa na mão direita (pivô B1)
  function criarPistolinhaVoxel(weapon, team) {
    const g = new THREE.Group();
    g.name = "pistolinhaAguaVoxel";
    const wTipo = weapon === "super" ? "super" : (weapon === "dupla" ? "dupla" : "base");
    const corCorpo = wTipo === "super" ? 0xfacc15 : (wTipo === "dupla" ? 0x22d3ee : (team === "ladrao" ? 0xf97316 : 0x38bdf8));
    const corDetalhe = wTipo === "super" ? 0x06b6d4 : (wTipo === "dupla" ? 0x1d4ed8 : 0xfbbf24);
    const corTanque = wTipo === "super" ? 0x38bdf8 : (wTipo === "dupla" ? 0xe0f2fe : 0x7dd3fc);

    const add = (w, h, d, cor, x, y, z, em) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        matSeguro(cor, em ? { emissive: em } : undefined)
      );
      m.position.set(x, y, z);
      g.add(m);
      return m;
    };

    // Cabo vertical na mão
    add(0.11, 0.22, 0.12, 0x1e293b, 0, -0.05, 0.02);
    // Corpo principal e cano apontando para +Z local do boneco
    add(0.13, 0.14, wTipo === "super" ? 0.56 : 0.42, corCorpo, 0, 0.06, 0.18, wTipo === "super" ? 0x443300 : 0);
    // Reservatório de água superior (transparente/brilhante)
    if (wTipo === "dupla") {
      add(0.08, 0.14, 0.22, corTanque, -0.06, 0.17, 0.16, 0x083344);
      add(0.08, 0.14, 0.22, corTanque, 0.06, 0.17, 0.16, 0x083344);
    } else {
      add(0.12, 0.14, 0.22, corTanque, 0, 0.17, 0.14, 0x083344);
    }
    // Bico laranja/dourado na ponta
    add(0.09, 0.09, 0.10, corDetalhe, 0, 0.06, wTipo === "super" ? 0.48 : 0.40, 0x221100);
    g.userData.pistolaKey = wTipo + "|" + (team || "policia");
    return g;
  }

  function sincronizarPistolinhaNoBoneco(vox, pvpInfo) {
    if (!TEM_3D || !vox || !vox.userData || !vox.userData.pivos) return;
    const b1 = vox.userData.pivos.B1;
    if (!b1) return;
    const precisa = !!(pvpInfo && !pvpInfo.jailed && pvpInfo.lives > 0);
    const keyAlvo = precisa ? ((pvpInfo.weapon || "base") + "|" + (pvpInfo.team || "policia")) : "";
    let atual = b1.getObjectByName("pistolinhaAguaVoxel");

    if (!precisa) {
      if (atual) {
        b1.remove(atual);
        descartarGeometriasGrupo(atual);
      }
      return;
    }
    if (atual && atual.userData.pistolaKey === keyAlvo) {
      atual.visible = true;
      return;
    }
    if (atual) {
      b1.remove(atual);
      descartarGeometriasGrupo(atual);
    }
    const nova = criarPistolinhaVoxel(pvpInfo.weapon, pvpInfo.team);
    nova.position.set(0, -0.54, 0.04);
    b1.add(nova);
  }

  // ---------- Modelos Voxel 3D: Coroa Dourada & Veículos ----------
  function criarCoroaVoxel() {
    const g = new THREE.Group();
    g.name = "coroaDouradaVoxel";
    const matOuro = matSeguro(0xfbbf24, { emissive: 0x3b2500, metalness: 0.25, roughness: 0.4 });
    const matBorda = matSeguro(0xd97706, { emissive: 0x261700, metalness: 0.2, roughness: 0.5 });
    const matRubi = matSeguro(0xef4444, { emissive: 0x300505 });
    const matSafira = matSeguro(0x38bdf8, { emissive: 0x052538 });

    const addBox = (w, h, d, m, x, y, z) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      g.add(mesh);
      return mesh;
    };

    // Base da coroa no topo da cabeça de bonecoMalhas (y ~ 2.68)
    const yBase = 2.68;
    addBox(0.88, 0.08, 0.82, matBorda, 0, yBase + 0.04, 0);
    addBox(0.86, 0.16, 0.80, matOuro, 0, yBase + 0.14, 0);

    // Pontas voxelizadas da coroa
    const pontas = [
      [-0.35, 0.32], [0, 0.33], [0.35, 0.32],
      [-0.35, -0.32], [0, -0.33], [0.35, -0.32],
      [-0.36, 0], [0.36, 0]
    ];
    pontas.forEach(([px, pz], idx) => {
      const hPonta = idx === 1 ? 0.24 : 0.18;
      addBox(0.15, hPonta, 0.14, matOuro, px, yBase + 0.22 + hPonta / 2, pz);
    });

    // Joias frontais (+Z em bonecoMalhas é o rosto)
    addBox(0.11, 0.11, 0.06, matRubi, 0, yBase + 0.15, 0.41);
    addBox(0.08, 0.08, 0.05, matSafira, -0.24, yBase + 0.15, 0.41);
    addBox(0.08, 0.08, 0.05, matSafira, 0.24, yBase + 0.15, 0.41);

    return g;
  }

  // Metadados de assento por tipo de veículo (frente do veículo = -Z no grupo do jogador)
  const ASSENTO_CARRO = {
    moto: { driver: [0, 0.50, 0.08], carona: [0, 0.58, 0.68], alturaPlaca: 0.55 },
    bugue: { driver: [-0.42, 0.52, 0.16], carona: [0.42, 0.52, 0.16], alturaPlaca: 0.65 },
    esportivo: { driver: [-0.45, 0.38, 0.18], carona: [0.45, 0.38, 0.18], alturaPlaca: 0.45 },
    caminhonete: { driver: [-0.48, 0.66, -0.06], carona: [0.48, 0.66, -0.06], alturaPlaca: 0.78 },
    jetski: { driver: [0, 0.48, 0.06], carona: [0, 0.56, 0.66], alturaPlaca: 0.58 },
    viatura: { driver: [-0.45, 0.56, 0.08], carona: [0.45, 0.56, 0.08], alturaPlaca: 0.92 }
  };

  function criarVeiculoVoxel(tipo, corCustom) {
    const t = limparCarType(tipo) || "bugue";
    const g = new THREE.Group();
    g.name = "veiculoVoxel_" + t;
    const rodas = [];

    const add = (geo, cor, x, y, z, rx = 0, ry = 0, rz = 0, extraMat = null) => {
      const m = new THREE.Mesh(geo, matSeguro(cor, extraMat));
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
      return m;
    };

    const addRoda = (x, y, z, r, w) => {
      const piv = new THREE.Group();
      piv.position.set(x, y, z);
      const pneu = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 10).rotateZ(Math.PI / 2), matSeguro(0x1d1d1d));
      pneu.castShadow = true;
      const calota = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.52, r * 0.52, w + 0.04, 8).rotateZ(Math.PI / 2), matSeguro(0xdee2e6));
      piv.add(pneu, calota);
      g.add(piv);
      rodas.push(piv);
      return piv;
    };

    if (t === "moto") {
      const cor = corCustom != null ? corCustom : 0xe03131;
      addRoda(0, 0.35, -0.78, 0.35, 0.18);
      addRoda(0, 0.35, 0.78, 0.35, 0.20);
      add(new THREE.BoxGeometry(0.32, 0.38, 0.65), 0x343a40, 0, 0.54, 0.05);
      add(new THREE.BoxGeometry(0.40, 0.30, 0.62), cor, 0, 0.88, -0.22);
      add(new THREE.BoxGeometry(0.36, 0.14, 0.88), 0x212529, 0, 0.92, 0.36);
      // Garfo e guidão na frente (-Z)
      add(new THREE.BoxGeometry(0.08, 0.72, 0.08), 0xced4da, -0.11, 0.74, -0.62, 0.32, 0, 0);
      add(new THREE.BoxGeometry(0.08, 0.72, 0.08), 0xced4da, 0.11, 0.74, -0.62, 0.32, 0, 0);
      add(new THREE.BoxGeometry(0.76, 0.07, 0.07), 0x1d1d1d, 0, 1.18, -0.50);
      add(new THREE.BoxGeometry(0.24, 0.20, 0.18), cor, 0, 1.04, -0.68);
      add(new THREE.BoxGeometry(0.18, 0.14, 0.06), 0xfff3bf, 0, 1.04, -0.78, 0, 0, 0, { emissive: 0x554400 });
      add(new THREE.BoxGeometry(0.16, 0.10, 0.06), 0xe03131, 0, 0.92, 0.84, 0, 0, 0, { emissive: 0x440000 });
      add(new THREE.CylinderGeometry(0.06, 0.07, 0.75, 7).rotateX(Math.PI / 2), 0xadb5bd, 0.22, 0.48, 0.52);
    } else if (t === "esportivo") {
      const cor = corCustom != null ? corCustom : 0xe03131;
      [[-1.02, -1.45], [1.02, -1.45], [-1.02, 1.45], [1.02, 1.45]].forEach(([x, z]) => addRoda(x, 0.40, z, 0.40, 0.34));
      // Chassi baixo aerodinâmico (-Z frente, +Z traseira)
      add(new THREE.BoxGeometry(2.08, 0.62, 4.6), cor, 0, 0.66, 0);
      add(new THREE.BoxGeometry(1.96, 0.28, 1.55), cor, 0, 1.08, -1.35);
      add(new THREE.BoxGeometry(1.96, 0.30, 1.20), cor, 0, 1.10, 1.55);
      // Faixa central racing
      add(new THREE.BoxGeometry(0.32, 0.04, 4.56), 0xfffaf0, 0, 1.24, 0.1);
      // Para-brisa inclinado
      add(new THREE.BoxGeometry(1.78, 0.68, 0.09), 0x2b3a44, 0, 1.45, -0.52, -0.62, 0, 0);
      // Bancos duplos
      [-0.45, 0.45].forEach(x => add(new THREE.BoxGeometry(0.58, 0.68, 0.52), 0x212529, x, 1.18, 0.35));
      // Aerofólio traseiro
      add(new THREE.BoxGeometry(1.98, 0.08, 0.36), 0x1d1d1d, 0, 1.52, 2.08);
      [-0.72, 0.72].forEach(x => add(new THREE.BoxGeometry(0.08, 0.30, 0.22), 0x1d1d1d, x, 1.35, 2.05));
      // Faróis e lanternas
      [-0.68, 0.68].forEach(x => {
        add(new THREE.BoxGeometry(0.42, 0.18, 0.08), 0xfff3bf, x, 0.82, -2.31, 0, 0, 0, { emissive: 0x554400 });
        add(new THREE.BoxGeometry(0.44, 0.18, 0.08), 0xff2b2b, x, 0.86, 2.31, 0, 0, 0, { emissive: 0x440000 });
      });
    } else if (t === "caminhonete") {
      const cor = corCustom != null ? corCustom : 0x1c7ed6;
      [[-1.12, -1.55], [1.12, -1.55], [-1.12, 1.55], [1.12, 1.55]].forEach(([x, z]) => addRoda(x, 0.54, z, 0.54, 0.42));
      add(new THREE.BoxGeometry(2.22, 0.72, 4.9), cor, 0, 0.98, 0);
      add(new THREE.BoxGeometry(2.14, 0.44, 1.45), cor, 0, 1.52, -1.65);
      // Para-brisa e santantônio
      add(new THREE.BoxGeometry(2.0, 0.78, 0.10), 0x2b3a44, 0, 1.92, -0.82, -0.35, 0, 0);
      [-0.96, 0.96].forEach(x => add(new THREE.BoxGeometry(0.10, 1.05, 0.10), 0x212529, x, 1.86, 0.58));
      add(new THREE.BoxGeometry(2.02, 0.10, 0.12), 0x212529, 0, 2.38, 0.58);
      // Milhas no teto
      [-0.55, 0, 0.55].forEach(x => add(new THREE.BoxGeometry(0.24, 0.16, 0.12), 0xfbbf24, x, 2.50, 0.56, 0, 0, 0, { emissive: 0x443000 }));
      // Caçamba aberta atrás (+Z)
      add(new THREE.BoxGeometry(1.92, 0.12, 1.85), 0x343a40, 0, 1.36, 1.42);
      [-1.02, 1.02].forEach(x => add(new THREE.BoxGeometry(0.14, 0.48, 1.92), cor, x, 1.56, 1.44));
      add(new THREE.BoxGeometry(2.18, 0.48, 0.14), cor, 0, 1.56, 2.38);
      // Bancos
      [-0.48, 0.48].forEach(x => add(new THREE.BoxGeometry(0.60, 0.72, 0.52), 0x212529, x, 1.48, 0.12));
      // Quebra-mato e faróis (-Z)
      add(new THREE.BoxGeometry(2.28, 0.28, 0.22), 0x212529, 0, 0.78, -2.50);
      [-0.76, 0.76].forEach(x => {
        add(new THREE.BoxGeometry(0.40, 0.24, 0.08), 0xfff3bf, x, 1.22, -2.46, 0, 0, 0, { emissive: 0x554400 });
        add(new THREE.BoxGeometry(0.32, 0.30, 0.08), 0xe03131, x, 1.24, 2.46, 0, 0, 0, { emissive: 0x440000 });
      });
    } else if (t === "jetski") {
      const cor = corCustom != null ? corCustom : 0x22b8cf;
      add(new THREE.BoxGeometry(1.18, 0.34, 2.72), 0x1864ab, 0, 0.24, 0.08);
      add(new THREE.BoxGeometry(1.24, 0.14, 2.24), 0xffffff, 0, 0.42, 0.06);
      add(new THREE.BoxGeometry(0.98, 0.34, 2.48), cor, 0, 0.56, 0.06);
      add(new THREE.BoxGeometry(0.84, 0.28, 0.86), cor, 0, 0.46, -1.32, 0.28, 0, 0);
      add(new THREE.BoxGeometry(0.46, 0.20, 0.44), 0xfcc419, 0, 0.38, -1.72, 0.34, 0, 0);
      [-0.56, 0.56].forEach(x => add(new THREE.BoxGeometry(0.14, 0.16, 1.95), 0xfcc419, x, 0.46, 0.12));
      add(new THREE.BoxGeometry(0.48, 0.22, 1.32), 0x212529, 0, 0.80, 0.36);
      add(new THREE.BoxGeometry(0.24, 0.52, 0.28), 0x343a40, 0, 0.86, -0.58, 0.35, 0, 0);
      add(new THREE.BoxGeometry(0.54, 0.24, 0.08), 0x2b3a44, 0, 0.88, -0.78, -0.55, 0, 0);
      add(new THREE.BoxGeometry(0.84, 0.08, 0.09), 0x1d1d1d, 0, 1.12, -0.46);
      [-0.40, 0.40].forEach(x => add(new THREE.BoxGeometry(0.14, 0.10, 0.11), 0xfcc419, x, 1.12, -0.46));
      add(new THREE.BoxGeometry(0.26, 0.12, 0.08), 0xfff3bf, 0, 0.62, -1.62, 0, 0, 0, { emissive: 0x554400 });
      add(new THREE.BoxGeometry(0.32, 0.22, 0.28), 0x343a40, 0, 0.28, 1.48);
      add(new THREE.BoxGeometry(0.36, 0.10, 0.06), 0xe03131, 0, 0.68, 1.32, 0, 0, 0, { emissive: 0x440000 });
    } else if (t === "viatura") {
      // Viatura da Polícia Pixel (preto/branco com giroflex vermelho e azul piscante + farol)
      [[-1.06, -1.42], [1.06, -1.42], [-1.06, 1.42], [1.06, 1.42]].forEach(([x, z]) => addRoda(x, 0.44, z, 0.44, 0.34));
      // Chassi preto inferior e capô/teto/portas brancas policiais
      add(new THREE.BoxGeometry(2.14, 0.56, 4.72), 0x111827, 0, 0.72, 0);
      add(new THREE.BoxGeometry(2.16, 0.44, 1.65), 0xf8fafc, 0, 0.86, 0.10);
      add(new THREE.BoxGeometry(1.94, 0.58, 2.05), 0xf8fafc, 0, 1.44, 0.12);
      // Faixa dourada nas portas
      [-1.09, 1.09].forEach(x => add(new THREE.BoxGeometry(0.04, 0.14, 1.50), 0xfacc15, x, 0.88, 0.10));
      // Para-brisa e vidro traseiro
      add(new THREE.BoxGeometry(1.78, 0.50, 0.10), 0x2b3a44, 0, 1.42, -0.92, -0.38, 0, 0);
      add(new THREE.BoxGeometry(1.76, 0.44, 0.10), 0x2b3a44, 0, 1.42, 1.15, 0.35, 0, 0);
      // Quebra-mato policial frontal (-Z)
      add(new THREE.BoxGeometry(1.88, 0.32, 0.18), 0x343a40, 0, 0.66, -2.44);
      [-0.62, 0.62].forEach(x => add(new THREE.BoxGeometry(0.14, 0.54, 0.22), 0x1d1d1d, x, 0.78, -2.46));
      // Faróis brilhantes + lanternas traseiras
      [-0.72, 0.72].forEach(x => {
        add(new THREE.BoxGeometry(0.42, 0.18, 0.08), 0xfff9db, x, 0.76, -2.37, 0, 0, 0, { emissive: 0xffe066 });
        add(new THREE.BoxGeometry(0.42, 0.18, 0.08), 0xff2b2b, x, 0.80, 2.37, 0, 0, 0, { emissive: 0x880000 });
      });
      // Barra de giroflex no teto
      add(new THREE.BoxGeometry(1.48, 0.10, 0.34), 0xdee2e6, 0, 1.78, -0.10);
      const giroRed = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.18, 0.32),
        new THREE.MeshBasicMaterial({ color: 0xff2b2b })
      );
      giroRed.position.set(-0.46, 1.88, -0.10);
      const giroBlue = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.18, 0.32),
        new THREE.MeshBasicMaterial({ color: 0x228be6 })
      );
      giroBlue.position.set(0.46, 1.88, -0.10);
      g.add(giroRed, giroBlue);
      const giroLuz = new THREE.PointLight(0xff2b2b, 2.0, 26, 1.5);
      giroLuz.position.set(0, 2.35, -0.10);
      g.add(giroLuz);
      g.userData.giroRed = giroRed;
      g.userData.giroBlue = giroBlue;
      g.userData.giroLuz = giroLuz;
    } else {
      // bugue de praia
      const cor = corCustom != null ? corCustom : 0xff922b;
      [[-1.08, -1.18], [1.08, -1.18], [-1.12, 1.18], [1.12, 1.18]].forEach(([x, z], i) => addRoda(x, i < 2 ? 0.48 : 0.56, z, i < 2 ? 0.48 : 0.56, 0.44));
      add(new THREE.BoxGeometry(1.88, 0.54, 3.25), cor, 0, 0.90, 0);
      add(new THREE.BoxGeometry(1.48, 0.44, 0.98), cor, 0, 1.04, -1.68, 0.28, 0, 0);
      [-0.42, 0.42].forEach(x => add(new THREE.BoxGeometry(0.56, 0.76, 0.54), 0x212529, x, 1.42, 0.34));
      // Gaiola tubular (rollcage)
      [-0.84, 0.84].forEach(x => add(new THREE.CylinderGeometry(0.06, 0.06, 1.45, 6), 0x212529, x, 1.86, 0.72));
      add(new THREE.CylinderGeometry(0.06, 0.06, 1.76, 6).rotateZ(Math.PI / 2), 0x212529, 0, 2.58, 0.72);
      add(new THREE.BoxGeometry(1.62, 0.52, 0.08), 0x2b3a44, 0, 1.48, -0.58, -0.55, 0, 0);
      // Estepe traseiro (+Z) e faróis redondos (-Z)
      const estepe = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.28, 10).rotateX(Math.PI / 2), matSeguro(0x1d1d1d));
      estepe.position.set(0, 1.24, 1.76);
      g.add(estepe);
      [-0.50, 0.50].forEach(x => {
        add(new THREE.CylinderGeometry(0.18, 0.18, 0.14, 10).rotateX(Math.PI / 2), 0xfff3bf, x, 1.28, -2.12, 0, 0, 0, { emissive: 0x554400 });
        add(new THREE.BoxGeometry(0.26, 0.18, 0.08), 0xe03131, x, 1.08, 1.66, 0, 0, 0, { emissive: 0x440000 });
      });
    }

    g.userData.rodas = rodas;
    g.userData.tipo = t;
    g.userData.assento = ASSENTO_CARRO[t] || ASSENTO_CARRO.bugue;
    return g;
  }

  window.CARAGUA_CRIAR_VEICULO = criarVeiculoVoxel;
  window.CARAGUA_ASSENTO_CARRO = ASSENTO_CARRO;

  // ---------- Sprites 3D (placas, emojis e balões HQ) ----------
  function cortaTexto(ctx, txt, maxW) {
    if (ctx.measureText(txt).width <= maxW) return txt;
    let t = txt;
    while (t.length > 1 && ctx.measureText(t + "…").width > maxW) {
      t = t.slice(0, -1);
    }
    return t.trimEnd() + "…";
  }

  function quebrarDuasLinhas(ctx, texto, maxW) {
    const palavras = String(texto || "").trim().split(/\s+/).filter(Boolean);
    if (!palavras.length) return [""];

    const linhas = [];
    let atual = "";

    for (let i = 0; i < palavras.length; i++) {
      const pal = palavras[i];
      const teste = atual ? (atual + " " + pal) : pal;
      if (ctx.measureText(teste).width <= maxW) {
        atual = teste;
      } else if (!atual) {
        linhas.push(cortaTexto(ctx, pal, maxW));
        if (linhas.length === 2) return linhas;
      } else {
        linhas.push(atual);
        if (linhas.length === 2) {
          linhas[1] = cortaTexto(ctx, linhas[1] + " " + palavras.slice(i).join(" "), maxW);
          return linhas;
        }
        atual = ctx.measureText(pal).width <= maxW ? pal : cortaTexto(ctx, pal, maxW);
      }
    }
    if (atual) {
      if (linhas.length < 2) linhas.push(atual);
      else linhas[1] = cortaTexto(ctx, linhas[1] + " " + atual, maxW);
    }
    return linhas.slice(0, 2);
  }

  function criarSprite(w, h, escalaMundo) {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d");
    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    tex.anisotropy = 4;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(w * escalaMundo, h * escalaMundo, 1);
    return { cv, ctx, tex, mat, sp };
  }

  function desenharSpriteEmoji(alvo, emoji) {
    const { ctx, cv, tex } = alvo;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (emoji) {
      ctx.font = '72px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, cv.width / 2, cv.height / 2 + 4);
    }
    tex.needsUpdate = true;
  }

  function desenharPlacaJogador(alvo, nome, arroba, opcoes) {
    const { ctx, cv, tex } = alvo;
    const discreto = !!(opcoes && opcoes.discreto);
    const mostrarPonto = !!(opcoes && opcoes.pontoVerde);
    const badge = limparBadge(opcoes && opcoes.badge);
    const profTxt = rotuloProfissao(opcoes && opcoes.profissao);
    const ehCriador = badge === "criador";
    const ehXerife = badge === "xerife";
    const ehCoroa = badge === "coroa";
    const ehVip = badge === "vip";

    ctx.clearRect(0, 0, cv.width, cv.height);

    const fonteRibbon = '800 17px "Nunito Sans", "Segoe UI", sans-serif';
    const fonte1 = discreto
      ? '800 25px "Nunito Sans", "Segoe UI", sans-serif'
      : '800 26px "Nunito Sans", "Segoe UI", sans-serif';
    const fonte2 = '800 18px "Nunito Sans", "Segoe UI", sans-serif';

    let lTopo = "";
    let wTopo = 0;
    if (ehCriador) {
      ctx.font = fonteRibbon;
      lTopo = "👑 CRIADOR @caraguapixel";
      wTopo = ctx.measureText(lTopo).width + 24;
    } else if (ehXerife) {
      ctx.font = fonteRibbon;
      lTopo = "🚓 XERIFE DA NOITE";
      wTopo = ctx.measureText(lTopo).width + 24;
    }

    const prefixoNome = ehCoroa ? "👑 " : (ehVip ? "💎 " : (ehXerife ? "🚓 " : ""));
    ctx.font = fonte1;
    const l1 = cortaTexto(ctx, prefixoNome + (nome || "Visitante"), 430);
    const w1 = ctx.measureText(l1).width + (mostrarPonto ? 26 : 0);

    const partesSub = [];
    if (arroba && !ehCriador) partesSub.push("@" + arroba);
    else if (arroba && ehCriador && arroba.toLowerCase() !== "caraguapixel") partesSub.push("@" + arroba);
    if (profTxt) partesSub.push(profTxt);

    let l2 = "";
    let w2 = 0;
    if (partesSub.length) {
      ctx.font = fonte2;
      l2 = cortaTexto(ctx, partesSub.join(" · "), 440);
      w2 = ctx.measureText(l2).width;
    }

    const polInfo = opcoes && opcoes.policiaInfo ? opcoes.policiaInfo : null;
    const polH = polInfo ? 34 : 0;
    const polW = polInfo ? 280 : 0;

    const padX = discreto ? 32 : 38;
    const W = Math.min(cv.width - 16, Math.max(132, Math.max(wTopo, w1, w2, polW) + padX));
    const H = (lTopo ? 28 : 0) + (l2 ? 72 : 46) + polH;
    const x0 = Math.floor((cv.width - W) / 2);
    const y0 = Math.floor((cv.height - H) / 2);

    // Sombra pixelada
    ctx.fillStyle = "rgba(29, 42, 51, 0.92)";
    ctx.fillRect(x0 + 4, y0 + 4, W, H);

    // Fundo da placa
    if (ehCriador) {
      ctx.fillStyle = "#fffbeb";
    } else if (ehXerife) {
      ctx.fillStyle = "#eff6ff";
    } else {
      ctx.fillStyle = discreto ? "rgba(255, 250, 240, 0.94)" : "#fffaf0";
    }
    ctx.fillRect(x0, y0, W, H);

    // Faixa superior dourada do Criador ou azul-real do Xerife
    let offsetBodyY = y0;
    if (lTopo) {
      ctx.fillStyle = ehXerife ? "#1d4ed8" : "#fbbf24";
      ctx.fillRect(x0, y0, W, 28);
      ctx.fillStyle = "#1d2a33";
      ctx.fillRect(x0, y0 + 27, W, 2);
      ctx.font = fonteRibbon;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = ehXerife ? "#fde047" : "#1d2a33";
      ctx.fillText(lTopo, cv.width / 2, y0 + 15);
      offsetBodyY += 28;
    }

    // Borda externa
    ctx.lineWidth = 4;
    ctx.strokeStyle = polInfo
      ? (polInfo.team === "ladrao" ? "#ea580c" : "#1d4ed8")
      : (ehCriador ? "#d97706" : (ehXerife ? "#1d4ed8" : (ehCoroa ? "#eab308" : "#1d2a33")));
    ctx.strokeRect(x0 + 2, y0 + 2, W - 4, H - 4);

    // Nome principal
    ctx.textBaseline = "middle";
    ctx.font = fonte1;
    const bodyH = H - (lTopo ? 28 : 0) - polH;
    const yNome = offsetBodyY + (l2 ? 25 : bodyH / 2 + 1);

    if (mostrarPonto) {
      const textW = ctx.measureText(l1).width;
      const totalW = 20 + textW;
      const startX = cv.width / 2 - totalW / 2;
      ctx.beginPath();
      ctx.arc(startX + 7, yNome - 1, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#2f9e44";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1d2a33";
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#1d2a33";
      ctx.fillText(l1, startX + 20, yNome);
    } else {
      ctx.textAlign = "center";
      ctx.fillStyle = "#1d2a33";
      ctx.fillText(l1, cv.width / 2, yNome);
    }

    // Linha 2 (@arroba e/ou profissão)
    if (l2) {
      ctx.textAlign = "center";
      ctx.font = fonte2;
      ctx.fillStyle = ehCriador ? "#b45309" : "#1f8a9e";
      ctx.fillText(l2, cv.width / 2, offsetBodyY + 52);
    }

    // Faixa de time, barra de HP e vidas no evento Polícia x Ladrão
    if (polInfo) {
      const py = y0 + H - 31;
      const innerW = W - 20;
      const bx0 = x0 + 10;
      ctx.fillStyle = polInfo.team === "ladrao" ? "#7c2d12" : "#1e3a8a";
      ctx.fillRect(x0 + 4, py - 3, W - 8, 30);

      // Etiqueta do time + vidas
      ctx.font = '800 13px "Nunito Sans", "Segoe UI", sans-serif';
      ctx.textAlign = "left";
      ctx.fillStyle = "#fffaf0";
      const lblTime = polInfo.jailed
        ? "🔒 PRESO"
        : (polInfo.team === "ladrao" ? "🕶️ LADRÃO" : "👮 POLÍCIA");
      ctx.fillText(lblTime, bx0 + 2, py + 7);

      ctx.textAlign = "right";
      ctx.fillStyle = "#fde047";
      ctx.fillText("❤️" + polInfo.lives + " · " + polInfo.hp + "HP", bx0 + innerW - 2, py + 7);

      // Barra de vida
      const hpFrac = Math.max(0, Math.min(1, polInfo.hp / 100));
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(bx0, py + 15, innerW, 8);
      ctx.fillStyle = hpFrac > 0.55 ? "#22c55e" : (hpFrac > 0.25 ? "#f59e0b" : "#ef4444");
      ctx.fillRect(bx0 + 1, py + 16, Math.max(0, Math.floor((innerW - 2) * hpFrac)), 6);
    }

    tex.needsUpdate = true;
  }

  function desenharBalaoHQ(alvo, texto) {
    const { ctx, cv, tex } = alvo;
    ctx.clearRect(0, 0, cv.width, cv.height);

    ctx.font = '800 24px "Nunito Sans", "Segoe UI", sans-serif';
    const linhas = quebrarDuasLinhas(ctx, texto, cv.width - 76);
    const maxLW = Math.max(...linhas.map(l => ctx.measureText(l).width), 80);

    const W = Math.min(cv.width - 20, Math.max(150, maxLW + 52));
    const H = linhas.length > 1 ? 94 : 62;
    const x0 = (cv.width - W) / 2;
    const y0 = cv.height - 26 - H;
    const cx = cv.width / 2;

    ctx.fillStyle = "#1d2a33";
    ctx.fillRect(x0 + 5, y0 + 5, W, H);

    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(x0, y0, W, H);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1d2a33";
    ctx.strokeRect(x0 + 2.5, y0 + 2.5, W - 5, H - 5);

    ctx.beginPath();
    ctx.moveTo(cx - 14, y0 + H - 3);
    ctx.lineTo(cx, y0 + H + 19);
    ctx.lineTo(cx + 14, y0 + H - 3);
    ctx.closePath();
    ctx.fillStyle = "#fffaf0";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - 14, y0 + H - 1);
    ctx.lineTo(cx, y0 + H + 19);
    ctx.lineTo(cx + 14, y0 + H - 1);
    ctx.lineWidth = 5;
    ctx.lineJoin = "miter";
    ctx.strokeStyle = "#1d2a33";
    ctx.stroke();

    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(cx - 11, y0 + H - 6, 22, 7);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#1d2a33";
    ctx.font = '800 24px "Nunito Sans", "Segoe UI", sans-serif';
    if (linhas.length === 1) {
      ctx.fillText(linhas[0], cx, y0 + H / 2 + 1);
    } else {
      ctx.fillText(linhas[0], cx, y0 + 30);
      ctx.fillText(linhas[1], cx, y0 + 64);
    }

    tex.needsUpdate = true;
  }

  // ---------- Sprites e Coroa do jogador local (MUNDO.jog) ----------
  let localPlaca = null;
  let localBalao = null;
  let localEmoteSp = null;
  let localEmoteUltimo = "";
  let localBalaoExpira = 0;
  let coroaLocal = null;

  function obterJogVoxLocal() {
    if (!TEM_3D || !MUNDO.jog) return null;
    for (let i = 0; i < MUNDO.jog.children.length; i++) {
      const ch = MUNDO.jog.children[i];
      if (ch && ch.userData && ch.userData.pivos) return ch;
    }
    return null;
  }

  function sincronizarCoroaLocal() {
    if (!TEM_3D) return;
    const precisaCoroa = estadoInteracao.badge === "criador" || estadoInteracao.badge === "coroa";
    const voxLocal = obterJogVoxLocal();
    if (!voxLocal) return;
    if (precisaCoroa) {
      if (!coroaLocal) coroaLocal = criarCoroaVoxel();
      if (coroaLocal.parent !== voxLocal) {
        voxLocal.add(coroaLocal);
      }
      coroaLocal.visible = true;
    } else if (coroaLocal) {
      coroaLocal.visible = false;
    }
  }

  if (TEM_3D) {
    // Placa local maior (scale 0.0112 conforme Contrato 3)
    localPlaca = criarSprite(512, 168, 0.0112);
    localPlaca.sp.position.set(0, 3.42, 0);
    desenharPlacaJogador(localPlaca, perfil.nome, perfil.arroba, {
      discreto: true,
      pontoVerde: false,
      badge: estadoInteracao.badge,
      profissao: estadoInteracao.profissao,
      policiaInfo: obterPvpInfoDe(perfil.pid)
    });
    MUNDO.jog.add(localPlaca.sp);

    localBalao = criarSprite(560, 160, 0.0098);
    localBalao.sp.position.set(0, 4.75, 0);
    localBalao.sp.visible = false;
    MUNDO.jog.add(localBalao.sp);

    localEmoteSp = criarSprite(128, 128, 0.0095);
    localEmoteSp.sp.position.set(0, 4.25, 0);
    localEmoteSp.sp.visible = false;
    MUNDO.jog.add(localEmoteSp.sp);

    sincronizarCoroaLocal();
    sincronizarPistolinhaNoBoneco(obterJogVoxLocal(), obterPvpInfoDe(perfil.pid));
  }

  function atualizarPlacaLocal() {
    const polInfo = obterPvpInfoDe(perfil.pid);
    if (localPlaca) {
      desenharPlacaJogador(localPlaca, perfil.nome, perfil.arroba, {
        discreto: true,
        pontoVerde: false,
        badge: estadoInteracao.badge,
        profissao: estadoInteracao.profissao,
        policiaInfo: polInfo
      });
    }
    sincronizarCoroaLocal();
    sincronizarPistolinhaNoBoneco(obterJogVoxLocal(), polInfo);
  }

  function mostrarBalaoLocal(texto) {
    if (!localBalao || !texto) return;
    desenharBalaoHQ(localBalao, texto);
    localBalao.sp.visible = true;
    localBalaoExpira = performance.now() + DURACAO_BALAO_MS;
  }

  // ---------- Jogadores remotos 3D ----------
  const remotos = new Map();
  window.CARAGUA_OUTROS_MAPA = [];

  function estiloDeJogador(p) {
    return {
      fem: !!Number(p && p.fem),
      pele: corIntSegura(p && p.pele, 0xf2c29b),
      cabelo: corIntSegura(p && p.cabelo, 0x5c3317),
      camisa: corIntSegura(p && p.camisa, 0x1c7ed6),
      calca: corIntSegura(p && p.calca, 0x2b3a55),
      sapato: corIntSegura(p && p.sapato, 0x1d1d1d)
    };
  }

  function assinaturaEstilo(est) {
    return (est.fem ? 1 : 0) + "|" + est.pele + "|" + est.cabelo + "|" + est.camisa + "|" + est.calca + "|" + est.sapato;
  }

  function descartarGeometriasGrupo(obj) {
    if (!obj || typeof obj.traverse !== "function") return;
    obj.traverse(ch => {
      if (ch.isMesh && ch.geometry && typeof ch.geometry.dispose === "function") {
        ch.geometry.dispose();
      }
      // Nunca descartar ch.material porque bonecoMalhas e materiais seguros são compartilhados globalmente
    });
  }

  function atualizarMinimapaOutros() {
    const lista = [];
    const minhaSala = estadoInteracao.room || "";
    remotos.forEach(r => {
      if ((r.room || "") !== minhaSala) return;
      if (minhaSala !== "") return;
      lista.push({
        x: r.gx,
        z: r.gz,
        cor: r.badge === "criador" ? "#fbbf24" : intParaHex(r.est.camisa)
      });
    });
    window.CARAGUA_OUTROS_MAPA = lista;
  }

  function sincronizarCoroaRemoto(r) {
    const precisa = r.badge === "criador" || r.badge === "coroa";
    if (precisa) {
      if (!r.coroaMesh) {
        r.coroaMesh = criarCoroaVoxel();
      }
      if (r.coroaMesh.parent !== r.vox) {
        r.vox.add(r.coroaMesh);
      }
      r.coroaMesh.visible = true;
    } else if (r.coroaMesh) {
      r.coroaMesh.visible = false;
    }
  }

  function sincronizarCarroRemoto(r) {
    const carType = r.ride_of ? "" : r.car_type;
    if (r.carMeshAtual === carType) return;
    if (r.carMesh) {
      r.g.remove(r.carMesh);
      descartarGeometriasGrupo(r.carMesh);
      r.carMesh = null;
    }
    r.carMeshAtual = carType;
    if (carType) {
      r.carMesh = criarVeiculoVoxel(carType);
      r.g.add(r.carMesh);
    }
  }

  function sincronizarRemotos3D(playersLista) {
    if (!TEM_3D) return;
    const ativos = new Set();

    for (let i = 0; i < playersLista.length; i++) {
      const p = playersLista[i];
      if (!p || !p.pid || p.pid === perfil.pid) continue;
      ativos.add(p.pid);

      const est = estiloDeJogador(p);
      const sig = assinaturaEstilo(est);
      const nome = limparNome(p.nome, "Visitante");
      const arroba = limparArroba(p.arroba || "");
      const px = Number.isFinite(Number(p.x)) ? Number(p.x) : 0;
      const pz = Number.isFinite(Number(p.z)) ? Number(p.z) : 28;
      const pry = Number.isFinite(Number(p.ry)) ? Number(p.ry) : Math.PI;
      const andando = p.andando ? 1 : 0;
      const jump = Number.isFinite(Number(p.jump)) ? Math.max(0, Math.min(6, Number(p.jump))) : 0;
      const emote = limparEmote(p.emote || "");
      const car_type = limparCarType(p.car_type || "");
      const ride_of = limparRideOf(p.ride_of || "");
      const room = limparRoom(p.room || "");
      const profissao = limparProfissao(p.profissao || "");
      const badge = limparBadge(p.badge || "");

      if (badge === "criador" && !criadoresAnunciados.has(p.pid)) {
        criadoresAnunciados.add(p.pid);
        if (MUNDO && typeof MUNDO.avisa === "function") {
          MUNDO.avisa("👑 @caraguapixel acabou de entrar na cidade!");
        }
      }

      const polInfoRem = obterPvpInfoDe(p.pid);
      const chavePlaca = nome + "|" + arroba + "|" + badge + "|" + profissao + "|" + chavePoliciaPlaca(polInfoRem);

      let r = remotos.get(p.pid);
      if (!r) {
        const g = new THREE.Group();
        const vox = MUNDO.bonecoMalhas(est);
        vox.rotation.y = Math.PI;
        g.add(vox);

        // Hitbox invisível para clique 3D em jogadores remotos
        const hitMesh = new THREE.Mesh(new THREE.BoxGeometry(1.7, 3.3, 1.7), getMatHitInvisivel());
        hitMesh.position.set(0, 1.65, 0);
        hitMesh.userData.remotePid = p.pid;
        g.add(hitMesh);

        const baseY = room ? Y_SALA_INTERIOR : MUNDO.altura(px, pz);
        g.position.set(px, baseY, pz);
        g.rotation.y = pry;

        const placa = criarSprite(512, 168, 0.0104);
        placa.sp.position.set(0, 3.68, 0);
        desenharPlacaJogador(placa, nome, arroba, { discreto: false, pontoVerde: true, badge, profissao, policiaInfo: polInfoRem });
        g.add(placa.sp);

        const balao = criarSprite(560, 160, 0.0098);
        balao.sp.position.set(0, 4.85, 0);
        balao.sp.visible = false;
        g.add(balao.sp);

        const emoteSp = criarSprite(128, 128, 0.0095);
        emoteSp.sp.position.set(0, 4.35, 0);
        emoteSp.sp.visible = false;
        g.add(emoteSp.sp);

        g.visible = room === (estadoInteracao.room || "");
        MUNDO.scene.add(g);

        r = {
          pid: p.pid,
          g,
          grupo: g,
          vox,
          hitMesh,
          coroaMesh: null,
          carMesh: null,
          carMeshAtual: "",
          est,
          sig,
          nome,
          arroba,
          chavePlaca,
          gx: px,
          gz: pz,
          alvoX: px,
          alvoZ: pz,
          alvoRy: pry,
          andando,
          jumpAtual: jump,
          alvoJump: jump,
          emote,
          emoteDesenhado: "",
          car_type,
          ride_of,
          room,
          profissao,
          badge,
          passo: Math.random() * Math.PI * 2,
          placa,
          balao,
          emoteSp,
          balaoExpira: 0
        };
        sincronizarCoroaRemoto(r);
        sincronizarCarroRemoto(r);
        sincronizarPistolinhaNoBoneco(r.vox, polInfoRem);
        remotos.set(p.pid, r);
      } else {
        if (r.sig !== sig) {
          if (r.coroaMesh && r.coroaMesh.parent === r.vox) {
            r.vox.remove(r.coroaMesh);
          }
          r.g.remove(r.vox);
          descartarGeometriasGrupo(r.vox);
          const novoVox = MUNDO.bonecoMalhas(est);
          novoVox.rotation.y = Math.PI;
          r.g.add(novoVox);
          r.vox = novoVox;
          r.est = est;
          r.sig = sig;
        }
        r.nome = nome;
        r.arroba = arroba;
        r.alvoX = px;
        r.alvoZ = pz;
        r.alvoRy = pry;
        r.andando = andando;
        r.alvoJump = jump;
        r.emote = emote;
        r.car_type = car_type;
        r.ride_of = ride_of;
        r.room = room;
        r.profissao = profissao;
        r.badge = badge;

        if (r.chavePlaca !== chavePlaca) {
          r.chavePlaca = chavePlaca;
          desenharPlacaJogador(r.placa, nome, arroba, { discreto: false, pontoVerde: true, badge, profissao, policiaInfo: polInfoRem });
        }
        sincronizarCoroaRemoto(r);
        sincronizarCarroRemoto(r);
        sincronizarPistolinhaNoBoneco(r.vox, polInfoRem);
        r.g.visible = (r.room || "") === (estadoInteracao.room || "");
      }
    }

    remotos.forEach((r, pidRemoto) => {
      if (ativos.has(pidRemoto)) return;
      MUNDO.scene.remove(r.g);
      if (r.coroaMesh) descartarGeometriasGrupo(r.coroaMesh);
      if (r.carMesh) descartarGeometriasGrupo(r.carMesh);
      descartarGeometriasGrupo(r.vox);
      if (r.hitMesh && r.hitMesh.geometry) r.hitMesh.geometry.dispose();
      r.placa.tex.dispose();
      r.placa.mat.dispose();
      r.balao.tex.dispose();
      r.balao.mat.dispose();
      r.emoteSp.tex.dispose();
      r.emoteSp.mat.dispose();
      remotos.delete(pidRemoto);
    });

    atualizarMinimapaOutros();
  }

  function mostrarBalaoRemoto(pidMsg, texto) {
    const r = remotos.get(pidMsg);
    if (!r || !texto) return;
    desenharBalaoHQ(r.balao, texto);
    r.balao.sp.visible = true;
    r.balaoExpira = performance.now() + DURACAO_BALAO_MS;
  }

  function animarPivosBonecoRemoto(r, dt, t, movendo, sentado) {
    const pv = (r.vox && r.vox.userData && r.vox.userData.pivos) || {};
    r.vox.rotation.set(0, Math.PI, 0);

    // Reseta rotações laterais dos braços antes de aplicar pose
    if (pv.B0) { pv.B0.rotation.set(0, 0, 0); }
    if (pv.B1) { pv.B1.rotation.set(0, 0, 0); }
    if (pv.P0) { pv.P0.rotation.set(0, 0, 0); }
    if (pv.P1) { pv.P1.rotation.set(0, 0, 0); }

    let bobExtra = 0;

    if (sentado) {
      if (pv.P0) pv.P0.rotation.x = -1.32;
      if (pv.P1) pv.P1.rotation.x = -1.32;
      if (pv.B0) pv.B0.rotation.x = -0.78;
      if (pv.B1) pv.B1.rotation.x = -0.78;
    } else if (movendo && !MUNDO.reduz) {
      r.passo += dt * 12;
      bobExtra = Math.abs(Math.sin(r.passo)) * 0.14;
      const bal = Math.sin(r.passo) * 0.6;
      if (pv.P0) pv.P0.rotation.x = bal;
      if (pv.P1) pv.P1.rotation.x = -bal;
      if (pv.B0) pv.B0.rotation.x = -bal * 0.8;
      if (pv.B1) pv.B1.rotation.x = bal * 0.8;
    }

    // Emotes sobrepõem os braços (e pernas se não estiver sentado)
    const em = r.emote;
    if (em === "acenar") {
      if (pv.B1) {
        pv.B1.rotation.x = -2.55;
        pv.B1.rotation.z = 0.35 + Math.sin(t * 12) * 0.45;
      }
    } else if (em === "dancar") {
      const f = Math.sin(t * 10);
      if (pv.B0) { pv.B0.rotation.x = -2.2 + f * 0.55; pv.B0.rotation.z = -0.25; }
      if (pv.B1) { pv.B1.rotation.x = -2.2 - f * 0.55; pv.B1.rotation.z = 0.25; }
      if (!sentado) {
        if (pv.P0) pv.P0.rotation.x = f * 0.5;
        if (pv.P1) pv.P1.rotation.x = -f * 0.5;
        bobExtra = Math.abs(Math.sin(t * 10)) * 0.18;
      }
    } else if (em === "coracao") {
      if (pv.B0) { pv.B0.rotation.x = -2.45; pv.B0.rotation.z = -0.45; }
      if (pv.B1) { pv.B1.rotation.x = -2.45; pv.B1.rotation.z = 0.45; }
    } else if (em === "rir") {
      const vib = Math.sin(t * 18) * 0.25;
      if (pv.B0) pv.B0.rotation.x = -0.95 + vib;
      if (pv.B1) pv.B1.rotation.x = -0.95 - vib;
      if (!sentado) bobExtra += Math.abs(Math.sin(t * 14)) * 0.08;
    }

    // Sprite flutuante de emoji para coracao / rir
    const emojiAlvo = em === "coracao" ? "❤️" : (em === "rir" ? "😂" : "");
    if (emojiAlvo) {
      if (r.emoteDesenhado !== emojiAlvo) {
        r.emoteDesenhado = emojiAlvo;
        desenharSpriteEmoji(r.emoteSp, emojiAlvo);
      }
      r.emoteSp.sp.visible = true;
    } else {
      r.emoteSp.sp.visible = false;
    }

    return bobExtra;
  }

  if (TEM_3D) {
    let relogioMiniMapa = 0;

    const atualizarQuadroOnline = function (dt, tParam) {
      const agora = performance.now();
      const t = Number.isFinite(tParam) ? tParam : agora / 1000;
      const minhaSala = estadoInteracao.room || "";

      // Atualiza coroa, placa, balão e emoji flutuante do jogador local
      sincronizarCoroaLocal();
      const peLocal = MUNDO && typeof MUNDO.getPuloEmote === "function"
        ? MUNDO.getPuloEmote()
        : { jump: estadoInteracao.jump || 0, emote: estadoInteracao.emote || "" };
      const jumpLocal = Number(peLocal && peLocal.jump) || 0;
      const emoteLocal = String((peLocal && peLocal.emote) || estadoInteracao.emote || "");
      const infoCarroLocal = estadoInteracao.car_type ? (ASSENTO_CARRO[estadoInteracao.car_type] || ASSENTO_CARRO.bugue) : null;
      const extraCarroLocal = infoCarroLocal ? infoCarroLocal.alturaPlaca : (estadoInteracao.ride_of ? 0.55 : 0);
      const extraCoroaLocal = (estadoInteracao.badge === "criador" || estadoInteracao.badge === "coroa") ? 0.30 : 0;

      if (localPlaca) {
        localPlaca.sp.position.y = 3.38 + jumpLocal + extraCarroLocal + extraCoroaLocal;
      }
      if (localBalao) {
        localBalao.sp.position.y = 4.68 + jumpLocal + extraCarroLocal + extraCoroaLocal;
        if (localBalao.sp.visible && agora > localBalaoExpira) {
          localBalao.sp.visible = false;
        }
      }
      if (localEmoteSp) {
        const emTxt = emoteLocal === "coracao" ? "❤️" : (emoteLocal === "rir" ? "😂" : "");
        if (emTxt) {
          if (localEmoteUltimo !== emTxt) {
            localEmoteUltimo = emTxt;
            desenharSpriteEmoji(localEmoteSp, emTxt);
          }
          localEmoteSp.sp.visible = true;
          localEmoteSp.sp.position.y = 4.18 + jumpLocal + extraCarroLocal + extraCoroaLocal + Math.sin(t * 6) * 0.12;
        } else {
          localEmoteSp.sp.visible = false;
        }
      }

      // Passada 1: atualiza motoristas e pedestres remotos
      remotos.forEach(r => {
        const visivelSala = (r.room || "") === minhaSala;
        r.g.visible = visivelSala;
        if (r.ride_of) return;

        const dx = r.alvoX - r.gx;
        const dz = r.alvoZ - r.gz;
        const distAlvo = Math.hypot(dx, dz);

        if (distAlvo > 60) {
          r.gx = r.alvoX;
          r.gz = r.alvoZ;
          r.g.rotation.y = r.alvoRy;
        } else {
          const k = Math.min(1, dt * 8.5);
          r.gx += dx * k;
          r.gz += dz * k;
          r.g.rotation.y += angDif(r.g.rotation.y, r.alvoRy) * Math.min(1, dt * 10);
        }

        r.jumpAtual += (r.alvoJump - r.jumpAtual) * Math.min(1, dt * 14);
        const baseY = r.room
          ? Y_SALA_INTERIOR
          : ((r.car_type === "jetski" || r.gz > 74.5)
              ? (0.08 + Math.sin(t * 4.2 + r.gx * 0.15) * 0.08)
              : MUNDO.altura(r.gx, r.gz));
        r.g.position.set(r.gx, baseY, r.gz);

        const movendo = distAlvo > 0.15 || r.andando === 1;
        const emCarro = !!r.car_type;
        const assento = emCarro ? (ASSENTO_CARRO[r.car_type] || ASSENTO_CARRO.bugue) : null;

        if (emCarro && r.carMesh && r.carMesh.userData.rodas && movendo && !MUNDO.reduz) {
          r.carMesh.userData.rodas.forEach(roda => {
            roda.rotation.x -= dt * 14;
          });
        }
        if (emCarro && r.carMesh && r.carMesh.userData.giroRed) {
          const faseGiro = Math.floor(t * 7) % 2;
          r.carMesh.userData.giroRed.material.color.setHex(faseGiro ? 0xff2b2b : 0x450a0a);
          r.carMesh.userData.giroBlue.material.color.setHex(faseGiro ? 0x082f49 : 0x38bdf8);
          if (r.carMesh.userData.giroLuz) {
            r.carMesh.userData.giroLuz.color.setHex(faseGiro ? 0xff2b2b : 0x228be6);
            r.carMesh.userData.giroLuz.intensity = 2.2;
          }
        }

        const bob = animarPivosBonecoRemoto(r, dt, t, movendo, emCarro);
        if (assento) {
          r.vox.position.set(assento.driver[0], assento.driver[1] + r.jumpAtual, assento.driver[2]);
        } else {
          r.vox.position.set(0, r.jumpAtual + bob, 0);
        }

        const extraY = (assento ? assento.alturaPlaca : 0) + r.jumpAtual + ((r.badge === "criador" || r.badge === "coroa") ? 0.30 : 0);
        r.placa.sp.position.set(0, 3.62 + extraY, 0);
        r.balao.sp.position.set(0, 4.88 + extraY, 0);
        r.emoteSp.sp.position.set(0, 4.35 + extraY + Math.sin(t * 6) * 0.12, 0);

        const dCam = MUNDO.cam.position.distanceTo(r.g.position);
        r.placa.sp.visible = visivelSala && dCam < DIST_PLACA_REMOTA;
        if (r.balao.sp.visible && agora > r.balaoExpira) {
          r.balao.sp.visible = false;
        }
      });

      // Passada 2: posiciona passageiros de carona no assento do carro do motorista (local ou remoto)
      remotos.forEach(r => {
        if (!r.ride_of) return;
        const visivelSala = (r.room || "") === minhaSala;

        let drvX = r.alvoX;
        let drvY = r.room ? Y_SALA_INTERIOR : MUNDO.altura(r.alvoX, r.alvoZ);
        let drvZ = r.alvoZ;
        let drvRy = r.alvoRy;
        let drvTipo = "bugue";
        let achouMotorista = false;

        if (r.ride_of === perfil.pid && MUNDO.jog) {
          drvX = MUNDO.jog.position.x;
          drvY = MUNDO.jog.position.y;
          drvZ = MUNDO.jog.position.z;
          drvRy = MUNDO.jog.rotation.y;
          drvTipo = estadoInteracao.car_type || "bugue";
          achouMotorista = !!estadoInteracao.car_type;
        } else if (remotos.has(r.ride_of)) {
          const drv = remotos.get(r.ride_of);
          if (drv && drv.car_type && (drv.room || "") === (r.room || "")) {
            drvX = drv.g.position.x;
            drvY = drv.g.position.y;
            drvZ = drv.g.position.z;
            drvRy = drv.g.rotation.y;
            drvTipo = drv.car_type;
            achouMotorista = true;
          }
        }

        r.g.visible = visivelSala;
        const assento = (ASSENTO_CARRO[drvTipo] || ASSENTO_CARRO.bugue).carona;
        if (achouMotorista) {
          const c = Math.cos(drvRy);
          const s = Math.sin(drvRy);
          const wx = drvX + assento[0] * c + assento[2] * s;
          const wz = drvZ - assento[0] * s + assento[2] * c;
          r.gx = wx;
          r.gz = wz;
          r.g.position.set(wx, drvY, wz);
          r.g.rotation.y = drvRy;
          animarPivosBonecoRemoto(r, dt, t, false, true);
          r.vox.position.set(0, assento[1], 0);
        } else {
          r.gx = r.alvoX;
          r.gz = r.alvoZ;
          r.g.position.set(r.gx, drvY, r.gz);
          r.g.rotation.y = r.alvoRy;
          const bob = animarPivosBonecoRemoto(r, dt, t, false, false);
          r.vox.position.set(0, bob, 0);
        }

        const extraY = (achouMotorista ? assento[1] : 0) + ((r.badge === "criador" || r.badge === "coroa") ? 0.30 : 0);
        r.placa.sp.position.set(0, 3.62 + extraY, 0);
        r.balao.sp.position.set(0, 4.88 + extraY, 0);
        r.emoteSp.sp.position.set(0, 4.35 + extraY + Math.sin(t * 6) * 0.12, 0);

        const dCam = MUNDO.cam.position.distanceTo(r.g.position);
        r.placa.sp.visible = visivelSala && dCam < DIST_PLACA_REMOTA;
        if (r.balao.sp.visible && agora > r.balaoExpira) {
          r.balao.sp.visible = false;
        }
      });

      relogioMiniMapa -= dt;
      if (relogioMiniMapa <= 0) {
        relogioMiniMapa = 0.15;
        atualizarMinimapaOutros();
      }
    };

    if (typeof MUNDO.addQuadroListener === "function") {
      MUNDO.addQuadroListener(atualizarQuadroOnline);
    } else {
      const prevOnQuadro = MUNDO.onQuadro;
      MUNDO.onQuadro = function (dt, t) {
        if (typeof prevOnQuadro === "function") prevOnQuadro(dt, t);
        atualizarQuadroOnline(dt, t);
      };
    }
  }

  // ---------- Estado de UI & Rede ----------
  let root = document.getElementById("chat-online");
  if (!root) {
    root = document.createElement("section");
    root.id = "chat-online";
    root.setAttribute("aria-label", "Chat da cidade e jogadores online");
    document.body.appendChild(root);
  }

  let minimizado = ehMobileInicial();
  let abaAtiva = "chat";
  let mostrarPerfil = init.mostrarBarraInicial;
  let naoLidas = 0;
  let totalOnline = 1;
  let ultimoId = 0;
  let ultimoIdInicial = 0;
  let cargaInicialFeita = false;
  let ultimoPlayerSeq = 0;
  let seqReq = 0;
  let ultimaListaPlayers = [];
  const mensagensVistas = new Set();
  const mensagensLista = [];

  // ---------- Construção do DOM (100% createElement + textContent) ----------
  const cardRemoto = document.createElement("div");
  cardRemoto.className = "chat-card-remoto";
  cardRemoto.hidden = true;

  const btnPilula = document.createElement("button");
  btnPilula.type = "button";
  btnPilula.className = "chat-pilula";
  btnPilula.setAttribute("aria-expanded", minimizado ? "false" : "true");

  const spanPilulaTxt = document.createElement("span");
  spanPilulaTxt.className = "chat-pilula-texto";
  spanPilulaTxt.textContent = "💬 Chat · 🟢 1 online";

  const spanBadge = document.createElement("span");
  spanBadge.className = "chat-badge";
  spanBadge.hidden = true;
  spanBadge.textContent = "0";

  btnPilula.append(spanPilulaTxt, spanBadge);

  const caixa = document.createElement("div");
  caixa.className = "chat-caixa" + (mostrarPerfil ? " com-perfil" : "");

  // Banner discreto quando dentro de sala privada
  const bannerSala = document.createElement("div");
  bannerSala.className = "chat-sala-banner";
  bannerSala.hidden = true;
  bannerSala.textContent = "🔒 Chat privado da sala";

  // Cabeçalho com abas
  const topo = document.createElement("div");
  topo.className = "chat-topo";

  const tabChat = document.createElement("button");
  tabChat.type = "button";
  tabChat.className = "chat-aba ativa";
  tabChat.textContent = "💬 Chat";

  const tabOnline = document.createElement("button");
  tabOnline.type = "button";
  tabOnline.className = "chat-aba";
  tabOnline.textContent = "👥 Online (1)";

  const btnEditarPerfil = document.createElement("button");
  btnEditarPerfil.type = "button";
  btnEditarPerfil.className = "chat-ico-btn";
  btnEditarPerfil.title = "Editar apelido e camisa";
  btnEditarPerfil.setAttribute("aria-label", "Editar apelido e camisa");
  btnEditarPerfil.setAttribute("aria-expanded", mostrarPerfil ? "true" : "false");
  btnEditarPerfil.textContent = "✏️";

  const btnMin = document.createElement("button");
  btnMin.type = "button";
  btnMin.className = "chat-ico-btn";
  btnMin.title = "Minimizar chat";
  btnMin.setAttribute("aria-label", "Minimizar chat");
  btnMin.textContent = "—";

  topo.append(tabChat, tabOnline, btnEditarPerfil, btnMin);

  // Barra discreta de identificação rápida
  const formPerfil = document.createElement("form");
  formPerfil.className = "chat-perfil";
  formPerfil.hidden = !mostrarPerfil;

  const camposPerfil = document.createElement("div");
  camposPerfil.className = "chat-perfil-campos";

  const inputApelido = document.createElement("input");
  inputApelido.type = "text";
  inputApelido.className = "chat-perfil-input";
  inputApelido.maxLength = 24;
  inputApelido.placeholder = "Apelido";
  inputApelido.setAttribute("aria-label", "Apelido");
  inputApelido.autocomplete = "off";
  inputApelido.spellcheck = false;
  inputApelido.value = perfil.editado ? perfil.nome : (MUNDO && MUNDO.meuMorador ? perfil.nome : "");

  const inputArroba = document.createElement("input");
  inputArroba.type = "text";
  inputArroba.className = "chat-perfil-input";
  inputArroba.maxLength = 30;
  inputArroba.placeholder = "@seu_instagram";
  inputArroba.setAttribute("aria-label", "Seu @ do Instagram");
  inputArroba.autocomplete = "username";
  inputArroba.spellcheck = false;
  inputArroba.value = perfil.arroba ? "@" + perfil.arroba : "";

  const inputPin = document.createElement("input");
  inputPin.type = "password";
  inputPin.inputMode = "numeric";
  inputPin.className = "chat-perfil-input";
  inputPin.maxLength = 8;
  inputPin.placeholder = "🔑 PIN 4 dígitos";
  inputPin.setAttribute("aria-label", "PIN numérico de 4 dígitos");
  inputPin.autocomplete = "current-password";

  camposPerfil.append(inputArroba, inputPin, inputApelido);

  const statusMoradorEl = document.createElement("div");
  statusMoradorEl.className = "chat-perfil-status";

  function atualizarStatusMoradorUI() {
    const arr = limparArroba(inputArroba.value);
    statusMoradorEl.textContent = "";
    if (!arr) {
      statusMoradorEl.textContent = "🪪 Digite seu @ + um PIN de 4 números para salvar seus itens em qualquer aparelho.";
      return;
    }
    const mor = buscarMoradorCanonica(arr);
    if (mor) {
      const atualAp = inputApelido.value.trim();
      if (!atualAp || atualAp.startsWith("Visitante")) {
        inputApelido.value = mor.nomeSugerido;
      }
      const txt = document.createElement("span");
      txt.textContent = "🏡 Morador oficial: " + mor.t + " ";
      const btnCasa = document.createElement("button");
      btnCasa.type = "button";
      btnCasa.className = "chat-card-btn destaque";
      btnCasa.style.marginLeft = "4px";
      btnCasa.textContent = "🏠 Ir p/ casa";
      btnCasa.addEventListener("click", () => {
        if (MUNDO && typeof MUNDO.irParaArroba === "function") {
          MUNDO.irParaArroba(mor.h, true);
        }
      });
      statusMoradorEl.append(txt, btnCasa);
    } else {
      statusMoradorEl.textContent = "✨ @" + arr + " · escolha um PIN de 4 números (ou digite o seu para recuperar itens).";
    }
  }

  inputArroba.addEventListener("input", atualizarStatusMoradorUI);
  atualizarStatusMoradorUI();

  const linhaCores = document.createElement("div");
  linhaCores.className = "chat-perfil-cores";

  const rotuloCor = document.createElement("span");
  rotuloCor.className = "chat-perfil-rotulo";
  rotuloCor.textContent = "Camisa";
  linhaCores.appendChild(rotuloCor);

  const botoesCor = [];
  const corAtualLocal = () => {
    if (MUNDO && MUNDO.getEstadoLocal) return corIntSegura(MUNDO.getEstadoLocal().estilo.camisa, 0x1c7ed6);
    return perfil.camisa != null ? perfil.camisa : 0x1c7ed6;
  };

  function atualizarBotoesCor() {
    const atual = corAtualLocal();
    botoesCor.forEach(item => {
      const ativo = item.cor === atual;
      item.btn.classList.toggle("ativa", ativo);
      item.btn.setAttribute("aria-pressed", ativo ? "true" : "false");
    });
  }

  CORES_CAMISA.forEach((cor, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chat-cor-btn";
    b.style.backgroundColor = intParaHex(cor);
    b.title = "Camisa " + NOMES_CAMISA[idx];
    b.setAttribute("aria-label", "Camisa " + NOMES_CAMISA[idx]);
    b.addEventListener("click", () => {
      perfil.camisa = cor;
      salvarPerfil(perfil);
      if (MUNDO && typeof MUNDO.setEstiloLocal === "function") {
        MUNDO.setEstiloLocal({ camisa: cor });
      }
      sincronizarCoroaLocal();
      atualizarBotoesCor();
      dispararSyncRapido();
    });
    botoesCor.push({ btn: b, cor });
    linhaCores.appendChild(b);
  });
  atualizarBotoesCor();

  const acoesPerfil = document.createElement("div");
  acoesPerfil.className = "chat-perfil-acoes";

  const btnEntrarChat = document.createElement("button");
  btnEntrarChat.type = "submit";
  btnEntrarChat.className = "chat-entrar-btn";
  btnEntrarChat.textContent = "Entrar no chat";

  const linkBoneco = document.createElement("a");
  linkBoneco.className = "chat-link-boneco";
  linkBoneco.href = "moradores.html";
  linkBoneco.textContent = "Personalizar boneco ↗";

  acoesPerfil.append(btnEntrarChat, linkBoneco);
  formPerfil.append(camposPerfil, statusMoradorEl, linhaCores, acoesPerfil);

  // Painel aba Chat
  const painelChat = document.createElement("div");
  painelChat.className = "chat-painel";

  const listaMsgs = document.createElement("ul");
  listaMsgs.className = "chat-lista";
  listaMsgs.setAttribute("role", "log");
  listaMsgs.setAttribute("aria-live", "polite");

  const msgVazia = document.createElement("li");
  msgVazia.className = "chat-vazio";
  msgVazia.textContent = "Nenhuma mensagem ainda. Diga oi para a cidade!";
  listaMsgs.appendChild(msgVazia);

  const erroEl = document.createElement("p");
  erroEl.className = "chat-erro";
  erroEl.hidden = true;
  erroEl.setAttribute("role", "status");

  const formChat = document.createElement("form");
  formChat.className = "chat-form";

  const inputChat = document.createElement("input");
  inputChat.id = "chat-input";
  inputChat.type = "text";
  inputChat.maxLength = 180;
  inputChat.placeholder = "Falar no chat... (Enter)";
  inputChat.setAttribute("aria-label", "Mensagem no chat");
  inputChat.autocomplete = "off";
  inputChat.spellcheck = false;

  const btnEnviar = document.createElement("button");
  btnEnviar.type = "submit";
  btnEnviar.className = "chat-enviar";
  btnEnviar.textContent = "Enviar";

  formChat.append(inputChat, btnEnviar);
  painelChat.append(listaMsgs, erroEl, formChat);

  // Painel aba Online
  const painelOnline = document.createElement("div");
  painelOnline.className = "chat-painel";
  painelOnline.hidden = true;

  const listaOnline = document.createElement("ul");
  listaOnline.className = "chat-online-lista";
  painelOnline.appendChild(listaOnline);

  caixa.append(bannerSala, topo, formPerfil, painelChat, painelOnline);
  root.append(cardRemoto, btnPilula, caixa);

  // ---------- Card rápido de clique 3D em jogadores remotos ----------
  let timerCardRemoto = 0;
  function fecharCardRemoto() {
    clearTimeout(timerCardRemoto);
    cardRemoto.hidden = true;
    cardRemoto.textContent = "";
  }

  function mostrarCardRemoto(r) {
    if (!r) return;
    clearTimeout(timerCardRemoto);
    cardRemoto.textContent = "";

    const topoCard = document.createElement("div");
    topoCard.className = "chat-card-topo";

    const blocoTxt = document.createElement("div");
    const titulo = document.createElement("div");
    titulo.className = "chat-card-titulo";
    const pref = r.badge === "criador" ? "👑 " : (r.badge === "coroa" ? "👑 " : "");
    titulo.textContent = pref + r.nome;
    blocoTxt.appendChild(titulo);

    const subPartes = [];
    if (r.arroba) subPartes.push("@" + r.arroba);
    if (r.profissao) subPartes.push(rotuloProfissao(r.profissao));
    if (r.car_type) subPartes.push("🚗 " + r.car_type);
    if (subPartes.length) {
      const sub = document.createElement("div");
      sub.className = "chat-card-sub";
      sub.textContent = subPartes.join(" · ");
      blocoTxt.appendChild(sub);
    }

    const btnX = document.createElement("button");
    btnX.type = "button";
    btnX.className = "chat-card-fechar";
    btnX.textContent = "✕";
    btnX.addEventListener("click", fecharCardRemoto);

    topoCard.append(blocoTxt, btnX);

    const acoes = document.createElement("div");
    acoes.className = "chat-card-acoes";

    const btnMencionar = document.createElement("button");
    btnMencionar.type = "button";
    btnMencionar.className = "chat-card-btn";
    const mencao = r.arroba ? ("@" + r.arroba) : ("@" + r.nome);
    btnMencionar.textContent = "💬 " + mencao;
    btnMencionar.addEventListener("click", () => {
      minimizado = false;
      abaAtiva = "chat";
      sincronizarVisibilidadeUI();
      if (!inputChat.value.includes(mencao)) {
        inputChat.value = (mencao + " " + inputChat.value).slice(0, 180);
      }
      inputChat.focus();
      fecharCardRemoto();
    });
    acoes.appendChild(btnMencionar);

    if (r.car_type && !estadoInteracao.car_type) {
      const btnCarona = document.createElement("button");
      btnCarona.type = "button";
      btnCarona.className = "chat-card-btn destaque";
      btnCarona.textContent = "🚗 [F] Carona";
      btnCarona.addEventListener("click", () => {
        if (window.CARAGUA_INTERACOES && typeof window.CARAGUA_INTERACOES.pegarCarona === "function") {
          window.CARAGUA_INTERACOES.pegarCarona(r.pid);
        } else if (window.CARAGUA_INTERACOES && typeof window.CARAGUA_INTERACOES.acionarContexto === "function") {
          window.CARAGUA_INTERACOES.acionarContexto();
        }
        fecharCardRemoto();
      });
      acoes.appendChild(btnCarona);
    }

    if (!r.room) {
      const btnIr = document.createElement("button");
      btnIr.type = "button";
      btnIr.className = "chat-card-btn";
      btnIr.textContent = "📍 Ir até";
      btnIr.addEventListener("click", () => {
        voarParaPosicao(r.gx, r.gz, r.nome);
        fecharCardRemoto();
      });
      acoes.appendChild(btnIr);
    }

    if (r.arroba) {
      const linkIg = document.createElement("a");
      linkIg.className = "chat-card-btn";
      linkIg.href = "https://www.instagram.com/" + encodeURIComponent(r.arroba) + "/";
      linkIg.target = "_blank";
      linkIg.rel = "noopener";
      linkIg.textContent = "↗ Insta";
      acoes.appendChild(linkIg);
    }

    cardRemoto.append(topoCard, acoes);
    cardRemoto.hidden = false;
    timerCardRemoto = setTimeout(fecharCardRemoto, 9500);
  }

  // Encadeia window.CARAGUA_CLIQUE_3D preservando outros handlers (lotes/interações)
  const clique3DAnterior = typeof window.CARAGUA_CLIQUE_3D === "function" ? window.CARAGUA_CLIQUE_3D : null;
  window.CARAGUA_CLIQUE_3D = function (e, raycaster, camRef) {
    if (TEM_3D && raycaster && remotos.size > 0) {
      const minhaSala = estadoInteracao.room || "";
      const hitMeshes = [];
      remotos.forEach(r => {
        if (r.g.visible && (r.room || "") === minhaSala && r.hitMesh) {
          hitMeshes.push(r.hitMesh);
        }
      });
      if (hitMeshes.length) {
        const hits = raycaster.intersectObjects(hitMeshes, false);
        if (hits.length > 0) {
          const pidClicado = hits[0].object && hits[0].object.userData && hits[0].object.userData.remotePid;
          const r = pidClicado ? remotos.get(pidClicado) : null;
          if (r) {
            mostrarCardRemoto(r);
            if (MUNDO && typeof MUNDO.avisa === "function") {
              const msgCarona = r.car_type ? " · Aperte [F] perto para Carona!" : "";
              MUNDO.avisa(
                (r.badge === "criador" ? "👑 " : "👋 ") +
                r.nome +
                (r.arroba ? " (@" + r.arroba + ")" : "") +
                msgCarona
              );
            }
            return true;
          }
        }
      }
    }
    if (clique3DAnterior) {
      return !!clique3DAnterior(e, raycaster, camRef);
    }
    return false;
  };

  function sincronizarVisibilidadeUI() {
    const emSala = !!(estadoInteracao.room && estadoInteracao.room !== "");
    btnPilula.hidden = !minimizado;
    caixa.hidden = minimizado;
    btnPilula.setAttribute("aria-expanded", minimizado ? "false" : "true");

    bannerSala.hidden = !emSala;
    bannerSala.textContent = "🔒 Chat privado da sala";
    inputChat.placeholder = emSala ? "Falar na sala privada... (Enter)" : "Falar no chat... (Enter)";

    formPerfil.hidden = !mostrarPerfil;
    caixa.classList.toggle("com-perfil", mostrarPerfil);
    btnEditarPerfil.setAttribute("aria-expanded", mostrarPerfil ? "true" : "false");

    const ehChat = abaAtiva === "chat";
    tabChat.classList.toggle("ativa", ehChat);
    tabOnline.classList.toggle("ativa", !ehChat);
    painelChat.hidden = !ehChat;
    painelOnline.hidden = ehChat;

    spanPilulaTxt.textContent = (emSala ? "🔒 Sala · " : "💬 Chat · ") + "🟢 " + totalOnline + " online";
    tabOnline.textContent = "👥 Online (" + totalOnline + ")";

    if (!minimizado && ehChat && naoLidas > 0) {
      naoLidas = 0;
    }
    spanBadge.hidden = naoLidas <= 0;
    if (naoLidas > 0) {
      spanBadge.textContent = naoLidas > 99 ? "99+" : String(naoLidas);
    }
  }

  let timerErro = 0;
  function mostrarErro(texto) {
    clearTimeout(timerErro);
    if (!texto) {
      erroEl.hidden = true;
      erroEl.textContent = "";
      return;
    }
    erroEl.textContent = texto;
    erroEl.hidden = false;
    timerErro = setTimeout(() => {
      erroEl.hidden = true;
      erroEl.textContent = "";
    }, 3500);
  }

  function voarParaPosicao(x, z, nome) {
    if (!MUNDO || typeof MUNDO.voarAte !== "function") return;
    if (estadoInteracao.room) {
      if (MUNDO.avisa) MUNDO.avisa("Saia da sala atual [E] antes de voar pela cidade.");
      return;
    }
    MUNDO.voarAte(Number(x) || 0, Number(z) || 28, "Indo até " + nome);
    if (ehMobileInicial()) {
      minimizado = true;
      sincronizarVisibilidadeUI();
    }
  }

  function criarItemMensagem(m) {
    const li = document.createElement("li");
    li.className = (m.pid === "sistema_policia") ? "chat-msg chat-msg-sistema" : "chat-msg";

    const hora = document.createElement("span");
    hora.className = "chat-hora";
    hora.textContent = formataHora(m.ts);
    li.appendChild(hora);

    if (m.room) {
      const tagSala = document.createElement("span");
      tagSala.className = "chat-msg-sala";
      tagSala.textContent = "🔒";
      tagSala.title = "Mensagem privada da sala";
      li.appendChild(tagSala);
    }

    const bolinha = document.createElement("span");
    bolinha.className = "chat-bolinha";
    bolinha.style.backgroundColor = corHexSegura(m.cor, "#1f8a9e");

    const nomeBtn = document.createElement("button");
    nomeBtn.type = "button";
    nomeBtn.className = "chat-msg-nome";
    const nomeLimpo = limparNome(m.nome, "Visitante");
    nomeBtn.textContent = nomeLimpo;
    nomeBtn.title = "Ir até " + nomeLimpo;
    nomeBtn.addEventListener("click", () => {
      voarParaPosicao(m.x, m.z, nomeLimpo);
    });

    li.append(bolinha, nomeBtn);

    const arrobaLimpo = limparArroba(m.arroba || "");
    if (arrobaLimpo) {
      const arr = document.createElement("span");
      arr.className = "chat-msg-arroba";
      arr.textContent = "@" + arrobaLimpo;
      li.appendChild(arr);
    }

    const textoSpan = document.createElement("span");
    textoSpan.className = "chat-msg-texto";
    textoSpan.textContent = ": " + String(m.texto || "");
    li.appendChild(textoSpan);

    return li;
  }

  function rolarChatParaFim() {
    listaMsgs.scrollTop = listaMsgs.scrollHeight;
  }

  function anexarTagsJogadorDOM(containerNome, infoContainer, badge, profissao) {
    const b = limparBadge(badge);
    if (b === "criador") {
      const t = document.createElement("span");
      t.className = "chat-tag-badge";
      t.textContent = "👑 CRIADOR";
      containerNome.appendChild(t);
    } else if (b === "coroa") {
      const t = document.createElement("span");
      t.className = "chat-tag-badge";
      t.textContent = "👑";
      containerNome.appendChild(t);
    } else if (b === "vip") {
      const t = document.createElement("span");
      t.className = "chat-tag-badge";
      t.textContent = "VIP";
      containerNome.appendChild(t);
    } else if (b === "xerife") {
      const t = document.createElement("span");
      t.className = "chat-tag-badge xerife";
      t.textContent = "🚓 XERIFE";
      containerNome.appendChild(t);
    }
    const pRot = rotuloProfissao(profissao);
    if (pRot) {
      const tp = document.createElement("span");
      tp.className = "chat-tag-prof";
      tp.textContent = pRot;
      infoContainer.appendChild(tp);
    }
  }

  function renderListaOnline(players) {
    const lista = Array.isArray(players) ? players : [];
    const remotosLista = [];
    const vistos = new Set([perfil.pid]);

    for (let i = 0; i < lista.length; i++) {
      const p = lista[i];
      if (!p || !p.pid || vistos.has(p.pid)) continue;
      vistos.add(p.pid);
      remotosLista.push(p);
    }

    totalOnline = 1 + remotosLista.length;
    listaOnline.textContent = "";

    // Você no topo
    const euLi = document.createElement("li");
    euLi.className = "chat-jogador";

    const euPonto = document.createElement("span");
    euPonto.className = "chat-jogador-ponto";
    euPonto.style.backgroundColor = intParaHex(corAtualLocal());

    const euInfo = document.createElement("div");
    euInfo.className = "chat-jogador-info";

    const euNome = document.createElement("span");
    euNome.className = "chat-jogador-nome";
    euNome.textContent = perfil.nome;
    euInfo.appendChild(euNome);

    if (perfil.arroba) {
      const euArr = document.createElement("span");
      euArr.className = "chat-jogador-arroba";
      euArr.textContent = "@" + perfil.arroba;
      euInfo.appendChild(euArr);
    }
    anexarTagsJogadorDOM(euNome, euInfo, estadoInteracao.badge, estadoInteracao.profissao);

    const euSelo = document.createElement("span");
    euSelo.className = "chat-voce-selo";
    euSelo.textContent = "Você";

    euLi.append(euPonto, euInfo, euSelo);
    listaOnline.appendChild(euLi);

    remotosLista.forEach(p => {
      const li = document.createElement("li");
      li.className = "chat-jogador";

      const ponto = document.createElement("span");
      ponto.className = "chat-jogador-ponto";
      ponto.style.backgroundColor = intParaHex(p.camisa);

      const info = document.createElement("div");
      info.className = "chat-jogador-info";

      const nome = document.createElement("span");
      nome.className = "chat-jogador-nome";
      const nomeLimpo = limparNome(p.nome, "Visitante");
      nome.textContent = nomeLimpo;
      info.appendChild(nome);

      const arrLimpo = limparArroba(p.arroba || "");
      if (arrLimpo) {
        const arr = document.createElement("span");
        arr.className = "chat-jogador-arroba";
        arr.textContent = "@" + arrLimpo;
        info.appendChild(arr);
      }
      anexarTagsJogadorDOM(nome, info, p.badge, p.profissao);

      const btnIr = document.createElement("button");
      btnIr.type = "button";
      btnIr.className = "chat-ir-btn";
      if (p.room && p.room !== (estadoInteracao.room || "")) {
        btnIr.textContent = "🔒 Sala";
        btnIr.disabled = true;
      } else {
        btnIr.textContent = "Ir até →";
        btnIr.addEventListener("click", () => {
          voarParaPosicao(p.x, p.z, nomeLimpo);
        });
      }

      li.append(ponto, info, btnIr);
      listaOnline.appendChild(li);
    });

    sincronizarVisibilidadeUI();
  }

  function dispararSomMensagem(msg) {
    somMensagemListeners.forEach(cb => {
      try {
        cb(msg);
      } catch (e) { /* noop */ }
    });
  }

  function dispararBolaServidor(ball) {
    if (!ball || typeof ball !== "object") return;
    ultimoBallServidor = ball;
    bolaListeners.forEach(cb => {
      try {
        cb(ball);
      } catch (e) { /* noop */ }
    });
  }

  function dispararPoliciaServidor(ev, walletData) {
    if (walletData && typeof walletData === "object") {
      ultimoWalletServidor = walletData;
    }
    if (!ev || typeof ev !== "object") return;
    ultimoPoliciaServidor = ev;
    const x = ev.xerife || null;
    const euSouXerife = !!(
      x && (
        (x.pid && x.pid === perfil.pid) ||
        (x.arroba && perfil.arroba && limparArroba(x.arroba).toLowerCase() === limparArroba(perfil.arroba).toLowerCase())
      )
    );
    if (estadoInteracao.badge !== "criador") {
      if (euSouXerife && estadoInteracao.badge !== "xerife") {
        estadoInteracao.badge = "xerife";
        perfil.badge = "xerife";
        salvarPerfil(perfil);
      } else if (!euSouXerife && estadoInteracao.badge === "xerife") {
        estadoInteracao.badge = "";
        perfil.badge = "";
        salvarPerfil(perfil);
      }
    }
    atualizarPlacaLocal();
    remotos.forEach(r => {
      const polInfoRem = obterPvpInfoDe(r.pid);
      const novaChave = r.nome + "|" + r.arroba + "|" + r.badge + "|" + r.profissao + "|" + chavePoliciaPlaca(polInfoRem);
      if (r.chavePlaca !== novaChave) {
        r.chavePlaca = novaChave;
        desenharPlacaJogador(r.placa, r.nome, r.arroba, { discreto: false, pontoVerde: true, badge: r.badge, profissao: r.profissao, policiaInfo: polInfoRem });
      }
      sincronizarPistolinhaNoBoneco(r.vox, polInfoRem);
    });
    policiaListeners.forEach(cb => {
      try {
        cb(ev, ultimoWalletServidor);
      } catch (e) { /* noop */ }
    });
  }

  function receberMensagens(msgs) {
    if (!Array.isArray(msgs) || !msgs.length) return;
    const estavaNoFim = listaMsgs.scrollHeight - listaMsgs.scrollTop - listaMsgs.clientHeight < 36;
    const minhaSala = estadoInteracao.room || "";
    let adicionou = false;

    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      if (!m) continue;
      const msgRoom = limparRoom(m.room || "");
      // Isola mensagens de outras salas privadas
      if (msgRoom !== "" && msgRoom !== minhaSala) continue;

      const id = Number(m.id) || 0;
      if (!id || mensagensVistas.has(id)) continue;

      mensagensVistas.add(id);
      mensagensLista.push(m);
      if (id > ultimoId) ultimoId = id;

      if (msgVazia.parentNode === listaMsgs) {
        listaMsgs.removeChild(msgVazia);
      }
      listaMsgs.appendChild(criarItemMensagem(m));
      adicionou = true;

      while (listaMsgs.children.length > MAX_MENSAGENS_DOM) {
        listaMsgs.removeChild(listaMsgs.firstChild);
      }

      if (cargaInicialFeita && id > ultimoIdInicial) {
        if (m.pid === perfil.pid) {
          mostrarBalaoLocal(m.texto);
        } else {
          if (msgRoom === minhaSala) {
            mostrarBalaoRemoto(m.pid, m.texto);
          }
          dispararSomMensagem(m);
          if (minimizado || abaAtiva !== "chat") {
            naoLidas++;
          }
        }
      }
    }

    if (adicionou) {
      if (!cargaInicialFeita || estavaNoFim) {
        rolarChatParaFim();
      }
      sincronizarVisibilidadeUI();
    }
  }

  function aplicarEstadoServidor(data, ehRespostaInicial, reqNum) {
    if (!data || !data.ok) return;
    const players = Array.isArray(data.players) ? data.players : [];
    const messages = Array.isArray(data.messages) ? data.messages : [];

    if (reqNum == null || reqNum >= ultimoPlayerSeq) {
      if (reqNum != null) ultimoPlayerSeq = reqNum;
      ultimaListaPlayers = players;
      // Confere se o servidor confirmou ou rebaixou nosso badge (ex: criador sem chave válida)
      for (let i = 0; i < players.length; i++) {
        const p = players[i];
        if (p && p.pid === perfil.pid && typeof p.badge === "string") {
          const badgeSrv = limparBadge(p.badge);
          if (estadoInteracao.badge === "criador" && badgeSrv !== "criador") {
            estadoInteracao.badge = badgeSrv;
            perfil.badge = badgeSrv;
            salvarPerfil(perfil);
            atualizarPlacaLocal();
          }
          break;
        }
      }
      sincronizarRemotos3D(players);
      renderListaOnline(players);
    }

    if (data.ball && typeof data.ball === "object") {
      dispararBolaServidor(data.ball);
    }

    if (data.wallet && typeof data.wallet === "object") {
      ultimoWalletServidor = data.wallet;
    }

    if (data.policia_event && typeof data.policia_event === "object") {
      dispararPoliciaServidor(data.policia_event, data.wallet || ultimoWalletServidor);
    }

    if (!cargaInicialFeita && ehRespostaInicial) {
      let maxInicial = 0;
      for (let i = 0; i < messages.length; i++) {
        const mid = Number(messages[i] && messages[i].id) || 0;
        if (mid > maxInicial) maxInicial = mid;
      }
      ultimoIdInicial = maxInicial;
      receberMensagens(messages);
      cargaInicialFeita = true;
      rolarChatParaFim();
    } else {
      receberMensagens(messages);
    }
  }

  // ---------- Eventos da HUD ----------
  btnPilula.addEventListener("click", () => {
    minimizado = false;
    naoLidas = 0;
    sincronizarVisibilidadeUI();
    agendarProximoPoll();
    if (abaAtiva === "chat") {
      rolarChatParaFim();
    }
  });

  btnMin.addEventListener("click", () => {
    minimizado = true;
    sincronizarVisibilidadeUI();
    agendarProximoPoll();
  });

  tabChat.addEventListener("click", () => {
    abaAtiva = "chat";
    naoLidas = 0;
    sincronizarVisibilidadeUI();
    rolarChatParaFim();
  });

  tabOnline.addEventListener("click", () => {
    abaAtiva = "online";
    sincronizarVisibilidadeUI();
  });

  btnEditarPerfil.addEventListener("click", () => {
    mostrarPerfil = !mostrarPerfil;
    if (mostrarPerfil) {
      inputApelido.value = perfil.editado ? perfil.nome : (MUNDO && MUNDO.meuMorador ? perfil.nome : "");
      inputArroba.value = perfil.arroba ? "@" + perfil.arroba : "";
      atualizarStatusMoradorUI();
      atualizarBotoesCor();
    }
    sincronizarVisibilidadeUI();
    if (mostrarPerfil) inputArroba.focus();
  });

  formPerfil.addEventListener("submit", async e => {
    e.preventDefault();
    const fallback = "Visitante #" + perfil.pid.slice(-3);
    const arrobaLimpo = limparArroba(inputArroba.value);
    const pinLimpo = String(inputPin.value || "").replace(/\D/g, "");
    const morCan = arrobaLimpo ? buscarMoradorCanonica(arrobaLimpo) : null;
    const apelidoDigitado = inputApelido.value.trim();
    const nomeFinal = limparNome(
      apelidoDigitado && !apelidoDigitado.startsWith("Visitante")
        ? apelidoDigitado
        : (morCan ? morCan.nomeSugerido : (arrobaLimpo ? "@" + arrobaLimpo : "")),
      fallback
    );

    if (arrobaLimpo && pinLimpo.length > 0 && pinLimpo.length < 4) {
      mostrarErro("O PIN precisa ter pelo menos 4 números (ex.: 1234).");
      inputPin.focus();
      return;
    }

    if (arrobaLimpo.length >= 2 && pinLimpo.length >= 4) {
      btnEntrarChat.disabled = true;
      const txtAnt = btnEntrarChat.textContent;
      btnEntrarChat.textContent = "⏳ Sincronizando @...";
      try {
        const resp = await fetch("api/economia.php?action=login_arroba", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            action: "login_arroba",
            arroba: arrobaLimpo,
            pin: pinLimpo,
            nome: nomeFinal,
            pid: perfil.pid,
            camisa: corAtualLocal(),
            moedas: lerMoedasIdsLocais()
          })
        });
        const res = await resp.json().catch(() => null);
        btnEntrarChat.disabled = false;
        btnEntrarChat.textContent = txtAnt;

        if (!res || !res.ok) {
          mostrarErro((res && (res.erro || res.error)) || "PIN incorreto para @" + arrobaLimpo + ".");
          return;
        }

        perfil.pid = res.master_pid || perfil.pid;
        perfil.nome = limparNome(res.nome || nomeFinal, fallback);
        perfil.arroba = limparArroba(res.handle || arrobaLimpo);
        perfil.editado = true;
        perfil.verificadoPin = true;
        if (Number.isFinite(Number(res.camisa))) {
          perfil.camisa = corIntSegura(res.camisa, 0x1c7ed6);
          if (MUNDO && typeof MUNDO.setEstiloLocal === "function") {
            MUNDO.setEstiloLocal({ camisa: perfil.camisa });
          }
          atualizarBotoesCor();
        }
        if (Array.isArray(res.moedas) && res.moedas.length > 0) {
          try {
            localStorage.setItem(CHAVE_MOEDAS, JSON.stringify(res.moedas));
          } catch (err) {}
        }
        inputPin.value = "";
        salvarPerfil(perfil);
        atualizarPlacaLocal();
        renderListaOnline(ultimaListaPlayers);
        mostrarPerfil = false;
        sincronizarVisibilidadeUI();
        dispararSyncRapido();

        if (window.CARAGUA_LOJA && typeof window.CARAGUA_LOJA.sincronizar === "function") {
          window.CARAGUA_LOJA.sincronizar();
        }
        if (morCan && MUNDO && typeof MUNDO.irParaArroba === "function") {
          MUNDO.irParaArroba(morCan.h, true);
        } else if (MUNDO && typeof MUNDO.avisa === "function") {
          MUNDO.avisa(
            res.is_new
              ? "🪪 Conta @" + perfil.arroba + " criada e protegida com PIN!"
              : "🪪 Bem-vindo de volta, @" + perfil.arroba + "! Conta e itens sincronizados!"
          );
        }
        return;
      } catch (err) {
        btnEntrarChat.disabled = false;
        btnEntrarChat.textContent = txtAnt;
      }
    }

    perfil.nome = nomeFinal;
    perfil.arroba = arrobaLimpo;
    perfil.editado = true;
    salvarPerfil(perfil);
    atualizarPlacaLocal();
    renderListaOnline(ultimaListaPlayers);
    mostrarPerfil = false;
    sincronizarVisibilidadeUI();
    dispararSyncRapido();
    if (morCan && MUNDO && typeof MUNDO.irParaArroba === "function") {
      MUNDO.irParaArroba(morCan.h, true);
    } else if (arrobaLimpo && MUNDO && typeof MUNDO.avisa === "function") {
      MUNDO.avisa("👋 Perfil @" + arrobaLimpo + " ativo! (Dica: adicione um PIN de 4 números para salvar na nuvem)");
    }
    if (abaAtiva === "chat" && !minimizado) inputChat.focus();
  });

  inputChat.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      inputChat.blur();
    }
  });

  inputApelido.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      inputApelido.blur();
    }
  });

  inputArroba.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      inputArroba.blur();
    }
  });

  window.CARAGUA_ABRIR_CHAT = function () {
    minimizado = false;
    abaAtiva = "chat";
    naoLidas = 0;
    sincronizarVisibilidadeUI();
    agendarProximoPoll();
    rolarChatParaFim();
    inputChat.focus();
  };

  sincronizarVisibilidadeUI();
  renderListaOnline([]);

  // ---------- Rede (api/chat.php) + Fallback BroadcastChannel ----------
  let modoLocal = false;
  let bc = null;
  const peersLocais = new Map();
  let seqLocal = 0;
  let seqBallLocal = 0;
  let syncEmCurso = false;
  let enviando = false;
  let pollTimer = 0;
  let syncRapidoTimer = 0;

  function montarPlayerPayload() {
    const estLocal = MUNDO && typeof MUNDO.getEstadoLocal === "function"
      ? MUNDO.getEstadoLocal()
      : { x: 0, z: 28, ry: Math.PI, andando: 0, estilo: { fem: false, pele: 0xf2c29b, cabelo: 0x5c3317, camisa: 0x1c7ed6, calca: 0x2b3a55, sapato: 0x1d1d1d } };
    const e = estLocal.estilo || {};
    const ryBruto = Number.isFinite(Number(estLocal.ry)) ? Number(estLocal.ry) : Math.PI;
    const ryNorm = +Math.atan2(Math.sin(ryBruto), Math.cos(ryBruto)).toFixed(3);

    const pe = MUNDO && typeof MUNDO.getPuloEmote === "function" ? MUNDO.getPuloEmote() : null;
    const jumpVal = pe && Number.isFinite(Number(pe.jump))
      ? +Math.max(0, Math.min(6, Number(pe.jump))).toFixed(2)
      : +Math.max(0, Math.min(6, Number(estadoInteracao.jump) || 0)).toFixed(2);
    const emoteVal = limparEmote((pe && pe.emote) || estadoInteracao.emote || "");
    const creatorKey = lerCreatorKeyLocal();

    const payload = {
      nome: perfil.nome,
      arroba: perfil.arroba,
      x: Number.isFinite(Number(estLocal.x)) ? Number(estLocal.x) : 0,
      z: Number.isFinite(Number(estLocal.z)) ? Number(estLocal.z) : 28,
      ry: ryNorm,
      andando: estLocal.andando ? 1 : 0,
      fem: e.fem ? 1 : 0,
      pele: corIntSegura(e.pele, 0xf2c29b),
      cabelo: corIntSegura(e.cabelo, 0x5c3317),
      camisa: corIntSegura(e.camisa, 0x1c7ed6),
      calca: corIntSegura(e.calca, 0x2b3a55),
      sapato: corIntSegura(e.sapato, 0x1d1d1d),
      jump: jumpVal,
      emote: emoteVal,
      car_type: limparCarType(estadoInteracao.car_type),
      ride_of: limparRideOf(estadoInteracao.ride_of),
      room: limparRoom(estadoInteracao.room),
      profissao: limparProfissao(estadoInteracao.profissao),
      badge: limparBadge(estadoInteracao.badge)
    };

    if (creatorKey) {
      payload.creator_key = creatorKey;
    }
    return payload;
  }

  function proximoIdLocal() {
    seqLocal = (seqLocal + 1) % 1000;
    return Date.now() * 1000 + seqLocal;
  }

  function atualizarDePeersLocais() {
    const agora = Date.now();
    const lista = [];
    peersLocais.forEach((p, key) => {
      if (agora - p.seenAt > 22000) {
        peersLocais.delete(key);
        return;
      }
      lista.push(p.dados);
    });
    ultimaListaPlayers = lista;
    sincronizarRemotos3D(lista);
    renderListaOnline(lista);
  }

  function ativarFallbackLocal() {
    if (modoLocal) return;
    modoLocal = true;
    cargaInicialFeita = true;

    if (typeof BroadcastChannel === "function") {
      try {
        bc = new BroadcastChannel(CANAL_LOCAL);
        bc.addEventListener("message", ev => {
          const d = ev && ev.data;
          if (!d || d.pid === perfil.pid) return;
          if (d.tipo === "hello" || d.tipo === "sync") {
            if (d.player && d.pid) {
              peersLocais.set(d.pid, {
                seenAt: Date.now(),
                dados: Object.assign({ pid: d.pid }, d.player)
              });
              atualizarDePeersLocais();
              if (d.tipo === "hello" && bc) {
                try {
                  bc.postMessage({ tipo: "sync", pid: perfil.pid, player: montarPlayerPayload() });
                } catch (err) { /* noop */ }
              }
            }
          } else if (d.tipo === "leave") {
            peersLocais.delete(d.pid);
            atualizarDePeersLocais();
          } else if (d.tipo === "chat" && d.msg) {
            receberMensagens([d.msg]);
          } else if (d.tipo === "ball" && d.ball) {
            dispararBolaServidor(d.ball);
          }
        });
        bc.postMessage({ tipo: "hello", pid: perfil.pid, player: montarPlayerPayload() });
      } catch (e) {
        bc = null;
      }
    }
    atualizarDePeersLocais();
    agendarProximoPoll();
  }

  function urlChatComSala(queryBase) {
    const sala = limparRoom(estadoInteracao.room);
    if (!sala) return queryBase ? (ENDPOINT_CHAT + "?" + queryBase) : ENDPOINT_CHAT;
    const prefixo = queryBase ? (ENDPOINT_CHAT + "?" + queryBase + "&room=") : (ENDPOINT_CHAT + "?action=state&room=");
    return prefixo + encodeURIComponent(sala);
  }

  async function requisitarApi(payload) {
    const sala = limparRoom(estadoInteracao.room);
    const url = sala
      ? (ENDPOINT_CHAT + "?room=" + encodeURIComponent(sala))
      : ENDPOINT_CHAT;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      credentials: "same-origin"
    });
    const raw = await res.text();
    let json;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      throw new Error("NON_JSON");
    }
    if (!json || typeof json !== "object") throw new Error("NON_JSON");
    return { status: res.status, json };
  }

  async function requisitarStateGet() {
    const url = urlChatComSala(
      "action=state&since=" + encodeURIComponent(String(ultimoId)) + "&pid=" + encodeURIComponent(perfil.pid)
    );
    const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
    const json = await res.json();
    if (json && json.ok) aplicarEstadoServidor(json, !cargaInicialFeita, ++seqReq);
    return json;
  }

  async function executarSync() {
    if (modoLocal) {
      if (bc) {
        try {
          bc.postMessage({ tipo: "sync", pid: perfil.pid, player: montarPlayerPayload() });
        } catch (e) { /* noop */ }
      }
      atualizarDePeersLocais();
      return;
    }

    if (syncEmCurso) return;
    syncEmCurso = true;
    const ehInicial = !cargaInicialFeita;
    const reqNum = ++seqReq;
    const playerPayload = montarPlayerPayload();
    const sala = limparRoom(estadoInteracao.room);
    const body = {
      action: "sync",
      pid: perfil.pid,
      token: perfil.token,
      since: ultimoId,
      room: sala,
      player: playerPayload
    };
    if (playerPayload.creator_key) {
      body.creator_key = playerPayload.creator_key;
    }
    try {
      const { json } = await requisitarApi(body);
      if (json.ok) {
        aplicarEstadoServidor(json, ehInicial, reqNum);
      }
    } catch (err) {
      ativarFallbackLocal();
    } finally {
      syncEmCurso = false;
    }
  }

  // Polling adaptativo: 1100ms com remotos ativos/chat aberto, 2200ms padrão com remotos, 8000ms sozinho (0 remotos) ou aba oculta
  function intervaloAtual() {
    if (document.visibilityState === "hidden") return 8000;
    const qtdRemotos = remotos.size;
    if (ultimoPoliciaServidor && (ultimoPoliciaServidor.status === "active" || ultimoPoliciaServidor.status === "prealert")) {
      return 1500;
    }
    if (qtdRemotos === 0) return 8000;
    if (!minimizado) return 1100;

    let algumAtivo = false;
    remotos.forEach(r => {
      if (
        r.andando === 1 ||
        r.alvoJump > 0.05 ||
        r.emote !== "" ||
        r.car_type !== "" ||
        r.ride_of !== "" ||
        Math.hypot(r.alvoX - r.gx, r.alvoZ - r.gz) > 0.2
      ) {
        algumAtivo = true;
      }
    });
    return algumAtivo ? 1100 : 2200;
  }

  function agendarProximoPoll() {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(async () => {
      await executarSync();
      agendarProximoPoll();
    }, intervaloAtual());
  }

  function dispararSyncRapido() {
    clearTimeout(syncRapidoTimer);
    syncRapidoTimer = setTimeout(() => {
      executarSync();
    }, 90);
  }

  formChat.addEventListener("submit", async e => {
    e.preventDefault();
    if (enviando) return;
    const texto = limparTextoChat(inputChat.value);
    if (!texto) {
      mostrarErro("Digite uma mensagem.");
      return;
    }
    mostrarErro("");

    const salaAtual = limparRoom(estadoInteracao.room);

    if (modoLocal) {
      const p = montarPlayerPayload();
      const msg = {
        id: proximoIdLocal(),
        pid: perfil.pid,
        nome: perfil.nome,
        arroba: perfil.arroba,
        cor: intParaHex(p.camisa),
        texto,
        x: p.x,
        z: p.z,
        room: salaAtual,
        ts: Math.floor(Date.now() / 1000)
      };
      inputChat.value = "";
      receberMensagens([msg]);
      if (bc) {
        try {
          bc.postMessage({ tipo: "chat", pid: perfil.pid, msg });
        } catch (err) { /* noop */ }
      }
      return;
    }

    enviando = true;
    btnEnviar.disabled = true;
    const tinhaCargaAntes = cargaInicialFeita;
    const reqNum = ++seqReq;
    const playerPayload = montarPlayerPayload();
    const sendBody = {
      action: "send",
      pid: perfil.pid,
      token: perfil.token,
      since: ultimoId,
      room: salaAtual,
      texto,
      player: playerPayload
    };
    if (playerPayload.creator_key) {
      sendBody.creator_key = playerPayload.creator_key;
    }
    try {
      const { json } = await requisitarApi(sendBody);
      if (json.ok) {
        inputChat.value = "";
        aplicarEstadoServidor(json, !tinhaCargaAntes, reqNum);
        if (!tinhaCargaAntes) {
          mostrarBalaoLocal(texto);
        }
        agendarProximoPoll();
      } else {
        mostrarErro(json.erro || "Não foi possível enviar.");
      }
    } catch (err) {
      ativarFallbackLocal();
      const p = montarPlayerPayload();
      const msg = {
        id: proximoIdLocal(),
        pid: perfil.pid,
        nome: perfil.nome,
        arroba: perfil.arroba,
        cor: intParaHex(p.camisa),
        texto,
        x: p.x,
        z: p.z,
        room: salaAtual,
        ts: Math.floor(Date.now() / 1000)
      };
      inputChat.value = "";
      receberMensagens([msg]);
      if (bc) {
        try {
          bc.postMessage({ tipo: "chat", pid: perfil.pid, msg });
        } catch (err2) { /* noop */ }
      }
    } finally {
      enviando = false;
      btnEnviar.disabled = false;
    }
  });

  // ---------- Sincronização da Bola de Futebol ----------
  async function enviarChuteBola(ballState) {
    if (!ballState || typeof ballState !== "object") return null;
    const payloadBola = {
      x: Number.isFinite(Number(ballState.x)) ? +Number(ballState.x).toFixed(2) : 0,
      z: Number.isFinite(Number(ballState.z)) ? +Number(ballState.z).toFixed(2) : 0,
      vx: Number.isFinite(Number(ballState.vx)) ? +Math.max(-42, Math.min(42, Number(ballState.vx))).toFixed(2) : 0,
      vz: Number.isFinite(Number(ballState.vz)) ? +Math.max(-42, Math.min(42, Number(ballState.vz))).toFixed(2) : 0,
      gol: ["a", "b"].includes(ballState.gol) ? ballState.gol : "",
      score_a: Math.max(0, Math.min(999, Math.round(Number(ballState.score_a) || 0))),
      score_b: Math.max(0, Math.min(999, Math.round(Number(ballState.score_b) || 0)))
    };

    if (modoLocal) {
      const localBall = Object.assign({}, payloadBola, {
        kicker: perfil.pid,
        seq: (ultimoBallServidor && ultimoBallServidor.seq ? ultimoBallServidor.seq : seqBallLocal) + 1,
        ts: Date.now()
      });
      seqBallLocal = localBall.seq;
      dispararBolaServidor(localBall);
      if (bc) {
        try {
          bc.postMessage({ tipo: "ball", pid: perfil.pid, ball: localBall });
        } catch (e) { /* noop */ }
      }
      return localBall;
    }

    try {
      const { json } = await requisitarApi({
        action: "kick",
        pid: perfil.pid,
        token: perfil.token,
        x: payloadBola.x,
        z: payloadBola.z,
        vx: payloadBola.vx,
        vz: payloadBola.vz,
        gol: payloadBola.gol,
        score_a: payloadBola.score_a,
        score_b: payloadBola.score_b,
        ball: payloadBola
      });
      if (json && json.ok && json.ball) {
        dispararBolaServidor(json.ball);
        return json.ball;
      }
    } catch (e) {
      ativarFallbackLocal();
    }
    return null;
  }

  async function enviarCapturaPolicia(capData) {
    if (!capData || typeof capData !== "object") return null;
    if (modoLocal) return { ok: true, local: true };
    try {
      const { json } = await requisitarApi({
        action: "capture_thief",
        pid: perfil.pid,
        token: perfil.token,
        round_id: String(capData.round_id || ""),
        npc_id: Number(capData.npc_id),
        tier: Number(capData.tier) || 1,
        partner_pid: String(capData.partner_pid || ""),
        nome: perfil.nome,
        arroba: perfil.arroba
      });
      if (json && json.policia_event) {
        dispararPoliciaServidor(json.policia_event, json.wallet || ultimoWalletServidor);
      }
      return json || null;
    } catch (e) {
      return null;
    }
  }

  async function enviarJoinPolicia() {
    if (modoLocal) {
      return {
        ok: true,
        local: true,
        me: { team: "policia", hp: 100, max_hp: 100, lives: 5, weapon: "base", jailed_until: 0 },
        wallet: ultimoWalletServidor || { coins: 300, weapons: ["base"], equipped_weapon: "base", bonus_lives: 0 }
      };
    }
    try {
      const { json } = await requisitarApi({
        action: "policia_join",
        pid: perfil.pid,
        token: perfil.token,
        nome: perfil.nome,
        arroba: perfil.arroba
      });
      if (json && (json.policia_event || json.wallet)) {
        dispararPoliciaServidor(json.policia_event || ultimoPoliciaServidor, json.wallet || ultimoWalletServidor);
      }
      return json || null;
    } catch (e) {
      return null;
    }
  }

  async function enviarTiroPolicia(fireData) {
    if (!fireData || typeof fireData !== "object") return null;
    if (modoLocal) return { ok: true, local: true };
    try {
      const { json } = await requisitarApi(Object.assign({
        action: "policia_fire",
        pid: perfil.pid,
        token: perfil.token,
        nome: perfil.nome,
        arroba: perfil.arroba
      }, fireData));
      if (json && (json.policia_event || json.wallet)) {
        dispararPoliciaServidor(json.policia_event || ultimoPoliciaServidor, json.wallet || ultimoWalletServidor);
      }
      return json || null;
    } catch (e) {
      return null;
    }
  }

  async function enviarCompraPolicia(op, extra) {
    if (!op) return null;
    if (modoLocal) return { ok: false, erro: "Disponível apenas conectado no servidor online." };
    try {
      const { json } = await requisitarApi(Object.assign({
        action: "policia_shop",
        op: String(op),
        pid: perfil.pid,
        token: perfil.token,
        nome: perfil.nome,
        arroba: perfil.arroba
      }, extra || {}));
      if (json && (json.policia_event || json.wallet)) {
        dispararPoliciaServidor(json.policia_event || ultimoPoliciaServidor, json.wallet || ultimoWalletServidor);
      }
      return json || null;
    } catch (e) {
      return null;
    }
  }

  // ---------- API Pública window.CARAGUA_ONLINE ----------
  function setEstadoInteracao(patch) {
    if (!patch || typeof patch !== "object") return getEstadoInteracao();
    let mudouVisualPlaca = false;
    let mudouSala = false;
    let mudouRede = false;

    if (patch.creator_key !== undefined) {
      try {
        if (patch.creator_key) {
          localStorage.setItem(CHAVE_CREATOR_KEY, String(patch.creator_key).trim());
        } else {
          localStorage.removeItem(CHAVE_CREATOR_KEY);
        }
      } catch (e) { /* noop */ }
      mudouRede = true;
    }

    if (patch.jump !== undefined) {
      const j = Number(patch.jump);
      estadoInteracao.jump = Number.isFinite(j) ? Math.max(0, Math.min(6, j)) : 0;
      mudouRede = true;
    }
    if (patch.emote !== undefined) {
      const em = limparEmote(patch.emote);
      if (em !== estadoInteracao.emote) {
        estadoInteracao.emote = em;
        mudouRede = true;
      }
    }
    if (patch.car_type !== undefined) {
      const ct = limparCarType(patch.car_type);
      if (ct !== estadoInteracao.car_type) {
        estadoInteracao.car_type = ct;
        mudouRede = true;
      }
    }
    if (patch.ride_of !== undefined) {
      const ro = limparRideOf(patch.ride_of);
      if (ro !== estadoInteracao.ride_of) {
        estadoInteracao.ride_of = ro;
        mudouRede = true;
      }
    }
    if (patch.room !== undefined) {
      const rm = limparRoom(patch.room);
      if (rm !== estadoInteracao.room) {
        estadoInteracao.room = rm;
        mudouSala = true;
        mudouRede = true;
      }
    }
    if (patch.profissao !== undefined) {
      const pr = limparProfissao(patch.profissao);
      if (pr !== estadoInteracao.profissao) {
        estadoInteracao.profissao = pr;
        perfil.profissao = pr;
        salvarPerfil(perfil);
        mudouVisualPlaca = true;
        mudouRede = true;
      }
    }
    if (patch.badge !== undefined) {
      const bd = limparBadge(patch.badge);
      if (bd !== estadoInteracao.badge) {
        estadoInteracao.badge = bd;
        perfil.badge = bd;
        salvarPerfil(perfil);
        mudouVisualPlaca = true;
        mudouRede = true;
      }
    }

    if (mudouVisualPlaca) {
      atualizarPlacaLocal();
      renderListaOnline(ultimaListaPlayers);
    }

    if (mudouSala) {
      remotos.forEach(r => {
        r.g.visible = (r.room || "") === (estadoInteracao.room || "");
      });
      atualizarMinimapaOutros();
      renderListaOnline(ultimaListaPlayers);
      sincronizarVisibilidadeUI();
    }

    if (mudouRede) {
      dispararSyncRapido();
    }

    return getEstadoInteracao();
  }

  function getEstadoInteracao() {
    const pe = MUNDO && typeof MUNDO.getPuloEmote === "function" ? MUNDO.getPuloEmote() : null;
    return {
      jump: pe && Number.isFinite(Number(pe.jump)) ? Number(pe.jump) : estadoInteracao.jump,
      emote: (pe && pe.emote) || estadoInteracao.emote,
      car_type: estadoInteracao.car_type,
      ride_of: estadoInteracao.ride_of,
      room: estadoInteracao.room,
      profissao: estadoInteracao.profissao,
      badge: estadoInteracao.badge,
      creator_key: lerCreatorKeyLocal()
    };
  }

  function atualizarPerfilExterno(patch) {
    if (!patch || typeof patch !== "object") return;
    if (patch.nome !== undefined) {
      const fallback = "Visitante #" + perfil.pid.slice(-3);
      perfil.nome = limparNome(patch.nome, fallback);
      perfil.editado = true;
      inputApelido.value = perfil.nome;
    }
    if (patch.arroba !== undefined) {
      perfil.arroba = limparArroba(patch.arroba);
      perfil.editado = true;
      inputArroba.value = perfil.arroba ? "@" + perfil.arroba : "";
    }
    if (patch.camisa !== undefined && Number.isFinite(Number(patch.camisa))) {
      perfil.camisa = corIntSegura(patch.camisa, 0x1c7ed6);
      if (MUNDO && typeof MUNDO.setEstiloLocal === "function") {
        MUNDO.setEstiloLocal({ camisa: perfil.camisa });
      }
      atualizarBotoesCor();
    }
    salvarPerfil(perfil);
    setEstadoInteracao(patch);
    atualizarPlacaLocal();
    renderListaOnline(ultimaListaPlayers);
    dispararSyncRapido();
  }

  function getPlayersRemotos() {
    const out = [];
    remotos.forEach(r => {
      out.push({
        pid: r.pid,
        nome: r.nome,
        arroba: r.arroba,
        x: r.gx,
        z: r.gz,
        ry: r.g.rotation.y,
        andando: r.andando,
        jump: r.alvoJump,
        emote: r.emote,
        car_type: r.car_type,
        ride_of: r.ride_of,
        room: r.room,
        profissao: r.profissao,
        badge: r.badge,
        grupo: r.g
      });
    });
    return out;
  }

  function abrirLoginArroba(arrobaPrefill) {
    minimizado = false;
    mostrarPerfil = true;
    if (arrobaPrefill && typeof arrobaPrefill === "string") {
      inputArroba.value = "@" + limparArroba(arrobaPrefill);
    } else if (perfil.arroba) {
      inputArroba.value = "@" + perfil.arroba;
    }
    inputApelido.value = (perfil.editado && !perfil.nome.startsWith("Visitante")) ? perfil.nome : "";
    atualizarStatusMoradorUI();
    atualizarBotoesCor();
    sincronizarVisibilidadeUI();
    setTimeout(() => {
      if (inputArroba.value.trim().length > 1) inputPin.focus();
      else inputArroba.focus();
    }, 60);
  }

  function sugerirArrobaHash(arrobaHash, tituloMorador) {
    const limpo = limparArroba(arrobaHash);
    if (!limpo) return;
    if (perfil.verificadoPin && perfil.arroba.toLowerCase() === limpo.toLowerCase()) return;
    if (!perfil.arroba) {
      abrirLoginArroba(limpo);
      if (MUNDO && typeof MUNDO.avisa === "function") {
        MUNDO.avisa("🪪 Você é @" + limpo + "? Digite um PIN de 4 números para entrar com seu morador!");
      }
    }
  }

  window.CARAGUA_ONLINE = {
    getPid: () => perfil.pid,
    getPerfil: () => ({
      pid: perfil.pid,
      nome: perfil.nome,
      arroba: perfil.arroba,
      camisa: perfil.camisa,
      editado: perfil.editado,
      verificadoPin: !!perfil.verificadoPin,
      profissao: estadoInteracao.profissao,
      badge: estadoInteracao.badge
    }),
    abrirLoginArroba,
    sugerirArrobaHash,
    atualizarPerfilExterno,
    setEstadoInteracao,
    getEstadoInteracao,
    getPlayersRemotos,
    enviarChuteBola,
    enviarCapturaPolicia,
    enviarJoinPolicia,
    enviarTiroPolicia,
    enviarCompraPolicia,
    getWalletServidor: () => ultimoWalletServidor,
    requisitarStateGet,
    criarVeiculoVoxel,
    onBolaServidor: cb => {
      if (typeof cb !== "function") return () => {};
      bolaListeners.add(cb);
      if (ultimoBallServidor) {
        try { cb(ultimoBallServidor); } catch (e) { /* noop */ }
      }
      return () => bolaListeners.delete(cb);
    },
    onPoliciaServidor: cb => {
      if (typeof cb !== "function") return () => {};
      policiaListeners.add(cb);
      if (ultimoPoliciaServidor) {
        try { cb(ultimoPoliciaServidor, ultimoWalletServidor); } catch (e) { /* noop */ }
      }
      return () => policiaListeners.delete(cb);
    },
    onSomMensagem: cb => {
      if (typeof cb !== "function") return () => {};
      somMensagemListeners.add(cb);
      return () => somMensagemListeners.delete(cb);
    }
  };

  document.addEventListener("visibilitychange", () => {
    agendarProximoPoll();
    if (document.visibilityState === "visible") {
      executarSync();
    }
  });

  window.addEventListener("pagehide", () => {
    if (modoLocal) {
      if (bc) {
        try {
          bc.postMessage({ tipo: "leave", pid: perfil.pid });
        } catch (e) { /* noop */ }
      }
      return;
    }
    if (navigator && typeof navigator.sendBeacon === "function") {
      try {
        const blob = new Blob([JSON.stringify({ action: "leave", pid: perfil.pid, token: perfil.token })], { type: "application/json" });
        navigator.sendBeacon(ENDPOINT_CHAT, blob);
      } catch (e) { /* noop */ }
    }
  });

  // Inicia sincronização imediatamente
  executarSync().then(agendarProximoPoll);
})();
