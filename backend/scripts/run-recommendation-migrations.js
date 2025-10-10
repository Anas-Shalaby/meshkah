const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function runMigrations() {
  let connection;

  try {
    // إنشاء اتصال بقاعدة البيانات
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "hadith_auth",
      charset: "utf8mb4",
    });

    console.log("✅ Connected to database successfully");

    // قراءة ملف migration
    const migrationPath = path.join(
      __dirname,
      "../database/migrations/create_user_hadith_interactions.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // تقسيم الـ SQL إلى statements منفصلة
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // تنفيذ كل statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(
            `🔄 Executing statement ${i + 1}/${statements.length}...`
          );
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          if (error.code === "ER_TABLE_EXISTS_ERROR") {
            console.log(`⚠️  Table already exists, skipping...`);
          } else {
            console.error(
              `❌ Error executing statement ${i + 1}:`,
              error.message
            );
            throw error;
          }
        }
      }
    }

    console.log("🎉 All migrations completed successfully!");

    // التحقق من الجداول الجديدة
    console.log("\n📊 Verifying new tables...");
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE '%user_hadith_interactions%'"
    );
    const [tables2] = await connection.execute(
      "SHOW TABLES LIKE '%smart_recommendations%'"
    );
    const [tables3] = await connection.execute(
      "SHOW TABLES LIKE '%user_reading_patterns%'"
    );
    const [tables4] = await connection.execute(
      "SHOW TABLES LIKE '%hadith_statistics%'"
    );
    const allTables = [...tables, ...tables2, ...tables3, ...tables4];

    console.log(
      "✅ New tables created:",
      allTables.map((t) => Object.values(t)[0])
    );
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// تشغيل المigrations
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log(
        "\n🚀 Recommendation system migrations completed successfully!"
      );
      console.log("\n📋 Next steps:");
      console.log("1. Restart your backend server");
      console.log("2. The recommendation scheduler will start automatically");
      console.log("3. Test the API endpoints:");
      console.log("   - POST /api/recommendations/track-interaction");
      console.log("   - GET /api/recommendations/smart-recommendations");
      console.log("   - POST /api/recommendations/generate-recommendations");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
