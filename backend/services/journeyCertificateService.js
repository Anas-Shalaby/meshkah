/**
 * خدمة شهادات الختمات - Journey Certificate Service
 * إنشاء وإدارة شهادات ختم الكتب
 */

const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");

class JourneyCertificateService {
  /**
   * توليد رقم شهادة فريد
   */
  static generateCertificateNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `KHTM-${year}-${random}`;
  }

  /**
   * توليد كود تحقق فريد
   */
  static generateVerificationCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * التحقق من أهلية المستخدم للشهادة
   */
  static async isEligible(userId, journeyId) {
    try {
      const [journeys] = await db.query(
        `SELECT * FROM book_journeys WHERE id = ? AND user_id = ?`,
        [journeyId, userId]
      );

      if (journeys.length === 0) {
        return { eligible: false, reason: "الختمة غير موجودة" };
      }

      const journey = journeys[0];

      if (journey.status !== "completed") {
        const [progress] = await db.query(
          `SELECT COUNT(*) as count FROM journey_progress WHERE journey_id = ?`,
          [journeyId]
        );

        const readCount = progress[0]?.count || 0;
        const percent = Math.round((readCount / journey.total_hadiths) * 100);

        return {
          eligible: false,
          reason: `يجب إكمال الكتاب أولاً (${percent}% مكتمل)`,
          progress: {
            read: readCount,
            total: journey.total_hadiths,
            percent,
          },
        };
      }

      // التحقق من وجود شهادة سابقة
      const [existingCert] = await db.query(
        `SELECT * FROM journey_certificates WHERE journey_id = ?`,
        [journeyId]
      );

      if (existingCert.length > 0) {
        return {
          eligible: false,
          reason: "الشهادة موجودة بالفعل",
          certificate: existingCert[0],
        };
      }

      return { eligible: true, journey };
    } catch (error) {
      console.error("[JourneyCertificate] Error checking eligibility:", error);
      throw error;
    }
  }

  /**
   * جلب إحصائيات المستخدم للشهادة
   */
  static async getUserStats(userId, journeyId) {
    try {
      const [journeys] = await db.query(
        `SELECT bj.*, u.username, u.email
         FROM book_journeys bj
         JOIN users u ON bj.user_id = u.id
         WHERE bj.id = ? AND bj.user_id = ?`,
        [journeyId, userId]
      );

      if (journeys.length === 0) return null;

      const journey = journeys[0];

      // إحصائيات القراءة
      const [dailyStats] = await db.query(
        `SELECT 
          COUNT(DISTINCT DATE(read_at)) as active_days,
          MIN(read_at) as first_read,
          MAX(read_at) as last_read
         FROM journey_progress
         WHERE journey_id = ?`,
        [journeyId]
      );

      const stats = dailyStats[0];
      const totalDays =
        stats.first_read && stats.last_read
          ? Math.ceil(
              (new Date(stats.last_read) - new Date(stats.first_read)) /
                (1000 * 60 * 60 * 24)
            ) + 1
          : 0;

      return {
        username: journey.username,
        email: journey.email,
        book_name: journey.book_name,
        book_slug: journey.book_slug,
        total_hadiths: journey.total_hadiths,
        start_date: journey.start_date,
        completed_at: journey.completed_at,
        pace: journey.pace,
        streak_count: journey.streak_count,
        active_days: stats.active_days || 0,
        total_days: totalDays,
      };
    } catch (error) {
      console.error("[JourneyCertificate] Error getting user stats:", error);
      throw error;
    }
  }

  /**
   * إنشاء شهادة PDF
   */
  static async generatePDF(certificateData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          layout: "landscape",
          margin: 0,
        });

        const uploadsDir = path.join(__dirname, "../uploads/certificates");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `journey-cert-${certificateData.certificate_number}.pdf`;
        const filepath = path.join(uploadsDir, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        const width = 841.89; // A4 landscape width
        const height = 595.28; // A4 landscape height

        // الخلفية - ألوان الهوية البصرية (بنفسجي مع ذهبي)
        const gradient = doc.linearGradient(0, 0, width, height);
        gradient.stop(0, "#f7f6fb"); // خلفية بنفسجي فاتح
        gradient.stop(0.5, "#f3edff"); // بنفسجي متوسط
        gradient.stop(1, "#e9e4f5"); // بنفسجي داكن
        doc.rect(0, 0, width, height).fill(gradient);

        // الإطار الخارجي - بنفسجي أساسي
        doc
          .rect(20, 20, width - 40, height - 40)
          .lineWidth(3)
          .stroke("#7440e9");

        // الإطار الداخلي - بنفسجي فاتح
        doc
          .rect(35, 35, width - 70, height - 70)
          .lineWidth(1)
          .stroke("#8b5cf6");

        // تحميل الخط العربي
        const fontPath = path.join(__dirname, "../assets/fonts/Cairo.ttf");
        if (fs.existsSync(fontPath)) {
          doc.registerFont("Cairo", fontPath);
        }

        // العنوان - ذهبي
        doc
          .font(fs.existsSync(fontPath) ? "Cairo" : "Helvetica-Bold")
          .fontSize(36)
          .fillColor("#d4af37")
          .text("شهادة ختم كتاب", 0, 70, {
            align: "center",
            features: ["rtla"],
          });

        // اسم الكتاب - بنفسجي داكن
        doc
          .font(fs.existsSync(fontPath) ? "Cairo" : "Helvetica-Bold")
          .fontSize(28)
          .fillColor("#6d28d9")
          .text(certificateData.book_name, 0, 120, {
            align: "center",
            features: ["rtla"],
          });

        // النص التوضيحي
        doc
          .font(fs.existsSync(fontPath) ? "Cairo" : "Helvetica")
          .fontSize(18)
          .fillColor("#374151")
          .text("يُشهد بأن", 0, 180, {
            align: "center",
            features: ["rtla"],
          });

        // اسم المستخدم - بنفسجي أساسي
        doc
          .font(fs.existsSync(fontPath) ? "Cairo" : "Helvetica-Bold")
          .fontSize(32)
          .fillColor("#7440e9")
          .text(certificateData.username, 0, 210, {
            align: "center",
            features: ["rtla"],
          });

        // التفاصيل
        doc
          .font(fs.existsSync(fontPath) ? "Cairo" : "Helvetica")
          .fontSize(16)
          .fillColor("#4b5563")
          .text(
            `قد أتم قراءة كتاب "${certificateData.book_name}" بنجاح`,
            0,
            270,
            {
              align: "center",
              features: ["rtla"],
            }
          );

        // الإحصائيات - منسقة بشكل أفضل
        doc
          .font(fs.existsSync(fontPath) ? "Cairo" : "Helvetica")
          .fontSize(14)
          .fillColor("#6b7280");

        // عدد الأحاديث (يسار) - النص العربي من اليمين للشمال
        doc.text("عدد الأحاديث:", width * 0.35, 310, {
          align: "right",
          width: 120,
          features: ["rtla"],
        });

        // الرقم (بالإنجليزية من الشمال لليمين)
        doc
          .font("Helvetica")
          .text(certificateData.total_hadiths.toString(), width * 0.25, 310, {
            align: "left",
            width: 50,
          });

        // الأيام (يمين) - النص العربي من اليمين للشمال
        doc
          .font(fs.existsSync(fontPath) ? "Cairo" : "Helvetica")
          .text("الأيام:", width * 0.75, 310, {
            align: "right",
            width: 80,
            features: ["rtla"],
          });

        // الرقم (بالإنجليزية من الشمال لليمين)
        doc
          .font("Helvetica")
          .text(certificateData.total_days.toString(), width * 0.65, 310, {
            align: "left",
            width: 50,
          });

        // QR Code
        const verificationUrl = `${
          process.env.FRONTEND_URL || "https://hadith-shareef.com"
        }/verify-journey/${certificateData.verification_code}`;

        QRCode.toDataURL(verificationUrl, { width: 120 })
          .then((qrDataUrl) => {
            const qrImage = qrDataUrl.replace(/^data:image\/png;base64,/, "");
            doc.image(Buffer.from(qrImage, "base64"), width / 2 - 60, 350, {
              width: 120,
              height: 120,
            });

            // معلومات الشهادة - منسقة بشكل أفضل
            doc
              .font(fs.existsSync(fontPath) ? "Cairo" : "Helvetica")
              .fontSize(12)
              .fillColor("#9ca3af");

            // رقم الشهادة - النص العربي من اليمين للشمال
            doc.text("رقم الشهادة:", width * 0.6, 490, {
              align: "right",
              width: 120,
              features: ["rtla"],
            });

            // الرقم (بالإنجليزية من الشمال لليمين)
            doc
              .font("Helvetica")
              .text(certificateData.certificate_number, width * 0.4, 490, {
                align: "left",
                width: 150,
              });

            // تاريخ الإصدار - النص العربي من اليمين للشمال
            doc
              .font(fs.existsSync(fontPath) ? "Cairo" : "Helvetica")
              .text("تاريخ الإصدار:", width * 0.6, 510, {
                align: "right",
                width: 120,
                features: ["rtla"],
              });

            // التاريخ (بالعربية من اليمين للشمال)
            const issueDate = new Date().toLocaleDateString("ar", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            doc.text(issueDate, width * 0.4, 510, {
              align: "right",
              width: 150,
              features: ["rtla"],
            });

            // كود التحقق - النص العربي من اليمين للشمال
            doc
              .font(fs.existsSync(fontPath) ? "Cairo" : "Helvetica")
              .text("كود التحقق:", width * 0.6, 530, {
                align: "right",
                width: 120,
                features: ["rtla"],
              });

            // الكود (بالإنجليزية من الشمال لليمين)
            doc
              .font("Helvetica")
              .text(certificateData.verification_code, width * 0.4, 530, {
                align: "left",
                width: 150,
              });

            // خط فاصل
            doc
              .moveTo(100, 550)
              .lineTo(width - 100, 550)
              .stroke("#e5e7eb");

            // العلامة التجارية - بنفسجي فاتح
            doc
              .fontSize(10)
              .fillColor("#8b5cf6")
              .text("مشكاة - منصة المعرفة الإسلامية", 0, 570, {
                align: "center",
                features: ["rtla"],
              });

            doc.end();

            stream.on("finish", () => {
              resolve({
                filename,
                filepath,
                relativePath: `/uploads/certificates/${filename}`,
              });
            });

            stream.on("error", reject);
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * إنشاء شهادة كاملة
   */
  static async generateCertificate(userId, journeyId) {
    try {
      // التحقق من الأهلية
      const eligibility = await this.isEligible(userId, journeyId);
      if (!eligibility.eligible) {
        return { success: false, ...eligibility };
      }

      // جلب الإحصائيات
      const stats = await this.getUserStats(userId, journeyId);
      if (!stats) {
        return { success: false, reason: "فشل في جلب البيانات" };
      }

      // توليد الأرقام الفريدة
      const certificateNumber = this.generateCertificateNumber();
      const verificationCode = this.generateVerificationCode();

      // إنشاء PDF
      const pdfResult = await this.generatePDF({
        ...stats,
        certificate_number: certificateNumber,
        verification_code: verificationCode,
      });

      // حفظ في قاعدة البيانات
      await db.query(
        `INSERT INTO journey_certificates 
         (journey_id, user_id, book_slug, book_name, certificate_number, 
          verification_code, total_hadiths, total_days, pdf_path, stats)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          journeyId,
          userId,
          stats.book_slug,
          stats.book_name,
          certificateNumber,
          verificationCode,
          stats.total_hadiths,
          stats.total_days,
          pdfResult.relativePath,
          JSON.stringify(stats),
        ]
      );

      return {
        success: true,
        certificate: {
          certificate_number: certificateNumber,
          verification_code: verificationCode,
          pdf_path: pdfResult.relativePath,
          book_name: stats.book_name,
          issue_date: new Date(),
        },
      };
    } catch (error) {
      console.error(
        "[JourneyCertificate] Error generating certificate:",
        error
      );
      throw error;
    }
  }

  /**
   * التحقق من الشهادة
   */
  static async verifyCertificate(verificationCode) {
    try {
      const [certificates] = await db.query(
        `SELECT jc.*, u.username
         FROM journey_certificates jc
         JOIN users u ON jc.user_id = u.id
         WHERE jc.verification_code = ?`,
        [verificationCode]
      );

      if (certificates.length === 0) {
        return { valid: false, message: "الشهادة غير موجودة" };
      }

      const cert = certificates[0];

      return {
        valid: true,
        certificate: {
          certificate_number: cert.certificate_number,
          username: cert.username,
          book_name: cert.book_name,
          total_hadiths: cert.total_hadiths,
          total_days: cert.total_days,
          issue_date: cert.issue_date,
          stats: cert.stats ? JSON.parse(cert.stats) : null,
        },
      };
    } catch (error) {
      console.error("[JourneyCertificate] Error verifying certificate:", error);
      throw error;
    }
  }

  /**
   * جلب شهادة المستخدم
   */
  static async getUserCertificate(userId, journeyId) {
    try {
      const [certificates] = await db.query(
        `SELECT * FROM journey_certificates 
         WHERE user_id = ? AND journey_id = ?`,
        [userId, journeyId]
      );

      if (certificates.length === 0) {
        return null;
      }

      return certificates[0];
    } catch (error) {
      console.error(
        "[JourneyCertificate] Error getting user certificate:",
        error
      );
      throw error;
    }
  }
}

module.exports = JourneyCertificateService;
