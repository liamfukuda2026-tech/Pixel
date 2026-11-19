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
    echo ($json !== false) ? $json : '{"ok":false,"erro":"Erro interno no chat"}';
    exit;
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

function cleanNome(mixed $raw): string
{
    $s = is_scalar($raw) ? (string)$raw : '';
    $s = trim(utf8Substr(stripControlsAndCollapse($s), 24));
    return ($s !== '') ? $s : 'Visitante';
}

function cleanArroba(mixed $raw): string
{
    $s = is_scalar($raw) ? (string)$raw : '';
    $s = ltrim(trim($s), '@');
    $s = preg_replace('/[^a-zA-Z0-9._]/', '', $s) ?? '';
    return substr($s, 0, 30);
}

function cleanRoom(mixed $raw): string
{
    if (!is_scalar($raw)) {
        return '';
    }
    $s = trim((string)$raw);
    $s = preg_replace('/[^a-zA-Z0-9_-]/', '', $s) ?? '';
    return substr($s, 0, 40);
}

function cleanEmote(mixed $raw): string
{
    if (!is_scalar($raw)) {
        return '';
    }
    $s = trim(utf8Substr(stripControlsAndCollapse((string)$raw), 16));
    $s = preg_replace('/[^a-zA-Z0-9_-]/', '', $s) ?? '';
    return substr($s, 0, 16);
}

function cleanCarType(mixed $raw): string
{
    if (!is_scalar($raw)) {
        return '';
    }
    $v = strtolower(trim((string)$raw));
    return in_array($v, ['', 'moto', 'bugue', 'esportivo', 'caminhonete', 'jetski', 'viatura'], true) ? $v : '';
}

function cleanRideOf(mixed $raw, string $selfPid): string
{
    if (!is_scalar($raw)) {
        return '';
    }
    $v = trim((string)$raw);
    if ($v === '' || $v === $selfPid) {
        return '';
    }
    if (preg_match('/^[a-zA-Z0-9_-]{1,48}\z/', $v) !== 1) {
        return '';
    }
    return $v;
}

function cleanProfissao(mixed $raw): string
{
    if (!is_scalar($raw)) {
        return '';
    }
    $s = trim(utf8Substr(stripControlsAndCollapse((string)$raw), 32));
    if ($s === '') {
        return '';
    }
    return filterProfanity($s);
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
    $f = (float)$val;
    if (!is_finite($f)) {
        return $default;
    }
    $i = (int)$f;
    if ($i < $min) {
        return $min;
    }
    if ($i > $max) {
        return $max;
    }
    return $i;
}

function toFlag(mixed $val): int
{
    if (is_bool($val)) {
        return $val ? 1 : 0;
    }
    if (is_int($val) || is_float($val)) {
        return ((int)$val !== 0) ? 1 : 0;
    }
    if (is_string($val)) {
        $v = strtolower(trim($val));
        if ($v === '' || $v === '0' || $v === 'false' || $v === 'no' || $v === 'off') {
            return 0;
        }
        return 1;
    }
    return 0;
}

function clampColor(mixed $val, int $default): int
{
    if (is_int($val)) {
        $c = $val;
    } elseif (is_float($val) && is_finite($val)) {
        $c = (int)$val;
    } elseif (is_string($val)) {
        $trimmed = trim($val);
        if (preg_match('/^-?\d+\z/', $trimmed)) {
            $c = (int)$trimmed;
        } elseif (preg_match('/^#([0-9a-fA-F]{6})\z/', $trimmed, $m)) {
            $c = (int)hexdec($m[1]);
        } elseif (preg_match('/^0x([0-9a-fA-F]{1,6})\z/i', $trimmed, $m)) {
            $c = (int)hexdec($m[1]);
        } else {
            return $default;
        }
    } else {
        return $default;
    }

    if ($c < 0) {
        return 0;
    }
    if ($c > 0xffffff) {
        return 0xffffff;
    }
    return $c;
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

function isValidPid(mixed $pid): bool
{
    return is_string($pid) && preg_match('/^[a-zA-Z0-9_-]{8,48}\z/', $pid) === 1;
}

function isValidToken(mixed $token): bool
{
    return is_string($token) && strlen($token) >= 12 && strlen($token) <= 256;
}

/**
 * Garante migração idempotente de colunas via PRAGMA table_info.
 *
 * @param array<string, string> $columnsMap
 */
function ensureTableColumns(PDO $pdo, string $table, array $columnsMap): void
{
    if (!in_array($table, ['players', 'messages'], true)) {
        return;
    }
    $stmt = $pdo->query("PRAGMA table_info({$table})");
    $existing = [];
    if ($stmt !== false) {
        foreach ($stmt->fetchAll() as $col) {
            if (isset($col['name']) && is_string($col['name'])) {
                $existing[strtolower($col['name'])] = true;
            }
        }
    }
    foreach ($columnsMap as $colName => $colDef) {
        if (!isset($existing[strtolower($colName)])) {
            $pdo->exec("ALTER TABLE {$table} ADD COLUMN {$colName} {$colDef}");
        }
    }
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
        "CREATE TABLE IF NOT EXISTS players (
            pid TEXT PRIMARY KEY,
            secret TEXT NOT NULL,
            nome TEXT NOT NULL,
            arroba TEXT NOT NULL DEFAULT '',
            x REAL NOT NULL,
            z REAL NOT NULL,
            ry REAL NOT NULL,
            andando INTEGER NOT NULL DEFAULT 0,
            fem INTEGER NOT NULL DEFAULT 0,
            pele INTEGER NOT NULL,
            cabelo INTEGER NOT NULL,
            camisa INTEGER NOT NULL,
            calca INTEGER NOT NULL,
            sapato INTEGER NOT NULL,
            seen_at REAL NOT NULL,
            ip_hash TEXT NOT NULL DEFAULT '',
            jump REAL DEFAULT 0,
            emote TEXT DEFAULT '',
            car_type TEXT DEFAULT '',
            ride_of TEXT DEFAULT '',
            room TEXT DEFAULT '',
            profissao TEXT DEFAULT '',
            badge TEXT DEFAULT ''
        )"
    );
    ensureTableColumns($pdo, 'players', [
        'jump' => 'REAL DEFAULT 0',
        'emote' => "TEXT DEFAULT ''",
        'car_type' => "TEXT DEFAULT ''",
        'ride_of' => "TEXT DEFAULT ''",
        'room' => "TEXT DEFAULT ''",
        'profissao' => "TEXT DEFAULT ''",
        'badge' => "TEXT DEFAULT ''",
    ]);
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_players_seen_at ON players(seen_at)');

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pid TEXT NOT NULL,
            nome TEXT NOT NULL,
            arroba TEXT NOT NULL DEFAULT '',
            cor TEXT NOT NULL DEFAULT '#1f8a9e',
            texto TEXT NOT NULL,
            x REAL NOT NULL DEFAULT 0,
            z REAL NOT NULL DEFAULT 28,
            ts INTEGER NOT NULL,
            room TEXT DEFAULT ''
        )"
    );
    ensureTableColumns($pdo, 'messages', [
        'room' => "TEXT DEFAULT ''",
    ]);
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room, id)');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS rate_limits (
            k TEXT PRIMARY KEY,
            last_ts REAL NOT NULL
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS game_state (
            key TEXT PRIMARY KEY,
            val TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        )'
    );

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

    return $pdo;
}

function sqliteTableExists(PDO $pdo, string $tableName): bool
{
    $stmt = $pdo->prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = :name LIMIT 1");
    $stmt->execute([':name' => $tableName]);
    return $stmt->fetch() !== false;
}

function isCurrentPoliciaXerife(PDO $pdo, string $pid, string $arroba): bool
{
    $stmt = $pdo->prepare("SELECT val FROM game_state WHERE key = 'policia_xerife' LIMIT 1");
    $stmt->execute();
    $row = $stmt->fetch();
    if ($row === false || !isset($row['val']) || !is_string($row['val'])) {
        return false;
    }
    $dec = json_decode($row['val'], true);
    if (!is_array($dec)) {
        return false;
    }
    $winPid = isset($dec['pid']) && is_string($dec['pid']) ? $dec['pid'] : '';
    $winArr = isset($dec['arroba']) && is_string($dec['arroba']) ? strtolower(trim($dec['arroba'])) : '';
    if ($winPid !== '' && hash_equals($winPid, $pid)) {
        return true;
    }
    if ($winArr !== '' && $arroba !== '' && strtolower(trim($arroba)) === $winArr) {
        return true;
    }
    return false;
}

function resolveBadge(PDO $pdo, string $pid, string $arroba, mixed $rawBadge, mixed $rawCreatorKey): string
{
    if (!is_scalar($rawBadge)) {
        $badge = '';
    } else {
        $badge = strtolower(trim((string)$rawBadge));
    }

    if ($badge === 'criador') {
        $creatorKey = is_scalar($rawCreatorKey) ? trim((string)$rawCreatorKey) : '';
        if ($creatorKey !== '' && sqliteTableExists($pdo, 'settings')) {
            $stmtSecret = $pdo->prepare("SELECT v FROM settings WHERE k = 'creator_secret' LIMIT 1");
            $stmtSecret->execute();
            $row = $stmtSecret->fetch();
            $dbSecret = ($row !== false && isset($row['v']) && is_string($row['v'])) ? trim($row['v']) : '';
            if ($dbSecret !== '' && hash_equals($dbSecret, $creatorKey)) {
                return 'criador';
            }
        }
    }

    if (isCurrentPoliciaXerife($pdo, $pid, $arroba)) {
        return 'xerife';
    }

    if (in_array($badge, ['', 'coroa', 'vip'], true)) {
        return $badge;
    }

    if ($badge === 'criador' && sqliteTableExists($pdo, 'passes')) {
        $stmtPass = $pdo->prepare('SELECT 1 FROM passes WHERE owner_pid = :pid AND redeemed = 1 LIMIT 1');
        $stmtPass->execute([':pid' => $pid]);
        if ($stmtPass->fetch() !== false) {
            return 'vip';
        }
    }

    return '';
}

function getSettingVal(PDO $pdo, string $k, string $default = ''): string
{
    if (!sqliteTableExists($pdo, 'settings')) {
        return $default;
    }
    $stmt = $pdo->prepare('SELECT v FROM settings WHERE k = :k LIMIT 1');
    $stmt->execute([':k' => $k]);
    $row = $stmt->fetch();
    return ($row !== false && isset($row['v']) && is_string($row['v'])) ? $row['v'] : $default;
}

function getPoliciaSettings(PDO $pdo): array
{
    $auto = getSettingVal($pdo, 'policia_auto_21h', '1') !== '0';
    $durS = clampInt(getSettingVal($pdo, 'policia_duration_s', '600'), 180, 1800, 600);
    $npcCount = clampInt(getSettingVal($pdo, 'policia_npc_count', '18'), 8, 28, 18);
    return [
        'auto_21h' => $auto,
        'duration_s' => $durS,
        'npc_count' => $npcCount,
    ];
}

function getPoliciaXerife(PDO $pdo): ?array
{
    $stmt = $pdo->prepare("SELECT val FROM game_state WHERE key = 'policia_xerife' LIMIT 1");
    $stmt->execute();
    $row = $stmt->fetch();
    if ($row === false || !isset($row['val']) || !is_string($row['val'])) {
        return null;
    }
    $dec = json_decode($row['val'], true);
    if (!is_array($dec) || empty($dec['nome'])) {
        return null;
    }
    return [
        'pid' => (string)($dec['pid'] ?? ''),
        'nome' => cleanNome($dec['nome']),
        'arroba' => cleanArroba($dec['arroba'] ?? ''),
        'pts' => max(0, (int)($dec['pts'] ?? 0)),
        'captures' => max(0, (int)($dec['captures'] ?? 0)),
        'round_id' => (string)($dec['round_id'] ?? ''),
        'won_at' => (int)($dec['won_at'] ?? 0),
    ];
}

function postPoliciaChatAviso(PDO $pdo, string $texto, int $ts): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO messages (pid, nome, arroba, cor, texto, x, z, ts, room)
         VALUES (:pid, :nome, :arroba, :cor, :texto, :x, :z, :ts, :room)'
    );
    $stmt->execute([
        ':pid' => 'sistema_policia',
        ':nome' => '🚨 Polícia e Ladrão',
        ':arroba' => '',
        ':cor' => '#1d4ed8',
        ':texto' => utf8Substr($texto, 180),
        ':x' => 33.0,
        ':z' => -13.0,
        ':ts' => $ts,
        ':room' => '',
    ]);
}

function computePoliciaLeaderboard(array $scores): array
{
    $rows = [];
    foreach ($scores as $sPid => $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $pts = max(0, (int)($entry['pts'] ?? 0));
        $caps = max(0, (int)($entry['captures'] ?? 0));
        if ($pts <= 0 && $caps <= 0) {
            continue;
        }
        $rows[] = [
            'pid' => (string)$sPid,
            'nome' => cleanNome($entry['nome'] ?? 'Policial'),
            'arroba' => cleanArroba($entry['arroba'] ?? ''),
            'pts' => $pts,
            'captures' => $caps,
            'last_ts' => (int)($entry['last_ts'] ?? 0),
        ];
    }
    usort($rows, static function (array $a, array $b): int {
        if ($b['pts'] !== $a['pts']) {
            return $b['pts'] <=> $a['pts'];
        }
        if ($b['captures'] !== $a['captures']) {
            return $b['captures'] <=> $a['captures'];
        }
        return $a['last_ts'] <=> $b['last_ts'];
    });
    return array_slice($rows, 0, 5);
}

function loadRawPoliciaEvent(PDO $pdo): array
{
    $stmt = $pdo->prepare("SELECT val FROM game_state WHERE key = 'policia_event' LIMIT 1");
    $stmt->execute();
    $row = $stmt->fetch();
    if ($row === false || !isset($row['val']) || !is_string($row['val'])) {
        return [];
    }
    $dec = json_decode($row['val'], true);
    return is_array($dec) ? $dec : [];
}

function saveRawPoliciaEvent(PDO $pdo, array $ev, int $nowTs): void
{
    $json = json_encode($ev, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt = $pdo->prepare(
        "INSERT INTO game_state (key, val, updated_at) VALUES ('policia_event', :val, :uat)
         ON CONFLICT(key) DO UPDATE SET val = excluded.val, updated_at = excluded.updated_at"
    );
    $stmt->execute([
        ':val' => ($json !== false) ? $json : '{}',
        ':uat' => $nowTs,
    ]);
}

function resolvePoliciaWalletKeyChat(string $pid, string $arroba): string
{
    $h = cleanArroba($arroba);
    if ($h !== '') {
        return '@' . strtolower($h);
    }
    return 'pid:' . $pid;
}

/**
 * @return array{wallet_key: string, coins: int, weapons: list<string>, equipped_weapon: string, bonus_lives: int}
 */
function ensurePoliciaWalletChat(PDO $pdo, string $walletKey): array
{
    $nowTs = (int)time();
    $pdo->prepare(
        "INSERT OR IGNORE INTO policia_wallets (wallet_key, coins, weapons_json, equipped_weapon, bonus_lives, updated_at)
         VALUES (:wk, 300, '[\"base\"]', 'base', 0, :uat)"
    )->execute([':wk' => $walletKey, ':uat' => $nowTs]);

    $st = $pdo->prepare('SELECT wallet_key, coins, weapons_json, equipped_weapon, bonus_lives FROM policia_wallets WHERE wallet_key = :wk LIMIT 1');
    $st->execute([':wk' => $walletKey]);
    $row = $st->fetch();

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
    $eq = ($row !== false && is_string($row['equipped_weapon'] ?? null) && in_array($row['equipped_weapon'], $weapons, true))
        ? $row['equipped_weapon']
        : 'base';

    return [
        'wallet_key' => $walletKey,
        'coins' => ($row !== false) ? max(0, (int)($row['coins'] ?? 300)) : 300,
        'weapons' => $weapons,
        'equipped_weapon' => $eq,
        'bonus_lives' => ($row !== false) ? max(0, (int)($row['bonus_lives'] ?? 0)) : 0,
    ];
}

function addPoliciaWalletCoinsChat(PDO $pdo, string $walletKey, int $delta): array
{
    $w = ensurePoliciaWalletChat($pdo, $walletKey);
    $newCoins = max(0, $w['coins'] + $delta);
    $pdo->prepare('UPDATE policia_wallets SET coins = :c, updated_at = :u WHERE wallet_key = :wk')
        ->execute([':c' => $newCoins, ':u' => (int)time(), ':wk' => $walletKey]);
    $w['coins'] = $newCoins;
    return $w;
}

const POLICIA_NPC_RESPAWN_S = 35;

/**
 * Mantém apenas NPCs capturados cujo tempo de cadeia (35s) ainda não expirou.
 *
 * @param array<string, mixed> $captured
 * @return array<string, array<string, mixed>>
 */
function pruneExpiredPoliciaCaptures(array $captured, int $nowTs, int $cooldownS = POLICIA_NPC_RESPAWN_S): array
{
    $out = [];
    foreach ($captured as $npcKey => $capInfo) {
        if (!is_array($capInfo)) {
            continue;
        }
        $ts = (int)($capInfo['ts'] ?? 0);
        if ($ts > 0 && ($nowTs - $ts) < $cooldownS) {
            $out[(string)$npcKey] = $capInfo;
        }
    }
    return $out;
}

/**
 * Conta membros online de cada time (Polícia x Ladrão) para manter equilíbrio 50/50.
 *
 * @param array<string, mixed> $pvp
 * @return array{policia: int, ladrao: int}
 */
function countActivePoliciaTeams(PDO $pdo, array $pvp, float $now, string $excludePid = ''): array
{
    $st = $pdo->prepare('SELECT pid FROM players WHERE seen_at >= :lim');
    $st->execute([':lim' => $now - 22.0]);
    $onlineSet = [];
    foreach ($st->fetchAll() as $row) {
        if (isset($row['pid']) && is_string($row['pid'])) {
            $onlineSet[$row['pid']] = true;
        }
    }
    $nowTs = (int)floor($now);
    $cops = 0;
    $thieves = 0;
    foreach ($pvp as $pKey => $entry) {
        $pidStr = (string)$pKey;
        if (!is_array($entry) || ($excludePid !== '' && $pidStr === $excludePid)) {
            continue;
        }
        $isOnline = isset($onlineSet[$pidStr]);
        $recentlyJoined = ((int)($entry['joined_at'] ?? 0) >= ($nowTs - 12));
        if (!$isOnline && !$recentlyJoined) {
            continue;
        }
        $tm = (string)($entry['team'] ?? '');
        if ($tm === 'policia') {
            $cops++;
        } elseif ($tm === 'ladrao') {
            $thieves++;
        }
    }
    return ['policia' => $cops, 'ladrao' => $thieves];
}

function ensurePoliciaEventState(PDO $pdo, int $nowTs, bool $alreadyInTx = false): array
{
    $cfg = getPoliciaSettings($pdo);
    $ev = loadRawPoliciaEvent($pdo);
    $status = isset($ev['status']) && is_string($ev['status']) ? $ev['status'] : 'idle';
    $tz = new DateTimeZone('America/Sao_Paulo');
    $dtNow = (new DateTimeImmutable('@' . $nowTs))->setTimezone($tz);
    $todayStr = $dtNow->format('Y-m-d');
    $start21 = (int)$dtNow->setTime(21, 0, 0)->getTimestamp();
    $duration = $cfg['duration_s'];

    $needsFinish = ($status === 'active' && (int)($ev['ends_at'] ?? 0) > 0 && $nowTs >= (int)$ev['ends_at']);
    $needsAutoStart = (
        !$needsFinish
        && $status !== 'active'
        && $cfg['auto_21h']
        && $nowTs >= $start21
        && $nowTs < ($start21 + $duration)
        && (($ev['skipped_date'] ?? '') !== $todayStr)
        && (($ev['round_id'] ?? '') !== ('auto_' . $todayStr))
    );

    if ($needsFinish || $needsAutoStart) {
        $openedTx = false;
        if (!$alreadyInTx) {
            $pdo->exec('BEGIN IMMEDIATE');
            $openedTx = true;
            $ev = loadRawPoliciaEvent($pdo);
            $status = isset($ev['status']) && is_string($ev['status']) ? $ev['status'] : 'idle';
            $needsFinish = ($status === 'active' && (int)($ev['ends_at'] ?? 0) > 0 && $nowTs >= (int)$ev['ends_at']);
            $needsAutoStart = (
                !$needsFinish
                && $status !== 'active'
                && $cfg['auto_21h']
                && $nowTs >= $start21
                && $nowTs < ($start21 + $duration)
                && (($ev['skipped_date'] ?? '') !== $todayStr)
                && (($ev['round_id'] ?? '') !== ('auto_' . $todayStr))
            );
        }

        if ($needsFinish) {
            $scores = (isset($ev['scores']) && is_array($ev['scores'])) ? $ev['scores'] : [];
            $pvpFin = (isset($ev['pvp']) && is_array($ev['pvp'])) ? $ev['pvp'] : [];
            // Bônus de sobrevivente (+5 pts) para policiais que permanecerem de pé com vidas > 0
            $aliveCops = [];
            foreach ($pvpFin as $kPid => $kEntry) {
                if (is_array($kEntry) && (($kEntry['team'] ?? '') === 'policia') && (int)($kEntry['lives'] ?? 0) > 0) {
                    $aliveCops[] = (string)$kPid;
                }
            }
            if (count($aliveCops) > 0 && count($pvpFin) >= 2) {
                $bonusSurv = (count($aliveCops) === 1) ? 5 : 2;
                foreach ($aliveCops as $sPid) {
                    if (!isset($scores[$sPid]) || !is_array($scores[$sPid])) {
                        $scores[$sPid] = [
                            'nome' => cleanNome($pvpFin[$sPid]['nome'] ?? 'Policial'),
                            'arroba' => cleanArroba($pvpFin[$sPid]['arroba'] ?? ''),
                            'pts' => 0,
                            'captures' => 0,
                            'last_ts' => $nowTs,
                        ];
                    }
                    $scores[$sPid]['pts'] = (int)($scores[$sPid]['pts'] ?? 0) + $bonusSurv;
                }
            }
            $board = computePoliciaLeaderboard($scores);
            $winner = (!empty($board) && (int)$board[0]['captures'] >= 1) ? [
                'pid' => $board[0]['pid'],
                'nome' => $board[0]['nome'],
                'arroba' => $board[0]['arroba'],
                'pts' => $board[0]['pts'],
                'captures' => $board[0]['captures'],
                'round_id' => (string)($ev['round_id'] ?? ''),
                'won_at' => $nowTs,
            ] : null;

            $ev['status'] = 'finished';
            $ev['finished_at'] = $nowTs;
            $ev['winner'] = $winner;
            saveRawPoliciaEvent($pdo, $ev, $nowTs);

            if ($winner !== null) {
                $wJson = json_encode($winner, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $pdo->prepare(
                    "INSERT INTO game_state (key, val, updated_at) VALUES ('policia_xerife', :val, :uat)
                     ON CONFLICT(key) DO UPDATE SET val = excluded.val, updated_at = excluded.updated_at"
                )->execute([
                    ':val' => ($wJson !== false) ? $wJson : '{}',
                    ':uat' => $nowTs,
                ]);
                $who = $winner['nome'] . ($winner['arroba'] !== '' ? (' (@' . $winner['arroba'] . ')') : '');
                postPoliciaChatAviso(
                    $pdo,
                    '🚓 DESTAQUE DA NOITE! ' . $who . ' é o novo Xerife da Noite com ' . $winner['pts'] . ' pts (' . $winner['captures'] . ' prisões)!',
                    $nowTs
                );
            } else {
                postPoliciaChatAviso($pdo, '🌅 Operação Polícia e Ladrão encerrada na Cadeia 79! Até a próxima rodada das 21h.', $nowTs);
            }
            $status = 'finished';
        } elseif ($needsAutoStart) {
            $roundId = 'auto_' . $todayStr;
            $seed = (int)sprintf('%u', crc32('cpx_pol_' . $todayStr));
            if ($seed < 1000) {
                $seed += 792100;
            }
            $ev = [
                'status' => 'active',
                'round_id' => $roundId,
                'mode' => 'auto_21h',
                'started_at' => $start21,
                'ends_at' => $start21 + $duration,
                'seed' => $seed,
                'npc_count' => $cfg['npc_count'],
                'captured' => [],
                'scores' => [],
                'pvp' => [],
                'shots' => [],
                'winner' => null,
                'skipped_date' => '',
            ];
            saveRawPoliciaEvent($pdo, $ev, $nowTs);
            postPoliciaChatAviso(
                $pdo,
                '🚨 FUGA NA CADEIA 79! Polícia × Ladrão começou! O sistema dividiu as equipes automaticamente com 5 vidas e pistolinhas de água!',
                $nowTs
            );
            $status = 'active';
        }

        if ($openedTx) {
            $pdo->exec('COMMIT');
        }
    }

    $xerife = getPoliciaXerife($pdo);
    $capturedRaw = (isset($ev['captured']) && is_array($ev['captured'])) ? $ev['captured'] : [];
    $scoresRaw = (isset($ev['scores']) && is_array($ev['scores'])) ? $ev['scores'] : [];
    $leaderboard = computePoliciaLeaderboard($scoresRaw);

    if ($status === 'finished') {
        $finAt = (int)($ev['finished_at'] ?? 0);
        if ($finAt > 0 && ($nowTs - $finAt) > 95) {
            $status = 'idle';
        }
    }

    $prealert = (
        $status === 'idle'
        && $cfg['auto_21h']
        && $nowTs >= ($start21 - 300)
        && $nowTs < $start21
        && (($ev['skipped_date'] ?? '') !== $todayStr)
    );

    if ($prealert) {
        return [
            'status' => 'prealert',
            'auto_21h' => true,
            'starts_at' => $start21,
            'countdown_s' => max(0, $start21 - $nowTs),
            'duration_s' => $duration,
            'npc_count' => $cfg['npc_count'],
            'captured' => new stdClass(),
            'captured_count' => 0,
            'leaderboard' => [],
            'winner' => null,
            'xerife' => $xerife,
            'server_now' => $nowTs,
        ];
    }

    $capturedActive = pruneExpiredPoliciaCaptures($capturedRaw, $nowTs, POLICIA_NPC_RESPAWN_S);
    $capturedMap = [];
    $capturedUntil = [];
    foreach ($capturedActive as $npcKey => $capInfo) {
        $capturedMap[(string)$npcKey] = cleanNome($capInfo['nome'] ?? 'Policial');
        $capturedUntil[(string)$npcKey] = (int)($capInfo['ts'] ?? $nowTs) + POLICIA_NPC_RESPAWN_S;
    }

    $pvpRaw = (isset($ev['pvp']) && is_array($ev['pvp'])) ? $ev['pvp'] : [];
    $nowF = microtime(true);
    $pvpOut = [];
    foreach ($pvpRaw as $kPid => $kEntry) {
        if (!is_array($kEntry)) {
            continue;
        }
        $pvpOut[(string)$kPid] = [
            'team' => (($kEntry['team'] ?? '') === 'ladrao') ? 'ladrao' : 'policia',
            'hp' => max(0, min(100, (int)($kEntry['hp'] ?? 100))),
            'max_hp' => 100,
            'lives' => max(0, (int)($kEntry['lives'] ?? 5)),
            'weapon' => in_array((string)($kEntry['weapon'] ?? 'base'), ['base', 'dupla', 'super'], true)
                ? (string)$kEntry['weapon']
                : 'base',
            'jailed_until' => max(0, (int)($kEntry['jailed_until'] ?? 0)),
            'invuln_until' => round((float)($kEntry['invuln_until'] ?? 0.0), 2),
            'hits' => max(0, (int)($kEntry['hits'] ?? 0)),
            'kos' => max(0, (int)($kEntry['kos'] ?? 0)),
            'nome' => cleanNome($kEntry['nome'] ?? 'Jogador'),
            'arroba' => cleanArroba($kEntry['arroba'] ?? ''),
        ];
    }
    $teamCounts = ($status === 'active')
        ? countActivePoliciaTeams($pdo, $pvpRaw, $nowF)
        : ['policia' => 0, 'ladrao' => 0];

    $shotsRaw = (isset($ev['shots']) && is_array($ev['shots'])) ? $ev['shots'] : [];
    $shotsOut = [];
    if ($status === 'active') {
        foreach ($shotsRaw as $sh) {
            if (!is_array($sh)) {
                continue;
            }
            $shTs = (float)($sh['ts'] ?? 0.0);
            if ($shTs > 0.0 && ($nowF - $shTs) <= 2.6) {
                $shotsOut[] = $sh;
            }
        }
    }

    return [
        'status' => $status,
        'round_id' => (string)($ev['round_id'] ?? ''),
        'auto_21h' => $cfg['auto_21h'],
        'started_at' => (int)($ev['started_at'] ?? 0),
        'ends_at' => (int)($ev['ends_at'] ?? 0),
        'countdown_s' => ($status === 'active') ? max(0, (int)($ev['ends_at'] ?? 0) - $nowTs) : 0,
        'duration_s' => $duration,
        'seed' => (int)($ev['seed'] ?? 0),
        'npc_count' => max(8, (int)($ev['npc_count'] ?? $cfg['npc_count'])),
        'npc_respawn_s' => POLICIA_NPC_RESPAWN_S,
        'captured' => !empty($capturedMap) ? $capturedMap : new stdClass(),
        'captured_until' => !empty($capturedUntil) ? $capturedUntil : new stdClass(),
        'captured_count' => count($capturedMap),
        'total_captures' => max(count($capturedMap), (int)($ev['total_captures'] ?? count($capturedRaw))),
        'leaderboard' => $leaderboard,
        'pvp' => !empty($pvpOut) ? $pvpOut : new stdClass(),
        'team_counts' => $teamCounts,
        'shots' => $shotsOut,
        'winner' => (isset($ev['winner']) && is_array($ev['winner'])) ? $ev['winner'] : null,
        'xerife' => $xerife,
        'server_now' => $nowTs,
    ];
}

function getBallState(PDO $pdo): ?array
{
    $stmt = $pdo->prepare("SELECT val FROM game_state WHERE key = 'ball' LIMIT 1");
    $stmt->execute();
    $row = $stmt->fetch();
    if ($row === false || !isset($row['val']) || !is_string($row['val'])) {
        return null;
    }
    $decoded = json_decode($row['val'], true);
    if (!is_array($decoded)) {
        return null;
    }
    $gol = isset($decoded['gol']) && is_string($decoded['gol']) && in_array($decoded['gol'], ['', 'a', 'b'], true)
        ? $decoded['gol']
        : '';
    return [
        'x' => clampFloat($decoded['x'] ?? 0.0, -1000.0, 1000.0, 0.0),
        'z' => clampFloat($decoded['z'] ?? 0.0, -1000.0, 1000.0, 0.0),
        'vx' => clampFloat($decoded['vx'] ?? 0.0, -42.0, 42.0, 0.0),
        'vz' => clampFloat($decoded['vz'] ?? 0.0, -42.0, 42.0, 0.0),
        'kicker' => isset($decoded['kicker']) && is_scalar($decoded['kicker'])
            ? substr(stripControlsAndCollapse((string)$decoded['kicker']), 0, 48)
            : '',
        'seq' => max(0, (int)($decoded['seq'] ?? 0)),
        'gol' => $gol,
        'score_a' => clampInt($decoded['score_a'] ?? 0, 0, 999, 0),
        'score_b' => clampInt($decoded['score_b'] ?? 0, 0, 999, 0),
        'ts' => (int)($decoded['ts'] ?? 0),
    ];
}

function respondState(PDO $pdo, float $now, int $since, string $viewerRoom = '', string $viewerPid = ''): never
{
    $policiaEvent = ensurePoliciaEventState($pdo, (int)round($now), false);

    $lim = $now - 22.0;
    $stmtPlayers = $pdo->prepare(
        'SELECT pid, nome, arroba, x, z, ry, andando, fem, pele, cabelo, camisa, calca, sapato,
                jump, emote, car_type, ride_of, room, profissao, badge
         FROM players
         WHERE seen_at >= :lim
         ORDER BY seen_at DESC
         LIMIT 60'
    );
    $stmtPlayers->execute([':lim' => $lim]);

    $players = [];
    foreach ($stmtPlayers->fetchAll() as $r) {
        $players[] = [
            'pid' => (string)$r['pid'],
            'nome' => (string)$r['nome'],
            'arroba' => (string)$r['arroba'],
            'x' => (float)$r['x'],
            'z' => (float)$r['z'],
            'ry' => (float)$r['ry'],
            'andando' => (int)$r['andando'],
            'fem' => (int)$r['fem'],
            'pele' => (int)$r['pele'],
            'cabelo' => (int)$r['cabelo'],
            'camisa' => (int)$r['camisa'],
            'calca' => (int)$r['calca'],
            'sapato' => (int)$r['sapato'],
            'jump' => (float)($r['jump'] ?? 0.0),
            'emote' => (string)($r['emote'] ?? ''),
            'car_type' => (string)($r['car_type'] ?? ''),
            'ride_of' => (string)($r['ride_of'] ?? ''),
            'room' => (string)($r['room'] ?? ''),
            'profissao' => (string)($r['profissao'] ?? ''),
            'badge' => (string)($r['badge'] ?? ''),
        ];
    }

    if ($since <= 0) {
        $stmtMsgs = $pdo->prepare(
            "SELECT id, pid, nome, arroba, cor, texto, x, z, ts, room
             FROM (
                 SELECT id, pid, nome, arroba, cor, texto, x, z, ts, room
                 FROM messages
                 WHERE (room = '' OR room = :viewerRoom)
                 ORDER BY id DESC
                 LIMIT 35
             ) sub
             ORDER BY id ASC"
        );
        $stmtMsgs->execute([':viewerRoom' => $viewerRoom]);
        $rowsMsgs = $stmtMsgs->fetchAll();
    } else {
        $stmtMsgs = $pdo->prepare(
            "SELECT id, pid, nome, arroba, cor, texto, x, z, ts, room
             FROM messages
             WHERE id > :since AND (room = '' OR room = :viewerRoom)
             ORDER BY id ASC
             LIMIT 50"
        );
        $stmtMsgs->execute([
            ':since' => $since,
            ':viewerRoom' => $viewerRoom,
        ]);
        $rowsMsgs = $stmtMsgs->fetchAll();
    }

    $messages = [];
    foreach ($rowsMsgs as $m) {
        $messages[] = [
            'id' => (int)$m['id'],
            'pid' => (string)$m['pid'],
            'nome' => (string)$m['nome'],
            'arroba' => (string)$m['arroba'],
            'cor' => (string)$m['cor'],
            'texto' => (string)$m['texto'],
            'x' => (float)$m['x'],
            'z' => (float)$m['z'],
            'ts' => (int)$m['ts'],
            'room' => (string)($m['room'] ?? ''),
        ];
    }

    $ball = getBallState($pdo);

    $walletOut = null;
    if ($viewerPid !== '' && isValidPid($viewerPid)) {
        $stVp = $pdo->prepare('SELECT arroba FROM players WHERE pid = :pid LIMIT 1');
        $stVp->execute([':pid' => $viewerPid]);
        $rVp = $stVp->fetch();
        $vArr = ($rVp !== false && isset($rVp['arroba'])) ? (string)$rVp['arroba'] : '';
        $walletOut = ensurePoliciaWalletChat($pdo, resolvePoliciaWalletKeyChat($viewerPid, $vArr));
    }

    respondJson(200, [
        'ok' => true,
        'now' => (int)time(),
        'online_count' => count($players),
        'players' => $players,
        'messages' => $messages,
        'ball' => $ball,
        'policia_event' => $policiaEvent,
        'wallet' => $walletOut,
    ]);
}

function cleanupOldData(PDO $pdo, float $now): void
{
    $stmtDelPlayers = $pdo->prepare('DELETE FROM players WHERE seen_at < :lim');
    $stmtDelPlayers->execute([':lim' => $now - 60.0]);

    $stmtDelRates = $pdo->prepare('DELETE FROM rate_limits WHERE last_ts < :lim');
    $stmtDelRates->execute([':lim' => $now - 120.0]);

    $pdo->exec(
        'DELETE FROM messages
         WHERE id <= COALESCE(
             (SELECT id FROM messages ORDER BY id DESC LIMIT 1 OFFSET 200),
             0
         )'
    );
}

$pdo = null;
$inTx = false;

try {
    $pdo = openDatabase();

    if ($method === 'GET') {
        $action = isset($_GET['action']) && is_string($_GET['action']) ? $_GET['action'] : 'state';
        if ($action !== 'state') {
            respondJson(400, ['ok' => false, 'erro' => 'Ação inválida.']);
        }
        $since = (isset($_GET['since']) && is_scalar($_GET['since'])) ? max(0, (int)$_GET['since']) : 0;
        $viewerRoom = cleanRoom($_GET['room'] ?? '');
        $viewerPid = (isset($_GET['pid']) && is_string($_GET['pid'])) ? trim($_GET['pid']) : '';
        respondState($pdo, microtime(true), $since, $viewerRoom, $viewerPid);
    }

    if ($method !== 'POST') {
        respondJson(405, ['ok' => false, 'erro' => 'Método não permitido.']);
    }

    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '' || strlen($raw) > 32768) {
        respondJson(400, ['ok' => false, 'erro' => 'Requisição JSON inválida.']);
    }

    $body = json_decode($raw, true);
    if (!is_array($body)) {
        respondJson(400, ['ok' => false, 'erro' => 'Requisição JSON inválida.']);
    }

    $action = isset($body['action']) && is_string($body['action']) && $body['action'] !== ''
        ? $body['action']
        : (isset($_GET['action']) && is_string($_GET['action']) ? $_GET['action'] : '');
    if (!in_array($action, ['leave', 'sync', 'join', 'send', 'kick', 'capture_thief', 'policia_join', 'policia_fire', 'policia_shop'], true)) {
        respondJson(400, ['ok' => false, 'erro' => 'Ação inválida.']);
    }

    $pid = $body['pid'] ?? null;
    $token = $body['token'] ?? null;
    if (!isValidPid($pid) || !isValidToken($token)) {
        respondJson(400, ['ok' => false, 'erro' => 'Sessão inválida']);
    }

    /** @var string $pid */
    /** @var string $token */
    $secret = hash('sha256', $token);
    $now = microtime(true);

    if ($action === 'leave') {
        $stmtLeave = $pdo->prepare('DELETE FROM players WHERE pid = :pid AND secret = :secret');
        $stmtLeave->execute([':pid' => $pid, ':secret' => $secret]);
        respondJson(200, ['ok' => true]);
    }

    if ($action === 'capture_thief') {
        $roundId = isset($body['round_id']) && is_scalar($body['round_id']) ? trim((string)$body['round_id']) : '';
        $npcId = clampInt($body['npc_id'] ?? -1, -1, 40, -1);
        $tier = clampInt($body['tier'] ?? 1, 1, 3, 1);
        $partnerPid = isset($body['partner_pid']) && is_string($body['partner_pid']) ? trim($body['partner_pid']) : '';
        if ($roundId === '' || $npcId < 0) {
            respondJson(400, ['ok' => false, 'erro' => 'Parâmetros de captura inválidos.']);
        }

        $nowTs = (int)time();
        $pdo->exec('BEGIN IMMEDIATE');
        $inTx = true;

        $stmtCheck = $pdo->prepare('SELECT secret, seen_at, nome, arroba, ride_of FROM players WHERE pid = :pid');
        $stmtCheck->execute([':pid' => $pid]);
        $existing = $stmtCheck->fetch();
        if (
            $existing === false
            || (!hash_equals((string)$existing['secret'], $secret) && (float)$existing['seen_at'] > ($now - 86400.0))
        ) {
            $pdo->exec('ROLLBACK');
            $inTx = false;
            respondJson(403, ['ok' => false, 'erro' => 'Entre no mapa antes de registrar prisão.']);
        }

        $kCap = 'cap:' . $pid;
        $stmtCapRate = $pdo->prepare('SELECT last_ts FROM rate_limits WHERE k = :k LIMIT 1');
        $stmtCapRate->execute([':k' => $kCap]);
        $capRateRow = $stmtCapRate->fetch();
        if ($capRateRow !== false && ($now - (float)$capRateRow['last_ts']) < 0.4) {
            $curState = ensurePoliciaEventState($pdo, $nowTs, true);
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(429, ['ok' => false, 'erro' => 'Captura rápida demais.', 'policia_event' => $curState]);
        }

        $pdo->prepare(
            'INSERT INTO rate_limits (k, last_ts) VALUES (:k, :last_ts)
             ON CONFLICT(k) DO UPDATE SET last_ts = excluded.last_ts'
        )->execute([':k' => $kCap, ':last_ts' => $now]);

        ensurePoliciaEventState($pdo, $nowTs, true);
        $ev = loadRawPoliciaEvent($pdo);
        $evStatus = (string)($ev['status'] ?? 'idle');
        if ($evStatus !== 'active' || (string)($ev['round_id'] ?? '') !== $roundId) {
            $curState = ensurePoliciaEventState($pdo, $nowTs, true);
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(200, ['ok' => false, 'round_ended' => true, 'policia_event' => $curState]);
        }

        $maxNpcs = max(8, (int)($ev['npc_count'] ?? 18));
        if ($npcId >= $maxNpcs) {
            $curState = ensurePoliciaEventState($pdo, $nowTs, true);
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(400, ['ok' => false, 'erro' => 'Alvo inválido.', 'policia_event' => $curState]);
        }

        $captured = pruneExpiredPoliciaCaptures(
            (isset($ev['captured']) && is_array($ev['captured'])) ? $ev['captured'] : [],
            $nowTs,
            POLICIA_NPC_RESPAWN_S
        );
        $npcKey = (string)$npcId;
        if (isset($captured[$npcKey])) {
            $curState = ensurePoliciaEventState($pdo, $nowTs, true);
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(200, ['ok' => false, 'already_captured' => true, 'policia_event' => $curState]);
        }

        $pvpRaw = (isset($ev['pvp']) && is_array($ev['pvp'])) ? $ev['pvp'] : [];
        if (isset($pvpRaw[$pid]) && is_array($pvpRaw[$pid]) && (($pvpRaw[$pid]['team'] ?? '') === 'ladrao')) {
            $curState = ensurePoliciaEventState($pdo, $nowTs, true);
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(200, ['ok' => false, 'wrong_team' => true, 'policia_event' => $curState]);
        }

        $scores = (isset($ev['scores']) && is_array($ev['scores'])) ? $ev['scores'] : [];
        $scorerNome = cleanNome($existing['nome'] ?? ($body['nome'] ?? 'Policial'));
        $scorerArroba = cleanArroba($existing['arroba'] ?? ($body['arroba'] ?? ''));
        $basePts = ($tier === 3) ? 5 : (($tier === 2) ? 3 : 1);
        $gainedCoins = ($tier === 3) ? 150 : (($tier === 2) ? 80 : 40);

        $prevScore = (isset($scores[$pid]) && is_array($scores[$pid])) ? $scores[$pid] : ['pts' => 0, 'captures' => 0, 'last_ts' => 0];
        $lastCapTs = (int)($prevScore['last_ts'] ?? 0);
        $comboBonus = ($lastCapTs > 0 && ($nowTs - $lastCapTs) <= 15) ? 1 : 0;
        $gainedPts = $basePts + $comboBonus;

        $scores[$pid] = [
            'nome' => $scorerNome,
            'arroba' => $scorerArroba,
            'pts' => (int)($prevScore['pts'] ?? 0) + $gainedPts,
            'captures' => (int)($prevScore['captures'] ?? 0) + 1,
            'last_ts' => $nowTs,
        ];

        $wKey = resolvePoliciaWalletKeyChat($pid, $scorerArroba);
        $walletAfter = addPoliciaWalletCoinsChat($pdo, $wKey, $gainedCoins);

        $partnerCredited = '';
        if ($partnerPid !== '' && $partnerPid !== $pid && isValidPid($partnerPid)) {
            $stmtPartner = $pdo->prepare('SELECT pid, nome, arroba, ride_of, seen_at FROM players WHERE pid = :ppid LIMIT 1');
            $stmtPartner->execute([':ppid' => $partnerPid]);
            $pRow = $stmtPartner->fetch();
            if (
                $pRow !== false
                && (float)$pRow['seen_at'] >= ($now - 25.0)
                && ((string)$pRow['ride_of'] === $pid || (string)$existing['ride_of'] === $partnerPid)
            ) {
                $prevPartner = (isset($scores[$partnerPid]) && is_array($scores[$partnerPid]))
                    ? $scores[$partnerPid]
                    : ['pts' => 0, 'captures' => 0, 'last_ts' => 0];
                $pArrClean = cleanArroba($pRow['arroba'] ?? '');
                $scores[$partnerPid] = [
                    'nome' => cleanNome($pRow['nome'] ?? 'Parceiro'),
                    'arroba' => $pArrClean,
                    'pts' => (int)($prevPartner['pts'] ?? 0) + $basePts,
                    'captures' => (int)($prevPartner['captures'] ?? 0) + 1,
                    'last_ts' => $nowTs,
                ];
                addPoliciaWalletCoinsChat($pdo, resolvePoliciaWalletKeyChat($partnerPid, $pArrClean), (int)round($gainedCoins / 2));
                $partnerCredited = cleanNome($pRow['nome'] ?? 'Parceiro');
            }
        }

        $captured[$npcKey] = [
            'pid' => $pid,
            'nome' => $scorerNome,
            'tier' => $tier,
            'pts' => $gainedPts,
            'ts' => $nowTs,
        ];
        $ev['captured'] = $captured;
        $ev['total_captures'] = max(count($captured), (int)($ev['total_captures'] ?? count($captured))) + 1;
        $ev['scores'] = $scores;
        saveRawPoliciaEvent($pdo, $ev, $nowTs);

        $curState = ensurePoliciaEventState($pdo, $nowTs, true);
        $pdo->exec('COMMIT');
        $inTx = false;

        respondJson(200, [
            'ok' => true,
            'npc_id' => $npcId,
            'gained_pts' => $gainedPts,
            'gained_coins' => $gainedCoins,
            'combo' => $comboBonus > 0,
            'partner_credited' => $partnerCredited,
            'wallet' => $walletAfter,
            'policia_event' => $curState,
        ]);
    }

    if ($action === 'policia_join') {
        $nowTs = (int)time();
        $pdo->exec('BEGIN IMMEDIATE');
        $inTx = true;

        $stmtCheck = $pdo->prepare('SELECT secret, seen_at, nome, arroba FROM players WHERE pid = :pid');
        $stmtCheck->execute([':pid' => $pid]);
        $existing = $stmtCheck->fetch();
        if (
            $existing !== false
            && !hash_equals((string)$existing['secret'], $secret)
            && (float)$existing['seen_at'] > ($now - 86400.0)
        ) {
            $pdo->exec('ROLLBACK');
            $inTx = false;
            respondJson(403, ['ok' => false, 'erro' => 'Sessão inválida']);
        }

        ensurePoliciaEventState($pdo, $nowTs, true);
        $ev = loadRawPoliciaEvent($pdo);
        $pNome = cleanNome(($existing !== false ? $existing['nome'] : null) ?? ($body['nome'] ?? 'Morador'));
        $pArroba = cleanArroba(($existing !== false ? $existing['arroba'] : null) ?? ($body['arroba'] ?? ''));
        $wKey = resolvePoliciaWalletKeyChat($pid, $pArroba);
        $wallet = ensurePoliciaWalletChat($pdo, $wKey);

        if ((string)($ev['status'] ?? 'idle') !== 'active') {
            $curState = ensurePoliciaEventState($pdo, $nowTs, true);
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(200, ['ok' => true, 'active' => false, 'wallet' => $wallet, 'policia_event' => $curState]);
        }

        $pvp = (isset($ev['pvp']) && is_array($ev['pvp'])) ? $ev['pvp'] : [];
        $scoresRawJoin = (isset($ev['scores']) && is_array($ev['scores'])) ? $ev['scores'] : [];
        $newlyAssigned = false;
        $rebalanced = false;
        if (!isset($pvp[$pid]) || !is_array($pvp[$pid])) {
            $counts = countActivePoliciaTeams($pdo, $pvp, $now, $pid);
            $team = ($counts['policia'] <= $counts['ladrao']) ? 'policia' : 'ladrao';
            $bonusConsumed = min(5, max(0, (int)$wallet['bonus_lives']));
            $startLives = 5 + $bonusConsumed;
            if ($bonusConsumed > 0) {
                $pdo->prepare('UPDATE policia_wallets SET bonus_lives = :bl, updated_at = :u WHERE wallet_key = :wk')
                    ->execute([':bl' => $wallet['bonus_lives'] - $bonusConsumed, ':u' => $nowTs, ':wk' => $wKey]);
                $wallet['bonus_lives'] -= $bonusConsumed;
            }
            $pvp[$pid] = [
                'team' => $team,
                'hp' => 100,
                'max_hp' => 100,
                'lives' => $startLives,
                'weapon' => $wallet['equipped_weapon'],
                'jailed_until' => 0,
                'invuln_until' => round($now + 3.0, 2),
                'hits' => 0,
                'kos' => 0,
                'nome' => $pNome,
                'arroba' => $pArroba,
                'joined_at' => $nowTs,
            ];
            $newlyAssigned = true;
        } else {
            $pvp[$pid]['nome'] = $pNome;
            $pvp[$pid]['arroba'] = $pArroba;
            $pvp[$pid]['weapon'] = $wallet['equipped_weapon'];
            $hadBonusLives = (int)$wallet['bonus_lives'] > 0;
            if ($hadBonusLives) {
                $bonusConsumed = min(5, (int)$wallet['bonus_lives']);
                $pvp[$pid]['lives'] = max(0, (int)($pvp[$pid]['lives'] ?? 0)) + $bonusConsumed;
                if ((int)$pvp[$pid]['hp'] <= 0) {
                    $pvp[$pid]['hp'] = 100;
                }
                if ((int)($pvp[$pid]['jailed_until'] ?? 0) > $nowTs + 30) {
                    $pvp[$pid]['jailed_until'] = 0;
                }
                $pdo->prepare('UPDATE policia_wallets SET bonus_lives = :bl, updated_at = :u WHERE wallet_key = :wk')
                    ->execute([':bl' => $wallet['bonus_lives'] - $bonusConsumed, ':u' => $nowTs, ':wk' => $wKey]);
                $wallet['bonus_lives'] -= $bonusConsumed;
            } else {
                $oldTeam = (($pvp[$pid]['team'] ?? '') === 'ladrao') ? 'ladrao' : 'policia';
                $otherTeam = ($oldTeam === 'policia') ? 'ladrao' : 'policia';
                $notJailed = (int)($pvp[$pid]['lives'] ?? 0) > 0 && (int)($pvp[$pid]['jailed_until'] ?? 0) <= $nowTs;
                if ($notJailed) {
                    $countsExcl = countActivePoliciaTeams($pdo, $pvp, $now, $pid);
                    $diffExcl = $countsExcl[$oldTeam] - $countsExcl[$otherTeam];
                    $noScoreYet = (int)($pvp[$pid]['hits'] ?? 0) === 0
                        && (int)($pvp[$pid]['kos'] ?? 0) === 0
                        && empty($scoresRawJoin[$pid]);
                    $rejoinGap = ($nowTs - (int)($pvp[$pid]['joined_at'] ?? 0)) >= 15;
                    if (
                        $diffExcl >= 2
                        || ($diffExcl >= 1 && ($countsExcl[$otherTeam] === 0 || ($noScoreYet && $rejoinGap)))
                    ) {
                        $pvp[$pid]['team'] = $otherTeam;
                        $pvp[$pid]['joined_at'] = $nowTs;
                        $pvp[$pid]['invuln_until'] = round($now + 2.5, 2);
                        $rebalanced = true;
                    }
                }
            }
        }

        $ev['pvp'] = $pvp;
        saveRawPoliciaEvent($pdo, $ev, $nowTs);
        $curState = ensurePoliciaEventState($pdo, $nowTs, true);
        $pdo->exec('COMMIT');
        $inTx = false;

        respondJson(200, [
            'ok' => true,
            'active' => true,
            'newly_assigned' => $newlyAssigned,
            'rebalanced' => $rebalanced,
            'me' => $curState['pvp'][$pid] ?? $pvp[$pid],
            'wallet' => $wallet,
            'policia_event' => $curState,
        ]);
    }

    if ($action === 'policia_fire') {
        $nowTs = (int)time();
        $pdo->exec('BEGIN IMMEDIATE');
        $inTx = true;

        $stmtCheck = $pdo->prepare('SELECT secret, seen_at, nome, arroba, x, z, ride_of FROM players WHERE pid = :pid');
        $stmtCheck->execute([':pid' => $pid]);
        $existing = $stmtCheck->fetch();
        if (
            $existing === false
            || (!hash_equals((string)$existing['secret'], $secret) && (float)$existing['seen_at'] > ($now - 86400.0))
        ) {
            $pdo->exec('ROLLBACK');
            $inTx = false;
            respondJson(403, ['ok' => false, 'erro' => 'Sessão inválida']);
        }

        ensurePoliciaEventState($pdo, $nowTs, true);
        $ev = loadRawPoliciaEvent($pdo);
        if ((string)($ev['status'] ?? 'idle') !== 'active') {
            $curState = ensurePoliciaEventState($pdo, $nowTs, true);
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(200, ['ok' => false, 'round_ended' => true, 'policia_event' => $curState]);
        }

        $pvp = (isset($ev['pvp']) && is_array($ev['pvp'])) ? $ev['pvp'] : [];
        if (!isset($pvp[$pid]) || !is_array($pvp[$pid])) {
            $pdo->exec('ROLLBACK');
            $inTx = false;
            respondJson(400, ['ok' => false, 'erro' => 'Entre no evento primeiro.']);
        }
        $me = $pvp[$pid];
        if ((int)($me['lives'] ?? 0) <= 0 || (int)($me['jailed_until'] ?? 0) > $nowTs) {
            $curState = ensurePoliciaEventState($pdo, $nowTs, true);
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(200, ['ok' => false, 'jailed' => true, 'policia_event' => $curState]);
        }

        $shooterArroba = cleanArroba($existing['arroba'] ?? ($body['arroba'] ?? ''));
        $shooterNome = cleanNome($existing['nome'] ?? ($body['nome'] ?? 'Jogador'));
        $wKey = resolvePoliciaWalletKeyChat($pid, $shooterArroba);
        $wallet = ensurePoliciaWalletChat($pdo, $wKey);
        $weapon = in_array($wallet['equipped_weapon'], $wallet['weapons'], true) ? $wallet['equipped_weapon'] : 'base';
        $cooldown = ($weapon === 'dupla') ? 0.22 : (($weapon === 'super') ? 0.25 : 0.36);

        $kShot = 'shot:' . $pid;
        $stShotR = $pdo->prepare('SELECT last_ts FROM rate_limits WHERE k = :k LIMIT 1');
        $stShotR->execute([':k' => $kShot]);
        $rShotR = $stShotR->fetch();
        if ($rShotR !== false && ($now - (float)$rShotR['last_ts']) < $cooldown) {
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(200, ['ok' => false, 'cooldown' => true]);
        }
        $pdo->prepare(
            'INSERT INTO rate_limits (k, last_ts) VALUES (:k, :last_ts)
             ON CONFLICT(k) DO UPDATE SET last_ts = excluded.last_ts'
        )->execute([':k' => $kShot, ':last_ts' => $now]);

        $x0 = round(clampFloat($body['x0'] ?? ($existing['x'] ?? 0.0), -1000.0, 1000.0, 0.0), 2);
        $y0 = round(clampFloat($body['y0'] ?? 1.4, 0.2, 60.0, 1.4), 2);
        $z0 = round(clampFloat($body['z0'] ?? ($existing['z'] ?? 0.0), -1000.0, 1000.0, 0.0), 2);
        $x1 = round(clampFloat($body['x1'] ?? $x0, -1000.0, 1000.0, $x0), 2);
        $y1 = round(clampFloat($body['y1'] ?? $y0, 0.2, 60.0, $y0), 2);
        $z1 = round(clampFloat($body['z1'] ?? $z0, -1000.0, 1000.0, $z0), 2);
        $cuff = !empty($body['cuff']);
        $targetPid = isset($body['target_pid']) && is_string($body['target_pid']) ? trim($body['target_pid']) : '';
        $targetNpc = clampInt($body['target_npc'] ?? -1, -1, 40, -1);
        $npcTier = clampInt($body['tier'] ?? 1, 1, 3, 1);

        $shots = (isset($ev['shots']) && is_array($ev['shots'])) ? $ev['shots'] : [];
        $shots = array_values(array_filter($shots, static fn($s): bool => is_array($s) && ($now - (float)($s['ts'] ?? 0.0)) <= 2.6));
        $shots[] = [
            'id' => (string)round($now * 1000) . '_' . substr(bin2hex(random_bytes(3)), 0, 5),
            'shooter' => $pid,
            'team' => (string)($me['team'] ?? 'policia'),
            'x0' => $x0, 'y0' => $y0, 'z0' => $z0,
            'x1' => $x1, 'y1' => $y1, 'z1' => $z1,
            'weapon' => $weapon,
            'ts' => round($now, 3),
        ];
        if (count($shots) > 20) {
            $shots = array_slice($shots, -20);
        }
        $ev['shots'] = $shots;

        $hitResult = null;
        $scores = (isset($ev['scores']) && is_array($ev['scores'])) ? $ev['scores'] : [];
        $shooterTeam = (string)($me['team'] ?? 'policia');

        if ($targetPid !== '' && $targetPid !== $pid && isset($pvp[$targetPid]) && is_array($pvp[$targetPid])) {
            $tEntry = $pvp[$targetPid];
            $tTeam = (string)($tEntry['team'] ?? 'policia');
            $tLives = max(0, (int)($tEntry['lives'] ?? 0));
            $tJailedUntil = (int)($tEntry['jailed_until'] ?? 0);
            $tInvuln = (float)($tEntry['invuln_until'] ?? 0.0);

            if ($tTeam !== $shooterTeam && $tLives > 0 && $nowTs >= $tJailedUntil && $now >= $tInvuln) {
                $stTargetPos = $pdo->prepare('SELECT x, z, seen_at FROM players WHERE pid = :tp LIMIT 1');
                $stTargetPos->execute([':tp' => $targetPid]);
                $tpRow = $stTargetPos->fetch();
                $dist = 999.0;
                if ($tpRow !== false && (float)$tpRow['seen_at'] >= ($now - 30.0)) {
                    $dist = hypot((float)$tpRow['x'] - (float)$existing['x'], (float)$tpRow['z'] - (float)$existing['z']);
                }

                if ($dist <= 40.0) {
                    $dmg = ($cuff && $shooterTeam === 'policia' && $dist <= 5.5)
                        ? 100
                        : (($weapon === 'super') ? 35 : (($weapon === 'dupla') ? 28 : 22));
                    $newHp = max(0, (int)($tEntry['hp'] ?? 100) - $dmg);
                    $ko = ($newHp <= 0);
                    $me['hits'] = (int)($me['hits'] ?? 0) + 1;

                    $gainedPts = $ko ? 4 : 1;
                    $gainedCoins = $ko ? 60 : 10;

                    if ($ko) {
                        $me['kos'] = (int)($me['kos'] ?? 0) + 1;
                        $nextLives = max(0, $tLives - 1);
                        $tEntry['lives'] = $nextLives;
                        if ($nextLives > 0) {
                            $tEntry['jailed_until'] = $nowTs + 10;
                            $tEntry['hp'] = 100;
                            $tEntry['invuln_until'] = round($now + 13.0, 2);
                        } else {
                            $tEntry['jailed_until'] = 2147483647;
                            $tEntry['hp'] = 0;
                        }
                    } else {
                        $tEntry['hp'] = $newHp;
                    }
                    $pvp[$targetPid] = $tEntry;
                    $pvp[$pid] = $me;

                    $prevScore = (isset($scores[$pid]) && is_array($scores[$pid])) ? $scores[$pid] : ['pts' => 0, 'captures' => 0, 'last_ts' => 0];
                    $scores[$pid] = [
                        'nome' => $shooterNome,
                        'arroba' => $shooterArroba,
                        'pts' => (int)($prevScore['pts'] ?? 0) + $gainedPts,
                        'captures' => (int)($prevScore['captures'] ?? 0) + ($ko ? 1 : 0),
                        'last_ts' => $nowTs,
                    ];
                    $wallet = addPoliciaWalletCoinsChat($pdo, $wKey, $gainedCoins);
                    $hitResult = [
                        'target_pid' => $targetPid,
                        'target_nome' => cleanNome($tEntry['nome'] ?? 'Adversário'),
                        'dmg' => $dmg,
                        'hp_left' => $ko ? 0 : $newHp,
                        'ko' => $ko,
                        'cuff' => $cuff,
                        'gained_pts' => $gainedPts,
                        'gained_coins' => $gainedCoins,
                    ];
                }
            }
        } elseif ($targetNpc >= 0 && $targetNpc < max(8, (int)($ev['npc_count'] ?? 18)) && $shooterTeam === 'policia') {
            $captured = pruneExpiredPoliciaCaptures(
                (isset($ev['captured']) && is_array($ev['captured'])) ? $ev['captured'] : [],
                $nowTs,
                POLICIA_NPC_RESPAWN_S
            );
            $npcKey = (string)$targetNpc;
            if (!isset($captured[$npcKey])) {
                $basePts = ($npcTier === 3) ? 5 : (($npcTier === 2) ? 3 : 1);
                $gainedCoins = ($npcTier === 3) ? 150 : (($npcTier === 2) ? 80 : 40);
                $prevScore = (isset($scores[$pid]) && is_array($scores[$pid])) ? $scores[$pid] : ['pts' => 0, 'captures' => 0, 'last_ts' => 0];
                $combo = ((int)($prevScore['last_ts'] ?? 0) > 0 && ($nowTs - (int)$prevScore['last_ts']) <= 15) ? 1 : 0;
                $gainedPts = $basePts + $combo;
                $scores[$pid] = [
                    'nome' => $shooterNome,
                    'arroba' => $shooterArroba,
                    'pts' => (int)($prevScore['pts'] ?? 0) + $gainedPts,
                    'captures' => (int)($prevScore['captures'] ?? 0) + 1,
                    'last_ts' => $nowTs,
                ];
                $captured[$npcKey] = ['pid' => $pid, 'nome' => $shooterNome, 'tier' => $npcTier, 'pts' => $gainedPts, 'ts' => $nowTs];
                $ev['captured'] = $captured;
                $ev['total_captures'] = max(count($captured), (int)($ev['total_captures'] ?? count($captured))) + 1;
                $wallet = addPoliciaWalletCoinsChat($pdo, $wKey, $gainedCoins);
                $hitResult = [
                    'npc_id' => $targetNpc,
                    'tier' => $npcTier,
                    'ko' => true,
                    'gained_pts' => $gainedPts,
                    'gained_coins' => $gainedCoins,
                    'combo' => $combo > 0,
                ];
            }
        }

        $ev['pvp'] = $pvp;
        $ev['scores'] = $scores;
        saveRawPoliciaEvent($pdo, $ev, $nowTs);
        $curState = ensurePoliciaEventState($pdo, $nowTs, true);
        $pdo->exec('COMMIT');
        $inTx = false;

        respondJson(200, [
            'ok' => true,
            'hit' => $hitResult,
            'wallet' => $wallet,
            'policia_event' => $curState,
        ]);
    }

    if ($action === 'policia_shop') {
        $op = isset($body['op']) && is_string($body['op']) ? trim($body['op']) : '';
        if (!in_array($op, ['bail', 'life', 'buy_dupla', 'buy_super', 'equip', 'survival_tick', 'switch_team'], true)) {
            respondJson(400, ['ok' => false, 'erro' => 'Operação inválida na lojinha.']);
        }
        $nowTs = (int)time();
        $pdo->exec('BEGIN IMMEDIATE');
        $inTx = true;

        $stmtCheck = $pdo->prepare('SELECT secret, seen_at, nome, arroba FROM players WHERE pid = :pid');
        $stmtCheck->execute([':pid' => $pid]);
        $existing = $stmtCheck->fetch();
        if (
            $existing === false
            || (!hash_equals((string)$existing['secret'], $secret) && (float)$existing['seen_at'] > ($now - 86400.0))
        ) {
            $pdo->exec('ROLLBACK');
            $inTx = false;
            respondJson(403, ['ok' => false, 'erro' => 'Sessão inválida']);
        }

        ensurePoliciaEventState($pdo, $nowTs, true);
        $ev = loadRawPoliciaEvent($pdo);
        $pArroba = cleanArroba($existing['arroba'] ?? ($body['arroba'] ?? ''));
        $pNome = cleanNome($existing['nome'] ?? ($body['nome'] ?? 'Jogador'));
        $wKey = resolvePoliciaWalletKeyChat($pid, $pArroba);
        $wallet = ensurePoliciaWalletChat($pdo, $wKey);
        $pvp = (isset($ev['pvp']) && is_array($ev['pvp'])) ? $ev['pvp'] : [];
        $evActive = ((string)($ev['status'] ?? 'idle') === 'active');

        if ($op === 'survival_tick') {
            $kSurv = 'surv:' . $pid;
            $stSv = $pdo->prepare('SELECT last_ts FROM rate_limits WHERE k = :k LIMIT 1');
            $stSv->execute([':k' => $kSurv]);
            $rSv = $stSv->fetch();
            $gained = 0;
            if (
                $evActive
                && isset($pvp[$pid])
                && ($pvp[$pid]['team'] ?? '') === 'ladrao'
                && (int)($pvp[$pid]['lives'] ?? 0) > 0
                && (int)($pvp[$pid]['jailed_until'] ?? 0) <= $nowTs
                && ($rSv === false || ($now - (float)$rSv['last_ts']) >= 18.0)
            ) {
                $pdo->prepare('INSERT INTO rate_limits (k, last_ts) VALUES (:k, :u) ON CONFLICT(k) DO UPDATE SET last_ts = excluded.last_ts')
                    ->execute([':k' => $kSurv, ':u' => $now]);
                $wallet = addPoliciaWalletCoinsChat($pdo, $wKey, 20);
                $scores = (isset($ev['scores']) && is_array($ev['scores'])) ? $ev['scores'] : [];
                $prevS = (isset($scores[$pid]) && is_array($scores[$pid])) ? $scores[$pid] : ['pts' => 0, 'captures' => 0, 'last_ts' => 0];
                $scores[$pid] = [
                    'nome' => $pNome,
                    'arroba' => $pArroba,
                    'pts' => (int)($prevS['pts'] ?? 0) + 1,
                    'captures' => (int)($prevS['captures'] ?? 0),
                    'last_ts' => $nowTs,
                ];
                $ev['scores'] = $scores;
                saveRawPoliciaEvent($pdo, $ev, $nowTs);
                $gained = 20;
            }
            $curState = ensurePoliciaEventState($pdo, $nowTs, true);
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(200, ['ok' => true, 'gained_coins' => $gained, 'wallet' => $wallet, 'policia_event' => $curState]);
        }

        if ($op === 'equip') {
            $targetWep = isset($body['weapon']) && is_string($body['weapon']) ? trim($body['weapon']) : 'base';
            if (!in_array($targetWep, $wallet['weapons'], true)) {
                $pdo->exec('ROLLBACK');
                $inTx = false;
                respondJson(400, ['ok' => false, 'erro' => 'Você ainda não desbloqueou essa pistolinha.']);
            }
            $pdo->prepare('UPDATE policia_wallets SET equipped_weapon = :eq, updated_at = :u WHERE wallet_key = :wk')
                ->execute([':eq' => $targetWep, ':u' => $nowTs, ':wk' => $wKey]);
            $wallet['equipped_weapon'] = $targetWep;
            if ($evActive && isset($pvp[$pid])) {
                $pvp[$pid]['weapon'] = $targetWep;
                $ev['pvp'] = $pvp;
                saveRawPoliciaEvent($pdo, $ev, $nowTs);
            }
            $curState = ensurePoliciaEventState($pdo, $nowTs, true);
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(200, ['ok' => true, 'wallet' => $wallet, 'policia_event' => $curState]);
        }

        if ($op === 'switch_team') {
            if (!$evActive || !isset($pvp[$pid]) || !is_array($pvp[$pid])) {
                $pdo->exec('ROLLBACK');
                $inTx = false;
                respondJson(400, ['ok' => false, 'erro' => 'Entre na operação antes de equilibrar o time.']);
            }
            if ((int)($pvp[$pid]['lives'] ?? 0) <= 0 || (int)($pvp[$pid]['jailed_until'] ?? 0) > $nowTs) {
                $pdo->exec('ROLLBACK');
                $inTx = false;
                respondJson(400, ['ok' => false, 'erro' => 'Saia da prisão antes de trocar de time.']);
            }
            $oldTeam = (($pvp[$pid]['team'] ?? '') === 'ladrao') ? 'ladrao' : 'policia';
            $newTeam = ($oldTeam === 'policia') ? 'ladrao' : 'policia';
            $countsExcl = countActivePoliciaTeams($pdo, $pvp, $now, $pid);
            if ($countsExcl[$oldTeam] <= $countsExcl[$newTeam]) {
                $pdo->exec('ROLLBACK');
                $inTx = false;
                respondJson(400, ['ok' => false, 'erro' => 'Os times já estão equilibrados.']);
            }
            $pvp[$pid]['team'] = $newTeam;
            $pvp[$pid]['joined_at'] = $nowTs;
            $pvp[$pid]['invuln_until'] = round($now + 2.0, 2);
            $ev['pvp'] = $pvp;
            saveRawPoliciaEvent($pdo, $ev, $nowTs);
            $curState = ensurePoliciaEventState($pdo, $nowTs, true);
            $pdo->exec('COMMIT');
            $inTx = false;
            $msgSw = ($newTeam === 'policia')
                ? '👮 Agora você é do time POLÍCIA!'
                : '🕶️ Agora você é do time LADRÃO!';
            respondJson(200, ['ok' => true, 'msg' => $msgSw, 'wallet' => $wallet, 'policia_event' => $curState]);
        }

        $costs = [
            'bail' => 150,
            'life' => 200,
            'buy_dupla' => 250,
            'buy_super' => 450,
        ];
        $cost = $costs[$op];
        $weapons = $wallet['weapons'];
        if (($op === 'buy_dupla' && in_array('dupla', $weapons, true)) || ($op === 'buy_super' && in_array('super', $weapons, true))) {
            $eqW = ($op === 'buy_dupla') ? 'dupla' : 'super';
            $pdo->prepare('UPDATE policia_wallets SET equipped_weapon = :eq, updated_at = :u WHERE wallet_key = :wk')
                ->execute([':eq' => $eqW, ':u' => $nowTs, ':wk' => $wKey]);
            $wallet['equipped_weapon'] = $eqW;
            if ($evActive && isset($pvp[$pid])) {
                $pvp[$pid]['weapon'] = $eqW;
                $ev['pvp'] = $pvp;
                saveRawPoliciaEvent($pdo, $ev, $nowTs);
            }
            $curState = ensurePoliciaEventState($pdo, $nowTs, true);
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(200, ['ok' => true, 'msg' => 'Pistolinha equipada!', 'wallet' => $wallet, 'policia_event' => $curState]);
        }

        if ($wallet['coins'] < $cost) {
            $pdo->exec('ROLLBACK');
            $inTx = false;
            respondJson(400, [
                'ok' => false,
                'insufficient_coins' => true,
                'needed' => $cost,
                'coins' => $wallet['coins'],
                'erro' => 'Moedas insuficientes (' . $wallet['coins'] . '/' . $cost . '). Pegue pacotes de moedas no PIX ou capture mais na rodada!',
            ]);
        }

        $newCoins = $wallet['coins'] - $cost;
        $equipped = $wallet['equipped_weapon'];
        $bonusLives = $wallet['bonus_lives'];
        $msgOut = 'Compra realizada!';

        if ($op === 'bail') {
            if ($evActive && isset($pvp[$pid])) {
                $pvp[$pid]['jailed_until'] = 0;
                $pvp[$pid]['hp'] = 100;
                if ((int)($pvp[$pid]['lives'] ?? 0) <= 0) {
                    $pvp[$pid]['lives'] = 1;
                }
                $pvp[$pid]['invuln_until'] = round($now + 3.0, 2);
            }
            $msgOut = '🔓 Fiança paga! Você está livre com 100% de vida!';
        } elseif ($op === 'life') {
            if ($evActive && isset($pvp[$pid])) {
                $pvp[$pid]['lives'] = max(0, (int)($pvp[$pid]['lives'] ?? 0)) + 1;
                $pvp[$pid]['hp'] = 100;
                $pvp[$pid]['jailed_until'] = 0;
                $pvp[$pid]['invuln_until'] = round($now + 3.0, 2);
            } else {
                $bonusLives++;
            }
            $msgOut = '❤️ +1 Vida adicionada!';
        } elseif ($op === 'buy_dupla') {
            $weapons[] = 'dupla';
            $equipped = 'dupla';
            if ($evActive && isset($pvp[$pid])) {
                $pvp[$pid]['weapon'] = 'dupla';
            }
            $msgOut = '🔫 Pistolinha Jato Duplo liberada e equipada!';
        } elseif ($op === 'buy_super') {
            $weapons[] = 'super';
            $equipped = 'super';
            if ($evActive && isset($pvp[$pid])) {
                $pvp[$pid]['weapon'] = 'super';
            }
            $msgOut = '💦 Super Esguicho Cyber liberado e equipado!';
        }

        $wJson = json_encode(array_values(array_unique($weapons)), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $pdo->prepare(
            'UPDATE policia_wallets SET coins = :c, weapons_json = :wj, equipped_weapon = :eq, bonus_lives = :bl, updated_at = :u WHERE wallet_key = :wk'
        )->execute([
            ':c' => $newCoins,
            ':wj' => ($wJson !== false) ? $wJson : '["base"]',
            ':eq' => $equipped,
            ':bl' => $bonusLives,
            ':u' => $nowTs,
            ':wk' => $wKey,
        ]);

        if ($evActive) {
            $ev['pvp'] = $pvp;
            saveRawPoliciaEvent($pdo, $ev, $nowTs);
        }

        $wallet = ensurePoliciaWalletChat($pdo, $wKey);
        $curState = ensurePoliciaEventState($pdo, $nowTs, true);
        $pdo->exec('COMMIT');
        $inTx = false;

        respondJson(200, [
            'ok' => true,
            'msg' => $msgOut,
            'wallet' => $wallet,
            'policia_event' => $curState,
        ]);
    }

    if ($action === 'kick') {
        $b = (isset($body['ball']) && is_array($body['ball'])) ? array_merge($body, $body['ball']) : $body;
        if (
            !isset($b['x'], $b['z'])
            || !is_numeric($b['x'])
            || !is_numeric($b['z'])
            || !is_finite((float)$b['x'])
            || !is_finite((float)$b['z'])
        ) {
            respondJson(400, ['ok' => false, 'erro' => 'Coordenadas da bola inválidas.']);
        }

        $bx = round(clampFloat($b['x'], -1000.0, 1000.0, 0.0), 3);
        $bz = round(clampFloat($b['z'], -1000.0, 1000.0, 0.0), 3);
        $bvx = round(clampFloat($b['vx'] ?? 0.0, -42.0, 42.0, 0.0), 3);
        $bvz = round(clampFloat($b['vz'] ?? 0.0, -42.0, 42.0, 0.0), 3);
        $rawGol = isset($b['gol']) && is_scalar($b['gol']) ? strtolower(trim((string)$b['gol'])) : '';
        $gol = in_array($rawGol, ['', 'a', 'b'], true) ? $rawGol : '';
        $rawKicker = isset($b['kicker']) && is_scalar($b['kicker'])
            ? trim(utf8Substr(stripControlsAndCollapse((string)$b['kicker']), 48))
            : '';
        $kicker = ($rawKicker !== '') ? $rawKicker : $pid;

        $pdo->exec('BEGIN IMMEDIATE');
        $inTx = true;

        $stmtCheck = $pdo->prepare('SELECT secret, seen_at FROM players WHERE pid = :pid');
        $stmtCheck->execute([':pid' => $pid]);
        $existing = $stmtCheck->fetch();
        if (
            $existing !== false
            && !hash_equals((string)$existing['secret'], $secret)
            && (float)$existing['seen_at'] > ($now - 86400.0)
        ) {
            $pdo->exec('ROLLBACK');
            $inTx = false;
            respondJson(403, ['ok' => false, 'erro' => 'Sessão inválida']);
        }

        $kKick = 'kick:' . $pid;
        $stmtKickRate = $pdo->prepare('SELECT last_ts FROM rate_limits WHERE k = :k LIMIT 1');
        $stmtKickRate->execute([':k' => $kKick]);
        $kickRateRow = $stmtKickRate->fetch();
        if ($kickRateRow !== false && ($now - (float)$kickRateRow['last_ts']) < 0.18) {
            $curBall = getBallState($pdo);
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(429, ['ok' => false, 'erro' => 'Chute muito rápido.', 'ball' => $curBall]);
        }

        $stmtSetKickRate = $pdo->prepare(
            'INSERT INTO rate_limits (k, last_ts) VALUES (:k, :last_ts)
             ON CONFLICT(k) DO UPDATE SET last_ts = excluded.last_ts'
        );
        $stmtSetKickRate->execute([':k' => $kKick, ':last_ts' => $now]);

        $prevBall = getBallState($pdo);
        $prevSeq = ($prevBall !== null) ? (int)$prevBall['seq'] : 0;
        $prevScoreA = ($prevBall !== null)
            ? (int)$prevBall['score_a']
            : clampInt($b['score_a'] ?? 0, 0, 999, 0);
        $prevScoreB = ($prevBall !== null)
            ? (int)$prevBall['score_b']
            : clampInt($b['score_b'] ?? 0, 0, 999, 0);

        $scoreA = $prevScoreA;
        $scoreB = $prevScoreB;
        $nowMs = (int)round($now * 1000.0);

        if ($gol === 'a' || $gol === 'b') {
            $stmtLastGol = $pdo->prepare("SELECT val FROM game_state WHERE key = 'ball_last_gol_ms' LIMIT 1");
            $stmtLastGol->execute();
            $lastGolRow = $stmtLastGol->fetch();
            $lastGolMs = ($lastGolRow !== false && isset($lastGolRow['val'])) ? (int)$lastGolRow['val'] : 0;

            if ($lastGolMs > 0 && ($nowMs - $lastGolMs) < 2500) {
                $gol = '';
            } else {
                if ($gol === 'a') {
                    $inA = (isset($b['score_a']) && is_numeric($b['score_a']))
                        ? clampInt($b['score_a'], 0, 999, 0)
                        : null;
                    if ($prevBall === null && $inA !== null && $inA > 0) {
                        $scoreA = $inA;
                    } else {
                        $scoreA = min(999, $prevScoreA + 1);
                    }
                } else {
                    $inB = (isset($b['score_b']) && is_numeric($b['score_b']))
                        ? clampInt($b['score_b'], 0, 999, 0)
                        : null;
                    if ($prevBall === null && $inB !== null && $inB > 0) {
                        $scoreB = $inB;
                    } else {
                        $scoreB = min(999, $prevScoreB + 1);
                    }
                }

                $stmtSaveGolTs = $pdo->prepare(
                    "INSERT INTO game_state (key, val, updated_at) VALUES ('ball_last_gol_ms', :val, :updated_at)
                     ON CONFLICT(key) DO UPDATE SET val = excluded.val, updated_at = excluded.updated_at"
                );
                $stmtSaveGolTs->execute([
                    ':val' => (string)$nowMs,
                    ':updated_at' => (int)time(),
                ]);
            }
        }

        $ball = [
            'x' => $bx,
            'z' => $bz,
            'vx' => $bvx,
            'vz' => $bvz,
            'kicker' => $kicker,
            'seq' => $prevSeq + 1,
            'gol' => $gol,
            'score_a' => $scoreA,
            'score_b' => $scoreB,
            'ts' => $nowMs,
        ];

        $ballJson = json_encode($ball, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $stmtSaveBall = $pdo->prepare(
            "INSERT INTO game_state (key, val, updated_at) VALUES ('ball', :val, :updated_at)
             ON CONFLICT(key) DO UPDATE SET val = excluded.val, updated_at = excluded.updated_at"
        );
        $stmtSaveBall->execute([
            ':val' => ($ballJson !== false) ? $ballJson : '{}',
            ':updated_at' => (int)time(),
        ]);

        $pdo->exec('COMMIT');
        $inTx = false;

        respondJson(200, ['ok' => true, 'ball' => $ball]);
    }

    $since = (isset($body['since']) && is_scalar($body['since'])) ? max(0, (int)$body['since']) : 0;
    $player = isset($body['player']) && is_array($body['player']) ? $body['player'] : [];

    $nome = cleanNome($player['nome'] ?? '');
    $arroba = cleanArroba($player['arroba'] ?? '');
    $x = clampFloat($player['x'] ?? 0.0, -650.0, 650.0, 0.0);
    $z = clampFloat($player['z'] ?? 28.0, -650.0, 350.0, 28.0);
    $ry = clampFloat($player['ry'] ?? 0.0, -7.0, 7.0, 0.0);
    $andando = toFlag($player['andando'] ?? 0);
    $fem = toFlag($player['fem'] ?? 0);

    $pele = clampColor($player['pele'] ?? null, 0xf2c29b);
    $cabelo = clampColor($player['cabelo'] ?? null, 0x5c3317);
    $camisa = clampColor($player['camisa'] ?? null, 0x1c7ed6);
    $calca = clampColor($player['calca'] ?? null, 0x2b3a55);
    $sapato = clampColor($player['sapato'] ?? null, 0x1d1d1d);

    $jump = round(clampFloat($player['jump'] ?? ($body['jump'] ?? 0.0), 0.0, 6.0, 0.0), 3);
    $emote = cleanEmote($player['emote'] ?? ($body['emote'] ?? ''));
    $carType = cleanCarType($player['car_type'] ?? ($body['car_type'] ?? ''));
    $rideOf = cleanRideOf($player['ride_of'] ?? ($body['ride_of'] ?? ''), $pid);
    $playerRoom = cleanRoom($player['room'] ?? ($body['room'] ?? ''));
    $profissao = cleanProfissao($player['profissao'] ?? ($body['profissao'] ?? ''));
    $rawBadge = $player['badge'] ?? ($body['badge'] ?? '');
    $rawCreatorKey = $player['creator_key'] ?? ($body['creator_key'] ?? '');

    $texto = '';
    $msgRoom = $playerRoom;
    if ($action === 'send') {
        $rawTexto = isset($body['texto']) && is_scalar($body['texto']) ? (string)$body['texto'] : '';
        $texto = trim(utf8Substr(stripControlsAndCollapse($rawTexto), 180));
        if ($texto === '') {
            respondJson(400, ['ok' => false, 'erro' => 'Digite uma mensagem.']);
        }
        $texto = filterProfanity($texto);
        if (array_key_exists('room', $body)) {
            $msgRoom = cleanRoom($body['room']);
        }
    }

    $ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|cgpx');

    $pdo->exec('BEGIN IMMEDIATE');
    $inTx = true;

    $stmtCheck = $pdo->prepare('SELECT secret, seen_at FROM players WHERE pid = :pid');
    $stmtCheck->execute([':pid' => $pid]);
    $existing = $stmtCheck->fetch();
    if (
        $existing !== false
        && !hash_equals((string)$existing['secret'], $secret)
        && (float)$existing['seen_at'] > ($now - 86400.0)
    ) {
        $pdo->exec('ROLLBACK');
        $inTx = false;
        respondJson(403, ['ok' => false, 'erro' => 'Sessão inválida']);
    }

    $badge = resolveBadge($pdo, $pid, $arroba, $rawBadge, $rawCreatorKey);

    $stmtUpsert = $pdo->prepare(
        'INSERT INTO players (
            pid, secret, nome, arroba, x, z, ry, andando, fem,
            pele, cabelo, camisa, calca, sapato, seen_at, ip_hash,
            jump, emote, car_type, ride_of, room, profissao, badge
        ) VALUES (
            :pid, :secret, :nome, :arroba, :x, :z, :ry, :andando, :fem,
            :pele, :cabelo, :camisa, :calca, :sapato, :seen_at, :ip_hash,
            :jump, :emote, :car_type, :ride_of, :room, :profissao, :badge
        )
        ON CONFLICT(pid) DO UPDATE SET
            secret = excluded.secret,
            nome = excluded.nome,
            arroba = excluded.arroba,
            x = excluded.x,
            z = excluded.z,
            ry = excluded.ry,
            andando = excluded.andando,
            fem = excluded.fem,
            pele = excluded.pele,
            cabelo = excluded.cabelo,
            camisa = excluded.camisa,
            calca = excluded.calca,
            sapato = excluded.sapato,
            seen_at = excluded.seen_at,
            ip_hash = excluded.ip_hash,
            jump = excluded.jump,
            emote = excluded.emote,
            car_type = excluded.car_type,
            ride_of = excluded.ride_of,
            room = excluded.room,
            profissao = excluded.profissao,
            badge = excluded.badge'
    );
    $stmtUpsert->execute([
        ':pid' => $pid,
        ':secret' => $secret,
        ':nome' => $nome,
        ':arroba' => $arroba,
        ':x' => $x,
        ':z' => $z,
        ':ry' => $ry,
        ':andando' => $andando,
        ':fem' => $fem,
        ':pele' => $pele,
        ':cabelo' => $cabelo,
        ':camisa' => $camisa,
        ':calca' => $calca,
        ':sapato' => $sapato,
        ':seen_at' => $now,
        ':ip_hash' => $ipHash,
        ':jump' => $jump,
        ':emote' => $emote,
        ':car_type' => $carType,
        ':ride_of' => $rideOf,
        ':room' => $playerRoom,
        ':profissao' => $profissao,
        ':badge' => $badge,
    ]);

    if ($action === 'send') {
        $kPid = 'pid:' . $pid;
        $kIp = 'ip:' . $ipHash;

        $stmtRate = $pdo->prepare('SELECT last_ts FROM rate_limits WHERE k = :k1 OR k = :k2');
        $stmtRate->execute([':k1' => $kPid, ':k2' => $kIp]);
        foreach ($stmtRate->fetchAll() as $rateRow) {
            if (($now - (float)$rateRow['last_ts']) < 1.5) {
                $pdo->exec('COMMIT');
                $inTx = false;
                respondJson(429, ['ok' => false, 'erro' => 'Aguarde um instante antes de enviar outra mensagem.']);
            }
        }

        $ts = time();
        $stmtDup = $pdo->prepare(
            'SELECT 1 FROM messages WHERE pid = :pid AND texto = :texto AND ts > :lim LIMIT 1'
        );
        $stmtDup->execute([
            ':pid' => $pid,
            ':texto' => $texto,
            ':lim' => $ts - 8,
        ]);
        if ($stmtDup->fetch() !== false) {
            $pdo->exec('COMMIT');
            $inTx = false;
            respondJson(429, ['ok' => false, 'erro' => 'Evite repetir a mesma mensagem em seguida.']);
        }

        $stmtSetRate = $pdo->prepare(
            'INSERT INTO rate_limits (k, last_ts) VALUES (:k, :last_ts)
             ON CONFLICT(k) DO UPDATE SET last_ts = excluded.last_ts'
        );
        $stmtSetRate->execute([':k' => $kPid, ':last_ts' => $now]);
        $stmtSetRate->execute([':k' => $kIp, ':last_ts' => $now]);

        $cor = sprintf('#%06x', $camisa);
        $stmtMsg = $pdo->prepare(
            'INSERT INTO messages (pid, nome, arroba, cor, texto, x, z, ts, room)
             VALUES (:pid, :nome, :arroba, :cor, :texto, :x, :z, :ts, :room)'
        );
        $stmtMsg->execute([
            ':pid' => $pid,
            ':nome' => $nome,
            ':arroba' => $arroba,
            ':cor' => $cor,
            ':texto' => $texto,
            ':x' => $x,
            ':z' => $z,
            ':ts' => $ts,
            ':room' => $msgRoom,
        ]);
    }

    cleanupOldData($pdo, $now);
    $pdo->exec('COMMIT');
    $inTx = false;

    $viewerRoom = array_key_exists('room', $body)
        ? cleanRoom($body['room'])
        : ($playerRoom !== '' ? $playerRoom : cleanRoom($_GET['room'] ?? ''));

    respondState($pdo, $now, $since, $viewerRoom, $pid);
} catch (Throwable $e) {
    if ($inTx && $pdo instanceof PDO) {
        try {
            $pdo->exec('ROLLBACK');
        } catch (Throwable) {
        }
    }
    respondJson(500, ['ok' => false, 'erro' => 'Erro interno no chat']);
}
