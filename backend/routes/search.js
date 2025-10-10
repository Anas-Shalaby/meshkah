const express = require("express");
const router = express.Router();
const axios = require("axios");
const { JSDOM } = require("jsdom");

const {
  searchHadiths,
  getHadithDetails,
} = require("../controllers/searchController");
const db = require("../config/database");

router.get("/search", searchHadiths);
router.get("/hadith", getHadithDetails);
router.post("/search", async (req, res) => {
  try {
    const { searchTerm, page = 1, limit = 10 } = req.body;

    // Create form data
    const formData = new URLSearchParams();
    formData.append("term", searchTerm);
    formData.append("trans", "ar");

    // Fetch from external API
    const externalRes = await axios.post(
      "https://hadeethenc.com/en/ajax/search",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Parse HTML response using JSDOM
    const dom = new JSDOM(externalRes.data);
    const document = dom.window.document;

    // Extract hadith IDs
    const hadithDivs = Array.from(
      document.querySelectorAll("div.rtl.text-right")
    );
    const hadithIds = hadithDivs
      .map((div) => {
        const a = div.querySelector("a[href]");
        if (a && a.getAttribute("href")) {
          const match = a.getAttribute("href").match(/\/hadith\/(\d+)/);
          return match ? match[1] : null;
        }
        return null;
      })
      .filter(Boolean);

    if (hadithIds.length === 0) {
      return res.json({
        success: true,
        results: [],
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: page,
          limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedIds = hadithIds.slice(startIndex, endIndex);

    // Fetch hadiths for paginated IDs
    let hadiths = [];
    for (const id of paginatedIds) {
      try {
        const response = await axios.get(
          `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${id}`
        );
        if (response.data) {
          hadiths.push(response.data);
        }
      } catch (error) {
        console.error(`Error fetching hadith ID ${id}:`, error);
      }
    }

    // Remove translations field
    hadiths = hadiths.map((hadith) => {
      const { translations, ...rest } = hadith;
      return rest;
    });

    // Calculate pagination metadata
    const totalResults = hadithIds.length;
    const totalPages = Math.ceil(totalResults / limit);

    res.json({
      success: true,
      results: hadiths,
      pagination: {
        total: totalResults,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        resultsInPage: hadiths.length,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء البحث",
      error: error.message,
    });
  }
});
module.exports = router;
