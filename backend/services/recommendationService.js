const db = require("../config/database");
const axios = require("axios");

class RecommendationService {
  constructor() {
    this.algorithmVersion = "v1.0";
    this.categoriesCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // جلب أسماء الفئات من API
  async getCategoryName(categoryId) {
    try {
      // التحقق من الكاش أولاً
      if (this.categoriesCache.has(categoryId)) {
        const cached = this.categoriesCache.get(categoryId);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.name;
        }
      }

      // جلب البيانات من API
      const response = await axios.get(
        "https://hadeethenc.com/api/v1/categories/list/?language=ar"
      );

      const categories = response.data;
      const category = categories.find(
        (cat) => cat.id === categoryId.toString()
      );

      if (category) {
        // حفظ في الكاش
        this.categoriesCache.set(categoryId, {
          name: category.title,
          timestamp: Date.now(),
        });
        return category.title;
      }

      return `فئة ${categoryId}`;
    } catch (error) {
      console.error("Error fetching category name:", error);
      return `فئة ${categoryId}`;
    }
  }

  // جلب جميع الفئات مع أسمائها
  async getAllCategories() {
    try {
      const response = await axios.get(
        "https://hadeethenc.com/api/v1/categories/list/?language=ar"
      );

      const categories = response.data;
      const categoryMap = new Map();

      categories.forEach((cat) => {
        categoryMap.set(cat.id, cat.title);
        this.categoriesCache.set(cat.id, {
          name: cat.title,
          timestamp: Date.now(),
        });
      });

      return categoryMap;
    } catch (error) {
      console.error("Error fetching all categories:", error);
      return new Map();
    }
  }

  async getHadithFromAPI(hadithId) {
    try {
      const response = await axios.get(
        `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${hadithId}`
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching hadith ${hadithId} from API:`, error);
      throw error;
    }
  }

  // دالة مساعدة لجلب بيانات التوصيات من API
  async getRecommendationsWithAPIData(recommendations) {
    try {
      const recommendationsWithData = await Promise.all(
        recommendations.map(async (rec) => {
          try {
            const response = await axios.get(
              `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${rec.hadith_id}`
            );

            const hadithData = response.data;

            // جلب أسماء الفئات
            let categoryNames = [];
            if (hadithData.categories && hadithData.categories.length > 0) {
              categoryNames = await Promise.all(
                hadithData.categories.map((catId) =>
                  this.getCategoryName(catId)
                )
              );
            }

            return {
              ...rec,
              hadeeth: hadithData.hadeeth,
              attribution: hadithData.attribution,
              source: hadithData.reference,
              grade_ar: hadithData.grade,
              categories: hadithData.categories,
              category_names: categoryNames,
              explanation: hadithData.explanation,
              hints: hadithData.hints,
              words_meanings: hadithData.words_meanings,
            };
          } catch (apiError) {
            console.error(
              `Error fetching hadith ${rec.hadith_id} from API:`,
              apiError
            );
            return {
              ...rec,
              hadeeth: "خطأ في جلب الحديث",
              attribution: "",
              source: "",
              grade_ar: "",
              categories: [],
              category_names: [],
            };
          }
        })
      );

      return recommendationsWithData;
    } catch (error) {
      console.error("Error getting recommendations with API data:", error);
      return [];
    }
  }

  // تسجيل تفاعل المستخدم مع الحديث
  async trackUserInteraction(userId, hadithId, interactionType, metadata = {}) {
    try {
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
          userId,
          hadithId,
          interactionType,
          duration_seconds,
          rating,
          notes,
          source_page,
          device_type,
        ]
      );

      // تحديث إحصائيات الحديث (غير متزامن - لا ينتظر)
      this.updateHadithStatistics(hadithId, interactionType).catch((error) =>
        console.error("Error updating hadith statistics:", error)
      );

      // تحديث أنماط المستخدم (فقط كل 5 تفاعلات لتوفير الأداء)
      this.updateUserReadingPatternsIfNeeded(userId).catch((error) =>
        console.error("Error updating user patterns:", error)
      );

      return true;
    } catch (error) {
      console.error("Error tracking user interaction:", error);
      throw error;
    }
  }

  // تحديث إحصائيات الحديث
  async updateHadithStatistics(hadithId, interactionType) {
    try {
      const statsMap = {
        view: "total_views",
        read: "total_reads",
        bookmark: "total_bookmarks",
        memorize: "total_memorizations",
      };

      const statField = statsMap[interactionType];
      if (!statField) return;

      // تحديث العداد
      await db.query(
        `INSERT INTO hadith_statistics (hadith_id, ${statField}) 
         VALUES (?, 1) 
         ON DUPLICATE KEY UPDATE ${statField} = ${statField} + 1`,
        [hadithId]
      );

      // حساب متوسط التقييم
      if (interactionType === "read") {
        await this.calculateAverageRating(hadithId);
      }

      // حساب درجة الشعبية
      await this.calculatePopularityScore(hadithId);
    } catch (error) {
      console.error("Error updating hadith statistics:", error);
    }
  }

  // حساب متوسط التقييم
  async calculateAverageRating(hadithId) {
    try {
      const [result] = await db.query(
        `SELECT AVG(rating) as avg_rating 
         FROM user_hadith_interactions 
         WHERE hadith_id = ? AND rating IS NOT NULL`,
        [hadithId]
      );

      const avgRating = result[0]?.avg_rating || 0;

      await db.query(
        `INSERT INTO hadith_statistics (hadith_id, average_rating) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE average_rating = ?`,
        [hadithId, avgRating, avgRating]
      );
    } catch (error) {
      console.error("Error calculating average rating:", error);
    }
  }

  // حساب درجة الشعبية
  async calculatePopularityScore(hadithId) {
    try {
      const [result] = await db.query(
        `SELECT 
           total_views,
           total_reads,
           total_bookmarks,
           total_memorizations,
           average_rating
         FROM hadith_statistics 
         WHERE hadith_id = ?`,
        [hadithId]
      );

      if (result.length === 0) return;

      const stats = result[0];
      const popularityScore =
        stats.total_views * 0.1 +
        stats.total_reads * 0.3 +
        stats.total_bookmarks * 0.4 +
        stats.total_memorizations * 0.5 +
        stats.average_rating * 2;

      await db.query(
        `UPDATE hadith_statistics 
         SET popularity_score = ? 
         WHERE hadith_id = ?`,
        [popularityScore, hadithId]
      );
    } catch (error) {
      console.error("Error calculating popularity score:", error);
    }
  }

  // تحديث أنماط قراءة المستخدم
  async updateUserReadingPatterns(userId) {
    try {
      // تحليل الفئات المفضلة
      await this.analyzePreferredCategories(userId);

      // تحليل أوقات القراءة
      await this.analyzeReadingTimes(userId);
    } catch (error) {
      console.error("Error updating user reading patterns:", error);
    }
  }

  // تحديث أنماط المستخدم فقط عند الحاجة (كل 5 تفاعلات)
  async updateUserReadingPatternsIfNeeded(userId) {
    try {
      // التحقق من آخر تحديث للأنماط
      const [lastUpdate] = await db.query(
        `SELECT MAX(last_updated) as last_update 
         FROM user_reading_patterns 
         WHERE user_id = ?`,
        [userId]
      );

      const lastUpdateTime = lastUpdate[0]?.last_update;
      const now = new Date();
      const timeDiff = lastUpdateTime
        ? (now - new Date(lastUpdateTime)) / (1000 * 60) // بالدقائق
        : Infinity;

      // تحديث الأنماط فقط كل 30 دقيقة أو إذا لم تكن موجودة
      if (timeDiff > 30 || !lastUpdateTime) {
        console.log(
          `Updating patterns for user ${userId} (last update: ${timeDiff.toFixed(
            1
          )} minutes ago)`
        );
        await this.updateUserReadingPatterns(userId);
      } else {
        console.log(
          `Skipping pattern update for user ${userId} (last update: ${timeDiff.toFixed(
            1
          )} minutes ago)`
        );
      }
    } catch (error) {
      console.error("Error checking if patterns need update:", error);
    }
  }

  // تحليل الفئات المفضلة
  async analyzePreferredCategories(userId) {
    try {
      // جلب تفاعلات المستخدم مع الأحاديث (تقليل العدد لتحسين الأداء)
      const [interactions] = await db.query(
        `SELECT hadith_id, COUNT(*) as frequency
         FROM user_hadith_interactions 
         WHERE user_id = ? AND interaction_type IN ('view','read', 'bookmark', 'memorize')
         GROUP BY hadith_id
         ORDER BY frequency DESC
         LIMIT 10`,
        [userId]
      );

      if (interactions.length === 0) return;

      // جلب بيانات الأحاديث من API وتحليل الفئات
      const categoryFrequency = new Map();

      // معالجة API calls بشكل متوازي لتحسين الأداء
      const apiPromises = interactions.map(async (interaction) => {
        try {
          const response = await axios.get(
            `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${interaction.hadith_id}`,
            { timeout: 5000 } // timeout 5 ثواني
          );

          const hadithData = response.data;
          if (hadithData.categories && hadithData.categories.length > 0) {
            return {
              categories: hadithData.categories,
              frequency: interaction.frequency,
            };
          }
          return null;
        } catch (apiError) {
          // تجاهل الأخطاء بصمت لتوفير الأداء
          if (apiError.response && apiError.response.status === 404) {
            console.log(
              `Hadith ${interaction.hadith_id} not found in API, skipping...`
            );
          }
          return null;
        }
      });

      // انتظار جميع API calls
      const results = await Promise.all(apiPromises);

      // معالجة النتائج
      results.forEach((result) => {
        if (result && result.categories) {
          result.categories.forEach((categoryId) => {
            const currentFreq = categoryFrequency.get(categoryId) || 0;
            categoryFrequency.set(categoryId, currentFreq + result.frequency);
          });
        }
      });

      // تحويل النتائج إلى مصفوفة وترتيبها
      const categoriesArray = Array.from(categoryFrequency.entries())
        .map(([categoryId, frequency]) => ({
          category_id: categoryId,
          frequency,
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      // جلب أسماء الفئات
      const categoriesWithNames = await Promise.all(
        categoriesArray.map(async (cat) => {
          const categoryName = await this.getCategoryName(cat.category_id);
          return {
            category_id: cat.category_id,
            category_name: categoryName,
            frequency: cat.frequency,
          };
        })
      );

      await db.query(
        `INSERT INTO user_reading_patterns (user_id, pattern_type, pattern_data, confidence_level)
         VALUES (?, 'preferred_categories', ?, 0.8)
         ON DUPLICATE KEY UPDATE 
         pattern_data = VALUES(pattern_data),
         confidence_level = VALUES(confidence_level),
         last_updated = CURRENT_TIMESTAMP`,
        [userId, JSON.stringify(categoriesWithNames)]
      );
    } catch (error) {
      console.error("Error analyzing preferred categories:", error);
    }
  }

  // تحليل أوقات القراءة
  async analyzeReadingTimes(userId) {
    try {
      const [times] = await db.query(
        `SELECT 
           HOUR(created_at) as hour,
           COUNT(*) as frequency
         FROM user_hadith_interactions 
         WHERE user_id = ? AND interaction_type IN ('view', 'read', 'bookmark', 'memorize')
         GROUP BY HOUR(created_at)
         ORDER BY frequency DESC`,
        [userId]
      );

      const readingTimes = times.map((row) => ({
        hour: row.hour,
        frequency: row.frequency,
      }));

      await db.query(
        `INSERT INTO user_reading_patterns (user_id, pattern_type, pattern_data, confidence_level)
         VALUES (?, 'reading_time', ?, 0.7)
         ON DUPLICATE KEY UPDATE 
         pattern_data = VALUES(pattern_data),
         confidence_level = VALUES(confidence_level),
         last_updated = CURRENT_TIMESTAMP`,
        [userId, JSON.stringify(readingTimes)]
      );
    } catch (error) {
      console.error("Error analyzing reading times:", error);
    }
  }

  // توليد التوصيات الذكية
  async generateSmartRecommendations(userId, limit = 10) {
    try {
      // حذف التوصيات القديمة
      await this.clearOldRecommendations(userId);

      // التحقق من الحد الأدنى لقراءات الأحاديث
      const [readCount] = await db.query(
        `SELECT COUNT(*) as count 
         FROM user_hadith_interactions 
         WHERE user_id = ? AND interaction_type = 'read'`,
        [userId]
      );

      const minReads = 3; // الحد الأدنى: 3 أحاديث
      if (readCount[0].count < minReads) {
        console.log(
          `User ${userId} needs to read at least ${minReads} hadiths before getting recommendations. Current: ${readCount[0].count}`
        );
        return [];
      }

      const recommendations = [];
      const usedHadithIds = new Set(); // لتجنب تكرار الأحاديث

      // 1. توصيات بناءً على المحتوى المشابه
      const similarContentRecs = await this.getSimilarContentRecommendations(
        userId,
        Math.ceil(limit * 0.4)
      );

      // فلترة الأحاديث المكررة
      const filteredSimilarRecs = similarContentRecs.filter((rec) => {
        if (usedHadithIds.has(rec.id)) {
          return false;
        }
        usedHadithIds.add(rec.id);
        return true;
      });
      recommendations.push(...filteredSimilarRecs);

      // 2. توصيات بناءً على الشعبية
      const trendingRecs = await this.getTrendingRecommendations(
        userId,
        Math.ceil(limit * 0.3)
      );

      // فلترة الأحاديث المكررة
      const filteredTrendingRecs = trendingRecs.filter((rec) => {
        if (usedHadithIds.has(rec.id)) {
          return false;
        }
        usedHadithIds.add(rec.id);
        return true;
      });
      recommendations.push(...filteredTrendingRecs);

      // 3. توصيات مخصصة بناءً على الأنماط
      const personalizedRecs = await this.getPersonalizedRecommendations(
        userId,
        Math.ceil(limit * 0.3)
      );

      // فلترة الأحاديث المكررة
      const filteredPersonalizedRecs = personalizedRecs.filter((rec) => {
        if (usedHadithIds.has(rec.id)) {
          return false;
        }
        usedHadithIds.add(rec.id);
        return true;
      });
      recommendations.push(...filteredPersonalizedRecs);

      // حفظ التوصيات في قاعدة البيانات
      for (const rec of recommendations) {
        await this.saveRecommendation(userId, rec);
      }

      return recommendations;
    } catch (error) {
      console.error("Error generating smart recommendations:", error);
      throw error;
    }
  }

  // التوصيات بناءً على المحتوى المشابه
  async getSimilarContentRecommendations(userId, limit) {
    try {
      const [userCategories] = await db.query(
        `SELECT pattern_data 
         FROM user_reading_patterns 
         WHERE user_id = ? AND pattern_type = 'preferred_categories'`,
        [userId]
      );

      if (userCategories.length === 0) return [];

      let categories;
      try {
        categories = JSON.parse(userCategories[0].pattern_data);
      } catch (parseError) {
        console.error("Error parsing categories pattern data:", parseError);
        return [];
      }
      const topCategories = categories.slice(0, 3).map((c) => c.category_id);

      if (topCategories.length === 0) return [];

      // جلب أحاديث عشوائية من قاعدة البيانات
      const [hadithIds] = await db.query(
        `SELECT h.id
         FROM hadiths h
         JOIN hadith_statistics hs ON h.id = hs.hadith_id
         WHERE h.id NOT IN (
           SELECT DISTINCT hadith_id 
           FROM user_hadith_interactions 
           WHERE user_id = ? AND interaction_type IN ('read', 'bookmark')
         )
         ORDER BY hs.popularity_score DESC
         LIMIT ?`,
        [userId, limit * 3] // جلب أكثر من المطلوب للفلترة
      );

      if (hadithIds.length === 0) return [];

      // جلب بيانات الأحاديث من API مع categories
      const recommendations = [];
      for (const hadithRow of hadithIds) {
        try {
          const response = await axios.get(
            `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${hadithRow.id}`
          );

          const hadithData = response.data;

          // التحقق من أن الحديث يحتوي على الفئات المفضلة
          if (
            hadithData.categories &&
            hadithData.categories.some((catId) =>
              topCategories.includes(catId.toString())
            )
          ) {
            recommendations.push({
              id: hadithData.id,
              hadeeth: hadithData.hadeeth,
              attribution: hadithData.attribution,
              source: hadithData.reference,
              grade_ar: hadithData.grade,
              categories: hadithData.categories,
              recommendation_type: "similar_content",
              confidence_score: 0.8,
              reason: "بناءً على اهتماماتك السابقة",
            });

            if (recommendations.length >= limit) break;
          }
        } catch (apiError) {
          console.error(
            `Error fetching hadith ${hadithRow.id} from API:`,
            apiError
          );
          continue;
        }
      }

      return recommendations;
    } catch (error) {
      console.error("Error getting similar content recommendations:", error);
      return [];
    }
  }

  // التوصيات الشائعة
  async getTrendingRecommendations(userId, limit) {
    try {
      // جلب أحاديث شائعة من قاعدة البيانات
      const [hadithIds] = await db.query(
        `SELECT h.id, hs.popularity_score
         FROM hadiths h
         JOIN hadith_statistics hs ON h.id = hs.hadith_id
         WHERE h.id NOT IN (
           SELECT DISTINCT hadith_id 
           FROM user_hadith_interactions 
           WHERE user_id = ? AND interaction_type IN ('read', 'bookmark')
         )
         ORDER BY hs.popularity_score DESC
         LIMIT ?`,
        [userId, limit]
      );

      if (hadithIds.length === 0) return [];

      // جلب بيانات الأحاديث من API
      const recommendations = [];
      for (const hadithRow of hadithIds) {
        try {
          const response = await axios.get(
            `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${hadithRow.id}`
          );

          const hadithData = response.data;

          recommendations.push({
            id: hadithData.id,
            hadeeth: hadithData.hadeeth,
            attribution: hadithData.attribution,
            source: hadithData.reference,
            grade_ar: hadithData.grade,
            categories: hadithData.categories,
            popularity_score: hadithRow.popularity_score,
            recommendation_type: "trending",
            confidence_score: 0.7,
            reason: "الأحاديث الأكثر شعبية",
          });
        } catch (apiError) {
          console.error(
            `Error fetching hadith ${hadithRow.id} from API:`,
            apiError
          );
          continue;
        }
      }

      return recommendations;
    } catch (error) {
      console.error("Error getting trending recommendations:", error);
      return [];
    }
  }

  // التوصيات المخصصة
  async getPersonalizedRecommendations(userId, limit) {
    try {
      // الحصول على أنماط المستخدم
      const [patterns] = await db.query(
        `SELECT pattern_type, pattern_data, confidence_level
         FROM user_reading_patterns 
         WHERE user_id = ?`,
        [userId]
      );

      if (patterns.length === 0) return [];

      const userPatterns = {};
      patterns.forEach((pattern) => {
        try {
          userPatterns[pattern.pattern_type] = {
            data: JSON.parse(pattern.pattern_data),
            confidence: pattern.confidence_level,
          };
        } catch (parseError) {
          console.error(
            `Error parsing pattern data for ${pattern.pattern_type}:`,
            parseError
          );
          // تجاهل الأنماط التي تحتوي على JSON غير صالح
          userPatterns[pattern.pattern_type] = {
            data: [],
            confidence: 0,
          };
        }
      });

      // جلب أحاديث عشوائية من قاعدة البيانات
      const [hadithIds] = await db.query(
        `SELECT h.id, hs.popularity_score
         FROM hadiths h
         JOIN hadith_statistics hs ON h.id = hs.hadith_id
         WHERE h.id NOT IN (
           SELECT DISTINCT hadith_id 
           FROM user_hadith_interactions 
           WHERE user_id = ? AND interaction_type IN ('read', 'bookmark')
         )
         ORDER BY hs.popularity_score DESC
         LIMIT ?`,
        [userId, limit * 2] // جلب أكثر من المطلوب للفلترة
      );

      if (hadithIds.length === 0) return [];

      // جلب بيانات الأحاديث من API والفلترة حسب الأنماط
      const recommendations = [];
      const preferredCategories =
        userPatterns.preferred_categories?.data?.map((c) => c.category_id) ||
        [];

      for (const hadithRow of hadithIds) {
        try {
          const response = await axios.get(
            `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${hadithRow.id}`
          );

          const hadithData = response.data;

          // التحقق من أن الحديث يحتوي على الفئات المفضلة (إذا كانت متوفرة)
          let shouldInclude = true;
          if (preferredCategories.length > 0 && hadithData.categories) {
            shouldInclude = hadithData.categories.some((catId) =>
              preferredCategories.includes(catId.toString())
            );
          }

          if (shouldInclude) {
            recommendations.push({
              id: hadithData.id,
              hadeeth: hadithData.hadeeth,
              attribution: hadithData.attribution,
              source: hadithData.reference,
              grade_ar: hadithData.grade,
              categories: hadithData.categories,
              popularity_score: hadithRow.popularity_score,
              recommendation_type: "personalized",
              confidence_score: 0.9,
              reason: "مخصص لك بناءً على أنماط قراءتك",
            });

            if (recommendations.length >= limit) break;
          }
        } catch (apiError) {
          console.error(
            `Error fetching hadith ${hadithRow.id} from API:`,
            apiError
          );
          continue;
        }
      }

      return recommendations;
    } catch (error) {
      console.error("Error getting personalized recommendations:", error);
      return [];
    }
  }

  // حفظ التوصية
  async saveRecommendation(userId, recommendation) {
    try {
      await db.query(
        `INSERT INTO smart_recommendations 
         (user_id, hadith_id, recommendation_type, confidence_score, reason, algorithm_version, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [
          userId,
          recommendation.id,
          recommendation.recommendation_type,
          recommendation.confidence_score,
          recommendation.reason,
          this.algorithmVersion,
        ]
      );
    } catch (error) {
      console.error("Error saving recommendation:", error);
    }
  }

  // حذف التوصيات القديمة
  async clearOldRecommendations(userId) {
    try {
      await db.query(
        `DELETE FROM smart_recommendations 
         WHERE user_id = ? AND (expires_at < NOW() OR created_at < DATE_SUB(NOW(), INTERVAL 7 DAY))`,
        [userId]
      );
    } catch (error) {
      console.error("Error clearing old recommendations:", error);
    }
  }

  // الحصول على التوصيات للمستخدم
  async getUserRecommendations(userId, limit = 10) {
    try {
      const [recommendations] = await db.query(
        `SELECT sr.*, h.id as hadith_id
         FROM smart_recommendations sr
         JOIN hadiths h ON sr.hadith_id = h.id
         WHERE sr.user_id = ? AND sr.expires_at > NOW()
         ORDER BY sr.confidence_score DESC, sr.created_at DESC
         LIMIT ?`,
        [userId, limit]
      );

      // إذا لم تكن هناك توصيات موجودة، قم بتوليد توصيات جديدة
      if (recommendations.length === 0) {
        console.log(
          `No existing recommendations for user ${userId}, generating new ones...`
        );
        const newRecommendations = await this.generateSmartRecommendations(
          userId,
          limit
        );

        // إذا تم توليد توصيات جديدة، قم بجلبها من قاعدة البيانات
        if (newRecommendations.length > 0) {
          const [newRecs] = await db.query(
            `SELECT sr.*, h.id as hadith_id
             FROM smart_recommendations sr
             JOIN hadiths h ON sr.hadith_id = h.id
             WHERE sr.user_id = ? AND sr.expires_at > NOW()
             ORDER BY sr.confidence_score DESC, sr.created_at DESC
             LIMIT ?`,
            [userId, limit]
          );

          if (newRecs.length > 0) {
            return await this.getRecommendationsWithAPIData(newRecs);
          }
        }

        return [];
      }

      // فلترة التوصيات المكررة بناءً على hadith_id
      const uniqueRecommendations = [];
      const usedHadithIds = new Set();

      for (const rec of recommendations) {
        if (!usedHadithIds.has(rec.hadith_id)) {
          usedHadithIds.add(rec.hadith_id);
          uniqueRecommendations.push(rec);
        }
      }

      // جلب بيانات الأحاديث من API
      return await this.getRecommendationsWithAPIData(uniqueRecommendations);
    } catch (error) {
      console.error("Error getting user recommendations:", error);
      throw error;
    }
  }

  // تسجيل تفاعل المستخدم مع التوصية
  async trackRecommendationInteraction(
    userId,
    recommendationId,
    interactionType
  ) {
    try {
      if (interactionType === "view") {
        await db.query(
          `UPDATE smart_recommendations 
           SET is_viewed = TRUE 
           WHERE id = ? AND user_id = ?`,
          [recommendationId, userId]
        );
      } else if (interactionType === "click") {
        await db.query(
          `UPDATE smart_recommendations 
           SET is_clicked = TRUE 
           WHERE id = ? AND user_id = ?`,
          [recommendationId, userId]
        );
      }
    } catch (error) {
      console.error("Error tracking recommendation interaction:", error);
    }
  }

  // تسجيل تقييم التوصية
  async rateRecommendation(userId, recommendationId, rating) {
    try {
      await db.query(
        `UPDATE smart_recommendations 
         SET feedback_rating = ? 
         WHERE id = ? AND user_id = ?`,
        [rating, recommendationId, userId]
      );
    } catch (error) {
      console.error("Error rating recommendation:", error);
    }
  }

  // تحديث التوصيات التلقائي (يتم استدعاؤها بواسطة scheduler)
  async updateRecommendationsForAllUsers() {
    try {
      const [users] = await db.query(
        `SELECT DISTINCT user_id FROM user_hadith_interactions 
         WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)`
      );

      for (const user of users) {
        await this.generateSmartRecommendations(user.user_id, 15);
      }

      console.log(`Updated recommendations for ${users.length} users`);
    } catch (error) {
      console.error("Error updating recommendations for all users:", error);
    }
  }
}

module.exports = new RecommendationService();
