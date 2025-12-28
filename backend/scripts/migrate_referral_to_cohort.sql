-- =====================================================
-- Migration: Referral System من User-Based إلى Cohort-Based
-- =====================================================
-- هذا الـ script ينقل نظام الإحالة من النظام القديم المرتبط بالمستخدمين
-- إلى نظام جديد مرتبط بالأفواج (cohorts)
-- =====================================================

-- =====================================================
-- Step 1: تعديل جدول camp_enrollments
-- =====================================================

-- إضافة أعمدة جديدة للإحالة المرتبطة بالفوج
ALTER TABLE camp_enrollments
ADD COLUMN referral_code VARCHAR(20) COMMENT 'كود الإحالة الخاص بالمستخدم في هذا الفوج',
ADD COLUMN referred_by INT NULL COMMENT 'معرّف الـ enrollment للمُحيل',
ADD COLUMN referral_points INT DEFAULT 0 COMMENT 'عدد النقاط المكتسبة من الإحالات في هذا الفوج';

-- إضافة index على referral_code
ALTER TABLE camp_enrollments
ADD INDEX idx_referral_code (referral_code);

-- إضافة foreign key على referred_by
-- ملاحظة: نستخدم ON DELETE SET NULL عشان لو المُحيل انحذف، مانحذفش المُحال
ALTER TABLE camp_enrollments
ADD CONSTRAINT fk_referred_by 
FOREIGN KEY (referred_by) REFERENCES camp_enrollments(id) 
ON DELETE SET NULL;

-- =====================================================
-- Step 2: تعديل جدول camp_referrals
-- =====================================================

-- إضافة عمود cohort_number
ALTER TABLE camp_referrals
ADD COLUMN cohort_number INT COMMENT 'رقم الفوج';

-- إضافة عمود points_awarded
ALTER TABLE camp_referrals
ADD COLUMN points_awarded INT DEFAULT 0 COMMENT 'النقاط الممنوحة للمُحيل';

-- إضافة عمود referrer_enrollment_id
ALTER TABLE camp_referrals
ADD COLUMN referrer_enrollment_id INT COMMENT 'معرّف enrollment للمُحيل',
ADD COLUMN referred_enrollment_id INT COMMENT 'معرّف enrollment للمُحال';

-- إضافة foreign keys
ALTER TABLE camp_referrals
ADD CONSTRAINT fk_referrer_enrollment 
FOREIGN KEY (referrer_enrollment_id) REFERENCES camp_enrollments(id) 
ON DELETE CASCADE;

ALTER TABLE camp_referrals
ADD CONSTRAINT fk_referred_enrollment 
FOREIGN KEY (referred_enrollment_id) REFERENCES camp_enrollments(id) 
ON DELETE CASCADE;

-- إضافة index على cohort_number
ALTER TABLE camp_referrals
ADD INDEX idx_cohort_number (cohort_number);

-- =====================================================
-- Step 3: نقل البيانات القديمة (إن وُجدت)
-- =====================================================

-- ملاحظة: هذا الجزء اختياري ويعتمد على وجود بيانات قديمة
-- إذا كان فيه بيانات referral قديمة، يمكن نقلها هنا

-- مثال: نقل البيانات من users.referral_code للـ enrollments
-- UPDATE camp_enrollments ce
-- JOIN users u ON ce.user_id = u.id
-- SET ce.referral_code = u.referral_code
-- WHERE u.referral_code IS NOT NULL
--   AND ce.referral_code IS NULL;

-- =====================================================
-- Step 4: إزالة الأعمدة القديمة من users (اختياري)
-- =====================================================

-- ملاحظة: نزالة هذه الأعمدة بعد التأكد من نقل البيانات
-- يُفضل عدم حذفها مباشرة وإبقاءها كـ backup لفترة

-- ALTER TABLE users DROP COLUMN IF EXISTS referral_code;
-- ALTER TABLE users DROP COLUMN IF EXISTS successful_referrals;

-- =====================================================
-- Step 5: حذف عمود friend_code من camp_enrollments
-- =====================================================

-- ملاحظة: friend_code كان متستخدم للأصدقاء، دلوقتي هنستخدم referral_code
-- يُفضل عدم حذفه مباشرة وإبقاءه لفترة كـ backup

-- ALTER TABLE camp_enrollments DROP COLUMN IF EXISTS friend_code;

-- =====================================================
-- الانتهاء من الـ Migration
-- =====================================================

SELECT '✅ Migration completed successfully!' as status;
SELECT 'تم تعديل جدول camp_enrollments بنجاح' as message;
SELECT 'تم تعديل جدول camp_referrals بنجاح' as message;
