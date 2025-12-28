const db = require("../config/database");
const crypto = require("crypto");

/**
 * Cohort-Based Referral Service
 * نظام الإحالة المرتبط بالأفواج - كل enrollment له كود خاص
 */
class CampReferralService {
  /**
   * توليد كود إحالة فريد
   */
  static generateReferralCode() {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
  }

  /**
   * جلب أو إنشاء كود إحالة لـ enrollment معين
   * @param {number} enrollmentId - معرّف الـ enrollment
   * @returns {Promise<string>} كود الإحالة
   */
  static async getEnrollmentReferralCode(enrollmentId) {
    try {
      // تحقق إذا كان لديه كود موجود
      const [existing] = await db.query(
        `SELECT referral_code FROM camp_enrollments WHERE id = ?`,
        [enrollmentId]
      );

      if (existing.length > 0 && existing[0].referral_code) {
        return existing[0].referral_code;
      }

      // إنشاء كود جديد
      let code = this.generateReferralCode();
      let attempts = 0;

      // تأكد من عدم وجود تكرار
      while (attempts < 5) {
        const [duplicate] = await db.query(
          `SELECT id FROM camp_enrollments WHERE referral_code = ?`,
          [code]
        );
        if (duplicate.length === 0) break;
        code = this.generateReferralCode();
        attempts++;
      }

      // حفظ الكود للـ enrollment
      await db.query(
        `UPDATE camp_enrollments SET referral_code = ? WHERE id = ?`,
        [code, enrollmentId]
      );

      return code;
    } catch (error) {
      console.error("[Referral] Error getting/creating referral code:", error);
      throw error;
    }
  }

  /**
   * جلب رابط الإحالة الكامل لفوج معين
   * @param {number} userId - معرّف المستخدم
   * @param {number} campId - معرّف المخيم
   * @param {number} cohortNumber - رقم الفوج
   * @returns {Promise<{referralLink: string, referralCode: string}>}
   */
  static async getReferralLink(userId, campId, campCode, cohortNumber) {
    try {
      // جلب الـ enrollment
      const [enrollment] = await db.query(
        `SELECT id FROM camp_enrollments 
         WHERE user_id = ? AND camp_id = ? AND cohort_number = ?`,
        [userId, campId, cohortNumber]
      );

      if (enrollment.length === 0) {
        throw new Error("لست مسجلاً في هذا الفوج");
      }

      const enrollmentId = enrollment[0].id;
      const code = await this.getEnrollmentReferralCode(enrollmentId);

      const baseUrl = process.env.FRONTEND_URL || "https://meshkah.app";

      // الرابط يحتوي على كود الإحالة والمخيم والفوج
      const link = `${baseUrl}quran-camps/${campCode}?ref=${code}&cohort=${cohortNumber}`;

      return { referralLink: link, referralCode: code };
    } catch (error) {
      console.error("[Referral] Error getting referral link:", error);
      throw error;
    }
  }

  /**
   * التحقق من إمكانية الإحالة في فوج معين
   * @param {number} campId - معرّف المخيم
   * @param {number} cohortNumber - رقم الفوج
   * @returns {Promise<{canInvite: boolean, reason?: string}>}
   */
  static async canInvite(campId, cohortNumber) {
    try {
      // جلب حالة الفوج
      const [cohort] = await db.query(
        `SELECT status, start_date 
         FROM camp_cohorts 
         WHERE camp_id = ? AND cohort_number = ?`,
        [campId, cohortNumber]
      );

      if (cohort.length === 0) {
        return { canInvite: false, reason: "الفوج غير موجود" };
      }

      const cohortData = cohort[0];

      // الإحالة متاحة فقط قبل البداية (early_registration أو scheduled)
      if (cohortData.status === "active" || cohortData.status === "completed") {
        return { canInvite: false, reason: "الفوج بدأ بالفعل" };
      }

      return { canInvite: true };
    } catch (error) {
      console.error("[Referral] Error checking invite permission:", error);
      return { canInvite: false, reason: "حدث خطأ" };
    }
  }

  /**
   * تسجيل إحالة جديدة (عند تسجيل مستخدم في فوج)
   * @param {string} referralCode - كود الإحالة
   * @param {number} newEnrollmentId - معرّف الـ enrollment الجديد
   * @param {number} cohortNumber - رقم الفوج
   * @returns {Promise<{success: boolean, message: string, referrerName?: string}>}
   */
  static async trackReferral(referralCode, newEnrollmentId, cohortNumber) {
    try {
      // البحث عن صاحب كود الإحالة
      const [referrer] = await db.query(
        `SELECT ce.id as enrollment_id, ce.user_id, ce.camp_id, u.username 
         FROM camp_enrollments ce
         JOIN users u ON ce.user_id = u.id
         WHERE ce.referral_code = ? AND ce.cohort_number = ?`,
        [referralCode, cohortNumber]
      );

      if (referrer.length === 0) {
        console.log(`[Referral] Invalid referral code: ${referralCode}`);
        return { success: false, message: "كود إحالة غير صالح" };
      }

      const referrerData = referrer[0];

      // جلب بيانات المُحال
      const [referred] = await db.query(
        `SELECT user_id, camp_id FROM camp_enrollments WHERE id = ?`,
        [newEnrollmentId]
      );

      if (referred.length === 0) {
        return { success: false, message: "التسجيل غير موجود" };
      }

      const referredUserId = referred[0].user_id;
      const campId = referred[0].camp_id;

      // تأكد أن المستخدم لا يحيل نفسه
      if (referrerData.user_id === referredUserId) {
        return { success: false, message: "لا يمكنك إحالة نفسك" };
      }

      // تأكد من نفس المخيم
      if (referrerData.camp_id !== campId) {
        return { success: false, message: "كود الإحالة لمخيم مختلف" };
      }

      // تأكد من عدم وجود إحالة مسبقة لهذا المستخدم في هذا الفوج
      const [existingReferral] = await db.query(
        `SELECT id FROM camp_referrals 
         WHERE referred_enrollment_id = ? AND cohort_number = ?`,
        [newEnrollmentId, cohortNumber]
      );

      if (existingReferral.length > 0) {
        return {
          success: false,
          message: "تم تسجيل إحالة لهذا المستخدم مسبقاً في هذا الفوج",
        };
      }

      // تسجيل الإحالة
      await db.query(
        `INSERT INTO camp_referrals 
         (referrer_id, referred_id, referrer_enrollment_id, referred_enrollment_id, 
          camp_id, cohort_number, referral_code, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          referrerData.user_id,
          referredUserId,
          referrerData.enrollment_id,
          newEnrollmentId,
          campId,
          cohortNumber,
          referralCode,
        ]
      );

      // تحديث referred_by في enrollment
      await db.query(
        `UPDATE camp_enrollments SET referred_by = ? WHERE id = ?`,
        [referrerData.enrollment_id, newEnrollmentId]
      );

      return {
        success: true,
        message: "تم تسجيل الإحالة بنجاح",
        referrerName: referrerData.username,
      };
    } catch (error) {
      console.error("[Referral] Error tracking referral:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * إكمال الإحالة (عند التسجيل في مخيم)
   * @param {number} enrollmentId - معرّف الـ enrollment للمُحال
   * @returns {Promise<{success: boolean, message: string, referrerName?: string}>}
   */
  static async completeReferral(enrollmentId) {
    try {
      // البحث عن إحالة معلقة - نبحث عن أي إحالة معلقة لهذا الـ enrollment
      // حتى لو كانت مكتملة مسبقاً، نتأكد من تحديثها
      const [pendingReferral] = await db.query(
        `SELECT cr.*, u.username as referrer_name 
         FROM camp_referrals cr
         JOIN users u ON cr.referrer_id = u.id
         WHERE cr.referred_enrollment_id = ? AND cr.status = 'pending'
         ORDER BY cr.created_at DESC
         LIMIT 1`,
        [enrollmentId]
      );

      if (pendingReferral.length === 0) {
        // تحقق إذا كانت هناك إحالة مكتملة مسبقاً (لتجنب الأخطاء في السجلات)
        const [completedReferral] = await db.query(
          `SELECT cr.*, u.username as referrer_name 
           FROM camp_referrals cr
           JOIN users u ON cr.referrer_id = u.id
           WHERE cr.referred_enrollment_id = ? AND cr.status = 'completed'
           ORDER BY cr.created_at DESC
           LIMIT 1`,
          [enrollmentId]
        );

        if (completedReferral.length > 0) {
          return {
            success: true,
            message: "الإحالة مكتملة مسبقاً",
            referrerName: completedReferral[0].referrer_name,
          };
        }

        return { success: false, message: "لا توجد إحالة معلقة" };
      }

      const referral = pendingReferral[0];

      // تحديث الإحالة إلى مكتملة
      await db.query(
        `UPDATE camp_referrals 
         SET status = 'completed', completed_at = NOW(), points_awarded = 1
         WHERE id = ?`,
        [referral.id]
      );

      // إضافة نقطة للمُحيل في الفوج
      await db.query(
        `UPDATE camp_enrollments 
         SET referral_points = COALESCE(referral_points, 0) + 1 
         WHERE id = ?`,
        [referral.referrer_enrollment_id]
      );

      return {
        success: true,
        message: "تم إكمال الإحالة",
        referrerName: referral.referrer_name,
      };
    } catch (error) {
      console.error("[Referral] Error completing referral:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * التحقق من منح شارة "دال على الخير" (بناءً على الإحالات الكلية)
   * @param {number} userId - معرّف المستخدم
   */
  static async checkAndAwardBadge(userId) {
    try {
      // جلب عدد الإحالات الناجحة عبر جميع الأفواج
      const [referrals] = await db.query(
        `SELECT COUNT(*) as total_referrals 
         FROM camp_referrals 
         WHERE referrer_id = ? AND status = 'completed'`,
        [userId]
      );

      const referralCount = referrals[0].total_referrals || 0;

      // منح الشارة عند 3 إحالات أو أكثر
      if (referralCount >= 3) {
        // تحقق من عدم وجود الشارة مسبقاً
        const [existingBadge] = await db.query(
          `SELECT id FROM user_badges WHERE user_id = ? AND badge_type = 'referral_champion'`,
          [userId]
        );

        if (existingBadge.length === 0) {
          await db.query(
            `INSERT INTO user_badges (user_id, badge_type, badge_data) 
             VALUES (?, 'referral_champion', ?)`,
            [
              userId,
              JSON.stringify({
                title: "دال على الخير",
                description: "أحال 3 أصدقاء أو أكثر للمخيمات",
                icon: "🌟",
                earned_for: `${referralCount} إحالات ناجحة`,
              }),
            ]
          );

          console.log(`[Referral] Awarded badge to user ${userId}`);
          return { awarded: true, badge: "referral_champion" };
        }
      }

      return { awarded: false };
    } catch (error) {
      console.error("[Referral] Error checking/awarding badge:", error);
      return { awarded: false, error: error.message };
    }
  }

  /**
   * جلب إحصائيات الإحالات للمستخدم في فوج معين
   * @param {number} userId - معرّف المستخدم
   * @param {number} campId - معرّف المخيم
   * @param {number} cohortNumber - رقم الفوج
   * @returns {Promise<Object>} إحصائيات الإحالة
   */
  static async getCohortReferralStats(userId, campId, cohortNumber) {
    try {
      // جلب الـ enrollment
      const [enrollment] = await db.query(
        `SELECT id, referral_code, referral_points 
         FROM camp_enrollments 
         WHERE user_id = ? AND camp_id = ? AND cohort_number = ?`,
        [userId, campId, cohortNumber]
      );

      if (enrollment.length === 0) {
        throw new Error("لست مسجلاً في هذا الفوج");
      }

      const enrollmentData = enrollment[0];

      // جلب إحصائيات الإحالات لهذا الفوج
      const [stats] = await db.query(
        `SELECT 
           COUNT(*) as total_referrals,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_referrals,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_referrals
         FROM camp_referrals 
         WHERE referrer_enrollment_id = ? AND cohort_number = ?`,
        [enrollmentData.id, cohortNumber]
      );

      // جلب الشارة (إن وُجدت)
      const [badge] = await db.query(
        `SELECT * FROM user_badges WHERE user_id = ? AND badge_type = 'referral_champion'`,
        [userId]
      );

      return {
        referralCode: enrollmentData.referral_code,
        referralPoints: enrollmentData.referral_points || 0,
        totalReferrals: stats[0].total_referrals || 0,
        successfulReferrals: stats[0].successful_referrals || 0,
        pendingReferrals: stats[0].pending_referrals || 0,
        hasBadge: badge.length > 0,
        badge: badge.length > 0 ? JSON.parse(badge[0].badge_data) : null,
      };
    } catch (error) {
      console.error("[Referral] Error getting cohort stats:", error);
      throw error;
    }
  }

  /**
   * جلب قائمة الأشخاص الذين أحالهم المستخدم في فوج معين
   * @param {number} userId - معرّف المستخدم
   * @param {number} campId - معرّف المخيم
   * @param {number} cohortNumber - رقم الفوج
   * @returns {Promise<Array>} قائمة الإحالات
   */
  static async getCohortReferralsList(userId, campId, cohortNumber) {
    try {
      // جلب الـ enrollment
      const [enrollment] = await db.query(
        `SELECT id FROM camp_enrollments 
         WHERE user_id = ? AND camp_id = ? AND cohort_number = ?`,
        [userId, campId, cohortNumber]
      );

      if (enrollment.length === 0) {
        return [];
      }

      const enrollmentId = enrollment[0].id;

      const [referrals] = await db.query(
        `SELECT 
           cr.id,
           cr.status,
           cr.created_at,
           cr.completed_at,
           cr.points_awarded,
           u.username as referred_username,
           u.avatar_url as referred_avatar
         FROM camp_referrals cr
         JOIN users u ON cr.referred_id = u.id
         WHERE cr.referrer_enrollment_id = ? AND cr.cohort_number = ?
         ORDER BY cr.created_at DESC`,
        [enrollmentId, cohortNumber]
      );

      return referrals;
    } catch (error) {
      console.error("[Referral] Error getting referrals list:", error);
      throw error;
    }
  }
}

module.exports = CampReferralService;
