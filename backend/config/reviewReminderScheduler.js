/**
 * Review Reminder Scheduler
 * مجدول إشعارات المراجعة اليومية
 */

const cron = require('node-cron');
const db = require('./database');
const mailService = require('../services/mailService');

class ReviewReminderScheduler {
  constructor() {
    this.task = null;
  }

  /**
   * بدء المجدول
   */
  start() {
    // يعمل يومياً في الساعة 8 مساءً (20:00)
    this.task = cron.schedule('0 20 * * *', async () => {
      console.log('🧠 Running review reminder scheduler...');
      await this.sendReviewReminders();
    });

    console.log('✅ Review reminder scheduler started (runs daily at 8 PM)');
  }

  /**
   * إيقاف المجدول
   */
  stop() {
    if (this.task) {
      this.task.stop();
      console.log('❌ Review reminder scheduler stopped');
    }
  }

  /**
   * إرسال تذكيرات المراجعة
   */
  async sendReviewReminders() {
    try {
      // جلب المستخدمين الذين لديهم بطاقات مستحقة اليوم
      const [usersWithDueReviews] = await db.query(
        `SELECT DISTINCT 
          u.id,
          u.username,
          u.email,
          COUNT(rc.id) as due_count
         FROM users u
         JOIN review_cards rc ON u.id = rc.user_id
         LEFT JOIN review_settings rs ON u.id = rs.user_id
         WHERE rc.next_review_date <= CURDATE()
           AND (rs.notifications_enabled IS NULL OR rs.notifications_enabled = TRUE)
         GROUP BY u.id
         HAVING due_count > 0`
      );

      console.log(`📧 Found ${usersWithDueReviews.length} users with due reviews`);

      // إرسال إيميل لكل مستخدم
      for (const user of usersWithDueReviews) {
        try {
          await this.sendReminderEmail(user);
          console.log(`✉️  Sent reminder to ${user.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${user.email}:`, emailError);
        }
      }

      console.log('✅ Review reminders sent successfully');
    } catch (error) {
      console.error('❌ Error sending review reminders:', error);
    }
  }

  /**
   * إرسال إيميل تذكير لمستخدم واحد
   */
  async sendReminderEmail(user) {
    const subject = '🧠 حان وقت المراجعة - مشكاة';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #666;
            line-height: 1.8;
            margin-bottom: 20px;
          }
          .stats {
            background: linear-gradient(135deg, #f5f7fa 0%, #f0f0f3 100%);
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .stats-number {
            font-size: 48px;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
          }
          .stats-label {
            font-size: 14px;
            color: #666;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
          }
          .tips {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 12px;
            padding: 15px;
            margin: 20px 0;
          }
          .tips-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧠 حان وقت المراجعة!</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              السلام عليكم ${user.username}،
            </div>
            
            <div class="message">
              لديك <strong>بطاقات جديدة</strong> جاهزة للمراجعة اليوم! المراجعة المنتظمة هي مفتاح الحفظ طويل المدى.
            </div>
            
            <div class="stats">
              <div class="stats-number">${user.due_count}</div>
              <div class="stats-label">بطاقة مستحقة للمراجعة اليوم</div>
            </div>
            
            <center>
              <a href="https://hadith-shareef.com/reviews" class="cta-button">
                ابدأ المراجعة الآن
              </a>
            </center>
            
            <div class="tips">
              <div class="tips-title">💡 نصيحة اليوم:</div>
              المراجعة تستغرق فقط 5-10 دقائق يومياً. خصص وقتاً ثابتاً كل يوم (مثل بعد صلاة الفجر أو المغرب) للمراجعة، وستلاحظ تحسناً كبيراً في الحفظ.
            </div>
            
            <div class="message">
              تذكر: الاستمرارية أهم من السرعة. مراجعة 5 بطاقات يومياً بانتظام أفضل من مراجعة 50 بطاقة مرة واحدة!
            </div>
          </div>
          
          <div class="footer">
            <p>© 2026 مشكاة - منصة الحديث الشريف</p>
            <p>
              <a href="https://hadith-shareef.com/reviews/settings" style="color: #667eea;">إدارة إعدادات الإشعارات</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await mailService.sendEmail({
      to: user.email,
      subject,
      html: htmlContent,
    });
  }

  /**
   * تشغيل يدوي للاختبار
   */
  async runManually() {
    console.log('🔧 Running review reminder manually...');
    await this.sendReviewReminders();
  }
}

module.exports = ReviewReminderScheduler;
