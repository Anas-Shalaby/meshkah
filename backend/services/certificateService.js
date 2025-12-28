const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");
const { features } = require("process");

/**
 * Certificate Service
 * Handles generation, storage, and verification of digital certificates
 */
class CertificateService {
  /**
   * Generate a unique certificate number
   * Format: MESH-YYYY-XXXXXX (e.g., MESH-2025-001234)
   */
  static generateCertificateNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000); // 6 digits
    return `MESH-${year}-${random}`;
  }

  /**
   * Generate a unique verification code
   * Format: 8 characters alphanumeric
   */
  static generateVerificationCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Check if user is eligible for certificate
   * User must complete 100% of tasks
   */
  static async isEligibleForCertificate(userId, campId, cohortNumber) {
    try {
      // Get enrollment
      const [enrollments] = await db.query(
        `SELECT id FROM camp_enrollments 
         WHERE user_id = ? AND camp_id = ? AND cohort_number = ?`,
        [userId, campId, cohortNumber]
      );

      if (enrollments.length === 0) {
        return { eligible: false, reason: "غير مسجل في هذا المخيم" };
      }

      const enrollmentId = enrollments[0].id;

      // Get total tasks and completed tasks
      const [progress] = await db.query(
        `SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_tasks
         FROM camp_task_progress ctp
         JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
         WHERE ctp.enrollment_id = ? AND cdt.camp_id = ?
         AND cdt.is_optional = false
         `,
        [enrollmentId, campId]
      );

      const totalTasks = progress[0].total_tasks;
      const completedTasks = progress[0].completed_tasks;

      if (totalTasks === 0) {
        return { eligible: false, reason: "لا توجد مهام في هذا المخيم" };
      }

      const completionPercentage = (completedTasks / totalTasks) * 100;

      if (completionPercentage < 100) {
        return {
          eligible: false,
          reason: `يجب إكمال جميع المهام (${Math.round(
            completionPercentage
          )}% مكتمل)`,
          progress: { totalTasks, completedTasks, completionPercentage },
        };
      }

      return { eligible: true, enrollmentId };
    } catch (error) {
      console.error("[Certificate] Error checking eligibility:", error);
      throw error;
    }
  }

  /**
   * Get user statistics for certificate
   */
  static async getUserStats(userId, campId, cohortNumber) {
    try {
      const [enrollments] = await db.query(
        `SELECT ce.*, u.username, u.email
         FROM camp_enrollments ce
         JOIN users u ON ce.user_id = u.id
         WHERE ce.user_id = ? AND ce.camp_id = ? AND ce.cohort_number = ?`,
        [userId, campId, cohortNumber]
      );

      if (enrollments.length === 0) {
        throw new Error("Enrollment not found");
      }

      const enrollment = enrollments[0];

      // Get camp details
      const [camps] = await db.query(
        `SELECT name, surah_name, duration_days FROM quran_camps WHERE id = ?`,
        [campId]
      );

      const camp = camps[0];

      // Get task completion stats
      const [taskStats] = await db.query(
        `SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_tasks
         FROM camp_task_progress ctp
         JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
         WHERE ctp.enrollment_id = ? AND cdt.camp_id = ?`,
        [enrollment.id, campId]
      );

      return {
        username: enrollment.username,
        email: enrollment.email,
        campName: camp.name,
        surahName: camp.surah_name,
        cohortNumber,
        totalPoints:
          enrollment.total_points + (enrollment.referral_points || 0),
        currentStreak: enrollment.current_streak || 0,
        longestStreak: enrollment.longest_streak || 0,
        totalTasks: taskStats[0].total_tasks,
        completedTasks: taskStats[0].completed_tasks,
        completionDate: new Date(),
        durationDays: camp.duration_days,
      };
    } catch (error) {
      console.error("[Certificate] Error getting user stats:", error);
      throw error;
    }
  }

  /**
   * Generate certificate PDF
   * Returns the path to the generated PDF
   */
  static async generateCertificatePDF(certificateData) {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          certificateNumber,
          verificationCode,
          username,
          campName,
          surahName,
          cohortNumber,
          totalPoints,
          completedTasks,
          totalTasks,
          issueDate,
        } = certificateData;

        // Create PDF directory if it doesn't exist
        const uploadsDir = path.join(__dirname, "../uploads/certificates");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `${certificateNumber}.pdf`;
        const filepath = path.join(uploadsDir, filename);

        // Create PDF document (A4 landscape)
        const doc = new PDFDocument({
          size: "A4",
          layout: "landscape",
          margin: 50,
        });

        // Register Arabic font
        const fontPath = path.join(__dirname, "../assets/fonts/Cairo.ttf");
        doc.registerFont("Cairo", fontPath);

        // Pipe to file
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Generate QR code
        const qrVerificationUrl = `${
          process.env.FRONTEND_URL || "https://meshkah.app"
        }/verify-certificate/${verificationCode}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrVerificationUrl);
        const qrBase64 = qrCodeDataUrl.split(",")[1];
        const qrBuffer = Buffer.from(qrBase64, "base64");

        // --- Design Certificate ---

        // Background gradient (simulate with rectangles)
        doc.rect(0, 0, doc.page.width, doc.page.height).fill("#F7F6FB");

        // Border
        doc
          .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
          .lineWidth(3)
          .stroke("#7440E9");

        // Inner border
        doc
          .rect(40, 40, doc.page.width - 80, doc.page.height - 80)
          .lineWidth(1)
          .stroke("#B794F6");

        // Header decorative line
        doc
          .moveTo(100, 100)
          .lineTo(doc.page.width - 100, 100)
          .lineWidth(2)
          .stroke("#7440E9");

        // Title (Arabic with Cairo font + RTL)
        doc
          .font("Cairo")
          .fontSize(32)
          .fillColor("#2F1C65")
          .text("شهادة إتمام", 0, 120, {
            align: "center",
            features: ["rtla"],
          });

        // Divider
        doc
          .moveTo(250, 210)
          .lineTo(doc.page.width - 250, 210)
          .lineWidth(1)
          .stroke("#D1C9E8");

        // Body text (Arabic + RTL)
        doc
          .font("Cairo")
          .fontSize(16)
          .fillColor("#4A4A4A")
          .text("تشهد هذه الشهادة بأن", 0, 240, {
            align: "center",
            features: ["rtla"],
          });

        // Username (highlighted) - Arabic + RTL
        doc
          .font("Cairo")
          .fontSize(28)
          .fillColor("#7440E9")
          .text(username, 0, 280, {
            align: "center",
            underline: true,
            features: ["rtla"],
          });

        // Achievement text - Arabic + RTL
        doc
          .font("Cairo")
          .fontSize(16)
          .fillColor("#4A4A4A")
          .text(`قد أتم بنجاح  "${campName}"`, 0, 330, {
            align: "center",
            features: ["rtla"],
          });

        // Camp details - Arabic + RTL
        doc
          .font("Cairo")
          .fontSize(14)
          .fillColor("#6B7280")
          .text(`سورة ${surahName} - الفوج ${cohortNumber}`, 0, 360, {
            align: "center",
            features: ["rtla"],
          });

        // Stats section - without RTL for numbers
        const statsY = 400;
        doc
          .font("Cairo")
          .fontSize(12)
          .fillColor("#7440E9")
          .text(`مهمة مكتملة`, doc.page.width / 2 - 150, statsY, {
            features: ["rtla"],
          });

        doc
          .font("Cairo")
          .fontSize(12)
          .fillColor("#4A4A4A")
          .text(`${completedTasks}`, doc.page.width / 2 - 130, statsY + 20);

        doc.font("Cairo").text(`نقطة`, doc.page.width / 2 + 50, statsY);

        doc
          .font("Cairo")
          .fontSize(12)
          .fillColor("#4A4A4A")
          .text(`${totalPoints}`, doc.page.width / 2 + 55, statsY + 20);

        // Footer section
        const footerY = doc.page.height - 150;

        // QR Code
        doc.image(qrBuffer, 120, footerY - 20, { width: 80 });

        // Certificate number - Arabic + RTL
        doc
          .font("Cairo")
          .fontSize(10)
          .fillColor("#6B7280")
          .text(`رقم الشهادة:`, 135, footerY + 60, {
            features: ["rtla"],
          });

        doc
          .font("Helvetica")
          .fontSize(12)
          .fillColor("#6B7280")
          .text(certificateNumber, 80, footerY + 85, {
            width: 150,
            align: "center",
            letterSpacing: 1,
          });

        // Issue date - with English numerals only
        const arabicMonths = [
          "يناير",
          "فبراير",
          "مارس",
          "أبريل",
          "مايو",
          "يونيو",
          "يوليو",
          "أغسطس",
          "سبتمبر",
          "أكتوبر",
          "نوفمبر",
          "ديسمبر",
        ];
        const dateObj = new Date(issueDate);
        const day = String(dateObj.getDate());
        const month = arabicMonths[dateObj.getMonth()];
        const year = String(dateObj.getFullYear());

        // Build date string: "تاريخ الإصدار:" first
        doc
          .font("Cairo")
          .fontSize(12)
          .fillColor("#4A4A4A")
          .text("تاريخ الإصدار:", doc.page.width - 250, footerY, {
            width: 200,
            align: "center",
            features: ["rtla"],
          });

        // Then the date itself in English numerals
        doc
          .font("Cairo")
          .fontSize(12)
          .fillColor("#4A4A4A")
          .text(`${day} ${month} ${year}`, doc.page.width - 250, footerY + 18, {
            width: 200,
            align: "center",
          });

        // Verification code label - more spacing
        doc
          .font("Cairo")
          .fontSize(10)
          .fillColor("#7440E9")
          .text("كود التحقق:", doc.page.width - 250, footerY + 45, {
            width: 200,
            align: "center",
            features: ["rtla"],
          });

        // Verification code value - more spacing
        doc
          .font("Helvetica")
          .fontSize(12)
          .fillColor("#7440E9")
          .text(verificationCode, doc.page.width - 250, footerY + 63, {
            width: 200,
            align: "center",
            letterSpacing: 1,
          });

        // Platform name - Arabic + RTL
        doc
          .font("Cairo")
          .fontSize(14)
          .fillColor("#7440E9")
          .text("منصة مِشكاة", doc.page.width / 2 - 50, footerY + 50, {
            width: 100,
            align: "center",
            features: ["rtla"],
          });

        // Finalize PDF
        doc.end();

        // Wait for file to be written
        stream.on("finish", () => {
          resolve(`/uploads/certificates/${filename}`);
        });

        stream.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate certificate for user
   * Creates DB record and PDF file
   */
  static async generateCertificate(userId, campId, cohortNumber) {
    try {
      // Check if already generated
      const [existing] = await db.query(
        `SELECT * FROM certificates 
         WHERE user_id = ? AND camp_id = ? AND cohort_number = ?`,
        [userId, campId, cohortNumber]
      );

      if (existing.length > 0) {
        return {
          success: true,
          message: "الشهادة موجودة بالفعل",
          certificate: existing[0],
        };
      }

      // // Check eligibility
      const eligibility = await this.isEligibleForCertificate(
        userId,
        campId,
        cohortNumber
      );

      if (!eligibility.eligible) {
        return {
          success: false,
          message: eligibility.reason,
        };
      }

      // Get user stats
      const stats = await this.getUserStats(userId, campId, cohortNumber);

      // Generate unique identifiers
      let certificateNumber, verificationCode;
      let attempts = 0;

      do {
        certificateNumber = this.generateCertificateNumber();
        verificationCode = this.generateVerificationCode();

        const [check] = await db.query(
          `SELECT id FROM certificates 
           WHERE certificate_number = ? OR verification_code = ?`,
          [certificateNumber, verificationCode]
        );

        if (check.length === 0) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        throw new Error("Failed to generate unique identifiers");
      }

      // Generate PDF
      const pdfPath = await this.generateCertificatePDF({
        certificateNumber,
        verificationCode,
        username: stats.username,
        campName: stats.campName,
        surahName: stats.surahName,
        cohortNumber,
        totalPoints: stats.totalPoints,
        completedTasks: stats.completedTasks,
        totalTasks: stats.totalTasks,
        issueDate: new Date(),
      });

      // Store in database
      const qrCodeData = `${
        process.env.FRONTEND_URL || "https://meshkah.app"
      }verify-certificate/${verificationCode}`;

      const [result] = await db.query(
        `INSERT INTO certificates 
         (user_id, camp_id, cohort_number, certificate_number, verification_code, qr_code_data, pdf_path, stats)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          campId,
          cohortNumber,
          certificateNumber,
          verificationCode,
          qrCodeData,
          pdfPath,
          JSON.stringify(stats),
        ]
      );

      const [certificate] = await db.query(
        `SELECT * FROM certificates WHERE id = ?`,
        [result.insertId]
      );

      console.log(
        `[Certificate] Generated certificate ${certificateNumber} for user ${userId}`
      );

      return {
        success: true,
        message: "تم إنشاء الشهادة بنجاح",
        certificate: certificate[0],
      };
    } catch (error) {
      console.error("[Certificate] Error generating certificate:", error);
      throw error;
    }
  }

  /**
   * Get certificate by ID
   */
  static async getCertificate(certificateId) {
    try {
      const [certificates] = await db.query(
        `SELECT c.*, u.username, qc.name as camp_name
         FROM certificates c
         JOIN users u ON c.user_id = u.id
         JOIN quran_camps qc ON c.camp_id = qc.id
         WHERE c.id = ?`,
        [certificateId]
      );

      if (certificates.length === 0) {
        return { success: false, message: "الشهادة غير موجودة" };
      }

      return {
        success: true,
        certificate: certificates[0],
      };
    } catch (error) {
      console.error("[Certificate] Error getting certificate:", error);
      throw error;
    }
  }

  /**
   * Get user's certificate for a camp
   */
  static async getUserCertificate(userId, campId, cohortNumber) {
    try {
      const [certificates] = await db.query(
        `SELECT c.*, u.username, qc.name as camp_name
         FROM certificates c
         JOIN users u ON c.user_id = u.id
         JOIN quran_camps qc ON c.camp_id = qc.id
         WHERE c.user_id = ? AND c.camp_id = ? AND c.cohort_number = ?`,
        [userId, campId, cohortNumber]
      );

      if (certificates.length === 0) {
        return { success: false, message: "لا توجد شهادة" };
      }

      return {
        success: true,
        certificate: certificates[0],
      };
    } catch (error) {
      console.error("[Certificate] Error getting user certificate:", error);
      throw error;
    }
  }

  /**
   * Verify certificate by verification code
   */
  static async verifyCertificate(verificationCode) {
    try {
      const [certificates] = await db.query(
        `SELECT c.*, u.username, qc.name as camp_name, qc.surah_name
         FROM certificates c
         JOIN users u ON c.user_id = u.id
         JOIN quran_camps qc ON c.camp_id = qc.id
         WHERE c.verification_code = ?`,
        [verificationCode]
      );

      if (certificates.length === 0) {
        return {
          success: false,
          message: "كود التحقق غير صحيح",
        };
      }

      return {
        success: true,
        message: "الشهادة صحيحة",
        certificate: certificates[0],
      };
    } catch (error) {
      console.error("[Certificate] Error verifying certificate:", error);
      throw error;
    }
  }
}

module.exports = CertificateService;
