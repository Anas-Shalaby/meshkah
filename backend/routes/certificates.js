const express = require('express');
const router = express.Router();
const path = require('path');
const CertificateService = require('../services/certificateService');
const {authMiddleware} = require('../middleware/authMiddleware');

/**
 * Generate certificate for current user
 * POST /api/certificates/generate/:campId/:cohortNumber
 */
router.post('/generate/:campId/:cohortNumber', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { campId, cohortNumber } = req.params;

    const result = await CertificateService.generateCertificate(
      userId,
      parseInt(campId),
      parseInt(cohortNumber)
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[API] Error generating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء الشهادة'
    });
  }
});

/**
 * Get my certificate for a camp
 * GET /api/certificates/my/:campId/:cohortNumber
 */
router.get('/my/:campId/:cohortNumber', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { campId, cohortNumber } = req.params;

    const result = await CertificateService.getUserCertificate(
      userId,
      parseInt(campId),
      parseInt(cohortNumber)
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[API] Error getting certificate:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الشهادة'
    });
  }
});

/**
 * Download certificate PDF
 * GET /api/certificates/download/:certificateId
 */
router.get('/download/:certificateId', authMiddleware, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;

    // Get certificate
    const result = await CertificateService.getCertificate(parseInt(certificateId));

    if (!result.success) {
      return res.status(404).json(result);
    }

    const certificate = result.certificate;

    // Verify ownership
    if (certificate.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحميل هذه الشهادة'
      });
    }

    // Send PDF file
    const filepath = path.join(__dirname, '..', certificate.pdf_path);
    res.download(filepath, `certificate-${certificate.certificate_number}.pdf`);

  } catch (error) {
    console.error('[API] Error downloading certificate:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحميل الشهادة'
    });
  }
});

/**
 * Verify certificate by verification code
 * GET /api/certificates/verify/:verificationCode
 * Public endpoint - no auth required
 */
router.get('/verify/:verificationCode', async (req, res) => {
  try {
    const { verificationCode } = req.params;

    const result = await CertificateService.verifyCertificate(verificationCode);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[API] Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في التحقق من الشهادة'
    });
  }
});

/**
 * Check eligibility for certificate
 * GET /api/certificates/eligibility/:campId/:cohortNumber
 */
router.get('/eligibility/:campId/:cohortNumber', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { campId, cohortNumber } = req.params;

    const result = await CertificateService.isEligibleForCertificate(
      userId,
      parseInt(campId),
      parseInt(cohortNumber)
    );

    res.json(result);
  } catch (error) {
    console.error('[API] Error checking eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في التحقق من الأهلية'
    });
  }
});

module.exports = router;
