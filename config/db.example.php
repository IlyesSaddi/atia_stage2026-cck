<?php
// ══════════════════════════════════════════════
// config/db.example.php — Template de configuration
// ══════════════════════════════════════════════
// 1. Copier ce fichier : cp config/db.example.php config/db.php
// 2. Remplir les valeurs ci-dessous
// 3. NE PAS commiter config/db.php (il est dans .gitignore)
// ══════════════════════════════════════════════

// ── Base de données ──────────────────────────
define('DB_HOST',    'localhost');
define('DB_NAME',    'atia_db');
define('DB_USER',    'root');
define('DB_PASS',    'VOTRE_MOT_DE_PASSE_MYSQL');
define('DB_CHARSET', 'utf8mb4');

// ── JWT ──────────────────────────────────────
// Changer cette clé secrète en production !
define('JWT_SECRET', 'VOTRE_CLE_SECRETE_JWT');

// ── Groq API (IA : chatbot + validation CIN) ─
// Obtenir une clé gratuite sur : https://console.groq.com
// Sans clé : l'IA est désactivée, fallback admin manuel
define('GROQ_API_KEY',     getenv('GROQ_API_KEY') ?: '');
define('GROQ_URL',         'https://api.groq.com/openai/v1/chat/completions');
define('GROQ_MODEL',       'openai/gpt-oss-120b');   // Chatbot texte
define('GROQ_VISION_MODEL','qwen/qwen3.6-27b');      // Vision CIN/documents

// ── Helpers ──────────────────────────────────
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}

function closeDB(): void {}

function sanitize(string $val): string {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

function jsonResponse(array $data, int $code = 200): void {
    // Convertir les clés snake_case en camelCase pour Angular
    $data = snakeToCamelKeys($data);
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function snakeToCamelKeys(array $arr): array {
    $result = [];
    foreach ($arr as $key => $val) {
        $camel = lcfirst(str_replace('_', '', ucwords((string)$key, '_')));
        $result[$camel] = is_array($val) ? snakeToCamelKeys($val) : $val;
    }
    return $result;
}
