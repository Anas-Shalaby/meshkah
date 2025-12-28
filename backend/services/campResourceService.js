const db = require("../config/database");
const { isAdmin } = require("../utils/permissionsHelper");

/**
 * Camp Resource Service
 * 
 * خدمة إدارة موارد المخيم
 * تحتوي على جميع دوال إدارة الموارد والتصنيفات والترتيب
 */

// ==================== RESOURCES MANAGEMENT ====================

/**
 * Get all resources for a camp (grouped by category)
 * 
 * @param {Object} params - Parameters
 * @param {number} params.campId - Camp ID
 * @returns {Promise<{status: number, body: Object}>} - Response with resources data
 */
const getCampResources = async ({ campId }) => {
  try {
    // Get all categories with their resources
    const [categories] = await db.query(
      `
      SELECT 
        crc.id,
        crc.title,
        crc.display_order,
        COUNT(cr.id) as resource_count
      FROM camp_resource_categories crc
      LEFT JOIN camp_resources cr ON cr.category_id = crc.id
      WHERE crc.camp_id = ?
      GROUP BY crc.id, crc.title, crc.display_order
      ORDER BY crc.display_order ASC, crc.created_at ASC
      `,
      [campId]
    );

    // Get resources for each category
    const categoriesWithResources = await Promise.all(
      categories.map(async (category) => {
        const [resources] = await db.query(
          `
          SELECT 
            id, title, url, resource_type, display_order, created_at
          FROM camp_resources
          WHERE category_id = ?
          ORDER BY display_order ASC, created_at ASC
          `,
          [category.id]
        );
        return {
          id: category.id,
          title: category.title,
          display_order: category.display_order,
          resources: resources,
        };
      })
    );

    // Get resources without category
    const [uncategorizedResources] = await db.query(
      `
      SELECT 
        id, title, url, resource_type, display_order, created_at
      FROM camp_resources
      WHERE camp_id = ? AND category_id IS NULL
      ORDER BY display_order ASC, created_at ASC
      `,
      [campId]
    );

    // Add uncategorized section if there are resources
    if (uncategorizedResources.length > 0) {
      categoriesWithResources.push({
        id: null,
        title: "موارد أخرى",
        display_order: 999999,
        resources: uncategorizedResources,
      });
    }

    return {
      status: 200,
      body: {
        success: true,
        data: categoriesWithResources,
      },
    };
  } catch (error) {
    console.error("Error in campResourceService.getCampResources:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء جلب الموارد",
      },
    };
  }
};

/**
 * Create a new resource for a camp
 * 
 * @param {Object} params - Parameters
 * @param {number} params.campId - Camp ID
 * @param {number} params.adminId - Admin user ID
 * @param {string} params.title - Resource title
 * @param {string} params.url - Resource URL
 * @param {string} params.resourceType - Resource type
 * @param {number} params.categoryId - Category ID (optional)
 * @param {number} params.displayOrder - Display order (optional)
 * @returns {Promise<{status: number, body: Object}>} - Response with created resource ID
 */
const createCampResource = async ({
  campId,
  adminId,
  title,
  url,
  resourceType,
  categoryId = null,
  displayOrder = null,
}) => {
  try {
    // If category_id is provided, verify it belongs to this camp
    if (categoryId) {
      const [categoryCheck] = await db.query(
        `SELECT id FROM camp_resource_categories WHERE id = ? AND camp_id = ?`,
        [categoryId, campId]
      );
      if (categoryCheck.length === 0) {
        return {
          status: 400,
          body: {
            success: false,
            message: "الفئة المحددة غير موجودة أو لا تنتمي لهذا المخيم",
          },
        };
      }
    }

    // Get max display_order for this category (or null category)
    let order = displayOrder;
    if (order === undefined || order === null) {
      const [maxOrder] = await db.query(
        `
        SELECT COALESCE(MAX(display_order), -1) + 1 as next_order
        FROM camp_resources
        WHERE camp_id = ? AND (category_id = ? OR (category_id IS NULL AND ? IS NULL))
        `,
        [campId, categoryId || null, categoryId || null]
      );
      order = maxOrder[0].next_order;
    }

    const [result] = await db.query(
      `
      INSERT INTO camp_resources (camp_id, title, url, resource_type, category_id, display_order, created_by_admin_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [campId, title, url, resourceType, categoryId || null, order, adminId]
    );

    return {
      status: 201,
      body: {
        success: true,
        message: "تمت إضافة المورد بنجاح",
        data: { id: result.insertId },
      },
    };
  } catch (error) {
    console.error("Error in campResourceService.createCampResource:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء إضافة المورد",
      },
    };
  }
};

/**
 * Update a camp resource
 * 
 * @param {Object} params - Parameters
 * @param {number} params.resourceId - Resource ID
 * @param {string} params.title - Resource title (optional)
 * @param {string} params.url - Resource URL (optional)
 * @param {string} params.resourceType - Resource type (optional)
 * @param {number} params.categoryId - Category ID (optional)
 * @param {number} params.displayOrder - Display order (optional)
 * @returns {Promise<{status: number, body: Object}>} - Response
 */
const updateCampResource = async ({
  resourceId,
  title,
  url,
  resourceType,
  categoryId,
  displayOrder,
}) => {
  try {
    // Get current resource to check camp_id
    const [currentResource] = await db.query(
      `SELECT camp_id FROM camp_resources WHERE id = ?`,
      [resourceId]
    );

    if (currentResource.length === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المورد غير موجود",
        },
      };
    }

    const campId = currentResource[0].camp_id;

    // If category_id is provided, verify it belongs to this camp
    if (categoryId !== undefined && categoryId !== null) {
      const [categoryCheck] = await db.query(
        `SELECT id FROM camp_resource_categories WHERE id = ? AND camp_id = ?`,
        [categoryId, campId]
      );
      if (categoryCheck.length === 0) {
        return {
          status: 400,
          body: {
            success: false,
            message: "الفئة المحددة غير موجودة أو لا تنتمي لهذا المخيم",
          },
        };
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push("title = ?");
      updateValues.push(title);
    }
    if (url !== undefined) {
      updateFields.push("url = ?");
      updateValues.push(url);
    }
    if (resourceType !== undefined) {
      updateFields.push("resource_type = ?");
      updateValues.push(resourceType);
    }
    if (categoryId !== undefined) {
      updateFields.push("category_id = ?");
      updateValues.push(categoryId || null);
    }
    if (displayOrder !== undefined) {
      updateFields.push("display_order = ?");
      updateValues.push(displayOrder);
    }

    if (updateFields.length === 0) {
      return {
        status: 400,
        body: {
          success: false,
          message: "لا توجد حقول للتحديث",
        },
      };
    }

    updateValues.push(resourceId);

    const [result] = await db.query(
      `
      UPDATE camp_resources 
      SET ${updateFields.join(", ")} 
      WHERE id = ?
      `,
      updateValues
    );

    if (result.affectedRows === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المورد غير موجود",
        },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        message: "تم تحديث المورد بنجاح",
      },
    };
  } catch (error) {
    console.error("Error in campResourceService.updateCampResource:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء تحديث المورد",
      },
    };
  }
};

/**
 * Delete a camp resource
 * 
 * @param {Object} params - Parameters
 * @param {number} params.resourceId - Resource ID
 * @returns {Promise<{status: number, body: Object}>} - Response
 */
const deleteCampResource = async ({ resourceId }) => {
  try {
    const [result] = await db.query(`DELETE FROM camp_resources WHERE id = ?`, [
      resourceId,
    ]);

    if (result.affectedRows === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "المورد غير موجود",
        },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        message: "تم حذف المورد بنجاح",
      },
    };
  } catch (error) {
    console.error("Error in campResourceService.deleteCampResource:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء حذف المورد",
      },
    };
  }
};

// ==================== CATEGORIES MANAGEMENT ====================

/**
 * Get all resource categories for a camp
 * 
 * @param {Object} params - Parameters
 * @param {number} params.campId - Camp ID
 * @returns {Promise<{status: number, body: Object}>} - Response with categories data
 */
const getCampResourceCategories = async ({ campId }) => {
  try {
    const [categories] = await db.query(
      `
      SELECT 
        crc.id,
        crc.title,
        crc.display_order,
        COUNT(cr.id) as resource_count
      FROM camp_resource_categories crc
      LEFT JOIN camp_resources cr ON cr.category_id = crc.id
      WHERE crc.camp_id = ?
      GROUP BY crc.id, crc.title, crc.display_order
      ORDER BY crc.display_order ASC, crc.created_at ASC
      `,
      [campId]
    );

    return {
      status: 200,
      body: {
        success: true,
        data: categories,
      },
    };
  } catch (error) {
    console.error(
      "Error in campResourceService.getCampResourceCategories:",
      error
    );
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء جلب الفئات",
      },
    };
  }
};

/**
 * Create a new resource category
 * 
 * @param {Object} params - Parameters
 * @param {number} params.campId - Camp ID
 * @param {string} params.title - Category title
 * @returns {Promise<{status: number, body: Object}>} - Response with created category ID
 */
const createCampResourceCategory = async ({ campId, title }) => {
  try {
    // Get max display_order
    const [maxOrder] = await db.query(
      `
      SELECT COALESCE(MAX(display_order), -1) + 1 as next_order
      FROM camp_resource_categories
      WHERE camp_id = ?
      `,
      [campId]
    );

    const displayOrder = maxOrder[0].next_order;

    const [result] = await db.query(
      `
      INSERT INTO camp_resource_categories (camp_id, title, display_order)
      VALUES (?, ?, ?)
      `,
      [campId, title, displayOrder]
    );

    return {
      status: 201,
      body: {
        success: true,
        message: "تمت إضافة الفئة بنجاح",
        data: { id: result.insertId },
      },
    };
  } catch (error) {
    console.error(
      "Error in campResourceService.createCampResourceCategory:",
      error
    );
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء إضافة الفئة",
      },
    };
  }
};

/**
 * Update a resource category
 * 
 * @param {Object} params - Parameters
 * @param {number} params.categoryId - Category ID
 * @param {string} params.title - Category title
 * @returns {Promise<{status: number, body: Object}>} - Response
 */
const updateCampResourceCategory = async ({ categoryId, title }) => {
  try {
    const [result] = await db.query(
      `
      UPDATE camp_resource_categories 
      SET title = ? 
      WHERE id = ?
      `,
      [title, categoryId]
    );

    if (result.affectedRows === 0) {
      return {
        status: 404,
        body: {
          success: false,
          message: "الفئة غير موجودة",
        },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        message: "تم تحديث الفئة بنجاح",
      },
    };
  } catch (error) {
    console.error(
      "Error in campResourceService.updateCampResourceCategory:",
      error
    );
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء تحديث الفئة",
      },
    };
  }
};

/**
 * Delete a resource category
 * Resources in this category will be moved to uncategorized (category_id set to NULL)
 * 
 * @param {Object} params - Parameters
 * @param {number} params.categoryId - Category ID
 * @returns {Promise<{status: number, body: Object}>} - Response
 */
const deleteCampResourceCategory = async ({ categoryId }) => {
  try {
    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Move resources to uncategorized
      await db.query(
        `
        UPDATE camp_resources 
        SET category_id = NULL 
        WHERE category_id = ?
        `,
        [categoryId]
      );

      // Delete the category
      const [result] = await db.query(
        `DELETE FROM camp_resource_categories WHERE id = ?`,
        [categoryId]
      );

      if (result.affectedRows === 0) {
        await db.query("ROLLBACK");
        return {
          status: 404,
          body: {
            success: false,
            message: "الفئة غير موجودة",
          },
        };
      }

      await db.query("COMMIT");

      return {
        status: 200,
        body: {
          success: true,
          message: "تم حذف الفئة بنجاح، تم نقل الموارد إلى قسم 'موارد أخرى'",
        },
      };
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error(
      "Error in campResourceService.deleteCampResourceCategory:",
      error
    );
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء حذف الفئة",
      },
    };
  }
};

// ==================== ORDERING MANAGEMENT ====================

/**
 * Update category order
 * 
 * @param {Object} params - Parameters
 * @param {number} params.campId - Camp ID
 * @param {Array<number>} params.categoryIds - Array of category IDs in desired order
 * @returns {Promise<{status: number, body: Object}>} - Response
 */
const updateCategoryOrder = async ({ campId, categoryIds }) => {
  try {
    if (!Array.isArray(categoryIds)) {
      return {
        status: 400,
        body: {
          success: false,
          message: "يجب إرسال قائمة بمعرفات الفئات",
        },
      };
    }

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Update display_order for each category
      for (let i = 0; i < categoryIds.length; i++) {
        await db.query(
          `
          UPDATE camp_resource_categories 
          SET display_order = ? 
          WHERE id = ? AND camp_id = ?
          `,
          [i, categoryIds[i], campId]
        );
      }

      await db.query("COMMIT");

      return {
        status: 200,
        body: {
          success: true,
          message: "تم تحديث ترتيب الفئات بنجاح",
        },
      };
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error in campResourceService.updateCategoryOrder:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء تحديث ترتيب الفئات",
      },
    };
  }
};

/**
 * Update resource order within a category
 * 
 * @param {Object} params - Parameters
 * @param {number} params.categoryId - Category ID (can be null for uncategorized)
 * @param {Array<number>} params.resourceIds - Array of resource IDs in desired order
 * @returns {Promise<{status: number, body: Object}>} - Response
 */
const updateResourceOrder = async ({ categoryId = null, resourceIds }) => {
  try {
    if (!Array.isArray(resourceIds)) {
      return {
        status: 400,
        body: {
          success: false,
          message: "يجب إرسال قائمة بمعرفات الموارد",
        },
      };
    }

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Update display_order for each resource
      for (let i = 0; i < resourceIds.length; i++) {
        await db.query(
          `
          UPDATE camp_resources 
          SET display_order = ? 
          WHERE id = ? AND (category_id = ? OR (category_id IS NULL AND ? IS NULL))
          `,
          [i, resourceIds[i], categoryId || null, categoryId || null]
        );
      }

      await db.query("COMMIT");

      return {
        status: 200,
        body: {
          success: true,
          message: "تم تحديث ترتيب الموارد بنجاح",
        },
      };
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error in campResourceService.updateResourceOrder:", error);
    return {
      status: 500,
      body: {
        success: false,
        message: "حدث خطأ أثناء تحديث ترتيب الموارد",
      },
    };
  }
};

module.exports = {
  // Resources
  getCampResources,
  createCampResource,
  updateCampResource,
  deleteCampResource,
  // Categories
  getCampResourceCategories,
  createCampResourceCategory,
  updateCampResourceCategory,
  deleteCampResourceCategory,
  // Ordering
  updateCategoryOrder,
  updateResourceOrder,
};
