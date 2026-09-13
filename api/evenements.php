<?php
// ============================================================
// api/evenements.php — Gestion des événements
// Equivalent Spring Boot: EvenementRestController.java
// ============================================================
require_once '../config/db.php';

$action = isset($_GET['action']) ? sanitize($_GET['action']) : '';
$id     = isset($_GET['id'])     ? (int)$_GET['id']         : 0;
$body   = getRequestBody();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

function hydrateImageEvenement($evt) {
    if ($evt && isset($evt['img_data']) && $evt['img_data'] !== null) {
        $evt['imageStr'] = 'data:' . ($evt['img_type'] ?? 'image/png') . ';base64,' . base64_encode($evt['img_data']);
    }
    unset($evt['img_data'], $evt['img_type']);
    return $evt;
}

function getEvenementComplet($db, $id) {
    $stmt = $db->prepare('SELECT e.*, i.image AS img_data, i.type AS img_type FROM evenement e LEFT JOIN image i ON e.image_id = i.id_image WHERE e.id = ?');
    $stmt->execute(array($id));
    $evt = $stmt->fetch();
    $stmt = null;
    if (!$evt) return null;
    $evt = hydrateImageEvenement($evt);
    // Calculer l'état
    if ($evt['date']) {
        $today = date('Y-m-d');
        if ($evt['date'] > $today)       $evt['etat'] = 'A VENIR';
        elseif ($evt['date'] === $today) $evt['etat'] = 'EN COURS';
        else                             $evt['etat'] = 'TERMINE';
    } else {
        $evt['etat'] = 'INCONNU';
    }
    return $evt;
}

switch ($action) {

    // POST ?action=ajouter — Créer un événement
    case 'ajouter':
        if ($method !== 'POST') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        $titre      = sanitize($body['titre'] ?? '');
        $desc       = sanitize($body['description'] ?? '');
        $date       = sanitize($body['date'] ?? '');
        $heure      = sanitize($body['heure'] ?? '');
        $lieu       = sanitize($body['lieu'] ?? '');
        $type       = sanitize($body['type'] ?? '');
        $imageId    = isset($body['imageId']) ? (int)$body['imageId'] : null;

        $stmt = $db->prepare('INSERT INTO evenement (titre, description, date, heure, lieu, type, image_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute(array($titre, $desc, $date ?: null, $heure ?: null, $lieu, $type, $imageId));
        $newId = $db->lastInsertId();
        $stmt = null;

        jsonResponse(getEvenementComplet($db, $newId), 201);
        break;

    // PUT ?action=update — Modifier un événement
    case 'update':
        if ($method !== 'PUT') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        $id         = isset($body['id']) ? (int)$body['id'] : $id;
        $titre      = sanitize($body['titre'] ?? '');
        $desc       = sanitize($body['description'] ?? '');
        $date       = sanitize($body['date'] ?? '');
        $heure      = sanitize($body['heure'] ?? '');
        $lieu       = sanitize($body['lieu'] ?? '');
        $type       = sanitize($body['type'] ?? '');
        $imageId    = isset($body['imageId']) ? (int)$body['imageId'] : null;

        $stmt = $db->prepare('UPDATE evenement SET titre=?, description=?, date=?, heure=?, lieu=?, type=?, image_id=? WHERE id=?');
        $stmt->execute(array($titre, $desc, $date ?: null, $heure ?: null, $lieu, $type, $imageId, $id));
        $stmt = null;
        jsonResponse(getEvenementComplet($db, $id));
        break;

    // DELETE ?action=delete&id=X — Supprimer un événement
    case 'delete':
        if ($method !== 'DELETE') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        if ($id <= 0) jsonResponse(array('error' => 'Identifiant invalide'), 400);
        $stmt = $db->prepare('SELECT image_id FROM evenement WHERE id = ?');
        $stmt->execute(array($id));
        $evt = $stmt->fetch();
        $stmt = null;
        $stmt = $db->prepare('DELETE FROM evenement WHERE id = ?');
        $stmt->execute(array($id));
        $stmt = null;
        if ($evt && !empty($evt['image_id'])) {
            $db->prepare('DELETE FROM image WHERE id_image = ?')->execute(array($evt['image_id']));
        }
        jsonResponse(array('message' => 'Événement supprimé'));
        break;

    // GET ?action=all — Tous les événements
    case 'all':
        $stmt = $db->query('SELECT e.*, i.image AS img_data, i.type AS img_type FROM evenement e LEFT JOIN image i ON e.image_id = i.id_image ORDER BY e.date DESC');
        $evts = $stmt->fetchAll();
        $stmt = null;
        $today = date('Y-m-d');
        foreach ($evts as &$evt) {
            if ($evt['date'] > $today)       $evt['etat'] = 'A VENIR';
            elseif ($evt['date'] === $today) $evt['etat'] = 'EN COURS';
            else                             $evt['etat'] = 'TERMINE';
            $evt = hydrateImageEvenement($evt);
        }
        jsonResponse($evts);
        break;

    // GET ?action=get&id=X — Un événement par ID
    case 'get':
        $evt = getEvenementComplet($db, $id);
        if (!$evt) jsonResponse(array('message' => 'Événement introuvable'), 404);
        jsonResponse($evt);
        break;

    default:
        jsonResponse(array('message' => 'Action non reconnue.'), 400);
}

closeDB();
