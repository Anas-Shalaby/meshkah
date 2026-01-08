-- ====================================================================
-- تعليمات لتشغيل نظام المراجعة الذكية
-- Smart Review System Setup Instructions
-- ====================================================================

/*
  قم بتنفيذ هذه الأوامر SQL في قاعدة البيانات الخاصة بك
  Run these SQL commands in your database
*/

-- 1. جدول بطاقات المراجعة
CREATE TABLE IF NOT EXISTS review_cards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  journey_id INT NOT NULL,
  hadith_id INT NOT NULL,
  book_slug VARCHAR(100) NOT NULL,
  
  -- SM-2 Algorithm Parameters
  interval_days INT DEFAULT 1,
  repetitions INT DEFAULT 0,
  ease_factor DECIMAL(3,2) DEFAULT 2.50,
  
  -- Scheduling
  last_reviewed_at TIMESTAMP NULL,
  next_review_date DATE NOT NULL,
  
  -- Statistics
  total_reviews INT DEFAULT 0,
  quality_avg DECIMAL(3,2) DEFAULT 0,
  
  -- Status
  status ENUM('learning', 'reviewing', 'mastered') DEFAULT 'learning',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (journey_id) REFERENCES book_journeys(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_user_hadith (user_id, hadith_id),
  INDEX idx_user_next_review (user_id, next_review_date),
  INDEX idx_journey (journey_id),
  INDEX idx_status (status),
  INDEX idx_book (book_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. جدول سجل المراجعات
CREATE TABLE IF NOT EXISTS review_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  card_id INT NOT NULL,
  user_id INT NOT NULL,
  quality INT NOT NULL CHECK (quality >= 0 AND quality <= 5),
  time_taken_seconds INT,
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (card_id) REFERENCES review_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_card (card_id),
  INDEX idx_user_date (user_id, reviewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. جدول إعدادات المراجعة
CREATE TABLE IF NOT EXISTS review_settings (
  user_id INT PRIMARY KEY,
  daily_new_cards INT DEFAULT 10,
  daily_review_cards INT DEFAULT 50,
  preferred_time TIME DEFAULT '20:00:00',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  rest_days JSON DEFAULT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. View مساعد - ملخص بطاقات كل مستخدم
CREATE OR REPLACE VIEW user_review_summary AS
SELECT 
  user_id,
  COUNT(*) as total_cards,
  SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END) as learning_cards,
  SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing_cards,
  SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered_cards,
  SUM(CASE WHEN next_review_date <= CURDATE() THEN 1 ELSE 0 END) as due_today,
  AVG(quality_avg) as overall_quality,
  AVG(total_reviews) as avg_reviews_per_card
FROM review_cards
GROUP BY user_id;

-- ====================================================================
-- تم بنجاح! ✅
-- الجداول جاهزة الآن
-- ====================================================================
