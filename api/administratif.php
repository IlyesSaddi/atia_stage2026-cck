<?php
// ============================================================
// api/administratif.php — Gestion des membres administratifs
// Equivalent Spring Boot: AdministratifRestController.java
// ============================================================
require_once '../config/db.php';

function hydrateAdministratif($a) {
    if ($a && isset($a['img_data']) && $a['img_data'] !== null) {
        $a['imageStr'] = 'data:' . ($a['img_type'] ?? 'image/png') . ';base64,' . base64_encode($a['img_data']);
    }
    unset($a['img_data'], $a['img_type']);
    return $a;
}

$action = isset($_GET['action']) ? sanitize($_GET['action']) : '';
$id     = isset($_GET['id'])     ? (int)$_GET['id']         : 0;
$body   = getRequestBody();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {

    case 'ajouter':
        $stmt = $db->prepare('INSERT INTO administratif (nom, prenom, email, password, role, fonction, telephone, image_id) VALUES (?, ?, ?, ?, "ADMINISTRATIF", ?, ?, ?)');
        $stmt->execute(array(
            sanitize($body['nom'] ?? ''),
            sanitize($body['prenom'] ?? ''),
            sanitize($body['email'] ?? ''),
            password_hash($body['password'] ?? 'atia2024', PASSWORD_BCRYPT),
            sanitize($body['fonction'] ?? ''),
            sanitize($body['telephone'] ?? ''),
            isset($body['imageId']) ? (int)$body['imageId'] : null
        ));
        $newId = $db->lastInsertId();
        $stmt = null;
        $stmt2 = $db->prepare('SELECT a.*, i.image AS img_data, i.type AS img_type FROM administratif a LEFT JOIN image i ON a.image_id = i.id_image WHERE a.id = ?');
        $stmt2->execute(array($newId));
        jsonResponse(hydrateAdministratif($stmt2->fetch()), 201);
        break;

    case 'update':
        $id = isset($body['id']) ? (int)$body['id'] : $id;
        $stmt = $db->prepare('UPDATE administratif SET nom=?, prenom=?, email=?, fonction=?, telephone=?, image_id=? WHERE id=?');
        $stmt->execute(array(
            sanitize($body['nom'] ?? ''),
            sanitize($body['prenom'] ?? ''),
            sanitize($body['email'] ?? ''),
            sanitize($body['fonction'] ?? ''),
            sanitize($body['telephone'] ?? ''),
            isset($body['imageId']) ? (int)$body['imageId'] : null,
            $id
        ));
        $stmt = null;
        $stmt2 = $db->prepare('SELECT a.*, i.image AS img_data, i.type AS img_type FROM administratif a LEFT JOIN image i ON a.image_id = i.id_image WHERE a.id = ?');
        $stmt2->execute(array($id));
        jsonResponse(hydrateAdministratif($stmt2->fetch()));
        break;

    case 'delete':
        $stmt = $db->prepare('DELETE FROM administratif WHERE id = ?');
        $stmt->execute(array($id));
        $stmt = null;
        jsonResponse(array('message' => 'Administratif supprimé'));
        break;

    case 'all':
        $stmt = $db->query('SELECT a.id, a.nom, a.prenom, a.email, a.role, a.fonction, a.telephone AS tlf, a.image_id, i.image AS img_data, i.type AS img_type FROM administratif a LEFT JOIN image i ON a.image_id = i.id_image ORDER BY a.nom ASC');
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) { $r = hydrateAdministratif($r); }
        jsonResponse($rows);
        break;

    case 'get':
        $stmt = $db->prepare('SELECT a.id, a.nom, a.prenom, a.email, a.role, a.fonction, a.telephone AS tlf, a.image_id, i.image AS img_data, i.type AS img_type FROM administratif a LEFT JOIN image i ON a.image_id = i.id_image WHERE a.id = ?');
        $stmt->execute(array($id));
        $a = $stmt->fetch();
        if (!$a) jsonResponse(array('message' => 'Administratif introuvable'), 404);
        jsonResponse(hydrateAdministratif($a));
        break;

    default:
        jsonResponse(array('message' => 'Action non reconnue.'), 400);
}

closeDB();
