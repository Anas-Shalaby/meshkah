const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getMyFriendCode,
  sendFriendRequest,
  respondToFriendRequest,
  getPendingFriendRequests,
  getFriendsList,
  removeFriend,
  getFriendsActivityFeed,
} = require("../controllers/friendsController");

// جميع المسارات محمية بـ authMiddleware
router.use(authMiddleware);

// إرسال طلب صداقة (يستخدم friendCode في body)
router.post("/request", sendFriendRequest);

// الرد على طلب صداقة (قبول أو رفض)
router.put("/request/:requestId", respondToFriendRequest);

// جلب طلبات الصداقة المعلقة (المرسلة والمستقبلة)
router.get("/requests/pending", getPendingFriendRequests);

// جلب قائمة الأصدقاء
router.get("/", getFriendsList);

// جلب سجل النشاط للأصدقاء
router.get("/activity-feed", getFriendsActivityFeed);

// إزالة صديق
router.delete("/:friendId", removeFriend);

module.exports = router;
