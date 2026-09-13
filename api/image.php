<?php
// ============================================================
// api/image.php — Gestion des images (upload/récupération BLOB MySQL)
// Equivalent Spring Boot: ImageRestController.java
// Images stockées directement en BLOB dans MySQL (conforme CCK)
// ============================================================
require_once '../config/db.php';

$action = isset($_GET['action']) ? sanitize($_GET['action']) : '';
$id     = isset($_GET['id'])     ? (int)$_GET['id']         : 0;
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {

    // POST ?action=upload — Téléverser une image
    case 'upload':
        if ($method !== 'POST') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            jsonResponse(array('error' => 'Aucun fichier reçu ou erreur d\'upload.'), 400);
        }

        $fileData = file_get_contents($_FILES['file']['tmp_name']);
        $fileName = sanitize($_FILES['file']['name']);
        $fileType = $_FILES['file']['type'];

        // Vérifier que c'est bien une image (Sécurité CCK)
        $allowedTypes = array('image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg');
        if (!in_array($fileType, $allowedTypes)) {
            jsonResponse(array('error' => 'Type de fichier non autorisé. Uniquement images acceptées.'), 400);
        }

        $stmt = $db->prepare('INSERT INTO image (name, type, image) VALUES (?, ?, ?)');
        $stmt->execute(array($fileName, $fileType, $fileData));
        $newId = $db->lastInsertId();
        $stmt = null;

        jsonResponse(array(
            'idImage' => $newId,
            'name'    => $fileName,
            'type'    => $fileType
        ), 201);
        break;

    // GET ?action=details&id=X — Détails de l'image (sans les données binaires)
    case 'details':
        $stmt = $db->prepare('SELECT id_image, name, type FROM image WHERE id_image = ?');
        $stmt->execute(array($id));
        $img = $stmt->fetch();
        $stmt = null;
        if (!$img) jsonResponse(array('error' => 'Image introuvable'), 404);
        jsonResponse($img);
        break;

    // GET ?action=get&id=X — Récupérer l'image binaire (affichage direct)
    case 'get':
        $stmt = $db->prepare('SELECT type, image FROM image WHERE id_image = ?');
        $stmt->execute(array($id));
        $img = $stmt->fetch();
        $stmt = null;
        if (!$img || !$img['image']) {
            http_response_code(404);
            exit;
        }
        // Retourner directement les bytes de l'image
        header('Content-Type: ' . $img['type']);
        header('Cache-Control: public, max-age=86400');
        echo $img['image'];
        exit;
        break;

    // DELETE ?action=delete&id=X
    case 'delete':
        if ($method !== 'DELETE') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        $stmt = $db->prepare('DELETE FROM image WHERE id_image = ?');
        $stmt->execute(array($id));
        $stmt = null;
        jsonResponse(array('message' => 'Image supprimée'));
        break;

    default:
        jsonResponse(array('message' => 'Action non reconnue.'), 400);
}

closeDB();
