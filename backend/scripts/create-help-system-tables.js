const db = require("../config/database");

async function runMigration() {
  try {
    console.log("🚀 بدء إنشاء جداول نظام المساعدة...\n");

    // 1. Create camp_help_articles table
    console.log("إنشاء جدول camp_help_articles...");
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS camp_help_articles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          camp_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          section_id VARCHAR(100),
          display_order INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (camp_id) REFERENCES quran_camps(id) ON DELETE CASCADE,
          INDEX idx_camp_id (camp_id),
          INDEX idx_section_id (section_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ تم إنشاء جدول camp_help_articles بنجاح\n");
    } catch (error) {
      if (error.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("⚠️  جدول camp_help_articles موجود بالفعل\n");
      } else {
        throw error;
      }
    }

    // 2. Create camp_help_faq table
    console.log("إنشاء جدول camp_help_faq...");
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS camp_help_faq (
          id INT AUTO_INCREMENT PRIMARY KEY,
          camp_id INT NOT NULL,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          category VARCHAR(100),
          display_order INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (camp_id) REFERENCES quran_camps(id) ON DELETE CASCADE,
          INDEX idx_camp_id (camp_id),
          INDEX idx_category (category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ تم إنشاء جدول camp_help_faq بنجاح\n");
    } catch (error) {
      if (error.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("⚠️  جدول camp_help_faq موجود بالفعل\n");
      } else {
        throw error;
      }
    }

    // 3. Create camp_help_feedback table
    console.log("إنشاء جدول camp_help_feedback...");
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS camp_help_feedback (
          id INT AUTO_INCREMENT PRIMARY KEY,
          camp_id INT NOT NULL,
          user_id INT NOT NULL,
          feedback TEXT NOT NULL,
          rating INT,
          category VARCHAR(100),
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (camp_id) REFERENCES quran_camps(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_camp_id (camp_id),
          INDEX idx_user_id (user_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ تم إنشاء جدول camp_help_feedback بنجاح\n");
    } catch (error) {
      if (error.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("⚠️  جدول camp_help_feedback موجود بالفعل\n");
      } else {
        throw error;
      }
    }

    console.log("🎉 اكتملت عملية إنشاء جداول نظام المساعدة!");
    console.log("\nالجداول المُنشأة:");
    console.log("  - camp_help_articles: مقالات المساعدة");
    console.log("  - camp_help_faq: الأسئلة الشائعة");
    console.log("  - camp_help_feedback: ملاحظات المستخدمين");

    process.exit(0);
  } catch (error) {
    console.error("❌ حدث خطأ أثناء إنشاء الجداول:", error);
    process.exit(1);
  }
}

runMigration().finally(() => {
  process.exit();
});
