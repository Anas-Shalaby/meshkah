const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const db = require("../config/database");
const shortid = require("shortid");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/uploads/backgrounds");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `bg-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
}).fields([
  { name: "background_image", maxCount: 1 },
  { name: "backgroundImage", maxCount: 1 },
]);

// Get user's profile card with hadiths
router.get("/dawah-cards", authMiddleware, async (req, res) => {
  try {
    const [cards] = await db.query(
      `SELECT 
        dc.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', ch.id,
            'text', ch.custom_hadith,
            'notes', ch.notes
          )
        ) as hadiths
      FROM dawah_cards dc
      LEFT JOIN card_hadiths ch ON dc.id = ch.card_id
      WHERE dc.user_id = ?
      GROUP BY dc.id`,
      [req.user.id]
    );

    cards.forEach((card) => {
      if (card.hadiths[0].id === null) {
        card.hadiths = [];
      }
    });

    res.json(cards);
  } catch (error) {
    console.error("Error fetching dawah cards:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب البطاقات" });
  }
});

// In the POST /dawah-cards route, update the card creation:
router.post("/dawah-cards", authMiddleware, upload, async (req, res) => {
  try {
    const {
      title,
      description,
      tags,
      is_public = true,
      category = "general",
      background_color,
    } = req.body;
    const userId = req.user.id;
    const shareLink = shortid.generate();

    const backgroundFile =
      req.files?.background_image?.[0] || req.files?.backgroundImage?.[0];
    const backgroundUrl = backgroundFile
      ? `/uploads/backgrounds/${backgroundFile.filename}`
      : null;

    let hadiths = req.body.hadiths;
    if (typeof hadiths === "string") {
      hadiths = JSON.parse(hadiths);
    }

    if (!Array.isArray(hadiths)) {
      return res.status(400).json({ message: "يجب إضافة حديث واحد على الأقل" });
    }
    if (!title || !description) {
      return res.status(400).json({ message: "يجب إضافة عنوان ووصف للبطاقة" });
    }

    const isPublicInt = is_public === "true" || is_public === true ? 1 : 0;
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Create dawah card with new fields
      const [cardResult] = await connection.query(
        `INSERT INTO dawah_cards (user_id, title, description, share_link, is_public, tags, background_url, category, background_color) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          title,
          description,
          shareLink,
          isPublicInt,
          JSON.stringify(tags || []),
          backgroundUrl,
          category,
          background_color || null,
        ]
      );
      const cardId = cardResult.insertId;

      const [card] = await connection.query(
        "SELECT title, description, created_at FROM dawah_cards WHERE id = ?",
        [cardId]
      );

      // Insert hadiths
      for (const hadith of hadiths) {
        await connection.query(
          `INSERT INTO card_hadiths (card_id, custom_hadith, hadith_id, notes, grade, attribution, external_link) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            cardId,
            hadith.text,
            hadith.hadith_id || "",
            hadith.notes || "",
            hadith.grade || "",
            hadith.attribution || "",
            hadith.external_link || "",
          ]
        );
      }

      await connection.commit();
      res.status(201).json({
        message: "تم إنشاء البطاقة بنجاح",
        cardId: cardId,
        shareLink: shareLink,
        title: card[0].title,
        description: card[0].description,
        created_at: card[0].created_at,
        category: category,
        metadata: {
          total_hadiths: hadiths.length,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error creating dawah card:", error);
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء البطاقة", error });
  }
});

// إضافة route جديد لجلب الفئات
router.get("/card-categories", async (req, res) => {
  try {
    const [categories] = await db.query(
      "SELECT * FROM card_categories ORDER BY name"
    );
    res.json(categories);
  } catch (error) {
    console.error("Error fetching card categories:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب الفئات" });
  }
});

// تحديث route جلب البطاقات العامة لدعم الفئات
router.get("/cards/public", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || "";
    const tag = req.query.tag || "";
    const category = req.query.category || "";
    const offset = (page - 1) * limit;

    let whereConditions = ["dc.is_public = 1"];
    let queryParams = [];

    if (search.trim()) {
      whereConditions.push("(dc.title LIKE ? OR dc.description LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (tag.trim()) {
      whereConditions.push("JSON_CONTAINS(dc.tags, ?)");
      queryParams.push(JSON.stringify(tag));
    }

    if (category.trim()) {
      whereConditions.push("dc.category = ?");
      queryParams.push(category);
    }

    const whereClause = whereConditions.join(" AND ");

    const [[{ totalCount }]] = await db.query(
      `SELECT COUNT(DISTINCT dc.id) as totalCount 
       FROM dawah_cards dc 
       WHERE ${whereClause}`,
      queryParams
    );

    const [cards] = await db.query(
      `SELECT 
        dc.id,
        dc.title,
        dc.description,
        dc.created_at,
        dc.share_link,
        dc.tags,
        dc.is_public,
        dc.background_url,
        dc.category,
        dc.background_color,
        u.id as creator_id,
        u.username as creator_username,
        u.avatar_url as creator_avatar_url,
        COUNT(DISTINCT ch.id) as total_hadiths,
        COUNT(DISTINCT CASE WHEN ci.interaction_type = 'view' THEN ci.id END) as views,
        COUNT(DISTINCT CASE WHEN ci.interaction_type = 'like' THEN ci.id END) as likes,
        CEIL(SUM(LENGTH(ch.custom_hadith) - LENGTH(REPLACE(ch.custom_hadith, ' ', '')) + 1) / 200) as reading_time
      FROM dawah_cards dc
      JOIN users u ON dc.user_id = u.id
      LEFT JOIN card_hadiths ch ON dc.id = ch.card_id
      LEFT JOIN card_interactions ci ON dc.id = ci.card_id
      WHERE ${whereClause}
      GROUP BY dc.id
      ORDER BY dc.created_at DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const formattedCards = cards.map((card) => {
      let parsedTags = [];
      try {
        parsedTags = JSON.parse(card.tags || "[]");
      } catch (err) {
        parsedTags = Array.isArray(card.tags) ? card.tags : [];
      }

      return {
        ...card,
        tags: parsedTags,
        creator: {
          id: card.creator_id,
          username: card.creator_username,
          avatar_url: card.creator_avatar_url,
        },
      };
    });

    res.json({
      cards: formattedCards,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      perPage: limit,
    });
  } catch (error) {
    console.error("Error fetching public cards:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب البطاقات" });
  }
});

router.patch(
  "/cards/:id/background",
  authMiddleware,
  upload,
  async (req, res) => {
    try {
      const cardId = req.params.id;

      // Check if card exists and belongs to user
      const [card] = await db.query(
        "SELECT * FROM dawah_cards WHERE id = ? AND user_id = ?",
        [cardId, req.user.id]
      );

      if (card.length === 0) {
        return res.status(404).json({ message: "البطاقة غير موجودة" });
      }

      // Delete old background if it exists
      if (card[0].background_url) {
        const oldPath = path.join(
          __dirname,
          "../public",
          card[0].background_url
        );
        fs.unlink(oldPath, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error("Error deleting old background:", err);
          }
        });
      }

      // Update with new background
      const backgroundUrl = req.file
        ? `/uploads/backgrounds/${req.file.filename}`
        : null;
      await db.query("UPDATE dawah_cards SET background_url = ? WHERE id = ?", [
        backgroundUrl,
        cardId,
      ]);

      res.json({
        message: "تم تحديث خلفية البطاقة بنجاح",
        background_url: backgroundUrl,
      });
    } catch (error) {
      console.error("Error updating card background:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث خلفية البطاقة" });
    }
  }
);
// Add new route to toggle card visibility
router.patch(
  "/dawah-cards/:id/visibility",
  authMiddleware,
  async (req, res) => {
    try {
      const { is_public } = req.body;
      const cardId = req.params.id;

      await db.query(
        "UPDATE dawah_cards SET is_public = ? WHERE id = ? AND user_id = ?",
        [is_public, cardId, req.user.id]
      );

      res.json({
        message: is_public ? "تم جعل البطاقة عامة" : "تم جعل البطاقة خاصة",
      });
    } catch (error) {
      console.error("Error updating card visibility:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث حالة البطاقة" });
    }
  }
);

// Get specific dawah card
router.get("/dawah-cards/:id", authMiddleware, async (req, res) => {
  try {
    const [cards] = await db.query(
      `SELECT 
        dc.*,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', ch.id,
            'text', ch.custom_hadith,
            'notes', ch.notes
          )
        ) as hadiths
      FROM dawah_cards dc
      LEFT JOIN card_hadiths ch ON dc.id = ch.card_id
      WHERE dc.id = ? AND dc.user_id = ?
      GROUP BY dc.id`,
      [req.params.id, req.user.id]
    );

    if (cards.length === 0) {
      return res.status(404).json({ message: "البطاقة غير موجودة" });
    }

    res.json(cards[0]);
  } catch (error) {
    console.error("Error fetching dawah card:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب البطاقة" });
  }
});

// edit specific card
router.put("/dawah-cards/:id", authMiddleware, upload, async (req, res) => {
  try {
    const { title, description, is_public, tags } = req.body;
    const cardId = req.params.id;
    const backgroundUrl = req.file
      ? `/uploads/backgrounds/${req.file.filename}`
      : undefined;
    // Check if card exists and belongs to user
    const [existingCard] = await db.query(
      "SELECT * FROM dawah_cards WHERE id = ? AND user_id = ?",
      [cardId, req.user.id]
    );

    if (existingCard.length === 0) {
      return res.status(404).json({ message: "البطاقة غير موجودة" });
    }
    // Delete old background if uploading new one
    if (backgroundUrl && existingCard[0].background_url) {
      const oldPath = path.join(
        __dirname,
        "../public",
        existingCard[0].background_url
      );
      fs.unlink(oldPath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Error deleting old background:", err);
        }
      });
    }

    const updateQuery = backgroundUrl
      ? `UPDATE dawah_cards 
         SET title = ?, description = ?, is_public = ?, tags = ?, background_url = ?
         WHERE id = ? AND user_id = ?`
      : `UPDATE dawah_cards 
         SET title = ?, description = ?, is_public = ?, tags = ?
         WHERE id = ? AND user_id = ?`;

    const updateParams = backgroundUrl
      ? [
          title,
          description,
          is_public,
          JSON.stringify(tags || []),
          backgroundUrl,
          cardId,
          req.user.id,
        ]
      : [
          title,
          description,
          is_public,
          JSON.stringify(tags || []),
          cardId,
          req.user.id,
        ];

    await db.query(updateQuery, updateParams);

    // Fetch updated card
    const [updatedCard] = await db.query(
      `SELECT * FROM dawah_cards WHERE id = ?`,
      [cardId]
    );

    res.json({
      message: "تم تحديث البطاقة بنجاح",
      card: updatedCard[0],
    });
  } catch (error) {
    console.error("Error updating dawah card:", error);
    res.status(500).json({ message: "حدث خطأ أثناء تحديث البطاقة" });
  }
});

router.post("/cards/:id/track/:type", authMiddleware, async (req, res) => {
  try {
    const { id, type } = req.params;
    const userIp = req.ip;
    const userId = req.user?.id;

    if (!["view", "share", "like"].includes(type)) {
      return res.status(400).json({ message: "Invalid interaction type" });
    }

    if (type === "like" && !userId) {
      return res.status(401).json({ message: "يجب عليك تسجيل الدخول اولا" });
    }

    // Modified check for likes
    if (type === "like") {
      const [existing] = await db.query(
        `SELECT id FROM card_interactions 
         WHERE card_id = ? AND interaction_type = ? AND user_id = ?`,
        [id, type, userId]
      );

      if (existing.length === 0) {
        await db.query(
          `INSERT INTO card_interactions (card_id, interaction_type, user_ip, user_id) 
           VALUES (?, ?, ?, ?)`,
          [id, type, userIp, userId]
        );
        // NEW: Store notification in DB and send with id
        const [[card]] = await db.query(
          "SELECT user_id, share_link FROM dawah_cards WHERE id = ?",
          [id]
        );
        if (card && card.user_id && card.user_id !== userId) {
          const [notifResult] = await db.query(
            `INSERT INTO notifications (user_id, sender_id, card_id, type, message, is_read, created_at)
             VALUES (?, ?, ?, ?, ?, 0, NOW())`,
            [
              card.user_id,
              userId,
              id,
              "like",
              `${req.user.username} عمل لايك على بطاقتك الدعوية`,
            ]
          );
          const notificationId = notifResult.insertId;
          const io = req.app.get("io");
          const roomName = "user_" + String(card.user_id);
          io.to(roomName).emit("notification", {
            id: notificationId,
            type: "like",
            cardId: id,
            shareLink: card.share_link,
            fromUser: { id: userId, name: req.user.username },
            message: `${req.user.username} عمل لايك على بطاقتك الدعوية`,
            created_at: new Date(),
            is_read: false,
          });
        }
      }
    } else {
      // Keep 24h check for other interaction types
      const [existing] = await db.query(
        `SELECT id FROM card_interactions 
         WHERE card_id = ? AND interaction_type = ? 
         AND user_id = ?
         AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
        [id, type, userId]
      );

      if (existing.length === 0) {
        await db.query(
          `INSERT INTO card_interactions (card_id, interaction_type, user_ip, user_id) 
           VALUES (?, ?, ?, ?)`,
          [id, type, userIp, userId]
        );
        // NEW: Send notification to card owner
      }
    }

    res.status(200).json({ message: "تمت العملية بنجاح" });
  } catch (error) {
    console.error("Error tracking interaction:", error);
    res.status(500).json({ message: "Error tracking interaction" });
  }
});

router.patch("/dawah-cards/:id/tags", authMiddleware, async (req, res) => {
  try {
    const { tags } = req.body;
    const cardId = req.params.id;

    // Update tags as JSON array
    await db.query(
      "UPDATE dawah_cards SET tags = ? WHERE id = ? AND user_id = ?",
      [JSON.stringify(tags), cardId, req.user.id]
    );

    res.json({ message: "تم تحديث التصنيفات بنجاح" });
  } catch (error) {
    console.error("Error updating tags:", error);
    res.status(500).json({ message: "حدث خطأ أثناء تحديث التصنيفات" });
  }
});

// Add new analytics endpoint
router.get("/cards/:id/analytics", async (req, res) => {
  try {
    const [analytics] = await db.query(
      `SELECT 
        DATE(created_at) as date,
        interaction_type,
        COUNT(*) as count
      FROM card_interactions 
      WHERE card_id = ?
      GROUP BY DATE(created_at), interaction_type
      ORDER BY date DESC
      LIMIT 30`,
      [req.params.id]
    );

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: "Error fetching analytics" });
  }
});
// Add collection management
router.post("/collections", authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await db.query(
      "INSERT INTO card_collections (user_id, name, description) VALUES (?, ?, ?)",
      [req.user.id, name, description]
    );
    res.status(201).json({ id: result.insertId, name, description });
  } catch (error) {
    res.status(500).json({ message: "Error creating collection" });
  }
});

// Get featured/trending cards
router.get("/cards/featured", async (req, res) => {
  try {
    const [cards] = await db.query(
      `SELECT dc.*, 
        COUNT(ci.id) as interaction_count
      FROM dawah_cards dc
      LEFT JOIN card_interactions ci ON dc.id = ci.card_id
      WHERE dc.is_public = 1
      GROUP BY dc.id
      ORDER BY interaction_count DESC
      LIMIT 10`
    );
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: "Error fetching featured cards" });
  }
});

// Add comment functionality
router.post("/cards/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    await db.query(
      "INSERT INTO card_comments (card_id, user_id, content) VALUES (?, ?, ?)",
      [req.params.id, req.user.id, content]
    );
    // NEW: إشعار لصاحب البطاقة
    const [[card]] = await db.query(
      "SELECT user_id, share_link FROM dawah_cards WHERE id = ?",
      [req.params.id]
    );
    if (card && card.user_id && card.user_id !== req.user.id) {
      const [notifResult] = await db.query(
        `INSERT INTO notifications (user_id, sender_id, card_id, type, message, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, 0, NOW())`,
        [
          card.user_id,
          req.user.id,
          req.params.id,
          "comment",
          `${req.user.username} علق على بطاقتك الدعوية`,
        ]
      );
      const notificationId = notifResult.insertId;
      const io = req.app.get("io");
      const roomName = "user_" + String(card.user_id);
      io.to(roomName).emit("notification", {
        id: notificationId,
        type: "comment",
        cardId: req.params.id,
        shareLink: card.share_link,
        fromUser: { id: req.user.id, name: req.user.username },
        message: `${req.user.username} علق على بطاقتك الدعوية`,
        created_at: new Date(),
        is_read: false,
      });
    }
    res.status(201).json({ message: "Comment added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error adding comment" });
  }
});

router.get("/cards/:id/comments", authMiddleware, async (req, res) => {
  try {
    const [comments] = await db.query(
      `
      SELECT 
        cc.*,
        u.username,
        u.avatar_url,
        u.id as user_id
      FROM card_comments cc
      JOIN users u ON cc.user_id = u.id
      WHERE cc.card_id = ?
      ORDER BY cc.created_at DESC
      `,
      [req.params.id]
    );

    if (comments.length === 0) {
      return res.status(200).json([]);
    }

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      user: {
        id: comment.user_id,
        username: comment.username,
        avatar_url: comment.avatar_url,
      },
    }));

    res.status(200).json(formattedComments);
  } catch (error) {
    res.status(500).json({
      message: "فشل احضار التعليقات الخاصة بالبطاقة",
      error,
    });
  }
});

router.get("/cards/:id/bookmark", authMiddleware, async (req, res) => {
  try {
    const [bookmarks] = await db.query(
      `
      SELECT * FROM card_bookmarks WHERE card_id =? AND user_id =?
      `,
      [req.params.id, req.user.id]
    );
    res.json({ isBookmarked: bookmarks.length > 0 });
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookmark status" });
  }
});
// Add bookmark functionality
router.post("/cards/:id/bookmark", authMiddleware, async (req, res) => {
  try {
    await db.query(
      "INSERT INTO card_bookmarks (card_id, user_id) VALUES (?, ?)",
      [req.params.id, req.user.id]
    );
    res.json({ message: "Card bookmarked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error bookmarking card" });
  }
});
// delete the card bookmark
router.delete("/cards/:id/bookmark", authMiddleware, async (req, res) => {
  try {
    const [bookmark] = await db.query(
      `
        SELECT * FROM card_bookmarks WHERE card_id = ?      
      `,
      [req.params.id]
    );
    if (!bookmark[0]) {
      return res.status(404).json({ message: "البطاقة غير موجودة" });
    }
    await db.query(
      `
        DELETE FROM card_bookmarks WHERE card_id =? AND user_id =?
      `,
      [req.params.id, req.user.id]
    );
    res.json({ message: "تم حذف الإعجاب بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "حدث خطأ أثناء حذف الإعجاب" });
  }
});
router.delete("/cards/:id/track/like", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "يجب عليك تسجيل الدخول اولا" });
    }

    const [existing] = await db.query(
      `SELECT id FROM card_interactions 
       WHERE card_id = ? 
       AND user_id = ? 
       AND interaction_type = 'like'`,
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "لم تقم بالإعجاب بهذه البطاقة" });
    }

    await db.query(
      `DELETE FROM card_interactions 
       WHERE card_id = ? 
       AND user_id = ? 
       AND interaction_type = 'like'`,
      [id, userId]
    );

    res.status(200).json({ message: "تم إلغاء الإعجاب بنجاح" });
  } catch (error) {
    console.error("Error removing like:", error);
    res.status(500).json({ message: "حدث خطأ أثناء إلغاء الإعجاب" });
  }
});

router.get("/cards/:id/metrics", async (req, res) => {
  try {
    const [metrics] = await db.query(
      `SELECT 
        interaction_type,
        COUNT(DISTINCT user_id) as count
       FROM card_interactions 
       WHERE card_id = ?
       GROUP BY interaction_type`,
      [req.params.id]
    );

    const formattedMetrics = {
      views: 0,
      shares: 0,
      likes: 0,
    };

    metrics.forEach((metric) => {
      formattedMetrics[metric.interaction_type + "s"] = metric.count;
    });

    res.json(formattedMetrics);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ message: "خطأ اثناء جلب الإحصائيات" });
  }
});

router.get("/cards/:id/likes", async (req, res) => {
  try {
    const [likes] = await db.query(
      `SELECT 
        u.id,
        u.username,
        u.avatar_url,
        ci.user_id,
        ci.created_at as liked_at
      FROM card_interactions ci
      JOIN users u ON ci.user_id = u.id
      WHERE ci.card_id = ? 
      AND ci.interaction_type = 'like'
      ORDER BY ci.created_at DESC`,
      [req.params.id]
    );

    res.json(likes);
  } catch (error) {
    console.error("Error fetching card likes:", error);
    res.status(500).json({ message: "خطأ في جلب قائمة المعجبين" });
  }
});

// Get card viewers (only for card owner)
router.get("/cards/:id/viewers", authMiddleware, async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.id;

    // Check if user is the card owner
    const [cardOwner] = await db.query(
      "SELECT user_id FROM dawah_cards WHERE id = ?",
      [cardId]
    );

    if (cardOwner.length === 0 || cardOwner[0].user_id !== userId) {
      return res.status(403).json({
        message: "غير مصرح لك بعرض تفاصيل المشاهدين",
      });
    }

    // إخفاء المستخدم رقم 5 من المشاهدين إلا للمستخدم رقم 1
    let viewersQuery = `
      SELECT 
        u.id,
        u.username,
        u.avatar_url,
        ci.user_ip,
        ci.created_at as viewed_at,
        CASE 
          WHEN u.id IS NOT NULL THEN 'user'
          ELSE 'anonymous'
        END as viewer_type
      FROM card_interactions ci
      LEFT JOIN users u ON ci.user_id = u.id
      WHERE ci.card_id = ? 
      AND ci.interaction_type = 'view'
    `;

    // إذا كان المستخدم ليس رقم 1، أخفي المستخدم رقم 5
    if (userId !== 1) {
      viewersQuery += ` AND (u.id IS NULL OR u.id != 5)`;
    }

    viewersQuery += ` ORDER BY ci.created_at DESC LIMIT 100`;

    const [viewers] = await db.query(viewersQuery, [cardId]);

    res.json(viewers);
  } catch (error) {
    console.error("Error fetching card viewers:", error);
    res.status(500).json({ message: "خطأ في جلب قائمة المشاهدين" });
  }
});

// Get card analytics for owner (views, likes, shares with user details)
router.get("/cards/:id/analytics-details", authMiddleware, async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.id;

    // Check if user is the card owner
    const [cardOwner] = await db.query(
      "SELECT user_id FROM dawah_cards WHERE id = ?",
      [cardId]
    );

    if (cardOwner.length === 0 || cardOwner[0].user_id !== userId) {
      return res.status(403).json({
        message: "غير مصرح لك بعرض تفاصيل التحليلات",
      });
    }

    // Get likes with user details
    const [likes] = await db.query(
      `SELECT 
        u.id,
        u.username,
        u.avatar_url,
        ci.created_at as liked_at
      FROM card_interactions ci
      JOIN users u ON ci.user_id = u.id
      WHERE ci.card_id = ? 
      AND ci.interaction_type = 'like'
      ORDER BY ci.created_at DESC`,
      [cardId]
    );

    // Get views with user details (only for logged in users)
    // إخفاء المستخدم رقم 5 من المشاهدين إلا للمستخدم رقم 1
    let viewsQuery = `
      SELECT DISTINCT
        u.id,
        u.username,
        u.avatar_url,
        ci.user_ip,
        ci.created_at as viewed_at,
        CASE 
          WHEN u.id IS NOT NULL THEN 'user'
          ELSE 'anonymous'
        END as viewer_type
      FROM card_interactions ci
      LEFT JOIN users u ON ci.user_id = u.id
      WHERE ci.card_id = ? 
      AND ci.interaction_type = 'view'
    `;

    // إذا كان المستخدم ليس رقم 1، أخفي المستخدم رقم 5
    if (userId !== 1) {
      viewsQuery += ` AND (u.id IS NULL OR u.id != 5)`;
    }

    viewsQuery += ` ORDER BY ci.created_at DESC LIMIT 100`;

    const [views] = await db.query(viewsQuery, [cardId]);

    // Get shares with user details
    const [shares] = await db.query(
      `SELECT 
        u.id,
        u.username,
        u.avatar_url,
        ci.created_at as shared_at
      FROM card_interactions ci
      JOIN users u ON ci.user_id = u.id
      WHERE ci.card_id = ? 
      AND ci.interaction_type = 'share'
      ORDER BY ci.created_at DESC`,
      [cardId]
    );

    // Get summary statistics
    const [summary] = await db.query(
      `SELECT 
        interaction_type,
        COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id ELSE user_ip END) as unique_count,
        COUNT(*) as total_count
      FROM card_interactions 
      WHERE card_id = ?
      GROUP BY interaction_type`,
      [cardId]
    );

    const summaryStats = {
      views: { unique: 0, total: 0 },
      likes: { unique: 0, total: 0 },
      shares: { unique: 0, total: 0 },
    };

    summary.forEach((stat) => {
      if (summaryStats[stat.interaction_type + "s"]) {
        summaryStats[stat.interaction_type + "s"] = {
          unique: stat.unique_count,
          total: stat.total_count,
        };
      }
    });

    res.json({
      likes,
      views,
      shares,
      summary: summaryStats,
    });
  } catch (error) {
    console.error("Error fetching card analytics details:", error);
    res.status(500).json({ message: "خطأ في جلب تفاصيل التحليلات" });
  }
});

router.post("/cards/:id/share-private", authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    const cardId = req.params.id;

    // Check if card exists and belongs to user
    const [card] = await db.query(
      "SELECT * FROM dawah_cards WHERE id = ? AND user_id = ?",
      [cardId, req.user.id]
    );

    if (card.length === 0) {
      return res.status(404).json({ message: "البطاقة غير موجودة" });
    }

    // Check if user exists
    const [user] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (user.length === 0) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    // Add sharing permission
    await db.query(
      `INSERT INTO card_sharing (card_id, shared_with_user_id) 
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
      [cardId, user[0].id]
    );

    res.json({ message: "تمت مشاركة البطاقة بنجاح" });
  } catch (error) {
    console.error("Error sharing private card:", error);
    res.status(500).json({ message: "حدث خطأ أثناء مشاركة البطاقة" });
  }
});

// Get a shared card by share link
router.get("/cards/shared/:shareLink", async (req, res) => {
  try {
    const { shareLink } = req.params;

    const userId = req.headers["x-auth-token"] ? req.user?.id : null;
    let parsedTags;
    const [cards] = await db.query(
      `SELECT 
        dc.*, u.username, u.avatar_url
      FROM dawah_cards dc
      JOIN users u ON dc.user_id = u.id
      WHERE dc.share_link = ?`,
      [shareLink]
    );

    if (cards.length === 0) {
      return res.status(404).json({
        message: "البطاقة غير موجودة أو غير عامة",
        status: "error",
      });
    }

    const card = cards[0];

    try {
      // If tags is a string representation of an array
      parsedTags = card.tags ? JSON.parse(card.tags) : [];
    } catch (error) {
      // If JSON.parse fails, check if it's already an array
      parsedTags = Array.isArray(card.tags) ? card.tags : [];
    }
    // Fetch all hadiths for this card with enhanced details
    const [hadiths] = await db.query(
      `SELECT 
        ch.id, 
        ch.custom_hadith as text, 
        ch.notes,
        ch.hadith_id,
        ch.grade,
        ch.attribution,
        ch.external_link,
        ch.created_at
      FROM card_hadiths ch
      WHERE ch.card_id = ?
      ORDER BY ch.created_at ASC`,
      [card.id]
    );
    const readingTimeMinutes = Math.ceil(
      hadiths.reduce(
        (acc, hadith) => acc + hadith.text.split(" ").length / 200,
        0
      )
    );

    const [metrics] = await db.query(
      `SELECT 
        interaction_type,
        COUNT(DISTINCT CASE 
          WHEN interaction_type = 'like' THEN user_id 
          ELSE user_ip 
        END) as count
       FROM card_interactions 
       WHERE card_id = ?
       GROUP BY interaction_type`,
      [card.id]
    );

    const cardMetrics = {
      views: 0,
      shares: 0,
      likes: 0,
    };

    metrics.forEach((metric) => {
      cardMetrics[metric.interaction_type + "s"] = metric.count;
    });

    // Combine results with enhanced structure
    res.json({
      status: "success",
      data: {
        card: {
          ...card,
          tags: parsedTags,
          created_at: new Date(card.created_at).toISOString(),
          share_url: `${process.env.CLIENT_URL}/shared-card/${card.share_link}`,
          metrics: cardMetrics,
          is_owner: userId === card.user_id,
          is_public: card.is_public,
        },
        hadiths: hadiths.map((hadith) => ({
          ...hadith,
          created_at: new Date(hadith.created_at).toISOString(),
        })),
        metadata: {
          total_hadiths: hadiths.length,
          reading_time_minutes: readingTimeMinutes,
          created_by: {
            username: card.username,
            id: card.user_id,
            avatar_url: card.avatar_url,
          },
        },
      },
    });
  } catch (error) {
    console.error("Shared card fetch error:", error.message);
    res.status(500).json({
      status: "error",
      message: "حدث خطأ أثناء جلب البطاقة",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
router.get("/cards/tags/:tag", async (req, res) => {
  try {
    const { tag } = req.params;
    const [cards] = await db.query(
      `SELECT 
        dc.id,
        dc.title,
        dc.description,
        dc.created_at,
        dc.share_link,
        dc.tags,
        u.id as creator_id,
        u.username as creator_username,
        u.avatar_url as creator_avatar_url,
        COUNT(DISTINCT ch.id) as total_hadiths,
        COUNT(DISTINCT CASE WHEN ci.interaction_type = 'view' THEN ci.id END) as views,
        COUNT(DISTINCT CASE WHEN ci.interaction_type = 'like' THEN ci.id END) as likes,
        CEIL(SUM(LENGTH(ch.custom_hadith) - LENGTH(REPLACE(ch.custom_hadith, ' ', '')) + 1) / 200) as reading_time
      FROM dawah_cards dc
      JOIN users u ON dc.user_id = u.id
      LEFT JOIN card_hadiths ch ON dc.id = ch.card_id
      LEFT JOIN card_interactions ci ON dc.id = ci.card_id
      WHERE dc.is_public = 1 AND JSON_CONTAINS(dc.tags, ?)
      GROUP BY dc.id
      ORDER BY dc.created_at DESC`,
      [JSON.stringify(tag)]
    );

    const formattedCards = cards.map((card) => {
      let parsedTags = [];
      try {
        parsedTags = JSON.parse(card.tags || "[]");
      } catch (err) {
        parsedTags = Array.isArray(card.tags) ? card.tags : [];
      }

      return {
        ...card,
        tags: parsedTags,
        creator: {
          id: card.creator_id,
          username: card.creator_username,
          avatar_url: card.creator_avatar_url,
        },
      };
    });

    res.json(formattedCards);
  } catch (error) {
    console.error("Error fetching cards by tag:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب البطاقات" });
  }
});
// In the POST /dawah-cards/:id/hadiths route
router.post("/dawah-cards/:id/hadiths", authMiddleware, async (req, res) => {
  try {
    const { text, notes, hadith_id, grade, attribution, external_link } =
      req.body;
    const cardId = req.params.id;

    await db.query(
      `INSERT INTO card_hadiths (card_id, hadith_id, custom_hadith, notes, grade, attribution, external_link) 
       VALUES (?, ?, ?, ?, ?, ?,?)`,
      [
        cardId,
        hadith_id,
        text,
        notes,
        grade || "",
        attribution || "",
        external_link,
      ]
    );

    res.status(201).json({ message: "تم إضافة الحديث بنجاح" });
  } catch (error) {
    console.error("Error adding hadith to card:", error);
    res.status(500).json({ message: "حدث خطأ أثناء إضافة الحديث" });
  }
});

router.put(
  "/cards/:id/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    try {
      const { content } = req.body;
      const { id: cardId, commentId } = req.params;
      const userId = req.user.id;

      // Check if comment exists and belongs to user
      const [comment] = await db.query(
        "SELECT * FROM card_comments WHERE id = ? AND card_id = ?",
        [commentId, cardId]
      );

      if (comment.length === 0) {
        return res.status(404).json({ message: "التعليق غير موجود" });
      }

      // Only comment owner can edit
      if (comment[0].user_id !== userId) {
        return res
          .status(403)
          .json({ message: "غير مسموح لك بتعديل هذا التعليق" });
      }

      await db.query("UPDATE card_comments SET content = ? WHERE id = ?", [
        content,
        commentId,
      ]);

      res.json({ message: "تم تعديل التعليق بنجاح" });
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تعديل التعليق" });
    }
  }
);

// Delete comment
router.delete(
  "/cards/:id/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    try {
      const { id: cardId, commentId } = req.params;
      const userId = req.user.id;

      // Check if comment exists
      const [comment] = await db.query(
        "SELECT cc.*, dc.user_id as card_owner_id FROM card_comments cc JOIN dawah_cards dc ON cc.card_id = dc.id WHERE cc.id = ? AND cc.card_id = ?",
        [commentId, cardId]
      );

      if (comment.length === 0) {
        return res.status(404).json({ message: "التعليق غير موجود" });
      }

      // Allow deletion if user is comment owner or card owner
      if (
        comment[0].user_id !== userId &&
        comment[0].card_owner_id !== userId
      ) {
        return res
          .status(403)
          .json({ message: "غير مسموح لك بحذف هذا التعليق" });
      }

      await db.query("DELETE FROM card_comments WHERE id = ?", [commentId]);

      res.json({ message: "تم حذف التعليق بنجاح" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حذف التعليق" });
    }
  }
);

router.delete("/cards/:id", authMiddleware, async (req, res) => {
  try {
    const [card] = await db.query("SELECT * FROM dawah_cards WHERE id = ?", [
      req.params.id,
    ]);
    if (!card[0]) {
      return res.status(404).json({ message: "Card not found" });
    }
    await db.query("DELETE FROM notifications WHERE card_id = ?", [
      req.params.id,
    ]);
    await db.query("DELETE FROM print_requests WHERE card_id = ?", [
      req.params.id,
    ]);
    await db.query("DELETE FROM card_hadiths WHERE card_id = ?", [
      req.params.id,
    ]);
    await db.query("DELETE FROM dawah_cards WHERE id = ?", [req.params.id]);
    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

// Add this new route to check if hadith exists in any card
router.get(
  "/dawah-cards/check-hadith/:hadithId",
  authMiddleware,
  async (req, res) => {
    try {
      const [result] = await db.query(
        `SELECT EXISTS(
        SELECT 1 FROM card_hadiths ch
        JOIN dawah_cards dc ON ch.card_id = dc.id
        WHERE ch.hadith_id = ? AND dc.user_id = ?
      ) as hadith_exists`,
        [req.params.hadithId, req.user.id]
      );

      res.json({ exists: !!result[0].hadith_exists });
    } catch (error) {
      console.error("Error checking hadith in cards:", error);
      res.status(500).json({ message: "Error checking hadith status" });
    }
  }
);

// delete specific hadith in card by the owner
router.delete(
  "/cards/:id/hadiths/:hadithId",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id: cardId, hadithId } = req.params;

      const [card] = await db.query(
        "SELECT * FROM dawah_cards WHERE id =? AND user_id =?",
        [cardId, userId]
      );
      if (card.length === 0) {
        return res.status(404).json({ message: "البطاقة غير موجودة" });
      }

      // Delete the hadith
      const [result] = await db.query(
        "DELETE FROM card_hadiths WHERE id = ? AND card_id = ?",
        [hadithId, cardId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "الحديث غير موجود" });
      }
      res.json({ message: "تم حذف الحديث بنجاح" });
    } catch (error) {
      console.error("Error deleting hadith:", error);
      res.status(500).json({ message: "حدث خطأ أثناء حذف الحديث" });
    }
  }
);

// Add this new route to get public cards
router.get("/cards/public", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || "";
    const tag = req.query.tag || "";
    const category = req.query.category || "";
    const offset = (page - 1) * limit;

    // بناء شروط البحث
    let whereConditions = ["dc.is_public = 1"];
    let queryParams = [];

    // إضافة البحث في العنوان والوصف
    if (search.trim()) {
      whereConditions.push("(dc.title LIKE ? OR dc.description LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // إضافة البحث في الوسوم
    if (tag.trim()) {
      whereConditions.push("JSON_CONTAINS(dc.tags, ?)");
      queryParams.push(JSON.stringify(tag));
    }

    // إضافة البحث في الفئة
    if (category.trim()) {
      whereConditions.push("dc.category = ?");
      queryParams.push(category);
    }

    const whereClause = whereConditions.join(" AND ");

    // جلب العدد الإجمالي مع شروط البحث
    const [[{ totalCount }]] = await db.query(
      `SELECT COUNT(DISTINCT dc.id) as totalCount 
       FROM dawah_cards dc 
       WHERE ${whereClause}`,
      queryParams
    );

    // جلب البطاقات مع شروط البحث
    const [cards] = await db.query(
      `SELECT 
        dc.id,
        dc.title,
        dc.description,
        dc.created_at,
        dc.share_link,
        dc.tags,
        dc.is_public,
        dc.background_url,
        dc.category,
        dc.background_color,
        u.id as creator_id,
        u.username as creator_username,
        u.avatar_url as creator_avatar_url,
        COUNT(DISTINCT ch.id) as total_hadiths,
        COUNT(DISTINCT CASE WHEN ci.interaction_type = 'view' THEN ci.id END) as views,
        COUNT(DISTINCT CASE WHEN ci.interaction_type = 'like' THEN ci.id END) as likes,
        CEIL(SUM(LENGTH(ch.custom_hadith) - LENGTH(REPLACE(ch.custom_hadith, ' ', '')) + 1) / 200) as reading_time
      FROM dawah_cards dc
      JOIN users u ON dc.user_id = u.id
      LEFT JOIN card_hadiths ch ON dc.id = ch.card_id
      LEFT JOIN card_interactions ci ON dc.id = ci.card_id
      WHERE ${whereClause}
      GROUP BY dc.id
      ORDER BY dc.created_at DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const formattedCards = cards.map((card) => {
      let parsedTags = [];
      try {
        parsedTags = JSON.parse(card.tags || "[]");
      } catch (err) {
        parsedTags = Array.isArray(card.tags) ? card.tags : [];
      }

      return {
        ...card,
        tags: parsedTags,
        creator: {
          id: card.creator_id,
          username: card.creator_username,
          avatar_url: card.creator_avatar_url,
        },
      };
    });

    res.json({
      cards: formattedCards,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      perPage: limit,
    });
  } catch (error) {
    console.error("Error fetching public cards:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب البطاقات" });
  }
});

// Print Request Routes
router.post(
  "/dawah-cards/:id/print-request",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        quantity,
        delivery_address,
        contact_phone,
        special_instructions,
      } = req.body;
      const cardId = req.params.id;
      const userId = req.user.id;

      // Check if card exists and is public or owned by user
      const [card] = await db.query(
        "SELECT * FROM dawah_cards WHERE id = ? AND (is_public = 1 OR user_id = ?)",
        [cardId, userId]
      );

      if (card.length === 0) {
        return res
          .status(404)
          .json({ message: "البطاقة غير موجودة أو غير متاحة للطباعة" });
      }

      // Create print request
      const [result] = await db.query(
        `INSERT INTO print_requests 
       (card_id, user_id, quantity, delivery_address, contact_phone, special_instructions) 
       VALUES (?, ?, ?, ?, ?, ?)`,
        [
          cardId,
          userId,
          quantity,
          delivery_address,
          contact_phone,
          special_instructions,
        ]
      );

      // Add initial status update
      await db.query(
        `INSERT INTO print_request_updates 
       (request_id, status, updated_by, notes) 
       VALUES (?, 'pending', ?, 'تم إنشاء طلب الطباعة')`,
        [result.insertId, userId]
      );

      res.status(201).json({
        message: "تم إنشاء طلب الطباعة بنجاح",
        request_id: result.insertId,
      });
    } catch (error) {
      console.error("Error creating print request:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء طلب الطباعة" });
    }
  }
);

// Get user's print requests
router.get("/print-requests", authMiddleware, async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT 
        pr.*,
        dc.title as card_title,
        dc.description as card_description,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'status', pru.status,
            'notes', pru.notes,
            'created_at', pru.created_at
          )
        ) as status_updates
      FROM print_requests pr
      JOIN dawah_cards dc ON pr.card_id = dc.id
      LEFT JOIN print_request_updates pru ON pr.id = pru.request_id
      WHERE pr.user_id = ?
      GROUP BY pr.id
      ORDER BY pr.created_at DESC`,
      [req.user.id]
    );

    res.json(requests);
  } catch (error) {
    console.error("Error fetching print requests:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب طلبات الطباعة" });
  }
});

// Admin routes for managing print requests
router.get("/admin/print-requests", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "غير مصرح لك بالوصول إلى هذه البيانات" });
    }

    const [requests] = await db.query(
      `SELECT 
        pr.*,
        dc.title as card_title,
        dc.description as card_description,
        u.username as requester_username,
        u.email as requester_email,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'status', pru.status,
            'notes', pru.notes,
            'created_at', pru.created_at,
            'updated_by', u2.username
          )
        ) as status_updates
      FROM print_requests pr
      JOIN dawah_cards dc ON pr.card_id = dc.id
      JOIN users u ON pr.user_id = u.id
      LEFT JOIN print_request_updates pru ON pr.id = pru.request_id
      LEFT JOIN users u2 ON pru.updated_by = u2.id
      GROUP BY pr.id
      ORDER BY pr.created_at DESC`
    );

    res.json(requests);
  } catch (error) {
    console.error("Error fetching admin print requests:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب طلبات الطباعة" });
  }
});

// Update print request status (admin only)
router.put(
  "/admin/print-requests/:id/status",
  authMiddleware,
  async (req, res) => {
    try {
      const { status, notes } = req.body;
      const requestId = req.params.id;

      // Check if user is admin
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "غير مصرح لك بتحديث حالة الطلب" });
      }

      // Update request status
      await db.query("UPDATE print_requests SET status = ? WHERE id = ?", [
        status,
        requestId,
      ]);

      // Add status update record
      await db.query(
        `INSERT INTO print_request_updates 
       (request_id, status, updated_by, notes) 
       VALUES (?, ?, ?, ?)`,
        [requestId, status, req.user.id, notes]
      );

      res.json({ message: "تم تحديث حالة الطلب بنجاح" });
    } catch (error) {
      console.error("Error updating print request status:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث حالة الطلب" });
    }
  }
);

// Vendor routes for managing print requests
router.get("/vendor/print-requests", authMiddleware, async (req, res) => {
  try {
    // Check if user is vendor
    if (req.user.role !== "vendor") {
      return res
        .status(403)
        .json({ message: "غير مصرح لك بالوصول إلى هذه البيانات" });
    }

    const [requests] = await db.query(
      `SELECT 
        pr.*,
        dc.title as card_title,
        dc.description as card_description,
        u.username as requester_username,
        u.email as requester_email,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'status', pru.status,
            'notes', pru.notes,
            'created_at', pru.created_at,
            'updated_by', u2.username
          )
        ) as status_updates
      FROM print_requests pr
      JOIN dawah_cards dc ON pr.card_id = dc.id
      JOIN users u ON pr.user_id = u.id
      LEFT JOIN print_request_updates pru ON pr.id = pru.request_id
      LEFT JOIN users u2 ON pru.updated_by = u2.id
      WHERE pr.status IN ('approved', 'in_printing', 'shipped', 'delivered')
      GROUP BY pr.id
      ORDER BY pr.created_at DESC`
    );

    res.json(requests);
  } catch (error) {
    console.error("Error fetching vendor print requests:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب طلبات الطباعة" });
  }
});

// Update print request status (vendor only)
router.put(
  "/vendor/print-requests/:id/status",
  authMiddleware,
  async (req, res) => {
    try {
      const { status, notes } = req.body;
      const requestId = req.params.id;

      // Check if user is vendor
      if (req.user.role !== "vendor") {
        return res
          .status(403)
          .json({ message: "غير مصرح لك بتحديث حالة الطلب" });
      }

      // Validate status transition
      const [currentRequest] = await db.query(
        "SELECT status FROM print_requests WHERE id = ?",
        [requestId]
      );

      if (currentRequest.length === 0) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      const currentStatus = currentRequest[0].status;
      const validTransitions = {
        approved: ["in_printing"],
        in_printing: ["shipped"],
        shipped: ["delivered"],
      };

      if (!validTransitions[currentStatus]?.includes(status)) {
        return res.status(400).json({
          message: "تحديث الحالة غير صالح",
          validNextStatus: validTransitions[currentStatus],
        });
      }

      // Update request status
      await db.query("UPDATE print_requests SET status = ? WHERE id = ?", [
        status,
        requestId,
      ]);

      // Add status update record
      await db.query(
        `INSERT INTO print_request_updates 
       (request_id, status, updated_by, notes) 
       VALUES (?, ?, ?, ?)`,
        [requestId, status, req.user.id, notes]
      );

      res.json({ message: "تم تحديث حالة الطلب بنجاح" });
    } catch (error) {
      console.error("Error updating print request status:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تحديث حالة الطلب" });
    }
  }
);

// Get card by ID (public or owned by user)
router.get("/cards/:id", authMiddleware, async (req, res) => {
  try {
    const cardId = req.params.id;
    const userId = req.user?.id;

    const [cards] = await db.query(
      `SELECT 
        dc.*,
        u.username,
        u.avatar_url
      FROM dawah_cards dc
      JOIN users u ON dc.user_id = u.id
      WHERE dc.id = ? AND (dc.is_public = 1 OR dc.user_id = ?)`,
      [cardId, userId]
    );

    if (cards.length === 0) {
      return res.status(404).json({
        message: "البطاقة غير موجودة أو غير متاحة",
        status: "error",
      });
    }

    const card = cards[0];

    // Parse tags
    let parsedTags;
    try {
      parsedTags = card.tags ? JSON.parse(card.tags) : [];
    } catch (error) {
      parsedTags = Array.isArray(card.tags) ? card.tags : [];
    }

    // Fetch all hadiths for this card
    const [hadiths] = await db.query(
      `SELECT 
        ch.id, 
        ch.custom_hadith as text, 
        ch.notes,
        ch.hadith_id,
        ch.grade,
        ch.attribution,
        ch.external_link,
        ch.created_at
      FROM card_hadiths ch
      WHERE ch.card_id = ?
      ORDER BY ch.created_at ASC`,
      [card.id]
    );

    // Calculate reading time
    const readingTimeMinutes = Math.ceil(
      hadiths.reduce(
        (acc, hadith) => acc + hadith.text.split(" ").length / 200,
        0
      )
    );

    // Get metrics
    const [metrics] = await db.query(
      `SELECT 
        interaction_type,
        COUNT(DISTINCT CASE 
          WHEN interaction_type = 'like' THEN user_id 
          ELSE user_ip 
        END) as count
       FROM card_interactions 
       WHERE card_id = ?
       GROUP BY interaction_type`,
      [card.id]
    );

    const cardMetrics = {
      views: 0,
      shares: 0,
      likes: 0,
    };

    metrics.forEach((metric) => {
      cardMetrics[metric.interaction_type + "s"] = metric.count;
    });

    // Combine results
    res.json({
      status: "success",
      data: {
        card: {
          ...card,
          tags: parsedTags,
          created_at: new Date(card.created_at).toISOString(),
          share_url: `${process.env.CLIENT_URL}/shared-card/${card.share_link}`,
          metrics: cardMetrics,
          is_owner: userId === card.user_id,
          is_public: card.is_public,
        },
        hadiths: hadiths.map((hadith) => ({
          ...hadith,
          created_at: new Date(hadith.created_at).toISOString(),
        })),
        metadata: {
          total_hadiths: hadiths.length,
          reading_time_minutes: readingTimeMinutes,
          created_by: {
            username: card.username,
            id: card.user_id,
            avatar_url: card.avatar_url,
          },
        },
      },
    });
  } catch (error) {
    console.error("Card fetch error:", error.message);
    res.status(500).json({
      status: "error",
      message: "حدث خطأ أثناء جلب البطاقة",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// عند تسجيل شير
router.post("/cards/:id/track/share", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userIp = req.ip;
    const userId = req.user?.id;
    // تحقق من عدم تكرار الشير خلال 24 ساعة
    const [existing] = await db.query(
      `SELECT id FROM card_interactions 
       WHERE card_id = ? AND interaction_type = 'share' 
       AND user_id = ?
       AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [id, userId]
    );
    if (existing.length === 0) {
      await db.query(
        `INSERT INTO card_interactions (card_id, interaction_type, user_ip, user_id) 
         VALUES (?, 'share', ?, ?)`,
        [id, userIp, userId]
      );
      // NEW: إشعار لصاحب البطاقة
      const [[card]] = await db.query(
        "SELECT user_id, share_link FROM dawah_cards WHERE id = ?",
        [id]
      );
      if (card && card.user_id && card.user_id !== userId) {
        const [notifResult] = await db.query(
          `INSERT INTO notifications (user_id, sender_id, card_id, type, message, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, 0, NOW())`,
          [
            card.user_id,
            userId,
            id,
            "share",
            `${req.user.username} شارك بطاقتك الدعوية`,
          ]
        );
        const notificationId = notifResult.insertId;
        const io = req.app.get("io");
        const roomName = "user_" + String(card.user_id);
        io.to(roomName).emit("notification", {
          id: notificationId,
          type: "share",
          cardId: id,
          shareLink: card.share_link,
          fromUser: { id: userId, name: req.user.username },
          message: `${req.user.username} شارك بطاقتك الدعوية`,
          created_at: new Date(),
          is_read: false,
        });
      }
    }
    res.status(200).json({ message: "تمت العملية بنجاح" });
  } catch (error) {
    console.error("Error tracking share interaction:", error);
    res.status(500).json({ message: "Error tracking share interaction" });
  }
});

module.exports = router;
