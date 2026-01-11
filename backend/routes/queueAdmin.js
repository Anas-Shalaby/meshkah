/**
 * Notification Queue Admin Routes
 * للمشرفين لمراقبة حالة الـ Queue
 */

const express = require("express");
const router = express.Router();
const { getQueueStats, notificationQueue } = require("../services/notificationQueue");
const {authMiddleware} = require("../middleware/authMiddleware");
const { isAdmin } = require("../utils/permissionsHelper");

/**
 * GET /api/admin/queue/stats
 * الحصول على إحصائيات الـ Queue
 */
router.get("/queue/stats", authMiddleware, async (req, res) => {
  try {
    // التحقق من صلاحيات المدير
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالوصول",
      });
    }

    const stats = await getQueueStats();

    res.json({
      success: true, 
      data: {
        ...stats,
        queueName: "notifications",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching queue stats:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب إحصائيات الـ Queue",
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/queue/jobs
 * الحصول على قائمة المهام
 */
router.get("/queue/jobs", authMiddleware, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالوصول",
      });
    }

    const { status = "waiting", limit = 20 } = req.query;

    let jobs = [];
    switch (status) {
      case "waiting":
        jobs = await notificationQueue.getWaiting(0, limit - 1);
        break;
      case "active":
        jobs = await notificationQueue.getActive(0, limit - 1);
        break;
      case "completed":
        jobs = await notificationQueue.getCompleted(0, limit - 1);
        break;
      case "failed":
        jobs = await notificationQueue.getFailed(0, limit - 1);
        break;
      case "delayed":
        jobs = await notificationQueue.getDelayed(0, limit - 1);
        break;
      default:
        jobs = await notificationQueue.getWaiting(0, limit - 1);
    }

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    }));

    res.json({
      success: true,
      data: {
        status,
        count: formattedJobs.length,
        jobs: formattedJobs,
      },
    });
  } catch (error) {
    console.error("Error fetching queue jobs:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب المهام",
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/queue/retry/:jobId
 * إعادة محاولة مهمة فاشلة
 */
router.post("/queue/retry/:jobId", authMiddleware, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالوصول",
      });
    }

    const { jobId } = req.params;
    const job = await notificationQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "المهمة غير موجودة",
      });
    }

    await job.retry();

    res.json({
      success: true,
      message: "تم إعادة المهمة للمحاولة",
    });
  } catch (error) {
    console.error("Error retrying job:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إعادة المحاولة",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/queue/clean
 * تنظيف المهام القديمة
 */
router.delete("/queue/clean", authMiddleware, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "غير مصرح لك بالوصول",
      });
    }

    const { status = "completed", grace = 3600000 } = req.query; // grace: 1 hour default

    await notificationQueue.clean(parseInt(grace), parseInt(grace), status);

    res.json({
      success: true,
      message: `تم تنظيف المهام من نوع ${status}`,
    });
  } catch (error) {
    console.error("Error cleaning queue:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في تنظيف الـ Queue",
      error: error.message,
    });
  }
});

module.exports = router;
