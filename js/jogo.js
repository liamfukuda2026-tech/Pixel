// Caraguá Pixel 3D · Mapa Completo (portado 100% de Caragua Pixel (Copy) (2).html + Apoia.se 4 min)
(function () {
  // Moradores vindos dos comentários: h = @ do Instagram, t = o que a pessoa escreveu, k = lugar na cidade.
  const DADOS = window.JOGO_DADOS || [];
  if (!DADOS.length || typeof THREE === "undefined") {
    const sg = document.getElementById("semgl");
    if (sg) sg.hidden = false;
    return;
  }

  const C = {
    ceu: 0xbfe6ef, grama: 0x8cc66d, calcada: 0xe9e1d3, asfalto: 0x5a646d, faixa: 0xf6f1e4,
    areia: 0xf1d9a6, mar: 0x2aa0b4, mata: 0x3f8f4f, mataEscura: 0x2f6f3d, ilha: 0x5f9a78,
    tronco: 0x8a5a3b, coral: 0xff7a59, pele: 0xf2c29b, tinta: 0x1d2a33, branco: 0xfffaf0,
    porta: 0x6b4a35, vidro: 0xcfeaf5, amarelo: 0xf6c443, concreto: 0xb9b4aa, muro: 0x9c978d,
    laranja: 0xff8a1f, cabine: 0x2b3a44
  };
  const CORES_CASA = [0xf7d6a0, 0xf4a9a0, 0xa8d8c8, 0xf6e3b4, 0xb9c9f0, 0xf2b880, 0xd7c4ec, 0xfff1d6, 0x9fd3e0, 0xf6c6d8];
  const CORES_TELHADO = [0xc4553b, 0xb5683c, 0x8f4a3a, 0x6e7f8a, 0xd27a4d];
  const CORES_CARRO = [0xe03131, 0x1c7ed6, 0xf8f9fa, 0x212529, 0xadb5bd, 0xf59f00, 0x2f9e44, 0x862e9c];
  const CORES_CAO = [0xc08552, 0x8b5a2b, 0x2b2b2b, 0xe8d5b5, 0xa0522d, 0xf0e6d2];
  const TERNOS = [0x2c3e66, 0x4a4f57, 0x22262b, 0x5c3d2e];
  const LUGAR = {
    casa: { nome: "Casas", cor: "#1f8a9e" },
    camara: { nome: "Câmara", cor: "#3b5bdb" },
    prefeitura: { nome: "Prefeitura", cor: "#2f9e44" },
    cadeia: { nome: "Cadeia", cor: "#f08c00" },
    uber: { nome: "Uber", cor: "#1d2a33" },
    loja: { nome: "Lojas", cor: "#f59f00" },
    parque: { nome: "Parque de Diversões", cor: "#e64980" },
    boulevard: { nome: "Boulevard da Praia", cor: "#7048e8" },
    academia: { nome: "Academia", cor: "#e8590c" },
    shopping: { nome: "Shopping", cor: "#0ca678" }
  };

  function semente(s) {
    return function () {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const rand = semente(2026);
  const escolhe = a => a[Math.floor(rand() * a.length)];
  const limita = (v, a, b) => Math.max(a, Math.min(b, v));
  const hex = n => "#" + n.toString(16).padStart(6, "0");
  const semAcento = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toque = matchMedia("(pointer: coarse)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    if (!renderer.getContext()) throw new Error("sem contexto");
  } catch (e) {
    document.getElementById("semgl").hidden = false;
    document.getElementById("numeros").textContent = "3D indisponível";
    return;
  }
  const cenaEl = document.getElementById("cena");
  const vw = () => cenaEl.clientWidth || innerWidth;
  const vh = () => cenaEl.clientHeight || innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(vw(), vh());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  cenaEl.appendChild(renderer.domElement);

  const CEU_DIA = 0x78b8e6;
  const CEU_NOITE = 0x0d1b35;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CEU_DIA);
  scene.fog = new THREE.Fog(CEU_DIA, 180, 560);
  const cam = new THREE.PerspectiveCamera(55, vw() / vh(), 0.5, 1400);

  const hemLight = new THREE.HemisphereLight(0xeaf7ff, 0x9a8a6a, 0.78);
  scene.add(hemLight);
  const sol = new THREE.DirectionalLight(0xfff1dc, 0.95);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 300 });
  sol.shadow.bias = -0.0008;
  scene.add(sol, sol.target);

  const estrelasNoite = (function () {
    const rEst = semente(7741);
    const qtd = 520;
    const pos = new Float32Array(qtd * 3);
    const cols = new Float32Array(qtd * 3);
    const palEst = [[1, 1, 1], [1, 0.95, 0.78], [0.78, 0.88, 1]];
    for (let i = 0; i < qtd; i++) {
      const th = rEst() * Math.PI * 2;
      const u = 0.14 + rEst() * 0.86;
      const raioCeu = 520 + rEst() * 240;
      const horiz = Math.sqrt(Math.max(0, 1 - u * u)) * raioCeu;
      pos[i * 3] = Math.cos(th) * horiz;
      pos[i * 3 + 1] = u * raioCeu + 28;
      pos[i * 3 + 2] = Math.sin(th) * horiz;
      const c = palEst[i % palEst.length];
      const br = 0.65 + rEst() * 0.35;
      cols[i * 3] = c[0] * br;
      cols[i * 3 + 1] = c[1] * br;
      cols[i * 3 + 2] = c[2] * br;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    const matEst = new THREE.PointsMaterial({
      size: 2.2,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      fog: false,
      depthWrite: false
    });
    const pts = new THREE.Points(geo, matEst);
    pts.frustumCulled = false;
    pts.visible = false;
    scene.add(pts);
    return pts;
  })();

  let modoNoite = false;
  function setNoite(ativo) {
    modoNoite = !!ativo;
    if (modoNoite) {
      scene.background.setHex(CEU_NOITE);
      scene.fog.color.setHex(CEU_NOITE);
      scene.fog.near = 175;
      scene.fog.far = 560;
      hemLight.color.setHex(0x8bb8ff);
      hemLight.groundColor.setHex(0x3a4a6b);
      hemLight.intensity = 0.68;
      sol.color.setHex(0xc2d8ff);
      sol.intensity = 0.54;
      estrelasNoite.visible = true;
    } else {
      scene.background.setHex(CEU_DIA);
      scene.fog.color.setHex(CEU_DIA);
      scene.fog.near = 180;
      scene.fog.far = 560;
      hemLight.color.setHex(0xeaf7ff);
      hemLight.groundColor.setHex(0x9a8a6a);
      hemLight.intensity = 0.78;
      sol.color.setHex(0xfff1dc);
      sol.intensity = 0.95;
      estrelasNoite.visible = false;
    }
    return modoNoite;
  }
  function isNoite() {
    return modoNoite;
  }


  // ---------- Ferramentas ----------
  const mats = new Map();
  function mat(c) {
    if (!mats.has(c)) mats.set(c, new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.92, metalness: 0 }));
    return mats.get(c);
  }
  function malha(geo, c, x, y, z, sombra = true) {
    const m = new THREE.Mesh(geo, mat(c));
    m.position.set(x, y, z);
    m.castShadow = sombra;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }
  function caixa(w, h, d, c, x, y, z, sombra = true) {
    return malha(new THREE.BoxGeometry(w, h, d), c, x, y + h / 2, z, sombra);
  }
  const UNIT = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const instancias = [];
  function inst(geo, n, cor) {
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: cor == null ? 0xffffff : cor, flatShading: true, roughness: 0.92 }), Math.max(1, n));
    m.count = 0;
    m.frustumCulled = false;
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    instancias.push(m);
    return m;
  }
  const d3 = new THREE.Object3D(), cTmp = new THREE.Color();
  function poe(m, x, y, z, sx, sy, sz, ry = 0, cor = null, i = -1) {
    d3.position.set(x, y, z);
    d3.rotation.set(0, ry, 0);
    d3.scale.set(sx, sy, sz);
    d3.updateMatrix();
    if (i < 0) i = m.count++;
    m.setMatrixAt(i, d3.matrix);
    if (cor != null) m.setColorAt(i, cTmp.setHex(cor));
    return i;
  }
  function gira(dx, dz, ry) {
    const c = Math.cos(ry), s = Math.sin(ry);
    return [dx * c + dz * s, -dx * s + dz * c];
  }
  // Um lote instanciado por cor (a cor fica no material, não em cada instância)
  function paleta(geo, n) {
    const p = { mapa: new Map(), malhas: [] };
    p.poe = (x, y, z, sx, sy, sz, ry, cor, h) => {
      if (h) { poe(h.m, x, y, z, sx, sy, sz, ry, null, h.i); return h; }
      let m = p.mapa.get(cor);
      if (!m) { m = inst(geo, n, cor); m.userData.ent = []; p.mapa.set(cor, m); p.malhas.push(m); }
      return { m, i: poe(m, x, y, z, sx, sy, sz, ry) };
    };
    p.marca = () => p.malhas.forEach(m => { m.instanceMatrix.needsUpdate = true; });
    return p;
  }

  // ---------- Bonecos de blocos (voxel): cabeça grande, cabelo, olhos, camiseta, calça e sapato ----------
  const PELES = [0xf2c29b, 0xe8b48a, 0xd9a066, 0xc68642, 0x8d5524];
  const CABELOS = [0x3b2314, 0x5c3317, 0x6b3e26, 0x1d1d1d, 0x1d1d1d, 0xe9c46a, 0xc1440e, 0xa0522d, 0x8a8a8a];
  const CAMISAS_V = [0x1c7ed6, 0x7048e8, 0xe03131, 0x2f9e44, 0xf59f00, 0x0ca678, 0xf06595, 0x343a40, 0xf8f9fa, 0x22b8cf, 0x9c36b5, 0xfab005];
  const CALCAS_V = [0x2b3a55, 0x1d1d1d, 0x495057, 0x5c3d2e, 0x364fc7, 0x1d1d1d];
  const SAPATOS_V = [0x1d1d1d, 0x3b2314, 0xf8f9fa, 0x1d1d1d];
  function hashTexto(s) { let h = 2166136261; for (const ch of String(s)) { h = Math.imul(h ^ ch.codePointAt(0), 16777619); } return h >>> 0; }
  const FEM_TXT = /(^|[^a-z])(medica|dona|professora|delegada|juiza|enfermeira|arquiteta|cafetona|moradora|bombeira|cozinheira|confeiteira|costureira|bancaria|quimica|veterinaria|tatuadora|agronoma|cabeleireira|advogada|adevogada|bibliotecaria|perita|nail|mae|operadora|vendedora|caixa|atentende|dentista pediatra|policial feminina)([^a-z]|$)/;
  const NOMES_FEM = new Set(["yasmin", "raquel", "evellyne", "jheniffer", "kemilly", "lary", "yngrid", "michele", "suzane", "lidiane", "hevillyn", "isabel", "thais", "carol", "emilly", "arielly", "fabielly", "grazi", "jazz", "evelyn", "karoll", "kelly", "daiane", "tati", "gabi", "lotus", "eu"]);
  const NAO_FEM = new Set(["serralheria", "eletricista", "motorista", "phmidia", "sts", "juca", "luca"]);
  function ehMulher(t) {
    const s = semAcento(t), nome = (s.match(/[a-z]+/) || [""])[0];
    if (FEM_TXT.test(s) || NOMES_FEM.has(nome)) return true;
    return nome.length > 2 && nome.endsWith("a") && !NAO_FEM.has(nome) && !nome.endsWith("ista");
  }
  function estiloBoneco(chave, fem, extra = {}) {
    const r = semente(hashTexto(chave));
    const pega = a => a[Math.floor(r() * a.length)];
    return Object.assign({ fem, pele: pega(PELES), cabelo: pega(CABELOS), camisa: pega(CAMISAS_V), calca: pega(CALCAS_V), sapato: pega(SAPATOS_V) }, extra);
  }
  // Cada peça: [largura, altura, profundidade, x, y da base, z, cor, grupo] com a frente virada para +z
  function partesBoneco(o) {
    const P = [];
    const b = (w, h, d, x, y, z, cor, tag = "") => P.push([w, h, d, x, y, z, cor, tag]);
    [-0.18, 0.18].forEach((x, i) => { b(0.34, 0.18, 0.5, x, 0, 0.04, o.sapato, "P" + i); b(0.32, 0.62, 0.36, x, 0.18, 0, o.calca, "P" + i); });
    if (!o.semTorso) b(0.82, 0.74, 0.44, 0, 0.8, 0, o.camisa, "T");
    [-0.53, 0.53].forEach((x, i) => { b(0.24, 0.32, 0.38, x, 1.22, 0, o.camisa, "B" + i); b(0.22, 0.44, 0.32, x, 0.78, 0, o.pele, "B" + i); });
    b(0.96, 0.9, 0.86, 0, 1.54, 0, o.pele);
    [-0.2, 0.2].forEach(x => b(0.15, 0.2, 0.04, x, 1.9, 0.43, o.olhos || 0x1d1d1d));
    b(0.12, 0.15, 0.1, 0, 1.76, 0.46, o.pele);
    b(1.02, 0.3, 0.92, 0, 2.38, 0, o.cabelo);
    b(1.02, 0.66, 0.2, 0, 1.78, -0.42, o.cabelo);
    b(1.02, 0.16, 0.1, 0, 2.24, 0.44, o.cabelo);
    if (o.fem) {
      b(1.06, 1.3, 0.24, 0, 1.15, -0.44, o.cabelo);
      [-0.53, 0.53].forEach(x => b(0.14, 1.05, 0.72, x, 1.35, -0.06, o.cabelo));
    } else {
      [-0.5, 0.5].forEach(x => b(0.06, 0.45, 0.55, x, 1.95, -0.15, o.cabelo));
    }
    if (o.chapeu) { b(1.5, 0.08, 1.4, 0, 2.52, 0, o.chapeu); b(1.0, 0.36, 0.95, 0, 2.6, 0, o.chapeu); }
    if (o.extra) o.extra.forEach(p => P.push(p.length > 7 ? p : p.concat([""])));
    return P;
  }
  const voxel = paleta(UNIT, 2500);
  function bonecoInst(x, y0, z, ry, o) {
    partesBoneco(o).forEach(([w, h, d, px, py, pz, cor]) => {
      const [ox, oz] = gira(px, pz, ry);
      voxel.poe(x + ox, y0 + py, z + oz, w, h, d, ry, cor);
    });
  }
  // Versão com malhas soltas (para o jogador e figuras dentro de grupos); pernas e braços ficam em pivôs
  function bonecoMalhas(o) {
    const g = new THREE.Group(), pivos = {};
    partesBoneco(o).forEach(([w, h, d, px, py, pz, cor, tag]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(cor));
      m.castShadow = true;
      m.userData._parteBoneco = true;
      let pai = g, ox = 0, oy = 0;
      if (tag && tag !== "T") {
        if (!pivos[tag]) {
          const piv = new THREE.Group();
          piv.userData._parteBoneco = true;
          oy = tag[0] === "P" ? 0.8 : 1.54;
          piv.position.set(px, oy, 0);
          g.add(piv);
          pivos[tag] = piv;
        }
        pai = pivos[tag];
        ox = pai.position.x;
        oy = pai.position.y;
      }
      m.position.set(px - ox, py + h / 2 - oy, pz);
      pai.add(m);
    });
    g.userData.pivos = pivos;
    return g;
  }

  const obstaculos = [];
  let obsVersion = 0, obsGridVer = -1;
  const OBS_CELL = 16, obsGrid = new Map();
  function marcaObsSujo() { obsVersion++; }
  function bloqueia(x, z, w, d) {
    obstaculos.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
    obsVersion++;
  }
  function reconstruirObsGrid() {
    obsGrid.clear();
    for (let i = 0; i < obstaculos.length; i++) {
      const o = obstaculos[i];
      const gx0 = Math.floor(o.x0 / OBS_CELL), gx1 = Math.floor(o.x1 / OBS_CELL);
      const gz0 = Math.floor(o.z0 / OBS_CELL), gz1 = Math.floor(o.z1 / OBS_CELL);
      for (let gx = gx0; gx <= gx1; gx++) {
        for (let gz = gz0; gz <= gz1; gz++) {
          const key = ((gx + 512) << 12) | ((gz + 512) & 0xfff);
          let arr = obsGrid.get(key);
          if (!arr) { arr = []; obsGrid.set(key, arr); }
          arr.push(o);
        }
      }
    }
    obsGridVer = obsVersion;
  }
  function colidePonto(x, z, r = 0.9) {
    if (obsGridVer !== obsVersion) reconstruirObsGrid();
    const gx0 = Math.floor((x - r) / OBS_CELL), gx1 = Math.floor((x + r) / OBS_CELL);
    const gz0 = Math.floor((z - r) / OBS_CELL), gz1 = Math.floor((z + r) / OBS_CELL);
    for (let gx = gx0; gx <= gx1; gx++) {
      for (let gz = gz0; gz <= gz1; gz++) {
        const arr = obsGrid.get(((gx + 512) << 12) | ((gz + 512) & 0xfff));
        if (!arr) continue;
        for (let i = 0; i < arr.length; i++) {
          const o = arr[i];
          if (o.ativo === false) continue;
          if (x < o.x0 - r || x > o.x1 + r || z < o.z0 - r || z > o.z1 + r) continue;
          const cx = limita(x, o.x0, o.x1), cz = limita(z, o.z0, o.z1);
          const dx = x - cx, dz = z - cz;
          if (dx * dx + dz * dz < r * r) return true;
        }
      }
    }
    return false;
  }

  // ---------- Quem mora onde ----------
  const grupos = { casa: [], camara: [], prefeitura: [], cadeia: [], uber: [] };
  DADOS.forEach(d => (grupos[d.k] || grupos.casa).push(d));

  // Entidades com placa de nome (casas, pessoas e carros)
  const ents = [];

  // ---------- Malha da cidade ----------
  const LOTE = 11, BW = 44, BD = 22, PASSO_X = 54, PZ = 32, COLS = 10, LOTES_Q = 8;
  const ESPECIAL = {
    "0,4": "camara", "0,5": "praca", "1,5": "prefeitura", "1,4": "posto", "4,4": "balada",
    "0,2": "predios", "0,3": "predios", "0,6": "predios", "0,7": "predios",
    // Hospital e UPA em quarteirões vazios do fim da cidade (ninguém muda de casa)
    "9,3": "hospital", "9,7": "upa",
    // Galeria com 8 lojas para alugar, também num quarteirão vazio
    "9,4": "galeria"
  };
  // Academia de treino no quarteirão logo depois da casa do @bruno.gats (quem mora antes dele não muda de casa)
  (function () {
    const iB = grupos.casa.findIndex(d => d.h === "bruno.gats");
    if (iB < 0) return;
    let n = 0;
    for (let r = 0; r < 200; r++) {
      for (let c = 0; c < COLS; c++) {
        if (ESPECIAL[r + "," + c]) continue;
        if (iB < n + LOTES_Q) {
          const cands = [[r, c + 1], [r + 1, c], [r + 1, c + 1], [r + 1, c - 1]];
          const ok = cands.find(([rr, cc]) => cc >= 0 && cc < COLS && !ESPECIAL[rr + "," + cc]);
          if (ok) ESPECIAL[ok[0] + "," + ok[1]] = "academia";
          return;
        }
        n += LOTES_Q;
      }
    }
  })();
  // Igreja e praça de Natal no quarteirão logo depois da casa do @pedriinn7_ (assim ninguém antes dele muda de casa)
  (function () {
    const iP = grupos.casa.findIndex(d => d.h === "pedriinn7_");
    if (iP < 0) return;
    let n = 0;
    for (let r = 0; r < 200; r++) {
      for (let c = 0; c < COLS; c++) {
        if (ESPECIAL[r + "," + c]) continue;
        if (iP < n + LOTES_Q) {
          const cands = [[r, c + 1], [r + 1, c], [r + 1, c + 1], [r + 1, c - 1]];
          const ok = cands.find(([rr, cc]) => cc >= 0 && cc < COLS && !ESPECIAL[rr + "," + cc]);
          if (ok) ESPECIAL[ok[0] + "," + ok[1]] = "igreja";
          return;
        }
        n += LOTES_Q;
      }
    }
  })();
  // Moradores novos ("novo") entram depois de todos os antigos: ninguém que já mora na cidade muda de casa
  const BASE = grupos.casa.filter(d => !d.novo).length;
  const blocosRes = Math.ceil(grupos.casa.length / LOTES_Q) + 4;
  const ROWS = Math.ceil((blocosRes + Object.keys(ESPECIAL).length) / COLS);
  const XC = c => (c - (COLS - 1) / 2) * PASSO_X;
  const ZC = r => 11 - r * PZ;
  const XMIN = XC(0) - 27, XMAX = XC(COLS - 1) + 27;
  const ZMIN = ZC(ROWS - 1) - 16, ZMAX = 28;
  const NORTE = ZMIN - 6;
  const JX = XMAX + 72, JZ = ZC(2) - 16; // cadeia a leste, alinhada a uma rua
  // Morro Santo Antônio: um morro suave que dá para subir (altura em cada ponto)
  // Molhe do farol: estrada sobre pedras que entra 100 m no mar
  const PX = 160, PZ0 = 65, PZR = 75, ZT = 174, RTIP = 9, PH = 1.2;
  const MARZ = 74; // onde a areia encontra o mar
  function alturaPier(x, z) {
    const naRua = Math.abs(x - PX) <= 2.2 && z >= PZ0 && z <= ZT;
    const naPonta = Math.hypot(x - PX, z - ZT) <= RTIP;
    if (!naRua && !naPonta) return 0;
    return z < PZR ? PH * (z - PZ0) / (PZR - PZ0) : PH;
  }
  function podeAndar(x, z) {
    return z <= MARZ - 1 || (Math.abs(x - PX) <= 1.8 && z <= ZT) || Math.hypot(x - PX, z - ZT) <= RTIP - 0.8;
  }
  const MX = XMIN - 75, MZ = -110, MRAIO = 62, MALT = 24, MTOPO = 8;
  function altura(x, z) {
    const ap = alturaPier(x, z);
    if (ap > 0) return ap;
    const d = Math.hypot(x - MX, z - MZ);
    if (d >= MRAIO) return 0;
    if (d <= MTOPO) return MALT;
    return MALT * (Math.cos(Math.PI * (d - MTOPO) / (MRAIO - MTOPO)) + 1) / 2;
  }
  const LIM = { x0: MX - MRAIO - 2, x1: JX + 64, z0: NORTE - 24, z1: ZT + RTIP };
  // Fazenda do @pexizin, atrás do Morro Santo Antônio; a estrada de terra sai da rua da cidade
  const FAZ = { x0: MX - 50, x1: MX + 20, z0: MZ - 190, z1: MZ - 95, estrada: ZC(8) - 16 };
  // Lixão longe da cidade, no canto nordeste (depois da cadeia), com estrada pela rua da cidade
  // Shopping entre o sítio do Px e a cidade, pertinho do Morro Santo Antônio
  const SHOP = { x0: FAZ.x1 + 3, x1: XMIN - 6, z0: FAZ.estrada + 6, z1: -177 };
  const noShopping = (x, z, m = 0) => x > SHOP.x0 - m && x < SHOP.x1 + m && z > SHOP.z0 - m && z < SHOP.z1 + m;
  const LIXO = { x0: XMAX + 32, x1: JX + 40, z0: NORTE + 12, z1: JZ - 70, estrada: ZC(7) - 16 };
  // Parque de diversões na ponta oeste da praia, colado na cidade (x1 = cerca com o portão; a carreta fica na pracinha da frente)
  const PQ = { x0: XMIN - 126, x1: XMIN - 20, z0: -34 };
  const noParque = (x, z, m = 0) => x > PQ.x0 - m && x < PQ.x1 + 14 + m && z > PQ.z0 - m && z < 50 + m;
  // Loja de carros e Boulevard da Praia na ponta leste da avenida da praia, depois da última quadra
  const BV = { x0: XMAX + 10, x1: XMAX + 128 };
  const noBoulevard = (x, z, m = 0) => x > XMAX + 4 - m && x < BV.x1 + 4 + m && z > -16 - m && z < 36 + m;

  // Chão, ruas, praia e mar
  caixa(1400, 0.1, 900, C.grama, 0, -0.1, -416, false);
  caixa(XMAX - XMIN + 10, 0.1, ZMAX - ZMIN + 16, C.asfalto, (XMIN + XMAX) / 2, 0, (ZMIN + ZMAX) / 2, false);
  caixa(JX - 32 - XMAX + 6, 0.1, 10, C.asfalto, (XMAX + JX - 32) / 2, 0, JZ, false);
  caixa(1400, 0.12, MARZ - 34, C.areia, 0, 0, (34 + MARZ) / 2, false);
  caixa(XMAX - XMIN + 10, 0.28, 1.4, C.calcada, (XMIN + XMAX) / 2, 0, 34.7, false);
  // Avenida da praia continua até o boulevard
  caixa(BV.x1 + 8 - (XMAX + 5), 0.1, 13.4, C.asfalto, (XMAX + 5 + BV.x1 + 8) / 2, 0, 28.7, false);
  caixa(BV.x1 + 8 - (XMAX + 5), 0.28, 1.4, C.calcada, (XMAX + 5 + BV.x1 + 8) / 2, 0, 34.7, false);
  const mar = malha(new THREE.PlaneGeometry(1600, 700), C.mar, 0, 0.02, MARZ + 350, false);
  mar.rotation.x = -Math.PI / 2;
  mar.receiveShadow = false;

  const faixas = inst(UNIT, 200, C.faixa);
  faixas.castShadow = false;
  for (let x = XMIN + 4; x <= BV.x1 + 4; x += 7) poe(faixas, x, 0.1, 28, 3.2, 0.03, 0.35);

  const calcadas = inst(UNIT, COLS * ROWS, C.calcada);
  calcadas.castShadow = false;

  // Casas (instanciadas)
  const nCasas = grupos.casa.length;
  const corpos = paleta(UNIT, nCasas);
  const geoTelhado = new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0);
  const telhados = paleta(geoTelhado, nCasas);
  const portas = inst(UNIT, nCasas, C.porta);
  const janelas = inst(UNIT, nCasas * 2, C.vidro);
  [portas, janelas].forEach(m => { m.castShadow = false; });
  const postes = inst(UNIT, 120, C.tronco);
  const tabuas = inst(UNIT, 120, C.branco);
  const casaEnt = [];

  // Barbearias: poste listrado girando e placa na frente da casa
  const EH_BARBEIRO = /barbeir|cortes masculinos/;
  const texPoste = (function () {
    const cv = document.createElement("canvas");
    cv.width = 128; cv.height = 128;
    const g = cv.getContext("2d");
    g.fillStyle = "#f8f9fa";
    g.fillRect(0, 0, 128, 128);
    g.translate(64, 64);
    g.rotate(-Math.PI / 4);
    const p = 64 / Math.SQRT2;
    for (let y = -200; y < 200; y += p) {
      g.fillStyle = "#e03131"; g.fillRect(-200, y, 400, p / 4);
      g.fillStyle = "#1c4fb8"; g.fillRect(-200, y + p / 2, 400, p / 4);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1.6);
    return tex;
  })();
  const texPlacaBarbearia = (function () {
    const cv = document.createElement("canvas");
    cv.width = 256; cv.height = 64;
    const g = cv.getContext("2d");
    g.fillStyle = "#1d2a33"; g.fillRect(0, 0, 256, 64);
    g.fillStyle = "#e03131"; g.fillRect(0, 0, 256, 6); g.fillRect(0, 58, 256, 6);
    g.fillStyle = "#1c4fb8"; g.fillRect(0, 6, 256, 4); g.fillRect(0, 54, 256, 4);
    g.fillStyle = "#fffaf0";
    g.font = '800 34px "Nunito Sans", "Segoe UI", sans-serif';
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("BARBEARIA", 128, 34);
    return new THREE.CanvasTexture(cv);
  })();
  const matPoste = new THREE.MeshStandardMaterial({ map: texPoste, roughness: 0.25 });
  const matPrata = new THREE.MeshStandardMaterial({ color: 0xdee2e6, metalness: 0.5, roughness: 0.25 });
  const matPlacaB = new THREE.MeshBasicMaterial({ map: texPlacaBarbearia });
  const geoPoste = new THREE.CylinderGeometry(0.26, 0.26, 2, 16);
  const geoTampa = new THREE.SphereGeometry(0.3, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const geoAnel = new THREE.CylinderGeometry(0.32, 0.32, 0.16, 12);
  function posteBarbeiro(x, y, z) {
    const g = new THREE.Group();
    const add = (geo, m, py, rx = 0) => { const o = new THREE.Mesh(geo, m); o.position.y = py; o.rotation.x = rx; o.castShadow = true; g.add(o); };
    add(geoPoste, matPoste, 0);
    add(geoAnel, matPrata, 1.06);
    add(geoAnel, matPrata, -1.06);
    add(geoTampa, matPrata, 1.12);
    add(geoTampa, matPrata, -1.12, Math.PI);
    g.position.set(x, y, z);
    scene.add(g);
  }

  // Casa com energia solar: telhado de duas águas com painéis na água da frente
  const EH_SOLAR = /energia solar|painel solar|placa solar/;
  const matPainel = new THREE.MeshStandardMaterial({
    map: (function () {
      const cv = document.createElement("canvas");
      cv.width = 256; cv.height = 128;
      const g = cv.getContext("2d");
      const grad = g.createLinearGradient(0, 0, 256, 128);
      grad.addColorStop(0, "#2a3f6e"); grad.addColorStop(1, "#14213d");
      g.fillStyle = grad; g.fillRect(0, 0, 256, 128);
      g.strokeStyle = "#8fa6c8"; g.lineWidth = 2;
      for (let x = 0; x <= 256; x += 256 / 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
      for (let y = 0; y <= 128; y += 128 / 3) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
      g.strokeStyle = "rgba(143,166,200,0.35)"; g.lineWidth = 1;
      for (let x = 16; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
      return new THREE.CanvasTexture(cv);
    })(),
    roughness: 0.3,
    metalness: 0.2
  });
  const geoDuasAguas = new THREE.CylinderGeometry(1, 1, 1, 3).rotateX(-Math.PI / 2).rotateY(Math.PI / 2);
  function telhadoSolar(l, w, dd, h, y0) {
    const hz = dd / 2 + 0.55, alt = 2.2, sy = alt / 1.5;
    const t = malha(geoDuasAguas, 0xd9733f, l.x, y0 + h + 0.5 * sy, l.z);
    t.scale.set(w + 0.8, sy, hz / 0.866);
    const a = Math.atan2(alt, hz), L = Math.hypot(hz, alt), s = l.sz;
    const nx = 0, ny = Math.cos(a), nz = s * Math.sin(a);
    const painel = new THREE.Mesh(new THREE.BoxGeometry(w - 0.6, 0.08, L * 0.8), [mat(0xadb5bd), mat(0xadb5bd), matPainel, mat(0x343a40), mat(0xadb5bd), mat(0xadb5bd)]);
    painel.position.set(l.x + nx, y0 + h + alt / 2 + ny * 0.12, l.z + s * hz / 2 + nz * 0.12);
    painel.rotation.x = s * a;
    painel.castShadow = true;
    scene.add(painel);
  }

  // Casa velha de madeira, com telhado de musgo e latinhas pelo chão
  function texturaCanvas(w, h, desenha, rx = 1, ry = 1) {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    desenha(cv.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    return t;
  }
  function casaVelha(l, y0) {
    const s = l.sz, ry = s > 0 ? 0 : Math.PI;
    const P = (dx, dz) => [l.x + dx * (s > 0 ? 1 : -1), l.z + s * dz];
    const bx = (w, h, d, cor, dx, y, dz, sombra = true) => { const [x, z] = P(dx, dz); const m = caixa(w, h, d, cor, x, y, z, sombra); m.rotation.y = ry; return m; };
    const W = 7, D = 5.6, H = 3.1, base = y0 + 0.45;
    const tabuas = new THREE.MeshStandardMaterial({
      roughness: 1, flatShading: true,
      map: texturaCanvas(256, 256, (g, w, h) => {
        for (let i = 0; i < 8; i++) {
          const v = 165 + Math.floor(rand() * 35);
          g.fillStyle = `rgb(${v},${v - 10},${v - 28})`;
          g.fillRect(i * 32, 0, 32, h);
          g.fillStyle = "rgba(60,48,36,0.25)";
          for (let k = 0; k < 6; k++) g.fillRect(i * 32 + rand() * 28, rand() * h, 2, 20 + rand() * 60);
        }
        g.fillStyle = "#4a4035";
        for (let i = 0; i <= 8; i++) g.fillRect(i * 32 - 2, 0, 3, h);
        g.fillStyle = "rgba(90,80,50,0.35)";
        g.fillRect(0, h * 0.85, w, h * 0.15);
      }, 2, 1)
    });
    const musgo = new THREE.MeshStandardMaterial({
      roughness: 1, flatShading: true,
      map: texturaCanvas(128, 128, (g, w, h) => {
        g.fillStyle = "#5e5340"; g.fillRect(0, 0, w, h);
        for (let k = 0; k < 40; k++) {
          g.fillStyle = rand() < 0.5 ? "rgba(107,122,58,0.8)" : "rgba(70,62,44,0.8)";
          g.beginPath(); g.arc(rand() * w, rand() * h, 4 + rand() * 12, 0, Math.PI * 2); g.fill();
        }
        g.fillStyle = "rgba(40,34,26,0.5)";
        for (let y = 8; y < h; y += 14) g.fillRect(0, y, w, 2);
      }, 2, 2)
    });
    // Chão de terra com folhas secas
    bx(10.4, 0.36, 10.4, 0x8c7a5b, 0, 0, 0, false);
    const folhas = paleta(new THREE.BoxGeometry(0.35, 0.02, 0.22), 60);
    for (let k = 0; k < 50; k++) {
      const [x, z] = P(-5 + rand() * 10, -5 + rand() * 10);
      folhas.poe(x, 0.37, z, 1, 1, 1, rand() * 6, escolhe([0xc2703d, 0xa0522d, 0xd9a441, 0x7a5230]));
    }
    // Estacas e corpo de tábuas
    [[-3.2, -2.5], [3.2, -2.5], [-3.2, 2.5], [3.2, 2.5]].forEach(([dx, dz]) => bx(0.35, 0.5, 0.35, 0x6b5a46, dx, y0, dz, false));
    const corpo = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), tabuas);
    { const [x, z] = P(0, -0.2); corpo.position.set(x, base + H / 2, z); }
    corpo.rotation.y = ry;
    corpo.castShadow = corpo.receiveShadow = true;
    scene.add(corpo);
    { const [x, z] = P(0, -0.2); bloqueia(x, z, W, D); }
    // Telhado de duas águas velho, com musgo
    const tel = new THREE.Mesh(geoDuasAguas, musgo);
    const sy = 1.8 / 1.5;
    { const [x, z] = P(0, -0.2); tel.position.set(x, base + H + 0.5 * sy, z); }
    tel.scale.set(W + 0.9, sy, (D / 2 + 0.6) / 0.866);
    tel.castShadow = true;
    scene.add(tel);
    // Porta aberta, janelinhas e degraus
    const zf = -0.2 + D / 2 + 0.03;
    bx(1.3, 2.2, 0.06, 0x1f1a14, 0.6, base, zf, false);
    const folha = bx(1.25, 2.15, 0.1, 0x9c8f78, 0.6 - 0.62, base, zf + 0.62, false);
    folha.rotation.y = ry + (s > 0 ? 1.35 : -1.35);
    [[-2.2, 1.6], [2.4, 1.6]].forEach(([dx, y]) => {
      bx(1.1, 1.1, 0.08, 0x6b4a35, dx, base + y - 0.55, zf + 0.02, false);
      bx(0.9, 0.9, 0.1, 0x3d4a52, dx, base + y - 0.45, zf + 0.03, false);
      bx(0.06, 0.9, 0.12, 0x6b4a35, dx, base + y - 0.45, zf + 0.04, false);
      bx(0.9, 0.06, 0.12, 0x6b4a35, dx, base + y, zf + 0.04, false);
    });
    bx(1.8, 0.2, 0.7, 0x8a7a62, 0.6, y0 + 0.2, zf + 0.45, false);
    bx(1.6, 0.18, 0.6, 0x8a7a62, 0.6, y0, zf + 1.05, false);
    // Escora de madeira na lateral
    const escora = bx(0.18, 3.2, 0.18, 0x6b5a46, W / 2 + 0.6, y0, 1.2, false);
    escora.rotation.z = (s > 0 ? 1 : -1) * 0.28;
    // Cadeira velha, vasos de barro e cesto
    bx(1.0, 0.1, 0.9, 0x6c7a5a, -2.4, y0 + 0.55, zf + 2.6, false);
    bx(1.0, 0.8, 0.1, 0x6c7a5a, -2.4, y0 + 0.65, zf + 2.15, false);
    [[-0.42, -0.38], [0.42, -0.38], [-0.42, 0.38], [0.42, 0.38]].forEach(([a, b]) => bx(0.08, 0.6, 0.08, 0x55604a, -2.4 + a, y0, zf + 2.6 + b, false));
    [[2.9, 0.9], [3.4, 1.6]].forEach(([dx, dz]) => { const [x, z] = P(dx, zf + dz - 0.2); malha(new THREE.CylinderGeometry(0.32, 0.24, 0.6, 10), 0xc4622d, x, y0 + 0.3, z); });
    { const [x, z] = P(1.8, zf + 2.3); malha(new THREE.CylinderGeometry(0.4, 0.32, 0.45, 10, 1, true), 0x8a6a3a, x, y0 + 0.24, z); }
    // Latinhas espalhadas pelo chão (deitadas, em pé e amassadas)
    const latas = paleta(new THREE.CylinderGeometry(0.075, 0.075, 0.22, 8), 30);
    for (let k = 0; k < 22; k++) {
      const [x, z] = P(-4.6 + rand() * 9.2, zf + 0.3 + rand() * 2.4);
      const cor = escolhe([0xc92a2a, 0xdee2e6, 0x1c7ed6, 0xfab005, 0x2b8a3e, 0xadb5bd]);
      const deitada = rand() < 0.65;
      const h = latas.poe(x, deitada ? y0 + 0.14 : y0 + 0.17, z, 1, rand() < 0.3 ? 0.55 : 1, 1, rand() * 6, cor);
      if (deitada) {
        d3.position.set(x, y0 + 0.14, z);
        d3.rotation.set(Math.PI / 2, rand() * 6, 0, "YXZ");
        d3.scale.set(1, 1, 1);
        d3.updateMatrix();
        h.m.setMatrixAt(h.i, d3.matrix);
        d3.rotation.order = "XYZ";
      }
    }
    // Árvore velha fazendo sombra
    const [ax, az] = P(-4.2, -4.2);
    const tr = malha(new THREE.CylinderGeometry(0.35, 0.55, 6, 6), 0x6b4a35, ax, 3, az);
    tr.rotation.z = 0.15;
    malha(new THREE.IcosahedronGeometry(3.2, 0), 0x7a8c3a, ax + 0.9, 7, az);
    malha(new THREE.IcosahedronGeometry(2.4, 0), 0xb08a3a, ax - 1.4, 6.3, az + 1.2);
    bloqueia(ax, az, 1, 1);
  }

  // Sobrado de tijolinho de 3 andares, com sacadas, para os médicos
  const EH_MEDICO = /(^|[^a-z])medic[oa]([^a-z]|$)|ginecologista/;
  let matTijolo = null, matGradil = null;
  function casaMedico(l, y0) {
    if (!matTijolo) {
      matTijolo = new THREE.MeshStandardMaterial({
        roughness: 0.95,
        map: texturaCanvas(256, 256, (g, w, h) => {
          g.fillStyle = "#d9c3a5"; g.fillRect(0, 0, w, h);
          for (let r = 0; r < 16; r++) for (let c = -1; c < 6; c++) {
            const v = 150 + Math.floor(rand() * 40);
            g.fillStyle = `rgb(${v + 30},${v - 50},${v - 100})`;
            g.fillRect(c * 48 + (r % 2) * 24 + 2, r * 16 + 2, 44, 12);
          }
        }, 2, 3)
      });
      matGradil = new THREE.MeshBasicMaterial({
        transparent: true, side: THREE.DoubleSide, alphaTest: 0.3,
        map: texturaCanvas(256, 64, (g, w, h) => {
          g.clearRect(0, 0, w, h);
          g.fillStyle = "#1d1d1d";
          g.fillRect(0, 0, w, 5); g.fillRect(0, h - 4, w, 4);
          for (let x = 2; x < w; x += 9) g.fillRect(x, 0, 2, h);
        })
      });
    }
    const s = l.sz, ry = s > 0 ? 0 : Math.PI;
    const P = (dx, dz) => [l.x + dx * (s > 0 ? 1 : -1), l.z + s * dz];
    const bx = (w, h, d, cor, dx, y, dz, sombra = true) => { const [x, z] = P(dx, dz); const m = caixa(w, h, d, cor, x, y, z, sombra); m.rotation.y = ry; return m; };
    const CONC = 0xbdb8b0, PRETO = 0x2b2b2b, LUZ = 0xf4c78e;
    const W = 7.4, D = 7, AND = 3.2, H = AND * 3, zf = -0.6 + D / 2;
    // Corpo de tijolinho e estrutura de concreto
    const corpo = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), matTijolo);
    { const [x, z] = P(0, -0.6); corpo.position.set(x, y0 + H / 2, z); }
    corpo.rotation.y = ry;
    corpo.castShadow = corpo.receiveShadow = true;
    scene.add(corpo);
    { const [x, z] = P(0, -0.6); bloqueia(x, z, W, D); }
    [-W / 2, W / 2].forEach(dx => bx(0.5, H + 0.5, 0.5, CONC, dx, y0, zf + 0.05));
    bx(W + 0.5, 0.5, D + 0.3, CONC, 0, y0 + H, -0.6);
    // Térreo: portão de garagem, porta e arandelas
    bx(3.6, 2.6, 0.1, 0x343a40, -1.3, y0, zf + 0.06, false);
    for (let k = 1; k < 6; k++) bx(3.6, 0.04, 0.12, 0x495057, -1.3, y0 + k * 0.45, zf + 0.07, false);
    bx(1.1, 2.4, 0.1, 0x343a40, 1.9, y0, zf + 0.06, false);
    [1.15, 2.65].forEach(dx => bx(0.14, 0.3, 0.14, LUZ, dx, y0 + 2.2, zf + 0.1, false));
    // Andares de cima: laje-sacada, janelão iluminado, cortinas, gradil e vasos
    [1, 2].forEach(n => {
      const yb = y0 + n * AND;
      bx(W + 0.4, 0.3, 1.5, CONC, 0, yb - 0.3, zf + 0.75);
      const vid = bx(5.2, 2.5, 0.08, PRETO, 0, yb, zf + 0.04, false);
      const luz = new THREE.Mesh(new THREE.BoxGeometry(4.9, 2.3, 0.05), new THREE.MeshBasicMaterial({ color: LUZ }));
      { const [x, z] = P(0, zf + 0.06); luz.position.set(x, yb + 1.25, z); }
      luz.rotation.y = ry;
      scene.add(luz);
      [-2.1, 2.1].forEach(dx => bx(0.6, 2.3, 0.06, 0xf1f3f5, dx, yb + 0.05, zf + 0.1, false));
      bx(0.08, 2.4, 0.1, PRETO, 0, yb, zf + 0.1, false);
      const grad = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.2, 1.05), matGradil);
      { const [x, z] = P(0, zf + 1.45); grad.position.set(x, yb + 0.52, z); }
      grad.rotation.y = ry;
      scene.add(grad);
      [-2.9, 2.9].forEach(dx => {
        const [x, z] = P(dx, zf + 0.9);
        malha(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 8), 0xdee2e6, x, yb + 0.25, z, false);
        malha(new THREE.IcosahedronGeometry(0.45, 0), 0x2f9e44, x, yb + 0.85, z, false);
      });
      [-1.8, 1.8].forEach(dx => { const [x, z] = P(dx, zf + 1.1); malha(new THREE.SphereGeometry(0.08, 6, 4), LUZ, x, yb + AND - 0.35, z, false).material = new THREE.MeshBasicMaterial({ color: 0xfff3bf }); });
    });
    // Calçada de piso intertravado na frente
    bx(W + 1, 0.06, 1.6, 0xd6d2ca, 0, y0, zf + 1.4, false);
  }

  // Moto de rua cinza (estilo da foto) estacionada na frente da casa de cada motoboy
  const EH_MOTOBOY = /moto ?boy/;
  let motoModelo = null;
  function criaMoto() {
    const g = new THREE.Group();
    const add = (geo, cor, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, mat(cor));
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      g.add(m);
      return m;
    };
    const PRETO = 0x1d1d1d, CINZA = 0x868e96, PRATA = 0xced4da, ESCURO = 0x495057;
    [0.74, -0.74].forEach(x => {
      add(new THREE.CylinderGeometry(0.34, 0.34, 0.14, 16).rotateX(Math.PI / 2), PRETO, x, 0.34, 0);
      add(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 10).rotateX(Math.PI / 2), ESCURO, x, 0.34, 0);
    });
    add(new THREE.BoxGeometry(0.5, 0.38, 0.3), ESCURO, 0.05, 0.56, 0);
    add(new THREE.BoxGeometry(0.62, 0.32, 0.42), CINZA, 0.22, 0.98, 0);
    add(new THREE.BoxGeometry(0.5, 0.06, 0.44), 0xc2255c, 0.12, 0.86, 0);
    add(new THREE.BoxGeometry(0.75, 0.12, 0.32), PRETO, -0.38, 1.04, 0);
    add(new THREE.BoxGeometry(0.55, 0.14, 0.26), CINZA, -0.82, 1.07, 0, 0, 0, 0.25);
    add(new THREE.BoxGeometry(0.45, 0.14, 0.12), CINZA, -0.35, 0.7, 0, 0, 0, -0.5);
    [0.1, -0.1].forEach(z => add(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 6), PRATA, 0.66, 0.78, z, 0, 0, -0.32));
    add(new THREE.BoxGeometry(0.42, 0.06, 0.18), CINZA, 0.78, 0.72, 0, 0, 0, -0.3);
    add(new THREE.BoxGeometry(0.06, 0.06, 0.78), PRETO, 0.5, 1.26, 0);
    add(new THREE.BoxGeometry(0.22, 0.24, 0.3), CINZA, 0.68, 1.12, 0);
    add(new THREE.BoxGeometry(0.06, 0.16, 0.2), 0xfff3bf, 0.8, 1.1, 0);
    add(new THREE.CylinderGeometry(0.07, 0.07, 0.75, 8).rotateZ(Math.PI / 2), PRATA, -0.55, 0.52, 0.2);
    add(new THREE.BoxGeometry(0.03, 0.4, 0.03), PRETO, -0.1, 0.18, -0.18, 0.45);
    return g;
  }
  function motoNaFrente(l, w, dd) {
    if (!motoModelo) motoModelo = criaMoto();
    const moto = motoModelo.clone();
    const x = l.x - w * 0.3, z = l.z + l.sz * (dd / 2 + 1.05);
    moto.position.set(x, 0.3, z);
    moto.rotation.set(-0.1, rand() < 0.5 ? 0 : Math.PI, 0, "YXZ");
    scene.add(moto);
    bloqueia(x, z, 2.2, 0.7);
  }

  // Caminhão antigo verde, de cabine arredondada e carroceria, estacionado na frente de uma casa
  function caminhaoNaFrente(l) {
    const g = new THREE.Group();
    const add = (geo, cor, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, mat(cor));
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      g.add(m);
      return m;
    };
    const VERDE = 0x8fbf7a, PRETO = 0x1d1d1d, GRADE = 0x343a40, CROMO = 0xced4da;
    // Chassi, tanque vermelho
    add(new THREE.BoxGeometry(7.6, 0.35, 1.6), PRETO, 0, 0.95, 0);
    add(new THREE.CylinderGeometry(0.32, 0.32, 1.4, 10).rotateZ(Math.PI / 2), 0xc92a2a, 0.2, 0.85, 0.95);
    // Cabine verde com teto arredondado
    add(new THREE.BoxGeometry(2.3, 1.6, 2.3), VERDE, 2.55, 1.95, 0);
    add(new THREE.CylinderGeometry(1.15, 1.15, 2.3, 12, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), VERDE, 2.55, 2.75, 0).scale.set(1, 0.42, 1);
    add(new THREE.BoxGeometry(0.9, 1.0, 2.3), VERDE, 4.1, 1.55, 0);
    add(new THREE.BoxGeometry(0.06, 0.9, 2.0), 0x2b3a44, 3.71, 2.55, 0, 0, 0, -0.12);
    [-1.16, 1.16].forEach(z => add(new THREE.BoxGeometry(1.3, 0.8, 0.05), 0x2b3a44, 2.4, 2.45, z));
    // Grade sem logotipo, faróis redondos, para-choque e para-lamas
    add(new THREE.BoxGeometry(0.08, 0.7, 1.3), GRADE, 4.56, 1.45, 0);
    for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(0.1, 0.06, 1.25), CROMO, 4.6, 1.2 + k * 0.17, 0);
    [-0.85, 0.85].forEach(z => {
      add(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12).rotateZ(Math.PI / 2), 0xfff3bf, 4.6, 1.45, z);
      add(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 12).rotateZ(Math.PI / 2), CROMO, 4.57, 1.45, z);
    });
    add(new THREE.BoxGeometry(0.25, 0.3, 2.5), PRETO, 4.7, 0.95, 0);
    [-1.15, 1.15].forEach(z => add(new THREE.CylinderGeometry(0.75, 0.75, 0.35, 12, 1, false, 0, Math.PI).rotateX(Math.PI / 2), PRETO, 3.3, 0.6, z));
    [-1.35, 1.35].forEach(z => { add(new THREE.BoxGeometry(0.06, 0.06, 0.4), PRETO, 3.75, 2.6, z * 0.95); add(new THREE.BoxGeometry(0.08, 0.45, 0.25), PRETO, 3.75, 2.6, z); });
    // Carroceria bege com fueiros
    add(new THREE.BoxGeometry(4.8, 0.25, 2.4), 0x6b4a35, -1.4, 1.25, 0);
    [-1.15, 1.15].forEach(z => add(new THREE.BoxGeometry(4.8, 0.85, 0.08), 0xc9c2a6, -1.4, 1.8, z));
    add(new THREE.BoxGeometry(0.08, 0.85, 2.4), 0xc9c2a6, -3.78, 1.8, 0);
    add(new THREE.BoxGeometry(0.08, 0.85, 2.4), 0xc9c2a6, 0.98, 1.8, 0);
    for (let k = 0; k < 5; k++) [-1.17, 1.17].forEach(z => add(new THREE.BoxGeometry(0.1, 0.9, 0.06), 0x8a6a3a, -3.6 + k * 1.1, 1.8, z));
    // Guindaste azul dobrado atrás da cabine
    add(new THREE.BoxGeometry(0.4, 1.8, 0.4), 0x1c7ed6, 1.2, 2.2, 0.7);
    add(new THREE.BoxGeometry(0.3, 0.3, 1.6), 0x1c7ed6, 1.2, 3.0, 0.1, 0.4);
    // Rodas com aro laranja (traseiras duplas)
    const roda = (x, z) => {
      add(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 14).rotateX(Math.PI / 2), PRETO, x, 0.55, z);
      add(new THREE.CylinderGeometry(0.3, 0.3, 0.42, 10).rotateX(Math.PI / 2), 0xe8590c, x, 0.55, z);
    };
    [-1.05, 1.05].forEach(z => { roda(3.3, z); roda(-2.2, z); roda(-2.2, z * 0.68); });
    // Estaciona na rua, encostado no meio-fio em frente à casa
    const zc = l.z + l.sz * (5.5 + 1.3);
    g.position.set(l.x, 0, zc);
    scene.add(g);
    bloqueia(l.x, zc, 8.6, 2.6);
  }

  const lotes = [];
  let quarteiroes = 0;
  const especiais = {};
  const especiaisLista = {};
  const blocosMapa = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cx = XC(c), cz = ZC(r);
      poe(calcadas, cx, 0, cz, BW, 0.3, BD);
      const esp = ESPECIAL[r + "," + c];
      blocosMapa.push({ cx, cz, tipo: esp || "casas" });
      if (esp) {
        especiais[esp] = { cx, cz };
        (especiaisLista[esp] = especiaisLista[esp] || []).push({ cx, cz });
        continue;
      }
      quarteiroes++;
      for (let i = 0; i < LOTES_Q; i++) {
        const sz = i < 4 ? 1 : -1;
        lotes.push({ q: quarteiroes, x: cx - 16.5 + (i % 4) * LOTE, z: cz + sz * 5.5, sz });
      }
    }
  }

  // Reserva 2 lotes livres vizinhos do outro lado da rua, bem em frente à casa de alguém
  const reservados = new Set();
  function lotesEmFrente(handle) {
    const iO = grupos.casa.findIndex(d => d.h === handle);
    if (iO < 0 || !lotes[iO]) return [];
    const o = lotes[iO], livre = i => i >= BASE && !reservados.has(i);
    const frente = lotes.map((l, i) => i).filter(i => livre(i) && lotes[i].sz === -o.sz && Math.abs(lotes[i].z - (o.z + o.sz * 21)) < 1);
    const par = [[0, 11], [-11, 0]].map(([a, b]) => [
      frente.find(i => Math.abs(lotes[i].x - (o.x + a)) < 0.1),
      frente.find(i => Math.abs(lotes[i].x - (o.x + b)) < 0.1)
    ]).find(([i, j]) => i != null && j != null && lotes[i].q === lotes[j].q);
    if (!par) return [];
    par.forEach(i => reservados.add(i));
    return par;
  }
  // Campinho em frente ao @thebestplayerofhistoryiscr7 e adega em frente ao @rodriigs3
  const campoLotes = lotesEmFrente("thebestplayerofhistoryiscr7");
  const adegaLotes = lotesEmFrente("rodriigs3");
  // Mansão do @robertlopes.oficial: ocupa o quarteirão inteiro (livre) do outro lado da rua e vira a casa dele
  const mansao = (function () {
    const iO = grupos.casa.findIndex(d => d.h === "robertlopes.oficial");
    if (iO < 0 || !lotes[iO]) return null;
    const o = lotes[iO];
    const em = lotes.findIndex(l => l.sz === -o.sz && Math.abs(l.x - o.x) < 0.1 && Math.abs(l.z - (o.z + o.sz * 21)) < 1);
    if (em < 0) return null;
    const q = lotes[em].q;
    const doBloco = lotes.map((l, i) => i).filter(i => lotes[i].q === q);
    if (doBloco.length !== LOTES_Q || doBloco.some(i => i < BASE || reservados.has(i))) return null;
    doBloco.forEach(i => reservados.add(i));
    const xs = doBloco.map(i => lotes[i].x), zs = doBloco.map(i => lotes[i].z);
    return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cz: (Math.min(...zs) + Math.max(...zs)) / 2, f: lotes[em].sz, q, dono: grupos.casa[iO], iDono: iO };
  })();

  // O @pexizin mora na fazenda atrás do morro (a casa antiga dele fica livre)
  const iFazendeiro = grupos.casa.findIndex(d => d.h === "pexizin");

  // Casa de cada lote: os antigos ficam onde estavam e os novos pulam os lotes reservados (campinho, adega e mansão)
  const casaDoLote = [];
  { let p = BASE; lotes.forEach((l, i) => { casaDoLote[i] = i < BASE ? grupos.casa[i] : reservados.has(i) ? null : (p < grupos.casa.length ? grupos.casa[p++] : null); }); }

  // Portas entráveis (Consultório, Barbearia, Prefeitura e Casas compradas) e Terrenos Livres ("À VENDA")
  const pontosPortas = [];
  const lotesLivres = [];
  const placasVendaMeshes = [];
  const casasCompradasMeshes = [];
  let atualizarBuscaCasa = null;
  let infoConsultorioPortal = null;
  let infoBarbeariaPortal = null;

  function registrarOuAtualizarPorta(entry) {
    const idx = pontosPortas.findIndex(p => p.id === entry.id);
    if (idx >= 0) Object.assign(pontosPortas[idx], entry);
    else pontosPortas.push(entry);
  }

  const matTapetePortaBase = new THREE.MeshBasicMaterial({ color: 0x38d9a9, transparent: true, opacity: 0.72 });
  function criarIndicadorPorta(corHex = 0x38d9a9) {
    const g = new THREE.Group();
    const mCor = new THREE.MeshBasicMaterial({ color: corHex, transparent: true, opacity: 0.78 });
    mCor.userData._descartavel = true;
    const mBorda = new THREE.MeshBasicMaterial({ color: 0xfff3bf, transparent: true, opacity: 0.9 });
    mBorda.userData._descartavel = true;
    const gTap = new THREE.BoxGeometry(1.75, 0.05, 0.95);
    gTap.userData._descartavel = true;
    const tap = new THREE.Mesh(gTap, mCor);
    tap.position.set(0, 0.03, 0);
    g.add(tap);
    const gFriso = new THREE.BoxGeometry(1.9, 0.03, 1.1);
    gFriso.userData._descartavel = true;
    const friso = new THREE.Mesh(gFriso, mBorda);
    friso.position.set(0, 0.015, 0);
    g.add(friso);
    [-0.92, 0.92].forEach(dx => {
      const gCol = new THREE.BoxGeometry(0.1, 2.55, 0.1);
      gCol.userData._descartavel = true;
      const col = new THREE.Mesh(gCol, mCor);
      col.position.set(dx, 1.28, -0.42);
      g.add(col);
    });
    const gTopo = new THREE.BoxGeometry(1.96, 0.12, 0.14);
    gTopo.userData._descartavel = true;
    const topo = new THREE.Mesh(gTopo, mBorda);
    topo.position.set(0, 2.58, -0.42);
    g.add(topo);
    return g;
  }

  // Seleciona o Consultório Médico e a Barbearia mais próximos do centro voltados para a avenida (+z)
  const iConsultorioPrincipal = (function () {
    let melhor = -1, melhorD = Infinity;
    lotes.forEach((l, idx) => {
      const d = idx === iFazendeiro ? null : casaDoLote[idx];
      if (!d) return;
      const txt = semAcento(d.t);
      const solar = d.h === "lucasdasilvaa08" || EH_SOLAR.test(txt);
      const velha = d.h === "dimunizzzz";
      if (velha || solar || !EH_MEDICO.test(txt)) return;
      const penal = l.sz > 0 ? 0 : 90;
      const dist0 = Math.hypot(l.x, l.z - 10) + penal;
      if (dist0 < melhorD) { melhorD = dist0; melhor = idx; }
    });
    return melhor;
  })();

  const iBarbeariaPrincipal = (function () {
    let melhor = -1, melhorD = Infinity;
    lotes.forEach((l, idx) => {
      const d = idx === iFazendeiro ? null : casaDoLote[idx];
      if (!d) return;
      const txt = semAcento(d.t);
      if (!EH_BARBEIRO.test(txt)) return;
      const penal = l.sz > 0 ? 0 : 90;
      const dist0 = Math.hypot(l.x, l.z - 10) + penal;
      if (dist0 < melhorD) { melhorD = dist0; melhor = idx; }
    });
    return melhor;
  })();

  // Textura e geometrias compartilhadas das placas 3D "À VENDA"
  const matPlacaAVenda = (function () {
    const cv = document.createElement("canvas");
    cv.width = 256; cv.height = 144;
    const g = cv.getContext("2d");
    g.fillStyle = "#141a30";
    g.fillRect(0, 0, 256, 144);
    g.fillStyle = "#f0d060";
    g.fillRect(6, 6, 244, 132);
    g.fillStyle = "#141a30";
    g.fillRect(13, 13, 230, 118);
    g.fillStyle = "#2f9e44";
    g.fillRect(20, 20, 216, 52);
    g.fillStyle = "#fffaf0";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = '800 34px "Nunito Sans", "Segoe UI", sans-serif';
    g.fillText("À VENDA", 128, 47);
    g.fillStyle = "#f0d060";
    g.font = '800 20px "Nunito Sans", "Segoe UI", sans-serif';
    g.fillText("TERRENO VIP", 128, 92);
    g.fillStyle = "#a5d8ff";
    g.font = '700 16px "Nunito Sans", "Segoe UI", sans-serif';
    g.fillText("CLIQUE P/ COMPRAR", 128, 116);
    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) });
  })();
  const geoPosteVenda = new THREE.BoxGeometry(0.2, 1.75, 0.2);
  const geoTabuaVenda = new THREE.BoxGeometry(2.35, 1.25, 0.14);
  const geoFaceVenda = new THREE.PlaneGeometry(2.22, 1.14);
  const geoCanteiroLivre = new THREE.BoxGeometry(9.6, 0.08, 9.2);

  function registrarLoteLivre(l, idx) {
    const slot = (idx % LOTES_Q) + 1;
    const id = "lote_q" + l.q + "_" + slot;
    const rot = l.sz > 0 ? 0 : Math.PI;
    const zp = l.z + l.sz * 3.6;

    const gramado = new THREE.Mesh(geoCanteiroLivre, mat(0x7bc96f));
    gramado.position.set(l.x, 0.31, l.z);
    gramado.receiveShadow = true;
    scene.add(gramado);

    const meshPlaca = new THREE.Group();
    meshPlaca.position.set(l.x, 0.3, zp);
    meshPlaca.rotation.y = rot;
    meshPlaca.userData.loteId = id;

    const posteM = new THREE.Mesh(geoPosteVenda, mat(C.tronco));
    posteM.position.set(0, 0.875, 0);
    posteM.castShadow = true;
    posteM.userData.loteId = id;
    meshPlaca.add(posteM);

    const tabuaM = new THREE.Mesh(geoTabuaVenda, mat(0xf0d060));
    tabuaM.position.set(0, 1.65, 0);
    tabuaM.castShadow = true;
    tabuaM.userData.loteId = id;
    meshPlaca.add(tabuaM);

    [1, -1].forEach(lado => {
      const face = new THREE.Mesh(geoFaceVenda, matPlacaAVenda);
      face.position.set(0, 1.65, lado * 0.08);
      if (lado < 0) face.rotation.y = Math.PI;
      face.userData.loteId = id;
      meshPlaca.add(face);
    });

    scene.add(meshPlaca);
    placasVendaMeshes.push(meshPlaca);

    const lotObj = {
      id,
      label: "Quarteirão " + l.q + " · Lote " + slot,
      q: l.q,
      x: +l.x.toFixed(2),
      z: +l.z.toFixed(2),
      w: 10.4,
      d: 10.4,
      sz: l.sz,
      rot: +rot.toFixed(4),
      ocupada: false,
      meshPlaca,
      grupoCasa: null,
      gramado
    };
    lotesLivres.push(lotObj);
    return lotObj;
  }

  function parseCorInt(cor, fallback = 0xf59e0b) {
    if (typeof cor === "number" && Number.isFinite(cor)) return Math.max(0, Math.min(0xffffff, Math.round(cor)));
    if (typeof cor === "string") {
      const s = cor.trim().replace(/^#/, "").replace(/^0x/i, "");
      if (/^[0-9a-fA-F]{6}$/.test(s)) return parseInt(s, 16);
      if (/^[0-9a-fA-F]{3}$/.test(s)) {
        return parseInt(s[0] + s[0] + s[1] + s[1] + s[2] + s[2], 16);
      }
    }
    return fallback;
  }

  function limparGrupoDescartavel(grupo) {
    if (!grupo) return;
    grupo.traverse(obj => {
      if (obj.geometry && obj.geometry.userData && obj.geometry.userData._descartavel) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        const ms = Array.isArray(obj.material) ? obj.material : [obj.material];
        ms.forEach(m => {
          if (m && m.userData && m.userData._descartavel) {
            if (m.map) m.map.dispose();
            m.dispose();
          }
        });
      }
    });
  }

  function removerCasaComprada(lotIdRaw) {
    const lotId = String(lotIdRaw || "").trim();
    if (!lotId) return false;
    const lot = lotesLivres.find(item => item.id === lotId);
    if (lot) {
      if (lot.grupoCasa) {
        scene.remove(lot.grupoCasa);
        limparGrupoDescartavel(lot.grupoCasa);
        const idxM = casasCompradasMeshes.indexOf(lot.grupoCasa);
        if (idxM >= 0) casasCompradasMeshes.splice(idxM, 1);
        lot.grupoCasa = null;
      }
      lot._casaSig = "";
      lot.ocupada = false;
      if (lot.meshPlaca) lot.meshPlaca.visible = true;
      if (lot.gramado) lot.gramado.visible = true;
    }
    for (let i = obstaculos.length - 1; i >= 0; i--) {
      if (obstaculos[i]._lotId === lotId) { obstaculos.splice(i, 1); marcaObsSujo(); }
    }
    const idxP = pontosPortas.findIndex(p => p.id === "porta_casa_" + lotId);
    if (idxP >= 0) pontosPortas.splice(idxP, 1);
    return true;
  }

  function construirCasaComprada(info) {
    if (!info || typeof info !== "object") return null;
    const lotId = String(info.lot_id || info.lotId || "").trim();
    if (!lotId) return null;

    let lot = lotesLivres.find(item => item.id === lotId);
    if (!lot) {
      const lx = Number(info.x), lz = Number(info.z);
      if (!Number.isFinite(lx) || !Number.isFinite(lz)) return null;
      const rotIn = Number.isFinite(Number(info.rot)) ? Number(info.rot) : 0;
      const szIn = Math.cos(rotIn) >= 0 ? 1 : -1;
      lot = {
        id: lotId,
        label: "Terreno " + lotId,
        q: "VIP",
        x: +lx.toFixed(2),
        z: +lz.toFixed(2),
        w: 10.4,
        d: 10.4,
        sz: szIn,
        rot: +(szIn > 0 ? 0 : Math.PI).toFixed(4),
        ocupada: false,
        meshPlaca: null,
        grupoCasa: null
      };
      lotesLivres.push(lot);
    }

    const estilo = ["casa_simples", "casa_solar", "sobrado", "mansao"].includes(info.style) ? info.style : "casa_simples";
    const corParede = parseCorInt(info.color, 0xf59e0b);
    const donoNome = String(info.owner_name || "Morador VIP").trim().slice(0, 32) || "Morador VIP";
    const donoHandle = String(info.owner_handle || "").trim().replace(/^@+/, "").slice(0, 30);
    const tituloCasa = String(info.title || ("Casa de " + donoNome)).trim().slice(0, 38) || ("Casa de " + donoNome);
    const roomPorta = String(info.door_room || ("casa_" + lotId)).trim();

    const sig = [estilo, corParede, tituloCasa, donoNome, donoHandle, roomPorta].join("|");
    if (lot.grupoCasa && lot._casaSig === sig) {
      lot.ocupada = true;
      if (lot.meshPlaca) lot.meshPlaca.visible = false;
      return lot.grupoCasa;
    }

    if (lot.grupoCasa) {
      scene.remove(lot.grupoCasa);
      limparGrupoDescartavel(lot.grupoCasa);
      const idxOld = casasCompradasMeshes.indexOf(lot.grupoCasa);
      if (idxOld >= 0) casasCompradasMeshes.splice(idxOld, 1);
      lot.grupoCasa = null;
    }
    for (let i = obstaculos.length - 1; i >= 0; i--) {
      if (obstaculos[i]._lotId === lotId) { obstaculos.splice(i, 1); marcaObsSujo(); }
    }

    if (lot.meshPlaca) lot.meshPlaca.visible = false;
    if (lot.gramado) lot.gramado.visible = false;
    lot.ocupada = true;

    const s = lot.sz ? lot.sz : (Math.cos(Number(info.rot) || 0) >= 0 ? 1 : -1);
    const ry = s > 0 ? 0 : Math.PI;
    const grupoCasa = new THREE.Group();
    grupoCasa.position.set(lot.x, 0, lot.z);
    grupoCasa.rotation.y = ry;
    grupoCasa.userData.lotId = lotId;

    const addBox = (w, h, d, cor, x, yBase, z, sombra = true) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      geo.userData._descartavel = true;
      const m = new THREE.Mesh(geo, mat(cor));
      m.position.set(x, yBase + h / 2, z);
      m.castShadow = sombra;
      m.receiveShadow = true;
      grupoCasa.add(m);
      return m;
    };

    const y0 = 0.3;
    let wCol = 8.0, dCol = 7.2, czCol = -0.3, doorDx = 0, zFront = 3.3, hPlaca = 6.8;

    // Base do lote
    addBox(10.2, 0.08, 10.0, 0xd8d2c5, 0, y0 - 0.04, 0, false);

    if (estilo === "casa_simples") {
      wCol = 7.8; dCol = 6.6; czCol = -0.4; doorDx = 0; zFront = czCol + dCol / 2; hPlaca = 6.8;
      addBox(wCol, 3.6, dCol, corParede, 0, y0, czCol);
      addBox(wCol + 0.3, 0.35, dCol + 0.3, C.branco, 0, y0, czCol, false);
      const geoTel = new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0);
      geoTel.userData._descartavel = true;
      const tel = new THREE.Mesh(geoTel, mat(0xc4553b));
      tel.position.set(0, y0 + 3.6, czCol);
      tel.scale.set((wCol / 2 + 0.55) / Math.SQRT1_2, 2.2, (dCol / 2 + 0.55) / Math.SQRT1_2);
      tel.castShadow = true;
      grupoCasa.add(tel);
      // Varanda acolhedora, porta e janelas
      addBox(3.4, 0.18, 1.3, 0xc4553b, 0, y0 + 2.65, zFront + 0.65);
      [-1.45, 1.45].forEach(dx => addBox(0.16, 2.65, 0.16, C.branco, dx, y0, zFront + 1.15, false));
      addBox(1.3, 2.25, 0.14, C.porta, 0, y0, zFront + 0.04, false);
      [-2.35, 2.35].forEach(dx => {
        addBox(1.35, 1.15, 0.12, C.branco, dx, y0 + 1.25, zFront + 0.03, false);
        addBox(1.1, 0.92, 0.15, 0xffe8a3, dx, y0 + 1.36, zFront + 0.05, false);
      });
      [-3.2, 3.2].forEach(dx => addBox(1.2, 0.45, 0.7, 0x2f9e44, dx, y0 + 0.04, zFront + 0.5, false));
    } else if (estilo === "casa_solar") {
      wCol = 8.2; dCol = 6.8; czCol = -0.35; doorDx = 0; zFront = czCol + dCol / 2; hPlaca = 7.2;
      addBox(wCol, 3.8, dCol, corParede, 0, y0, czCol);
      addBox(wCol + 0.25, 0.32, dCol + 0.25, 0xdee2e6, 0, y0 + 3.6, czCol, false);
      const hz = dCol / 2 + 0.55, alt = 2.25, sy = alt / 1.5;
      const tel = new THREE.Mesh(geoDuasAguas, mat(0x495057));
      tel.position.set(0, y0 + 3.8 + 0.5 * sy, czCol);
      tel.scale.set(wCol + 0.8, sy, hz / 0.866);
      tel.castShadow = true;
      grupoCasa.add(tel);
      const ang = Math.atan2(alt, hz), L = Math.hypot(hz, alt);
      const gPainel = new THREE.BoxGeometry(wCol - 0.8, 0.1, L * 0.82);
      gPainel.userData._descartavel = true;
      const painel = new THREE.Mesh(gPainel, [mat(0xadb5bd), mat(0xadb5bd), matPainel, mat(0x343a40), mat(0xadb5bd), mat(0xadb5bd)]);
      painel.position.set(0, y0 + 3.8 + alt / 2 + Math.cos(ang) * 0.12, czCol + hz / 2 + Math.sin(ang) * 0.12);
      painel.rotation.x = ang;
      painel.castShadow = true;
      grupoCasa.add(painel);
      addBox(1.35, 2.35, 0.14, 0x2b3a44, 0, y0, zFront + 0.05, false);
      [-2.4, 2.4].forEach(dx => {
        addBox(1.6, 1.3, 0.12, 0x2b3a44, dx, y0 + 1.2, zFront + 0.04, false);
        addBox(1.36, 1.08, 0.15, 0xa5d8ff, dx, y0 + 1.31, zFront + 0.06, false);
      });
    } else if (estilo === "sobrado") {
      wCol = 8.2; dCol = 7.2; czCol = -0.5; doorDx = 1.85; zFront = czCol + dCol / 2; hPlaca = 9.8;
      addBox(wCol, 6.8, dCol, corParede, 0, y0, czCol);
      addBox(wCol + 0.45, 0.38, dCol + 0.45, C.branco, 0, y0 + 6.8, czCol);
      addBox(wCol + 0.35, 0.28, 1.45, C.branco, 0, y0 + 3.35, zFront + 0.65);
      // Guarda-corpo da sacada
      addBox(wCol + 0.2, 0.85, 0.1, 0x2b3a44, 0, y0 + 3.63, zFront + 1.3, false);
      // Portão de garagem + porta social
      addBox(3.5, 2.55, 0.12, 0x343a40, -1.65, y0, zFront + 0.05, false);
      addBox(1.35, 2.45, 0.14, C.porta, doorDx, y0, zFront + 0.05, false);
      // Janelões do 2º andar iluminados
      [-2.0, 2.0].forEach(dx => {
        addBox(2.3, 2.1, 0.12, 0x2b3a44, dx, y0 + 3.9, zFront + 0.04, false);
        addBox(2.0, 1.85, 0.15, 0xffe8a3, dx, y0 + 4.02, zFront + 0.06, false);
      });
    } else {
      // mansao moderna compacta de alto padrão
      wCol = 9.2; dCol = 7.4; czCol = -0.8; doorDx = 1.9; zFront = czCol + dCol / 2; hPlaca = 10.6;
      addBox(wCol, 3.8, dCol, 0xf8f9fa, 0, y0, czCol);
      addBox(wCol * 0.68, 3.5, dCol + 0.6, corParede, -1.1, y0 + 3.8, czCol + 0.2);
      addBox(wCol * 0.72, 0.35, dCol + 0.9, 0xf8f9fa, -1.1, y0 + 7.3, czCol + 0.2);
      // Brises de madeira e vidro panorâmico
      addBox(4.6, 2.4, 0.14, 0x2b3a44, -1.1, y0 + 4.35, zFront + 0.52, false);
      addBox(4.2, 2.1, 0.16, 0xffe8a3, -1.1, y0 + 4.5, zFront + 0.54, false);
      for (let k = 0; k < 6; k++) addBox(0.14, 2.4, 0.22, 0xb5835a, -3.2 + k * 0.42, y0 + 4.35, zFront + 0.62, false);
      // Piscina iluminada frontal à esquerda + porta pivotante à direita
      addBox(4.2, 0.22, 1.7, 0xf8f9fa, -2.0, y0, zFront + 1.05, false);
      addBox(3.7, 0.26, 1.25, 0x3bc9db, -2.0, y0 + 0.02, zFront + 1.05, false);
      addBox(1.5, 2.75, 0.16, 0x5c3d2e, doorDx, y0, zFront + 0.06, false);
      addBox(2.4, 0.2, 1.2, 0xf0d060, doorDx, y0 + 2.85, zFront + 0.55, false);
    }

    // Placa personalizada com título/dono na fachada
    const cvP = document.createElement("canvas");
    cvP.width = 320; cvP.height = 96;
    const gp = cvP.getContext("2d");
    gp.fillStyle = "#141a30"; gp.fillRect(0, 0, 320, 96);
    gp.strokeStyle = "#f0d060"; gp.lineWidth = 6; gp.strokeRect(4, 4, 312, 88);
    gp.textAlign = "center"; gp.textBaseline = "middle";
    gp.fillStyle = "#f0d060"; gp.font = '800 24px "Nunito Sans", "Segoe UI", sans-serif';
    gp.fillText(tituloCasa.slice(0, 22), 160, 34);
    gp.fillStyle = "#fffaf0"; gp.font = '700 19px "Nunito Sans", "Segoe UI", sans-serif';
    gp.fillText(donoHandle ? ("@" + donoHandle) : donoNome.slice(0, 24), 160, 68);
    const matPl = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cvP) });
    matPl.userData._descartavel = true;
    const geoPl = new THREE.PlaneGeometry(2.7, 0.82);
    geoPl.userData._descartavel = true;
    const meshNome = new THREE.Mesh(geoPl, matPl);
    meshNome.position.set(doorDx, y0 + 3.05, zFront + 0.2);
    grupoCasa.add(meshNome);

    // Indicador luminoso sutil na porta
    const indPorta = criarIndicadorPorta(0xf0d060);
    indPorta.position.set(doorDx, y0 + 0.02, zFront + 0.52);
    grupoCasa.add(indPorta);

    scene.add(grupoCasa);
    casasCompradasMeshes.push(grupoCasa);
    lot.grupoCasa = grupoCasa;
    lot._casaSig = sig;

    // Colisão sólida no mundo
    const wxCentro = lot.x;
    const wzCentro = lot.z + s * czCol;
    obstaculos.push({
      x0: wxCentro - wCol / 2,
      x1: wxCentro + wCol / 2,
      z0: wzCentro - dCol / 2,
      z1: wzCentro + dCol / 2,
      ativo: true,
      _lotId: lotId
    });
    marcaObsSujo();

    // Porta registrada em pontosPortas bem na frente da entrada (fora do bloco de colisão)
    const portaX = +(lot.x + (s > 0 ? doorDx : -doorDx)).toFixed(2);
    const portaZ = +(lot.z + s * (zFront + 1.55)).toFixed(2);
    registrarOuAtualizarPorta({
      id: "porta_casa_" + lotId,
      room: roomPorta,
      label: tituloCasa,
      x: portaX,
      z: portaZ,
      yaw: ry,
      interiorTipo: "casa",
      lotId
    });

    // Placa flutuante integrada ao pool de moradores da cidade
    const entObj = {
      h: donoHandle || lotId,
      t: tituloCasa,
      k: "casa",
      x: lot.x,
      y: y0 + hPlaca,
      z: lot.z,
      sz: s,
      cor: "#" + corParede.toString(16).padStart(6, "0"),
      q: typeof lot.q === "number" ? lot.q : "VIP",
      alvo: { x: portaX, z: +(lot.z + s * 9.2).toFixed(2), yaw: ry }
    };
    if (lot._entIdx != null && ents[lot._entIdx]) {
      Object.assign(ents[lot._entIdx], entObj);
    } else {
      lot._entIdx = ents.push(entObj) - 1;
    }
    if (typeof atualizarBuscaCasa === "function") atualizarBuscaCasa(lot._entIdx);

    return grupoCasa;
  }

  lotes.forEach((l, i) => {
    const d = i === iFazendeiro ? null : casaDoLote[i];
    if (!d && reservados.has(i)) return;
    if (!d) {
      registrarLoteLivre(l, i);
      return;
    }
    const w = 7 + rand() * 1.6, dd = 6 + rand() * 1.4, h = 3 + rand() * 2.6;
    const cor = escolhe(CORES_CASA), tel = escolhe(CORES_TELHADO);
    const y0 = 0.3;
    const solar = d.h === "lucasdasilvaa08" || EH_SOLAR.test(semAcento(d.t));
    const velha = d.h === "dimunizzzz";
    const medico = !velha && !solar && EH_MEDICO.test(semAcento(d.t));
    const especial = velha || medico;
    const hc = especial ? null : corpos.poe(l.x, y0, l.z, w, h, dd, 0, solar ? 0xf8f9fa : cor);
    const ht = solar || especial ? null : telhados.poe(l.x, y0 + h, l.z, (w / 2 + 0.4) / Math.SQRT1_2, 2, (dd / 2 + 0.4) / Math.SQRT1_2, 0, tel);
    if (solar) telhadoSolar(l, w, dd, h, y0);
    if (velha) casaVelha(l, y0);
    if (medico) casaMedico(l, y0);
    if (d.h === "neto_9.9") caminhaoNaFrente(l);
    if (EH_MOTOBOY.test(semAcento(d.t))) motoNaFrente(l, w, dd);
    const frente = l.z + l.sz * (dd / 2 + 0.05);
    if (!especial) {
      poe(portas, l.x, y0, frente, 1.2, 2.1, 0.15);
      poe(janelas, l.x - w * 0.3, y0 + h * 0.42, frente, 1.15, 1, 0.15);
      poe(janelas, l.x + w * 0.3, y0 + h * 0.42, frente, 1.15, 1, 0.15);
      bloqueia(l.x, l.z, w, dd);
    }
    const barbeiro = EH_BARBEIRO.test(semAcento(d.t));
    if (barbeiro) {
      const px = l.x + w / 2 - 0.55, pz = frente + l.sz * 0.5;
      posteBarbeiro(px, y0 + 2.2, pz);
      caixa(0.12, 0.12, 0.5, 0xdee2e6, px, y0 + 2.6, frente + l.sz * 0.22, false);
      const placa = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), matPlacaB);
      placa.position.set(l.x, y0 + 2.55, frente + l.sz * 0.03);
      placa.rotation.y = l.sz > 0 ? 0 : Math.PI;
      scene.add(placa);
    }
    if (i === iConsultorioPrincipal) {
      const s = l.sz, ry = s > 0 ? 0 : Math.PI;
      const doorX = l.x + 1.9 * (s > 0 ? 1 : -1);
      const zParedeMed = l.z + s * 2.96;
      // Cruz vermelha médica na fachada
      caixa(1.1, 0.34, 0.14, 0xe03131, doorX, y0 + 2.95, zParedeMed + s * 0.08, false);
      caixa(0.34, 1.1, 0.14, 0xe03131, doorX, y0 + 2.57, zParedeMed + s * 0.08, false);
      const ind = criarIndicadorPorta(0x22b8cf);
      ind.position.set(doorX, y0 + 0.02, zParedeMed + s * 0.55);
      ind.rotation.y = ry;
      scene.add(ind);
      registrarOuAtualizarPorta({
        id: "porta_consultorio",
        room: "consultorio",
        label: "Consultório Médico",
        x: +doorX.toFixed(2),
        z: +(zParedeMed + s * 1.65).toFixed(2),
        yaw: ry,
        interiorTipo: "consultorio"
      });
      infoConsultorioPortal = { x: l.x, y: 15.2, z: l.z };
    }
    if (i === iBarbeariaPrincipal) {
      const s = l.sz, ry = s > 0 ? 0 : Math.PI;
      const ind = criarIndicadorPorta(0x4dabf7);
      ind.position.set(l.x, y0 + 0.02, frente + s * 0.55);
      ind.rotation.y = ry;
      scene.add(ind);
      registrarOuAtualizarPorta({
        id: "porta_barbearia",
        room: "barbearia",
        label: "Barbearia",
        x: +l.x.toFixed(2),
        z: +(frente + s * 1.6).toFixed(2),
        yaw: ry,
        interiorTipo: "barbearia"
      });
      infoBarbeariaPortal = { x: l.x, y: 9.8, z: l.z };
    }
    const e = ents.push({ ...d, barbeiro, x: l.x, y: medico ? y0 + 13.6 : y0 + h + 3.9, z: l.z, sz: l.sz, cor: hex(cor), q: l.q, alvo: { x: l.x, z: l.z + l.sz * 9.6, yaw: l.sz > 0 ? 0 : Math.PI } }) - 1;
    if (hc) hc.m.userData.ent[hc.i] = e;
    if (ht) ht.m.userData.ent[ht.i] = e;
  });

  let campoInfo = null;
  if (campoLotes.length === 2) (function () {
    const [a, b] = campoLotes.map(i => lotes[i]);
    const x = (a.x + b.x) / 2, z = a.z, L = 19, W = 9.4, BR = 0xf8f9fa;
    for (let k = 0; k < 6; k++) caixa(L / 6, 0.36, W, k % 2 ? 0x51cf66 : 0x40c057, x - L / 2 + L / 12 + k * L / 6, 0, z, false);
    const linha = (w, d, lx, lz) => caixa(w, 0.03, d, BR, lx, 0.36, lz, false);
    linha(L, 0.12, x, z - W / 2 + 0.2);
    linha(L, 0.12, x, z + W / 2 - 0.2);
    linha(0.12, W - 0.4, x - L / 2 + 0.2, z);
    linha(0.12, W - 0.4, x + L / 2 - 0.2, z);
    linha(0.12, W - 0.4, x, z);
    const circ = malha(new THREE.TorusGeometry(1.6, 0.06, 4, 28), BR, x, 0.4, z, false);
    circ.rotation.x = Math.PI / 2;
    [-1, 1].forEach(s => {
      linha(2.2, 0.1, x + s * (L / 2 - 1.3), z - 2.2);
      linha(2.2, 0.1, x + s * (L / 2 - 1.3), z + 2.2);
      linha(0.1, 4.5, x + s * (L / 2 - 2.4), z);
      const gx = x + s * (L / 2 - 0.15);
      caixa(0.14, 1.7, 0.14, BR, gx, 0.36, z - 1.6);
      caixa(0.14, 1.7, 0.14, BR, gx, 0.36, z + 1.6);
      caixa(0.14, 0.14, 3.34, BR, gx, 2.0, z);
      const rede = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 3.2), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.6 }));
      rede.position.set(gx + s * 0.45, 1.21, z);
      scene.add(rede);
      bloqueia(gx, z - 1.6, 0.3, 0.3);
      bloqueia(gx, z + 1.6, 0.3, 0.3);
    });
    const bolaMesh = malha(new THREE.IcosahedronGeometry(0.38, 1), BR, x, 0.74, z);
    // Torcedores na lateral fora do gramado (área interna 100% livre de bloqueio estático para jogar!)
    const zTorcida = z - (a.sz > 0 ? 1 : -1) * (W / 2 + 0.85);
    const ryTorcida = a.sz > 0 ? 0 : Math.PI;
    [[-6.5, 0xfcc419], [-3.8, 0xfcc419], [3.8, 0x1971c2], [6.5, 0x1971c2]].forEach(([dx, cor]) => {
      bonecoInst(x + dx, 0.3, zTorcida, ryTorcida, estiloBoneco("bola" + dx, false, { camisa: cor, calca: BR }));
    });
    campoInfo = { cx: x, cz: z, L, W, rot: 0, bolaMesh };
  })();

  // Adega com mesas, cadeiras, bebidas e carvão à venda
  // (montada depois das luzinhas de Natal existirem; ver chamada logo após a Praça Central)
  const construirAdega = () => {
    if (adegaLotes.length !== 2) return;
    const [a, b] = adegaLotes.map(i => lotes[i]);
    const cx = (a.x + b.x) / 2, cz = a.z, f = a.sz;
    const P = (dx, dz) => [cx + dx, cz + f * dz];
    const ry = f > 0 ? 0 : Math.PI;
    const placaCanvas = (w, h, desenha) => {
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      desenha(cv.getContext("2d"));
      return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true });
    };
    const plano = (m, w, h, dx, y, dz) => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      const [x, z] = P(dx, dz);
      p.position.set(x, y, z);
      p.rotation.y = ry;
      scene.add(p);
    };
    const bx = (w, h, d, cor, dx, y, dz, sombra = true) => { const [x, z] = P(dx, dz); return caixa(w, h, d, cor, x, y, z, sombra); };
    const ci = (rt, rb, h, cor, dx, y, dz, seg = 8) => { const [x, z] = P(dx, dz); return malha(new THREE.CylinderGeometry(rt, rb, h, seg), cor, x, y, z); };

    bx(22, 0.34, 11, 0xbfb8aa, 0, 0, 0, false);
    // Loja com porta de enrolar aberta
    bx(10, 4.2, 6, 0x343a40, -5, 0.34, -2);
    { const [x, z] = P(-5, -2); bloqueia(x, z, 10, 6); }
    bx(7, 3, 0.1, 0x111111, -5, 0.35, 1.06, false);
    const rolo = ci(0.3, 0.3, 7.4, 0x868e96, -5, 3.6, 1.25, 10);
    rolo.rotation.z = Math.PI / 2;
    [1.0, 1.8, 2.6].forEach(y => {
      bx(6.6, 0.08, 0.45, 0x8a5a3b, -5, y, 1.25, false);
      for (let k = 0; k < 14; k++) ci(0.09, 0.09, 0.45, escolhe([0x2b8a3e, 0xb5651d, 0xc92a2a, 0xdee2e6, 0x5c3d2e, 0xf59f00]), -8.1 + k * 0.47, y + 0.3, 1.3, 6);
    });
    // Letreiro, toldo listrado, balcão e freezer
    bx(6.6, 1.5, 0.2, 0x111111, -5, 4.55, 0.9, false);
    plano(placaCanvas(512, 116, g => {
      g.textAlign = "center"; g.textBaseline = "middle";
      g.shadowColor = "#ffd43b"; g.shadowBlur = 18;
      g.fillStyle = "#ffe066"; g.font = '800 64px "Nunito Sans", "Segoe UI", sans-serif';
      g.fillText("ADEGA", 256, 46);
      g.shadowBlur = 0; g.fillStyle = "#fffaf0"; g.font = '700 26px "Nunito Sans", "Segoe UI", sans-serif';
      g.fillText("bebidas geladas · carvão", 256, 96);
    }), 6.2, 1.4, -5, 5.3, 1.02);
    for (let k = 0; k < 7; k++) {
      const t = bx(10.4 / 7, 0.14, 2.2, k % 2 ? 0xf8f9fa : 0xe03131, -5 - 5.2 + 10.4 / 14 + k * 10.4 / 7, 3.9, 2.0, false);
      t.rotation.x = f * 0.28;
    }
    bx(5, 1.1, 0.9, 0x8a5a3b, -6, 0.34, 2.4);
    bx(5.1, 0.12, 1.0, 0xdee2e6, -6, 1.44, 2.4, false);
    { const [x, z] = P(-6, 2.4); bloqueia(x, z, 5, 0.9); }
    bx(1.7, 1.05, 0.95, 0xf8f9fa, -1.9, 0.34, 2.4);
    bx(1.72, 0.18, 0.97, 0x1c7ed6, -1.9, 1.39, 2.4, false);
    { const [x, z] = P(-1.9, 2.4); bloqueia(x, z, 1.7, 1); }
    // Sacos de carvão à venda
    for (let k = 0; k < 8; k++) {
      const col = k % 3, lin = Math.floor(k / 3);
      bx(0.9, 0.42, 0.6, 0x212529, -9.7 + col * 0.95, 0.34 + lin * 0.43, 3.3, false);
      bx(0.92, 0.1, 0.62, 0xf8f9fa, -9.7 + col * 0.95, 0.5 + lin * 0.43, 3.3, false);
    }
    { const [x, z] = P(-8.75, 3.3); bloqueia(x, z, 2.9, 0.7); }
    bx(0.1, 1.6, 0.1, 0x8a5a3b, -7.3, 0.34, 3.8, false);
    plano(placaCanvas(256, 96, g => {
      g.fillStyle = "#fffaf0"; g.fillRect(0, 0, 256, 96);
      g.strokeStyle = "#212529"; g.lineWidth = 8; g.strokeRect(4, 4, 248, 88);
      g.fillStyle = "#212529"; g.textAlign = "center"; g.textBaseline = "middle";
      g.font = '800 40px "Nunito Sans", "Segoe UI", sans-serif'; g.fillText("CARVÃO", 128, 36);
      g.fillStyle = "#c92a2a"; g.font = '800 26px "Nunito Sans", "Segoe UI", sans-serif'; g.fillText("R$ 25 o saco", 128, 72);
    }), 1.4, 0.55, -7.3, 2.1, 3.86);
    // Engradados de bebida
    for (let k = 0; k < 6; k++) bx(0.85, 0.42, 0.6, k % 2 ? 0xf59f00 : 0xc92a2a, 0.6 + (k % 2) * 0.9, 0.34 + Math.floor(k / 2) * 0.43, -3.8, false);
    // Mesas, cadeiras e bebidas na calçada
    const mesas = [[3.6, -1.6], [7.8, -1.6], [3.6, 2.6], [7.8, 2.6]];
    mesas.forEach(([mx, mz], i) => {
      const cor = i % 2 ? 0xc92a2a : 0xf8f9fa;
      ci(0.75, 0.75, 0.08, cor, mx, 1.15, mz, 14);
      ci(0.08, 0.12, 0.8, cor, mx, 0.74, mz, 6);
      [[0, 1.05], [0, -1.05], [1.05, 0], [-1.05, 0]].forEach(([ox, oz]) => {
        bx(0.55, 0.08, 0.55, cor, mx + ox, 0.75, mz + oz, false);
        bx(ox ? 0.08 : 0.55, 0.6, oz ? 0.08 : 0.55, cor, mx + ox * 1.25, 0.79, mz + oz * 1.25, false);
        [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].forEach(([lx, lz]) => bx(0.05, 0.42, 0.05, cor, mx + ox + lx, 0.34, mz + oz + lz, false));
      });
      ci(0.08, 0.1, 0.42, 0xb5651d, mx - 0.2, 1.4, mz + 0.1, 6);
      ci(0.08, 0.1, 0.42, 0xb5651d, mx + 0.25, 1.4, mz - 0.15, 6);
      if (i % 2 === 0) ci(0.28, 0.22, 0.32, 0x868e96, mx + 0.1, 1.35, mz + 0.35, 10);
      const [x, z] = P(mx, mz);
      bloqueia(x, z, 2.6, 2.6);
    });
    // Clientes sentados
    [[3.6, -0.55, 0x1971c2, false], [7.8, 1.55, 0x2f9e44, true], [8.85, -1.6, 0xf59f00, false]].forEach(([dx, dz, cor, fem], k) => {
      const [x, z] = P(dx, dz);
      bonecoInst(x, 0.34, z, k * 2.1, estiloBoneco("cliente" + k, fem, { camisa: cor }));
    });
    voxel.marca();
    // Varal de luzinhas por cima das mesas
    [[1.8, -3.6], [10.4, -3.6], [10.4, 4.2], [1.8, 4.2]].forEach(([dx, dz]) => { bx(0.16, 3.6, 0.16, C.tinta, dx, 0.34, dz, false); const [x, z] = P(dx, dz); bloqueia(x, z, 0.3, 0.3); });
    [[[1.8, -3.6], [10.4, 4.2]], [[10.4, -3.6], [1.8, 4.2]], [[1.8, -3.6], [10.4, -3.6]], [[1.8, 4.2], [10.4, 4.2]]].forEach(([[ax, az], [bx2, bz]]) => {
      const n = Math.round(Math.hypot(bx2 - ax, bz - az) / 1.1);
      for (let k = 1; k < n; k++) {
        const u = k / n;
        const [x, z] = P(ax + (bx2 - ax) * u, az + (bz - az) * u);
        luz(x, 3.85 - Math.sin(Math.PI * u) * 0.7, z);
      }
    });
    luzMalhas.forEach(m => { m.instanceMatrix.needsUpdate = true; });
  };

  // Ruas: faixa branca tracejada no meio, calçada de concreto em volta dos quarteirões e lixeiras
  (function () {
    const hs = [], vs = [XMIN];
    for (let r = 0; r < ROWS; r++) hs.push(ZC(r) - 16);
    for (let c = 0; c < COLS; c++) vs.push(XC(c) + 27);
    const tracos = inst(UNIT, 2600, C.faixa);
    tracos.castShadow = false;
    hs.forEach(z => {
      for (let x = XMIN + 4; x <= XMAX - 4; x += 7) {
        if (vs.some(v => Math.abs(v - x) < 6.5)) continue;
        poe(tracos, x, 0.1, z, 3.2, 0.03, 0.35);
      }
    });
    vs.forEach(x => {
      for (let z = ZMIN + 4; z <= 21; z += 7) {
        if (hs.some(h => Math.abs(h - z) < 6.5)) continue;
        poe(tracos, x, 0.1, z, 0.35, 0.03, 3.2);
      }
    });
    const ehMansao = (cx, cz) => mansao && Math.abs(cx - mansao.cx) < 1 && Math.abs(cz - mansao.cz) < 1;
    const passeio = inst(UNIT, 1600, 0xcfc9bd);
    passeio.castShadow = false;
    const lixBody = paleta(new THREE.CylinderGeometry(0.32, 0.27, 1, 10).translate(0, 0.5, 0), 1600);
    const lixTampa = inst(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 10), 1600, 0x343a40);
    blocosMapa.forEach(({ cx, cz, tipo }, k) => {
      if (tipo !== "casas" || ehMansao(cx, cz)) return;
      poe(passeio, cx, 0.3, cz - 10.2, 44, 0.03, 1.6);
      poe(passeio, cx, 0.3, cz + 10.2, 44, 0.03, 1.6);
      poe(passeio, cx - 21.2, 0.3, cz, 1.6, 0.03, 18.8);
      poe(passeio, cx + 21.2, 0.3, cz, 1.6, 0.03, 18.8);
      [[-11, -10.5], [11, -10.5], [-11, 10.5], [11, 10.5]].forEach(([dx, dz], j) => {
        const x = cx + dx, z = cz + dz;
        lixBody.poe(x, 0.33, z, 1, 0.9, 1, 0, (k + j) % 2 ? 0xf08c00 : 0x2f9e44);
        poe(lixTampa, x, 1.29, z, 1, 1, 1);
        bloqueia(x, z, 0.7, 0.7);
      });
    });
  })();

  // Pessoas (vereadores, prefeitura e cadeia — troncos clicáveis no lote pessoaCorpo)
  const nPessoas = Math.max(1, grupos.camara.length + grupos.prefeitura.length + grupos.cadeia.length);
  // Tronco (camiseta/terno/uniforme) fica num lote próprio para dar para clicar na pessoa
  const pessoaCorpo = paleta(UNIT, nPessoas);
  function pessoa(d, x, z, cor, base = 0.3) {
    const o = estiloBoneco(d.h + d.t, ehMulher(d.t), { camisa: cor, calca: d.k === "cadeia" ? cor : 0x1d1d1d, sapato: 0x1d1d1d, semTorso: true });
    bonecoInst(x, base, z, 0, o);
    const hp = pessoaCorpo.poe(x, base + 0.8, z, 0.82, 0.74, 0.44, 0, cor);
    bloqueia(x, z, 1.3, 1.3);
    const yPlaca = base + 4.0 + (ents.length % 3) * 1.15;
    const e = ents.push({ ...d, x, y: yPlaca, z, cor: LUGAR[d.k].cor, alvo: { x, z: z + 7, yaw: 0 } }) - 1;
    hp.m.userData.ent[hp.i] = e;
  }

  // ---------- Elementos ----------
  const troncos = inst(new THREE.CylinderGeometry(0.22, 0.32, 1, 5).translate(0, 0.5, 0), 400, C.tronco);
  const copas = paleta(new THREE.IcosahedronGeometry(1, 0), 400);
  function arvore(x, z, s = 1) {
    const y = altura(x, z);
    poe(troncos, x, y - 0.3, z, s, 2 * s + 0.3, s);
    copas.poe(x, y + 2.6 * s, z, 1.6 * s, 1.6 * s, 1.6 * s, rand() * 3, rand() < 0.5 ? C.mata : C.mataEscura);
    bloqueia(x, z, 0.9 * s, 0.9 * s);
  }
  // Coqueiros: tronco curvo em 3 partes, folhas compridas caindo e cachos de coco
  const N_COQ = 180;
  const coqTronco = inst(new THREE.CylinderGeometry(0.19, 0.25, 1, 6), N_COQ * 3, 0x8a6a4a);
  const geoFolha = (function () {
    const g = new THREE.BoxGeometry(1, 0.06, 1, 6, 1, 1).translate(0.5, 0, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      p.setZ(i, p.getZ(i) * (1 - x * 0.8));
      p.setY(i, p.getY(i) - x * x * 1.1);
    }
    g.computeVertexNormals();
    return g;
  })();
  const coqFolhas = [inst(geoFolha, N_COQ * 8, 0x2f9e44), inst(geoFolha, N_COQ * 8, 0x40c057)];
  const coqCocos = inst(new THREE.SphereGeometry(0.24, 6, 5), N_COQ * 4, 0x6b5a2a);
  const dCoq = new THREE.Object3D();
  dCoq.rotation.order = "YZX";
  function poeR(m, x, y, z, sx, sy, sz, ry, rz) {
    dCoq.position.set(x, y, z);
    dCoq.rotation.set(0, ry, rz);
    dCoq.scale.set(sx, sy, sz);
    dCoq.updateMatrix();
    m.setMatrixAt(m.count++, dCoq.matrix);
  }
  function palmeira(x, z, lean = rand() * Math.PI * 2) {
    const s = 0.9 + rand() * 0.35;
    let px = x, py = 0, pz = z;
    [0.04, 0.14, 0.26].forEach((tilt, i) => {
      const L = 2.1 * s, t = tilt * (0.6 + rand() * 0.8);
      const ax = Math.sin(t) * Math.cos(lean), ay = Math.cos(t), az = -Math.sin(t) * Math.sin(lean);
      poeR(coqTronco, px + ax * L / 2, py + ay * L / 2, pz + az * L / 2, 1 - i * 0.12, L, 1 - i * 0.12, lean, -t);
      px += ax * L; py += ay * L; pz += az * L;
    });
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + rand() * 0.3;
      poeR(coqFolhas[k % 2], px, py + 0.1, pz, (3.1 + rand() * 0.9) * s, 1, 0.95 * s, a, -(0.05 + rand() * 0.25));
    }
    for (let k = 0; k < 4; k++) {
      const b = k * 1.6 + rand();
      poeR(coqCocos, px + Math.cos(b) * 0.32, py - 0.35, pz + Math.sin(b) * 0.32, s, s, s, 0, 0);
    }
    bloqueia(x, z, 0.8, 0.8);
  }
  const praiaLean = () => -Math.PI / 2 + (rand() - 0.5) * 1.6;
  // Guarda-sóis de gomos coloridos: arco-íris, quatro cores ou azul e branco
  const solPostes = inst(UNIT, 200, C.branco);
  const solGomo = paleta(new THREE.ConeGeometry(1, 1, 2, 1, false, 0, Math.PI / 4), 1400);
  const solPonta = inst(new THREE.SphereGeometry(0.12, 6, 4), 200, C.branco);
  solPostes.castShadow = false;
  const ESQUEMAS_SOL = [
    [0xe03131, 0xff922b, 0xfcc419, 0x51cf66, 0x22b8cf, 0x1c7ed6, 0x7048e8, 0xf06595],
    [0xe03131, 0xff922b, 0xfcc419, 0x51cf66, 0x22b8cf, 0x1c7ed6, 0x7048e8, 0xf06595],
    [0xf03e3e, 0xfcc419, 0x37b24d, 0x1c7ed6, 0xf03e3e, 0xfcc419, 0x37b24d, 0x1c7ed6],
    [0x1c7ed6, 0xf8f9fa, 0x1c7ed6, 0xf8f9fa, 0x1c7ed6, 0xf8f9fa, 0x1c7ed6, 0xf8f9fa],
    [0xf06595, 0xfcc419, 0x22b8cf, 0x51cf66, 0xf06595, 0xfcc419, 0x22b8cf, 0x51cf66]
  ];
  function guardaSol(x, z, esquema = escolhe(ESQUEMAS_SOL)) {
    poe(solPostes, x, 0, z, 0.12, 2.75, 0.12);
    const giro = rand() * Math.PI * 2;
    esquema.forEach((cor, k) => solGomo.poe(x, 2.55, z, 2.1, 0.75, 2.1, giro + k * Math.PI / 4, cor));
    poe(solPonta, x, 2.98, z, 1, 1, 1);
  }
  // Peças montadas numa geometria só (para instanciar centenas sem pesar)
  function junta(lista) {
    const pos = [], nor = [];
    lista.forEach(g => { const n = g.index ? g.toNonIndexed() : g; pos.push(...n.attributes.position.array); nor.push(...n.attributes.normal.array); });
    const r = new THREE.BufferGeometry();
    r.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    r.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    return r;
  }
  // Cadeira de praia reclinável (de frente para o mar, +z): pano listrado e armação de alumínio
  const cadPano = paleta(junta([
    new THREE.BoxGeometry(0.72, 0.06, 1.0).translate(0, 0.36, 0.2),
    new THREE.BoxGeometry(0.72, 0.06, 0.9).rotateX(1.0).translate(0, 0.72, -0.5)
  ]), 300);
  const cadArm = inst(junta([
    ...[-0.36, 0.36].flatMap(x => [new THREE.BoxGeometry(0.05, 0.36, 0.05).translate(x, 0.18, -0.25), new THREE.BoxGeometry(0.05, 0.36, 0.05).translate(x, 0.18, 0.66),
      new THREE.BoxGeometry(0.05, 0.05, 0.6).translate(x, 0.55, 0.0)])
  ]), 300, 0xced4da);
  const CORES_CADEIRA = [0xe03131, 0x1c7ed6, 0xfcc419, 0x22b8cf, 0xf06595, 0x51cf66, 0xff922b, 0x7048e8];
  function cadeiraPraia(x, z, ry) {
    cadPano.poe(x, 0.12, z, 1, 1, 1, ry, escolhe(CORES_CADEIRA));
    poe(cadArm, x, 0.12, z, 1, 1, 1, ry);
    bloqueia(x, z, 0.9, 0.9);
  }
  // Mesa de plástico do quiosque com cadeiras e coco gelado com canudinho
  const mesaGeo = junta([
    new THREE.CylinderGeometry(0.75, 0.75, 0.06, 14).translate(0, 0.95, 0),
    new THREE.CylinderGeometry(0.06, 0.06, 0.95, 6).translate(0, 0.475, 0),
    new THREE.CylinderGeometry(0.38, 0.38, 0.05, 10).translate(0, 0.025, 0)
  ]);
  const mesas = paleta(mesaGeo, 60);
  const cadPlastico = paleta(junta([
    new THREE.BoxGeometry(0.56, 0.06, 0.56).translate(0, 0.5, 0),
    new THREE.BoxGeometry(0.56, 0.55, 0.06).translate(0, 0.8, -0.27),
    ...[-0.24, 0.24].flatMap(x => [-0.24, 0.24].map(z => new THREE.BoxGeometry(0.06, 0.5, 0.06).translate(x, 0.25, z)))
  ]), 240);
  const cocos = inst(new THREE.SphereGeometry(0.22, 8, 6), 160, 0x8fbf3a);
  const canudos = inst(UNIT, 160, 0xf8f9fa);
  function mesaCoco(x, z, cor) {
    mesas.poe(x, 0.12, z, 1, 1, 1, 0, cor);
    [[0, 1.15, Math.PI], [0, -1.15, 0], [1.15, 0, -Math.PI / 2], [-1.15, 0, Math.PI / 2]].forEach(([dx, dz, ry], k) => {
      if (k < 2 || rand() < 0.7) cadPlastico.poe(x + dx, 0.12, z + dz, 1, 1, 1, ry, cor);
    });
    const n = 1 + Math.floor(rand() * 3);
    for (let k = 0; k < n; k++) {
      const a = k * 2.1 + rand(), cx = x + Math.cos(a) * 0.38, cz = z + Math.sin(a) * 0.38;
      poe(cocos, cx, 1.3, cz, 1, 1.15, 1);
      poe(canudos, cx + 0.06, 1.42, cz, 0.035, 0.36, 0.035);
    }
    guardaSol(x, z);
    bloqueia(x, z, 1.6, 1.6);
  }
  function quiosque(x, z, cor) {
    caixa(4.4, 2.6, 4.4, C.branco, x, 0.12, z);
    const t = malha(new THREE.ConeGeometry(4.2, 1.8, 4), cor, x, 0.12 + 2.6 + 0.9, z);
    t.rotation.y = Math.PI / 4;
    caixa(4.6, 0.2, 1.2, C.tronco, x, 0.12 + 1.1, z - 2.6, false);
    bloqueia(x, z, 4.6, 4.6);
  }

  // Rótulos fixos dos lugares
  const fixos = [];
  function rotuloFixo(texto, fundo, cor, escala, x, y, z) {
    const cv = document.createElement("canvas");
    const ctx = cv.getContext("2d");
    const fonte = '800 44px "Nunito Sans", "Segoe UI", sans-serif';
    ctx.font = fonte;
    cv.width = Math.ceil(ctx.measureText(texto).width) + 56;
    cv.height = 92;
    ctx.fillStyle = "#1d2a33";
    ctx.fillRect(8, 8, cv.width - 12, 66);
    ctx.fillStyle = fundo;
    ctx.fillRect(4, 4, cv.width - 12, 66);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1d2a33";
    ctx.strokeRect(6.5, 6.5, cv.width - 17, 61);
    ctx.font = fonte;
    ctx.fillStyle = cor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, (cv.width - 8) / 2, 39);
    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    const k = 0.05 * escala;
    sp.scale.set(cv.width * k, cv.height * k, 1);
    sp.position.set(x, y, z);
    scene.add(sp);
    fixos.push(sp);
    return sp;
  }
  if (infoConsultorioPortal) {
    rotuloFixo("Consultório Médico", "#e03131", "#fffaf0", 0.9, infoConsultorioPortal.x, infoConsultorioPortal.y, infoConsultorioPortal.z);
  }
  if (infoBarbeariaPortal) {
    rotuloFixo("Barbearia Central", "#1c4fb8", "#fffaf0", 0.9, infoBarbeariaPortal.x, infoBarbeariaPortal.y, infoBarbeariaPortal.z);
  }

  // Luzinhas de Natal (piscam em dois grupos)
  const LUZ_CORES = [0xff4d4d, 0x51cf66, 0xffd43b, 0x4dabf7];
  const geoLuz = new THREE.SphereGeometry(0.22, 6, 4);
  const luzMalhas = LUZ_CORES.map(c => {
    const m = new THREE.InstancedMesh(geoLuz, new THREE.MeshBasicMaterial({ color: c }), 400);
    m.count = 0;
    m.frustumCulled = false;
    m.userData.forte = new THREE.Color(c);
    m.userData.fraca = new THREE.Color(c).multiplyScalar(0.3);
    scene.add(m);
    return m;
  });
  let nLuz = 0, estrelaNatal = null;
  function luz(x, y, z) { poe(luzMalhas[nLuz++ % LUZ_CORES.length], x, y, z, 1, 1, 1); }

  // Praça Central decorada para o Natal
  (function () {
    const { cx, cz } = especiais.praca;
    caixa(42, 0.35, 20, C.grama, cx, 0, cz, false);
    caixa(3, 0.36, 20, C.calcada, cx, 0, cz, false);
    caixa(42, 0.36, 3, C.calcada, cx, 0, cz, false);

    // Coreto, agora ao lado da árvore
    const kx = cx + 13;
    malha(new THREE.CylinderGeometry(3.4, 3.6, 0.7, 8), C.branco, kx, 0.7, cz);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      malha(new THREE.CylinderGeometry(0.14, 0.14, 2.6, 5), C.branco, kx + Math.cos(a) * 2.9, 2.35, cz + Math.sin(a) * 2.9);
      luz(kx + Math.cos(a) * 3.9, 3.75, cz + Math.sin(a) * 3.9);
    }
    malha(new THREE.ConeGeometry(4.3, 2.2, 8), 0xe03131, kx, 4.75, cz);
    bloqueia(kx, cz, 7, 7);
    [[-18.5, -6.5], [18.5, -6.5], [-18.5, 6.5], [18.5, 6.5]].forEach(([dx, dz]) => arvore(cx + dx, cz + dz, 1.1));

    // Árvore de Natal
    const PINHO = 0x1f7a3a;
    malha(new THREE.CylinderGeometry(0.7, 0.9, 3, 6), C.tronco, cx, 1.85, cz);
    const niveis = [[6.5, 7, 2.6], [5.2, 6, 7], [3.9, 5, 10.8], [2.6, 4, 14]];
    niveis.forEach(([r, h, y]) => {
      const c = malha(new THREE.ConeGeometry(r, h, 9), PINHO, cx, y + h / 2, cz);
      c.rotation.y = rand() * 3;
    });
    bloqueia(cx, cz, 10, 10);
    estrelaNatal = malha(new THREE.OctahedronGeometry(1.3, 0), 0xffd43b, cx, 19.4, cz);
    estrelaNatal.material = new THREE.MeshBasicMaterial({ color: 0xffd43b });
    const bolas = paleta(new THREE.SphereGeometry(0.42, 8, 6), 80);
    const CORES_BOLA = [0xe03131, 0xfab005, 0x1c7ed6, 0xdee2e6, 0x9c36b5];
    niveis.forEach(([r, h, y], n) => {
      for (let i = 0; i < [18, 14, 10, 7][n]; i++) {
        const f = 0.12 + rand() * 0.62, a = rand() * Math.PI * 2, rr = r * (1 - f) + 0.25;
        bolas.poe(cx + Math.cos(a) * rr, y + f * h, cz + Math.sin(a) * rr, 1, 1, 1, 0, escolhe(CORES_BOLA));
      }
    });
    for (let k = 0; k <= 130; k++) {
      const f = k / 130, y = 2.9 + f * 15, rr = 6.7 * (1 - (y - 2.6) / 16.8) + 0.35, a = f * Math.PI * 2 * 6;
      luz(cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr);
    }

    // Presentes
    const PRESENTES = [[0xe03131, 0xfab005], [0x1c7ed6, 0xf8f9fa], [0x2f9e44, 0xe03131], [0x9c36b5, 0xfab005], [0xfab005, 0xe03131]];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3, rr = 7.2 + rand() * 0.9, s = 0.9 + rand() * 0.8;
      const [c1, c2] = escolhe(PRESENTES);
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      if (Math.abs(z - cz) > 8.6) continue;
      caixa(s, s, s, c1, x, 0.35, z).rotation.y = a;
      caixa(s + 0.05, s + 0.05, s * 0.2, c2, x, 0.33, z, false).rotation.y = a;
      caixa(s * 0.2, s + 0.05, s + 0.05, c2, x, 0.33, z, false).rotation.y = a;
      bloqueia(x, z, s, s);
    }

    // Papai Noel com o saco de presentes
    const nx = cx - 11, nz = cz + 5.5;
    malha(new THREE.CylinderGeometry(0.75, 0.95, 1.8, 8), 0xe03131, nx, 1.25, nz);
    malha(new THREE.CylinderGeometry(0.86, 0.86, 0.25, 8), C.tinta, nx, 1.1, nz);
    malha(new THREE.IcosahedronGeometry(0.55, 0), C.pele, nx, 2.6, nz);
    const barba = malha(new THREE.ConeGeometry(0.5, 0.9, 6), C.branco, nx, 2.25, nz + 0.3);
    barba.rotation.x = Math.PI;
    malha(new THREE.CylinderGeometry(0.62, 0.62, 0.2, 8), C.branco, nx, 2.95, nz);
    malha(new THREE.ConeGeometry(0.56, 1.1, 8), 0xe03131, nx, 3.6, nz);
    malha(new THREE.IcosahedronGeometry(0.2, 0), C.branco, nx, 4.2, nz);
    malha(new THREE.IcosahedronGeometry(0.85, 0), 0x8a5a3b, nx + 1.5, 0.95, nz);
    bloqueia(nx + 0.6, nz, 3.4, 2);

    // Varal de luzes em volta da praça
    const P = [[-20.5, -9.5], [0, -9.5], [20.5, -9.5], [20.5, 9.5], [0, 9.5], [-20.5, 9.5]];
    P.forEach(([dx, dz]) => { caixa(0.22, 4, 0.22, C.tinta, cx + dx, 0.3, cz + dz); bloqueia(cx + dx, cz + dz, 0.4, 0.4); });
    P.forEach(([ax, az], i) => {
      const [bx, bz] = P[(i + 1) % P.length];
      const L = Math.hypot(bx - ax, bz - az), n = Math.round(L / 1.2);
      for (let k = 1; k < n; k++) {
        const u = k / n;
        luz(cx + ax + (bx - ax) * u, 4.1 - Math.sin(Math.PI * u) * 1.1, cz + az + (bz - az) * u);
      }
    });
    luzMalhas.forEach(m => { m.instanceMatrix.needsUpdate = true; });
    rotuloFixo("Feliz Natal · Praça Central", "#e03131", "#fffaf0", 1, cx, 24, cz);
  })();
  construirAdega();

  // Casa de luxo: volumes brancos modernos, piscina grande, coqueiros, flores e espreguiçadeiras
  (function () {
    if (!mansao) return;
    const { cx, cz, f } = mansao, m = f > 0 ? 1 : -1, ry = f > 0 ? 0 : Math.PI;
    const P = (dx, dz) => [cx + dx * m, cz + f * dz];
    const bx = (w, h, d, cor, dx, y, dz, sombra = true) => { const [x, z] = P(dx, dz); const o = caixa(w, h, d, cor, x, y, z, sombra); o.rotation.y = ry; return o; };
    const bl = (dx, dz, w, d) => { const [x, z] = P(dx, dz); bloqueia(x, z, w, d); };
    const BR = 0xf8f9fa, VIDRO = 0x2b3a44, MADEIRA = 0xb5835a, PEDRA = 0xe9e3d6;
    bx(44, 0.34, 22, PEDRA, 0, 0, 0, false);
    // Muro baixo branco (aberto no portão da frente)
    bx(44, 1, 0.4, BR, 0, 0.34, -10.8); bl(0, -10.8, 44, 0.4);
    [-21.8, 21.8].forEach(dx => { bx(0.4, 1, 22, BR, dx, 0.34, 0); bl(dx, 0, 0.4, 22); });
    [[-12.5, 17], [12.5, 17]].forEach(([dx, w]) => { bx(w, 1, 0.4, BR, dx, 0.34, 10.8); bl(dx, 10.8, w, 0.4); });
    // Casa: térreo com vidro, andar de cima em balanço, madeira e pérgola
    bx(22, 4, 8, BR, -8, 0.34, -6);
    bx(16, 2.8, 0.12, VIDRO, -9, 0.6, -1.97, false);
    [-17.5, -1.5].forEach(dx => bx(0.6, 4, 0.2, MADEIRA, dx, 0.34, -1.9, false));
    bx(10, 3.6, 7, BR, 10, 0.34, -6.5);
    bx(7, 2.6, 0.12, VIDRO, 10, 0.6, -2.97, false);
    bx(17, 3.6, 9, BR, -10.5, 4.34, -6.2);
    bx(15, 2.4, 0.12, VIDRO, -10.5, 4.9, -1.67, false);
    for (let k = 0; k < 9; k++) bx(0.18, 2.4, 0.25, MADEIRA, -17.5 + k * 0.5, 4.9, -1.55, false);
    bx(17.4, 0.35, 9.4, BR, -10.5, 7.94, -6.2, false);
    bl(-8, -6, 22, 8); bl(10, -6.5, 10, 7);
    // Painéis solares no telhado
    [[-14, -6.2], [-7, -6.2]].forEach(([dx, dz]) => {
      const [x, z] = P(dx, dz);
      const p = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 6.5), [mat(0xadb5bd), mat(0xadb5bd), matPainel, mat(0x343a40), mat(0xadb5bd), mat(0xadb5bd)]);
      p.position.set(x, 8.55, z);
      p.rotation.set(0.15 * f, ry, 0, "YXZ");
      p.castShadow = true;
      scene.add(p);
    });
    // Terraço em cima do térreo com guarda-corpo de vidro, espreguiçadeiras e ombrelone
    const vidro = new THREE.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.35, roughness: 0.1 });
    [[0.5, 4.4, 5, 0.08, -2.05], [3, 4.4, 0.08, 8, -6]].forEach(([dx, y, w, d, dz]) => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(w, 1.1, d), vidro);
      const [x, z] = P(dx, dz);
      g.position.set(x, y + 0.55, z);
      scene.add(g);
    });
    // Pérgola na lateral
    [[5.5, -1.2], [14.5, -1.2]].forEach(([dx, dz]) => { bx(0.35, 3.2, 0.35, BR, dx, 0.34, dz); bl(dx, dz, 0.4, 0.4); });
    for (let k = 0; k < 9; k++) bx(0.2, 0.2, 2.6, MADEIRA, 5.5 + k * 1.12, 3.54, -2.3, false);
    // Piscina grande com borda branca e degraus, e a prainha quadrada ao lado
    const AGUA = 0x3bc9db;
    bx(22, 0.16, 7, AGUA, -3, 0.34, 4.6, false);
    bx(23, 0.2, 0.5, BR, -3, 0.34, 1.0, false); bx(23, 0.2, 0.5, BR, -3, 0.34, 8.2, false);
    bx(0.5, 0.2, 7.7, BR, -14.5, 0.34, 4.6, false); bx(0.5, 0.2, 7.7, BR, 8.5, 0.34, 4.6, false);
    [0, 1, 2].forEach(k => bx(1.2, 0.04, 3.2 - k * 0.8, 0x99e9f2, 7.2 - k * 1.2, 0.5, 4.6, false));
    bl(-3, 4.6, 23, 7.7);
    bx(4.6, 0.16, 4.6, AGUA, 12.6, 0.34, 4.6, false);
    bx(5.4, 0.2, 0.4, BR, 12.6, 0.34, 2.1, false); bx(5.4, 0.2, 0.4, BR, 12.6, 0.34, 7.1, false);
    bx(0.4, 0.2, 5.4, BR, 10.1, 0.34, 4.6, false); bx(0.4, 0.2, 5.4, BR, 15.1, 0.34, 4.6, false);
    bl(12.6, 4.6, 5.4, 5.4);
    // Espreguiçadeiras, ombrelones pretos e mesa de jantar
    const espreg = (dx, dz, giro) => {
      const [x, z] = P(dx, dz);
      const g = new THREE.Group();
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.28, 1.6), mat(0xdee2e6)); a.position.set(0, 0.5, 0.2); g.add(a);
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.9), mat(0xdee2e6)); c.position.set(0, 0.85, -0.85); c.rotation.x = 0.7; g.add(c);
      g.children.forEach(o => { o.castShadow = true; });
      g.position.set(x, 0, z);
      g.rotation.y = ry + giro;
      scene.add(g);
      bloqueia(x, z, 1, 2);
    };
    [-12, -9.5, -7, -4.5].forEach(dx => espreg(dx, 9.6, Math.PI));
    [17.5, 19.3].forEach(dx => espreg(dx, 2.2, 0));
    const ombrelone = (dx, dz, y = 0.34) => {
      const [x, z] = P(dx, dz);
      malha(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 5), 0x495057, x, y + 1.3, z, false);
      malha(new THREE.ConeGeometry(1.7, 0.6, 10), 0x212529, x, y + 2.75, z);
    };
    ombrelone(-8.2, 9.6); ombrelone(18.4, 3.2); ombrelone(18.2, -4.5); ombrelone(-0.5, -4.5, 4.34);
    { const [x, z] = P(18.2, -4.5); malha(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 14), 0x8a5a3b, x, 1.15, z); malha(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6), 0x495057, x, 0.74, z); bloqueia(x, z, 2.4, 2.4); }
    [[1.1, 0], [-1.1, 0], [0, 1.1], [0, -1.1]].forEach(([a, b]) => bx(0.5, 0.75, 0.5, 0x495057, 18.2 + a, 0.34, -4.5 + b, false));
    // Lancha numa carreta, ele aluga lanchas
    { const [x, z] = P(-18.6, 3.5); const g = new THREE.Group();
      const casco = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 5), mat(BR)); casco.position.y = 1.1; g.add(casco);
      const proa = new THREE.Mesh(new THREE.BoxGeometry(1.27, 0.9, 1.27), mat(BR)); proa.position.set(0, 1.1, 2.5); proa.rotation.y = Math.PI / 4; g.add(proa);
      const faixa = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.2, 5), mat(0x1c7ed6)); faixa.position.y = 1.2; g.add(faixa);
      const para = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.08), mat(0x2b3a44)); para.position.set(0, 1.85, 0.6); para.rotation.x = -0.4; g.add(para);
      [-0.9, 0.9].forEach(s => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 10).rotateZ(Math.PI / 2), mat(0x1d1d1d)); r.position.set(s, 0.35, -0.4); g.add(r); });
      g.children.forEach(o => { o.castShadow = true; });
      g.position.set(x, 0.34, z); g.rotation.y = ry; scene.add(g); bloqueia(x, z, 2.2, 5.6); }
    // Canteiros com flores e coqueiros
    const flores = paleta(new THREE.IcosahedronGeometry(0.22, 0), 200);
    const canteiro = (dx, dz, w, d) => {
      bx(w, 0.5, d, 0x2f9e44, dx, 0.34, dz, false);
      bl(dx, dz, w, d);
      for (let k = 0; k < Math.round(w * d * 2.2); k++) {
        const [x, z] = P(dx - w / 2 + 0.2 + rand() * (w - 0.4), dz - d / 2 + 0.2 + rand() * (d - 0.4));
        flores.poe(x, 0.92 + rand() * 0.15, z, 1, 1, 1, rand() * 3, escolhe([0xf06595, 0xe03131, 0xfcc419, 0xcc5de8, 0xf8f9fa, 0xff922b]));
      }
    };
    canteiro(-12.5, 10, 16, 1.0); canteiro(12.5, 10, 16, 1.0);
    canteiro(-21, -2, 1.0, 16); canteiro(21, -6, 1.0, 8);
    canteiro(-16.2, -1.3, 4, 0.9);
    [[-20.6, 9.8], [20.6, 9.8], [-20.6, -9.6], [-16, 9.6], [16, 9.6], [20.6, -1]].forEach(([dx, dz]) => { const [x, z] = P(dx, dz); palmeira(x, z, rand() * Math.PI * 2); });
    [flores, ...[]].forEach(p => p.marca());
    coqTronco.instanceMatrix.needsUpdate = true;
    coqFolhas.forEach(mm => { mm.instanceMatrix.needsUpdate = true; });
    coqCocos.instanceMatrix.needsUpdate = true;

    // A mansão fica sem dono (o Robert voltou para a casa normal dele, do outro lado da rua)
  })();

  // ---------- Fazenda do Px: casa colonial, curral de terra, pasto com bois e galinhas soltas ----------
  const fazenda = { galinhas: [], bois: [] };
  (function () {
    const { x0, x1, z0, z1, estrada } = FAZ;
    const TERRA = 0xa86f45, MAD = 0x7a5230, BR = 0xf8f9fa, TELHA = 0xc4553b;
    const cerPostes = inst(UNIT, 500, MAD), cerTabuas = inst(UNIT, 900, 0x8a6240);
    function cerca(ax, az, bx, bz, vaoInicio = null, vaoFim = null) {
      const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 2.4)), ry = -Math.atan2(bz - az, bx - ax);
      for (let k = 0; k <= n; k++) {
        const u = k / n, x = ax + (bx - ax) * u, z = az + (bz - az) * u;
        const t = u * L;
        if (vaoInicio != null && t > vaoInicio && t < vaoFim) continue;
        poe(cerPostes, x, 0, z, 0.22, 1.5, 0.22);
        bloqueia(x, z, 0.3, 0.3);
        if (k < n) {
          const t2 = (k + 1) / n * L;
          if (vaoInicio != null && t2 > vaoInicio && t < vaoFim) continue;
          const mx = x + (bx - ax) / n / 2, mz = z + (bz - az) / n / 2;
          [0.55, 1.1].forEach(y => poe(cerTabuas, mx, y, mz, L / n, 0.14, 0.08, ry));
          bloqueia(mx, mz, Math.abs(bx - ax) / n + 0.15, Math.abs(bz - az) / n + 0.15);
        }
      }
    }
    // Estrada de terra da cidade até a porteira
    caixa(XMIN - 5 - x1, 0.06, 4.5, 0x9c6644, (XMIN - 5 + x1) / 2, 0, estrada, false);
    // Terreiro de terra batida e pasto
    const tx0 = x0 + 18, tx1 = x1, tz0 = estrada - 16, tz1 = estrada + 12;
    caixa(tx1 - tx0, 0.08, tz1 - tz0, TERRA, (tx0 + tx1) / 2, 0, (tz0 + tz1) / 2, false);
    const px0 = x0, px1 = x1, pz0 = tz1 + 2, pz1 = z1;
    caixa(px1 - px0, 0.05, pz1 - pz0, 0x7bc96f, (px0 + px1) / 2, 0, (pz0 + pz1) / 2, false);
    // Cercas de madeira: pasto inteiro e o curral (porteira aberta na estrada)
    cerca(px0, pz0, px1, pz0, 30, 36); cerca(px1, pz0, px1, pz1); cerca(px1, pz1, px0, pz1); cerca(px0, pz1, px0, pz0);
    cerca(tx1, tz0, tx1, tz1, (estrada - tz0) - 3, (estrada - tz0) + 3);
    cerca(tx0, tz1, tx0, tz0); cerca(tx0, tz0, tx0 + 10, tz0);

    // Casa colonial branca com telhado de telha e varanda
    const hx = (tx0 + tx1) / 2 - 4, hz = tz0 - 6;
    caixa(18, 3.8, 8, BR, hx, 0, hz);
    caixa(18.2, 0.5, 8.2, 0xd8cdb8, hx, 0, hz, false);
    const tel = malha(new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0), TELHA, hx, 3.8, hz);
    tel.scale.set(10.2 / Math.SQRT1_2, 2.6, 4.9 / Math.SQRT1_2);
    for (let k = 0; k < 5; k++) caixa(1.1, 1.6, 0.12, 0x6b4a35, hx - 7 + k * 3.5, 1.4, hz + 4.02, false);
    caixa(1.4, 2.6, 0.12, 0x5c3d2e, hx + 1.75, 0, hz + 4.03, false);
    const varanda = caixa(6, 0.2, 2.6, TELHA, hx + 1.75, 2.9, hz + 5.2);
    varanda.rotation.x = 0.2;
    [-2.6, 2.6].forEach(dx => caixa(0.18, 2.8, 0.18, MAD, hx + 1.75 + dx, 0, hz + 6.3, false));
    bloqueia(hx, hz, 18, 8);
    // Casinha anexa
    const ax = tx1 - 6, az = tz0 - 5;
    caixa(8, 3, 6, BR, ax, 0, az);
    const tel2 = malha(new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0), TELHA, ax, 3, az);
    tel2.scale.set(4.6 / Math.SQRT1_2, 1.8, 3.6 / Math.SQRT1_2);
    caixa(1.2, 2.2, 0.12, 0x6b4a35, ax, 0, az + 3.02, false);
    bloqueia(ax, az, 8, 6);
    // Galinheiro de madeira, cocho, fardos de feno e árvores
    const gx = tx0 + 5, gz = tz0 + 6;
    caixa(4, 2.2, 3, 0x8a6240, gx, 0, gz);
    const tg = caixa(4.6, 0.2, 3.6, 0x6b4a35, gx, 2.3, gz);
    tg.rotation.x = 0.25;
    caixa(0.9, 1.0, 0.1, 0x2b2014, gx, 0, gz + 1.52, false);
    bloqueia(gx, gz, 4, 3);
    caixa(5, 0.6, 1, 0x6b4a35, (px0 + px1) / 2 + 8, 0, pz0 + 4);
    caixa(4.8, 0.08, 0.8, 0x4dabf7, (px0 + px1) / 2 + 8, 0.55, pz0 + 4, false);
    bloqueia((px0 + px1) / 2 + 8, pz0 + 4, 5, 1);
    [[tx1 - 4, tz1 - 3], [tx1 - 6.2, tz1 - 3], [tx1 - 5.1, tz1 - 3, 1.3]].forEach(([x, z, y = 0.65]) => {
      const f = malha(new THREE.CylinderGeometry(0.65, 0.65, 1.3, 12).rotateZ(Math.PI / 2), 0xe6c45a, x, y, z);
      bloqueia(x, z, 1.4, 1.4);
    });
    [[hx - 12, hz - 4], [hx + 12, hz - 6], [hx - 4, hz - 9], [hx + 4, hz - 9], [x0 + 6, tz0 + 2], [x0 + 4, tz0 + 12]].forEach(([x, z]) => arvore(x, z, 1.3 + rand() * 0.4));
    palmeira(ax + 6, az + 4, rand() * 6);

    // Bois e vacas no pasto (alguns pastando de cabeça baixa)
    function boi(x, z, ry, tipo, pastando) {
      const g = new THREE.Group();
      const cor = tipo === "malhada" ? 0xf8f9fa : tipo === "preta" ? 0x212529 : 0x6b3e26;
      const add = (geo, c, px, py, pz) => { const m = new THREE.Mesh(geo, mat(c)); m.position.set(px, py, pz); m.castShadow = true; g.add(m); return m; };
      add(new THREE.BoxGeometry(2.3, 1.1, 1.05), cor, 0, 1.35, 0);
      if (tipo === "malhada") [[-0.5, 0.2, 0.53], [0.4, -0.1, -0.53], [0.6, 0.35, 0.53], [-0.7, -0.2, -0.53]].forEach(([a, b, c]) => add(new THREE.BoxGeometry(0.7, 0.5, 0.04), 0x212529, a, 1.35 + b, c));
      [[0.85, 0.35], [0.85, -0.35], [-0.85, 0.35], [-0.85, -0.35]].forEach(([a, c]) => add(new THREE.BoxGeometry(0.22, 0.85, 0.22), cor, a, 0.42, c));
      const cab = new THREE.Group();
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.55), mat(cor)); c1.castShadow = true; cab.add(c1);
      const foc = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.5), mat(0xd9a39a)); foc.position.set(0.45, -0.12, 0); cab.add(foc);
      [-0.25, 0.25].forEach(s => { const ch = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 5), mat(0xe9e3d6)); ch.position.set(-0.1, 0.4, s); cab.add(ch); });
      cab.position.set(1.4, pastando ? 0.75 : 1.75, 0);
      cab.rotation.z = pastando ? -0.6 : 0;
      g.add(cab);
      add(new THREE.BoxGeometry(0.06, 0.9, 0.06), cor, -1.17, 1.15, 0);
      if (tipo === "malhada") add(new THREE.BoxGeometry(0.4, 0.22, 0.4), 0xf3a6b8, -0.3, 0.72, 0);
      g.position.set(x, 0, z);
      g.rotation.y = ry;
      scene.add(g);
      bloqueia(x, z, 2.2, 2.2);
      fazenda.bois.push({ cab, pastando, fase: rand() * 6 });
    }
    const tipos = ["malhada", "malhada", "preta", "marrom", "malhada", "preta", "marrom", "malhada", "malhada", "preta"];
    tipos.forEach((tipo, k) => boi(px0 + 6 + rand() * (px1 - px0 - 12), pz0 + 8 + rand() * (pz1 - pz0 - 12), rand() * 6.28, tipo, k % 3 !== 1));

    // Galinhas ciscando soltas no terreiro
    for (let k = 0; k < 16; k++) {
      const g = new THREE.Group();
      const cor = k % 3 === 0 ? 0x8a4b22 : k % 3 === 1 ? 0xf8f9fa : 0xc77a3a;
      const corpo = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), mat(cor)); corpo.scale.set(1.25, 1, 0.9); corpo.position.y = 0.5; g.add(corpo);
      const rabo = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.2), mat(cor)); rabo.position.set(-0.35, 0.68, 0); rabo.rotation.z = 0.5; g.add(rabo);
      const cab = new THREE.Group();
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.15, 7, 5), mat(cor)); cab.add(c);
      const crista = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.05), mat(0xe03131)); crista.position.y = 0.15; cab.add(crista);
      const bico = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4).rotateZ(-Math.PI / 2), mat(0xfab005)); bico.position.x = 0.17; cab.add(bico);
      cab.position.set(0.33, 0.78, 0);
      g.add(cab);
      [-0.1, 0.1].forEach(s => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 4), mat(0xfab005)); p.position.set(0, 0.15, s); g.add(p); });
      g.children.forEach(o => { o.castShadow = true; });
      const x = tx0 + 4 + rand() * (tx1 - tx0 - 8), z = tz0 + 4 + rand() * (tz1 - tz0 - 8);
      g.position.set(x, 0.08, z);
      scene.add(g);
      fazenda.galinhas.push({ g, cab, dir: rand() * 6.28, vel: 0.8 + rand() * 0.8, pausa: rand() * 2, fase: rand() * 6, lim: [tx0 + 2, tx1 - 2, tz0 + 2, tz1 - 2] });
    }
    rotuloFixo("Fazenda do Px", "#8a5a3b", "#fffaf0", 1.2, hx, 13, hz);
    // A casa da fazenda vira a casa do @pexizin (placa, busca e "ir até")
    const px = grupos.casa[iFazendeiro];
    if (px) ents.push({ ...px, x: hx, y: 9.5, z: hz, sz: 1, cor: "#8a5a3b", q: "Fazenda do Px", alvo: { x: hx + 1.75, z: hz + 10, yaw: 0 } });
    [cerPostes, cerTabuas].forEach(mm => { mm.instanceMatrix.needsUpdate = true; });
  })();
  // ---------- Lixão: montanhas de lixo, pneus, catadores, máquinas e caminhões de lixo ----------
  const lixao = { caminhoes: [], escavadeira: null, trator: null, urubus: [] };
  (function () {
    const { x0, x1, z0, z1, estrada } = LIXO;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    // Chão de terra e estrada desde a cidade
    caixa(x1 - x0, 0.06, z1 - z0, 0x8a5a3c, cx, 0, cz, false);
    caixa(x0 - XMAX + 2, 0.06, 6, 0x9c6644, (XMAX + x0) / 2, 0, estrada, false);
    // Cerca de arame com portão aberto na estrada
    const postes = inst(UNIT, 260, 0x6b5a46);
    const lado = (ax, az, bx, bz) => {
      const L = Math.hypot(bx - ax, bz - az), n = Math.round(L / 4);
      for (let k = 0; k <= n; k++) {
        const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n;
        if (Math.abs(x - x0) < 0.5 && Math.abs(z - estrada) < 5) continue;
        poe(postes, x, 0, z, 0.2, 1.8, 0.2);
      }
    };
    lado(x0, z0, x1, z0); lado(x1, z0, x1, z1); lado(x1, z1, x0, z1); lado(x0, z1, x0, z0);
    const arame = (w, d, x, z) => [0.7, 1.4].forEach(y => caixa(w, 0.05, d, 0x868e96, x, y, z, false));
    arame(x1 - x0, 0.05, cx, z0); arame(x1 - x0, 0.05, cx, z1); arame(0.05, z1 - z0, x1, cz);
    arame(0.05, estrada - 5 - z0, x0, (z0 + estrada - 5) / 2); arame(0.05, z1 - estrada - 5, x0, (z1 + estrada + 5) / 2);
    bloqueia(cx, z0, x1 - x0, 0.4); bloqueia(cx, z1, x1 - x0, 0.4); bloqueia(x1, cz, 0.4, z1 - z0);
    bloqueia(x0, (z0 + estrada - 5) / 2, 0.4, estrada - 5 - z0); bloqueia(x0, (z1 + estrada + 5) / 2, 0.4, z1 - estrada - 5);
    rotuloFixo("Lixão Municipal", "#5c5f66", "#fffaf0", 1.3, x0 + 4, 9, estrada);

    // Montanhas de lixo irregulares, cobertas de sacolas coloridas
    const montes = [[cx + 8, z0 + 22, 16, 11], [cx + 22, z0 + 46, 13, 8], [cx - 14, z0 + 30, 12, 7], [cx + 4, z1 - 26, 14, 9], [cx + 24, z1 - 20, 10, 6]];
    const sacos = paleta(new THREE.IcosahedronGeometry(0.45, 0), 900);
    const CORES_LIXO = [0xf8f9fa, 0xdee2e6, 0x1c7ed6, 0x212529, 0x2b8a3e, 0xfab005, 0xc92a2a, 0x74c0fc, 0x868e96, 0x495057];
    montes.forEach(([mx0, mz0, r, h]) => {
      const geo = new THREE.ConeGeometry(r, h, 12, 4);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        if (p.getY(i) > h / 2 - 0.01) continue;
        p.setX(i, p.getX(i) * (0.8 + rand() * 0.4));
        p.setZ(i, p.getZ(i) * (0.8 + rand() * 0.4));
        p.setY(i, p.getY(i) + (rand() - 0.5) * 1.2);
      }
      geo.computeVertexNormals();
      malha(geo, 0x7d6e5d, mx0, h / 2 - 0.3, mz0);
      bloqueia(mx0, mz0, r * 1.5, r * 1.5);
      for (let k = 0; k < 150; k++) {
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r;
        const y = Math.max(0.2, h * (1 - d / r)) - 0.1;
        sacos.poe(mx0 + Math.cos(a) * d, y, mz0 + Math.sin(a) * d, 0.6 + rand() * 0.9, 0.5 + rand() * 0.5, 0.6 + rand() * 0.9, rand() * 6, escolhe(CORES_LIXO));
      }
    });
    for (let k = 0; k < 150; k++) sacos.poe(x0 + 4 + rand() * (x1 - x0 - 8), 0.2, z0 + 4 + rand() * (z1 - z0 - 8), 0.5 + rand() * 0.7, 0.4 + rand() * 0.4, 0.5 + rand() * 0.7, rand() * 6, escolhe(CORES_LIXO));
    // Pilha de pneus velhos
    const pneus = inst(new THREE.TorusGeometry(0.55, 0.25, 6, 12).rotateX(Math.PI / 2), 60, 0x1d1d1d);
    for (let k = 0; k < 40; k++) {
      const col = k % 8, lin = Math.floor(k / 8);
      poe(pneus, x0 + 8 + col * 1.25 + (lin % 2) * 0.6, 0.25 + (lin % 3) * 0.5, z1 - 8 - lin * 1.25, 1, 1, 1, rand() * 6);
    }
    bloqueia(x0 + 13, z1 - 10.5, 11, 6);
    // Catadores com chapéu e cesto
    [[cx - 6, z0 + 36], [cx + 1, z0 + 30], [cx + 16, z0 + 36], [cx - 4, z1 - 12], [cx + 14, z1 - 34]].forEach(([x, z], k) => {
      bonecoInst(x, 0.06, z, k * 1.3, estiloBoneco("catador" + k, k % 2 === 1, { camisa: [0xe03131, 0x1c7ed6, 0x2f9e44, 0xf59f00, 0x868e96][k], chapeu: 0xe9c46a }));
      malha(new THREE.CylinderGeometry(0.55, 0.42, 0.75, 10, 1, true), 0xa0743c, x + 0.9, 0.4, z + 0.2);
      bloqueia(x, z, 0.9, 0.9);
    });

    // Escavadeira laranja em cima do lixo, com o braço pegando lixo
    const LAR = 0xf76707;
    const esc = new THREE.Group();
    const add = (pai, geo, cor, x, y, z) => { const m = new THREE.Mesh(geo, mat(cor)); m.position.set(x, y, z); m.castShadow = true; pai.add(m); return m; };
    [-1.2, 1.2].forEach(z => add(esc, new THREE.BoxGeometry(4.2, 0.9, 0.8), 0x343a40, 0, 0.45, z));
    const giro = new THREE.Group(); giro.position.y = 1.0; esc.add(giro);
    add(giro, new THREE.BoxGeometry(3.6, 1.2, 2.6), LAR, -0.3, 0.6, 0);
    add(giro, new THREE.BoxGeometry(1.3, 1.5, 1.1), LAR, 0.9, 1.9, 0.7);
    add(giro, new THREE.BoxGeometry(0.06, 1.0, 0.9), 0x2b3a44, 1.56, 2.0, 0.7);
    const ombro = new THREE.Group(); ombro.position.set(1.2, 1.4, -0.4); giro.add(ombro);
    add(ombro, new THREE.BoxGeometry(5.5, 0.5, 0.5), LAR, 2.75, 0, 0);
    const cotovelo = new THREE.Group(); cotovelo.position.set(5.5, 0, 0); ombro.add(cotovelo);
    add(cotovelo, new THREE.BoxGeometry(0.45, 4.2, 0.45), LAR, 0, -2.1, 0);
    const concha = add(cotovelo, new THREE.BoxGeometry(1.0, 0.9, 1.1), 0x495057, 0.3, -4.4, 0);
    add(cotovelo, new THREE.IcosahedronGeometry(0.55, 0), 0x2b8a3e, 0.3, -4.0, 0);
    esc.position.set(montes[0][0] - 4, montes[0][3] * 0.45, montes[0][1] + 7);
    esc.rotation.y = 0.6;
    scene.add(esc);
    lixao.escavadeira = { giro, ombro, cotovelo };

    // Trator de esteira amarelo empurrando lixo
    const tr = new THREE.Group();
    [-1.0, 1.0].forEach(z => add(tr, new THREE.BoxGeometry(3.4, 0.8, 0.6), 0x343a40, 0, 0.4, z));
    add(tr, new THREE.BoxGeometry(2.8, 1.2, 2.0), 0xfab005, -0.2, 1.35, 0);
    add(tr, new THREE.BoxGeometry(1.2, 1.2, 1.4), 0xfab005, -0.7, 2.5, 0);
    add(tr, new THREE.BoxGeometry(0.06, 0.8, 1.2), 0x2b3a44, -0.08, 2.55, 0);
    add(tr, new THREE.BoxGeometry(0.3, 1.2, 3.0), 0xe8590c, 2.0, 0.7, 0);
    tr.position.set(cx - 10, 0, z1 - 40);
    scene.add(tr);
    lixao.trator = { g: tr, x: cx - 10, dir: 1 };

    // Urubus rodando no céu
    for (let k = 0; k < 7; k++) {
      const u = new THREE.Group();
      add(u, new THREE.BoxGeometry(0.5, 0.18, 2.2), 0x1d1d1d, 0, 0, 0);
      add(u, new THREE.BoxGeometry(0.9, 0.2, 0.3), 0x1d1d1d, 0.2, 0, 0);
      scene.add(u);
      lixao.urubus.push({ g: u, r: 8 + rand() * 12, a: rand() * 6.28, y: 18 + rand() * 10, v: 0.3 + rand() * 0.3, cx: cx + (rand() - 0.5) * 20, cz: cz + (rand() - 0.5) * 30 });
    }

    // Caminhões de lixo: saem da cidade pela rua e vão despejar no lixão
    function caminhaoLixo() {
      const g = new THREE.Group();
      add(g, new THREE.BoxGeometry(6.6, 0.3, 1.8), 0x1d1d1d, 0, 0.85, 0);
      add(g, new THREE.BoxGeometry(1.8, 1.9, 2.2), 0xf8f9fa, 2.4, 1.9, 0);
      add(g, new THREE.BoxGeometry(0.06, 0.9, 1.9), 0x2b3a44, 3.31, 2.3, 0);
      add(g, new THREE.BoxGeometry(4.0, 2.4, 2.3), 0xf1f3f5, -0.6, 2.2, 0);
      add(g, new THREE.BoxGeometry(4.02, 0.35, 2.32), 0x2f9e44, -0.6, 2.0, 0);
      const tampa = new THREE.Group(); tampa.position.set(-2.6, 3.4, 0); g.add(tampa);
      add(tampa, new THREE.BoxGeometry(0.9, 2.3, 2.3), 0xadb5bd, -0.45, -1.15, 0);
      [2.6, -1.8, -2.8].forEach(x => [-1.0, 1.0].forEach(z => add(g, new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12).rotateX(Math.PI / 2), 0x1d1d1d, x, 0.5, z)));
      const cv = document.createElement("canvas"); cv.width = 256; cv.height = 64;
      const c2 = cv.getContext("2d"); c2.fillStyle = "#2f9e44"; c2.font = '800 30px "Nunito Sans", sans-serif'; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText("LIMPEZA URBANA", 128, 34);
      const tex = new THREE.CanvasTexture(cv);
      [1, -1].forEach(s => { const pl = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); pl.position.set(-0.6, 2.8, s * 1.17); pl.rotation.y = s > 0 ? 0 : Math.PI; g.add(pl); });
      scene.add(g);
      return { g, tampa };
    }
    const rota = [[-60, estrada], [x0 - 2, estrada], [x0 + 14, estrada + 6], [cx - 2, z0 + 44]];
    const segs = [];
    let total = 0;
    for (let k = 0; k < rota.length - 1; k++) {
      const [ax, az] = rota[k], [bx, bz] = rota[k + 1], L = Math.hypot(bx - ax, bz - az);
      segs.push({ ax, az, dx: (bx - ax) / L, dz: (bz - az) / L, L, s0: total });
      total += L;
    }
    lixao.rota = { segs, total };
    [0, 0.35, 0.7].forEach((f, k) => {
      const c = caminhaoLixo();
      lixao.caminhoes.push({ ...c, s: f * total, dir: k % 2 ? -1 : 1, pausa: 0, vel: 11 });
    });
  })();
  function posRota(s, dir) {
    const { segs } = lixao.rota;
    let sg = segs[segs.length - 1];
    for (const q of segs) if (s <= q.s0 + q.L) { sg = q; break; }
    const u = s - sg.s0, hx = sg.dx * dir, hz = sg.dz * dir;
    const naRua = sg === segs[0];
    const off = naRua ? 2.4 : 0;
    return { x: sg.ax + sg.dx * u + (-hz) * off, z: sg.az + sg.dz * u + hx * off, ry: Math.atan2(-hz, hx) };
  }
  function atualizaLixao(dt, t) {
    const { total } = lixao.rota;
    lixao.caminhoes.forEach(c => {
      if (c.pausa > 0) {
        c.pausa -= dt;
        const abrindo = c.s >= total - 0.01 ? Math.sin(Math.min(1, (4 - c.pausa) / 4) * Math.PI) : 0;
        c.tampa.rotation.z = abrindo * 1.1;
        if (c.pausa <= 0) { c.dir *= -1; c.tampa.rotation.z = 0; }
      } else {
        c.s += c.dir * c.vel * dt;
        if (c.s >= total) { c.s = total; c.pausa = 4; }
        else if (c.s <= 0) { c.s = 0; c.pausa = 2; }
      }
      const p = posRota(c.s, c.dir);
      c.g.position.set(p.x, 0, p.z);
      c.g.rotation.y = p.ry;
    });
    if (reduz) return;
    const e = lixao.escavadeira;
    e.giro.rotation.y = Math.sin(t * 0.35) * 0.9;
    e.ombro.rotation.z = 0.35 + Math.sin(t * 0.7) * 0.25;
    e.cotovelo.rotation.z = -0.9 + Math.sin(t * 0.7 + 1.2) * 0.4;
    const tr = lixao.trator;
    tr.x += tr.dir * 3 * dt;
    if (tr.x > LIXO.x1 - 20 || tr.x < LIXO.x0 + 12) tr.dir *= -1;
    tr.g.position.x = tr.x;
    tr.g.rotation.y = tr.dir > 0 ? 0 : Math.PI;
    lixao.urubus.forEach(u => {
      u.a += u.v * dt;
      u.g.position.set(u.cx + Math.cos(u.a) * u.r, u.y + Math.sin(t * 2 + u.a) * 0.5, u.cz + Math.sin(u.a) * u.r);
      u.g.rotation.y = -u.a;
      u.g.rotation.x = Math.sin(t * 6 + u.a) * 0.25;
    });
  }

  // ---------- Pessoas andando: moradores nas calçadas, gente na praia, vôlei e futebol de areia ----------
  const QUADRAS = [[-170, 9], [-80, 16]]; // [x do centro, meia largura] na areia (sem guarda-sol nem coqueiro ali)
  const movel = paleta(new THREE.BoxGeometry(1, 1, 1), 3000);
  const dM = new THREE.Object3D();
  function criaAndante(o) {
    return partesBoneco(o).map(([w, h, d, px, py, pz, cor, tag]) => ({ w, h, d, px, cy: py + h / 2, pz, tag, hd: movel.poe(0, -50, 0, w, h, d, 0, cor) }));
  }
  function poeAndante(partes, x, y, z, ry, fase, balanca = true) {
    const sw = balanca && !reduz ? Math.sin(fase) * 0.6 : 0;
    const c = Math.cos(ry), s = Math.sin(ry);
    for (const p of partes) {
      let th = 0, yp = 0;
      if (p.tag[0] === "P") { th = p.tag === "P0" ? sw : -sw; yp = 0.8; }
      else if (p.tag[0] === "B") { th = p.tag === "B0" ? -sw * 0.8 : sw * 0.8; yp = 1.54; }
      let ly = p.cy, lz = p.pz;
      if (th) { const dy = p.cy - yp; ly = yp + dy * Math.cos(th) - p.pz * Math.sin(th); lz = dy * Math.sin(th) + p.pz * Math.cos(th); }
      dM.position.set(x + p.px * c + lz * s, y + ly, z - p.px * s + lz * c);
      dM.rotation.set(th, ry, 0, "YXZ");
      dM.scale.set(p.w, p.h, p.d);
      dM.updateMatrix();
      p.hd.m.setMatrixAt(p.hd.i, dM.matrix);
    }
  }
  const pessoasRua = [], pessoasPraia = [], jogos = { volei: null, futebol: null };
  (function () {
    // Moradores dando a volta no quarteirão pela calçada
    const blocos = blocosMapa.filter(b => b.tipo === "casas" && !(mansao && Math.abs(b.cx - mansao.cx) < 1 && Math.abs(b.cz - mansao.cz) < 1));
    for (let k = 0; k < 64; k++) {
      const b = escolhe(blocos), d = escolhe(grupos.casa);
      pessoasRua.push({
        partes: criaAndante(estiloBoneco(d.h + d.t, ehMulher(d.t))),
        cx: b.cx, cz: b.cz, s: rand() * 125.6, dir: rand() < 0.5 ? 1 : -1, vel: 1.2 + rand() * 0.8, fase: rand() * 6
      });
    }
    // Gente passeando na areia, dos dois lados do molhe
    for (let k = 0; k < 22; k++) {
      const lado = k % 2 ? [PQ.x1 + 16, PX - 10] : [PX + 10, JX + 110];
      pessoasPraia.push({
        partes: criaAndante(estiloBoneco("praia" + k, k % 3 === 0, { camisa: escolhe([0xf06595, 0xfab005, 0x22b8cf, 0xf8f9fa, 0xff922b, 0x51cf66]), calca: escolhe([0x1c7ed6, 0xe03131, 0x212529, 0x0ca678]) })),
        x: lado[0] + rand() * (lado[1] - lado[0]), x0: lado[0], x1: lado[1], z: 45 + rand() * 18, dir: rand() < 0.5 ? 1 : -1, vel: 1 + rand() * 0.8, fase: rand() * 6
      });
    }
    // Vôlei de praia: rede, 4 jogadores e a bola indo de um lado para o outro
    {
      const [vx] = QUADRAS[0], vz = 48;
      [-4.2, 4.2].forEach(dz => { malha(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6), 0xdee2e6, vx, 1.3, vz + dz, false); bloqueia(vx, vz + dz, 0.3, 0.3); });
      const rede = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 8.4), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
      rede.position.set(vx, 2.1, vz);
      scene.add(rede);
      [[-6, -2.5], [6, 2.5]].forEach(([a, b]) => caixa(12, 0.02, 0.12, 0xf8f9fa, vx + a / 2, 0.12, vz + b * 2.6, false));
      const bola = malha(new THREE.IcosahedronGeometry(0.28, 1), 0xfcc419, vx, 3, vz);
      const jog = [[-4.5, -2, 0xe03131], [-4.5, 2, 0xe03131], [4.5, -2, 0x1c7ed6], [4.5, 2, 0x1c7ed6]].map(([dx, dz, cor], k) => ({
        partes: criaAndante(estiloBoneco("volei" + k, k % 2 === 1, { camisa: cor, calca: 0x212529 })), x: vx + dx, z: vz + dz, ry: dx < 0 ? Math.PI / 2 : -Math.PI / 2
      }));
      jog.forEach(j => bloqueia(j.x, j.z, 0.9, 0.9));
      jogos.volei = { vx, vz, bola, jog };
    }
    // Futebol de areia: dois golzinhos, 6 jogadores correndo atrás da bola
    {
      const [fx, meia] = QUADRAS[1], fz = 48;
      [-1, 1].forEach(s => {
        const gx = fx + s * (meia - 1.5);
        caixa(0.15, 1.6, 0.15, 0xf8f9fa, gx, 0.12, fz - 1.8, false);
        caixa(0.15, 1.6, 0.15, 0xf8f9fa, gx, 0.12, fz + 1.8, false);
        caixa(0.15, 0.15, 3.75, 0xf8f9fa, gx, 1.72, fz, false);
      });
      const bola = malha(new THREE.IcosahedronGeometry(0.3, 1), 0xf8f9fa, fx, 0.42, fz);
      const jog = [0xfab005, 0xfab005, 0xfab005, 0x2f9e44, 0x2f9e44, 0x2f9e44].map((cor, k) => ({
        partes: criaAndante(estiloBoneco("futebol" + k, false, { camisa: cor, calca: 0xf8f9fa })),
        x: fx + (rand() - 0.5) * 16, z: fz + (rand() - 0.5) * 5, ry: 0, fase: rand() * 6, off: [(rand() - 0.5) * 5, (rand() - 0.5) * 3.5], vel: 2.6 + rand()
      }));
      jogos.futebol = { fx, fz, meia, bola, jog, alvo: [fx, fz], troca: 0, bx: fx, bz: fz };
    }
  })();
  function atualizaPessoas(dt, t) {
    const L = 42.4, A = 20.4, P = 2 * (L + A);
    pessoasRua.forEach(p => {
      p.s = (p.s + p.dir * p.vel * dt + P) % P;
      let x, z, hx, hz, s = p.s;
      if (s < L) { x = -L / 2 + s; z = -A / 2; hx = 1; hz = 0; }
      else if (s < L + A) { x = L / 2; z = -A / 2 + (s - L); hx = 0; hz = 1; }
      else if (s < 2 * L + A) { x = L / 2 - (s - L - A); z = A / 2; hx = -1; hz = 0; }
      else { x = -L / 2; z = A / 2 - (s - 2 * L - A); hx = 0; hz = -1; }
      p.fase += dt * 7 * p.vel / 1.5;
      poeAndante(p.partes, p.cx + x, 0.33, p.cz + z, Math.atan2(hx * p.dir, hz * p.dir), p.fase);
    });
    pessoasPraia.forEach(p => {
      p.x += p.dir * p.vel * dt;
      if (p.x > p.x1) { p.x = p.x1; p.dir = -1; } else if (p.x < p.x0) { p.x = p.x0; p.dir = 1; }
      p.fase += dt * 7 * p.vel / 1.5;
      poeAndante(p.partes, p.x, 0.12, p.z, p.dir > 0 ? Math.PI / 2 : -Math.PI / 2, p.fase);
    });
    // Vôlei: a bola cruza a rede em arco; quem recebe dá um pulinho
    const v = jogos.volei;
    if (v) {
      const ciclo = reduz ? 0.5 : (t * 0.45) % 2, lado = ciclo < 1 ? 1 : -1, u = ciclo % 1;
      const x0 = v.vx - 4.5 * lado, x1 = v.vx + 4.5 * lado, zz = v.vz + Math.sin(t * 0.7) * 1.8;
      v.bola.position.set(x0 + (x1 - x0) * u, 2.6 + Math.sin(Math.PI * u) * 4.5, zz);
      v.jog.forEach(j => {
        const recebe = Math.sign(j.x - v.vx) === lado && u > 0.85;
        poeAndante(j.partes, j.x, 0.12 + (recebe && !reduz ? Math.sin((u - 0.85) / 0.15 * Math.PI) * 0.6 : 0), j.z, j.ry, 0, false);
      });
    }
    // Futebol: a bola rola para pontos aleatórios e os jogadores correm atrás
    const f = jogos.futebol;
    if (f) {
      f.troca -= dt;
      if (f.troca <= 0) { f.alvo = [f.fx + (rand() - 0.5) * (f.meia * 2 - 5), f.fz + (rand() - 0.5) * 6]; f.troca = 1.6 + rand() * 2; }
      if (!reduz) {
        const dx = f.alvo[0] - f.bx, dz = f.alvo[1] - f.bz, dd = Math.hypot(dx, dz);
        if (dd > 0.1) { const v2 = Math.min(dd, 7 * dt); f.bx += dx / dd * v2; f.bz += dz / dd * v2; }
      }
      f.bola.position.set(f.bx, 0.42 + Math.abs(Math.sin(t * 6)) * 0.15, f.bz);
      f.jog.forEach(j => {
        const tx = f.bx + j.off[0], tz = f.bz + j.off[1], dx = tx - j.x, dz = tz - j.z, dd = Math.hypot(dx, dz);
        const anda = dd > 0.6 && !reduz;
        if (anda) { const v2 = Math.min(dd, j.vel * dt); j.x += dx / dd * v2; j.z += dz / dd * v2; j.ry = Math.atan2(dx, dz); j.fase += dt * 11; }
        poeAndante(j.partes, j.x, 0.12, j.z, j.ry, j.fase, anda);
      });
    }
    movel.marca();
  }

  function atualizaFazenda(dt, t) {
    if (reduz) return;
    fazenda.galinhas.forEach(c => {
      if (c.pausa > 0) {
        c.pausa -= dt;
        c.cab.position.y = 0.78 - Math.max(0, Math.sin(t * 12 + c.fase)) * 0.35;
        if (c.pausa <= 0) { c.dir += (rand() - 0.5) * 2.5; }
      } else {
        c.cab.position.y = 0.78;
        const nx = c.g.position.x + Math.cos(c.dir) * c.vel * dt, nz = c.g.position.z - Math.sin(c.dir) * c.vel * dt;
        const [a, b, cc, d] = c.lim;
        if (nx < a || nx > b || nz < cc || nz > d) c.dir += Math.PI * (0.6 + rand() * 0.6);
        else { c.g.position.x = nx; c.g.position.z = nz; }
        c.g.rotation.y = c.dir;
        if (rand() < dt * 0.6) c.pausa = 0.8 + rand() * 2.5;
      }
    });
    fazenda.bois.forEach(b => { if (b.pastando) b.cab.rotation.z = -0.6 + Math.sin(t * 1.5 + b.fase) * 0.08; });
  }

  // Câmara Municipal
  (function () {
    const { cx, cz } = especiais.camara;
    const zb = cz - 5.5;
    caixa(36, 0.6, 3, C.calcada, cx, 0.3, cz - 0.2, false);
    caixa(34, 8, 9, 0xf3efe6, cx, 0.3, zb);
    for (let i = 0; i < 7; i++) malha(new THREE.CylinderGeometry(0.45, 0.45, 7.4, 8), C.branco, cx - 15 + i * 5, 0.9 + 3.7, cz - 0.6);
    caixa(36, 0.8, 11, 0xe4ddd0, cx, 8.3, zb + 1);
    const fr = new THREE.CylinderGeometry(3, 3, 35, 3).rotateY(Math.PI / 2).rotateZ(Math.PI / 2);
    const fronte = malha(fr, 0xe4ddd0, cx, 10.6, zb + 1);
    fronte.scale.set(1, 0.9, 1.5);
    malha(new THREE.SphereGeometry(3.4, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), C.camaraCupula || 0x8fa8d8, cx, 12.6, zb);
    bloqueia(cx, zb + 0.5, 36, 11);
    caixa(0.2, 9, 0.2, C.branco, cx + 19, 0.3, cz - 1);
    caixa(2.6, 1.6, 0.1, 0x2f9e44, cx + 20.4, 7.6, cz - 1, false);
    const n = grupos.camara.length, porFila = 10;
    grupos.camara.forEach((d, i) => {
      const fila = Math.floor(i / porFila), col = i % porFila;
      const naFila = Math.min(porFila, n - fila * porFila);
      pessoa(d, cx + (col - (naFila - 1) / 2) * 3.6, cz + 3.6 + fila * 3.6, TERNOS[i % TERNOS.length]);
    });
    rotuloFixo("Câmara Municipal", "#3b5bdb", "#fffaf0", 1.2, cx, 18, zb);
  })();

  // Prefeitura
  (function () {
    const { cx, cz } = especiais.prefeitura;
    const zb = cz - 5;
    caixa(30, 10, 9, 0xf3e2a8, cx, 0.3, zb);
    const t = malha(new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0), 0xc4553b, cx, 10.3, zb);
    t.scale.set(23, 3, 7.5);
    for (let a = 0; a < 3; a++) for (let i = 0; i < 6; i++) caixa(2, 1.6, 0.15, C.vidro, cx - 12.5 + i * 5, 1.6 + a * 3, zb + 4.55, false);
    caixa(3, 3, 0.2, C.porta, cx, 0.3, zb + 4.6, false);
    caixa(2.2, 2.8, 0.2, C.porta, cx + 6.5, 0.3, zb + 4.6, false);
    bloqueia(cx, zb, 30, 9);
    {
      const indPref = criarIndicadorPorta(0x2f9e44);
      indPref.position.set(cx + 6.5, 0.32, zb + 5.15);
      scene.add(indPref);
      registrarOuAtualizarPorta({
        id: "porta_prefeitura",
        room: "prefeitura",
        label: "Prefeitura",
        x: +(cx + 6.5).toFixed(2),
        z: +(zb + 6.1).toFixed(2),
        yaw: 0,
        interiorTipo: "prefeitura"
      });
    }
    caixa(0.2, 12, 0.2, C.branco, cx - 18, 0.3, cz + 2);
    caixa(3, 2, 0.1, 0xfab005, cx - 16.4, 9.8, cz + 2, false);
    // Prefeita: @julia_silxo de rei de desenho (coroa, manto azul com arminho, corrente de ouro e cetro), em cima de um palco com trono
    const jl = grupos.casa.find(d => d.h === "julia_silxo");
    if (jl) {
      const ouro = 0xf2c230, AZUL = 0x1c3faa, ARM = 0xf8f9fa, PT = 0x111111;
      const pz = cz + 3.4, base = 0.3 + 0.5;
      caixa(5.4, 0.5, 4.2, 0xc92a2a, cx, 0.3, cz + 3, false);
      caixa(5.6, 0.12, 4.4, ouro, cx, 0.3 + 0.45, cz + 3, false);
      caixa(1.8, 0.06, 4, 0xc92a2a, cx, 0.3, cz + 7, false);
      // Trono dourado atrás
      caixa(2.0, 0.9, 1.4, ouro, cx, base, cz + 1.6);
      caixa(2.0, 3.4, 0.3, ouro, cx, base, cz + 1.0);
      caixa(1.6, 2.6, 0.06, 0xc92a2a, cx, base + 0.5, cz + 1.17, false);
      [-1, 1].forEach(s => malha(new THREE.SphereGeometry(0.22, 8, 6), ouro, cx + s * 0.85, base + 3.55, cz + 1.0));
      bloqueia(cx, cz + 3, 5.4, 4.2);
      const B = (w, h, d, x, y, z, cor) => [w, h, d, x, y, z, cor, ""];
      const extra = [
        // Manto azul até o chão, aberto na frente
        B(1.34, 1.42, 0.12, 0, 0.04, -0.32, AZUL), B(0.14, 1.42, 0.66, -0.68, 0.04, -0.02, AZUL), B(0.14, 1.42, 0.66, 0.68, 0.04, -0.02, AZUL),
        B(0.4, 1.36, 0.1, -0.5, 0.04, 0.3, AZUL), B(0.4, 1.36, 0.1, 0.5, 0.04, 0.3, AZUL),
        // Gola e barra de arminho (branco com pintinhas pretas)
        B(1.5, 0.32, 0.86, 0, 1.36, -0.02, ARM), B(0.2, 1.3, 0.06, -0.26, 0.08, 0.36, ARM), B(0.2, 1.3, 0.06, 0.26, 0.08, 0.36, ARM),
        B(1.34, 0.16, 0.14, 0, 0.04, -0.34, ARM)
      ];
      [[-0.5, 1.52], [0.5, 1.52], [-0.2, 1.45], [0.2, 1.45], [-0.62, 1.42], [0.62, 1.42]].forEach(([x, y]) => extra.push(B(0.08, 0.08, 0.02, x, y, 0.42, PT)));
      [-0.26, 0.26].forEach(x => [0.25, 0.6, 0.95, 1.25].forEach((y, i) => extra.push(B(0.07, 0.07, 0.02, x + (i % 2 ? 0.04 : -0.04), y, 0.4, PT))));
      // Corrente de ouro com medalhão, coroa de pontas e cetro dourado
      extra.push(B(0.06, 0.4, 0.02, -0.18, 1.1, 0.24, ouro), B(0.06, 0.4, 0.02, 0.18, 1.1, 0.24, ouro), B(0.2, 0.2, 0.04, 0, 0.98, 0.25, ouro));
      extra.push(B(1.08, 0.24, 0.98, 0, 2.62, 0, ouro));
      [[-0.42, 0.38], [0, 0.38], [0.42, 0.38], [-0.42, -0.38], [0.42, -0.38], [0, -0.38]].forEach(([x, z]) => extra.push(B(0.2, 0.34, 0.2, x, 2.86, z, ouro)));
      extra.push(B(0.12, 0.12, 0.04, 0, 2.68, 0.5, 0xe03131), B(0.1, 0.1, 0.04, -0.3, 2.68, 0.5, 0x1c7ed6), B(0.1, 0.1, 0.04, 0.3, 2.68, 0.5, 0x2f9e44));
      extra.push(B(0.09, 2.7, 0.09, 0.74, 0, 0.3, ouro), B(0.3, 0.12, 0.12, 0.74, 2.7, 0.3, ouro), B(0.08, 0.32, 0.08, 0.62, 2.8, 0.3, ouro), B(0.08, 0.32, 0.08, 0.86, 2.8, 0.3, ouro), B(0.1, 0.36, 0.1, 0.74, 2.82, 0.3, ouro));
      bonecoInst(cx, base, pz, 0, estiloBoneco(jl.h + jl.t, ehMulher(jl.t), { cabelo: 0xf1f3f5, camisa: ARM, calca: AZUL, sapato: AZUL, extra }));
      ents.push({ ...jl, t: "Julia, prefeita de Caraguá", k: "prefeitura", x: cx, y: base + 4.6, z: pz, cor: LUGAR.prefeitura.cor, alvo: { x: cx, z: pz + 9, yaw: 0 } });
      rotuloFixo("Prefeita: Julia", "#fffaf0", "#2f9e44", 0.8, cx, base + 6.2, pz);
    } else {
      caixa(1.6, 1.3, 1, C.porta, cx, 0.3, cz + 4.5);
      bloqueia(cx, cz + 4.5, 1.6, 1);
      rotuloFixo("Prefeito: vaga aberta", "#fffaf0", "#2f9e44", 0.8, cx, 4.6, cz + 4.5);
    }
    rotuloFixo("Prefeitura", "#2f9e44", "#fffaf0", 1.2, cx, 18, zb);
  })();

  // Posto de combustível com loja de conveniência
  (function () {
    const { cx, cz } = especiais.posto;
    const fz = cz + 11, czc = cz + 3.5, COB = 6.2;
    caixa(42, 0.32, 20, 0xd6d2ca, cx, 0, cz, false);
    // Cobertura sobre as bombas
    [[-9, -4], [9, -4], [-9, 4], [9, 4]].forEach(([dx, dz]) => {
      malha(new THREE.CylinderGeometry(0.35, 0.35, COB, 8), C.branco, cx + dx, 0.3 + COB / 2, czc + dz);
      bloqueia(cx + dx, czc + dz, 0.8, 0.8);
    });
    caixa(24, 0.6, 12, C.branco, cx, 0.3 + COB, czc);
    caixa(24.3, 1.1, 12.3, 0x1f8a9e, cx, 0.3 + COB + 0.6, czc);
    caixa(24.4, 0.35, 12.4, 0xff7a59, cx, 0.3 + COB + 1.7, czc);
    // Ilhas com bombas
    [-4.5, 4.5].forEach(dx => {
      caixa(1.4, 0.3, 7, 0xbab3a4, cx + dx, 0.3, czc, false);
      [-1.8, 1.8].forEach(dz => {
        caixa(1, 1.6, 1.3, C.branco, cx + dx, 0.6, czc + dz);
        caixa(1.04, 0.5, 1.34, 0x1f8a9e, cx + dx, 2.2, czc + dz, false);
        caixa(0.06, 0.5, 0.8, C.tinta, cx + dx + 0.52, 1.5, czc + dz, false);
        caixa(0.06, 0.5, 0.8, C.tinta, cx + dx - 0.52, 1.5, czc + dz, false);
        malha(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 5), C.tinta, cx + dx + 0.6, 1.3, czc + dz + 0.45, false);
        malha(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 5), C.tinta, cx + dx - 0.6, 1.3, czc + dz - 0.45, false);
      });
      bloqueia(cx + dx, czc, 1.6, 7.2);
    });
    // Carros abastecendo
    [[-7.2, -1.5, 0xe03131], [7.2, 1.8, 0xf59f00]].forEach(([dx, dz, cor]) => {
      caixa(2.1, 1.1, 4.3, cor, cx + dx, 0.35, czc + dz);
      caixa(1.85, 0.9, 2.3, C.cabine, cx + dx, 1.45, czc + dz - 0.35);
      bloqueia(cx + dx, czc + dz, 2.3, 4.5);
    });
    // Frentista
    malha(new THREE.CylinderGeometry(0.55, 0.7, 1.5, 7), 0x1f8a9e, cx - 2.6, 1.05, czc + 2.2);
    malha(new THREE.IcosahedronGeometry(0.5, 0), C.pele, cx - 2.6, 2.35, czc + 2.2);
    malha(new THREE.CylinderGeometry(0.52, 0.52, 0.24, 7), 0xff7a59, cx - 2.6, 2.75, czc + 2.2);
    bloqueia(cx - 2.6, czc + 2.2, 1.3, 1.3);
    // Loja de conveniência
    const zl = cz - 5.5;
    caixa(16, 4.6, 7, 0xfff1d6, cx, 0.3, zl);
    caixa(16.3, 0.8, 7.3, 0x1f8a9e, cx, 4.9, zl, false);
    caixa(11, 2.6, 0.15, C.vidro, cx - 1.8, 0.7, zl + 3.55, false);
    caixa(2, 2.7, 0.16, C.cabine, cx + 5.5, 0.3, zl + 3.56, false);
    bloqueia(cx, zl, 16, 7);
    rotuloFixo("Conveniência", "#fffaf0", "#1f8a9e", 0.6, cx, 7.2, zl + 3.6);
    // Placa de preços
    const tx = cx + 17, tz = fz - 2;
    caixa(0.5, 4.2, 0.5, 0x495057, tx, 0.3, tz);
    caixa(3.4, 4.2, 0.5, C.tinta, tx, 4.2, tz);
    bloqueia(tx, tz, 3.4, 0.6);
    const cv = document.createElement("canvas");
    cv.width = 256; cv.height = 320;
    const g = cv.getContext("2d");
    g.fillStyle = "#1f8a9e"; g.fillRect(0, 0, 256, 320);
    g.fillStyle = "#fffaf0"; g.textAlign = "center";
    g.font = '800 30px "Nunito Sans", "Segoe UI", sans-serif';
    g.fillText("POSTO", 128, 42);
    g.fillText("CARAGUÁ", 128, 76);
    [["GASOLINA", "6,29"], ["ETANOL", "4,19"], ["DIESEL", "6,09"]].forEach(([n, p], i) => {
      const y = 100 + i * 70;
      g.fillStyle = "#1d2a33"; g.fillRect(14, y, 228, 58);
      g.fillStyle = "#fffaf0"; g.textAlign = "left"; g.font = '800 20px "Nunito Sans", "Segoe UI", sans-serif';
      g.fillText(n, 24, y + 36);
      g.fillStyle = "#ffb000"; g.textAlign = "right"; g.font = '700 30px "Courier New", monospace';
      g.fillText(p, 232, y + 40);
    });
    const tex = new THREE.CanvasTexture(cv);
    [0, Math.PI].forEach(r => {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 3.9), new THREE.MeshBasicMaterial({ map: tex }));
      pl.position.set(tx, 6.3, tz + (r ? -0.27 : 0.27));
      pl.rotation.y = r;
      scene.add(pl);
    });
    rotuloFixo("Posto Caraguá", "#1f8a9e", "#fffaf0", 1.1, cx, 11.5, czc);
  })();

  // Pub dos Leões: prédio art déco de cantos redondos, toldo azul, varanda com mesas, luzes amarelas, leões dourados e palmeiras imperiais
  const balada = { feixes: [], globo: null, placa: null };
  (function () {
    const { cx, cz } = especiais.balada;
    const y0 = 0.32, CREME = 0xf6efe0, BR = 0xfffaf0, AMAR = 0xffd43b;
    const z0 = cz - 4.5, D = 10, zf = z0 + D / 2, H = 3.5, NF = 3, HT = NF * H;
    caixa(42, 0.32, 20, 0x495057, cx, 0, cz, false);
    caixa(30, 0.04, 8.4, 0xd9cbb3, cx, 0.32, zf + 4.2, false);
    const basico = c => new THREE.MeshBasicMaterial({ color: c });
    const luzAmarela = basico(0xffd866), luzRoxa = basico(0xd46bff), janelaLuz = basico(0xffe29a);
    const peca = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m.isMaterial ? m : mat(m)); o.position.set(x, y, z); o.castShadow = !m.isMaterial || m.type !== "MeshBasicMaterial"; o.receiveShadow = true; scene.add(o); return o; };
    // Corpo central, alas com a frente redonda e a torre do meio mais alta
    caixa(15, HT + 0.6, D, CREME, cx, y0, z0);
    const RW = 2.6, WX = 10;
    [-1, 1].forEach(s => {
      caixa(RW * 2, HT, D - RW, CREME, cx + s * WX, y0, z0 - RW / 2);
      peca(new THREE.CylinderGeometry(RW, RW, HT, 24), CREME, cx + s * WX, y0 + HT / 2, zf - RW);
    });
    bloqueia(cx, z0, 2 * (WX + RW), D);
    const TW = 5.2, TH = HT + 4.6;
    caixa(TW, TH, 1.6, BR, cx, y0, zf + 0.3);
    [-1.6, 0, 1.6].forEach(dx => caixa(0.32, TH - 1.6, 0.5, 0xe9dcc4, cx + dx, y0 + 1.2, zf + 1.3, false));
    caixa(TW - 1.2, 1.2, 1.4, BR, cx, y0 + TH, zf + 0.3);
    caixa(TW - 2.4, 0.9, 1.2, BR, cx, y0 + TH + 1.2, zf + 0.3);
    // Marquises de cada andar com fita de luz embaixo (amarela na frente, lilás nas alas)
    for (let f = 1; f <= NF; f++) {
      const y = y0 + f * H;
      caixa(15.2, 0.24, 0.9, BR, cx, y - 0.12, zf + 0.35, false);
      peca(new THREE.BoxGeometry(15.2, 0.1, 0.1), luzAmarela, cx, y - 0.2, zf + 0.82);
      [-1, 1].forEach(s => {
        peca(new THREE.CylinderGeometry(RW + 0.55, RW + 0.55, 0.24, 26), BR, cx + s * WX, y, zf - RW);
        peca(new THREE.CylinderGeometry(RW + 0.56, RW + 0.56, 0.1, 26, 1, true), f === NF ? luzRoxa : luzAmarela, cx + s * WX, y - 0.15, zf - RW);
      });
    }
    // Contorno lilás no topo (como na foto) e na torre
    [-1, 1].forEach(s => peca(new THREE.CylinderGeometry(RW + 0.06, RW + 0.06, 0.12, 26, 1, true), luzRoxa, cx + s * WX, y0 + HT - 0.06, zf - RW));
    peca(new THREE.BoxGeometry(0.12, TH, 0.12), luzRoxa, cx - TW / 2 - 0.06, y0 + TH / 2, zf + 1.12);
    peca(new THREE.BoxGeometry(0.12, TH, 0.12), luzRoxa, cx + TW / 2 + 0.06, y0 + TH / 2, zf + 1.12);
    peca(new THREE.BoxGeometry(TW - 1.0, 0.12, 0.12), luzRoxa, cx, y0 + TH + 1.2, zf + 1.02);
    // Janelas acesas de luz amarela (retas no meio e em volta das alas redondas)
    const janQuadro = inst(UNIT, 120, BR);
    const janVidro = new THREE.InstancedMesh(UNIT, janelaLuz, 120);
    janVidro.count = 0; janVidro.frustumCulled = false; scene.add(janVidro); instancias.push(janVidro);
    for (let f = 1; f < NF; f++) {
      const y = y0 + f * H + 0.75;
      [-4.8, 4.8].forEach(dx => {
        poe(janQuadro, cx + dx, y - 0.1, zf + 0.04, 3.4, 2.2, 0.12);
        poe(janVidro, cx + dx, y, zf + 0.1, 3.0, 1.9, 0.08);
      });
      [-1, 1].forEach(s => [-0.55, 0, 0.55].forEach(a => {
        const ry = a + s * 0.5, nx = Math.sin(ry), nz = Math.cos(ry);
        poe(janQuadro, cx + s * WX + nx * (RW + 0.02), y - 0.1, zf - RW + nz * (RW + 0.02), 1.2, 2.2, 0.1, ry);
        poe(janVidro, cx + s * WX + nx * (RW + 0.07), y, zf - RW + nz * (RW + 0.07), 1.0, 1.9, 0.06, ry);
      }));
    }
    // Térreo envidraçado com luz quente lá dentro
    peca(new THREE.PlaneGeometry(14, 2.9), basico(0xffcf7a), cx, y0 + 1.55, zf + 0.03);
    for (let k = 0; k <= 7; k++) caixa(0.14, 3.1, 0.14, 0x2b2b2b, cx - 7 + k * 2, y0, zf + 0.08, false);
    // Toldo azul em toda a frente com cordão de lâmpadas amarelas
    const toldo = new THREE.Mesh(new THREE.BoxGeometry(31, 0.2, 3.6).rotateX(0.18), mat(0x1c4fb8));
    toldo.position.set(cx, y0 + 3.35, zf + 1.85);
    toldo.castShadow = true;
    scene.add(toldo);
    caixa(31, 0.55, 0.12, 0x1c4fb8, cx, y0 + 2.45, zf + 3.62, false);
    const yT = y0 + 2.42;
    const bulboGeo = new THREE.SphereGeometry(0.12, 8, 6);
    const lampadas = new THREE.InstancedMesh(bulboGeo, luzAmarela, 160);
    lampadas.count = 0; lampadas.frustumCulled = false; scene.add(lampadas); instancias.push(lampadas);
    const fio = [];
    for (let s = 0; s < 6; s++) {
      const ax = cx - 15.5 + s * 31 / 6, bx = ax + 31 / 6;
      for (let i = 0; i <= 8; i++) {
        const t = i / 8, x = ax + (bx - ax) * t, y = yT - 0.45 * 4 * t * (1 - t);
        if (i < 8) { const t2 = (i + 1) / 8; fio.push(x, y, zf + 3.7, ax + (bx - ax) * t2, yT - 0.45 * 4 * t2 * (1 - t2), zf + 3.7); }
        if (i > 0 && i < 8) poe(lampadas, x, y - 0.14, zf + 3.7, 1, 1, 1);
      }
    }
    const geoFio = new THREE.BufferGeometry();
    geoFio.setAttribute("position", new THREE.Float32BufferAttribute(fio, 3));
    scene.add(new THREE.LineSegments(geoFio, new THREE.LineBasicMaterial({ color: 0x343a40 })));
    // Letreiro "PUB": vertical na torre e em cima da porta
    const cv = document.createElement("canvas");
    cv.width = 160; cv.height = 480;
    const g = cv.getContext("2d");
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = '800 140px "Nunito Sans", "Segoe UI", sans-serif';
    g.shadowColor = "#ffb700"; g.shadowBlur = 26; g.fillStyle = "#ffe066";
    ["P", "U", "B"].forEach((l, i) => g.fillText(l, 80, 84 + i * 156));
    g.shadowBlur = 0; g.globalAlpha = 0.5; g.fillStyle = "#ffffff";
    ["P", "U", "B"].forEach((l, i) => g.fillText(l, 80, 84 + i * 156));
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 7.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }));
    placa.position.set(cx, y0 + H + 4.6, zf + 1.56);
    scene.add(placa);
    balada.placa = placa;
    const cv2 = document.createElement("canvas");
    cv2.width = 512; cv2.height = 96;
    const g2 = cv2.getContext("2d");
    g2.fillStyle = "#1c4fb8"; g2.fillRect(0, 0, 512, 96);
    g2.textAlign = "center"; g2.textBaseline = "middle";
    g2.font = '800 70px "Nunito Sans", "Segoe UI", sans-serif';
    g2.shadowColor = "#ffd43b"; g2.shadowBlur = 18; g2.fillStyle = "#fff3bf";
    g2.fillText("PUB", 256, 52);
    peca(new THREE.PlaneGeometry(5.4, 1.0), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv2) }), cx, y0 + 2.72, zf + 3.69);
    // Porta, tapete vermelho e cordão de entrada
    caixa(2.6, 2.7, 0.2, 0x0b0b0b, cx, y0, zf + 1.15, false);
    caixa(3.0, 0.2, 0.25, 0xd4a017, cx, y0 + 2.7, zf + 1.2, false);
    caixa(2.6, 0.06, 8.2, 0xc92a2a, cx, y0, zf + 5.3, false);
    // Luz amarela subindo pela fachada
    const texSobe = texturaCanvas(64, 128, (gg, w, h) => {
      const gr = gg.createLinearGradient(0, h, 0, 0);
      gr.addColorStop(0, "rgba(255,255,255,0.95)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      gg.fillStyle = gr; gg.fillRect(0, 0, w, h);
    });
    const mSobe = new THREE.MeshBasicMaterial({ map: texSobe, color: 0xffc94d, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    [-6.2, -3.4, 3.4, 6.2].forEach(dx => peca(new THREE.PlaneGeometry(1.6, 4.6), mSobe, cx + dx, y0 + H + 2.3, zf + 0.06));
    [-1, 1].forEach(s => { const m = peca(new THREE.PlaneGeometry(2.8, 5), mSobe, cx + s * WX, y0 + H + 2.5, zf + 0.62); });
    // Varanda com mesinhas, velinhas e floreiras vermelhas dos dois lados da entrada
    const vidroGrade = new THREE.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.3, roughness: 0.1 });
    [-1, 1].forEach(s => {
      const xa = cx + s * 2.2, xb = cx + s * 15;
      const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(xb - xa), 0.9, 0.08), vidroGrade);
      m.position.set((xa + xb) / 2, y0 + 0.45, zf + 4.1);
      scene.add(m);
      caixa(Math.abs(xb - xa), 0.08, 0.12, 0xadb5bd, (xa + xb) / 2, y0 + 0.9, zf + 4.1, false);
      bloqueia((xa + xb) / 2, zf + 4.1, Math.abs(xb - xa), 0.3);
      [5, 8.4, 11.8].forEach(dx => {
        const x = cx + s * dx, z = zf + 2.3;
        mesas.poe(x, y0, z, 0.8, 1, 0.8, 0, 0x2b2b2b);
        cadPlastico.poe(x - 0.95, y0, z, 1, 1, 1, Math.PI / 2, 0x6b4a35);
        cadPlastico.poe(x + 0.95, y0, z, 1, 1, 1, -Math.PI / 2, 0x6b4a35);
        peca(new THREE.SphereGeometry(0.1, 8, 6), luzAmarela, x, y0 + 1.1, z);
        bloqueia(x, z, 2.6, 1.3);
      });
      caixa(1.4, 0.7, 0.8, 0x5c3d2e, cx + s * 15.6, y0, zf + 4.1);
      peca(new THREE.SphereGeometry(0.7, 8, 6), 0xc92a2a, cx + s * 15.6, y0 + 1.15, zf + 4.1);
      peca(new THREE.SphereGeometry(0.45, 8, 6), 0x2f9e44, cx + s * 15.2, y0 + 1.4, zf + 3.8);
    });
    // Dois seguranças de preto e óculos escuros na porta
    [-1, 1].forEach(s => {
      const x = cx + s * 2.1, z = zf + 1.9;
      bonecoInst(x, y0, z, 0, estiloBoneco("seguranca-pub" + s, false, { camisa: 0x111111, calca: 0x111111, sapato: 0x0b0b0b, cabelo: 0x1d1d1d,
        extra: [[0.78, 0.16, 0.05, 0, 1.86, 0.45, 0x050505], [0.05, 0.3, 0.05, 0.5, 1.7, 0.2, 0x111111]] }));
      bloqueia(x, z, 0.9, 0.9);
    });

    const OURO = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.35, roughness: 0.32, emissive: 0x3a2a00, flatShading: true });
    const ouro = (geo, x, y, z) => {
      const m = new THREE.Mesh(geo, OURO);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    };
    [-1.6, 1.6].forEach(dx => {
      [3.2, 5.6, 8].forEach(dz => { ouro(new THREE.CylinderGeometry(0.1, 0.16, 1.2, 6), cx + dx, y0 + 0.6, zf + dz); bloqueia(cx + dx, zf + dz, 0.3, 0.3); });
      const corda = malha(new THREE.CylinderGeometry(0.06, 0.06, 4.8, 5), 0xc92a2a, cx + dx, y0 + 0.95, zf + 5.6, false);
      corda.rotation.x = Math.PI / 2;
    });
    // Leões dourados sentados, um de cada lado da entrada
    function leao(x, z, ry) {
      caixa(2.8, 1.8, 3.4, 0x2b2b2b, x, 0.3, z);
      ouro(new THREE.BoxGeometry(3, 0.2, 3.6), x, 2.2, z);
      bloqueia(x, z, 2.8, 3.4);
      const L = new THREE.Group();
      const parte = (geo, px, py, pz, sx = 1, sy = 1, sz = 1, rz = 0, rx = 0) => {
        const m = new THREE.Mesh(geo, OURO);
        m.position.set(px, py, pz);
        m.scale.set(sx, sy, sz);
        m.rotation.set(rx, 0, rz);
        m.castShadow = true;
        L.add(m);
      };
      parte(new THREE.SphereGeometry(1, 8, 6), 0, 0.95, -0.35, 1.1, 0.9, 1.25);
      parte(new THREE.SphereGeometry(1, 8, 6), 0, 1.75, 0.35, 0.85, 1.1, 0.85);
      [-0.42, 0.42].forEach(lx => {
        parte(new THREE.CylinderGeometry(0.22, 0.26, 1.6, 6), lx, 0.8, 0.85);
        parte(new THREE.BoxGeometry(0.48, 0.24, 0.62), lx, 0.12, 1.0);
      });
      parte(new THREE.IcosahedronGeometry(0.98, 0), 0, 2.75, 0.5);
      parte(new THREE.SphereGeometry(0.62, 8, 6), 0, 2.8, 0.95);
      parte(new THREE.BoxGeometry(0.56, 0.42, 0.42), 0, 2.6, 1.45);
      [-0.36, 0.36].forEach(ex => parte(new THREE.ConeGeometry(0.18, 0.36, 5), ex, 3.38, 0.85));
      parte(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 5), 0.85, 0.45, -1.15, 1, 1, 1, 1.25);
      parte(new THREE.SphereGeometry(0.2, 6, 5), 1.55, 0.75, -1.15);
      L.scale.set(1.35, 1.35, 1.35);
      L.position.set(x, 2.3, z);
      L.rotation.y = ry;
      scene.add(L);
    }
    leao(cx - 5, cz + 8.7, 0.18);
    leao(cx + 5, cz + 8.7, -0.18);

    // Duas palmeiras imperiais: tronco liso e cinza bem alto, palmito verde e folhas compridas caindo
    function palmeiraImperial(x, z) {
      const Ht = 15;
      peca(new THREE.CylinderGeometry(0.36, 0.55, Ht, 12), 0xb9b2a5, x, y0 + Ht / 2, z);
      peca(new THREE.CylinderGeometry(0.62, 0.55, 0.5, 12), 0xa39b8d, x, y0 + 0.25, z);
      peca(new THREE.CylinderGeometry(0.38, 0.38, 2.6, 12), 0x8cc63f, x, y0 + Ht + 1.3, z);
      const folhas = [];
      for (let k = 0; k < 11; k++) {
        const a = k / 11 * Math.PI * 2 + (k % 2) * 0.2, sobe = k % 3 === 0 ? 0.35 : 0;
        let px = 0, py = 0, inc = -0.5 - sobe;
        for (let j = 0; j < 5; j++) {
          const L = 1.25;
          folhas.push(new THREE.BoxGeometry(L, 0.06, 1.1 - j * 0.16).rotateZ(-inc).translate(px + Math.cos(inc) * L / 2, py - Math.sin(inc) * L / 2, 0).rotateY(a));
          px += Math.cos(inc) * L; py -= Math.sin(inc) * L;
          inc += 0.32;
        }
      }
      const copa = new THREE.Mesh(junta(folhas), mat(0x3f9142));
      copa.position.set(x, y0 + Ht + 2.4, z);
      copa.castShadow = true;
      scene.add(copa);
      bloqueia(x, z, 1.1, 1.1);
    }
    palmeiraImperial(cx - 12.5, cz + 8.3);
    palmeiraImperial(cx + 12.5, cz + 8.3);

    // Globo espelhado no alto da torre e os canhões de luz no céu
    malha(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 5), 0x868e96, cx, y0 + TH + 2.1 + 1.2, zf + 0.3, false);
    balada.globo = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), new THREE.MeshStandardMaterial({ color: 0xe9ecef, metalness: 0.5, roughness: 0.15, flatShading: true }));
    balada.globo.position.set(cx, y0 + TH + 4.8, zf + 0.3);
    balada.globo.castShadow = true;
    scene.add(balada.globo);
    const geoFeixe = new THREE.ConeGeometry(2.6, 46, 14, 1, true).rotateX(Math.PI).translate(0, 23, 0);
    [[0xff3fa4, -10], [0x3bc9db, 0], [0xfab005, 10]].forEach(([cor, dx], i) => {
      const f = new THREE.Mesh(geoFeixe, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      f.position.set(cx + dx, y0 + HT + 0.6, z0 - 1);
      f.userData.fase = i * 2.1;
      f.rotation.z = (i - 1) * 0.35;
      scene.add(f);
      balada.feixes.push(f);
    });
    rotuloFixo("Pub dos Leões", "#9c36b5", "#fffaf0", 1.1, cx, 24, z0);
  })();

  // ---------- Academia Pixel Fit: academia de treino na quadra logo depois da casa do @bruno.gats ----------
  const academia = { corredores: [], saco: null, barra: null };
  (function () {
    if (!especiais.academia) return;
    const { cx, cz } = especiais.academia;
    const y0 = 0.32, GRAF = 0x2b2b2b, AMAR = 0xfab005, PRETO = 0x1d1d1d, CROMO = 0xced4da;
    const W = 30, D = 14, zc = cz - 2.5, zf = zc + D / 2, HA = 9, HP = 4.4;
    caixa(42, 0.32, 20, 0x868e96, cx, 0, cz, false);
    // Estrutura: paredes grafite com faixa amarela, laje do 2º andar e frente toda de vidro
    caixa(W, HA, 0.5, GRAF, cx, y0, zc - D / 2 + 0.25); bloqueia(cx, zc - D / 2 + 0.25, W, 0.5);
    [-1, 1].forEach(s => {
      caixa(0.5, HA, D, GRAF, cx + s * (W / 2 - 0.25), y0, zc); bloqueia(cx + s * (W / 2 - 0.25), zc, 0.5, D);
      caixa(0.06, HA, 0.9, AMAR, cx + s * (W / 2 + 0.01), y0, zf - 1.4, false);
    });
    caixa(W + 0.6, 0.5, D + 0.6, GRAF, cx, y0 + HA, zc);
    caixa(W - 1, 0.05, D - 1, 0x1d1d1d, cx, y0, zc, false);
    caixa(W - 1, 0.3, D - 1.2, 0x495057, cx, y0 + HP, zc - 0.1, false);
    caixa(W - 1, 0.05, D - 1.2, 0x343a40, cx, y0 + HP + 0.3, zc - 0.1, false);
    const vidro = new THREE.Mesh(new THREE.BoxGeometry(W - 1, HA, 0.12), new THREE.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.3 }));
    vidro.position.set(cx, y0 + HA / 2, zf);
    scene.add(vidro);
    for (let k = 0; k <= 6; k++) caixa(0.2, HA, 0.28, PRETO, cx - (W - 1) / 2 + k * (W - 1) / 6, y0, zf, false);
    caixa(W - 1, 0.35, 0.3, PRETO, cx, y0 + HP, zf, false);
    bloqueia(cx - 8.5, zf, W - 1 - 12, 0.4); bloqueia(cx + 10.5, zf, 8, 0.4);
    // Letreiro no alto da fachada e um halterão gigante no telhado
    caixa(W + 0.6, 2.4, 0.5, 0x111111, cx, y0 + HA + 0.5, zf + 0.3);
    const cv = document.createElement("canvas");
    cv.width = 1024; cv.height = 160;
    const g = cv.getContext("2d");
    g.fillStyle = "#111111"; g.fillRect(0, 0, 1024, 160);
    g.fillStyle = "#fab005"; g.fillRect(0, 0, 1024, 10); g.fillRect(0, 150, 1024, 10);
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = '700 84px "Silkscreen", "Courier New", monospace'; g.fillStyle = "#fab005";
    g.fillText("PIXEL FIT", 512, 66);
    g.font = '800 34px "Nunito Sans", "Segoe UI", sans-serif'; g.fillStyle = "#ffffff";
    g.fillText("ACADEMIA · MUSCULAÇÃO · FUNCIONAL · 24H", 512, 124);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(W - 1, 2.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) }));
    pl.position.set(cx, y0 + HA + 1.7, zf + 0.56);
    scene.add(pl);
    const cil = (r, h, c, x, y, z, rz = 0, rx = 0, seg = 14) => { const m = malha(new THREE.CylinderGeometry(r, r, h, seg), c, x, y, z); m.rotation.set(rx, 0, rz); return m; };
    cil(0.25, 10, CROMO, cx, y0 + HA + 2.2, zc - 1, Math.PI / 2);
    [-1, 1].forEach(s => { cil(1.6, 0.7, PRETO, cx + s * 3.8, y0 + HA + 2.2, zc - 1, Math.PI / 2, 0, 18); cil(1.25, 0.6, AMAR, cx + s * 4.5, y0 + HA + 2.2, zc - 1, Math.PI / 2, 0, 18); });
    [-2.5, 2.5].forEach(dx => caixa(0.3, 1.0, 0.3, GRAF, cx + dx, y0 + HA + 0.5, zc - 1, false));

    // Térreo: espelho no fundo, rack de halteres, supino, gaiola de agachamento, saco de pancada e recepção
    const fundo = zc - D / 2 + 0.52;
    const esp = new THREE.Mesh(new THREE.PlaneGeometry(W - 2, 3.2), new THREE.MeshStandardMaterial({ color: 0xd0e3ee, metalness: 0.7, roughness: 0.08 }));
    esp.position.set(cx, y0 + 1.9, fundo + 0.01);
    scene.add(esp);
    caixa(9, 0.9, 1.1, GRAF, cx - 8, y0, fundo + 1.0, false);
    for (let k = 0; k < 9; k++) {
      const x = cx - 11.8 + k * 0.95, r = 0.13 + k * 0.012;
      cil(0.04, 0.5, CROMO, x, y0 + 1.05, fundo + 1.0, Math.PI / 2);
      [-0.22, 0.22].forEach(dx => cil(r, 0.1, PRETO, x + dx, y0 + 1.05, fundo + 1.0, Math.PI / 2, 0, 8));
    }
    bloqueia(cx - 8, fundo + 1.0, 9, 1.1);
    // Supino
    const sx = cx - 7, sz = zc + 0.5;
    caixa(0.6, 0.55, 2.0, PRETO, sx, y0, sz, false);
    caixa(0.62, 0.12, 2.0, 0xc92a2a, sx, y0 + 0.55, sz, false);
    [-0.7, 0.7].forEach(dx => caixa(0.12, 1.5, 0.12, CROMO, sx + dx, y0, sz - 0.8, false));
    cil(0.04, 2.6, CROMO, sx, y0 + 1.5, sz - 0.8, Math.PI / 2);
    [-1, 1].forEach(s => cil(0.42, 0.12, PRETO, sx + s * 1.05, y0 + 1.5, sz - 0.8, Math.PI / 2, 0, 16));
    bloqueia(sx, sz, 2.4, 2.4);
    // Gaiola de agachamento com alguém de barra nas costas
    const ax = cx + 1, az = zc - 1.5;
    [-1, 1].forEach(s => [-1, 1].forEach(t => caixa(0.14, 3.6, 0.14, PRETO, ax + s * 1.3, y0, az + t * 0.9, false)));
    [-1, 1].forEach(t => caixa(2.74, 0.14, 0.14, PRETO, ax, y0 + 3.6, az + t * 0.9, false));
    cil(0.04, 3.0, CROMO, ax, y0 + 1.85, az + 0.1, Math.PI / 2);
    [-1, 1].forEach(s => cil(0.45, 0.14, AMAR, ax + s * 1.2, y0 + 1.85, az + 0.1, Math.PI / 2, 0, 16));
    bonecoInst(ax, y0, az + 0.1, 0, estiloBoneco("academia-agacha", false, { camisa: 0x1c7ed6, calca: PRETO }));
    bloqueia(ax, az, 2.8, 2.0);
    // Saco de pancada balançando
    const bx = cx + 10, bz = zc - 0.5;
    caixa(0.12, 0.12, 0.12, PRETO, bx, y0 + HP - 0.12, bz, false);
    const saco = new THREE.Group();
    saco.position.set(bx, y0 + HP - 0.1, bz);
    const corrente = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 4), mat(0x868e96));
    corrente.position.y = -0.5; saco.add(corrente);
    const bolsa = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.9, 12), mat(0xc92a2a));
    bolsa.position.y = -1.95; bolsa.castShadow = true; saco.add(bolsa);
    scene.add(saco);
    academia.saco = saco;
    bonecoInst(bx, y0, bz + 1.3, Math.PI, estiloBoneco("academia-boxe", true, { camisa: PRETO, calca: 0xc92a2a, extra: [[0.34, 0.3, 0.34, -0.53, 0.7, 0.1, 0xc92a2a, "B0"], [0.34, 0.3, 0.34, 0.53, 0.7, 0.1, 0xc92a2a, "B1"]] }));
    bloqueia(bx, bz + 0.4, 1.4, 2.4);
    // Gente puxando halter na frente do espelho
    [[cx - 11, fundo + 2.6], [cx - 5, fundo + 2.6], [cx + 5.5, fundo + 2.0]].forEach(([x, z], k) => {
      bonecoInst(x, y0, z, Math.PI, estiloBoneco("academia-halter" + k, k === 1, { camisa: [0x2f9e44, 0xf06595, 0x343a40][k], calca: PRETO,
        extra: [[0.5, 0.12, 0.12, -0.53, 0.72, 0.12, PRETO, "B0"], [0.5, 0.12, 0.12, 0.53, 0.72, 0.12, PRETO, "B1"]] }));
      bloqueia(x, z, 0.9, 0.9);
    });
    // Recepção com catraca
    caixa(4, 1.2, 1.2, AMAR, cx + 10.5, y0, zf - 3.4); bloqueia(cx + 10.5, zf - 3.4, 4, 1.2);
    bonecoInst(cx + 10.5, y0, zf - 4.4, 0, estiloBoneco("academia-recepcao", true, { camisa: AMAR, calca: PRETO }));
    [-1, 1].forEach(s => caixa(0.4, 1.0, 0.8, CROMO, cx + 7.8 + s * 0.9, y0, zf - 1.6, false));

    // 2º andar: fileira de esteiras com gente correndo, de frente para o vidro
    const yE = y0 + HP + 0.35;
    for (let k = 0; k < 7; k++) {
      const x = cx - 12 + k * 3.4, z = zf - 2.6;
      caixa(1.0, 0.3, 2.2, PRETO, x, yE, z, false);
      caixa(0.9, 0.04, 1.8, 0x343a40, x, yE + 0.3, z - 0.05, false);
      [-0.45, 0.45].forEach(dx => caixa(0.08, 1.2, 0.08, CROMO, x + dx, yE + 0.3, z + 0.95, false));
      caixa(1.0, 0.35, 0.3, 0x111111, x, yE + 1.4, z + 0.95, false);
      caixa(0.6, 0.18, 0.02, 0x4dabf7, x, yE + 1.5, z + 0.79, false);
      if (k !== 3) academia.corredores.push({ partes: criaAndante(estiloBoneco("esteira" + k, k % 2 === 0, { calca: PRETO })), x, y: yE + 0.34, z: z - 0.2, fase: k * 1.1 });
    }
    // Bikes de spinning no fundo do 2º andar
    for (let k = 0; k < 5; k++) {
      const x = cx - 9 + k * 4.2, z = zc - 3;
      caixa(0.3, 0.9, 1.3, 0x343a40, x, yE, z, false);
      caixa(0.5, 0.12, 0.6, PRETO, x, yE + 0.95, z - 0.35, false);
      caixa(0.4, 0.1, 0.3, CROMO, x, yE + 1.2, z + 0.5, false);
      cil(0.35, 0.1, 0xc92a2a, x, yE + 0.45, z + 0.5, Math.PI / 2, 0, 12);
    }
    // Área externa: barras de calistenia (uma pessoa fazendo barra), pneus de crossfit e kettlebell
    const ex = cx + 18.2;
    [[zc - 4, 2.6], [zc + 0.5, 2.2]].forEach(([z, h]) => {
      [-1, 1].forEach(s => caixa(0.16, h, 0.16, 0x495057, ex + s * 1.1, y0, z, false));
      cil(0.05, 2.36, CROMO, ex, y0 + h, z, Math.PI / 2);
      bloqueia(ex, z, 2.4, 0.4);
    });
    const barra = bonecoMalhas(estiloBoneco("academia-barra", false, { camisa: 0xf8f9fa, calca: PRETO }));
    barra.userData.pivos.B0.rotation.x = Math.PI;
    barra.userData.pivos.B1.rotation.x = Math.PI;
    barra.position.set(ex, y0 + 0.2, zc - 4);
    scene.add(barra);
    academia.barra = barra;
    [[cx - 18, zc - 3], [cx - 18.3, zc + 1.2]].forEach(([x, z], k) => {
      const p = malha(new THREE.TorusGeometry(1.1, 0.42, 8, 18), PRETO, x, y0 + 0.42, z);
      p.rotation.x = Math.PI / 2;
      if (k) p.rotation.y = 0.2;
      bloqueia(x, z, 3, 3);
    });
    malha(new THREE.SphereGeometry(0.4, 10, 8), PRETO, cx - 16.2, y0 + 0.4, zf + 1.5);
    caixa(0.42, 0.1, 0.12, PRETO, cx - 16.2, y0 + 0.82, zf + 1.5, false);
    // Calçada da frente com vagas e dois alunos chegando
    for (let k = 0; k < 5; k++) caixa(0.12, 0.02, 4, 0xf8f9fa, cx - 4 + k * 3, y0, cz + 7.6, false);
    bonecoInst(cx + 6.5, y0, zf + 1.6, Math.PI, estiloBoneco("aluno-chegando1", false, { camisa: 0xe03131, calca: PRETO, extra: [[0.5, 0.4, 0.3, 0.6, 0.6, 0, 0x1c7ed6, "B1"]] }));
    bonecoInst(cx + 8.2, y0, zf + 2.4, Math.PI - 0.4, estiloBoneco("aluno-chegando2", true, { camisa: 0x9c36b5, calca: PRETO }));
    bloqueia(cx + 6.5, zf + 1.6, 0.9, 0.9); bloqueia(cx + 8.2, zf + 2.4, 0.9, 0.9);
    ents.push({ t: "Pixel Fit · academia de treino", h: "caraguapixel", k: "academia", oculto: true, x: cx, y: 15, z: zc, cor: "#e8590c", alvo: { x: cx, z: cz + 24, yaw: 0 } });
    rotuloFixo("Pixel Fit · academia", "#fab005", "#1d2a33", 1.1, cx, 17, zc);
  })();
  function atualizaAcademia(dt, t) {
    academia.corredores.forEach(c => {
      if (!reduz) c.fase += dt * 11;
      poeAndante(c.partes, c.x, c.y + (reduz ? 0 : Math.abs(Math.sin(c.fase)) * 0.08), c.z, 0, c.fase, !reduz);
    });
    if (academia.saco && !reduz) academia.saco.rotation.x = Math.sin(t * 3.2) * 0.22;
    if (academia.barra) academia.barra.position.y = 0.62 + (reduz ? 0 : 0.15 * Math.sin(t * 2.4));
  }

  // Prédios de frente para a Avenida da Praia
  (function () {
    const BR = 0xf8f9fa;
    // Janelas: umas acesas (luz amarela) e outras apagadas, em cada andar e em todas as fachadas
    const janAcesa = new THREE.InstancedMesh(UNIT, new THREE.MeshBasicMaterial({ color: 0xffd27a }), 4000);
    janAcesa.count = 0;
    janAcesa.frustumCulled = false;
    scene.add(janAcesa);
    instancias.push(janAcesa);
    const janApagada = inst(UNIT, 4000, 0x22303a);
    janApagada.castShadow = false;
    const janela = (x, y, z, ry) => poe(rand() < 0.6 ? janAcesa : janApagada, x, y, z, 1.1, 0.8, 0.14, ry);
    function faixas(x, y0, z, w, d, h, vidro) {
      for (let y = y0 + 1.6; y < y0 + h - 1; y += 3) {
        caixa(w + 0.12, 1.1, d + 0.12, vidro, x, y, z, false);
        for (let px = x - w / 2 + 1; px <= x + w / 2 - 0.9; px += 1.8) {
          janela(px, y + 0.15, z + d / 2 + 0.08, 0);
          janela(px, y + 0.15, z - d / 2 - 0.08, 0);
        }
        for (let pz = z - d / 2 + 1; pz <= z + d / 2 - 0.9; pz += 1.8) {
          janela(x + w / 2 + 0.08, y + 0.15, pz, Math.PI / 2);
          janela(x - w / 2 - 0.08, y + 0.15, pz, Math.PI / 2);
        }
      }
    }
    function faixasRedondas(x, y0, z, r, h, seg, vidro) {
      const apotema = r * Math.cos(Math.PI / seg), largura = 2 * r * Math.sin(Math.PI / seg);
      const porFace = Math.max(1, Math.floor(largura / 1.8));
      for (let y = y0 + 1.6; y < y0 + h - 1; y += 3) {
        malha(new THREE.CylinderGeometry(r + 0.08, r + 0.08, 1.1, seg), vidro, x, y + 0.55, z, false);
        for (let k = 0; k < seg; k++) {
          const tc = (k + 0.5) * Math.PI * 2 / seg, nx = Math.sin(tc), nz = Math.cos(tc);
          for (let j = 0; j < porFace; j++) {
            const off = (j - (porFace - 1) / 2) * 1.8;
            janela(x + nx * (apotema + 0.1) + nz * off, y + 0.15, z + nz * (apotema + 0.1) - nx * off, tc);
          }
        }
      }
    }
    function coqueiro(x, y, z, s = 1) {
      const tr = malha(new THREE.CylinderGeometry(0.14 * s, 0.24 * s, 4.4 * s, 5), C.tronco, x, y + 2.2 * s, z);
      tr.rotation.z = (rand() - 0.5) * 0.2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const f = malha(new THREE.BoxGeometry(2.6 * s, 0.1, 0.7 * s), C.mata, x + Math.cos(a) * 1.1 * s, y + 4.3 * s, z + Math.sin(a) * 1.1 * s);
        f.rotation.y = -a;
        f.rotation.z = -0.4;
      }
      for (let i = 0; i < 3; i++) malha(new THREE.SphereGeometry(0.2 * s, 6, 5), 0x6b4a35, x + Math.cos(i * 2.1) * 0.3 * s, y + 4.05 * s, z + Math.sin(i * 2.1) * 0.3 * s);
    }
    const y0 = 0.3;
    const TIPOS = {
      torre(x, z) {
        caixa(12, 44, 12, BR, x, y0, z);
        faixas(x, y0, z, 12, 12, 44, 0x4dabf7);
        caixa(5, 2.5, 5, 0xdee2e6, x, y0 + 44, z);
        malha(new THREE.CylinderGeometry(0.12, 0.12, 6, 5), 0x868e96, x + 1, y0 + 49.5, z);
        bloqueia(x, z, 12, 12);
      },
      sacadas(x, z) {
        caixa(19, 24, 11, 0xffa8a8, x, y0, z);
        faixas(x, y0, z, 19, 11, 24, 0x2b3a44);
        for (let y = y0 + 3; y < y0 + 24; y += 3) caixa(20.6, 0.25, 12.6, BR, x, y, z, false);
        caixa(19.4, 0.6, 11.4, BR, x, y0 + 24, z);
        bloqueia(x, z, 20.6, 12.6);
      },
      escalonado(x, z) {
        [[18, 14, 14], [14, 11, 10], [10, 8, 7]].reduce((base, [w, d, h]) => {
          caixa(w, h, d, 0xffd8a8, x, base, z);
          faixas(x, base, z, w, d, h, 0x2b3a44);
          caixa(w + 0.4, 0.5, d + 0.4, 0xe8590c, x, base + h, z, false);
          return base + h + 0.5;
        }, y0);
        bloqueia(x, z, 18, 14);
      },
      lazer(x, z) {
        const h = 26, w = 18, d = 14, topo = y0 + h;
        caixa(w, h, d, 0xfff3bf, x, y0, z);
        faixas(x, y0, z, w, d, h, 0x2b3a44);
        bloqueia(x, z, w, d);
        // Área de lazer na cobertura
        caixa(w, 0.35, d, 0xd9b38c, x, topo, z, false);
        caixa(8, 0.4, 4.6, 0x4dabf7, x - 2.5, topo + 0.2, z + 1.5, false);
        caixa(8.6, 0.3, 5.2, BR, x - 2.5, topo + 0.12, z + 1.5, false);
        const vidro = new THREE.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.35, roughness: 0.1 });
        [[w, 0.1, 0, d / 2], [w, 0.1, 0, -d / 2], [0.1, d, w / 2, 0], [0.1, d, -w / 2, 0]].forEach(([gw, gd, dx, dz]) => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(gw, 1.2, gd), vidro);
          m.position.set(x + dx, topo + 0.95, z + dz);
          scene.add(m);
        });
        coqueiro(x + 7, topo + 0.35, z + 5.2, 1.1);
        coqueiro(x + 7, topo + 0.35, z - 4.8, 1);
        coqueiro(x - 7.5, topo + 0.35, z - 5, 1.05);
        coqueiro(x + 2.6, topo + 0.35, z - 5.2, 0.9);
        [[3.6, 3.5, C.coral], [-6.5, -1.8, C.amarelo]].forEach(([dx, dz, cor]) => {
          malha(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 4), BR, x + dx, topo + 1.4, z + dz, false);
          malha(new THREE.ConeGeometry(1.5, 0.6, 8), cor, x + dx, topo + 2.6, z + dz);
          caixa(1.8, 0.3, 0.8, BR, x + dx + 1.4, topo + 0.35, z + dz, false);
        });
        caixa(3, 2.6, 3, 0xdee2e6, x - 6.5, topo + 0.35, z + 4.2);
      },
      redondo(x, z) {
        malha(new THREE.CylinderGeometry(7, 7, 38, 16), 0x63e6be, x, y0 + 19, z);
        faixasRedondas(x, y0, z, 7, 38, 16, 0x1d3557);
        malha(new THREE.CylinderGeometry(7.4, 7.4, 0.6, 16), BR, x, y0 + 38.3, z);
        bloqueia(x, z, 13, 13);
      },
      hexa(x, z) {
        malha(new THREE.CylinderGeometry(8, 8, 32, 6), 0xd27a4d, x, y0 + 16, z);
        faixasRedondas(x, y0, z, 8, 32, 6, 0x2b3a44);
        malha(new THREE.ConeGeometry(8.4, 3, 6), 0x8f4a3a, x, y0 + 33.5, z);
        bloqueia(x, z, 15, 15);
      },
      gemeos(x, z) {
        [-5.5, 5.5].forEach(dx => {
          caixa(8, 36, 12, 0xb197fc, x + dx, y0, z);
          faixas(x + dx, y0, z, 8, 12, 36, 0x1d3557);
          bloqueia(x + dx, z, 8, 12);
        });
        caixa(3.2, 3, 5, 0xe5dbff, x, y0 + 21, z);
      },
      jardim(x, z) {
        caixa(18, 0.36, 14, C.grama, x, 0, z, false);
        [[-6, -4], [6, -4], [-6, 4], [6, 4], [0, 0]].forEach(([dx, dz]) => palmeira(x + dx, z + dz));
      }
    };
    // Muro de pedra com grade de vidro em volta dos prédios da orla, portão e guarita de segurança
    const texPedra = cor => texturaCanvas(256, 96, (g, w, h) => {
      g.fillStyle = "#5c4b3b"; g.fillRect(0, 0, w, h);
      const r = semente(77);
      const CS = ["#b08d6a", "#c9a77a", "#9c7a58", "#d4b48c", "#a68462", "#8a6a4f", "#bfa07c"];
      for (let y = 0; y < h; y += 24) for (let x = (y / 24) % 2 ? -17 : 0; x < w; x += 34) {
        g.fillStyle = CS[Math.floor(r() * CS.length)];
        g.fillRect(x + 2 + r() * 2, y + 2 + r() * 2, 28 + r() * 4, 19);
      }
    }, cor, 1);
    const matPedraCurta = new THREE.MeshStandardMaterial({ map: texPedra(5), roughness: 0.95 });
    const matPedraLonga = new THREE.MeshStandardMaterial({ map: texPedra(12), roughness: 0.95 });
    const vidroMuro = new THREE.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.32, roughness: 0.1 });
    const postesMuro = inst(UNIT, 400, 0xdee2e6);
    const HM = 1.5, YM = 0.32;
    function trechoMuro(ax, az, bx, bz) {
      const horiz = Math.abs(bz - az) < 0.01, L = horiz ? Math.abs(bx - ax) : Math.abs(bz - az), x = (ax + bx) / 2, z = (az + bz) / 2;
      const w = horiz ? L : 0.5, d = horiz ? 0.5 : L;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, HM, d), L > 25 ? matPedraLonga : matPedraCurta);
      m.position.set(x, YM + HM / 2, z);
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m);
      caixa(w + 0.14, 0.14, d + 0.14, 0xe9e1d3, x, YM + HM, z, false);
      const v = new THREE.Mesh(new THREE.BoxGeometry(horiz ? L : 0.06, 1.0, horiz ? 0.06 : L), vidroMuro);
      v.position.set(x, YM + HM + 0.64, z);
      scene.add(v);
      const n = Math.max(1, Math.round(L / 1.6));
      for (let i = 0; i <= n; i++) poe(postesMuro, ax + (bx - ax) * i / n, YM + HM + 0.14, az + (bz - az) * i / n, 0.07, 1.06, 0.07);
      caixa(horiz ? L : 0.08, 0.06, horiz ? 0.08 : L, 0xdee2e6, x, YM + HM + 1.14, z, false);
      bloqueia(x, z, w, d);
    }
    function muroGuarita(cx, cz) {
      const zF = cz + 9.4, zB = cz - 9.4, xL = cx - 20.6, xR = cx + 20.6, gx = cx - 4.4;
      trechoMuro(xL, zF, gx - 1.45, zF);
      trechoMuro(cx + 2.6, zF, xR, zF);
      trechoMuro(xL, zB, xR, zB);
      trechoMuro(xL, zB, xL, zF);
      trechoMuro(xR, zB, xR, zF);
      // Guarita: cabine branca com vidro escuro em volta, teto saliente e luz na porta
      caixa(2.9, 2.7, 2.9, 0xf8f9fa, gx, YM, zF);
      caixa(2.96, 0.9, 2.96, 0x22303a, gx, YM + 1.25, zF, false);
      caixa(3.6, 0.25, 3.6, 0x495057, gx, YM + 2.7, zF);
      caixa(1.5, 0.3, 0.06, 0x1c7ed6, gx, YM + 2.25, zF + 1.5, false);
      bloqueia(gx, zF, 2.9, 2.9);
      // Portão de grade (fechado) entre a guarita e o muro
      const g0 = gx + 1.45, g1 = cx + 2.6;
      caixa(g1 - g0, 0.14, 0.14, 0x343a40, (g0 + g1) / 2, YM + 2.2, zF, false);
      caixa(g1 - g0, 0.14, 0.14, 0x343a40, (g0 + g1) / 2, YM + 0.15, zF, false);
      for (let x = g0 + 0.2; x < g1; x += 0.32) caixa(0.07, 2.2, 0.07, 0x343a40, x, YM + 0.1, zF, false);
      caixa(0.4, 2.6, 0.4, 0xe9e1d3, cx + 2.6, YM, zF);
      bloqueia((g0 + g1) / 2, zF, g1 - g0, 0.4);
      // Porteiro de uniforme na guarita
      bonecoInst(gx + 2.0, YM, zF - 1.6, 0, estiloBoneco("porteiro" + cx, false, { camisa: 0x1c3f7a, calca: 0x1d1d1d, sapato: 0x1d1d1d, chapeu: 0x1c3f7a }));
      bloqueia(gx + 2.0, zF - 1.6, 0.9, 0.9);
    }
    const ordem = ["torre", "sacadas", "escalonado", "lazer", "redondo", "hexa", "gemeos", "jardim"];
    let k = 0;
    (especiaisLista.predios || []).forEach(({ cx, cz }) => {
      caixa(42, 0.32, 20, 0xdcd6c8, cx, 0, cz, false);
      [-11, 11].forEach(dx => {
        const tipo = ordem[k++];
        if (tipo) TIPOS[tipo](cx + dx, cz + 0.5);
      });
      palmeira(cx - 18.6, cz + 8.0);
      palmeira(cx + 18.6, cz + 8.0);
      muroGuarita(cx, cz);
    });
  })();

  // Igreja branca e azul com torre do relógio, e praça enfeitada para o Natal
  const estrelasExtras = [];
  (function () {
    if (!especiais.igreja) return;
    const { cx, cz } = especiais.igreja;
    const BR = 0xf8f9fa, AZUL = 0x1c4fb8, zf = cz + 6, xc = cx + 8, zb = zf - 7;
    caixa(44, 0.32, 22, 0xd6d2ca, cx, 0, cz, false);

    // Nave com faixas e pilastras azuis
    caixa(16, 8, 14, BR, xc, 0.3, zb);
    caixa(16.2, 0.5, 14.2, AZUL, xc, 0.3, zb, false);
    caixa(16.6, 0.6, 14.6, AZUL, xc, 7.9, zb, false);
    [-8, 8].forEach(dx => caixa(0.9, 8, 0.3, AZUL, xc + dx, 0.3, zf + 0.1, false));
    bloqueia(xc, zb, 16, 14);
    const telhado = malha(new THREE.CylinderGeometry(1, 1, 1, 3).rotateX(Math.PI / 2).rotateZ(Math.PI), 0xc4553b, xc, 9.3, zb - 0.5);
    telhado.scale.set(8.2 / 0.866, 2, 13.6);
    // Porta branca com moldura em arco azul
    caixa(2.6, 3.2, 0.15, 0xf1f3f5, xc, 0.8, zf + 0.08, false);
    [-1.5, 1.5].forEach(dx => caixa(0.35, 3.3, 0.2, AZUL, xc + dx, 0.8, zf + 0.12, false));
    const arco = malha(new THREE.TorusGeometry(1.5, 0.18, 6, 14, Math.PI), AZUL, xc, 4.0, zf + 0.12, false);
    arco.castShadow = false;
    // Três janelas de vitral
    [-3.2, 0, 3.2].forEach(dx => {
      caixa(1.7, 1.9, 0.1, AZUL, xc + dx, 5.9, zf + 0.06, false);
      caixa(1.3, 1.5, 0.14, 0x91a7ff, xc + dx, 6.1, zf + 0.08, false);
      caixa(0.08, 1.5, 0.16, AZUL, xc + dx, 6.1, zf + 0.09, false);
    });
    // Frontão barroco com contorno azul e cruz
    const forma = new THREE.Shape();
    forma.moveTo(-4.6, 0); forma.lineTo(-4.6, 0.6);
    forma.quadraticCurveTo(-4.6, 1.6, -3.4, 1.6); forma.lineTo(-2.6, 1.6);
    forma.quadraticCurveTo(-2.6, 3.2, 0, 3.4); forma.quadraticCurveTo(2.6, 3.2, 2.6, 1.6);
    forma.lineTo(3.4, 1.6); forma.quadraticCurveTo(4.6, 1.6, 4.6, 0.6); forma.lineTo(4.6, 0); forma.lineTo(-4.6, 0);
    const geoFrontao = new THREE.ExtrudeGeometry(forma, { depth: 0.8, bevelEnabled: false });
    malha(geoFrontao, BR, xc, 8.5, zf - 0.8);
    const contorno = malha(geoFrontao, AZUL, xc, 8.35, zf - 0.86, false);
    contorno.scale.set(1.07, 1.08, 1);
    caixa(0.22, 1.6, 0.22, BR, xc, 11.9, zf - 0.4);
    caixa(1.0, 0.22, 0.22, BR, xc, 12.8, zf - 0.4, false);
    [-4.6, 4.6].forEach(dx => malha(new THREE.ConeGeometry(0.3, 0.8, 8), AZUL, xc + dx, 9.3, zf - 0.4, false));
    // Torre do sino com relógio
    const tx = xc + 10.5, tz = zf - 2.5;
    caixa(5, 14, 5, BR, tx, 0.3, tz);
    [[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]].forEach(([dx, dz]) => caixa(0.6, 14, 0.6, AZUL, tx + dx, 0.3, tz + dz, false));
    caixa(5.6, 0.5, 5.6, AZUL, tx, 7.9, tz, false);
    caixa(5.8, 0.6, 5.8, AZUL, tx, 14.2, tz, false);
    const aro = malha(new THREE.CylinderGeometry(0.95, 0.95, 0.12, 20).rotateX(Math.PI / 2), AZUL, tx, 11.6, zf + 0.06, false);
    aro.castShadow = false;
    malha(new THREE.CylinderGeometry(0.75, 0.75, 0.14, 20).rotateX(Math.PI / 2), BR, tx, 11.6, zf + 0.1, false);
    caixa(0.08, 0.6, 0.05, C.tinta, tx, 11.6, zf + 0.18, false);
    const ponteiro = caixa(0.08, 0.45, 0.05, C.tinta, tx, 11.6, zf + 0.19, false);
    ponteiro.rotation.z = -1.2;
    caixa(1.5, 2, 0.12, AZUL, tx, 8.8, zf + 0.06, false);
    caixa(1.1, 1.6, 0.14, 0xe9ecef, tx, 9.0, zf + 0.08, false);
    const topo = malha(new THREE.ConeGeometry(3.3, 2.6, 4), AZUL, tx, 16.1, tz);
    topo.rotation.y = Math.PI / 4;
    caixa(1.2, 1.2, 1.2, AZUL, tx, 17.2, tz);
    caixa(0.2, 1.6, 0.2, BR, tx, 18.4, tz);
    caixa(0.9, 0.2, 0.2, BR, tx, 19.3, tz, false);
    bloqueia(tx, tz, 5.2, 5.2);
    // Escadaria com corrimãos
    caixa(10, 0.3, 2.4, 0xcfd8e3, xc, 0, zf + 1.2, false);
    caixa(8, 0.3, 1.2, 0xcfd8e3, xc, 0.3, zf + 0.6, false);
    [-3.6, 3.6].forEach(dx => {
      [0.3, 2.2].forEach(dz => caixa(0.08, 1.1, 0.08, BR, xc + dx, 0.3, zf + dz, false));
      caixa(0.08, 0.08, 2.0, BR, xc + dx, 1.4, zf + 1.25, false);
    });
    rotuloFixo("Igreja", "#1c4fb8", "#fffaf0", 1, tx, 23, tz);

    // Praça de Natal ao lado da igreja
    const px = cx - 11;
    caixa(20, 0.35, 20, C.grama, px, 0, cz, false);
    caixa(2.4, 0.36, 20, C.calcada, px, 0, cz, false);
    caixa(20, 0.36, 2.4, C.calcada, px, 0, cz, false);
    // Árvore de Natal menor
    malha(new THREE.CylinderGeometry(0.5, 0.65, 2.4, 6), C.tronco, px, 1.5, cz);
    const niveis = [[4.6, 5, 2.4], [3.6, 4.2, 5.6], [2.6, 3.4, 8.3], [1.6, 2.6, 10.6]];
    niveis.forEach(([r, h, y]) => { malha(new THREE.ConeGeometry(r, h, 9), 0x1f7a3a, px, y + h / 2, cz).rotation.y = rand() * 3; });
    bloqueia(px, cz, 7, 7);
    const estrela = malha(new THREE.OctahedronGeometry(1, 0), 0xffd43b, px, 14, cz);
    estrela.material = new THREE.MeshBasicMaterial({ color: 0xffd43b });
    estrelasExtras.push(estrela);
    const bolas = paleta(new THREE.SphereGeometry(0.32, 8, 6), 50);
    niveis.forEach(([r, h, y], n) => {
      for (let i = 0; i < [12, 10, 8, 5][n]; i++) {
        const f = 0.12 + rand() * 0.62, a = rand() * Math.PI * 2, rr = r * (1 - f) + 0.2;
        bolas.poe(px + Math.cos(a) * rr, y + f * h, cz + Math.sin(a) * rr, 1, 1, 1, 0, escolhe([0xe03131, 0xfab005, 0x1c7ed6, 0xdee2e6]));
      }
    });
    for (let k = 0; k <= 90; k++) {
      const f = k / 90, y = 2.7 + f * 10.6, rr = 4.7 * (1 - (y - 2.4) / 11.6) + 0.3, a = f * Math.PI * 2 * 5;
      luz(px + Math.cos(a) * rr, y, cz + Math.sin(a) * rr);
    }
    // Presentes
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.5, x = px + Math.cos(a) * 5.3, z = cz + Math.sin(a) * 5.3, s = 0.8 + rand() * 0.6;
      const [c1, c2] = escolhe([[0xe03131, 0xfab005], [0x1c7ed6, 0xf8f9fa], [0x2f9e44, 0xe03131], [0x9c36b5, 0xfab005]]);
      caixa(s, s, s, c1, x, 0.35, z).rotation.y = a;
      caixa(s + 0.05, s + 0.05, s * 0.2, c2, x, 0.33, z, false).rotation.y = a;
      caixa(s * 0.2, s + 0.05, s + 0.05, c2, x, 0.33, z, false).rotation.y = a;
      bloqueia(x, z, s, s);
    }
    // Presépio
    const ex = px - 6, ez = cz - 6;
    [[-1.8, -1.2], [1.8, -1.2], [-1.8, 1.2], [1.8, 1.2]].forEach(([dx, dz]) => caixa(0.2, 2.8, 0.2, C.tronco, ex + dx, 0.35, ez + dz, false));
    const teto = caixa(4.4, 0.25, 3.4, 0x8a5a3b, ex, 3.1, ez);
    teto.rotation.x = 0.18;
    caixa(1.2, 0.4, 0.6, 0x8a5a3b, ex, 0.35, ez);
    caixa(1.0, 0.15, 0.5, 0xf2d16b, ex, 0.75, ez, false);
    malha(new THREE.SphereGeometry(0.16, 6, 5), C.pele, ex, 0.95, ez);
    [[-1.0, 0x1c7ed6], [1.0, 0x8a5a3b]].forEach(([dx, cor]) => {
      malha(new THREE.CylinderGeometry(0.3, 0.42, 1.3, 7), cor, ex + dx, 1.0, ez + 0.2);
      malha(new THREE.IcosahedronGeometry(0.28, 0), C.pele, ex + dx, 1.9, ez + 0.2);
    });
    malha(new THREE.OctahedronGeometry(0.3, 0), 0xffd43b, ex, 3.8, ez + 0.6);
    bloqueia(ex, ez, 4, 3);
    // Bancos e varal de luzes em volta da praça
    [[px - 6, cz + 6], [px + 6, cz + 6], [px + 6, cz - 6]].forEach(([x, z]) => { caixa(2.4, 0.5, 0.7, C.tronco, x, 0.35, z, false); bloqueia(x, z, 2.4, 0.7); });
    const P = [[-9.5, -9.5], [9.5, -9.5], [9.5, 9.5], [-9.5, 9.5]];
    P.forEach(([dx, dz]) => { caixa(0.22, 4, 0.22, C.tinta, px + dx, 0.3, cz + dz); bloqueia(px + dx, cz + dz, 0.4, 0.4); });
    P.forEach(([ax, az], i) => {
      const [bx, bz] = P[(i + 1) % P.length];
      const n = Math.round(Math.hypot(bx - ax, bz - az) / 1.2);
      for (let k = 1; k < n; k++) {
        const u = k / n;
        luz(px + ax + (bx - ax) * u, 4.1 - Math.sin(Math.PI * u) * 1.1, cz + az + (bz - az) * u);
      }
    });
    luzMalhas.forEach(m => { m.instanceMatrix.needsUpdate = true; });
    rotuloFixo("Praça de Natal", "#e03131", "#fffaf0", 0.9, px, 17, cz);
  })();

  // ---------- Hospital (com ambulância) e UPA 24h ----------
  const sirenes = [];
  (function () {
    const BR = 0xf8f9fa, AZUL = 0x1c7ed6, VERM = 0xe03131;
    const placa = (texto, fundo, cor, w, h, x, y, z) => {
      const cv = document.createElement("canvas");
      cv.width = 512; cv.height = Math.round(512 * h / w);
      const g = cv.getContext("2d");
      g.fillStyle = fundo; g.fillRect(0, 0, cv.width, cv.height);
      g.fillStyle = cor; g.textAlign = "center"; g.textBaseline = "middle";
      g.font = `800 ${Math.round(cv.height * 0.62)}px "Nunito Sans", "Segoe UI", sans-serif`;
      g.fillText(texto, 256, cv.height / 2 + 2);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) }));
      m.position.set(x, y, z);
      scene.add(m);
      return m;
    };
    const cruz = (x, y, z, s = 1) => {
      caixa(2.2 * s, 2.2 * s, 0.12, BR, x, y - 1.1 * s, z, false);
      caixa(1.6 * s, 0.5 * s, 0.16, VERM, x, y - 0.25 * s, z + 0.02, false);
      caixa(0.5 * s, 1.6 * s, 0.16, VERM, x, y - 0.8 * s, z + 0.02, false);
    };
    const janelas = (x0, x1, y0, nAnd, zf) => {
      for (let a = 0; a < nAnd; a++) for (let x = x0; x <= x1; x += 2.2) {
        const acesa = rand() < 0.55;
        const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 0.12), acesa ? new THREE.MeshBasicMaterial({ color: 0xfff3bf }) : mat(0x5c7c99));
        m.position.set(x, y0 + a * 3.2, zf);
        scene.add(m);
      }
    };
    // Ambulância branca com faixa vermelha, cruz e sirene piscando
    function ambulancia(x, z, ry) {
      const g = new THREE.Group();
      const add = (geo, cor, px, py, pz) => { const m = new THREE.Mesh(geo, typeof cor === "number" ? mat(cor) : cor); m.position.set(px, py, pz); m.castShadow = true; g.add(m); return m; };
      add(new THREE.BoxGeometry(3.6, 2.2, 2.1), BR, -0.6, 1.55, 0);
      add(new THREE.BoxGeometry(1.5, 1.5, 2.0), BR, 1.95, 1.2, 0);
      add(new THREE.BoxGeometry(0.06, 0.7, 1.8), 0x2b3a44, 2.71, 1.55, 0);
      [-1.06, 1.06].forEach(s => add(new THREE.BoxGeometry(0.9, 0.6, 0.04), 0x2b3a44, 1.9, 1.6, s));
      add(new THREE.BoxGeometry(5.12, 0.3, 2.14), VERM, 0.1, 1.0, 0);
      [-1.07, 1.07].forEach(s => {
        add(new THREE.BoxGeometry(0.9, 0.25, 0.04), VERM, -0.6, 1.9, s);
        add(new THREE.BoxGeometry(0.25, 0.9, 0.04), VERM, -0.6, 1.9, s);
      });
      const azul = new THREE.MeshBasicMaterial({ color: 0x4dabf7 }), vermelho = new THREE.MeshBasicMaterial({ color: 0xff2b2b });
      add(new THREE.BoxGeometry(0.4, 0.22, 0.6), vermelho, 1.6, 2.06, -0.4);
      add(new THREE.BoxGeometry(0.4, 0.22, 0.6), azul, 1.6, 2.06, 0.4);
      sirenes.push({ a: vermelho, b: azul });
      [[1.8, 1], [-1.6, 1], [1.8, -1], [-1.6, -1]].forEach(([px, s]) => add(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12).rotateX(Math.PI / 2), 0x1d1d1d, px, 0.42, s * 0.95));
      g.position.set(x, 0.32, z);
      g.rotation.y = ry;
      scene.add(g);
      bloqueia(x, z, 5.4, 5.4);
    }

    // Hospital: prédio de 4 andares, cruz vermelha, marquise de emergência e heliponto no teto
    if (especiais.hospital) {
      const { cx, cz } = especiais.hospital;
      const zb = cz - 3, zf = zb + 6;
      caixa(44, 0.32, 22, 0xe9ecef, cx, 0, cz, false);
      caixa(30, 13, 12, 0xf1f3f5, cx - 4, 0.32, zb);
      caixa(30.4, 0.6, 12.4, AZUL, cx - 4, 13.32, zb, false);
      janelas(cx - 17, cx + 9, 4.9, 3, zf + 0.06);
      bloqueia(cx - 4, zb, 30, 12);
      cruz(cx + 13, 12.8, zf + 0.1, 1.4);
      placa("HOSPITAL MUNICIPAL", AZUL === 0 ? "#fff" : "#1c7ed6", "#ffffff", 14, 1.6, cx - 4, 12.3, zf + 0.08);
      // Marquise da emergência
      caixa(12, 0.4, 5, BR, cx - 4, 3.6, zf + 2.5);
      [-9.6, 1.6].forEach(dx => caixa(0.35, 3.6, 0.35, 0xadb5bd, cx + dx, 0.32, zf + 4.7));
      placa("EMERGÊNCIA", "#e03131", "#ffffff", 7, 1.0, cx - 4, 3.3, zf + 5.02);
      caixa(4, 2.8, 0.12, 0x2b3a44, cx - 4, 0.32, zf + 0.07, false);
      // Heliponto
      malha(new THREE.CylinderGeometry(4.2, 4.2, 0.2, 24), 0x495057, cx - 4, 13.95, zb);
      caixa(0.6, 0.06, 3.2, BR, cx - 5.2, 14.05, zb, false);
      caixa(0.6, 0.06, 3.2, BR, cx - 2.8, 14.05, zb, false);
      caixa(1.8, 0.06, 0.6, BR, cx - 4, 14.05, zb, false);
      // Ambulância na frente da emergência e estacionamento
      ambulancia(cx - 4, zf + 7.6, 0);
      for (let k = 0; k < 4; k++) caixa(0.15, 0.02, 4, BR, cx + 6 + k * 3, 0.33, zf + 6, false);
      rotuloFixo("Hospital", "#e03131", "#fffaf0", 1.2, cx - 4, 19, zb);
    }

    // UPA 24h: térreo comprido branco e azul, com faixa vermelha e entrada coberta
    if (especiais.upa) {
      const { cx, cz } = especiais.upa;
      const zb = cz - 2, zf = zb + 5;
      caixa(44, 0.32, 22, 0xe9ecef, cx, 0, cz, false);
      caixa(28, 5, 10, BR, cx, 0.32, zb);
      caixa(28.3, 0.8, 10.3, AZUL, cx, 4.6, zb, false);
      caixa(28.2, 0.4, 10.2, VERM, cx, 1.2, zb, false);
      janelas(cx - 12, cx + 12, 2.3, 1, zf + 0.06);
      bloqueia(cx, zb, 28, 10);
      placa("UPA 24h", "#1c7ed6", "#ffffff", 8, 1.6, cx - 6, 6.5, zf + 0.1);
      caixa(9, 1.8, 0.2, AZUL, cx - 6, 5.6, zf, false);
      cruz(cx + 8, 7.3, zf + 0.1, 1.1);
      caixa(9, 0.35, 4, BR, cx + 2, 3.4, zf + 2);
      [-2.2, 6.2].forEach(dx => caixa(0.3, 3.1, 0.3, 0xadb5bd, cx + dx, 0.32, zf + 3.8));
      caixa(3.2, 2.6, 0.12, 0x2b3a44, cx + 2, 0.32, zf + 0.07, false);
      ambulancia(cx + 12, zf + 6, Math.PI / 2);
      [[-16, 8], [16, -6], [-18, -8]].forEach(([dx, dz]) => arvore(cx + dx, cz + dz, 1.1));
      rotuloFixo("UPA 24h", "#1c7ed6", "#fffaf0", 1.1, cx, 11, zb);
    }
  })();

  // ---------- Galeria Pixel: 8 lojas comerciais disponíveis para alugar ----------
  (function () {
    if (!especiais.galeria) return;
    const { cx, cz } = especiais.galeria;
    const zb = cz - 3, zf = zb + 4, CREME = 0xf1e3c8, GRAF = 0x343a40, BR = 0xf8f9fa;
    const placaCv = (w, h, desenha) => {
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      desenha(cv.getContext("2d"), w, h);
      return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) });
    };
    const plano = (m, w, h, x, y, z) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); scene.add(p); return p; };
    // Piso, estacionamento e calçada
    caixa(44, 0.32, 22, 0xd6d2ca, cx, 0, cz, false);
    caixa(44, 0.04, 7.4, 0x5a646d, cx, 0.32, cz + 7.2, false);
    for (let k = 0; k < 13; k++) caixa(0.12, 0.02, 4.2, BR, cx - 19.5 + k * 3.25, 0.37, cz + 6.6, false);
    // Prédio da galeria
    caixa(41, 4.6, 8, CREME, cx, 0.32, zb);
    caixa(41.4, 1.1, 8.4, GRAF, cx, 4.92, zb);
    bloqueia(cx, zb, 41, 8);
    plano(placaCv(1024, 64, (g, w, h) => {
      g.fillStyle = "#343a40"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#ffd43b"; g.textAlign = "center"; g.textBaseline = "middle";
      g.font = '800 44px "Nunito Sans", "Segoe UI", sans-serif';
      g.fillText("GALERIA PIXEL · LOJAS PARA ALUGAR · @caraguapixel", w / 2, h / 2 + 2);
    }), 40, 1.0, cx, 5.47, zf + 0.22);
    // Marquise contínua
    caixa(41.4, 0.3, 2.6, BR, cx, 3.55, zf + 1.3);
    for (let k = 0; k < 9; k++) { caixa(0.25, 3.25, 0.25, 0xadb5bd, cx - 20.4 + k * 5.1, 0.32, zf + 2.45, false); bloqueia(cx - 20.4 + k * 5.1, zf + 2.45, 0.3, 0.3); }
    // 8 lojas: porta de aço fechada, placa ALUGA-SE e número
    for (let n = 0; n < 8; n++) {
      const x = cx - 17.85 + n * 5.1;
      if (n) caixa(0.45, 4.3, 0.2, GRAF, x - 2.55, 0.32, zf + 0.06, false);
      caixa(4.3, 3.0, 0.1, 0x9aa3ab, x, 0.32, zf + 0.06, false);
      for (let k = 1; k < 8; k++) caixa(4.3, 0.04, 0.12, 0x7b858e, x, 0.32 + k * 0.38, zf + 0.08, false);
      plano(placaCv(256, 128, (g, w, h) => {
        g.fillStyle = "#fffaf0"; g.fillRect(0, 0, w, h);
        g.strokeStyle = "#e03131"; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
        g.fillStyle = "#e03131"; g.textAlign = "center"; g.textBaseline = "middle";
        g.font = '800 54px "Nunito Sans", "Segoe UI", sans-serif'; g.fillText("ALUGA-SE", w / 2, 50);
        g.fillStyle = "#1d2a33"; g.font = '700 26px "Nunito Sans", "Segoe UI", sans-serif'; g.fillText("@caraguapixel", w / 2, 96);
      }), 2.4, 1.2, x, 1.9, zf + 0.14);
      plano(placaCv(128, 48, (g, w, h) => {
        g.fillStyle = "#ffd43b"; g.fillRect(0, 0, w, h);
        g.fillStyle = "#1d2a33"; g.textAlign = "center"; g.textBaseline = "middle";
        g.font = '800 30px "Nunito Sans", "Segoe UI", sans-serif'; g.fillText("LOJA " + (n + 1), w / 2, h / 2 + 1);
      }), 1.6, 0.6, x, 3.1, zf + 0.12);
      // Cada loja aparece na busca e no clique, com o @ para falar sobre o aluguel
      ents.push({ t: `Loja ${n + 1} · disponível para alugar`, h: "caraguapixel", k: "loja", x, y: 7.6, z: zf, cor: "#f59f00", alvo: { x, z: cz + 13, yaw: 0 } });
    }
    // Totem na esquina
    caixa(0.4, 6, 0.4, GRAF, cx + 20, 0.32, cz + 9.5);
    caixa(3.4, 2.4, 0.4, GRAF, cx + 20, 4.6, cz + 9.5);
    plano(placaCv(256, 180, (g, w, h) => {
      g.fillStyle = "#f59f00"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#1d2a33"; g.textAlign = "center"; g.textBaseline = "middle";
      g.font = '800 40px "Silkscreen", "Courier New", monospace'; g.fillText("GALERIA", w / 2, 46);
      g.fillText("PIXEL", w / 2, 92);
      g.font = '800 24px "Nunito Sans", "Segoe UI", sans-serif'; g.fillText("8 lojas p/ alugar", w / 2, 146);
    }), 3.1, 2.2, cx + 20, 5.8, cz + 9.72);
    bloqueia(cx + 20, cz + 9.5, 3.4, 0.6);
    rotuloFixo("Galeria Pixel · 8 lojas para alugar", "#f59f00", "#1d2a33", 1, cx, 11, zb);
  })();

  // ---------- Parque de Diversões na praia: roda-gigante, kamikaze, montanha-russa, bate-bate, barracas, fantasiados e a carreta ----------
  const parque = { roda: null, gondolas: [], kami: null, carrinhos: [], trem: [], pista: null, s: 0, fantasias: [] };
  const luzA = new THREE.MeshBasicMaterial({ color: 0xffe066 }), luzB = new THREE.MeshBasicMaterial({ color: 0xff8787 });
  (function () {
    const { x0, x1, z0 } = PQ, BR = 0xf8f9fa, ROSA = 0xe64980, AMAR = 0xfab005, VERM = 0xe03131, AZUL = 0x1c7ed6, ROXO = 0x9c36b5, PRETO = 0x1d1d1d;
    const fonte = p => `800 ${p}px "Nunito Sans", "Segoe UI", sans-serif`;
    // Placa com texto que encolhe até caber (nada cortado)
    function placaTxt(linhas, w, h, fundo, cor, borda) {
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      const g = cv.getContext("2d");
      g.fillStyle = fundo; g.fillRect(0, 0, w, h);
      if (borda) { const lw = Math.max(6, h * 0.07); g.strokeStyle = borda; g.lineWidth = lw; g.strokeRect(lw / 2, lw / 2, w - lw, h - lw); }
      g.fillStyle = cor; g.textAlign = "center"; g.textBaseline = "middle";
      linhas.forEach(([txt, px, y]) => {
        g.font = fonte(px);
        while (g.measureText(txt).width > w * 0.9 && px > 10) g.font = fonte(px -= 2);
        g.fillText(txt, w / 2, y);
      });
      const tex = new THREE.CanvasTexture(cv);
      tex.anisotropy = 4;
      return new THREE.MeshBasicMaterial({ map: tex });
    }
    function plano(m, w, h, x, y, z, ry = 0) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      p.position.set(x, y, z);
      p.rotation.y = ry;
      scene.add(p);
      return p;
    }
    function viga(ax, ay, az, bx, by, bz, e, cor) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(e, e, Math.hypot(bx - ax, by - ay, bz - az)), mat(cor));
      m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
      m.lookAt(bx, by, bz);
      m.castShadow = true;
      scene.add(m);
      return m;
    }
    function grupo(x, y, z) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.p = (w, h, d, c, px, py, pz) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), c.isMaterial ? c : mat(c));
        m.position.set(px, py, pz);
        m.castShadow = true;
        g.add(m);
        return m;
      };
      scene.add(g);
      return g;
    }
    const geoLampada = new THREE.SphereGeometry(0.2, 6, 5);
    const lampada = (x, y, z, k) => { const m = new THREE.Mesh(geoLampada, k % 2 ? luzA : luzB); m.position.set(x, y, z); scene.add(m); return m; };
    const ent = (t, x, y, z, alvo) => ents.push({ t, h: "caraguapixel", k: "parque", oculto: true, x, y, z, cor: "#e64980", alvo });

    // Piso do parque (sobre a grama, até encostar na areia) e a pracinha da frente
    caixa(x1 + 12 - x0, 0.12, 34 - z0, 0xdcc6a2, (x0 + x1 + 12) / 2, 0, (z0 + 34) / 2, false);
    caixa(x1 - x0 - 2, 0.02, 10, 0xf6c6d8, (x0 + x1) / 2, 0.12, 16, false);

    // Cerca rosa e branca com o portão virado para a cidade
    const cercaP = inst(UNIT, 140, BR);
    function cerca(ax, az, bx, bz) {
      const len = Math.hypot(bx - ax, bz - az), n = Math.ceil(len / 3), horiz = Math.abs(bz - az) < 0.01;
      for (let i = 0; i <= n; i++) poe(cercaP, ax + (bx - ax) * i / n, 0.12, az + (bz - az) * i / n, 0.22, 1.5, 0.22);
      [0.6, 1.3].forEach(y => caixa(horiz ? len : 0.12, 0.12, horiz ? 0.12 : len, ROSA, (ax + bx) / 2, y, (az + bz) / 2, false));
      bloqueia((ax + bx) / 2, (az + bz) / 2, horiz ? len : 0.4, horiz ? 0.4 : len);
    }
    const GZ = 16;
    cerca(x0, z0, x1, z0);
    cerca(x0, z0, x0, 33);
    cerca(x1, z0, x1, GZ - 7);
    cerca(x1, GZ + 7, x1, 33);
    [GZ - 7, GZ + 7].forEach((z, i) => {
      caixa(1.6, 7.6, 1.6, i ? AZUL : ROSA, x1, 0.12, z);
      malha(new THREE.ConeGeometry(1.3, 1.8, 4), AMAR, x1, 8.6, z).rotation.y = Math.PI / 4;
      bloqueia(x1, z, 1.7, 1.7);
    });
    caixa(1.0, 2.4, 15.6, ROSA, x1, 5.6, GZ, false);
    const mPortal = placaTxt([["PARQUE DE DIVERSÕES", 74, 62], ["CARAGUA PIXEL", 42, 130]], 1024, 168, "#e64980", "#fffaf0", "#fab005");
    plano(mPortal, 13.6, 2.2, x1 + 0.52, 6.8, GZ, Math.PI / 2);
    plano(mPortal, 13.6, 2.2, x1 - 0.52, 6.8, GZ, -Math.PI / 2);
    for (let k = 0; k < 11; k++) lampada(x1 + 0.6, 8.25, GZ - 7 + k * 1.4, k);
    // Bilheteria logo depois do portão
    caixa(3, 2.8, 3, AMAR, x1 - 4.5, 0.12, GZ - 9.5);
    caixa(3.4, 0.3, 3.4, ROSA, x1 - 4.5, 2.92, GZ - 9.5);
    caixa(0.05, 0.9, 1.6, 0x2b3a44, x1 - 2.98, 1.0, GZ - 9.5, false);
    plano(placaTxt([["BILHETERIA", 56, 42]], 384, 84, "#1c7ed6", "#fffaf0"), 2.8, 0.62, x1 - 2.96, 2.3, GZ - 9.5, Math.PI / 2);
    bloqueia(x1 - 4.5, GZ - 9.5, 3, 3);
    ent("Parque de Diversões · entrada", x1, 12, GZ, { x: x1 + 13, z: GZ, yaw: Math.PI / 2 });

    // Roda-gigante: aro com lâmpadas, raios e 12 cabines que ficam sempre em pé
    const HX = x0 + 20, HZ = z0 + 17, HY = 16, R = 12;
    caixa(18, 0.4, 8, 0xced4da, HX, 0.12, HZ, false);
    [-1, 1].forEach(s => [-1, 1].forEach(sz => viga(HX + s * 7, 0.5, HZ + sz * 2.8, HX, HY, HZ + sz * 1.3, 0.45, BR)));
    bloqueia(HX, HZ, 16, 6.5);
    const roda = new THREE.Group();
    roda.position.set(HX, HY, HZ);
    scene.add(roda);
    const naRoda = (geo, c, x, y, z, rz = 0) => { const m = new THREE.Mesh(geo, c.isMaterial ? c : mat(c)); m.position.set(x, y, z); m.rotation.z = rz; m.castShadow = true; roda.add(m); return m; };
    [-0.9, 0.9].forEach(z => {
      naRoda(new THREE.TorusGeometry(R, 0.22, 6, 48), VERM, 0, 0, z);
      naRoda(new THREE.TorusGeometry(R * 0.55, 0.14, 6, 36), AMAR, 0, 0, z);
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; naRoda(new THREE.BoxGeometry(0.16, R, 0.16), BR, Math.cos(a) * R / 2, Math.sin(a) * R / 2, z, a - Math.PI / 2); }
    });
    naRoda(new THREE.CylinderGeometry(0.7, 0.7, 2.8, 10).rotateX(Math.PI / 2), 0x495057, 0, 0, 0);
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; naRoda(geoLampada, k % 2 ? luzA : luzB, Math.cos(a) * R, Math.sin(a) * R, 1.15); }
    parque.roda = roda;
    const CORES_G = [VERM, AZUL, AMAR, 0x2f9e44, ROXO, 0xff922b];
    for (let k = 0; k < 12; k++) {
      const g = grupo(HX, HY, HZ), c = CORES_G[k % 6];
      g.p(0.12, 1.0, 0.12, 0x495057, 0, -0.5, 0);
      g.p(1.9, 0.2, 1.5, c, 0, -1.05, 0);
      [-0.8, 0.8].forEach(x => [-0.6, 0.6].forEach(z => g.p(0.08, 0.9, 0.08, BR, x, -1.5, z)));
      g.p(1.8, 0.8, 1.4, c, 0, -2.3, 0);
      [-0.4, 0.4].forEach((x, i) => {
        g.p(0.45, 0.45, 0.45, PELES[(k + i) % 5], x, -1.7, 0);
        g.p(0.47, 0.14, 0.47, CABELOS[(k * 2 + i) % CABELOS.length], x, -1.42, 0);
      });
      parque.gondolas.push({ g, a: k / 12 * Math.PI * 2 });
    }
    parque.rodaC = { HX, HY, HZ, R };
    caixa(0.25, 2.8, 0.25, BR, HX - 3.6, 0.12, HZ + 5.4);
    caixa(0.25, 2.8, 0.25, BR, HX + 3.6, 0.12, HZ + 5.4);
    plano(placaTxt([["RODA-GIGANTE", 64, 50]], 768, 100, "#e03131", "#fffaf0", "#fab005"), 7.6, 1.0, HX, 2.5, HZ + 5.55);
    bloqueia(HX, HZ + 5.4, 7.6, 0.4);
    ent("Roda-Gigante", HX, HY + R + 4, HZ, { x: HX, z: 15, yaw: 0 });

    // Kamikaze: torre listrada e braço que gira e dá a volta inteira com a gôndola cheia
    const KX = x1 - 22, KZ = z0 + 16, ALT = 14;
    caixa(10, 0.5, 9, 0xced4da, KX, 0.12, KZ + 1, false);
    for (let i = 0; i < 10; i++) caixa(1.6, ALT / 10, 1.6, i % 2 ? AMAR : VERM, KX, 0.62 + i * ALT / 10, KZ - 1.6);
    caixa(0.5, 0.5, 1.6, 0x495057, KX, 13.75, KZ - 0.7, false);
    malha(new THREE.CylinderGeometry(1.7, 1.7, 0.2, 14).rotateX(Math.PI / 2), BR, KX, 8.2, KZ - 0.72);
    malha(new THREE.CylinderGeometry(1.1, 1.1, 0.22, 10).rotateX(Math.PI / 2), VERM, KX, 8.2, KZ - 0.68);
    const braco = grupo(KX, ALT, KZ);
    braco.p(1.0, 19, 0.7, VERM, 0, 0, 0.2);
    braco.p(2.4, 2.4, 1.2, 0x495057, 0, 9, 0.6);
    braco.p(2.6, 1.6, 4.6, AMAR, 0, -9, 2.6);
    braco.p(2.8, 0.25, 4.8, VERM, 0, -8.1, 2.6);
    for (let r = 0; r < 3; r++) [-0.6, 0.6].forEach((x, i) => {
      braco.p(0.45, 0.45, 0.45, PELES[(r * 2 + i) % 5], x, -7.7, 1.1 + r * 1.4);
      braco.p(0.47, 0.14, 0.47, CABELOS[(r * 3 + i) % CABELOS.length], x, -7.42, 1.1 + r * 1.4);
    });
    parque.kami = braco;
    bloqueia(KX, KZ + 1, 10, 9);
    [-3, 3].forEach(dx => caixa(0.25, 2.6, 0.25, BR, KX + dx, 0.12, KZ + 6.4));
    plano(placaTxt([["KAMIKAZE", 72, 50]], 640, 100, "#fab005", "#c92a2a", "#c92a2a"), 6.4, 1.0, KX, 2.3, KZ + 6.55);
    bloqueia(KX, KZ + 6.4, 6.4, 0.4);
    ent("Kamikaze", KX, 26, KZ, { x: KX, z: 15, yaw: 0 });

    // Carrinho bate-bate: pista coberta com 7 carrinhos batendo uns nos outros
    const BX = (HX + KX) / 2, BZ = z0 + 16;
    caixa(22, 0.35, 14, 0x868e96, BX, 0.12, BZ, false);
    caixa(20, 0.05, 12, 0x495057, BX, 0.47, BZ, false);
    [[0, -6.1, 20.4, 0.3], [0, 6.1, 20.4, 0.3], [-10.1, 0, 0.3, 12.4], [10.1, 0, 0.3, 12.4]].forEach(([dx, dz, w, d]) => caixa(w, 0.5, d, AMAR, BX + dx, 0.47, BZ + dz, false));
    [-10.6, 0, 10.6].forEach(dx => [-6.6, 6.6].forEach(dz => caixa(0.35, 4.6, 0.35, BR, BX + dx, 0.47, BZ + dz)));
    caixa(22.4, 0.35, 14.4, ROXO, BX, 5.07, BZ);
    for (let k = 0; k < 28; k++) caixa(0.8, 0.6, 0.1, k % 2 ? AMAR : ROSA, BX - 10.8 + k * 0.8, 4.5, BZ + 7.25, false);
    caixa(12.4, 1.5, 0.2, ROXO, BX, 5.42, BZ + 7.1, false);
    plano(placaTxt([["CARRINHO BATE-BATE", 64, 52]], 1024, 104, "#9c36b5", "#fffaf0", "#fab005"), 12, 1.22, BX, 6.17, BZ + 7.22);
    bloqueia(BX, BZ, 22, 14);
    [VERM, AZUL, AMAR, 0x2f9e44, ROSA, 0xff922b, 0x22b8cf].forEach((cor, k) => {
      const g = grupo(BX + (k - 3) * 2.6, 0.52, BZ + (k % 2 ? 2.2 : -2.2));
      g.p(2.0, 0.35, 2.4, PRETO, 0, 0.35, 0);
      g.p(1.7, 0.5, 2.0, cor, 0, 0.7, 0);
      g.p(1.3, 0.5, 0.3, cor, 0, 1.1, -0.75);
      g.p(0.6, 0.55, 0.45, CAMISAS_V[k], 0, 1.2, -0.25);
      g.p(0.55, 0.55, 0.55, PELES[k % 5], 0, 1.75, -0.25);
      g.p(0.58, 0.18, 0.58, CABELOS[k], 0, 2.1, -0.25);
      g.p(0.08, 3.6, 0.08, 0x868e96, 0, 2.6, -0.95);
      const a = rand() * Math.PI * 2;
      parque.carrinhos.push({ g, vx: Math.sin(a) * 3.2, vz: Math.cos(a) * 3.2, cx: BX, cz: BZ });
    });
    ent("Carrinho Bate-Bate", BX, 9, BZ, { x: BX, z: 13, yaw: 0 });

    // Barracas de comida em fila, de frente para o passeio
    const ZB = 4;
    const geoBola = new THREE.SphereGeometry(0.17, 7, 6), geoNuvem = new THREE.IcosahedronGeometry(0.3, 0);
    const PRODUTOS = {
      churros: (x, y, z) => { for (let i = 0; i < 6; i++) { const m = caixa(0.13, 0.75, 0.13, 0xc77d32, x - 1.25 + i * 0.22, y, z, false); m.rotation.z = (i - 2.5) * 0.08; } caixa(0.6, 0.25, 0.4, BR, x + 1.0, y, z, false); },
      maca: (x, y, z) => { for (let i = 0; i < 7; i++) { caixa(0.04, 0.32, 0.04, 0xe9d8a6, x - 1.3 + i * 0.4, y, z, false); malha(geoBola, 0xc92a2a, x - 1.3 + i * 0.4, y + 0.45, z, false); } },
      pipoca: (x, y, z) => { for (let i = 0; i < 5; i++) { caixa(0.3, 0.38, 0.3, i % 2 ? BR : VERM, x - 1.2 + i * 0.6, y, z, false); caixa(0.28, 0.14, 0.28, 0xfff3bf, x - 1.2 + i * 0.6, y + 0.38, z, false); } },
      algodao: (x, y, z) => { for (let i = 0; i < 5; i++) { caixa(0.04, 0.45, 0.04, BR, x - 1.2 + i * 0.6, y, z, false); malha(geoNuvem, i % 2 ? 0x74c0fc : 0xf783ac, x - 1.2 + i * 0.6, y + 0.68, z, false); } },
      dog: (x, y, z) => { for (let i = 0; i < 4; i++) { caixa(0.62, 0.16, 0.22, 0xe0a458, x - 1.1 + i * 0.72, y, z, false); caixa(0.7, 0.11, 0.11, 0xb33a2a, x - 1.1 + i * 0.72, y + 0.14, z, false); } },
      cana: (x, y, z) => { for (let i = 0; i < 4; i++) { const m = caixa(0.1, 1.3, 0.1, 0xa9e34b, x - 1.4 + i * 0.12, y, z - 0.2, false); m.rotation.z = 0.15; } for (let i = 0; i < 4; i++) caixa(0.24, 0.36, 0.24, 0xffe066, x - 0.3 + i * 0.5, y, z, false); }
    };
    [["CHURROS", 0xc77d32, "churros", "Churros"], ["MAÇÃ DO AMOR", 0xc92a2a, "maca", "Maçã do Amor"], ["PIPOCA", 0xf59f00, "pipoca", "Pipoca"],
     ["ALGODÃO-DOCE", 0xf06595, "algodao", "Algodão-Doce"], ["CACHORRO-QUENTE", 0xe8590c, "dog", "Cachorro-Quente"], ["CALDO DE CANA", 0x2f9e44, "cana", "Caldo de Cana"]].forEach(([nome, cor, prod, titulo], i) => {
      const x = x0 + 14 + i * 15, z = ZB;
      caixa(3.8, 2.7, 1.6, cor, x, 0.12, z - 1.3);
      caixa(3.8, 1.05, 1.1, BR, x, 0.12, z + 0.75);
      caixa(3.9, 0.08, 1.2, cor, x, 1.17, z + 0.75, false);
      [-1.8, 1.8].forEach(dx => caixa(0.14, 2.85, 0.14, BR, x + dx, 0.12, z + 1.3, false));
      for (let k = 0; k < 7; k++) caixa(0.56, 0.12, 3.5, k % 2 ? BR : cor, x - 1.68 + k * 0.56, 2.97, z - 0.35, false);
      caixa(3.8, 0.9, 0.12, BR, x, 3.09, z + 1.36, false);
      plano(placaTxt([[nome, 64, 52]], 512, 104, hex(cor), "#fffaf0", "#fffaf0"), 3.6, 0.78, x, 3.54, z + 1.43);
      PRODUTOS[prod](x, 1.25, z + 0.75);
      bonecoInst(x, 0.12, z - 0.1, 0, estiloBoneco("vendedor" + nome, i % 2 === 0, { camisa: BR, chapeu: null }));
      [-0.7, 0.8].forEach((dx, j) => bonecoInst(x + dx, 0.12, z + 2.7, Math.PI, estiloBoneco("cliente" + nome + j, (i + j) % 2 === 1)));
      bloqueia(x, z - 0.4, 3.9, 3.6);
      bloqueia(x - 0.7, z + 2.7, 0.9, 0.9);
      bloqueia(x + 0.8, z + 2.7, 0.9, 0.9);
      ent(`Barraca de ${titulo}`, x, 5, z, { x, z: 17, yaw: 0 });
    });

    // Montanha-russa na areia: pista fechada com subidas e descidas, colunas brancas e um trem de 4 carrinhos
    const CX = (x0 + x1) / 2 - 2, CZ = 37, RC = 8.5, HC = 36;
    const L = 4 * HC + 2 * Math.PI * RC;
    function pista(s) {
      s = ((s % L) + L) % L;
      const a = 2 * HC, b = a + Math.PI * RC, c = b + a;
      let x, z;
      if (s < a) { x = CX - HC + s; z = CZ + RC; }
      else if (s < b) { const f = Math.PI / 2 - (s - a) / RC; x = CX + HC + RC * Math.cos(f); z = CZ + RC * Math.sin(f); }
      else if (s < c) { x = CX + HC - (s - b); z = CZ - RC; }
      else { const f = -Math.PI / 2 - (s - c) / RC; x = CX - HC + RC * Math.cos(f); z = CZ + RC * Math.sin(f); }
      const v = s / L * Math.PI * 2;
      return [x, 7.6 + 4 * Math.sin(2 * v + 0.6) + 2.2 * Math.sin(5 * v), z];
    }
    const NP = 320, ds = L / NP;
    const trilhos = inst(new THREE.BoxGeometry(1, 1, 1), NP * 2, VERM);
    const dormentes = inst(new THREE.BoxGeometry(1, 1, 1), NP, 0x495057);
    const colunas = inst(UNIT, 90, BR);
    const o = new THREE.Object3D();
    const pts = [];
    for (let i = 0; i <= NP; i++) pts.push(pista(i * ds));
    for (let i = 0; i < NP; i++) {
      const [ax, ay, az] = pts[i], [bx, by, bz] = pts[i + 1];
      const hx = bx - ax, hz = bz - az, hl = Math.hypot(hx, hz) || 1, nx = -hz / hl, nz = hx / hl;
      const len = Math.hypot(hx, by - ay, hz);
      [-0.55, 0.55].forEach(off => {
        o.scale.set(1, 1, 1);
        o.position.set((ax + bx) / 2 + nx * off, (ay + by) / 2, (az + bz) / 2 + nz * off);
        o.lookAt(bx + nx * off, by, bz + nz * off);
        o.scale.set(0.16, 0.2, len + 0.06);
        o.updateMatrix();
        trilhos.setMatrixAt(trilhos.count++, o.matrix);
      });
      if (i % 2 === 0) {
        o.scale.set(1, 1, 1);
        o.position.set(ax, ay - 0.14, az);
        o.lookAt(bx, by - 0.14, bz);
        o.scale.set(1.5, 0.1, 0.3);
        o.updateMatrix();
        dormentes.setMatrixAt(dormentes.count++, o.matrix);
      }
      if (i % 5 === 0) { poe(colunas, ax, 0.12, az, 0.3, ay - 0.3, 0.3); bloqueia(ax, az, 0.5, 0.5); }
    }
    for (let k = 0; k < 4; k++) {
      const g = grupo(0, 0, 0);
      g.p(1.6, 0.7, 2.2, k ? AZUL : VERM, 0, 0.5, 0);
      if (!k) g.p(1.6, 0.5, 0.5, AMAR, 0, 0.45, 1.3);
      [-0.4, 0.4].forEach((x, i) => {
        g.p(0.45, 0.45, 0.45, PELES[(k + i * 2) % 5], x, 1.2, -0.2);
        g.p(0.47, 0.14, 0.47, CABELOS[(k * 3 + i) % CABELOS.length], x, 1.48, -0.2);
        g.p(0.14, 0.6, 0.14, PELES[(k + i * 2) % 5], x + (i ? 0.32 : -0.32), 1.55, -0.2);
      });
      parque.trem.push(g);
    }
    parque.pista = pista;
    const zS = CZ - RC - 3.6;
    [-4.4, 4.4].forEach(dx => { caixa(0.3, 4.2, 0.3, BR, CX + dx, 0.12, zS); bloqueia(CX + dx, zS, 0.4, 0.4); });
    caixa(9.4, 1.6, 0.25, VERM, CX, 2.6, zS, false);
    const mMR = placaTxt([["MONTANHA-RUSSA", 64, 50]], 1024, 100, "#e03131", "#fffaf0", "#fab005");
    plano(mMR, 9, 1.4, CX, 3.4, zS - 0.14, Math.PI);
    plano(mMR, 9, 1.4, CX, 3.4, zS + 0.14);
    ent("Montanha-Russa", CX, 18, CZ, { x: CX, z: 16, yaw: Math.PI });

    // Gente passeando pelo parque
    for (let k = 0; k < 16; k++) {
      pessoasPraia.push({
        partes: criaAndante(estiloBoneco("parque" + k, k % 2 === 0)),
        x: x0 + 6 + rand() * (x1 - x0 - 14), x0: x0 + 6, x1: x1 - 8, z: 11.5 + rand() * 9, dir: rand() < 0.5 ? 1 : -1, vel: 0.9 + rand() * 0.7, fase: rand() * 6
      });
    }
    // Plateia olhando o kamikaze e a roda-gigante
    [[KX - 2, KZ + 8.6], [KX + 1, KZ + 8.8], [KX + 3.4, KZ + 8.5], [HX - 1.5, HZ + 7.6], [HX + 1.8, HZ + 7.8]].forEach(([x, z], k) => {
      bonecoInst(x, 0.12, z, Math.PI, estiloBoneco("plateia" + k, k % 2 === 1));
      bloqueia(x, z, 0.9, 0.9);
    });

    // Carreta da Alegria estacionada na frente do parque (cavalo preto e carroceria aberta cheia de criançada)
    const TX = x1 + 10, TZ = GZ - 16;
    const tr = grupo(TX, 0.12, TZ);
    const matX = new THREE.MeshBasicMaterial({
      map: texturaCanvas(512, 64, (g, w, h) => {
        g.fillStyle = "#fffaf0"; g.fillRect(0, 0, w, h);
        g.lineWidth = 7; g.strokeStyle = "#e03131";
        for (let i = 0; i < 8; i++) { const a = i * 64; g.beginPath(); g.moveTo(a + 8, 8); g.lineTo(a + 56, 56); g.moveTo(a + 56, 8); g.lineTo(a + 8, 56); g.stroke(); g.strokeRect(a + 5, 5, 54, 54); }
        g.strokeStyle = "#1c3faa"; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
      })
    });
    tr.p(2.4, 0.4, 13.5, 0x343a40, 0, 1.0, -0.5);
    tr.p(2.9, 0.2, 10.4, 0x343a40, 0, 1.3, -1.6);
    [-1, 1].forEach(s => {
      tr.p(0.1, 1.0, 10.4, BR, s * 1.45, 1.9, -1.6);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 1.0), matX);
      pl.position.set(s * 1.51, 1.9, -1.6);
      pl.rotation.y = s * Math.PI / 2;
      tr.add(pl);
      for (let z = -6.7; z <= 3.6; z += 2.06) tr.p(0.12, 2.9, 0.12, PRETO, s * 1.45, 2.85, z);
      tr.p(0.5, 0.3, 9.6, 0x8d5524, s * 0.7, 1.55, -1.6);
    });
    tr.p(2.9, 1.0, 0.1, BR, 0, 1.9, -6.8);
    tr.p(3.1, 0.2, 10.6, VERM, 0, 4.4, -1.6);
    tr.p(0.15, 1.1, 8, PRETO, 0, 5.05, -1.6);
    const mCarreta = placaTxt([["CARRETA DA ALEGRIA", 66, 50]], 1024, 100, "#1d1d1d", "#ffd43b", "#e03131");
    [-1, 1].forEach(s => {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 0.95), mCarreta);
      pl.position.set(s * 0.09, 5.05, -1.6);
      pl.rotation.y = s * Math.PI / 2;
      tr.add(pl);
    });
    for (let r = 0; r < 7; r++) [-1, 1].forEach((s, i) => {
      const z = -6.0 + r * 1.45, k = r * 2 + i;
      tr.p(0.4, 0.55, 0.55, CAMISAS_V[k % CAMISAS_V.length], s * 0.85, 1.95, z);
      tr.p(0.5, 0.5, 0.5, PELES[k % 5], s * 0.85, 2.5, z);
      tr.p(0.52, 0.14, 0.52, CABELOS[(k * 5) % CABELOS.length], s * 0.85, 2.8, z);
      if (k % 3 === 0) tr.p(0.14, 0.55, 0.14, PELES[k % 5], s * 1.15, 2.75, z);
    });
    tr.p(2.7, 2.6, 2.6, PRETO, 0, 2.35, 5.3);
    tr.p(2.7, 0.5, 1.2, PRETO, 0, 3.9, 5.0);
    tr.p(2.4, 1.0, 0.06, 0x8ecae6, 0, 2.95, 6.62);
    [-1, 1].forEach(s => { tr.p(0.06, 0.8, 1.0, 0x8ecae6, s * 1.36, 3.0, 5.7); tr.p(0.04, 0.3, 2.6, VERM, s * 1.36, 2.0, 5.3); tr.p(0.4, 0.25, 0.06, 0xfff3bf, s * 0.95, 1.55, 6.63); });
    tr.p(2.0, 0.8, 0.06, 0xadb5bd, 0, 1.8, 6.62);
    tr.p(2.7, 0.35, 0.3, 0x495057, 0, 0.9, 6.72);
    const pVisor = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.42), placaTxt([["ALEGRIA", 60, 32]], 256, 64, "#1d1d1d", "#ffd43b"));
    pVisor.position.set(0, 3.9, 5.61);
    tr.add(pVisor);
    const geoPneu = new THREE.CylinderGeometry(0.62, 0.62, 0.45, 12).rotateZ(Math.PI / 2);
    [5.6, -4.3, -5.6].forEach(z => [-1.25, 1.25].forEach(x => { const m = new THREE.Mesh(geoPneu, mat(PRETO)); m.position.set(x, 0.62, z); m.castShadow = true; tr.add(m); }));
    bloqueia(TX, TZ - 0.1, 3.2, 14.2);
    ent("Carreta da Alegria", TX, 8, TZ, { x: TX + 4, z: TZ + 14, yaw: 0.28 });

    // Fantasiados na porta do parque, dançando para a criançada
    const B = (w, h, d, x, y, z, cor, tag = "") => [w, h, d, x, y, z, cor, tag];
    const VER = 0xd62828, AZ = 0x1c3faa, PT = 0x1d1d1d;
    const FANTASIAS = [
      ["Homem-Aranha (fantasia)", { fem: false, pele: VER, cabelo: VER, camisa: VER, calca: AZ, sapato: VER, olhos: 0xffffff, extra: [
        B(0.03, 0.74, 0.02, 0, 0.8, 0.225, PT), B(0.82, 0.03, 0.02, 0, 1.0, 0.225, PT), B(0.82, 0.03, 0.02, 0, 1.28, 0.225, PT),
        B(0.2, 0.24, 0.03, 0, 1.08, 0.235, PT), B(0.96, 0.03, 0.02, 0, 1.75, 0.435, PT), B(0.03, 0.9, 0.02, 0, 1.54, 0.435, PT),
        B(0.84, 0.3, 0.46, 0, 0.8, 0, AZ)] }],
      ["Fofão (fantasia)", { fem: false, pele: 0xf6b26b, cabelo: 0xd9480f, camisa: PT, calca: 0xe03131, sapato: 0xe03131, extra: [
        B(0.34, 0.3, 0.12, -0.3, 1.6, 0.47, 0xffa8a8), B(0.34, 0.3, 0.12, 0.3, 1.6, 0.47, 0xffa8a8),
        B(0.42, 0.55, 0.5, -0.66, 2.05, -0.05, 0xd9480f), B(0.42, 0.55, 0.5, 0.66, 2.05, -0.05, 0xd9480f),
        B(0.5, 0.55, 0.03, 0, 0.9, 0.235, 0xfab005), B(0.08, 0.4, 0.02, -0.09, 0.97, 0.25, PT), B(0.26, 0.07, 0.02, 0.03, 1.3, 0.25, PT), B(0.18, 0.07, 0.02, 0.0, 1.15, 0.25, PT)] }],
      ["Popeye (fantasia)", { fem: false, pele: 0xf2c29b, cabelo: 0xf2c29b, camisa: PT, calca: 0x1c4fbf, sapato: 0x5c3d2e, extra: [
        B(1.04, 0.28, 0.94, 0, 2.42, 0, BR), B(1.06, 0.08, 0.96, 0, 2.42, 0, PT), B(0.84, 0.12, 0.46, 0, 1.44, 0, VER),
        B(0.4, 0.5, 0.46, -0.56, 0.72, 0, 0xf2c29b, "B0"), B(0.4, 0.5, 0.46, 0.56, 0.72, 0, 0xf2c29b, "B1"), B(0.03, 0.2, 0.16, -0.77, 0.86, 0, AZ, "B0"),
        B(0.5, 0.2, 0.2, 0, 1.52, 0.46, 0xf2c29b), B(0.08, 0.08, 0.45, 0.24, 1.66, 0.62, 0x8d5524), B(0.15, 0.22, 0.15, 0.24, 1.66, 0.86, 0x8d5524)] }],
      ["Palhaço (fantasia)", { fem: false, pele: 0xfff5f5, cabelo: 0x40c057, camisa: 0xf59f00, calca: 0x1c7ed6, sapato: VER, extra: [
        B(0.45, 0.5, 0.5, -0.64, 2.0, -0.05, 0x40c057), B(0.45, 0.5, 0.5, 0.64, 2.0, -0.05, 0x40c057), B(0.2, 0.2, 0.14, 0, 1.76, 0.5, VER),
        B(0.42, 0.08, 0.03, 0, 1.63, 0.44, VER), B(0.14, 0.14, 0.03, 0, 1.3, 0.235, 0x7048e8), B(0.14, 0.14, 0.03, 0, 1.0, 0.235, 0x7048e8)] }]
    ];
    const ZF = [GZ - 5.5, GZ - 2.6, GZ + 2.6, GZ + 5.5];
    FANTASIAS.forEach(([nome, o], k) => {
      const f = { partes: criaAndante(o), x: x1 + 4.5, z: ZF[k], ry: Math.PI / 2, fase: k * 1.7 };
      parque.fantasias.push(f);
      bloqueia(f.x, f.z, 0.9, 0.9);
      ent(nome, f.x, k % 2 ? 6 : 4, f.z, { x: x1 + 14, z: f.z, yaw: Math.PI / 2 });
    });
    rotuloFixo("Parque de Diversões", "#e64980", "#fffaf0", 1.4, (x0 + x1) / 2, 30, 8);
  })();
  function atualizaParque(dt, t) {
    const giro = reduz ? 0.3 : t * 0.13;
    parque.roda.rotation.z = giro;
    const { HX, HY, HZ, R } = parque.rodaC;
    parque.gondolas.forEach(({ g, a }) => g.position.set(HX + Math.cos(a + giro) * R, HY + Math.sin(a + giro) * R, HZ));
    parque.kami.rotation.z = reduz ? 0.5 : 3.6 * Math.sin(t * 0.55);
    if (!reduz) {
      const cs = parque.carrinhos;
      cs.forEach(c => {
        const p = c.g.position;
        p.x += c.vx * dt; p.z += c.vz * dt;
        if (Math.abs(p.x - c.cx) > 8.9) { p.x = c.cx + Math.sign(p.x - c.cx) * 8.9; c.vx = -c.vx; }
        if (Math.abs(p.z - c.cz) > 4.9) { p.z = c.cz + Math.sign(p.z - c.cz) * 4.9; c.vz = -c.vz; }
      });
      for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
        const a = cs[i].g.position, b = cs[j].g.position, dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
        if (d < 2.3 && d > 0.01) {
          [cs[i].vx, cs[j].vx] = [cs[j].vx, cs[i].vx];
          [cs[i].vz, cs[j].vz] = [cs[j].vz, cs[i].vz];
          const em = (2.3 - d) / 2;
          a.x -= dx / d * em; a.z -= dz / d * em; b.x += dx / d * em; b.z += dz / d * em;
        }
      }
      cs.forEach(c => { c.g.rotation.y += angDif(c.g.rotation.y, Math.atan2(c.vx, c.vz)) * Math.min(1, dt * 6); });
      const y = parque.pista(parque.s)[1];
      parque.s += (7 + 1.8 * (13.8 - y)) * dt;
    }
    parque.trem.forEach((g, k) => {
      const sk = parque.s - k * 2.5, p = parque.pista(sk), q = parque.pista(sk + 0.6);
      g.position.set(p[0], p[1] + 0.1, p[2]);
      g.lookAt(q[0], q[1] + 0.1, q[2]);
    });
    parque.fantasias.forEach(f => {
      if (!reduz) f.fase += dt * 5;
      poeAndante(f.partes, f.x, 0.12 + (reduz ? 0 : Math.abs(Math.sin(f.fase)) * 0.18), f.z, f.ry + (reduz ? 0 : Math.sin(f.fase * 0.5) * 0.35), f.fase, !reduz);
    });
    if (!reduz) {
      const pisca = Math.floor(t * 2.5) % 2;
      luzA.color.setHex(pisca ? 0xffe066 : 0xff8787);
      luzB.color.setHex(pisca ? 0xff8787 : 0xffe066);
    }
  }

  // ---------- Shopping Caragua Pixel: ao lado do sítio, perto do Morro Santo Antônio, com estacionamento de 50 vagas ----------
  (function () {
    const r3 = semente(5150);
    const { x0, x1, z0, z1 } = SHOP;
    const BR = 0xf8f9fa, MARROM = 0x6b3e26, VERDE = 0x0ca678, GRAF = 0x343a40;
    const NUNITO = '"Nunito Sans", "Segoe UI", sans-serif';
    function canvasMat(w, h, desenha) {
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      desenha(cv.getContext("2d"), w, h);
      const t = new THREE.CanvasTexture(cv);
      t.anisotropy = 4;
      return new THREE.MeshBasicMaterial({ map: t });
    }
    function plano(m, w, h, x, y, z, ry = 0) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      p.position.set(x, y, z);
      p.rotation.y = ry;
      scene.add(p);
      return p;
    }
    function placa(linhas, w, h, fundo, cor) {
      return canvasMat(w, h, g => {
        g.fillStyle = fundo; g.fillRect(0, 0, w, h);
        g.fillStyle = cor; g.textAlign = "center"; g.textBaseline = "middle";
        linhas.forEach(([txt, px, y]) => {
          g.font = `800 ${px}px ${NUNITO}`;
          while (g.measureText(txt).width > w * 0.9 && px > 10) g.font = `800 ${px -= 2}px ${NUNITO}`;
          g.fillText(txt, w / 2, y);
        });
      });
    }
    const xm = (x0 + x1) / 2;
    // Prédio: z de zA (fundo) até zF (frente, virada para o estacionamento)
    const zA = z0 + 1, zF = z0 + 23, W = x1 - x0 - 4, HB = 8;
    const zP = zF + 7;            // fim da praça da frente
    // Chão: estacionamento de asfalto, praça de piso claro e gramado com palmeiras na beira
    caixa(x1 - x0 + 1, 0.1, z1 - zP, C.asfalto, xm, 0, (zP + z1) / 2, false);
    caixa(x1 - x0, 0.2, zP - zF, 0xe9e4d8, xm, 0, (zF + zP) / 2, false);
    caixa(x1 - x0, 0.12, zF - z0, 0xced4da, xm, 0, (z0 + zF) / 2, false);
    caixa(x1 - x0 - 6, 0.24, 4.6, C.grama, xm - 3, 0, z1 - 2.6, false);

    // ===== Prédio do shopping (branco, faixa de madeira, entrada de vidro com marquise) =====
    caixa(W, HB, zF - zA, BR, xm, 0.12, (zA + zF) / 2);
    bloqueia(xm, (zA + zF) / 2, W, zF - zA);
    caixa(W + 0.4, 0.6, zF - zA + 0.4, 0xdee2e6, xm, 0.12 + HB, (zA + zF) / 2, false);
    // Claraboias e máquinas de ar no telhado
    for (let k = 0; k < 4; k++) caixa(6, 0.8, 2.4, 0x8ecae6, xm - 13.5 + k * 9, 0.12 + HB + 0.3, (zA + zF) / 2, false);
    [[-14, -6], [12, -5], [15, 4]].forEach(([dx, dz]) => caixa(2.4, 1.4, 1.8, 0xadb5bd, xm + dx, 0.12 + HB + 0.3, (zA + zF) / 2 + dz, false));
    const EW = 11; // largura da entrada
    const lado = (W - EW) / 2;
    [-1, 1].forEach(s => {
      const cxL = xm + s * (EW / 2 + lado / 2);
      caixa(lado, 3.4, 0.35, MARROM, cxL, 3.4, zF + 0.1, false);
    });
    // Entrada de vidro de dois andares, porta escura e a marquise com o nome
    const vidroEnt = new THREE.Mesh(new THREE.BoxGeometry(EW, HB - 0.4, 0.15), new THREE.MeshStandardMaterial({ color: 0x8ecae6, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.3 }));
    vidroEnt.position.set(xm, 0.12 + (HB - 0.4) / 2, zF + 0.12);
    scene.add(vidroEnt);
    plano(canvasMat(256, 160, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, "#fff3bf"); gr.addColorStop(1, "#ffd8a8");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "#e9ecef"; g.fillRect(0, h * 0.48, w, 8);
      [[30, "#f06595"], [90, "#4dabf7"], [150, "#51cf66"], [210, "#fcc419"]].forEach(([x, c]) => { g.fillStyle = c; g.fillRect(x - 18, 18, 36, 40); g.fillRect(x - 18, h * 0.6, 36, 40); });
    }), EW - 0.4, HB - 0.6, xm, 0.12 + (HB - 0.4) / 2, zF + 0.04);
    for (let k = 0; k <= 5; k++) caixa(0.16, HB - 0.4, 0.2, GRAF, xm - EW / 2 + k * EW / 5, 0.12, zF + 0.16, false);
    caixa(EW, 0.16, 0.2, GRAF, xm, 0.12 + 3.6, zF + 0.16, false);
    caixa(4, 2.6, 0.12, 0x22303a, xm, 0.12, zF + 0.22, false);
    caixa(EW + 3, 0.5, 5, BR, xm, 0.12 + HB - 0.2, zF + 2.4);
    [-1, 1].forEach(s => { caixa(0.4, HB - 0.2, 0.4, BR, xm + s * (EW / 2 + 1.2), 0.12, zF + 4.6); bloqueia(xm + s * (EW / 2 + 1.2), zF + 4.6, 0.4, 0.4); });
    plano(canvasMat(1024, 160, (g, w, h) => {
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#0ca678"; g.beginPath(); g.arc(90, h / 2, 54, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(90, h / 2, 28, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#1d2a33"; g.textAlign = "center"; g.textBaseline = "middle";
      g.font = `800 66px ${NUNITO}`; g.fillText("SHOPPING CARAGUA PIXEL", 560, 70);
      g.fillStyle = "#0ca678"; g.font = `800 32px ${NUNITO}`; g.fillText("LOJAS · CINEMA · PRAÇA DE ALIMENTAÇÃO", 560, 128);
    }), EW + 2.8, 0.46 * (EW + 2.8) * 160 / 1024 / 0.46, xm, 0.12 + HB + 0.05, zF + 4.92);
    // Vitrines das lojas no térreo com placa em cima de cada uma
    const LOJAS = [
      ["MODA PRAIA", "#f06595", "#fff0f6"], ["CALÇADOS", "#845ef7", "#f3f0ff"], ["ÓTICA", "#1c7ed6", "#e7f5ff"],
      ["BRINQUEDOS", "#fab005", "#fff9db"], ["PERFUMARIA", "#e64980", "#fff0f6"], ["ELETRÔNICOS", "#1d2a33", "#e9ecef"]
    ];
    const vw = lado / 3;
    LOJAS.forEach(([nome, cor, fundo], k) => {
      const s = k < 3 ? -1 : 1, j = k % 3;
      const x = s < 0 ? x0 + 2 + vw * (j + 0.5) : xm + EW / 2 + vw * (j + 0.5);
      plano(canvasMat(256, 160, (g, w, h) => {
        g.fillStyle = fundo; g.fillRect(0, 0, w, h);
        g.fillStyle = cor;
        for (let i = 0; i < 4; i++) { g.fillRect(20 + i * 58, 60, 40, 70); g.beginPath(); g.arc(40 + i * 58, 45, 14, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = "#adb5bd"; g.fillRect(0, h - 16, w, 16);
      }), vw - 0.8, 2.8, x, 0.12 + 1.5, zF + 0.04);
      [-1, 1].forEach(t => caixa(0.18, 3.0, 0.2, GRAF, x + t * (vw - 0.7) / 2, 0.12, zF + 0.12, false));
      plano(placa([[nome, 54, 50]], 384, 100, cor, "#ffffff"), vw - 0.9, 1.0, x, 4.8, zF + 0.3);
      ents.push({ t: `${nome[0] + nome.slice(1).toLowerCase()} · loja do shopping`, h: "caraguapixel", k: "shopping", oculto: true, x, y: k % 2 ? 9 : 10.5, z: zF, cor: "#0ca678", alvo: { x, z: zF + 14, yaw: 0 } });
    });
    // Letreiros grandes nas laterais: cinema (lado da cidade) e praça de alimentação (lado do sítio)
    plano(placa([["CINEMA", 120, 96], ["6 salas · estreias da semana", 34, 176]], 768, 220, "#c92a2a", "#fff3bf"), 12, 3.4, x0 + 2 + W + 0.02, 5.2, (zA + zF) / 2, Math.PI / 2);
    plano(placa([["PRAÇA DE ALIMENTAÇÃO", 70, 70], ["lanches · açaí · pastel · sorvete", 34, 150]], 768, 200, "#f08c00", "#ffffff"), 12, 3.1, x0 + 2 - 0.02, 5.2, (zA + zF) / 2, -Math.PI / 2);

    // ===== Palmeirinhas na praça e no gramado =====
    const folhasPalm = [];
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2;
      let px = 0, py = 0, inc = -0.3;
      for (let j = 0; j < 3; j++) {
        folhasPalm.push(new THREE.BoxGeometry(1.1, 0.06, 0.8 - j * 0.18).rotateZ(-inc).translate(px + Math.cos(inc) * 0.55, py - Math.sin(inc) * 0.55, 0).rotateY(a));
        px += Math.cos(inc) * 1.1; py -= Math.sin(inc) * 1.1; inc += 0.45;
      }
    }
    const copaPalm = inst(junta(folhasPalm), 40, 0x2f9e44);
    const troncoPalm = inst(new THREE.CylinderGeometry(0.2, 0.3, 1, 7).translate(0, 0.5, 0), 40, 0x9c7a58);
    const palmeirinha = (x, z, y = 0.2) => { poe(troncoPalm, x, y, z, 1, 5, 1); poe(copaPalm, x, y + 5, z, 1, 1, 1); bloqueia(x, z, 0.6, 0.6); };
    for (let x = x0 + 4; x <= x1 - 3; x += 6.5) if (Math.abs(x - xm) > EW / 2 + 2) palmeirinha(x, zP - 1.2);
    for (let x = x0 + 4; x <= x1 - 9; x += 7) palmeirinha(x, z1 - 2.6, 0.24);

    // ===== Estacionamento: 4 fileiras, 50 vagas =====
    const VG = 2.8, nVg = 13, xv0 = x0 + 3;
    const filas = [
      { zc: zP + 8.5, ry: Math.PI, n: 13 }, { zc: zP + 13.5, ry: 0, n: 12 },
      { zc: zP + 24.5, ry: Math.PI, n: 12 }, { zc: zP + 29.5, ry: 0, n: 13 }
    ];
    const faixa = inst(UNIT, 140, 0xf8f9fa);
    faixa.castShadow = false;
    const corpoCarro = paleta(junta([new THREE.BoxGeometry(1.8, 0.7, 4.2).translate(0, 0.62, 0), new THREE.BoxGeometry(1.6, 0.6, 2.2).translate(0, 1.25, -0.2)]), 60);
    const vidroCarro = inst(new THREE.BoxGeometry(1.64, 0.45, 2.24).translate(0, 1.27, -0.2), 60, 0x22303a);
    const rodasCarro = inst(junta([[-0.8, 1.3], [0.8, 1.3], [-0.8, -1.3], [0.8, -1.3]].map(([x, z]) => new THREE.CylinderGeometry(0.36, 0.36, 0.3, 10).rotateZ(Math.PI / 2).translate(x, 0.36, z))), 60, 0x111111);
    const farolCarro = inst(junta([new THREE.BoxGeometry(0.4, 0.14, 0.05).translate(-0.6, 0.75, 2.11), new THREE.BoxGeometry(0.4, 0.14, 0.05).translate(0.6, 0.75, 2.11)]), 60, 0xfff3bf);
    const CORES_EST = [0xf8f9fa, 0xf8f9fa, 0xadb5bd, 0xadb5bd, 0x212529, 0x212529, 0xe03131, 0x1c7ed6, 0x495057, 0xf59f00, 0x2f9e44, 0x862e9c, 0xced4da];
    let vagas = 0, ocupadas = 0;
    filas.forEach(({ zc, ry, n }) => {
      for (let i = 0; i <= n; i++) poe(faixa, xv0 + i * VG, 0.1, zc, 0.12, 0.03, 4.8);
      for (let i = 0; i < n; i++) {
        vagas++;
        const x = xv0 + (i + 0.5) * VG;
        if (r3() < 0.22) continue;
        ocupadas++;
        const xx = x + (r3() - 0.5) * 0.3, zz = zc + (r3() - 0.5) * 0.3, rr = ry + (r3() - 0.5) * 0.06;
        corpoCarro.poe(xx, 0.1, zz, 1, 1, 1, rr, CORES_EST[Math.floor(r3() * CORES_EST.length)]);
        poe(vidroCarro, xx, 0.1, zz, 1, 1, 1, rr);
        poe(rodasCarro, xx, 0.1, zz, 1, 1, 1, rr);
        poe(farolCarro, xx, 0.1, zz, 1, 1, 1, rr);
        bloqueia(xx, zz, 2.0, 4.4);
      }
      if (n < nVg) {
        // Canteiro com árvore no fim da fileira mais curta
        const x = xv0 + (n + 0.5) * VG;
        caixa(2.4, 0.3, 4.4, C.grama, x, 0.1, zc, false);
        malha(new THREE.CylinderGeometry(0.18, 0.24, 2.2, 6), C.tronco, x, 1.5, zc);
        malha(new THREE.SphereGeometry(1.4, 8, 6), C.mata, x, 3.4, zc);
        bloqueia(x, zc, 2.4, 4.4);
      }
    });
    // Faixa de pedestre da praça até o estacionamento, setas no chão e placa de vagas
    for (let k = 0; k < 6; k++) poe(faixa, xm - 2.5 + k, 0.1, zP + 3, 0.5, 0.03, 4.4);
    // Postes altos com duas luminárias
    const posteE = inst(UNIT, 30, 0x868e96);
    const luminaria = inst(UNIT, 60, 0xfff3bf);
    [zP + 19, z1 - 5.6].forEach(z => [x0 + 3, xm - 8, xm + 8, x1 - 2].forEach(x => {
      poe(posteE, x, 0.1, z, 0.22, 8.5, 0.22);
      poe(posteE, x, 8.4, z, 3.2, 0.14, 0.18);
      [-1.5, 1.5].forEach(dx => poe(luminaria, x + dx, 8.2, z, 0.7, 0.18, 0.5));
      bloqueia(x, z, 0.4, 0.4);
    }));
    // Totem na entrada que vem da cidade
    const tx = x1 - 1.2, tz = z1 - 7.5;
    caixa(1.2, 9, 2.6, BR, tx, 0.1, tz);
    plano(placa([["SHOPPING", 80, 70], ["CARAGUA", 80, 160], ["PIXEL", 80, 250], ["50 vagas", 44, 340]], 360, 400, "#0ca678", "#ffffff"), 2.4, 2.7, tx + 0.62, 6.6, tz, Math.PI / 2);
    plano(placa([["SHOPPING", 80, 70], ["CARAGUA", 80, 160], ["PIXEL", 80, 250], ["50 vagas", 44, 340]], 360, 400, "#0ca678", "#ffffff"), 2.4, 2.7, tx - 0.62, 6.6, tz, -Math.PI / 2);
    bloqueia(tx, tz, 1.3, 2.7);

    // ===== Gente: passeando na praça, cruzando o estacionamento e com sacolas perto dos carros =====
    for (let k = 0; k < 14; k++) {
      const naPraca = k < 10;
      pessoasPraia.push({
        partes: criaAndante(estiloBoneco("shopping" + k, k % 2 === 0)),
        x: x0 + 10 + r3() * (W - 12), x0: x0 + 10, x1: x1 - 3,
        z: naPraca ? zF + 1.6 + (k % 3) * 1.3 : (k % 2 ? zP + 19 + 1.6 : z1 - 9.5), dir: r3() < 0.5 ? 1 : -1, vel: 0.7 + r3() * 0.6, fase: r3() * 6
      });
    }
    const SACOLAS = [0xf06595, 0xfab005, 0x1c7ed6, 0xffffff, 0x845ef7];
    [[x0 + 8, zP + 16.5, 0.4], [x0 + 21, zP + 16.4, -0.3], [x1 - 9, zP + 21.6, 2.8], [xm - 3, zP + 5.2, 3.1], [xm + 6, zP + 5.0, 2.9], [x1 - 15, zP + 32.6, 0.2]].forEach(([x, z, ry], k) => {
      bonecoInst(x, 0.1, z, ry, estiloBoneco("sacolas" + k, k % 2 === 0, {
        extra: [[0.42, 0.5, 0.2, -0.62, 0.32, 0.05, SACOLAS[k % 5], "B0"], [0.42, 0.5, 0.2, 0.62, 0.32, 0.05, SACOLAS[(k + 2) % 5], "B1"]]
      }));
      bloqueia(x, z, 0.9, 0.9);
    });
    // Segurança e um quiosque de sorvete na praça
    bonecoInst(xm + EW / 2 + 0.6, 0.2, zF + 0.6, 0, estiloBoneco("seguranca-shopping", false, { camisa: 0x1d1d1d, calca: 0x1d1d1d, sapato: 0x1d1d1d }));
    bloqueia(xm + EW / 2 + 0.6, zF + 0.6, 0.9, 0.9);
    caixa(2.6, 1.2, 1.4, 0xf783ac, x0 + 6, 0.2, zF + 3.4);
    caixa(3.0, 0.15, 1.8, BR, x0 + 6, 2.6, zF + 3.4);
    [-1, 1].forEach(s => caixa(0.1, 1.25, 0.1, BR, x0 + 6 + s * 1.3, 1.4, zF + 3.4, false));
    plano(placa([["SORVETE", 40, 30]], 256, 60, "#f783ac", "#ffffff"), 2.4, 0.56, x0 + 6, 1.0, zF + 4.11);
    bloqueia(x0 + 6, zF + 3.4, 2.6, 1.4);

    ents.push({ t: "Shopping Caragua Pixel", h: "caraguapixel", k: "shopping", oculto: true, x: xm, y: 15, z: (zA + zF) / 2, cor: "#0ca678", alvo: { x: xm, z: zP + 26, yaw: 0 } });
    ents.push({ t: `Estacionamento do shopping · ${vagas} vagas`, h: "caraguapixel", k: "shopping", oculto: true, x: xm, y: 6, z: zP + 19, cor: "#0ca678", alvo: { x: xm, z: z1 + 4, yaw: 0 } });
    window.__shop = { vagas, ocupadas };
    rotuloFixo("Shopping Caragua Pixel", "#0ca678", "#fffaf0", 1.3, xm, 17, (zA + zF) / 2);
  })();

  // ---------- Pixel Motors (loja de carros esportivos) e Boulevard da Praia, na ponta leste da avenida da praia ----------
  const blv = { carros: [], brilhos: [], gira: null, neonCiclo: [], lampadas: [], cortina: [] };
  const CORES_LAMP = [0xfff3bf, 0xffd43b, 0xff8787, 0x74c0fc, 0x8ce99a, 0xf783ac];
  (function () {
    const r2 = semente(4242);
    const BR = 0xf8f9fa, PRETO = 0x1d1d1d, GRAF = 0x212529;
    const NUNITO = '"Nunito Sans", "Segoe UI", sans-serif', PIXEL = '"Silkscreen", "Courier New", monospace', SCRIPT = '"Brush Script MT", "Segoe Script", cursive';
    const fonte = (p, fam = NUNITO, peso = 800) => `${peso} ${p}px ${fam}`;
    const basicos = new Map();
    const neonMat = c => { if (!basicos.has(c)) basicos.set(c, new THREE.MeshBasicMaterial({ color: c })); return basicos.get(c); };
    function neon(w, h, d, c, x, y, z, proprio = false) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), proprio ? new THREE.MeshBasicMaterial({ color: c }) : neonMat(c));
      m.position.set(x, y + h / 2, z);
      scene.add(m);
      if (proprio) blv.neonCiclo.push(m);
      return m;
    }
    function canvasMat(w, h, desenha) {
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      desenha(cv.getContext("2d"), w, h);
      const t = new THREE.CanvasTexture(cv);
      t.anisotropy = 4;
      return new THREE.MeshBasicMaterial({ map: t });
    }
    function plano(m, w, h, x, y, z, ry = 0) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      p.position.set(x, y, z);
      p.rotation.y = ry;
      scene.add(p);
      return p;
    }
    // Texto que encolhe até caber (nada cortado)
    function texto(g, txt, px, x, y, maxW, fam, peso) {
      g.font = fonte(px, fam, peso);
      while (g.measureText(txt).width > maxW && px > 8) g.font = fonte(px -= 2, fam, peso);
      g.fillText(txt, x, y);
    }
    // Letreiro de neon: fundo escuro, letras com brilho e miolo claro
    function letreiro(linhas, w, h, fundo, borda) {
      return canvasMat(w, h, g => {
        g.fillStyle = fundo; g.fillRect(0, 0, w, h);
        if (borda) {
          const lw = Math.max(5, h * 0.05);
          g.strokeStyle = borda; g.lineWidth = lw; g.shadowColor = borda; g.shadowBlur = lw * 2;
          g.strokeRect(lw * 1.5, lw * 1.5, w - lw * 3, h - lw * 3);
          g.shadowBlur = 0;
        }
        g.textAlign = "center"; g.textBaseline = "middle";
        linhas.forEach(([txt, px, y, cor, fam = NUNITO, peso = 800]) => {
          g.fillStyle = cor; g.shadowColor = cor; g.shadowBlur = px * 0.4;
          texto(g, txt, px, w / 2, y, w * 0.86, fam, peso);
          g.shadowBlur = 0; g.globalAlpha = 0.45; g.fillStyle = "#ffffff";
          texto(g, txt, px, w / 2, y, w * 0.86, fam, peso);
          g.globalAlpha = 1;
        });
      });
    }
    // Brilho redondo e suave (para o neon embaixo dos carros)
    const texBrilho = (function () {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 128;
      const g = cv.getContext("2d");
      const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(cv);
    })();

    // Fios com lâmpadas, bandeirinhas e cortina de luz: tudo pendurado em varais com barriga
    const fios = [];
    function varal(ax, ay, az, bx, by, bz, flecha, passo, fn) {
      const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay, bz - az) / passo));
      let ant = null;
      for (let i = 0; i <= n; i++) {
        const t = i / n, p = [ax + (bx - ax) * t, ay + (by - ay) * t - flecha * 4 * t * (1 - t), az + (bz - az) * t];
        if (ant) fios.push(...ant, ...p);
        if (fn && i > 0 && i < n) fn(p, i);
        ant = p;
      }
    }
    const geoBulbo = new THREE.SphereGeometry(0.13, 8, 6);
    const bulbos = [0, 1, 2].map(() => {
      const m = new THREE.InstancedMesh(geoBulbo, new THREE.MeshBasicMaterial({ color: 0xfff3bf }), 260);
      m.count = 0; m.frustumCulled = false; scene.add(m);
      blv.lampadas.push(m);
      return m;
    });
    let nBulbo = 0;
    const bulbo = (x, y, z) => { const m = bulbos[nBulbo++ % 3]; poe(m, x, y, z, 1, 1, 1); };
    const geoGota = new THREE.SphereGeometry(0.06, 6, 4);
    const cortina = [0, 1].map(() => {
      const m = new THREE.InstancedMesh(geoGota, new THREE.MeshBasicMaterial({ color: 0xfff9db }), 500);
      m.count = 0; m.frustumCulled = false; scene.add(m);
      blv.cortina.push(m);
      return m;
    });
    const bandeiras = paleta(new THREE.ConeGeometry(0.26, 0.55, 3).rotateX(Math.PI).translate(0, -0.3, 0), 120);
    const CORES_BAND = [0xe03131, 0xfab005, 0x1c7ed6, 0x2f9e44, 0xf8f9fa, 0xf06595];

    // ---------- Carros esportivos de blocos (frente para +z) ----------
    const Bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
    const RODAS = [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]];
    const geoPneus = junta(RODAS.map(([x, z]) => new THREE.CylinderGeometry(0.42, 0.42, 0.36, 14).rotateZ(Math.PI / 2).translate(x, 0.42, z)));
    const geoAros = junta(RODAS.map(([x, z]) => new THREE.CylinderGeometry(0.27, 0.27, 0.38, 10).rotateZ(Math.PI / 2).translate(x, 0.42, z)));
    const ESTILOS = [
      { // esportivo baixo com asa traseira
        corpo: junta([Bx(2.0, 0.5, 4.5, 0, 0.62, 0), Bx(2.12, 0.34, 1.05, 0, 0.62, 1.45), Bx(2.12, 0.34, 1.05, 0, 0.62, -1.45),
          Bx(1.9, 0.14, 1.5, 0, 0.93, 1.35), Bx(1.9, 0.14, 0.9, 0, 0.93, -1.75), Bx(1.62, 0.1, 1.5, 0, 1.43, -0.3),
          Bx(2.04, 0.08, 0.45, 0, 1.36, -2.05), Bx(0.1, 0.34, 0.1, -0.7, 1.15, -2.0), Bx(0.1, 0.34, 0.1, 0.7, 1.15, -2.0)]),
        vidro: junta([Bx(1.64, 0.42, 1.6, 0, 1.17, -0.3), new THREE.BoxGeometry(1.6, 0.05, 0.8).rotateX(0.9).translate(0, 1.16, 0.75),
          new THREE.BoxGeometry(1.6, 0.05, 0.7).rotateX(-0.9).translate(0, 1.18, -1.33)]),
        escuro: junta([Bx(2.04, 0.12, 2.0, 0, 0.36, 0), Bx(1.2, 0.22, 0.06, 0, 0.5, 2.25), Bx(1.6, 0.14, 0.06, 0, 0.42, -2.25),
          Bx(0.22, 0.1, 0.14, -1.06, 1.05, 0.45), Bx(0.22, 0.1, 0.14, 1.06, 1.05, 0.45)]),
        farol: junta([Bx(0.5, 0.12, 0.06, -0.62, 0.78, 2.25), Bx(0.5, 0.12, 0.06, 0.62, 0.78, 2.25)]),
        lanterna: junta([Bx(0.55, 0.1, 0.06, -0.6, 0.8, -2.25), Bx(0.55, 0.1, 0.06, 0.6, 0.8, -2.25)])
      },
      { // cupê quadradinho dos anos 80
        corpo: junta([Bx(1.96, 0.56, 4.4, 0, 0.64, 0), Bx(2.08, 0.3, 1.0, 0, 0.6, 1.45), Bx(2.08, 0.3, 1.0, 0, 0.6, -1.45),
          Bx(1.9, 0.08, 1.4, 0, 0.96, 1.45), Bx(1.9, 0.1, 1.0, 0, 0.96, -1.7), Bx(1.7, 0.1, 1.9, 0, 1.56, -0.3), Bx(1.9, 0.1, 0.2, 0, 1.06, -2.12)]),
        vidro: junta([Bx(1.72, 0.5, 1.85, 0, 1.26, -0.3)]),
        escuro: junta([Bx(1.3, 0.18, 0.06, 0, 0.72, 2.21), Bx(2.0, 0.06, 3.6, 0, 0.66, 0), Bx(2.02, 0.14, 0.24, 0, 0.42, 2.18),
          Bx(2.02, 0.14, 0.24, 0, 0.42, -2.18), Bx(0.22, 0.1, 0.14, -1.04, 1.1, 0.5), Bx(0.22, 0.1, 0.14, 1.04, 1.1, 0.5)]),
        farol: junta([-0.75, -0.45, 0.45, 0.75].map(x => Bx(0.24, 0.2, 0.06, x, 0.74, 2.22))),
        lanterna: junta([Bx(0.6, 0.16, 0.06, -0.6, 0.82, -2.21), Bx(0.6, 0.16, 0.06, 0.6, 0.82, -2.21)])
      }
    ];
    const matVidroCarro = new THREE.MeshStandardMaterial({ color: 0x1f2a36, roughness: 0.15, metalness: 0.4, flatShading: true });
    const matCromo = new THREE.MeshStandardMaterial({ color: 0xdee2e6, roughness: 0.25, metalness: 0.6, flatShading: true });
    const matFarol = new THREE.MeshBasicMaterial({ color: 0xfff9db }), matLanterna = new THREE.MeshBasicMaterial({ color: 0xff3b3b });
    function carro(x, y, z, ry, cor, estilo, corNeon, pai) {
      const g = new THREE.Group(), e = ESTILOS[estilo];
      [[e.corpo, mat(cor)], [e.vidro, matVidroCarro], [e.escuro, mat(PRETO)], [e.farol, matFarol], [e.lanterna, matLanterna], [geoPneus, mat(0x111111)], [geoAros, matCromo]].forEach(([geo, m]) => {
        const o = new THREE.Mesh(geo, m);
        o.castShadow = true;
        g.add(o);
      });
      if (corNeon != null) {
        // Neon embaixo do carro: tubo aceso nas laterais e o brilho colorido no chão
        const mb = new THREE.MeshBasicMaterial({ map: texBrilho, color: corNeon, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
        const p = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 6.8), mb);
        p.rotation.x = -Math.PI / 2;
        p.position.y = 0.04;
        g.add(p);
        g.add(new THREE.Mesh(junta([Bx(0.07, 0.07, 3.4, -0.92, 0.24, 0), Bx(0.07, 0.07, 3.4, 0.92, 0.24, 0), Bx(1.7, 0.07, 0.07, 0, 0.24, 2.12), Bx(1.7, 0.07, 0.07, 0, 0.24, -2.12)]), neonMat(corNeon)));
        blv.brilhos.push({ m: mb, fase: blv.brilhos.length * 1.3 });
      }
      g.position.set(x, y, z);
      g.rotation.y = ry;
      (pai || scene).add(g);
      blv.carros.push(g);
      return g;
    }
    const ent = (t, x, y, z, alvo) => ents.push({ t, h: "caraguapixel", k: "boulevard", oculto: true, x, y, z, cor: "#7048e8", alvo });

    // Calçada do lado das lojas, ao longo da avenida
    caixa(BV.x1 + 8 - (XMAX + 5), 0.22, 1.4, C.calcada, (XMAX + 5 + BV.x1 + 8) / 2, 0, 21.9, false);

    // ================= Pixel Motors =================
    const cx = XMAX + 34, zF = 10, hS = 7, y0 = 0.2;
    caixa(44, y0, 34, 0xced4da, cx, 0, 4, false);
    caixa(39.4, 0.06, 21.4, 0xf1f3f5, cx, y0, -1.2, false);
    // Paredes, teto e a frente toda de vidro
    caixa(40.6, hS, 0.6, GRAF, cx, y0, -12.2); bloqueia(cx, -12.2, 40.6, 0.6);
    [-1, 1].forEach(s => { caixa(0.6, hS, 22.6, GRAF, cx + s * 20, y0, -1.2); bloqueia(cx + s * 20, -1.2, 0.6, 22.6); });
    caixa(41.4, 0.7, 23.6, GRAF, cx, y0 + hS, -1.2);
    const vitrine = new THREE.Mesh(new THREE.BoxGeometry(39.4, hS, 0.12), new THREE.MeshStandardMaterial({ color: 0xa5d8ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.3 }));
    vitrine.position.set(cx, y0 + hS / 2, zF);
    scene.add(vitrine);
    [-19.7, -13.4, -7.1, -3, 3, 7.1, 13.4, 19.7].forEach(dx => caixa(0.22, hS, 0.3, 0x343a40, cx + dx, y0, zF, false));
    bloqueia(cx - 11.4, zF, 16.8, 0.5); bloqueia(cx + 11.4, zF, 16.8, 0.5);
    // Letreiro de neon na fachada
    caixa(41.4, 2.6, 0.5, 0x0b0d12, cx, y0 + hS + 0.7, zF + 0.2);
    plano(letreiro([["PIXEL MOTORS", 112, 84, "#ff4fd8", PIXEL, 700], ["CARROS ESPORTIVOS · CARAGUATATUBA", 40, 168, "#66e8ff"]], 1024, 208, "#0b0d12"), 22, 2.3, cx, y0 + hS + 2.0, zF + 0.47);
    neon(41.6, 0.14, 0.14, 0xff4fd8, cx, y0 + hS + 0.62, zF + 0.5, true);
    neon(41.6, 0.14, 0.14, 0x66e8ff, cx, y0 + hS + 3.2, zF + 0.5, true);
    [-1, 1].forEach(s => neon(0.14, hS + 0.6, 0.14, 0x66e8ff, cx + s * 20.4, y0, zF + 0.4));
    // Lá dentro: carro girando no prato, mais dois esportivos, spots no teto, balcão e vendedor
    const prato = new THREE.Group();
    prato.position.set(cx, y0 + 0.06, -2);
    scene.add(prato);
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.24, 32), mat(0xdee2e6));
    disco.position.y = 0.12; disco.receiveShadow = true;
    prato.add(disco);
    const anel = new THREE.Mesh(new THREE.TorusGeometry(3.62, 0.07, 6, 48).rotateX(Math.PI / 2), neonMat(0x66e8ff));
    anel.position.set(cx, y0 + 0.2, -2);
    scene.add(anel);
    carro(0, 0.24, 0, 0, 0xfcc419, 0, null, prato);
    blv.gira = prato;
    bloqueia(cx, -2, 7.4, 7.4);
    carro(cx - 12, y0 + 0.06, -3, 0.6, 0xe03131, 1, null);
    carro(cx + 12, y0 + 0.06, -3, -0.6, 0xf8f9fa, 0, null);
    bloqueia(cx - 12, -3, 3.6, 4.6); bloqueia(cx + 12, -3, 3.6, 4.6);
    for (let k = 0; k < 6; k++) neon(1.2, 0.08, 1.2, 0xfffbe6, cx - 15 + k * 6, y0 + hS - 0.1, -1.5);
    plano(letreiro([["SEU ESPORTIVO ESTÁ AQUI", 64, 56, "#ffd43b"], ["compra · venda · troca · financiamento", 34, 128, "#ffffff"]], 1024, 180, "#151922", "#ff4fd8"), 16, 2.8, cx, 4.4, -11.86);
    caixa(3.4, 1.1, 1.2, BR, cx + 13, y0, -9.6); bloqueia(cx + 13, -9.6, 3.4, 1.2);
    bonecoInst(cx + 13, y0, -10.7, 0, estiloBoneco("vendedor-motors", false, { camisa: 0x343a40, calca: 0x1d1d1d, sapato: 0x1d1d1d }));
    [[cx - 5.2, 2.8], [cx + 4.6, 3.2], [cx - 9, -6.5]].forEach(([x, z], k) => {
      bonecoInst(x, y0, z, Math.atan2(cx - x, -2 - z), estiloBoneco("cliente-motors" + k, k === 1));
      bloqueia(x, z, 0.9, 0.9);
    });
    // Pátio da frente com três carros à mostra e bandeirinhas
    [[cx - 13, 0.35, 0x1c7ed6, 1], [cx, 0, 0xf06595, 0], [cx + 13, -0.35, 0x2f9e44, 0]].forEach(([x, ry, cor, est]) => {
      carro(x, y0, 16, ry, cor, est, null);
      bloqueia(x, 16, 3.4, 4.8);
      plano(letreiro([["À VENDA", 46, 34, "#1d2a33"]], 256, 64, "#ffd43b"), 1.3, 0.32, x + Math.sin(ry) * 2.32, y0 + 0.62, 16 + Math.cos(ry) * 2.32, ry);
    });
    [-1, 1].forEach(s => { caixa(0.2, 5, 0.2, 0xadb5bd, cx + s * 20.5, y0, 21); bloqueia(cx + s * 20.5, 21, 0.3, 0.3); });
    let nb = 0;
    const flamula = p => bandeiras.poe(p[0], p[1], p[2], 1, 1, 1, 0, CORES_BAND[nb++ % CORES_BAND.length]);
    [[cx - 20.5, cx - 20.5], [cx + 20.5, cx + 20.5], [cx, cx - 20.5], [cx, cx + 20.5]].forEach(([ax, bx]) => varal(ax, y0 + hS + 0.7, zF + 0.5, bx, y0 + 5, 21, 0.7, 0.75, flamula));
    // Totem de neon na calçada
    caixa(1.6, 10, 1.6, 0x0b0d12, cx + 23.5, y0, 19.5);
    bloqueia(cx + 23.5, 19.5, 1.7, 1.7);
    const mTotem = letreiro([["PIXEL", 92, 90, "#ff4fd8", PIXEL, 700], ["MOTORS", 92, 200, "#66e8ff", PIXEL, 700], ["esportivos", 44, 300, "#ffd43b"]], 384, 360, "#0b0d12", "#ff4fd8");
    plano(mTotem, 3.2, 3.0, cx + 23.5, y0 + 8.4, 20.31);
    plano(mTotem, 3.2, 3.0, cx + 23.5, y0 + 8.4, 18.69, Math.PI);
    caixa(3.6, 3.4, 1.6, 0x0b0d12, cx + 23.5, y0 + 6.7, 19.5);
    neon(3.8, 0.12, 1.8, 0xff4fd8, cx + 23.5, y0 + 10.1, 19.5, true);
    ent("Pixel Motors · loja de carros esportivos", cx, 14, zF, { x: cx, z: 46, yaw: 0 });
    ent("Pixel Motors · carro girando na vitrine", cx, 6, -2, { x: cx, z: 18, yaw: 0 });

    // ================= Esportivos estacionados na avenida, com neon embaixo =================
    const zR = 24.3;
    const RUA = [
      [XMAX + 15, 0xa61e7a, 0, 0xff2bd6], [XMAX + 22, 0xe03131, 1, 0xff3b3b], [XMAX + 36, 0xfcc419, 0, 0x22e4ff], [XMAX + 43, 0xced4da, 1, 0x4dabf7],
      [XMAX + 68, 0xf8f9fa, 0, 0x9b5cff], [XMAX + 75, 0x212529, 0, 0x00ff9c], [XMAX + 104, 0x1c7ed6, 1, 0xff4fd8], [XMAX + 111, 0xff922b, 0, 0xfff066]
    ];
    RUA.forEach(([x, cor, est, cn], k) => {
      carro(x, 0.1, zR, k === 5 ? -Math.PI / 2 : Math.PI / 2, cor, est, cn);
      bloqueia(x, zR, 4.8, 2.3);
    });
    // Moça encostada no esportivo roxo e um rapaz admirando o preto
    bonecoInst(XMAX + 15.4, 0.1, zR + 1.45, 0, estiloBoneco("garota-neon", true, { cabelo: 0x1d1d1d, camisa: 0xf1f3f5, calca: 0x495057, sapato: 0xf8f9fa }));
    bloqueia(XMAX + 15.4, zR + 1.45, 0.9, 0.9);
    bonecoInst(XMAX + 75, 0.1, zR + 2.4, Math.PI - 0.3, estiloBoneco("rapaz-neon", false, { camisa: 0x1d1d1d, calca: 0x343a40 }));
    bloqueia(XMAX + 75, zR + 2.4, 0.9, 0.9);
    ent("Esportivos com neon embaixo", XMAX + 40, 5, zR, { x: XMAX + 40, z: 38, yaw: 0 });

    // ================= Boulevard da Praia =================
    const SW = 8.2, NL = 8, bx0 = XMAX + 62, bx1 = bx0 + SW * NL, bcx = (bx0 + bx1) / 2, zT = -6, zL = 4, yb = 0.14, hL = 5.2;
    // Calçadão de ondas pretas e brancas, como os da orla
    const texOnda = texturaCanvas(256, 256, (g, w, h) => {
      g.fillStyle = "#f1ece2"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#2b2b2b";
      for (let k = 0; k < 4; k++) {
        const y = k * 64;
        g.beginPath();
        for (let x = 0; x <= w; x += 4) g.lineTo(x, y + 18 + 13 * Math.sin(x / w * Math.PI * 4));
        for (let x = w; x >= 0; x -= 4) g.lineTo(x, y + 42 + 13 * Math.sin(x / w * Math.PI * 4));
        g.closePath(); g.fill();
      }
    }, (bx1 - bx0 + 4) / 7, 18 / 7);
    const matLado = mat(0xd6d2ca);
    const calcadao = new THREE.Mesh(new THREE.BoxGeometry(bx1 - bx0 + 4, yb, 18), [matLado, matLado, new THREE.MeshStandardMaterial({ map: texOnda, roughness: 0.9 }), matLado, matLado, matLado]);
    calcadao.position.set(bcx, yb / 2, 13);
    calcadao.receiveShadow = true;
    scene.add(calcadao);
    caixa(bx1 - bx0 + 4, yb, 11, 0xbfb8aa, bcx, 0, -1, false);
    bloqueia(bcx, (zT + zL) / 2, bx1 - bx0, zL - zT);
    // Interior de cada loja pintado atrás do vidro
    const INTERIOR = {
      pizza(g, w, h) {
        g.fillStyle = "#6b2d1c"; g.fillRect(0, 0, w, h);
        g.fillStyle = "#7d3826";
        for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 0 : 16; x < w; x += 32) g.fillRect(x + 1, y + 1, 30, 14);
        g.fillStyle = "#3b1d12"; g.beginPath(); g.ellipse(w * 0.3, h * 0.62, 90, 80, 0, Math.PI, 0); g.fill();
        const gr = g.createRadialGradient(w * 0.3, h * 0.6, 4, w * 0.3, h * 0.6, 60);
        gr.addColorStop(0, "#fff3bf"); gr.addColorStop(0.4, "#ff922b"); gr.addColorStop(1, "rgba(224,49,49,0)");
        g.fillStyle = gr; g.beginPath(); g.ellipse(w * 0.3, h * 0.64, 54, 40, 0, Math.PI, 0); g.fill();
        g.fillStyle = "#1d1d1d"; g.fillRect(w * 0.62, 40, 150, 90);
        g.fillStyle = "#ffffff"; g.font = fonte(22); g.textAlign = "center"; g.fillText("CARDÁPIO", w * 0.62 + 75, 70);
        g.font = fonte(14, NUNITO, 700); g.fillText("calabresa · marguerita", w * 0.62 + 75, 96); g.fillText("portuguesa · 4 queijos", w * 0.62 + 75, 116);
        g.fillStyle = "#8d5524"; g.fillRect(0, h * 0.68, w, h * 0.32);
        g.fillStyle = "#a0522d"; g.fillRect(0, h * 0.68, w, 10);
      },
      burger(g, w, h) {
        g.fillStyle = "#212529"; g.fillRect(0, 0, w, h);
        g.strokeStyle = "#ffd43b"; g.lineWidth = 6; g.shadowColor = "#ffd43b"; g.shadowBlur = 14;
        g.beginPath(); g.arc(w * 0.5, 92, 46, Math.PI, 0); g.stroke();
        g.strokeStyle = "#ff6b6b"; g.beginPath(); g.moveTo(w * 0.5 - 50, 104); g.lineTo(w * 0.5 + 50, 104); g.stroke();
        g.strokeStyle = "#ffd43b"; g.beginPath(); g.moveTo(w * 0.5 - 46, 120); g.lineTo(w * 0.5 + 46, 120); g.stroke();
        g.shadowBlur = 0;
        g.fillStyle = "#c92a2a"; g.fillRect(16, 140, 110, 70); g.fillRect(w - 126, 140, 110, 70);
        g.fillStyle = "#adb5bd"; g.fillRect(0, h * 0.72, w, h * 0.28);
        g.fillStyle = "#e9ecef"; g.fillRect(0, h * 0.72, w, 8);
      },
      yaki(g, w, h) {
        g.fillStyle = "#8a1c1c"; g.fillRect(0, 0, w, h);
        [90, 256, 422].forEach(x => {
          g.fillStyle = "#ff4d4d"; g.beginPath(); g.ellipse(x, 60, 30, 36, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = "#ffd43b"; g.fillRect(x - 18, 22, 36, 6); g.fillRect(x - 18, 92, 36, 6);
        });
        g.fillStyle = "#1d1d1d"; g.beginPath(); g.ellipse(w * 0.5, 170, 70, 22, 0, 0, Math.PI); g.fill();
        g.fillStyle = "#ff922b"; g.globalAlpha = 0.8; g.beginPath(); g.moveTo(w * 0.5 - 40, 170); g.quadraticCurveTo(w * 0.5, 100, w * 0.5 + 40, 170); g.fill(); g.globalAlpha = 1;
        g.fillStyle = "#5c3d2e"; g.fillRect(0, h * 0.72, w, h * 0.28);
      },
      temaki(g, w, h) {
        g.fillStyle = "#e9d3b0"; g.fillRect(0, 0, w, h);
        g.fillStyle = "#c9a77a"; for (let x = 0; x < w; x += 24) g.fillRect(x, 0, 4, h);
        g.fillStyle = "#c92a2a"; g.beginPath(); g.arc(w * 0.5, 74, 40, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#dbe4ea"; g.fillRect(40, 150, w - 80, 34);
        for (let x = 60; x < w - 60; x += 46) { g.fillStyle = "#ff8a5c"; g.fillRect(x, 158, 30, 12); g.fillStyle = "#f8f9fa"; g.fillRect(x, 170, 30, 8); }
        g.fillStyle = "#8d5524"; g.fillRect(0, h * 0.74, w, h * 0.26);
      }
    };
    const matTelha = new THREE.MeshStandardMaterial({
      map: texturaCanvas(64, 64, (g, w, h) => {
        g.fillStyle = "#b5562f"; g.fillRect(0, 0, w, h);
        g.fillStyle = "#8f3f22"; g.fillRect(0, h - 10, w, 10); g.fillRect(w - 6, 0, 6, h);
        g.fillStyle = "#cf6a3f"; g.fillRect(4, 4, w - 16, 10);
      }, (bx1 - bx0 + 1) / 0.7, 3.4 / 0.7),
      roughness: 0.9, flatShading: true
    });
    const LOJAS = [
      { nome: "Pizzaria Bella Caragua", fach: 0x8c4a32, placa: [["PIZZARIA", 54, 40, "#ffe8a3"], ["Bella Caragua", 66, 98, "#ffffff", SCRIPT, 700]], fundo: "#4a2215", borda: "#f4a62a", int: "pizza", mesa: 0xf8f9fa, sol: 0x2f9e44, comida: "pizza" },
      { nome: "Pixel Burger · hamburgueria", fach: 0x1d1d1d, placa: [["PIXEL BURGER", 64, 46, "#ffd43b", PIXEL, 700], ["HAMBURGUERIA ARTESANAL", 30, 104, "#ff8787"]], fundo: "#111111", borda: "#ffd43b", int: "burger", mesa: 0xe03131, sol: 0xfab005, comida: "burger" },
      { nome: "Yakisoba Caiçara", fach: 0xb02525, placa: [["YAKISOBA", 68, 46, "#fff3bf"], ["CAIÇARA · comida chinesa", 30, 104, "#ffd43b"]], fundo: "#6e0f0f", borda: "#ffd43b", int: "yaki", mesa: 0xfab005, sol: 0xe03131, comida: "yaki" },
      { nome: "Temakeria Sol Nascente · comida japonesa", fach: 0xd9b38c, placa: [["TEMAKERIA", 62, 44, "#1d1d1d"], ["SOL NASCENTE · comida japonesa", 28, 102, "#c92a2a"]], fundo: "#fffaf0", borda: "#c92a2a", int: "temaki", mesa: 0x343a40, sol: 0xf8f9fa, comida: "temaki" }
    ];
    const NEON_PIL = [0xff4fd8, 0x66e8ff];
    for (let n = 0; n < NL; n++) {
      const x = bx0 + SW * (n + 0.5), L = LOJAS[n];
      caixa(SW, hL, zL - zT, L ? L.fach : 0xe9ecef, x, yb, (zT + zL) / 2);
      // Pilar com tubo de neon entre as lojas
      caixa(0.5, hL + 0.3, 0.5, 0xf1e3c8, x - SW / 2, yb, zL + 0.05, false);
      neon(0.12, 3.6, 0.1, NEON_PIL[n % 2], x - SW / 2, yb + 0.3, zL + 0.34);
      if (L) {
        plano(canvasMat(512, 256, INTERIOR[L.int]), SW - 1.3, 3.3, x, yb + 1.8, zL + 0.03);
        [-1, 1].forEach(s => caixa(0.2, 3.5, 0.16, 0x2b2b2b, x + s * (SW - 1.1) / 2, yb, zL + 0.06, false));
        caixa(SW - 1.1, 0.2, 0.16, 0x2b2b2b, x, yb + 3.45, zL + 0.06, false);
        plano(letreiro(L.placa, 768, 132, L.fundo, L.borda), SW - 0.9, 1.3, x, yb + 4.35, zL + 0.04);
        ent(L.nome, x, n % 2 ? 7.6 : 9.2, zL, { x, z: 18, yaw: 0 });
        // Mesas no calçadão, guarda-sol quadrado e comida na mesa
        [[x - 1.9, 10.4], [x + 1.9, 14.0]].forEach(([mx, mz]) => {
          mesas.poe(mx, yb, mz, 1, 1, 1, 0, L.mesa);
          [[0, 1.15, Math.PI], [0, -1.15, 0], [1.15, 0, -Math.PI / 2], [-1.15, 0, Math.PI / 2]].forEach(([dx, dz, ry]) => cadPlastico.poe(mx + dx, yb, mz + dz, 1, 1, 1, ry, L.mesa));
          caixa(0.1, 2.7, 0.1, 0xced4da, mx, yb + 1.0, mz, false);
          malha(new THREE.ConeGeometry(2.0, 0.6, 4), L.sol, mx, yb + 3.85, mz).rotation.y = Math.PI / 4;
          const yM = yb + 1.0;
          if (L.comida === "pizza") {
            malha(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 16), 0xf4a62a, mx, yM + 0.03, mz, false);
            malha(new THREE.CylinderGeometry(0.35, 0.35, 0.02, 16), 0xd9480f, mx, yM + 0.06, mz, false);
          } else if (L.comida === "burger") {
            [-0.25, 0.25].forEach(dx => {
              malha(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 10), 0xe8a33d, mx + dx, yM + 0.04, mz, false);
              malha(new THREE.CylinderGeometry(0.18, 0.18, 0.07, 10), 0x5c3317, mx + dx, yM + 0.11, mz, false);
              malha(new THREE.SphereGeometry(0.17, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0xe8a33d, mx + dx, yM + 0.15, mz, false);
            });
          } else if (L.comida === "yaki") {
            [-0.25, 0.25].forEach(dx => { caixa(0.3, 0.26, 0.3, BR, mx + dx, yM, mz, false); caixa(0.26, 0.05, 0.26, 0xf2c94c, mx + dx, yM + 0.26, mz, false); });
          } else {
            [-0.22, 0.22].forEach(dx => {
              const c = malha(new THREE.ConeGeometry(0.13, 0.42, 8).rotateX(Math.PI), 0x2b4a2b, mx + dx, yM + 0.25, mz, false);
              c.rotation.z = 0.4 * Math.sign(dx);
              malha(new THREE.SphereGeometry(0.11, 8, 6), 0xff8a5c, mx + dx * 1.35, yM + 0.46, mz, false);
            });
          }
          bloqueia(mx, mz, 1.8, 1.8);
        });
        bonecoInst(x + 1.0, yb, 7.6, Math.PI / 2, estiloBoneco("garcom-blv" + n, n % 2 === 1, { camisa: L.comida === "temaki" ? 0x1c2f5a : 0xf8f9fa, calca: 0x1d1d1d, sapato: 0x1d1d1d, chapeu: L.comida === "pizza" ? 0xf8f9fa : undefined }));
        bloqueia(x + 1.0, 7.6, 0.9, 0.9);
      } else {
        // Loja vazia para alugar: porta de aço, placa ALUGA-SE e número
        const num = n - LOJAS.length + 1;
        caixa(SW - 1.0, 3.3, 0.1, 0x9aa3ab, x, yb, zL + 0.06, false);
        for (let k = 1; k < 9; k++) caixa(SW - 1.0, 0.04, 0.12, 0x7b858e, x, yb + k * 0.37, zL + 0.08, false);
        plano(canvasMat(256, 128, (g, w, h) => {
          g.fillStyle = "#fffaf0"; g.fillRect(0, 0, w, h);
          g.strokeStyle = "#e03131"; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
          g.fillStyle = "#e03131"; g.textAlign = "center"; g.textBaseline = "middle";
          texto(g, "ALUGA-SE", 54, w / 2, 50, w * 0.86);
          g.fillStyle = "#1d2a33"; texto(g, "@caraguapixel", 26, w / 2, 96, w * 0.86, NUNITO, 700);
        }), 2.6, 1.3, x, yb + 1.9, zL + 0.14);
        plano(letreiro([["LOJA " + num, 56, 44, "#ffd43b"], ["DISPONÍVEL", 32, 100, "#ffffff"]], 768, 132, "#343a40", "#ffd43b"), SW - 0.9, 1.3, x, yb + 4.35, zL + 0.04);
        ents.push({ t: `Boulevard da Praia · Loja ${num} para alugar`, h: "caraguapixel", k: "loja", x, y: n % 2 ? 7.6 : 9.2, z: zL, cor: "#f59f00", alvo: { x, z: 18, yaw: 0 } });
      }
    }
    caixa(0.5, hL + 0.3, 0.5, 0xf1e3c8, bx1, yb, zL + 0.05, false);
    neon(0.12, 3.6, 0.1, NEON_PIL[NL % 2], bx1, yb + 0.3, zL + 0.34);
    caixa(bx1 - bx0 + 0.6, 0.4, 0.5, 0xf1e3c8, bcx, yb + hL, zL - 0.2);
    // Beiral de telhas por toda a frente, com pilares de madeira e a cortina de luz pendurada
    const beiral = new THREE.Mesh(new THREE.BoxGeometry(bx1 - bx0 + 1, 0.22, 3.4).rotateX(0.2), matTelha);
    beiral.position.set(bcx, yb + hL - 0.05, zL + 1.55);
    beiral.castShadow = true;
    scene.add(beiral);
    const zBeira = zL + 3.2, yBeira = yb + hL - 0.05 - 1.7 * Math.sin(0.2) - 0.12;
    for (let k = 0; k <= NL; k++) { caixa(0.24, yBeira - yb, 0.24, 0x5c3d2e, bx0 + k * SW, yb, zBeira - 0.1); bloqueia(bx0 + k * SW, zBeira - 0.1, 0.3, 0.3); }
    fios.push(bx0 - 0.4, yBeira, zBeira + 0.05, bx1 + 0.4, yBeira, zBeira + 0.05);
    let nG = 0;
    for (let x = bx0 - 0.3; x <= bx1 + 0.3; x += 0.42) {
      const fio = 2 + (nG % 3), m = cortina[nG++ % 2];
      for (let j = 0; j < fio; j++) poe(m, x, yBeira - 0.2 - j * 0.26, zBeira + 0.05, 1, 1, 1);
    }
    // Lanternas vermelhas no yakisoba e brancas na temakeria
    [[2, 0xff4d4d], [3, 0xfff5e6]].forEach(([n, cor]) => [-2.2, 2.2].forEach(dx => {
      const x = bx0 + SW * (n + 0.5) + dx;
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), neonMat(cor));
      l.scale.y = 1.25; l.position.set(x, yBeira - 0.95, zL + 1.6); scene.add(l);
      caixa(0.5, 0.1, 0.5, 0xd4a017, x, yBeira - 0.48, zL + 1.6, false);
      caixa(0.5, 0.1, 0.5, 0xd4a017, x, yBeira - 1.52, zL + 1.6, false);
      caixa(0.04, 0.8, 0.04, 0x1d1d1d, x, yBeira - 0.42, zL + 1.6, false);
    }));
    // Noren azul na porta da temakeria
    const xTem = bx0 + SW * 3.5;
    plano(canvasMat(256, 64, (g, w, h) => {
      g.fillStyle = "#1c2f5a"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#f8f9fa"; g.beginPath(); g.arc(w / 2, h / 2, 18, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#1c2f5a"; g.fillRect(w / 3 - 2, 18, 4, h); g.fillRect(2 * w / 3 - 2, 18, 4, h);
    }), 4.4, 1.0, xTem, yb + 3.0, zL + 0.12);
    // Letreiro grande no telhado
    const yTop = yb + hL + 0.4;
    [-12, 12].forEach(dx => caixa(0.3, 1.0, 0.3, 0x343a40, bcx + dx, yTop, zL - 1.2, false));
    caixa(27, 3.4, 0.4, 0x0b0d12, bcx, yTop + 1.0, zL - 1.2);
    plano(letreiro([["BOULEVARD DA PRAIA", 96, 74, "#ffd43b"], ["gastronomia · lojas · noite na orla", 40, 150, "#66e8ff"]], 1024, 200, "#0b0d12"), 25.6, 3.1, bcx, yTop + 2.7, zL - 0.99);
    neon(27.4, 0.14, 0.14, 0xff4fd8, bcx, yTop + 0.92, zL - 0.94, true);
    neon(27.4, 0.14, 0.14, 0xff4fd8, bcx, yTop + 4.38, zL - 0.94, true);
    [-1, 1].forEach(s => neon(0.14, 3.6, 0.14, 0xff4fd8, bcx + s * 13.65, yTop + 0.92, zL - 0.94, true));
    // Postes e varais de lâmpadas coloridas em zigue-zague por cima do calçadão
    const zP = 20.8, yP = yb + 5.4;
    for (let k = 0; k <= NL; k++) {
      const x = bx0 + k * SW;
      caixa(0.18, 5.4, 0.18, 0x343a40, x, yb, zP);
      const globo = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), neonMat(0xfff3bf));
      globo.position.set(x, yP + 0.25, zP);
      scene.add(globo);
      bloqueia(x, zP, 0.3, 0.3);
      if (k < NL) {
        varal(x + SW / 2, yBeira, zBeira, x, yP, zP, 1.0, 0.62, p => bulbo(p[0], p[1] - 0.12, p[2]));
        varal(x + SW / 2, yBeira, zBeira, x + SW, yP, zP, 1.0, 0.62, p => bulbo(p[0], p[1] - 0.12, p[2]));
        varal(x, yP, zP, x + SW, yP, zP, 0.6, 0.62, p => bulbo(p[0], p[1] - 0.12, p[2]));
        // Floreira com palmeirinha entre os postes
        caixa(1.4, 0.6, 1.4, 0x8d6e63, x + SW / 2, yb, zP - 0.4);
        malha(new THREE.SphereGeometry(0.75, 8, 6), C.mata, x + SW / 2, yb + 1.05, zP - 0.4);
        bloqueia(x + SW / 2, zP - 0.4, 1.4, 1.4);
      }
    }
    // Gente passeando no calçadão
    for (let k = 0; k < 12; k++) {
      pessoasPraia.push({
        partes: criaAndante(estiloBoneco("boulevard" + k, k % 2 === 1)),
        x: bx0 + 1 + r2() * (bx1 - bx0 - 2), x0: bx0 + 1, x1: bx1 - 1, z: 16.6 + r2() * 2.6, dir: r2() < 0.5 ? 1 : -1, vel: 0.7 + r2() * 0.6, fase: r2() * 6
      });
    }
    ent("Boulevard da Praia", bcx, 13, zL - 1.2, { x: bcx, z: 46, yaw: 0 });

    // Fios de todos os varais numa malha só
    const geoFios = new THREE.BufferGeometry();
    geoFios.setAttribute("position", new THREE.Float32BufferAttribute(fios, 3));
    scene.add(new THREE.LineSegments(geoFios, new THREE.LineBasicMaterial({ color: 0x343a40 })));
    bulbos.forEach(m => { m.instanceMatrix.needsUpdate = true; });
    cortina.forEach(m => { m.instanceMatrix.needsUpdate = true; });
    rotuloFixo("Pixel Motors · carros esportivos", "#d6336c", "#fffaf0", 1.2, cx, 16, -1);
    rotuloFixo("Boulevard da Praia", "#7048e8", "#fffaf0", 1.3, bcx, 15.5, -1);
  })();
  function atualizaBoulevard(dt, t) {
    if (!reduz) blv.gira.rotation.y += dt * 0.35;
    blv.brilhos.forEach(b => { b.m.opacity = reduz ? 0.8 : 0.62 + 0.33 * Math.sin(t * 2.2 + b.fase); });
    if (reduz) return;
    const h = t * 0.07;
    blv.neonCiclo.forEach((m, k) => m.material.color.setHSL((h + k * 0.13) % 1, 1, 0.62));
    const passo = Math.floor(t * 1.4);
    blv.lampadas.forEach((m, k) => m.material.color.setHex(CORES_LAMP[(passo + k * 2) % CORES_LAMP.length]));
    const tw = Math.floor(t * 2.5) % 2;
    blv.cortina[0].material.color.setHex(tw ? 0xfff9db : 0xd0e4ff);
    blv.cortina[1].material.color.setHex(tw ? 0xd0e4ff : 0xfff9db);
  }

  // Cadeia Pública e detentos livres andando pelo pátio, portão e ruas vizinhas
  let portaoCadeia = null, obsPortao = null, lampadaPortao = null, aberturaPortao = 1, forcarPortaoCadeiaAberto = false;
  let presoPertoPortao = false, modoFugaPolicia = false, presoQuadro = 0;
  const presosCadeia = [];
  function alturaPreso(x, z) {
    const base = altura(x, z);
    if (base > 0) return base;
    if (Math.abs(x - JX) <= 33 && Math.abs(z - JZ) <= 33) return 0.3;
    if (x >= XMIN - 5 && x <= XMAX + 5 && z >= ZMIN - 8 && z <= 34) {
      const c = Math.round(x / PASSO_X + (COLS - 1) / 2);
      const r = Math.round((11 - z) / PZ);
      if (c >= 0 && c < COLS && r >= 0 && r < ROWS && Math.abs(x - XC(c)) <= 22.1 && Math.abs(z - ZC(r)) <= 11.1) {
        return 0.32;
      }
      return 0.1;
    }
    if (x > XMAX + 4 && x <= BV.x1 + 8 && z >= 22 && z <= 35.4) return z >= 34 ? 0.28 : 0.1;
    if (x > XMAX && x <= JX - 32 && Math.abs(z - JZ) <= 5) return 0.1;
    return 0;
  }
  function syncPresoVisual(p, animar = true) {
    const py = alturaPreso(p.x, p.z);
    const pulo = animar && !reduz && p.andando ? Math.abs(Math.sin(p.fase)) * 0.12 : 0;
    poeAndante(p.partes, p.x, py + pulo, p.z, p.ry, p.fase, animar && p.andando);
    pessoaCorpo.poe(p.x, py + pulo + 0.8, p.z, 0.82, 0.74, 0.44, p.ry, null, p.hp);
    p.ent.y = py + 3.9 + p.yOff;
  }
  let atualizaPresos = () => {};
  (function () {
    const L = 64, m = L / 2, hM = 5.5;
    caixa(L + 2, 0.3, L + 2, C.concreto, JX, 0, JZ, false);
    caixa(L, hM, 1.2, C.muro, JX, 0.3, JZ - m); bloqueia(JX, JZ - m, L, 1.2);
    caixa(L, hM, 1.2, C.muro, JX, 0.3, JZ + m); bloqueia(JX, JZ + m, L, 1.2);
    caixa(1.2, hM, L, C.muro, JX + m, 0.3, JZ); bloqueia(JX + m, JZ, 1.2, L);
    const seg = m - 5;
    caixa(1.2, hM, seg, C.muro, JX - m, 0.3, JZ - m + seg / 2); bloqueia(JX - m, JZ - m + seg / 2, 1.2, seg);
    caixa(1.2, hM, seg, C.muro, JX - m, 0.3, JZ + m - seg / 2); bloqueia(JX - m, JZ + m - seg / 2, 1.2, seg);
    caixa(1.6, 7, 1.6, C.tinta, JX - m, 0.3, JZ - 5.4); caixa(1.6, 7, 1.6, C.tinta, JX - m, 0.3, JZ + 5.4);
    // Portão de grade desliza aberto para a saída e circulação livre dos detentos
    const gx = JX - m - 1.05;
    portaoCadeia = new THREE.Group();
    for (let k = 0; k < 12; k++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.8, 0.16), mat(C.tinta));
      b.position.set(0, 2.7, -4.4 + k * 0.8);
      b.castShadow = true;
      portaoCadeia.add(b);
    }
    [0.8, 2.9, 4.9].forEach(y => {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 9.4), mat(0x495057));
      t.position.set(0, y, 0);
      t.castShadow = true;
      portaoCadeia.add(t);
    });
    portaoCadeia.position.set(gx, 0, JZ - 9.6);
    scene.add(portaoCadeia);
    obsPortao = { x0: gx - 0.6, x1: JX - m + 0.6, z0: JZ - 4.7, z1: JZ + 4.7, ativo: false };
    obstaculos.push(obsPortao);
    marcaObsSujo();
    lampadaPortao = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshBasicMaterial({ color: 0x2f9e44 }));
    lampadaPortao.position.set(JX - m, 7.7, JZ + 5.4);
    scene.add(lampadaPortao);
    caixa(42, 8, 10, 0xc9c2b4, JX + 6, 0.3, JZ - m + 7); bloqueia(JX + 6, JZ - m + 7, 42, 10);
    for (let i = 0; i < 9; i++) caixa(1.4, 1, 0.15, C.tinta, JX - 12 + i * 4.5, 5, JZ - m + 12.1, false);
    [[m - 3, m - 3], [-m + 3, m - 3]].forEach(([dx, dz]) => {
      caixa(4, 11, 4, C.muro, JX + dx, 0.3, JZ + dz);
      const tt = malha(new THREE.ConeGeometry(3.6, 2, 4), C.tinta, JX + dx, 12.3, JZ + dz);
      tt.rotation.y = Math.PI / 4;
      bloqueia(JX + dx, JZ + dz, 4, 4);
    });

    // Grafo conectado de circulação livre: Pátio da Cadeia 79 <-> Portão <-> Estrada <-> Ruas/Calçadas vizinhas
    const nos = [];
    const addNo = (x, z, zona, extra = {}) => nos.push({ x, z, zona, viz: [], ...extra }) - 1;
    const liga = (a, b) => {
      if (a < 0 || b < 0) return;
      if (!nos[a].viz.includes(b)) nos[a].viz.push(b);
      if (!nos[b].viz.includes(a)) nos[b].viz.push(a);
    };

    const pNW = addNo(JX - 24, JZ - 26, "patio");
    const pN0 = addNo(JX - 22, JZ - 15, "patio");
    const pN1 = addNo(JX - 4, JZ - 15, "patio");
    const pN2 = addNo(JX + 16, JZ - 15, "patio");
    const pE0 = addNo(JX + 25, JZ - 8, "patio");
    const pE1 = addNo(JX + 25, JZ + 12, "patio");
    const pS2 = addNo(JX + 18, JZ + 21, "patio");
    const pS1 = addNo(JX, JZ + 21, "patio");
    const pS0 = addNo(JX - 20, JZ + 18, "patio");
    const pC0 = addNo(JX - 10, JZ, "patio");
    const pC1 = addNo(JX + 8, JZ, "patio");
    const gIn = addNo(JX - 24, JZ, "patio", { gate: true });
    [
      [pNW, pN0], [pN0, pN1], [pN1, pN2], [pN2, pE0], [pE0, pE1], [pE1, pS2],
      [pS2, pS1], [pS1, pS0], [pS0, gIn], [gIn, pN0], [gIn, pC0], [pC0, pC1],
      [pC1, pE0], [pC1, pE1], [pC0, pN1], [pC0, pS1], [pC1, pN2], [pC1, pS2]
    ].forEach(([a, b]) => liga(a, b));

    const gOut = addNo(JX - 40, JZ, "estrada", { gate: true });
    const eMid = addNo(XMAX + 16, JZ, "estrada");
    liga(gIn, gOut);
    liga(gOut, eMid);

    const colsRua = [6, 7, 8, 9].filter(c => c >= 0 && c < COLS).map(c => XC(c) + 27);
    const rowsRua = [28];
    for (let r = 0; r < Math.min(ROWS, 5); r++) rowsRua.push(ZC(r) - 16);
    const gridNos = rowsRua.map(hz => colsRua.map(vx => {
      const ehJuncao = Math.abs(vx - XMAX) < 1 && Math.abs(hz - JZ) < 1;
      return addNo(vx, hz, "rua", { juncao: ehJuncao });
    }));
    let roadCid = -1;
    for (let ri = 0; ri < rowsRua.length; ri++) {
      for (let ci = 0; ci < colsRua.length; ci++) {
        const id = gridNos[ri][ci];
        if (nos[id].juncao) roadCid = id;
        if (ci + 1 < colsRua.length) liga(id, gridNos[ri][ci + 1]);
        if (ri + 1 < rowsRua.length) liga(id, gridNos[ri + 1][ci]);
      }
    }
    liga(eMid, roadCid);

    const b1 = addNo(XMAX + 42, 30.8, "rua");
    const b2 = addNo(XMAX + 86, 30.8, "rua");
    liga(gridNos[0][colsRua.length - 1], b1);
    liga(b1, b2);

    const rp = semente(7979);
    const patioEdges = [], portaoEdges = [], ruaEdges = [];
    nos.forEach((no, a) => {
      no.viz.forEach(b => {
        if (a > b) return;
        const nb = nos[b];
        if (no.gate || nb.gate || no.zona === "estrada" || nb.zona === "estrada") portaoEdges.push([a, b]);
        else if (no.zona === "patio" && nb.zona === "patio") patioEdges.push([a, b]);
        else ruaEdges.push([a, b]);
      });
    });

    function defineAlvoPreso(p) {
      const src = nos[p.node], dst = nos[p.prox];
      if (!src || !dst) return;
      if (src.gate || dst.gate || src.zona === "estrada" || dst.zona === "estrada") {
        p.alvoX = dst.x;
        p.alvoZ = dst.z + limita(p.laneZ, -2.3, 2.3);
      } else if (src.zona === "patio" && dst.zona === "patio") {
        const ax = limita(dst.x + p.laneX * 0.65, JX - 28, JX + 28);
        const az = limita(dst.z + p.laneZ * 0.65, JZ - 26, JZ + 26);
        if (!colidePonto(ax, az, 0.65)) { p.alvoX = ax; p.alvoZ = az; }
        else { p.alvoX = dst.x; p.alvoZ = dst.z; }
      } else if (Math.abs(src.z - dst.z) < 2.5) {
        p.alvoX = dst.x + p.laneX * 0.4;
        p.alvoZ = dst.z + (dst.z > 24 ? limita(p.laneZ, -1.8, 2.0) : p.laneZ);
      } else {
        p.alvoX = dst.x + p.laneX;
        p.alvoZ = dst.z + p.laneZ * 0.4;
      }
    }

    function escolheProxPreso(p, rFn) {
      const prevOld = p.node;
      p.node = p.prox;
      p.prev = prevOld;
      const cur = nos[p.node];
      const opcoes = cur.viz.length > 1 ? cur.viz.filter(v => v !== p.prev) : cur.viz;
      let prox = opcoes[Math.floor(rFn() * opcoes.length)];
      if (p.node === gIn) {
        if (p.prev === gOut) {
          const dentro = cur.viz.filter(v => v !== gOut);
          prox = dentro[Math.floor(rFn() * dentro.length)];
        } else {
          const chanceSair = (modoFugaPolicia || forcarPortaoCadeiaAberto) ? 0.58 : 0.34;
          if (rFn() < chanceSair) prox = gOut;
          else {
            const dentro = opcoes.filter(v => v !== gOut);
            if (dentro.length) prox = dentro[Math.floor(rFn() * dentro.length)];
          }
        }
      } else if (p.node === gOut) {
        prox = p.prev === gIn ? eMid : (rFn() < 0.72 ? eMid : gIn);
      } else if (p.node === roadCid) {
        if (p.prev === eMid) {
          const cidade = cur.viz.filter(v => v !== eMid);
          prox = cidade[Math.floor(rFn() * cidade.length)];
        } else if (rFn() > 0.14) {
          const cidade = opcoes.filter(v => v !== eMid);
          if (cidade.length) prox = cidade[Math.floor(rFn() * cidade.length)];
        }
      }
      p.prox = prox;
      defineAlvoPreso(p);
    }

    grupos.cadeia.forEach((d, i) => {
      const o = estiloBoneco(d.h + d.t, ehMulher(d.t), { camisa: C.laranja, calca: C.laranja, sapato: 0x1d1d1d, semTorso: true });
      const partes = criaAndante(o);
      const hp = pessoaCorpo.poe(JX, 1.1, JZ, 0.82, 0.74, 0.44, 0, C.laranja);
      const grupoIdx = i < 20 ? 0 : (i < 35 ? 1 : 2);
      const listaEdges = grupoIdx === 0 ? patioEdges : (grupoIdx === 1 ? portaoEdges : ruaEdges);
      const [na, nb] = listaEdges[i % listaEdges.length];
      const inv = rp() < 0.5;
      const nodeA = inv ? nb : na, nodeB = inv ? na : nb;
      const ladoX = (rp() < 0.5 ? -1 : 1) * (2.2 + rp() * 1.1);
      const ladoZ = (rp() < 0.5 ? -1 : 1) * (2.2 + rp() * 1.1);
      const u = 0.15 + rp() * 0.7;
      let sx = nos[nodeA].x + (nos[nodeB].x - nos[nodeA].x) * u;
      let sz = nos[nodeA].z + (nos[nodeB].z - nos[nodeA].z) * u;
      if (nos[nodeA].zona === "rua" && nos[nodeB].zona === "rua") {
        if (Math.abs(nos[nodeA].z - nos[nodeB].z) < 2.5) sz += nos[nodeA].z > 24 ? limita(ladoZ, -1.8, 2.0) : ladoZ;
        else sx += ladoX;
      } else if (nos[nodeA].gate || nos[nodeB].gate) {
        sz += limita(ladoZ, -2.0, 2.0);
      }
      if (colidePonto(sx, sz, 0.6) || !podeAndar(sx, sz)) {
        sx = nos[nodeA].x; sz = nos[nodeA].z;
      }
      const ry = Math.atan2(nos[nodeB].x - nos[nodeA].x, nos[nodeB].z - nos[nodeA].z);
      const mov = { x: sx, z: sz, ry, h: Math.abs(nos[nodeB].z - nos[nodeA].z) < 2.5 };
      const yOff = (i % 3) * 0.85;
      const ent = { ...d, x: sx, y: 4.1 + yOff, z: sz, mov, cor: LUGAR[d.k].cor, alvo: { x: sx, z: sz + 6, yaw: 0 } };
      const entIdx = ents.push(ent) - 1;
      hp.m.userData.ent[hp.i] = entIdx;

      const preso = {
        d, ent, entIdx, partes, hp, mov,
        x: sx, z: sz, ry,
        node: nodeA, prev: nodeA, prox: nodeB,
        alvoX: nos[nodeB].x, alvoZ: nos[nodeB].z,
        laneX: ladoX, laneZ: ladoZ,
        vel: 2.5 + rp() * 1.7,
        fase: rp() * 6.28,
        pausa: 0, stuck: 0, side: rp() < 0.5 ? 1 : -1,
        andando: true, yOff
      };
      ent._preso = preso;
      defineAlvoPreso(preso);
      presosCadeia.push(preso);
    });

    atualizaPresos = function (dt, t) {
      presoPertoPortao = false;
      presoQuadro++;
      const cxCam = cam.position.x, czCam = cam.position.z;
      const multVel = (modoFugaPolicia || forcarPortaoCadeiaAberto) ? 1.32 : 1;

      for (let i = 0; i < presosCadeia.length; i++) {
        const p = presosCadeia[i];
        if (dt === 0 && (colidePonto(p.x, p.z, 0.52) || !podeAndar(p.x, p.z))) {
          p.x = nos[p.node].x; p.z = nos[p.node].z;
          p.mov.x = p.x; p.mov.z = p.z;
        }
        if (Math.abs(p.x - (JX - 32)) < 18 && Math.abs(p.z - JZ) < 12) {
          presoPertoPortao = true;
        }
        if (dt > 0) {
          if (p.pausa > 0) {
            p.pausa -= dt;
            p.andando = false;
          } else {
            p.andando = true;
            let dx = p.alvoX - p.x, dz = p.alvoZ - p.z;
            let distAlvo = Math.hypot(dx, dz);
            if (distAlvo < 1.15) {
              escolheProxPreso(p, Math.random);
              if (Math.random() < 0.08) p.pausa = 0.5 + Math.random() * 1.2;
              dx = p.alvoX - p.x; dz = p.alvoZ - p.z;
              distAlvo = Math.hypot(dx, dz);
            }
            if (distAlvo > 0.05) {
              const step = Math.min(distAlvo, p.vel * multVel * dt);
              const ux = dx / distAlvo, uz = dz / distAlvo;
              const nx = p.x + ux * step, nz = p.z + uz * step;
              let andou = false;
              if (!colidePonto(nx, nz, 0.52) && podeAndar(nx, nz)) {
                p.x = nx; p.z = nz; andou = true;
              } else if (!colidePonto(nx, p.z, 0.52) && podeAndar(nx, p.z)) {
                p.x = nx; andou = true;
              } else if (!colidePonto(p.x, nz, 0.52) && podeAndar(p.x, nz)) {
                p.z = nz; andou = true;
              } else {
                const sx = p.x - uz * step * p.side, sz = p.z + ux * step * p.side;
                if (!colidePonto(sx, sz, 0.52) && podeAndar(sx, sz)) {
                  p.x = sx; p.z = sz; andou = true;
                }
              }
              if (andou) {
                p.stuck = 0;
                const yawAlvo = Math.atan2(ux, uz);
                const dRy = Math.atan2(Math.sin(yawAlvo - p.ry), Math.cos(yawAlvo - p.ry));
                p.ry += dRy * Math.min(1, dt * 10);
                p.fase += dt * p.vel * multVel * 3.1;
              } else {
                p.andando = false;
                if (obsPortao && obsPortao.ativo && Math.abs(p.x - (JX - 32)) < 2.6 && Math.abs(p.z - JZ) < 6) {
                  presoPertoPortao = true;
                  p.stuck = 0;
                } else {
                  p.stuck += dt;
                  if (p.stuck > 0.7 && p.stuck < 1.2) p.side *= -1;
                  if (p.stuck >= 1.5) {
                    p.stuck = 0;
                    const tmp = p.node;
                    p.node = p.prox;
                    p.prox = tmp;
                    defineAlvoPreso(p);
                  }
                }
              }
            }
          }
          p.mov.x = p.x;
          p.mov.z = p.z;
          p.mov.ry = p.ry;
          p.mov.h = Math.abs(Math.sin(p.ry)) >= 0.707;
        }
        const dxC = p.x - cxCam, dzC = p.z - czCam;
        const perto = dt === 0 || (dxC * dxC + dzC * dzC) < 145 * 145;
        if (perto || ((i + presoQuadro) & 3) === 0) {
          syncPresoVisual(p, dt > 0);
        } else {
          p.ent.y = alturaPreso(p.x, p.z) + 3.9 + p.yOff;
        }
      }
      if (dt > 0) pessoaCorpo.marca();
    };
    rotuloFixo("Cadeia Pública", "#f08c00", "#1d2a33", 1.3, JX, 20, JZ - m + 7);
  })();

  // Praia, barcos e horizonte
  const QUIOSQUES_X = [-210, -120, -40, 40, 120, 210, 300];
  for (let x = XMIN - 140; x <= JX + 140; x += 10) {
    const px = x + (rand() - 0.5) * 4, pz = 37.5 + rand() * 2, lean = praiaLean();
    if (!noParque(px, pz, 3)) palmeira(px, pz, lean);
  }
  for (let i = 0; i < 45; i++) {
    const x = XMIN - 130 + rand() * (JX - XMIN + 260), z = 41 + rand() * 9;
    if (QUIOSQUES_X.some(q => Math.abs(q - x) < 10) || Math.abs(x - PX) < 7 || QUADRAS.some(([qx, m]) => Math.abs(x - qx) < m + 2) || noParque(x, z, 3)) continue;
    palmeira(x, z, praiaLean());
  }
  // Guarda-sóis espalhados na areia, quase todos com cadeiras de praia viradas para o mar (a faixa perto da água fica livre para os bugues)
  for (let i = 0; i < 110; i++) {
    const x = XMIN - 120 + rand() * (JX - XMIN + 240), z = 44 + rand() * 17;
    if (Math.abs(x - PX) < 6 || QUADRAS.some(([qx, m]) => Math.abs(x - qx) < m + 2) || noParque(x, z, 3) || QUIOSQUES_X.some(q => Math.abs(q - x) < 10 && z < 55)) continue;
    guardaSol(x, z);
    const n = rand() < 0.25 ? 1 : 2;
    for (let k = 0; k < n; k++) cadeiraPraia(x + (n === 1 ? 0.9 : k ? 0.55 : -0.55) + (rand() - 0.5) * 0.2, z + 0.7, (rand() - 0.5) * 0.4);
  }
  // Mesas com coco na frente de cada quiosque, cada uma com guarda-sol e cadeiras
  QUIOSQUES_X.forEach((q, i) => {
    const cor = [0xf8f9fa, 0xe03131, 0xfcc419, 0xf8f9fa][i % 4];
    [[-6, 45.5], [6, 45.5], [-3.2, 50.5], [3.2, 50.5]].forEach(([dx, z]) => mesaCoco(q + dx, z, cor));
  });
  QUIOSQUES_X.forEach((x, i) => quiosque(x, 43, [C.mar, C.coral, C.amarelo, C.mata][i % 4]));

  const barcos = [];
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group();
    const casco = new THREE.Mesh(new THREE.BoxGeometry(4, 0.9, 1.6), mat(i % 2 ? C.branco : C.coral));
    casco.position.y = 0.45;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.2), mat(C.branco));
    cab.position.set(-0.4, 1.3, 0);
    g.add(casco, cab);
    g.position.set(XMIN - 60 + rand() * (JX - XMIN + 120), 0, MARZ + 10 + rand() * 50);
    if (Math.abs(g.position.x - PX) < 14) g.position.x += 40;
    g.rotation.y = rand() * Math.PI;
    g.userData.fase = rand() * 6;
    scene.add(g);
    barcos.push(g);
  }

  // ---------- Molhe com farol e pescadores ----------
  const farol = { feixe: null };
  (function () {
    const CONCRETO = 0xd9d4c7, BR = 0xf8f9fa, VERMELHO = 0xd9480f;
    // Pedras dos dois lados e em volta da ponta
    const pedras = paleta(new THREE.DodecahedronGeometry(1, 0), 600);
    const CORES_PEDRA = [0x868e96, 0x6c757d, 0x5c5f66, 0x495057];
    for (let z = PZ0 + 4; z <= ZT; z += 1.1) {
      [-1, 1].forEach(s => {
        pedras.poe(PX + s * (2.7 + rand() * 0.6), -0.2 + rand() * 0.6, z + rand() * 0.5, 1 + rand() * 0.5, 0.9 + rand() * 0.5, 1 + rand() * 0.5, rand() * 6, escolhe(CORES_PEDRA));
        pedras.poe(PX + s * (4.2 + rand() * 0.9), -0.6 + rand() * 0.4, z + rand() * 0.6, 1.1 + rand() * 0.6, 0.8 + rand() * 0.4, 1.1 + rand() * 0.6, rand() * 6, rand() < 0.5 ? 0x2b8a3e : 0x5c5f66);
      });
    }
    const aTerra = -Math.PI / 2;
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a - aTerra), Math.cos(a - aTerra))) < 0.35) continue;
      const r1 = RTIP + 0.7 + rand() * 0.6, r2 = RTIP + 2.2 + rand() * 0.9;
      pedras.poe(PX + Math.cos(a) * r1, -0.2 + rand() * 0.6, ZT + Math.sin(a) * r1, 1.1 + rand() * 0.5, 1 + rand() * 0.4, 1.1 + rand() * 0.5, rand() * 6, escolhe(CORES_PEDRA));
      pedras.poe(PX + Math.cos(a) * r2, -0.6 + rand() * 0.4, ZT + Math.sin(a) * r2, 1.2 + rand() * 0.6, 0.8 + rand() * 0.4, 1.2 + rand() * 0.6, rand() * 6, rand() < 0.5 ? 0x2b8a3e : 0x5c5f66);
    }
    // Estrada de concreto com rampa saindo da areia
    const rampa = caixa(4.4, 0.3, 10.2, CONCRETO, PX, 0.45, (PZ0 + PZR) / 2, false);
    rampa.rotation.x = -Math.atan2(PH, PZR - PZ0);
    caixa(4.4, PH, ZT - PZR, CONCRETO, PX, 0, (PZR + ZT) / 2, false);
    [-2.1, 2.1].forEach(dx => caixa(0.3, 0.35, ZT - PZR, BR, PX + dx, PH, (PZR + ZT) / 2, false));
    // Ponta redonda com mureta
    malha(new THREE.CylinderGeometry(RTIP, RTIP + 0.6, PH, 28), CONCRETO, PX, PH / 2, ZT, false);
    const mureta = new THREE.Mesh(new THREE.CylinderGeometry(RTIP - 0.15, RTIP - 0.15, 0.5, 32, 1, true), new THREE.MeshStandardMaterial({ color: BR, side: THREE.DoubleSide, flatShading: true }));
    mureta.position.set(PX, PH + 0.25, ZT);
    scene.add(mureta);
    // Postes de luz ao longo do molhe
    for (let z = PZR + 8; z < ZT - 6; z += 20) {
      caixa(0.16, 4.2, 0.16, 0x495057, PX + 1.9, PH, z, false);
      caixa(0.7, 0.25, 0.4, 0x495057, PX + 1.6, PH + 4.2, z, false);
      bloqueia(PX + 1.9, z, 0.3, 0.3);
    }

    // Farol branco com janelas vermelhas e lanterna vermelha no topo
    const fx = PX - 1.8, fz = ZT + 2, b = PH;
    malha(new THREE.CylinderGeometry(2.3, 2.5, 0.8, 16), BR, fx, b + 0.4, fz);
    malha(new THREE.CylinderGeometry(1.7, 2.0, 11, 16), BR, fx, b + 0.8 + 5.5, fz);
    [3.2, 6.2, 9.2].forEach((y, nivel) => {
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + nivel * 0.4;
        const rr = 1.95 - y * 0.025;
        const j = caixa(0.9, 1.2, 0.25, VERMELHO, fx + Math.cos(a) * rr, b + y, fz + Math.sin(a) * rr, false);
        j.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
      }
    });
    malha(new THREE.CylinderGeometry(1.75, 1.75, 0.6, 16), VERMELHO, fx, b + 11.6, fz);
    malha(new THREE.CylinderGeometry(2.6, 2.6, 0.3, 16), BR, fx, b + 12.05, fz);
    malha(new THREE.CylinderGeometry(1.35, 1.35, 2.4, 8), VERMELHO, fx, b + 13.4, fz);
    malha(new THREE.CylinderGeometry(1.37, 1.37, 1.1, 8), 0xffe8a3, fx, b + 13.5, fz, false);
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4;
      caixa(0.14, 2.4, 0.14, BR, fx + Math.cos(a) * 1.4, b + 12.2, fz + Math.sin(a) * 1.4, false);
    }
    malha(new THREE.ConeGeometry(1.65, 1.3, 8), VERMELHO, fx, b + 15.25, fz);
    malha(new THREE.SphereGeometry(0.22, 8, 6), BR, fx, b + 16, fz);
    bloqueia(fx, fz, 4.8, 4.8);
    // Facho de luz girando
    const geoF = new THREE.ConeGeometry(2.6, 34, 14, 1, true).rotateZ(Math.PI / 2).translate(17, 0, 0);
    farol.feixe = new THREE.Group();
    [0, Math.PI].forEach(r => {
      const f = new THREE.Mesh(geoF, new THREE.MeshBasicMaterial({ color: 0xfff3bf, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      f.rotation.y = r;
      farol.feixe.add(f);
    });
    farol.feixe.position.set(fx, b + 13.5, fz);
    scene.add(farol.feixe);
    rotuloFixo("Farol do Molhe", "#d9480f", "#fffaf0", 1.1, fx, b + 21, fz);

    // Pescadores com vara, linha e balde
    const CAMISAS = [0x1c7ed6, 0xf59f00, 0x2f9e44, 0xe03131, 0x7048e8, 0x0ca678, 0xf8f9fa, 0x495057];
    function pescador(x, z, dx, dz, k) {
      const g = new THREE.Group();
      const add = (geo, cor, px, py, pz, rx = 0) => {
        const m = new THREE.Mesh(geo, mat(cor));
        m.position.set(px, py, pz);
        m.rotation.x = rx;
        m.castShadow = true;
        g.add(m);
        return m;
      };
      g.add(bonecoMalhas(estiloBoneco("pescador" + k, k === 3 || k === 6, { camisa: CAMISAS[k % CAMISAS.length], chapeu: 0xe9c46a })));
      const L = 4.6, th = 0.85;
      const ay = Math.cos(th), az = Math.sin(th);
      add(new THREE.CylinderGeometry(0.03, 0.05, L, 5), 0x3b2f2f, 0, 1.5 + ay * L / 2, 0.35 + az * L / 2, th);
      const pontaY = 1.5 + ay * L, pontaZ = 0.35 + az * L;
      add(new THREE.CylinderGeometry(0.012, 0.012, pontaY + PH, 3), 0xdee2e6, 0, (pontaY - PH) / 2, pontaZ);
      if (k % 2 === 0) add(new THREE.CylinderGeometry(0.3, 0.24, 0.5, 8), 0x339af0, 0.75, 0.25, -0.2);
      g.position.set(x, PH, z);
      g.rotation.y = Math.atan2(dx, dz);
      scene.add(g);
      bloqueia(x, z, 0.9, 0.9);
    }
    [[-1, 74], [1, 90], [-1, 107], [1, 124], [-1, 140]].forEach(([s, z], k) => pescador(PX + s * 1.75, z, s, 0, k));
    [Math.PI / 2 - 0.75, Math.PI / 2 + 0.15, Math.PI / 2 + 0.95].forEach((a, k) => {
      const r = RTIP - 0.75;
      pescador(PX + Math.cos(a) * r, ZT + Math.sin(a) * r, Math.cos(a), Math.sin(a), k + 5);
    });
  })();

  // ---------- Navio de cruzeiro passando em alto-mar ----------
  const navio = new THREE.Group();
  (function () {
    const add = (geo, cor, x, y, z, ry = 0, sombra = true) => {
      const m = new THREE.Mesh(geo, mat(cor));
      m.position.set(x, y, z);
      m.rotation.y = ry;
      m.castShadow = sombra;
      m.receiveShadow = true;
      navio.add(m);
      return m;
    };
    const BRANCO = 0xf8f9fa, MARINHO = 0x1d3557, VIDRO = 0x2b3a44;
    // Casco com proa em ponta
    add(new THREE.BoxGeometry(66, 6.5, 12), BRANCO, -2, 3.25, 0);
    add(new THREE.BoxGeometry(8.49, 6.5, 8.49), BRANCO, 31, 3.25, 0, Math.PI / 4);
    add(new THREE.BoxGeometry(66.2, 2.4, 12.2), MARINHO, -2, 0.6, 0, 0, false);
    add(new THREE.BoxGeometry(8.6, 2.4, 8.6), MARINHO, 31, 0.6, 0, Math.PI / 4, false);
    add(new THREE.BoxGeometry(58, 0.5, 12.1), VIDRO, -4, 4.6, 0, 0, false);
    // Conveses com fileiras de janelas
    [[60, 3.2, 11, -4, 6.5], [54, 3, 10.4, -6, 9.7], [44, 3, 9.6, -9, 12.7], [26, 2.8, 8.8, -12, 15.7]].forEach(([L, h, w, x, y]) => {
      add(new THREE.BoxGeometry(L, h, w), BRANCO, x, y + h / 2, 0);
      add(new THREE.BoxGeometry(L - 2, 0.7, w + 0.1), VIDRO, x, y + h * 0.55, 0, 0, false);
    });
    // Ponte de comando, mastro, chaminé e piscina
    add(new THREE.BoxGeometry(7, 3, 12.4), BRANCO, 19, 11.2, 0);
    add(new THREE.BoxGeometry(7.1, 1, 12.5), VIDRO, 19, 11.4, 0, 0, false);
    add(new THREE.CylinderGeometry(0.15, 0.15, 6, 5), BRANCO, 19, 15.7, 0);
    add(new THREE.CylinderGeometry(2.2, 2.6, 6, 10), 0xff7a59, -20, 21.5, 0).scale.z = 0.7;
    add(new THREE.CylinderGeometry(2.25, 2.25, 0.8, 10), C.tinta, -20, 24.6, 0).scale.z = 0.7;
    add(new THREE.BoxGeometry(7, 0.25, 4.5), 0x4dabf7, 6, 15.8, 0, 0, false);
    // Botes salva-vidas
    [-22, -12, -2, 8].forEach(x => [-1, 1].forEach(s => add(new THREE.BoxGeometry(4, 1.4, 1.6), 0xff922b, x, 8.6, s * 6.4)));
    // Nome no casco
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = 64;
    const g = cv.getContext("2d");
    g.font = '800 44px "Nunito Sans", "Segoe UI", sans-serif';
    g.fillStyle = "#1d3557";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("CARAGUÁ PIXEL", 256, 34);
    const tex = new THREE.CanvasTexture(cv);
    [1, -1].forEach(s => {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(16, 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      pl.position.set(20, 3.4, s * 6.07);
      pl.rotation.y = s > 0 ? 0 : Math.PI;
      navio.add(pl);
    });
    // Esteira de espuma atrás do navio
    const esteira = new THREE.Mesh(new THREE.PlaneGeometry(50, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }));
    esteira.rotation.x = -Math.PI / 2;
    esteira.position.set(-60, 0.08, 0);
    navio.add(esteira);
    navio.position.set(reduz ? 120 : -260, 0, 223);
    scene.add(navio);
  })();

  // ---------- Avião de propaganda puxando faixa sobre a praia ----------
  const aviao = new THREE.Group();
  let helice = null;
  (function () {
    const add = (geo, cor, x, y, z) => { const m = new THREE.Mesh(geo, mat(cor)); m.position.set(x, y, z); m.castShadow = true; aviao.add(m); return m; };
    const BR = 0xf8f9fa, VERM = 0xe03131;
    add(new THREE.BoxGeometry(4, 0.9, 0.9), BR, 0, 0, 0);
    add(new THREE.BoxGeometry(0.6, 0.7, 0.7), VERM, 2.25, 0, 0);
    add(new THREE.BoxGeometry(1.0, 0.45, 0.8), 0x2b3a44, 0.8, 0.6, 0);
    add(new THREE.BoxGeometry(1.2, 0.12, 7.4), BR, 0.4, 0.45, 0);
    add(new THREE.BoxGeometry(1.22, 0.13, 1.4), VERM, 0.4, 0.46, 3.0);
    add(new THREE.BoxGeometry(1.22, 0.13, 1.4), VERM, 0.4, 0.46, -3.0);
    add(new THREE.BoxGeometry(0.8, 1.1, 0.1), VERM, -1.85, 0.75, 0);
    add(new THREE.BoxGeometry(0.6, 0.08, 2.6), BR, -1.85, 0.25, 0);
    [-0.6, 0.6].forEach(z => add(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 8).rotateX(Math.PI / 2), 0x1d1d1d, 0.6, -0.75, z));
    helice = add(new THREE.BoxGeometry(0.06, 2.2, 0.2), 0x343a40, 2.6, 0, 0);
    // Cabo e faixa de propaganda (legível da praia e do mar)
    const cabo = add(new THREE.CylinderGeometry(0.03, 0.03, 9, 4).rotateZ(Math.PI / 2), 0x495057, -6.5, -0.3, 0);
    cabo.castShadow = false;
    const cv = document.createElement("canvas");
    cv.width = 1024; cv.height = 128;
    const g = cv.getContext("2d");
    g.fillStyle = "#fffaf0"; g.fillRect(0, 0, 1024, 128);
    g.fillStyle = "#e03131"; g.fillRect(0, 0, 1024, 12); g.fillRect(0, 116, 1024, 12);
    g.fillStyle = "#1d2a33"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = '800 64px "Nunito Sans", "Segoe UI", sans-serif';
    g.fillText("CARAGUA PIXEL · SIGA @CARAGUAPIXEL", 512, 66);
    const tex = new THREE.CanvasTexture(cv);
    [[Math.PI, -0.03], [0, 0.03]].forEach(([r, dz]) => {
      const faixa = new THREE.Mesh(new THREE.PlaneGeometry(20, 2.5), new THREE.MeshBasicMaterial({ map: tex }));
      faixa.position.set(-21, -0.4, dz);
      faixa.rotation.y = r;
      aviao.add(faixa);
    });
    aviao.scale.set(1.6, 1.6, 1.6);
    aviao.position.set(-300, 30, 90);
    scene.add(aviao);
  })();

  // ---------- Morro Santo Antônio com trilha e estátua ----------
  const trilha = [];
  function livreNoMorro(x, z) {
    if (x > FAZ.x0 - 4 && x < FAZ.x1 + 4 && z > FAZ.z0 - 4 && z < FAZ.z1 + 4) return false;
    if (x > FAZ.x1 && x < XMIN && Math.abs(z - FAZ.estrada) < 4) return false;
    if (Math.hypot(x - MX, z - MZ) < MTOPO + 3) return false;
    for (const [tx, tz] of trilha) if ((tx - x) * (tx - x) + (tz - z) * (tz - z) < 16) return false;
    return true;
  }
  (function () {
    // Terreno do morro
    const tam = MRAIO * 2 + 4, seg = 60;
    const g = new THREE.PlaneGeometry(tam, tam, seg, seg).rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, altura(pos.getX(i) + MX, pos.getZ(i) + MZ) - 0.05);
    g.computeVertexNormals();
    malha(g, C.mata, MX, 0, MZ, false);

    // Trilha de terra em espiral, começando do lado da cidade
    const N = 220, A0 = 0.15, VOLTAS = 1.15, D0 = MRAIO + 2, D1 = MTOPO - 1.5;
    for (let k = 0; k <= N; k++) {
      const u = k / N, a = A0 + u * VOLTAS * Math.PI * 2, d = D0 - u * (D0 - D1);
      trilha.push([MX + Math.cos(a) * d, MZ + Math.sin(a) * d, a, d]);
    }
    const v = [], idx = [];
    trilha.forEach(([, , a, d]) => {
      [-1.7, 1.7].forEach(o => {
        const px = MX + Math.cos(a) * (d + o), pz = MZ + Math.sin(a) * (d + o);
        v.push(px, altura(px, pz) + 0.12, pz);
      });
    });
    for (let k = 0; k < N; k++) { const i = k * 2; idx.push(i, i + 2, i + 1, i + 1, i + 2, i + 3); }
    const gt = new THREE.BufferGeometry();
    gt.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    gt.setIndex(idx);
    gt.computeVertexNormals();
    const tm = new THREE.Mesh(gt, new THREE.MeshStandardMaterial({ color: 0xc9a26b, flatShading: true, roughness: 1, side: THREE.DoubleSide }));
    tm.receiveShadow = true;
    scene.add(tm);
    const estacas = inst(UNIT, 80, C.tronco);
    trilha.forEach(([, , a, d], k) => {
      if (k % 7 || k > N - 6) return;
      const px = MX + Math.cos(a) * (d + 2.1), pz = MZ + Math.sin(a) * (d + 2.1);
      poe(estacas, px, altura(px, pz) - 0.2, pz, 0.24, 1.3, 0.24);
    });
    const [sx, sz] = trilha[0];
    rotuloFixo("Trilha do Santo Antônio", "#c9a26b", "#1d2a33", 0.8, sx, 5, sz);

    // Mirante no topo, com cerquinha (aberta na chegada da trilha)
    malha(new THREE.CylinderGeometry(MTOPO + 1, MTOPO + 1.4, 0.5, 18), 0xcfc8b8, MX, MALT, MZ, false);
    const aFim = (A0 + VOLTAS * Math.PI * 2) % (Math.PI * 2);
    const cerca = inst(UNIT, 40, 0xbab3a4);
    for (let k = 0; k < 36; k++) {
      const a = (k / 36) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a - aFim), Math.cos(a - aFim))) < 0.4) continue;
      const px = MX + Math.cos(a) * (MTOPO + 0.5), pz = MZ + Math.sin(a) * (MTOPO + 0.5);
      poe(cerca, px, MALT, pz, 0.35, 1.1, 0.35);
      bloqueia(px, pz, 0.5, 0.5);
    }

    // Estátua de Santo Antônio com o Menino Jesus e os lírios
    const PEDRA = 0xeae3d2, PEDRA2 = 0xd8cfba, BASE = 0xbab3a4;
    const est = new THREE.Group();
    const add = (geo, cor, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, mat(cor));
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      m.receiveShadow = true;
      est.add(m);
      return m;
    };
    add(new THREE.BoxGeometry(4, 3, 4), BASE, 0, 1.5, 0);
    add(new THREE.BoxGeometry(4.6, 0.4, 4.6), PEDRA2, 0, 3.2, 0);
    const b = 3.4;
    add(new THREE.CylinderGeometry(1.05, 1.9, 6.6, 10), PEDRA, 0, b + 3.3, 0);
    add(new THREE.CylinderGeometry(1.2, 1.1, 1.1, 10), PEDRA2, 0, b + 6.9, 0);
    add(new THREE.CylinderGeometry(0.35, 0.4, 0.5, 8), PEDRA, 0, b + 7.6, 0);
    add(new THREE.SphereGeometry(0.75, 10, 8), PEDRA, 0, b + 8.3, 0);
    add(new THREE.TorusGeometry(0.62, 0.16, 6, 14), PEDRA2, 0, b + 8.55, 0, Math.PI / 2);
    add(new THREE.TorusGeometry(1.42, 0.11, 6, 18), PEDRA2, 0, b + 4.2, 0, Math.PI / 2);
    add(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 5), PEDRA2, 0.55, b + 2.5, 1.62, 0.12);
    add(new THREE.SphereGeometry(0.2, 6, 5), PEDRA2, 0.6, b + 0.9, 1.78);
    add(new THREE.CylinderGeometry(0.06, 0.06, 3.6, 5), PEDRA2, -1.4, b + 2.7, 0.9, 0.12);
    // braço direito com os lírios
    add(new THREE.CylinderGeometry(0.34, 0.46, 2.2, 8), PEDRA, -1.05, b + 6.0, 0.55, -0.9);
    add(new THREE.SphereGeometry(0.28, 8, 6), PEDRA, -0.95, b + 6.9, 1.2);
    add(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 5), PEDRA2, -1.07, b + 7.9, 1.1, 0, 0, 0.12);
    [[-1.25, 9.1, 1.0], [-0.95, 8.7, 1.28], [-1.42, 8.5, 0.88]].forEach(([x, y, z]) => add(new THREE.ConeGeometry(0.26, 0.6, 6), PEDRA, x, b + y, z, Math.PI));
    // braço esquerdo segurando o Menino Jesus
    add(new THREE.CylinderGeometry(0.34, 0.46, 2.2, 8), PEDRA, 1.05, b + 5.8, 0.6, -1.2);
    add(new THREE.CylinderGeometry(0.3, 0.42, 1.3, 8), PEDRA, 1.0, b + 7.0, 1.1);
    add(new THREE.BoxGeometry(0.7, 0.3, 0.7), PEDRA, 1.0, b + 6.35, 1.35);
    add(new THREE.SphereGeometry(0.36, 8, 6), PEDRA, 1.0, b + 7.95, 1.1);
    add(new THREE.CylinderGeometry(0.08, 0.08, 0.75, 5), PEDRA, 1.32, b + 7.6, 1.35, 0, 0, -0.6);
    const ESC = 1.7;
    est.scale.set(ESC, ESC, ESC);
    est.position.set(MX, MALT + 0.25, MZ);
    est.rotation.y = Math.PI / 2; // de frente para a cidade
    scene.add(est);
    bloqueia(MX, MZ, 4 * ESC + 0.4, 4 * ESC + 0.4);
    rotuloFixo("Morro Santo Antônio", "#fffaf0", "#1d2a33", 1.4, MX, MALT + 22, MZ);
  })();
  for (let i = 0; i < 14; i++) {
    const h = 50 + rand() * 50;
    const s = malha(new THREE.ConeGeometry(40 + rand() * 20, h, 6), i % 2 ? C.mataEscura : C.mata, XMIN - 200 + i * 70 + rand() * 14, h / 2, NORTE - 110 - rand() * 40);
    s.rotation.y = rand() * Math.PI;
  }
  const ilha = malha(new THREE.ConeGeometry(80, 58, 7), C.ilha, XMAX + 40, 25, 300, false);
  ilha.rotation.y = 0.9;
  malha(new THREE.ConeGeometry(52, 36, 6), C.ilha, XMAX - 40, 16, 322, false);
  rotuloFixo("Ilhabela", "#fffaf0", "#1d2a33", 1.8, XMAX + 30, 66, 298);

  for (let i = 0; i < 70; i++) {
    const x = XMIN - 8 - rand() * 40, z = NORTE + rand() * (30 - NORTE), s = 0.9 + rand() * 0.7;
    if (livreNoMorro(x, z) && !noParque(x, z, 3) && !noShopping(x, z, 3)) arvore(x, z, s);
  }
  for (let i = 0; i < 80; i++) {
    const a = rand() * Math.PI * 2, d = MTOPO + 4 + rand() * (MRAIO - MTOPO - 6);
    const x = MX + Math.cos(a) * d, z = MZ + Math.sin(a) * d, s = 0.9 + rand() * 0.7;
    if (livreNoMorro(x, z)) arvore(x, z, s);
  }
  for (let i = 0; i < 70; i++) arvore(XMIN + rand() * (JX + 40 - XMIN), NORTE - 4 - rand() * 30, 0.9 + rand() * 0.7);
  for (let i = 0; i < 50; i++) {
    const x = XMAX + 8 + rand() * (JX + 40 - XMAX - 8), z = NORTE + rand() * (30 - NORTE);
    if (Math.abs(x - JX) < 36 && Math.abs(z - JZ) < 36) continue;
    if (x > LIXO.x0 - 8 && z < LIXO.z1 + 8) continue;
    if (Math.abs(z - LIXO.estrada) < 5 && x < LIXO.x0) continue;
    if (Math.abs(z - JZ) < 7 && x < JX) continue;
    if (noBoulevard(x, z, 4)) continue;
    arvore(x, z, 0.9 + rand() * 0.7);
  }

  // ---------- Carros (Uber e trânsito) e cachorros ----------
  const LINHAS_H = [28];
  for (let r = 0; r < ROWS; r++) LINHAS_H.push(ZC(r) - 16);
  const LINHAS_V = [XMIN];
  for (let c = 0; c < COLS; c++) LINHAS_V.push(XC(c) + 27);
  function novoMovel(vel) {
    const h = rand() < 0.55;
    return {
      h, dir: rand() < 0.5 ? 1 : -1,
      linha: h ? escolhe(LINHAS_H) : escolhe(LINHAS_V),
      s: h ? XMIN + rand() * (XMAX - XMIN) : ZMIN + rand() * (ZMAX - ZMIN),
      vel, x: 0, z: 0, ry: 0
    };
  }
  function anda(m, dt, faixa) {
    m.s += m.dir * m.vel * dt;
    if (m.h) { if (m.s > XMAX) m.s = XMIN; if (m.s < XMIN) m.s = XMAX; }
    else { if (m.s > ZMAX) m.s = ZMIN; if (m.s < ZMIN) m.s = ZMAX; }
    const off = faixa * m.dir;
    if (m.h) { m.x = m.s; m.z = m.linha + off; m.ry = m.dir > 0 ? 0 : Math.PI; }
    else { m.x = m.linha - off; m.z = m.s; m.ry = m.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
  }

  const nGeral = 36;
  const nCarros = nGeral + grupos.uber.length;
  const carroCorpo = paleta(UNIT, nCarros);
  const carroCabine = inst(UNIT, nCarros, C.cabine);
  const uberPlaca = inst(UNIT, Math.max(1, grupos.uber.length), C.tinta);
  const carros = [];
  grupos.uber.forEach(d => {
    const m = novoMovel(10 + rand() * 4);
    m.uber = true;
    anda(m, 0, 2.4);
    const e = ents.push({ ...d, mov: m, y: 4.6, cor: LUGAR.uber.cor }) - 1;
    carros.push({ m, cor: 0x212529, ent: e });
  });
  for (let i = 0; i < nGeral; i++) {
    const m = novoMovel(8 + rand() * 8);
    anda(m, 0, 2.4);
    carros.push({ m, cor: escolhe(CORES_CARRO), ent: null });
  }
  carros.forEach(c => {
    c.hc = carroCorpo.poe(0, 0, 0, 1, 1, 1, 0, c.cor);
    if (c.ent != null) c.hc.m.userData.ent[c.hc.i] = c.ent;
    poe(carroCabine, 0, 0, 0, 1, 1, 1);
  });
  grupos.uber.forEach(() => poe(uberPlaca, 0, 0, 0, 1, 1, 1));

  const nCaes = 44;
  const CORES_COLEIRA = [0xe03131, 0x1c7ed6, 0xfab005, 0x9c36b5, 0x2f9e44];
  const caoCorpo = paleta(UNIT, nCaes), caoCabeca = paleta(UNIT, nCaes), caoPerna = paleta(UNIT, nCaes * 4);
  const caoRabo = paleta(UNIT, nCaes), caoColeira = paleta(UNIT, nCaes);
  const caes = [];
  for (let i = 0; i < nCaes; i++) {
    const m = novoMovel(1.8 + rand() * 1.8);
    anda(m, 0, 4.3);
    const cor = escolhe(CORES_CAO), s = 0.8 + rand() * 0.45;
    caes.push({
      m, s, fase: rand() * 6, pausa: 0,
      corpo: caoCorpo.poe(0, 0, 0, 1, 1, 1, 0, cor),
      cabeca: caoCabeca.poe(0, 0, 0, 1, 1, 1, 0, cor),
      pernas: [0, 1, 2, 3].map(() => caoPerna.poe(0, 0, 0, 1, 1, 1, 0, cor)),
      rabo: caoRabo.poe(0, 0, 0, 1, 1, 1, 0, cor),
      coleira: caoColeira.poe(0, 0, 0, 1, 1, 1, 0, escolhe(CORES_COLEIRA))
    });
  }

  function atualizaMoveis(dt, t) {
    carros.forEach((c, i) => {
      anda(c.m, dt, 2.4);
      const { x, z, ry } = c.m;
      carroCorpo.poe(x, 0.35, z, 4.3, 1.1, 2.1, ry, null, c.hc);
      const [ox, oz] = gira(-0.35, 0, ry);
      poe(carroCabine, x + ox, 1.45, z + oz, 2.3, 0.9, 1.85, ry, null, i);
      if (c.m.uber) poe(uberPlaca, x + ox, 2.35, z + oz, 1.2, 0.4, 0.5, ry, null, i);
    });
    caes.forEach(cao => {
      if (cao.pausa > 0) cao.pausa -= dt;
      else {
        anda(cao.m, dt, 4.3);
        if (rand() < dt * 0.08) cao.m.dir *= -1;
        if (rand() < dt * 0.12) cao.pausa = 1 + rand() * 3;
      }
      const { x, z, ry } = cao.m, s = cao.s;
      const andando = cao.pausa <= 0;
      const pulo = andando && !reduz ? Math.abs(Math.sin(t * 9 + cao.fase)) * 0.12 * s : 0;
      caoCorpo.poe(x, 0.5 * s + pulo, z, 1.3 * s, 0.55 * s, 0.55 * s, ry, null, cao.corpo);
      let [ox, oz] = gira(0.75 * s, 0, ry);
      caoCabeca.poe(x + ox, 0.82 * s + pulo, z + oz, 0.55 * s, 0.5 * s, 0.5 * s, ry, null, cao.cabeca);
      [ox, oz] = gira(0.52 * s, 0, ry);
      caoColeira.poe(x + ox, 0.76 * s + pulo, z + oz, 0.14 * s, 0.42 * s, 0.62 * s, ry, null, cao.coleira);
      const passo = andando && !reduz ? Math.sin(t * 9 + cao.fase) * 0.12 * s : 0;
      [[0.45, 0.18], [0.45, -0.18], [-0.45, 0.18], [-0.45, -0.18]].forEach(([a, b], k) => {
        const [lx, lz] = gira(a * s + (k % 2 ? passo : -passo), b * s, ry);
        caoPerna.poe(x + lx, 0, z + lz, 0.16 * s, 0.52 * s + pulo, 0.16 * s, ry, null, cao.pernas[k]);
      });
      [ox, oz] = gira(-0.75 * s, 0, ry);
      caoRabo.poe(x + ox, 0.8 * s + pulo, z + oz, 0.4 * s, 0.12 * s, 0.12 * s, ry + (reduz ? 0 : Math.sin(t * 14 + cao.fase) * 0.5), null, cao.rabo);
    });
    [carroCorpo, caoCorpo, caoCabeca, caoPerna, caoRabo, caoColeira].forEach(p => p.marca());
    carroCabine.instanceMatrix.needsUpdate = true;
    uberPlaca.instanceMatrix.needsUpdate = true;
  }
  atualizaMoveis(0, 0);

  // ---------- Esportivos conversíveis nas ruas e bugues na praia ----------
  const geoRoda = new THREE.CylinderGeometry(1, 1, 1, 12).rotateX(Math.PI / 2);
  function modelo() {
    const g = new THREE.Group();
    g.p = (geo, c, x, y, z, rz = 0, rx = 0) => {
      const m = new THREE.Mesh(geo, mat(c));
      m.position.set(x, y, z);
      m.rotation.set(rx, 0, rz);
      m.castShadow = true;
      g.add(m);
      return m;
    };
    g.roda = (x, y, z, r, w) => {
      g.p(geoRoda, 0x1d1d1d, x, y, z).scale.set(r, r, w);
      g.p(geoRoda, 0xced4da, x, y, z).scale.set(r * 0.55, r * 0.55, w + 0.05);
    };
    return g;
  }
  function esportivo(cor) {
    const g = modelo();
    g.p(new THREE.BoxGeometry(4.8, 0.75, 2.05), cor, 0, 0.75, 0);
    g.p(new THREE.BoxGeometry(1.7, 0.32, 1.95), cor, 1.5, 1.27, 0);
    g.p(new THREE.BoxGeometry(1.2, 0.32, 1.95), cor, -1.75, 1.27, 0);
    g.p(new THREE.BoxGeometry(0.08, 0.75, 1.8), 0x2b3a44, 0.5, 1.62, 0, 0.85);
    [0.48, -0.48].forEach(z => g.p(new THREE.BoxGeometry(0.5, 0.75, 0.6), 0x212529, -0.5, 1.5, z));
    g.p(new THREE.IcosahedronGeometry(0.32, 0), C.pele, -0.35, 2.0, -0.48);
    [0.65, -0.65].forEach(z => {
      g.p(new THREE.BoxGeometry(0.1, 0.22, 0.45), 0xfff3bf, 2.42, 0.95, z);
      g.p(new THREE.BoxGeometry(0.1, 0.22, 0.45), 0xe03131, -2.42, 0.95, z);
    });
    [1.55, -1.55].forEach(x => [1.05, -1.05].forEach(z => g.roda(x, 0.42, z, 0.42, 0.36)));
    return g;
  }
  function bugue(cor) {
    const g = modelo();
    g.p(new THREE.BoxGeometry(3.2, 0.6, 1.9), cor, 0, 1.0, 0);
    g.p(new THREE.BoxGeometry(1, 0.5, 1.5), cor, 1.85, 1.05, 0, -0.35);
    [0.45, -0.45].forEach(z => g.p(new THREE.BoxGeometry(0.55, 0.8, 0.6), 0x212529, -0.3, 1.6, z));
    g.p(new THREE.IcosahedronGeometry(0.32, 0), C.pele, -0.2, 2.15, -0.45);
    g.p(new THREE.IcosahedronGeometry(0.32, 0), C.pele, -0.2, 2.15, 0.45);
    [0.85, -0.85].forEach(z => g.p(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 5), 0x343a40, -0.75, 2.0, z));
    g.p(new THREE.CylinderGeometry(0.07, 0.07, 1.75, 5), 0x343a40, -0.75, 2.75, 0, 0, Math.PI / 2);
    g.p(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 5), 0x343a40, 0.45, 2.15, 0, 0.9);
    g.p(geoRoda, 0x1d1d1d, -1.85, 1.35, 0, 0, 0).scale.set(0.5, 0.5, 0.35);
    g.children[g.children.length - 1].rotation.y = Math.PI / 2;
    [1.25, -1.25].forEach(x => [1.15, -1.15].forEach(z => g.roda(x, 0.62, z, 0.62, 0.5)));
    return g;
  }
  const esportivos = [0xc92a2a, 0xfab005, 0x1c7ed6].map(cor => {
    const g = esportivo(cor);
    scene.add(g);
    const m = novoMovel(17 + rand() * 6);
    anda(m, 0, 2.4);
    return { g, m };
  });
  // Cada bugue roda de um lado do molhe, sem atravessar a estrada do farol
  const bugues = [[0xff922b, -120, 1, XMIN - 130, PX - 7], [0x51cf66, 240, -1, PX + 7, JX + 120]].map(([cor, x, dir, x0, x1]) => {
    const g = bugue(cor);
    scene.add(g);
    return { g, x, dir, x0, x1, fase: rand() * 6 };
  });
  function atualizaEspeciais(dt, t) {
    esportivos.forEach(({ g, m }) => {
      anda(m, dt, 2.4);
      g.position.set(m.x, 0, m.z);
      g.rotation.y = m.ry;
    });
    bugues.forEach(b => {
      b.x += b.dir * 11 * dt;
      if (b.x > b.x1) { b.x = b.x1; b.dir = -1; }
      else if (b.x < b.x0) { b.x = b.x0; b.dir = 1; }
      b.g.position.set(b.x, reduz ? 0 : Math.abs(Math.sin(t * 7 + b.fase)) * 0.1, MARZ - 7 + 0.6 * Math.sin(b.x * 0.05 + b.fase));
      b.g.rotation.y = b.dir > 0 ? 0 : Math.PI;
    });
  }
  atualizaEspeciais(0, 0);
  atualizaPresos(0, 0);
  instancias.forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });

  // ---------- Placas com nome (só as mais próximas, reaproveitadas) ----------
  const POOL = 40, RAIO = 72;
  const pool = [];
  const FONTE1 = '800 34px "Nunito Sans", "Segoe UI", sans-serif';
  const FONTE2 = '800 26px "Nunito Sans", "Segoe UI", sans-serif';
  for (let i = 0; i < POOL; i++) {
    const cv = document.createElement("canvas");
    cv.width = 640; cv.height = 128;
    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    tex.anisotropy = 4;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sp.scale.set(640 * 0.022, 128 * 0.022, 1);
    sp.visible = false;
    scene.add(sp);
    pool.push({ cv, ctx: cv.getContext("2d"), tex, sp, ent: -1, dest: null });
  }
  function corta(ctx, t, max) {
    if (ctx.measureText(t).width <= max) return t;
    while (t.length > 1 && ctx.measureText(t + "…").width > max) t = t.slice(0, -1);
    return t.trimEnd() + "…";
  }
  function desenhaPlaca(p, e, destaque) {
    const { ctx, cv } = p;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.font = FONTE1;
    const l1 = corta(ctx, e.t, 540);
    const w1 = ctx.measureText(l1).width;
    ctx.font = FONTE2;
    const l2 = corta(ctx, "@" + e.h, 540);
    const w2 = ctx.measureText(l2).width;
    const W = Math.min(628, Math.max(w1, w2) + 58), H = 92, x0 = (cv.width - W) / 2, y0 = 4;
    ctx.fillStyle = "#1d2a33";
    ctx.fillRect(x0 + 5, y0 + 5, W - 5, H);
    ctx.fillStyle = destaque ? "#ff7a59" : "#fffaf0";
    ctx.fillRect(x0, y0, W - 5, H);
    ctx.fillStyle = e.cor;
    ctx.fillRect(x0, y0, 12, H);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1d2a33";
    ctx.strokeRect(x0 + 2.5, y0 + 2.5, W - 10, H - 5);
    ctx.beginPath();
    ctx.moveTo(cv.width / 2 - 12, y0 + H);
    ctx.lineTo(cv.width / 2, y0 + H + 22);
    ctx.lineTo(cv.width / 2 + 12, y0 + H);
    ctx.closePath();
    ctx.fillStyle = "#1d2a33";
    ctx.fill();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = FONTE1;
    ctx.fillStyle = destaque ? "#fffaf0" : "#1d2a33";
    ctx.fillText(l1, cv.width / 2 + 4, y0 + 32);
    ctx.font = FONTE2;
    ctx.fillStyle = destaque ? "#1d2a33" : "#1f8a9e";
    ctx.fillText(l2, cv.width / 2 + 4, y0 + 66);
    p.tex.needsUpdate = true;
    p.dest = destaque;
  }
  const posEnt = e => e.mov ? e.mov : e;
  let destaqueIdx = -1, destaqueAte = 0;
  function atualizaPlacas() {
    const p = jog.position, cand = [];
    for (let i = 0; i < ents.length; i++) {
      const q = posEnt(ents[i]);
      const dx = q.x - p.x, dz = q.z - p.z, d2 = dx * dx + dz * dz;
      if (i === destaqueIdx) cand.push([-1, i]);
      else if (d2 < RAIO * RAIO) cand.push([d2, i]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    const quer = new Set(cand.slice(0, POOL).map(c => c[1]));
    const ativos = new Set();
    for (const s of pool) {
      if (s.ent >= 0 && !quer.has(s.ent)) { s.ent = -1; s.sp.visible = false; }
      else if (s.ent >= 0) ativos.add(s.ent);
    }
    for (const i of quer) {
      if (ativos.has(i)) continue;
      const s = pool.find(s => s.ent < 0);
      if (!s) break;
      s.ent = i;
      desenhaPlaca(s, ents[i], i === destaqueIdx);
      s.sp.visible = true;
    }
    for (const s of pool) if (s.ent >= 0 && s.dest !== (s.ent === destaqueIdx)) desenhaPlaca(s, ents[s.ent], s.ent === destaqueIdx);
  }
  function posicionaPlacas() {
    for (const s of pool) {
      if (s.ent < 0) continue;
      const e = ents[s.ent], q = posEnt(e);
      s.sp.position.set(q.x, e.y, q.z);
    }
  }

  // ---------- Jogador ----------
  function carregaMoradorLocal() {
    try {
      const meuId = localStorage.getItem("caragua_meu_id");
      const lista = JSON.parse(localStorage.getItem("caragua_moradores_v1") || "[]");
      return (meuId ? lista.find(x => x.id === meuId) : null) || (lista.length ? lista[lista.length - 1] : null);
    } catch (err) { return null; }
  }
  function corDePaleta(entry, fallback) {
    if (!entry) return fallback;
    if (typeof entry.c === "string" && entry.c[0] === "#") return parseInt(entry.c.slice(1), 16);
    if (Array.isArray(entry) && entry.length >= 3) return (entry[0] << 16) | (entry[1] << 8) | entry[2];
    return fallback;
  }
  const meuMorador = carregaMoradorLocal();
  const pal = window.PALETA || {};
  const estiloJogador = { fem: false, pele: 0xf2c29b, cabelo: 0x5c3317, camisa: 0x1c7ed6, calca: 0x2b3a55, sapato: 0x1d1d1d };
  if (meuMorador && meuMorador.aparencia) {
    const ap = meuMorador.aparencia;
    if (pal.pele && pal.pele[ap.pele]) estiloJogador.pele = corDePaleta(pal.pele[ap.pele], estiloJogador.pele);
    if (pal.cabelo && pal.cabelo[ap.corCabelo]) estiloJogador.cabelo = corDePaleta(pal.cabelo[ap.corCabelo], estiloJogador.cabelo);
    if (pal.roupa && pal.roupa[ap.camisa]) estiloJogador.camisa = corDePaleta(pal.roupa[ap.camisa], estiloJogador.camisa);
    if (pal.roupa && pal.roupa[ap.calca]) estiloJogador.calca = corDePaleta(pal.roupa[ap.calca], estiloJogador.calca);
    if (pal.sapato && pal.sapato[ap.sapato]) estiloJogador.sapato = corDePaleta(pal.sapato[ap.sapato], estiloJogador.sapato);
    if (["bob", "longo", "franja", "rabo", "coque"].includes(ap.estiloCabelo)) estiloJogador.fem = true;
  }
  const jog = new THREE.Group();
  // Jogador: boneco de blocos (usa morador salvo se existir, ou padrão camiseta azul, calça escura, cabelo castanho)
  let jogVox = bonecoMalhas(estiloJogador);
  jogVox.rotation.y = Math.PI;
  jog.add(jogVox);
  scene.add(jog);

  // ---------- Pulo (Espaço), Emotes (1..4) e Hooks de Controle / Câmera / Quadro ----------
  let jumpY = 0, vy = 0;
  const GRAVIDADE_PULO = 26, IMPULSO_PULO = 9.6;
  const EMOTES_MAPA = { acenar: "👋", dancar: "💃", coracao: "❤️", rir: "😂" };
  let emoteAtual = "", emoteAte = 0;
  let controleExterno = false;
  let cameraOverrideFn = null;
  const quadroListeners = [];

  const emojiEmoteSp = (function () {
    const cv = document.createElement("canvas");
    cv.width = 128; cv.height = 128;
    const ctx = cv.getContext("2d");
    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(1.15, 1.15, 1);
    sp.position.set(0, 3.05, 0);
    sp.visible = false;
    jogVox.add(sp);
    return { cv, ctx, tex, sp };
  })();

  function desenhaEmojiEmote(simbolo) {
    const { cv, ctx, tex } = emojiEmoteSp;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (simbolo) {
      ctx.font = '900 76px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(simbolo, 64, 68);
    }
    tex.needsUpdate = true;
  }

  function pular() {
    if (modalApoioAberto) return false;
    if (jumpY <= 0.03) {
      vy = IMPULSO_PULO;
      jumpY = 0.035;
      return true;
    }
    return false;
  }

  function fazerEmote(tipo) {
    if (modalApoioAberto) return "";
    const k = String(tipo || "").trim().toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(EMOTES_MAPA, k)) {
      emoteAtual = "";
      emoteAte = 0;
      emojiEmoteSp.sp.visible = false;
      return "";
    }
    emoteAtual = k;
    emoteAte = performance.now() + 2600;
    desenhaEmojiEmote(EMOTES_MAPA[k]);
    emojiEmoteSp.sp.visible = !window.CARAGUA_ONLINE;
    return emoteAtual;
  }

  function getPuloEmote() {
    if (emoteAtual && performance.now() > emoteAte) {
      emoteAtual = "";
      emojiEmoteSp.sp.visible = false;
    }
    return { jump: +jumpY.toFixed(2), emote: emoteAtual };
  }

  function setControleExterno(ativo) {
    controleExterno = !!ativo;
    if (controleExterno) voo = null;
    return controleExterno;
  }

  function setCameraOverride(fn) {
    cameraOverrideFn = typeof fn === "function" ? fn : null;
  }

  function addQuadroListener(fn) {
    if (typeof fn === "function" && !quadroListeners.includes(fn)) {
      quadroListeners.push(fn);
    }
    return () => {
      const idx = quadroListeners.indexOf(fn);
      if (idx >= 0) quadroListeners.splice(idx, 1);
    };
  }

  let yaw = 0.35, pitch = 0.6, dist = 36;
  jog.position.set(0, 0, 28);
  jog.rotation.y = Math.PI;

  function posicionaCamera(agora = performance.now()) {
    const p = jog.position;
    sol.position.set(p.x + 50, p.y + 100, p.z + 35);
    sol.target.position.set(p.x, p.y, p.z);
    if (estrelasNoite) estrelasNoite.position.set(p.x, 0, p.z);
    if (cameraOverrideFn) {
      cameraOverrideFn(cam, jog, agora);
      return;
    }
    const cx = p.x + Math.sin(yaw) * Math.cos(pitch) * dist;
    const cz = p.z + Math.cos(yaw) * Math.cos(pitch) * dist;
    const cy = Math.max(p.y + 1.5 + Math.sin(pitch) * dist, altura(cx, cz) + 2);
    cam.position.set(cx, cy, cz);
    cam.lookAt(p.x, p.y + 1.8, p.z);
  }

  function resolveColisao() {
    const p = jog.position, r = 0.8;
    for (const o of obstaculos) {
      if (o.ativo === false) continue;
      if (p.x < o.x0 - r || p.x > o.x1 + r || p.z < o.z0 - r || p.z > o.z1 + r) continue;
      const cx = limita(p.x, o.x0, o.x1), cz = limita(p.z, o.z0, o.z1);
      const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-6) {
        const d = Math.sqrt(d2);
        p.x = cx + dx / d * r;
        p.z = cz + dz / d * r;
      } else {
        const e = p.x - o.x0, di = o.x1 - p.x, t = p.z - o.z0, b = o.z1 - p.z, m = Math.min(e, di, t, b);
        if (m === e) p.x = o.x0 - r; else if (m === di) p.x = o.x1 + r; else if (m === t) p.z = o.z0 - r; else p.z = o.z1 + r;
      }
    }
    p.x = limita(p.x, LIM.x0, LIM.x1);
    p.z = limita(p.z, LIM.z0, LIM.z1);
  }

  // ---------- Sistema de Apoio ao Projeto (Apoia.se após 4 minutos) ----------
  const modalApoio = document.getElementById("modal-apoio");
  const fecharApoio = document.getElementById("fecharApoio");
  const btnContinuarJogando = document.getElementById("btnContinuarJogando");
  const overlayApoio = document.getElementById("overlayApoio");
  const btnApoiar = document.getElementById("btnApoiar");
  let tempoJogadoSegundos = 0;
  const LIMITE_APOIO_SEGUNDOS = 240; // 4 minutos = 240s
  let modalApoioExibido = false;
  let modalApoioAberto = false;

  try {
    if (sessionStorage.getItem("caragua_apoio_visto") === "1") {
      modalApoioExibido = true;
    }
  } catch (e) {}

  function abreModalApoio() {
    if (!modalApoio) return;
    modalApoioAberto = true;
    modalApoio.hidden = false;
    teclas.clear();
    const principal = modalApoio.querySelector(".btn-apoia-principal");
    if (principal) setTimeout(() => { try { principal.focus(); } catch (e) {} }, 50);
  }

  function fechaModalApoio() {
    if (!modalApoio) return;
    modalApoioAberto = false;
    modalApoio.hidden = true;
    teclas.clear();
    try { sessionStorage.setItem("caragua_apoio_visto", "1"); } catch (e) {}
  }

  if (fecharApoio) fecharApoio.addEventListener("click", fechaModalApoio);
  if (btnContinuarJogando) btnContinuarJogando.addEventListener("click", fechaModalApoio);
  if (overlayApoio) overlayApoio.addEventListener("click", fechaModalApoio);
  if (btnApoiar) {
    btnApoiar.addEventListener("click", () => {
      try { sessionStorage.setItem("caragua_apoio_visto", "1"); } catch (e) {}
    });
  }

  setTimeout(() => {
    if (!modalApoioExibido) {
      modalApoioExibido = true;
      abreModalApoio();
    }
  }, LIMITE_APOIO_SEGUNDOS * 1000);

  window.testarModalApoio = abreModalApoio;

  // ---------- Entrada ----------
  const teclas = new Set();
  const MAPA = { w: "f", arrowup: "f", s: "t", arrowdown: "t", a: "e", arrowleft: "e", d: "d", arrowright: "d", q: "gq", e: "ge", shift: "corre" };
  const TECLAS_EMOTE = { "1": "acenar", "2": "dancar", "3": "coracao", "4": "rir" };
  addEventListener("keydown", e => {
    if (modalApoioAberto) {
      if (e.key === "Escape") { fechaModalApoio(); e.preventDefault(); }
      return;
    }
    if (e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      if (!e.repeat) pular();
      return;
    }
    if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.repeat && TECLAS_EMOTE[e.key]) {
      e.preventDefault();
      fazerEmote(TECLAS_EMOTE[e.key]);
      return;
    }
    if (!modalApoioAberto && painel.hidden && e.key === "Enter" && !(e.target && e.target.closest && e.target.closest("input, textarea, select, button, a"))) {
      if (typeof window.CARAGUA_ABRIR_CHAT === "function") {
        e.preventDefault();
        window.CARAGUA_ABRIR_CHAT();
        return;
      }
    }
    const k = MAPA[e.key.toLowerCase()];
    if (k) {
      teclas.add(k);
      if (dicaEl) dicaEl.classList.add("oculta");
      if (k !== "corre") e.preventDefault();
    }
  });
  addEventListener("focusin", e => {
    if (e.target && e.target.matches && e.target.matches("input, textarea, select")) teclas.clear();
  });
  addEventListener("keyup", e => { const k = MAPA[e.key.toLowerCase()]; if (k) teclas.delete(k); });
  addEventListener("blur", () => teclas.clear());

  function getTeclasMovimento() {
    if (modalApoioAberto) return { frente: false, tras: false, esq: false, dir: false };
    return {
      frente: teclas.has("f") || joyV.y < -0.25,
      tras: teclas.has("t") || joyV.y > 0.25,
      esq: teclas.has("e") || joyV.x < -0.25,
      dir: teclas.has("d") || joyV.x > 0.25
    };
  }

  const tela = renderer.domElement;
  const placaEl = document.querySelector(".placa");
  const dicaEl = document.getElementById("dica");
  const ponteiros = new Map();
  let arrasto = 0, pinca0 = 0, dist0 = 0;
  tela.addEventListener("pointerdown", e => {
    if (modalApoioAberto) return;
    if (placaEl) placaEl.classList.remove("aberta");
    if (mapa) mapa.classList.remove("expandido");
    tela.setPointerCapture(e.pointerId);
    ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    arrasto = 0;
    if (ponteiros.size === 2) {
      const [a, b] = [...ponteiros.values()];
      pinca0 = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      dist0 = dist;
    }
  });
  tela.addEventListener("pointermove", e => {
    const p = ponteiros.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    arrasto += Math.abs(dx) + Math.abs(dy);
    if (ponteiros.size === 1) {
      yaw -= dx * 0.006;
      pitch = limita(pitch + dy * 0.004, 0.16, 1.3);
    } else if (ponteiros.size === 2) {
      const [a, b] = [...ponteiros.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      dist = limita(dist0 * pinca0 / d, 10, 120);
    }
  });
  function soltaPonteiro(e) {
    if (ponteiros.size === 1 && arrasto < 6 && e.type === "pointerup") clique(e);
    ponteiros.delete(e.pointerId);
  }
  tela.addEventListener("pointerup", soltaPonteiro);
  tela.addEventListener("pointercancel", soltaPonteiro);
  tela.addEventListener("wheel", e => {
    e.preventDefault();
    dist = limita(dist * (1 + e.deltaY * 0.0012), 10, 120);
  }, { passive: false });

  const raio = new THREE.Raycaster();
  const ray = raio;
  function clique(e) {
    const r = tela.getBoundingClientRect();
    ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, cam);
    if (typeof window.CARAGUA_CLIQUE_3D === "function" && window.CARAGUA_CLIQUE_3D(e, ray, cam)) return;

    if (controleExterno && jog.position.y > 60) return;

    // Intercepta clique nas plaquinhas 3D "À VENDA" dos terrenos livres
    const hitsVenda = ray.intersectObjects(placasVendaMeshes, true);
    for (let k = 0; k < hitsVenda.length; k++) {
      let obj = hitsVenda[k].object;
      let lotId = null;
      let vis = true;
      while (obj && obj !== scene) {
        if (!obj.visible) vis = false;
        if (!lotId && obj.userData && obj.userData.loteId) lotId = obj.userData.loteId;
        obj = obj.parent;
      }
      if (!vis || !lotId) continue;
      const lot = lotesLivres.find(item => item.id === lotId);
      if (lot && !lot.ocupada) {
        if (typeof window.CARAGUA_ABRIR_LOJA === "function") {
          window.CARAGUA_ABRIR_LOJA({ tab: "casas", lotId: lot.id });
        } else {
          avisa("Terreno livre " + lot.label + " à venda na Loja VIP!");
        }
        return;
      }
    }

    // Intercepta clique em casas compradas dinamicamente
    if (casasCompradasMeshes.length) {
      const hitCasaVip = ray.intersectObjects(casasCompradasMeshes, true)[0];
      if (hitCasaVip) {
        let pObj = hitCasaVip.object;
        while (pObj && pObj !== scene && !(pObj.userData && pObj.userData.lotId)) pObj = pObj.parent;
        const lotIdVip = pObj && pObj.userData && pObj.userData.lotId;
        const lotVip = lotIdVip ? lotesLivres.find(item => item.id === lotIdVip) : null;
        if (lotVip && lotVip._entIdx != null) {
          irPara(lotVip._entIdx, false);
          return;
        }
      }
    }

    pessoaCorpo.malhas.forEach(m => { m.boundingSphere = null; });
    carroCorpo.malhas.forEach(m => { m.boundingSphere = null; });
    const alvos = [...corpos.malhas, ...telhados.malhas, ...pessoaCorpo.malhas, ...carroCorpo.malhas];
    const hit = ray.intersectObjects(alvos, false)[0];
    if (!hit || hit.instanceId == null) return;
    const idx = hit.object.userData.ent && hit.object.userData.ent[hit.instanceId];
    if (idx != null) irPara(idx, false);
  }

  // Joystick & UI Mobile retrátil
  const joy = document.getElementById("joy"), pino = document.getElementById("pino");
  const joyV = { x: 0, y: 0 };
  let joyId = null;
  if (placaEl) {
    placaEl.addEventListener("click", e => {
      if (e.target && e.target.closest && e.target.closest("a, button")) return;
      placaEl.classList.toggle("aberta");
    });
  }
  if (toque) {
    joy.hidden = false;
    if (dicaEl) {
      dicaEl.textContent = "🕹️ Analógico anda (borda corre!) · arraste gira · ⬆️ pula";
      setTimeout(() => { dicaEl.classList.add("oculta"); }, 5500);
    }
  } else if (dicaEl) {
    setTimeout(() => { dicaEl.classList.add("oculta"); }, 7500);
  }
  function moveJoy(e) {
    const r = joy.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const m = Math.hypot(dx, dy), max = 40;
    const intensidade = Math.min(1, m / max);
    if (m > max) { dx = dx / m * max; dy = dy / m * max; }
    joyV.x = dx / max; joyV.y = dy / max;
    pino.style.transform = `translate(${dx}px, ${dy}px)`;
    joy.classList.toggle("correndo", intensidade > 0.82);
  }
  joy.addEventListener("pointerdown", e => {
    joyId = e.pointerId;
    joy.setPointerCapture(e.pointerId);
    if (placaEl) placaEl.classList.remove("aberta");
    if (mapa) mapa.classList.remove("expandido");
    if (dicaEl) dicaEl.classList.add("oculta");
    moveJoy(e);
  });
  joy.addEventListener("pointermove", e => { if (e.pointerId === joyId) moveJoy(e); });
  function soltaJoy(e) {
    if (e.pointerId !== joyId) return;
    joyId = null; joyV.x = 0; joyV.y = 0;
    pino.style.transform = "";
    joy.classList.remove("correndo");
  }
  joy.addEventListener("pointerup", soltaJoy);
  joy.addEventListener("pointercancel", soltaJoy);

  // ---------- Ir até alguém ----------
  let voo = null;
  const angDif = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  function irPara(i, mover = true) {
    const e = ents[i];
    if (!e) return;
    destaqueIdx = i;
    destaqueAte = performance.now() + 7000;
    let onde;
    if (e.k === "casa") onde = (typeof e.q === "string" ? e.q : `Quarteirão ${e.q}`) + (e.sup ? " · suplente de vereador" : "") + (e.barbeiro ? " · barbearia 💈" : "");
    else if (e.k === "uber") onde = "dirigindo um Uber";
    else onde = LUGAR[e.k].nome;
    avisa(`${e.t} · @${e.h} · ${onde}`);
    if (e._preso) {
      syncPresoVisual(e._preso, false);
      pessoaCorpo.marca();
      movel.marca();
    }
    atualizaPlacas();
    if (innerWidth < 700) fechaPainel();
    if (!mover) return;
    let para;
    if (e.mov) {
      if (e.k === "cadeia") {
        const offs = [[0, 6], [0, -6], [-6, 0], [6, 0], [-4.5, 4.5], [4.5, 4.5], [-4.5, -4.5], [4.5, -4.5], [0, 0]];
        let bx = e.mov.x, bz = e.mov.z;
        for (const [dx, dz] of offs) {
          const tx = limita(e.mov.x + dx, LIM.x0, LIM.x1), tz = limita(e.mov.z + dz, LIM.z0, LIM.z1);
          if (!colidePonto(tx, tz, 0.85) && podeAndar(tx, tz)) { bx = tx; bz = tz; break; }
        }
        para = { x: bx, z: bz, yaw: Math.atan2(bx - e.mov.x, bz - e.mov.z) || 0 };
      } else {
        para = { x: e.mov.x + (e.mov.h ? 0 : 6), z: e.mov.z + (e.mov.h ? 6 : 0), yaw: e.mov.h ? 0 : Math.PI / 2 };
      }
    } else para = { ...e.alvo };
    para.dist = 26; para.pitch = 0.5;
    if (reduz) {
      jog.position.set(para.x, 0, para.z);
      yaw = para.yaw; dist = para.dist; pitch = para.pitch;
    } else {
      voo = { t: 0, de: { x: jog.position.x, z: jog.position.z, yaw, dist, pitch }, para };
    }
    jog.rotation.y = para.yaw;
  }

  let avisoTimer = 0;
  const aviso = document.getElementById("aviso");
  function avisa(t) {
    aviso.textContent = t;
    aviso.classList.add("mostra");
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => aviso.classList.remove("mostra"), 4200);
  }

  // ---------- Painel ----------
  const painel = document.getElementById("painel"), abrir = document.getElementById("abrir");
  const busca = document.getElementById("busca"), lista = document.getElementById("lista");
  const filtrosEl = document.getElementById("filtros"), contagem = document.getElementById("contagem");
  let filtro = "todos";
  function abrePainel() { painel.hidden = false; abrir.setAttribute("aria-expanded", "true"); if (!toque) busca.focus(); }
  function fechaPainel() { painel.hidden = true; abrir.setAttribute("aria-expanded", "false"); }
  abrir.addEventListener("click", () => painel.hidden ? abrePainel() : fechaPainel());
  addEventListener("keydown", e => { if (e.key === "Escape" && !painel.hidden) { fechaPainel(); abrir.focus(); } });

  const ordemFiltros = [["todos", "Todos"], ["casa", "Casas"], ["camara", "Câmara"], ["prefeitura", "Prefeitura"], ["cadeia", "Cadeia"], ["uber", "Uber"], ["loja", "Lojas p/ alugar"], ["parque", "Parque"], ["boulevard", "Boulevard"], ["academia", "Academia"], ["shopping", "Shopping"]];
  ordemFiltros.filter(([k]) => k === "todos" || ents.some(e => e.k === k)).forEach(([k, nome]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "filtro";
    b.textContent = nome;
    b.setAttribute("aria-pressed", k === filtro ? "true" : "false");
    b.addEventListener("click", () => {
      filtro = k;
      filtrosEl.querySelectorAll(".filtro").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      montaLista();
    });
    filtrosEl.appendChild(b);
  });
  const busc = ents.map(e => semAcento(e.t + " @" + e.h));
  // Link direto de cada morador: o link da cidade + #@ dele (só letras, números e hífen)
  const LINK_CIDADE = location.origin + location.pathname;
  const slug = h => String(h).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const porSlug = new Map(ents.map((e, i) => [slug(e.h), i]).filter(([, i]) => !ents[i].oculto));
  atualizarBuscaCasa = function (idx) {
    const e = ents[idx];
    if (!e) return;
    busc[idx] = semAcento(e.t + " @" + e.h);
    if (e.h && !e.oculto) porSlug.set(slug(e.h), idx);
  };
  function montaLista() {
    const q = semAcento(busca.value.trim());
    const qh = q.replace(/^@+/, "");
    const achados = [];
    ents.forEach((e, i) => {
      if (filtro !== "todos" && e.k !== filtro) return;
      if (q && !busc[i].includes(q) && !(qh && e.h.toLowerCase().includes(qh))) return;
      achados.push(i);
    });
    if (qh) {
      const nota = i => { const h = ents[i].h.toLowerCase(); return h === qh ? 0 : h.startsWith(qh) ? 1 : h.includes(qh) ? 2 : 3; };
      achados.sort((a, b) => nota(a) - nota(b));
    }
    lista.innerHTML = "";
    const MAX = 120;
    contagem.textContent = achados.length > MAX
      ? `${achados.length} encontrados · mostrando ${MAX}, digite para filtrar`
      : `${achados.length} encontrado${achados.length === 1 ? "" : "s"}`;
    if (!achados.length) {
      const li = document.createElement("li");
      li.className = "vazio";
      li.textContent = "Ninguém com esse nome ou @.";
      lista.appendChild(li);
    }
    achados.slice(0, MAX).forEach(i => {
      const e = ents[i];
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.style.setProperty("--cor-item", e.k === "casa" ? e.cor : LUGAR[e.k].cor);
      const t = document.createElement("span");
      t.className = "t";
      t.textContent = e.t;
      const s = document.createElement("small");
      s.textContent = "@" + e.h + (e.k === "casa" ? ` · ${typeof e.q === "string" ? e.q : "Q" + e.q}${e.sup ? " · suplente de vereador" : ""}` : ` · ${LUGAR[e.k].nome}`);
      b.append(t, s);
      b.addEventListener("click", () => irPara(i));
      const a = document.createElement("a");
      a.href = "https://www.instagram.com/" + encodeURIComponent(e.h) + "/";
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "↗";
      a.setAttribute("aria-label", "Abrir @" + e.h + " no Instagram");
      const cp = document.createElement("a");
      cp.href = "#" + slug(e.h);
      cp.textContent = "🔗";
      cp.title = "Copiar o link direto para @" + e.h;
      cp.setAttribute("aria-label", "Copiar o link direto para @" + e.h);
      cp.addEventListener("click", ev => {
        ev.preventDefault();
        const link = LINK_CIDADE + "#" + slug(e.h);
        const ok = () => avisa("Link copiado: " + link);
        try {
          navigator.clipboard.writeText(link).then(ok, () => avisa("Copie o link: " + link));
        } catch (err) { avisa("Copie o link: " + link); }
      });
      if (e.oculto) li.append(b);
      else li.append(b, cp, a);
      lista.appendChild(li);
    });
    return achados;
  }
  busca.addEventListener("input", montaLista);
  busca.addEventListener("keydown", e => {
    if (e.key === "Enter") { const a = montaLista(); if (a.length) irPara(a[0]); }
  });

  // ---------- Mapa ----------
  const mapa = document.getElementById("mapa"), mctx = mapa.getContext("2d");
  const W0 = LIM.x0 - 10, W1 = LIM.x1 + 10, Z0 = LIM.z0 - 4, Z1 = LIM.z1 + 6;
  const MW = mapa.width, MH = Math.round(MW * (Z1 - Z0) / (W1 - W0));
  mapa.height = MH;
  const mx = x => (x - W0) / (W1 - W0) * MW, mz = z => (z - Z0) / (Z1 - Z0) * MH;
  const fundoMapa = document.createElement("canvas");
  fundoMapa.width = MW; fundoMapa.height = MH;
  (function () {
    const g = fundoMapa.getContext("2d");
    g.fillStyle = "#8cc66d"; g.fillRect(0, 0, MW, MH);
    g.fillStyle = "#5a646d"; g.fillRect(mx(XMIN - 5), mz(ZMIN - 8), mx(XMAX + 5) - mx(XMIN - 5), mz(34) - mz(ZMIN - 8));
    g.fillRect(mx(XMAX), mz(JZ - 5), mx(JX - 32) - mx(XMAX), mz(JZ + 5) - mz(JZ - 5));
    g.fillStyle = "#f1d9a6"; g.fillRect(0, mz(34), MW, mz(MARZ) - mz(34));
    g.fillStyle = "#2aa0b4"; g.fillRect(0, mz(MARZ), MW, MH - mz(MARZ));
    g.fillStyle = "#d9d4c7";
    g.fillRect(mx(PX - 3), mz(PZ0), mx(PX + 3) - mx(PX - 3), mz(ZT) - mz(PZ0));
    g.beginPath(); g.arc(mx(PX), mz(ZT), mx(PX + RTIP) - mx(PX), 0, Math.PI * 2); g.fill();
    g.fillStyle = "#d9480f";
    g.beginPath(); g.arc(mx(PX - 1.8), mz(ZT + 2), 3, 0, Math.PI * 2); g.fill();
    const cores = { casas: "#e9e1d3", camara: "#3b5bdb", prefeitura: "#2f9e44", praca: "#ff7a59", posto: "#fab005", balada: "#9c36b5", predios: "#868e96", igreja: "#4c6ef5", hospital: "#e03131", upa: "#1c7ed6", galeria: "#f59f00", academia: "#e8590c" };
    blocosMapa.forEach(b => {
      g.fillStyle = cores[b.tipo];
      g.fillRect(mx(b.cx - BW / 2), mz(b.cz - BD / 2), mx(b.cx + BW / 2) - mx(b.cx - BW / 2), mz(b.cz + BD / 2) - mz(b.cz - BD / 2));
    });
    g.fillStyle = "#5a646d"; g.fillRect(mx(SHOP.x0), mz(SHOP.z0 + 30), mx(SHOP.x1 + 1) - mx(SHOP.x0), mz(SHOP.z1) - mz(SHOP.z0 + 30));
    g.fillStyle = "#0ca678"; g.fillRect(mx(SHOP.x0 + 2), mz(SHOP.z0 + 1), mx(SHOP.x1 - 2) - mx(SHOP.x0 + 2), mz(SHOP.z0 + 23) - mz(SHOP.z0 + 1));
    g.fillStyle = "#f783ac";
    g.fillRect(mx(PQ.x0), mz(PQ.z0), mx(PQ.x1 + 12) - mx(PQ.x0), mz(46) - mz(PQ.z0));
    g.fillStyle = "#5a646d"; g.fillRect(mx(XMAX), mz(22), mx(BV.x1 + 8) - mx(XMAX), mz(34) - mz(22));
    g.fillStyle = "#d6336c"; g.fillRect(mx(XMAX + 12), mz(-13), mx(XMAX + 56) - mx(XMAX + 12), mz(21) - mz(-13));
    g.fillStyle = "#7048e8"; g.fillRect(mx(XMAX + 60), mz(-6), mx(BV.x1) - mx(XMAX + 60), mz(22) - mz(-6));
    g.fillStyle = "#f08c00";
    g.fillRect(mx(JX - 32), mz(JZ - 32), mx(JX + 32) - mx(JX - 32), mz(JZ + 32) - mz(JZ - 32));
    g.fillStyle = "#2f6f3d";
    g.beginPath(); g.arc(mx(MX), mz(MZ), (mx(MX + MRAIO) - mx(MX)), 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#c9a26b"; g.lineWidth = 2;
    g.beginPath();
    trilha.forEach(([x, z], k) => k ? g.lineTo(mx(x), mz(z)) : g.moveTo(mx(x), mz(z)));
    g.stroke();
    g.fillStyle = "#fffaf0";
    g.beginPath(); g.arc(mx(MX), mz(MZ), 3.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#7bc96f";
    g.fillRect(mx(FAZ.x0), mz(FAZ.estrada + 14), mx(FAZ.x1) - mx(FAZ.x0), mz(FAZ.z1) - mz(FAZ.estrada + 14));
    g.fillStyle = "#a86f45";
    g.fillRect(mx(FAZ.x0 + 18), mz(FAZ.estrada - 22), mx(FAZ.x1) - mx(FAZ.x0 + 18), mz(FAZ.estrada + 12) - mz(FAZ.estrada - 22));
    g.fillRect(mx(FAZ.x1), mz(FAZ.estrada - 2), mx(XMIN - 5) - mx(FAZ.x1), 3);
    g.fillStyle = "#7d6e5d";
    g.fillRect(mx(LIXO.x0), mz(LIXO.z0), mx(LIXO.x1) - mx(LIXO.x0), mz(LIXO.z1) - mz(LIXO.z0));
    g.fillStyle = "#9c6644";
    g.fillRect(mx(XMAX), mz(LIXO.estrada - 2), mx(LIXO.x0) - mx(XMAX), 3);
  })();
  function desenhaMapa() {
    mctx.drawImage(fundoMapa, 0, 0);
    mctx.fillStyle = "#1d2a33";
    carros.forEach(c => { if (c.m.uber) mctx.fillRect(mx(c.m.x) - 2, mz(c.m.z) - 2, 4, 4); });
    const outros = window.CARAGUA_OUTROS_MAPA || [];
    for (const o of outros) {
      if (!o || !Number.isFinite(o.x) || !Number.isFinite(o.z)) continue;
      mctx.beginPath(); mctx.arc(mx(o.x), mz(o.z), 4.2, 0, Math.PI * 2);
      mctx.fillStyle = o.cor || "#12b886"; mctx.fill();
      mctx.lineWidth = 1.8; mctx.strokeStyle = "#1d2a33"; mctx.stroke();
    }
    const evDots = window.CARAGUA_EVENTO_MAPA || [];
    for (const d of evDots) {
      if (!d || !Number.isFinite(d.x) || !Number.isFinite(d.z)) continue;
      const dx = mx(d.x), dz = mz(d.z), rr = Number(d.r) || 4.8;
      mctx.beginPath(); mctx.arc(dx, dz, rr, 0, Math.PI * 2);
      mctx.fillStyle = d.cor || "#ef4444"; mctx.fill();
      mctx.lineWidth = 2; mctx.strokeStyle = d.borda || "#ffffff"; mctx.stroke();
    }
    const px = mx(jog.position.x), pz = mz(jog.position.z);
    mctx.beginPath(); mctx.arc(px, pz, 6, 0, Math.PI * 2);
    mctx.fillStyle = "#ff7a59"; mctx.fill();
    mctx.lineWidth = 2.5; mctx.strokeStyle = "#1d2a33"; mctx.stroke();
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    mctx.beginPath(); mctx.moveTo(px, pz); mctx.lineTo(px + fx * 14, pz + fz * 14); mctx.stroke();
  }
  mapa.addEventListener("pointerdown", e => {
    if (controleExterno) return;
    if ((toque || innerWidth <= 760) && !mapa.classList.contains("expandido")) {
      mapa.classList.add("expandido");
      avisa("🗺️ Toque num ponto do mapa para ir até lá!");
      return;
    }
    const r = mapa.getBoundingClientRect();
    const x = W0 + (e.clientX - r.left) / r.width * (W1 - W0);
    const z = Z0 + (e.clientY - r.top) / r.height * (Z1 - Z0);
    jog.position.set(limita(x, LIM.x0, LIM.x1), 0, limita(z, LIM.z0, LIM.z1));
    resolveColisao();
    if (!podeAndar(jog.position.x, jog.position.z)) jog.position.z = Math.min(jog.position.z, MARZ - 1);
    voo = null;
    atualizaPlacas();
    if (mapa.classList.contains("expandido")) {
      setTimeout(() => mapa.classList.remove("expandido"), 300);
    }
  });

  // ---------- Montagem ----------
  const N = DADOS.length;
  document.getElementById("numeros").textContent = `${N} moradores · ${grupos.casa.length} casas · ${quarteiroes} quarteirões`;
  document.getElementById("qtd").textContent = "";
  const lugaresEl = document.getElementById("lugares");
  [
    ["camara", `Câmara ${grupos.camara.length}/15 vereadores`],
    ["prefeitura", grupos.prefeitura.length ? `Prefeitura ${grupos.prefeitura.length}` : grupos.casa.some(d => d.h === "julia_silxo") ? "Prefeita: Julia" : "Prefeito: vaga aberta"],
    ["cadeia", `Cadeia ${grupos.cadeia.length}`],
    ["uber", `Uber ${grupos.uber.length}`],
    ["loja", `Lojas p/ alugar ${ents.filter(e => e.k === "loja").length}`],
    ["parque", "Parque de Diversões"],
    ["boulevard", "Boulevard e Pixel Motors"],
    ["academia", "Academia Pixel Fit"],
    ["shopping", "Shopping Caragua Pixel"]
  ].forEach(([k, texto]) => {
    const li = document.createElement("li");
    const i = document.createElement("i");
    i.style.background = LUGAR[k].cor;
    li.append(i, document.createTextNode(texto));
    lugaresEl.appendChild(li);
  });
  montaLista();

  addEventListener("resize", () => {
    renderer.setSize(vw(), vh());
    cam.aspect = vw() / vh();
    cam.updateProjectionMatrix();
  });

  let ultimo = performance.now(), passo = 0, relogioPlacas = 0, relogioMapa = 0, faseLuz = -1;
  let ultimoAndando = false, prevExtX = 0, prevExtZ = 28;
  function quadro(agora) {
    const dt = Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    const t = agora / 1000;

    if (!modalApoioExibido) {
      tempoJogadoSegundos += dt;
      if (tempoJogadoSegundos >= LIMITE_APOIO_SEGUNDOS) {
        modalApoioExibido = true;
        abreModalApoio();
      }
    }

    let andando = false;
    if (!controleExterno) {
      let ix = 0, iz = 0;
      if (!modalApoioAberto) {
        if (teclas.has("f")) iz += 1;
        if (teclas.has("t")) iz -= 1;
        if (teclas.has("d")) ix += 1;
        if (teclas.has("e")) ix -= 1;
        ix += joyV.x; iz -= joyV.y;
        if (teclas.has("gq")) yaw += 1.7 * dt;
        if (teclas.has("ge")) yaw -= 1.7 * dt;
      }

      const len = Math.hypot(ix, iz);
      if (len > 0.08) {
        if (len > 1) { ix /= len; iz /= len; }
        const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
        const mvx = fx * iz + rx * ix, mvz = fz * iz + rz * ix;
        const joyMag = Math.hypot(joyV.x, joyV.y);
        const correndo = teclas.has("corre") || joyMag > 0.82;
        const escalaAnalog = (joyId !== null && !teclas.size) ? Math.max(0.38, Math.min(1, joyMag)) : 1;
        const v = (correndo ? 30 : 15 * escalaAnalog) * dt;
        const ax = jog.position.x;
        jog.position.x += mvx * v; resolveColisao();
        if (!podeAndar(jog.position.x, jog.position.z)) jog.position.x = ax;
        const az = jog.position.z;
        jog.position.z += mvz * v; resolveColisao();
        if (!podeAndar(jog.position.x, jog.position.z)) jog.position.z = az;
        jog.rotation.y += angDif(jog.rotation.y, Math.atan2(-mvx, -mvz)) * Math.min(1, dt * 12);
        andando = true;
        voo = null;
      }

      if (voo) {
        voo.t = Math.min(1, voo.t + dt / 1.1);
        const k = voo.t < 0.5 ? 2 * voo.t * voo.t : 1 - Math.pow(-2 * voo.t + 2, 2) / 2;
        const { de, para } = voo;
        jog.position.x = de.x + (para.x - de.x) * k;
        jog.position.z = de.z + (para.z - de.z) * k;
        yaw = de.yaw + angDif(de.yaw, para.yaw) * k;
        dist = de.dist + (para.dist - de.dist) * k;
        pitch = de.pitch + (para.pitch - de.pitch) * k;
        if (voo.t >= 1) voo = null;
      }
      jog.position.y = altura(jog.position.x, jog.position.z);
    }

    // Física simples de pulo vertical (chão relativo = 0)
    if (jumpY > 0 || vy > 0) {
      jumpY += vy * dt;
      vy -= GRAVIDADE_PULO * dt;
      if (jumpY <= 0) {
        jumpY = 0;
        vy = 0;
      }
    }

    // Expiração automática do emote temporário (~2.6s)
    if (emoteAtual && agora > emoteAte) {
      emoteAtual = "";
      emojiEmoteSp.sp.visible = false;
    }

    atualizaMoveis(dt, t);
    atualizaEspeciais(dt, t);
    atualizaFazenda(dt, t);
    atualizaLixao(dt, t);
    atualizaPresos(dt, t);
    atualizaPessoas(dt, t);
    atualizaParque(dt, t);
    atualizaBoulevard(dt, t);
    atualizaAcademia(dt, t);
    aviao.position.x += 16 * dt;
    if (aviao.position.x > 620) aviao.position.x = -620;
    if (!reduz) {
      helice.rotation.x = t * 40;
      aviao.position.y = 30 + Math.sin(t * 0.8) * 0.8;
    }
    if (portaoCadeia) {
      const p = jog.position;
      const alvo = (forcarPortaoCadeiaAberto || presoPertoPortao || Math.hypot(p.x - (JX - 32), p.z - JZ) < 11) ? 1 : 0;
      aberturaPortao = reduz ? alvo : limita(aberturaPortao + Math.sign(alvo - aberturaPortao) * dt * 0.9, 0, 1);
      portaoCadeia.position.z = JZ - aberturaPortao * 9.6;
      obsPortao.ativo = aberturaPortao < 0.9;
      lampadaPortao.material.color.setHex(
        forcarPortaoCadeiaAberto
          ? (Math.floor(t * 6) % 2 ? 0xff2b2b : 0xfacc15)
          : (aberturaPortao > 0.9 ? 0x2f9e44 : 0xe03131)
      );
    }
    if (!reduz) {
      const fase = Math.floor(t * 1.6) % 2;
      if (fase !== faseLuz) {
        faseLuz = fase;
        luzMalhas.forEach((m, k) => m.material.color.copy((k + fase) % 2 ? m.userData.fraca : m.userData.forte));
      }
      if (estrelaNatal) estrelaNatal.rotation.y = t * 0.8;
      estrelasExtras.forEach(s => { s.rotation.y = t * 0.8; });
      const pisca = Math.floor(t * 4) % 2;
      sirenes.forEach(s => { s.a.color.setHex(pisca ? 0xff2b2b : 0x5c1111); s.b.color.setHex(pisca ? 0x1f3a5a : 0x4dabf7); });
    }
    if (!reduz) {
      balada.feixes.forEach(f => {
        f.rotation.z = Math.sin(t * 0.8 + f.userData.fase) * 0.55;
        f.rotation.x = Math.cos(t * 0.6 + f.userData.fase) * 0.35;
      });
      balada.globo.rotation.y = t * 1.2;
      texPoste.offset.y = (t * 0.35) % 1;
      farol.feixe.rotation.y = t * 0.9;
      balada.placa.material.opacity = 0.8 + 0.2 * Math.sin(t * 5);
      navio.position.x += 5 * dt;
      if (navio.position.x > 700) navio.position.x = -700;
      navio.position.y = Math.sin(t * 0.6) * 0.25;
      navio.rotation.x = Math.sin(t * 0.45) * 0.008;
    }
    if (!reduz) for (const b of barcos) {
      b.position.y = Math.sin(t * 1.4 + b.userData.fase) * 0.18;
      b.rotation.z = Math.sin(t * 1.1 + b.userData.fase) * 0.05;
    }

    // Animação padrão de caminhada, pulo e emotes ANTES de onQuadro/quadroListeners
    // (assim interacoes.js pode aplicar pose sentada / jogVox.position em carros e caronas sem ser sobrescrito!)
    const andandoPose = controleExterno ? ultimoAndando : andando;
    const puloPasso = andandoPose && jumpY <= 0.01 && !reduz ? Math.abs(Math.sin((passo += dt * 12))) * 0.14 : 0;
    let extraY = 0;
    jogVox.rotation.set(0, Math.PI, 0);
    const pv = jogVox.userData.pivos;
    if (pv.P0) { pv.P0.rotation.set(0, 0, 0); pv.P1.rotation.set(0, 0, 0); }
    if (pv.B0) { pv.B0.rotation.set(0, 0, 0); pv.B1.rotation.set(0, 0, 0); }

    const balanco = andandoPose && !reduz ? Math.sin(passo) * 0.6 : 0;
    if (pv.P0) { pv.P0.rotation.x = balanco; pv.P1.rotation.x = -balanco; }
    if (pv.B0) { pv.B0.rotation.x = -balanco * 0.8; pv.B1.rotation.x = balanco * 0.8; }

    if (jumpY > 0.02 && !reduz) {
      if (pv.P0) { pv.P0.rotation.x = 0.34; pv.P1.rotation.x = -0.34; }
      if (pv.B0 && !emoteAtual) {
        pv.B0.rotation.x = -2.1; pv.B1.rotation.x = -2.1;
        pv.B0.rotation.z = -0.22; pv.B1.rotation.z = 0.22;
      }
    }

    if (window.CARAGUA_ONLINE && emojiEmoteSp.sp.visible) {
      emojiEmoteSp.sp.visible = false;
    }

    if (emoteAtual && !reduz) {
      if (emoteAtual === "acenar") {
        if (pv.B1) {
          pv.B1.rotation.x = -2.65;
          pv.B1.rotation.z = 0.35 + Math.sin(t * 11) * 0.42;
        }
        if (pv.B0) pv.B0.rotation.x = -0.15;
        jogVox.rotation.z = Math.sin(t * 5.5) * 0.05;
      } else if (emoteAtual === "dancar") {
        const sD = Math.sin(t * 9);
        extraY = Math.abs(sD) * 0.18;
        jogVox.rotation.z = sD * 0.12;
        if (pv.B0 && pv.B1) {
          pv.B0.rotation.x = -2.2 + sD * 0.7;
          pv.B1.rotation.x = -2.2 - sD * 0.7;
          pv.B0.rotation.z = -0.32;
          pv.B1.rotation.z = 0.32;
        }
        if (pv.P0 && pv.P1) {
          pv.P0.rotation.x = sD * 0.45;
          pv.P1.rotation.x = -sD * 0.45;
        }
      } else if (emoteAtual === "coracao") {
        extraY = Math.abs(Math.sin(t * 5)) * 0.08;
        jogVox.rotation.z = Math.sin(t * 4) * 0.04;
        if (pv.B0 && pv.B1) {
          pv.B0.rotation.z = -2.55;
          pv.B1.rotation.z = 2.55;
          pv.B0.rotation.x = -0.35;
          pv.B1.rotation.x = -0.35;
        }
      } else if (emoteAtual === "rir") {
        const sR = Math.sin(t * 15);
        extraY = Math.abs(sR) * 0.07;
        jogVox.rotation.x = sR * 0.09;
        if (pv.B0 && pv.B1) {
          pv.B0.rotation.x = -1.05 + sR * 0.22;
          pv.B1.rotation.x = -1.05 - sR * 0.22;
          pv.B0.rotation.z = 0.25;
          pv.B1.rotation.z = -0.25;
        }
      }
      if (emojiEmoteSp.sp.visible) {
        const pulso = 1.08 + Math.sin(t * 8) * 0.12;
        emojiEmoteSp.sp.scale.set(pulso, pulso, 1);
        emojiEmoteSp.sp.position.y = 3.05 + Math.sin(t * 6) * 0.1;
      }
    }
    jogVox.rotation.y = Math.PI;
    if (!controleExterno) {
      jogVox.position.set(0, jumpY + puloPasso + extraY, 0);
    } else {
      jogVox.position.y = jumpY + puloPasso + extraY;
    }

    // Listeners externos de quadro (interacoes.js / online.js) rodam após a pose padrão e antes da câmera
    if (window.CARAGUA_MUNDO && typeof window.CARAGUA_MUNDO.onQuadro === "function") {
      try { window.CARAGUA_MUNDO.onQuadro(dt, t, agora); } catch (err) { console.error(err); }
    }
    for (let i = 0; i < quadroListeners.length; i++) {
      try { quadroListeners[i](dt, t, agora); } catch (err) { console.error(err); }
    }

    // Calcula movimento externo (ex: salas y=140) após quadroListeners e antes de posicionaCamera
    if (controleExterno) {
      const dExt = Math.hypot(jog.position.x - prevExtX, jog.position.z - prevExtZ);
      andando = jog.position.y > 80 && dExt > 0.015;
    }
    prevExtX = jog.position.x;
    prevExtZ = jog.position.z;
    ultimoAndando = andando || !!voo;

    if (destaqueIdx >= 0 && agora > destaqueAte) destaqueIdx = -1;
    relogioPlacas -= dt;
    if (relogioPlacas <= 0) { atualizaPlacas(); relogioPlacas = 0.2; }
    posicionaPlacas();
    relogioMapa -= dt;
    if (relogioMapa <= 0) { desenhaMapa(); relogioMapa = 0.1; }

    posicionaCamera(agora);
    renderer.render(scene, cam);
    requestAnimationFrame(quadro);
  }

  function iniciar(dados) {
    if (dados && typeof dados.x === "number") {
      jog.position.set(dados.x, 0, dados.z);
      yaw = dados.yaw ?? yaw; pitch = dados.pitch ?? pitch; dist = dados.dist ?? dist;
    }
    posicionaCamera();
    atualizaPlacas();
    requestAnimationFrame(t => { ultimo = t; quadro(t); });
    irParaHash();
    addEventListener("hashchange", irParaHash);
  }
  window.CARAGUA_MUNDO = {
    scene,
    cam,
    jog,
    renderer,
    get jogVox() { return jogVox; },
    mat,
    altura,
    reduz,
    toque,
    meuMorador,
    estiloJogador,
    bonecoMalhas,
    avisa,
    pular,
    fazerEmote,
    getPuloEmote,
    setNoite,
    isNoite,
    lotesLivres,
    construirCasaComprada,
    removerCasaComprada,
    pontosPortas,
    campoInfo,
    setControleExterno,
    setCameraOverride,
    addQuadroListener,
    getTeclasMovimento,
    getJoy: () => ({ x: joyV.x, y: joyV.y, ativo: joyId !== null }),
    seguirYawSuave: (alvoYaw, fator) => {
      if (ponteiros.size === 0 && !voo) {
        yaw += angDif(yaw, alvoYaw) * limita(fator, 0, 1);
      }
    },
    getEstadoLocal: () => ({
      x: +jog.position.x.toFixed(2),
      z: +jog.position.z.toFixed(2),
      ry: +jog.rotation.y.toFixed(3),
      andando: ultimoAndando ? 1 : 0,
      jump: +jumpY.toFixed(2),
      emote: emoteAtual,
      estilo: Object.assign({}, estiloJogador)
    }),
    setEstiloLocal: parcial => {
      if (!parcial) return;
      ["fem", "pele", "cabelo", "camisa", "calca", "sapato"].forEach(k => {
        if (parcial[k] !== undefined) estiloJogador[k] = parcial[k];
      });
      const anexos = [];
      if (jogVox) {
        for (let i = jogVox.children.length - 1; i >= 0; i--) {
          const ch = jogVox.children[i];
          if (!ch.userData || !ch.userData._parteBoneco) {
            jogVox.remove(ch);
            anexos.push(ch);
          }
        }
        jog.remove(jogVox);
      }
      jogVox = bonecoMalhas(estiloJogador);
      jogVox.rotation.y = Math.PI;
      anexos.reverse().forEach(ch => jogVox.add(ch));
      jog.children.unshift(jogVox);
      jogVox.parent = jog;
    },
    voarAte: (x, z, textoAviso) => {
      if (controleExterno && jog.position.y > 60) {
        avisa("Saia da sala [E] antes de ir até outro ponto.");
        return;
      }
      if (controleExterno && window.CARAGUA_INTERACOES && typeof window.CARAGUA_INTERACOES.sairCarro === "function") {
        window.CARAGUA_INTERACOES.sairCarro();
      }
      const ax = limita(Number(x) || 0, LIM.x0, LIM.x1);
      const zClamp = limita(Number(z) || 0, LIM.z0, LIM.z1);
      const zFrente = limita(zClamp + 5, LIM.z0, LIM.z1);
      const az = podeAndar(ax, zFrente) ? zFrente : Math.min(zClamp, MARZ - 1);
      const para = { x: ax, z: az, yaw: 0, dist: 26, pitch: 0.5 };
      if (reduz) {
        jog.position.set(para.x, 0, para.z);
        yaw = para.yaw; dist = para.dist; pitch = para.pitch;
      } else {
        voo = { t: 0, de: { x: jog.position.x, z: jog.position.z, yaw, dist, pitch }, para };
      }
      jog.rotation.y = para.yaw;
      atualizaPlacas();
      if (textoAviso) avisa(textoAviso);
    },
    irParaArroba: (arroba, mover = true) => {
      const limpo = slug(String(arroba || "").replace(/^@+/, ""));
      if (!limpo) return null;
      const i = porSlug.get(limpo);
      if (i != null) {
        irPara(i, mover);
        return ents[i] || null;
      }
      return null;
    },
    LIM,
    MARZ,
    podeAndar,
    policiaHooks: {
      bonecoMalhas,
      cadPos: { x: JX, z: JZ },
      prefPos: especiais.prefeitura,
      grid: { XC, ZC, PASSO_X, PZ, COLS, ROWS, XMIN, XMAX, ZMIN, ZMAX, MARZ },
      colidePonto,
      forcarPortaoCadeia: abrir => { forcarPortaoCadeiaAberto = !!abrir; },
      cadeiaBounds: {
        x0: JX - 32, x1: JX + 32, z0: JZ - 32, z1: JZ + 32,
        portaoX: JX - 32, portaoZ: JZ,
        patio: { x0: JX - 28, x1: JX + 28, z0: JZ - 18, z1: JZ + 26 }
      },
      getPortaoAberto: () => aberturaPortao > 0.85,
      getPresosCadeia: () => presosCadeia.map(p => ({
        idx: p.entIdx,
        h: p.d.h,
        t: p.d.t,
        x: +p.x.toFixed(2),
        z: +p.z.toFixed(2),
        ry: +p.ry.toFixed(3),
        noPatio: p.x >= JX - 32
      })),
      setModoFugaPolicia: ativo => { modoFugaPolicia = !!ativo; },
      rotuloFixo
    },
    onQuadro: null
  };
  // Abrir a cidade já na casa de alguém: link + #nome-do-arroba (ex.: ...#pedriinn7)
  function irParaHash() {
    let h = "";
    try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) { h = location.hash.slice(1); }
    if (!h) return;
    const i = porSlug.get(slug(h));
    if (i != null) {
      irPara(i);
      const ent = ents[i];
      if (ent && ent.h) {
        setTimeout(() => {
          if (window.CARAGUA_ONLINE && typeof window.CARAGUA_ONLINE.sugerirArrobaHash === "function") {
            window.CARAGUA_ONLINE.sugerirArrobaHash(ent.h, ent.t);
          }
        }, 700);
      }
    }
  }

  try {
    window.claude?.hot?.snapshot?.(() => ({ x: jog.position.x, z: jog.position.z, yaw, pitch, dist }));
  } catch (e) { /* opcional */ }

  const fontes = document.fonts && document.fonts.load
    ? Promise.race([document.fonts.load('800 34px "Nunito Sans"'), new Promise(r => setTimeout(r, 1500))])
    : Promise.resolve();
  fontes.catch(() => {}).then(() => {
    window.claude?.hot?.ready ? window.claude.hot.ready(iniciar) : iniciar(window.claude?.hot?.data ?? {});
  });
})();
