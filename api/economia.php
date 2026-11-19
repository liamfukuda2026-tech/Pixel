<?php
declare(strict_types=1);

@ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * Emite resposta JSON e encerra a execução imediatamente.
 */
function respondJson(int $status, array $payload): never
{
    http_response_code($status);
    $json = json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
    echo ($json !== false) ? $json : '{"ok":false,"erro":"Erro interno na economia","error":"Erro interno na economia"}';
    exit;
}

function respondError(int $status, string $msg, array $extra = []): never
{
    respondJson($status, array_merge([
        'ok' => false,
        'erro' => $msg,
        'error' => $msg,
    ], $extra));
}

function utf8Substr(string $s, int $len): string
{
    if (function_exists('mb_substr')) {
        return mb_substr($s, 0, $len, 'UTF-8');
    }
    return substr($s, 0, $len);
}

function stripControlsAndCollapse(string $s): string
{
    if (function_exists('mb_convert_encoding')) {
        $s = (string)mb_convert_encoding($s, 'UTF-8', 'UTF-8');
    }
    $s = strip_tags($s);
    $s = str_replace(["\r", "\n", "\t"], ' ', $s);
    $s = preg_replace('/[\x00-\x1F\x7F]/', '', $s) ?? $s;
    $s = preg_replace('/\s+/u', ' ', $s) ?? (preg_replace('/\s+/', ' ', $s) ?? $s);
    return trim($s);
}

function filterProfanity(string $texto): string
{
    $b0 = '(?<![\p{L}\p{N}_])';
    $b1 = '(?![\p{L}\p{N}_])';
    $patterns = [
        '/' . $b0 . 'filh[ao]s?\s+da\s+puta' . $b1 . '/iu',
        '/' . $b0 . 'vai\s+(?:se\s+f[ou]der|tomar\s+no\s+cu)' . $b1 . '/iu',
        '/' . $b0 . '(?:pau|tomar)\s+no\s+cu' . $b1 . '/iu',
        '/' . $b0 . 'foda-?se' . $b1 . '/iu',
        '/' . $b0 . '(?:caralh[oa]s?|krl|porras?|foda|f[ou]der|f[ou]did[oa]s?|put[oa]s?|putaria|putinh[ao]s?|arrombad[oa]s?|bucetas?|xoxotas?|xerecas?|cuz[ãa]o|cuz[õo]es|cuzinh[oa]s?|pirocas?|punhetas?|siriricas?|boquetes?|fdp|pqp|vsf|vtnc|tnc|desgra[çc]ad[oa]s?|vagabund[oa]s?|viad[oa]s?)' . $b1 . '/iu',
    ];
    $filtered = preg_replace($patterns, '***', $texto);
    return ($filtered !== null) ? $filtered : $texto;
}

function cleanNome(mixed $raw, string $fallback = 'Visitante'): string
{
    $s = is_scalar($raw) ? (string)$raw : '';
    $s = trim(utf8Substr(stripControlsAndCollapse($s), 32));
    if ($s === '') {
        return $fallback;
    }
    return filterProfanity($s);
}

function cleanArroba(mixed $raw): string
{
    $s = is_scalar($raw) ? (string)$raw : '';
    $s = ltrim(trim($s), '@');
    $s = preg_replace('/[^a-zA-Z0-9._]/', '', $s) ?? '';
    return substr($s, 0, 30);
}

function cleanPid(mixed $raw): string
{
    if (!is_scalar($raw)) {
        return '';
    }
    $s = trim((string)$raw);
    if (preg_match('/^[a-zA-Z0-9_-]{4,48}\z/', $s) !== 1) {
        return '';
    }
    return $s;
}

function cleanIdSlug(mixed $raw, int $maxLen = 48): string
{
    if (!is_scalar($raw)) {
        return '';
    }
    $s = trim((string)$raw);
    $s = preg_replace('/[^a-zA-Z0-9_-]/', '', $s) ?? '';
    return substr($s, 0, $maxLen);
}

function cleanHexColor(mixed $raw, string $default = '#f59e0b'): string
{
    if (is_string($raw)) {
        $t = trim($raw);
        if (preg_match('/^#([0-9a-fA-F]{6})\z/', $t, $m) === 1) {
            return '#' . strtolower($m[1]);
        }
        if (preg_match('/^([0-9a-fA-F]{6})\z/', $t, $m) === 1) {
            return '#' . strtolower($m[1]);
        }
    } elseif (is_int($raw) || (is_float($raw) && is_finite($raw))) {
        $c = max(0, min(0xffffff, (int)$raw));
        return sprintf('#%06x', $c);
    }
    return $default;
}

function clampFloat(mixed $val, float $min, float $max, float $default): float
{
    if (!is_numeric($val)) {
        return $default;
    }
    $f = (float)$val;
    if (!is_finite($f)) {
        return $default;
    }
    if ($f < $min) {
        return $min;
    }
    if ($f > $max) {
        return $max;
    }
    return $f;
}

function clampInt(mixed $val, int $min, int $max, int $default): int
{
    if (!is_numeric($val)) {
        return $default;
    }
    $i = (int)$val;
    if ($i < $min) {
        return $min;
    }
    if ($i > $max) {
        return $max;
    }
    return $i;
}

/**
 * Preços iniciais padrão da cidade.
 *
 * @return array<string, float>
 */
function defaultPrices(): array
{
    return [
        'moto' => 0.99,
        'bugue' => 1.99,
        'esportivo' => 2.99,
        'caminhonete' => 3.99,
        'casa_simples' => 2.99,
        'casa_solar' => 3.99,
        'sobrado' => 4.99,
        'mansao' => 6.99,
        'profissao_medica' => 2.99,
        'profissao_barbeiro' => 2.99,
        'profissao_corretor' => 2.99,
        'profissao_empresario' => 4.99,
        'combo_vip' => 22.00,
        'loja_bronze' => 19.90,
        'loja_empresa_vip' => 29.90,
        'loja_ouro' => 50.00,
        'policia_vida_extra' => 1.50,
        'policia_moedas_500' => 2.00,
        'policia_arma_vip' => 3.00,
        'policia_moedas_1500' => 5.00,
    ];
}

/**
 * Definições do catálogo de itens VIP.
 *
 * @return array<string, array{kind: string, name: string, desc: string, badge: string, role?: string}>
 */
function catalogDefinitions(): array
{
    return [
        'casa_simples' => [
            'kind' => 'casa',
            'name' => 'Casa Caiçara Simples',
            'desc' => 'Casa térrea aconchegante com varanda, placa própria e sala interna.',
            'badge' => 'vip',
        ],
        'casa_solar' => [
            'kind' => 'casa',
            'name' => 'Casa Solar da Praia',
            'desc' => 'Residência ampla iluminada com jardim praiano e porta privativa.',
            'badge' => 'vip',
        ],
        'sobrado' => [
            'kind' => 'casa',
            'name' => 'Sobrado Colonial',
            'desc' => 'Sobrado de dois andares com sacada, destaque na rua e interior VIP.',
            'badge' => 'vip',
        ],
        'mansao' => [
            'kind' => 'casa',
            'name' => 'Mansão Orla VIP',
            'desc' => 'Mansão imponente de alto padrão na cidade com interior espaçoso.',
            'badge' => 'vip',
        ],
        'moto' => [
            'kind' => 'carro',
            'name' => 'Moto Praiana',
            'desc' => 'Ágil para cortar as ruas de Caraguá Pixel com buzina e carona.',
            'badge' => 'vip',
        ],
        'bugue' => [
            'kind' => 'carro',
            'name' => 'Bugue das Dunas',
            'desc' => 'Clássico aberto da orla para passear pela praia com amigos.',
            'badge' => 'vip',
        ],
        'esportivo' => [
            'kind' => 'carro',
            'name' => 'Esportivo Turbo',
            'desc' => 'Design rebaixado veloz para desfilar pela avenida da praia.',
            'badge' => 'vip',
        ],
        'caminhonete' => [
            'kind' => 'carro',
            'name' => 'Caminhonete 4x4',
            'desc' => 'Robusta e imponente para explorar toda a cidade com carona.',
            'badge' => 'vip',
        ],
        'profissao_medica' => [
            'kind' => 'profissao',
            'name' => 'Profissão: Médica(o)',
            'desc' => 'Tag oficial na placa do personagem + atuação no Consultório.',
            'badge' => 'vip',
            'role' => 'Médica(o)',
        ],
        'profissao_barbeiro' => [
            'kind' => 'profissao',
            'name' => 'Profissão: Barbeiro(a)',
            'desc' => 'Tag oficial na placa do personagem + atuação na Barbearia.',
            'badge' => 'vip',
            'role' => 'Barbeiro(a)',
        ],
        'profissao_corretor' => [
            'kind' => 'profissao',
            'name' => 'Profissão: Corretor(a)',
            'desc' => 'Tag oficial de Corretor Imobiliário na placa do jogador.',
            'badge' => 'vip',
            'role' => 'Corretor(a)',
        ],
        'profissao_empresario' => [
            'kind' => 'profissao',
            'name' => 'Profissão: Empresário(a)',
            'desc' => 'Tag oficial de destaque empresarial + selo VIP na cidade.',
            'badge' => 'vip',
            'role' => 'Empresário(a)',
        ],
        'combo_vip' => [
            'kind' => 'vip',
            'name' => 'Combo Cidade VIP Completo',
            'desc' => 'Casa à escolha + Esportivo Turbo + Profissão + Selo VIP.',
            'badge' => 'vip',
            'role' => 'VIP',
        ],
        'loja_bronze' => [
            'kind' => 'loja',
            'name' => '🏪 Loja Real Essencial (1 Mês)',
            'desc' => 'Sua loja na Galeria Pixel com logo, link de WhatsApp/Instagram + Tag Empresário e Moto VIP no jogo. Criada em até 2 dias úteis!',
            'badge' => 'vip',
            'role' => '💼 Lojista VIP',
        ],
        'loja_empresa_vip' => [
            'kind' => 'loja',
            'name' => '🏢 Loja Real Destaque + Stories (1 Mês)',
            'desc' => 'Sua loja no Centro/Boulevard com logo, link de WhatsApp/Instagram, divulgação nos Stories + Tag Lojista VIP e Bugue no jogo. Criada em até 2 dias úteis!',
            'badge' => 'vip',
            'role' => '🏢 Lojista VIP',
        ],
        'loja_ouro' => [
            'kind' => 'loja',
            'name' => '👑 Loja Patrocinador Master (1 Mês)',
            'desc' => 'Fachada destaque principal no Centro + Stories duplos + Combo Cidade VIP completo no jogo (Esportivo Turbo + Profissões) + prioridade máxima em até 2 dias úteis!',
            'badge' => 'vip',
            'role' => '👑 Patrocinador VIP',
        ],
        'policia_vida_extra' => [
            'kind' => 'evento',
            'name' => '🚑 Fiança Imediata + 3 Vidas Extras',
            'desc' => 'Solta da Cadeia 79 na hora no evento Polícia e Ladrão, restaura 100% da vida e adiciona +3 vidas extras (+100 moedas bônus).',
            'badge' => 'vip',
        ],
        'policia_moedas_500' => [
            'kind' => 'evento',
            'name' => '🪙 Pacote 500 Moedas da Cidade',
            'desc' => 'Credita 500 Moedas na hora para pagar fiança (150), comprar vida extra (200) ou pistolinhas na lojinha do evento.',
            'badge' => 'vip',
        ],
        'policia_arma_vip' => [
            'kind' => 'evento',
            'name' => '🔫 Arminha Jato Duplo + Super Esguicho',
            'desc' => 'Desbloqueia e equipa as arminhas de água turbinadas com maior alcance e cadência no evento Polícia e Ladrão (+150 moedas).',
            'badge' => 'vip',
        ],
        'policia_moedas_1500' => [
            'kind' => 'evento',
            'name' => '💰 Baú 1.500 Moedas + Passe Rodada',
            'desc' => 'Entrega 1.500 Moedas, +3 Vidas extras no evento e libera a Pistolinha Jato Duplo na hora para dominar a operação.',
            'badge' => 'vip',
        ],
    ];
}

/**
 * Monta lista pública do catálogo combinada com os preços do banco.
 *
 * @param array<string, float> $prices
 * @return list<array<string, mixed>>
 */
function buildCatalogList(array $prices): array
{
    $defs = catalogDefinitions();
    $list = [];
    foreach ($defs as $itemId => $def) {
        $price = isset($prices[$itemId]) ? round((float)$prices[$itemId], 2) : 19.90;
        $entry = [
            'id' => $itemId,
            'item_id' => $itemId,
            'kind' => $def['kind'],
            'name' => $def['name'],
            'nome' => $def['name'],
            'desc' => $def['desc'],
            'descricao' => $def['desc'],
            'price' => $price,
            'preco' => $price,
            'badge' => $def['badge'],
        ];
        if (isset($def['role'])) {
            $entry['role'] = $def['role'];
        }
        $list[] = $entry;
    }
    return $list;
}

function generateCreatorSecret(): string
{
    return 'CRG-' . strtoupper(bin2hex(random_bytes(5)));
}

function generatePassCode(PDO $pdo): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $maxIdx = strlen($alphabet) - 1;
    $stmtCheck = $pdo->prepare('SELECT 1 FROM passes WHERE code = :code LIMIT 1');

    for ($attempt = 0; $attempt < 30; $attempt++) {
        $p1 = '';
        $p2 = '';
        for ($i = 0; $i < 4; $i++) {
            $p1 .= $alphabet[random_int(0, $maxIdx)];
            $p2 .= $alphabet[random_int(0, $maxIdx)];
        }
        $code = 'CPX-' . $p1 . '-' . $p2;
        $stmtCheck->execute([':code' => $code]);
        if ($stmtCheck->fetch() === false) {
            return $code;
        }
    }

    return 'CPX-' . strtoupper(bin2hex(random_bytes(2))) . '-' . strtoupper(bin2hex(random_bytes(2)));
}

function generateOrderId(PDO $pdo): string
{
    $stmtCheck = $pdo->prepare('SELECT 1 FROM orders WHERE id = :id LIMIT 1');
    $datePart = gmdate('Ymd');
    for ($attempt = 0; $attempt < 20; $attempt++) {
        $id = 'PED-' . $datePart . '-' . strtoupper(bin2hex(random_bytes(3)));
        $stmtCheck->execute([':id' => $id]);
        if ($stmtCheck->fetch() === false) {
            return $id;
        }
    }
    return 'PED-' . strtoupper(bin2hex(random_bytes(5)));
}

function openDatabase(): PDO
{
    $primaryDir = rtrim(dirname(__DIR__, 2), "/\\") . '/chat_data';
    if (!@is_dir($primaryDir)) {
        @mkdir($primaryDir, 0750, true);
    }

    if (@is_dir($primaryDir) && @is_writable($primaryDir)) {
        $dataDir = $primaryDir;
    } else {
        $dataDir = rtrim(sys_get_temp_dir(), "/\\") . '/caraguapixel_chat';
        if (!@is_dir($dataDir)) {
            @mkdir($dataDir, 0750, true);
        }
    }

    $dbFile = $dataDir . '/online_v1.sqlite';
    $pdo = new PDO(
        'sqlite:' . $dbFile,
        null,
        null,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    $pdo->exec('PRAGMA busy_timeout = 3000;');
    $pdo->exec('PRAGMA journal_mode = WAL;');
    $pdo->exec('PRAGMA synchronous = NORMAL;');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS settings (
            k TEXT PRIMARY KEY,
            v TEXT NOT NULL
        )'
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS owned_lots (
            lot_id TEXT PRIMARY KEY,
            owner_name TEXT NOT NULL,
            owner_handle TEXT DEFAULT '',
            style TEXT NOT NULL,
            color TEXT DEFAULT '#f59e0b',
            title TEXT DEFAULT '',
            door_room TEXT DEFAULT '',
            x REAL NOT NULL,
            z REAL NOT NULL,
            rot REAL DEFAULT 0,
            order_id TEXT DEFAULT '',
            created_at INTEGER NOT NULL
        )"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS passes (
            code TEXT PRIMARY KEY,
            kind TEXT NOT NULL,
            item_id TEXT NOT NULL,
            owner_pid TEXT DEFAULT '',
            owner_name TEXT DEFAULT '',
            metadata_json TEXT DEFAULT '{}',
            redeemed INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            redeemed_at INTEGER DEFAULT 0
        )"
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_passes_owner_pid ON passes(owner_pid)');

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            kind TEXT NOT NULL,
            item_id TEXT NOT NULL,
            amount REAL NOT NULL,
            buyer_name TEXT NOT NULL,
            buyer_handle TEXT DEFAULT '',
            buyer_pid TEXT DEFAULT '',
            payload_json TEXT DEFAULT '{}',
            pix_brcode TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            pass_code TEXT DEFAULT '',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            mp_payment_id TEXT DEFAULT '',
            pix_qr_base64 TEXT DEFAULT '',
            mp_checked_at INTEGER DEFAULT 0
        )"
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at)');

    // Idempotent migration: add new columns to orders if they don't exist yet
    $stmtOrdInfo = $pdo->query('PRAGMA table_info(orders)');
    $ordCols = [];
    if ($stmtOrdInfo !== false) {
        foreach ($stmtOrdInfo->fetchAll() as $col) {
            if (isset($col['name']) && is_string($col['name'])) {
                $ordCols[strtolower($col['name'])] = true;
            }
        }
    }
    if (!isset($ordCols['mp_payment_id'])) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN mp_payment_id TEXT DEFAULT ''");
    }
    if (!isset($ordCols['pix_qr_base64'])) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN pix_qr_base64 TEXT DEFAULT ''");
    }
    if (!isset($ordCols['mp_checked_at'])) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN mp_checked_at INTEGER DEFAULT 0");
    }
    // Index on mp_payment_id MUST come after ALTER TABLE (column must exist first)
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_orders_mp_payment_id ON orders(mp_payment_id)');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS admin_sessions (
            token TEXT PRIMARY KEY,
            expires_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        )'
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at)');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS rate_limits (
            k TEXT PRIMARY KEY,
            last_ts REAL NOT NULL
        )'
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS player_accounts (
            handle TEXT PRIMARY KEY,
            nome TEXT NOT NULL DEFAULT 'Morador',
            pin_hash TEXT NOT NULL,
            master_pid TEXT NOT NULL,
            camisa INTEGER DEFAULT 1867478,
            moedas_json TEXT DEFAULT '[]',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )"
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_player_accounts_pid ON player_accounts(master_pid)');

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS policia_wallets (
            wallet_key TEXT PRIMARY KEY,
            coins INTEGER NOT NULL DEFAULT 300,
            weapons_json TEXT NOT NULL DEFAULT '[\"base\"]',
            equipped_weapon TEXT NOT NULL DEFAULT 'base',
            bonus_lives INTEGER NOT NULL DEFAULT 0,
            updated_at INTEGER NOT NULL
        )"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS policia_order_grants (
            order_id TEXT PRIMARY KEY,
            wallet_key TEXT NOT NULL,
            granted_at INTEGER NOT NULL
        )"
    );

    $defaultPricesJson = json_encode(defaultPrices(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $seeds = [
        'pix_key' => '',
        'pix_key_type' => 'aleatoria',
        'pix_name' => 'ELTON CARAGUA PIXEL',
        'pix_city' => 'CARAGUATATUBA',
        'creator_secret' => generateCreatorSecret(),
        'prices_json' => ($defaultPricesJson !== false) ? $defaultPricesJson : '{}',
        'mp_access_token' => '',
        'whatsapp_vip_url' => 'https://chat.whatsapp.com/G56tZ8K80c9',
    ];

    $stmtSeed = $pdo->prepare('INSERT OR IGNORE INTO settings (k, v) VALUES (:k, :v)');
    foreach ($seeds as $k => $v) {
        $stmtSeed->execute([':k' => $k, ':v' => $v]);
    }

    // Migration: prices_v2_popular — force-update prices_json if not yet flagged
    $stmtPriceFlag = $pdo->prepare("SELECT v FROM settings WHERE k = 'prices_v2_popular' LIMIT 1");
    $stmtPriceFlag->execute();
    $priceFlag = $stmtPriceFlag->fetch();
    if ($priceFlag === false) {
        $newPricesJson = json_encode(defaultPrices(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($newPricesJson !== false) {
            $stmtUpsertPrices = $pdo->prepare(
                "INSERT INTO settings (k, v) VALUES (:k, :v)
                 ON CONFLICT(k) DO UPDATE SET v = excluded.v"
            );
            $stmtUpsertPrices->execute([':k' => 'prices_json', ':v' => $newPricesJson]);
            $stmtUpsertPrices->execute([':k' => 'prices_v2_popular', ':v' => '1']);
        }
    }

    // Migration: prices_v3_empresas — ensure loja_empresa_vip exists in prices_json
    $stmtEmpFlag = $pdo->prepare("SELECT v FROM settings WHERE k = 'prices_v3_empresas' LIMIT 1");
    $stmtEmpFlag->execute();
    if ($stmtEmpFlag->fetch() === false) {
        $sMap = loadSettingsMap($pdo);
        $curPrices = resolvePrices($sMap);
        if (!isset($curPrices['loja_empresa_vip'])) {
            $curPrices['loja_empresa_vip'] = 29.90;
        }
        $pJson = json_encode($curPrices, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($pJson !== false) {
            $stmtUpsertPrices = $pdo->prepare(
                "INSERT INTO settings (k, v) VALUES (:k, :v)
                 ON CONFLICT(k) DO UPDATE SET v = excluded.v"
            );
            $stmtUpsertPrices->execute([':k' => 'prices_json', ':v' => $pJson]);
            $stmtUpsertPrices->execute([':k' => 'prices_v3_empresas', ':v' => '1']);
        }
    }

    // Migration: prices_v4_loja_2990 — set 3 business tiers (19.90 / 29.90 / 50.00)
    $stmtV4Flag = $pdo->prepare("SELECT v FROM settings WHERE k = 'prices_v4_loja_2990' LIMIT 1");
    $stmtV4Flag->execute();
    if ($stmtV4Flag->fetch() === false) {
        $sMap4 = loadSettingsMap($pdo);
        $curPrices4 = resolvePrices($sMap4);
        $curPrices4['loja_bronze'] = 19.90;
        $curPrices4['loja_empresa_vip'] = 29.90;
        $curPrices4['loja_ouro'] = 50.00;
        $pJson4 = json_encode($curPrices4, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($pJson4 !== false) {
            $stmtUpsertPrices4 = $pdo->prepare(
                "INSERT INTO settings (k, v) VALUES (:k, :v)
                 ON CONFLICT(k) DO UPDATE SET v = excluded.v"
            );
            $stmtUpsertPrices4->execute([':k' => 'prices_json', ':v' => $pJson4]);
            $stmtUpsertPrices4->execute([':k' => 'prices_v4_loja_2990', ':v' => '1']);
        }
    }

    // Migration: prices_v5_combo_22 — update combo_vip to R$ 22.00
    $stmtV5Flag = $pdo->prepare("SELECT v FROM settings WHERE k = 'prices_v5_combo_22' LIMIT 1");
    $stmtV5Flag->execute();
    if ($stmtV5Flag->fetch() === false) {
        $sMap5 = loadSettingsMap($pdo);
        $curPrices5 = resolvePrices($sMap5);
        $curPrices5['combo_vip'] = 22.00;
        $pJson5 = json_encode($curPrices5, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($pJson5 !== false) {
            $stmtUpsertPrices5 = $pdo->prepare(
                "INSERT INTO settings (k, v) VALUES (:k, :v)
                 ON CONFLICT(k) DO UPDATE SET v = excluded.v"
            );
            $stmtUpsertPrices5->execute([':k' => 'prices_json', ':v' => $pJson5]);
            $stmtUpsertPrices5->execute([':k' => 'prices_v5_combo_22', ':v' => '1']);
        }
    }

    return $pdo;
}

/**
 * Lê todas as settings em mapa chave => valor.
 *
 * @return array<string, string>
 */
function loadSettingsMap(PDO $pdo): array
{
    $stmt = $pdo->query('SELECT k, v FROM settings');
    $map = [];
    if ($stmt !== false) {
        foreach ($stmt->fetchAll() as $row) {
            if (isset($row['k'], $row['v'])) {
                $map[(string)$row['k']] = (string)$row['v'];
            }
        }
    }
    return $map;
}

function saveSetting(PDO $pdo, string $key, string $val): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO settings (k, v) VALUES (:k, :v)
         ON CONFLICT(k) DO UPDATE SET v = excluded.v'
    );
    $stmt->execute([':k' => $key, ':v' => $val]);
}

/**
 * Faz requisição HTTP para a API do Mercado Pago via cURL.
 *
 * @param array<string, mixed>|null $payload
 * @param array<string, string> $headers
 * @return array{status: int, body: array<string, mixed>}
 */
function mpApiRequest(string $method, string $url, string $token, ?array $payload = null, array $headers = []): array
{
    $ch = curl_init();
    if ($ch === false) {
        return ['status' => 0, 'body' => ['error' => 'curl_init failed']];
    }

    $defaultHeaders = [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'User-Agent: CaraguaPixel/1.0',
    ];
    foreach ($headers as $hk => $hv) {
        $defaultHeaders[] = $hk . ': ' . $hv;
    }

    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HTTPHEADER => $defaultHeaders,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    $upperMethod = strtoupper(trim($method));
    if ($upperMethod === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($payload !== null) {
            $jsonBody = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            curl_setopt($ch, CURLOPT_POSTFIELDS, ($jsonBody !== false) ? $jsonBody : '{}');
        }
    } elseif ($upperMethod !== 'GET') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $upperMethod);
        if ($payload !== null) {
            $jsonBody = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            curl_setopt($ch, CURLOPT_POSTFIELDS, ($jsonBody !== false) ? $jsonBody : '{}');
        }
    }

    $rawResponse = curl_exec($ch);
    $httpStatus = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($rawResponse === false || !is_string($rawResponse)) {
        return ['status' => $httpStatus, 'body' => ['error' => 'curl_exec failed']];
    }

    $decoded = json_decode($rawResponse, true);
    return [
        'status' => $httpStatus,
        'body' => is_array($decoded) ? $decoded : ['raw' => substr($rawResponse, 0, 500)],
    ];
}

/**
 * Carrega mp_access_token das settings; retorna '' se não configurado.
 *
 * @param array<string, string> $settingsMap
 */
function getMpToken(array $settingsMap): string
{
    $t = trim($settingsMap['mp_access_token'] ?? '');
    // Only accept tokens that start with APP_USR- (production) or TEST- (sandbox)
    if (
        $t === ''
        || (!str_starts_with($t, 'APP_USR-') && !str_starts_with($t, 'TEST-'))
    ) {
        return '';
    }
    return $t;
}

function resolvePoliciaWalletKey(string $pid, string $arroba): string
{
    $h = cleanArroba($arroba);
    if ($h !== '') {
        return '@' . strtolower($h);
    }
    $cleanP = cleanPid($pid);
    return ($cleanP !== '') ? ('pid:' . $cleanP) : 'pid:visitante';
}

/**
 * Carrega ou cria a carteira de moedas/armas do evento Polícia e Ladrão.
 *
 * @return array{wallet_key: string, coins: int, weapons: list<string>, equipped_weapon: string, bonus_lives: int}
 */
function ensurePoliciaWallet(PDO $pdo, string $walletKey): array
{
    $nowTs = (int)time();
    $pdo->prepare(
        "INSERT OR IGNORE INTO policia_wallets (wallet_key, coins, weapons_json, equipped_weapon, bonus_lives, updated_at)
         VALUES (:wk, 300, '[\"base\"]', 'base', 0, :uat)"
    )->execute([':wk' => $walletKey, ':uat' => $nowTs]);

    $stmt = $pdo->prepare('SELECT wallet_key, coins, weapons_json, equipped_weapon, bonus_lives FROM policia_wallets WHERE wallet_key = :wk LIMIT 1');
    $stmt->execute([':wk' => $walletKey]);
    $row = $stmt->fetch();

    $weapons = ['base'];
    if ($row !== false && isset($row['weapons_json'])) {
        $dec = json_decode((string)$row['weapons_json'], true);
        if (is_array($dec)) {
            foreach ($dec as $w) {
                if (is_string($w) && in_array($w, ['base', 'dupla', 'super'], true) && !in_array($w, $weapons, true)) {
                    $weapons[] = $w;
                }
            }
        }
    }
    $equipped = ($row !== false && is_string($row['equipped_weapon'] ?? null) && in_array($row['equipped_weapon'], $weapons, true))
        ? $row['equipped_weapon']
        : 'base';

    return [
        'wallet_key' => $walletKey,
        'coins' => ($row !== false) ? max(0, (int)($row['coins'] ?? 300)) : 300,
        'weapons' => $weapons,
        'equipped_weapon' => $equipped,
        'bonus_lives' => ($row !== false) ? max(0, (int)($row['bonus_lives'] ?? 0)) : 0,
    ];
}

/**
 * Credita pacotes PIX do evento Polícia e Ladrão (vidas, fiança, moedas, armas) de forma idempotente.
 *
 * @return array<string, mixed>|null
 */
function grantEventoOrderRewards(PDO $pdo, string $orderId, string $itemId, string $buyerPid, string $buyerHandle, int $nowTs): ?array
{
    $packs = [
        'policia_vida_extra' => ['coins' => 100, 'lives' => 3, 'bail' => true, 'weapons' => [], 'equip' => ''],
        'policia_moedas_500' => ['coins' => 500, 'lives' => 0, 'bail' => false, 'weapons' => [], 'equip' => ''],
        'policia_arma_vip' => ['coins' => 150, 'lives' => 0, 'bail' => false, 'weapons' => ['dupla', 'super'], 'equip' => 'super'],
        'policia_moedas_1500' => ['coins' => 1500, 'lives' => 3, 'bail' => true, 'weapons' => ['dupla'], 'equip' => 'dupla'],
    ];
    if (!isset($packs[$itemId])) {
        return null;
    }
    $pack = $packs[$itemId];

    // Descobre arroba do jogador online caso o pedido tenha vindo apenas com buyer_pid
    $resolvedHandle = cleanArroba($buyerHandle);
    if ($resolvedHandle === '' && $buyerPid !== '') {
        $stH = $pdo->prepare('SELECT arroba FROM players WHERE pid = :pid LIMIT 1');
        $stH->execute([':pid' => $buyerPid]);
        $rH = $stH->fetch();
        if ($rH !== false && !empty($rH['arroba'])) {
            $resolvedHandle = cleanArroba((string)$rH['arroba']);
        }
    }
    $walletKey = resolvePoliciaWalletKey($buyerPid, $resolvedHandle);

    $stmtGrant = $pdo->prepare(
        'INSERT OR IGNORE INTO policia_order_grants (order_id, wallet_key, granted_at) VALUES (:oid, :wk, :gat)'
    );
    $stmtGrant->execute([':oid' => $orderId, ':wk' => $walletKey, ':gat' => $nowTs]);
    if ($stmtGrant->rowCount() <= 0) {
        return ensurePoliciaWallet($pdo, $walletKey);
    }

    $wallet = ensurePoliciaWallet($pdo, $walletKey);
    $newCoins = $wallet['coins'] + (int)$pack['coins'];
    $weapons = $wallet['weapons'];
    foreach ($pack['weapons'] as $wAdd) {
        if (!in_array($wAdd, $weapons, true)) {
            $weapons[] = $wAdd;
        }
    }
    $equipped = ($pack['equip'] !== '' && in_array($pack['equip'], $weapons, true))
        ? $pack['equip']
        : $wallet['equipped_weapon'];
    $newBonusLives = $wallet['bonus_lives'] + (int)$pack['lives'];

    // Se há rodada ativa de Polícia e Ladrão, aplica vidas/fiança/arma diretamente no jogador ativo
    $appliedLivesToRound = 0;
    $stmtEv = $pdo->prepare("SELECT val FROM game_state WHERE key = 'policia_event' LIMIT 1");
    $stmtEv->execute();
    $evRow = $stmtEv->fetch();
    if ($evRow !== false && isset($evRow['val']) && is_string($evRow['val'])) {
        $ev = json_decode($evRow['val'], true);
        if (is_array($ev) && (($ev['status'] ?? '') === 'active')) {
            $pvp = (isset($ev['pvp']) && is_array($ev['pvp'])) ? $ev['pvp'] : [];
            $targetPids = [];
            if ($buyerPid !== '' && isset($pvp[$buyerPid])) {
                $targetPids[] = $buyerPid;
            }
            if ($resolvedHandle !== '') {
                foreach ($pvp as $kPid => $kEntry) {
                    if (is_array($kEntry) && strcasecmp((string)($kEntry['arroba'] ?? ''), $resolvedHandle) === 0 && !in_array((string)$kPid, $targetPids, true)) {
                        $targetPids[] = (string)$kPid;
                    }
                }
            }
            if (!empty($targetPids)) {
                $tPid = $targetPids[0];
                if ((int)$pack['lives'] > 0) {
                    $pvp[$tPid]['lives'] = max(0, (int)($pvp[$tPid]['lives'] ?? 0)) + (int)$pack['lives'];
                    $appliedLivesToRound = (int)$pack['lives'];
                    $newBonusLives = max(0, $newBonusLives - $appliedLivesToRound);
                }
                if (!empty($pack['bail']) || $appliedLivesToRound > 0) {
                    $pvp[$tPid]['jailed_until'] = 0;
                    $pvp[$tPid]['hp'] = 100;
                    $pvp[$tPid]['invuln_until'] = microtime(true) + 4.0;
                }
                if ($pack['equip'] !== '') {
                    $pvp[$tPid]['weapon'] = $equipped;
                }
                $ev['pvp'] = $pvp;
                $evJson = json_encode($ev, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                if ($evJson !== false) {
                    $pdo->prepare(
                        "INSERT INTO game_state (key, val, updated_at) VALUES ('policia_event', :val, :uat)
                         ON CONFLICT(key) DO UPDATE SET val = excluded.val, updated_at = excluded.updated_at"
                    )->execute([':val' => $evJson, ':uat' => $nowTs]);
                }
            }
        }
    }

    $wJson = json_encode(array_values($weapons), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $pdo->prepare(
        'UPDATE policia_wallets
         SET coins = :c, weapons_json = :wj, equipped_weapon = :eq, bonus_lives = :bl, updated_at = :uat
         WHERE wallet_key = :wk'
    )->execute([
        ':c' => $newCoins,
        ':wj' => ($wJson !== false) ? $wJson : '["base"]',
        ':eq' => $equipped,
        ':bl' => $newBonusLives,
        ':uat' => $nowTs,
        ':wk' => $walletKey,
    ]);

    return ensurePoliciaWallet($pdo, $walletKey);
}

/**
 * Approves an order idempotently: generates pass, optionally registers owned_lot.
 * Returns ['pass_code' => string, 'owned_lot' => array|null] or throws on conflict.
 *
 * @param array<string, mixed> $order  Full order DB row
 * @return array{pass_code: string, owned_lot: array<string, mixed>|null}
 */
function approveOrderIdempotent(PDO $pdo, array $order): array
{
    $orderId = (string)$order['id'];
    $existingPassCode = trim((string)($order['pass_code'] ?? ''));

    if ((string)$order['status'] === 'approved' && $existingPassCode !== '') {
        $decodedP = json_decode((string)($order['payload_json'] ?? '{}'), true);
        $payloadEx = is_array($decodedP) ? $decodedP : [];
        $lotIdEx = cleanIdSlug($payloadEx['lot_id'] ?? ($payloadEx['lotId'] ?? ''), 48);
        $existingLot = ($lotIdEx !== '') ? fetchOwnedLotById($pdo, $lotIdEx) : null;
        return ['pass_code' => $existingPassCode, 'owned_lot' => $existingLot];
    }

    $kind = (string)$order['kind'];
    $itemId = (string)$order['item_id'];
    $buyerName = (string)$order['buyer_name'];
    $buyerHandle = (string)($order['buyer_handle'] ?? '');
    $buyerPid = (string)($order['buyer_pid'] ?? '');
    $nowTs = (int)time();

    $decodedPayload = json_decode((string)($order['payload_json'] ?? '{}'), true);
    $payload = is_array($decodedPayload) ? $decodedPayload : [];
    $lotId = cleanIdSlug($payload['lot_id'] ?? ($payload['lotId'] ?? ''), 48);

    $ownedLot = null;
    if ($kind === 'casa' || $lotId !== '') {
        if ($lotId !== '') {
            $existingLot = fetchOwnedLotById($pdo, $lotId);
            if ($existingLot !== null && $existingLot['order_id'] !== '' && $existingLot['order_id'] !== $orderId) {
                // Lot taken by another order — still approve without lot
            } else {
                $ownedLot = ensureOwnedLotFromMetadata(
                    $pdo,
                    $payload,
                    $buyerName,
                    $buyerHandle,
                    $itemId,
                    $orderId
                );
            }
        }
    }

    $passCode = $existingPassCode !== '' ? $existingPassCode : generatePassCode($pdo);
    $meta = enrichPassMetadata($kind, $itemId, $payload, $buyerName, $buyerHandle);
    $meta['order_id'] = $orderId;
    if ($ownedLot !== null) {
        $meta['lot_id'] = $ownedLot['lot_id'];
        $meta['door_room'] = $ownedLot['door_room'];
    }
    $metaJson = json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($existingPassCode === '') {
        $stmtInsPass = $pdo->prepare(
            'INSERT OR IGNORE INTO passes (
                code, kind, item_id, owner_pid, owner_name,
                metadata_json, redeemed, created_at, redeemed_at
            ) VALUES (
                :code, :kind, :item_id, :owner_pid, :owner_name,
                :metadata_json, 0, :created_at, 0
            )'
        );
        $stmtInsPass->execute([
            ':code' => $passCode,
            ':kind' => $kind,
            ':item_id' => $itemId,
            ':owner_pid' => $buyerPid,
            ':owner_name' => $buyerName,
            ':metadata_json' => ($metaJson !== false) ? $metaJson : '{}',
            ':created_at' => $nowTs,
        ]);
    }

    $stmtUpdOrder = $pdo->prepare(
        "UPDATE orders
         SET status = 'approved', pass_code = :pass_code, updated_at = :updated_at
         WHERE id = :id"
    );
    $stmtUpdOrder->execute([
        ':pass_code' => $passCode,
        ':updated_at' => $nowTs,
        ':id' => $orderId,
    ]);

    $walletGranted = null;
    if ($kind === 'evento' || str_starts_with($itemId, 'policia_')) {
        $walletGranted = grantEventoOrderRewards($pdo, $orderId, $itemId, $buyerPid, $buyerHandle, $nowTs);
    }

    return ['pass_code' => $passCode, 'owned_lot' => $ownedLot, 'wallet' => $walletGranted];
}

/**
 * Verifica automaticamente pedidos pendentes do Mercado Pago em background
 * (aprova os pagos e expira QR Codes abandonados após 45 minutos).
 *
 * @param array<string, string> $settingsMap
 */
function sweepPendingMpOrders(PDO $pdo, array $settingsMap, int $limit = 4, string $priorityPid = ''): void
{
    $mpToken = getMpToken($settingsMap);
    if ($mpToken === '') {
        return;
    }

    $now = (int)time();
    $checkCutoff = $now - 8;
    $expireCutoff = $now - 2700; // 45 minutos sem pagamento

    $lim = max(1, min(10, $limit));
    if ($priorityPid !== '') {
        $stmt = $pdo->prepare(
            "SELECT * FROM orders
             WHERE status = 'pending' AND mp_payment_id != '' AND mp_checked_at <= :cutoff
             ORDER BY CASE WHEN buyer_pid = :pid THEN 0 ELSE 1 END ASC, created_at DESC
             LIMIT " . $lim
        );
        $stmt->execute([':cutoff' => $checkCutoff, ':pid' => $priorityPid]);
    } else {
        $stmt = $pdo->prepare(
            "SELECT * FROM orders
             WHERE status = 'pending' AND mp_payment_id != '' AND mp_checked_at <= :cutoff
             ORDER BY created_at DESC
             LIMIT " . $lim
        );
        $stmt->execute([':cutoff' => $checkCutoff]);
    }

    $rows = ($stmt !== false) ? $stmt->fetchAll() : [];
    foreach ($rows as $row) {
        $ordId = (string)($row['id'] ?? '');
        $mpId = trim((string)($row['mp_payment_id'] ?? ''));
        if ($ordId === '' || $mpId === '') {
            continue;
        }

        $pdo->prepare('UPDATE orders SET mp_checked_at = :ts WHERE id = :id')
            ->execute([':ts' => $now, ':id' => $ordId]);

        $mpResp = mpApiRequest(
            'GET',
            'https://api.mercadopago.com/v1/payments/' . rawurlencode($mpId),
            $mpToken
        );

        $mpStatus = ($mpResp['status'] === 200 && isset($mpResp['body']['status']) && is_string($mpResp['body']['status']))
            ? $mpResp['body']['status']
            : '';

        if ($mpStatus === 'approved') {
            $pdo->exec('BEGIN IMMEDIATE');
            try {
                $stFresh = $pdo->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
                $stFresh->execute([':id' => $ordId]);
                $fresh = $stFresh->fetch();
                if ($fresh !== false && (string)$fresh['status'] === 'pending') {
                    approveOrderIdempotent($pdo, $fresh);
                }
                $pdo->exec('COMMIT');
            } catch (Throwable $e) {
                if ($pdo->inTransaction()) {
                    $pdo->exec('ROLLBACK');
                }
            }
        } elseif (
            in_array($mpStatus, ['cancelled', 'rejected', 'refunded', 'charged_back'], true)
            || ((int)($row['created_at'] ?? $now) < $expireCutoff && $mpStatus !== '' && $mpStatus !== 'in_process')
        ) {
            $pdo->prepare("UPDATE orders SET status = 'rejected', updated_at = :ts WHERE id = :id AND status = 'pending'")
                ->execute([':ts' => $now, ':id' => $ordId]);
        }
    }
}

/**
 * Decodifica e mescla preços salvos com os defaults para garantir que todos os itens tenham preço válido.
 *
 * @param array<string, string> $settingsMap
 * @return array<string, float>
 */
function resolvePrices(array $settingsMap): array
{
    $prices = defaultPrices();
    if (isset($settingsMap['prices_json']) && $settingsMap['prices_json'] !== '') {
        $decoded = json_decode($settingsMap['prices_json'], true);
        if (is_array($decoded)) {
            foreach ($prices as $itemId => $defVal) {
                if (isset($decoded[$itemId]) && is_numeric($decoded[$itemId])) {
                    $v = round((float)$decoded[$itemId], 2);
                    if (is_finite($v) && $v >= 0.50 && $v <= 99999.99) {
                        $prices[$itemId] = $v;
                    }
                }
            }
        }
    }
    return $prices;
}

function toPixAscii(string $s, int $maxLen, string $fallback): string
{
    $translit = [
        'Á' => 'A', 'À' => 'A', 'Â' => 'A', 'Ã' => 'A', 'Ä' => 'A', 'Å' => 'A',
        'á' => 'A', 'à' => 'A', 'â' => 'A', 'ã' => 'A', 'ä' => 'A', 'å' => 'A',
        'É' => 'E', 'È' => 'E', 'Ê' => 'E', 'Ë' => 'E',
        'é' => 'E', 'è' => 'E', 'ê' => 'E', 'ë' => 'E',
        'Í' => 'I', 'Ì' => 'I', 'Î' => 'I', 'Ï' => 'I',
        'í' => 'I', 'ì' => 'I', 'î' => 'I', 'ï' => 'I',
        'Ó' => 'O', 'Ò' => 'O', 'Ô' => 'O', 'Õ' => 'O', 'Ö' => 'O',
        'ó' => 'O', 'ò' => 'O', 'ô' => 'O', 'õ' => 'O', 'ö' => 'O',
        'Ú' => 'U', 'Ù' => 'U', 'Û' => 'U', 'Ü' => 'U',
        'ú' => 'U', 'ù' => 'U', 'û' => 'U', 'ü' => 'U',
        'Ç' => 'C', 'ç' => 'C', 'Ñ' => 'N', 'ñ' => 'N',
    ];
    $clean = strtr($s, $translit);
    $clean = strtoupper($clean);
    $clean = preg_replace('/[^A-Z0-9 ]/', ' ', $clean) ?? '';
    $clean = preg_replace('/\s+/', ' ', $clean) ?? '';
    $clean = trim($clean);
    if ($clean === '') {
        $clean = $fallback;
    }
    return substr($clean, 0, $maxLen);
}

function normalizePixKey(string $rawKey, string $keyType): string
{
    $k = trim($rawKey);
    if ($k === '') {
        return '';
    }
    $k = preg_replace('/[\x00-\x1F\x7F]/', '', $k) ?? '';
    $type = strtolower(trim($keyType));

    if ($type === 'cpf') {
        $digits = preg_replace('/\D/', '', $k) ?? '';
        return ($digits !== '') ? substr($digits, 0, 11) : '';
    }
    if ($type === 'cnpj') {
        $digits = preg_replace('/\D/', '', $k) ?? '';
        return ($digits !== '') ? substr($digits, 0, 14) : '';
    }
    if ($type === 'telefone' || $type === 'celular' || $type === 'phone') {
        if (str_starts_with($k, '+')) {
            $digits = preg_replace('/\D/', '', substr($k, 1)) ?? '';
            return ($digits !== '') ? ('+' . substr($digits, 0, 15)) : '';
        }
        $digits = preg_replace('/\D/', '', $k) ?? '';
        if (strlen($digits) === 10 || strlen($digits) === 11) {
            return '+55' . $digits;
        }
        if (strlen($digits) >= 12 && str_starts_with($digits, '55')) {
            return '+' . substr($digits, 0, 15);
        }
        return ($digits !== '') ? ('+' . substr($digits, 0, 15)) : '';
    }
    if ($type === 'email') {
        return strtolower(substr(preg_replace('/\s+/', '', $k) ?? '', 0, 77));
    }

    return substr(preg_replace('/\s+/', '', $k) ?? '', 0, 77);
}

function emvField(string $id, string $value): string
{
    return sprintf('%02d%02d%s', (int)$id, strlen($value), $value);
}

/**
 * CRC16-CCITT (polinômio 0x1021, init 0xFFFF).
 */
function crc16Ccitt(string $payload): string
{
    $crc = 0xFFFF;
    $len = strlen($payload);
    for ($i = 0; $i < $len; $i++) {
        $crc ^= (ord($payload[$i]) << 8);
        for ($b = 0; $b < 8; $b++) {
            if (($crc & 0x8000) !== 0) {
                $crc = (($crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                $crc = ($crc << 1) & 0xFFFF;
            }
        }
    }
    return strtoupper(sprintf('%04X', $crc));
}

/**
 * Gera código Copia-e-Cola EMV PIX BRCode válido ou "" se pix_key não estiver configurada.
 *
 * @param array<string, string> $settingsMap
 */
function buildPixBrCode(array $settingsMap, float $amount, string $orderId): string
{
    $rawKey = $settingsMap['pix_key'] ?? '';
    $keyType = $settingsMap['pix_key_type'] ?? 'aleatoria';
    $pixKey = normalizePixKey($rawKey, $keyType);
    if ($pixKey === '') {
        return '';
    }

    $merchantName = toPixAscii($settingsMap['pix_name'] ?? 'ELTON CARAGUA PIXEL', 25, 'CARAGUA PIXEL');
    $merchantCity = toPixAscii($settingsMap['pix_city'] ?? 'CARAGUATATUBA', 15, 'CARAGUATATUBA');
    $txid = preg_replace('/[^A-Za-z0-9]/', '', $orderId) ?? '';
    $txid = substr($txid !== '' ? $txid : 'CARAGUAPIXEL', 0, 25);
    $amountStr = number_format(max(0.01, round($amount, 2)), 2, '.', '');

    $merchantAccountInfo = emvField('00', 'BR.GOV.BCB.PIX') . emvField('01', $pixKey);
    $additionalData = emvField('05', $txid);

    $payloadWithoutCrc =
        emvField('00', '01')
        . emvField('26', $merchantAccountInfo)
        . emvField('52', '0000')
        . emvField('53', '986')
        . emvField('54', $amountStr)
        . emvField('58', 'BR')
        . emvField('59', $merchantName)
        . emvField('60', $merchantCity)
        . emvField('62', $additionalData)
        . '6304';

    return $payloadWithoutCrc . crc16Ccitt($payloadWithoutCrc);
}

/**
 * @param array<string, mixed> $r
 * @return array<string, mixed>
 */
function formatOwnedLot(array $r): array
{
    return [
        'lot_id' => (string)$r['lot_id'],
        'owner_name' => (string)$r['owner_name'],
        'owner_handle' => (string)($r['owner_handle'] ?? ''),
        'style' => (string)$r['style'],
        'color' => (string)($r['color'] ?? '#f59e0b'),
        'title' => (string)($r['title'] ?? ''),
        'door_room' => (string)($r['door_room'] ?? ''),
        'x' => (float)$r['x'],
        'z' => (float)$r['z'],
        'rot' => (float)($r['rot'] ?? 0.0),
        'order_id' => (string)($r['order_id'] ?? ''),
        'created_at' => (int)$r['created_at'],
    ];
}

/**
 * @return list<array<string, mixed>>
 */
function fetchAllOwnedLots(PDO $pdo): array
{
    $stmt = $pdo->query('SELECT * FROM owned_lots ORDER BY created_at ASC');
    if ($stmt === false) {
        return [];
    }
    $out = [];
    foreach ($stmt->fetchAll() as $row) {
        $out[] = formatOwnedLot($row);
    }
    return $out;
}

/**
 * @return array<string, mixed>|null
 */
function fetchOwnedLotById(PDO $pdo, string $lotId): ?array
{
    if ($lotId === '') {
        return null;
    }
    $stmt = $pdo->prepare('SELECT * FROM owned_lots WHERE lot_id = :lot_id LIMIT 1');
    $stmt->execute([':lot_id' => $lotId]);
    $row = $stmt->fetch();
    return ($row !== false) ? formatOwnedLot($row) : null;
}

/**
 * Registra terreno em owned_lots se estiver livre. Retorna o registro do lote se criado/pertencente.
 *
 * @param array<string, mixed> $meta
 * @return array<string, mixed>|null
 */
function ensureOwnedLotFromMetadata(
    PDO $pdo,
    array $meta,
    string $ownerName,
    string $ownerHandle,
    string $fallbackStyle,
    string $orderId
): ?array {
    $lotId = cleanIdSlug($meta['lot_id'] ?? ($meta['lotId'] ?? ''), 48);
    if ($lotId === '') {
        return null;
    }

    $existing = fetchOwnedLotById($pdo, $lotId);
    if ($existing !== null) {
        if ($orderId !== '' && $existing['order_id'] === $orderId) {
            return $existing;
        }
        return null;
    }

    $validStyles = ['casa_simples', 'casa_solar', 'sobrado', 'mansao'];
    $rawStyle = isset($meta['style']) && is_string($meta['style']) ? strtolower(trim($meta['style'])) : '';
    if (in_array($rawStyle, $validStyles, true)) {
        $style = $rawStyle;
    } elseif (in_array($fallbackStyle, $validStyles, true)) {
        $style = $fallbackStyle;
    } else {
        $style = 'sobrado';
    }

    $color = cleanHexColor($meta['color'] ?? '#f59e0b', '#f59e0b');
    $cleanOwner = cleanNome($ownerName, 'Morador');
    $cleanHandle = cleanArroba($ownerHandle);
    $rawTitle = isset($meta['title']) && is_scalar($meta['title']) ? (string)$meta['title'] : '';
    $title = trim(utf8Substr(stripControlsAndCollapse($rawTitle), 40));
    $title = ($title !== '') ? filterProfanity($title) : ('Casa de ' . $cleanOwner);

    $rawDoor = isset($meta['door_room']) && is_scalar($meta['door_room']) ? (string)$meta['door_room'] : '';
    $doorRoom = cleanIdSlug($rawDoor, 40);
    if ($doorRoom === '') {
        $doorRoom = cleanIdSlug('casa_' . $lotId, 40);
    }

    $x = clampFloat($meta['x'] ?? 0.0, -1000.0, 1000.0, 0.0);
    $z = clampFloat($meta['z'] ?? 0.0, -1000.0, 1000.0, 0.0);
    $rot = clampFloat($meta['rot'] ?? 0.0, -7.0, 7.0, 0.0);
    $nowTs = (int)time();

    $stmtIns = $pdo->prepare(
        'INSERT OR IGNORE INTO owned_lots (
            lot_id, owner_name, owner_handle, style, color, title,
            door_room, x, z, rot, order_id, created_at
        ) VALUES (
            :lot_id, :owner_name, :owner_handle, :style, :color, :title,
            :door_room, :x, :z, :rot, :order_id, :created_at
        )'
    );
    $stmtIns->execute([
        ':lot_id' => $lotId,
        ':owner_name' => $cleanOwner,
        ':owner_handle' => $cleanHandle,
        ':style' => $style,
        ':color' => $color,
        ':title' => $title,
        ':door_room' => $doorRoom,
        ':x' => $x,
        ':z' => $z,
        ':rot' => $rot,
        ':order_id' => $orderId,
        ':created_at' => $nowTs,
    ]);

    return fetchOwnedLotById($pdo, $lotId);
}

/**
 * Extrai token admin do header X-Admin-Token, Authorization Bearer, query ou body.
 *
 * @param array<string, mixed> $body
 */
function extractAdminToken(array $body): string
{
    if (isset($_SERVER['HTTP_X_ADMIN_TOKEN']) && is_string($_SERVER['HTTP_X_ADMIN_TOKEN'])) {
        $t = trim($_SERVER['HTTP_X_ADMIN_TOKEN']);
        if ($t !== '') {
            return $t;
        }
    }

    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (is_array($headers)) {
            foreach ($headers as $hk => $hv) {
                if (is_string($hk) && is_string($hv) && strcasecmp($hk, 'X-Admin-Token') === 0) {
                    $t = trim($hv);
                    if ($t !== '') {
                        return $t;
                    }
                }
            }
        }
    }

    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (is_string($authHeader) && preg_match('/^Bearer\s+(\S+)/i', trim($authHeader), $m) === 1) {
        return trim($m[1]);
    }

    if (isset($body['token']) && is_string($body['token']) && trim($body['token']) !== '') {
        return trim($body['token']);
    }
    if (isset($body['admin_token']) && is_string($body['admin_token']) && trim($body['admin_token']) !== '') {
        return trim($body['admin_token']);
    }
    if (isset($_GET['token']) && is_string($_GET['token']) && trim($_GET['token']) !== '') {
        return trim($_GET['token']);
    }

    return '';
}

function isAdminAuthenticated(PDO $pdo, string $token): bool
{
    $now = (int)time();
    $pdo->prepare('DELETE FROM admin_sessions WHERE expires_at < :now')->execute([':now' => $now]);

    if ($token === '' || strlen($token) < 24 || strlen($token) > 256) {
        return false;
    }

    $stmt = $pdo->prepare('SELECT token FROM admin_sessions WHERE token = :token AND expires_at >= :now LIMIT 1');
    $stmt->execute([':token' => $token, ':now' => $now]);
    return $stmt->fetch() !== false;
}

function createAdminSession(PDO $pdo): string
{
    $now = (int)time();
    $pdo->prepare('DELETE FROM admin_sessions WHERE expires_at < :now')->execute([':now' => $now]);

    $token = bin2hex(random_bytes(32));
    $expiresAt = $now + 86400;
    $stmt = $pdo->prepare(
        'INSERT INTO admin_sessions (token, expires_at, created_at) VALUES (:token, :expires_at, :created_at)'
    );
    $stmt->execute([
        ':token' => $token,
        ':expires_at' => $expiresAt,
        ':created_at' => $now,
    ]);
    return $token;
}

function sqliteTableExists(PDO $pdo, string $tableName): bool
{
    $stmt = $pdo->prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = :name LIMIT 1");
    $stmt->execute([':name' => $tableName]);
    return $stmt->fetch() !== false;
}

/**
 * Resolve e valida item_id e kind contra o catálogo.
 *
 * @return array{item_id: string, kind: string, def: array<string, mixed>}|null
 */
function resolveCatalogItem(mixed $rawItemId, mixed $rawKind): ?array
{
    $defs = catalogDefinitions();
    $itemId = is_scalar($rawItemId) ? strtolower(trim((string)$rawItemId)) : '';
    if ($itemId === '' || !isset($defs[$itemId])) {
        return null;
    }

    $def = $defs[$itemId];
    $canonicalKind = $def['kind'];

    if (is_scalar($rawKind) && trim((string)$rawKind) !== '') {
        $inKind = strtolower(trim((string)$rawKind));
        $aliases = [
            'casa' => ['casa', 'casas', 'lote', 'terreno', 'house'],
            'carro' => ['carro', 'carros', 'moto', 'veiculo', 'vehicle'],
            'profissao' => ['profissao', 'profissoes', 'role', 'vip'],
            'vip' => ['vip', 'combo', 'combo_vip', 'profissao', 'pacote'],
            'loja' => ['loja', 'lojas', 'empresa', 'empresas', 'comercio', 'vip'],
        ];
        if (isset($aliases[$canonicalKind]) && !in_array($inKind, $aliases[$canonicalKind], true)) {
            return null;
        }
    }

    return [
        'item_id' => $itemId,
        'kind' => $canonicalKind,
        'def' => $def,
    ];
}

/**
 * Monta metadados enriquecidos para um passe VIP.
 *
 * @param array<string, mixed> $basePayload
 * @return array<string, mixed>
 */
function enrichPassMetadata(string $kind, string $itemId, array $basePayload, string $buyerName, string $buyerHandle): array
{
    $defs = catalogDefinitions();
    $def = $defs[$itemId] ?? null;
    $meta = $basePayload;
    $meta['kind'] = $kind;
    $meta['item_id'] = $itemId;
    $meta['badge'] = 'vip';
    if ($buyerName !== '') {
        $meta['buyer_name'] = $buyerName;
    }
    if ($buyerHandle !== '') {
        $meta['buyer_handle'] = $buyerHandle;
    }
    if ($def !== null && isset($def['role']) && !isset($meta['profissao'])) {
        $meta['profissao'] = $def['role'];
    }
    if ($itemId === 'combo_vip') {
        $meta['combo'] = true;
        if (!isset($meta['car_type']) || $meta['car_type'] === '') {
            $meta['car_type'] = 'esportivo';
        }
        if (!isset($meta['profissao']) || $meta['profissao'] === '') {
            $meta['profissao'] = 'VIP';
        }
    }
    if ($kind === 'loja' || in_array($itemId, ['loja_bronze', 'loja_empresa_vip', 'loja_ouro'], true)) {
        $meta['empresa_vip'] = true;
        if ($itemId === 'loja_bronze') {
            $meta['car_type'] = 'moto';
            $meta['profissao'] = '💼 Lojista VIP';
        } elseif ($itemId === 'loja_ouro') {
            $meta['combo'] = true;
            $meta['car_type'] = 'esportivo';
            $meta['profissao'] = '👑 Patrocinador VIP';
        } else {
            $meta['car_type'] = 'bugue';
            $meta['profissao'] = '🏢 Lojista VIP';
        }
    }
    return $meta;
}

$pdo = null;
$inTx = false;

try {
    $pdo = openDatabase();

    $body = [];
    if ($method === 'POST') {
        $raw = file_get_contents('php://input');
        if (is_string($raw) && strlen($raw) > 65536) {
            respondError(400, 'Requisição excede o tamanho máximo permitido.');
        }
        if (is_string($raw) && trim($raw) !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $body = $decoded;
            } elseif (!empty($_POST)) {
                $body = $_POST;
            } else {
                respondError(400, 'JSON inválido na requisição.');
            }
        } elseif (!empty($_POST)) {
            $body = $_POST;
        }
    } elseif ($method !== 'GET') {
        respondError(405, 'Método HTTP não permitido.');
    }

    $action = '';
    $getAction = (isset($_GET['action']) && is_string($_GET['action'])) ? trim($_GET['action']) : '';
    $bodyAction = (isset($body['action']) && is_string($body['action'])) ? trim($body['action']) : '';

    if (
        $getAction === 'mp_webhook'
        || str_starts_with($bodyAction, 'payment.')
        || isset($_GET['data_id'])
        || (isset($_GET['topic']) && is_string($_GET['topic']))
    ) {
        $action = 'mp_webhook';
    } elseif ($bodyAction !== '') {
        $action = $bodyAction;
    } elseif ($getAction !== '') {
        $action = $getAction;
    } elseif ($method === 'GET') {
        $action = 'public_state';
    }

    // -------------------------------------------------------------------------
    // ROTAS PÚBLICAS
    // -------------------------------------------------------------------------

    if ($action === 'public_state') {
        $settingsMap = loadSettingsMap($pdo);
        $reqPid = cleanPid($_GET['pid'] ?? '');
        sweepPendingMpOrders($pdo, $settingsMap, 3, $reqPid);

        $prices = resolvePrices($settingsMap);
        $pixKey = normalizePixKey($settingsMap['pix_key'] ?? '', $settingsMap['pix_key_type'] ?? 'aleatoria');
        $mpToken = getMpToken($settingsMap);
        $mpEnabled = ($mpToken !== '');

        $myPasses = [];
        if ($reqPid !== '' && $reqPid !== 'visitante') {
            $stmtMy = $pdo->prepare(
                "SELECT p.code, p.kind, p.item_id, p.metadata_json
                 FROM passes p
                 LEFT JOIN orders o ON o.pass_code = p.code
                 WHERE p.owner_pid = :pid OR (o.buyer_pid = :pid AND o.status = 'approved')
                 ORDER BY p.created_at ASC
                 LIMIT 30"
            );
            $stmtMy->execute([':pid' => $reqPid]);
            foreach ($stmtMy->fetchAll() as $mpRow) {
                $mDec = json_decode((string)($mpRow['metadata_json'] ?? '{}'), true);
                $myPasses[] = [
                    'code' => (string)$mpRow['code'],
                    'kind' => (string)$mpRow['kind'],
                    'item_id' => (string)$mpRow['item_id'],
                    'metadata' => is_array($mDec) ? $mDec : [],
                ];
            }
        }

        $whatsappVipUrl = trim($settingsMap['whatsapp_vip_url'] ?? '');
        if ($whatsappVipUrl === '') {
            $whatsappVipUrl = 'https://www.instagram.com/caraguapixel/';
        }
        $stmtLojasAprovadas = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE (kind = 'loja' OR item_id = 'loja_empresa_vip') AND status = 'approved'");
        $stmtLojasAprovadas->execute();
        $lojasAprovadas = (int)$stmtLojasAprovadas->fetchColumn();
        $vagasEmpresasRestantes = max(1, 20 - $lojasAprovadas);
        $reqArroba = cleanArroba($_GET['arroba'] ?? '');
        $walletOut = ($reqPid !== '' && $reqPid !== 'visitante')
            ? ensurePoliciaWallet($pdo, resolvePoliciaWalletKey($reqPid, $reqArroba))
            : null;

        respondJson(200, [
            'ok' => true,
            'pix_configured' => ($mpEnabled || $pixKey !== ''),
            'mp_enabled' => $mpEnabled,
            'prices' => $prices,
            'catalog' => buildCatalogList($prices),
            'owned_lots' => fetchAllOwnedLots($pdo),
            'my_passes' => $myPasses,
            'wallet' => $walletOut,
            'creator_hint' => '@caraguapixel',
            'whatsapp_vip_url' => $whatsappVipUrl,
            'vagas_empresas_total' => 20,
            'vagas_empresas_ocupadas' => $lojasAprovadas,
            'vagas_empresas_restantes' => $vagasEmpresasRestantes,
        ]);
    }

    if ($action === 'login_arroba') {
        if ($method !== 'POST') {
            respondError(405, 'Use POST para entrar com seu @.');
        }

        $handle = strtolower(cleanArroba($body['arroba'] ?? ($body['handle'] ?? '')));
        if (strlen($handle) < 2) {
            respondError(400, 'Informe seu @ do Instagram (mínimo 2 caracteres).');
        }

        $rawPin = is_scalar($body['pin'] ?? null) ? (string)$body['pin'] : '';
        $pin = preg_replace('/\D/', '', $rawPin) ?? '';
        if (strlen($pin) < 4 || strlen($pin) > 8) {
            respondError(400, 'Digite um PIN numérico de 4 a 8 dígitos.');
        }

        $nomeIn = cleanNome($body['nome'] ?? '', 'Morador');
        $clientPid = cleanPid($body['pid'] ?? '');
        $camisaIn = (isset($body['camisa']) && is_numeric($body['camisa']))
            ? max(0, min(0xffffff, (int)$body['camisa']))
            : 0x1c7ed6;
        $recoveryCode = is_scalar($body['recovery_code'] ?? null)
            ? strtoupper(trim((string)$body['recovery_code']))
            : '';

        $moedasIn = [];
        if (isset($body['moedas']) && is_array($body['moedas'])) {
            foreach ($body['moedas'] as $mVal) {
                if (is_numeric($mVal)) {
                    $mi = (int)$mVal;
                    if ($mi >= 0 && $mi < 20 && !in_array($mi, $moedasIn, true)) {
                        $moedasIn[] = $mi;
                    }
                }
            }
        }

        $ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|cgpx_arr');
        $rateKey = 'arr_pin:' . $ipHash;
        $nowMicro = microtime(true);

        $stmtRate = $pdo->prepare('SELECT last_ts FROM rate_limits WHERE k = :k LIMIT 1');
        $stmtRate->execute([':k' => $rateKey]);
        $rateRow = $stmtRate->fetch();
        if ($rateRow !== false && ($nowMicro - (float)$rateRow['last_ts']) < 0.8) {
            respondError(429, 'Aguarde um instante antes de tentar novamente.');
        }

        $pdo->exec('BEGIN IMMEDIATE');
        $inTx = true;

        $stmtAcc = $pdo->prepare('SELECT * FROM player_accounts WHERE handle = :h LIMIT 1');
        $stmtAcc->execute([':h' => $handle]);
        $accRow = $stmtAcc->fetch();

        $nowTs = (int)time();
        $isNew = false;

        if ($accRow === false) {
            $isNew = true;
            $masterPid = ($clientPid !== '' && $clientPid !== 'visitante')
                ? $clientPid
                : ('p_' . bin2hex(random_bytes(7)));
            $finalNome = ($nomeIn !== '' && !str_starts_with($nomeIn, 'Visitante')) ? $nomeIn : ('@' . $handle);
            $finalCamisa = $camisaIn;
            $finalMoedas = $moedasIn;
            $moedasJson = json_encode($finalMoedas) ?: '[]';

            $stmtInsAcc = $pdo->prepare(
                'INSERT INTO player_accounts (
                    handle, nome, pin_hash, master_pid, camisa, moedas_json, created_at, updated_at
                ) VALUES (
                    :h, :nome, :pin_hash, :mpid, :camisa, :moedas, :cat, :uat
                )'
            );
            $stmtInsAcc->execute([
                ':h' => $handle,
                ':nome' => $finalNome,
                ':pin_hash' => password_hash($pin, PASSWORD_DEFAULT),
                ':mpid' => $masterPid,
                ':camisa' => $finalCamisa,
                ':moedas' => $moedasJson,
                ':cat' => $nowTs,
                ':uat' => $nowTs,
            ]);
        } else {
            $pinOk = password_verify($pin, (string)$accRow['pin_hash']);
            if (!$pinOk && $recoveryCode !== '') {
                $stmtRec = $pdo->prepare(
                    "SELECT p.code FROM passes p
                     LEFT JOIN orders o ON o.pass_code = p.code
                     WHERE p.code = :code
                       AND (LOWER(o.buyer_handle) = :h OR p.owner_pid = :mpid)
                     LIMIT 1"
                );
                $stmtRec->execute([
                    ':code' => $recoveryCode,
                    ':h' => $handle,
                    ':mpid' => (string)$accRow['master_pid'],
                ]);
                if ($stmtRec->fetch() !== false) {
                    $pinOk = true;
                    $pdo->prepare('UPDATE player_accounts SET pin_hash = :ph WHERE handle = :h')
                        ->execute([':ph' => password_hash($pin, PASSWORD_DEFAULT), ':h' => $handle]);
                }
            }

            if (!$pinOk) {
                $pdo->exec('ROLLBACK');
                $inTx = false;
                $pdo->prepare(
                    'INSERT INTO rate_limits (k, last_ts) VALUES (:k, :ts)
                     ON CONFLICT(k) DO UPDATE SET last_ts = excluded.last_ts'
                )->execute([':k' => $rateKey, ':ts' => $nowMicro]);
                respondError(
                    401,
                    'PIN incorreto para @' . $handle . '. Digite o PIN de 4 números que você escolheu no 1º acesso.'
                );
            }

            $masterPid = (string)$accRow['master_pid'];
            $savedMoedas = json_decode((string)($accRow['moedas_json'] ?? '[]'), true);
            $finalMoedas = is_array($savedMoedas) ? array_values(array_unique(array_map('intval', $savedMoedas))) : [];
            foreach ($moedasIn as $mVal) {
                if (!in_array($mVal, $finalMoedas, true)) {
                    $finalMoedas[] = $mVal;
                }
            }

            $oldNome = (string)($accRow['nome'] ?? 'Morador');
            $finalNome = ($nomeIn !== '' && $nomeIn !== 'Morador' && !str_starts_with($nomeIn, 'Visitante'))
                ? $nomeIn
                : $oldNome;
            $finalCamisa = isset($body['camisa']) ? $camisaIn : (int)($accRow['camisa'] ?? 0x1c7ed6);
            $moedasJson = json_encode($finalMoedas) ?: '[]';

            $pdo->prepare(
                'UPDATE player_accounts
                 SET nome = :nome, camisa = :camisa, moedas_json = :moedas, updated_at = :uat
                 WHERE handle = :h'
            )->execute([
                ':nome' => $finalNome,
                ':camisa' => $finalCamisa,
                ':moedas' => $moedasJson,
                ':uat' => $nowTs,
                ':h' => $handle,
            ]);
        }

        // Vincula compras e passes deste @handle ou pid anterior ao master_pid
        $pdo->prepare(
            "UPDATE orders
             SET buyer_pid = :mpid
             WHERE LOWER(buyer_handle) = :h
                OR (:cpid != '' AND :cpid != 'visitante' AND buyer_pid = :cpid)"
        )->execute([
            ':mpid' => $masterPid,
            ':h' => $handle,
            ':cpid' => $clientPid,
        ]);

        $pdo->prepare(
            "UPDATE passes
             SET owner_pid = :mpid
             WHERE code IN (
                 SELECT pass_code FROM orders WHERE buyer_pid = :mpid AND status = 'approved' AND pass_code != ''
             ) OR (:cpid != '' AND :cpid != 'visitante' AND owner_pid = :cpid)"
        )->execute([
            ':mpid' => $masterPid,
            ':cpid' => $clientPid,
        ]);

        $pdo->exec('COMMIT');
        $inTx = false;

        $myPasses = [];
        $stmtMy = $pdo->prepare(
            "SELECT p.code, p.kind, p.item_id, p.metadata_json
             FROM passes p
             LEFT JOIN orders o ON o.pass_code = p.code
             WHERE p.owner_pid = :pid OR (o.buyer_pid = :pid AND o.status = 'approved')
             ORDER BY p.created_at ASC
             LIMIT 30"
        );
        $stmtMy->execute([':pid' => $masterPid]);
        foreach ($stmtMy->fetchAll() as $mpRow) {
            $mDec = json_decode((string)($mpRow['metadata_json'] ?? '{}'), true);
            $myPasses[] = [
                'code' => (string)$mpRow['code'],
                'kind' => (string)$mpRow['kind'],
                'item_id' => (string)$mpRow['item_id'],
                'metadata' => is_array($mDec) ? $mDec : [],
            ];
        }

        respondJson(200, [
            'ok' => true,
            'is_new' => $isNew,
            'handle' => $handle,
            'nome' => $finalNome,
            'master_pid' => $masterPid,
            'camisa' => $finalCamisa,
            'moedas' => $finalMoedas,
            'my_passes' => $myPasses,
        ]);
    }

    if ($action === 'create_order') {
        if ($method !== 'POST') {
            respondError(405, 'Use POST para criar pedido.');
        }

        $resolved = resolveCatalogItem($body['item_id'] ?? ($body['item'] ?? ''), $body['kind'] ?? '');
        if ($resolved === null) {
            respondError(400, 'Item selecionado inválido.');
        }

        $itemId = $resolved['item_id'];
        $kind = $resolved['kind'];

        $buyerName = cleanNome($body['buyer_name'] ?? ($body['nome'] ?? ''), 'Visitante');
        $buyerHandle = cleanArroba($body['buyer_handle'] ?? ($body['arroba'] ?? ''));
        $buyerPid = cleanPid($body['buyer_pid'] ?? ($body['pid'] ?? ''));

        $rawPayload = (isset($body['payload']) && is_array($body['payload'])) ? $body['payload'] : [];
        foreach (['lot_id', 'lotId', 'style', 'color', 'title', 'door_room', 'x', 'z', 'rot', 'profissao', 'empresa', 'nome_loja', 'cnpj', 'whatsapp', 'ramo', 'local_preferido', 'observacoes'] as $topKey) {
            if (!array_key_exists($topKey, $rawPayload) && array_key_exists($topKey, $body)) {
                $rawPayload[$topKey] = $body[$topKey];
            }
        }

        $lotId = cleanIdSlug($rawPayload['lot_id'] ?? ($rawPayload['lotId'] ?? ''), 48);
        if ($kind === 'casa' && $lotId === '') {
            respondError(400, 'Selecione um terreno livre antes de gerar o PIX.');
        }

        $sanitizedPayload = [];
        if ($lotId !== '') {
            $validStyles = ['casa_simples', 'casa_solar', 'sobrado', 'mansao'];
            $rawStyle = isset($rawPayload['style']) && is_string($rawPayload['style'])
                ? strtolower(trim($rawPayload['style']))
                : '';
            if (in_array($rawStyle, $validStyles, true)) {
                $style = $rawStyle;
            } elseif (in_array($itemId, $validStyles, true)) {
                $style = $itemId;
            } else {
                $style = 'sobrado';
            }

            $rawTitle = isset($rawPayload['title']) && is_scalar($rawPayload['title']) ? (string)$rawPayload['title'] : '';
            $title = trim(utf8Substr(stripControlsAndCollapse($rawTitle), 40));
            $title = ($title !== '') ? filterProfanity($title) : ('Casa de ' . $buyerName);

            $rawDoor = isset($rawPayload['door_room']) && is_scalar($rawPayload['door_room'])
                ? (string)$rawPayload['door_room']
                : '';
            $doorRoom = cleanIdSlug($rawDoor, 40);
            if ($doorRoom === '') {
                $doorRoom = cleanIdSlug('casa_' . $lotId, 40);
            }

            $sanitizedPayload = [
                'lot_id' => $lotId,
                'style' => $style,
                'color' => cleanHexColor($rawPayload['color'] ?? '#f59e0b', '#f59e0b'),
                'title' => $title,
                'door_room' => $doorRoom,
                'x' => round(clampFloat($rawPayload['x'] ?? 0.0, -1000.0, 1000.0, 0.0), 3),
                'z' => round(clampFloat($rawPayload['z'] ?? 0.0, -1000.0, 1000.0, 0.0), 3),
                'rot' => round(clampFloat($rawPayload['rot'] ?? 0.0, -7.0, 7.0, 0.0), 4),
            ];
        }
        if (isset($rawPayload['profissao']) && is_scalar($rawPayload['profissao'])) {
            $prof = trim(utf8Substr(stripControlsAndCollapse((string)$rawPayload['profissao']), 32));
            if ($prof !== '') {
                $sanitizedPayload['profissao'] = filterProfanity($prof);
            }
        }
        if ($kind === 'loja' || in_array($itemId, ['loja_bronze', 'loja_empresa_vip', 'loja_ouro'], true)) {
            $rawEmpresa = (string)($rawPayload['empresa'] ?? ($rawPayload['nome_loja'] ?? ''));
            $empresaClean = trim(utf8Substr(stripControlsAndCollapse($rawEmpresa), 64));
            $rawCnpj = (string)($rawPayload['cnpj'] ?? '');
            $cnpjClean = substr(preg_replace('/[^0-9.\-\/]/', '', $rawCnpj) ?? '', 0, 24);
            $rawWa = (string)($rawPayload['whatsapp'] ?? '');
            $waClean = substr(preg_replace('/[^0-9+\-() ]/', '', $rawWa) ?? '', 0, 24);
            $rawRamo = (string)($rawPayload['ramo'] ?? 'Comércio Local');
            $ramoClean = trim(utf8Substr(stripControlsAndCollapse($rawRamo), 40));
            $rawLoc = (string)($rawPayload['local_preferido'] ?? 'Galeria Pixel');
            $locClean = trim(utf8Substr(stripControlsAndCollapse($rawLoc), 40));
            $rawObs = (string)($rawPayload['observacoes'] ?? '');
            $obsClean = trim(utf8Substr(stripControlsAndCollapse($rawObs), 400));

            $sanitizedPayload['plano_id'] = $itemId;
            $sanitizedPayload['empresa'] = filterProfanity($empresaClean !== '' ? $empresaClean : $buyerName);
            $sanitizedPayload['cnpj'] = $cnpjClean;
            $sanitizedPayload['whatsapp'] = $waClean;
            $sanitizedPayload['ramo'] = filterProfanity($ramoClean);
            $sanitizedPayload['local_preferido'] = filterProfanity($locClean);
            $sanitizedPayload['observacoes'] = filterProfanity($obsClean);
            $sanitizedPayload['sla_dias'] = 2;
            $sanitizedPayload['deadline_ts'] = (int)time() + (2 * 86400);

            if (($buyerName === 'Visitante' || $buyerName === '') && $sanitizedPayload['empresa'] !== '') {
                $buyerName = $sanitizedPayload['empresa'];
            }
        }

        $pdo->exec('BEGIN IMMEDIATE');
        $inTx = true;

        if ($lotId !== '' && fetchOwnedLotById($pdo, $lotId) !== null) {
            $pdo->exec('ROLLBACK');
            $inTx = false;
            respondError(409, 'Este terreno já foi adquirido por outro morador. Escolha outro lote livre!');
        }

        $settingsMap = loadSettingsMap($pdo);
        $prices = resolvePrices($settingsMap);
        $amount = isset($prices[$itemId]) ? round((float)$prices[$itemId], 2) : 1.99;
        $mpToken = getMpToken($settingsMap);
        $mpEnabled = ($mpToken !== '');

        $orderId = generateOrderId($pdo);
        $nowTs = (int)time();

        // --- Mercado Pago PIX automático ---
        $pixBrcode = '';
        $pixQrBase64 = '';
        $mpPaymentId = '';
        $pixConfigured = false;

        if ($mpEnabled) {
            $defs = catalogDefinitions();
            $itemName = isset($defs[$itemId]) ? $defs[$itemId]['name'] : $itemId;
            $mpPayload = [
                'transaction_amount' => round($amount, 2),
                'description' => 'Caragua Pixel - ' . $itemName . ' (' . $orderId . ')',
                'payment_method_id' => 'pix',
                'external_reference' => $orderId,
                'notification_url' => 'https://caraguapixel.online/api/economia.php?action=mp_webhook',
                'payer' => [
                    'email' => 'morador@caraguapixel.online',
                    'first_name' => ($buyerName !== '' && $buyerName !== 'Visitante') ? utf8Substr($buyerName, 24) : 'Morador',
                ],
            ];
            $mpResp = mpApiRequest(
                'POST',
                'https://api.mercadopago.com/v1/payments',
                $mpToken,
                $mpPayload,
                ['X-Idempotency-Key' => $orderId]
            );
            if ($mpResp['status'] >= 200 && $mpResp['status'] < 300) {
                $mpBody = $mpResp['body'];
                $mpPaymentId = isset($mpBody['id']) ? (string)$mpBody['id'] : '';
                $pixBrcode = '';
                $pixQrBase64 = '';
                if (
                    isset($mpBody['point_of_interaction']['transaction_data'])
                    && is_array($mpBody['point_of_interaction']['transaction_data'])
                ) {
                    $txData = $mpBody['point_of_interaction']['transaction_data'];
                    $pixBrcode = isset($txData['qr_code']) && is_string($txData['qr_code'])
                        ? trim($txData['qr_code'])
                        : '';
                    $pixQrBase64 = isset($txData['qr_code_base64']) && is_string($txData['qr_code_base64'])
                        ? trim($txData['qr_code_base64'])
                        : '';
                }
                $pixConfigured = true;
            } else {
                // MP error — fall through to manual PIX or Modo Reserva
                $pixBrcode = buildPixBrCode($settingsMap, $amount, $orderId);
                $pixConfigured = ($pixBrcode !== '');
            }
        } else {
            $pixBrcode = buildPixBrCode($settingsMap, $amount, $orderId);
            $pixConfigured = ($pixBrcode !== '');
        }

        $payloadJson = json_encode($sanitizedPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $stmtOrder = $pdo->prepare(
            "INSERT INTO orders (
                id, kind, item_id, amount, buyer_name, buyer_handle, buyer_pid,
                payload_json, pix_brcode, status, pass_code,
                created_at, updated_at, mp_payment_id, pix_qr_base64, mp_checked_at
            ) VALUES (
                :id, :kind, :item_id, :amount, :buyer_name, :buyer_handle, :buyer_pid,
                :payload_json, :pix_brcode, 'pending', '',
                :created_at, :updated_at, :mp_payment_id, :pix_qr_base64, 0
            )"
        );
        $stmtOrder->execute([
            ':id' => $orderId,
            ':kind' => $kind,
            ':item_id' => $itemId,
            ':amount' => $amount,
            ':buyer_name' => $buyerName,
            ':buyer_handle' => $buyerHandle,
            ':buyer_pid' => $buyerPid,
            ':payload_json' => ($payloadJson !== false) ? $payloadJson : '{}',
            ':pix_brcode' => $pixBrcode,
            ':created_at' => $nowTs,
            ':updated_at' => $nowTs,
            ':mp_payment_id' => $mpPaymentId,
            ':pix_qr_base64' => $pixQrBase64,
        ]);

        $pdo->exec('COMMIT');
        $inTx = false;

        respondJson(200, [
            'ok' => true,
            'id' => $orderId,
            'order_id' => $orderId,
            'kind' => $kind,
            'item_id' => $itemId,
            'amount' => $amount,
            'pix_configured' => $pixConfigured,
            'mp_enabled' => $mpEnabled,
            'pix_brcode' => $pixBrcode,
            'pix_qr_base64' => $pixQrBase64,
            'status' => 'pending',
        ]);
    }

    if ($action === 'check_order') {
        $rawId = $_GET['id'] ?? ($_GET['order_id'] ?? ($body['id'] ?? ($body['order_id'] ?? '')));
        $orderId = cleanIdSlug($rawId, 48);
        if ($orderId === '') {
            respondError(400, 'ID do pedido inválido.');
        }

        $stmtOrd = $pdo->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
        $stmtOrd->execute([':id' => $orderId]);
        $order = $stmtOrd->fetch();
        if ($order === false) {
            respondError(404, 'Pedido não encontrado.');
        }

        // Auto-approve via Mercado Pago if pending with mp_payment_id
        if ((string)$order['status'] === 'pending') {
            $mpPaymentId = trim((string)($order['mp_payment_id'] ?? ''));
            if ($mpPaymentId !== '') {
                $settingsMap = loadSettingsMap($pdo);
                $mpToken = getMpToken($settingsMap);
                $lastChecked = (int)($order['mp_checked_at'] ?? 0);
                $nowTs2 = (int)time();
                if ($mpToken !== '' && ($nowTs2 - $lastChecked) >= 2) {
                    // Update mp_checked_at first to avoid parallel hammering
                    $stmtMpTs = $pdo->prepare(
                        'UPDATE orders SET mp_checked_at = :ts WHERE id = :id'
                    );
                    $stmtMpTs->execute([':ts' => $nowTs2, ':id' => $orderId]);

                    $mpResp = mpApiRequest(
                        'GET',
                        'https://api.mercadopago.com/v1/payments/' . rawurlencode($mpPaymentId),
                        $mpToken
                    );
                    if (
                        $mpResp['status'] === 200
                        && isset($mpResp['body']['status'])
                        && $mpResp['body']['status'] === 'approved'
                    ) {
                        $pdo->exec('BEGIN IMMEDIATE');
                        $inTx = true;
                        // Reload order inside transaction
                        $stmtReload = $pdo->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
                        $stmtReload->execute([':id' => $orderId]);
                        $order = $stmtReload->fetch();
                        if ($order !== false && (string)$order['status'] === 'pending') {
                            $approveResult = approveOrderIdempotent($pdo, $order);
                            $pdo->exec('COMMIT');
                            $inTx = false;
                            // Reload order to reflect approved status
                            $stmtReload2 = $pdo->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
                            $stmtReload2->execute([':id' => $orderId]);
                            $orderReloaded = $stmtReload2->fetch();
                            if ($orderReloaded !== false) {
                                $order = $orderReloaded;
                            }
                        } else {
                            $pdo->exec('COMMIT');
                            $inTx = false;
                        }
                    }
                }
            }
        }

        $decodedPayload = json_decode((string)($order['payload_json'] ?? '{}'), true);
        $payload = is_array($decodedPayload) ? $decodedPayload : [];
        $lotId = cleanIdSlug($payload['lot_id'] ?? '', 48);
        $ownedLot = ($lotId !== '') ? fetchOwnedLotById($pdo, $lotId) : null;
        $orderWallet = ((string)$order['kind'] === 'evento' || str_starts_with((string)$order['item_id'], 'policia_'))
            ? ensurePoliciaWallet($pdo, resolvePoliciaWalletKey((string)($order['buyer_pid'] ?? ''), (string)($order['buyer_handle'] ?? '')))
            : null;

        respondJson(200, [
            'ok' => true,
            'id' => (string)$order['id'],
            'order_id' => (string)$order['id'],
            'status' => (string)$order['status'],
            'pass_code' => (string)($order['pass_code'] ?? ''),
            'kind' => (string)$order['kind'],
            'item_id' => (string)$order['item_id'],
            'amount' => (float)$order['amount'],
            'pix_brcode' => (string)($order['pix_brcode'] ?? ''),
            'pix_qr_base64' => (string)($order['pix_qr_base64'] ?? ''),
            'mp_enabled' => (trim((string)($order['mp_payment_id'] ?? '')) !== ''),
            'payload' => $payload,
            'owned_lot' => $ownedLot,
            'wallet' => $orderWallet,
        ]);
    }

    if ($action === 'mp_webhook') {
        // Mercado Pago IPN/Webhook — always respond 200 quickly
        if (
            (isset($_GET['topic']) && is_string($_GET['topic']) && $_GET['topic'] === 'merchant_order')
            || (isset($body['type']) && is_string($body['type']) && $body['type'] === 'merchant_order')
        ) {
            respondJson(200, ['ok' => true, 'skipped' => 'merchant_order']);
        }

        $rawMpId = '';
        if (isset($body['data']['id']) && is_scalar($body['data']['id'])) {
            $rawMpId = trim((string)$body['data']['id']);
        } elseif (isset($_GET['data_id']) && is_scalar($_GET['data_id'])) {
            $rawMpId = trim((string)$_GET['data_id']);
        } elseif (
            isset($body['resource']) && is_string($body['resource'])
            && preg_match('#/v1/payments/(\d+)#', $body['resource'], $rm) === 1
        ) {
            $rawMpId = $rm[1];
        } elseif (isset($_GET['id']) && is_scalar($_GET['id'])) {
            $rawMpId = trim((string)$_GET['id']);
        } elseif (!isset($body['data']) && isset($body['id']) && is_scalar($body['id'])) {
            $rawMpId = trim((string)$body['id']);
        }

        $mpNumericId = preg_replace('/\D/', '', $rawMpId) ?? '';
        if ($mpNumericId === '' || strlen($mpNumericId) > 24) {
            respondJson(200, ['ok' => true, 'skipped' => true]);
        }

        $settingsMap = loadSettingsMap($pdo);
        $mpToken = getMpToken($settingsMap);
        if ($mpToken === '') {
            respondJson(200, ['ok' => true, 'skipped' => 'no_token']);
        }

        $mpResp = mpApiRequest(
            'GET',
            'https://api.mercadopago.com/v1/payments/' . rawurlencode($mpNumericId),
            $mpToken
        );

        if (
            $mpResp['status'] !== 200
            || !isset($mpResp['body']['status'])
            || $mpResp['body']['status'] !== 'approved'
        ) {
            respondJson(200, ['ok' => true, 'mp_status' => $mpResp['body']['status'] ?? 'unknown']);
        }

        $extRef = isset($mpResp['body']['external_reference']) && is_string($mpResp['body']['external_reference'])
            ? cleanIdSlug($mpResp['body']['external_reference'], 48)
            : '';

        // Find order by mp_payment_id or external_reference
        $orderRow = null;
        $stmtFindByMp = $pdo->prepare(
            'SELECT * FROM orders WHERE mp_payment_id = :mpid LIMIT 1'
        );
        $stmtFindByMp->execute([':mpid' => $mpNumericId]);
        $orderRow = $stmtFindByMp->fetch();

        if ($orderRow === false && $extRef !== '') {
            $stmtFindByExt = $pdo->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
            $stmtFindByExt->execute([':id' => $extRef]);
            $orderRow = $stmtFindByExt->fetch();
        }

        if ($orderRow !== false && is_array($orderRow) && (string)$orderRow['status'] === 'pending') {
            $pdo->exec('BEGIN IMMEDIATE');
            $inTx = true;
            $stmtWh = $pdo->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
            $stmtWh->execute([':id' => (string)$orderRow['id']]);
            $freshOrder = $stmtWh->fetch();
            if ($freshOrder !== false && (string)$freshOrder['status'] === 'pending') {
                approveOrderIdempotent($pdo, $freshOrder);
            }
            $pdo->exec('COMMIT');
            $inTx = false;
        }

        respondJson(200, ['ok' => true]);
    }

    if ($action === 'redeem_code') {
        if ($method !== 'POST') {
            respondError(405, 'Use POST para ativar código.');
        }

        $rawCode = isset($body['code']) && is_scalar($body['code'])
            ? trim((string)$body['code'])
            : (isset($body['codigo']) && is_scalar($body['codigo']) ? trim((string)$body['codigo']) : '');
        if ($rawCode === '' || strlen($rawCode) > 64) {
            respondError(400, 'Informe um código válido.');
        }

        $pid = cleanPid($body['pid'] ?? '');
        $nome = cleanNome($body['nome'] ?? ($body['buyer_name'] ?? ''), 'Morador');
        $arroba = cleanArroba($body['arroba'] ?? ($body['buyer_handle'] ?? ''));
        $extra = (isset($body['extra']) && is_array($body['extra'])) ? $body['extra'] : [];

        $settingsMap = loadSettingsMap($pdo);
        $creatorSecret = trim($settingsMap['creator_secret'] ?? '');
        $codeUpper = strtoupper($rawCode);

        if (
            $creatorSecret !== ''
            && (hash_equals($creatorSecret, $rawCode) || hash_equals(strtoupper($creatorSecret), $codeUpper))
        ) {
            respondJson(200, [
                'ok' => true,
                'creator' => true,
                'badge' => 'criador',
                'creator_key' => $creatorSecret,
                'arroba' => '@caraguapixel',
            ]);
        }

        $pdo->exec('BEGIN IMMEDIATE');
        $inTx = true;

        $stmtPass = $pdo->prepare('SELECT * FROM passes WHERE code = :code LIMIT 1');
        $stmtPass->execute([':code' => $codeUpper]);
        $passRow = $stmtPass->fetch();

        if ($passRow === false) {
            $pdo->exec('ROLLBACK');
            $inTx = false;
            respondError(404, 'Código não encontrado. Verifique se digitou corretamente.');
        }

        $alreadyRedeemed = ((int)($passRow['redeemed'] ?? 0) === 1);
        $existingOwnerPid = trim((string)($passRow['owner_pid'] ?? ''));

        if ($alreadyRedeemed && $existingOwnerPid !== '' && $pid !== '' && $existingOwnerPid !== $pid) {
            $pdo->exec('ROLLBACK');
            $inTx = false;
            respondError(409, 'Este código VIP já foi ativado por outro jogador.');
        }

        $decodedMeta = json_decode((string)($passRow['metadata_json'] ?? '{}'), true);
        $meta = is_array($decodedMeta) ? $decodedMeta : [];
        foreach (['lot_id', 'lotId', 'style', 'color', 'title', 'door_room', 'x', 'z', 'rot'] as $kExtra) {
            if (!isset($meta[$kExtra]) && isset($extra[$kExtra])) {
                $meta[$kExtra] = $extra[$kExtra];
            }
        }

        $passKind = (string)$passRow['kind'];
        $passItemId = (string)$passRow['item_id'];
        $finalOwnerPid = ($pid !== '') ? $pid : $existingOwnerPid;
        $finalOwnerName = ($nome !== '' && $nome !== 'Morador')
            ? $nome
            : (((string)$passRow['owner_name'] !== '') ? (string)$passRow['owner_name'] : $nome);
        $meta = enrichPassMetadata($passKind, $passItemId, $meta, $finalOwnerName, $arroba);

        $ownedLot = null;
        if (isset($meta['lot_id']) || isset($meta['lotId'])) {
            $orderRef = isset($meta['order_id']) && is_string($meta['order_id']) ? $meta['order_id'] : '';
            $ownedLot = ensureOwnedLotFromMetadata(
                $pdo,
                $meta,
                $finalOwnerName,
                $arroba,
                $passItemId,
                $orderRef
            );
            if ($ownedLot !== null) {
                $meta['lot_id'] = $ownedLot['lot_id'];
                $meta['door_room'] = $ownedLot['door_room'];
            }
        }

        $nowTs = (int)time();
        $metaJson = json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $stmtUpdPass = $pdo->prepare(
            'UPDATE passes
             SET redeemed = 1,
                 owner_pid = :owner_pid,
                 owner_name = :owner_name,
                 metadata_json = :metadata_json,
                 redeemed_at = CASE WHEN redeemed_at > 0 THEN redeemed_at ELSE :redeemed_at END
             WHERE code = :code'
        );
        $stmtUpdPass->execute([
            ':owner_pid' => $finalOwnerPid,
            ':owner_name' => $finalOwnerName,
            ':metadata_json' => ($metaJson !== false) ? $metaJson : '{}',
            ':redeemed_at' => $nowTs,
            ':code' => $codeUpper,
        ]);

        $walletPass = null;
        if ($passKind === 'evento' || str_starts_with($passItemId, 'policia_')) {
            $walletPass = grantEventoOrderRewards($pdo, 'PASS_' . $codeUpper, $passItemId, $finalOwnerPid, $arroba, $nowTs);
        }

        $pdo->exec('COMMIT');
        $inTx = false;

        respondJson(200, [
            'ok' => true,
            'creator' => false,
            'badge' => 'vip',
            'pass' => [
                'code' => (string)$passRow['code'],
                'kind' => $passKind,
                'item_id' => $passItemId,
                'metadata' => $meta,
            ],
            'owned_lot' => $ownedLot,
            'wallet' => $walletPass,
        ]);
    }

    // -------------------------------------------------------------------------
    // ROTAS ADMIN (SETUP & LOGIN)
    // -------------------------------------------------------------------------

    if ($action === 'admin_status') {
        $settingsMap = loadSettingsMap($pdo);
        $pwHash = trim($settingsMap['admin_password_hash'] ?? '');
        $needsSetup = ($pwHash === '');
        $token = extractAdminToken($body);
        $authenticated = (!$needsSetup && isAdminAuthenticated($pdo, $token));

        respondJson(200, [
            'ok' => true,
            'needs_setup' => $needsSetup,
            'authenticated' => $authenticated,
        ]);
    }

    if ($action === 'setup_admin') {
        if ($method !== 'POST') {
            respondError(405, 'Use POST para configurar o painel.');
        }

        $pdo->exec('BEGIN IMMEDIATE');
        $inTx = true;

        $settingsMap = loadSettingsMap($pdo);
        if (trim($settingsMap['admin_password_hash'] ?? '') !== '') {
            $pdo->exec('ROLLBACK');
            $inTx = false;
            respondError(403, 'A senha do administrador já foi configurada. Faça login.');
        }

        $rawPw = $body['password'] ?? ($body['pw'] ?? ($body['senha'] ?? ''));
        $pw = is_string($rawPw) ? $rawPw : '';
        if (strlen($pw) < 6 || strlen($pw) > 128) {
            $pdo->exec('ROLLBACK');
            $inTx = false;
            respondError(400, 'A senha deve ter no mínimo 6 caracteres.');
        }

        $hash = password_hash($pw, PASSWORD_DEFAULT);
        saveSetting($pdo, 'admin_password_hash', $hash);

        if (isset($body['pix_key_type']) && is_string($body['pix_key_type'])) {
            $kt = strtolower(trim($body['pix_key_type']));
            if (in_array($kt, ['aleatoria', 'cpf', 'cnpj', 'email', 'telefone'], true)) {
                saveSetting($pdo, 'pix_key_type', $kt);
            }
        }
        if (isset($body['pix_key']) && is_string($body['pix_key'])) {
            $cleanKey = substr(stripControlsAndCollapse($body['pix_key']), 0, 77);
            saveSetting($pdo, 'pix_key', $cleanKey);
        }
        if (isset($body['pix_name']) && is_string($body['pix_name']) && trim($body['pix_name']) !== '') {
            saveSetting($pdo, 'pix_name', toPixAscii($body['pix_name'], 25, 'ELTON CARAGUA PIXEL'));
        }
        if (isset($body['pix_city']) && is_string($body['pix_city']) && trim($body['pix_city']) !== '') {
            saveSetting($pdo, 'pix_city', toPixAscii($body['pix_city'], 15, 'CARAGUATATUBA'));
        }

        // mp_access_token opcional no setup
        if (isset($body['mp_access_token']) && is_string($body['mp_access_token'])) {
            $rawMpTokSetup = trim($body['mp_access_token']);
            if (
                (str_starts_with($rawMpTokSetup, 'APP_USR-') || str_starts_with($rawMpTokSetup, 'TEST-'))
                && !str_contains($rawMpTokSetup, '*')
            ) {
                saveSetting($pdo, 'mp_access_token', $rawMpTokSetup);
            }
        }

        $token = createAdminSession($pdo);

        $pdo->exec('COMMIT');
        $inTx = false;

        respondJson(200, [
            'ok' => true,
            'token' => $token,
        ]);
    }

    if ($action === 'admin_login') {
        if ($method !== 'POST') {
            respondError(405, 'Use POST para login.');
        }

        $ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|cgpx_adm');
        $rateKey = 'adm_login:' . $ipHash;
        $nowMicro = microtime(true);

        $stmtRate = $pdo->prepare('SELECT last_ts FROM rate_limits WHERE k = :k LIMIT 1');
        $stmtRate->execute([':k' => $rateKey]);
        $rateRow = $stmtRate->fetch();
        if ($rateRow !== false && ($nowMicro - (float)$rateRow['last_ts']) < 1.0) {
            respondError(429, 'Aguarde um segundo antes de tentar novamente.');
        }

        $settingsMap = loadSettingsMap($pdo);
        $pwHash = trim($settingsMap['admin_password_hash'] ?? '');
        if ($pwHash === '') {
            respondError(400, 'Configure a senha inicial do administrador primeiro.', ['needs_setup' => true]);
        }

        $rawPw = $body['password'] ?? ($body['pw'] ?? ($body['senha'] ?? ''));
        $pw = is_string($rawPw) ? $rawPw : '';

        if ($pw === '' || !password_verify($pw, $pwHash)) {
            $stmtSaveRate = $pdo->prepare(
                'INSERT INTO rate_limits (k, last_ts) VALUES (:k, :last_ts)
                 ON CONFLICT(k) DO UPDATE SET last_ts = excluded.last_ts'
            );
            $stmtSaveRate->execute([':k' => $rateKey, ':last_ts' => $nowMicro]);
            respondError(401, 'Senha incorreta.');
        }

        $token = createAdminSession($pdo);
        respondJson(200, [
            'ok' => true,
            'token' => $token,
        ]);
    }

    if ($action === 'admin_logout') {
        $token = extractAdminToken($body);
        if ($token !== '') {
            $pdo->prepare('DELETE FROM admin_sessions WHERE token = :token')->execute([':token' => $token]);
        }
        respondJson(200, ['ok' => true]);
    }

    // -------------------------------------------------------------------------
    // ROTAS ADMIN AUTENTICADAS
    // -------------------------------------------------------------------------

    $adminActions = [
        'admin_dashboard',
        'admin_save_settings',
        'admin_rotate_secret',
        'admin_approve_order',
        'admin_reject_order',
        'admin_create_pass',
        'admin_delete_lot',
        'admin_policia_control',
    ];

    if (!in_array($action, $adminActions, true)) {
        respondError(400, 'Ação inválida.');
    }

    $adminToken = extractAdminToken($body);
    if (!isAdminAuthenticated($pdo, $adminToken)) {
        respondError(401, 'Sessão administrativa inválida ou expirada.', ['authenticated' => false]);
    }

    if ($action === 'admin_dashboard') {
        $settingsMap = loadSettingsMap($pdo);
        sweepPendingMpOrders($pdo, $settingsMap, 8, '');
        $prices = resolvePrices($settingsMap);
        $pixKey = $settingsMap['pix_key'] ?? '';
        $pixKeyType = $settingsMap['pix_key_type'] ?? 'aleatoria';
        $pixConfigured = (normalizePixKey($pixKey, $pixKeyType) !== '');
        $mpToken = getMpToken($settingsMap);
        $mpConfigured = ($mpToken !== '');
        $mpTokenMasked = $mpConfigured ? (substr($mpToken, 0, 12) . '***') : '';

        $onlineCount = 0;
        if (sqliteTableExists($pdo, 'players')) {
            $stmtOnline = $pdo->prepare('SELECT COUNT(*) AS cnt FROM players WHERE seen_at >= :lim');
            $stmtOnline->execute([':lim' => microtime(true) - 22.0]);
            $rowOnline = $stmtOnline->fetch();
            $onlineCount = ($rowOnline !== false && isset($rowOnline['cnt'])) ? (int)$rowOnline['cnt'] : 0;
        }

        $stmtStats = $pdo->query(
            "SELECT
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
                COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) AS total_revenue
             FROM orders"
        );
        $statsRow = ($stmtStats !== false) ? $stmtStats->fetch() : false;
        $pendingCount = ($statsRow !== false && isset($statsRow['pending_count'])) ? (int)$statsRow['pending_count'] : 0;
        $approvedCount = ($statsRow !== false && isset($statsRow['approved_count'])) ? (int)$statsRow['approved_count'] : 0;
        $totalRevenue = ($statsRow !== false && isset($statsRow['total_revenue']))
            ? round((float)$statsRow['total_revenue'], 2)
            : 0.0;

        $stmtOrders = $pdo->query(
            "SELECT * FROM orders
             ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END ASC, created_at DESC
             LIMIT 200"
        );
        $orders = [];
        if ($stmtOrders !== false) {
            foreach ($stmtOrders->fetchAll() as $o) {
                $pDecoded = json_decode((string)($o['payload_json'] ?? '{}'), true);
                $orders[] = [
                    'id' => (string)$o['id'],
                    'kind' => (string)$o['kind'],
                    'item_id' => (string)$o['item_id'],
                    'amount' => (float)$o['amount'],
                    'buyer_name' => (string)$o['buyer_name'],
                    'buyer_handle' => (string)($o['buyer_handle'] ?? ''),
                    'buyer_pid' => (string)($o['buyer_pid'] ?? ''),
                    'payload_json' => (string)($o['payload_json'] ?? '{}'),
                    'payload' => is_array($pDecoded) ? $pDecoded : [],
                    'pix_brcode' => (string)($o['pix_brcode'] ?? ''),
                    'status' => (string)$o['status'],
                    'pass_code' => (string)($o['pass_code'] ?? ''),
                    'mp_payment_id' => (string)($o['mp_payment_id'] ?? ''),
                    'created_at' => (int)$o['created_at'],
                    'updated_at' => (int)$o['updated_at'],
                ];
            }
        }

        $stmtPasses = $pdo->query('SELECT * FROM passes ORDER BY created_at DESC LIMIT 200');
        $passes = [];
        if ($stmtPasses !== false) {
            foreach ($stmtPasses->fetchAll() as $p) {
                $mDecoded = json_decode((string)($p['metadata_json'] ?? '{}'), true);
                $passes[] = [
                    'code' => (string)$p['code'],
                    'kind' => (string)$p['kind'],
                    'item_id' => (string)$p['item_id'],
                    'owner_pid' => (string)($p['owner_pid'] ?? ''),
                    'owner_name' => (string)($p['owner_name'] ?? ''),
                    'metadata_json' => (string)($p['metadata_json'] ?? '{}'),
                    'metadata' => is_array($mDecoded) ? $mDecoded : [],
                    'redeemed' => (int)($p['redeemed'] ?? 0),
                    'created_at' => (int)$p['created_at'],
                    'redeemed_at' => (int)($p['redeemed_at'] ?? 0),
                ];
            }
        }

        $stmtLojasAprovadas = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE (kind = 'loja' OR item_id = 'loja_empresa_vip') AND status = 'approved'");
        $stmtLojasAprovadas->execute();
        $lojasAprovadas = (int)$stmtLojasAprovadas->fetchColumn();
        $vagasEmpresasRestantes = max(1, 20 - $lojasAprovadas);

        $policiaEventAdmin = null;
        $policiaXerifeAdmin = null;
        if (sqliteTableExists($pdo, 'game_state')) {
            $stmtPol = $pdo->prepare("SELECT val FROM game_state WHERE key = 'policia_event' LIMIT 1");
            $stmtPol->execute();
            $rPol = $stmtPol->fetch();
            if ($rPol !== false && is_string($rPol['val'] ?? null)) {
                $dPol = json_decode($rPol['val'], true);
                if (is_array($dPol)) {
                    $policiaEventAdmin = $dPol;
                }
            }
            $stmtXer = $pdo->prepare("SELECT val FROM game_state WHERE key = 'policia_xerife' LIMIT 1");
            $stmtXer->execute();
            $rXer = $stmtXer->fetch();
            if ($rXer !== false && is_string($rXer['val'] ?? null)) {
                $dXer = json_decode($rXer['val'], true);
                if (is_array($dXer)) {
                    $policiaXerifeAdmin = $dXer;
                }
            }
        }
        $policiaAuto21 = (($settingsMap['policia_auto_21h'] ?? '1') !== '0');
        $policiaDurMin = (int)round(clampInt($settingsMap['policia_duration_s'] ?? 600, 180, 1800, 600) / 60);
        $policiaNpcCount = clampInt($settingsMap['policia_npc_count'] ?? 18, 8, 28, 18);

        respondJson(200, [
            'ok' => true,
            'settings' => [
                'pix_key' => $pixKey,
                'pix_key_type' => $pixKeyType,
                'pix_name' => $settingsMap['pix_name'] ?? 'ELTON CARAGUA PIXEL',
                'pix_city' => $settingsMap['pix_city'] ?? 'CARAGUATATUBA',
                'pix_configured' => $pixConfigured,
                'creator_secret' => $settingsMap['creator_secret'] ?? '',
                'prices' => $prices,
                'mp_configured' => $mpConfigured,
                'mp_token_masked' => $mpTokenMasked,
                'whatsapp_vip_url' => $settingsMap['whatsapp_vip_url'] ?? '',
            ],
            'policia' => [
                'now' => (int)time(),
                'event' => $policiaEventAdmin,
                'xerife' => $policiaXerifeAdmin,
                'config' => [
                    'auto_21h' => $policiaAuto21,
                    'duration_min' => $policiaDurMin,
                    'npc_count' => $policiaNpcCount,
                ],
            ],
            'catalog' => buildCatalogList($prices),
            'orders' => $orders,
            'passes' => $passes,
            'owned_lots' => fetchAllOwnedLots($pdo),
            'vagas_empresas' => [
                'total' => 20,
                'ocupadas' => $lojasAprovadas,
                'restantes' => $vagasEmpresasRestantes,
            ],
            'stats' => [
                'online_count' => $onlineCount,
                'pending_count' => $pendingCount,
                'approved_count' => $approvedCount,
                'total_revenue' => $totalRevenue,
            ],
        ]);
    }

    if ($action === 'admin_save_settings' || $action === 'admin_rotate_secret') {
        if ($method !== 'POST') {
            respondError(405, 'Use POST para salvar configurações.');
        }

        $pdo->exec('BEGIN IMMEDIATE');
        $inTx = true;

        $settingsMap = loadSettingsMap($pdo);
        $currentPrices = resolvePrices($settingsMap);

        if (array_key_exists('pix_key_type', $body) && is_string($body['pix_key_type'])) {
            $kt = strtolower(trim($body['pix_key_type']));
            if (in_array($kt, ['aleatoria', 'cpf', 'cnpj', 'email', 'telefone'], true)) {
                saveSetting($pdo, 'pix_key_type', $kt);
            }
        }

        if (array_key_exists('pix_key', $body) && is_scalar($body['pix_key'])) {
            $cleanKey = substr(stripControlsAndCollapse((string)$body['pix_key']), 0, 77);
            saveSetting($pdo, 'pix_key', $cleanKey);
        }

        if (array_key_exists('pix_name', $body) && is_scalar($body['pix_name'])) {
            $nameClean = toPixAscii((string)$body['pix_name'], 25, 'ELTON CARAGUA PIXEL');
            saveSetting($pdo, 'pix_name', $nameClean);
        }

        if (array_key_exists('pix_city', $body) && is_scalar($body['pix_city'])) {
            $cityClean = toPixAscii((string)$body['pix_city'], 15, 'CARAGUATATUBA');
            saveSetting($pdo, 'pix_city', $cityClean);
        }

        if (array_key_exists('whatsapp_vip_url', $body) && is_scalar($body['whatsapp_vip_url'])) {
            $waUrlClean = trim(stripControlsAndCollapse((string)$body['whatsapp_vip_url']));
            saveSetting($pdo, 'whatsapp_vip_url', substr($waUrlClean, 0, 240));
        }

        if (isset($body['prices']) && is_array($body['prices'])) {
            foreach ($currentPrices as $itemId => $oldPrice) {
                if (array_key_exists($itemId, $body['prices']) && is_numeric($body['prices'][$itemId])) {
                    $val = round((float)$body['prices'][$itemId], 2);
                    if (is_finite($val) && $val >= 0.50 && $val <= 99999.99) {
                        $currentPrices[$itemId] = $val;
                    }
                }
            }
            $pricesJson = json_encode($currentPrices, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($pricesJson !== false) {
                saveSetting($pdo, 'prices_json', $pricesJson);
            }
        }

        $rawNewPw = $body['password'] ?? ($body['new_password'] ?? ($body['nova_senha'] ?? ''));
        if (is_string($rawNewPw) && $rawNewPw !== '') {
            if (strlen($rawNewPw) < 6 || strlen($rawNewPw) > 128) {
                $pdo->exec('ROLLBACK');
                $inTx = false;
                respondError(400, 'A nova senha deve ter pelo menos 6 caracteres.');
            }
            saveSetting($pdo, 'admin_password_hash', password_hash($rawNewPw, PASSWORD_DEFAULT));
        }

        if ($action === 'admin_rotate_secret' || !empty($body['rotate_secret'])) {
            $newSecret = generateCreatorSecret();
            saveSetting($pdo, 'creator_secret', $newSecret);
        }

        // mp_access_token: limpar ou salvar (nunca expor token mascarado de volta)
        if (!empty($body['clear_mp_token'])) {
            saveSetting($pdo, 'mp_access_token', '');
        } elseif (isset($body['mp_access_token']) && is_string($body['mp_access_token'])) {
            $rawMpTok = trim($body['mp_access_token']);
            if (
                (str_starts_with($rawMpTok, 'APP_USR-') || str_starts_with($rawMpTok, 'TEST-'))
                && !str_contains($rawMpTok, '*')
            ) {
                saveSetting($pdo, 'mp_access_token', $rawMpTok);
            }
        }

        $updatedMap = loadSettingsMap($pdo);
        $updatedPrices = resolvePrices($updatedMap);

        // Atualiza BRCode apenas de pedidos manuais pendentes (não sobrescreve QR Code do Mercado Pago)
        $stmtPending = $pdo->query("SELECT id, amount FROM orders WHERE status = 'pending' AND mp_payment_id = ''");
        if ($stmtPending !== false) {
            $stmtUpdPix = $pdo->prepare('UPDATE orders SET pix_brcode = :brcode, updated_at = :ts WHERE id = :id');
            $nowTs = (int)time();
            foreach ($stmtPending->fetchAll() as $po) {
                $newBr = buildPixBrCode($updatedMap, (float)$po['amount'], (string)$po['id']);
                $stmtUpdPix->execute([
                    ':brcode' => $newBr,
                    ':ts' => $nowTs,
                    ':id' => (string)$po['id'],
                ]);
            }
        }

        $pdo->exec('COMMIT');
        $inTx = false;

        $pixConfigured = (normalizePixKey(
            $updatedMap['pix_key'] ?? '',
            $updatedMap['pix_key_type'] ?? 'aleatoria'
        ) !== '');

        respondJson(200, [
            'ok' => true,
            'creator_secret' => $updatedMap['creator_secret'] ?? '',
            'settings' => [
                'pix_key' => $updatedMap['pix_key'] ?? '',
                'pix_key_type' => $updatedMap['pix_key_type'] ?? 'aleatoria',
                'pix_name' => $updatedMap['pix_name'] ?? 'ELTON CARAGUA PIXEL',
                'pix_city' => $updatedMap['pix_city'] ?? 'CARAGUATATUBA',
                'pix_configured' => $pixConfigured,
                'creator_secret' => $updatedMap['creator_secret'] ?? '',
                'prices' => $updatedPrices,
                'mp_configured' => (getMpToken($updatedMap) !== ''),
                'mp_token_masked' => (getMpToken($updatedMap) !== '')
                    ? (substr(getMpToken($updatedMap), 0, 12) . '***')
                    : '',
            ],
        ]);
    }

    if ($action === 'admin_approve_order') {
        if ($method !== 'POST') {
            respondError(405, 'Use POST para aprovar pedido.');
        }

        $orderId = cleanIdSlug($body['id'] ?? ($body['order_id'] ?? ($_GET['id'] ?? '')), 48);
        if ($orderId === '') {
            respondError(400, 'ID do pedido inválido.');
        }

        $pdo->exec('BEGIN IMMEDIATE');
        $inTx = true;

        $stmtOrder = $pdo->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
        $stmtOrder->execute([':id' => $orderId]);
        $order = $stmtOrder->fetch();

        if ($order === false) {
            $pdo->exec('ROLLBACK');
            $inTx = false;
            respondError(404, 'Pedido não encontrado.');
        }

        $approveResult = approveOrderIdempotent($pdo, $order);

        $pdo->exec('COMMIT');
        $inTx = false;

        respondJson(200, [
            'ok' => true,
            'id' => $orderId,
            'status' => 'approved',
            'pass_code' => $approveResult['pass_code'],
            'owned_lot' => $approveResult['owned_lot'],
        ]);
    }

    if ($action === 'admin_reject_order') {
        if ($method !== 'POST') {
            respondError(405, 'Use POST para rejeitar pedido.');
        }

        $orderId = cleanIdSlug($body['id'] ?? ($body['order_id'] ?? ($_GET['id'] ?? '')), 48);
        if ($orderId === '') {
            respondError(400, 'ID do pedido inválido.');
        }

        $stmtOrder = $pdo->prepare('SELECT id, status FROM orders WHERE id = :id LIMIT 1');
        $stmtOrder->execute([':id' => $orderId]);
        $order = $stmtOrder->fetch();
        if ($order === false) {
            respondError(404, 'Pedido não encontrado.');
        }

        $stmtUpd = $pdo->prepare("UPDATE orders SET status = 'rejected', updated_at = :ts WHERE id = :id");
        $stmtUpd->execute([
            ':ts' => (int)time(),
            ':id' => $orderId,
        ]);

        respondJson(200, [
            'ok' => true,
            'id' => $orderId,
            'status' => 'rejected',
        ]);
    }

    if ($action === 'admin_create_pass') {
        if ($method !== 'POST') {
            respondError(405, 'Use POST para criar passe VIP.');
        }

        $resolved = resolveCatalogItem($body['item_id'] ?? ($body['item'] ?? ''), $body['kind'] ?? '');
        if ($resolved === null) {
            respondError(400, 'Selecione um item válido do catálogo.');
        }

        $itemId = $resolved['item_id'];
        $kind = $resolved['kind'];
        $buyerName = cleanNome($body['buyer_name'] ?? ($body['owner_name'] ?? ($body['nome'] ?? '')), 'Convidado VIP');
        $buyerHandle = cleanArroba($body['buyer_handle'] ?? ($body['arroba'] ?? ''));

        $rawCustom = $body['custom_code'] ?? ($body['code'] ?? '');
        $customClean = '';
        if (is_scalar($rawCustom) && trim((string)$rawCustom) !== '') {
            $customClean = strtoupper(preg_replace('/[^A-Za-z0-9-]/', '', trim((string)$rawCustom)) ?? '');
            if (strlen($customClean) < 4 || strlen($customClean) > 32) {
                respondError(400, 'O código personalizado deve ter entre 4 e 32 caracteres alfanuméricos.');
            }
        }

        $rawMeta = (isset($body['metadata']) && is_array($body['metadata'])) ? $body['metadata'] : [];
        foreach (['lot_id', 'lotId', 'style', 'color', 'title', 'door_room', 'x', 'z', 'rot'] as $kTop) {
            if (!array_key_exists($kTop, $rawMeta) && array_key_exists($kTop, $body)) {
                $rawMeta[$kTop] = $body[$kTop];
            }
        }

        $pdo->exec('BEGIN IMMEDIATE');
        $inTx = true;

        if ($customClean !== '') {
            $stmtChk = $pdo->prepare('SELECT 1 FROM passes WHERE code = :code LIMIT 1');
            $stmtChk->execute([':code' => $customClean]);
            if ($stmtChk->fetch() !== false) {
                $pdo->exec('ROLLBACK');
                $inTx = false;
                respondError(409, 'Já existe um passe cadastrado com esse código.');
            }
            $code = $customClean;
        } else {
            $code = generatePassCode($pdo);
        }

        $meta = enrichPassMetadata($kind, $itemId, $rawMeta, $buyerName, $buyerHandle);
        $ownedLot = null;
        if (isset($meta['lot_id']) || isset($meta['lotId'])) {
            $ownedLot = ensureOwnedLotFromMetadata($pdo, $meta, $buyerName, $buyerHandle, $itemId, 'PASS-' . $code);
        }

        $nowTs = (int)time();
        $metaJson = json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $stmtIns = $pdo->prepare(
            "INSERT INTO passes (
                code, kind, item_id, owner_pid, owner_name,
                metadata_json, redeemed, created_at, redeemed_at
            ) VALUES (
                :code, :kind, :item_id, '', :owner_name,
                :metadata_json, 0, :created_at, 0
            )"
        );
        $stmtIns->execute([
            ':code' => $code,
            ':kind' => $kind,
            ':item_id' => $itemId,
            ':owner_name' => $buyerName,
            ':metadata_json' => ($metaJson !== false) ? $metaJson : '{}',
            ':created_at' => $nowTs,
        ]);

        $pdo->exec('COMMIT');
        $inTx = false;

        respondJson(200, [
            'ok' => true,
            'code' => $code,
            'pass_code' => $code,
            'owned_lot' => $ownedLot,
            'pass' => [
                'code' => $code,
                'kind' => $kind,
                'item_id' => $itemId,
                'owner_pid' => '',
                'owner_name' => $buyerName,
                'metadata' => $meta,
                'redeemed' => 0,
                'created_at' => $nowTs,
                'redeemed_at' => 0,
            ],
        ]);
    }

    if ($action === 'admin_delete_lot') {
        if ($method !== 'POST') {
            respondError(405, 'Use POST para remover lote.');
        }

        $lotId = cleanIdSlug($body['lot_id'] ?? ($body['id'] ?? ($_GET['lot_id'] ?? '')), 48);
        if ($lotId === '') {
            respondError(400, 'lot_id inválido.');
        }

        $stmtDel = $pdo->prepare('DELETE FROM owned_lots WHERE lot_id = :lot_id');
        $stmtDel->execute([':lot_id' => $lotId]);

        respondJson(200, [
            'ok' => true,
            'lot_id' => $lotId,
            'deleted' => ($stmtDel->rowCount() > 0),
        ]);
    }

    if ($action === 'admin_policia_control') {
        if ($method !== 'POST') {
            respondError(405, 'Use POST para controlar evento.');
        }

        $op = is_string($body['op'] ?? null) ? strtolower(trim((string)$body['op'])) : '';
        if (!in_array($op, ['start', 'stop', 'clear_xerife', 'save_config'], true)) {
            respondError(400, 'Operação do evento inválida.');
        }

        $nowTs = (int)time();
        $tz = new DateTimeZone('America/Sao_Paulo');
        $todayStr = (new DateTimeImmutable('@' . $nowTs))->setTimezone($tz)->format('Y-m-d');

        $pdo->exec('BEGIN IMMEDIATE');
        $inTx = true;

        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS game_state (
                key TEXT PRIMARY KEY,
                val TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            )'
        );

        $settingsMap = loadSettingsMap($pdo);
        $auto21 = array_key_exists('auto_21h', $body)
            ? (!empty($body['auto_21h']) && $body['auto_21h'] !== '0' && $body['auto_21h'] !== 'false')
            : (($settingsMap['policia_auto_21h'] ?? '1') !== '0');
        $durMin = array_key_exists('duration_min', $body)
            ? clampInt($body['duration_min'], 3, 30, 10)
            : (int)round(clampInt($settingsMap['policia_duration_s'] ?? 600, 180, 1800, 600) / 60);
        $npcCount = array_key_exists('npc_count', $body)
            ? clampInt($body['npc_count'], 8, 28, 18)
            : clampInt($settingsMap['policia_npc_count'] ?? 18, 8, 28, 18);
        $durS = $durMin * 60;

        if ($op === 'save_config' || $op === 'start') {
            saveSetting($pdo, 'policia_auto_21h', $auto21 ? '1' : '0');
            saveSetting($pdo, 'policia_duration_s', (string)$durS);
            saveSetting($pdo, 'policia_npc_count', (string)$npcCount);
        }

        $loadEv = static function () use ($pdo): array {
            $s = $pdo->prepare("SELECT val FROM game_state WHERE key = 'policia_event' LIMIT 1");
            $s->execute();
            $r = $s->fetch();
            $d = ($r !== false && is_string($r['val'] ?? null)) ? json_decode($r['val'], true) : null;
            return is_array($d) ? $d : [];
        };
        $saveEv = static function (array $evData) use ($pdo, $nowTs): void {
            $j = json_encode($evData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $pdo->prepare(
                "INSERT INTO game_state (key, val, updated_at) VALUES ('policia_event', :v, :u)
                 ON CONFLICT(key) DO UPDATE SET val = excluded.val, updated_at = excluded.updated_at"
            )->execute([':v' => ($j !== false ? $j : '{}'), ':u' => $nowTs]);
        };
        $postAviso = static function (string $txt) use ($pdo, $nowTs): void {
            if (!sqliteTableExists($pdo, 'messages')) {
                return;
            }
            $pdo->prepare(
                'INSERT INTO messages (pid, nome, arroba, cor, texto, x, z, ts, room)
                 VALUES (:pid, :nome, :arroba, :cor, :texto, :x, :z, :ts, :room)'
            )->execute([
                ':pid' => 'sistema_policia',
                ':nome' => '🚨 Polícia e Ladrão',
                ':arroba' => '',
                ':cor' => '#1d4ed8',
                ':texto' => utf8Substr($txt, 180),
                ':x' => 33.0,
                ':z' => -13.0,
                ':ts' => $nowTs,
                ':room' => '',
            ]);
        };

        $evOut = $loadEv();
        if ($op === 'start') {
            $seed = random_int(10000, 9999999);
            $evOut = [
                'status' => 'active',
                'round_id' => 'manual_' . $nowTs,
                'mode' => 'manual',
                'started_at' => $nowTs,
                'ends_at' => $nowTs + $durS,
                'seed' => $seed,
                'npc_count' => $npcCount,
                'captured' => [],
                'scores' => [],
                'pvp' => [],
                'shots' => [],
                'winner' => null,
                'skipped_date' => '',
            ];
            $saveEv($evOut);
            $postAviso('🚨 FUGA NA CADEIA 79! Operação Polícia e Ladrão começou! O sistema dividiu Polícia x Ladrão com 5 vidas, barra de HP e pistolinhas de água!');
        } elseif ($op === 'stop') {
            $evCur = $loadEv();
            $scores = (isset($evCur['scores']) && is_array($evCur['scores'])) ? $evCur['scores'] : [];
            $board = [];
            foreach ($scores as $sPid => $entry) {
                if (!is_array($entry)) {
                    continue;
                }
                $pts = max(0, (int)($entry['pts'] ?? 0));
                $caps = max(0, (int)($entry['captures'] ?? 0));
                if ($pts <= 0 && $caps <= 0) {
                    continue;
                }
                $board[] = [
                    'pid' => (string)$sPid,
                    'nome' => (string)($entry['nome'] ?? 'Policial'),
                    'arroba' => (string)($entry['arroba'] ?? ''),
                    'pts' => $pts,
                    'captures' => $caps,
                    'last_ts' => (int)($entry['last_ts'] ?? 0),
                ];
            }
            usort($board, static fn(array $a, array $b): int => ($b['pts'] <=> $a['pts']) ?: ($b['captures'] <=> $a['captures']) ?: ($a['last_ts'] <=> $b['last_ts']));
            $coroar = !empty($body['finalize']) && !empty($board) && (int)$board[0]['captures'] >= 1;
            if ($coroar) {
                $winner = [
                    'pid' => $board[0]['pid'],
                    'nome' => $board[0]['nome'],
                    'arroba' => $board[0]['arroba'],
                    'pts' => $board[0]['pts'],
                    'captures' => $board[0]['captures'],
                    'round_id' => (string)($evCur['round_id'] ?? ''),
                    'won_at' => $nowTs,
                ];
                $wJson = json_encode($winner, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $pdo->prepare(
                    "INSERT INTO game_state (key, val, updated_at) VALUES ('policia_xerife', :v, :u)
                     ON CONFLICT(key) DO UPDATE SET val = excluded.val, updated_at = excluded.updated_at"
                )->execute([':v' => ($wJson !== false ? $wJson : '{}'), ':u' => $nowTs]);
                $evOut = array_merge($evCur, [
                    'status' => 'finished',
                    'finished_at' => $nowTs,
                    'winner' => $winner,
                    'skipped_date' => $todayStr,
                ]);
                $saveEv($evOut);
                $who = $winner['nome'] . ($winner['arroba'] !== '' ? (' (@' . $winner['arroba'] . ')') : '');
                $postAviso('🚓 DESTAQUE DA NOITE! ' . $who . ' é o novo Xerife da Noite com ' . $winner['pts'] . ' pts (' . $winner['captures'] . ' prisões)!');
            } else {
                $evOut = [
                    'status' => 'idle',
                    'round_id' => (string)($evCur['round_id'] ?? ''),
                    'started_at' => 0,
                    'ends_at' => 0,
                    'seed' => 0,
                    'npc_count' => $npcCount,
                    'captured' => [],
                    'scores' => [],
                    'winner' => null,
                    'skipped_date' => $todayStr,
                ];
                $saveEv($evOut);
                $postAviso('🌅 Operação Polícia e Ladrão encerrada pela prefeitura.');
            }
        } elseif ($op === 'clear_xerife') {
            $pdo->exec("DELETE FROM game_state WHERE key = 'policia_xerife'");
        }

        $stmtXer = $pdo->prepare("SELECT val FROM game_state WHERE key = 'policia_xerife' LIMIT 1");
        $stmtXer->execute();
        $rXer = $stmtXer->fetch();
        $xerOut = ($rXer !== false && is_string($rXer['val'] ?? null)) ? json_decode($rXer['val'], true) : null;

        $pdo->exec('COMMIT');
        $inTx = false;

        respondJson(200, [
            'ok' => true,
            'policia' => [
                'now' => $nowTs,
                'event' => $evOut,
                'xerife' => is_array($xerOut) ? $xerOut : null,
                'config' => [
                    'auto_21h' => $auto21,
                    'duration_min' => $durMin,
                    'npc_count' => $npcCount,
                ],
            ],
        ]);
    }

    respondError(400, 'Ação inválida.');
} catch (Throwable $e) {
    if ($inTx && $pdo instanceof PDO) {
        try {
            $pdo->exec('ROLLBACK');
        } catch (Throwable) {
        }
    }
    respondError(500, 'Erro interno na API de economia.');
}
