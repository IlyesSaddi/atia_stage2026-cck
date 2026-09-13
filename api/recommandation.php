<?php
// ============================================================
// api/recommandation.php — Recommandation d'événements
// Remplace: Python atia-recommendation-service (PyTorch + Sentence-Transformers)
// Algorithme simplifié PHP : correspondance par mots-clés et centres d'intérêt
// ============================================================
require_once '../config/db.php';

$action   = isset($_GET['action'])   ? sanitize($_GET['action'])   : '';
$membreId = isset($_GET['membreId']) ? (int)$_GET['membreId']     : 0;
$db       = getDB();

switch ($action) {

    // GET ?action=get&membreId=X — Obtenir des recommandations pour un membre
    case 'get':
        if (!$membreId) jsonResponse(array('error' => 'membreId requis'), 400);

        // 1. Récupérer les centres d'intérêt du membre
        $stmt = $db->prepare('SELECT centre_interet FROM membre_centres_interet WHERE membre_id = ?');
        $stmt->execute(array($membreId));
        $centres = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $stmt = null;

        // 2. Récupérer les avis du membre (événements déjà consultés)
        $stmt = $db->prepare('SELECT evenement_id FROM avis WHERE membre_id = ?');
        $stmt->execute(array($membreId));
        $avisEvenementIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $stmt = null;

        // 3. Récupérer tous les événements futurs
        $today = date('Y-m-d');
        $stmt  = $db->query('SELECT id, titre, description, date, lieu, type FROM evenement WHERE date >= "' . $today . '" ORDER BY date ASC');
        $evts  = $stmt->fetchAll();
        $stmt  = null;

        // 4. Algorithme de scoring par correspondance mots-clés
        $scored = array();
        $typeMapping = array(
            'WORKSHOP'   => array('intelligence artificielle', 'ia', 'machine learning', 'deep learning', 'python', 'data science'),
            'CONFERENCE' => array('recherche', 'académique', 'publication', 'science'),
            'HACKATHON'  => array('code', 'développement', 'programmation', 'informatique', 'projet'),
            'MEETUP'     => array('réseautage', 'communauté', 'rencontre'),
            'FORMATION'  => array('formation', 'apprentissage', 'cours', 'certification'),
        );

        foreach ($evts as $evt) {
            $score    = 0;
            $raisons  = array();
            $texte    = strtolower($evt['titre'] . ' ' . $evt['description']);
            $typeEvt  = $evt['type'];

            // +3 si le type d'événement correspond aux centres d'intérêt
            foreach ($centres as $centre) {
                $centreNorm = strtolower(trim($centre));
                if (strpos($texte, $centreNorm) !== false) {
                    $score += 3;
                    $raisons[] = "Correspond à votre centre d'intérêt : " . $centre;
                }
            }

            // +2 si le type d'événement est lié aux mots-clés des centres
            if (isset($typeMapping[$typeEvt])) {
                foreach ($typeMapping[$typeEvt] as $keyword) {
                    foreach ($centres as $centre) {
                        if (strpos(strtolower($centre), $keyword) !== false) {
                            $score += 2;
                            $raisons[] = 'Type d\'événement adapté à votre profil';
                            break 2;
                        }
                    }
                }
            }

            // +1 si l'événement est dans les 30 prochains jours
            $daysUntil = (strtotime($evt['date']) - strtotime($today)) / 86400;
            if ($daysUntil <= 30) {
                $score += 1;
                $raisons[] = 'Événement proche (' . (int)$daysUntil . ' jours)';
            }

            // Ignorer les événements déjà commentés par le membre
            if (in_array($evt['id'], $avisEvenementIds)) {
                continue;
            }

            if ($score > 0) {
                $scored[] = array(
                    'id'          => (int)$evt['id'],
                    'evenement'   => $evt,
                    'score'       => $score,
                    'explication' => implode('. ', array_unique($raisons))
                );
            }
        }

        // Trier par score décroissant et retourner les 5 meilleures
        usort($scored, function($a, $b) { return $b['score'] - $a['score']; });
        $recommandations = array_slice($scored, 0, 5);

        // Si aucune recommandation ciblée, retourner les prochains événements
        if (empty($recommandations)) {
            foreach (array_slice($evts, 0, 3) as $evt) {
                if (!in_array($evt['id'], $avisEvenementIds)) {
                    $recommandations[] = array(
                        'id'          => (int)$evt['id'],
                        'evenement'   => $evt,
                        'score'       => 1,
                        'explication' => 'Événement à venir recommandé par ATIA'
                    );
                }
            }
        }

        jsonResponse($recommandations);
        break;

    // GET ?action=sauvegardees&membreId=X — Recommandations enregistrées en BDD
    case 'sauvegardees':
        $stmt = $db->prepare('SELECT r.*, e.titre, e.description, e.date, e.lieu, e.type FROM recommandation r LEFT JOIN evenement e ON r.evenement_id = e.id WHERE r.membre_id = ?');
        $stmt->execute(array($membreId));
        jsonResponse($stmt->fetchAll());
        break;

    default:
        jsonResponse(array('message' => 'Action non reconnue.'), 400);
}

closeDB();
