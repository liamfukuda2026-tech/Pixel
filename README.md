# Caraguá Pixel 3D (`caraguapixel.online`)

Cidade 3D interativa em estilo voxel ambientada em Caraguatatuba, com multiplayer em tempo real, chat por sala, economia VIP/PIX, página de empresas VIP, painel administrativo e evento Polícia & Ladrão.

## Estrutura do Projeto

- `index.html` — Entrada principal do mundo 3D (`Three.js`, HUD mobile/desktop, chat e loja).
- `sobre.html`, `lore.html`, `mapa.html`, `mapa-original.html`, `moradores.html`, `sugestoes.html`, `empresas.html`, `apoie.html`, `privacidade.html`, `admin.html`, `404.html` — Páginas do portal e painel administrativo (`admin.html` e `mapa-original.html` com `X-Robots-Tag: noindex, nofollow`).
- `js/` — Lógica do mapa 3D (`jogo.js`, `jogo-dados.js`, `jogo-lugares.js`), multiplayer/chat (`online.js`), loja VIP e HUD mobile (`loja.js`), interações (`interacoes.js`), evento Polícia & Ladrão (`evento-policia.js`), páginas auxiliares e versões minificadas (`*.min.js`).
- `css/` — Estilos globais e modulares (`style.css`, `jogo.css`, `chat.css`, `loja.css`, `evento.css`, `empresas.css` + `*.min.css`).
- `api/` — Backend PHP + SQLite (`chat.php` para presença, chat, bola e evento Polícia & Ladrão; `economia.php` para pedidos, PIX/Mercado Pago e passes VIP; `api/.htaccess` bloqueando acesso direto a bancos `.sqlite*`).
- `img/` — Imagens dos bairros, mapa, banner e brasão.
- `.htaccess`, `robots.txt`, `sitemap.xml`, `llms.txt`, `favicon.ico` — Redirecionamentos canônicos (`https://caraguapixel.online/`), cabeçalhos de segurança/cache e SEO técnico.
- `minify-assets.mjs` — Script AST-safe em Node/`esbuild` para gerar os `.min.css` e `.min.js`.

## Build dos Ativos Minificados

```bash
node minify-assets.mjs
```

> Nota: arquivos `.zip`, `.sqlite*`, `.env` e pastas `data/`/`logs/` ficam fora do controle de versão via `.gitignore`.
