<?php
// ============================================================
// api/chatbot.php — Chatbot IA via cURL vers API Groq
// Equivalent Python: atia-chatbot-service (FastAPI + Groq)
// Même résultat : appel HTTP vers api.groq.com depuis PHP
// ============================================================
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') jsonResponse(array('error' => 'Méthode non autorisée'), 405);

$body    = getRequestBody();
$message = sanitize($body['message'] ?? '');

if (empty($message)) {
    jsonResponse(array('error' => 'Message vide.'), 400);
}

// Récupérer les événements de la BDD pour le contexte du chatbot
$db     = getDB();
$stmt   = $db->query('SELECT titre, description, date, lieu, type FROM evenement ORDER BY date DESC LIMIT 20');
$evts   = $stmt->fetchAll();
$stmt   = null;

$contextEvents = '';
foreach ($evts as $e) {
    $contextEvents .= "- {$e['titre']} ({$e['type']}) le {$e['date']} à {$e['lieu']}\n";
}

// Préparer le prompt système avec contexte ATIA
$systemPrompt = "Tu es l'assistant officiel de l'ATIA (Association Tunisienne pour l'Intelligence Artificielle). Réponds toujours en français.\n\n"
    . "Si l'utilisateur envoie seulement une salutation (bonjour, salut, hello, hi, etc.) sans question, réponds exactement :\n"
    . "\"Bonjour ! Comment puis-je vous aider concernant l'ATIA ?\"\n\n"
    . "Pour les autres questions, réponds de manière professionnelle et concise, uniquement sur l'ATIA.\n\n"
    . "Événements disponibles actuellement :\n" . ($contextEvents ?: 'Aucun événement pour le moment.');

// Appel cURL vers l'API Groq (remplace FastAPI + Groq Python)
$payload = json_encode(array(
    'model'    => GROQ_MODEL,
    'messages' => array(
        array('role' => 'system',  'content' => $systemPrompt),
        array('role' => 'user',    'content' => $message)
    ),
    'max_tokens'  => 512,
    'temperature' => 0.3
));

$ch = curl_init(GROQ_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Authorization: Bearer ' . GROQ_API_KEY,
    'Content-Type: application/json'
));
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$result = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error  = curl_error($ch);
curl_close($ch);

if ($error) {
    jsonResponse(array('error' => 'Erreur de connexion au service de chatbot.'), 503);
}

$data = json_decode($result, true);

if ($status !== 200) {
    $apiError = $data['error']['message'] ?? 'Erreur du service de chatbot.';
    jsonResponse(array('error' => $apiError), $status >= 400 && $status < 600 ? $status : 502);
}

$response = isset($data['choices'][0]['message']['content'])
    ? trim($data['choices'][0]['message']['content'])
    : null;

if ($response === null || $response === '') {
    jsonResponse(array('error' => 'Réponse vide du service de chatbot.'), 502);
}

jsonResponse(array('response' => $response));
closeDB();
