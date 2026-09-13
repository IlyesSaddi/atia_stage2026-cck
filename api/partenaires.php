<?php
// ============================================================
// api/partenaires.php — Gestion des partenaires
// Equivalent Spring Boot: PartenaireRestController.java
// ============================================================
require_once '../config/db.php';

// ---- Helper : ajoute imageStr (base64) à un partenaire ----
function hydrateImagePartenaire($p) {
    if ($p && isset($p['img_data']) && $p['img_data'] !== null) {
        $p['imageStr'] = 'data:' . ($p['img_type'] ?? 'image/png') . ';base64,' . base64_encode($p['img_data']);
    }
    unset($p['img_data'], $p['img_type']);
    return $p;
}

function getPartenaireComplet($db, $id) {
    $stmt = $db->prepare('SELECT p.*, i.image AS img_data, i.type AS img_type FROM partenaire p LEFT JOIN image i ON p.image_id = i.id_image WHERE p.id = ?');
    $stmt->execute(array($id));
    $p = $stmt->fetch();
    return hydrateImagePartenaire($p);
}

$action = isset($_GET['action']) ? sanitize($_GET['action']) : '';
$id     = isset($_GET['id'])     ? (int)$_GET['id']         : 0;
$nom    = isset($_GET['nom'])    ? sanitize($_GET['nom'])    : '';
$type   = isset($_GET['type'])   ? sanitize($_GET['type'])   : '';
$body   = getRequestBody();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {

    // POST ?action=ajouter
    case 'ajouter':
        $stmt = $db->prepare('INSERT INTO partenaire (nom, description, siteweb, type, image_id, email, telephone, date_partenariat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute(array(
            sanitize($body['nom'] ?? ''),
            sanitize($body['description'] ?? ''),
            sanitize($body['siteweb'] ?? ''),
            sanitize($body['type'] ?? ''),
            isset($body['imageId']) ? (int)$body['imageId'] : null,
            sanitize($body['email'] ?? ''),
            sanitize($body['telephone'] ?? ''),
            empty($body['datePartenariat']) ? null : sanitize($body['datePartenariat'])
        ));
        $newId = $db->lastInsertId();
        $stmt = null;
        jsonResponse(getPartenaireComplet($db, $newId), 201);
        break;

    // PUT ?action=update
    case 'update':
        $id = isset($body['id']) ? (int)$body['id'] : $id;
        $stmt = $db->prepare('UPDATE partenaire SET nom=?, description=?, siteweb=?, type=?, image_id=?, email=?, telephone=?, date_partenariat=? WHERE id=?');
        $stmt->execute(array(
            sanitize($body['nom'] ?? ''),
            sanitize($body['description'] ?? ''),
            sanitize($body['siteweb'] ?? ''),
            sanitize($body['type'] ?? ''),
            isset($body['imageId']) ? (int)$body['imageId'] : null,
            sanitize($body['email'] ?? ''),
            sanitize($body['telephone'] ?? ''),
            empty($body['datePartenariat']) ? null : sanitize($body['datePartenariat']),
            $id
        ));
        $stmt = null;
        jsonResponse(getPartenaireComplet($db, $id));
        break;

    // DELETE ?action=delete&id=X
    case 'delete':
        $stmt = $db->prepare('DELETE FROM partenaire WHERE id = ?');
        $stmt->execute(array($id));
        $stmt = null;
        jsonResponse(array('message' => 'Partenaire supprimé'));
        break;

    // GET ?action=all
    case 'all':
        $stmt = $db->query('SELECT p.*, i.image AS img_data, i.type AS img_type FROM partenaire p LEFT JOIN image i ON p.image_id = i.id_image ORDER BY p.nom ASC');
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) { $r = hydrateImagePartenaire($r); }
        jsonResponse($rows);
        break;

    // GET ?action=get&id=X
    case 'get':
        $stmt = $db->prepare('SELECT p.*, i.image AS img_data, i.type AS img_type FROM partenaire p LEFT JOIN image i ON p.image_id = i.id_image WHERE p.id = ?');
        $stmt->execute(array($id));
        $p = $stmt->fetch();
        if (!$p) jsonResponse(array('message' => 'Partenaire introuvable'), 404);
        jsonResponse(hydrateImagePartenaire($p));
        break;

    // GET ?action=search-nom&nom=X
    case 'search-nom':
        $stmt = $db->prepare('SELECT p.*, i.image AS img_data, i.type AS img_type FROM partenaire p LEFT JOIN image i ON p.image_id = i.id_image WHERE p.nom LIKE ? ORDER BY p.nom ASC');
        $stmt->execute(array('%' . $nom . '%'));
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) { $r = hydrateImagePartenaire($r); }
        jsonResponse($rows);
        break;

    // GET ?action=search-type&type=X
    case 'search-type':
        $stmt = $db->prepare('SELECT p.*, i.image AS img_data, i.type AS img_type FROM partenaire p LEFT JOIN image i ON p.image_id = i.id_image WHERE p.type = ? ORDER BY p.nom ASC');
        $stmt->execute(array($type));
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) { $r = hydrateImagePartenaire($r); }
        jsonResponse($rows);
        break;

    default:
        jsonResponse(array('message' => 'Action non reconnue.'), 400);
}

closeDB();
