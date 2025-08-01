const express = require("express");
const router = express.Router();
const {
  searchHadiths,
  getHadithDetails,
} = require("../controllers/searchController");

router.get("/search", searchHadiths);
router.get("/hadith", getHadithDetails);
module.exports = router;
