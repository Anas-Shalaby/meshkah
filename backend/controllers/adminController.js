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
