<?php
// ============================================================
// api/notifications.php — Gestion des notifications
// Equivalent Spring Boot: NotificationRestController.java
// Note: SSE (Server-Sent Events) remplacé par polling PHP
// ============================================================
require_once '../config/db.php';

$action   = isset($_GET['action'])   ? sanitize($_GET['action'])   : '';
$id       = isset($_GET['id'])       ? (int)$_GET['id']           : 0;
$adminId  = isset($_GET['adminId'])  ? (int)$_GET['adminId']      : 0;
$membreId = isset($_GET['membreId']) ? (int)$_GET['membreId']     : 0;
$body     = getRequestBody();
$db       = getDB();
$method   = $_SERVER['REQUEST_METHOD'];

switch ($action) {

    // GET ?action=admin&adminId=X — Notifications non lues pour un admin
    case 'admin':
        $stmt = $db->prepare('SELECT n.*, m.nom, m.prenom FROM notification n LEFT JOIN membre m ON n.membre_id = m.id WHERE n.admin_id = ? AND n.lue = 0 ORDER BY n.date_creation DESC');
        $stmt->execute(array($adminId));
        jsonResponse($stmt->fetchAll());
        break;

    // GET ?action=membre&membreId=X — Notifications non lues pour un membre
    case 'membre':
        $stmt = $db->prepare('SELECT * FROM notification WHERE membre_id = ? AND lue = 0 ORDER BY date_creation DESC');
        $stmt->execute(array($membreId));
        jsonResponse($stmt->fetchAll());
        break;

    // PUT ?action=lire&id=X — Marquer une notification comme lue
    case 'lire':
        if ($method !== 'PUT') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        $stmt = $db->prepare('UPDATE notification SET lue = 1 WHERE id = ?');
        $stmt->execute(array($id));
        $stmt = null;
        jsonResponse(array('message' => 'Notification marquée comme lue'));
        break;

    // POST ?action=ajouter — Créer une notification (usage interne)
    case 'ajouter':
        if ($method !== 'POST') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        $message  = sanitize($body['message'] ?? '');
        $type     = sanitize($body['type'] ?? 'AUTRE');
        $adminId  = isset($body['adminId'])  ? (int)$body['adminId']  : null;
        $membreId = isset($body['membreId']) ? (int)$body['membreId'] : null;

        $stmt = $db->prepare('INSERT INTO notification (message, type, lue, date_creation, admin_id, membre_id) VALUES (?, ?, 0, NOW(), ?, ?)');
        $stmt->execute(array($message, $type, $adminId, $membreId));
        $stmt = null;
        jsonResponse(array('message' => 'Notification créée'), 201);
        break;

    // GET ?action=count-admin&adminId=X — Nombre de notifications non lues
    case 'count-admin':
        $stmt = $db->prepare('SELECT COUNT(*) as count FROM notification WHERE admin_id = ? AND lue = 0');
        $stmt->execute(array($adminId));
        jsonResponse($stmt->fetch());
        break;

    default:
        jsonResponse(array('message' => 'Action non reconnue.'), 400);
}

closeDB();
