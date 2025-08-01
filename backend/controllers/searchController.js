const db = require("../config/database");
const Fuse = require("fuse.js");
const axios = require("axios");
const removeTashkeel = (text) => {
  return text
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/[ى]/g, "ي")
    .replace(/[ة]/g, "ه")
    .replace(/[^\u0600-\u06FF\s]/g, "");
};

const searchHadiths = async (req, res) => {
  try {
    const { query } = req.query;

    // Get all hadiths - Modified for MySQL
    const [hadiths] = await db.query(
      "SELECT id, title_ar, hadith_text_ar, explanation_ar , grade_ar , takhrij_ar FROM hadiths"
    );

    // Prepare data for fuzzy search
    const normalizedHadiths = hadiths.map((hadith) => ({
      ...hadith,
      normalizedText: removeTashkeel(
        hadith.hadith_text_ar +
          " " +
          hadith.explanation_ar +
          " " +
          hadith.title_ar
      ),
    }));

    // Configure Fuse.js
    const fuse = new Fuse(normalizedHadiths, {
      keys: ["normalizedText"],
      threshold: 0.3,
      ignoreLocation: true,
    });

    // Perform search
    const normalizedQuery = removeTashkeel(query);
    const searchResults = fuse.search(normalizedQuery);
    res.json({
      success: true,
      data: searchResults.map((result) => result.item),
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Error performing search",
    });
  }
};

const getHadithDetails = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Hadith ID is required" });
    }

    const [hadith] = await db.query("SELECT * FROM hadiths WHERE id = ?", [id]);
    if (!hadith[0]) {
      return res.status(404).json({ message: "Hadith not found" });
    }
    let hintsArray = [];

    if (!hadith[0] && hadith[0].benefits_ar === null) {
      hadith[0].benefits_ar = [];
    } else {
      hintsArray = hadith[0].benefits_ar.split("\n");
      hadith[0].benefits_ar = hintsArray.map((hint) => hint.trim());
    }

    const response = {
      id: hadith[0].id,
      hadeeth: hadith[0].hadith_text_ar,
      title: hadith[0].title_ar,
      attribution: hadith[0].takhrij_ar,
      grade: hadith[0].grade_ar,
      explanation: hadith[0].explanation_ar,
      hints: hadith[0].benefits_ar || [],
      words_meanings: hadith[0].words_meanings,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching hadith details:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getSubCategoriesFromApi = async (req, res) => {
  try {
    const { language = "ar" } = req.query;
    const response = await axios.get(
      `https://hadeethenc.com/api/v1/categories/list/?language=${language}`
    );
    const categories = response.data;

    // Build a map for fast lookup
    const categoriesMap = new Map();
    categories.forEach((cat) => {
      categoriesMap.set(cat.id, { ...cat, subCategories: [] });
    });

    // Attach subcategories to their parents
    categories.forEach((cat) => {
      if (cat.parent_id && categoriesMap.has(cat.parent_id)) {
        categoriesMap
          .get(cat.parent_id)
          .subCategories.push(categoriesMap.get(cat.id));
      }
    });

    // Add hasSubCategories flag
    categoriesMap.forEach((cat) => {
      cat.hasSubCategories = cat.subCategories.length > 0;
    });

    // Only root categories (no parent)
    const rootCategories = Array.from(categoriesMap.values()).filter(
      (cat) => !cat.parent_id
    );

    // Already handled by the above logic

    res.status(200).json({ success: true, data: rootCategories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
    });
  }
};

module.exports = {
  searchHadiths,
  getHadithDetails,
  getSubCategoriesFromApi,
};
