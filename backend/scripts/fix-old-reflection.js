const db = require('../config/database');

async function fixOldReflection() {
  try {
    console.log('🔧 Updating reflection 179 to be public...\n');
    
    // Update the reflection to be public
    const [result] = await db.query(`
      UPDATE camp_task_progress 
      SET is_private = 0
      WHERE id = 179
    `);
    
    if (result.affectedRows > 0) {
      console.log('✅ Successfully updated reflection 179 to public!');
      
      // Verify the change
      const [updated] = await db.query(`
        SELECT id, is_private, journal_entry
        FROM camp_task_progress
        WHERE id = 179
      `);
      
      console.log('\n📊 Updated reflection:');
      console.log(`   ID: ${updated[0].id}`);
      console.log(`   Private: ${updated[0].is_private ? '🔒 YES' : '🌍 NO (Public)'}`);
      console.log(`   Content: ${updated[0].journal_entry.substring(0, 50)}...`);
    } else {
      console.log('⚠️  No reflection found with ID 179');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixOldReflection();
