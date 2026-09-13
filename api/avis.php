<?php
// ============================================================
// api/avis.php — Gestion des avis (reviews)
// Equivalent Spring Boot: AvisRestController.java
// ============================================================
require_once '../config/db.php';

// ---- Helper : restructure en objets imbriqués membre/evenement ----
function hydrateAvis($a, $db = null) {
    if (!$a) return $a;
    $a['membre'] = array(
        'id'     => $a['membre_id'] ?? null,
        'nom'    => $a['nom'] ?? '',
        'prenom' => $a['prenom'] ?? '',
        'email'  => $a['email'] ?? null,
    );
    $a['evenement'] = array(
        'id'    => $a['evenement_id'] ?? null,
        'titre' => $a['evenement_titre'] ?? null,
    );
    if ($db && !empty($a['evenement_image_id'])) {
        $stmt = $db->prepare('SELECT image AS img_data, type AS img_type FROM image WHERE id_image = ?');
        $stmt->execute(array($a['evenement_image_id']));
        $img = $stmt->fetch();
        $stmt = null;
        if ($img && $img['img_data'] !== null) {
            $a['evenement']['imageStr'] = 'data:' . ($img['img_type'] ?? 'image/png') . ';base64,' . base64_encode($img['img_data']);
        }
    }
    unset($a['nom'], $a['prenom'], $a['email'], $a['evenement_id'], $a['evenement_titre'], $a['evenement_image_id']);
    return $a;
}

$action = isset($_GET['action']) ? sanitize($_GET['action']) : '';
$id     = isset($_GET['id'])          ? (int)$_GET['id']              : 0;
$membreId    = isset($_GET['membreId'])    ? (int)$_GET['membreId']    : 0;
$evenementId = isset($_GET['evenementId']) ? (int)$_GET['evenementId'] : 0;
$body   = getRequestBody();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {

    // POST ?action=ajouter — Ajouter un avis
    case 'ajouter':
        if ($method !== 'POST') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        $contenu     = sanitize($body['contenu'] ?? '');
        $membreId    = (int)($body['membreId'] ?? 0);
        $evenementId = (int)($body['evenementId'] ?? 0);

        $stmt = $db->prepare('INSERT INTO avis (contenu, date_avis, membre_id, evenement_id) VALUES (?, NOW(), ?, ?)');
        $stmt->execute(array($contenu, $membreId, $evenementId));
        $newId = $db->lastInsertId();
        $stmt = null;

        $stmt2 = $db->prepare('SELECT a.*, m.nom, m.prenom, m.email, e.titre as evenement_titre, e.image_id as evenement_image_id FROM avis a LEFT JOIN membre m ON a.membre_id = m.id LEFT JOIN evenement e ON a.evenement_id = e.id WHERE a.id = ?');
        $stmt2->execute(array($newId));
        $avis = $stmt2->fetch();
        $stmt2 = null;
        jsonResponse(hydrateAvis($avis, $db), 201);
        break;

    // PUT ?action=modifier&id=X — Modifier un avis
    case 'modifier':
        if ($method !== 'PUT') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        $contenu = sanitize($body['contenu'] ?? '');
        $stmt = $db->prepare('UPDATE avis SET contenu = ? WHERE id = ?');
        $stmt->execute(array($contenu, $id));
        $stmt = null;
        $stmt2 = $db->prepare('SELECT * FROM avis WHERE id = ?');
        $stmt2->execute(array($id));
        jsonResponse(hydrateAvis($stmt2->fetch(), $db));
        break;

    // GET ?action=all — Tous les avis
    case 'all':
        $stmt = $db->query('SELECT a.*, m.nom, m.prenom, m.email, e.titre as evenement_titre, e.image_id as evenement_image_id FROM avis a LEFT JOIN membre m ON a.membre_id = m.id LEFT JOIN evenement e ON a.evenement_id = e.id ORDER BY a.date_avis DESC');
        jsonResponse(array_map(function($row) use ($db) { return hydrateAvis($row, $db); }, $stmt->fetchAll()));
        break;

    // GET ?action=by-membre&membreId=X
    case 'by-membre':
        $stmt = $db->prepare('SELECT a.*, m.nom, m.prenom, m.email, e.titre as evenement_titre, e.image_id as evenement_image_id FROM avis a LEFT JOIN membre m ON a.membre_id = m.id LEFT JOIN evenement e ON a.evenement_id = e.id WHERE a.membre_id = ? ORDER BY a.date_avis DESC');
        $stmt->execute(array($membreId));
        jsonResponse(array_map(function($row) use ($db) { return hydrateAvis($row, $db); }, $stmt->fetchAll()));
        break;

    // GET ?action=by-evenement&evenementId=X
    case 'by-evenement':
        $stmt = $db->prepare('SELECT a.*, m.nom, m.prenom FROM avis a LEFT JOIN membre m ON a.membre_id = m.id WHERE a.evenement_id = ? ORDER BY a.date_avis DESC');
        $stmt->execute(array($evenementId));
        jsonResponse(array_map(function($row) use ($db) { return hydrateAvis($row, $db); }, $stmt->fetchAll()));
        break;

    // DELETE ?action=supprimer&id=X
    case 'supprimer':
        if ($method !== 'DELETE') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        $stmt = $db->prepare('DELETE FROM avis WHERE id = ?');
        $stmt->execute(array($id));
        $stmt = null;
        jsonResponse(array('message' => 'Avis supprimé'));
        break;

    // GET ?action=top — Top avis positifs (par longueur de contenu comme proxy de qualité)
    case 'top':
        $stmt = $db->query('SELECT a.id, a.contenu, a.date_avis, m.nom, m.prenom, e.titre as evenement_titre FROM avis a LEFT JOIN membre m ON a.membre_id = m.id LEFT JOIN evenement e ON a.evenement_id = e.id ORDER BY LENGTH(a.contenu) DESC LIMIT 5');
        jsonResponse(array_map(function($row) use ($db) { return hydrateAvis($row, $db); }, $stmt->fetchAll()));
        break;

    default:
        jsonResponse(array('message' => 'Action non reconnue.'), 400);
}

closeDB();
