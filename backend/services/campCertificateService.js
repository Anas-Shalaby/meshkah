const db = require("../config/database");
const crypto = require("crypto");

class CampCertificateService {
  // توليد كود تحقق فريد
  static generateVerificationCode() {
    return crypto.randomBytes(5).toString("hex").toUpperCase();
  }

  // إنشاء شهادة عند إتمام المخيم
  static async issueCertificate(userId, campId, cohortNumber = null) {
    try {
      // جلب معلومات المخيم
      const [camps] = await db.query(
        `SELECT name, duration_days FROM quran_camps WHERE id = ?`,
        [campId]
      );

      if (camps.length === 0) {
        return { success: false, message: "المخيم غير موجود" };
      }

      const camp = camps[0];

      // جلب الفوج الحالي إذا لم يتم تحديده
      if (!cohortNumber) {
        const [cohorts] = await db.query(
          `SELECT cohort_number FROM camp_cohorts 
           WHERE camp_id = ? 
           ORDER BY cohort_number DESC LIMIT 1`,
          [campId]
        );
        cohortNumber = cohorts[0]?.cohort_number || 1;
      }

      // التحقق من وجود شهادة مسبقة
      const [existingCert] = await db.query(
        `SELECT * FROM camp_certificates 
         WHERE user_id = ? AND camp_id = ? AND cohort_number = ?`,
        [userId, campId, cohortNumber]
      );

      if (existingCert.length > 0) {
        return {
          success: true,
          message: "الشهادة موجودة مسبقاً",
          certificate: existingCert[0],
        };
      }

      // جلب إحصائيات المستخدم في المخيم
      const [enrollment] = await db.query(
        `SELECT 
           ce.id as enrollment_id,
           ce.total_points,
           ce.current_streak,
           ce.longest_streak,
           (SELECT COUNT(*) FROM camp_task_progress ctp 
            WHERE ctp.enrollment_id = ce.id AND ctp.completed = 1) as completed_tasks,
           (SELECT COUNT(*) FROM camp_daily_tasks cdt 
            WHERE cdt.camp_id = ?) as total_tasks
         FROM camp_enrollments ce
         WHERE ce.user_id = ? AND ce.camp_id = ? AND ce.cohort_number = ?`,
        [campId, userId, campId, cohortNumber]
      );

      if (enrollment.length === 0) {
        return { success: false, message: "المستخدم غير مسجل في هذا المخيم" };
      }

      const stats = enrollment[0];
      const completionRate = stats.total_tasks > 0 
        ? ((stats.completed_tasks / stats.total_tasks) * 100).toFixed(2) 
        : 0;

      // التحقق من حد أدنى للإتمام (مثلاً 50%)
      if (parseFloat(completionRate) < 50) {
        return {
          success: false,
          message: "يجب إكمال 50% على الأقل من المهام للحصول على الشهادة",
          completionRate: parseFloat(completionRate),
        };
      }

      // توليد كود تحقق فريد
      let verificationCode = this.generateVerificationCode();
      let attempts = 0;
      while (attempts < 5) {
        const [dup] = await db.query(
          `SELECT id FROM camp_certificates WHERE verification_code = ?`,
          [verificationCode]
        );
        if (dup.length === 0) break;
        verificationCode = this.generateVerificationCode();
        attempts++;
      }

      // جلب اسم المستخدم
      const [user] = await db.query(
        `SELECT username FROM users WHERE id = ?`,
        [userId]
      );

      // إنشاء الشهادة
      const certificateData = {
        userName: user[0]?.username || "مستخدم",
        campName: camp.name,
        cohortNumber,
        completionRate: parseFloat(completionRate),
        totalPoints: stats.total_points || 0,
        completedTasks: stats.completed_tasks,
        totalTasks: stats.total_tasks,
        longestStreak: stats.longest_streak || 0,
        durationDays: camp.duration_days,
      };

      const [result] = await db.query(
        `INSERT INTO camp_certificates 
         (user_id, camp_id, cohort_number, verification_code, completion_rate, 
          total_points, total_tasks_completed, total_days, longest_streak, certificate_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          campId,
          cohortNumber,
          verificationCode,
          completionRate,
          stats.total_points || 0,
          stats.completed_tasks,
          camp.duration_days,
          stats.longest_streak || 0,
          JSON.stringify(certificateData),
        ]
      );

      console.log(`[Certificate] Issued certificate for user ${userId} in camp ${campId}`);

      return {
        success: true,
        message: "تم إصدار الشهادة بنجاح",
        certificate: {
          id: result.insertId,
          verificationCode,
          ...certificateData,
        },
      };
    } catch (error) {
      console.error("[Certificate] Error issuing certificate:", error);
      return { success: false, message: error.message };
    }
  }

  // جلب شهادة المستخدم
  static async getUserCertificate(userId, campId, cohortNumber = null) {
    try {
      let query = `
        SELECT cc.*, qc.name as camp_name, u.username
        FROM camp_certificates cc
        JOIN quran_camps qc ON cc.camp_id = qc.id
        JOIN users u ON cc.user_id = u.id
        WHERE cc.user_id = ? AND cc.camp_id = ?`;
      const params = [userId, campId];

      if (cohortNumber) {
        query += ` AND cc.cohort_number = ?`;
        params.push(cohortNumber);
      }

      query += ` ORDER BY cc.issued_at DESC LIMIT 1`;

      const [certificates] = await db.query(query, params);

      if (certificates.length === 0) {
        return { success: false, message: "لا توجد شهادة" };
      }

      const cert = certificates[0];
      cert.certificate_data = cert.certificate_data 
        ? JSON.parse(cert.certificate_data) 
        : {};

      return { success: true, certificate: cert };
    } catch (error) {
      console.error("[Certificate] Error getting certificate:", error);
      return { success: false, message: error.message };
    }
  }

  // جلب جميع شهادات المستخدم
  static async getAllUserCertificates(userId) {
    try {
      const [certificates] = await db.query(
        `SELECT cc.*, qc.name as camp_name
         FROM camp_certificates cc
         JOIN quran_camps qc ON cc.camp_id = qc.id
         WHERE cc.user_id = ?
         ORDER BY cc.issued_at DESC`,
        [userId]
      );

      return {
        success: true,
        certificates: certificates.map((cert) => ({
          ...cert,
          certificate_data: cert.certificate_data 
            ? JSON.parse(cert.certificate_data) 
            : {},
        })),
      };
    } catch (error) {
      console.error("[Certificate] Error getting all certificates:", error);
      return { success: false, message: error.message };
    }
  }

  // التحقق من صحة شهادة (للمشاركة العامة)
  static async verifyCertificate(verificationCode) {
    try {
      const [certificates] = await db.query(
        `SELECT cc.*, qc.name as camp_name, u.username
         FROM camp_certificates cc
         JOIN quran_camps qc ON cc.camp_id = qc.id
         JOIN users u ON cc.user_id = u.id
         WHERE cc.verification_code = ?`,
        [verificationCode]
      );

      if (certificates.length === 0) {
        return { success: false, valid: false, message: "كود التحقق غير صالح" };
      }

      const cert = certificates[0];
      cert.certificate_data = cert.certificate_data 
        ? JSON.parse(cert.certificate_data) 
        : {};

      return {
        success: true,
        valid: true,
        certificate: {
          userName: cert.username,
          campName: cert.camp_name,
          completionRate: cert.completion_rate,
          totalPoints: cert.total_points,
          issuedAt: cert.issued_at,
          verificationCode: cert.verification_code,
        },
      };
    } catch (error) {
      console.error("[Certificate] Error verifying certificate:", error);
      return { success: false, message: error.message };
    }
  }

  // إصدار شهادات لجميع المستخدمين المؤهلين في مخيم
  static async issueAllCertificatesForCamp(campId, cohortNumber = null) {
    try {
      // جلب الفوج الحالي إذا لم يتم تحديده
      if (!cohortNumber) {
        const [cohorts] = await db.query(
          `SELECT cohort_number FROM camp_cohorts 
           WHERE camp_id = ? AND status = 'completed'
           ORDER BY cohort_number DESC LIMIT 1`,
          [campId]
        );
        if (cohorts.length === 0) {
          return { success: false, message: "لا يوجد فوج منتهي" };
        }
        cohortNumber = cohorts[0].cohort_number;
      }

      // جلب جميع المشتركين المؤهلين (أكملوا 50%+)
      const [eligibleUsers] = await db.query(
        `SELECT 
           ce.user_id,
           (SELECT COUNT(*) FROM camp_task_progress ctp 
            WHERE ctp.enrollment_id = ce.id AND ctp.completed = 1) as completed,
           (SELECT COUNT(*) FROM camp_daily_tasks WHERE camp_id = ?) as total
         FROM camp_enrollments ce
         WHERE ce.camp_id = ? AND ce.cohort_number = ?
         HAVING (completed / total) >= 0.5`,
        [campId, campId, cohortNumber]
      );

      let issued = 0;
      let skipped = 0;

      for (const user of eligibleUsers) {
        const result = await this.issueCertificate(user.user_id, campId, cohortNumber);
        if (result.success) {
          issued++;
        } else {
          skipped++;
        }
      }

      return {
        success: true,
        message: `تم إصدار ${issued} شهادة`,
        issued,
        skipped,
        total: eligibleUsers.length,
      };
    } catch (error) {
      console.error("[Certificate] Error issuing all certificates:", error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = CampCertificateService;
