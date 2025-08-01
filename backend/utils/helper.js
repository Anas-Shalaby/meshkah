async function generateMemorizationSchedule(planId, userId) {
  const [plan] = await db.query(
    "SELECT * FROM memorization_plans WHERE id = ?",
    [planId]
  );
  const [hadiths] = await db.query(
    `SELECT h.id 
     FROM hadiths h
     JOIN collection_hadiths ch ON h.id = ch.hadith_id
     JOIN hadith_collections hc ON ch.collection_id = hc.id
     WHERE hc.name = ?
     ORDER BY ch.order_number`,
    [plan[0].collection_name]
  );

  // Calculate daily distribution
  const hadithsPerDay = Math.ceil(hadiths.length / plan[0].target_days);

  for (const hadith of hadiths) {
    await db.query(
      `INSERT INTO memorization_progress 
       (user_id, hadith_id, plan_id, status) 
       VALUES (?, ?, ?, 'new')`,
      [userId, hadith.id, planId]
    );
  }
}

async function updateStreak(userId) {
  const [currentStreak] = await db.query(
    `SELECT * FROM memorization_streaks WHERE user_id = ?`,
    [userId]
  );

  if (currentStreak.length === 0) {
    await db.query(
      `INSERT INTO memorization_streaks 
       (user_id, current_streak, longest_streak, last_activity_date)
       VALUES (?, 1, 1, CURDATE())`,
      [userId]
    );
  } else {
    const lastDate = new Date(currentStreak[0].last_activity_date);
    const today = new Date();
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      const newStreak = currentStreak[0].current_streak + 1;
      await db.query(
        `UPDATE memorization_streaks 
         SET current_streak = ?,
             longest_streak = GREATEST(longest_streak, ?),
             last_activity_date = CURDATE()
         WHERE user_id = ?`,
        [newStreak, newStreak, userId]
      );
    } else if (diffDays > 1) {
      // Streak broken
      await db.query(
        `UPDATE memorization_streaks 
         SET current_streak = 1,
             last_activity_date = CURDATE()
         WHERE user_id = ?`,
        [userId]
      );
    }
  }
}

module.exports = {
  generateMemorizationSchedule,
  updateStreak,
};
