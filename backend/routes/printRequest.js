const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { authMiddleware, restrictTo } = require("../middleware/authMiddleware");

router.use(authMiddleware);
// Get all print requests (admin only)
router.get("/", restrictTo("admin", "vendor"), async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT 
        pr.*,
        u.username,
        u.email,
        c.title as card_title
      FROM print_requests pr
      JOIN users u ON pr.user_id = u.id
      JOIN dawah_cards c ON pr.card_id = c.id
      ORDER BY pr.created_at DESC
    `);

    res.json(requests);
  } catch (error) {
    console.error("Error fetching print requests:", error);
    res.status(500).json({ message: "خطأ في جلب طلبات الطباعة" });
  }
});

// Get user's print requests
router.get("/my-requests", async (req, res) => {
  try {
    const [requests] = await db.query(
      `
      SELECT 
        pr.*,
        c.title as card_title
      FROM print_requests pr
      JOIN dawah_cards c ON pr.card_id = c.id
      WHERE pr.user_id = ?
      ORDER BY pr.created_at DESC
    `,
      [req.user.id]
    );

    res.json(requests);
  } catch (error) {
    console.error("Error fetching user's print requests:", error);
    res.status(500).json({ message: "خطأ في جلب طلبات الطباعة" });
  }
});

// Get single print request by ID
router.get("/:id", restrictTo("admin", "vendor", "user"), async (req, res) => {
  try {
    const [requests] = await db.query(
      `
      SELECT pr.*, u.username as requester_username, u.email as requester_email, c.title as card_title
      FROM print_requests pr
      JOIN users u ON pr.user_id = u.id
      JOIN dawah_cards c ON pr.card_id = c.id
      WHERE pr.id = ?
    `,
      [req.params.id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ message: "لم يتم العثور على طلب الطباعة" });
    }

    res.json(requests[0]);
  } catch (error) {
    console.error("Error fetching print request:", error);
    res.status(500).json({ message: "خطأ في جلب طلب الطباعة" });
  }
});

// Update print request status
router.patch("/:id", restrictTo("admin", "vendor"), async (req, res) => {
  try {
    const { status } = req.body;
    const [result] = await db.query(
      "UPDATE print_requests SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "طلب الطباعة غير موجود" });
    }

    const [updatedRequest] = await db.query(
      `
      SELECT 
        pr.*,
        u.username,
        u.email,
        c.title as card_title
      FROM print_requests pr
      JOIN users u ON pr.user_id = u.id
      JOIN dawah_cards c ON pr.card_id = c.id
      WHERE pr.id = ?
    `,
      [req.params.id]
    );

    res.json(updatedRequest[0]);
  } catch (error) {
    console.error("Error updating print request:", error);
    res.status(500).json({ message: "خطأ في تحديث حالة طلب الطباعة" });
  }
});

// Create new print request
router.post("/", restrictTo("admin", "vendor", "user"), async (req, res) => {
  try {
    const {
      cardId,
      quantity,
      delivery_address,
      contact_phone,
      special_instructions,
    } = req.body;
    const [result] = await db.query(
      "INSERT INTO print_requests (user_id, card_id, quantity , delivery_address , contact_phone , special_instructions) VALUES (?, ?, ? , ? , ? , ?)",
      [
        req.user.id,
        cardId,
        quantity,
        delivery_address,
        contact_phone,
        special_instructions,
      ]
    );

    const [newRequest] = await db.query(
      `
      SELECT 
        pr.*,
        c.title as card_title
      FROM print_requests pr
      JOIN dawah_cards c ON pr.card_id = c.id
      WHERE pr.id = ?
    `,
      [result.insertId]
    );

    res.status(201).json(newRequest[0]);
  } catch (error) {
    console.error("Error creating print request:", error);
    res.status(500).json({ message: "خطأ في إنشاء طلب الطباعة" });
  }
});

module.exports = router;
