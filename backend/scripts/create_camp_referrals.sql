-- جدول الإحالات للمخيمات
CREATE TABLE IF NOT EXISTS camp_referrals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  referrer_id INT NOT NULL COMMENT 'المستخدم الذي أحال',
  referred_id INT NOT NULL COMMENT 'المستخدم الذي تم إحالته',
  camp_id INT COMMENT 'المخيم الذي تم الإحالة فيه (اختياري)',
  referral_code VARCHAR(20) NOT NULL COMMENT 'كود الإحالة المستخدم',
  status ENUM('pending', 'completed', 'expired') DEFAULT 'pending',
  completed_at TIMESTAMP NULL COMMENT 'تاريخ اكتمال الإحالة (عند تسجيل المُحال)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (camp_id) REFERENCES quran_camps(id) ON DELETE SET NULL,
  
  UNIQUE KEY unique_referral (referrer_id, referred_id),
  INDEX idx_referral_code (referral_code),
  INDEX idx_referrer (referrer_id),
  INDEX idx_status (status)
);

-- إضافة كود الإحالة الفريد لكل مستخدم
ALTER TABLE users 
ADD COLUMN referral_code VARCHAR(20) UNIQUE COMMENT 'كود الإحالة الفريد للمستخدم';

-- إضافة عداد الإحالات الناجحة
ALTER TABLE users 
ADD COLUMN successful_referrals INT DEFAULT 0 COMMENT 'عدد الإحالات الناجحة';

-- جدول الشارات (للشارة "دال على الخير")
CREATE TABLE IF NOT EXISTS user_badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  badge_type VARCHAR(50) NOT NULL COMMENT 'نوع الشارة',
  badge_data JSON COMMENT 'بيانات إضافية للشارة',
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_badge (user_id, badge_type),
  INDEX idx_badge_type (badge_type)
);
