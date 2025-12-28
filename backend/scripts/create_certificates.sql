-- Create certificates table for digital certificates
CREATE TABLE IF NOT EXISTS certificates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  camp_id INT NOT NULL,
  cohort_number INT NOT NULL,
  certificate_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'رقم الشهادة الفريد',
  issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإصدار',
  qr_code_data TEXT COMMENT 'بيانات QR code',
  verification_code VARCHAR(20) UNIQUE NOT NULL COMMENT 'كود التحقق',
  pdf_path VARCHAR(255) COMMENT 'مسار ملف PDF',
  
  -- Stats stored at time of certificate generation
  stats JSON COMMENT 'إحصائيات المستخدم عند التخرج',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (camp_id) REFERENCES quran_camps(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_user_camp (user_id, camp_id, cohort_number),
  INDEX idx_verification (verification_code),
  INDEX idx_certificate_number (certificate_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 
