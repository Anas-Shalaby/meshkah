const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { setupTaskReminders } = require("./config/taskReminderScheduler");
const CampNotificationScheduler = require("./config/campNotificationScheduler");
const FriendsDigestScheduler = require("./config/friendsDigestScheduler");
const http = require("http");
const mailService = require("./services/mailService");
const notificationRoutes = require("./routes/notification");
const aiProxyRoutes = require("./routes/aiProxy");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://hadith-shareef.com",
      "http://localhost:3000",
      "http://localhost:5173",
      "https://admin.hadith-shareef.com/",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const token = socket.handshake.auth?.token;
  let userId = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      userId =
        decoded.id ||
        decoded.userId ||
        decoded._id ||
        (decoded.user && decoded.user.id);
      if (userId) {
        const roomName = "user_" + String(userId);
        socket.join(roomName);
      }
    } catch (err) {
      console.log("JWT error:", err.message);
    }
  } else {
    console.log("No token provided for socket connection");
  }
  socket.on("disconnect", () => {
    // console.log("Socket disconnected:", socket.id);
  });
});

// Update CORS configuration
app.use(
  cors({
    origin: [
      "https://hadith-shareef.com",
      "http://localhost:3000",
      "http://localhost:5173",
      "https://admin.hadith-shareef.com/",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "x-auth-token",
      "Authorization",
      "Cache-Control",
    ],
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Serve static files with proper headers
app.use(
  "/api/uploads",
  express.static(path.join(__dirname, "public/uploads"), {
    setHeaders: (res, path) => {
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      res.set("Access-Control-Allow-Origin", "*");
    },
  })
);

// Routes
app.use("/api/auth", require("./routes/auth")); // done
// app.use("/api/print-requests", require("./routes/printRequest"));
app.use("/api/bookmarks", require("./routes/bookmarks")); // done
app.use("/api/islamic-bookmarks", require("./routes/islamicBookmarks")); // Islamic Library Bookmarks
app.use("/api/admin", require("./routes/admin"));
app.use("/api", require("./routes/card"));
app.use("/api", require("./routes/hadith"));
app.use("/api", require("./routes/search"));
app.use("/api/search-history", require("./routes/searchHistory"));
app.use("/api", notificationRoutes);
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api", require("./routes/hadithProxy"));
app.use("/api/ai", aiProxyRoutes);
app.use("/api/islamic-library", require("./routes/islamicLibrary")); // إضافة المكتبة الإسلامية
app.use("/api/auth/profile", require("./routes/profile"));
app.use("/api/support", require("./routes/support")); // إضافة نظام الدعم
app.use("/api/hadith-verification", require("./routes/hadithVerification")); // إضافة نظام التحقق من الحديث
app.use("/api/quran-camps", require("./routes/quranCamps")); // إضافة نظام المخيمات القرآنية
app.use("/api/camp-notifications", require("./routes/campNotifications")); // إضافة إشعارات المخيمات
app.use("/api/notes-export", require("./routes/notesExport")); // إضافة نظام تصدير الملاحظات
app.use("/api/friends", require("./routes/friends")); // إضافة نظام الصحبة المخصصة (الأصدقاء)
app.post("/send-welcome-email", async (req, res) => {
  try {
    const { email, username } = req.body;
    const hadith = {
      id: 1,
      title_ar: "عنوان الحديث",
      hadith_text_ar: "نص الحديث",
      grade_ar: "درجة الحديث",
    };
    await mailService.sendPublicCardAnnouncement(email, username);
    console.log(`Announcement email sent to: ${email}`); // Add logging
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to send email", message: error.message });
  }
});

// Initialize schedulers
setupTaskReminders();

// Initialize camp notification scheduler
const campNotificationScheduler = new CampNotificationScheduler();
campNotificationScheduler.start();

// Initialize friends digest scheduler
const friendsDigestScheduler = new FriendsDigestScheduler();
friendsDigestScheduler.start();

app.set("io", io);

// Existing route
app.get("/api/seerah", (req, res) => {
  res.sendFile(path.join(__dirname, "data/seerah.json"));
});

// Add this with other routes
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
