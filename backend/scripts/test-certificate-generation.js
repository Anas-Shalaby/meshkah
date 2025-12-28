const Redis = require("ioredis");
const redis = new Redis();

async function test() {
  console.time("First Request (DB Simulation)");

  let data = await redis.get("user:100");

  if(data) {
    console.log("✅ Cache HIT! Data found in Redis.");
    // تحويل النص لـ Object تاني
    console.log("Data:", JSON.parse(data));
  }else {
    console.log("❌ Cache MISS. Going to Database...");
    
    // 2. محاكاة بطء الداتابيز (Sleep 2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // دي البيانات اللي جبناها من الداتابيز
    const dbData = { id: 100, name: "Anas", role: "Backend Ninja" };
    
    // 3. تخزين البيانات في الكاش (لمدة 10 ثواني بس)
    // 'EX', 10 معناها Expire after 10 seconds
    await redis.set("user:100", JSON.stringify(dbData), "EX", 10);
    
    console.log("Fetched from DB and saved to Cache.");
  }

  console.timeEnd("First Request (DB Simulation)");
  process.exit();
}

test()