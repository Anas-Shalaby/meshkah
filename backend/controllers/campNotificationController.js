const db = require("../config/database");
const crypto = require("crypto");
const mailService = require("../services/mailService");

// Subscribe to camp notifications
const subscribeToCampNotifications = async (req, res) => {
  try {
    const { email, subscription_type = "both" } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "البريد الإلكتروني غير صحيح",
      });
    }

    const validTypes = ["camps", "cohorts", "both"];
    if (!validTypes.includes(subscription_type)) {
      return res.status(400).json({
        success: false,
        message: "نوع الاشتراك غير صحيح",
      });
    }

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomBytes(32).toString("hex");

    // Check if email already exists
    const [existing] = await db.query(
      `SELECT id, is_active FROM camp_notification_subscribers WHERE email = ?`,
      [email]
    );

    if (existing.length > 0) {
      // Update existing subscription
      await db.query(
        `UPDATE camp_notification_subscribers 
         SET subscription_type = ?, is_active = 1, unsubscribe_token = ?, 
             subscribed_at = CURRENT_TIMESTAMP, unsubscribed_at = NULL
         WHERE email = ?`,
        [subscription_type, unsubscribeToken, email]
      );

      return res.json({
        success: true,
        message: "تم تحديث الاشتراك بنجاح",
      });
    }

    // Create new subscription
    await db.query(
      `INSERT INTO camp_notification_subscribers 
       (email, subscription_type, unsubscribe_token, subscribed_by)
       VALUES (?, ?, ?, ?)`,
      [email, subscription_type, unsubscribeToken, req.user?.id || null]
    );

    res.json({
      success: true,
      message: "تم الاشتراك بنجاح",
    });
  } catch (error) {
    console.error("Error subscribing to notifications:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في الاشتراك",
      error: error.message,
    });
  }
};

// Unsubscribe from camp notifications
const unsubscribeFromCampNotifications = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "رمز إلغاء الاشتراك مطلوب",
      });
    }

    const [subscribers] = await db.query(
      `SELECT id, email FROM camp_notification_subscribers 
       WHERE unsubscribe_token = ? AND is_active = 1`,
      [token]
    );

    if (subscribers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الاشتراك غير موجود أو تم إلغاؤه مسبقاً",
      });
    }

    await db.query(
      `UPDATE camp_notification_subscribers 
       SET is_active = 0, unsubscribed_at = CURRENT_TIMESTAMP 
       WHERE unsubscribe_token = ?`,
      [token]
    );

    res.json({
      success: true,
      message: "تم إلغاء الاشتراك بنجاح",
    });
  } catch (error) {
    console.error("Error unsubscribing from notifications:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إلغاء الاشتراك",
      error: error.message,
    });
  }
};

// Get email subscribers (Admin only)
const getEmailSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 50, is_active, subscription_type } = req.query;

    let query = `SELECT * FROM camp_notification_subscribers WHERE 1=1`;
    const params = [];

    if (is_active !== undefined) {
      query += ` AND is_active = ?`;
      params.push(is_active === "true" ? 1 : 0);
    }

    if (subscription_type) {
      query += ` AND subscription_type = ?`;
      params.push(subscription_type);
    }

    query += ` ORDER BY subscribed_at DESC`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [subscribers] = await db.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM camp_notification_subscribers WHERE 1=1`;
    const countParams = [];
    if (is_active !== undefined) {
      countQuery += ` AND is_active = ?`;
      countParams.push(is_active === "true" ? 1 : 0);
    }
    if (subscription_type) {
      countQuery += ` AND subscription_type = ?`;
      countParams.push(subscription_type);
    }
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: subscribers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching email subscribers:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب المشتركين",
      error: error.message,
    });
  }
};

// Add email subscriber manually (Admin only)
const addEmailSubscriber = async (req, res) => {
  try {
    const { email, subscription_type = "both", notes } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "البريد الإلكتروني غير صحيح",
      });
    }

    const validTypes = ["camps", "cohorts", "both"];
    if (!validTypes.includes(subscription_type)) {
      return res.status(400).json({
        success: false,
        message: "نوع الاشتراك غير صحيح",
      });
    }

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomBytes(32).toString("hex");

    // Check if email already exists
    const [existing] = await db.query(
      `SELECT id FROM camp_notification_subscribers WHERE email = ?`,
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "البريد الإلكتروني مسجل بالفعل",
      });
    }

    await db.query(
      `INSERT INTO camp_notification_subscribers 
       (email, subscription_type, unsubscribe_token, subscribed_by, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [email, subscription_type, unsubscribeToken, req.user.id, notes || null]
    );

    res.json({
      success: true,
      message: "تم إضافة المشترك بنجاح",
    });
  } catch (error) {
    console.error("Error adding email subscriber:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "البريد الإلكتروني مسجل بالفعل",
      });
    }
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إضافة المشترك",
      error: error.message,
    });
  }
};

// Remove email subscriber (Admin only)
const removeEmailSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    const [subscribers] = await db.query(
      `SELECT id FROM camp_notification_subscribers WHERE id = ?`,
      [id]
    );

    if (subscribers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "المشترك غير موجود",
      });
    }

    await db.query(`DELETE FROM camp_notification_subscribers WHERE id = ?`, [
      id,
    ]);

    res.json({
      success: true,
      message: "تم حذف المشترك بنجاح",
    });
  } catch (error) {
    console.error("Error removing email subscriber:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في حذف المشترك",
      error: error.message,
    });
  }
};

// Export email subscribers (Admin only)
const exportEmailSubscribers = async (req, res) => {
  try {
    const { format = "csv" } = req.query;

    const [subscribers] = await db.query(
      `SELECT email, subscription_type, is_active, subscribed_at, unsubscribed_at, notes
       FROM camp_notification_subscribers
       ORDER BY subscribed_at DESC`
    );

    if (format === "csv") {
      // Generate CSV
      const csvHeader =
        "Email,Subscription Type,Active,Subscribed At,Unsubscribed At,Notes\n";
      const csvRows = subscribers.map((s) => {
        return [
          s.email,
          s.subscription_type,
          s.is_active ? "Yes" : "No",
          s.subscribed_at || "",
          s.unsubscribed_at || "",
          (s.notes || "").replace(/,/g, ";"),
        ].join(",");
      });

      const csv = csvHeader + csvRows.join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="camp-subscribers-${Date.now()}.csv"`
      );
      res.send("\ufeff" + csv); // BOM for Excel
    } else {
      // JSON format
      res.json({
        success: true,
        data: subscribers,
        total: subscribers.length,
      });
    }
  } catch (error) {
    console.error("Error exporting email subscribers:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تصدير المشتركين",
      error: error.message,
    });
  }
};

// Get email subscribers statistics (Admin only)
const getEmailSubscribersStats = async (req, res) => {
  try {
    const [totalResult] = await db.query(
      `SELECT COUNT(*) as total FROM camp_notification_subscribers`
    );
    const total = totalResult[0].total;

    const [activeResult] = await db.query(
      `SELECT COUNT(*) as active FROM camp_notification_subscribers WHERE is_active = 1`
    );
    const active = activeResult[0].active;

    const [typeStats] = await db.query(
      `SELECT subscription_type, COUNT(*) as count 
       FROM camp_notification_subscribers 
       WHERE is_active = 1
       GROUP BY subscription_type`
    );

    const [monthlyStats] = await db.query(
      `SELECT COUNT(*) as new_this_month 
       FROM camp_notification_subscribers 
       WHERE subscribed_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`
    );

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive: total - active,
        by_type: typeStats.reduce((acc, item) => {
          acc[item.subscription_type] = item.count;
          return acc;
        }, {}),
        new_this_month: monthlyStats[0].new_this_month,
      },
    });
  } catch (error) {
    console.error("Error fetching email subscribers stats:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب الإحصائيات",
      error: error.message,
    });
  }
};

// Send camp opened notification email (internal function)
const sendCampOpenedNotification = async (campId, campName) => {
  try {
    // Get active subscribers for camps or both
    const [subscribers] = await db.query(
      `SELECT email, unsubscribe_token 
       FROM camp_notification_subscribers 
       WHERE is_active = 1 
       AND subscription_type IN ('camps', 'both')`
    );

    for (const subscriber of subscribers) {
      try {
        await mailService.sendCampOpenedEmail(
          subscriber.email,
          campName,
          campId,
          subscriber.unsubscribe_token
        );
      } catch (emailError) {
        console.error(
          `Failed to send camp opened email to ${subscriber.email}:`,
          emailError
        );
      }
    }

    console.log(
      `Sent camp opened notifications to ${subscribers.length} subscribers`
    );
  } catch (error) {
    console.error("Error sending camp opened notifications:", error);
    throw error;
  }
};

// Send cohort opened notification email (internal function)
const sendCohortOpenedNotification = async (campId, cohortNumber, campName) => {
  try {
    // Get active subscribers for cohorts or both
    const [subscribers] = await db.query(
      `SELECT email, unsubscribe_token 
       FROM camp_notification_subscribers 
       WHERE is_active = 1 
       AND subscription_type IN ('cohorts', 'both')`
    );

    for (const subscriber of subscribers) {
      try {
        await mailService.sendCohortOpenedEmail(
          subscriber.email,
          campName,
          campId,
          cohortNumber,
          subscriber.unsubscribe_token
        );
      } catch (emailError) {
        console.error(
          `Failed to send cohort opened email to ${subscriber.email}:`,
          emailError
        );
      }
    }

    console.log(
      `Sent cohort opened notifications to ${subscribers.length} subscribers`
    );
  } catch (error) {
    console.error("Error sending cohort opened notifications:", error);
    throw error;
  }
};

module.exports = {
  subscribeToCampNotifications,
  unsubscribeFromCampNotifications,
  getEmailSubscribers,
  addEmailSubscriber,
  removeEmailSubscriber,
  exportEmailSubscribers,
  getEmailSubscribersStats,
  sendCampOpenedNotification,
  sendCohortOpenedNotification,
};
