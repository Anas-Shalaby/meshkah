-- =====================================================
-- إضافة عمود hadith_id_in_book لجدول review_cards
-- Add hadith_id_in_book column to review_cards table
-- =====================================================

-- إضافة العمود الجديد
ALTER TABLE review_cards 
ADD COLUMN hadith_id_in_book INT DEFAULT NULL 
AFTER hadith_id;

-- إنشاء فهرس للبحث السريع
CREATE INDEX idx_hadith_in_book 
ON review_cards (hadith_id_in_book, book_slug);

-- تحديث القيم الموجودة (hadith_id_in_book = hadith_id للبطاقات القديمة)
UPDATE review_cards 
SET hadith_id_in_book = hadith_id 
WHERE hadith_id_in_book IS NULL;

-- =====================================================
-- تم بنجاح! ✅
-- =====================================================
