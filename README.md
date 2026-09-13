# ATIA — Version CCK
### Association Tunisienne pour l'Intelligence Artificielle

> Version complète compatible **Centre de Calcul El-Khawarizmi (CCK)**  
> Stack : **PHP · MySQL · Apache 2 · Angular (compilé)**  
> ✅ Testé : **15/15 endpoints OK**

---

## 📁 Structure du projet

- **Stockage images :** LONGBLOB MySQL (pas de fichiers sur disque) |
```

## Réponses pour la demande d'hébergement (CCK)

Ci‑dessous les informations extraites du projet `atia-cck-version` et les champs à compléter pour la soumission au Centre de Calcul El‑Khawarizmi (CCK).

- **Projet / Nom du site :** ATIA — Association Tunisienne pour l'Intelligence Artificielle
- **URL souhaitée :** [À REMPLIR] (ex. https://atia.univ.tn)

- **Établissement :** [À REMPLIR]
- **Adresse (tél, fax, e‑mail) :** [À REMPLIR]
- **Nom & fonction du responsable de l’établissement :** [À REMPLIR]
- **Coordonnées personnelles du responsable (tél, e‑mail) :** [À REMPLIR]

Responsables du site
- **Responsable du contenu :** ATIA (ou [À REMPLIR])
- **Coordonnées du responsable du contenu :** [À REMPLIR]
- **Responsable technique (webmaster) :** [À REMPLIR]
- **Coordonnées du webmaster :** [À REMPLIR]

Description du site
- **Objectifs / description courte :** Gestion adhésions/membres, gestion événements, publication d'avis, dashboard administratif, chatbot IA et moteur de recommandations (extrait du projet).
- **Remarques / délais de mise en service :** [À REMPLIR]

Contenu & stockage
- **Type :** Contenu dynamique (PHP + MySQL) + frontends statiques Angular compilés (`public/`, `admin/`).
- **SGBD :** MySQL (compatible 5.7 / 8.x)
- **Nom de la base :** `atia_db` (fourni par `schema_db_mysql5.sql`)
- **Méthode de connexion :** PDO MySQL (fichier unique `config/db.php`)
- **Technos serveur :** PHP 7.4+ / PHP 8.x, Apache2 + mod_rewrite, MySQL, extensions PHP PDO, cURL
- **Chatbot IA :** Utilise Groq API (clé dans `config/db.php` via `GROQ_API_KEY`)
- **Stockage images :** LONGBLOB en base de données
- **Espace recommandé (estimation initiale) :** 20–50 GB (à ajuster selon volume d'images)

Langues supportées
- Français (principal), Anglais (optionnel), Arabe (si souhaité)

Services offerts (précochés selon le projet)
- Administration en ligne du site web: Oui
- Gestion d'une conférence/événements en ligne: Oui
- Résultats / attestations en ligne: Oui
- Dépôt de dossiers/inscriptions en ligne: Oui
- Chatbot IA & recommandations: Oui (Groq API)
- Paiement électronique: [À REMPLIR si nécessaire]

Périodes critiques & charge
- **Périodes critiques proposées :** pendant événements/inscriptions
- **Seuils estimés (front office) :** ~200 accès simultanés (à confirmer)

Configuration serveurs (suggestion)
- **Frontaux (web)**: CPU 2–4 cœurs, RAM 4–8 Go (8 Go recommended), Disque 20–50 GB SSD, OS Ubuntu 20.04 / Debian 10+, Nombre: 1 (scalable)
- **BDD**: CPU 2–4 cœurs, RAM 8 Go recommandé, Disque 50–100 GB SSD, MySQL 5.7/8.x, Nombre: 1 (séparé du frontal recommandé)

Architecture & utilisation
- **Architecture recommandée :** 3‑tiers (web / app / BDD séparés)
- **Programmation modulaire :** Oui
- **Nature BDD :** centralisée
- **Connexions prévues (front office) :** ~200 simultanés (à confirmer)
- **Connexions back office / admins :** 5–20 simultanés
- **Scénario d'utilisation :** Visiteurs consultent le site public, inscrivent des membres; admins gèrent via `/admin`; chatbot accessible via `/api/chatbot`.

Mise à jour du contenu
- **Responsable mise à jour :** [À REMPLIR]
- **Adresse IP autorisée pour mise à jour :** [À REMPLIR ou indiquer plage IP de l'établissement]

Sécurité & accès
- **Compte admin par défaut (doit être changé en production) :** `admin@atia.tn` (mot de passe initial `admin123` / ou `password` selon README)
- **Remarques sécurité :** Requiert clé Groq pour IA, config/db.php doit être protégé et les mots de passe modifiés.

Signataire / Dates
- **Signataire (nom & fonction) :** [À REMPLIR]
- **Date :** [À REMPLIR]

Prochaine étape
- Fournis les champs marqués `[À REMPLIR]` ou autorise-moi à générer un PDF prérempli pour impression/signature.

atia-cck-version/              ← TOUT le projet est ici (rien à l'extérieur)
│
├── 🔧 BACKEND PHP
│   ├── config/db.php          ← seul fichier connexion BDD (règle CCK)
│   └── api/
│       ├── auth.php           ← login membres & admins
│       ├── membres.php        ← CRUD membres, activation, profil
│       ├── evenements.php     ← CRUD événements
│       ├── avis.php           ← CRUD avis
│       ├── partenaires.php    ← CRUD partenaires
│       ├── administratif.php  ← CRUD bureau exécutif
│       ├── notifications.php  ← notifications
│       ├── stats.php          ← statistiques dashboard
│       ├── image.php          ← upload/récupération images (BLOB MySQL)
│       ├── chatbot.php        ← chatbot IA (Groq API via cURL)
│       ├── recommandation.php ← recommandations d'événements
│       └── validation.php     ← validation adhésion IA
│
├── 🌐 FRONTENDS (déploiement direct)
│   ├── public/                ← site public Angular compilé
│   └── admin/                 ← interface admin Angular compilée
│
├── 📦 SOURCES FRONTEND (pour recompiler si besoin)
│   ├── frontend-public/       ← code source Angular public
│   └── frontend-admin/        ← code source Angular admin
│
├── ⚙️  CONFIG SERVEUR
│   ├── .htaccess              ← routage Apache 2 (55 routes REST)
│   └── router.php             ← router pour dev local (php -S)
│
└── 🗄️  BASE DE DONNÉES
    └── schema_db_mysql5.sql   ← script SQL (10 tables, MySQL 5/8)
```

---

## 🚀 Lancer en local (développement)

### Étape 1 — Initialiser la base de données

Ouvre un terminal et importe le schéma SQL :

```bash
mysql -u root -p < atia-cck-version/schema_db_mysql5.sql
```

Ou via **phpMyAdmin** : Importer → sélectionner `schema_db_mysql5.sql` → Exécuter.

---

### Étape 2 — Configurer la connexion BDD

Ouvre [`config/db.php`](config/db.php) et modifie si besoin :

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'atia_db');
define('DB_USER', 'root');
define('DB_PASS', 'ton_mot_de_passe');   // ← adapter ici
define('GROQ_API_KEY', 'gsk_xxxx...');  // ← ta clé Groq pour le chatbot
```

---

### Étape 3 — Lancer le serveur

Depuis le dossier `atia-cck-version/`, ouvre un terminal et tape :

```bash
php -S localhost:8080 router.php
```

Tu verras :
```
PHP 8.x Development Server (http://localhost:8080) started
```

**Laisse ce terminal ouvert** — le serveur doit rester actif.

---

### Étape 4 — Ouvrir dans le navigateur

| Page | URL | Description |
|---|---|---|
| 🌐 Site public | **http://localhost:8080** | Accueil, événements, chatbot, adhésion |
| 🔐 Interface admin | **http://localhost:8080/admin** | Dashboard, gestion membres/events |
| 🧪 Tester l'API | http://localhost:8080/api/stats/dashboard | Test direct API JSON |

---

### Connexion par défaut

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@atia.tn` | `password` |

> Le hash BCrypt dans le schéma SQL correspond au mot de passe `password`.

---

## 🌍 Déployer sur le serveur CCK

### 1. Vérifier les frontends compilés

```bash
ls public/    # doit contenir : index.html  main-xxx.js  styles-xxx.css
ls admin/     # doit contenir : index.html  main-xxx.js  styles-xxx.css
```

Si l'un des dossiers est vide, recompiler depuis les sources :

```bash
# Frontend public
cd frontend-public
npm install
npm run build -- --configuration production
cp -r dist/*/browser/* ../public/

# Frontend admin
cd ../frontend-admin
npm install
npm run build -- --configuration production
cp -r dist/*/browser/* ../admin/
```

### 2. Uploader sur le CCK

**Via SCP (SSH) :**
```bash
# Depuis le dossier atia-cck-version/
rsync -av \
  --exclude='frontend-public' \
  --exclude='frontend-admin' \
  --exclude='router.php' \
  ./ user@serveur-cck.rnu.tn:/var/www/html/
```

**Via FTP :**
```
Hôte    : ftp.votre-labo.rnu.tn
Dossier : /var/www/html/
Copier  : tous les fichiers sauf frontend-public/ et frontend-admin/
```

### 3. Configurer la BDD sur le CCK

1. Aller sur **phpMyAdmin** du CCK
2. Créer la base `atia_db`
3. Importer `schema_db_mysql5.sql`
4. Modifier `config/db.php` avec les credentials du CCK

### 4. Activer mod_rewrite (si pas déjà fait)

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

---

## 🔗 Endpoints API

Toutes les URLs sont identiques à l'application Spring Boot originale.

### Auth
| Méthode | URL | Description |
|---|---|---|
| `POST` | `/api/membres/login` | Connexion membre |
| `POST` | `/api/admin/login` | Connexion admin |

### Membres
| Méthode | URL | Description |
|---|---|---|
| `GET` | `/api/membres/all` | Tous les membres |
| `GET` | `/api/membres/actifs` | Membres actifs |
| `GET` | `/api/membres/en-attente` | En attente de validation |
| `GET` | `/api/membres/expires` | Membres expirés |
| `GET` | `/api/membres/{id}` | Membre par ID |
| `POST` | `/api/membres/ajouter` | Inscription nouveau membre |
| `PUT` | `/api/membres/activer/{id}` | Activer un membre |
| `PUT` | `/api/membres/update-contact/{id}` | Modifier email/tél |
| `PUT` | `/api/membres/{id}/password` | Changer mot de passe |
| `GET` | `/api/membres/generer/{id}` | Attestation d'adhésion |

### Événements
| Méthode | URL | Description |
|---|---|---|
| `GET` | `/api/evenements/all` | Tous les événements |
| `GET` | `/api/evenements/{id}` | Événement par ID |
| `POST` | `/api/evenements/ajouter` | Créer un événement |
| `PUT` | `/api/evenements/update` | Modifier un événement |
| `DELETE` | `/api/evenements/delete/{id}` | Supprimer |

### Avis
| Méthode | URL | Description |
|---|---|---|
| `GET` | `/api/avis/all` | Tous les avis |
| `GET` | `/api/avis/top` | Top 5 avis |
| `GET` | `/api/avis/evenement/{id}` | Avis d'un événement |
| `POST` | `/api/avis` | Ajouter un avis |
| `PUT` | `/api/avis/{id}` | Modifier un avis |
| `DELETE` | `/api/avis/{id}` | Supprimer un avis |

### Stats & Autres
| Méthode | URL | Description |
|---|---|---|
| `GET` | `/api/stats/dashboard` | Statistiques globales |
| `GET` | `/api/stats/membres/evolution` | Évolution mensuelle |
| `GET` | `/api/stats/membres/distribution` | Distribution par statut |
| `POST` | `/api/chatbot/chat` | Message au chatbot IA |
| `GET` | `/api/recommandations/{membreId}` | Recommandations événements |
| `POST` | `/api/images/upload` | Upload image (BLOB) |
| `GET` | `/api/images/{id}` | Récupérer une image |
| `GET` | `/api/partenaires/all` | Tous les partenaires |
| `GET` | `/api/administratif/all` | Membres du bureau |

---

## 🔒 Conformité sécurité CCK

| Règle | Statut |
|---|---|
| Anti-injection SQL (requêtes préparées PDO) | ✅ |
| Anti-XSS (`htmlspecialchars` + `strip_tags`) | ✅ |
| Un seul fichier de connexion BDD (`config/db.php`) | ✅ |
| Mots de passe hashés (`password_hash` BCrypt) | ✅ |
| Messages d'erreurs génériques (aucun SQL exposé) | ✅ |
| Accès direct à `config/` bloqué (`.htaccess`) | ✅ |

---

## 🛠️ Technologies

| Composant | Technologie |
|---|---|
| Backend | PHP (compatible 7.4+) |
| Base de données | MySQL 5.7 / 8.x |
| Serveur production | Apache 2 + mod_rewrite |
| Serveur développement | `php -S localhost:8080 router.php` |
| Frontend | Angular (compilé en JS/CSS statiques) |
| Chatbot IA | Groq API — Meta LLaMA via cURL PHP |
| Authentification | JWT (implémentation PHP native) |
| Stockage images | LONGBLOB MySQL (pas de fichiers sur disque) |
