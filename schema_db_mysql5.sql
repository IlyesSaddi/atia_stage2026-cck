-- ============================================================
-- ATIA Database Schema - MySQL 5 Compatible
-- Centre de Calcul El-Khawarizmi (CCK) Compliant
-- Engine: InnoDB, Charset: utf8
-- ============================================================

CREATE DATABASE IF NOT EXISTS atia_db CHARACTER SET utf8 COLLATE utf8_general_ci;
USE atia_db;

-- ============================================================
-- Table: image (fichiers stockés en LONGBLOB dans MySQL)
-- ============================================================
CREATE TABLE IF NOT EXISTS image (
    id_image BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255),
    type VARCHAR(255),
    image LONGBLOB,
    PRIMARY KEY (id_image)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Table: membre
-- ============================================================
CREATE TABLE IF NOT EXISTS membre (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nom VARCHAR(255),
    prenom VARCHAR(255),
    email VARCHAR(255),
    telephone VARCHAR(255),
    date_naissance DATE,
    statut ENUM('CHERCHEUR','ENSEIGNANT','ETUDIANT','PROFESSIONNEL'),
    cin_numero VARCHAR(255),
    password VARCHAR(255),
    activation_token VARCHAR(255),
    token_expiration DATETIME,
    consentement TINYINT(1) DEFAULT 0,
    statut_membre ENUM('ACTIF','EN_ATTENTE','EXPIRE') DEFAULT 'EN_ATTENTE',
    reference_membre VARCHAR(255),
    date_adhesion DATE,
    date_submission DATETIME,
    cin_image_id BIGINT,
    justificatif_image_id BIGINT,
    recu_paiement_image_id BIGINT,
    PRIMARY KEY (id),
    UNIQUE KEY uk_cin_image (cin_image_id),
    UNIQUE KEY uk_justificatif (justificatif_image_id),
    UNIQUE KEY uk_recu (recu_paiement_image_id),
    FOREIGN KEY (cin_image_id) REFERENCES image(id_image),
    FOREIGN KEY (justificatif_image_id) REFERENCES image(id_image),
    FOREIGN KEY (recu_paiement_image_id) REFERENCES image(id_image)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Table: membre_centres_interet
-- ============================================================
CREATE TABLE IF NOT EXISTS membre_centres_interet (
    membre_id BIGINT NOT NULL,
    centre_interet VARCHAR(255),
    FOREIGN KEY (membre_id) REFERENCES membre(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Table: admin
-- ============================================================
CREATE TABLE IF NOT EXISTS admin (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nom VARCHAR(255),
    prenom VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(100),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Table: administratif
-- ============================================================
CREATE TABLE IF NOT EXISTS administratif (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nom VARCHAR(255),
    prenom VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(255) DEFAULT 'ADMINISTRATIF',
    fonction VARCHAR(255),
    telephone VARCHAR(255),
    image_id BIGINT,
    PRIMARY KEY (id),
    FOREIGN KEY (image_id) REFERENCES image(id_image)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Table: evenement
-- ============================================================
CREATE TABLE IF NOT EXISTS evenement (
    id BIGINT NOT NULL AUTO_INCREMENT,
    titre VARCHAR(255),
    description TEXT,
    date DATE,
    heure TIME,
    lieu VARCHAR(255),
    type ENUM('WORKSHOP','CONFERENCE','HACKATHON','MEETUP','FORMATION'),
    image_id BIGINT,
    PRIMARY KEY (id),
    FOREIGN KEY (image_id) REFERENCES image(id_image)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Table: avis
-- ============================================================
CREATE TABLE IF NOT EXISTS avis (
    id BIGINT NOT NULL AUTO_INCREMENT,
    contenu TEXT,
    date_avis DATETIME,
    membre_id BIGINT,
    evenement_id BIGINT,
    PRIMARY KEY (id),
    FOREIGN KEY (membre_id) REFERENCES membre(id),
    FOREIGN KEY (evenement_id) REFERENCES evenement(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Table: partenaire
-- ============================================================
CREATE TABLE IF NOT EXISTS partenaire (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nom VARCHAR(255),
    siteweb VARCHAR(255),
    description TEXT,
    email VARCHAR(255),
    telephone VARCHAR(255),
    date_partenariat DATE,
    type ENUM('ACADEMIQUE','ENTREPRISE','INSTITUTION','ONG'),
    image_id BIGINT,
    PRIMARY KEY (id),
    FOREIGN KEY (image_id) REFERENCES image(id_image)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Table: notification
-- ============================================================
CREATE TABLE IF NOT EXISTS notification (
    id BIGINT NOT NULL AUTO_INCREMENT,
    titre VARCHAR(255),
    message TEXT,
    type ENUM('DEMANDE_ADHESION','ACTIVATION_COMPTE','EXPIRATION_COMPTE','AUTRE'),
    lue TINYINT(1) DEFAULT 0,
    date_creation DATETIME,
    admin_id BIGINT,
    membre_id BIGINT,
    PRIMARY KEY (id),
    FOREIGN KEY (admin_id) REFERENCES admin(id),
    FOREIGN KEY (membre_id) REFERENCES membre(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Table: recommandation
-- ============================================================
CREATE TABLE IF NOT EXISTS recommandation (
    id BIGINT NOT NULL AUTO_INCREMENT,
    membre_id BIGINT,
    evenement_id BIGINT,
    score DOUBLE,
    raison VARCHAR(255),
    PRIMARY KEY (id),
    FOREIGN KEY (membre_id) REFERENCES membre(id),
    FOREIGN KEY (evenement_id) REFERENCES evenement(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ============================================================
-- Insert default admin
-- Password: admin123 (BCrypt hash - use PHP password_hash() equivalent)
-- ============================================================
INSERT INTO admin (nom, prenom, email, password, role)
VALUES ('Admin', 'ATIA', 'admin@atia.tn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN');
