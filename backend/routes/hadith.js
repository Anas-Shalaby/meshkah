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

// New API endpoint for Flutter developer - Get hadith details with its specific categories
router.get("/hadith/:id/details", async (req, res) => {
  try {
    const { id } = req.params;
    const { language = "ar" } = req.query;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: "Hadith ID is required" 
      });
    }

    // Get hadith details from external API
    const axios = require("axios");
    let hadithData = null;
    let hadithCategories = [];

    try {
      // Fetch hadith details from external API
      const hadithResponse = await axios.get(
        `https://hadeethenc.com/api/v1/hadeeths/one/?language=${language}&id=${id}`
      );
      
      hadithData = hadithResponse.data;
      
      // If hadith has categories, fetch category details
      if (hadithData.categories && hadithData.categories.length > 0) {
        // Fetch all categories first
        const categoriesResponse = await axios.get(
          `https://hadeethenc.com/api/v1/categories/list/?language=${language}`
        );
        
        const allCategories = categoriesResponse.data;
        
        // Filter categories that belong to this hadith
        hadithCategories = allCategories.filter(category => 
          hadithData.categories.includes(category.id.toString())
        );
      }
    } catch (error) {
      console.error("Error fetching from external API:", error);
      return res.status(500).json({ 
        success: false,
        message: "Error fetching hadith from external API" 
      });
    }

    // Build comprehensive response
    const response = {
      success: true,
      data: {
        id: hadithData.id,
        hadith: {
          text: hadithData.hadeeth,
          title: hadithData.title,
          attribution: hadithData.attribution,
          grade: hadithData.grade,
          explanation: hadithData.explanation,
          hints: hadithData.hints || [],
          words_meanings: hadithData.words_meanings || [],
          reference: hadithData.reference,
        },
        metadata: {
          language: language,
          categories: hadithCategories,
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching hadith details:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error", 
      error: error.message 
    });
  }
});

// Alternative endpoint with simpler response structure
router.get("/hadith/:id/simple", async (req, res) => {
  try {
    const { id } = req.params;
    const { language = "ar" } = req.query;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: "Hadith ID is required" 
      });
    }

    // Get hadith details from external API
    const axios = require("axios");
    let hadithData = null;
    let hadithCategories = [];

    try {
      // Fetch hadith details from external API
      const hadithResponse = await axios.get(
        `https://hadeethenc.com/api/v1/hadeeths/one/?language=${language}&id=${id}`
      );
      
      hadithData = hadithResponse.data;
      
      // If hadith has categories, fetch category details
      if (hadithData.categories && hadithData.categories.length > 0) {
        // Fetch all categories first
        const categoriesResponse = await axios.get(
          `https://hadeethenc.com/api/v1/categories/list/?language=${language}`
        );
        
        const allCategories = categoriesResponse.data;
        
        // Filter categories that belong to this hadith
        hadithCategories = allCategories.filter(category => 
          hadithData.categories.includes(category.id.toString())
        );
      }
    } catch (error) {
      console.error("Error fetching from external API:", error);
      return res.status(500).json({ 
        success: false,
        message: "Error fetching hadith from external API" 
      });
    }

    // Simple response structure
    const response = {
      success: true,
      hadith_id: hadithData.id,
      text: hadithData.hadeeth,
      title: hadithData.title,
      attribution: hadithData.attribution,
      grade: hadithData.grade,
      explanation: hadithData.explanation,
      hints: hadithData.hints || [],
      words_meanings: hadithData.words_meanings || [],
      reference: hadithData.reference,
      categories: hadithCategories,
      category_ids: hadithData.categories || [],
      language: language,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching hadith details:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error", 
      error: error.message 
    });
  }
});

module.exports = router;
