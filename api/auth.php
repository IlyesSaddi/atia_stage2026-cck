    <?php
    // ============================================================
    // api/auth.php — Authentification Membres & Admins
    // Endpoints: POST /api/auth.php?action=login-membre
    //            POST /api/auth.php?action=login-admin
    // ============================================================
    require_once '../config/db.php';

    $action = isset($_GET['action']) ? sanitize($_GET['action']) : '';
    $body   = getRequestBody();
    $db     = getDB();

    switch ($action) {

        // --------------------------------------------------------
        // POST ?action=login-membre — Connexion d'un membre
        // Equivalent: POST /api/membres/login (Spring Boot)
        // --------------------------------------------------------
        case 'login-membre':
            $email    = sanitize($body['email'] ?? '');
            $password = $body['password'] ?? '';

            if (empty($email) || empty($password)) {
                jsonResponse(array('message' => 'Email et mot de passe requis.'), 400);
            }

            $stmt = $db->prepare('SELECT * FROM membre WHERE email = ? LIMIT 1');
            $stmt->execute(array($email));
            $membre = $stmt->fetch();
            $stmt = null; // Libération de la ressource

            if (!$membre) {
                jsonResponse(array('message' => 'Membre introuvable !'), 404);
            }
            if ($membre['statut_membre'] !== 'ACTIF') {
                jsonResponse(array('message' => 'Compte non actif !'), 403);
            }
            if (!password_verify($password, $membre['password'])) {
                jsonResponse(array('message' => 'Mot de passe incorrect !'), 404);
            }

            // Récupérer les centres d'intérêt
            $stmt2 = $db->prepare('SELECT centre_interet FROM membre_centres_interet WHERE membre_id = ?');
            $stmt2->execute(array($membre['id']));
            $centres = $stmt2->fetchAll(PDO::FETCH_COLUMN);
            $stmt2 = null;

            // Date expiration = date_adhesion + 12 mois
            $dateExpiration = null;
            if ($membre['date_adhesion']) {
                $d = new DateTime($membre['date_adhesion']);
                $d->modify('+12 months');
                $dateExpiration = $d->format('Y-m-d');
            }

            $tokenData = array(
                'id'              => $membre['id'],
                'email'           => $membre['email'],
                'nom'             => $membre['nom'],
                'prenom'          => $membre['prenom'],
                'statutMembre'    => $membre['statut_membre'],
                'referenceMembre' => $membre['reference_membre'],
                'telephone'       => $membre['telephone'],
                'statut'          => $membre['statut'],
                'dateAdhesion'    => $membre['date_adhesion'],
                'dateExpiration'  => $dateExpiration,
                'centresInteret'  => $centres,
                'cinNumero'       => $membre['cin_numero'],
                'dateNaissance'   => $membre['date_naissance'],
                'exp'             => time() + 86400 * 7 // Expire dans 7 jours
            );

            $token = generateToken($tokenData);

            // Ne pas retourner password et images dans la réponse
            unset($membre['password'], $membre['cin_image_id'], $membre['justificatif_image_id'], $membre['recu_paiement_image_id']);
            $membre['centresInteret'] = $centres;
            $membre['dateExpiration'] = $dateExpiration;

            jsonResponse(array('token' => $token, 'membre' => $membre));
            break;

        // --------------------------------------------------------
        // POST ?action=login-admin — Connexion d'un administrateur
        // --------------------------------------------------------
        case 'login-admin':
            $email    = sanitize($body['email'] ?? '');
            $password = $body['password'] ?? '';

            if (empty($email) || empty($password)) {
                jsonResponse(array('message' => 'Email et mot de passe requis.'), 400);
            }

            // Vérifier d'abord dans la table admin
            $stmt = $db->prepare('SELECT *, "ADMIN" as role FROM admin WHERE email = ? LIMIT 1');
            $stmt->execute(array($email));
            $admin = $stmt->fetch();
            $stmt = null;

            // Si pas trouvé, chercher dans administratif
            if (!$admin) {
                $stmt = $db->prepare('SELECT *, "ADMINISTRATIF" as role FROM administratif WHERE email = ? LIMIT 1');
                $stmt->execute(array($email));
                $admin = $stmt->fetch();
                $stmt = null;
            }

            if (!$admin) {
                jsonResponse(array('message' => 'Administrateur introuvable !'), 404);
            }
            if (!password_verify($password, $admin['password'])) {
                jsonResponse(array('message' => 'Mot de passe incorrect !'), 404);
            }

            $tokenData = array(
                'id'    => $admin['id'],
                'email' => $admin['email'],
                'nom'   => $admin['nom'],
                'prenom'=> $admin['prenom'],
                'role'  => $admin['role'],
                'exp'   => time() + 86400 * 7
            );

            $token = generateToken($tokenData);
            unset($admin['password']);

            jsonResponse(array('token' => $token, 'admin' => $admin));
            break;

        default:
            jsonResponse(array('message' => 'Action non reconnue.'), 400);
    }

    closeDB();
