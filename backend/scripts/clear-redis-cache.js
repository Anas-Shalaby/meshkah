const redisClient = require('../utils/redisClient');

async function clearAllCache() {
  try {
    if (redisClient) {
      console.log('🔄 Clearing all Redis cache...');
      
      // Clear study hall cache
      const studyHallKeys = await redisClient.keys('study_hall:*');
      if (studyHallKeys.length > 0) {
        await redisClient.del(...studyHallKeys);
        console.log(`✅ Cleared ${studyHallKeys.length} study hall cache keys`);
      }
      
      // Clear any other cache patterns
      const allKeys = await redisClient.keys('*');
      console.log(`📊 Total cache keys: ${allKeys.length}`);
      
      if (allKeys.length > 0) {
        await redisClient.del(...allKeys);
        console.log('✅ All cache cleared successfully!');
      } else {
        console.log('ℹ️  No cache keys found');
      }
      
      process.exit(0);
    } else {
      console.log('❌ Redis client not available');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }
}

clearAllCache();
