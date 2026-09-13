<?php
// ============================================================
// api/validation.php — Validation de la demande d'adhésion
// URL: POST /api/valider-adherent  (multipart/form-data)
//
// Vérification basique des champs texte uniquement.
// Réponse Angular : { valide: boolean, motifsRejet: string[] }
// ============================================================
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(array('valide' => false, 'motifsRejet' => ['Méthode non autorisée']), 405);
}

// ── Montants attendus par statut ──────────────────────────────
$MONTANTS = array(
    'etudiant'      => 20,
    'chercheur'     => 30,
    'enseignant'    => 30,
    'professionnel' => 50,
);

// ── Lire les champs du formulaire ─────────────────────────────
$nom           = sanitize($_POST['nom']            ?? '');
$prenom        = sanitize($_POST['prenom']         ?? '');
$statut        = strtolower(sanitize($_POST['statut'] ?? ''));
$cinNumero     = sanitize($_POST['cin_numero']     ?? '');
$dateNaissance = sanitize($_POST['date_naissance'] ?? '');

// ── Validation des champs obligatoires ────────────────────────
$motifsRejet = array();

if (empty($nom))    $motifsRejet[] = 'Nom requis';
if (empty($prenom)) $motifsRejet[] = 'Prénom requis';

if (empty($cinNumero)) {
    $motifsRejet[] = 'Numéro CIN requis';
} elseif (!preg_match('/^\d{8}$/', $cinNumero)) {
    $motifsRejet[] = 'Numéro CIN invalide (8 chiffres requis)';
}

if (empty($dateNaissance)) {
    $motifsRejet[] = 'Date de naissance requise';
}

if (!empty($statut) && !isset($MONTANTS[$statut])) {
    $motifsRejet[] = 'Statut invalide';
}

// ── Vérifier la présence des 3 fichiers joints ────────────────
if (!isset($_FILES['cin'])          || $_FILES['cin']['error']          !== UPLOAD_ERR_OK) {
    $motifsRejet[] = 'Photo CIN requise';
}
if (!isset($_FILES['justificatif']) || $_FILES['justificatif']['error'] !== UPLOAD_ERR_OK) {
    $motifsRejet[] = 'Justificatif de statut requis';
}
if (!isset($_FILES['recu'])         || $_FILES['recu']['error']         !== UPLOAD_ERR_OK) {
    $motifsRejet[] = 'Reçu de paiement requis';
}

// ── Si erreurs → retourner les motifs ─────────────────────────
if (!empty($motifsRejet)) {
    jsonResponse(array('valide' => false, 'motifsRejet' => $motifsRejet));
}

// ── Vérifier format des fichiers (JPG / PNG uniquement) ───────
$typesAcceptes = array('image/jpeg', 'image/jpg', 'image/png');
$tailleMax     = 5 * 1024 * 1024; // 5 Mo
$errFichiers   = array();

foreach (array('cin', 'justificatif', 'recu') as $cle) {
    $f    = $_FILES[$cle];
    $mime = mime_content_type($f['tmp_name']);
    if (!in_array($mime, $typesAcceptes, true)) {
        $errFichiers[] = "$cle : format non accepté (JPG ou PNG uniquement)";
    } elseif ($f['size'] > $tailleMax) {
        $errFichiers[] = "$cle : fichier trop grand (max 5 Mo)";
    }
}

if (!empty($errFichiers)) {
    jsonResponse(array('valide' => false, 'motifsRejet' => $errFichiers));
}

// ── Tout est valide ───────────────────────────────────────────
jsonResponse(array(
    'valide'       => true,
    'motifsRejet'  => [],
    'message'      => 'Dossier complet. Votre demande sera examinée par un administrateur.',
    'montantAttendu' => $MONTANTS[$statut] ?? 20,
));
