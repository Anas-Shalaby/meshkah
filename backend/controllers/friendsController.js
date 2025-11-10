const db = require("../config/database");
const CampNotificationService = require("../services/campNotificationService");

// ==================== جلب كود الصحبة الخاص بالمستخدم ====================
const getMyFriendCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: campId } = req.params;

    // التحقق من صحة campId
    if (!campId || isNaN(parseInt(campId))) {
      return res.status(400).json({
        success: false,
        message: "معرف المخيم غير صحيح",
      });
    }

    // البحث عن الـ enrollment للمستخدم في هذا المخيم
    const [enrollments] = await db.query(
      `SELECT id, friend_code, camp_id 
       FROM camp_enrollments 
       WHERE user_id = ? AND camp_id = ?`,
      [userId, campId]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "أنت غير مسجل في هذا المخيم",
      });
    }

    const enrollment = enrollments[0];

    // إذا لم يكن هناك كود، قم بإنشاء واحد (للحالات القديمة)
    if (!enrollment.friend_code) {
      // Generate unique friend code
      const generateFriendCode = () => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `FC-${campId}-${timestamp}-${random}`;
      };

      let friendCode = generateFriendCode();
      let codeExists = true;
      let attempts = 0;
      const maxAttempts = 10;

      while (codeExists && attempts < maxAttempts) {
        const [existingCode] = await db.query(
          `SELECT id FROM camp_enrollments WHERE friend_code = ? AND camp_id = ?`,
          [friendCode, campId]
        );

        if (existingCode.length === 0) {
          codeExists = false;
        } else {
          friendCode = generateFriendCode();
          attempts++;
        }
      }

      if (codeExists) {
        friendCode = `FC-${campId}-${userId}-${Date.now()}`;
      }

      // تحديث الـ enrollment بالكود الجديد
      await db.query(
        `UPDATE camp_enrollments SET friend_code = ? WHERE id = ?`,
        [friendCode, enrollment.id]
      );

      enrollment.friend_code = friendCode;
    }

    res.json({
      success: true,
      data: {
        friend_code: enrollment.friend_code,
        camp_id: parseInt(campId),
      },
    });
  } catch (error) {
    console.error("Error getting friend code:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب كود الصحبة",
      error: error.message,
    });
  }
};

// ==================== إرسال طلب صداقة ====================
const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { friendCode, campId } = req.body;

    // التحقق من صحة البيانات
    if (
      !friendCode ||
      typeof friendCode !== "string" ||
      friendCode.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "كود الصحبة غير صحيح",
      });
    }

    if (!campId || isNaN(parseInt(campId))) {
      return res.status(400).json({
        success: false,
        message: "معرف المخيم غير صحيح",
      });
    }

    // البحث عن الـ enrollment الذي يطابق هذا الكود في نفس المخيم
    const [enrollments] = await db.query(
      `SELECT id, user_id, camp_id 
       FROM camp_enrollments 
       WHERE friend_code = ? AND camp_id = ?`,
      [friendCode.trim(), campId]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "كود الصحبة غير صحيح أو غير موجود في هذا المخيم",
      });
    }

    const receiverEnrollment = enrollments[0];
    const receiverId = receiverEnrollment.user_id;

    // التحقق من أن المرسل ليس المستقبل
    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "لا يمكنك إرسال طلب صداقة لنفسك",
      });
    }

    // التحقق من أن المرسل مسجل في نفس المخيم
    const [senderEnrollment] = await db.query(
      `SELECT id FROM camp_enrollments WHERE user_id = ? AND camp_id = ?`,
      [senderId, campId]
    );

    if (senderEnrollment.length === 0) {
      return res.status(403).json({
        success: false,
        message: "يجب أن تكون مسجلاً في نفس المخيم لإرسال طلب صداقة",
      });
    }

    // تحديد الترتيب الصحيح للتحقق من الصداقة
    const user1Id = Math.min(senderId, receiverId);
    const user2Id = Math.max(senderId, receiverId);

    // التحقق من وجود صداقة موجودة بالفعل في هذا المخيم
    const [existingCampFriendship] = await db.query(
      "SELECT id FROM camp_friendships WHERE camp_id = ? AND user1_id = ? AND user2_id = ?",
      [campId, user1Id, user2Id]
    );

    if (existingCampFriendship.length > 0) {
      return res.status(400).json({
        success: false,
        message: "أنتما أصدقاء بالفعل في هذا المخيم",
      });
    }

    // التحقق من وجود طلب صداقة قيد الانتظار في نفس المخيم (في أي اتجاه)
    const [existingRequest] = await db.query(
      `SELECT id, sender_id, status FROM friend_requests 
       WHERE ((sender_id = ? AND receiver_id = ?) 
          OR (sender_id = ? AND receiver_id = ?))
       AND camp_id = ?
       AND status = 'pending'`,
      [senderId, receiverId, receiverId, senderId, campId]
    );

    if (existingRequest.length > 0) {
      const request = existingRequest[0];
      if (request.sender_id === senderId) {
        return res.status(400).json({
          success: false,
          message: "لديك طلب صداقة معلق بالفعل مع هذا المستخدم في هذا المخيم",
        });
      } else {
        return res.status(400).json({
          success: false,
          message:
            "لديك طلب صداقة معلق من هذا المستخدم في هذا المخيم، يمكنك قبوله",
        });
      }
    }

    // إنشاء طلب صداقة جديد (مرتبط بالمخيم)
    const [result] = await db.query(
      "INSERT INTO friend_requests (sender_id, receiver_id, camp_id, status) VALUES (?, ?, ?, 'pending')",
      [senderId, receiverId, campId]
    );

    // جلب اسم المرسل لإرسال الإشعار
    const [senderInfo] = await db.query(
      `SELECT username FROM users WHERE id = ?`,
      [senderId]
    );
    const senderUsername =
      senderInfo.length > 0 ? senderInfo[0].username : "مستخدم";

    // إرسال إشعار للمستقبل
    await CampNotificationService.sendFriendRequestNotification(
      senderId,
      receiverId,
      campId,
      senderUsername
    );

    res.status(201).json({
      success: true,
      message: "تم إرسال طلب الصداقة بنجاح",
      data: {
        id: result.insertId,
        sender_id: senderId,
        receiver_id: receiverId,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إرسال طلب الصداقة",
      error: error.message,
    });
  }
};

// ==================== الرد على طلب صداقة (قبول أو رفض) ====================
const respondToFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = parseInt(req.params.requestId);
    const { action } = req.body; // 'accept' أو 'reject'

    // التحقق من صحة البيانات
    if (!requestId || isNaN(requestId)) {
      return res.status(400).json({
        success: false,
        message: "معرف طلب الصداقة غير صحيح",
      });
    }

    if (!action || !["accept", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "الإجراء المطلوب غير صحيح. يجب أن يكون 'accept' أو 'reject'",
      });
    }

    // جلب طلب الصداقة
    const [requests] = await db.query(
      "SELECT * FROM friend_requests WHERE id = ?",
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "طلب الصداقة غير موجود",
      });
    }

    const friendRequest = requests[0];

    // التحقق من أن المستخدم الحالي هو المستقبل
    if (friendRequest.receiver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية للرد على هذا الطلب",
      });
    }

    // التحقق من أن الطلب لا يزال معلقًا
    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `تم الرد على هذا الطلب مسبقًا (${friendRequest.status})`,
      });
    }

    // تحديث حالة الطلب
    const newStatus = action === "accept" ? "accepted" : "rejected";
    await db.query("UPDATE friend_requests SET status = ? WHERE id = ?", [
      newStatus,
      requestId,
    ]);

    const senderId = friendRequest.sender_id;
    const receiverId = friendRequest.receiver_id;

    // جلب camp_id من friend_requests (يجب أن يكون موجوداً)
    let campId = friendRequest.camp_id;

    // إذا لم يكن camp_id موجوداً في friend_requests، البحث عن مخيم مشترك (للدعم الرجعي للبيانات القديمة)
    if (!campId) {
      const [commonCamp] = await db.query(
        `SELECT ce1.camp_id 
         FROM camp_enrollments ce1
         INNER JOIN camp_enrollments ce2 ON ce1.camp_id = ce2.camp_id
         WHERE ce1.user_id = ? AND ce2.user_id = ?
         LIMIT 1`,
        [senderId, receiverId]
      );

      if (commonCamp.length === 0) {
        return res.status(400).json({
          success: false,
          message: "لا يمكن إنشاء صداقة بدون مخيم مشترك",
        });
      }

      campId = commonCamp[0].camp_id;

      // تحديث friend_requests لإضافة camp_id (للبيانات القديمة)
      await db.query("UPDATE friend_requests SET camp_id = ? WHERE id = ?", [
        campId,
        requestId,
      ]);
    }

    // جلب اسم المستقبل لإرسال الإشعار
    const [receiverInfo] = await db.query(
      `SELECT username FROM users WHERE id = ?`,
      [receiverId]
    );
    const receiverUsername =
      receiverInfo.length > 0 ? receiverInfo[0].username : "مستخدم";

    // إذا تم القبول، إنشاء سجل صداقة جديد في camp_friendships
    if (action === "accept") {
      // تحديد الترتيب الصحيح (user1_id < user2_id)
      const user1Id = Math.min(senderId, receiverId);
      const user2Id = Math.max(senderId, receiverId);

      // التحقق من عدم وجود صداقة مسبقًا في هذا المخيم (حماية إضافية)
      const [existingCampFriendship] = await db.query(
        "SELECT id FROM camp_friendships WHERE camp_id = ? AND user1_id = ? AND user2_id = ?",
        [campId, user1Id, user2Id]
      );

      if (existingCampFriendship.length === 0) {
        await db.query(
          "INSERT INTO camp_friendships (camp_id, user1_id, user2_id) VALUES (?, ?, ?)",
          [campId, user1Id, user2Id]
        );
      }
    }

    // إرسال إشعار للمرسل (سواء قبول أو رفض)
    if (campId) {
      await CampNotificationService.respondToFriendRequestNotification(
        receiverId,
        senderId,
        campId,
        action === "accept" ? "قبول" : "رفض",
        receiverUsername
      );
    }

    res.json({
      success: true,
      message:
        action === "accept"
          ? "تم قبول طلب الصداقة بنجاح"
          : "تم رفض طلب الصداقة",
      data: {
        request_id: requestId,
        status: newStatus,
      },
    });
  } catch (error) {
    console.error("Error responding to friend request:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في معالجة طلب الصداقة",
      error: error.message,
    });
  }
};

// ==================== جلب طلبات الصداقة المعلقة ====================
const getPendingFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const campId = req.query.campId ? parseInt(req.query.campId) : null;

    // بناء الاستعلام - إذا تم تمرير campId، فلتر بناءً عليه
    let query = `
      SELECT 
        fr.id,
        fr.sender_id,
        fr.receiver_id,
        fr.camp_id,
        fr.status,
        fr.created_at,
        fr.updated_at,
        sender.id as sender_id_full,
        sender.username as sender_username,
        sender.avatar_url as sender_profile_picture,
        receiver.id as receiver_id_full,
        receiver.username as receiver_username,
        receiver.avatar_url as receiver_profile_picture,
        CASE 
          WHEN fr.sender_id = ? THEN 'sent' 
          ELSE 'received' 
        END as request_type
      FROM friend_requests fr
      LEFT JOIN users sender ON fr.sender_id = sender.id
      LEFT JOIN users receiver ON fr.receiver_id = receiver.id
      WHERE (fr.sender_id = ? OR fr.receiver_id = ?)
      AND fr.status = 'pending'
    `;
    const queryParams = [userId, userId, userId];

    // إذا تم تمرير campId، فلتر بناءً عليه
    if (campId && !isNaN(campId)) {
      query += ` AND fr.camp_id = ?`;
      queryParams.push(campId);
    }

    query += ` ORDER BY fr.created_at DESC`;

    // جلب جميع طلبات الصداقة المعلقة (المرسلة والمستقبلة)
    const [requests] = await db.query(query, queryParams);

    // تقسيم الطلبات إلى مرسلة ومستقبلة
    const sentRequests = requests
      .filter((req) => req.request_type === "sent")
      .map((req) => ({
        id: req.id,
        receiver: {
          id: req.receiver_id_full,
          username: req.receiver_username,
          profile_picture: req.receiver_profile_picture,
        },
        status: req.status,
        created_at: req.created_at,
        updated_at: req.updated_at,
      }));

    const receivedRequests = requests
      .filter((req) => req.request_type === "received")
      .map((req) => ({
        id: req.id,
        sender: {
          id: req.sender_id_full,
          username: req.sender_username,
          profile_picture: req.sender_profile_picture,
        },
        status: req.status,
        created_at: req.created_at,
        updated_at: req.updated_at,
      }));

    res.json({
      success: true,
      data: {
        sent: sentRequests,
        received: receivedRequests,
        total_sent: sentRequests.length,
        total_received: receivedRequests.length,
      },
    });
  } catch (error) {
    console.error("Error fetching pending friend requests:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب طلبات الصداقة المعلقة",
      error: error.message,
    });
  }
};

// ==================== جلب قائمة الأصدقاء ====================
const getFriendsList = async (req, res) => {
  try {
    const userId = req.user.id;
    const campId = req.query.campId ? parseInt(req.query.campId) : null;

    // إذا لم يتم تمرير campId، إرجاع قائمة فارغة (الصداقات يجب أن تكون مرتبطة بمخيم)
    if (!campId || isNaN(campId)) {
      return res.status(400).json({
        success: false,
        message: "يجب تحديد معرف المخيم",
      });
    }

    // تأكيد أن المستخدم الحالي مسجل في هذا المخيم
    const [myEnrollment] = await db.query(
      `SELECT id FROM camp_enrollments WHERE user_id = ? AND camp_id = ?`,
      [userId, campId]
    );

    if (myEnrollment.length === 0) {
      return res.status(403).json({
        success: false,
        message: "يجب أن تكون مسجلاً في هذا المخيم للاطلاع على الصحبة",
      });
    }

    // جلب جميع الصداقات المرتبطة بهذا المخيم فقط
    const [campFriendships] = await db.query(
      `SELECT 
        cf.id,
        cf.user1_id,
        cf.user2_id,
        cf.created_at,
        cf.updated_at,
        CASE 
          WHEN cf.user1_id = ? THEN u2.id 
          ELSE u1.id 
        END as friend_id,
        CASE 
          WHEN cf.user1_id = ? THEN u2.username 
          ELSE u1.username 
        END as friend_username,
        CASE 
          WHEN cf.user1_id = ? THEN u2.avatar_url 
          ELSE u1.avatar_url 
        END as friend_profile_picture,
        CASE 
          WHEN cf.user1_id = ? THEN u2.email 
          ELSE u1.email 
        END as friend_email
      FROM camp_friendships cf
      LEFT JOIN users u1 ON cf.user1_id = u1.id
      LEFT JOIN users u2 ON cf.user2_id = u2.id
      WHERE cf.camp_id = ?
        AND (cf.user1_id = ? OR cf.user2_id = ?)
      ORDER BY cf.created_at DESC`,
      [userId, userId, userId, userId, campId, userId, userId]
    );

    // تحويل البيانات إلى قائمة الأصدقاء
    const friends = campFriendships.map((friendship) => ({
      id: friendship.friend_id,
      username: friendship.friend_username,
      profile_picture: friendship.friend_profile_picture,
      email: friendship.friend_email,
      friendship_created_at: friendship.created_at,
    }));

    res.json({
      success: true,
      data: {
        friends: friends,
        total: friends.length,
      },
    });
  } catch (error) {
    console.error("Error fetching friends list:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب قائمة الأصدقاء",
      error: error.message,
    });
  }
};

// ==================== إزالة صديق ====================
const removeFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = parseInt(req.params.friendId);
    const campId = req.query.campId ? parseInt(req.query.campId) : null;

    // التحقق من صحة البيانات
    if (!friendId || isNaN(friendId)) {
      return res.status(400).json({
        success: false,
        message: "معرف الصديق غير صحيح",
      });
    }

    if (!campId || isNaN(campId)) {
      return res.status(400).json({
        success: false,
        message: "يجب تحديد معرف المخيم",
      });
    }

    // التحقق من أن الصديق ليس المستخدم نفسه
    if (userId === friendId) {
      return res.status(400).json({
        success: false,
        message: "لا يمكنك إزالة نفسك من قائمة الأصدقاء",
      });
    }

    // التحقق من أن المستخدم مسجل في هذا المخيم
    const [myEnrollment] = await db.query(
      `SELECT id FROM camp_enrollments WHERE user_id = ? AND camp_id = ?`,
      [userId, campId]
    );

    if (myEnrollment.length === 0) {
      return res.status(403).json({
        success: false,
        message: "يجب أن تكون مسجلاً في هذا المخيم لإزالة صديق",
      });
    }

    // تحديد الترتيب الصحيح للبحث عن الصداقة
    const user1Id = Math.min(userId, friendId);
    const user2Id = Math.max(userId, friendId);

    // البحث عن الصداقة في هذا المخيم
    const [campFriendships] = await db.query(
      "SELECT id FROM camp_friendships WHERE camp_id = ? AND user1_id = ? AND user2_id = ?",
      [campId, user1Id, user2Id]
    );

    if (campFriendships.length === 0) {
      return res.status(404).json({
        success: false,
        message: "الصداقة غير موجودة في هذا المخيم",
      });
    }

    // حذف الصداقة من هذا المخيم فقط
    await db.query(
      "DELETE FROM camp_friendships WHERE camp_id = ? AND user1_id = ? AND user2_id = ?",
      [campId, user1Id, user2Id]
    );

    res.json({
      success: true,
      message: "تم إزالة الصديق بنجاح من هذا المخيم",
    });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في إزالة الصديق",
      error: error.message,
    });
  }
};

// ==================== جلب سجل النشاط للأصدقاء ====================
const getFriendsActivityFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    const campId = req.query.campId ? parseInt(req.query.campId) : null;

    // إذا لم يتم تمرير campId، إرجاع قائمة فارغة (النشاط يجب أن يكون مرتبط بمخيم)
    if (!campId || isNaN(campId)) {
      return res.status(400).json({
        success: false,
        message: "يجب تحديد معرف المخيم",
      });
    }

    // تأكد أن المستخدم مسجل في المخيم
    const [myEnrollment] = await db.query(
      `SELECT id FROM camp_enrollments WHERE user_id = ? AND camp_id = ?`,
      [userId, campId]
    );

    if (myEnrollment.length === 0) {
      return res.status(403).json({
        success: false,
        message: "يجب أن تكون مسجلاً في هذا المخيم للاطلاع على نشاط الصحبة",
      });
    }

    // جلب قائمة ID الأصدقاء مع تاريخ قبول الصداقة من camp_friendships (في هذا المخيم فقط)
    const [campFriendships] = await db.query(
      `SELECT 
        CASE 
          WHEN user1_id = ? THEN user2_id 
          ELSE user1_id 
        END as friend_id,
        created_at as friendship_created_at
      FROM camp_friendships
      WHERE camp_id = ? AND (user1_id = ? OR user2_id = ?)`,
      [userId, campId, userId, userId]
    );

    const friendIds = campFriendships.map((f) => f.friend_id);

    // إذا لم يكن لدى المستخدم أصدقاء في هذا المخيم، إرجاع قائمة فارغة
    if (friendIds.length === 0) {
      return res.json({
        success: true,
        data: {
          activities: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            limit: limit,
          },
        },
      });
    }

    // بناء placeholders للـ IN clause
    const placeholders = friendIds.map(() => "?").join(",");

    // جلب العدد الإجمالي للأنشطة (للـ Pagination)
    // الأنشطة يجب أن تكون بعد تاريخ قبول الصداقة
    // نستخدم JOIN مع camp_friendships للتحقق من تاريخ الصداقة لكل صديق
    const totalQuery = `
      SELECT COUNT(DISTINCT ua.id) as total
      FROM user_activity ua
      INNER JOIN camp_friendships cf ON (
        cf.camp_id = ua.camp_id
        AND (
          (cf.user1_id = ? AND cf.user2_id = ua.user_id) OR
          (cf.user2_id = ? AND cf.user1_id = ua.user_id)
        )
      )
      WHERE ua.user_id IN (${placeholders})
        AND ua.camp_id = ?
        AND ua.created_at >= cf.created_at
    `;
    const totalParams = [userId, userId, ...friendIds, campId];

    const [totalCountResult] = await db.query(totalQuery, totalParams);

    const totalItems = totalCountResult[0]?.total || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // جلب نشاط الأصدقاء للصفحة الحالية
    // الأنشطة يجب أن تكون بعد تاريخ قبول الصداقة فقط
    const query = `
      SELECT DISTINCT
        ua.id,
        ua.user_id,
        ua.camp_id,
        ua.activity_type,
        ua.details,
        ua.created_at,
        u.username,
        u.avatar_url as user_profile_picture,
        qc.name as camp_name,
        qc.surah_name
      FROM user_activity ua
      INNER JOIN camp_friendships cf ON (
        cf.camp_id = ua.camp_id
        AND (
          (cf.user1_id = ? AND cf.user2_id = ua.user_id) OR
          (cf.user2_id = ? AND cf.user1_id = ua.user_id)
        )
      )
      LEFT JOIN users u ON ua.user_id = u.id
      LEFT JOIN quran_camps qc ON ua.camp_id = qc.id
      WHERE ua.user_id IN (${placeholders})
        AND ua.camp_id = ?
        AND ua.created_at >= cf.created_at
      ORDER BY ua.created_at DESC LIMIT ? OFFSET ?
    `;

    const activityParams = [
      userId,
      userId,
      ...friendIds,
      campId,
      limit,
      offset,
    ];

    const [activities] = await db.query(query, activityParams);

    // تحويل details من JSON string إلى object وإضافة معلومات إضافية
    const formattedActivities = await Promise.all(
      activities.map(async (activity) => {
        let details = null;
        if (activity.details) {
          // إذا كان details string، نحلله، وإلا نستخدمه كما هو
          if (typeof activity.details === "string") {
            try {
              details = JSON.parse(activity.details);
            } catch (parseError) {
              console.error("Error parsing activity details:", parseError);
              details = null;
            }
          } else {
            // إذا كان بالفعل object، نستخدمه مباشرة
            details = activity.details;
          }
        }

        // معالجة خاصة لنوع نشاط joint_step_pledged
        if (activity.activity_type === "joint_step_pledged" && details) {
          // جلب اسم صاحب الفائدة الأصلي (المُلهم)
          if (details.inspirer_user_id) {
            try {
              const [inspirerUser] = await db.query(
                `SELECT username FROM users WHERE id = ?`,
                [details.inspirer_user_id]
              );
              if (inspirerUser.length > 0) {
                details.inspirer_username = inspirerUser[0].username;
              }
            } catch (error) {
              console.error("Error fetching inspirer username:", error);
            }
          }
        }

        return {
          id: activity.id,
          user: {
            id: activity.user_id,
            username: activity.username,
            profile_picture: activity.user_profile_picture,
          },
          camp: activity.camp_id
            ? {
                id: activity.camp_id,
                name: activity.camp_name,
                surah_name: activity.surah_name,
              }
            : null,
          activity_type: activity.activity_type,
          details: details,
          created_at: activity.created_at,
        };
      })
    );

    res.json({
      success: true,
      data: {
        activities: formattedActivities,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalItems,
          limit: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching friends activity feed:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ في جلب سجل النشاط",
      error: error.message,
    });
  }
};

module.exports = {
  getMyFriendCode,
  sendFriendRequest,
  respondToFriendRequest,
  getPendingFriendRequests,
  getFriendsList,
  removeFriend,
  getFriendsActivityFeed,
};
