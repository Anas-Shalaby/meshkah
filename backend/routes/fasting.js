const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const moment = require('moment-hijri');
const db = require('../config/database'); // Assuming you have a database connection setup
const {authMiddleware} = require('../middleware/authMiddleware'); // Assuming you have authentication middleware

// Toggle White Days Fasting Subscription
router.post('/toggle-subscription', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.id;
  
      // First, get the current subscription status
      const [currentStatus] = await db.query(
        `SELECT white_days_fasting_subscription, username 
         FROM users 
         WHERE id = ?`,
        [userId]
      );
  
      if (currentStatus.length === 0) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
  
      // Toggle the subscription status
      const newSubscriptionStatus = !currentStatus[0].white_days_fasting_subscription;
  
      await db.query(
        `UPDATE users 
         SET white_days_fasting_subscription = ? 
         WHERE id = ?`,
        [newSubscriptionStatus, userId]
      );
  
      res.json({ 
        subscribed: newSubscriptionStatus,
        message: newSubscriptionStatus 
          ? `مرحبًا ${currentStatus[0].username}، تم الاشتراك في تذكيرات صيام الأيام البيض` 
          : `مرحبًا ${currentStatus[0].username}، تم إلغاء الاشتراك في تذكيرات صيام الأيام البيض`
      });
    } catch (error) {
      console.error('Error toggling white days fasting subscription:', error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء تغيير الاشتراك",
        error: error.message 
      });
    }
  });

// Get Subscription Status
router.get('/subscription-status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.query(
      `SELECT 
        white_days_fasting_subscription, 
        last_white_days_fasting_date, 
        white_days_fasting_streak 
      FROM users 
      WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    res.json({
      subscribed: users[0].white_days_fasting_subscription,
      lastFastingDate: users[0].last_white_days_fasting_date,
      fastingStreak: users[0].white_days_fasting_streak
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ 
      message: "حدث خطأ أثناء استرداد حالة الاشتراك",
      error: error.message 
    });
  }
});
function convertToArabicNumerals(arabicIndicNumber) {
    const arabicIndicToArabic = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
  
    return arabicIndicNumber.split('').map(char => 
      arabicIndicToArabic[char] || char
    ).join('');
  }
  
// Log White Days Fasting
router.post('/log-fasting', authMiddleware, [
  body('fastingDate').isDate()
], async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.id;
    const { fastingDate } = req.body;

    // Check if the date is a white day
    // Check if the date is a white day
    const hijriDate = moment(fastingDate).format('iD');
    const hijriMonth = moment(fastingDate).format('iM');
   

    // Convert Arabic-Indic numerals to standard Arabic numerals
    const convertedHijriDate = parseInt(convertToArabicNumerals(hijriDate));
    const convertedHijriMonth = parseInt(convertToArabicNumerals(hijriMonth));

    if (![13, 14, 15].includes(convertedHijriDate)) {
      return res.status(400).json({ 
        message: "التاريخ المدخل ليس من الأيام البيض" 
      });
    }

    // Check if fasting is already logged for this date
    const [existingLog] = await db.query(
        `SELECT * FROM fasting_logs 
         WHERE user_id = ? AND fasting_date = ?`,
        [userId, fastingDate]
      );
  
      if (existingLog.length > 0) {
        return res.status(400).json({ 
          message: 'تم تسجيل الصيام لهذا اليوم بالفعل' 
        });
      }
  
      // Insert fasting log
      await db.query(
        `INSERT INTO fasting_logs 
         (user_id, fasting_date, hijri_date , hijri_month) 
         VALUES (?, ?, ?, ?)`,
        [userId, fastingDate, convertedHijriDate, convertedHijriMonth]
      );
  
      // Calculate fasting streak
      const [streakResult] = await db.query(
        `SELECT COUNT(DISTINCT fasting_date) as streak 
         FROM fasting_logs 
         WHERE user_id = ? 
         AND fasting_date >= DATE_SUB(?, INTERVAL 3 MONTH)`,
        [userId, fastingDate]
      );
  
       // Update user's white days fasting streak
       await db.query(
        `UPDATE users 
         SET white_days_fasting_streak = ? 
         WHERE id = ?`,
        [streakResult[0].streak, userId]
      );
  
      // Fetch updated user data
      const [userData] = await db.query(
        `SELECT white_days_fasting_streak, white_days_fasting_subscription 
         FROM users 
         WHERE id = ?`,
        [userId]
      );
  
      res.json({
        message: 'تم تسجيل الصيام بنجاح',
        fastingStreak: userData[0].fasting_streak,
        subscribed: userData[0].white_days_fasting_subscription
      });
  
  } catch (error) {
    console.error('Error logging white days fasting:', error);
    res.status(500).json({ 
      message: "حدث خطأ أثناء تسجيل الصيام",
      error: error.message 
    });
  }
});

module.exports = router;