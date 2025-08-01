const cron = require("node-cron");
const mailService = require("../services/mailService");

// Run daily at midnight to check Hijri date and send reminders
function setupFastingReminders() {
  cron.schedule("0 0 * * *", async () => {
    try {
      await mailService.sendFastingReminderToAllUsers();
    } catch (error) {
      console.error("Error in daily fasting reminder cron job:", error);
    }
  });
}

module.exports = {
  setupFastingReminders,
};
