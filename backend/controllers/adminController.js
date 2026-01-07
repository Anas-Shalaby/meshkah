// /Users/shalbyyousef/Desktop/Meshkah/backend/controllers/adminController.js
const db = require("../config/database");
const { validationResult } = require("express-validator");

// Helper function to handle database errors
const handleDatabaseError = (res, error) => {
  console.error("Database Error:", error);
  res.status(500).json({
    status: "error",
    message: "An error occurred while processing your request",
    error: process.env.NODE_ENV === "development" ? error.message : {},
  });
};

// Get User Statistics
exports.getUserStats = async (req, res) => {
  try {
    // Total Users
    const [totalUsers] = await db.query("SELECT COUNT(*) as total FROM users");

    // Users by Role
    const [usersByRole] = await db.query(
      "SELECT role, COUNT(*) as count FROM users GROUP BY role"
    );

    res.status(200).json({
      status: "success",
      data: {
        totalUsers: totalUsers[0].total,
        usersByRole: usersByRole,
      },
    });
  } catch (error) {
    handleDatabaseError(res, error);
  }
};

// Get Content Statistics
exports.getContentStats = async (req, res) => {
  try {
    // Get bookmarks statistics
    const [bookmarkStats] = await db.query(
      `SELECT 
          COUNT(*) as totalBookmarks,
          COUNT(DISTINCT user_id) as usersWithBookmarks
        FROM bookmarks`
    );

    res.status(200).json({
      status: "success",
      data: {
        totalBookmarks: bookmarkStats[0].totalBookmarks,
        usersWithBookmarks: bookmarkStats[0].usersWithBookmarks,
        totalHadiths: 10000, // Fixed number as requested
      },
    });
  } catch (error) {
    handleDatabaseError(res, error);
  }
};

// Get Dashboard Analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // Parallel queries for performance
    const [[totalUsers], [totalBookmarks], [dailyVisitors]] = await Promise.all(
      [
        db.query("SELECT COUNT(*) as total FROM users"),
        db.query("SELECT COUNT(*) as total FROM bookmarks"),
        // Implement visitor tracking logic or use a fixed number
        db.query("SELECT 3750 as visitors"),
      ]
    );

    res.status(200).json({
      status: "success",
      data: {
        totalUsers: totalUsers[0].total,
        totalHadiths: 10000, // Fixed number as requested
        totalBookmarks: totalBookmarks[0].total,
        dailyVisitors: dailyVisitors[0].visitors,
      },
    });
  } catch (error) {
    handleDatabaseError(res, error);
  }
};

// User Management
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get paginated users
    const [users] = await db.query(
      `SELECT id, username, email, role, created_at 
       FROM users 
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Get total user count
    const [countResult] = await db.query("SELECT COUNT(*) as total FROM users");

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: "success",
      data: {
        users,
        total,
        page,
        totalPages,
      },
    });
  } catch (error) {
    handleDatabaseError(res, error);
  }
};

// Update User
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { role, active } = req.body;

  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }

    const [result] = await db.query(
      "UPDATE users SET role = ?, active = ? WHERE id = ?",
      [role, active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
    });
  } catch (error) {
    handleDatabaseError(res, error);
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(204).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    handleDatabaseError(res, error);
  }
};

// Send Cohort Completion Notifications (Manual)
exports.sendCohortCompletionNotifications = async (req, res) => {
  const { campId, cohortNumber } = req.params;

  try {
    const CampNotificationService = require("../services/campNotificationService");

    // Call the service function
    const result = await CampNotificationService.sendCohortCompletionToAll(
      parseInt(campId),
      parseInt(cohortNumber)
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          sent: result.count,
          errors: result.errors,
          total: result.total,
        },
      });
    } else {
      return res.status(result.alreadySent ? 400 : 500).json({
        success: false,
        message: result.message,
        alreadySent: result.alreadySent || false,
      });
    }
  } catch (error) {
    console.error("Error in sendCohortCompletionNotifications:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إرسال الإشعارات",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get Ramadan theme status
exports.getRamadanThemeStatus = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT setting_value, updated_at FROM site_settings WHERE setting_key = ?",
      ["ramadan_theme_enabled"]
    );

    if (rows.length === 0) {
      // إنشاء الإعداد إذا لم يكن موجود
      await db.query(
        "INSERT INTO site_settings (setting_key, setting_value, description) VALUES (?, ?, ?)",
        [
          "ramadan_theme_enabled",
          "false",
          "تفعيل أو إلغاء الثيم الرمضاني للموقع",
        ]
      );

      return res.status(200).json({
        success: true,
        enabled: false,
        updatedAt: new Date(),
      });
    }

    const enabled = rows[0].setting_value === "true";

    res.status(200).json({
      success: true,
      enabled: enabled,
      updatedAt: rows[0].updated_at,
    });
  } catch (error) {
    console.error("Error getting Ramadan theme status:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب حالة الثيم",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update Ramadan theme status (Admin only)
exports.updateRamadanThemeStatus = async (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "يجب أن تكون القيمة true أو false",
      });
    }

    const userId = req.user ? req.user.id : null;

    await db.query(
      "UPDATE site_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?",
      [enabled ? "true" : "false", userId, "ramadan_theme_enabled"]
    );

    res.status(200).json({
      success: true,
      message: enabled
        ? "تم تفعيل الثيم الرمضاني بنجاح"
        : "تم إلغاء الثيم الرمضاني بنجاح",
      enabled: enabled,
    });
  } catch (error) {
    console.error("Error updating Ramadan theme status:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث حالة الثيم",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get Ramadan date
exports.getRamadanDate = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT setting_value, updated_at FROM site_settings WHERE setting_key = ?",
      ["ramadan_start_date"]
    );

    if (rows.length === 0) {
      // إنشاء الإعداد إذا لم يكن موجود - التاريخ الافتراضي 18 فبراير 2026
      const defaultDate = "2026-02-18";
      await db.query(
        "INSERT INTO site_settings (setting_key, setting_value, description) VALUES (?, ?, ?)",
        ["ramadan_start_date", defaultDate, "تاريخ بداية شهر رمضان المبارك"]
      );

      return res.status(200).json({
        success: true,
        startDate: defaultDate,
        updatedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      startDate: rows[0].setting_value,
      updatedAt: rows[0].updated_at,
    });
  } catch (error) {
    console.error("Error getting Ramadan date:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب تاريخ رمضان",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update Ramadan date (Admin only)
exports.updateRamadanDate = async (req, res) => {
  try {
    const { startDate } = req.body;

    // التحقق من صحة التاريخ
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!startDate || !dateRegex.test(startDate)) {
      return res.status(400).json({
        success: false,
        message: "يجب إدخال تاريخ صحيح بصيغة YYYY-MM-DD",
      });
    }

    const date = new Date(startDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: "التاريخ المدخل غير صالح",
      });
    }

    const userId = req.user ? req.user.id : null;

    // تحديث التاريخ
    const [result] = await db.query(
      "UPDATE site_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?",
      [startDate, userId, "ramadan_start_date"]
    );

    // إذا لم يكن موجود، أضفه
    if (result.affectedRows === 0) {
      await db.query(
        "INSERT INTO site_settings (setting_key, setting_value, description, updated_by) VALUES (?, ?, ?, ?)",
        [
          "ramadan_start_date",
          startDate,
          "تاريخ بداية شهر رمضان المبارك",
          userId,
        ]
      );
    }

    res.status(200).json({
      success: true,
      message: "تم تحديث تاريخ رمضان بنجاح",
      startDate: startDate,
    });
  } catch (error) {
    console.error("Error updating Ramadan date:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تحديث تاريخ رمضان",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
