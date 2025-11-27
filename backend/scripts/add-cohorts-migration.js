const db = require("../config/database");

async function runMigration() {
  try {
    console.log("🚀 بدء إضافة نظام الأفواج للمخيمات...\n");

    // 1. Add cohort fields to quran_camps table
    console.log("إضافة حقول الأفواج في جدول quran_camps...");
    try {
      await db.query(`
        ALTER TABLE quran_camps
        ADD COLUMN current_cohort_number INT DEFAULT 1 COMMENT 'رقم الفوج الحالي'
      `);
      console.log("✅ تم إضافة current_cohort_number بنجاح");
    } catch (error) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️  current_cohort_number موجود بالفعل");
      } else {
        throw error;
      }
    }

    try {
      await db.query(`
        ALTER TABLE quran_camps
        ADD COLUMN total_cohorts INT DEFAULT 1 COMMENT 'إجمالي عدد الأفواج'
      `);
      console.log("✅ تم إضافة total_cohorts بنجاح\n");
    } catch (error) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️  total_cohorts موجود بالفعل\n");
      } else {
        throw error;
      }
    }

    // 2. Add cohort_number to camp_enrollments
    console.log("إضافة cohort_number في جدول camp_enrollments...");
    try {
      await db.query(`
        ALTER TABLE camp_enrollments
        ADD COLUMN cohort_number INT DEFAULT 1 COMMENT 'رقم الفوج الذي ينتمي إليه التسجيل'
      `);
      console.log("✅ تم إضافة cohort_number بنجاح");
    } catch (error) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️  cohort_number موجود بالفعل");
      } else {
        throw error;
      }
    }

    // Update existing records to cohort 1
    console.log("تحديث السجلات الموجودة إلى الفوج 1...");
    const [updateEnrollments] = await db.query(`
      UPDATE camp_enrollments
      SET cohort_number = 1
      WHERE cohort_number IS NULL
    `);
    console.log(`✅ تم تحديث ${updateEnrollments.affectedRows} تسجيل\n`);

    // Add composite index for performance
    console.log("إضافة فهرس مركب لتحسين الأداء...");
    try {
      await db.query(`
        CREATE INDEX idx_camp_cohort_user 
        ON camp_enrollments(camp_id, cohort_number, user_id)
      `);
      console.log("✅ تم إضافة الفهرس المركب بنجاح\n");
    } catch (error) {
      if (error.code === "ER_DUP_KEYNAME") {
        console.log("⚠️  الفهرس موجود بالفعل\n");
      } else {
        throw error;
      }
    }

    // 3. Add cohort_number to camp_qanda
    console.log("إضافة cohort_number في جدول camp_qanda...");
    try {
      await db.query(`
        ALTER TABLE camp_qanda
        ADD COLUMN cohort_number INT DEFAULT 1 COMMENT 'رقم الفوج للسؤال/الإجابة'
      `);
      console.log("✅ تم إضافة cohort_number بنجاح");
    } catch (error) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️  cohort_number موجود بالفعل");
      } else {
        throw error;
      }
    }

    // Update existing records to cohort 1
    console.log("تحديث الأسئلة الموجودة إلى الفوج 1...");
    const [updateQanda] = await db.query(`
      UPDATE camp_qanda
      SET cohort_number = 1
      WHERE cohort_number IS NULL
    `);
    console.log(`✅ تم تحديث ${updateQanda.affectedRows} سؤال\n`);

    // 4. Add cohort_number to camp_friendships
    console.log("إضافة cohort_number في جدول camp_friendships...");
    try {
      await db.query(`
        ALTER TABLE camp_friendships
        ADD COLUMN cohort_number INT DEFAULT 1 COMMENT 'رقم الفوج للصداقة'
      `);
      console.log("✅ تم إضافة cohort_number بنجاح");
    } catch (error) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️  cohort_number موجود بالفعل");
      } else {
        throw error;
      }
    }

    // Update existing records to cohort 1
    console.log("تحديث الصداقات الموجودة إلى الفوج 1...");
    const [updateFriendships] = await db.query(`
      UPDATE camp_friendships
      SET cohort_number = 1
      WHERE cohort_number IS NULL
    `);
    console.log(`✅ تم تحديث ${updateFriendships.affectedRows} صداقة\n`);

    // 5. Add cohort_number to camp_notifications (nullable)
    console.log("إضافة cohort_number في جدول camp_notifications (nullable)...");
    try {
      await db.query(`
        ALTER TABLE camp_notifications
        ADD COLUMN cohort_number INT NULL COMMENT 'رقم الفوج للإشعار (NULL للإشعارات العامة)'
      `);
      console.log("✅ تم إضافة cohort_number بنجاح\n");
    } catch (error) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️  cohort_number موجود بالفعل\n");
      } else {
        throw error;
      }
    }

    // 6. Update quran_camps to set default values
    console.log("تحديث المخيمات الموجودة...");
    const [updateCamps] = await db.query(`
      UPDATE quran_camps
      SET current_cohort_number = COALESCE(current_cohort_number, 1),
          total_cohorts = COALESCE(total_cohorts, 1)
      WHERE current_cohort_number IS NULL OR total_cohorts IS NULL
    `);
    console.log(`✅ تم تحديث ${updateCamps.affectedRows} مخيم\n`);

    console.log("🎉 اكتملت عملية إضافة نظام الأفواج بنجاح!");
    console.log("\nالتغييرات المضافة:");
    console.log("  - quran_camps: current_cohort_number, total_cohorts");
    console.log("  - camp_enrollments: cohort_number");
    console.log("  - camp_qanda: cohort_number");
    console.log("  - camp_friendships: cohort_number");
    console.log("  - camp_notifications: cohort_number (nullable)");
    console.log(
      "\n✅ جميع السجلات الموجودة تم تعيينها للفوج الأول (cohort_number = 1)"
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
