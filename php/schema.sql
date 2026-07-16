-- ============================================================
-- R3 Marketing Digital — Schema do Banco de Dados
-- Servidor: r3marketing.mysql.uhserver.com
-- Banco: r3marketing
-- CORRIGIDO: VARCHAR reduzido para respeitar limite de 767 bytes
--            com charset utf8mb4 (max 191 chars por índice)
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ------------------------------------------------------------
-- TABELA: usuarios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome`         VARCHAR(150) NOT NULL,
  `email`        VARCHAR(191) NOT NULL,
  `senha`        VARCHAR(255) NOT NULL,
  `idade`        TINYINT UNSIGNED DEFAULT NULL,
  `cidade`       VARCHAR(100) DEFAULT NULL,
  `estado`       CHAR(2) DEFAULT NULL,
  `telefone`     VARCHAR(20) DEFAULT NULL,
  `foto_perfil`  TEXT DEFAULT NULL,
  `criado_em`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: campanhas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `campanhas` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome`            VARCHAR(191) NOT NULL,
  `marca`           VARCHAR(150) NOT NULL,
  `descricao`       TEXT DEFAULT NULL,
  `requisitos`      TEXT DEFAULT NULL,
  `valor_base`      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `categoria`       ENUM('beleza','ecommerce','saude','moda','fitness','gastronomia','tecnologia','lifestyle','outro') DEFAULT 'outro',
  `imagem_url`      TEXT DEFAULT NULL,
  `data_inicio`     DATE DEFAULT NULL,
  `data_fim`        DATE DEFAULT NULL,
  `vagas`           SMALLINT UNSIGNED DEFAULT 0,
  `status`          ENUM('ativa','pausada','encerrada') DEFAULT 'ativa',
  `criado_em`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_categoria` (`categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: candidaturas
-- Nota: total_seguidores calculado via PHP (evita coluna GENERATED
--       para compatibilidade com MySQL 5.x)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `candidaturas` (
  `id`                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campanha_id`          INT UNSIGNED NOT NULL,
  `nome_completo`        VARCHAR(150) NOT NULL,
  `email`                VARCHAR(191) NOT NULL,
  `telefone`             VARCHAR(20) DEFAULT NULL,
  `idade`                TINYINT UNSIGNED DEFAULT NULL,
  `cidade`               VARCHAR(100) DEFAULT NULL,
  `estado`               CHAR(2) DEFAULT NULL,
  -- Redes Sociais
  `link_instagram`       TEXT DEFAULT NULL,
  `link_tiktok`          TEXT DEFAULT NULL,
  `link_youtube`         TEXT DEFAULT NULL,
  `link_twitter`         TEXT DEFAULT NULL,
  `link_facebook`        TEXT DEFAULT NULL,
  `link_pinterest`       TEXT DEFAULT NULL,
  `link_kwai`            TEXT DEFAULT NULL,
  -- Metricas
  `seguidores_instagram` INT UNSIGNED DEFAULT 0,
  `seguidores_tiktok`    INT UNSIGNED DEFAULT 0,
  `seguidores_youtube`   INT UNSIGNED DEFAULT 0,
  `seguidores_outros`    INT UNSIGNED DEFAULT 0,
  `taxa_engajamento`     DECIMAL(5,2) DEFAULT NULL,
  -- Nicho e Disponibilidade
  `nicho`                VARCHAR(100) DEFAULT NULL,
  `dias_disponiveis`     VARCHAR(191) DEFAULT NULL,
  `horarios_postagem`    VARCHAR(100) DEFAULT NULL,
  `frequencia_postagem`  VARCHAR(100) DEFAULT NULL,
  -- Diferencial
  `diferencial`          TEXT DEFAULT NULL,
  -- Status admin
  `status`               ENUM('pendente','em_analise','aprovado','reprovado') DEFAULT 'pendente',
  `nota_admin`           TEXT DEFAULT NULL,
  -- Aceite de termos
  `aceite_termos`        TINYINT(1) DEFAULT 0,
  -- Controle
  `ip_candidatura`       VARCHAR(45) DEFAULT NULL,
  `criado_em`            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_campanha` (`campanha_id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_candidatura_campanha`
    FOREIGN KEY (`campanha_id`) REFERENCES `campanhas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: fotos_candidatura
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fotos_candidatura` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `candidatura_id` INT UNSIGNED NOT NULL,
  `tipo`           ENUM('perfil','feed','metricas') DEFAULT 'feed',
  `arquivo`        VARCHAR(191) NOT NULL,
  `nome_original`  VARCHAR(191) DEFAULT NULL,
  `tamanho`        INT UNSIGNED DEFAULT NULL,
  `criado_em`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_candidatura` (`candidatura_id`),
  CONSTRAINT `fk_foto_candidatura`
    FOREIGN KEY (`candidatura_id`) REFERENCES `candidaturas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: admins
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome`      VARCHAR(150) NOT NULL,
  `email`     VARCHAR(191) NOT NULL,
  `senha`     VARCHAR(255) NOT NULL,
  `criado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- TABELA: sessoes_admin
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessoes_admin` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id`   INT UNSIGNED NOT NULL,
  `token`      CHAR(64) NOT NULL,
  `expira_em`  TIMESTAMP NOT NULL,
  `criado_em`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token` (`token`),
  CONSTRAINT `fk_sessao_admin`
    FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

-- Admin padrao (senha: r3marketing)
INSERT IGNORE INTO `admins` (`nome`, `email`, `senha`) VALUES
('Administrador R3', 'admin@r3marketing.com.br', 'r3marketing');

-- Campanhas de exemplo
INSERT IGNORE INTO `campanhas` (`nome`, `marca`, `descricao`, `requisitos`, `valor_base`, `categoria`, `data_inicio`, `data_fim`, `vagas`, `status`) VALUES
(
  'Beleza & Estilo Avon 2025',
  'Avon',
  'Buscamos influenciadores de beleza apaixonados por maquiagem, skincare e lifestyle para representar a Avon nas redes sociais.',
  'Minimo 5.000 seguidores no Instagram ou TikTok. Nicho: beleza, lifestyle ou moda.',
  450.00, 'beleza',
  '2025-08-01', '2025-10-31', 50, 'ativa'
),
(
  'Natura Ekos - Sustentabilidade',
  'Natura',
  'Campanha focada em sustentabilidade, bem-estar e conexao com a natureza.',
  'Minimo 3.000 seguidores. Nicho: bem-estar, sustentabilidade, saude ou lifestyle.',
  380.00, 'saude',
  '2025-08-01', '2025-11-30', 40, 'ativa'
),
(
  'Amazon Prime - Creators Program',
  'Amazon',
  'Programa para criadores de conteudo divulgarem produtos e servicos Amazon.',
  'Minimo 10.000 seguidores. Qualquer nicho de produto.',
  600.00, 'ecommerce',
  '2025-07-01', '2025-12-31', 100, 'ativa'
),
(
  'Vivara Joias - Colecao Outono',
  'Vivara',
  'Campanha de lancamento da nova colecao de joias e relogios Vivara.',
  'Minimo 8.000 seguidores. Nicho: moda, luxo ou lifestyle. Publico feminino.',
  750.00, 'moda',
  '2025-08-15', '2025-10-15', 20, 'ativa'
),
(
  'Growth Supplements - TransformaCom',
  'Growth Supplements',
  'Acao para influenciadores fitness, nutricao e saude.',
  'Minimo 5.000 seguidores. Nicho: fitness, nutricao, saude ou esportes.',
  500.00, 'fitness',
  '2025-07-15', '2025-12-31', 60, 'ativa'
);
