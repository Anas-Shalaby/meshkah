const db = require("../config/database");

/**
 * Check if user is a supervisor for a camp
 * @param {number} campId - Camp ID
 * @param {number} userId - User ID
 * @param {number|null} cohortNumber - Cohort number (null for all cohorts)
 * @returns {Promise<boolean>}
 */
const isSupervisor = async (campId, userId, cohortNumber = null) => {
  try {
    let query = `
      SELECT 1 FROM camp_supervisors 
      WHERE camp_id = ? AND user_id = ?`;
    const params = [campId, userId];

    if (cohortNumber !== null) {
      query += ` AND (cohort_number = ? OR cohort_number IS NULL)`;
      params.push(cohortNumber);
    }

    query += " LIMIT 1";
    const [rows] = await db.query(query, params);
    return rows.length > 0;
  } catch (error) {
    console.error("Error checking supervisor status:", error);
    return false;
  }
};

/**
 * Check if user is an admin
 * @param {Object} user - User object from req.user
 * @returns {boolean}
 */
const isAdmin = (user) => {
  return user?.role === "admin";
};

/**
 * Check if user has supervisor or admin access
 * @param {number} campId - Camp ID
 * @param {Object} user - User object from req.user
 * @param {number|null} cohortNumber - Cohort number (null for all cohorts)
 * @returns {Promise<boolean>}
 */
const hasSupervisorOrAdminAccess = async (
  campId,
  user,
  cohortNumber = null
) => {
  if (!user) return false;

  // Check admin first (fastest)
  if (isAdmin(user)) {
    return true;
  }

  // Check supervisor
  return await isSupervisor(campId, user.id, cohortNumber);
};

/**
 * Verify user has access (admin or supervisor) and return access type
 * @param {number} campId - Camp ID
 * @param {Object} user - User object from req.user
 * @param {number|null} cohortNumber - Cohort number (null for all cohorts)
 * @returns {Promise<{hasAccess: boolean, isAdmin: boolean, isSupervisor: boolean}>}
 */
const verifyAccess = async (campId, user, cohortNumber = null) => {
  const adminAccess = isAdmin(user);
  const supervisorAccess = adminAccess
    ? false
    : await isSupervisor(campId, user?.id, cohortNumber);

  return {
    hasAccess: adminAccess || supervisorAccess,
    isAdmin: adminAccess,
    isSupervisor: supervisorAccess,
  };
};

module.exports = {
  isSupervisor,
  isAdmin,
  hasSupervisorOrAdminAccess,
  verifyAccess,
};
