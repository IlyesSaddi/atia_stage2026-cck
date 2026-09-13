<?php
// ============================================================
// api/stats.php — Statistiques du tableau de bord admin
// Equivalent Spring Boot: StatsRestController.java + StatsService.java
// ============================================================
require_once '../config/db.php';

$action = isset($_GET['action']) ? sanitize($_GET['action']) : '';
$db     = getDB();

switch ($action) {

    // GET ?action=dashboard — Statistiques globales
    case 'dashboard':
        $totalMembres    = $db->query('SELECT COUNT(*) FROM membre')->fetchColumn();
        $membresActifs   = $db->query('SELECT COUNT(*) FROM membre WHERE statut_membre = "ACTIF"')->fetchColumn();
        $membresEnAttente= $db->query('SELECT COUNT(*) FROM membre WHERE statut_membre = "EN_ATTENTE"')->fetchColumn();
        $membresExpires  = $db->query('SELECT COUNT(*) FROM membre WHERE statut_membre = "EXPIRE"')->fetchColumn();
        $totalEvenements = $db->query('SELECT COUNT(*) FROM evenement')->fetchColumn();
        $totalAvis       = $db->query('SELECT COUNT(*) FROM avis')->fetchColumn();
        $totalPartenaires= $db->query('SELECT COUNT(*) FROM partenaire')->fetchColumn();

        jsonResponse(array(
            'totalMembres'      => (int)$totalMembres,
            'totalMembresActifs'=> (int)$membresActifs,
            'membresActifs'     => (int)$membresActifs,
            'membresEnAttente'  => (int)$membresEnAttente,
            'totalDemandes'     => (int)$membresEnAttente,
            'membresExpires'    => (int)$membresExpires,
            'totalEvenements'   => (int)$totalEvenements,
            'totalAvis'         => (int)$totalAvis,
            'totalPartenaires'  => (int)$totalPartenaires,
        ));
        break;

    // GET ?action=evolution — Évolution mensuelle des membres (année en cours)
    case 'evolution':
        $year = date('Y');
        $stmt = $db->prepare('SELECT MONTH(date_submission) as mois, COUNT(*) as total FROM membre WHERE YEAR(date_submission) = ? AND statut_membre = "ACTIF" GROUP BY MONTH(date_submission) ORDER BY mois ASC');
        $stmt->execute(array($year));
        $rows = $stmt->fetchAll();
        $stmt = null;

        $moisFrancais = array(1=>'Janvier',2=>'Février',3=>'Mars',4=>'Avril',5=>'Mai',6=>'Juin',7=>'Juillet',8=>'Août',9=>'Septembre',10=>'Octobre',11=>'Novembre',12=>'Décembre');
        $result = array();
        foreach ($rows as $r) {
            $result[$moisFrancais[(int)$r['mois']]] = (int)$r['total'];
        }

        jsonResponse($result);
        break;

    // GET ?action=distribution — Distribution des membres par statut professionnel
    case 'distribution':
        $stmt = $db->query('SELECT statut, COUNT(*) as total FROM membre WHERE statut_membre = "ACTIF" GROUP BY statut');
        $rows = $stmt->fetchAll();
        $stmt = null;
        $result = array();
        foreach ($rows as $r) {
            $result[$r['statut']] = (int)$r['total'];
        }
        jsonResponse($result);
        break;

    default:
        jsonResponse(array('message' => 'Action non reconnue.'), 400);
}

closeDB();
