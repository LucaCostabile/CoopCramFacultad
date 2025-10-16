-- Esquema y tablas equivalentes al proyecto Laravel actual
-- Motor objetivo: MySQL 8+/MariaDB (InnoDB, utf8mb4)

CREATE SCHEMA IF NOT EXISTS `facucram` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `facucram`;

-- =============================
-- Tabla: users
-- =============================
CREATE TABLE IF NOT EXISTS `users` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(255) NOT NULL DEFAULT 'sin_rol',
	`email` varchar(255) DEFAULT NULL,
	`phone` varchar(255) DEFAULT NULL,
	`email_pending` varchar(255) DEFAULT NULL,
	`email_verified_at` timestamp NULL DEFAULT NULL,
	`password` varchar(255) DEFAULT NULL,
	`remember_token` varchar(100) DEFAULT NULL,
	`is_disabled` tinyint(1) NOT NULL DEFAULT 0,
	`login_count` bigint unsigned NOT NULL DEFAULT 0,
	`last_login_at` timestamp NULL DEFAULT NULL,
	`created_at` timestamp NULL DEFAULT NULL,
	`updated_at` timestamp NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `users_email_unique` (`email`),
	UNIQUE KEY `users_phone_unique` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Tabla: password_reset_tokens
-- =============================
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
	`email` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp NULL DEFAULT NULL,
	PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Tabla: sessions (estructura por defecto de Laravel)
-- Nota: user_id aquí es BIGINT (como la tabla default), en tu app users.id es string;
-- no se define FK para evitar incompatibilidad de tipos (igual que en las migraciones).
-- =============================
CREATE TABLE IF NOT EXISTS `sessions` (
	`id` varchar(255) NOT NULL,
	`user_id` bigint unsigned DEFAULT NULL,
	`ip_address` varchar(45) DEFAULT NULL,
	`user_agent` text DEFAULT NULL,
	`payload` longtext NOT NULL,
	`last_activity` int NOT NULL,
	PRIMARY KEY (`id`),
	KEY `sessions_user_id_index` (`user_id`),
	KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Tabla: cache
-- =============================
CREATE TABLE IF NOT EXISTS `cache` (
	`key` varchar(255) NOT NULL,
	`value` mediumtext NOT NULL,
	`expiration` int NOT NULL,
	PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Tabla: cache_locks
-- =============================
CREATE TABLE IF NOT EXISTS `cache_locks` (
	`key` varchar(255) NOT NULL,
	`owner` varchar(255) NOT NULL,
	`expiration` int NOT NULL,
	PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Tablas de jobs (queue)
-- =============================
CREATE TABLE IF NOT EXISTS `jobs` (
	`id` bigint unsigned NOT NULL AUTO_INCREMENT,
	`queue` varchar(255) NOT NULL,
	`payload` longtext NOT NULL,
	`attempts` tinyint unsigned NOT NULL,
	`reserved_at` int unsigned DEFAULT NULL,
	`available_at` int unsigned NOT NULL,
	`created_at` int unsigned NOT NULL,
	PRIMARY KEY (`id`),
	KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `job_batches` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`total_jobs` int NOT NULL,
	`pending_jobs` int NOT NULL,
	`failed_jobs` int NOT NULL,
	`failed_job_ids` longtext NOT NULL,
	`options` mediumtext DEFAULT NULL,
	`cancelled_at` int DEFAULT NULL,
	`created_at` int NOT NULL,
	`finished_at` int DEFAULT NULL,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `failed_jobs` (
	`id` bigint unsigned NOT NULL AUTO_INCREMENT,
	`uuid` varchar(255) NOT NULL,
	`connection` text NOT NULL,
	`queue` text NOT NULL,
	`payload` longtext NOT NULL,
	`exception` longtext NOT NULL,
	`failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Tabla: roles
-- =============================
CREATE TABLE IF NOT EXISTS `roles` (
	`id` bigint unsigned NOT NULL AUTO_INCREMENT,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp NULL DEFAULT NULL,
	`updated_at` timestamp NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Tabla: news
-- =============================
CREATE TABLE IF NOT EXISTS `news` (
	`id` bigint unsigned NOT NULL AUTO_INCREMENT,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`image` varchar(255) DEFAULT NULL,
	`is_active` tinyint(1) NOT NULL DEFAULT 1,
	`display_order` int unsigned DEFAULT NULL,
	`created_at` timestamp NULL DEFAULT NULL,
	`updated_at` timestamp NULL DEFAULT NULL,
	PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Tabla: products
-- (base + alteraciones posteriores e índices)
-- =============================
CREATE TABLE IF NOT EXISTS `products` (
	`id` bigint unsigned NOT NULL AUTO_INCREMENT,
	`code` varchar(255) NOT NULL,
	`rubro` varchar(255) DEFAULT NULL,
	`motor` varchar(255) DEFAULT NULL,
	`nro_fabrica` varchar(255) DEFAULT NULL,
	`articulo` varchar(255) DEFAULT NULL,
	`info_tecnica` text DEFAULT NULL,
	`price` decimal(12,2) NOT NULL DEFAULT 0.00,
	`mv` varchar(10) DEFAULT NULL,
	`stock` varchar(50) DEFAULT NULL,
	`in_stock` tinyint(1) NOT NULL DEFAULT 0,
	`is_active` tinyint(1) NOT NULL DEFAULT 1,
	`updated_from_txt_at` timestamp NULL DEFAULT NULL,
	`created_at` timestamp NULL DEFAULT NULL,
	`updated_at` timestamp NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `products_code_unique` (`code`),
	KEY `products_rubro_idx` (`rubro`),
	KEY `products_motor_idx` (`motor`),
	KEY `products_nrofabrica_idx` (`nro_fabrica`),
	KEY `products_articulo_idx` (`articulo`),
	KEY `products_mv_idx` (`mv`),
	KEY `products_instock_idx` (`in_stock`),
	KEY `products_isactive_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Tabla: orders
-- (base + alteraciones posteriores)
-- =============================
CREATE TABLE IF NOT EXISTS `orders` (
	`id` bigint unsigned NOT NULL AUTO_INCREMENT,
	`user_id` varchar(255) DEFAULT NULL,
	`status` varchar(255) NOT NULL DEFAULT 'pending',
	`total` decimal(12,2) NOT NULL DEFAULT 0.00,
	`paid_at` timestamp NULL DEFAULT NULL,
	`comment` text DEFAULT NULL,
	`created_at` timestamp NULL DEFAULT NULL,
	`updated_at` timestamp NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	KEY `orders_user_id_index` (`user_id`),
	KEY `orders_status_index` (`status`),
	KEY `orders_paid_at_index` (`paid_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================
-- Tabla: order_items
-- (base + alteraciones posteriores; conviven product_id y product_code)
-- =============================
CREATE TABLE IF NOT EXISTS `order_items` (
	`id` bigint unsigned NOT NULL AUTO_INCREMENT,
	`order_id` bigint unsigned NOT NULL,
	`product_id` bigint unsigned DEFAULT NULL,
	`product_code` varchar(255) DEFAULT NULL,
	`quantity` int unsigned NOT NULL DEFAULT 1,
	`unit_price` decimal(12,2) NOT NULL DEFAULT 0.00,
	`subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
	`created_at` timestamp NULL DEFAULT NULL,
	`updated_at` timestamp NULL DEFAULT NULL,
	PRIMARY KEY (`id`),
	KEY `order_items_order_id_index` (`order_id`),
	KEY `order_items_product_id_index` (`product_id`),
	KEY `order_items_product_code_index` (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nota: deliberadamente no se crean claves foráneas porque las migraciones originales
-- no las definen (y hay tipos distintos entre algunas columnas, p.ej. users.id string vs sessions.user_id bigint).

