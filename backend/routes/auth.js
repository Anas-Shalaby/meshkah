const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../config/database");
const { authMiddleware } = require("../middleware/authMiddleware");
const mailService = require("../services/mailService");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { google } = require("googleapis");
const sendError = (res, status, message, messageAr = null) => {
  const response = {
    success: false,
    status: status,
    message: message,
  };
  if (messageAr) {
    response.messageAr = messageAr;
  }
  return res.status(status).json(response);
};
router.get("/google-status", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  const [users] = await db.query(
    "SELECT google_access_token FROM users WHERE id = ?",
    [userId]
  );

  if (!users[0] || !users[0].google_access_token) {
    return res.json({ connected: false });
  }
  res.json({ connected: true });
});
// Login Route
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      // Check if user exists
      const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);

      if (users.length === 0) {
        return sendError(res, 400, "User not found", "خطأ في الصلاحيات");
      }

      const user = users[0];

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return sendError(res, 400, "Invalid password", "خطأ في الصلاحيات");
      }

      // Create JWT payload
      const payload = {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };

      // Sign token
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      sendError(
        res,
        500,
        "Server error during login",
        "حدث خطأ أثناء تسجيل الدخول"
      );
    }
  }
);
// Google OAuth Login
router.post("/google-login", async (req, res) => {
  const { token } = req.body;

  try {
    // Verify Google token
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );

    const { email, name, picture, sub: googleId } = response.data;

    // Check if user exists with this Google ID or email
    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE google_id = ? OR email = ?",
      [googleId, email]
    );

    let user;
    if (existingUsers.length > 0) {
      // User exists, update Google ID if not set
      user = existingUsers[0];
      if (!user.google_id) {
        await db.query(
          "UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?",
          [googleId, picture, user.id]
        );
      }
    } else {
      // Create new user
      const [result] = await db.query(
        "INSERT INTO users (username, email, google_id, avatar_url, password) VALUES (?, ?, ?, ?, ?)",
        [
          name.replace(/\s/g, "_"),
          email,
          googleId,
          picture,
          await bcrypt.hash(googleId, await bcrypt.genSalt(10)), // Secure random password
        ]
      );

      const [newUsers] = await db.query("SELECT * FROM users WHERE id = ?", [
        result.insertId,
      ]);
      user = newUsers[0];
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
      },
    };

    // Sign token
    const authToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token: authToken,
      user: user,
    });
  } catch (error) {
    console.error("Google login error:", error);
    sendError(
      res,
      500,
      "Server error during Google authentication",
      "حدث خطأ أثناء تسجيل الدخول عبر جوجل"
    );
  }
});
// Registration Route
router.post(
  "/register",
  [
    body("username").not().isEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      // Check if user already exists
      const [existingUsers] = await db.query(
        "SELECT * FROM users WHERE email = ? OR username = ?",
        [email, username]
      );

      if (existingUsers.length > 0) {
        return sendError(
          res,
          400,
          "User already exists",
          "المستخدم موجود مسبقاً"
        );
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert new user
      const [result] = await db.query(
        "INSERT INTO users (username, email, password , google_id ,avatar_url , weekly_achievement_count) VALUES (?, ?, ?, ?, ?, ?)",
        [username, email, hashedPassword, 0, 0, 0]
      );

      // Create JWT payload
      const payload = {
        user: {
          id: result.insertId,
          username,
          role: "user",
        },
      };

      // Sign token
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
      await mailService.sendWelcomeEmail(email, username);
    } catch (err) {
      console.error(err.message);
      sendError(
        res,
        500,
        "Server error during registration",
        "حدث خطأ أثناء تسجيل الدخول"
      );
    }
  }
);

// Get User Profile Route (Protected)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (users.length === 0) {
      return sendError(res, 404, "User not found", "لا يوجد مستخدم");
    }

    res.json(users[0]);
  } catch (err) {
    console.error(err.message);
    sendError(
      res,
      500,
      "Server error during profile retrieval",
      "حدث خطأ أثناء جلب بيانات المستخدم"
    );
  }
});

router.get("/bookmarked-cards", authMiddleware, async (req, res) => {
  try {
    const [cards] = await db.query(
      `
      SELECT c.*, 
             cb.created_at as bookmarked_at,
             u.username as created_by_username,
             u.avatar_url as created_by_avatar,
             (SELECT COUNT(*) FROM card_hadiths WHERE card_id = c.id) as total_hadiths
      FROM card_bookmarks cb
      JOIN dawah_cards c ON cb.card_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE cb.user_id = ?
      ORDER BY cb.created_at DESC
    `,
      [req.user.id]
    );

    if (!cards.length) {
      return res.json([]);
    }

    res.json(cards);
  } catch (error) {
    console.error("Error fetching bookmarked cards:", error);
    sendError(
      res,
      500,
      "Error fetching bookmarked cards",
      "حدث خطأ أثناء جلب البطاقات المحفوظة"
    );
  }
});

router.put(
  "/update-profile",
  authMiddleware,
  multer().single("avatar"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { username } = req.body;
      let avatarUrl = null;

      // إذا أرسل صورة جديدة
      if (req.file) {
        const ext = path.extname(req.file.originalname);
        const fileName = `avatar-${userId}-${Date.now()}${ext}`;
        const uploadPath = path.join(
          __dirname,
          "../api/public/uploads/avatars",
          fileName
        );
        // تأكد من وجود المجلد
        fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
        fs.writeFileSync(uploadPath, req.file.buffer);
        avatarUrl = `/uploads/avatars/${fileName}`;
      }

      // بناء جملة التحديث
      let updateFields = [];
      let updateValues = [];
      if (username) {
        updateFields.push("username = ?");
        updateValues.push(username);
      }
      if (avatarUrl) {
        updateFields.push("avatar_url = ?");
        updateValues.push(avatarUrl);
      }
      if (updateFields.length === 0) {
        return sendError(
          res,
          400,
          "No data to update",
          "لا يوجد بيانات لتحديثها"
        );
      }
      updateValues.push(userId);
      await db.query(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
      );
      // أرجع بيانات المستخدم الجديدة
      const [users] = await db.query("SELECT * FROM users WHERE id = ?", [
        userId,
      ]);
      res.json(users[0]);
    } catch (error) {
      console.error("Error updating profile:", error);
      sendError(
        res,
        500,
        "Error updating profile",
        "حدث خطأ أثناء تحديث الحساب"
      );
    }
  }
);

router.get("/google", (req, res) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
  res.redirect(url);
});

// 2. Google OAuth callback
router.post("/google/callback", authMiddleware, async (req, res) => {
  const { code } = req.body;
  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  const { tokens } = await oAuth2Client.getToken(code);

  const userId = req.user.id;
  if (!userId) return res.status(400).send("User ID required");

  await db.query(
    "UPDATE users SET google_access_token = ?, google_refresh_token = ?, google_token_expiry = ? WHERE id = ?",
    [
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      userId,
    ]
  );

  res.send("تم ربط حسابك بجوجل بنجاح! يمكنك إغلاق هذه النافذة.");
});

module.exports = router;
