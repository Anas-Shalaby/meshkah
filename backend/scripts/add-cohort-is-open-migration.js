const db = require("../config/database");

async function runMigration() {
  try {
    console.log("🚀 بدء إضافة حقل is_open لجدول camp_cohorts...\n");

    // Add is_open column to camp_cohorts table
    console.log("إضافة حقل is_open في جدول camp_cohorts...");
    try {
      await db.query(`
        ALTER TABLE camp_cohorts
        ADD COLUMN is_open TINYINT(1) DEFAULT 0 COMMENT 'هل الفوج مفتوح (1 = مفتوح, 0 = مغلق)'
      `);
      console.log("✅ تم إضافة is_open بنجاح");
    } catch (error) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️  is_open موجود بالفعل");
      } else {
        throw error;
      }
    }

    // Set is_open = 1 for active cohorts
    console.log("تحديث الأفواج النشطة لتكون مفتوحة...");
    try {
      const [updateResult] = await db.query(`
        UPDATE camp_cohorts 
        SET is_open = 1 
        WHERE status = 'active' AND (is_open IS NULL OR is_open = 0)
      `);
      console.log(`✅ تم تحديث ${updateResult.affectedRows} فوج نشط\n`);
    } catch (error) {
      console.error("⚠️  خطأ في تحديث الأفواج النشطة:", error.message);
    }

    // Add index for better performance
    console.log("إضافة فهرس لتحسين الأداء...");
    try {
      await db.query(`
        CREATE INDEX idx_camp_cohorts_is_open 
        ON camp_cohorts(camp_id, is_open, status)
      `);
      console.log("✅ تم إضافة الفهرس بنجاح\n");
    } catch (error) {
      if (error.code === "ER_DUP_KEYNAME") {
        console.log("⚠️  الفهرس موجود بالفعل\n");
      } else {
        console.error("⚠️  خطأ في إضافة الفهرس:", error.message);
      }
    }

    console.log("🎉 اكتملت عملية إضافة حقل is_open بنجاح!");
    console.log("\nالتغييرات المضافة:");
    console.log("  - camp_cohorts: is_open (TINYINT(1), DEFAULT 0)");
    console.log(
      "  - تم تحديث الأفواج النشطة (status = 'active') لتكون مفتوحة (is_open = 1)"
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
