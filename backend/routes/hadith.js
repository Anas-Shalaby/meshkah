const express = require("express");
const db = require("../config/database"); // Assuming you have a database connection setup
const router = express.Router();
router.get("/hadith-ids", async (req, res) => {
  try {
    const [results] = await db.query("SELECT id FROM hadiths ORDER BY id");

    const hadithIds = results.map((result) => result.id);
    res.json({ ids: hadithIds });
  } catch (error) {
    console.error("Error fetching hadith IDs:", error);
    res.status(500).json({ message: "Error fetching hadith IDs" });
  }
});

router.get("/hadith/random", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM hadiths ORDER BY RAND() LIMIT 1"
    );
    const randomHadith = results[0];
    res.json({ hadith: randomHadith });
  } catch (error) {
    console.error("Error fetching random hadith :", error);
    res.status(500).json({ message: "Error fetching random hadith ID" });
  }
});
module.exports = router;
