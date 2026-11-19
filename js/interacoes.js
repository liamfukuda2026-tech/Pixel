/* Caraguá Pixel · Interações Gameplay: Carros, Test-Drive, Carona, Salas y=140, Futebol, 10 Moedas, Web Audio e Modo Foto */
(function () {
  "use strict";

  const CHAVE_MOEDAS = "caragua_moedas_v1";
  const CHAVE_SOM = "caragua_som_ativo_v1";
  const Y_SALA = 140;
  const TIPOS_CARRO = new Set(["moto", "bugue", "esportivo", "caminhonete", "jetski", "viatura"]);

  const MUNDO = window.CARAGUA_MUNDO || null;
  const TEM_3D = !!(MUNDO && MUNDO.scene && MUNDO.cam && MUNDO.jog && typeof THREE !== "undefined");

  function onlineApi() {
    return window.CARAGUA_ONLINE || null;
  }

  function avisa(msg) {
    if (MUNDO && typeof MUNDO.avisa === "function") {
      MUNDO.avisa(msg);
    }
  }

  function focoEmInput(ev) {
    const el = (ev && ev.target) || document.activeElement;
    if (!el || !el.closest) return false;
    return !!el.closest("input, textarea, select, [contenteditable]");
  }

  function angDif(a, b) {
    return Math.atan2(Math.sin(b - a), Math.cos(b - a));
  }

  function limita(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  // ---------- Materiais compartilhados ----------
  const mats = new Map();
  function mat(cor, extra) {
    const k = cor + (extra ? JSON.stringify(extra) : "");
    if (!extra && MUNDO && typeof MUNDO.mat === "function") {
      return MUNDO.mat(cor);
    }
    if (!mats.has(k)) {
      mats.set(k, new THREE.MeshStandardMaterial(Object.assign({ color: cor, flatShading: true, roughness: 0.86, metalness: 0.06 }, extra || {})));
    }
    return mats.get(k);
  }

  function descartarGeometrias(grupo) {
    if (!grupo || typeof grupo.traverse !== "function") return;
    grupo.traverse(ch => {
      if (ch.isMesh && ch.geometry && typeof ch.geometry.dispose === "function") {
        ch.geometry.dispose();
      }
    });
  }

  function criarPlaca3D(texto, opcoes) {
    const opts = opcoes || {};
    const cv = document.createElement("canvas");
    cv.width = opts.w || 512;
    cv.height = opts.h || 96;
    const ctx = cv.getContext("2d");
    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    const esc = opts.escala || 0.011;
    sp.scale.set(cv.width * esc, cv.height * esc, 1);

    function redesenhar(novoTexto) {
      const t = String(novoTexto || "");
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.font = opts.fonte || '800 28px "Nunito Sans", "Segoe UI", sans-serif';
      const tw = Math.min(cv.width - 36, ctx.measureText(t).width + 44);
      const W = Math.max(150, tw);
      const H = opts.boxH || 64;
      const x0 = Math.floor((cv.width - W) / 2);
      const y0 = Math.floor((cv.height - H) / 2);

      ctx.fillStyle = "rgba(29, 42, 51, 0.92)";
      ctx.fillRect(x0 + 4, y0 + 4, W, H);
      ctx.fillStyle = opts.fundo || "#fffaf0";
      ctx.fillRect(x0, y0, W, H);
      ctx.lineWidth = 4;
      ctx.strokeStyle = opts.borda || "#1d2a33";
      ctx.strokeRect(x0 + 2, y0 + 2, W - 4, H - 4);

      ctx.fillStyle = opts.cor || "#1d2a33";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t, cv.width / 2, y0 + H / 2 + 1);
      tex.needsUpdate = true;
    }

    redesenhar(texto);
    return { sp, cv, ctx, tex, redesenhar };
  }

  // ---------- 5) Sintetizador Web Audio API Zero-Dependência ----------
  let somAtivo = true;
  try {
    const s = localStorage.getItem(CHAVE_SOM);
    if (s === "0") somAtivo = false;
  } catch (e) { /* noop */ }

  let audioCtx = null;
  let audioDesbloqueado = false;
  let ondasNodes = null;
  let motorNodes = null;
  let sireneNodes = null;
  let sireneAtiva = false;

  function garantirAudio() {
    if (!somAtivo) return null;
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      try {
        audioCtx = new Ctx();
      } catch (e) {
        return null;
      }
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    if (!ondasNodes && audioCtx) {
      iniciarLoopsAmbiente();
    }
    return audioCtx;
  }

  function iniciarLoopsAmbiente() {
    if (!audioCtx || ondasNodes) return;
    try {
      // Ruído filtrado suave para ondas da praia
      const tam = audioCtx.sampleRate * 2;
      const buf = audioCtx.createBuffer(1, tam, audioCtx.sampleRate);
      const ch = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < tam; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + w * 0.029;
        b1 = 0.985 * b1 + w * 0.032;
        b2 = 0.950 * b2 + w * 0.048;
        ch[i] = (b0 + b1 + b2 + w * 0.018) * 0.65;
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const filtro = audioCtx.createBiquadFilter();
      filtro.type = "lowpass";
      filtro.frequency.value = 420;

      const ganho = audioCtx.createGain();
      ganho.gain.value = 0.0001;

      src.connect(filtro);
      filtro.connect(ganho);
      ganho.connect(audioCtx.destination);
      src.start();
      ondasNodes = { src, filtro, ganho };

      // Ronco leve contínuo do motor (volume 0 quando a pé)
      const osc = audioCtx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = 58;

      const filtroMotor = audioCtx.createBiquadFilter();
      filtroMotor.type = "lowpass";
      filtroMotor.frequency.value = 190;

      const ganhoMotor = audioCtx.createGain();
      ganhoMotor.gain.value = 0.0001;

      osc.connect(filtroMotor);
      filtroMotor.connect(ganhoMotor);
      ganhoMotor.connect(audioCtx.destination);
      osc.start();
      motorNodes = { osc, filtroMotor, ganhoMotor };

      // Sirene policial modulada (ativa apenas em viatura com sirene ligada)
      const oscSirene = audioCtx.createOscillator();
      oscSirene.type = "triangle";
      oscSirene.frequency.value = 720;

      const filtroSirene = audioCtx.createBiquadFilter();
      filtroSirene.type = "lowpass";
      filtroSirene.frequency.value = 1850;

      const ganhoSirene = audioCtx.createGain();
      ganhoSirene.gain.value = 0.0001;

      oscSirene.connect(filtroSirene);
      filtroSirene.connect(ganhoSirene);
      ganhoSirene.connect(audioCtx.destination);
      oscSirene.start();
      sireneNodes = { osc: oscSirene, filtro: filtroSirene, ganho: ganhoSirene };
    } catch (e) { /* noop */ }
  }

  function desbloquearAudioNoGesto() {
    if (audioDesbloqueado) return;
    audioDesbloqueado = true;
    if (somAtivo) garantirAudio();
  }
  window.addEventListener("pointerdown", desbloquearAudioNoGesto, { passive: true });
  window.addEventListener("keydown", desbloquearAudioNoGesto, { passive: true });

  function tocarNota(freq0, freq1, dur, tipo, vol, atraso = 0) {
    const ctx = garantirAudio();
    if (!ctx || !somAtivo) return;
    try {
      const t0 = ctx.currentTime + atraso;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = tipo || "sine";
      osc.frequency.setValueAtTime(freq0, t0);
      if (freq1 && freq1 !== freq0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq1), t0 + dur);
      }
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(vol || 0.08, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (e) { /* noop */ }
  }

  function somPulo() {
    tocarNota(210, 470, 0.13, "sine", 0.07);
  }

  function somMoeda() {
    tocarNota(987.77, 987.77, 0.09, "triangle", 0.11, 0);
    tocarNota(1318.51, 1318.51, 0.24, "triangle", 0.12, 0.08);
  }

  function somCelebracao() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      tocarNota(f, f * 1.01, 0.22, "triangle", 0.12, i * 0.09);
    });
  }

  function somCheckpointJetski() {
    tocarNota(660, 880, 0.09, "triangle", 0.11, 0);
    tocarNota(990, 1180, 0.16, "triangle", 0.11, 0.08);
  }

  function somChute() {
    tocarNota(145, 44, 0.11, "triangle", 0.14);
  }

  function somGol() {
    // Apito duplo + acorde de comemoração
    tocarNota(2680, 2790, 0.14, "sine", 0.09, 0);
    tocarNota(2720, 2620, 0.28, "sine", 0.10, 0.17);
    [440, 554.37, 659.25].forEach((f, i) => {
      tocarNota(f, f, 0.35, "triangle", 0.09, 0.22 + i * 0.06);
    });
  }

  function somAlarmeFugaPolicia() {
    // Alarme dramático da Cadeia 79
    [0, 0.42, 0.84].forEach(atraso => {
      tocarNota(420, 760, 0.22, "sawtooth", 0.055, atraso);
      tocarNota(760, 420, 0.20, "sawtooth", 0.05, atraso + 0.20);
    });
  }

  function somCapturaPolicia(pts, isChefao, combo) {
    // Trava metálica da algema + chime policial
    tocarNota(1650, 620, 0.045, "square", 0.07, 0);
    tocarNota(1980, 920, 0.05, "square", 0.07, 0.055);
    const notas = isChefao
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
      : (combo ? [587.33, 880, 1174.66] : [587.33, 880, 987.77]);
    notas.forEach((f, i) => {
      tocarNota(f, f * 1.01, 0.16, "triangle", 0.10, 0.09 + i * 0.065);
    });
  }

  function somTickPolicia() {
    tocarNota(920, 880, 0.06, "sine", 0.06, 0);
  }

  function somPodiumPolicia() {
    [523.25, 659.25, 783.99, 1046.51, 1318.51].forEach((f, i) => {
      tocarNota(f, f, 0.34, "triangle", 0.11, i * 0.11);
    });
  }

  function somTiroPistolinha(weapon) {
    // Barulinho engraçado de pistolinha de água: "piu! piu!"
    tocarNota(1220, 340, 0.085, "sine", 0.10, 0);
    tocarNota(820, 420, 0.06, "triangle", 0.065, 0.02);
    if (weapon === "dupla" || weapon === "super") {
      tocarNota(1380, 390, 0.085, "sine", 0.09, 0.09);
    }
    if (weapon === "super") {
      tocarNota(1560, 460, 0.09, "triangle", 0.08, 0.17);
    }
  }

  function somHitAgua() {
    tocarNota(480, 210, 0.09, "triangle", 0.09, 0);
    tocarNota(760, 920, 0.06, "sine", 0.05, 0.04);
  }

  function toggleSireneViatura(forcar) {
    if (typeof forcar === "boolean") sireneAtiva = forcar;
    else sireneAtiva = !sireneAtiva;
    if (sireneAtiva && somAtivo) garantirAudio();
    if (!sireneAtiva && sireneNodes && audioCtx) {
      sireneNodes.ganho.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.06);
    }
    return sireneAtiva;
  }

  function somChatPop() {
    tocarNota(560, 880, 0.075, "sine", 0.065);
  }

  let ultimaBuzinaMs = 0;
  function buzinar() {
    const agora = performance.now();
    if (agora - ultimaBuzinaMs < 240) return;
    ultimaBuzinaMs = agora;
    const ehMoto = carroAtual && carroAtual.tipo === "moto";
    if (ehMoto) {
      tocarNota(620, 610, 0.12, "sawtooth", 0.065, 0);
      tocarNota(620, 610, 0.14, "sawtooth", 0.065, 0.15);
    } else {
      tocarNota(415, 415, 0.18, "sawtooth", 0.055, 0);
      tocarNota(523.25, 523.25, 0.18, "sawtooth", 0.055, 0);
      tocarNota(415, 415, 0.22, "sawtooth", 0.055, 0.21);
      tocarNota(523.25, 523.25, 0.22, "sawtooth", 0.055, 0.21);
    }
  }

  function toggleSom() {
    somAtivo = !somAtivo;
    try {
      localStorage.setItem(CHAVE_SOM, somAtivo ? "1" : "0");
    } catch (e) { /* noop */ }
    if (!somAtivo && audioCtx) {
      if (ondasNodes) ondasNodes.ganho.gain.value = 0.0001;
      if (motorNodes) motorNodes.ganhoMotor.gain.value = 0.0001;
      if (sireneNodes) sireneNodes.ganho.gain.value = 0.0001;
    } else if (somAtivo) {
      garantirAudio();
      tocarNota(660, 880, 0.08, "sine", 0.06);
    }
    return somAtivo;
  }

  function isSomAtivo() {
    return !!somAtivo;
  }

  // Registra callback de som de nova mensagem no chat
  function vincularCallbacksOnline() {
    const api = onlineApi();
    if (!api || vincularCallbacksOnline.feito) return;
    vincularCallbacksOnline.feito = true;
    if (typeof api.onSomMensagem === "function") {
      api.onSomMensagem(() => {
        somChatPop();
      });
    }
    if (typeof api.onBolaServidor === "function") {
      api.onBolaServidor(receberBolaRede);
    }
  }
  vincularCallbacksOnline();

  // ---------- Builder Voxel de Carros (usa compartilhado ou fallback autônomo) ----------
  const ASSENTO_CARRO_FALLBACK = {
    moto: { driver: [0, 0.50, 0.08], carona: [0, 0.58, 0.68] },
    bugue: { driver: [-0.42, 0.52, 0.16], carona: [0.42, 0.52, 0.16] },
    esportivo: { driver: [-0.45, 0.38, 0.18], carona: [0.45, 0.38, 0.18] },
    caminhonete: { driver: [-0.48, 0.66, -0.06], carona: [0.48, 0.66, -0.06] },
    jetski: { driver: [0, 0.48, 0.06], carona: [0, 0.56, 0.66] },
    viatura: { driver: [-0.45, 0.56, 0.08], carona: [0.45, 0.56, 0.08] }
  };

  function construirCarroVoxel(tipo, corCustom) {
    if (typeof window.CARAGUA_CRIAR_VEICULO === "function") {
      return window.CARAGUA_CRIAR_VEICULO(tipo, corCustom);
    }
    const g = new THREE.Group();
    const rodas = [];
    const cor = corCustom != null ? corCustom : (tipo === "bugue" ? 0xff922b : (tipo === "caminhonete" ? 0x1c7ed6 : 0xe03131));
    const corpo = new THREE.Mesh(new THREE.BoxGeometry(tipo === "moto" ? 0.42 : 1.95, 0.65, tipo === "moto" ? 1.8 : 3.8), mat(cor));
    corpo.position.y = 0.82;
    corpo.castShadow = true;
    g.add(corpo);
    [[-0.95, -1.2], [0.95, -1.2], [-0.95, 1.2], [0.95, 1.2]].forEach(([x, z]) => {
      if (tipo === "moto" && x < 0) return;
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 10).rotateZ(Math.PI / 2), mat(0x1d1d1d));
      r.position.set(tipo === "moto" ? 0 : x, 0.42, z);
      g.add(r);
      rodas.push(r);
    });
    g.userData.rodas = rodas;
    g.userData.assento = ASSENTO_CARRO_FALLBACK[tipo] || ASSENTO_CARRO_FALLBACK.bugue;
    return g;
  }

  function obterAssento(tipo) {
    const tab = window.CARAGUA_ASSENTO_CARRO || ASSENTO_CARRO_FALLBACK;
    return tab[tipo] || tab.bugue;
  }

  function obterJogVox() {
    if (!TEM_3D || !MUNDO.jog) return null;
    for (let i = 0; i < MUNDO.jog.children.length; i++) {
      const ch = MUNDO.jog.children[i];
      if (ch && ch.userData && ch.userData.pivos) return ch;
    }
    return null;
  }

  function resetarPoseJogVox() {
    const vox = obterJogVox();
    if (!vox) return;
    vox.position.set(0, 0, 0);
    vox.rotation.set(0, Math.PI, 0);
    const pv = vox.userData.pivos || {};
    if (pv.P0) pv.P0.rotation.set(0, 0, 0);
    if (pv.P1) pv.P1.rotation.set(0, 0, 0);
    if (pv.B0) pv.B0.rotation.set(0, 0, 0);
    if (pv.B1) pv.B1.rotation.set(0, 0, 0);
  }

  function aplicarPoseSentadoLocal(assentoVec, jumpExtra) {
    const vox = obterJogVox();
    if (!vox) return;
    vox.rotation.set(0, Math.PI, 0);
    vox.position.set(assentoVec[0], assentoVec[1] + (jumpExtra || 0), assentoVec[2]);
    const pv = vox.userData.pivos || {};
    const pe = MUNDO && typeof MUNDO.getPuloEmote === "function" ? MUNDO.getPuloEmote() : null;
    const em = pe && pe.emote ? pe.emote : "";
    if (pv.P0) pv.P0.rotation.set(-1.32, 0, 0);
    if (pv.P1) pv.P1.rotation.set(-1.32, 0, 0);
    if (!em) {
      if (pv.B0) pv.B0.rotation.set(-0.78, 0, 0);
      if (pv.B1) pv.B1.rotation.set(-0.78, 0, 0);
    }
  }

  // ---------- Teclado fallback + leitura unificada de movimento ----------
  const teclasFallback = new Set();
  window.addEventListener("keydown", e => {
    if (focoEmInput(e)) return;
    const k = e.key.toLowerCase();
    if (["w", "arrowup"].includes(k)) teclasFallback.add("frente");
    if (["s", "arrowdown"].includes(k)) teclasFallback.add("tras");
    if (["a", "arrowleft"].includes(k)) teclasFallback.add("esq");
    if (["d", "arrowright"].includes(k)) teclasFallback.add("dir");
    if (k === "shift") teclasFallback.add("corre");
  });
  window.addEventListener("keyup", e => {
    const k = e.key.toLowerCase();
    if (["w", "arrowup"].includes(k)) teclasFallback.delete("frente");
    if (["s", "arrowdown"].includes(k)) teclasFallback.delete("tras");
    if (["a", "arrowleft"].includes(k)) teclasFallback.delete("esq");
    if (["d", "arrowright"].includes(k)) teclasFallback.delete("dir");
    if (k === "shift") teclasFallback.delete("corre");
  });
  window.addEventListener("blur", () => teclasFallback.clear());

  function lerMovimentoInput() {
    const m = MUNDO && typeof MUNDO.getTeclasMovimento === "function"
      ? MUNDO.getTeclasMovimento()
      : null;
    let frente = !!(m ? m.frente : teclasFallback.has("frente"));
    let tras = !!(m ? m.tras : teclasFallback.has("tras"));
    let esq = !!(m ? m.esq : teclasFallback.has("esq"));
    let dir = !!(m ? m.dir : teclasFallback.has("dir"));

    const joy = MUNDO && typeof MUNDO.getJoy === "function" ? MUNDO.getJoy() : null;
    let joyAtivo = !!(joy && joy.ativo);
    let analogX = joy && Math.abs(joy.x) > 0.12 ? joy.x : 0;
    let analogY = joy && Math.abs(joy.y) > 0.12 ? joy.y : 0;

    // Fallback ao joystick touch no mobile (#pino dentro de #joy)
    if (!joyAtivo) {
      const pino = document.getElementById("pino");
      if (pino && pino.style && pino.style.transform) {
        const match = pino.style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
        if (match) {
          const jx = parseFloat(match[1]) || 0;
          const jy = parseFloat(match[2]) || 0;
          if (jy < -10) frente = true;
          if (jy > 10) tras = true;
          if (jx < -10) esq = true;
          if (jx > 10) dir = true;
          analogX = Math.abs(jx) > 4.8 ? limita(jx / 40, -1, 1) : 0;
          analogY = Math.abs(jy) > 4.8 ? limita(jy / 40, -1, 1) : 0;
          joyAtivo = Math.abs(jx) > 2 || Math.abs(jy) > 2;
        }
      }
    }
    return { frente, tras, esq, dir, analogX, analogY, joyAtivo, corre: teclasFallback.has("corre") };
  }

  // ---------- 1) Carros Dirigíveis + Bugue Test-Drive na Praia + Carona [F] ----------
  const BUGUE_PRAIA_POS = { x: 24.5, z: 36.0, ry: -Math.PI / 2 };
  let buguePraiaGrupo = null;
  let buguePraiaHit = null;
  let carroAtual = null; // { tipo, mesh, vel, testDrive, tempoRestante, avisou10s }
  let caronaPid = "";

  const VEL_MAX_CARRO = {
    moto: 36,
    bugue: 34,
    esportivo: 44,
    caminhonete: 38,
    jetski: 46,
    viatura: 45
  };

  // ---------- 1B) Marina de Jet Ski & Corrida Aquática (6 Boias no Mar) ----------
  const CHAVE_RECORDE_JETSKI = "caragua_jetski_recorde_v1";
  const JETSKI_MARINA_POS = { x: -24.0, z: 72.5, aguaX: -24.0, aguaZ: 78.5, ry: Math.PI };
  const BOIAS_CORRIDA_JETSKI = [
    { x: -24, z: 88, ry: 0, nome: "Largada / Chegada" },
    { x: -84, z: 108, ry: 0.45, nome: "Curva Oeste" },
    { x: -116, z: 146, ry: -0.35, nome: "Mar Aberto" },
    { x: -40, z: 162, ry: -1.45, nome: "Reta do Horizonte" },
    { x: 46, z: 150, ry: -1.95, nome: "Boia Leste" },
    { x: 86, z: 106, ry: 2.35, nome: "Curva do Pier" }
  ];
  let jetskiMarinaGrupo = null;
  let jetskiMarinaHit = null;
  let setaGuiaJetski = null;
  const portaisBoiaMeshes = [];
  let hudJetskiEl = null;
  let hudJetskiBoiaEl = null;
  let hudJetskiTempoEl = null;
  let hudJetskiRecordeEl = null;
  let proximoSprayMs = 0;

  function lerRecordeJetski() {
    try {
      const v = Number(localStorage.getItem(CHAVE_RECORDE_JETSKI));
      return Number.isFinite(v) && v > 0 ? v : 0;
    } catch (e) {
      return 0;
    }
  }

  function salvarRecordeJetski(ms) {
    try {
      localStorage.setItem(CHAVE_RECORDE_JETSKI, String(Math.round(ms)));
    } catch (e) { /* noop */ }
  }

  const corridaJetski = {
    ativa: false,
    boiaIdx: 0,
    passouMeio: false,
    iniciouCronometro: false,
    inicioMs: 0,
    voltas: 0,
    melhorMs: lerRecordeJetski()
  };

  if (TEM_3D) {
    buguePraiaGrupo = new THREE.Group();
    const baseTapete = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.6, 0.08, 20),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.45 })
    );
    baseTapete.position.y = 0.05;
    buguePraiaGrupo.add(baseTapete);

    const meshBugue = construirCarroVoxel("bugue", 0xff922b);
    meshBugue.rotation.y = BUGUE_PRAIA_POS.ry;
    buguePraiaGrupo.add(meshBugue);

    const placaBugue = criarPlaca3D("🏖️ Bugue Test-Drive [E]", {
      w: 520,
      h: 92,
      escala: 0.0105,
      fundo: "#fffbeb",
      borda: "#d97706",
      cor: "#1d2a33"
    });
    placaBugue.sp.position.set(0, 3.6, 0);
    buguePraiaGrupo.add(placaBugue.sp);

    buguePraiaHit = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 2.8, 2.8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    buguePraiaHit.position.set(0, 1.4, 0);
    buguePraiaGrupo.add(buguePraiaHit);

    buguePraiaGrupo.position.set(
      BUGUE_PRAIA_POS.x,
      MUNDO.altura(BUGUE_PRAIA_POS.x, BUGUE_PRAIA_POS.z),
      BUGUE_PRAIA_POS.z
    );
    MUNDO.scene.add(buguePraiaGrupo);

    // Clique 3D encadeado no Bugue Test-Drive sem bloquear casas/lotes/jogadores
    const prevClique = typeof window.CARAGUA_CLIQUE_3D === "function" ? window.CARAGUA_CLIQUE_3D : null;
    window.CARAGUA_CLIQUE_3D = function (e, raycaster, camRef) {
      if (prevClique && prevClique(e, raycaster, camRef)) return true;
      if (buguePraiaGrupo && buguePraiaGrupo.visible && buguePraiaHit && raycaster && !salaAtual) {
        const hits = raycaster.intersectObject(buguePraiaHit, false);
        if (hits.length > 0) {
          const d = Math.hypot(MUNDO.jog.position.x - BUGUE_PRAIA_POS.x, MUNDO.jog.position.z - BUGUE_PRAIA_POS.z);
          if (d <= 14) {
            iniciarTestDrive("bugue");
          } else if (typeof MUNDO.voarAte === "function") {
            MUNDO.voarAte(BUGUE_PRAIA_POS.x, BUGUE_PRAIA_POS.z - 4, "🏖️ Chegue perto e aperte [E] para Test-Drive Grátis!");
          }
          return true;
        }
      }
      return false;
    };

    // Marina de Jet Ski na beira da praia (deck + 2 jet skis ancorados + 6 portais no mar)
    jetskiMarinaGrupo = new THREE.Group();
    const deckTabua = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.34, 5.4),
      mat(0x9c6644)
    );
    deckTabua.position.set(0, 0.28, 0.8);
    deckTabua.castShadow = true;
    deckTabua.receiveShadow = true;
    jetskiMarinaGrupo.add(deckTabua);

    [[-3.2, -1.6], [3.2, -1.6], [-3.2, 3.2], [3.2, 3.2]].forEach(([px, pz]) => {
      const estaca = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.88, 0.32), mat(0x582f0e));
      estaca.position.set(px, 0.38, pz);
      estaca.castShadow = true;
      jetskiMarinaGrupo.add(estaca);
    });

    const jsDoca1 = construirCarroVoxel("jetski", 0x22b8cf);
    jsDoca1.position.set(-1.6, 0.1, 5.0);
    jsDoca1.rotation.y = Math.PI;
    const jsDoca2 = construirCarroVoxel("jetski", 0xfcc419);
    jsDoca2.position.set(1.6, 0.1, 5.0);
    jsDoca2.rotation.y = Math.PI;
    jetskiMarinaGrupo.add(jsDoca1, jsDoca2);

    const placaJetski = criarPlaca3D("🌊 Jet Ski Grátis & Corrida [E]", {
      w: 560,
      h: 92,
      escala: 0.0108,
      fundo: "#ecfeff",
      borda: "#0891b2",
      cor: "#0f172a"
    });
    placaJetski.sp.position.set(0, 3.85, 1.5);
    jetskiMarinaGrupo.add(placaJetski.sp);

    jetskiMarinaHit = new THREE.Mesh(
      new THREE.BoxGeometry(7.6, 3.2, 7.6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    jetskiMarinaHit.position.set(0, 1.5, 2.2);
    jetskiMarinaGrupo.add(jetskiMarinaHit);

    jetskiMarinaGrupo.position.set(
      JETSKI_MARINA_POS.x,
      MUNDO.altura(JETSKI_MARINA_POS.x, JETSKI_MARINA_POS.z),
      JETSKI_MARINA_POS.z
    );
    MUNDO.scene.add(jetskiMarinaGrupo);

    // 6 Portais de Boias no Mar
    BOIAS_CORRIDA_JETSKI.forEach((b, idx) => {
      const pg = new THREE.Group();
      pg.position.set(b.x, 0.05, b.z);
      pg.rotation.y = b.ry || 0;

      const makeBoia = (bx, corTop) => {
        const bg = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.65, 10), mat(corTop));
        base.position.y = 0.22;
        const mastro = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.8, 0.24), mat(0xffffff));
        mastro.position.y = 1.65;
        const luzMat = new THREE.MeshBasicMaterial({ color: corTop });
        const luz = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), luzMat);
        luz.position.y = 3.2;
        bg.add(base, mastro, luz);
        bg.position.x = bx;
        pg.add(bg);
        return luzMat;
      };

      const boiaMatL = makeBoia(-4.75, 0xf03e3e);
      const boiaMatR = makeBoia(4.75, 0xfcc419);

      const arcoMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x4fd06f : 0x38bdf8,
        transparent: true,
        opacity: 0.72
      });
      const arco = new THREE.Mesh(
        new THREE.TorusGeometry(4.75, 0.16, 8, 20, Math.PI),
        arcoMat
      );
      arco.position.y = 2.8;
      pg.add(arco);

      const placaPortal = criarPlaca3D(
        idx === 0 ? "🏁 Boia 1/6 · LARGADA" : "🌊 Boia " + (idx + 1) + "/6",
        {
          w: 440,
          h: 82,
          escala: 0.0115,
          fundo: idx === 0 ? "#dcfce7" : "#0f172a",
          borda: idx === 0 ? "#16a34a" : "#38bdf8",
          cor: idx === 0 ? "#064e3b" : "#f8fafc"
        }
      );
      placaPortal.sp.position.set(0, 8.2, 0);
      pg.add(placaPortal.sp);

      MUNDO.scene.add(pg);
      portaisBoiaMeshes.push({ grupo: pg, arcoMat, boiaMatL, boiaMatR, placa: placaPortal });
    });

    // Seta 3D flutuante apontando para a próxima boia ativa
    setaGuiaJetski = new THREE.Group();
    const setaHaste = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.85), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    setaHaste.position.z = -0.35;
    const setaPonta = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.7, 4).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x4fd06f }));
    setaPonta.position.z = 0.4;
    setaGuiaJetski.add(setaHaste, setaPonta);
    setaGuiaJetski.visible = false;
    MUNDO.scene.add(setaGuiaJetski);

    // Encadeia clique 3D na Marina de Jet Ski
    const prevCliqueJetski = typeof window.CARAGUA_CLIQUE_3D === "function" ? window.CARAGUA_CLIQUE_3D : null;
    window.CARAGUA_CLIQUE_3D = function (e, raycaster, camRef) {
      if (prevCliqueJetski && prevCliqueJetski(e, raycaster, camRef)) return true;
      if (jetskiMarinaGrupo && jetskiMarinaHit && raycaster && !salaAtual) {
        const hits = raycaster.intersectObject(jetskiMarinaHit, false);
        if (hits.length > 0) {
          const d = Math.hypot(MUNDO.jog.position.x - JETSKI_MARINA_POS.x, MUNDO.jog.position.z - JETSKI_MARINA_POS.z);
          if (d <= 16) {
            iniciarCorridaJetski();
          } else if (typeof MUNDO.voarAte === "function") {
            MUNDO.voarAte(JETSKI_MARINA_POS.x, JETSKI_MARINA_POS.z - 4, "🌊 Chegue perto e aperte [E] para pilotar o Jet Ski no mar!");
          }
          return true;
        }
      }
      return false;
    };
  }

  function posSeguraMapa(x, z) {
    const L = (MUNDO && MUNDO.LIM) || { x0: -409, x1: 406, z0: -483, z1: 183 };
    const marLim = (MUNDO && Number.isFinite(MUNDO.MARZ) ? MUNDO.MARZ : 74) - 0.5;
    const nx = limita(x, L.x0, L.x1);
    let nz = limita(z, L.z0, L.z1);
    const pode = MUNDO && typeof MUNDO.podeAndar === "function"
      ? MUNDO.podeAndar(nx, nz)
      : (nz <= marLim || (Math.abs(nx - 160) <= 1.85 && nz <= 174) || Math.hypot(nx - 160, nz - 174) <= 8.2);
    if (!pode && nz > marLim) {
      nz = marLim;
    }
    return [nx, nz];
  }

  function posSeguraJetski(x, z) {
    const L = (MUNDO && MUNDO.LIM) || { x0: -409, x1: 406, z0: -483, z1: 183 };
    const marMin = (MUNDO && Number.isFinite(MUNDO.MARZ) ? MUNDO.MARZ : 74) + 1.5;
    const nx = limita(x, L.x0 + 2, L.x1 - 2);
    const nz = limita(z, marMin, 235);
    if (Math.abs(nx - 160) < 4.2 && nz <= 183) {
      return [nx < 160 ? 155.8 : 164.2, nz];
    }
    if (Math.hypot(nx - 160, nz - 174) < 11.2) {
      const ang = Math.atan2(nz - 174, nx - 160);
      return [160 + Math.cos(ang) * 11.2, 174 + Math.sin(ang) * 11.2];
    }
    return [nx, nz];
  }

  function garantirHudJetski() {
    if (hudJetskiEl) return hudJetskiEl;
    const wrap = document.createElement("div");
    wrap.id = "hud-corrida-jetski";
    wrap.hidden = true;
    wrap.style.cssText = [
      "position:fixed",
      "top:calc(var(--topo-h, 54px) + 12px)",
      "left:50%",
      "transform:translateX(-50%)",
      "z-index:120",
      "display:flex",
      "align-items:center",
      "gap:8px",
      "flex-wrap:wrap",
      "justify-content:center",
      "max-width:calc(100vw - 24px)",
      "padding:8px 12px",
      "background:rgba(13,16,32,0.92)",
      "color:#fffaf0",
      "border:2px solid #22b8cf",
      "box-shadow:4px 4px 0 #05070e",
      'font-family:"Nunito Sans","Segoe UI",sans-serif',
      "font-size:12.5px",
      "font-weight:800"
    ].join(";");

    const tag = document.createElement("span");
    tag.style.color = "#22b8cf";
    tag.textContent = "🌊 CORRIDA JET SKI";

    hudJetskiBoiaEl = document.createElement("span");
    hudJetskiBoiaEl.style.color = "#facc15";
    hudJetskiBoiaEl.textContent = "Boia 1/6";

    hudJetskiTempoEl = document.createElement("span");
    hudJetskiTempoEl.style.fontVariantNumeric = "tabular-nums";
    hudJetskiTempoEl.textContent = "⏱️ 00.0s";

    hudJetskiRecordeEl = document.createElement("span");
    hudJetskiRecordeEl.style.color = "#4fd06f";
    hudJetskiRecordeEl.textContent = "🏆 --";

    const mkBtn = (txt, bg, fn) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = txt;
      b.style.cssText = [
        "appearance:none",
        "background:" + bg,
        "color:#0a0f1d",
        "border:2px solid #05070e",
        "padding:4px 9px",
        "font-weight:800",
        "font-size:11.5px",
        "cursor:pointer"
      ].join(";");
      b.addEventListener("click", fn);
      return b;
    };

    const btnReset = mkBtn("🔄 Reiniciar", "#fbbf24", () => iniciarCorridaJetski());
    const btnSair = mkBtn("🏖️ Areia [E]", "#e2e8f0", () => sairCarro(false));

    wrap.append(tag, hudJetskiBoiaEl, hudJetskiTempoEl, hudJetskiRecordeEl, btnReset, btnSair);
    document.body.appendChild(wrap);
    hudJetskiEl = wrap;
    return wrap;
  }

  function atualizarHudJetski(nowMs) {
    if (!hudJetskiEl) return;
    if (!carroAtual || carroAtual.tipo !== "jetski" || !corridaJetski.ativa) {
      hudJetskiEl.hidden = true;
      return;
    }
    hudJetskiEl.hidden = false;
    const total = BOIAS_CORRIDA_JETSKI.length;
    if (corridaJetski.boiaIdx === 0 && !corridaJetski.iniciouCronometro) {
      hudJetskiBoiaEl.textContent = "Passe na Largada (1/6)";
      hudJetskiTempoEl.textContent = "⏱️ 00.0s";
    } else if (corridaJetski.boiaIdx === 0 && corridaJetski.passouMeio) {
      hudJetskiBoiaEl.textContent = "🏁 CHEGADA (Rumo à 1/6)";
      const seg = Math.max(0, (nowMs - corridaJetski.inicioMs) / 1000);
      hudJetskiTempoEl.textContent = "⏱️ " + seg.toFixed(1) + "s";
    } else {
      hudJetskiBoiaEl.textContent = "Boia " + (corridaJetski.boiaIdx + 1) + "/" + total;
      const seg = Math.max(0, (nowMs - corridaJetski.inicioMs) / 1000);
      hudJetskiTempoEl.textContent = "⏱️ " + seg.toFixed(1) + "s";
    }
    hudJetskiRecordeEl.textContent = corridaJetski.melhorMs > 0
      ? ("🏆 " + (corridaJetski.melhorMs / 1000).toFixed(1) + "s")
      : "🏆 --";
  }

  function montarEmVeiculoInterno(tipo, ehTestDrive) {
    if (!TEM_3D) return false;
    const t = TIPOS_CARRO.has(String(tipo || "").toLowerCase()) ? String(tipo).toLowerCase() : "bugue";

    if (salaAtual) {
      sairSalaInterna(true);
    }
    if (caronaPid) {
      sairCarona(true);
    }
    if (carroAtual) {
      MUNDO.jog.remove(carroAtual.mesh);
      descartarGeometrias(carroAtual.mesh);
      carroAtual = null;
    }

    const mesh = construirCarroVoxel(t);
    MUNDO.jog.add(mesh);

    carroAtual = {
      tipo: t,
      mesh,
      vel: 0,
      testDrive: !!ehTestDrive,
      tempoRestante: ehTestDrive ? 60 : 0,
      avisou10s: false
    };

    if (buguePraiaGrupo && ehTestDrive && t === "bugue") {
      buguePraiaGrupo.visible = false;
    }

    if (typeof MUNDO.setControleExterno === "function") {
      MUNDO.setControleExterno(true);
    }
    const api = onlineApi();
    if (api && typeof api.setEstadoInteracao === "function") {
      api.setEstadoInteracao({ car_type: t, ride_of: "", room: "" });
    }

    garantirAudio();
    sireneAtiva = (t === "viatura");
    const nomes = {
      moto: "Moto",
      bugue: "Bugue de Praia",
      esportivo: "Esportivo",
      caminhonete: "Caminhonete 4x4",
      jetski: "Jet Ski Turbo",
      viatura: "Viatura da Polícia"
    };
    if (ehTestDrive) {
      avisa("🏁 Test-Drive de 60s liberado (" + (nomes[t] || t) + ")! WASD dirige · [H] Buzina · [E] Sair");
    } else if (t === "viatura") {
      avisa("🚓 Na Viatura! Encoste nos ladrões para prender · [G] Sirene · [F] Carona · [E] Sair");
    } else if (t !== "jetski") {
      avisa("🚗 Dirigindo " + (nomes[t] || t) + "! WASD dirige · [H] Buzina · [E] Sair");
    }
    return true;
  }

  function iniciarCorridaJetski() {
    if (!TEM_3D || !MUNDO.jog) return false;
    if (!montarEmVeiculoInterno("jetski", false)) return false;
    MUNDO.jog.position.set(JETSKI_MARINA_POS.aguaX, 0.1, JETSKI_MARINA_POS.aguaZ);
    MUNDO.jog.rotation.y = JETSKI_MARINA_POS.ry;
    corridaJetski.ativa = true;
    corridaJetski.boiaIdx = 0;
    corridaJetski.passouMeio = false;
    corridaJetski.iniciouCronometro = false;
    corridaJetski.inicioMs = performance.now();
    garantirHudJetski();
    atualizarHudJetski(performance.now());
    if (setaGuiaJetski) setaGuiaJetski.visible = true;
    avisa("🌊 Jet Ski na água! Passe pelos arcos das 6 boias para completar a volta! [E] voltar à areia");
    return true;
  }

  function iniciarTestDrive(tipo) {
    return montarEmVeiculoInterno(tipo || "bugue", true);
  }

  function embarcarMeuCarro(tipo) {
    if (String(tipo || "").toLowerCase() === "jetski") {
      return iniciarCorridaJetski();
    }
    return montarEmVeiculoInterno(tipo || "esportivo", false);
  }

  function embarcarViaturaPolicia() {
    return montarEmVeiculoInterno("viatura", false);
  }

  function sairCarro(silencioso) {
    sireneAtiva = false;
    if (sireneNodes && audioCtx) {
      try { sireneNodes.ganho.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.05); } catch (e) {}
    }
    if (caronaPid) {
      sairCarona(silencioso);
      return;
    }
    if (!carroAtual) return;
    const eraJetski = carroAtual.tipo === "jetski";
    corridaJetski.ativa = false;
    corridaJetski.iniciouCronometro = false;
    if (hudJetskiEl) hudJetskiEl.hidden = true;
    if (setaGuiaJetski) setaGuiaJetski.visible = false;
    if (TEM_3D && MUNDO.jog) {
      MUNDO.jog.remove(carroAtual.mesh);
      descartarGeometrias(carroAtual.mesh);
      resetarPoseJogVox();
      const marLim = (MUNDO && Number.isFinite(MUNDO.MARZ) ? MUNDO.MARZ : 74) - 1;
      if (eraJetski || MUNDO.jog.position.z > marLim) {
        const ax = JETSKI_MARINA_POS.x;
        const az = JETSKI_MARINA_POS.z - 1.5;
        MUNDO.jog.position.set(ax, MUNDO.altura(ax, az), az);
      } else {
        MUNDO.jog.position.y = MUNDO.altura(MUNDO.jog.position.x, MUNDO.jog.position.z);
      }
    }
    if (buguePraiaGrupo) {
      buguePraiaGrupo.visible = true;
    }
    carroAtual = null;
    if (MUNDO && typeof MUNDO.setControleExterno === "function" && !salaAtual) {
      MUNDO.setControleExterno(false);
    }
    const api = onlineApi();
    if (api && typeof api.setEstadoInteracao === "function") {
      api.setEstadoInteracao({ car_type: "" });
    }
    if (motorNodes && audioCtx) {
      motorNodes.ganhoMotor.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.08);
    }
    if (!silencioso) {
      avisa("🚶 Você saiu do veículo.");
    }
  }

  function buscarMotoristaProximo() {
    if (!TEM_3D || salaAtual || carroAtual || caronaPid) return null;
    const api = onlineApi();
    if (!api || typeof api.getPlayersRemotos !== "function") return null;
    const remotos = api.getPlayersRemotos();
    const px = MUNDO.jog.position.x;
    const pz = MUNDO.jog.position.z;
    let melhor = null;
    let menorD = 8.5;
    for (let i = 0; i < remotos.length; i++) {
      const r = remotos[i];
      if (!r || !r.car_type || r.room) continue;
      const d = Math.hypot(r.x - px, r.z - pz);
      if (d <= menorD) {
        menorD = d;
        melhor = r;
      }
    }
    return melhor;
  }

  function pegarCarona(pidMotorista) {
    if (!TEM_3D || salaAtual) return false;
    const api = onlineApi();
    if (!api || typeof api.getPlayersRemotos !== "function") return false;
    const alvoPid = pidMotorista || (buscarMotoristaProximo() && buscarMotoristaProximo().pid);
    if (!alvoPid) return false;
    const drv = api.getPlayersRemotos().find(r => r.pid === alvoPid && r.car_type && !r.room);
    if (!drv) {
      avisa("Chegue perto de um jogador dirigindo para pegar carona!");
      return false;
    }
    if (carroAtual) sairCarro(true);
    caronaPid = drv.pid;
    if (typeof MUNDO.setControleExterno === "function") {
      MUNDO.setControleExterno(true);
    }
    api.setEstadoInteracao({ ride_of: drv.pid, car_type: "" });
    avisa("🚗 De carona com " + drv.nome + "! Aperte [F] para descer.");
    return true;
  }

  function sairCarona(silencioso) {
    if (!caronaPid) return;
    caronaPid = "";
    if (TEM_3D && MUNDO.jog) {
      const ry = MUNDO.jog.rotation.y;
      const [sx, sz] = posSeguraMapa(
        MUNDO.jog.position.x + Math.cos(ry) * 1.8,
        MUNDO.jog.position.z - Math.sin(ry) * 1.8
      );
      MUNDO.jog.position.set(sx, MUNDO.altura(sx, sz), sz);
      resetarPoseJogVox();
    }
    if (MUNDO && typeof MUNDO.setControleExterno === "function" && !salaAtual && !carroAtual) {
      MUNDO.setControleExterno(false);
    }
    const api = onlineApi();
    if (api && typeof api.setEstadoInteracao === "function") {
      api.setEstadoInteracao({ ride_of: "" });
    }
    if (!silencioso) {
      avisa("🚶 Você desceu da carona.");
    }
  }

  // ---------- 2) Salas 3D Entráveis em y = 140 ----------
  let salaAtual = null; // { id, room, label, interiorTipo, x, z }
  let retornoRua = { x: 0, z: 28, ry: Math.PI };
  let grupoSala = null;
  let mobiliaSala = null;
  let placaTituloSala = null;
  let colisoesSala = [];
  let passoSala = 0;

  const PORTAS_FALLBACK = [
    { id: "porta_prefeitura_fb", room: "prefeitura", label: "Prefeitura Municipal", x: 33.5, z: -20.9, interiorTipo: "prefeitura" },
    { id: "porta_posto_fb", room: "consultorio", label: "Posto Médico & Conveniência", x: -21.5, z: -22.5, interiorTipo: "consultorio" }
  ];

  function obterPortasAtivas() {
    if (MUNDO && Array.isArray(MUNDO.pontosPortas) && MUNDO.pontosPortas.length > 0) {
      return MUNDO.pontosPortas;
    }
    return PORTAS_FALLBACK;
  }

  function garantirEstruturaSala() {
    if (!TEM_3D || grupoSala) return;
    grupoSala = new THREE.Group();
    grupoSala.position.set(0, Y_SALA, 0);
    grupoSala.visible = false;

    const luzSala = new THREE.PointLight(0xfff5dc, 1.15, 42);
    luzSala.position.set(0, 6.2, 0);
    grupoSala.add(luzSala);

    const luzAmb = new THREE.PointLight(0xdbeafe, 0.45, 30);
    luzAmb.position.set(0, 4.5, 4.5);
    grupoSala.add(luzAmb);

    mobiliaSala = new THREE.Group();
    grupoSala.add(mobiliaSala);

    placaTituloSala = criarPlaca3D("Sala Privada", {
      w: 560,
      h: 92,
      escala: 0.0105,
      fundo: "#1d2a33",
      borda: "#fbbf24",
      cor: "#fbbf24"
    });
    placaTituloSala.sp.position.set(0, 4.9, -6.5);
    grupoSala.add(placaTituloSala.sp);

    const placaSaida = criarPlaca3D("🚪 Porta de Saída [E]", {
      w: 440,
      h: 84,
      escala: 0.009,
      fundo: "#fffaf0",
      borda: "#2f9e44",
      cor: "#1d2a33"
    });
    placaSaida.sp.position.set(0, 2.65, 6.35);
    grupoSala.add(placaSaida.sp);

    MUNDO.scene.add(grupoSala);
  }

  function popularMobiliaSala(tipoBruto, tituloSala) {
    garantirEstruturaSala();
    if (!mobiliaSala) return;
    while (mobiliaSala.children.length > 0) {
      const ch = mobiliaSala.children[0];
      mobiliaSala.remove(ch);
      descartarGeometrias(ch);
    }
    colisoesSala = [];

    const tipo = String(tipoBruto || "casa").toLowerCase();
    placaTituloSala.redesenhar("🏠 " + (tituloSala || "Interior"));

    const bx = (w, h, d, cor, x, y, z, colide = false, extraMat = null) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(cor, extraMat));
      m.position.set(x, y + h / 2, z);
      m.castShadow = true;
      m.receiveShadow = true;
      mobiliaSala.add(m);
      if (colide) {
        colisoesSala.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
      }
      return m;
    };

    const corPiso = tipo.includes("consult") ? 0xe9f5f8
      : tipo.includes("barb") ? 0xe5e7eb
      : tipo.includes("prefeit") ? 0xede0c8
      : 0xd8b48a;
    const corParede = tipo.includes("consult") ? 0xf8fafc
      : tipo.includes("barb") ? 0x334155
      : tipo.includes("prefeit") ? 0xfef3c7
      : 0xfff7ed;

    // Piso com topo exato em y=0 (que no mundo é y=140)
    bx(16.8, 0.5, 14.8, 0x1d2a33, 0, -0.52, 0);
    bx(16.0, 0.5, 14.0, corPiso, 0, -0.50, 0);

    // Paredes (fundo alto, laterais médias, frente baixa estilo diorama com porta de saída)
    bx(16.4, 4.8, 0.35, corParede, 0, 0, -7.0);
    bx(0.35, 3.8, 14.4, corParede, -8.0, 0, 0);
    bx(0.35, 3.8, 14.4, corParede, 8.0, 0, 0);
    bx(6.2, 0.95, 0.35, corParede, -4.9, 0, 7.0);
    bx(6.2, 0.95, 0.35, corParede, 4.9, 0, 7.0);
    // Tapete luminoso da porta de saída em (0, 0, 5.8)
    bx(2.8, 0.06, 1.5, 0x2f9e44, 0, 0, 5.95, false, { emissive: 0x0b3b18 });
    bx(3.2, 0.14, 0.4, 0xfbbf24, 0, 3.2, 6.85, false, { emissive: 0x3d2800 });

    // Luminárias de teto suspensas sutis nas bordas
    [-4.5, 4.5].forEach(x => bx(2.2, 0.12, 0.8, 0xfffbeb, x, 4.55, -3.5, false, { emissive: 0x554820 }));

    if (tipo.includes("consult")) {
      placaTituloSala.redesenhar("🩺 " + (tituloSala || "Consultório Médico"));
      // Cruz médica na parede do fundo
      bx(0.42, 1.4, 0.12, 0xef4444, 0, 2.5, -6.78);
      bx(1.4, 0.42, 0.12, 0xef4444, 0, 2.99, -6.78);
      // Maca clínica com lençol branco e travesseiro verde
      bx(2.2, 0.85, 4.2, 0x94a3b8, -4.8, 0, -2.5, true);
      bx(2.1, 0.18, 4.0, 0xffffff, -4.8, 0.85, -2.5);
      bx(1.4, 0.16, 0.75, 0x22c55e, -4.8, 1.03, -4.0);
      // Mesa médica + computador + cadeiras
      bx(3.2, 0.95, 1.5, 0xe2e8f0, 3.8, 0, -3.2, true);
      bx(0.95, 0.68, 0.12, 0x1e293b, 3.8, 0.95, -3.4);
      bx(0.8, 0.95, 0.8, 0x0ea5e9, 3.8, 0, -4.5, true);
      // Recepção e cadeiras de espera
      [-5.6, -4.2, -2.8].forEach(x => bx(0.95, 0.55, 0.95, 0x38bdf8, x, 0, 3.2, true));
      bx(1.8, 2.2, 0.75, 0xcbd5e1, 6.4, 0, -5.8, true);
    } else if (tipo.includes("barb")) {
      placaTituloSala.redesenhar("💈 " + (tituloSala || "Barbearia Caraguá"));
      // Espelhos iluminados na parede do fundo + 2 cadeiras vermelhas de barbeiro
      [-3.2, 3.2].forEach(x => {
        bx(2.1, 2.3, 0.12, 0xbae6fd, x, 1.35, -6.78, false, { emissive: 0x16384c });
        bx(2.4, 0.22, 0.7, 0x1e293b, x, 1.05, -6.45);
        // Cadeira vermelha giratória
        bx(1.15, 0.65, 1.15, 0xdc2626, x, 0.25, -4.3, true);
        bx(1.15, 1.15, 0.25, 0xb91c1c, x, 0.85, -3.8);
        bx(0.3, 0.25, 0.3, 0xced4da, x, 0, -4.3);
      });
      // Sofá de espera e balcão caixa
      bx(4.2, 0.68, 1.3, 0x1e293b, -4.6, 0, 2.2, true);
      bx(4.2, 0.8, 0.3, 0x0f172a, -4.6, 0.6, 2.7);
      bx(2.6, 1.15, 1.1, 0x78350f, 5.2, 0, 2.0, true);
      // Mini poste de barbeiro interno
      bx(0.45, 2.1, 0.45, 0xef4444, 6.8, 0, -5.8, true);
    } else if (tipo.includes("prefeit")) {
      placaTituloSala.redesenhar("🏛️ " + (tituloSala || "Gabinete da Prefeitura"));
      // Tapete nobre verde/amarelo central
      bx(4.6, 0.04, 8.6, 0x15803d, 0, 0, -0.5);
      bx(3.2, 0.05, 6.2, 0xeab308, 0, 0, -0.5);
      // Mesa presidencial do prefeito
      bx(4.8, 1.05, 1.8, 0x78350f, 0, 0, -4.2, true);
      bx(1.2, 1.45, 1.0, 0x991b1b, 0, 0, -5.6, true);
      // Bandeiras nas laterais
      [[-3.6, 0x16a34a], [3.6, 0x2563eb]].forEach(([x, c]) => {
        bx(0.14, 3.4, 0.14, 0xfbbf24, x, 0, -5.8);
        bx(1.2, 0.8, 0.08, c, x + 0.6, 2.4, -5.8);
      });
      // Bancos de atendimento
      [-4.8, 4.8].forEach(x => {
        bx(2.8, 0.58, 0.95, 0x92400e, x, 0, 0.8, true);
        bx(2.8, 0.58, 0.95, 0x92400e, x, 0, 3.0, true);
      });
    } else {
      placaTituloSala.redesenhar("🏡 " + (tituloSala || "Casa VIP Caraguá"));
      // Tapete aconchegante na sala
      bx(5.6, 0.04, 4.2, 0x0ea5e9, -2.2, 0, -0.8);
      // Sofá em L + mesinha de centro + TV de tela grande na parede
      bx(4.2, 0.65, 1.35, 0xf97316, -2.2, 0, 1.4, true);
      bx(4.2, 0.72, 0.32, 0xea580c, -2.2, 0.6, 1.9);
      bx(1.8, 0.48, 1.1, 0x78350f, -2.2, 0, -0.6, true);
      bx(3.6, 0.7, 0.75, 0x334155, -2.2, 0, -6.3, true);
      bx(3.2, 1.85, 0.12, 0x0f172a, -2.2, 1.1, -6.72, false, { emissive: 0x0c2438 });
      // Cama de casal no canto direito + criado-mudo
      bx(3.0, 0.65, 4.0, 0xfef3c7, 5.2, 0, -3.8, true);
      bx(2.9, 0.18, 2.6, 0x3b82f6, 5.2, 0.65, -3.2);
      bx(2.6, 0.22, 0.85, 0xffffff, 5.2, 0.66, -5.1);
      bx(3.1, 1.35, 0.25, 0x78350f, 5.2, 0, -5.85);
      // Bancada gourmet / geladeira
      bx(1.3, 2.4, 1.2, 0xf1f5f9, 6.4, 0, 2.4, true);
      bx(2.6, 1.0, 1.0, 0x92400e, 4.2, 0, 2.4, true);
    }
  }

  function resolverColisaoSala(px, pz) {
    let x = limita(px, -7.15, 7.15);
    let z = limita(pz, -6.05, 6.15);
    const r = 0.68;
    for (let i = 0; i < colisoesSala.length; i++) {
      const o = colisoesSala[i];
      if (x < o.x0 - r || x > o.x1 + r || z < o.z0 - r || z > o.z1 + r) continue;
      const cx = limita(x, o.x0, o.x1);
      const cz = limita(z, o.z0, o.z1);
      const dx = x - cx;
      const dz = z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-6) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r;
        z = cz + (dz / d) * r;
      } else {
        z = o.z1 + r;
      }
    }
    return [limita(x, -7.15, 7.15), limita(z, -6.05, 6.15)];
  }

  function buscarPortaProximaRua() {
    if (!TEM_3D || salaAtual || caronaPid) return null;
    const portas = obterPortasAtivas();
    const px = MUNDO.jog.position.x;
    const pz = MUNDO.jog.position.z;
    let melhor = null;
    let menorD = 7.0;
    for (let i = 0; i < portas.length; i++) {
      const p = portas[i];
      if (!p || !Number.isFinite(Number(p.x)) || !Number.isFinite(Number(p.z))) continue;
      const d = Math.hypot(Number(p.x) - px, Number(p.z) - pz);
      if (d <= menorD) {
        menorD = d;
        melhor = p;
      }
    }
    return melhor;
  }

  function entrarSalaInterna(porta) {
    if (!TEM_3D || !porta) return false;
    if (carroAtual) sairCarro(true);
    if (caronaPid) sairCarona(true);

    retornoRua = {
      x: MUNDO.jog.position.x,
      z: MUNDO.jog.position.z,
      ry: MUNDO.jog.rotation.y
    };

    salaAtual = {
      id: porta.id || porta.room,
      room: String(porta.room || "sala").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "sala",
      label: porta.label || porta.room || "Sala",
      interiorTipo: porta.interiorTipo || porta.room || "casa"
    };

    popularMobiliaSala(salaAtual.interiorTipo, salaAtual.label);
    grupoSala.visible = true;

    MUNDO.jog.position.set(0, Y_SALA, 4.7);
    MUNDO.jog.rotation.y = 0;
    resetarPoseJogVox();

    if (typeof MUNDO.setControleExterno === "function") {
      MUNDO.setControleExterno(true);
    }
    if (typeof MUNDO.setCameraOverride === "function" && !modoFotoAtivo) {
      MUNDO.setCameraOverride((camRef, jogRef) => {
        const jx = jogRef.position.x;
        const jz = jogRef.position.z;
        camRef.position.set(jx * 0.45, Y_SALA + 10.2, jz * 0.35 + 13.8);
        camRef.lookAt(jx * 0.35, Y_SALA + 1.4, jz * 0.25 - 0.8);
      });
    }

    const api = onlineApi();
    if (api && typeof api.setEstadoInteracao === "function") {
      api.setEstadoInteracao({ room: salaAtual.room, car_type: "", ride_of: "" });
    }

    tocarNota(420, 620, 0.11, "sine", 0.06);
    avisa("🚪 Você entrou em " + salaAtual.label + " · Chat privado ativo 🔒");
    return true;
  }

  function sairSalaInterna(silencioso) {
    if (!salaAtual) return false;
    const nomeAntigo = salaAtual.label;
    salaAtual = null;

    if (grupoSala) grupoSala.visible = false;
    if (MUNDO && typeof MUNDO.setCameraOverride === "function" && !modoFotoAtivo) {
      MUNDO.setCameraOverride(null);
    }
    if (TEM_3D && MUNDO.jog) {
      const [rx, rz] = posSeguraMapa(retornoRua.x, retornoRua.z);
      MUNDO.jog.position.set(rx, MUNDO.altura(rx, rz), rz);
      MUNDO.jog.rotation.y = retornoRua.ry + Math.PI;
      resetarPoseJogVox();
    }
    if (MUNDO && typeof MUNDO.setControleExterno === "function" && !carroAtual && !caronaPid) {
      MUNDO.setControleExterno(false);
    }

    const api = onlineApi();
    if (api && typeof api.setEstadoInteracao === "function") {
      api.setEstadoInteracao({ room: "" });
    }

    if (!silencioso) {
      tocarNota(620, 420, 0.11, "sine", 0.06);
      avisa("🌤️ Você saiu de " + nomeAntigo + ".");
    }
    return true;
  }

  // ---------- 3) Futebol Jogável no Campinho (MUNDO.campoInfo) ----------
  let campoPronto = false;
  let bolaRef = null;
  let placarPlaca = null;
  const bolaEstado = {
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    hop: 0,
    scoreA: 0,
    scoreB: 0,
    seqRede: 0,
    ultimoChuteMs: 0,
    ultimoGolMs: 0,
    ultimoKickerLocal: false
  };

  // Partículas 3D leves de confete para Gols e 10/10 Moedas
  const confetes = [];
  function lancarConfete3D(cx, cy, cz, qtd) {
    if (!TEM_3D) return;
    const cores = [0xfbbf24, 0x22c55e, 0x3b82f6, 0xef4444, 0xa855f7, 0xfffaf0];
    const n = qtd || 28;
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.06), mat(cores[i % cores.length]));
      m.position.set(cx + (Math.random() - 0.5) * 1.6, cy + 1.2 + Math.random() * 1.2, cz + (Math.random() - 0.5) * 1.6);
      MUNDO.scene.add(m);
      const ang = Math.random() * Math.PI * 2;
      const vHoriz = 2.5 + Math.random() * 6.5;
      confetes.push({
        m,
        vx: Math.cos(ang) * vHoriz,
        vy: 5.5 + Math.random() * 6.5,
        vz: Math.sin(ang) * vHoriz,
        vida: 1.9 + Math.random() * 0.7
      });
    }
  }

  function lancarSprayAgua(x, z, ry) {
    if (!TEM_3D || confetes.length > 140) return;
    const fx = -Math.sin(ry);
    const fz = -Math.cos(ry);
    for (let i = 0; i < 2; i++) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.22, 0.22),
        mat(i === 0 ? 0xe0f2fe : 0xffffff)
      );
      m.position.set(
        x - fx * 1.45 + (Math.random() - 0.5) * 0.45,
        0.24,
        z - fz * 1.45 + (Math.random() - 0.5) * 0.45
      );
      MUNDO.scene.add(m);
      confetes.push({
        m,
        vx: -fx * (1.8 + Math.random() * 1.6) + (Math.random() - 0.5) * 2.4,
        vy: 1.6 + Math.random() * 1.8,
        vz: -fz * (1.8 + Math.random() * 1.6) + (Math.random() - 0.5) * 2.4,
        minY: 0.04,
        vida: 0.36 + Math.random() * 0.16
      });
    }
  }

  function atualizarVisualPortaisJetski(t) {
    if (!portaisBoiaMeshes.length) return;
    const pulso = 0.55 + 0.45 * Math.sin(t * 7);
    for (let i = 0; i < portaisBoiaMeshes.length; i++) {
      const pm = portaisBoiaMeshes[i];
      const ehAlvo = corridaJetski.ativa && corridaJetski.boiaIdx === i;
      if (pm.arcoMat) {
        pm.arcoMat.color.setHex(ehAlvo ? 0x4fd06f : 0x38bdf8);
        pm.arcoMat.opacity = ehAlvo ? (0.62 + 0.38 * pulso) : 0.36;
      }
      if (pm.boiaMatL) pm.boiaMatL.color.setHex(ehAlvo ? 0x4fd06f : 0xf03e3e);
      if (pm.boiaMatR) pm.boiaMatR.color.setHex(ehAlvo ? 0xfacc15 : 0xfcc419);
    }
  }

  function atualizarCorridaJetskiQuadro(t) {
    atualizarVisualPortaisJetski(t);
    const nowMs = performance.now();
    atualizarHudJetski(nowMs);

    if (!carroAtual || carroAtual.tipo !== "jetski" || !corridaJetski.ativa || !MUNDO.jog) {
      if (setaGuiaJetski) setaGuiaJetski.visible = false;
      return;
    }

    const alvo = BOIAS_CORRIDA_JETSKI[corridaJetski.boiaIdx] || BOIAS_CORRIDA_JETSKI[0];
    const jx = MUNDO.jog.position.x;
    const jz = MUNDO.jog.position.z;

    if (setaGuiaJetski) {
      setaGuiaJetski.visible = true;
      setaGuiaJetski.position.set(jx, MUNDO.jog.position.y + 4.35, jz);
      setaGuiaJetski.rotation.y = Math.atan2(alvo.x - jx, alvo.z - jz);
    }

    const dist = Math.hypot(jx - alvo.x, jz - alvo.z);
    if (dist <= 8.5) {
      const idxPassou = corridaJetski.boiaIdx;
      const total = BOIAS_CORRIDA_JETSKI.length;

      if (idxPassou === 0 && corridaJetski.passouMeio && corridaJetski.iniciouCronometro) {
        const tempoVoltaMs = nowMs - corridaJetski.inicioMs;
        corridaJetski.voltas += 1;
        corridaJetski.inicioMs = nowMs;
        corridaJetski.boiaIdx = 1;
        corridaJetski.passouMeio = false;
        let bateuRecorde = false;
        if (corridaJetski.melhorMs <= 0 || tempoVoltaMs < corridaJetski.melhorMs) {
          corridaJetski.melhorMs = tempoVoltaMs;
          salvarRecordeJetski(tempoVoltaMs);
          bateuRecorde = true;
        }
        somCelebracao();
        lancarConfete3D(jx, MUNDO.jog.position.y + 0.8, jz, 34);
        avisa(
          "🏁 Volta de Jet Ski concluída em " + (tempoVoltaMs / 1000).toFixed(1) + "s!" +
          (bateuRecorde ? " 🏆 NOVO RECORDE!" : "")
        );
      } else {
        if (idxPassou === 0 && !corridaJetski.iniciouCronometro) {
          corridaJetski.iniciouCronometro = true;
          corridaJetski.inicioMs = nowMs;
        }
        if (idxPassou >= Math.floor(total / 2)) {
          corridaJetski.passouMeio = true;
        }
        corridaJetski.boiaIdx = (idxPassou + 1) % total;
        somCheckpointJetski();
        if (idxPassou === total - 1) {
          avisa("🏁 Última reta! Passe na boia 1/6 (Largada/Chegada)!");
        } else {
          avisa("🌊 Boia " + (idxPassou + 1) + "/" + total + " (" + alvo.nome + ")!");
        }
      }
      atualizarHudJetski(nowMs);
    }
  }

  function atualizarTextoPlacar() {
    if (!placarPlaca) return;
    placarPlaca.redesenhar("⚽ TIME A  " + bolaEstado.scoreA + " × " + bolaEstado.scoreB + "  TIME B");
  }

  function garantirCampoInicializado() {
    if (campoPronto || !TEM_3D || !MUNDO.campoInfo) return;
    const ci = MUNDO.campoInfo;
    if (!Number.isFinite(Number(ci.cx)) || !Number.isFinite(Number(ci.cz))) return;

    campoPronto = true;
    bolaRef = ci.bolaMesh || null;
    if (!bolaRef) {
      bolaRef = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), mat(0xf8f9fa));
      bolaRef.castShadow = true;
      MUNDO.scene.add(bolaRef);
    }
    bolaEstado.x = ci.cx;
    bolaEstado.z = ci.cz;
    bolaRef.position.set(ci.cx, 0.68, ci.cz);

    placarPlaca = criarPlaca3D("⚽ TIME A  0 × 0  TIME B", {
      w: 540,
      h: 92,
      escala: 0.011,
      fundo: "#1d2a33",
      borda: "#fbbf24",
      cor: "#fffaf0"
    });
    placarPlaca.sp.position.set(ci.cx, 6.2, ci.cz);
    MUNDO.scene.add(placarPlaca.sp);

    // Atualiza posição da moeda do campinho se ainda não coletada
    reposicionarMoedaDinamica("campinho", ci.cx, ci.cz - (ci.W || 9.4) * 0.36);
  }

  function receberBolaRede(ball) {
    if (!ball || typeof ball !== "object") return;
    const seq = Number(ball.seq) || 0;
    if (seq && seq <= bolaEstado.seqRede) return;
    if (seq) bolaEstado.seqRede = seq;

    const novoA = Math.max(0, Math.round(Number(ball.score_a) || 0));
    const novoB = Math.max(0, Math.round(Number(ball.score_b) || 0));
    const mudouPlacar = novoA !== bolaEstado.scoreA || novoB !== bolaEstado.scoreB;
    bolaEstado.scoreA = novoA;
    bolaEstado.scoreB = novoB;
    atualizarTextoPlacar();

    const api = onlineApi();
    const meuPid = api && typeof api.getPid === "function" ? api.getPid() : "";
    if ((ball.gol === "a" || ball.gol === "b") && ball.kicker && ball.kicker !== meuPid && mudouPlacar) {
      const ci = MUNDO && MUNDO.campoInfo;
      somGol();
      if (ci) lancarConfete3D(ci.cx, 0.5, ci.cz, 32);
      avisa("⚽ GOOOL DO TIME " + ball.gol.toUpperCase() + "! (" + bolaEstado.scoreA + " × " + bolaEstado.scoreB + ")");
    }

    if (Number.isFinite(Number(ball.x)) && Number.isFinite(Number(ball.z))) {
      bolaEstado.x = Number(ball.x);
      bolaEstado.z = Number(ball.z);
    }
    if (Number.isFinite(Number(ball.vx)) && Number.isFinite(Number(ball.vz))) {
      bolaEstado.vx = Number(ball.vx);
      bolaEstado.vz = Number(ball.vz);
    }
    bolaEstado.ultimoKickerLocal = ball.kicker === meuPid;
  }

  function atualizarFutebol(dt) {
    garantirCampoInicializado();
    if (!campoPronto || !bolaRef || !MUNDO.campoInfo) return;

    const ci = MUNDO.campoInfo;
    const halfL = ((ci.L || 19) / 2) - 0.34;
    const halfW = ((ci.W || 9.4) / 2) - 0.34;
    const bocaGol = 1.56;
    const agoraMs = performance.now();

    // Checa chute do jogador local ou veículo quando fora de salas
    if (!salaAtual && MUNDO.jog) {
      const jx = MUNDO.jog.position.x;
      const jz = MUNDO.jog.position.z;
      const dx = bolaEstado.x - jx;
      const dz = bolaEstado.z - jz;
      const dist = Math.hypot(dx, dz);
      const raioToque = carroAtual ? 2.55 : 1.35;

      if (dist <= raioToque && agoraMs - bolaEstado.ultimoChuteMs >= 220) {
        bolaEstado.ultimoChuteMs = agoraMs;
        const ry = MUNDO.jog.rotation.y;
        const fx = -Math.sin(ry);
        const fz = -Math.cos(ry);
        const nx = dist > 0.05 ? dx / dist : fx;
        const nz = dist > 0.05 ? dz / dist : fz;
        // Combina vetor de impacto com direção para onde o jogador olha/corre
        let dirX = nx * 0.55 + fx * 0.45;
        let dirZ = nz * 0.55 + fz * 0.45;
        const norm = Math.hypot(dirX, dirZ) || 1;
        dirX /= norm;
        dirZ /= norm;

        const forca = carroAtual ? Math.max(18, Math.abs(carroAtual.vel) * 0.85 + 12) : 16.5;
        bolaEstado.vx = limita(dirX * forca, -38, 38);
        bolaEstado.vz = limita(dirZ * forca, -38, 38);
        bolaEstado.hop = 0.55;
        bolaEstado.ultimoKickerLocal = true;

        somChute();
        const api = onlineApi();
        if (api && typeof api.enviarChuteBola === "function") {
          api.enviarChuteBola({
            x: bolaEstado.x,
            z: bolaEstado.z,
            vx: bolaEstado.vx,
            vz: bolaEstado.vz,
            gol: "",
            score_a: bolaEstado.scoreA,
            score_b: bolaEstado.scoreB
          });
        }
      }
    }

    // Física e atrito da bola no gramado
    bolaEstado.x += bolaEstado.vx * dt;
    bolaEstado.z += bolaEstado.vz * dt;
    const atrito = Math.exp(-1.95 * dt);
    bolaEstado.vx *= atrito;
    bolaEstado.vz *= atrito;
    if (Math.hypot(bolaEstado.vx, bolaEstado.vz) < 0.06) {
      bolaEstado.vx = 0;
      bolaEstado.vz = 0;
    }
    bolaEstado.hop = Math.max(0, bolaEstado.hop - dt * 2.4);

    // Quique nas laterais (Z)
    if (bolaEstado.z < ci.cz - halfW) {
      bolaEstado.z = ci.cz - halfW;
      bolaEstado.vz = Math.abs(bolaEstado.vz) * 0.75;
    } else if (bolaEstado.z > ci.cz + halfW) {
      bolaEstado.z = ci.cz + halfW;
      bolaEstado.vz = -Math.abs(bolaEstado.vz) * 0.75;
    }

    // Linha de fundo e detecção de Gol nas metas A (+X) e B (-X)
    let golMarcado = "";
    if (bolaEstado.x > ci.cx + halfL) {
      if (Math.abs(bolaEstado.z - ci.cz) <= bocaGol && agoraMs - bolaEstado.ultimoGolMs > 2600) {
        golMarcado = "a";
      } else {
        bolaEstado.x = ci.cx + halfL;
        bolaEstado.vx = -Math.abs(bolaEstado.vx) * 0.75;
      }
    } else if (bolaEstado.x < ci.cx - halfL) {
      if (Math.abs(bolaEstado.z - ci.cz) <= bocaGol && agoraMs - bolaEstado.ultimoGolMs > 2600) {
        golMarcado = "b";
      } else {
        bolaEstado.x = ci.cx - halfL;
        bolaEstado.vx = Math.abs(bolaEstado.vx) * 0.75;
      }
    }

    if (golMarcado) {
      bolaEstado.ultimoGolMs = agoraMs;
      if (golMarcado === "a") bolaEstado.scoreA++;
      else bolaEstado.scoreB++;

      bolaEstado.x = ci.cx;
      bolaEstado.z = ci.cz;
      bolaEstado.vx = 0;
      bolaEstado.vz = 0;
      bolaEstado.hop = 0.7;

      atualizarTextoPlacar();
      somGol();
      lancarConfete3D(ci.cx, 0.5, ci.cz, 34);
      avisa("⚽ GOOOL DO TIME " + golMarcado.toUpperCase() + "! Placar: " + bolaEstado.scoreA + " × " + bolaEstado.scoreB);

      if (bolaEstado.ultimoKickerLocal) {
        const api = onlineApi();
        if (api && typeof api.enviarChuteBola === "function") {
          api.enviarChuteBola({
            x: ci.cx,
            z: ci.cz,
            vx: 0,
            vz: 0,
            gol: golMarcado,
            score_a: bolaEstado.scoreA,
            score_b: bolaEstado.scoreB
          });
        }
      }
    }

    const saltoY = Math.sin(bolaEstado.hop * Math.PI) * 0.65;
    bolaRef.position.set(bolaEstado.x, 0.68 + saltoY, bolaEstado.z);
    bolaRef.rotation.z -= bolaEstado.vx * dt * 2.2;
    bolaRef.rotation.x += bolaEstado.vz * dt * 2.2;
  }

  // ---------- 4) Caça às 10 Moedas Douradas ----------
  const DEFINICAO_MOEDAS = [
    { id: "praia", nome: "Praia Central", x: 0, z: 45.0 },
    { id: "orla", nome: "Calçadão da Orla", x: 68, z: 36.0 },
    { id: "praca", nome: "Praça de Natal", x: 27, z: 21.5 },
    { id: "camara", nome: "Câmara Municipal", x: -27, z: 23.5 },
    { id: "prefeitura", nome: "Prefeitura", x: 33, z: -13.0 },
    { id: "posto", nome: "Posto Caraguá", x: -27, z: -8.5 },
    { id: "hospital", nome: "Consultório Médico", x: -54, z: -5.0 },
    { id: "campinho", nome: "Campinho de Futebol", x: 0, z: -37.0 },
    { id: "mercado", nome: "Avenida & Adega", x: -27, z: -101.0 },
    { id: "mirante", nome: "Mirante Santo Antônio", x: -339, z: -110.0 }
  ];

  const moedasColetadas = new Set();
  try {
    const salvas = JSON.parse(localStorage.getItem(CHAVE_MOEDAS) || "[]");
    if (Array.isArray(salvas)) {
      salvas.forEach(id => {
        if (DEFINICAO_MOEDAS.some(m => m.id === id)) moedasColetadas.add(id);
      });
    }
  } catch (e) { /* noop */ }

  function salvarMoedas() {
    try {
      localStorage.setItem(CHAVE_MOEDAS, JSON.stringify([...moedasColetadas]));
    } catch (e) { /* noop */ }
  }

  const moedasMeshes = new Map();

  function criarMeshMoeda() {
    const g = new THREE.Group();
    const disco = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.68, 0.16, 14).rotateX(Math.PI / 2),
      mat(0xfbbf24, { emissive: 0x4a3200, metalness: 0.35, roughness: 0.3 })
    );
    disco.castShadow = true;
    const miolo = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.56, 0.22),
      mat(0xfef08a, { emissive: 0x554400 })
    );
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.95, 16).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    halo.position.y = -1.12;
    g.add(disco, miolo, halo);
    g.userData.disco = disco;
    g.userData.miolo = miolo;
    return g;
  }

  function reposicionarMoedaDinamica(id, nx, nz) {
    const item = moedasMeshes.get(id);
    if (!item || !TEM_3D) return;
    item.x = nx;
    item.z = nz;
    item.grupo.position.set(nx, MUNDO.altura(nx, nz) + 1.25, nz);
  }

  if (TEM_3D) {
    DEFINICAO_MOEDAS.forEach(def => {
      const grupo = criarMeshMoeda();
      const y = MUNDO.altura(def.x, def.z) + 1.25;
      grupo.position.set(def.x, y, def.z);
      grupo.visible = !moedasColetadas.has(def.id);
      MUNDO.scene.add(grupo);
      moedasMeshes.set(def.id, { id: def.id, nome: def.nome, x: def.x, z: def.z, grupo });
    });

    // Se já tinha 10/10 salvo, garante a coroa liberada (sem sobrescrever criador)
    if (moedasColetadas.size >= 10) {
      setTimeout(() => {
        const api = onlineApi();
        if (api && typeof api.getEstadoInteracao === "function") {
          const atual = api.getEstadoInteracao();
          if (atual.badge !== "criador" && !atual.badge) {
            api.setEstadoInteracao({ badge: "coroa" });
          }
        }
      }, 250);
    }
  }

  let ajustouMoedaHospital = false;
  function atualizarMoedas(t) {
    if (!TEM_3D) return;

    // Ajusta moeda do consultório/hospital para perto da porta real quando pontosPortas carregar
    if (!ajustouMoedaHospital && MUNDO.pontosPortas && MUNDO.pontosPortas.length) {
      ajustouMoedaHospital = true;
      const pCons = MUNDO.pontosPortas.find(p => p && String(p.room || "").includes("consult"));
      if (pCons && Number.isFinite(Number(pCons.x)) && Number.isFinite(Number(pCons.z))) {
        reposicionarMoedaDinamica("hospital", Number(pCons.x) + 2.8, Number(pCons.z));
      }
    }

    const px = MUNDO.jog.position.x;
    const pz = MUNDO.jog.position.z;

    moedasMeshes.forEach(m => {
      if (moedasColetadas.has(m.id)) {
        m.grupo.visible = false;
        return;
      }
      m.grupo.visible = !salaAtual;
      if (salaAtual) return;

      const baseY = MUNDO.altura(m.x, m.z) + 1.25;
      m.grupo.position.y = baseY + Math.sin(t * 3.2 + m.x) * 0.22;
      m.grupo.userData.disco.rotation.z = t * 2.6;
      m.grupo.userData.miolo.rotation.y = t * 2.6;

      const dist = Math.hypot(px - m.x, pz - m.z);
      if (dist <= 3.4) {
        moedasColetadas.add(m.id);
        salvarMoedas();
        m.grupo.visible = false;

        const total = moedasColetadas.size;
        if (total >= 10) {
          somCelebracao();
          lancarConfete3D(px, MUNDO.jog.position.y, pz, 42);
          const api = onlineApi();
          if (api && typeof api.getEstadoInteracao === "function") {
            const est = api.getEstadoInteracao();
            if (est.badge !== "criador") {
              api.setEstadoInteracao({ badge: "coroa" });
            }
          }
          avisa("👑 10/10 MOEDAS! Você conquistou a Coroa Dourada de Explorador!");
        } else {
          somMoeda();
          lancarConfete3D(m.x, baseY - 0.8, m.z, 12);
          avisa("🪙 Moeda " + total + "/10! (" + m.nome + ")");
        }
      }
    });
  }

  function getMoedasInfo() {
    const coletadas = moedasColetadas.size;
    return {
      coletadas,
      count: coletadas,
      total: DEFINICAO_MOEDAS.length,
      completa: coletadas >= DEFINICAO_MOEDAS.length,
      ids: [...moedasColetadas]
    };
  }

  // ---------- 6) Modo Foto Stories (📸) ----------
  let modoFotoAtivo = false;
  let enquadramentoFoto = 0; // 0: Cinemático, 1: Stories Close, 2: Panorâmico
  let barraFotoEl = null;
  let elementosOcultosFoto = [];

  const SELETORES_HUD_OCULTAR = [
    "#painel",
    "#chat-online",
    ".placa",
    ".hud-acoes",
    "#mapa",
    "#dica",
    "#joy",
    ".topo",
    "#loja-hud"
  ];

  function aplicarCameraModoFoto() {
    if (!TEM_3D || typeof MUNDO.setCameraOverride !== "function") return;
    MUNDO.setCameraOverride((camRef, jogRef, agoraMs) => {
      const t = (agoraMs || performance.now()) / 1000;
      const p = jogRef.position;
      const ry = jogRef.rotation.y;
      if (enquadramentoFoto === 1) {
        // Close retrato estilo Stories mostrando boneco + coroa/carro de frente 3/4
        const ang = ry + Math.PI + 0.42 + Math.sin(t * 0.4) * 0.08;
        const r = carroAtual ? 11.5 : 8.2;
        const cx = p.x - Math.sin(ang) * r;
        const cz = p.z - Math.cos(ang) * r;
        const cy = p.y + (carroAtual ? 3.4 : 2.7);
        camRef.position.set(cx, salaAtual ? cy : Math.max(cy, MUNDO.altura(cx, cz) + 1.4), cz);
        camRef.lookAt(p.x, p.y + 1.85, p.z);
      } else if (enquadramentoFoto === 2) {
        // Panorâmico cartão-postal
        const ang = t * 0.14;
        const r = 34;
        const cx = p.x + Math.sin(ang) * r;
        const cz = p.z + Math.cos(ang) * r;
        const cy = p.y + 18;
        camRef.position.set(cx, salaAtual ? Y_SALA + 11 : Math.max(cy, MUNDO.altura(cx, cz) + 4), cz);
        camRef.lookAt(p.x, p.y + 1.6, p.z);
      } else {
        // Cinemático suave 3/4
        const ang = ry + Math.PI - 0.55 + Math.sin(t * 0.35) * 0.06;
        const r = carroAtual ? 16 : 13.5;
        const cx = p.x - Math.sin(ang) * r;
        const cz = p.z - Math.cos(ang) * r;
        const cy = p.y + 5.2;
        camRef.position.set(cx, salaAtual ? Y_SALA + 8.5 : Math.max(cy, MUNDO.altura(cx, cz) + 2), cz);
        camRef.lookAt(p.x, p.y + 1.9, p.z);
      }
    });
  }

  function baixarFotoPNG() {
    const glCanvas = document.querySelector("#cena canvas");
    if (!glCanvas) return;

    tocarNota(880, 1320, 0.09, "sine", 0.08);

    // Captura imediatamente após o renderer.render(scene, cam) do requestAnimationFrame atual
    requestAnimationFrame(() => {
      try {
        if (MUNDO && MUNDO.renderer && typeof MUNDO.renderer.render === "function") {
          MUNDO.renderer.render(MUNDO.scene, MUNDO.cam);
        }
        const w = glCanvas.width || 1280;
        const h = glCanvas.height || 720;
        const out = document.createElement("canvas");
        out.width = w;
        out.height = h;
        const ctx = out.getContext("2d");

        ctx.drawImage(glCanvas, 0, 0, w, h);

        // Vinheta cinematográfica sutil
        const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(13,16,32,0.28)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Marca d'água discreta no canto inferior direito
        const escala = Math.max(1, Math.min(w, h) / 720);
        const textoMarca = "caraguapixel.online • @caraguapixel";
        const tamFonte = Math.round(16 * escala);
        ctx.font = "800 " + tamFonte + 'px "Nunito Sans", "Segoe UI", sans-serif';
        const tw = ctx.measureText(textoMarca).width;
        const padX = Math.round(14 * escala);
        const boxW = tw + padX * 2;
        const boxH = Math.round(32 * escala);
        const bx = w - boxW - Math.round(18 * escala);
        const by = h - boxH - Math.round(18 * escala);

        ctx.fillStyle = "rgba(29, 42, 51, 0.78)";
        ctx.fillRect(bx, by, boxW, boxH);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = Math.max(2, Math.round(2 * escala));
        ctx.strokeRect(bx, by, boxW, boxH);

        ctx.fillStyle = "#fffaf0";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(textoMarca, bx + boxW / 2, by + boxH / 2 + 1);

        const url = out.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = "caragua-pixel-" + Date.now() + ".png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        avisa("📸 Foto salva com sucesso!");
      } catch (e) {
        avisa("Não foi possível exportar a imagem neste navegador.");
      }
    });
  }

  function garantirBarraFoto() {
    if (barraFotoEl) return barraFotoEl;
    const bar = document.createElement("div");
    bar.id = "caragua-modo-foto-bar";
    bar.style.cssText = [
      "position:fixed",
      "left:50%",
      "bottom:calc(20px + env(safe-area-inset-bottom, 0px))",
      "transform:translateX(-50%)",
      "z-index:160",
      "display:flex",
      "gap:8px",
      "align-items:center",
      "flex-wrap:wrap",
      "justify-content:center",
      "padding:8px 12px",
      "background:#fffaf0",
      "border:3px solid #1d2a33",
      "box-shadow:4px 4px 0 #1d2a33",
      'font-family:"Nunito Sans","Segoe UI",sans-serif'
    ].join(";");

    const estiloBtn = bg => [
      "appearance:none",
      "background:" + bg,
      "color:#1d2a33",
      "border:2px solid #1d2a33",
      "box-shadow:2px 2px 0 #1d2a33",
      "padding:7px 12px",
      "font-weight:800",
      "font-size:13px",
      "line-height:1.1",
      "cursor:pointer"
    ].join(";");

    const btnAngulo = document.createElement("button");
    btnAngulo.type = "button";
    btnAngulo.style.cssText = estiloBtn("#f1d9a6");
    const nomesAngulo = ["🎬 Ângulo: Cinemático", "📱 Ângulo: Close Stories", "🦅 Ângulo: Panorâmico"];
    btnAngulo.textContent = nomesAngulo[enquadramentoFoto];
    btnAngulo.addEventListener("click", () => {
      enquadramentoFoto = (enquadramentoFoto + 1) % 3;
      btnAngulo.textContent = nomesAngulo[enquadramentoFoto];
      aplicarCameraModoFoto();
    });

    const btnBaixar = document.createElement("button");
    btnBaixar.type = "button";
    btnBaixar.style.cssText = estiloBtn("#fbbf24");
    btnBaixar.textContent = "📸 Baixar PNG";
    btnBaixar.addEventListener("click", baixarFotoPNG);

    const btnVoltar = document.createElement("button");
    btnVoltar.type = "button";
    btnVoltar.style.cssText = estiloBtn("#fffaf0");
    btnVoltar.textContent = "↩ Voltar";
    btnVoltar.addEventListener("click", () => toggleModoFoto());

    bar.append(btnAngulo, btnBaixar, btnVoltar);
    document.body.appendChild(bar);
    barraFotoEl = bar;
    return bar;
  }

  function toggleModoFoto() {
    modoFotoAtivo = !modoFotoAtivo;
    if (modoFotoAtivo) {
      elementosOcultosFoto = [];
      SELETORES_HUD_OCULTAR.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          elementosOcultosFoto.push({ el, displayAnterior: el.style.display });
          el.style.display = "none";
        });
      });
      const bar = garantirBarraFoto();
      bar.style.display = "flex";
      aplicarCameraModoFoto();
    } else {
      elementosOcultosFoto.forEach(item => {
        item.el.style.display = item.displayAnterior;
      });
      elementosOcultosFoto = [];
      if (barraFotoEl) barraFotoEl.style.display = "none";

      if (MUNDO && typeof MUNDO.setCameraOverride === "function") {
        if (salaAtual) {
          MUNDO.setCameraOverride((camRef, jogRef) => {
            const jx = jogRef.position.x;
            const jz = jogRef.position.z;
            camRef.position.set(jx * 0.45, Y_SALA + 10.2, jz * 0.35 + 13.8);
            camRef.lookAt(jx * 0.35, Y_SALA + 1.4, jz * 0.25 - 0.8);
          });
        } else {
          MUNDO.setCameraOverride(null);
        }
      }
    }
    return modoFotoAtivo;
  }

  // ---------- 7) Contexto Dinâmico [E] / [F] e Atalhos ----------
  function getContexto() {
    if (!TEM_3D || !MUNDO.jog) return null;

    if (caronaPid) {
      return {
        tipo: "sair_carona",
        acaoLabel: "[F] Descer da carona",
        tecla: "F",
        room: "",
        alvo: caronaPid,
        lotId: null
      };
    }

    if (salaAtual) {
      const dSaida = Math.hypot(MUNDO.jog.position.x - 0, MUNDO.jog.position.z - 5.8);
      if (dSaida <= 5.2) {
        return {
          tipo: "sair_sala",
          acaoLabel: "[E] Sair para a cidade",
          tecla: "E",
          room: salaAtual.room,
          alvo: salaAtual.id,
          lotId: null
        };
      }
      return null;
    }

    if (carroAtual) {
      if (carroAtual.tipo !== "jetski") {
        const portaPerto = buscarPortaProximaRua();
        if (portaPerto) {
          return {
            tipo: "entrar_sala",
            acaoLabel: "[E] Estacionar e entrar em " + (portaPerto.label || portaPerto.room),
            tecla: "E",
            room: portaPerto.room,
            alvo: portaPerto.id,
            lotId: null
          };
        }
      }
      const suf = carroAtual.testDrive ? (" (" + Math.ceil(carroAtual.tempoRestante) + "s)") : "";
      const labelSair = carroAtual.tipo === "jetski"
        ? "[E] Voltar à areia · [H] Buzinar"
        : "[E] Sair do veículo" + suf + " · [H] Buzinar";
      return {
        tipo: "sair_carro",
        acaoLabel: labelSair,
        tecla: "E",
        room: "",
        alvo: carroAtual.tipo,
        lotId: null
      };
    }

    // A pé: compara distância entre porta [E], Marina Jet Ski [E], Bugue Test-Drive [E] e Carona [F]
    const candidatos = [];

    const drv = buscarMotoristaProximo();
    if (drv) {
      const dDrv = Math.hypot(MUNDO.jog.position.x - drv.x, MUNDO.jog.position.z - drv.z);
      candidatos.push({
        dist: dDrv,
        ctx: {
          tipo: "carona",
          acaoLabel: "[F] Pegar carona com " + drv.nome,
          tecla: "F",
          room: "",
          alvo: drv.pid,
          lotId: null
        }
      });
    }

    if (jetskiMarinaGrupo) {
      const dJs = Math.hypot(MUNDO.jog.position.x - JETSKI_MARINA_POS.x, MUNDO.jog.position.z - JETSKI_MARINA_POS.z);
      if (dJs <= 6.8) {
        candidatos.push({
          dist: dJs,
          ctx: {
            tipo: "jetski_marina",
            acaoLabel: "[E] Pilotar Jet Ski & Corrida Aquática",
            tecla: "E",
            room: "",
            alvo: "jetski",
            lotId: null
          }
        });
      }
    }

    if (buguePraiaGrupo && buguePraiaGrupo.visible) {
      const dBugue = Math.hypot(MUNDO.jog.position.x - BUGUE_PRAIA_POS.x, MUNDO.jog.position.z - BUGUE_PRAIA_POS.z);
      if (dBugue <= 5.8) {
        candidatos.push({
          dist: dBugue,
          ctx: {
            tipo: "test_drive",
            acaoLabel: "[E] Test-Drive Bugue Grátis (60s)",
            tecla: "E",
            room: "",
            alvo: "bugue",
            lotId: null
          }
        });
      }
    }

    const porta = buscarPortaProximaRua();
    if (porta) {
      const dPorta = Math.hypot(MUNDO.jog.position.x - Number(porta.x), MUNDO.jog.position.z - Number(porta.z));
      candidatos.push({
        dist: dPorta,
        ctx: {
          tipo: "entrar_sala",
          acaoLabel: "[E] Entrar em " + (porta.label || porta.room),
          tecla: "E",
          room: porta.room,
          alvo: porta.id,
          lotId: porta.lotId || null
        }
      });
    }

    if (candidatos.length) {
      candidatos.sort((a, b) => a.dist - b.dist);
      return candidatos[0].ctx;
    }

    return null;
  }

  function acionarContexto() {
    const ctx = getContexto();
    if (!ctx) return false;
    if (ctx.tipo === "sair_carona") {
      sairCarona(false);
      return true;
    }
    if (ctx.tipo === "carona") {
      return pegarCarona(ctx.alvo);
    }
    if (ctx.tipo === "sair_sala") {
      return sairSalaInterna(false);
    }
    if (ctx.tipo === "entrar_sala") {
      const porta = obterPortasAtivas().find(p => (p.id || p.room) === ctx.alvo || p.room === ctx.room);
      return porta ? entrarSalaInterna(porta) : false;
    }
    if (ctx.tipo === "test_drive") {
      return iniciarTestDrive("bugue");
    }
    if (ctx.tipo === "jetski_marina") {
      return iniciarCorridaJetski();
    }
    if (ctx.tipo === "sair_carro") {
      sairCarro(false);
      return true;
    }
    return false;
  }

  window.addEventListener("keydown", e => {
    if (e.repeat) return;
    if (e.key === "Escape" && modoFotoAtivo) {
      e.preventDefault();
      toggleModoFoto();
      return;
    }
    if (focoEmInput(e)) return;

    const k = e.key.toLowerCase();
    if (k === "g" && carroAtual && carroAtual.tipo === "viatura") {
      e.preventDefault();
      const lig = toggleSireneViatura();
      avisa(lig ? "📢 Sirene da viatura LIGADA! [G] silenciar" : "🔕 Sirene silenciada (giroflex continua piscando)");
      return;
    }
    if (k === "h" && carroAtual) {
      e.preventDefault();
      buzinar();
      return;
    }
    if (k === "q" && typeof window.CARAGUA_ATIRAR_POLICIA === "function") {
      if (window.CARAGUA_ATIRAR_POLICIA()) {
        e.preventDefault();
        return;
      }
    }
    if (k === "f") {
      if (caronaPid) {
        e.preventDefault();
        sairCarona(false);
        return;
      }
      const drv = buscarMotoristaProximo();
      if (drv) {
        e.preventDefault();
        pegarCarona(drv.pid);
        return;
      }
    }
    if (k === "e") {
      if (salaAtual) {
        const dSaida = Math.hypot(MUNDO.jog.position.x, MUNDO.jog.position.z - 5.8);
        if (dSaida <= 6.5) {
          e.preventDefault();
          sairSalaInterna(false);
        } else {
          avisa("🚪 Caminhe até a porta verde na frente para sair [E].");
        }
        return;
      }
      if (carroAtual) {
        e.preventDefault();
        const portaPerto = carroAtual.tipo === "jetski" ? null : buscarPortaProximaRua();
        if (portaPerto) entrarSalaInterna(portaPerto);
        else sairCarro(false);
        return;
      }
      if (jetskiMarinaGrupo) {
        const dJs = Math.hypot(MUNDO.jog.position.x - JETSKI_MARINA_POS.x, MUNDO.jog.position.z - JETSKI_MARINA_POS.z);
        if (dJs <= 6.8) {
          e.preventDefault();
          iniciarCorridaJetski();
          return;
        }
      }
      if (buguePraiaGrupo && buguePraiaGrupo.visible) {
        const dBugue = Math.hypot(MUNDO.jog.position.x - BUGUE_PRAIA_POS.x, MUNDO.jog.position.z - BUGUE_PRAIA_POS.z);
        if (dBugue <= 5.8) {
          e.preventDefault();
          iniciarTestDrive("bugue");
          return;
        }
      }
      if (typeof window.CARAGUA_NA_LOJINHA_POLICIA === "function" && window.CARAGUA_NA_LOJINHA_POLICIA()) {
        e.preventDefault();
        if (typeof window.CARAGUA_ABRIR_LOJINHA_POLICIA === "function") {
          window.CARAGUA_ABRIR_LOJINHA_POLICIA();
        }
        return;
      }
      const porta = buscarPortaProximaRua();
      if (porta) {
        e.preventDefault();
        entrarSalaInterna(porta);
      }
    }
  });

  // ---------- Loop Principal de Frame (addQuadroListener) ----------
  let ultimoJumpSom = 0;

  function atualizarQuadroInteracoes(dt, tParam) {
    vincularCallbacksOnline();
    if (!TEM_3D || !MUNDO.jog) return;

    const t = Number.isFinite(tParam) ? tParam : performance.now() / 1000;
    const pe = typeof MUNDO.getPuloEmote === "function" ? MUNDO.getPuloEmote() : { jump: 0, emote: "" };
    const jumpAtual = Number(pe && pe.jump) || 0;

    // Dispara som de pulo ao sair do chão
    if (jumpAtual > 0.08 && ultimoJumpSom <= 0.04) {
      somPulo();
    }
    ultimoJumpSom = jumpAtual;

    // 1. Movimento dirigindo veículo
    if (carroAtual) {
      if (carroAtual.testDrive) {
        carroAtual.tempoRestante -= dt;
        if (!carroAtual.avisou10s && carroAtual.tempoRestante <= 10) {
          carroAtual.avisou10s = true;
          avisa("⏳ Últimos 10s do Test-Drive! Garanta seu carro na Loja VIP 🛒");
        }
        if (carroAtual.tempoRestante <= 0) {
          sairCarro(true);
          avisa("🏁 Test-Drive encerrado! Visite a Loja VIP 🛒 para liberar seu veículo.");
        }
      }

      if (carroAtual) {
        const inp = lerMovimentoInput();
        const vmax = VEL_MAX_CARRO[carroAtual.tipo] || 34;
        const forcaAcel = inp.joyAtivo && Math.abs(inp.analogY) > 0.12
          ? Math.min(1, Math.abs(inp.analogY) * 1.15)
          : 1;
        const acel = inp.frente ? 42 * forcaAcel : (inp.tras ? -28 * forcaAcel : 0);

        if (acel !== 0) {
          carroAtual.vel = limita(carroAtual.vel + acel * dt, -vmax * 0.48, vmax);
        } else {
          carroAtual.vel *= Math.exp(-3.4 * dt);
          if (Math.abs(carroAtual.vel) < 0.08) carroAtual.vel = 0;
        }

        let dirGiro = 0;
        if (teclasFallback.has("esq") || teclasFallback.has("dir") || !inp.joyAtivo) {
          dirGiro = (inp.esq ? 1 : 0) - (inp.dir ? 1 : 0);
        } else if (Math.abs(inp.analogX) > 0.12) {
          dirGiro = -limita(inp.analogX * 1.12, -1, 1);
        }
        if (dirGiro !== 0 && (Math.abs(carroAtual.vel) > 0.3 || inp.frente || inp.tras)) {
          const invRe = carroAtual.vel < -0.2 ? -1 : 1;
          const fatorVel = Math.min(1, Math.abs(carroAtual.vel) / 8 + 0.35);
          MUNDO.jog.rotation.y += dirGiro * invRe * 2.55 * fatorVel * dt;
        }

        const ry = MUNDO.jog.rotation.y;
        const fx = -Math.sin(ry);
        const fz = -Math.cos(ry);
        if (carroAtual.tipo === "jetski") {
          const [nx, nz] = posSeguraJetski(
            MUNDO.jog.position.x + fx * carroAtual.vel * dt,
            MUNDO.jog.position.z + fz * carroAtual.vel * dt
          );
          const ondaY = 0.08 + Math.sin(t * 4.5 + nx * 0.15) * 0.09;
          MUNDO.jog.position.set(nx, ondaY, nz);
          if (carroAtual.mesh && !MUNDO.reduz) {
            carroAtual.mesh.rotation.z = -dirGiro * Math.min(1, Math.abs(carroAtual.vel) / 20) * 0.24;
            carroAtual.mesh.rotation.x = Math.min(0.14, carroAtual.vel / 250);
          }
          if (!MUNDO.reduz && Math.abs(carroAtual.vel) > 10 && performance.now() > proximoSprayMs) {
            proximoSprayMs = performance.now() + 75;
            lancarSprayAgua(nx, nz, ry);
          }
        } else {
          const [nx, nz] = posSeguraMapa(
            MUNDO.jog.position.x + fx * carroAtual.vel * dt,
            MUNDO.jog.position.z + fz * carroAtual.vel * dt
          );
          MUNDO.jog.position.set(nx, MUNDO.altura(nx, nz), nz);
        }

        if (Math.abs(carroAtual.vel) > 1.2 && typeof MUNDO.seguirYawSuave === "function") {
          const taxaCam = carroAtual.vel >= 0 ? dt * 2.2 : dt * 0.7;
          MUNDO.seguirYawSuave(MUNDO.jog.rotation.y, taxaCam);
        }

        // Roda pneus e inclina levemente chassi na curva
        if (carroAtual.tipo !== "jetski" && carroAtual.mesh && carroAtual.mesh.userData.rodas && !MUNDO.reduz) {
          carroAtual.mesh.userData.rodas.forEach(roda => {
            roda.rotation.x -= carroAtual.vel * dt * 1.9;
          });
          carroAtual.mesh.rotation.z = -dirGiro * Math.min(1, Math.abs(carroAtual.vel) / 22) * (carroAtual.tipo === "moto" ? 0.18 : 0.05);
        }

        const assento = obterAssento(carroAtual.tipo).driver;
        aplicarPoseSentadoLocal(assento, jumpAtual);
      }
    } else if (caronaPid) {
      // 2. Passageiro na carona de motorista remoto
      const api = onlineApi();
      const drv = api && typeof api.getPlayersRemotos === "function"
        ? api.getPlayersRemotos().find(r => r.pid === caronaPid)
        : null;

      if (!drv || !drv.car_type || drv.room) {
        sairCarona(true);
        avisa("🚗 O motorista encerrou a viagem.");
      } else {
        const assento = obterAssento(drv.car_type).carona;
        const drvX = drv.grupo ? drv.grupo.position.x : drv.x;
        const drvY = drv.grupo ? drv.grupo.position.y : MUNDO.altura(drv.x, drv.z);
        const drvZ = drv.grupo ? drv.grupo.position.z : drv.z;
        const drvRy = drv.grupo ? drv.grupo.rotation.y : drv.ry;
        const c = Math.cos(drvRy);
        const s = Math.sin(drvRy);
        const wx = drvX + assento[0] * c + assento[2] * s;
        const wz = drvZ - assento[0] * s + assento[2] * c;

        MUNDO.jog.position.set(wx, drvY, wz);
        MUNDO.jog.rotation.y = drvRy;
        aplicarPoseSentadoLocal([0, assento[1], 0], jumpAtual);
      }
    } else if (salaAtual) {
      // 3. Caminhada dentro da sala 3D em y = 140
      const inp = lerMovimentoInput();
      let ix = (inp.dir ? 1 : 0) - (inp.esq ? 1 : 0);
      let iz = (inp.tras ? 1 : 0) - (inp.frente ? 1 : 0);
      const len = Math.hypot(ix, iz);
      let andandoSala = false;

      if (len > 0.05) {
        ix /= len;
        iz /= len;
        const vel = (inp.corre ? 13 : 8.5) * dt;
        const [sx, sz] = resolverColisaoSala(
          MUNDO.jog.position.x + ix * vel,
          MUNDO.jog.position.z + iz * vel
        );
        MUNDO.jog.position.set(sx, Y_SALA, sz);
        MUNDO.jog.rotation.y += angDif(MUNDO.jog.rotation.y, Math.atan2(-ix, -iz)) * Math.min(1, dt * 12);
        andandoSala = true;
      } else {
        MUNDO.jog.position.y = Y_SALA;
      }

      const vox = obterJogVox();
      if (vox) {
        vox.rotation.y = Math.PI;
        const bob = andandoSala && !MUNDO.reduz ? Math.abs(Math.sin((passoSala += dt * 12))) * 0.13 : 0;
        vox.position.set(0, jumpAtual + bob, 0);
        const pv = vox.userData.pivos || {};
        const bal = andandoSala && !MUNDO.reduz ? Math.sin(passoSala) * 0.55 : 0;
        if (pv.P0) pv.P0.rotation.x = bal;
        if (pv.P1) pv.P1.rotation.x = -bal;
        if (!pe.emote) {
          if (pv.B0) { pv.B0.rotation.x = -bal * 0.75; pv.B0.rotation.z = 0; }
          if (pv.B1) { pv.B1.rotation.x = bal * 0.75; pv.B1.rotation.z = 0; }
        }
      }
    }

    // 4. Futebol no campinho + 10 Moedas + Corrida Jet Ski + Confetes
    atualizarFutebol(dt);
    atualizarMoedas(t);
    atualizarCorridaJetskiQuadro(t);

    for (let i = confetes.length - 1; i >= 0; i--) {
      const c = confetes[i];
      c.vida -= dt;
      if (c.vida <= 0) {
        MUNDO.scene.remove(c.m);
        if (c.m.geometry) c.m.geometry.dispose();
        confetes.splice(i, 1);
        continue;
      }
      c.vy -= 14 * dt;
      c.m.position.x += c.vx * dt;
      c.m.position.y = Math.max(c.minY != null ? c.minY : 0.38, c.m.position.y + c.vy * dt);
      c.m.position.z += c.vz * dt;
      c.m.rotation.x += dt * 7;
      c.m.rotation.y += dt * 9;
    }

    // 5. Atualiza áudio ambiente (ondas da praia + motor do carro)
    if (somAtivo && audioCtx && audioCtx.state === "running") {
      const nowA = audioCtx.currentTime;
      if (ondasNodes) {
        const zJog = MUNDO.jog.position.z;
        const fatorMar = salaAtual ? 0 : limita((zJog - 16) / 34, 0, 1);
        const lfoOnda = 0.65 + 0.35 * Math.sin(t * 0.95);
        ondasNodes.ganho.gain.setTargetAtTime(Math.max(0.0001, fatorMar * 0.032 * lfoOnda), nowA, 0.15);
        ondasNodes.filtro.frequency.setTargetAtTime(280 + 260 * lfoOnda, nowA, 0.2);
      }
      if (motorNodes) {
        if (carroAtual) {
          const vNorm = Math.min(1, Math.abs(carroAtual.vel) / 36);
          motorNodes.osc.frequency.setTargetAtTime(54 + vNorm * 82, nowA, 0.08);
          motorNodes.ganhoMotor.gain.setTargetAtTime(0.014 + vNorm * 0.022, nowA, 0.08);
        } else {
          motorNodes.ganhoMotor.gain.setTargetAtTime(0.0001, nowA, 0.1);
        }
      }
      if (sireneNodes) {
        if (carroAtual && carroAtual.tipo === "viatura" && sireneAtiva) {
          const fSirene = 860 + Math.sin(t * 9.2) * 210;
          sireneNodes.osc.frequency.setTargetAtTime(fSirene, nowA, 0.04);
          sireneNodes.ganho.gain.setTargetAtTime(0.026, nowA, 0.08);
        } else {
          sireneNodes.ganho.gain.setTargetAtTime(0.0001, nowA, 0.08);
        }
      }
    }

    // Giroflex local (pisca mesmo com áudio desligado)
    if (carroAtual && carroAtual.mesh && carroAtual.mesh.userData && carroAtual.mesh.userData.giroRed) {
      const faseGiro = Math.floor(t * 7.5) % 2;
      carroAtual.mesh.userData.giroRed.material.color.setHex(faseGiro ? 0xff2b2b : 0x450a0a);
      carroAtual.mesh.userData.giroBlue.material.color.setHex(faseGiro ? 0x082f49 : 0x38bdf8);
      if (carroAtual.mesh.userData.giroLuz) {
        carroAtual.mesh.userData.giroLuz.color.setHex(faseGiro ? 0xff2b2b : 0x228be6);
        carroAtual.mesh.userData.giroLuz.intensity = 2.6;
      }
    }
  }

  function getParceiroCaronaPid() {
    if (caronaPid) return caronaPid;
    if (!carroAtual) return "";
    const api = onlineApi();
    if (!api || typeof api.getPlayersRemotos !== "function") return "";
    const meuPid = typeof api.getPid === "function" ? api.getPid() : "";
    if (!meuPid) return "";
    const pass = api.getPlayersRemotos().find(r => r && r.ride_of === meuPid);
    return pass ? (pass.pid || "") : "";
  }

  if (TEM_3D) {
    if (typeof MUNDO.addQuadroListener === "function") {
      MUNDO.addQuadroListener(atualizarQuadroInteracoes);
    } else {
      const prev = MUNDO.onQuadro;
      MUNDO.onQuadro = function (dt, t) {
        if (typeof prev === "function") prev(dt, t);
        atualizarQuadroInteracoes(dt, t);
      };
    }
  }

  // ---------- Exportação Pública window.CARAGUA_INTERACOES ----------
  window.CARAGUA_INTERACOES = {
    getContexto,
    acionarContexto,
    iniciarTestDrive,
    iniciarCorridaJetski,
    embarcarViaturaPolicia,
    embarcarMeuCarro,
    sairCarro,
    pegarCarona,
    sairCarona,
    getParceiroCaronaPid,
    toggleSireneViatura,
    isSireneAtiva: () => !!sireneAtiva,
    somAlarmeFugaPolicia,
    somCapturaPolicia,
    somTickPolicia,
    somPodiumPolicia,
    somTiroPistolinha,
    somHitAgua,
    lancarConfete3D,
    toggleSom,
    isSomAtivo,
    toggleModoFoto,
    isModoFoto: () => modoFotoAtivo,
    baixarFoto: baixarFotoPNG,
    getMoedasInfo,
    buzinar,
    getCarroAtual: () => (carroAtual ? carroAtual.tipo : ""),
    isDirigindo: () => !!carroAtual
  };
})();
