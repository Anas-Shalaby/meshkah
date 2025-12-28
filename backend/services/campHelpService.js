const db = require("../config/database");

/**
 * Helper function to get section title
 */
const getSectionTitle = (sectionId) => {
  const sectionTitles = {
    "getting-started": "البدء في المخيم",
    "journey-map": "خريطة الرحلة",
    resources: "الموارد التعليمية",
    journal: "السجل الشخصي",
    friends: "نظام الصحبة",
    "study-hall": "قاعة التدارس",
    general: "عام",
  };
  return sectionTitles[sectionId] || sectionId;
};

/**
 * Get help guide for a camp (with articles grouped by section)
 * @param {Object} params
 * @param {number} params.campId - ID of the camp
 * @returns {Promise<{status: number, body: Object}>}
 */
const getCampHelpGuide = async ({ campId }) => {
  try {
    // Check if camp exists
    const [camps] = await db.query(
      `SELECT id, name FROM quran_camps WHERE id = ?`,
      [campId]
    );

    if (camps.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المخيم غير موجود",
        },
      };
    }

    // Fetch articles from database grouped by section
    const [articles] = await db.query(
      `SELECT 
        id,
        title,
        content,
        section_id,
        display_order,
        created_at,
        updated_at
      FROM camp_help_articles
      WHERE camp_id = ?
      ORDER BY section_id, display_order ASC, created_at ASC`,
      [campId]
    );

    // Group articles by section
    const sectionsMap = new Map();
    articles.forEach((article) => {
      const sectionId = article.section_id || "general";
      if (!sectionsMap.has(sectionId)) {
        sectionsMap.set(sectionId, {
          id: sectionId,
          title: getSectionTitle(sectionId),
          articles: [],
        });
      }
      sectionsMap.get(sectionId).articles.push({
        id: article.id,
        title: article.title,
        content: article.content,
        display_order: article.display_order,
        created_at: article.created_at,
        updated_at: article.updated_at,
      });
    });

    // Convert map to array
    const sections = Array.from(sectionsMap.values());

    return {
      status: 200,
      body: {
        success: true,
        data: {
          sections: sections.length > 0 ? sections : [],
        },
      },
    };
  } catch (error) {
    console.error("Error in getCampHelpGuide:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء جلب دليل المساعدة",
        error: error.message,
      },
    };
  }
};

/**
 * Get all help articles for a camp (admin)
 * @param {Object} params
 * @param {number} params.campId
 * @param {string} [params.sectionId] - Optional section filter
 * @returns {Promise<{status: number, body: Object}>}
 */
const getCampHelpArticles = async ({ campId, sectionId }) => {
  try {
    // Check if camp exists
    const [camps] = await db.query(
      `SELECT id, name FROM quran_camps WHERE id = ?`,
      [campId]
    );

    if (camps.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المخيم غير موجود",
        },
      };
    }

    // Build query
    let query = `
      SELECT 
        id,
        camp_id,
        title,
        content,
        section_id,
        display_order,
        created_at,
        updated_at
      FROM camp_help_articles
      WHERE camp_id = ?
    `;
    const params = [campId];

    if (sectionId) {
      query += ` AND section_id = ?`;
      params.push(sectionId);
    }

    query += ` ORDER BY section_id, display_order ASC, created_at ASC`;

    const [articles] = await db.query(query, params);

    return {
      status: 200,
      body: {
        success: true,
        data: articles,
      },
    };
  } catch (error) {
    console.error("Error in getCampHelpArticles:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء جلب مقالات المساعدة",
        error: error.message,
      },
    };
  }
};

/**
 * Create a new help article (admin)
 * @param {Object} params
 * @param {number} params.campId
 * @param {string} params.title
 * @param {string} params.content
 * @param {string} [params.sectionId]
 * @param {number} [params.displayOrder]
 * @returns {Promise<{status: number, body: Object}>}
 */
const createCampHelpArticle = async ({
  campId,
  title,
  content,
  sectionId,
  displayOrder,
}) => {
  try {
    // Validation
    if (!title || title.trim().length === 0) {
      return {
        status: 400,
        body: {
          success: false,
          message: "عنوان المقال مطلوب",
        },
      };
    }

    if (!content || content.trim().length === 0) {
      return {
        status: 400,
        body: {
          success: false,
          message: "محتوى المقال مطلوب",
        },
      };
    }

    // Check if camp exists
    const [camps] = await db.query(`SELECT id FROM quran_camps WHERE id = ?`, [
      campId,
    ]);

    if (camps.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المخيم غير موجود",
        },
      };
    }

    // Insert article
    const [result] = await db.query(
      `INSERT INTO camp_help_articles 
       (camp_id, title, content, section_id, display_order) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        campId,
        title.trim(),
        content.trim(),
        sectionId || null,
        displayOrder || 0,
      ]
    );

    // Fetch created article
    const [newArticle] = await db.query(
      `SELECT * FROM camp_help_articles WHERE id = ?`,
      [result.insertId]
    );

    return {
      status: 201,
      body: {
        success: true,
        message: "تم إنشاء المقال بنجاح",
        data: newArticle[0],
      },
    };
  } catch (error) {
    console.error("Error in createCampHelpArticle:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء إنشاء المقال",
        error: error.message,
      },
    };
  }
};

/**
 * Update a help article (admin)
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.articleId
 * @param {string} [params.title]
 * @param {string} [params.content]
 * @param {string} [params.sectionId]
 * @param {number} [params.displayOrder]
 * @returns {Promise<{status: number, body: Object}>}
 */
const updateCampHelpArticle = async ({
  campId,
  articleId,
  title,
  content,
  sectionId,
  displayOrder,
}) => {
  try {
    // Check if article exists and belongs to this camp
    const [articles] = await db.query(
      `SELECT id FROM camp_help_articles WHERE id = ? AND camp_id = ?`,
      [articleId, campId]
    );

    if (articles.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المقال غير موجود",
        },
      };
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push("title = ?");
      params.push(title.trim());
    }

    if (content !== undefined) {
      updates.push("content = ?");
      params.push(content.trim());
    }

    if (sectionId !== undefined) {
      updates.push("section_id = ?");
      params.push(sectionId || null);
    }

    if (displayOrder !== undefined) {
      updates.push("display_order = ?");
      params.push(displayOrder);
    }

    // Always update updated_at
    updates.push("updated_at = NOW()");

    if (updates.length === 1) {
      // Only updated_at, no actual changes
      return {
        status: 400,
        body: {
          success: false,
          message: "لم يتم تحديث أي حقل",
        },
      };
    }

    params.push(articleId, campId);

    await db.query(
      `UPDATE camp_help_articles 
       SET ${updates.join(", ")} 
       WHERE id = ? AND camp_id = ?`,
      params
    );

    // Fetch updated article
    const [updatedArticle] = await db.query(
      `SELECT * FROM camp_help_articles WHERE id = ?`,
      [articleId]
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "تم تحديث المقال بنجاح",
        data: updatedArticle[0],
      },
    };
  } catch (error) {
    console.error("Error in updateCampHelpArticle:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء تحديث المقال",
        error: error.message,
      },
    };
  }
};

/**
 * Delete a help article (admin)
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.articleId
 * @returns {Promise<{status: number, body: Object}>}
 */
const deleteCampHelpArticle = async ({ campId, articleId }) => {
  try {
    // Check if article exists and belongs to this camp
    const [articles] = await db.query(
      `SELECT id FROM camp_help_articles WHERE id = ? AND camp_id = ?`,
      [articleId, campId]
    );

    if (articles.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المقال غير موجود",
        },
      };
    }

    await db.query(
      `DELETE FROM camp_help_articles WHERE id = ? AND camp_id = ?`,
      [articleId, campId]
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "تم حذف المقال بنجاح",
      },
    };
  } catch (error) {
    console.error("Error in deleteCampHelpArticle:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء حذف المقال",
        error: error.message,
      },
    };
  }
};

/**
 * Get FAQ for a camp
 * @param {Object} params
 * @param {number} params.campId
 * @param {string} [params.category] - Optional category filter
 * @returns {Promise<{status: number, body: Object}>}
 */
const getCampHelpFAQ = async ({ campId, category }) => {
  try {
    // Check if camp exists
    const [camps] = await db.query(
      `SELECT id, name FROM quran_camps WHERE id = ?`,
      [campId]
    );

    if (camps.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المخيم غير موجود",
        },
      };
    }

    // Build query with optional category filter
    let query = `
      SELECT 
        id,
        question,
        answer,
        category,
        display_order,
        created_at,
        updated_at
      FROM camp_help_faq
      WHERE camp_id = ?
    `;
    const params = [campId];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    query += ` ORDER BY category, display_order ASC, created_at ASC`;

    const [faqItems] = await db.query(query, params);

    // Format response
    const faqContent = faqItems.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      category: item.category || null,
      display_order: item.display_order,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return {
      status: 200,
      body: {
        success: true,
        data: faqContent,
      },
    };
  } catch (error) {
    console.error("Error in getCampHelpFAQ:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء جلب الأسئلة الشائعة",
        error: error.message,
      },
    };
  }
};

/**
 * Get all FAQ items for a camp (admin)
 * @param {Object} params
 * @param {number} params.campId
 * @param {string} [params.category] - Optional category filter
 * @returns {Promise<{status: number, body: Object}>}
 */
const getCampHelpFAQAdmin = async ({ campId, category }) => {
  try {
    // Check if camp exists
    const [camps] = await db.query(
      `SELECT id, name FROM quran_camps WHERE id = ?`,
      [campId]
    );

    if (camps.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المخيم غير موجود",
        },
      };
    }

    // Build query
    let query = `
      SELECT 
        id,
        camp_id,
        question,
        answer,
        category,
        display_order,
        created_at,
        updated_at
      FROM camp_help_faq
      WHERE camp_id = ?
    `;
    const params = [campId];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    query += ` ORDER BY category, display_order ASC, created_at ASC`;

    const [faqItems] = await db.query(query, params);

    return {
      status: 200,
      body: {
        success: true,
        data: faqItems,
      },
    };
  } catch (error) {
    console.error("Error in getCampHelpFAQAdmin:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء جلب الأسئلة الشائعة",
        error: error.message,
      },
    };
  }
};

/**
 * Create a new FAQ item (admin)
 * @param {Object} params
 * @param {number} params.campId
 * @param {string} params.question
 * @param {string} params.answer
 * @param {string} [params.category]
 * @param {number} [params.displayOrder]
 * @returns {Promise<{status: number, body: Object}>}
 */
const createCampHelpFAQ = async ({
  campId,
  question,
  answer,
  category,
  displayOrder,
}) => {
  try {
    // Validation
    if (!question || question.trim().length === 0) {
      return {
        status: 400,
        body: {
          success: false,
          message: "السؤال مطلوب",
        },
      };
    }

    if (!answer || answer.trim().length === 0) {
      return {
        status: 400,
        body: {
          success: false,
          message: "الإجابة مطلوبة",
        },
      };
    }

    // Check if camp exists
    const [camps] = await db.query(`SELECT id FROM quran_camps WHERE id = ?`, [
      campId,
    ]);

    if (camps.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المخيم غير موجود",
        },
      };
    }

    // Insert FAQ
    const [result] = await db.query(
      `INSERT INTO camp_help_faq 
       (camp_id, question, answer, category, display_order) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        campId,
        question.trim(),
        answer.trim(),
        category || null,
        displayOrder || 0,
      ]
    );

    // Fetch created FAQ
    const [newFAQ] = await db.query(
      `SELECT * FROM camp_help_faq WHERE id = ?`,
      [result.insertId]
    );

    return {
      status: 201,
      body: {
        success: true,
        message: "تم إنشاء السؤال الشائع بنجاح",
        data: newFAQ[0],
      },
    };
  } catch (error) {
    console.error("Error in createCampHelpFAQ:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء إنشاء السؤال الشائع",
        error: error.message,
      },
    };
  }
};

/**
 * Update a FAQ item (admin)
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.faqId
 * @param {string} [params.question]
 * @param {string} [params.answer]
 * @param {string} [params.category]
 * @param {number} [params.displayOrder]
 * @returns {Promise<{status: number, body: Object}>}
 */
const updateCampHelpFAQ = async ({
  campId,
  faqId,
  question,
  answer,
  category,
  displayOrder,
}) => {
  try {
    // Check if FAQ exists and belongs to this camp
    const [faqs] = await db.query(
      `SELECT id FROM camp_help_faq WHERE id = ? AND camp_id = ?`,
      [faqId, campId]
    );

    if (faqs.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "السؤال الشائع غير موجود",
        },
      };
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (question !== undefined) {
      updates.push("question = ?");
      params.push(question.trim());
    }

    if (answer !== undefined) {
      updates.push("answer = ?");
      params.push(answer.trim());
    }

    if (category !== undefined) {
      updates.push("category = ?");
      params.push(category || null);
    }

    if (displayOrder !== undefined) {
      updates.push("display_order = ?");
      params.push(displayOrder);
    }

    // Always update updated_at
    updates.push("updated_at = NOW()");

    if (updates.length === 1) {
      // Only updated_at, no actual changes
      return {
        status: 400,
        body: {
          success: false,
          message: "لم يتم تحديث أي حقل",
        },
      };
    }

    params.push(faqId, campId);

    await db.query(
      `UPDATE camp_help_faq 
       SET ${updates.join(", ")} 
       WHERE id = ? AND camp_id = ?`,
      params
    );

    // Fetch updated FAQ
    const [updatedFAQ] = await db.query(
      `SELECT * FROM camp_help_faq WHERE id = ?`,
      [faqId]
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "تم تحديث السؤال الشائع بنجاح",
        data: updatedFAQ[0],
      },
    };
  } catch (error) {
    console.error("Error in updateCampHelpFAQ:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء تحديث السؤال الشائع",
        error: error.message,
      },
    };
  }
};

/**
 * Delete a FAQ item (admin)
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} params.faqId
 * @returns {Promise<{status: number, body: Object}>}
 */
const deleteCampHelpFAQ = async ({ campId, faqId }) => {
  try {
    // Check if FAQ exists and belongs to this camp
    const [faqs] = await db.query(
      `SELECT id FROM camp_help_faq WHERE id = ? AND camp_id = ?`,
      [faqId, campId]
    );

    if (faqs.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "السؤال الشائع غير موجود",
        },
      };
    }

    await db.query(`DELETE FROM camp_help_faq WHERE id = ? AND camp_id = ?`, [
      faqId,
      campId,
    ]);

    return {
      status: 200,
      body: {
        success: true,
        message: "تم حذف السؤال الشائع بنجاح",
      },
    };
  } catch (error) {
    console.error("Error in deleteCampHelpFAQ:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء حذف السؤال الشائع",
        error: error.message,
      },
    };
  }
};

/**
 * Submit help feedback
 * @param {Object} params
 * @param {number} params.campId
 * @param {number} [params.userId] - Optional user ID
 * @param {string} params.feedback
 * @param {number} [params.rating] - Optional rating (1-5)
 * @param {string} [params.category]
 * @returns {Promise<{status: number, body: Object}>}
 */
const submitHelpFeedback = async ({
  campId,
  userId,
  feedback,
  rating,
  category,
}) => {
  try {
    if (!feedback || feedback.trim().length === 0) {
      return {
        status: 400,
        body: {
          success: false,
          message: "يرجى إدخال الملاحظات",
        },
      };
    }

    // Validate rating if provided (should be 1-5)
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return {
        status: 400,
        body: {
          success: false,
          message: "يجب أن يكون التقييم بين 1 و 5",
        },
      };
    }

    // Insert feedback
    const [result] = await db.query(
      `INSERT INTO camp_help_feedback 
       (camp_id, user_id, feedback, rating, category, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [
        campId,
        userId || null,
        feedback.trim(),
        rating || null,
        category || null,
      ]
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "شكراً لك على ملاحظاتك!",
        data: {
          feedback_id: result.insertId,
        },
      },
    };
  } catch (error) {
    console.error("Error in submitHelpFeedback:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء إرسال الملاحظات",
        error: error.message,
      },
    };
  }
};

module.exports = {
  getCampHelpGuide,
  getCampHelpArticles,
  createCampHelpArticle,
  updateCampHelpArticle,
  deleteCampHelpArticle,
  getCampHelpFAQ,
  getCampHelpFAQAdmin,
  createCampHelpFAQ,
  updateCampHelpFAQ,
  deleteCampHelpFAQ,
  submitHelpFeedback,
};
