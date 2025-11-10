const shortid = require("shortid");
const db = require("../config/database");

(async () => {
  try {
    const [rows] = await db.query(
      `SELECT id FROM quran_camps WHERE share_link IS NULL OR share_link = ''`
    );
    for (const row of rows) {
      const share = shortid.generate();
      await db.query(`UPDATE quran_camps SET share_link = ? WHERE id = ?`, [
        share,
        row.id,
      ]);
      console.log(`Backfilled camp ${row.id} -> ${share}`);
    }
    console.log("Backfill complete");
    process.exit(0);
  } catch (e) {
    console.error("Backfill error", e);
    process.exit(1);
  }
})();
