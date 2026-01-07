/**
 * @fileoverview Script to sync current_participants in camp_cohorts table
 * This script fixes the participants count by counting actual enrollments
 * and updating the current_participants field in camp_cohorts table
 * 
 * Run this script once to fix historical data after implementing
 * the automatic participant counting feature.
 */

const db = require('../config/database');

async function syncCohortParticipants() {
  try {
    console.log('🔄 Starting cohort participants sync...\n');

    // Get all cohorts
    const [cohorts] = await db.query(`
      SELECT DISTINCT camp_id, cohort_number 
      FROM camp_cohorts
      ORDER BY camp_id, cohort_number
    `);

    console.log(`📊 Found ${cohorts.length} cohorts to process\n`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const cohort of cohorts) {
      const { camp_id, cohort_number } = cohort;

      try {
        // Count actual enrollments (excluding supervisors)
        const [countResult] = await db.query(`
          SELECT COUNT(*) as count 
          FROM camp_enrollments ce
          WHERE ce.camp_id = ? AND ce.cohort_number = ?
          AND NOT EXISTS (
            SELECT 1 FROM camp_supervisors cs 
            WHERE cs.camp_id = ce.camp_id 
            AND (cs.cohort_number = ce.cohort_number OR cs.cohort_number IS NULL)
            AND cs.user_id = ce.user_id
          )
        `, [camp_id, cohort_number]);

        const actualCount = countResult[0]?.count || 0;

        // Update camp_cohorts table
        await db.query(`
          UPDATE camp_cohorts 
          SET current_participants = ?
          WHERE camp_id = ? AND cohort_number = ?
        `, [actualCount, camp_id, cohort_number]);

        console.log(`✅ Camp ${camp_id}, Cohort ${cohort_number}: ${actualCount} participants`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error processing Camp ${camp_id}, Cohort ${cohort_number}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 Sync Summary:');
    console.log(`   ✅ Successfully updated: ${updatedCount} cohorts`);
    console.log(`   ❌ Errors: ${errorCount} cohorts`);
    console.log('='.repeat(50));
    console.log('\n✨ Cohort participants sync completed!\n');

  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run the script
syncCohortParticipants()
  .then(() => {
    console.log('🎉 Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
