const db = require("../config/database");
const crypto = require("crypto");

async function runMigration() {
  try {
    console.log("🚀 بدء إضافة جدول القائمة البريدية...\n");

    // Create camp_notification_subscribers table
    console.log("إنشاء جدول camp_notification_subscribers...");
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS camp_notification_subscribers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          subscription_type ENUM('camps', 'cohorts', 'both') DEFAULT 'both',
          is_active TINYINT(1) DEFAULT 1,
          unsubscribe_token VARCHAR(255) UNIQUE,
          subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          unsubscribed_at TIMESTAMP NULL,
          subscribed_by INT NULL COMMENT 'NULL للاشتراك الذاتي، أو user_id للإضافة اليدوية',
          notes TEXT NULL COMMENT 'ملاحظات من الأدمن',
          INDEX idx_email_active (email, is_active),
          INDEX idx_unsubscribe_token (unsubscribe_token),
          INDEX idx_subscribed_at (subscribed_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ تم إنشاء جدول camp_notification_subscribers بنجاح\n");
    } catch (error) {
      if (error.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("⚠️  جدول camp_notification_subscribers موجود بالفعل\n");
      } else {
        throw error;
      }
    }

    // Generate unsubscribe tokens for existing subscribers (if any)
    console.log("إنشاء unsubscribe tokens للمشتركين الموجودين...");
    try {
      const [subscribers] = await db.query(
        `SELECT id FROM camp_notification_subscribers WHERE unsubscribe_token IS NULL`
      );

      for (const subscriber of subscribers) {
        const token = crypto.randomBytes(32).toString("hex");
        await db.query(
          `UPDATE camp_notification_subscribers SET unsubscribe_token = ? WHERE id = ?`,
          [token, subscriber.id]
        );
      }
      console.log(`✅ تم إنشاء tokens لـ ${subscribers.length} مشترك\n`);
    } catch (error) {
      console.error("⚠️  خطأ في إنشاء tokens:", error.message);
    }

    console.log("🎉 اكتملت عملية إضافة جدول القائمة البريدية بنجاح!");
    console.log("\nالتغييرات المضافة:");
    console.log(
      "  - camp_notification_subscribers: جدول القائمة البريدية مع الفهارس"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ حدث خطأ أثناء التحديث:", error);
    process.exit(1);
  }
}

runMigration().finally(() => {
  process.exit();
});
