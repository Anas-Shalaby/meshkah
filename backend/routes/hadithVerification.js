const express = require("express");
const router = express.Router();
const HadithVerificationController = require("../controllers/hadithVerification");

// Search for hadith verification
router.get("/search", async (req, res) => {
  try {
    const { text, source = "dorar" } = req.query;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "النص مطلوب للبحث",
      });
    }

    const result = await HadithVerificationController.search(text, source);

    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("Error in hadith verification search:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء البحث في الحديث",
      error: error.message,
    });
  }
});

// Get similar hadith from Dorar
router.get("/similar/:hadithId", async (req, res) => {
  try {
    const { hadithId } = req.params;

    const result = await HadithVerificationController.getSimilarHadith(
      hadithId
    );

    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("Error getting similar hadith:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الأحاديث المشابهة",
      error: error.message,
    });
  }
});

// Get alternate hadith from Dorar
router.get("/alternate/:hadithId", async (req, res) => {
  try {
    const { hadithId } = req.params;

    const result = await HadithVerificationController.getAlternateHadith(
      hadithId
    );

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error getting alternate hadith:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الحديث البديل",
      error: error.message,
    });
  }
});

// Get usul hadith from Dorar
router.get("/usul/:hadithId", async (req, res) => {
  try {
    const { hadithId } = req.params;

    const result = await HadithVerificationController.getUsulHadith(hadithId);

    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("Error getting usul hadith:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب أصول الحديث",
      error: error.message,
    });
  }
});

// Get hadith verification summary
router.post("/verify", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "النص مطلوب للتحقق",
      });
    }

    const verification = await HadithVerificationController.verifyHadith(text);

    res.json({
      success: true,
      data: verification,
    });
  } catch (error) {
    console.error("Error verifying hadith:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء التحقق من الحديث",
      error: error.message,
    });
  }
});

module.exports = router;
