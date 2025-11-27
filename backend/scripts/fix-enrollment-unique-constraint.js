const db = require("../config/database");

async function runMigration() {
  try {
    console.log("🚀 بدء إصلاح unique constraint في camp_enrollments...\n");

    // 1. Find and drop the old unique constraint
    console.log("البحث عن unique constraint القديم...");
    try {
      // Get constraint name
      const [constraints] = await db.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'camp_enrollments'
        AND CONSTRAINT_TYPE = 'UNIQUE'
        AND CONSTRAINT_NAME LIKE '%user%camp%'
      `);

      if (constraints.length > 0) {
        const constraintName = constraints[0].CONSTRAINT_NAME;
        console.log(`تم العثور على constraint: ${constraintName}`);

        await db.query(`
          ALTER TABLE camp_enrollments
          DROP INDEX ${constraintName}
        `);
        console.log(`✅ تم حذف constraint القديم: ${constraintName}\n`);
      } else {
        console.log("⚠️  لم يتم العثور على constraint قديم\n");
      }
    } catch (error) {
      if (error.code === "ER_CANT_DROP_FIELD_OR_KEY") {
        console.log("⚠️  Constraint غير موجود أو لا يمكن حذفه\n");
      } else {
        console.error("خطأ في حذف constraint:", error.message);
        throw error;
      }
    }

    // 2. Add new unique constraint with cohort_number
    console.log("إضافة unique constraint جديد يتضمن cohort_number...");
    try {
      await db.query(`
        ALTER TABLE camp_enrollments
        ADD UNIQUE KEY unique_user_camp_cohort (user_id, camp_id, cohort_number)
      `);
      console.log("✅ تم إضافة unique constraint جديد بنجاح\n");
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.code === "ER_DUP_KEYNAME") {
        console.log("⚠️  Constraint موجود بالفعل أو توجد بيانات مكررة\n");
        console.log(
          "يرجى التحقق من البيانات المكررة قبل إعادة تشغيل الـ migration\n"
        );
      } else {
        throw error;
      }
    }

    console.log("🎉 اكتملت عملية إصلاح unique constraint!");
    console.log("\nالتغييرات:");
    console.log("  - تم حذف unique constraint القديم (user_id, camp_id)");
    console.log(
      "  - تم إضافة unique constraint جديد (user_id, camp_id, cohort_number)"
    );
    console.log(
      "\n✅ الآن يمكن للمستخدم التسجيل في نفس المخيم في أفواج مختلفة"
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
