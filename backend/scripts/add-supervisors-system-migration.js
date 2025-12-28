const db = require("../config/database");

async function runMigration() {
  try {
    console.log("🚀 بدء إضافة نظام المشرفين للمخيمات...\n");

    // Create camp_supervisors table
    console.log("إنشاء جدول camp_supervisors...");
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS camp_supervisors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          camp_id INT NOT NULL,
          cohort_number INT NULL COMMENT 'NULL للمشرفين العامين على المخيم',
          user_id INT NOT NULL,
          role ENUM('supervisor', 'admin') DEFAULT 'supervisor',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by INT NULL,
          FOREIGN KEY (camp_id) REFERENCES quran_camps(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
          UNIQUE KEY unique_supervisor (camp_id, cohort_number, user_id),
          INDEX idx_camp_cohort (camp_id, cohort_number),
          INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ تم إنشاء جدول camp_supervisors بنجاح\n");
    } catch (error) {
      if (error.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("⚠️  جدول camp_supervisors موجود بالفعل\n");
      } else {
        throw error;
      }
    }

    console.log("🎉 اكتملت عملية إضافة نظام المشرفين بنجاح!");
    console.log("\nالتغييرات المضافة:");
    console.log("  - camp_supervisors: جدول المشرفين مع الفهارس والقيود");

    process.exit(0);
  } catch (error) {
    console.error("❌ حدث خطأ أثناء التحديث:", error);
    process.exit(1);
  }
}

runMigration().finally(() => {
  process.exit();
});
