// Caraguá Pixel 3D · Texturas pixel art noturnas + Construções e detalhes exclusivos da cidade
(function () {
  'use strict';

  function pixTex(w, h, fn, rx, ry) {
    var cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    fn(cv.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(cv);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    if (rx || ry) t.repeat.set(rx || 1, ry || 1);
    return t;
  }

  function criaTexturasPixel(rand) {
    var grama = pixTex(32, 32, function (g, w, h) {
      g.fillStyle = '#183324';
      g.fillRect(0, 0, w, h);
      for (var y = 0; y < h; y += 2) {
        for (var x = 0; x < w; x += 2) {
          var r = rand();
          if (r < 0.22) { g.fillStyle = '#204531'; g.fillRect(x, y, 2, 2); }
          else if (r < 0.34) { g.fillStyle = '#12261b'; g.fillRect(x, y, 2, 2); }
        }
      }
    }, 80, 60);

    var asfalto = pixTex(32, 32, function (g, w, h) {
      g.fillStyle = '#232b38';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 64; i++) {
        g.fillStyle = rand() < 0.5 ? '#2a3444' : '#1c232e';
        g.fillRect(Math.floor(rand() * 16) * 2, Math.floor(rand() * 16) * 2, 2, 2);
      }
    }, 45, 35);

    var areia = pixTex(32, 32, function (g, w, h) {
      g.fillStyle = '#8b7956';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 70; i++) {
        g.fillStyle = rand() < 0.5 ? '#9c8964' : '#786747';
        g.fillRect(Math.floor(rand() * 16) * 2, Math.floor(rand() * 16) * 2, 2, 2);
      }
    }, 90, 4);

    var mar = pixTex(32, 32, function (g, w, h) {
      g.fillStyle = '#152a44';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#1f3e63';
      g.fillRect(4, 6, 8, 2);
      g.fillRect(18, 14, 10, 2);
      g.fillRect(2, 24, 6, 2);
      g.fillRect(16, 28, 8, 2);
    }, 90, 40);

    var prediosJanela = pixTex(16, 32, function (g, w, h) {
      g.fillStyle = '#232c3d';
      g.fillRect(0, 0, w, h);
      for (var row = 2; row < h - 2; row += 4) {
        for (var col = 2; col < w - 2; col += 4) {
          var acesa = rand() < 0.72;
          g.fillStyle = acesa ? (rand() < 0.25 ? '#ffe787' : '#ffd23f') : '#131926';
          g.fillRect(col, row, 2, 2);
        }
      }
    }, 2, 3);

    var matPredio = new THREE.MeshStandardMaterial({
      map: prediosJanela,
      emissiveMap: prediosJanela,
      emissive: new THREE.Color(0xffcf40),
      emissiveIntensity: 0.45,
      roughness: 0.9,
      flatShading: true
    });

    function placaTexto(txt, sub, bg, fg, borda) {
      var cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 80;
      var g = cv.getContext('2d');
      g.fillStyle = bg || '#141a30';
      g.fillRect(0, 0, 256, 80);
      g.strokeStyle = borda || '#f0d060';
      g.lineWidth = 6;
      g.strokeRect(3, 3, 250, 74);
      g.fillStyle = fg || '#ffd23f';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = 'bold 28px "Silkscreen", monospace';
      g.fillText(txt, 128, sub ? 28 : 40);
      if (sub) {
        g.fillStyle = '#ebe6d6';
        g.font = 'bold 16px "Silkscreen", monospace';
        g.fillText(sub, 128, 56);
      }
      var tex = new THREE.CanvasTexture(cv);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      return new THREE.MeshBasicMaterial({ map: tex });
    }

    return {
      grama: grama,
      asfalto: asfalto,
      areia: areia,
      mar: mar,
      matPredio: matPredio,
      placaTexto: placaTexto
    };
  }

  function addPlaca3D(scene, mat, w, h, x, y, z, ry) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    scene.add(m);
    return m;
  }

  // 1. UPA (Unidade de Pronto Atendimento) — branca com cruz vermelha e estacionamento iluminado
  function buildUPA(ctx, cx, cz) {
    var caixa = ctx.caixa, bloqueia = ctx.bloqueia, luz = ctx.luz, rotuloFixo = ctx.rotuloFixo, scene = ctx.scene;
    caixa(42, 0.32, 20, 0x262e3d, cx, 0, cz, false);
    // Estacionamento na frente com vagas marcadas e luzes de Natal
    for (var i = -14; i <= 14; i += 4.6) {
      caixa(0.18, 0.04, 4.5, 0x8f99ad, cx + i, 0.34, cz + 5.8, false);
    }
    [[-16, 2.8], [0, 2.8], [16, 2.8], [-16, 8.6], [16, 8.6]].forEach(function (pt) {
      caixa(0.22, 3.8, 0.22, 0x141a30, cx + pt[0], 0.32, cz + pt[1]);
    });
    for (var k = -15; k <= 15; k += 2.2) {
      luz(cx + k, 4.1 - Math.abs(Math.sin(k * 0.2)) * 0.4, cz + 2.8);
      luz(cx + k, 4.1 - Math.abs(Math.cos(k * 0.2)) * 0.4, cz + 8.6);
    }

    // Prédio principal branco
    var zb = cz - 4.2;
    caixa(34, 6.8, 9.6, 0xdfe4ee, cx, 0.32, zb);
    caixa(34.6, 0.6, 10.2, 0xb8c2d4, cx, 7.1, zb);
    bloqueia(cx, zb, 34, 9.6);

    // Cruz vermelha brilhante no topo e na fachada
    var matCruz = new THREE.MeshBasicMaterial({ color: 0xff4d4d });
    var cV = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.2, 0.3), matCruz);
    cV.position.set(cx, 5.4, zb + 4.95);
    var cH = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 0.3), matCruz);
    cH.position.set(cx, 5.4, zb + 4.95);
    scene.add(cV, cH);

    // Janelas altas iluminadas
    var matLuz = new THREE.MeshBasicMaterial({ color: 0xffdf70 });
    for (var j = -13; j <= 13; j += 3.25) {
      if (Math.abs(j) < 2) continue;
      var jan = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.8, 0.14), matLuz);
      jan.position.set(cx + j, 2.4, zb + 4.86);
      scene.add(jan);
    }
    // Entrada de emergência
    caixa(3.2, 3.2, 0.2, 0x1b263b, cx, 0.32, zb + 4.86, false);
    addPlaca3D(scene, ctx.tex.placaTexto('UPA 24H', 'ATENDIMENTO', '#141a30', '#ff5a52', '#ff5a52'), 6.2, 1.8, cx, 8.6, zb + 5.15);
    rotuloFixo('UPA · Saúde', '#ff5a52', '#fffaf0', 1.15, cx, 12.2, zb);
    ctx.registraLugar('upa', 'UPA 24h', 'Médicos, enfermeiros e fisioterapeutas (Chris, Bruno e Vitória)', cx, cz + 11, 'caraguapixel');
  }

  // 2. Escola e Quadra coberta/azul (img/escola.jpg)
  function buildEscolaQuadra(ctx, cx, cz) {
    var caixa = ctx.caixa, bloqueia = ctx.bloqueia, rotuloFixo = ctx.rotuloFixo, scene = ctx.scene;
    caixa(42, 0.32, 20, 0x2a3242, cx, 0, cz, false);

    // Prédio da escola (metade esquerda do quarteirão)
    var ex = cx - 9.5, ez = cz - 1;
    caixa(18, 6.2, 12, 0xd8a84e, ex, 0.32, ez);
    caixa(18.8, 0.7, 12.8, 0x8b4c2f, ex, 6.5, ez);
    bloqueia(ex, ez, 18, 12);
    var matLuz = new THREE.MeshBasicMaterial({ color: 0xffe066 });
    for (var i = -6; i <= 6; i += 4) {
      var w1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.7, 0.14), matLuz);
      w1.position.set(ex + i, 4.3, ez + 6.08);
      var w2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.7, 0.14), matLuz);
      w2.position.set(ex + i, 2.0, ez + 6.08);
      scene.add(w1, w2);
    }
    addPlaca3D(scene, ctx.tex.placaTexto('ESCOLA', 'PROFS MARCO & JULIA', '#141a30', '#ffd23f', '#f0d060'), 7, 2.1, ex, 8.2, ez + 6.4);

    // Quadra poliesportiva azul (metade direita)
    var qx = cx + 10, qz = cz;
    caixa(17.5, 0.38, 14, 0x1e5ea8, qx, 0, qz, false);
    // Linhas brancas da quadra
    caixa(16.2, 0.04, 0.25, 0xeef2fa, qx, 0.4, qz - 6.3, false);
    caixa(16.2, 0.04, 0.25, 0xeef2fa, qx, 0.4, qz + 6.3, false);
    caixa(0.25, 0.04, 12.8, 0xeef2fa, qx - 8, 0.4, qz, false);
    caixa(0.25, 0.04, 12.8, 0xeef2fa, qx + 8, 0.4, qz, false);
    caixa(0.25, 0.04, 12.8, 0xeef2fa, qx, 0.4, qz, false);
    // Traves
    [-8.2, 8.2].forEach(function (dx) {
      caixa(0.18, 1.9, 0.18, 0xeef2fa, qx + dx, 0.4, qz - 1.5);
      caixa(0.18, 1.9, 0.18, 0xeef2fa, qx + dx, 0.4, qz + 1.5);
      caixa(0.18, 0.18, 3.18, 0xeef2fa, qx + dx, 2.2, qz);
    });
    rotuloFixo('Escola e Quadra', '#1e5ea8', '#fffaf0', 1.1, cx, 11.2, cz);
    ctx.registraLugar('escola', 'Escola e Quadra', 'Professores Marco e Julia dão aula aqui', cx, cz + 11.5, 'marcoabreu05');
  }

  // 3. Fórum de Caraguá Pixel
  function buildForum(ctx, cx, cz) {
    var caixa = ctx.caixa, malha = ctx.malha, bloqueia = ctx.bloqueia, rotuloFixo = ctx.rotuloFixo, scene = ctx.scene;
    var zb = cz - 4.5;
    caixa(42, 0.32, 20, 0x262e3d, cx, 0, cz, false);
    caixa(30, 0.5, 4, 0x5c667a, cx, 0.32, zb + 6.5, false);
    caixa(28, 7.6, 9, 0x3b4559, cx, 0.8, zb);
    caixa(29.5, 0.8, 10.5, 0x2c3547, cx, 8.4, zb);
    bloqueia(cx, zb, 28, 9);
    for (var i = -10; i <= 10; i += 4) {
      malha(new THREE.CylinderGeometry(0.42, 0.48, 7.4, 8), 0xdbe0ea, cx + i, 4.5, zb + 4.9);
    }
    var matLuz = new THREE.MeshBasicMaterial({ color: 0xffdf70 });
    for (var j = -12; j <= 12; j += 4) {
      if (Math.abs(j) < 1) continue;
      var w = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.6, 0.14), matLuz);
      w.position.set(cx + j, 4.5, zb + 4.58);
      scene.add(w);
    }
    addPlaca3D(scene, ctx.tex.placaTexto('FÓRUM', 'JUSTIÇA · VAGAS ABERTAS', '#141a30', '#f0d060', '#f0d060'), 7.4, 2.2, cx, 9.8, zb + 5.3);
    rotuloFixo('Fórum', '#f0d060', '#0d1020', 1.15, cx, 13.5, zb);
    ctx.registraLugar('forum', 'Fórum', 'Advogados, juízes e promotores · Mayck (advogado)', cx, cz + 11, 'mayck8895');
  }

  // 4. Rua do Comércio — 8 Lojas com toldos coloridos e placa ALUGA-SE (img/comercio.jpg)
  function buildRuaComercio(ctx, cx, cz) {
    var caixa = ctx.caixa, bloqueia = ctx.bloqueia, rotuloFixo = ctx.rotuloFixo, scene = ctx.scene;
    caixa(44, 0.32, 22, 0x2c3442, cx, 0, cz, false);
    // Calçadão central entre as duas fileiras de lojas
    caixa(42, 0.36, 4.2, 0x475266, cx, 0, cz, false);

    var TOLDOS = [0xc0403a, 0x1c7ed6, 0x2f9e44, 0xf0d060, 0x7048e8, 0xe8892c, 0x1f8a9e, 0xd6336c];
    var matAluga = ctx.tex.placaTexto('ALUGA-SE', 'MANDE CNPJ NA DM', '#141a30', '#ffd23f', '#4fd06f');
    var matVitrine = new THREE.MeshBasicMaterial({ color: 0xffe484 });

    var idx = 0;
    [-5.8, 5.8].forEach(function (dz, fila) {
      var frenteZ = cz + dz + (fila === 0 ? 3.2 : -3.2);
      var ry = fila === 0 ? 0 : Math.PI;
      for (var col = 0; col < 4; col++) {
        idx++;
        var lx = cx - 15 + col * 10;
        var lz = cz + dz;
        caixa(8.6, 5.0, 6.2, 0xd8d3c8, lx, 0.32, lz);
        caixa(9.0, 0.5, 6.6, 0x232b38, lx, 5.32, lz);
        bloqueia(lx, lz, 8.6, 6.2);

        // Vitrine iluminada
        var vit = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.2, 0.14), matVitrine);
        vit.position.set(lx, 1.7, frenteZ);
        scene.add(vit);

        // Toldo listrado colorido
        for (var s = 0; s < 5; s++) {
          var corT = s % 2 === 0 ? TOLDOS[idx - 1] : 0xf8f9fa;
          var t = caixa(1.4, 0.18, 1.8, corT, lx - 2.8 + s * 1.4, 3.6, frenteZ + (fila === 0 ? 0.85 : -0.85), false);
          t.rotation.x = fila === 0 ? 0.32 : -0.32;
        }

        // Placa ALUGA-SE clicável
        addPlaca3D(scene, matAluga, 5.2, 1.5, lx, 4.7, frenteZ + (fila === 0 ? 0.08 : -0.08), ry);
        ctx.registraEntidade({
          h: 'caraguapixel',
          t: 'Loja ' + idx + ' · ALUGA-SE',
          k: 'comercio',
          cor: '#f0d060',
          x: lx,
          y: 7.4,
          z: lz,
          alvo: { x: lx, z: cz, yaw: fila === 0 ? 0 : Math.PI }
        });
      }
    });

    rotuloFixo('Rua do Comércio · 8 Lojas', '#f0d060', '#0d1020', 1.15, cx, 9.6, cz);
  }

  // 5. Bairro Novo (Em Obras) — terreno marcado + materiais + guindaste girando (img/obras.jpg)
  function buildBairroNovo(ctx, cx, cz) {
    var caixa = ctx.caixa, bloqueia = ctx.bloqueia, rotuloFixo = ctx.rotuloFixo, scene = ctx.scene;
    // Terra batida
    caixa(42, 0.34, 20, 0x4c3b28, cx, 0, cz, false);
    // Faixa amarela/preta de obra em volta
    caixa(42.4, 0.14, 0.4, 0xf0d060, cx, 0.35, cz - 10, false);
    caixa(42.4, 0.14, 0.4, 0xf0d060, cx, 0.35, cz + 10, false);
    caixa(0.4, 0.14, 20.4, 0xf0d060, cx - 21, 0.35, cz, false);
    caixa(0.4, 0.14, 20.4, 0xf0d060, cx + 21, 0.35, cz, false);

    // 4 lotes marcados
    [[-10, -4.5], [10, -4.5], [-10, 4.5], [10, 4.5]].forEach(function (p) {
      caixa(14, 0.18, 6.5, 0x625a52, cx + p[0], 0.35, cz + p[1], false);
    });

    // Pilha de tijolos/materiais
    caixa(3.5, 1.4, 2.2, 0xb55a3c, cx - 16, 0.35, cz + 5);
    bloqueia(cx - 16, cz + 5, 3.6, 2.3);

    // Guindaste amarelo alto
    var gx = cx, gz = cz;
    caixa(2.8, 0.8, 2.8, 0x343a40, gx, 0.35, gz);
    caixa(1.1, 18, 1.1, 0xf0d060, gx, 1.1, gz);
    bloqueia(gx, gz, 3, 3);

    var lanca = new THREE.Group();
    var braco = new THREE.Mesh(new THREE.BoxGeometry(24, 0.9, 0.9), ctx.mat(0xf0d060));
    braco.position.set(5, 0, 0);
    braco.castShadow = true;
    var contra = new THREE.Mesh(new THREE.BoxGeometry(4, 1.8, 1.8), ctx.mat(0x495057));
    contra.position.set(-5.5, 0, 0);
    var cabo = new THREE.Mesh(new THREE.BoxGeometry(0.12, 6, 0.12), ctx.mat(0xdee2e6));
    cabo.position.set(14, -3, 0);
    var gancho = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), ctx.mat(0xc0403a));
    gancho.position.set(14, -6.2, 0);
    var farolObra = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff5a52 }));
    farolObra.position.set(0, 1.1, 0);
    lanca.add(braco, contra, cabo, gancho, farolObra);
    lanca.position.set(gx, 19.2, gz);
    scene.add(lanca);

    addPlaca3D(scene, ctx.tex.placaTexto('BAIRRO NOVO', 'EM OBRAS · APÓS 16/11', '#141a30', '#4fd06f', '#4fd06f'), 7.4, 2.2, cx, 3.2, cz + 10.2);
    rotuloFixo('Bairro Novo · Em Obras', '#4fd06f', '#0d1020', 1.1, cx, 22.5, gz);
    ctx.registraLugar('obras', 'Bairro Novo (Em Obras)', 'Terrenos marcados para novos moradores após 16/11', cx, cz + 12, 'caraguapixel');

    return lanca;
  }

  // 6. Orla noturna: posto salva-vidas, caminhão verde, luzinhas nos prédios e postes da avenida
  function buildOrlaExtras(ctx, especiaisLista, XMIN, XMAX) {
    var caixa = ctx.caixa, bloqueia = ctx.bloqueia, luz = ctx.luz, scene = ctx.scene;

    // Posto de Salva-vidas na praia (Pedro e Artur)
    var sx = 24, sz = 46;
    caixa(0.25, 2.8, 0.25, 0x8a5a3b, sx - 1.3, 0.1, sz - 1.3);
    caixa(0.25, 2.8, 0.25, 0x8a5a3b, sx + 1.3, 0.1, sz - 1.3);
    caixa(0.25, 2.8, 0.25, 0x8a5a3b, sx - 1.3, 0.1, sz + 1.3);
    caixa(0.25, 2.8, 0.25, 0x8a5a3b, sx + 1.3, 0.1, sz + 1.3);
    caixa(3.2, 2.0, 3.2, 0xf0d060, sx, 2.8, sz);
    caixa(3.6, 0.6, 3.6, 0xff4d4d, sx, 4.8, sz);
    bloqueia(sx, sz, 3.2, 3.2);
    ctx.registraLugar('praia', 'Posto Salva-vidas', 'Praia da orla · Vereadores Pedro e Artur', sx, sz + 4, 'artur_maarques');

    // Luzes de Natal e caminhão verde junto aos Prédios da Orla
    (especiaisLista.predios || []).forEach(function (b, idx) {
      for (var k = -16; k <= 16; k += 2.5) {
        luz(b.cx + k, 2.4, b.cz + 10.6);
      }
      if (idx === 1) {
        // Caminhão verde (img/mapa.jpg) estacionado na Avenida da Praia
        caixa(6.4, 2.3, 2.2, 0x3b8c4c, b.cx + 12, 0.4, b.cz + 13.8);
        caixa(2.2, 1.8, 2.1, 0xeef2fa, b.cx + 16.4, 0.4, b.cz + 13.8);
        bloqueia(b.cx + 13.5, b.cz + 13.8, 8.8, 2.4);
      }
    });

    // Postes de luz da Avenida da Orla (iluminação quente noturna)
    var matLamp = new THREE.MeshBasicMaterial({ color: 0xffdf70 });
    for (var x = XMIN; x <= XMAX; x += 26) {
      caixa(0.18, 5.2, 0.18, 0x343a40, x, 0.28, 34.6, false);
      var lamp = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.45), matLamp);
      lamp.position.set(x, 5.5, 34.3);
      scene.add(lamp);
    }
  }

  // 7. Mistérios noturnos: Luz piscando no Morro Santo Antônio + A Ilha do Outro Lado
  function buildMisterios(ctx, MX, MZ, MALT, XMAX) {
    var scene = ctx.scene, rotuloFixo = ctx.rotuloFixo, caixa = ctx.caixa;

    // Luz misteriosa piscando no topo do Morro Santo Antônio
    var farolMorro = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xff4d4d })
    );
    farolMorro.position.set(MX, MALT + 18.8, MZ);
    scene.add(farolMorro);
    ctx.registraLugar('morro', 'Luz do Morro Santo Antônio', 'Mistério: pisca toda noite no alto do morro', MX, MZ + 14, 'caraguapixel');

    // Fogueira/luz misteriosa na Ilha do Outro Lado (Ilhabela)
    var ix = XMAX + 40, iz = 296;
    caixa(1.6, 0.5, 1.6, 0x6b4a35, ix, 43.5, iz - 28, false);
    var luzIlha = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.4, 0),
      new THREE.MeshBasicMaterial({ color: 0xff7a59 })
    );
    luzIlha.position.set(ix, 45.8, iz - 28);
    scene.add(luzIlha);
    rotuloFixo('A Ilha do Outro Lado (?)', '#c0403a', '#fffaf0', 1.4, ix, 56, iz - 22);
    ctx.registraLugar('ilha', 'A Ilha do Outro Lado', 'Mistério: ninguém atravessou o canal ainda', ix - 16, 155, 'caraguapixel');

    return { farolMorro: farolMorro, luzIlha: luzIlha };
  }

  window.JOGO_LUGARES = {
    criaTexturasPixel: criaTexturasPixel,
    buildUPA: buildUPA,
    buildEscolaQuadra: buildEscolaQuadra,
    buildForum: buildForum,
    buildRuaComercio: buildRuaComercio,
    buildBairroNovo: buildBairroNovo,
    buildOrlaExtras: buildOrlaExtras,
    buildMisterios: buildMisterios
  };
})();
