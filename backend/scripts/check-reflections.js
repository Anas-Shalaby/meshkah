const db = require('../config/database');

async function checkReflections() {
  try {
    console.log('🔍 Checking reflections for camp 24...\n');
    
    // Get all reflections for this camp (including private ones)
    const [allReflections] = await db.query(`
      SELECT 
        ctp.id,
        ctp.journal_entry,
        ctp.is_private,
        ctp.completed,
        ce.user_id,
        ce.cohort_number,
        cdt.day_number,
        cdt.title,
        u.username
      FROM camp_task_progress ctp
      JOIN camp_enrollments ce ON ctp.enrollment_id = ce.id
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      JOIN users u ON ce.user_id = u.id
      WHERE ce.camp_id = 24
        AND ctp.journal_entry IS NOT NULL
        AND ctp.journal_entry != ''
      ORDER BY ctp.created_at DESC
      LIMIT 10
    `);
    
    console.log(`Found ${allReflections.length} reflections:\n`);
    
    allReflections.forEach((r, i) => {
      console.log(`${i + 1}. User: ${r.username} (ID: ${r.user_id})`);
      console.log(`   Day: ${r.day_number} | Task: ${r.title}`);
      console.log(`   Cohort: ${r.cohort_number}`);
      console.log(`   Private: ${r.is_private ? '🔒 YES' : '🌍 NO (Public)'}`);
      console.log(`   Completed: ${r.completed ? '✅ YES' : '❌ NO'}`);
      console.log(`   Content: ${r.journal_entry.substring(0, 100)}...`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkReflections();
