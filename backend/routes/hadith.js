const express = require("express");
const db = require("../config/database");
const axios = require("axios");
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
    const [rows] = await db.query(
      "SELECT id FROM hadiths ORDER BY RAND() LIMIT 4"
    );
    const idList = rows.map((row) => row.id);
    const randomHadiths = await Promise.all(
      idList.map(async (id) => {
        const response = await axios.get(
          `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${id}`
        );
        return response.data;
      })
    );

    // جلب أسماء الفئات
    const categoriesNames = await getCategoriesNamesFromIds(
      randomHadiths.map((hadith) => hadith.categories)
    );

    const hadithsArray = randomHadiths.map((hadith, index) => ({
      hadithId: hadith.id,
      hadith: hadith.hadeeth,
      title: hadith.title,
      attribution: hadith.attribution,
      grade: hadith.grade,
      explanation: hadith.explanation,
      hints: hadith.hints,
      words_meanings: hadith.words_meanings,
      categoriesIds: hadith.categories,
      reference: hadith.reference,
      language: "ar",
    }));

    // إضافة أسماء الفئات لكل حديث
    hadithsArray.forEach((hadith) => {
      if (hadith.categoriesIds && hadith.categoriesIds.length > 0) {
        hadith.categories = categoriesNames
          .filter((category) => hadith.categoriesIds.includes(category.id))
          .map((category) => category.title);
      } else {
        hadith.categories = [];
      }
    });

    res.json({ hadiths: hadithsArray });
  } catch (error) {
    console.error("Error fetching random hadith :", error);
    res.status(500).json({
      message: "Error fetching random hadith ID",
      error: error.message,
    });
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
        message: "Hadith ID is required",
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
        hadithCategories = allCategories.filter((category) =>
          hadithData.categories.includes(category.id.toString())
        );
      }
    } catch (error) {
      console.error("Error fetching from external API:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching hadith from external API",
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
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching hadith details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
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
        message: "Hadith ID is required",
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
        hadithCategories = allCategories.filter((category) =>
          hadithData.categories.includes(category.id.toString())
        );
      }
    } catch (error) {
      console.error("Error fetching from external API:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching hadith from external API",
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
      error: error.message,
    });
  }
});

router.get("/daily-hadith", async (req, res) => {
  try {
    const [hadithId] = await db.query(
      "SELECT id FROM hadiths ORDER BY RAND() LIMIT 1"
    );
    let randomHadith = await axios.get(
      `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${hadithId[0].id}`
    );

    // جلب أسماء الفئات
    let categoryNames = [];
    if (
      randomHadith.data.categories &&
      randomHadith.data.categories.length > 0
    ) {
      const categoriesResponse = await axios.get(
        "https://hadeethenc.com/api/v1/categories/list/?language=ar"
      );
      const allCategories = categoriesResponse.data;

      categoryNames = allCategories
        .filter((cat) =>
          randomHadith.data.categories.includes(cat.id.toString())
        )
        .map((cat) => ({ id: cat.id, title: cat.title }));
    }

    let today = new Date();

    let dayOfWeek = today.getDay();
    if (dayOfWeek === 5 || dayOfWeek === "5") {
      const categoryResponse = await axios.get(
        `https://hadeethenc.com/api/v1/hadeeths/list/?language=ar&category_id=477`
      );
      let category = categoryResponse.data.data;
      let getRandomId =
        category[Math.floor(Math.random() * category.length)].id;
      let hadithResponse = await axios.get(
        `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${getRandomId}`
      );
      randomHadith = hadithResponse;
    }

    res.json({
      status: true,
      data: {
        id: randomHadith.data.id,
        title: randomHadith.data.title,
        hadith: randomHadith.data.hadeeth,
        attribution: randomHadith.data.attribution,
        grade: randomHadith.data.grade,
        explanation: randomHadith.data.explanation,
        hints: randomHadith.data.hints,
        words_meanings: randomHadith.data.words_meanings,
        categories: randomHadith.data.categories,
        category_names: categoryNames,
      },
    });
  } catch (error) {
    console.error("Error fetching daily hadith:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

async function getCategoriesNamesFromIds(categoriesIds) {
  const categories = await axios.get(
    "https://hadeethenc.com/api/v1/categories/list/?language=ar"
  );
  const flatArray = categoriesIds.flat();
  const finalArray = flatArray.map((item) => [parseInt(item, 10)]);
  const categoriesIdsArr = finalArray.map((id) => id.toString());

  const categoriesNames = categories.data
    .filter((category) => categoriesIdsArr.some((id) => id === category.id))
    .map((category) => ({ title: category.title, id: category.id }));

  return categoriesNames;
}

module.exports = router;
