-- Создание базы данных
CREATE DATABASE IF NOT EXISTS dvizh_bishkek CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE dvizh_bishkek;

-- Таблица пользователей
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    avatar_url TEXT,
    reputation INT DEFAULT 0,
    message_count INT DEFAULT 0,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_blocked BOOLEAN DEFAULT FALSE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_telegram_id (telegram_id),
    INDEX idx_reputation (reputation),
    INDEX idx_message_count (message_count)
);

-- Таблица логов репутации
CREATE TABLE reputation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    giver_id INT NOT NULL,
    receiver_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (giver_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    INDEX idx_created (created_at),
    INDEX idx_giver_receiver (giver_id, receiver_id)
);

-- Таблица событий
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    preview_image VARCHAR(500),
    event_date DATETIME NOT NULL,
    status ENUM('upcoming', 'completed', 'cancelled') DEFAULT 'upcoming',
    price DECIMAL(10, 2) DEFAULT 0,
    conditions TEXT,
    location_url VARCHAR(500),
    max_participants INT DEFAULT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_date (event_date)
);

-- Контакты событий
CREATE TABLE event_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    type ENUM('telegram', 'instagram', 'whatsapp') NOT NULL,
    value VARCHAR(255) NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Регистрации на события
CREATE TABLE event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registered_by INT DEFAULT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (registered_by) REFERENCES users(id),
    UNIQUE KEY unique_registration (event_id, user_id)
);

-- Медиафайлы
CREATE TABLE media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT DEFAULT NULL,
    type ENUM('photo', 'video') NOT NULL,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_event (event_id),
    INDEX idx_type (type),
    INDEX idx_uploaded_at (uploaded_at)
);

-- Сессии
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);

-- Добавляем тестового админа (замените YOUR_TELEGRAM_ID на ваш реальный Telegram ID)
-- INSERT INTO users (telegram_id, username, first_name, role) VALUES (YOUR_TELEGRAM_ID, 'admin', 'Admin', 'admin');