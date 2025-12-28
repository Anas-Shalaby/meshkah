-- جدول الشهادات الرقمية للمخيمات
CREATE TABLE IF NOT EXISTS camp_certificates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  camp_id INT NOT NULL,
  cohort_number INT NOT NULL,
  verification_code VARCHAR(20) UNIQUE NOT NULL COMMENT 'كود التحقق الفريد',
  completion_rate DECIMAL(5,2) NOT NULL COMMENT 'نسبة الإتمام',
  total_points INT DEFAULT 0 COMMENT 'مجموع النقاط',
  total_tasks_completed INT DEFAULT 0 COMMENT 'عدد المهام المكتملة',
  total_days INT DEFAULT 0 COMMENT 'عدد أيام المخيم',
  longest_streak INT DEFAULT 0 COMMENT 'أطول سلسلة',
  certificate_data JSON COMMENT 'بيانات إضافية للشهادة',
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (camp_id) REFERENCES quran_camps(id) ON DELETE CASCADE,
  
  -- شهادة واحدة لكل مستخدم في كل فوج
  UNIQUE KEY unique_user_camp_cohort (user_id, camp_id, cohort_number),
  INDEX idx_verification_code (verification_code),
  INDEX idx_camp (camp_id)
);
