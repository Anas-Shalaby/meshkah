CREATE DATABASE IF NOT EXISTS hadith_auth;

USE hadith_auth;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin', 'vendor') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dawah_cards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    share_link VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE card_hadiths (
    id INT PRIMARY KEY AUTO_INCREMENT,
    card_id INT NOT NULL,
    hadith_id INT,
    custom_hadith TEXT,
    notes TEXT,
    order_index INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES dawah_cards(id),
);

CREATE TABLE print_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    card_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'in_printing', 'shipped', 'delivered') DEFAULT 'pending',
    quantity INT NOT NULL DEFAULT 1,
    delivery_address TEXT NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES dawah_cards(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE print_request_updates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'in_printing', 'shipped', 'delivered') NOT NULL,
    updated_by INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES print_requests(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);


CREATE TABLE hadith_collections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_hadiths INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual hadiths
CREATE TABLE hadiths (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    hadith_text TEXT,
    explanation TEXT,
    word_meanings TEXT,
    benefits TEXT,
    grade VARCHAR(50),
    takhrij TEXT,
    title_ar VARCHAR(255),
    hadith_text_ar TEXT,
    explanation_ar TEXT,
    benefits_ar TEXT,
    grade_ar VARCHAR(50),
    takhrij_ar TEXT,
    lang VARCHAR(10)
);

-- Memorization plans
CREATE TABLE memorization_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    hadiths_per_day INT NOT NULL,
    status ENUM('active', 'completed', 'paused') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Plan hadiths (mapping between plans and hadiths)
CREATE TABLE plan_hadiths (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_id INT NOT NULL,
    hadith_id INT NOT NULL,
    order_in_plan INT NOT NULL,
    scheduled_date DATE,
    FOREIGN KEY (plan_id) REFERENCES memorization_plans(id),
    FOREIGN KEY (hadith_id) REFERENCES hadiths(id)
);

-- User's memorization progress
CREATE TABLE memorization_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    hadith_id INT NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'memorized') DEFAULT 'not_started',
    last_reviewed_at TIMESTAMP,
    next_review_date DATE,
    review_count INT DEFAULT 0,
    confidence_level INT DEFAULT 0, -- 1-5 scale
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (hadith_id) REFERENCES hadiths(id),
    FOREIGN KEY (plan_id) REFERENCES memorization_plans(id)
);

-- Review schedule
CREATE TABLE review_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    hadith_id INT NOT NULL,
    review_date DATE NOT NULL,
    review_type ENUM('2_days', '7_days', '14_days', '30_days') NOT NULL,
    status ENUM('pending', 'completed', 'missed') DEFAULT 'pending',
    performance_rating INT, -- 1-5 scale
    completed_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (hadith_id) REFERENCES hadiths(id)
);

-- User streaks
CREATE TABLE user_streaks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User achievements
CREATE TABLE achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSON,
    badge_image_url VARCHAR(255)
);

-- User earned achievements
CREATE TABLE user_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);