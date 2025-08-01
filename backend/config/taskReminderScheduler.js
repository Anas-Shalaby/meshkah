const cron = require("node-cron");
const db = require("../config/database");
const mailService = require("../services/mailService");

async function checkOverdueTasks() {
  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Get all users with overdue tasks
    const [usersWithOverdueTasks] = await db.query(
      `
      SELECT DISTINCT 
        u.id,
        u.email,
        u.username,
        udt.id as task_id,
        udt.hadith_id,
        udt.scheduled_date,
        h.title_ar,
        h.hadith_text_ar
      FROM users u
      JOIN user_daily_tasks udt ON u.id = udt.user_id
      JOIN hadiths h ON udt.hadith_id = h.id
      WHERE udt.scheduled_date <= ?
      AND udt.status = 'pending'
      AND udt.completed_at IS NULL
    `,
      [yesterdayStr]
    );

    // Group tasks by user
    const userTasks = usersWithOverdueTasks.reduce((acc, task) => {
      if (!acc[task.id]) {
        acc[task.id] = {
          email: task.email,
          username: task.username,
          tasks: [],
        };
      }
      acc[task.id].tasks.push({
        title_ar: task.title_ar,
        scheduled_date: task.scheduled_date,
      });
      return acc;
    }, {});

    // Send reminder emails to each user
    for (const userId in userTasks) {
      const userData = userTasks[userId];
      try {
        await mailService.sendTaskReminderEmail(
          userData.email,
          userData.username,
          userData.tasks
        );
        console.log(`Task reminder email sent to ${userData.email}`);
      } catch (error) {
        console.error(
          `Failed to send reminder email to ${userData.email}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Error in checkOverdueTasks:", error);
  }
}

function setupTaskReminders() {
  // Run every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("Running task reminder check...");
    await checkOverdueTasks();
  });
}

module.exports = {
  setupTaskReminders,
};
