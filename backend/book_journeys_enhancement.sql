-- =====================================================
-- Migration: Book Journeys Enhancement
-- Date: 2026-01-10
-- Features: Pledge System, Buddy System, Progress Calendar
-- =====================================================

-- =====================================================
-- 1. نظام التعهد (Pledge System)
-- =====================================================
ALTER TABLE book_journeys ADD COLUMN pledge TEXT NULL;
ALTER TABLE book_journeys ADD COLUMN pledge_shared BOOLEAN DEFAULT FALSE;

-- =====================================================
-- 2. نظام الرفقة (Buddy System) - جداول
-- =====================================================

-- جدول علاقات الرفقة
CREATE TABLE IF NOT EXISTS journey_buddies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  journey_id INT NOT NULL,
  buddy_journey_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL,
  UNIQUE KEY unique_buddy_pair (journey_id, buddy_journey_id),
  FOREIGN KEY (journey_id) REFERENCES book_journeys(id) ON DELETE CASCADE,
  FOREIGN KEY (buddy_journey_id) REFERENCES book_journeys(id) ON DELETE CASCADE
);

-- جدول رسائل التشجيع بين الرفقاء
CREATE TABLE IF NOT EXISTS buddy_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_journey_id INT NOT NULL,
  to_journey_id INT NOT NULL,
  message TEXT NOT NULL,
  message_type ENUM('encouragement', 'reminder', 'celebration') DEFAULT 'encouragement',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_journey_id) REFERENCES book_journeys(id) ON DELETE CASCADE,
  FOREIGN KEY (to_journey_id) REFERENCES book_journeys(id) ON DELETE CASCADE
);

-- =====================================================
-- 3. تحديث ENUM في جدول الإشعارات
-- =====================================================

-- تحديث عمود type ليشمل أنواع الرفقة
ALTER TABLE journey_notifications 
MODIFY COLUMN type ENUM(
  'friend_completed_day',
  'friend_finished_book',
  'friend_started_book',
  'reminder',
  'buddy_request',
  'buddy_accepted',
  'buddy_encouragement',
  'buddy_completed_day',
  'buddy_behind'
) NOT NULL;

-- إضافة عمود buddy_type إذا لم يكن موجوداً
-- ملاحظة: إذا كان العمود موجوداً مسبقاً، استخدم MODIFY بدلاً من ADD
ALTER TABLE journey_notifications 
ADD COLUMN buddy_type ENUM(
  'buddy_request',
  'buddy_completed_day',
  'buddy_behind',
  'buddy_encouragement',
  'buddy_accepted'
) NULL;

-- =====================================================
-- 4. فهارس لتحسين الأداء
-- =====================================================

-- فهرس لاستعلامات التقويم
CREATE INDEX idx_journey_progress_date ON journey_progress(journey_id, read_at);

-- فهرس لاستعلامات الرفقة
CREATE INDEX idx_journey_buddies_status ON journey_buddies(status);

-- =====================================================
-- ملاحظات التنفيذ:
-- 1. شغّل هذا الملف على Production:
--    mysql -u username -p database_name < book_journeys_enhancement.sql
--
-- 2. إذا ظهر خطأ "Duplicate column" لـ buddy_type،
--    يعني العمود موجود مسبقاً، تجاهل الخطأ أو استخدم:
--    ALTER TABLE journey_notifications MODIFY COLUMN buddy_type ...
-- =====================================================
