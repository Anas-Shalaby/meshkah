const jwt = require("jsonwebtoken");
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
const authMiddleware = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user || decoded; // دعم كلا التنسيقين
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if user exists and has the required role
    if (!req.user) {
      return next(
        new AppError("You are not logged in. Please log in to get access.", 401)
      );
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: "No user found, authorization denied" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied. Admin role required." });
  }

  next();
};

// Optional auth middleware - sets req.user if token exists, but doesn't require it
const optionalAuthMiddleware = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return next(); // Continue without user
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user || decoded; // دعم كلا التنسيقين
    next();
  } catch (err) {
    // If token is invalid, continue without user (don't reject the request)
    next();
  }
};

// Helper function to check supervisor access for a specific cohort
const checkSupervisorCohortAccess = async (campId, userId, cohortNumber) => {
  try {
    const db = require("../config/database");

    // Check if user is general supervisor (cohort_number IS NULL) or specific cohort supervisor
    const [supervisors] = await db.query(
      `SELECT 1 FROM camp_supervisors 
       WHERE camp_id = ? AND user_id = ? AND (
         cohort_number = ? OR (cohort_number IS NULL)
       )
       LIMIT 1`,
      [campId, userId, cohortNumber || null]
    );

    return supervisors.length > 0;
  } catch (error) {
    console.error("Error checking supervisor cohort access:", error);
    return false;
  }
};

// Supervisor middleware - checks if user is supervisor or admin
const supervisorMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ msg: "No user found, authorization denied" });
    }

    // Admin always has access
    if (req.user.role === "admin") {
      return next();
    }

    // Check if user is supervisor for this camp/cohort
    const db = require("../config/database");
    const { id } = req.params; // camp_id
    // Try to get cohortNumber from params first, then query, then body
    const cohortNumber =
      req.params.cohortNumber ||
      req.query.cohortNumber ||
      req.body.cohortNumber;

    const hasAccess = await checkSupervisorCohortAccess(
      id,
      req.user.id,
      cohortNumber
    );

    if (!hasAccess) {
      return res.status(403).json({
        msg: "Access denied. Supervisor or admin role required.",
      });
    }

    next();
  } catch (error) {
    console.error("Error in supervisor middleware:", error);
    return res.status(500).json({ msg: "Error checking supervisor access" });
  }
};

// Supervisor or admin middleware - allows supervisors and admins
const supervisorOrAdminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ msg: "No user found, authorization denied" });
    }

    // Admin always has access
    if (req.user.role === "admin") {
      return next();
    }

    // Check if user is supervisor for this camp/cohort
    const db = require("../config/database");
    const { id } = req.params; // camp_id
    const { cohortNumber } = req.query || req.body;

    const [supervisors] = await db.query(
      `SELECT 1 FROM camp_supervisors 
       WHERE camp_id = ? AND user_id = ? AND (
         cohort_number = ? OR (cohort_number IS NULL AND ? IS NULL)
       )
       LIMIT 1`,
      [id, req.user.id, cohortNumber || null, cohortNumber || null]
    );

    if (supervisors.length > 0) {
      return next();
    }

    return res.status(403).json({
      msg: "Access denied. Supervisor or admin role required.",
    });
  } catch (error) {
    console.error("Error in supervisor or admin middleware:", error);
    return res.status(500).json({ msg: "Error checking supervisor access" });
  }
};

module.exports = {
  authMiddleware,
  restrictTo,
  adminMiddleware,
  checkSupervisorCohortAccess,
  optionalAuthMiddleware,
  supervisorMiddleware,
  supervisorOrAdminMiddleware,
};
