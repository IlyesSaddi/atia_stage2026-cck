<?php
// ============================================================
// api/membres.php — Gestion complète des membres
// ============================================================
require_once '../config/db.php';

$action = isset($_GET['action']) ? sanitize($_GET['action']) : '';
$id     = isset($_GET['id'])     ? (int)$_GET['id']         : 0;
$body   = getRequestBody();
$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── Helper : loguer un email (mode démonstration sans SMTP) ──
function loggerEmail(string $to, string $subject, string $htmlBody): string {
    $logDir  = dirname(__DIR__) . '/logs';
    if (!is_dir($logDir)) { @mkdir($logDir, 0775, true); }
    $file = $logDir . '/emails.log';
    $timestamp = date('Y-m-d H:i:s');
    $plain = strip_tags($htmlBody);
    // Extraire les liens (href/url) pour qu'ils soient visibles dans le log
    $liens = array();
    if (preg_match_all('/href="([^"]+)"/', $htmlBody, $m)) $liens = $m[1];
    $liensStr = empty($liens) ? '' : "\nLIENS DANS L'EMAIL:\n" . implode("\n", $liens);
    $content = "\n=============================================\n"
             . "[$timestamp] À: $to\nSujet: $subject\n$plain$liensStr\n";
    @file_put_contents($file, $content, FILE_APPEND);
    return $file;
}

// ── Helper : envoyer un email HTML ──────────────────────────
function envoyerEmail(string $to, string $subject, string $htmlBody): bool {
    $fromName  = 'ATIA - Association Tunisienne de l\'Intelligence Artificielle';
    $fromEmail = 'noreply@atia.tn';
    $headers   = implode("\r\n", array(
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . $fromName . ' <' . $fromEmail . '>',
        'Reply-To: contact@atia.tn',
        'X-Mailer: PHP/' . PHP_VERSION,
    ));
    loggerEmail($to, $subject, $htmlBody);
    return mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $htmlBody, $headers);
}

// ── Helper : template email ATIA ────────────────────────────
function templateEmail(string $titre, string $contenu): string {
    return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"/>
<style>
  body{margin:0;padding:0;background:#0f0f1a;font-family:Arial,sans-serif}
  .wrap{max-width:560px;margin:40px auto;background:#1a1a2e;border-radius:12px;overflow:hidden;border:1px solid rgba(99,102,241,.2)}
  .header{background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center}
  .header img{width:60px;border-radius:10px}
  .header h1{color:#fff;margin:12px 0 0;font-size:20px}
  .body{padding:32px;color:rgba(255,255,255,.8);font-size:15px;line-height:1.6}
  .body p{margin:0 0 16px}
  .btn{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;margin:8px 0}
  .footer{padding:20px 32px;border-top:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.35);font-size:12px;text-align:center}
  .note{background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);border-radius:8px;padding:12px 16px;font-size:13px;margin-top:16px}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <h1>🧠 ATIA</h1>
    <p style="color:rgba(255,255,255,.7);margin:4px 0 0;font-size:14px">{$titre}</p>
  </div>
  <div class="body">{$contenu}</div>
  <div class="footer">
    Association Tunisienne de l'Intelligence Artificielle &mdash; atia.tn<br>
    Cet email est généré automatiquement, ne pas répondre.
  </div>
</div>
</body></html>
HTML;
}


// ---- Helper: récupérer un membre complet avec ses centres d'intérêt ----
function hydrateImageMembre($db, $imageId) {
    if (!$imageId) return null;
    $stmt = $db->prepare('SELECT image AS img_data, type AS img_type FROM image WHERE id_image = ?');
    $stmt->execute(array($imageId));
    $img = $stmt->fetch();
    $stmt = null;
    if (!$img || $img['img_data'] === null) return null;
    return 'data:' . ($img['img_type'] ?? 'image/png') . ';base64,' . base64_encode($img['img_data']);
}

function getMembreComplet($db, $id) {
    $stmt = $db->prepare('SELECT id, nom, prenom, email, telephone, date_naissance, statut, cin_numero, consentement, statut_membre, reference_membre, date_adhesion, date_submission, cin_image_id, justificatif_image_id, recu_paiement_image_id FROM membre WHERE id = ?');
    $stmt->execute(array($id));
    $m = $stmt->fetch();
    $stmt = null;
    if (!$m) return null;
    $m['cinImageStr']             = hydrateImageMembre($db, $m['cin_image_id'] ?? null);
    $m['justificatifImageStr']    = hydrateImageMembre($db, $m['justificatif_image_id'] ?? null);
    $m['recuPaiementImageStr']    = hydrateImageMembre($db, $m['recu_paiement_image_id'] ?? null);
    $stmt2 = $db->prepare('SELECT centre_interet FROM membre_centres_interet WHERE membre_id = ?');
    $stmt2->execute(array($m['id']));
    $m['centresInteret'] = $stmt2->fetchAll(PDO::FETCH_COLUMN);
    $stmt2 = null;
    if ($m['date_adhesion']) {
        $d = new DateTime($m['date_adhesion']);
        $d->modify('+12 months');
        $m['dateExpiration'] = $d->format('Y-m-d');
    } else {
        $m['dateExpiration'] = null;
    }
    return $m;
}

// ---- Helper: générer référence membre ----
function genererReference($nom, $prenom) {
    $initials = strtoupper(substr($nom, 0, 1) . substr($prenom, 0, 1));
    return 'ATIA-' . $initials . '-' . rand(1000, 9999);
}

switch ($action) {

    // POST ?action=ajouter — Inscription d'un nouveau membre
    case 'ajouter':
        if ($method !== 'POST') jsonResponse(array('error' => 'Méthode non autorisée'), 405);

        $nom          = sanitize($body['nom'] ?? '');
        $prenom       = sanitize($body['prenom'] ?? '');
        $email        = sanitize($body['email'] ?? '');
        $telephone    = sanitize($body['telephone'] ?? '');
        $dateNaissance= sanitize($body['dateNaissance'] ?? '');
        $statut       = sanitize($body['statut'] ?? 'ETUDIANT');
        $cinNumero    = sanitize($body['cinNumero'] ?? '');
        $consentement = isset($body['consentement']) ? (int)$body['consentement'] : 0;
        $centres      = isset($body['centresInteret']) && is_array($body['centresInteret']) ? $body['centresInteret'] : array();
        $cinImageId   = isset($body['cinImageId']) ? (int)$body['cinImageId'] : null;
        $justifImageId= isset($body['justificatifImageId']) ? (int)$body['justificatifImageId'] : null;
        $recuImageId  = isset($body['recuPaiementImageId']) ? (int)$body['recuPaiementImageId'] : null;

        // Statut : par défaut EN_ATTENTE (inscription publique), ACTIF si l'admin l'ajoute directement
        $statutMembre = sanitize($body['statutMembre'] ?? 'EN_ATTENTE');
        if (!in_array($statutMembre, array('ACTIF', 'EN_ATTENTE', 'EXPIRE'), true)) {
            $statutMembre = 'EN_ATTENTE';
        }
        $dateAdhesion = ($statutMembre === 'ACTIF') ? 'CURDATE()' : 'NULL';

        $reference = genererReference($nom, $prenom);

        $stmt = $db->prepare("INSERT INTO membre (nom, prenom, email, telephone, date_naissance, statut, cin_numero, consentement, statut_membre, reference_membre, date_submission, date_adhesion, cin_image_id, justificatif_image_id, recu_paiement_image_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), $dateAdhesion, ?, ?, ?)");
        $stmt->execute(array($nom, $prenom, $email, $telephone, $dateNaissance ?: null, $statut, $cinNumero, $consentement, $statutMembre, $reference, $cinImageId, $justifImageId, $recuImageId));
        $newId = $db->lastInsertId();
        $stmt = null;

        // Générer un lien d'activation (création du mot de passe par le membre)
        // Envoyé immédiatement après l'adhésion (publique ou admin)
        $activationLien = null;
        if (in_array($statutMembre, array('ACTIF', 'EN_ATTENTE'), true)) {
            $token    = bin2hex(random_bytes(32));
            $expira   = date('Y-m-d H:i:s', strtotime('+72 hours'));
            $stmt = $db->prepare('UPDATE membre SET activation_token = ?, token_expiration = ? WHERE id = ?');
            $stmt->execute(array($token, $expira, $newId));
            $stmt = null;

            $scheme   = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host     = $_SERVER['HTTP_HOST'] ?? 'localhost:8080';
            $activationLien = $scheme . '://' . $host . '/definir-mot-de-passe?token=' . $token;
        }

        // Enregistrer les centres d'intérêt
        foreach ($centres as $centre) {
            $c = sanitize($centre);
            $stmt = $db->prepare('INSERT INTO membre_centres_interet (membre_id, centre_interet) VALUES (?, ?)');
            $stmt->execute(array($newId, $c));
            $stmt = null;
        }

        $membreCree = getMembreComplet($db, $newId);
        if ($activationLien) {
            $membreCree['activationLien'] = $activationLien;
            // Envoyer l'email de création de mot de passe
            $html = templateEmail(
                'Bienvenue ! Créez votre mot de passe',
                '<p>Bonjour <strong>' . htmlspecialchars($prenom . ' ' . $nom) . '</strong>,</p>'
                . '<p>Votre inscription à l\'ATIA a été enregistrée. Veuillez créer votre mot de passe pour accéder à votre espace membre :'
                . '</p><p style="text-align:center"><a href="' . $activationLien . '" class="btn">Créer mon mot de passe</a></p>'
                . '<div class="note">⏰ Ce lien expire dans <strong>72 heures</strong>. '
                . 'Si vous n\'avez pas demandé cette inscription, ignorez cet email.</div>'
            );
            envoyerEmail($email, 'Bienvenue à l\'ATIA - Créez votre mot de passe', $html);
        }
        jsonResponse($membreCree, 201);
        break;

    // GET ?action=all — Tous les membres
    case 'all':
        $stmt = $db->query('SELECT id, nom, prenom, email, telephone, date_naissance, statut, cin_numero, consentement, statut_membre, reference_membre, date_adhesion, date_submission FROM membre ORDER BY date_submission DESC');
        $membres = $stmt->fetchAll();
        $stmt = null;
        foreach ($membres as &$m) {
            $stmt2 = $db->prepare('SELECT centre_interet FROM membre_centres_interet WHERE membre_id = ?');
            $stmt2->execute(array($m['id']));
            $m['centresInteret'] = $stmt2->fetchAll(PDO::FETCH_COLUMN);
            $stmt2 = null;
        }
        jsonResponse($membres);
        break;

    // GET ?action=get&id=X — Un membre par ID
    case 'get':
        $m = getMembreComplet($db, $id);
        if (!$m) jsonResponse(array('message' => 'Membre introuvable'), 404);
        jsonResponse($m);
        break;

    // GET ?action=en-attente — Membres en attente de validation
    case 'en-attente':
        $stmt = $db->query('SELECT id FROM membre WHERE statut_membre = "EN_ATTENTE" ORDER BY date_submission DESC');
        $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $stmt = null;
        $membres = array();
        foreach ($ids as $mid) {
            $membres[] = getMembreComplet($db, (int)$mid);
        }
        jsonResponse($membres);
        break;

    // GET ?action=actifs — Membres actifs
    case 'actifs':
        $stmt = $db->query('SELECT id, nom, prenom, email, telephone, statut, statut_membre, reference_membre, date_adhesion FROM membre WHERE statut_membre = "ACTIF" ORDER BY nom ASC');
        jsonResponse($stmt->fetchAll());
        break;

    // GET ?action=expires — Membres expirés
    case 'expires':
        $stmt = $db->query('SELECT id, nom, prenom, email, statut, statut_membre, date_adhesion FROM membre WHERE statut_membre = "EXPIRE" ORDER BY nom ASC');
        jsonResponse($stmt->fetchAll());
        break;

    // PUT ?action=activer&id=X — Activer un membre (admin)
    case 'activer':
        if ($method !== 'PUT') jsonResponse(array('error' => 'Méthode non autorisée'), 405);

        // Récupérer le membre
        $stmt = $db->prepare('SELECT * FROM membre WHERE id = ?');
        $stmt->execute(array($id));
        $m = $stmt->fetch();
        $stmt = null;
        if (!$m) jsonResponse(array('message' => 'Membre introuvable'), 404);

        // Générer un lien d'activation (le membre choisira son mot de passe)
        $token = bin2hex(random_bytes(32));
        $expiration = date('Y-m-d H:i:s', strtotime('+7 days'));
        $scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
        $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost:8080';
        $activationLien = $scheme . '://' . $host . '/definir-mot-de-passe?token=' . $token;

        $stmt = $db->prepare('UPDATE membre SET statut_membre = "ACTIF", date_adhesion = CURDATE(), activation_token = ?, token_expiration = ? WHERE id = ?');
        $stmt->execute(array($token, $expiration, $id));
        $stmt = null;

        $membre = getMembreComplet($db, $id);
        $membre['activationLien'] = $activationLien;

        // Envoyer l'email d'activation avec lien pour créer le mot de passe
        $html = templateEmail(
            'Votre adhésion a été approuvée !',
            '<p>Bonjour <strong>' . htmlspecialchars($membre['prenom'] . ' ' . $membre['nom']) . '</strong>,</p>'
            . '<p>Félicitations ! Votre adhésion à l\'ATIA a été <strong>approuvée</strong> par notre équipe.</p>'
            . '<p>Veuillez cliquer sur le bouton ci-dessous pour définir votre mot de passe et accéder à votre espace membre :'
            . '</p><p style="text-align:center"><a href="' . $activationLien . '" class="btn">Activer mon compte</a></p>'
            . '<div class="note">⏰ Ce lien expire dans <strong>7 jours</strong>. '
            . 'Si le lien ne fonctionne plus, contactez-nous à <a href="mailto:contact@atia.tn" style="color:#818cf8">contact@atia.tn</a></div>'
        );
        envoyerEmail($membre['email'], 'Votre adhésion ATIA a été approuvée', $html);

        jsonResponse($membre);
        break;

    // PUT ?action=expirer&id=X — Marquer un membre comme expiré
    case 'expirer':
        if ($method !== 'PUT') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        $stmt = $db->prepare('UPDATE membre SET statut_membre = "EXPIRE" WHERE id = ? AND statut_membre = "ACTIF"');
        $stmt->execute(array($id));
        $stmt = null;
        jsonResponse(getMembreComplet($db, $id));
        break;

    // PUT ?action=change-password&id=X — Changer le mot de passe
    case 'change-password':
        if ($method !== 'PUT') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        $motDePasseActuel  = $body['motDePasseActuel'] ?? '';
        $nouveauMotDePasse = $body['nouveauMotDePasse'] ?? '';

        $stmt = $db->prepare('SELECT password FROM membre WHERE id = ?');
        $stmt->execute(array($id));
        $m = $stmt->fetch();
        $stmt = null;
        if (!$m) jsonResponse(array('message' => 'Membre introuvable'), 404);

        if (!password_verify($motDePasseActuel, $m['password'])) {
            jsonResponse(array('message' => 'Mot de passe actuel incorrect'), 400);
        }

        $hash = password_hash($nouveauMotDePasse, PASSWORD_BCRYPT);
        $stmt = $db->prepare('UPDATE membre SET password = ? WHERE id = ?');
        $stmt->execute(array($hash, $id));
        $stmt = null;
        jsonResponse(array('message' => 'Mot de passe mis à jour avec succès'));
        break;

    // POST ?action=definir-mot-de-passe — Création du mot de passe via lien d'activation
    case 'definir-mot-de-passe':
        if ($method !== 'POST') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        $token   = $body['token'] ?? '';
        $motDePasse = $body['motDePasse'] ?? '';

        if (empty($token) || empty($motDePasse)) {
            jsonResponse(array('error' => 'Token et mot de passe requis.'), 400);
        }
        if (strlen($motDePasse) < 6) {
            jsonResponse(array('error' => 'Le mot de passe doit contenir au moins 6 caractères.'), 400);
        }

        $stmt = $db->prepare('SELECT * FROM membre WHERE activation_token = ? LIMIT 1');
        $stmt->execute(array($token));
        $m = $stmt->fetch();
        $stmt = null;
        if (!$m) {
            jsonResponse(array('error' => 'Lien d\'activation invalide ou déjà utilisé.'), 404);
        }
        if ($m['token_expiration'] && strtotime($m['token_expiration']) < time()) {
            jsonResponse(array('error' => 'Lien d\'activation expiré. Contactez un administrateur.'), 410);
        }

        $hash = password_hash($motDePasse, PASSWORD_BCRYPT);
        $stmt = $db->prepare('UPDATE membre SET password = ?, activation_token = NULL, token_expiration = NULL, statut_membre = "ACTIF", date_adhesion = COALESCE(date_adhesion, CURDATE()) WHERE id = ?');
        $stmt->execute(array($hash, $m['id']));
        $stmt = null;
        jsonResponse(array('message' => 'Votre mot de passe a été créé. Vous pouvez maintenant vous connecter.'));
        break;

    // POST ?action=mot-de-passe-oublie — Envoi lien de réinitialisation
    case 'mot-de-passe-oublie':
        if ($method !== 'POST') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        $emailOublie = sanitize($body['email'] ?? '');
        if (empty($emailOublie)) {
            jsonResponse(array('message' => 'Email requis.'), 400);
        }

        // Chercher le membre (ne pas révéler si l'email existe ou non)
        $stmt = $db->prepare('SELECT id, nom, prenom, email, statut_membre FROM membre WHERE email = ? LIMIT 1');
        $stmt->execute(array($emailOublie));
        $mOublie = $stmt->fetch();
        $stmt = null;

        if ($mOublie && $mOublie['statut_membre'] === 'ACTIF') {
            // Générer un nouveau token
            $tokenReset  = bin2hex(random_bytes(32));
            $expiReset   = date('Y-m-d H:i:s', strtotime('+2 hours'));
            $scheme      = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host        = $_SERVER['HTTP_HOST'] ?? 'localhost:8080';
            $resetLien   = $scheme . '://' . $host . '/definir-mot-de-passe?token=' . $tokenReset;

            $stmt = $db->prepare('UPDATE membre SET activation_token = ?, token_expiration = ? WHERE id = ?');
            $stmt->execute(array($tokenReset, $expiReset, $mOublie['id']));
            $stmt = null;

            // Envoyer l'email (logué en mode démo)
            $html = templateEmail(
                'Réinitialisation de votre mot de passe',
                '<p>Bonjour <strong>' . htmlspecialchars($mOublie['prenom'] . ' ' . $mOublie['nom']) . '</strong>,</p>'
                . '<p>Vous avez demandé à réinitialiser votre mot de passe ATIA.</p>'
                . '<p style="text-align:center"><a href="' . $resetLien . '" class="btn">Réinitialiser mon mot de passe</a></p>'
                . '<div class="note">⏰ Ce lien expire dans <strong>2 heures</strong>. '
                . 'Si vous n\'avez pas fait cette demande, ignorez cet email. Votre mot de passe reste inchangé.</div>'
            );
            envoyerEmail($mOublie['email'], 'Réinitialisation de votre mot de passe ATIA', $html);

            // Retourner le lien aussi pour la démo (en local, mail() ne fonctionne pas)
            jsonResponse(array(
                'message'  => 'Un email de réinitialisation a été envoyé à cette adresse.',
                'resetLien' => $resetLien,
            ));
        }

        // Toujours retourner 200 (ne pas révéler si l'email existe)
        jsonResponse(array('message' => 'Si cette adresse correspond à un compte ATIA, vous recevrez un email dans quelques minutes.'));
        break;

    // PUT ?action=update-contact&id=X — Modifier email/téléphone
    case 'update-contact':
        if ($method !== 'PUT') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        $updates = array();
        $params  = array();
        if (isset($body['email'])) {
            $updates[] = 'email = ?';
            $params[]  = sanitize($body['email']);
        }
        if (isset($body['telephone'])) {
            $updates[] = 'telephone = ?';
            $params[]  = sanitize($body['telephone']);
        }
        if (empty($updates)) jsonResponse(array('message' => 'Rien à mettre à jour'), 400);
        $params[] = $id;
        $stmt = $db->prepare('UPDATE membre SET ' . implode(', ', $updates) . ' WHERE id = ?');
        $stmt->execute($params);
        $stmt = null;
        jsonResponse(getMembreComplet($db, $id));
        break;

    // POST/DELETE ?action=manage-centre&id=X — Gérer les centres d'intérêt
    // Le .htaccess route /api/membres/{id}/centres-interet ici
    case 'manage-centre':
        $centre = sanitize($_GET['centre'] ?? ($body['centre'] ?? ''));
        if ($method === 'POST') {
            if (empty($centre)) jsonResponse(array('error' => 'Centre manquant'), 400);
            $stmt = $db->prepare('INSERT IGNORE INTO membre_centres_interet (membre_id, centre_interet) VALUES (?, ?)');
            $stmt->execute(array($id, $centre));
            $stmt = null;
            jsonResponse(array('message' => 'Centre ajouté'), 204);
        } else {
            $stmt = $db->prepare('DELETE FROM membre_centres_interet WHERE membre_id = ? AND centre_interet = ?');
            $stmt->execute(array($id, $centre));
            $stmt = null;
            jsonResponse(array('message' => 'Centre supprimé'), 204);
        }
        break;

    // GET ?action=add-centre&id=X — (compatibilité)
    case 'add-centre':
        $centre = sanitize($_GET['centre'] ?? ($body['centre'] ?? ''));
        if (empty($centre)) jsonResponse(array('error' => 'Centre manquant'), 400);
        $stmt = $db->prepare('INSERT IGNORE INTO membre_centres_interet (membre_id, centre_interet) VALUES (?, ?)');
        $stmt->execute(array($id, $centre));
        $stmt = null;
        jsonResponse(array('message' => 'Centre ajouté'), 204);
        break;

    // DELETE ?action=remove-centre&id=X
    case 'remove-centre':
        $centre = sanitize($_GET['centre'] ?? ($body['centre'] ?? ''));
        $stmt = $db->prepare('DELETE FROM membre_centres_interet WHERE membre_id = ? AND centre_interet = ?');
        $stmt->execute(array($id, $centre));
        $stmt = null;
        jsonResponse(array('message' => 'Centre supprimé'), 204);
        break;

    // GET ?action=generer&id=X — Génération attestation (retourne un message texte simple)
    case 'generer':
        $m = getMembreComplet($db, $id);
        if (!$m) jsonResponse(array('message' => 'Membre introuvable'), 404);
        // Génération PDF simple en texte (iText non disponible en PHP 5 sur CCK)
        $texte  = "ATTESTATION D'ADHESION\n";
        $texte .= "========================\n";
        $texte .= "Nom     : " . $m['nom'] . " " . $m['prenom'] . "\n";
        $texte .= "Ref     : " . $m['reference_membre'] . "\n";
        $texte .= "Statut  : " . $m['statut_membre'] . "\n";
        $texte .= "Adhesion: " . $m['date_adhesion'] . "\n";
        $texte .= "Expire  : " . $m['dateExpiration'] . "\n";
        $texte .= "========================\n";
        $texte .= "ATIA - Association Tunisienne pour l'Intelligence Artificielle\n";
        header('Content-Type: text/plain; charset=utf-8');
        header('Content-Disposition: attachment; filename="attestation_' . $m['nom'] . '.txt"');
        echo $texte;
        exit;
        break;

    // DELETE ?action=delete&id=X — Supprimer un membre et ses données liées
    case 'delete':
        if ($method !== 'DELETE') jsonResponse(array('error' => 'Méthode non autorisée'), 405);
        if ($id <= 0) jsonResponse(array('error' => 'Identifiant invalide'), 400);
        $m = getMembreComplet($db, $id);
        if (!$m) jsonResponse(array('error' => 'Membre introuvable'), 404);

        $imageIds = array_filter(array($m['cin_image_id'] ?? null, $m['justificatif_image_id'] ?? null, $m['recu_paiement_image_id'] ?? null));
        $db->prepare('DELETE FROM membre_centres_interet WHERE membre_id = ?')->execute(array($id));
        $db->prepare('DELETE FROM avis WHERE membre_id = ?')->execute(array($id));
        $db->prepare('DELETE FROM notification WHERE membre_id = ?')->execute(array($id));
        $db->prepare('DELETE FROM recommandation WHERE membre_id = ?')->execute(array($id));
        $db->prepare('DELETE FROM membre WHERE id = ?')->execute(array($id));
        if ($imageIds) {
            $in = implode(',', array_fill(0, count($imageIds), '?'));
            $db->prepare('DELETE FROM image WHERE id_image IN (' . $in . ')')->execute(array_values($imageIds));
        }
        jsonResponse(array('message' => 'Membre supprimé avec succès.'));
        break;

    default:
        jsonResponse(array('message' => 'Action non reconnue.'), 400);
}

closeDB();
