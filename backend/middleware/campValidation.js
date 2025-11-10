const { body, validationResult } = require("express-validator");

// Validation middleware for camp creation
const validateCampCreation = [
  body("name")
    .notEmpty()
    .withMessage("اسم المخيم مطلوب")
    .isLength({ min: 3, max: 255 })
    .withMessage("اسم المخيم يجب أن يكون بين 3 و 255 حرف"),

  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("وصف المخيم يجب أن يكون أقل من 1000 حرف"),

  body("surah_number")
    .isInt({ min: 1, max: 114 })
    .withMessage("رقم السورة يجب أن يكون بين 1 و 114"),

  body("surah_name")
    .notEmpty()
    .withMessage("اسم السورة مطلوب")
    .isLength({ min: 2, max: 100 })
    .withMessage("اسم السورة يجب أن يكون بين 2 و 100 حرف"),

  body("start_date")
    .isISO8601()
    .withMessage("تاريخ البداية غير صحيح")
    .custom((value) => {
      const startDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        throw new Error("تاريخ البداية لا يمكن أن يكون في الماضي");
      }
      return true;
    }),

  body("duration_days")
    .isInt({ min: 1, max: 90 })
    .withMessage("مدة المخيم يجب أن تكون بين 1 و 90 يوم"),

  body("opening_surah_number")
    .optional()
    .isInt({ min: 1, max: 114 })
    .withMessage("رقم سورة الافتتاحية يجب أن يكون بين 1 و 114"),

  body("opening_surah_name")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("اسم سورة الافتتاحية يجب أن يكون بين 2 و 100 حرف"),

  body("opening_youtube_url")
    .optional()
    .isLength({ max: 500 })
    .withMessage("رابط فيديو الافتتاحية يجب أن يكون أقل من 500 حرف"),

  // body("banner_image")
  //   .optional()
  //   .isURL()
  //   .withMessage("رابط صورة البانر غير صحيح"),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "بيانات غير صحيحة",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }
    next();
  },
];

// Validation middleware for camp update
const validateCampUpdate = [
  body("name")
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage("اسم المخيم يجب أن يكون بين 3 و 255 حرف"),

  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("وصف المخيم يجب أن يكون أقل من 1000 حرف"),

  body("surah_number")
    .optional()
    .isInt({ min: 1, max: 114 })
    .withMessage("رقم السورة يجب أن يكون بين 1 و 114"),

  body("surah_name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("اسم السورة يجب أن يكون بين 2 و 100 حرف"),

  body("duration_days")
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage("مدة المخيم يجب أن تكون بين 1 و 90 يوم"),

  // body("banner_image")
  //   .optional()
  //   .isURL()
  //   .withMessage("رابط صورة البانر غير صحيح"),

  body("status")
    .optional()
    .isIn(["early_registration", "active", "completed", "reopened"])
    .withMessage("حالة المخيم غير صحيحة"),

  body("opening_surah_number")
    .optional()
    .isInt({ min: 1, max: 114 })
    .withMessage("رقم سورة الافتتاحية يجب أن يكون بين 1 و 114"),

  body("opening_surah_name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("اسم سورة الافتتاحية يجب أن يكون بين 2 و 100 حرف"),

  body("opening_youtube_url")
    .optional()
    .isLength({ max: 500 })
    .withMessage("رابط فيديو الافتتاحية يجب أن يكون أقل من 500 حرف"),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "بيانات غير صحيحة",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }
    next();
  },
];

// Validation middleware for daily tasks
const validateDailyTasks = [
  body("tasks").isArray({ min: 1 }).withMessage("يجب إرسال قائمة بالمهام"),

  body("tasks.*.day_number")
    .isInt({ min: 1, max: 90 })
    .withMessage("رقم اليوم يجب أن يكون بين 1 و 90"),

  body("tasks.*.task_type")
    .isIn([
      "reading",
      "memorization",
      "prayer",
      "tafseer_tabari",
      "tafseer_kathir",
      "youtube",
      "journal",
    ])
    .withMessage("نوع المهمة غير صحيح"),

  body("tasks.*.title")
    .notEmpty()
    .withMessage("عنوان المهمة مطلوب")
    .isLength({ min: 3, max: 255 })
    .withMessage("عنوان المهمة يجب أن يكون بين 3 و 255 حرف"),

  body("tasks.*.description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("وصف المهمة يجب أن يكون أقل من 1000 حرف"),

  body("tasks.*.verses_from")
    .optional()
    .isInt({ min: 1 })
    .withMessage("رقم الآية الأولى غير صحيح"),

  body("tasks.*.verses_to")
    .optional()
    .isInt({ min: 1 })
    .withMessage("رقم الآية الأخيرة غير صحيح"),

  body("tasks.*.order_in_day")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ترتيب المهمة في اليوم غير صحيح"),

  body("tasks.*.is_optional")
    .optional()
    .isBoolean()
    .withMessage("حقل المهمة الاختيارية يجب أن يكون true أو false"),

  body("tasks.*.points")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("النقاط يجب أن تكون بين 1 و 10"),

  body("tasks.*.estimated_time")
    .optional()
    .isLength({ max: 50 })
    .withMessage("الوقت المقدر يجب أن يكون أقل من 50 حرف"),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "بيانات المهام غير صحيحة",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }
    next();
  },
];

// Validation middleware for task completion
const validateTaskCompletion = [
  body("journal_entry")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("نص اليوميات يجب أن يكون أقل من 2000 حرف"),

  body("notes")
    .notEmpty()
    .withMessage("الفوائد المستخرجة مطلوبة")
    .isLength({ min: 20, max: 2000 })
    .withMessage("الفوائد المستخرجة يجب أن تكون بين 20 و 2000 حرف"),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "بيانات إكمال المهمة غير صحيحة",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }
    next();
  },
];

// Validation middleware for enrollment
const validateEnrollment = [
  body("hide_identity")
    .optional()
    .isBoolean()
    .withMessage("حقل إخفاء الهوية يجب أن يكون true أو false"),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "بيانات التسجيل غير صحيحة",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }
    next();
  },
];

// Validation middleware for camp resources
const validateCampResource = [
  body("title")
    .notEmpty()
    .withMessage("عنوان المورد مطلوب")
    .isLength({ min: 3, max: 255 })
    .withMessage("العنوان يجب أن يكون بين 3 و 255 حرفًا"),
  body("url").isURL().withMessage("يجب تقديم رابط صحيح"),
  body("resource_type")
    .isIn(["video", "pdf", "link", "audio"])
    .withMessage("نوع المورد غير صحيح"),
  body("category_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("معرف الفئة يجب أن يكون رقم صحيح"),
  body("display_order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("ترتيب العرض يجب أن يكون رقم صحيح"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "بيانات المورد غير صحيحة",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }
    next();
  },
];

// Validation middleware for camp resource categories
const validateCampResourceCategory = [
  body("title")
    .notEmpty()
    .withMessage("عنوان الفئة مطلوب")
    .isLength({ min: 2, max: 255 })
    .withMessage("العنوان يجب أن يكون بين 2 و 255 حرفًا"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "بيانات الفئة غير صحيحة",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }
    next();
  },
];

// Validation middleware for camp Q&A questions
const validateCampQuestion = [
  body("question")
    .notEmpty()
    .withMessage("نص السؤال مطلوب")
    .isLength({ min: 10, max: 2000 })
    .withMessage("السؤال يجب أن يكون بين 10 و 2000 حرف"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "بيانات السؤال غير صحيحة",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }
    next();
  },
];

// Validation middleware for camp Q&A answers
const validateCampAnswer = [
  body("answer")
    .notEmpty()
    .withMessage("نص الإجابة مطلوب")
    .isLength({ min: 10, max: 5000 })
    .withMessage("الإجابة يجب أن تكون بين 10 و 5000 حرف"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "بيانات الإجابة غير صحيحة",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }
    next();
  },
];

// Validation middleware for task groups
const validateTaskGroup = [
  body("title")
    .notEmpty()
    .withMessage("عنوان المجموعة مطلوب")
    .isLength({ min: 3, max: 255 })
    .withMessage("عنوان المجموعة يجب أن يكون بين 3 و 255 حرف"),

  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("وصف المجموعة يجب أن يكون أقل من 1000 حرف"),

  body("parent_group_id")
    .optional()
    .custom((value) => {
      // Allow null, undefined, empty string, or valid integer
      if (value === null || value === undefined || value === "") {
        return true;
      }
      // If value is provided, it must be a valid integer >= 1
      const intValue = parseInt(value);
      if (isNaN(intValue) || intValue < 1) {
        throw new Error("معرف المجموعة الأم غير صحيح");
      }
      return true;
    }),

  body("order_in_camp")
    .optional()
    .isInt({ min: 0 })
    .withMessage("ترتيب المجموعة يجب أن يكون رقم صحيح"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "بيانات المجموعة غير صحيحة",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }
    next();
  },
];

module.exports = {
  validateCampCreation,
  validateCampUpdate,
  validateDailyTasks,
  validateTaskCompletion,
  validateEnrollment,
  validateCampResource,
  validateCampResourceCategory,
  validateCampQuestion,
  validateCampAnswer,
  validateTaskGroup,
};
