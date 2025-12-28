const shortid = require("shortid");
const db = require("../config/database");

(async () => {
  try {
    console.log("🔍 جاري البحث عن التدبرات التي لا تحتوي على share_link...");

    // جلب جميع التدبرات التي:
    // 1. لديها journal_entry غير فارغ
    // 2. غير خاصة (is_private = false أو NULL)
    // 3. لا تحتوي على share_link
    const [rows] = await db.query(
      `SELECT 
        ctp.id,
        ctp.enrollment_id,
        ctp.task_id,
        ctp.journal_entry,
        ctp.is_private,
        ctp.share_link
      FROM camp_task_progress ctp
      WHERE (ctp.journal_entry IS NOT NULL AND ctp.journal_entry != '' AND TRIM(REPLACE(REPLACE(REPLACE(ctp.journal_entry, '<p>', ''), '</p>', ''), '&nbsp;', '')) != '')
        AND (ctp.is_private IS NULL OR ctp.is_private = false)
        AND (ctp.share_link IS NULL OR ctp.share_link = '')`
    );

    console.log(`📊 وجدت ${rows.length} تدبرة تحتاج إلى share_link`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        const shareLink = `r-${shortid.generate()}`;
        await db.query(
          `UPDATE camp_task_progress SET share_link = ? WHERE id = ?`,
          [shareLink, row.id]
        );
        console.log(`✅ تم إنشاء share_link للتدبرة ${row.id} -> ${shareLink}`);
        successCount++;
      } catch (error) {
        console.error(
          `❌ خطأ في إنشاء share_link للتدبرة ${row.id}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log(`\n🎉 اكتملت العملية!`);
    console.log(`✅ نجح: ${successCount}`);
    console.log(`❌ فشل: ${errorCount}`);
    process.exit(0);
  } catch (e) {
    console.error("❌ خطأ في العملية:", e);
    process.exit(1);
  }
})();
