/* Caraguá Pixel · Evento Noturno Polícia e Ladrão (21h BRT): Fuga da Cadeia 79, Viaturas, Giroflex, Radar e Prisões */
(function () {
  "use strict";

  const MUNDO = window.CARAGUA_MUNDO || null;
  const HOOKS = MUNDO && MUNDO.policiaHooks ? MUNDO.policiaHooks : null;
  const TEM_3D = !!(MUNDO && HOOKS && MUNDO.scene && MUNDO.jog && typeof THREE !== "undefined");

  function onlineApi() {
    return window.CARAGUA_ONLINE || null;
  }

  function interApi() {
    return window.CARAGUA_INTERACOES || null;
  }

  function avisa(msg) {
    if (MUNDO && typeof MUNDO.avisa === "function") MUNDO.avisa(msg);
  }

  // PRNG determinístico para todos os jogadores spawnarem os mesmos ladrões na mesma rodada
  function mulberry32(seed) {
    let a = (Number(seed) || 792100) >>> 0;
    return function () {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function formatarMmSs(segs) {
    const s = Math.max(0, Math.floor(Number(segs) || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  // ---------- Sprites 3D Auxiliares ----------
  function criarPlacaTexto3D(larg, alt, escala, texto, opts) {
    const cv = document.createElement("canvas");
    cv.width = larg;
    cv.height = alt;
    const ctx = cv.getContext("2d");
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const matSp = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sp = new THREE.Sprite(matSp);
    sp.scale.set(larg * escala, alt * escala, 1);

    function desenhar(txt, o) {
      const op = o || opts || {};
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.font = op.fonte || '800 22px "Nunito Sans", "Segoe UI", sans-serif';
      const w = Math.min(cv.width - 20, Math.max(110, ctx.measureText(txt).width + 32));
      const h = op.alto || 48;
      const x0 = Math.floor((cv.width - w) / 2);
      const y0 = Math.floor((cv.height - h) / 2);
      ctx.fillStyle = "rgba(11, 17, 32, 0.9)";
      ctx.fillRect(x0 + 3, y0 + 3, w, h);
      ctx.fillStyle = op.fundo || "#1d4ed8";
      ctx.fillRect(x0, y0, w, h);
      ctx.lineWidth = 3;
      ctx.strokeStyle = op.borda || "#fde047";
      ctx.strokeRect(x0 + 1.5, y0 + 1.5, w - 3, h - 3);
      ctx.fillStyle = op.cor || "#fffaf0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, cv.width / 2, y0 + h / 2 + 1);
      tex.needsUpdate = true;
    }

    desenhar(texto, opts);
    return { sp, tex, mat: matSp, desenhar };
  }

  // ---------- Estado do Evento ----------
  let servidorState = null;
  let walletState = { coins: 300, weapons: ["base"], equipped_weapon: "base", bonus_lives: 0 };
  let roundIdAtivo = "";
  let ultimoStatus = "idle";
  let serverDriftMs = 0; // (server_now * 1000) - Date.now()
  let modoNoiteAntesDoEvento = null;
  let ultimoTickSeg = -1;
  let ultimoXerifeChave = "";
  let joinSolicitadoRound = "";
  let estavaPresoLocal = false;
  let modalLojaAberto = false;
  let ultimoTiroMs = 0;
  let relogioSobrevivencia = 0;
  let avisoProxLojinhaMs = 0;
  let avisoLimiteCelaMs = 0;

  const ladrões = [];
  const localCapturedIds = new Set();
  const pendingCaptureIds = new Set();
  const seenShotIds = new Set();
  const projeteis = [];

  // Viaturas estacionadas de patrulha + Lojinha de Arminhas no canto + holofote da Cadeia + placa do Xerife na Prefeitura
  const viaturasCenario = [];
  let lojinhaGrupo = null;
  let lojinhaPos = null;
  let cadeiaAlarmeLuz = null;
  let placaXerifePrefeitura = null;

  function obterMeuPid() {
    const on = onlineApi();
    return on && typeof on.getPid === "function" ? on.getPid() : "";
  }

  function obterMeuPvp() {
    if (!servidorState || !servidorState.pvp || typeof servidorState.pvp !== "object") return null;
    const pid = obterMeuPid();
    return pid && servidorState.pvp[pid] ? servidorState.pvp[pid] : null;
  }

  function isJogadorPresoAgora(me) {
    if (!me) return false;
    const estAgoraTs = Math.floor((Date.now() + serverDriftMs) / 1000);
    return (Number(me.lives) || 0) <= 0 || (Number(me.jailed_until) || 0) > estAgoraTs;
  }

  function lojaApi() {
    return window.CARAGUA_LOJA || null;
  }

  function precoEvento(id, padrao) {
    const lj = lojaApi();
    const prices = lj && typeof lj.getPrices === "function" ? lj.getPrices() : null;
    const n = prices && Number(prices[id]);
    const val = Number.isFinite(n) && n > 0 ? n : padrao;
    return "R$ " + val.toFixed(2).replace(".", ",");
  }

  // ---------- Rede de Ruas Real da Cidade ----------
  let pontosRua = null;
  function garantirRedeRuas() {
    if (pontosRua || !HOOKS || !HOOKS.grid) return pontosRua || [];
    const gr = HOOKS.grid;
    const vxList = [gr.XMIN];
    for (let c = 0; c < gr.COLS; c++) {
      vxList.push(gr.XC(c) + gr.PASSO_X / 2);
    }
    const hzList = [28]; // Avenida da orla/praia
    for (let r = 0; r < gr.ROWS; r++) {
      hzList.push(gr.ZC(r) - 16);
    }
    const pts = [];
    for (let i = 0; i < vxList.length; i++) {
      for (let j = 0; j < hzList.length; j++) {
        const px = vxList[i];
        const pz = hzList[j];
        if (!HOOKS.colidePonto(px, pz, 0.85)) {
          pts.push({ x: px, z: pz, isOrla: Math.abs(pz - 28) < 2 });
        }
      }
    }
    // Extras icônicos (praia orla livre + boulevard + estrada da cadeia)
    pts.push(
      { x: 0, z: 36, isOrla: true },
      { x: -60, z: 38, isOrla: true },
      { x: 65, z: 38, isOrla: true },
      { x: gr.XMAX + 32, z: HOOKS.cadPos.z, isOrla: false }
    );
    pontosRua = pts;
    return pontosRua;
  }

  function liberarGrupo3D(grp) {
    if (!grp) return;
    if (MUNDO && MUNDO.scene) MUNDO.scene.remove(grp);
    if (typeof grp.traverse === "function") {
      grp.traverse(ch => {
        if (ch.geometry && typeof ch.geometry.dispose === "function") ch.geometry.dispose();
        if (ch.material && typeof ch.material.dispose === "function" && ch.material.map) {
          ch.material.map.dispose();
        }
      });
    }
  }

  function limparCenaEvento() {
    while (ladrões.length > 0) {
      const l = ladrões.pop();
      if (l && l.g) liberarGrupo3D(l.g);
      if (l && l.placa && l.placa.tex) l.placa.tex.dispose();
    }
    while (viaturasCenario.length > 0) {
      const v = viaturasCenario.pop();
      if (v && v.g) liberarGrupo3D(v.g);
    }
    if (lojinhaGrupo) {
      liberarGrupo3D(lojinhaGrupo);
      lojinhaGrupo = null;
      lojinhaPos = null;
    }
    while (projeteis.length > 0) {
      const pr = projeteis.pop();
      if (pr && pr.g) liberarGrupo3D(pr.g);
    }
    seenShotIds.clear();
    if (cadeiaAlarmeLuz && MUNDO && MUNDO.scene) {
      MUNDO.scene.remove(cadeiaAlarmeLuz);
      cadeiaAlarmeLuz = null;
    }
    estavaPresoLocal = false;
    fecharModalLojaPolicia();
    window.CARAGUA_EVENTO_MAPA = [];
  }

  function criarLojinhaCanto3D() {
    if (!TEM_3D || lojinhaGrupo || !HOOKS || !HOOKS.cadPos) return;
    const lx = HOOKS.cadPos.x - 46;
    const lz = HOOKS.cadPos.z - 14;
    const ly = MUNDO.altura(lx, lz);
    const g = new THREE.Group();
    const mMadeira = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.78 });
    const mBalcao = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.65 });
    const mToldoA = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x083344, roughness: 0.5 });
    const mToldoB = new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0x422006, roughness: 0.5 });
    const mArma = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0c4a6e });

    const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 2.5), mMadeira);
    base.position.set(0, 0.55, 0);
    g.add(base);

    const tampo = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.22, 2.7), mBalcao);
    tampo.position.set(0, 1.18, 0);
    g.add(tampo);

    // Pilares e toldo listrado
    [[-1.9, -1.0], [1.9, -1.0], [-1.9, 1.0], [1.9, 1.0]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.1, 0.24), mMadeira);
      col.position.set(px, 2.2, pz);
      g.add(col);
    });
    for (let i = 0; i < 6; i++) {
      const faixa = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.28, 3.0), i % 2 === 0 ? mToldoA : mToldoB);
      faixa.position.set(-1.9 + i * 0.76, 3.35, 0);
      faixa.rotation.x = 0.14;
      g.add(faixa);
    }

    // Duas arminhas de água em exposição no balcão
    [-0.9, 0.9].forEach(ax => {
      const gun = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.78), mArma);
      gun.position.set(ax, 1.45, 0);
      gun.rotation.y = 0.35;
      g.add(gun);
    });

    const pl = criarPlacaTexto3D(420, 82, 0.0095, "🔫 Lojinha de Arminhas [E]", {
      fundo: "#f97316",
      borda: "#fde047",
      cor: "#fffaf0",
      fonte: '800 20px "Nunito Sans", sans-serif'
    });
    pl.sp.position.set(0, 4.35, 0);
    g.add(pl.sp);

    g.position.set(lx, ly, lz);
    MUNDO.scene.add(g);
    lojinhaGrupo = g;
    lojinhaPos = { x: lx, z: lz };
  }

  function criarCenarioPatrulha() {
    if (!TEM_3D) return;
    criarLojinhaCanto3D();
    if (viaturasCenario.length > 0) return;
    const online = onlineApi();
    const mkCarro = online && typeof online.criarVeiculoVoxel === "function"
      ? online.criarVeiculoVoxel
      : null;

    if (mkCarro) {
      const spots = [
        { x: (HOOKS.prefPos ? HOOKS.prefPos.cx + 19 : 46), z: (HOOKS.prefPos ? HOOKS.prefPos.cz + 15 : 8), ry: Math.PI / 2, nome: "Prefeitura" },
        { x: 12, z: 28.5, ry: -Math.PI / 2, nome: "Orla / Praça" },
        { x: HOOKS.cadPos.x - 42, z: HOOKS.cadPos.z + 3, ry: Math.PI / 2, nome: "Cadeia 79" }
      ];
      spots.forEach(s => {
        const g = mkCarro("viatura");
        g.position.set(s.x, MUNDO.altura(s.x, s.z), s.z);
        g.rotation.y = s.ry;
        const pl = criarPlacaTexto3D(320, 74, 0.0085, "🚓 Viatura [Pegar]", {
          fundo: "#1d4ed8",
          borda: "#fde047",
          cor: "#fffaf0",
          fonte: '800 20px "Nunito Sans", sans-serif'
        });
        pl.sp.position.set(0, 3.1, 0);
        g.add(pl.sp);
        MUNDO.scene.add(g);
        viaturasCenario.push({ g, x: s.x, z: s.z, nome: s.nome });
      });
    }

    // Luz rotativa de alarme vermelho/âmbar na Cadeia 79
    cadeiaAlarmeLuz = new THREE.PointLight(0xff2b2b, 3.5, 42, 1.4);
    cadeiaAlarmeLuz.position.set(HOOKS.cadPos.x - 32, 9.5, HOOKS.cadPos.z);
    MUNDO.scene.add(cadeiaAlarmeLuz);
  }

  function obterPatioCadeiaBounds() {
    const patio = HOOKS && HOOKS.cadeiaBounds && HOOKS.cadeiaBounds.patio ? HOOKS.cadeiaBounds.patio : null;
    const cad = (HOOKS && HOOKS.cadPos) ? HOOKS.cadPos : { x: 342, z: -69 };
    const portaoX = (HOOKS && HOOKS.cadeiaBounds && Number.isFinite(HOOKS.cadeiaBounds.portaoX))
      ? HOOKS.cadeiaBounds.portaoX
      : (cad.x - 32);
    const portaoZ = (HOOKS && HOOKS.cadeiaBounds && Number.isFinite(HOOKS.cadeiaBounds.portaoZ))
      ? HOOKS.cadeiaBounds.portaoZ
      : cad.z;
    return {
      x0: patio ? patio.x0 : (cad.x - 28),
      x1: patio ? patio.x1 : (cad.x + 28),
      z0: patio ? patio.z0 : (cad.z - 18),
      z1: patio ? patio.z1 : (cad.z + 26),
      portaoX,
      portaoZ,
      cad
    };
  }

  function cadeiaPatioPonto(rndFn) {
    const r = typeof rndFn === "function" ? rndFn : Math.random;
    const b = obterPatioCadeiaBounds();
    const xMin = b.x0 + 2;
    const xSpan = Math.max(8, (b.x1 - 2) - xMin);
    const zMin = b.z0 + 2;
    const zSpan = Math.max(8, (b.z1 - 2) - zMin);
    for (let t = 0; t < 8; t++) {
      const px = xMin + r() * xSpan;
      const pz = zMin + r() * zSpan;
      if (!HOOKS || !HOOKS.colidePonto || !HOOKS.colidePonto(px, pz, 0.75)) {
        return { x: px, z: pz };
      }
    }
    return { x: (b.x0 + b.x1) * 0.5, z: (b.z0 + b.z1) * 0.5 };
  }

  function aplicarVisualPresoNpc(l, textoPlaca) {
    if (!l) return;
    if (l.g) l.g.visible = true;
    if (l.mochila) l.mochila.visible = false;
    if (l.halo && l.halo.material) {
      if (l.halo.material.color && typeof l.halo.material.color.setHex === "function") {
        l.halo.material.color.setHex(0xf97316);
      }
      l.halo.material.opacity = 0.28;
    }
    const txt = textoPlaca || "🔒 CADEIA 79";
    if (l.placa && l.ultimoPlacaTxt !== txt) {
      l.ultimoPlacaTxt = txt;
      l.placa.desenhar(txt, {
        fundo: "#9a3412",
        borda: "#fdba74",
        cor: "#fffaf0",
        fonte: '800 18px "Nunito Sans", sans-serif'
      });
    }
  }

  function prenderLadraoNpcLocal(l, serverUntilTs, fromServer) {
    if (!l) return;
    const estAgoraTs = Math.floor((Date.now() + serverDriftMs) / 1000);
    const respawnS = Number(servidorState && servidorState.npc_respawn_s) || 35;
    const jaEstavaPreso = !!l.preso;
    l.preso = true;
    l.capturaLocalMs = fromServer ? 0 : performance.now();
    l.presoAteTs = Number(serverUntilTs) || (estAgoraTs + respawnS);

    if (!jaEstavaPreso) {
      const pt = cadeiaPatioPonto(Math.random);
      const nxt = cadeiaPatioPonto(Math.random);
      l.x = pt.x;
      l.z = pt.z;
      l.alvoX = nxt.x;
      l.alvoZ = nxt.z;
      l.tempoAlvo = 0;
      if (l.g && MUNDO && typeof MUNDO.altura === "function") {
        l.g.position.set(l.x, MUNDO.altura(l.x, l.z), l.z);
      }
    }

    const restS = Math.max(1, l.presoAteTs - estAgoraTs);
    aplicarVisualPresoNpc(l, "🔒 CADEIA " + restS + "s");
  }

  function libertarLadraoNpcLocal(l) {
    if (!l) return;
    l.preso = false;
    l.presoAteTs = 0;
    l.capturaLocalMs = 0;
    if (l.g) l.g.visible = true;
    if (l.mochila) l.mochila.visible = true;
    if (l.halo && l.halo.material) {
      if (l.halo.material.color && typeof l.halo.material.color.setHex === "function") {
        l.halo.material.color.setHex(l.corHalo || 0xef4444);
      }
      l.halo.material.opacity = 0.68;
    }
    if (l.placa && l.rotulo && l.ultimoPlacaTxt !== l.rotulo) {
      l.ultimoPlacaTxt = l.rotulo;
      l.placa.desenhar(l.rotulo, l.placaOpts);
    }
    const bPat = obterPatioCadeiaBounds();
    if (Math.abs(l.x - bPat.cad.x) < 34 && Math.abs(l.z - bPat.cad.z) < 34) {
      l.x = bPat.portaoX - 1;
      l.z = bPat.portaoZ + (Math.random() - 0.5) * 4;
      if (l.g && MUNDO && typeof MUNDO.altura === "function") {
        l.g.position.set(l.x, MUNDO.altura(l.x, l.z), l.z);
      }
    }
    const ruas = garantirRedeRuas();
    if (ruas.length > 0) {
      const dst = ruas[Math.floor(Math.random() * ruas.length)];
      l.alvoX = dst.x;
      l.alvoZ = dst.z;
      l.tempoAlvo = 0;
    }
  }

  function spawnarLadrao(idx, total, rnd, capturedMap, capturedUntilMap) {
    if (!TEM_3D) return;
    const ruas = garantirRedeRuas();
    if (!ruas.length) return;

    // Tier: ~60% Tier 1 (Ligeiro 1pt), ~30% Tier 2 (Piloto em Fuga 3pts), ~10% Tier 3 (Chefão 5pts)
    let tier = 1;
    if (idx === 0 || idx === Math.floor(total / 2)) tier = 3;
    else if (idx % 3 === 1) tier = 2;

    const jaPreso = !!(capturedMap && capturedMap[String(idx)]);
    const camisa = tier === 3 ? 0x111827 : (tier === 2 ? 0x343a40 : 0xf08c00);
    const calca = tier === 3 ? 0x111827 : (tier === 2 ? 0x1e293b : 0xf08c00);
    const est = {
      fem: rnd() < 0.28,
      pele: [0xf2c29b, 0xd99b70, 0x8d5524, 0xf6d5b8][Math.floor(rnd() * 4)],
      cabelo: [0x1d1d1d, 0x4a2c11, 0xb5832d, 0x5c3317][Math.floor(rnd() * 4)],
      camisa,
      calca,
      sapato: 0x111111
    };

    const g = new THREE.Group();
    const vox = HOOKS.bonecoMalhas(est);
    vox.rotation.y = Math.PI;
    g.add(vox);

    // Mochila de saque / malote nas costas (+Z local quando boneco anda para -Z)
    const mochila = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.68, 0.34),
      new THREE.MeshStandardMaterial({
        color: tier === 3 ? 0xfbbf24 : (tier === 2 ? 0x22d3ee : 0x5c3d24),
        emissive: tier === 3 ? 0x553800 : 0x000000,
        roughness: 0.7
      })
    );
    mochila.position.set(0, 1.32, -0.34);
    mochila.castShadow = true;
    mochila.visible = !jaPreso;
    vox.add(mochila);

    // Halo brilhante no chão para facilitar localização à noite
    const corHalo = tier === 3 ? 0xfacc15 : (tier === 2 ? 0x38bdf8 : 0xef4444);
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.68, 1.05, 16).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: jaPreso ? 0xf97316 : corHalo,
        transparent: true,
        opacity: jaPreso ? 0.28 : 0.68,
        side: THREE.DoubleSide
      })
    );
    halo.position.y = 0.08;
    g.add(halo);

    const rotulo = tier === 3
      ? "💰 CHEFÃO (5 pts)"
      : (tier === 2 ? "🏃 FUGA RÁPIDA (3 pts)" : "🚨 LADRÃO (1 pt)");
    const placaOpts = {
      fundo: tier === 3 ? "#b45309" : (tier === 2 ? "#0f172a" : "#b91c1c"),
      borda: tier === 3 ? "#fde047" : "#ffffff",
      cor: "#fffaf0",
      fonte: '800 19px "Nunito Sans", sans-serif'
    };
    const placa = criarPlacaTexto3D(340, 74, 0.0085, rotulo, placaOpts);
    placa.sp.position.set(0, 3.28, 0);
    g.add(placa.sp);

    let sx;
    let sz;
    let alvo0;
    if (jaPreso) {
      const ptP = cadeiaPatioPonto(rnd);
      sx = ptP.x;
      sz = ptP.z;
      alvo0 = cadeiaPatioPonto(rnd);
    } else {
      const startNode = ruas[Math.floor(rnd() * ruas.length)];
      const sairDaCadeia = idx < 6;
      sx = sairDaCadeia
        ? (HOOKS.cadPos.x - 36 - rnd() * 24)
        : startNode.x + (rnd() - 0.5) * 4;
      sz = sairDaCadeia
        ? (HOOKS.cadPos.z + (rnd() - 0.5) * 6)
        : startNode.z + (rnd() - 0.5) * 4;
      alvo0 = ruas[Math.floor(rnd() * ruas.length)];
    }

    g.position.set(sx, MUNDO.altura(sx, sz), sz);
    g.visible = true;
    MUNDO.scene.add(g);

    const estAgoraTs = Math.floor((Date.now() + serverDriftMs) / 1000);
    const respawnS = Number(servidorState && servidorState.npc_respawn_s) || 35;
    const presoAteTs = jaPreso
      ? (Number(capturedUntilMap && capturedUntilMap[String(idx)]) || (estAgoraTs + respawnS))
      : 0;

    const ladraoObj = {
      id: idx,
      tier,
      pts: tier === 3 ? 5 : (tier === 2 ? 3 : 1),
      vel: tier === 3 ? 17.5 : (tier === 2 ? 15.2 : 10.6),
      velPreso: 3.2 + rnd() * 1.1,
      g,
      vox,
      mochila,
      halo,
      corHalo,
      placa,
      rotulo,
      placaOpts,
      ultimoPlacaTxt: rotulo,
      x: sx,
      z: sz,
      ry: rnd() * Math.PI * 2,
      alvoX: alvo0.x,
      alvoZ: alvo0.z,
      passo: rnd() * 6,
      tempoAlvo: 0,
      preso: jaPreso,
      presoAteTs,
      capturaLocalMs: 0
    };
    if (jaPreso) {
      aplicarVisualPresoNpc(ladraoObj, "🔒 CADEIA " + Math.max(1, presoAteTs - estAgoraTs) + "s");
    }
    ladrões.push(ladraoObj);
  }

  function iniciarRodadaLocal(ev) {
    limparCenaEvento();
    localCapturedIds.clear();
    pendingCaptureIds.clear();

    if (ev.captured && typeof ev.captured === "object") {
      Object.keys(ev.captured).forEach(k => localCapturedIds.add(Number(k)));
    }

    const total = Math.max(8, Math.min(28, Number(ev.npc_count) || 18));
    const rnd = mulberry32(ev.seed || 792100);
    for (let i = 0; i < total; i++) {
      spawnarLadrao(i, total, rnd, ev.captured, ev.captured_until);
    }
    criarCenarioPatrulha();

    if (typeof HOOKS.forcarPortaoCadeia === "function") {
      HOOKS.forcarPortaoCadeia(true);
    }
    if (typeof HOOKS.setModoFugaPolicia === "function") {
      HOOKS.setModoFugaPolicia(true);
    }
    if (modoNoiteAntesDoEvento === null && typeof MUNDO.isNoite === "function") {
      modoNoiteAntesDoEvento = !!MUNDO.isNoite();
    }
    if (typeof MUNDO.setNoite === "function") {
      MUNDO.setNoite(true);
    }

    const inter = interApi();
    if (inter && typeof inter.somAlarmeFugaPolicia === "function") {
      inter.somAlarmeFugaPolicia();
    }
    const online = onlineApi();
    if (online && typeof online.enviarJoinPolicia === "function" && ev.round_id && joinSolicitadoRound !== ev.round_id) {
      joinSolicitadoRound = ev.round_id;
      online.enviarJoinPolicia().then(res => {
        if (res && res.me) {
          const prefixo = res.rebalanced ? "⚖️ Times equilibrados! " : "";
          const tMsg = res.me.team === "ladrao"
            ? prefixo + "🕶️ Time LADRÃO (5 vidas)! Use [Q] ou clique nos inimigos para atirar água e fuja da Cadeia 79!"
            : prefixo + "👮 Time POLÍCIA (5 vidas)! Pegue uma viatura, use [Q] na pistolinha de água ou encoste para algemar!";
          avisa(tMsg);
          mostrarToastPolicia(res.me.team === "ladrao" ? "🕶️ SEU TIME: LADRÃO (5 VIDAS)" : "👮 SEU TIME: POLÍCIA (5 VIDAS)");
        }
      });
    } else {
      avisa("🚨 FUGA NA CADEIA 79! Polícia × Ladrão ao vivo: use [Q] para atirar água ou visite a Lojinha no canto!");
    }
  }

  function encerrarRodadaLocal(novoStatus, ev) {
    limparCenaEvento();
    if (HOOKS && typeof HOOKS.forcarPortaoCadeia === "function") {
      HOOKS.forcarPortaoCadeia(false);
    }
    if (HOOKS && typeof HOOKS.setModoFugaPolicia === "function") {
      HOOKS.setModoFugaPolicia(false);
    }
    if (modoNoiteAntesDoEvento !== null && typeof MUNDO.setNoite === "function") {
      MUNDO.setNoite(modoNoiteAntesDoEvento);
      modoNoiteAntesDoEvento = null;
    }

    if (novoStatus === "finished" && ev && ev.winner && ev.winner.nome) {
      const inter = interApi();
      if (inter && typeof inter.somPodiumPolicia === "function") inter.somPodiumPolicia();
      if (inter && typeof inter.lancarConfete3D === "function" && MUNDO && MUNDO.jog) {
        inter.lancarConfete3D(MUNDO.jog.position.x, 1.0, MUNDO.jog.position.z, 32);
      }
      const w = ev.winner;
      const arrobaTxt = w.arroba ? " (@" + w.arroba + ")" : "";
      avisa("🏆 XERIFE DA NOITE: " + w.nome + arrobaTxt + " · " + w.pts + " pts (" + w.captures + " prisões)!");
    }
  }

  function atualizarPlacaXerifePrefeitura(xer) {
    if (!TEM_3D || !HOOKS.prefPos) return;
    const chave = xer && xer.nome ? (xer.nome + "|" + (xer.arroba || "") + "|" + (xer.pts || 0)) : "";
    if (chave === ultimoXerifeChave) return;
    ultimoXerifeChave = chave;

    if (!xer || !xer.nome) {
      if (placaXerifePrefeitura) {
        MUNDO.scene.remove(placaXerifePrefeitura.sp);
        placaXerifePrefeitura.tex.dispose();
        placaXerifePrefeitura.mat.dispose();
        placaXerifePrefeitura = null;
      }
      return;
    }

    const texto = "🚓 XERIFE DA NOITE: " + (xer.arroba ? "@" + xer.arroba : xer.nome) + " (" + (xer.pts || 0) + " pts)";
    if (!placaXerifePrefeitura) {
      placaXerifePrefeitura = criarPlacaTexto3D(640, 84, 0.0115, texto, {
        fundo: "#1d4ed8",
        borda: "#fde047",
        cor: "#fde047",
        alto: 56,
        fonte: '800 22px "Nunito Sans", sans-serif'
      });
      placaXerifePrefeitura.sp.position.set(HOOKS.prefPos.cx, 13.6, HOOKS.prefPos.cz + 6);
      MUNDO.scene.add(placaXerifePrefeitura.sp);
    } else {
      placaXerifePrefeitura.desenhar(texto, {
        fundo: "#1d4ed8",
        borda: "#fde047",
        cor: "#fde047",
        alto: 56,
        fonte: '800 22px "Nunito Sans", sans-serif'
      });
    }
  }

  // ---------- HUD Compacto Central Superior + Barra PvP + Modal Lojinha ----------
  let wrapEl = null;
  let pillEl = null;
  let pvpBarEl = null;
  let placarBoxEl = null;
  let toastEl = null;
  let shopModalEl = null;
  let toastTimer = 0;
  let placarAberto = false;
  let hudMinimizado = false;
  let fabAtirarEl = null;
  let lojaBarObservada = null;
  let shopMsgFeedback = "";
  let ultimoAlgemarAutoMs = 0;

  function sincronizarPosicaoHudMobile() {
    const ehMob = !!(window.matchMedia && window.matchMedia("(max-width: 760px), (pointer: coarse)").matches);
    if (!ehMob) return;
    const bar = document.querySelector("#loja-hud .loja-bar");
    if (bar && typeof bar.getBoundingClientRect === "function") {
      const expandido = bar.classList.contains("menu-mob-aberto") || bar.classList.contains("mob-mais-aberto");
      const r = bar.getBoundingClientRect();
      if (!expandido && r && r.height > 0 && r.height <= 64 && r.bottom > 40 && r.bottom <= 125) {
        document.documentElement.style.setProperty("--policia-mob-top", Math.ceil(r.bottom + 6) + "px");
      }
      if (!lojaBarObservada && typeof ResizeObserver === "function") {
        lojaBarObservada = new ResizeObserver(sincronizarPosicaoHudMobile);
        lojaBarObservada.observe(bar);
      }
    }
  }

  function criarHudPolicia() {
    if (wrapEl) return;
    wrapEl = document.createElement("div");
    wrapEl.id = "policia-hud-wrap";
    wrapEl.hidden = true;

    pillEl = document.createElement("div");
    pillEl.className = "policia-pill";

    pvpBarEl = document.createElement("div");
    pvpBarEl.className = "policia-pvp-bar";
    pvpBarEl.hidden = true;

    placarBoxEl = document.createElement("div");
    placarBoxEl.className = "policia-placar-box";
    placarBoxEl.hidden = true;

    toastEl = document.createElement("div");
    toastEl.className = "policia-cap-toast";
    toastEl.hidden = true;

    wrapEl.append(pillEl, pvpBarEl, placarBoxEl, toastEl);
    document.body.appendChild(wrapEl);

    fabAtirarEl = document.createElement("button");
    fabAtirarEl.id = "policia-fab-atirar";
    fabAtirarEl.type = "button";
    fabAtirarEl.title = "Atirar com pistolinha de água";
    fabAtirarEl.setAttribute("aria-label", "Atirar com pistolinha de água");
    fabAtirarEl.textContent = "🔫";
    fabAtirarEl.hidden = true;
    fabAtirarEl.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      atirarPistolinha(null);
    });
    document.body.appendChild(fabAtirarEl);
    window.addEventListener("resize", sincronizarPosicaoHudMobile, { passive: true });
  }

  function mostrarToastPolicia(msg) {
    criarHudPolicia();
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (toastEl) toastEl.hidden = true;
    }, 2400);
  }

  function fecharModalLojaPolicia() {
    modalLojaAberto = false;
    if (shopModalEl) shopModalEl.hidden = true;
  }

  function abrirModalLojaPolicia(feedbackMsg) {
    modalLojaAberto = true;
    if (feedbackMsg !== undefined) shopMsgFeedback = feedbackMsg;
    renderModalLojaPolicia();
    if (shopModalEl) shopModalEl.hidden = false;
  }

  async function executarCompraMoedas(op, extra) {
    const online = onlineApi();
    if (!online || typeof online.enviarCompraPolicia !== "function") return;
    shopMsgFeedback = "Processando...";
    renderModalLojaPolicia();
    const res = await online.enviarCompraPolicia(op, extra);
    if (res && res.ok) {
      shopMsgFeedback = res.msg || "✅ Concluído!";
      if (res.msg) mostrarToastPolicia(res.msg);
      const inter = interApi();
      if (inter && typeof inter.somPodiumPolicia === "function" && (op === "bail" || op === "life")) {
        inter.somTickPolicia();
      }
      renderModalLojaPolicia();
      renderHudPolicia();
    } else {
      shopMsgFeedback = (res && res.erro) ? res.erro : "Não foi possível concluir agora.";
      renderModalLojaPolicia();
    }
  }

  function iniciarPixEvento(itemId) {
    const lj = lojaApi();
    if (!lj || typeof lj.abrirCheckoutRapido !== "function") {
      avisa("🛒 Abra a Loja VIP abaixo para finalizar seu PIX!");
      return;
    }
    fecharModalLojaPolicia();
    lj.abrirCheckoutRapido(itemId);
  }

  function renderModalLojaPolicia() {
    if (!shopModalEl) {
      shopModalEl = document.createElement("div");
      shopModalEl.id = "policia-shop-modal";
      shopModalEl.hidden = true;
      shopModalEl.addEventListener("click", e => {
        if (e.target === shopModalEl) fecharModalLojaPolicia();
      });
      document.body.appendChild(shopModalEl);
    }
    if (!modalLojaAberto) return;

    const me = obterMeuPvp();
    const estAgoraTs = Math.floor((Date.now() + serverDriftMs) / 1000);
    const vidas = me ? Math.max(0, Number(me.lives) || 0) : 5;
    const preso = isJogadorPresoAgora(me);
    const restCadeia = me && vidas > 0 && (Number(me.jailed_until) || 0) > estAgoraTs
      ? (Number(me.jailed_until) - estAgoraTs)
      : 0;
    const coins = Number(walletState && walletState.coins) || 0;
    const weapons = Array.isArray(walletState && walletState.weapons) ? walletState.weapons : ["base"];
    const eqW = (walletState && walletState.equipped_weapon) || "base";

    shopModalEl.textContent = "";
    const card = document.createElement("div");
    card.className = "policia-shop-card";

    const head = document.createElement("div");
    head.className = "policia-shop-head";
    const h3 = document.createElement("h3");
    h3.textContent = "🔫 Lojinha, Vidas & Fiança · Polícia e Ladrão";
    const btnX = document.createElement("button");
    btnX.type = "button";
    btnX.className = "policia-btn sec";
    btnX.textContent = "✕ Fechar";
    btnX.addEventListener("click", fecharModalLojaPolicia);
    head.append(h3, btnX);
    card.appendChild(head);

    if (preso) {
      const al = document.createElement("div");
      al.className = "policia-shop-alerta";
      al.textContent = vidas <= 0
        ? "🚨 Suas 5 vidas acabaram! Compre +1 Vida (200 moedas) ou garanta o pacote PIX para voltar direto à ação."
        : ("🔒 Você foi nocauteado/preso! Liberação automática em " + restCadeia + "s ou pague Fiança agora para sair na hora.");
      card.appendChild(al);
    }

    const statusBox = document.createElement("div");
    statusBox.className = "policia-shop-status";
    statusBox.innerHTML =
      "<span>🪙 Saldo: <strong>" + coins + " moedas</strong></span>" +
      "<span>❤️ Vidas: <strong>" + vidas + "</strong> · Arma: <strong>" + (eqW === "super" ? "Super Esguicho" : (eqW === "dupla" ? "Jato Duplo" : "Pistolinha Base")) + "</strong></span>";
    card.appendChild(statusBox);

    if (shopMsgFeedback) {
      const fb = document.createElement("div");
      fb.className = "policia-shop-status";
      fb.style.borderColor = "#fde047";
      fb.textContent = shopMsgFeedback;
      card.appendChild(fb);
    }

    const addSecTitle = txt => {
      const d = document.createElement("div");
      d.className = "policia-shop-sec";
      d.textContent = txt;
      card.appendChild(d);
    };

    const makeCard = (titulo, desc, btnTxt, cls, onClick, disabled) => {
      const box = document.createElement("div");
      box.className = "policia-shop-item" + (cls ? " " + cls : "");
      const st = document.createElement("strong");
      st.textContent = titulo;
      const p = document.createElement("p");
      p.textContent = desc;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "policia-btn";
      b.textContent = btnTxt;
      b.disabled = !!disabled;
      b.addEventListener("click", onClick);
      box.append(st, p, b);
      return box;
    };

    addSecTitle("🪙 COMPRAR COM MOEDAS DO JOGO (GANHE PRENDENDO / ATIRANDO)");
    const gridCoins = document.createElement("div");
    gridCoins.className = "policia-shop-grid";

    gridCoins.appendChild(makeCard(
      "🔓 Fiança Imediata",
      "Sai da Cadeia 79 / Hospital na hora com 100% HP.",
      "Pagar 150 🪙",
      "",
      () => executarCompraMoedas("bail"),
      false
    ));
    gridCoins.appendChild(makeCard(
      "❤️ +1 Vida Extra",
      "Adiciona +1 vida na rodada e restaura 100% HP.",
      "Comprar 200 🪙",
      "",
      () => executarCompraMoedas("life"),
      false
    ));
    const temDupla = weapons.includes("dupla");
    gridCoins.appendChild(makeCard(
      "🔫 Pistolinha Jato Duplo",
      "Disparo mais rápido e 28 de dano de água.",
      temDupla ? (eqW === "dupla" ? "✅ Equipada" : "Equipar Grátis") : "Comprar 250 🪙",
      "",
      () => executarCompraMoedas(temDupla ? "equip" : "buy_dupla", temDupla ? { weapon: "dupla" } : undefined),
      eqW === "dupla"
    ));
    const temSuper = weapons.includes("super");
    gridCoins.appendChild(makeCard(
      "💦 Super Esguicho Cyber",
      "Pistola dourada turbinada com 35 de dano e jato longo.",
      temSuper ? (eqW === "super" ? "✅ Equipada" : "Equipar Grátis") : "Comprar 450 🪙",
      "",
      () => executarCompraMoedas(temSuper ? "equip" : "buy_super", temSuper ? { weapon: "super" } : undefined),
      eqW === "super"
    ));
    if (eqW !== "base") {
      gridCoins.appendChild(makeCard(
        "💧 Pistolinha Base",
        "Arma inicial leve de esguicho.",
        "Equipar Grátis",
        "",
        () => executarCompraMoedas("equip", { weapon: "base" }),
        false
      ));
    }
    const tcShop = (servidorState && servidorState.team_counts) ? servidorState.team_counts : { policia: 0, ladrao: 0 };
    if (me && !preso) {
      const myT = me.team === "ladrao" ? "ladrao" : "policia";
      const othT = myT === "policia" ? "ladrao" : "policia";
      const myC = Number(tcShop[myT]) || 0;
      const othC = Number(tcShop[othT]) || 0;
      if (myC >= othC + 2 || (othC === 0 && myC >= 2)) {
        gridCoins.appendChild(makeCard(
          "⚖️ Equilibrar Times (" + (tcShop.policia || 0) + "👮 × " + (tcShop.ladrao || 0) + "🕶️)",
          "Seu time está em maioria. Troque agora mantendo seus pontos, vidas e moedas!",
          "Ir para " + (othT === "policia" ? "👮 Polícia" : "🕶️ Ladrão") + " (Grátis)",
          "",
          () => executarCompraMoedas("switch_team"),
          false
        ));
      }
    }
    card.appendChild(gridCoins);

    addSecTitle("⚡ PACOTES PIX INSTANTÂNEOS (MERCADO PAGO AUTOMÁTICO)");
    const gridPix = document.createElement("div");
    gridPix.className = "policia-shop-grid";
    gridPix.appendChild(makeCard(
      "🚑 Fiança + 3 Vidas Extras",
      "Solta na hora da Cadeia, +3 vidas + 100 moedas.",
      "PIX · " + precoEvento("policia_vida_extra", 1.50),
      "pix",
      () => iniciarPixEvento("policia_vida_extra"),
      false
    ));
    gridPix.appendChild(makeCard(
      "🪙 +500 Moedas da Cidade",
      "Estouro de saldo na carteira para fianças, vidas e armas.",
      "PIX · " + precoEvento("policia_moedas_500", 2.00),
      "pix",
      () => iniciarPixEvento("policia_moedas_500"),
      false
    ));
    gridPix.appendChild(makeCard(
      "🔫 Arminhas Turbinadas VIP",
      "Libera Jato Duplo + Super Esguicho permanentes + 150 moedas.",
      "PIX · " + precoEvento("policia_arma_vip", 3.00),
      "pix",
      () => iniciarPixEvento("policia_arma_vip"),
      false
    ));
    gridPix.appendChild(makeCard(
      "💰 Baú 1.500 Moedas + Passe",
      "1.500 moedas + 3 vidas extras + Jato Duplo liberado.",
      "PIX · " + precoEvento("policia_moedas_1500", 5.00),
      "pix",
      () => iniciarPixEvento("policia_moedas_1500"),
      false
    ));
    card.appendChild(gridPix);

    shopModalEl.appendChild(card);
  }

  function gerarJatoAgua3D(x0, y0, z0, x1, y1, z1, weapon, team) {
    if (!TEM_3D || !MUNDO || !MUNDO.scene) return;
    const cor = weapon === "super" ? 0xfacc15 : (weapon === "dupla" ? 0x22d3ee : (team === "ladrao" ? 0xf97316 : 0x38bdf8));
    const gota = new THREE.Mesh(
      new THREE.SphereGeometry(weapon === "super" ? 0.24 : 0.16, 6, 6),
      new THREE.MeshBasicMaterial({ color: cor })
    );
    gota.position.set(x0, y0, z0);
    MUNDO.scene.add(gota);
    projeteis.push({
      g: gota,
      x0, y0, z0,
      x1, y1, z1,
      prog: 0,
      vel: 3.8
    });
  }

  function buscarAlvoNoCone(jx, jz, ry, somentePolicialAlvoNpc) {
    const fx = -Math.sin(ry);
    const fz = -Math.cos(ry);
    const estAgoraTs = Math.floor((Date.now() + serverDriftMs) / 1000);
    const online = onlineApi();
    const me = obterMeuPvp();
    const meuTime = me ? me.team : "policia";

    let melhorPlayer = null;
    let bestPlayerScore = 9999;

    if (online && typeof online.getPlayersRemotos === "function" && servidorState && servidorState.pvp) {
      const remotos = online.getPlayersRemotos();
      for (let i = 0; i < remotos.length; i++) {
        const rm = remotos[i];
        const rp = servidorState.pvp[rm.pid];
        if (!rp || rp.team === meuTime || (Number(rp.lives) || 0) <= 0 || (Number(rp.jailed_until) || 0) > estAgoraTs) continue;
        const dx = rm.x - jx;
        const dz = rm.z - jz;
        const dist = Math.hypot(dx, dz);
        if (dist > 34 || dist < 0.05) continue;
        const dot = (dx / dist) * fx + (dz / dist) * fz;
        if (dist <= 5.2 || dot >= 0.48) {
          const score = dist * (dot >= 0.8 ? 0.65 : 1.0);
          if (score < bestPlayerScore) {
            bestPlayerScore = score;
            melhorPlayer = { pid: rm.pid, x: rm.x, z: rm.z, dist, y: MUNDO.altura(rm.x, rm.z) + 1.35 };
          }
        }
      }
    }
    if (melhorPlayer) return { tipo: "player", target: melhorPlayer };

    if (somentePolicialAlvoNpc && meuTime === "policia") {
      let melhorNpc = null;
      let bestNpcDist = 9999;
      for (let i = 0; i < ladrões.length; i++) {
        const l = ladrões[i];
        if (l.preso) continue;
        const dx = l.x - jx;
        const dz = l.z - jz;
        const dist = Math.hypot(dx, dz);
        if (dist > 28 || dist < 0.05) continue;
        const dot = (dx / dist) * fx + (dz / dist) * fz;
        if (dist <= 4.5 || dot >= 0.48) {
          if (dist < bestNpcDist) {
            bestNpcDist = dist;
            melhorNpc = l;
          }
        }
      }
      if (melhorNpc) return { tipo: "npc", target: melhorNpc };
    }
    return null;
  }

  function atirarPistolinha(alvoExplicito) {
    if (!TEM_3D || !servidorState || servidorState.status !== "active") return false;
    const me = obterMeuPvp();
    if (!me) {
      const online = onlineApi();
      if (online && typeof online.enviarJoinPolicia === "function") online.enviarJoinPolicia();
      return false;
    }
    if (isJogadorPresoAgora(me)) {
      abrirModalLojaPolicia("🔒 Você está preso ou sem vidas! Pague Fiança ou aguarde.");
      return true;
    }
    const nowMs = performance.now();
    const wep = me.weapon || (walletState && walletState.equipped_weapon) || "base";
    const cdMs = wep === "dupla" ? 240 : (wep === "super" ? 260 : 380);
    if (nowMs - ultimoTiroMs < cdMs) return true;
    ultimoTiroMs = nowMs;

    const inter = interApi();
    if (inter && typeof inter.somTiroPistolinha === "function") {
      inter.somTiroPistolinha(wep);
    }

    const jx = MUNDO.jog.position.x;
    const jy = MUNDO.jog.position.y + 1.38;
    const jz = MUNDO.jog.position.z;
    const ry = MUNDO.jog.rotation.y;

    let targetPid = "";
    let targetNpc = -1;
    let npcTier = 1;
    let cuff = false;
    let x1 = jx - Math.sin(ry) * 20;
    let y1 = jy;
    let z1 = jz - Math.cos(ry) * 20;

    if (alvoExplicito && alvoExplicito.tipo === "player") {
      targetPid = alvoExplicito.pid;
      x1 = alvoExplicito.x;
      y1 = (alvoExplicito.y != null) ? alvoExplicito.y : jy;
      z1 = alvoExplicito.z;
      cuff = me.team === "policia" && Math.hypot(x1 - jx, z1 - jz) <= 5.2;
    } else if (alvoExplicito && alvoExplicito.tipo === "npc") {
      targetNpc = alvoExplicito.id;
      npcTier = alvoExplicito.tier || 1;
      x1 = alvoExplicito.x;
      y1 = MUNDO.altura(alvoExplicito.x, alvoExplicito.z) + 1.35;
      z1 = alvoExplicito.z;
    } else {
      const achado = buscarAlvoNoCone(jx, jz, ry, true);
      if (achado && achado.tipo === "player") {
        targetPid = achado.target.pid;
        x1 = achado.target.x;
        y1 = achado.target.y;
        z1 = achado.target.z;
        cuff = me.team === "policia" && achado.target.dist <= 5.2;
      } else if (achado && achado.tipo === "npc") {
        targetNpc = achado.target.id;
        npcTier = achado.target.tier || 1;
        x1 = achado.target.x;
        y1 = MUNDO.altura(achado.target.x, achado.target.z) + 1.35;
        z1 = achado.target.z;
      }
    }

    gerarJatoAgua3D(jx, jy, jz, x1, y1, z1, wep, me.team);

    const online = onlineApi();
    if (online && typeof online.enviarTiroPolicia === "function") {
      online.enviarTiroPolicia({
        x0: jx, y0: jy, z0: jz,
        x1, y1, z1,
        target_pid: targetPid,
        target_npc: targetNpc,
        tier: npcTier,
        cuff
      }).then(res => {
        if (!res || !res.ok || !res.hit) return;
        const h = res.hit;
        if (targetNpc >= 0 && ladrões[targetNpc]) {
          localCapturedIds.add(targetNpc);
          const untilMap = res.policia_event && res.policia_event.captured_until;
          const srvUntil = untilMap ? Number(untilMap[String(targetNpc)]) : 0;
          prenderLadraoNpcLocal(ladrões[targetNpc], srvUntil);
        }
        if (inter && typeof inter.lancarConfete3D === "function") {
          inter.lancarConfete3D(x1, y1 - 0.5, z1, h.ko ? 22 : 7);
        }
        if (h.ko && inter && typeof inter.somCapturaPolicia === "function") {
          inter.somCapturaPolicia(h.gained_pts, true, h.combo);
        } else if (inter && typeof inter.somHitAgua === "function") {
          inter.somHitAgua();
        }
        if (h.ko && h.target_nome) {
          mostrarToastPolicia((h.cuff ? "🚓 ALGEMOU " : "💦 NOCAUTE EM ") + h.target_nome + "! +" + h.gained_pts + " pts · +" + h.gained_coins + "🪙");
        } else if (h.target_nome) {
          mostrarToastPolicia("💧 " + h.target_nome + " (" + h.hp_left + " HP) · +" + h.gained_coins + "🪙");
        } else if (h.npc_id != null) {
          mostrarToastPolicia("🔫 PRESO NA PISTOLINHA! +" + h.gained_pts + " pts · +" + h.gained_coins + "🪙");
        }
      });
    }
    return true;
  }

  function renderHudPolicia() {
    criarHudPolicia();
    sincronizarPosicaoHudMobile();
    if (!servidorState) {
      wrapEl.hidden = true;
      if (fabAtirarEl) fabAtirarEl.hidden = true;
      return;
    }

    const st = servidorState.status || "idle";
    if (st === "idle") {
      wrapEl.hidden = true;
      pvpBarEl.hidden = true;
      placarAberto = false;
      placarBoxEl.hidden = true;
      if (fabAtirarEl) fabAtirarEl.hidden = true;
      return;
    }

    wrapEl.hidden = false;
    const ehMobile = !!(window.matchMedia && window.matchMedia("(max-width: 760px), (pointer: coarse)").matches);
    const inter = interApi();
    const emViatura = inter && typeof inter.getCarroAtual === "function" && inter.getCarroAtual() === "viatura";
    const sireneLig = inter && typeof inter.isSireneAtiva === "function" && inter.isSireneAtiva();
    const estAgoraTs = Math.floor((Date.now() + serverDriftMs) / 1000);

    const me = obterMeuPvp();
    const ehLadraoTime = !!(me && me.team === "ladrao");
    pillEl.className = "policia-pill"
      + (st === "active" ? " alerta-sirene" : "")
      + (ehMobile ? " policia-mob-slim" : "")
      + (ehMobile && ehLadraoTime ? " time-ladrao" : "");
    pillEl.textContent = "";

    if (st === "prealert") {
      pvpBarEl.hidden = true;
      if (fabAtirarEl) fabAtirarEl.hidden = true;
      const rest = Math.max(0, (Number(servidorState.starts_at) || 0) - estAgoraTs);
      if (ehMobile) {
        const mobTxt = document.createElement("span");
        mobTxt.className = "policia-mob-telem";
        mobTxt.innerHTML = "🚨 <strong>21H CADEIA</strong> · Em " + formatarMmSs(rest);
        pillEl.appendChild(mobTxt);
      } else {
        const tag = document.createElement("span");
        tag.className = "policia-tag";
        tag.textContent = "🚨 ALERTA CADEIA 79 · 21H";
        const txt = document.createElement("span");
        txt.className = "policia-stat";
        txt.textContent = "Fuga começa em " + formatarMmSs(rest);
        pillEl.append(tag, txt);
      }
      placarBoxEl.hidden = true;
      return;
    }

    if (st === "finished") {
      pvpBarEl.hidden = true;
      if (fabAtirarEl) fabAtirarEl.hidden = true;
      const w = servidorState.winner;
      const winTxt = w && w.nome
        ? ("🏆 " + w.nome + (w.arroba ? " @" + w.arroba : "") + " · " + w.pts + " pts")
        : "🏁 Operação encerrada!";
      if (ehMobile) {
        const mobTxt = document.createElement("span");
        mobTxt.className = "policia-mob-telem";
        mobTxt.textContent = winTxt;
        pillEl.appendChild(mobTxt);
      } else {
        const tag = document.createElement("span");
        tag.className = "policia-tag";
        tag.textContent = "🏆 DESTAQUE";
        const txt = document.createElement("span");
        txt.className = "policia-stat";
        txt.textContent = w && w.nome
          ? ("🚓 " + w.nome + (w.arroba ? " @" + w.arroba : "") + " · " + w.pts + " pts")
          : "Operação encerrada!";
        pillEl.append(tag, txt);
      }
      placarBoxEl.hidden = true;
      return;
    }

    // Status === "active"
    const rest = Math.max(0, (Number(servidorState.ends_at) || 0) - estAgoraTs);
    const totalN = ladrões.length || Number(servidorState.npc_count) || 18;
    const soltos = ladrões.filter(l => !l.preso).length;
    const tc = servidorState.team_counts || { policia: 0, ladrao: 0 };
    const coins = Number(walletState && walletState.coins) || 0;
    const preso = isJogadorPresoAgora(me);
    const board = Array.isArray(servidorState.leaderboard) ? servidorState.leaderboard : [];

    if (fabAtirarEl) {
      fabAtirarEl.hidden = !(ehMobile && me && !preso);
    }

    if (ehMobile) {
      pvpBarEl.hidden = true;
      const telem = document.createElement("span");
      telem.className = "policia-mob-telem";

      if (me) {
        const hp = Math.max(0, Math.min(100, Number(me.hp) || 0));
        const vidas = Math.max(0, Number(me.lives) || 0);
        const restPreso = vidas > 0 && (Number(me.jailed_until) || 0) > estAgoraTs
          ? (Number(me.jailed_until) - estAgoraTs)
          : 0;
        const iconTeam = ehLadraoTime ? "🕶️" : "👮";
        if (preso) {
          const presoTag = vidas <= 0 ? "💀 0 VIDAS" : ("🔒 " + restPreso + "s");
          telem.innerHTML = "<span class=\"policia-mob-hp baixo\">" + presoTag + "</span> · " + formatarMmSs(rest) + " · ❤️" + vidas + " · 🪙" + coins;
        } else {
          const hpCls = hp <= 25 ? "baixo" : (hp <= 55 ? "medio" : "alto");
          telem.innerHTML = iconTeam + " <strong>" + formatarMmSs(rest) + "</strong> · <span class=\"policia-mob-hp " + hpCls + "\">HP " + hp + "</span> · ❤️" + vidas + " · 🪙" + coins;
        }
      } else {
        telem.innerHTML = "🚓 <strong>" + formatarMmSs(rest) + "</strong> · 👮" + (tc.policia || 0) + "×" + (tc.ladrao || 0) + "🕶️ · 🪙" + coins;
      }

      const acoesMob = document.createElement("span");
      acoesMob.className = "policia-mob-actions";

      if (me) {
        const btnViatMob = document.createElement("button");
        btnViatMob.type = "button";
        btnViatMob.className = "policia-btn policia-mob-ico";
        btnViatMob.textContent = emViatura ? "🚶" : "🚕";
        btnViatMob.title = emViatura ? "Sair da viatura" : "Pegar viatura";
        btnViatMob.setAttribute("aria-label", btnViatMob.title);
        btnViatMob.disabled = preso;
        btnViatMob.addEventListener("click", () => {
          if (!inter) return;
          if (emViatura) inter.sairCarro(false);
          else if (typeof inter.embarcarViaturaPolicia === "function") inter.embarcarViaturaPolicia();
          renderHudPolicia();
        });
        acoesMob.appendChild(btnViatMob);

        if (emViatura) {
          const btnSirMob = document.createElement("button");
          btnSirMob.type = "button";
          btnSirMob.className = "policia-btn sec policia-mob-ico" + (sireneLig ? " ativo" : "");
          btnSirMob.textContent = sireneLig ? "📢" : "🔕";
          btnSirMob.title = "Sirene";
          btnSirMob.setAttribute("aria-label", "Alternar sirene");
          btnSirMob.addEventListener("click", () => {
            if (inter && typeof inter.toggleSireneViatura === "function") inter.toggleSireneViatura();
            renderHudPolicia();
          });
          acoesMob.appendChild(btnSirMob);
        }
      } else {
        const btnEntMob = document.createElement("button");
        btnEntMob.type = "button";
        btnEntMob.className = "policia-btn policia-mob-ico";
        btnEntMob.textContent = "Entrar";
        btnEntMob.addEventListener("click", () => {
          const online = onlineApi();
          if (online && typeof online.enviarJoinPolicia === "function") online.enviarJoinPolicia();
        });
        acoesMob.appendChild(btnEntMob);
      }

      const btnLojaMob = document.createElement("button");
      btnLojaMob.type = "button";
      btnLojaMob.className = "policia-btn lojinha policia-mob-ico" + (preso ? " urgente" : "");
      btnLojaMob.textContent = preso ? "🔓" : "🛒";
      btnLojaMob.title = preso ? "Pagar Fiança / Vidas" : "Lojinha e PIX";
      btnLojaMob.setAttribute("aria-label", btnLojaMob.title);
      btnLojaMob.addEventListener("click", () => abrirModalLojaPolicia(""));
      acoesMob.appendChild(btnLojaMob);

      const btnRankMob = document.createElement("button");
      btnRankMob.type = "button";
      btnRankMob.className = "policia-btn sec policia-mob-ico" + (placarAberto ? " ativo" : "");
      btnRankMob.textContent = placarAberto ? "✕" : "🏆";
      btnRankMob.title = "Placar e Times";
      btnRankMob.setAttribute("aria-label", "Placar e Times");
      btnRankMob.addEventListener("click", () => {
        placarAberto = !placarAberto;
        renderHudPolicia();
      });
      acoesMob.appendChild(btnRankMob);

      pillEl.append(telem, acoesMob);
    } else {
      const btnToggleHud = document.createElement("button");
      btnToggleHud.type = "button";
      btnToggleHud.className = "policia-btn sec";
      btnToggleHud.title = hudMinimizado ? "Expandir painel do evento" : "Minimizar painel para ver mais o mapa";
      btnToggleHud.textContent = hudMinimizado ? "▾" : "▴";
      btnToggleHud.addEventListener("click", () => {
        hudMinimizado = !hudMinimizado;
        if (hudMinimizado) placarAberto = false;
        renderHudPolicia();
      });

      if (hudMinimizado) {
        pvpBarEl.hidden = true;
        placarBoxEl.hidden = true;
        const iconTeam = me ? (me.team === "ladrao" ? "🕶️" : "👮") : "🚓";
        const resumo = document.createElement("span");
        resumo.className = "policia-stat";
        if (me) {
          resumo.innerHTML = iconTeam + " <strong>" + formatarMmSs(rest) + "</strong> · ❤️" + (Number(me.lives) || 0) + " · 🪙" + coins;
        } else {
          resumo.innerHTML = "🚓 <strong>" + formatarMmSs(rest) + "</strong> · 🪙" + coins;
        }
        const btnLojaMin = document.createElement("button");
        btnLojaMin.type = "button";
        btnLojaMin.className = "policia-btn lojinha";
        btnLojaMin.textContent = "🛒";
        btnLojaMin.addEventListener("click", () => abrirModalLojaPolicia(""));
        pillEl.append(resumo, btnLojaMin, btnToggleHud);
        return;
      }

      const tag = document.createElement("span");
      tag.className = "policia-tag";
      tag.textContent = "🚓 POLÍCIA & LADRÃO";
      pillEl.appendChild(tag);

      const tempoEl = document.createElement("span");
      tempoEl.className = "policia-stat";
      tempoEl.innerHTML = "⏱️ <strong>" + formatarMmSs(rest) + "</strong> · 👮<strong>" + (tc.policia || 0) + "</strong>×<strong>" + (tc.ladrao || 0) + "</strong>🕶️ · NPC <strong>" + soltos + "/" + totalN + "</strong>";

      const btnViatura = document.createElement("button");
      btnViatura.type = "button";
      btnViatura.className = "policia-btn";
      btnViatura.textContent = emViatura ? "🚶 Sair" : "🚓 Viatura";
      btnViatura.title = emViatura ? "Sair da viatura" : "Pegar viatura";
      btnViatura.addEventListener("click", () => {
        if (!inter) return;
        if (emViatura) inter.sairCarro(false);
        else if (typeof inter.embarcarViaturaPolicia === "function") inter.embarcarViaturaPolicia();
        renderHudPolicia();
      });

      pillEl.append(tempoEl, btnViatura);

      if (emViatura) {
        const btnSir = document.createElement("button");
        btnSir.type = "button";
        btnSir.className = "policia-btn sec" + (sireneLig ? " ativo" : "");
        btnSir.textContent = sireneLig ? "📢" : "🔕";
        btnSir.title = "Ligar/Desligar Sirene [G]";
        btnSir.addEventListener("click", () => {
          if (inter && typeof inter.toggleSireneViatura === "function") inter.toggleSireneViatura();
          renderHudPolicia();
        });
        pillEl.appendChild(btnSir);
      }

      const btnRank = document.createElement("button");
      btnRank.type = "button";
      btnRank.className = "policia-btn sec";
      btnRank.textContent = placarAberto ? "🏆✕" : ("🏆" + (board.length || 0));
      btnRank.addEventListener("click", () => {
        placarAberto = !placarAberto;
        renderHudPolicia();
      });
      pillEl.append(btnRank, btnToggleHud);

      // Barra PvP compacta do jogador (Desktop)
      pvpBarEl.hidden = false;
      pvpBarEl.textContent = "";
      if (me) {
        const ehLadrao = me.team === "ladrao";
        pvpBarEl.className = "policia-pvp-bar" + (ehLadrao ? " time-ladrao" : "");
        const hp = Math.max(0, Math.min(100, Number(me.hp) || 0));
        const vidas = Math.max(0, Number(me.lives) || 0);
        const restPreso = vidas > 0 && (Number(me.jailed_until) || 0) > estAgoraTs
          ? (Number(me.jailed_until) - estAgoraTs)
          : 0;

        const tBadge = document.createElement("span");
        tBadge.className = "policia-time-badge" + (ehLadrao ? " ladrao" : "");
        tBadge.textContent = preso
          ? (vidas <= 0 ? "💀 0 VIDAS" : "🔒 " + restPreso + "s")
          : (ehLadrao ? "🕶️ LADRÃO" : "👮 POLÍCIA");

        const hpWrap = document.createElement("span");
        hpWrap.className = "policia-hp-wrap";
        const track = document.createElement("span");
        track.className = "policia-hp-track";
        const fill = document.createElement("span");
        fill.className = "policia-hp-fill" + (hp <= 25 ? " baixo" : (hp <= 55 ? " medio" : ""));
        fill.style.width = hp + "%";
        track.appendChild(fill);
        const hpTxt = document.createElement("span");
        hpTxt.textContent = hp + "/100";
        hpWrap.append(track, hpTxt);

        const vidasEl = document.createElement("span");
        vidasEl.className = "policia-vidas-txt";
        vidasEl.textContent = "❤️".repeat(Math.min(5, vidas)) + (vidas > 5 ? "+" + (vidas - 5) : "") + " (" + vidas + ")";

        const moedasEl = document.createElement("span");
        moedasEl.className = "policia-moedas-txt";
        moedasEl.textContent = "🪙" + coins;

        pvpBarEl.append(tBadge, hpWrap, vidasEl, moedasEl);

        const btnAtirar = document.createElement("button");
        btnAtirar.type = "button";
        btnAtirar.className = "policia-btn atirar";
        btnAtirar.textContent = "🔫 Atirar [Q]";
        btnAtirar.disabled = preso;
        btnAtirar.addEventListener("click", () => atirarPistolinha(null));
        pvpBarEl.appendChild(btnAtirar);

        const btnLoja = document.createElement("button");
        btnLoja.type = "button";
        btnLoja.className = "policia-btn lojinha";
        btnLoja.textContent = preso ? "🔓 Fiança / Vidas" : "🛒 Lojinha & PIX";
        btnLoja.addEventListener("click", () => abrirModalLojaPolicia(""));
        pvpBarEl.appendChild(btnLoja);
      } else {
        pvpBarEl.className = "policia-pvp-bar";
        const infoEntrar = document.createElement("span");
        infoEntrar.textContent = "Dividindo time... 🪙" + coins;
        const btnEnt = document.createElement("button");
        btnEnt.type = "button";
        btnEnt.className = "policia-btn";
        btnEnt.textContent = "Entrar Agora";
        btnEnt.addEventListener("click", () => {
          const online = onlineApi();
          if (online && typeof online.enviarJoinPolicia === "function") online.enviarJoinPolicia();
        });
        pvpBarEl.append(infoEntrar, btnEnt);
      }
    }

    if (placarAberto) {
      placarBoxEl.hidden = false;
      placarBoxEl.textContent = "";
      const tit = document.createElement("div");
      tit.className = "policia-placar-tit";
      tit.textContent = "RANKING POLÍCIA & LADRÃO";
      placarBoxEl.appendChild(tit);

      if (ehMobile) {
        const resumoMob = document.createElement("div");
        resumoMob.className = "policia-placar-resumo";
        resumoMob.textContent = "👮 " + (tc.policia || 0) + " × " + (tc.ladrao || 0) + " 🕶️ · 🚨 " + soltos + "/" + totalN + " soltos";
        placarBoxEl.appendChild(resumoMob);
        if (me && !preso) {
          const myT = me.team === "ladrao" ? "ladrao" : "policia";
          const othT = myT === "policia" ? "ladrao" : "policia";
          const myC = Number(tc[myT]) || 0;
          const othC = Number(tc[othT]) || 0;
          if (myC >= othC + 2 || (othC === 0 && myC >= 2)) {
            const btnEq = document.createElement("button");
            btnEq.type = "button";
            btnEq.className = "policia-btn policia-placar-eq";
            btnEq.textContent = "⚖️ Trocar p/ " + (othT === "policia" ? "👮 Polícia" : "🕶️ Ladrão");
            btnEq.addEventListener("click", () => executarCompraMoedas("switch_team"));
            placarBoxEl.appendChild(btnEq);
          }
        }
      }

      const ul = document.createElement("ul");
      ul.className = "policia-placar-lista";
      const meuPid = obterMeuPid();
      if (!board.length) {
        const li = document.createElement("li");
        li.className = "policia-placar-item";
        li.textContent = "Atire água ou prenda ladrões para pontuar!";
        ul.appendChild(li);
      } else {
        board.forEach((b, i) => {
          const li = document.createElement("li");
          li.className = "policia-placar-item" + (b.pid === meuPid ? " eu" : "");
          const left = document.createElement("span");
          left.textContent = (i + 1) + "º " + b.nome + (b.arroba ? " @" + b.arroba : "");
          const right = document.createElement("strong");
          right.textContent = b.pts + " pts (" + b.captures + ")";
          li.append(left, right);
          ul.appendChild(li);
        });
      }
      placarBoxEl.appendChild(ul);
    } else {
      placarBoxEl.hidden = true;
    }
  }

  function receberEstadoPolicia(ev, walletArg) {
    if (walletArg && typeof walletArg === "object") {
      walletState = walletArg;
    }
    if (!ev || typeof ev !== "object") return;
    servidorState = ev;
    if (Number(ev.server_now) > 0) {
      serverDriftMs = Number(ev.server_now) * 1000 - Date.now();
    }

    atualizarPlacaXerifePrefeitura(ev.xerife || null);

    const st = ev.status || "idle";
    const rid = ev.round_id || "";

    if (st === "active") {
      if (ultimoStatus !== "active" || (rid && rid !== roundIdAtivo)) {
        roundIdAtivo = rid;
        iniciarRodadaLocal(ev);
      } else {
        const me = obterMeuPvp();
        if (!me && rid && joinSolicitadoRound !== rid) {
          joinSolicitadoRound = rid;
          const online = onlineApi();
          if (online && typeof online.enviarJoinPolicia === "function") {
            online.enviarJoinPolicia().then(res => {
              if (res && res.me) {
                const pref = res.rebalanced ? "⚖️ " : "";
                mostrarToastPolicia(pref + (res.me.team === "ladrao" ? "🕶️ SEU TIME: LADRÃO (5 VIDAS)" : "👮 SEU TIME: POLÍCIA (5 VIDAS)"));
              }
            });
          }
        }
        const capObj = (ev.captured && typeof ev.captured === "object") ? ev.captured : {};
        const capUntil = (ev.captured_until && typeof ev.captured_until === "object") ? ev.captured_until : {};
        const respawnS = Number(ev.npc_respawn_s) || 35;
        const agoraS = Math.floor((Date.now() + serverDriftMs) / 1000);
        for (let i = 0; i < ladrões.length; i++) {
          const l = ladrões[i];
          const k = String(l.id);
          if (capObj[k]) {
            localCapturedIds.add(l.id);
            const uTs = Number(capUntil[k]) || (agoraS + respawnS);
            if (!l.preso) {
              prenderLadraoNpcLocal(l, uTs, true);
            } else {
              l.presoAteTs = uTs;
              l.capturaLocalMs = 0;
            }
          } else if (!pendingCaptureIds.has(l.id) && (!l.capturaLocalMs || (performance.now() - l.capturaLocalMs) >= 3200)) {
            localCapturedIds.delete(l.id);
            if (l.preso) {
              libertarLadraoNpcLocal(l);
            }
          }
        }
        if (Array.isArray(ev.shots)) {
          const meuPid = obterMeuPid();
          ev.shots.forEach(s => {
            if (!s || !s.id || seenShotIds.has(s.id)) return;
            seenShotIds.add(s.id);
            if (s.shooter && s.shooter !== meuPid) {
              gerarJatoAgua3D(s.x0, s.y0, s.z0, s.x1, s.y1, s.z1, s.weapon, s.team);
              const inter = interApi();
              if (inter && typeof inter.somTiroPistolinha === "function" && MUNDO && MUNDO.jog) {
                if (Math.hypot(MUNDO.jog.position.x - s.x0, MUNDO.jog.position.z - s.z0) <= 32) {
                  inter.somTiroPistolinha(s.weapon);
                }
              }
            }
          });
        }
      }
    } else if (ultimoStatus === "active") {
      roundIdAtivo = "";
      encerrarRodadaLocal(st, ev);
    }

    ultimoStatus = st;
    renderHudPolicia();
    if (modalLojaAberto) renderModalLojaPolicia();
  }

  // ---------- Loop 3D de Perseguição, Luzes, Captura & Radar ----------
  let relogioHud = 0;

  function atualizarQuadroPolicia(dt, tParam) {
    const t = Number.isFinite(tParam) ? tParam : performance.now() / 1000;
    if (!servidorState) return;

    const st = servidorState.status || "idle";
    if (st !== "active" && st !== "prealert") return;

    // Atualiza relógio HUD + tick final 10s a cada 0.5s
    relogioHud += dt;
    if (relogioHud >= 0.5) {
      relogioHud = 0;
      renderHudPolicia();
      if (st === "active") {
        const estAgoraTs = Math.floor((Date.now() + serverDriftMs) / 1000);
        const rest = Math.max(0, (Number(servidorState.ends_at) || 0) - estAgoraTs);
        if (rest > 0 && rest <= 10 && rest !== ultimoTickSeg) {
          ultimoTickSeg = rest;
          const inter = interApi();
          if (inter && typeof inter.somTickPolicia === "function") inter.somTickPolicia();
        }
      }
    }

    if (!TEM_3D || st !== "active") return;

    // Alarme piscante da Cadeia 79 + giroflex das viaturas estacionadas
    if (cadeiaAlarmeLuz) {
      const f = Math.floor(t * 6) % 2;
      cadeiaAlarmeLuz.color.setHex(f ? 0xff2b2b : 0xfacc15);
      cadeiaAlarmeLuz.intensity = f ? 4.2 : 1.6;
    }

    const faseGiro = Math.floor(t * 7) % 2;
    for (let i = 0; i < viaturasCenario.length; i++) {
      const vc = viaturasCenario[i];
      if (!vc || !vc.g || !vc.g.userData) continue;
      const ud = vc.g.userData;
      if (ud.giroRed) ud.giroRed.material.color.setHex(faseGiro ? 0xff2b2b : 0x450a0a);
      if (ud.giroBlue) ud.giroBlue.material.color.setHex(faseGiro ? 0x082f49 : 0x38bdf8);
      if (ud.giroLuz) ud.giroLuz.color.setHex(faseGiro ? 0xff2b2b : 0x228be6);

      // Embarque rápido automático se jogador encostar perto e apertar [E] é evitado para não conflitar;
      // clique na Viatura ou botão na barra embarca na hora.
    }

    const inter = interApi();
    const online = onlineApi();
    const meuCarro = inter && typeof inter.getCarroAtual === "function" ? inter.getCarroAtual() : "";
    const dirigindo = !!(inter && typeof inter.isDirigindo === "function" && inter.isDirigindo());
    const raioCaptura = meuCarro === "viatura" ? 4.1 : (dirigindo ? 3.5 : 2.7);
    const jx = MUNDO.jog.position.x;
    const jz = MUNDO.jog.position.z;
    const me = obterMeuPvp();
    const estaPreso = isJogadorPresoAgora(me);

    // Animação dos projéteis de água ("piu, piu, piu!")
    for (let i = projeteis.length - 1; i >= 0; i--) {
      const pr = projeteis[i];
      pr.prog += dt * pr.vel;
      if (pr.prog >= 1) {
        liberarGrupo3D(pr.g);
        projeteis.splice(i, 1);
      } else {
        const p = pr.prog;
        pr.g.position.set(
          pr.x0 + (pr.x1 - pr.x0) * p,
          pr.y0 + (pr.y1 - pr.y0) * p + Math.sin(p * Math.PI) * 0.45,
          pr.z0 + (pr.z1 - pr.z0) * p
        );
      }
    }

    // Controle de prisão / hospital — liberdade para caminhar pelo pátio da Cadeia 79 / praça!
    const bPat = obterPatioCadeiaBounds();
    if (me) {
      const celaX = me.team === "ladrao" ? ((bPat.x0 + bPat.x1) * 0.5) : (HOOKS.prefPos ? HOOKS.prefPos.cx + 16 : 44);
      const celaZ = me.team === "ladrao" ? ((bPat.z0 + bPat.z1) * 0.5) : (HOOKS.prefPos ? HOOKS.prefPos.cz + 14 : 8);
      if (estaPreso && !estavaPresoLocal) {
        estavaPresoLocal = true;
        if (dirigindo && inter && typeof inter.sairCarro === "function") inter.sairCarro(true);
        MUNDO.jog.position.set(celaX, MUNDO.altura(celaX, celaZ), celaZ);
        if ((Number(me.lives) || 0) <= 0) {
          abrirModalLojaPolicia("🚨 Suas vidas acabaram! Compre +1 Vida, pague Fiança ou garanta no PIX.");
        } else {
          const estNowT = Math.floor((Date.now() + serverDriftMs) / 1000);
          const restP = Math.max(1, (Number(me.jailed_until) || 0) - estNowT);
          mostrarToastPolicia("🔒 Preso por " + restP + "s! Caminhe no pátio ou toque em 🔓 Fiança");
        }
      } else if (estaPreso) {
        if (me.team === "ladrao") {
          const minX = bPat.x0;
          const maxX = bPat.x1;
          const minZ = bPat.z0;
          const maxZ = bPat.z1;
          if (jx < minX || jx > maxX || jz < minZ || jz > maxZ) {
            const cx = Math.max(minX + 0.8, Math.min(maxX - 0.8, jx));
            const cz = Math.max(minZ + 0.8, Math.min(maxZ - 0.8, jz));
            MUNDO.jog.position.set(cx, MUNDO.altura(cx, cz), cz);
            const agoraM = performance.now();
            if (agoraM - avisoLimiteCelaMs > 5000) {
              avisoLimiteCelaMs = agoraM;
              avisa("🔒 Aguarde a soltura ou pague Fiança (🔓) para sair da Cadeia 79!");
            }
          }
        } else {
          const dHosp = Math.hypot(jx - celaX, jz - celaZ);
          if (dHosp > 22) {
            const angH = Math.atan2(jz - celaZ, jx - celaX);
            const cx = celaX + Math.cos(angH) * 20.5;
            const cz = celaZ + Math.sin(angH) * 20.5;
            MUNDO.jog.position.set(cx, MUNDO.altura(cx, cz), cz);
            const agoraM = performance.now();
            if (agoraM - avisoLimiteCelaMs > 5000) {
              avisoLimiteCelaMs = agoraM;
              avisa("🏥 Aguarde sua recuperação ou toque em 🔓 para voltar à operação!");
            }
          }
        }
      } else if (!estaPreso && estavaPresoLocal) {
        estavaPresoLocal = false;
        fecharModalLojaPolicia();
        if (me.team === "ladrao") {
          const outX = bPat.portaoX - 4;
          MUNDO.jog.position.set(outX, MUNDO.altura(outX, bPat.portaoZ), bPat.portaoZ);
        }
        mostrarToastPolicia("🔓 Livre na operação!");
      }

      // Tick de recompensa por sobrevivência para Ladrões soltos + aviso perto da Lojinha no canto
      if (!estaPreso && me.team === "ladrao") {
        relogioSobrevivencia += dt;
        if (relogioSobrevivencia >= 20) {
          relogioSobrevivencia = 0;
          if (online && typeof online.enviarCompraPolicia === "function") {
            online.enviarCompraPolicia("survival_tick");
          }
        }
      }
      if (!estaPreso && lojinhaPos && Math.hypot(jx - lojinhaPos.x, jz - lojinhaPos.z) <= 6.2) {
        const agoraMs = performance.now();
        if (agoraMs - avisoProxLojinhaMs > 6500) {
          avisoProxLojinhaMs = agoraMs;
          avisa("🔫 Você está na Lojinha de Arminhas! Aperte [E] ou clique no balcão.");
        }
      }

      // Policial encostando em Ladrão adversário real também algema automaticamente!
      if (!estaPreso && me.team === "policia" && online && typeof online.getPlayersRemotos === "function" && servidorState.pvp) {
        const agoraMs = performance.now();
        if (agoraMs - ultimoAlgemarAutoMs > 2400) {
          const estNow = Math.floor((Date.now() + serverDriftMs) / 1000);
          const remotos = online.getPlayersRemotos();
          for (let i = 0; i < remotos.length; i++) {
            const rm = remotos[i];
            const rp = servidorState.pvp[rm.pid];
            if (!rp || rp.team !== "ladrao" || (Number(rp.lives) || 0) <= 0 || (Number(rp.jailed_until) || 0) > estNow) continue;
            if (Math.hypot(jx - rm.x, jz - rm.z) <= raioCaptura) {
              ultimoAlgemarAutoMs = agoraMs;
              atirarPistolinha({ tipo: "player", pid: rm.pid, x: rm.x, y: MUNDO.altura(rm.x, rm.z) + 1.3, z: rm.z });
              break;
            }
          }
        }
      }
    }

    const gr = HOOKS.grid;
    const ruas = garantirRedeRuas();
    const radarDots = [];
    const estNowLoop = Math.floor((Date.now() + serverDriftMs) / 1000);

    for (let i = 0; i < ladrões.length; i++) {
      const l = ladrões[i];
      if (l.preso) {
        if (
          !pendingCaptureIds.has(l.id) &&
          l.presoAteTs > 0 &&
          estNowLoop >= l.presoAteTs &&
          (!servidorState.captured || !servidorState.captured[String(l.id)])
        ) {
          localCapturedIds.delete(l.id);
          libertarLadraoNpcLocal(l);
          continue;
        }
        const secRest = l.presoAteTs > estNowLoop ? (l.presoAteTs - estNowLoop) : 0;
        const txtPreso = secRest > 0 ? ("🔒 CADEIA " + secRest + "s") : "🔒 CADEIA 79";
        aplicarVisualPresoNpc(l, txtPreso);

        l.tempoAlvo += dt;
        const distP = Math.hypot(l.alvoX - l.x, l.alvoZ - l.z);
        if (distP < 1.6 || l.tempoAlvo > 7.5) {
          l.tempoAlvo = 0;
          const ptP = cadeiaPatioPonto(Math.random);
          l.alvoX = ptP.x;
          l.alvoZ = ptP.z;
        }
        const angP = Math.atan2(l.alvoZ - l.z, l.alvoX - l.x);
        const vPreso = l.velPreso || 3.5;
        const nxP = Math.max(bPat.x0 + 1, Math.min(bPat.x1 - 1, l.x + Math.cos(angP) * vPreso * dt));
        const nzP = Math.max(bPat.z0 + 1, Math.min(bPat.z1 - 1, l.z + Math.sin(angP) * vPreso * dt));
        if (!HOOKS.colidePonto(nxP, nzP, 0.75)) {
          l.x = nxP;
          l.z = nzP;
        } else {
          const altP = cadeiaPatioPonto(Math.random);
          l.alvoX = altP.x;
          l.alvoZ = altP.z;
        }
        l.g.position.set(l.x, MUNDO.altura(l.x, l.z), l.z);
        const yawP = Math.atan2(-(l.alvoX - l.x), -(l.alvoZ - l.z));
        const dYawP = Math.atan2(Math.sin(yawP - l.ry), Math.cos(yawP - l.ry));
        l.ry += dYawP * Math.min(1, dt * 6);
        l.g.rotation.y = l.ry;
        if (!MUNDO.reduz && l.vox && l.vox.userData && l.vox.userData.pivos) {
          l.passo += dt * (vPreso * 1.45);
          const balP = Math.sin(l.passo) * 0.55;
          const pvP = l.vox.userData.pivos;
          if (pvP.P0) pvP.P0.rotation.x = balP;
          if (pvP.P1) pvP.P1.rotation.x = -balP;
          if (pvP.B0) pvP.B0.rotation.x = -balP * 0.7;
          if (pvP.B1) pvP.B1.rotation.x = balP * 0.7;
          l.vox.position.y = Math.abs(Math.sin(l.passo)) * 0.09;
        }
        continue;
      }

      // Move pela grade de ruas desviando de construções
      l.tempoAlvo += dt;
      const distAlvo = Math.hypot(l.alvoX - l.x, l.alvoZ - l.z);
      if ((distAlvo < 2.4 || l.tempoAlvo > 14) && ruas.length > 0) {
        l.tempoAlvo = 0;
        // Escolhe rua conectada ou ponto livre com pequena preferência para fugir se policial estiver perto
        let melhor = ruas[Math.floor(Math.random() * ruas.length)];
        if (Math.hypot(jx - l.x, jz - l.z) < 28) {
          let melhorScore = -1;
          for (let k = 0; k < 4; k++) {
            const cand = ruas[Math.floor(Math.random() * ruas.length)];
            const dJ = Math.hypot(cand.x - jx, cand.z - jz);
            if (dJ > melhorScore) {
              melhorScore = dJ;
              melhor = cand;
            }
          }
        }
        l.alvoX = melhor.x;
        l.alvoZ = melhor.z;
      }

      const ang = Math.atan2(l.alvoZ - l.z, l.alvoX - l.x);
      let vx = Math.cos(ang) * l.vel;
      let vz = Math.sin(ang) * l.vel;

      // Evasão reativa se o policial estiver chegando bem perto
      const distJog = Math.hypot(jx - l.x, jz - l.z);
      if (distJog < 16 && distJog > 0.2) {
        const fx = (l.x - jx) / distJog;
        const fz = (l.z - jz) / distJog;
        vx = (vx * 0.45) + fx * l.vel * 0.65;
        vz = (vz * 0.45) + fz * l.vel * 0.65;
      }

      const nx = Math.max(gr.XMIN - 12, Math.min(gr.XMAX + 96, l.x + vx * dt));
      const nz = Math.max(gr.ZMIN + 2, Math.min(48, l.z + vz * dt));
      if (!HOOKS.colidePonto(nx, nz, 0.75)) {
        l.x = nx;
        l.z = nz;
      } else if (!HOOKS.colidePonto(nx, l.z, 0.75)) {
        l.x = nx;
      } else if (!HOOKS.colidePonto(l.x, nz, 0.75)) {
        l.z = nz;
      } else if (ruas.length > 0) {
        const alt = ruas[Math.floor(Math.random() * ruas.length)];
        l.alvoX = alt.x;
        l.alvoZ = alt.z;
      }

      l.g.position.set(l.x, MUNDO.altura(l.x, l.z), l.z);
      const yawAlvo = Math.atan2(-(l.alvoX - l.x), -(l.alvoZ - l.z));
      const dYaw = Math.atan2(Math.sin(yawAlvo - l.ry), Math.cos(yawAlvo - l.ry));
      l.ry += dYaw * Math.min(1, dt * 8);
      l.g.rotation.y = l.ry;

      // Animação de corrida voxel
      if (!MUNDO.reduz && l.vox && l.vox.userData && l.vox.userData.pivos) {
        l.passo += dt * (l.vel * 1.15);
        const bal = Math.sin(l.passo) * 0.75;
        const pv = l.vox.userData.pivos;
        if (pv.P0) pv.P0.rotation.x = bal;
        if (pv.P1) pv.P1.rotation.x = -bal;
        if (pv.B0) pv.B0.rotation.x = -bal * 0.85;
        if (pv.B1) pv.B1.rotation.x = bal * 0.85;
        l.vox.position.y = Math.abs(Math.sin(l.passo)) * 0.16;
      }
      if (l.halo) {
        const s = 0.92 + Math.sin(t * 6 + i) * 0.14;
        l.halo.scale.set(s, s, 1);
      }

      radarDots.push({
        x: l.x,
        z: l.z,
        r: l.tier === 3 ? 6.0 : 4.2,
        cor: l.tier === 3 ? "#facc15" : (l.tier === 2 ? "#38bdf8" : "#ef4444"),
        borda: "#0b1120"
      });

      // Captura automática ao encostar (a pé ou de viatura) — apenas Policiais soltos!
      if (
        (!me || (me.team !== "ladrao" && !estaPreso)) &&
        !pendingCaptureIds.has(l.id) &&
        !localCapturedIds.has(l.id) &&
        MUNDO.jog.position.y < 40 &&
        Math.hypot(jx - l.x, jz - l.z) <= raioCaptura
      ) {
        const capX = l.x;
        const capZ = l.z;
        localCapturedIds.add(l.id);
        pendingCaptureIds.add(l.id);
        prenderLadraoNpcLocal(l);

        if (inter && typeof inter.lancarConfete3D === "function") {
          inter.lancarConfete3D(capX, 0.8, capZ, l.tier === 3 ? 34 : 18);
        }
        if (inter && typeof inter.somCapturaPolicia === "function") {
          inter.somCapturaPolicia(l.pts, l.tier === 3, false);
        }

        if (online && typeof online.enviarCapturaPolicia === "function") {
          const parceiroPid = inter && typeof inter.getParceiroCaronaPid === "function"
            ? inter.getParceiroCaronaPid()
            : "";
          online.enviarCapturaPolicia({
            round_id: roundIdAtivo,
            npc_id: l.id,
            tier: l.tier,
            partner_pid: parceiroPid
          }).then(res => {
            pendingCaptureIds.delete(l.id);
            if (res && res.ok) {
              const ptsGanhos = res.gained_pts || l.pts;
              const txtCombo = res.combo ? " 🔥 COMBO!" : "";
              const txtParc = res.partner_credited ? (" + " + res.partner_credited) : "";
              mostrarToastPolicia((l.tier === 3 ? "🌟 CHEFÃO PRESO! +" : "🚓 PRESO! +") + ptsGanhos + " pts" + txtCombo + txtParc);
            } else if (res && res.already_captured) {
              mostrarToastPolicia("⚡ Outro policial algemou antes!");
            }
          });
        } else {
          pendingCaptureIds.delete(l.id);
          mostrarToastPolicia("🚓 PRESO! +" + l.pts + " pts");
        }
      }
    }

    window.CARAGUA_EVENTO_MAPA = radarDots;
  }

  // Vincula callbacks ao online.js e loop de frame
  let vinculado = false;
  function vincularOnlinePolicia() {
    if (vinculado) return;
    const online = onlineApi();
    if (!online || typeof online.onPoliciaServidor !== "function") return;
    vinculado = true;
    online.onPoliciaServidor(receberEstadoPolicia);
  }
  vincularOnlinePolicia();

  if (TEM_3D && typeof MUNDO.addQuadroListener === "function") {
    MUNDO.addQuadroListener((dt, t) => {
      vincularOnlinePolicia();
      atualizarQuadroPolicia(dt, t);
    });
  } else {
    setInterval(() => {
      vincularOnlinePolicia();
      atualizarQuadroPolicia(0.5, performance.now() / 1000);
    }, 500);
  }

  // Hooks globais de tiro [Q], lojinha [E] e conclusão de PIX do evento
  window.CARAGUA_ATIRAR_POLICIA = () => atirarPistolinha(null);
  window.CARAGUA_ABRIR_LOJINHA_POLICIA = () => abrirModalLojaPolicia("");
  window.CARAGUA_NA_LOJINHA_POLICIA = () => {
    if (!TEM_3D || !lojinhaGrupo || !lojinhaPos || !MUNDO || !MUNDO.jog) return false;
    return Math.hypot(MUNDO.jog.position.x - lojinhaPos.x, MUNDO.jog.position.z - lojinhaPos.z) <= 6.2;
  };
  window.addEventListener("caragua:pix_evento_aprovado", () => {
    const online = onlineApi();
    if (online && typeof online.enviarJoinPolicia === "function") {
      online.enviarJoinPolicia().then(() => {
        renderHudPolicia();
        if (modalLojaAberto) renderModalLojaPolicia();
      });
    }
    const inter = interApi();
    if (inter && typeof inter.lancarConfete3D === "function" && MUNDO && MUNDO.jog) {
      inter.lancarConfete3D(MUNDO.jog.position.x, 1.0, MUNDO.jog.position.z, 28);
    }
    mostrarToastPolicia("🎉 PIX APROVADO! Moedas/Vidas/Armas liberadas!");
  });

  // Clique direto na Lojinha, Viaturas, Ladrões NPC ou Adversários para atirar!
  const prevClique = typeof window.CARAGUA_CLIQUE_3D === "function" ? window.CARAGUA_CLIQUE_3D : null;
  window.CARAGUA_CLIQUE_3D = function (e, raycaster, camRef) {
    if (TEM_3D && servidorState && servidorState.status === "active" && raycaster) {
      if (lojinhaGrupo) {
        const hitLoja = raycaster.intersectObject(lojinhaGrupo, true);
        if (hitLoja && hitLoja.length > 0) {
          abrirModalLojaPolicia("");
          return true;
        }
      }
      const me = obterMeuPvp();
      if (me && !isJogadorPresoAgora(me)) {
        const online = onlineApi();
        if (online && typeof online.getPlayersRemotos === "function" && servidorState.pvp) {
          const remotos = online.getPlayersRemotos();
          const estNow = Math.floor((Date.now() + serverDriftMs) / 1000);
          for (let i = 0; i < remotos.length; i++) {
            const rm = remotos[i];
            const rp = servidorState.pvp[rm.pid];
            if (!rp || rp.team === me.team || (Number(rp.lives) || 0) <= 0 || (Number(rp.jailed_until) || 0) > estNow) continue;
            if (rm.grupo) {
              const hitRm = raycaster.intersectObject(rm.grupo, true);
              if (hitRm && hitRm.length > 0 && Math.hypot(rm.x - MUNDO.jog.position.x, rm.z - MUNDO.jog.position.z) <= 36) {
                atirarPistolinha({ tipo: "player", pid: rm.pid, x: rm.x, y: MUNDO.altura(rm.x, rm.z) + 1.35, z: rm.z });
                return true;
              }
            }
          }
        }
        if (me.team === "policia" && ladrões.length > 0) {
          const gruposN = ladrões.filter(l => !l.preso && l.g).map(l => l.g);
          if (gruposN.length > 0) {
            const hitN = raycaster.intersectObjects(gruposN, true);
            if (hitN && hitN.length > 0) {
              let obj = hitN[0].object;
              while (obj && !gruposN.includes(obj)) obj = obj.parent;
              const alvoL = ladrões.find(l => l.g === obj);
              if (alvoL && Math.hypot(alvoL.x - MUNDO.jog.position.x, alvoL.z - MUNDO.jog.position.z) <= 30) {
                atirarPistolinha({ tipo: "npc", id: alvoL.id, tier: alvoL.tier, x: alvoL.x, z: alvoL.z });
                return true;
              }
            }
          }
        }
      }
    }
    if (prevClique && prevClique(e, raycaster, camRef)) return true;
    if (!viaturasCenario.length || !raycaster) return false;
    const grupos = viaturasCenario.map(v => v.g);
    const hits = raycaster.intersectObjects(grupos, true);
    if (hits && hits.length > 0) {
      const inter = interApi();
      if (inter && typeof inter.embarcarViaturaPolicia === "function") {
        inter.embarcarViaturaPolicia();
      }
      return true;
    }
    return false;
  };
})();
