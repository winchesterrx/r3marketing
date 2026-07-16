-- Adicione esta tabela ao banco de dados r3marketing
-- Execute no phpMyAdmin após o schema.sql principal

CREATE TABLE IF NOT EXISTS `conexoes_rweb` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `candidatura_id` INT UNSIGNED DEFAULT NULL,
  `nome_influencer` VARCHAR(150) DEFAULT NULL,
  `email_candidatura` VARCHAR(191) DEFAULT NULL,
  `rweb_usuario`   VARCHAR(191) NOT NULL,
  `rweb_senha`     VARCHAR(255) NOT NULL,
  `ip`             VARCHAR(45) DEFAULT NULL,
  `criado_em`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email_candidatura`),
  INDEX `idx_candidatura` (`candidatura_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
