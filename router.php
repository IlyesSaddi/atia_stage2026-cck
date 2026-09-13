<?php
// ============================================================
// router.php — Router PHP pour serveur de développement local
// Usage: php -S localhost:8080 router.php
//
// Logique :
//  1. Fichiers statiques existants → servis directement
//  2. Routes /api/* → fichiers PHP backend
//  3. Routes /admin/* → admin/index.html  (SPA Angular admin)
//  4. Tout le reste → public/index.html   (SPA Angular public)
// ============================================================

$base = __DIR__;
$uri  = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri  = ltrim($uri, '/');

// ── 1. Bloquer accès direct à config/ ──────────────────────
if (strpos($uri, 'config') === 0) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Accès interdit']);
    exit;
}

// ── 2. Fichiers statiques qui existent vraiment ────────────
// D'abord chercher à la racine du projet
$directFile = $base . '/' . $uri;
if ($uri !== '' && file_exists($directFile) && !is_dir($directFile)) {
    return false; // PHP built-in server le sert directement
}

// Chercher dans admin/ (assets admin avec base href="/admin/")
$inAdmin = $base . '/admin/' . preg_replace('#^admin/#', '', $uri);
if ($uri !== '' && file_exists($inAdmin) && !is_dir($inAdmin)) {
    serveStatic($inAdmin);
    exit;
}

// Chercher dans public/ (pour que base href="/" fonctionne)
// ex: /main-3LTLMYSA.js → public/main-3LTLMYSA.js
$inPublic = $base . '/public/' . $uri;
if ($uri !== '' && file_exists($inPublic) && !is_dir($inPublic)) {
    serveStatic($inPublic);
    exit;
}

// ── 3. Routes API → fichiers PHP ──────────────────────────
if (strpos($uri, 'api/') === 0) {
    routeApi($uri, $base);
    exit;
}

// ── 4. Routes Admin → admin/index.html ─────────────────────
if ($uri === 'admin' || strpos($uri, 'admin/') === 0) {
    // Fichiers statiques dans admin/ déjà traités au step 2
    // Ici : routes SPA admin (dashboard, membres, etc.)
    header('Content-Type: text/html; charset=utf-8');
    readfile($base . '/admin/index.html');
    exit;
}

// ── 5. Tout le reste → public/index.html (SPA catch-all) ───
// Gère : /, /accueil, /evenements, /profil, /settings, etc.
header('Content-Type: text/html; charset=utf-8');
readfile($base . '/public/index.html');
exit;

// ============================================================
// FONCTIONS
// ============================================================

function serveStatic(string $path): void {
    $ext  = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $mime = [
        'js'    => 'application/javascript; charset=utf-8',
        'mjs'   => 'application/javascript; charset=utf-8',
        'css'   => 'text/css; charset=utf-8',
        'html'  => 'text/html; charset=utf-8',
        'json'  => 'application/json',
        'png'   => 'image/png',
        'jpg'   => 'image/jpeg',
        'jpeg'  => 'image/jpeg',
        'gif'   => 'image/gif',
        'svg'   => 'image/svg+xml',
        'ico'   => 'image/x-icon',
        'woff'  => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf'   => 'font/ttf',
        'eot'   => 'application/vnd.ms-fontobject',
        'pdf'   => 'application/pdf',
        'map'   => 'application/json',
        'txt'   => 'text/plain',
        'xml'   => 'application/xml',
    ][$ext] ?? 'application/octet-stream';

    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($path));
    // Cache pour fichiers avec hash dans le nom (ex: main-XXXX.js)
    if (preg_match('/\-[A-Z0-9]{8}\.(js|css)$/', basename($path))) {
        header('Cache-Control: public, max-age=31536000, immutable');
    }
    readfile($path);
}

function routeApi(string $uri, string $base): void {
    // Table de routage API : pattern → fichier PHP + params
    $routes = [
        // AUTH
        ['POST', '#^api/admin/login$#',                      'api/auth.php',            ['action'=>'login-admin']],
        ['POST', '#^api/membres/login$#',                    'api/auth.php',            ['action'=>'login-membre']],
        ['POST', '#^api/admin/save$#',                       'api/auth.php',            ['action'=>'save-admin']],
        ['POST', '#^api/valider-adherent$#',                 'api/validation.php',      []],

        // IMAGES
        ['POST', '#^api/images/upload$#',                    'api/image.php',           ['action'=>'upload']],
        ['GET',  '#^api/images/details/(\d+)$#',            'api/image.php',           ['action'=>'details']],
        ['GET',  '#^api/images/(\d+)$#',                    'api/image.php',           ['action'=>'get']],
        ['DELETE','#^api/images/(\d+)$#',                   'api/image.php',           ['action'=>'delete']],

        // MEMBRES
        ['GET',  '#^api/membres/all$#',                      'api/membres.php',         ['action'=>'all']],
        ['GET',  '#^api/membres/actifs$#',                   'api/membres.php',         ['action'=>'actifs']],
        ['GET',  '#^api/membres/expires$#',                  'api/membres.php',         ['action'=>'expires']],
        ['GET',  '#^api/membres/en-attente$#',               'api/membres.php',         ['action'=>'en-attente']],
        ['POST', '#^api/membres/ajouter$#',                  'api/membres.php',         ['action'=>'ajouter']],
        ['POST', '#^api/membres/definir-mot-de-passe$#',     'api/membres.php',         ['action'=>'definir-mot-de-passe']],
        ['POST', '#^api/membres/mot-de-passe-oublie$#',     'api/membres.php',         ['action'=>'mot-de-passe-oublie']],
        ['PUT',  '#^api/membres/activer/(\d+)$#',           'api/membres.php',         ['action'=>'activer']],
        ['PUT',  '#^api/membres/expirer/(\d+)$#',           'api/membres.php',         ['action'=>'expirer']],
        ['DELETE','#^api/membres/delete/(\d+)$#',           'api/membres.php',         ['action'=>'delete']],
        ['DELETE','#^api/membres/delete$#',                 'api/membres.php',         ['action'=>'delete']],
        ['GET',  '#^api/membres/generer/(\d+)$#',           'api/membres.php',         ['action'=>'generer']],
        ['PUT',  '#^api/membres/update-contact/(\d+)$#',    'api/membres.php',         ['action'=>'update-contact']],
        ['PUT',  '#^api/membres/(\d+)/password$#',          'api/membres.php',         ['action'=>'change-password']],
        ['POST', '#^api/membres/(\d+)/centres-interet$#',   'api/membres.php',         ['action'=>'manage-centre']],
        ['DELETE','#^api/membres/(\d+)/centres-interet$#',  'api/membres.php',         ['action'=>'manage-centre']],
        ['GET',  '#^api/membres/(\d+)$#',                   'api/membres.php',         ['action'=>'get']],

        // EVENEMENTS
        ['GET',  '#^api/evenements/all$#',                   'api/evenements.php',      ['action'=>'all']],
        ['POST', '#^api/evenements/ajouter$#',               'api/evenements.php',      ['action'=>'ajouter']],
        ['PUT',  '#^api/evenements/update$#',                'api/evenements.php',      ['action'=>'update']],
        ['DELETE','#^api/evenements/delete/(\d+)$#',        'api/evenements.php',      ['action'=>'delete']],
        ['DELETE','#^api/evenements/delete$#',              'api/evenements.php',      ['action'=>'delete']],
        ['GET',  '#^api/evenements/(\d+)$#',                'api/evenements.php',      ['action'=>'get']],

        // AVIS
        ['GET',  '#^api/avis/all$#',                         'api/avis.php',            ['action'=>'all']],
        ['GET',  '#^api/avis/top$#',                         'api/avis.php',            ['action'=>'top']],
        ['GET',  '#^api/avis/membre/(\d+)$#',               'api/avis.php',            ['action'=>'by-membre']],
        ['GET',  '#^api/avis/evenement/(\d+)$#',            'api/avis.php',            ['action'=>'by-evenement']],
        ['POST', '#^api/avis$#',                             'api/avis.php',            ['action'=>'ajouter']],
        ['PUT',  '#^api/avis/(\d+)$#',                      'api/avis.php',            ['action'=>'modifier']],
        ['DELETE','#^api/avis/(\d+)$#',                     'api/avis.php',            ['action'=>'supprimer']],

        // PARTENAIRES
        ['GET',  '#^api/partenaires/all$#',                  'api/partenaires.php',     ['action'=>'all']],
        ['POST', '#^api/partenaires/ajouter$#',              'api/partenaires.php',     ['action'=>'ajouter']],
        ['PUT',  '#^api/partenaires/update$#',               'api/partenaires.php',     ['action'=>'update']],
        ['GET',  '#^api/partenaires/search/nom/(.+)$#',     'api/partenaires.php',     ['action'=>'search-nom']],
        ['GET',  '#^api/partenaires/search/type/(.+)$#',    'api/partenaires.php',     ['action'=>'search-type']],
        ['DELETE','#^api/partenaires/delete/(\d+)$#',       'api/partenaires.php',     ['action'=>'delete']],
        ['DELETE','#^api/partenaires/delete$#',             'api/partenaires.php',     ['action'=>'delete']],
        ['GET',  '#^api/partenaires/(\d+)$#',               'api/partenaires.php',     ['action'=>'get']],

        // ADMINISTRATIF
        ['GET',  '#^api/administratif/all$#',                'api/administratif.php',   ['action'=>'all']],
        ['POST', '#^api/administratif/ajouter$#',            'api/administratif.php',   ['action'=>'ajouter']],
        ['PUT',  '#^api/administratif/update$#',             'api/administratif.php',   ['action'=>'update']],
        ['DELETE','#^api/administratif/delete/(\d+)$#',     'api/administratif.php',   ['action'=>'delete']],
        ['DELETE','#^api/administratif/delete$#',           'api/administratif.php',   ['action'=>'delete']],
        ['GET',  '#^api/administratif/(\d+)$#',             'api/administratif.php',   ['action'=>'get']],

        // NOTIFICATIONS
        ['GET',  '#^api/notifications/admin/(\d+)$#',       'api/notifications.php',   ['action'=>'admin']],
        ['GET',  '#^api/notifications/membre/(\d+)$#',      'api/notifications.php',   ['action'=>'membre']],
        ['PUT',  '#^api/notifications/(\d+)/lire$#',        'api/notifications.php',   ['action'=>'lire']],
        ['GET',  '#^api/notifications/subscribe/(\d+)$#',   'api/notifications.php',   ['action'=>'membre']],

        // STATS
        ['GET',  '#^api/stats/dashboard$#',                  'api/stats.php',           ['action'=>'dashboard']],
        ['GET',  '#^api/stats/membres/evolution$#',         'api/stats.php',           ['action'=>'evolution']],
        ['GET',  '#^api/stats/membres/distribution$#',      'api/stats.php',           ['action'=>'distribution']],

        // CHATBOT
        ['POST', '#^api/chatbot/chat$#',                     'api/chatbot.php',         []],

        // RECOMMANDATIONS
        ['GET',  '#^api/recommandations/sauvegardees/(\d+)$#','api/recommandation.php',['action'=>'sauvegardees']],
        ['GET',  '#^api/recommandations/(\d+)$#',           'api/recommandation.php',  ['action'=>'get']],
    ];

    $method = $_SERVER['REQUEST_METHOD'];

    foreach ($routes as [$allowedMethod, $pattern, $file, $params]) {
        // Accepter OPTIONS (CORS preflight) et la méthode exacte
        if ($method !== $allowedMethod && $method !== 'OPTIONS') continue;

        if (preg_match($pattern, $uri, $matches)) {
            // Headers CORS pour dev local
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');

            if ($method === 'OPTIONS') {
                http_response_code(200);
                exit;
            }

            // Injecter l'ID capturé dans $_GET si présent
            if (isset($matches[1])) {
                $_GET['id']        = $matches[1];
                $_GET['membreId']  = $matches[1];
                $_GET['adminId']   = $matches[1];
                $_GET['evenementId'] = $matches[1];
            }

            // Injecter les paramètres fixes (action, etc.)
            foreach ($params as $k => $v) {
                $_GET[$k] = $v;
            }

            // Changer le cwd pour que require_once '../config/db.php' fonctionne
            $fullPath = $base . '/' . $file;
            if (file_exists($fullPath)) {
                chdir(dirname($fullPath));
                include $fullPath;
                exit;
            }

            http_response_code(500);
            echo json_encode(['error' => "Fichier PHP introuvable: $file"]);
            exit;
        }
    }

    // Route API non trouvée
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => "Route API non trouvée: /$uri"]);
}
