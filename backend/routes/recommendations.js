const express = require("express");
const router = express.Router();
const recommendationService = require("../services/recommendationService");
const { authMiddleware } = require("../middleware/authMiddleware");
const db = require("../config/database");

// تسجيل تفاعل المستخدم مع الحديث
router.post("/track-interaction", authMiddleware, async (req, res) => {
  try {
    const { hadithId, interactionType, metadata = {} } = req.body;

    if (!hadithId || !interactionType) {
      return res.status(400).json({
        error: "يجب توفير معرف الحديث ونوع التفاعل",
      });
    }

    const validTypes = [
      "view",
      "read",
      "bookmark",
      "memorize",
      "share",
      "like",
      "analyze",
    ];
    if (!validTypes.includes(interactionType)) {
      return res.status(400).json({
        error: "نوع التفاعل غير صحيح",
      });
    }

    await recommendationService.trackUserInteraction(
      req.user.id,
      hadithId,
      interactionType,
      metadata
    );

    res.json({
      message: "تم تسجيل التفاعل بنجاح",
      success: true,
    });
  } catch (error) {
    console.error("Error tracking interaction:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء تسجيل التفاعل",
    });
  }
});

// الحصول على التوصيات الذكية للمستخدم
router.get("/smart-recommendations", authMiddleware, async (req, res) => {
  try {
    const { limit = 10, type = "all" } = req.query;
    const limitNum = parseInt(limit);

    if (limitNum > 50) {
      return res.status(400).json({
        error: "الحد الأقصى للتوصيات هو 50",
      });
    }

    let recommendations;

    // استخدام recommendationService للحصول على التوصيات مع بيانات API
    recommendations = await recommendationService.getUserRecommendations(
      req.user.id,
      limitNum
    );

    // فلترة حسب نوع التوصية إذا كان مطلوباً
    if (type !== "all") {
      recommendations = recommendations.filter(
        (rec) => rec.recommendation_type === type
      );
    }

    res.json({
      recommendations,
      count: recommendations.length,
      success: true,
    });
  } catch (error) {
    console.error("Error getting smart recommendations:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب التوصيات",
    });
  }
});

// توليد توصيات جديدة للمستخدم
router.post("/generate-recommendations", authMiddleware, async (req, res) => {
  try {
    const { limit = 15 } = req.body;
    const limitNum = parseInt(limit);

    if (limitNum > 50) {
      return res.status(400).json({
        error: "الحد الأقصى للتوصيات هو 50",
      });
    }

    const recommendations =
      await recommendationService.generateSmartRecommendations(
        req.user.id,
        limitNum
      );

    res.json({
      message: "تم توليد التوصيات بنجاح",
      recommendations,
      count: recommendations.length,
      success: true,
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء توليد التوصيات",
    });
  }
});

// تسجيل تفاعل المستخدم مع التوصية
router.post(
  "/track-recommendation-interaction",
  authMiddleware,
  async (req, res) => {
    try {
      const { recommendationId, interactionType } = req.body;

      if (!recommendationId || !interactionType) {
        return res.status(400).json({
          error: "يجب توفير معرف التوصية ونوع التفاعل",
        });
      }

      const validTypes = ["view", "click"];
      if (!validTypes.includes(interactionType)) {
        return res.status(400).json({
          error: "نوع التفاعل غير صحيح",
        });
      }

      await recommendationService.trackRecommendationInteraction(
        req.user.id,
        recommendationId,
        interactionType
      );

      res.json({
        message: "تم تسجيل تفاعل التوصية بنجاح",
        success: true,
      });
    } catch (error) {
      console.error("Error tracking recommendation interaction:", error);
      res.status(500).json({
        error: "حدث خطأ أثناء تسجيل تفاعل التوصية",
      });
    }
  }
);

// تقييم التوصية
router.post("/rate-recommendation", authMiddleware, async (req, res) => {
  try {
    const { recommendationId, rating } = req.body;

    if (!recommendationId || !rating) {
      return res.status(400).json({
        error: "يجب توفير معرف التوصية والتقييم",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "التقييم يجب أن يكون بين 1 و 5",
      });
    }

    await recommendationService.rateRecommendation(
      req.user.id,
      recommendationId,
      rating
    );

    res.json({
      message: "تم تقييم التوصية بنجاح",
      success: true,
    });
  } catch (error) {
    console.error("Error rating recommendation:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء تقييم التوصية",
    });
  }
});

// الحصول على أنماط قراءة المستخدم
router.get("/reading-patterns", authMiddleware, async (req, res) => {
  try {
    const db = require("../config/database");
    const [patterns] = await db.query(
      `SELECT pattern_type, pattern_data, confidence_level, last_updated
       FROM user_reading_patterns 
       WHERE user_id = ?
       ORDER BY last_updated DESC`,
      [req.user.id]
    );

    // تحويل البيانات من JSON
    const formattedPatterns = patterns.map((pattern) => ({
      type: pattern.pattern_type,
      data: JSON.parse(pattern.pattern_data),
      confidence: pattern.confidence_level,
      lastUpdated: pattern.last_updated,
    }));

    res.json({
      patterns: formattedPatterns,
      count: patterns.length,
      success: true,
    });
  } catch (error) {
    console.error("Error getting reading patterns:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب أنماط القراءة",
    });
  }
});

// الحصول على إحصائيات المستخدم
router.get("/user-stats", authMiddleware, async (req, res) => {
  try {
    const db = require("../config/database");

    // إحصائيات التفاعلات
    const [interactionStats] = await db.query(
      `SELECT 
         interaction_type,
         COUNT(*) as count,
         AVG(duration_seconds) as avg_duration,
         AVG(rating) as avg_rating
       FROM user_hadith_interactions 
       WHERE user_id = ?
       GROUP BY interaction_type`,
      [req.user.id]
    );

    // إحصائيات التوصيات
    const [recommendationStats] = await db.query(
      `SELECT 
         recommendation_type,
         COUNT(*) as total_recommendations,
         SUM(CASE WHEN is_viewed = 1 THEN 1 ELSE 0 END) as viewed,
         SUM(CASE WHEN is_clicked = 1 THEN 1 ELSE 0 END) as clicked,
         AVG(feedback_rating) as avg_rating
       FROM smart_recommendations 
       WHERE user_id = ?
       GROUP BY recommendation_type`,
      [req.user.id]
    );

    // إحصائيات عامة
    const [generalStats] = await db.query(
      `SELECT 
         COUNT(DISTINCT hadith_id) as unique_hadiths_read,
         COUNT(*) as total_interactions,
         MIN(created_at) as first_interaction,
         MAX(created_at) as last_interaction
       FROM user_hadith_interactions 
       WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({
      interactionStats,
      recommendationStats,
      generalStats: generalStats[0] || {},
      success: true,
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب الإحصائيات",
    });
  }
});

// تحديث أنماط القراءة يدوياً
router.post("/update-reading-patterns", authMiddleware, async (req, res) => {
  try {
    await recommendationService.updateUserReadingPatterns(req.user.id);

    res.json({
      message: "تم تحديث أنماط القراءة بنجاح",
      success: true,
    });
  } catch (error) {
    console.error("Error updating reading patterns:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء تحديث أنماط القراءة",
    });
  }
});

// حذف التوصيات القديمة
router.delete(
  "/clear-old-recommendations",
  authMiddleware,
  async (req, res) => {
    try {
      await recommendationService.clearOldRecommendations(req.user.id);

      res.json({
        message: "تم حذف التوصيات القديمة بنجاح",
        success: true,
      });
    } catch (error) {
      console.error("Error clearing old recommendations:", error);
      res.status(500).json({
        error: "حدث خطأ أثناء حذف التوصيات القديمة",
      });
    }
  }
);

// حذف توصية محددة
router.delete("/delete-recommendation", authMiddleware, async (req, res) => {
  try {
    const { recommendationId } = req.body;

    if (!recommendationId) {
      return res.status(400).json({
        error: "يجب توفير معرف التوصية",
      });
    }

    // التحقق من أن التوصية تخص المستخدم
    const [recommendation] = await db.query(
      "SELECT id FROM smart_recommendations WHERE id = ? AND user_id = ?",
      [recommendationId, req.user.id]
    );

    if (recommendation.length === 0) {
      return res.status(404).json({
        error: "التوصية غير موجودة أو لا تخصك",
      });
    }

    // حذف التوصية
    await db.query(
      "DELETE FROM smart_recommendations WHERE id = ? AND user_id = ?",
      [recommendationId, req.user.id]
    );

    res.json({
      message: "تم حذف التوصية بنجاح",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting recommendation:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء حذف التوصية",
    });
  }
});

// الحصول على عدد قراءات المستخدم
router.get("/read-count", authMiddleware, async (req, res) => {
  try {
    const [result] = await db.query(
      `SELECT COUNT(*) as readCount 
       FROM user_hadith_interactions 
       WHERE user_id = ? AND interaction_type IN ('view', 'read', 'bookmark', 'memorize')`,
      [req.user.id]
    );

    const minReads = 3; // الحد الأدنى للتوصيات

    res.json({
      readCount: result[0].readCount,
      minReads: minReads,
      needsMoreReads: result[0].readCount < minReads,
      remainingReads: Math.max(0, minReads - result[0].readCount),
      success: true,
    });
  } catch (error) {
    console.error("Error getting read count:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب عدد القراءات",
    });
  }
});

// الحصول على فئات الأحاديث
router.get("/categories", async (req, res) => {
  try {
    const categories = await recommendationService.getAllCategories();

    // تحويل Map إلى Array
    const categoriesArray = Array.from(categories.entries()).map(
      ([id, name]) => ({
        id,
        name,
      })
    );

    res.json({
      categories: categoriesArray,
      count: categoriesArray.length,
      success: true,
    });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب الفئات",
    });
  }
});

// الحصول على التوصيات مع فلترة حسب الفئة
router.get("/recommendations-by-category", authMiddleware, async (req, res) => {
  try {
    const { categoryId, limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    if (limitNum > 50) {
      return res.status(400).json({
        error: "الحد الأقصى للتوصيات هو 50",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        error: "يجب توفير معرف الفئة",
      });
    }

    // جلب جميع التوصيات للمستخدم
    const allRecommendations =
      await recommendationService.getUserRecommendations(req.user.id, 50);

    // فلترة حسب الفئة المطلوبة
    const recommendations = allRecommendations
      .filter((rec) => rec.categories && rec.categories.includes(categoryId))
      .slice(0, limitNum);

    res.json({
      recommendations: recommendations,
      count: recommendations.length,
      success: true,
    });
  } catch (error) {
    console.error("Error getting recommendations by category:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب التوصيات حسب الفئة",
    });
  }
});

// الحصول على إحصائيات الفئات المفضلة
router.get("/preferred-categories", authMiddleware, async (req, res) => {
  try {
    const [patterns] = await db.query(
      `SELECT pattern_data 
       FROM user_reading_patterns 
       WHERE user_id = ? AND pattern_type = 'preferred_categories'
       ORDER BY last_updated DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (patterns.length === 0) {
      return res.json({
        categories: [],
        count: 0,
        success: true,
      });
    }

    const categories = JSON.parse(patterns[0].pattern_data);

    // إضافة أسماء الفئات
    const categoriesWithNames = await Promise.all(
      categories.map(async (cat) => {
        const categoryName = await recommendationService.getCategoryName(
          cat.category_id
        );
        return {
          ...cat,
          category_name: categoryName,
        };
      })
    );

    res.json({
      categories: categoriesWithNames,
      count: categoriesWithNames.length,
      success: true,
    });
  } catch (error) {
    console.error("Error getting preferred categories:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء جلب الفئات المفضلة",
    });
  }
});
router.get("/diagnosis", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. عدد القراءات
    const [readCount] = await db.query(
      `SELECT COUNT(*) as count 
       FROM user_hadith_interactions 
       WHERE user_id = ? AND interaction_type IN ('view', 'read', 'bookmark', 'memorize')`,
      [userId]
    );

    // 2. آخر تفاعل
    const [lastInteraction] = await db.query(
      `SELECT created_at, interaction_type, hadith_id
       FROM user_hadith_interactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    // 3. التوصيات الموجودة
    const [existingRecs] = await db.query(
      `SELECT COUNT(*) as count, MAX(created_at) as last_created
       FROM smart_recommendations 
       WHERE user_id = ?`,
      [userId]
    );

    // 4. أنماط القراءة
    const [patterns] = await db.query(
      `SELECT pattern_type, last_updated
       FROM user_reading_patterns 
       WHERE user_id = ?`,
      [userId]
    );

    const diagnosis = {
      user_id: userId,
      read_count: readCount[0].count,
      min_required: 3,
      meets_requirement: readCount[0].count >= 3,
      last_interaction: lastInteraction[0] || null,
      existing_recommendations: {
        count: existingRecs[0].count,
        last_created: existingRecs[0].last_created,
      },
      reading_patterns: patterns,
      recommendations_needed:
        readCount[0].count >= 3 && existingRecs[0].count === 0,
      next_scheduled_update: "كل 6 ساعات",
      suggestions: [],
    };

    // إضافة اقتراحات
    if (readCount[0].count < 3) {
      diagnosis.suggestions.push(
        "اقرأ المزيد من الأحاديث (تحتاج " +
          (3 - readCount[0].count) +
          " حديث آخر)"
      );
    }

    if (readCount[0].count >= 3 && existingRecs[0].count === 0) {
      diagnosis.suggestions.push(
        "اضغط على 'توليد توصيات جديدة' لإنشاء توصيات فورية"
      );
    }

    if (patterns.length === 0) {
      diagnosis.suggestions.push(
        "النظام يحتاج لتحليل أنماط قراءتك - اقرأ المزيد من الأحاديث"
      );
    }

    res.json({
      diagnosis,
      success: true,
    });
  } catch (error) {
    console.error("Error in recommendation diagnosis:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء تشخيص التوصيات",
    });
  }
});
// endpoint سريع للتفاعل (بدون تحليل الأنماط)
router.post("/track-interaction-fast", authMiddleware, async (req, res) => {
  try {
    const { hadithId, interactionType, metadata = {} } = req.body;

    if (!hadithId || !interactionType) {
      return res.status(400).json({
        error: "يجب توفير معرف الحديث ونوع التفاعل",
      });
    }

    const validTypes = [
      "view",
      "read",
      "bookmark",
      "memorize",
      "share",
      "like",
      "analyze",
    ];
    if (!validTypes.includes(interactionType)) {
      return res.status(400).json({
        error: "نوع التفاعل غير صحيح",
      });
    }

    // حفظ التفاعل فقط (بدون تحليل الأنماط)
    const {
      duration_seconds = null,
      rating = null,
      notes = null,
      source_page = null,
      device_type = "desktop",
    } = metadata;

    await db.query(
      `INSERT INTO user_hadith_interactions 
       (user_id, hadith_id, interaction_type, duration_seconds, rating, notes, source_page, device_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        hadithId,
        interactionType,
        duration_seconds,
        rating,
        notes,
        source_page,
        device_type,
      ]
    );

    res.json({
      message: "تم تسجيل التفاعل بنجاح",
      success: true,
    });
  } catch (error) {
    console.error("Error tracking interaction:", error);
    res.status(500).json({
      error: "حدث خطأ أثناء تسجيل التفاعل",
    });
  }
});

module.exports = router;
