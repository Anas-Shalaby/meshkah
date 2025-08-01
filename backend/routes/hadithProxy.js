const express = require("express");
const router = express.Router();
const axios = require("axios");
const { getSubCategoriesFromApi } = require("../controllers/searchController");
// Proxy endpoint for hadith details
router.get("/hadith/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { language = "ar" } = req.query;

    const response = await axios.get(
      `https://hadeethenc.com/api/v1/hadeeths/one/`,
      {
        params: {
          language,
          id,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Hadith proxy error:", error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || "Error fetching hadith details",
    });
  }
});

router.get("/sub-categories", getSubCategoriesFromApi);

module.exports = router;
