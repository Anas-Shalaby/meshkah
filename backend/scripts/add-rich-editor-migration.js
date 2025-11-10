const db = require("../config/database");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function runMigration() {
  try {
    console.log("🚀 بدء إضافة أعمدة محرر النصوص الغني...\n");

    // Add is_private column
    console.log("إضافة عمود is_private...");
    await db.query(`
      ALTER TABLE camp_task_progress
      ADD COLUMN is_private BOOLEAN DEFAULT true COMMENT 'هل الفائدة خاصة بالمستخدم'
    `);
    console.log("✅ تم إضافة عمود is_private بنجاح\n");

    // Add content_rich column for storing rich text (HTML/JSON from Tiptap)
    // Using JSON type for better structure, but we can also store as LONGTEXT if needed
    console.log("إضافة عمود content_rich...");
    await db.query(`
      ALTER TABLE camp_task_progress
      ADD COLUMN content_rich JSON COMMENT 'المحتوى الغني من محرر النصوص (HTML/JSON)'
    `);
    console.log("✅ تم إضافة عمود content_rich بنجاح\n");

    // Update existing records to have is_private = true as default
    console.log("تحديث السجلات الموجودة...");
    const [result] = await db.query(`
      UPDATE camp_task_progress
      SET is_private = true
      WHERE is_private IS NULL
    `);
    console.log(`✅ تم تحديث ${result.affectedRows} سجل\n`);

    console.log("🎉 اكتملت عملية التحديث بنجاح!");
    console.log("\nالتغييرات المضافة:");
    console.log(
      "  - is_private: يحدد ما إذا كانت الفائدة خاصة (true) أو عامة (false)"
    );
    console.log(
      "  - content_rich: يحفظ المحتوى الغني من محرر النصوص (HTML/JSON)"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ حدث خطأ أثناء التحديث:", error);
    if (error.code === "ER_DUP_FIELDNAME") {
      console.log("⚠️  الحقول موجودة بالفعل، لا حاجة للتحديث");
    }
    process.exit(1);
  }
}

runMigration().finally(() => {
  rl.close();
});
