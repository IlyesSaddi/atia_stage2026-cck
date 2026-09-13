#!/usr/bin/env bash
# Lance tout le projet ATIA CCK en local (PHP + MySQL requis)
set -euo pipefail
cd "$(dirname "$0")"

echo "=== ATIA CCK — démarrage local ==="
echo ""
echo "Vérification MySQL..."
php -r "
require 'config/db.php';
try {
  new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME, DB_USER, DB_PASS);
  echo '  ✓ Base de données connectée (' . DB_NAME . ')' . PHP_EOL;
} catch (Exception \$e) {
  echo '  ✗ Erreur BDD : importez schema_db_mysql5.sql dans MySQL' . PHP_EOL;
  echo '    mysql -u root -p < schema_db_mysql5.sql' . PHP_EOL;
  exit(1);
}
"

echo ""
echo "Serveur PHP sur http://localhost:8080"
echo "  Site public : http://localhost:8080"
echo "  Admin       : http://localhost:8080/admin"
echo "  API test    : http://localhost:8080/api/stats/dashboard"
echo ""
echo "Connexion admin : admin@atia.tn / password"
echo "Ctrl+C pour arrêter"
echo ""

exec php -S localhost:8080 router.php
