-- ============================================
-- جدول camp_notifications - Schema SQL
-- ============================================
-- هذا الملف يحتوي على بنية جدول camp_notifications
-- يمكن استخدامه لإعادة إنشاء الجدول بعد حذفه

-- حذف الجدول إذا كان موجوداً (احذر: سيحذف جميع البيانات!)
-- DROP TABLE IF EXISTS camp_notifications;

-- إنشاء جدول camp_notifications
CREATE TABLE IF NOT EXISTS camp_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT 'معرف المستخدم المرسل له الإشعار',
  camp_id INT NOT NULL COMMENT 'معرف المخيم',
  type ENUM(
    'welcome',
    'daily_reminder',
    'achievement',
    'milestone',
    'admin_message',
    'friends_digest',
    'friend_request',
    'friend_request_response',
    'joint_step_pledge',
    'daily_message'
  ) NOT NULL COMMENT 'نوع الإشعار',
  title VARCHAR(255) NOT NULL COMMENT 'عنوان الإشعار',
  message TEXT NOT NULL COMMENT 'محتوى الإشعار',
  cohort_number INT NULL COMMENT 'رقم الفوج للإشعار (NULL للإشعارات العامة)',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ ووقت إرسال الإشعار',
  is_read TINYINT(1) DEFAULT 0 COMMENT 'هل تم قراءة الإشعار (0 = غير مقروء، 1 = مقروء)',
  read_at TIMESTAMP NULL COMMENT 'تاريخ ووقت قراءة الإشعار',
  
  -- Foreign Keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (camp_id) REFERENCES quran_camps(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_camp_id (camp_id),
  INDEX idx_user_camp (user_id, camp_id),
  INDEX idx_sent_at (sent_at),
  INDEX idx_is_read (is_read),
  INDEX idx_type (type),
  INDEX idx_cohort_number (cohort_number),
  INDEX idx_user_camp_cohort (user_id, camp_id, cohort_number),
  INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول إشعارات المخيمات القرآنية';
