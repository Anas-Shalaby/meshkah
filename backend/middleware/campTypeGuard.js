/**
 * Camp type / cohort guards
 * --------------------------------------------------------
 * Lightweight Express middlewares that prevent cohort-only or
 * supervisor-only operations from being executed against a
 * camp whose type does not support those features (e.g. hadith).
 *
 * The frontend already hides these affordances, but we also
 * close the API door so direct callers cannot mutate cohorts
 * for self-paced camps.
 */

const db = require("../config/database");

const fetchCampMeta = async (campId) => {
  if (!campId) return null;
  const [rows] = await db.query(
    `SELECT id, camp_type, enable_cohorts FROM quran_camps WHERE id = ? LIMIT 1`,
    [campId]
  );
  return rows[0] || null;
};

/**
 * Block the request when the camp does not have cohorts enabled.
 * Looks up `req.params.id` or `req.params.campId`.
 */
const requireCohortsEnabled = async (req, res, next) => {
  try {
    const campId = req.params.id || req.params.campId;
    const camp = await fetchCampMeta(campId);
    if (!camp) {
      return res
        .status(404)
        .json({ success: false, message: "المخيم غير موجود" });
    }
    if (camp.enable_cohorts === 0) {
      return res.status(409).json({
        success: false,
        code: "COHORTS_DISABLED",
        message:
          "هذا المخيم يعمل ذاتي السرعة بدون أفواج. لا تتوفر إدارة الأفواج لهذا النوع من المخيمات.",
      });
    }
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * Block supervisor-management for camps that don't run cohorts.
 */
const requireSupervisorsEnabled = async (req, res, next) => {
  try {
    const campId = req.params.id || req.params.campId;
    const camp = await fetchCampMeta(campId);
    if (!camp) {
      return res
        .status(404)
        .json({ success: false, message: "المخيم غير موجود" });
    }
    if (camp.enable_cohorts === 0) {
      return res.status(409).json({
        success: false,
        code: "SUPERVISORS_DISABLED",
        message:
          "هذا المخيم لا يدعم نظام الإشراف. تم تصميمه ليبدأ تلقائيًا للمشترك دون إدارة.",
      });
    }
    next();
  } catch (e) {
    next(e);
  }
};

module.exports = {
  requireCohortsEnabled,
  requireSupervisorsEnabled,
};
