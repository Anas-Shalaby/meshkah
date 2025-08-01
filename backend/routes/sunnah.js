const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { authMiddleware } = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const sunnahPlannerController = require("../controllers/sunnahPlannerController");

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

router.post("/planner", authMiddleware, sunnahPlannerController.addSunnahPlan);
router.get("/planner", authMiddleware, sunnahPlannerController.getSunnahPlans);
router.patch(
  "/planner/:id/status",
  authMiddleware,
  sunnahPlannerController.updateSunnahPlanStatus
);
router.put(
  "/planner/:id",
  authMiddleware,
  sunnahPlannerController.editSunnahPlan
);
router.delete(
  "/planner/:id",
  authMiddleware,
  sunnahPlannerController.deleteSunnahPlan
);

module.exports = router;
