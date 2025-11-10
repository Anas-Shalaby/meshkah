const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const db = require("../config/database");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const htmlPdf = require("html-pdf-node");
const puppeteer = require("puppeteer-core");

// دالة لتحويل النص العربي إلى اتجاه صحيح
function fixArabicText(text) {
  if (!text) return text;

  // إزالة المسافات الزائدة
  text = text.replace(/\s+/g, " ").trim();

  // إضافة مسافات مناسبة حول علامات الترقيم
  text = text.replace(/([،؛:])/g, " $1 ");
  text = text.replace(/([.!?])/g, " $1 ");

  return text;
}

// دالة لإنشاء PDF مع دعم أفضل للعربية
function createArabicPDF() {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    autoFirstPage: true,
    info: {
      Title: "ملاحظات مخيم قرآنية",
      Author: "مشكاة الأحاديث",
      Subject: "تدبرات وملاحظات قرآنية",
      Creator: "مشكاة الأحاديث",
    },
  });

  // استخدام خطوط أفضل للعربية
  try {
    // محاولة استخدام خطوط النظام التي تدعم العربية
    doc.registerFont("Arabic", "Times-Roman");
    doc.registerFont("ArabicBold", "Times-Bold");
  } catch (error) {
    console.log("Using default fonts for Arabic text");
  }

  // إعداد إضافي لتحسين عرض النص العربي
  doc._font = "Arabic";
  doc._fontSize = 12;

  // إضافة دعم أفضل للعربية
  doc._page._font = "Arabic";
  doc._page._fontSize = 12;

  return doc;
}

// دالة لكتابة النص العربي مع تنسيق أفضل
function writeArabicText(doc, text, x, y, options = {}) {
  const defaultOptions = {
    width: 500,
    align: "right",
    lineGap: 2,
    ...options,
  };

  // تحسين عرض النص العربي
  const optimizedText = optimizeArabicDisplay(text);

  // كتابة النص مع الخيارات المحددة
  doc.text(optimizedText, x, y, defaultOptions);

  return doc;
}

// دالة بديلة لكتابة النص العربي مع دعم أفضل
function writeArabicTextImproved(doc, text, x, y, options = {}) {
  if (!text) return doc;

  const defaultOptions = {
    width: 500,
    align: "right",
    lineGap: 2,
    ...options,
  };

  // تنظيف النص العربي
  const cleanText = text.replace(/\s+/g, " ").trim();

  // كتابة النص مع الخيارات المحددة
  doc.text(cleanText, x, y, defaultOptions);

  return doc;
}

// دالة لتحسين عرض النص العربي في PDF
function optimizeArabicDisplay(text) {
  if (!text) return text;

  // إزالة المسافات الزائدة
  text = text.replace(/\s+/g, " ").trim();

  // إضافة مسافات مناسبة حول علامات الترقيم العربية
  text = text.replace(/([،؛:])/g, " $1 ");
  text = text.replace(/([.!?])/g, " $1 ");

  // تحسين عرض الأرقام العربية
  text = text.replace(/(\d+)/g, " $1 ");

  // تحسين عرض النص العربي من اليمين إلى اليسار
  // text = text.split('').reverse().join('');

  return text;
}

// دالة لإنشاء PDF باستخدام PDFKit كحل بديل
async function generatePDFWithPDFKit(req, res, campData, notes, enrollment) {
  try {
    // إنشاء PDF مع دعم أفضل للعربية
    const doc = createArabicPDF();

    // إعداد response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="camp_notes_${campData[0].id}.pdf"`
    );

    // ربط PDF مع response
    doc.pipe(res);

    // إضافة محتوى PDF
    doc.font("Arabic").fontSize(20).fillColor("#8b5cf6");
    writeArabicTextImproved(doc, `ملاحظات مخيم ${campData[0].name}`, 50, 50, {
      align: "center",
    });

    doc.font("Arabic").fontSize(12).fillColor("#666");
    writeArabicTextImproved(doc, `المشترك: ${req.user.username}`, 50, 100);
    writeArabicTextImproved(
      doc,
      `تاريخ التصدير: ${new Date().toLocaleDateString("ar-SA")}`,
      50,
      120
    );
    writeArabicTextImproved(
      doc,
      `عدد المهام المكتملة: ${notes.length}`,
      50,
      140
    );

    // خط فاصل
    doc.moveTo(50, 170).lineTo(550, 170).stroke("#8b5cf6");

    let yPosition = 200;

    // إضافة الملاحظات
    notes.forEach((note, index) => {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }

      // عنوان المهمة
      doc.font("Arabic").fontSize(14).fillColor("#2c3e50");
      writeArabicTextImproved(
        doc,
        `اليوم ${note.day_number} - ${note.task_title}`,
        50,
        yPosition
      );

      yPosition += 25;

      // وصف المهمة
      if (note.task_description) {
        doc.font("Arabic").fontSize(10).fillColor("#666");
        writeArabicTextImproved(doc, note.task_description, 50, yPosition, {
          width: 500,
        });
        yPosition += 30;
      }

      // التدبر
      if (note.reflection) {
        doc.font("Arabic").fontSize(12).fillColor("#8b5cf6");
        writeArabicTextImproved(doc, "التدبر:", 50, yPosition);
        yPosition += 20;

        doc.font("Arabic").fontSize(11).fillColor("#333");
        writeArabicTextImproved(doc, note.reflection, 70, yPosition, {
          width: 480,
        });
        yPosition += 40;
      }

      // الفوائد
      if (note.benefits) {
        doc.font("Arabic").fontSize(12).fillColor("#10b981");
        writeArabicTextImproved(doc, "الفوائد المستخرجة:", 50, yPosition);
        yPosition += 20;

        doc.font("Arabic").fontSize(11).fillColor("#333");
        writeArabicTextImproved(doc, note.benefits, 70, yPosition, {
          width: 480,
        });
        yPosition += 40;
      }

      // تاريخ الإكمال
      doc.font("Arabic").fontSize(10).fillColor("#999");
      writeArabicTextImproved(
        doc,
        `تاريخ الإكمال: ${new Date(note.completed_at).toLocaleDateString(
          "ar-SA"
        )}`,
        50,
        yPosition
      );

      yPosition += 50;

      // خط فاصل بين المهام
      if (index < notes.length - 1) {
        doc
          .moveTo(50, yPosition - 20)
          .lineTo(550, yPosition - 20)
          .stroke("#e5e7eb");
      }
    });

    // إضافة تذييل
    doc.font("Arabic").fontSize(10).fillColor("#999");
    writeArabicTextImproved(
      doc,
      "تم إنشاء هذا التقرير بواسطة مشكاة الأحاديث",
      50,
      doc.page.height - 100,
      { align: "center" }
    );
    doc.text("www.hadith-shareef.com", 50, doc.page.height - 80, {
      align: "center",
    });

    doc.end();
  } catch (error) {
    console.error("Error generating PDF with PDFKit:", error);
    throw error;
  }
}

// دالة لإنشاء PDF باستخدام Puppeteer كحل بديل
async function generatePDFWithPuppeteer(
  req,
  res,
  campData,
  notes,
  enrollment,
  htmlContent
) {
  let browser;
  try {
    // إعداد Puppeteer مع إعدادات محسنة
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
      timeout: 60000,
    });

    const page = await browser.newPage();

    // إعداد الصفحة
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // إنشاء PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate:
        '<div style="font-size: 10px; text-align: center; color: #666;">صفحة <span class="pageNumber"></span> من <span class="totalPages"></span></div>',
    });

    // إعداد response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="camp_notes_${campData[0].id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF with Puppeteer:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// تصدير الملاحظات كـ PDF باستخدام HTML to PDF (دعم أفضل للعربية)
router.get("/camp/:campId/notes/pdf", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { campId } = req.params;

    // التحقق من أن المستخدم مسجل في المخيم
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ?",
      [userId, campId]
    );

    if (!enrollment.length) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بالوصول لهذا المخيم",
      });
    }

    // جلب بيانات المخيم
    const [campData] = await db.query(
      "SELECT * FROM quran_camps WHERE id = ?",
      [campId]
    );

    // جلب جميع الملاحظات والتدبرات للمستخدم في هذا المخيم
    const [notes] = await db.query(
      `SELECT 
        ctp.id,
        ctp.task_id,
        ctp.journal_entry as reflection,
        ctp.notes as benefits,
        ctp.completed_at,
        cdt.day_number,
        cdt.task_type,
        cdt.title as task_title,
        cdt.description as task_description
      FROM camp_task_progress ctp
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      WHERE ctp.enrollment_id = ? AND ctp.completed = 1
      ORDER BY cdt.day_number, ctp.completed_at`,
      [enrollment[0].id]
    );

    // إنشاء HTML content مع تصميم احترافي
    let htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>تقرير ملاحظات مخيم ${campData[0].name}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Amiri', 'Times New Roman', serif;
                margin: 0;
                padding: 30px;
                line-height: 1.6;
                color: #2c3e50;
                direction: rtl;
                text-align: right;
                background: #ffffff;
                font-size: 14px;
            }
            .report-header {
                text-align: center;
                margin-bottom: 40px;
                padding: 30px 0;
                border-bottom: 3px solid #34495e;
                position: relative;
            }
            .report-title {
                font-size: 28px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 10px;
                letter-spacing: 1px;
            }
            .report-subtitle {
                font-size: 16px;
                color: #7f8c8d;
                font-style: italic;
            }
            .report-info {
                background: #f8f9fa;
                padding: 25px;
                margin-bottom: 35px;
                border: 1px solid #e9ecef;
                border-right: 4px solid #34495e;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .info-item {
                padding: 10px 0;
                border-bottom: 1px solid #ecf0f1;
            }
            .info-label {
                font-weight: bold;
                color: #34495e;
                margin-bottom: 5px;
            }
            .info-value {
                color: #2c3e50;
            }
            .section-title {
                font-size: 20px;
                font-weight: bold;
                color: #2c3e50;
                margin: 40px 0 25px 0;
                padding-bottom: 10px;
                border-bottom: 2px solid #34495e;
                text-align: center;
            }
            .note-item {
                margin-bottom: 35px;
                padding: 25px;
                border: 1px solid #e9ecef;
                background: #ffffff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                page-break-inside: avoid;
            }
            .note-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #ecf0f1;
            }
            .note-title {
                font-size: 18px;
                font-weight: bold;
                color: #2c3e50;
            }
            .note-day {
                background: #34495e;
                color: white;
                padding: 5px 12px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: bold;
            }
            .note-description {
                color: #5d6d7e;
                margin-bottom: 20px;
                font-style: italic;
                line-height: 1.7;
            }
            .content-section {
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-right: 3px solid #34495e;
            }
            .section-label {
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 10px;
                font-size: 16px;
            }
            .section-content {
                color: #2c3e50;
                line-height: 1.7;
            }
            .completed-date {
                color: #7f8c8d;
                font-size: 12px;
                text-align: left;
                margin-top: 15px;
                font-style: italic;
            }
            .report-footer {
                text-align: center;
                margin-top: 50px;
                padding: 25px 0;
                border-top: 2px solid #34495e;
                color: #7f8c8d;
                font-size: 12px;
            }
            .footer-line {
                margin: 5px 0;
            }
            @media print {
                body { margin: 0; padding: 20px; }
                .note-item { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="report-header">
            <div class="report-title">تقرير ملاحظات المخيم</div>
            <div class="report-subtitle">${campData[0].name}</div>
        </div>
        
        <div class="report-info">
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">اسم المشترك</div>
                    <div class="info-value">${req.user.username}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">تاريخ التصدير</div>
                    <div class="info-value">${new Date().toLocaleDateString(
                      "ar-SA"
                    )}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">عدد المهام المكتملة</div>
                    <div class="info-value">${notes.length} مهمة</div>
                </div>
                <div class="info-item">
                    <div class="info-label">نوع التقرير</div>
                    <div class="info-value">ملاحظات وتدبرات قرآنية</div>
                </div>
            </div>
        </div>
        
        <div class="section-title">الملاحظات والتدبرات</div>
    `;

    // إضافة الملاحظات
    notes.forEach((note) => {
      htmlContent += `
        <div class="note-item">
            <div class="note-header">
                <div class="note-title">${note.task_title}</div>
                <div class="note-day">اليوم ${note.day_number}</div>
            </div>
            ${
              note.task_description
                ? `<div class="note-description">${note.task_description}</div>`
                : ""
            }
            ${
              note.reflection
                ? `<div class="content-section">
                    <div class="section-label">التدبر والتفكر</div>
                    <div class="section-content">${note.reflection}</div>
                   </div>`
                : ""
            }
            ${
              note.benefits
                ? `<div class="content-section">
                    <div class="section-label">الفوائد المستخرجة</div>
                    <div class="section-content">${note.benefits}</div>
                   </div>`
                : ""
            }
            <div class="completed-date">تم إكمال هذه المهمة في: ${new Date(
              note.completed_at
            ).toLocaleDateString("ar-SA")}</div>
        </div>
      `;
    });

    htmlContent += `
        <div class="report-footer">
            <div class="footer-line">تم إنشاء هذا التقرير بواسطة مشكاة الأحاديث</div>
            <div class="footer-line">www.hadith-shareef.com</div>
            <div class="footer-line">جميع الحقوق محفوظة © ${new Date().getFullYear()}</div>
        </div>
    </body>
    </html>
    `;

    // إعداد خيارات PDF مع إعدادات Chrome محسنة
    const options = {
      format: "A4",
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate:
        '<div style="font-size: 10px; text-align: center; color: #666;">صفحة <span class="pageNumber"></span> من <span class="totalPages"></span></div>',
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
      timeout: 60000, // زيادة timeout إلى 60 ثانية
    };

    // تحويل HTML إلى PDF مع معالجة الأخطاء
    let pdfBuffer;
    try {
      pdfBuffer = await htmlPdf.generatePdf({ content: htmlContent }, options);
    } catch (chromeError) {
      console.log("Chrome error, trying Puppeteer:", chromeError.message);
      try {
        // في حالة فشل Chrome، جرب Puppeteer
        return await generatePDFWithPuppeteer(
          req,
          res,
          campData,
          notes,
          enrollment,
          htmlContent
        );
      } catch (puppeteerError) {
        console.log(
          "Puppeteer error, falling back to PDFKit:",
          puppeteerError.message
        );
        // في حالة فشل Puppeteer أيضاً، استخدم PDFKit كحل بديل أخير
        return await generatePDFWithPDFKit(
          req,
          res,
          campData,
          notes,
          enrollment
        );
      }
    }

    // إعداد response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="camp_notes_${campData[0].id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إنشاء ملف PDF: " + error.message,
    });
  }
});

// تصدير الملاحظات كـ PDF باستخدام PDFKit (الطريقة القديمة)
router.get("/camp/:campId/notes/pdf-old", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { campId } = req.params;

    // التحقق من أن المستخدم مسجل في المخيم
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ?",
      [userId, campId]
    );

    if (!enrollment.length) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بالوصول لهذا المخيم",
      });
    }

    // جلب بيانات المخيم
    const [campData] = await db.query(
      "SELECT * FROM quran_camps WHERE id = ?",
      [campId]
    );

    // جلب جميع الملاحظات والتدبرات للمستخدم في هذا المخيم
    const [notes] = await db.query(
      `SELECT 
        ctp.id,
        ctp.task_id,
        ctp.journal_entry as reflection,
        ctp.notes as benefits,
        ctp.completed_at,
        cdt.day_number,
        cdt.task_type,
        cdt.title as task_title,
        cdt.description as task_description
      FROM camp_task_progress ctp
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      WHERE ctp.enrollment_id = ? AND ctp.completed = 1
      ORDER BY cdt.day_number, ctp.completed_at`,
      [enrollment[0].id]
    );

    // إنشاء PDF مع دعم أفضل للعربية
    const doc = createArabicPDF();

    // إعداد response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="camp_notes_${campData[0].id}.pdf"`
    );

    // ربط PDF مع response
    doc.pipe(res);

    // إضافة محتوى PDF
    doc.font("Arabic").fontSize(20).fillColor("#8b5cf6");
    writeArabicTextImproved(doc, `ملاحظات مخيم ${campData[0].name}`, 50, 50, {
      align: "center",
    });

    doc.font("Arabic").fontSize(12).fillColor("#666");
    writeArabicTextImproved(doc, `المشترك: ${req.user.username}`, 50, 100);
    writeArabicTextImproved(
      doc,
      `تاريخ التصدير: ${new Date().toLocaleDateString("ar-SA")}`,
      50,
      120
    );
    writeArabicTextImproved(
      doc,
      `عدد المهام المكتملة: ${notes.length}`,
      50,
      140
    );

    // خط فاصل
    doc.moveTo(50, 170).lineTo(550, 170).stroke("#8b5cf6");

    let yPosition = 200;

    // إضافة الملاحظات
    notes.forEach((note, index) => {
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }

      // عنوان المهمة
      doc.font("Arabic").fontSize(14).fillColor("#2c3e50");
      writeArabicTextImproved(
        doc,
        `اليوم ${note.day_number} - ${note.task_title}`,
        50,
        yPosition
      );

      yPosition += 25;

      // وصف المهمة
      if (note.task_description) {
        doc.font("Arabic").fontSize(10).fillColor("#666");
        writeArabicTextImproved(doc, note.task_description, 50, yPosition, {
          width: 500,
        });
        yPosition += 30;
      }

      // التدبر
      if (note.reflection) {
        doc.font("Arabic").fontSize(12).fillColor("#8b5cf6");
        writeArabicTextImproved(doc, "التدبر:", 50, yPosition);
        yPosition += 20;

        doc.font("Arabic").fontSize(11).fillColor("#333");
        writeArabicTextImproved(doc, note.reflection, 70, yPosition, {
          width: 480,
        });
        yPosition += 40;
      }

      // الفوائد
      if (note.benefits) {
        doc.font("Arabic").fontSize(12).fillColor("#10b981");
        writeArabicTextImproved(doc, 50, yPosition);
        yPosition += 20;

        doc.font("Arabic").fontSize(11).fillColor("#333");
        writeArabicTextImproved(doc, note.benefits, 70, yPosition, {
          width: 480,
        });
        yPosition += 40;
      }

      // تاريخ الإكمال
      doc.font("Arabic").fontSize(10).fillColor("#999");
      writeArabicTextImproved(
        doc,
        `تاريخ الإكمال: ${new Date(note.completed_at).toLocaleDateString(
          "ar-SA"
        )}`,
        50,
        yPosition
      );

      yPosition += 50;

      // خط فاصل بين المهام
      if (index < notes.length - 1) {
        doc
          .moveTo(50, yPosition - 20)
          .lineTo(550, yPosition - 20)
          .stroke("#e5e7eb");
      }
    });

    // إضافة تذييل
    doc.font("Arabic").fontSize(10).fillColor("#999");
    writeArabicTextImproved(
      doc,
      "تم إنشاء هذا التقرير بواسطة مشكاة الأحاديث",
      50,
      doc.page.height - 100,
      { align: "center" }
    );
    doc.text("www.hadith-shareef.com", 50, doc.page.height - 80, {
      align: "center",
    });

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إنشاء ملف PDF",
    });
  }
});

// تصدير الملاحظات كـ Excel
router.get("/camp/:campId/notes/excel", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { campId } = req.params;

    // التحقق من أن المستخدم مسجل في المخيم
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ?",
      [userId, campId]
    );

    if (!enrollment.length) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بالوصول لهذا المخيم",
      });
    }

    // جلب بيانات المخيم
    const [campData] = await db.query(
      "SELECT * FROM quran_camps WHERE id = ?",
      [campId]
    );

    // جلب جميع الملاحظات والتدبرات
    const [notes] = await db.query(
      `SELECT 
        ctp.id,
        ctp.task_id,
        ctp.journal_entry as reflection,
        ctp.notes as benefits,
        ctp.completed_at,
        cdt.day_number,
        cdt.task_type,
        cdt.title as task_title,
        cdt.description as task_description
      FROM camp_task_progress ctp
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      WHERE ctp.enrollment_id = ? AND ctp.completed = 1
      ORDER BY cdt.day_number, ctp.completed_at`,
      [enrollment[0].id]
    );

    // إنشاء Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("ملاحظات المخيم");

    // إعداد الأعمدة
    worksheet.columns = [
      { header: "اليوم", key: "day", width: 10 },
      { header: "نوع المهمة", key: "task_type", width: 15 },
      { header: "عنوان المهمة", key: "task_title", width: 30 },
      { header: "وصف المهمة", key: "task_description", width: 40 },
      { header: "التدبر", key: "reflection", width: 50 },
      { header: "الفوائد", key: "benefits", width: 50 },
      { header: "تاريخ الإكمال", key: "completed_at", width: 20 },
    ];

    // إضافة البيانات
    notes.forEach((note) => {
      worksheet.addRow({
        day: note.day_number,
        task_type: note.task_type,
        task_title: note.task_title,
        task_description: note.task_description,
        reflection: note.reflection,
        benefits: note.benefits,
        completed_at: new Date(note.completed_at).toLocaleDateString("ar-SA"),
      });
    });

    // تنسيق الجدول
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "8b5cf6" },
    };

    // تنسيق جميع الخلايا لدعم العربية
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Arial", size: 11 };
        cell.alignment = {
          horizontal: "right",
          vertical: "middle",
          wrapText: true,
        };
      });
    });

    // إضافة معلومات إضافية
    worksheet.insertRow(1, [`ملاحظات مخيم ${campData[0].name}`]);
    worksheet.insertRow(2, [`المشترك: ${req.user.username}`]);
    worksheet.insertRow(3, [
      `تاريخ التصدير: ${new Date().toLocaleDateString("ar-SA")}`,
    ]);
    worksheet.insertRow(4, [`عدد المهام المكتملة: ${notes.length}`]);
    worksheet.insertRow(5, []); // سطر فارغ

    // دمج الخلايا للعنوان
    worksheet.mergeCells("A1:G1");
    worksheet.getCell("A1").font = { bold: true, size: 16 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    // إعداد response
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="camp_notes_${campData[0].id}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إنشاء ملف Excel",
    });
  }
});

// تصدير الملاحظات كـ Word (HTML format)
router.get("/camp/:campId/notes/word", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { campId } = req.params;

    // التحقق من أن المستخدم مسجل في المخيم
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ?",
      [userId, campId]
    );

    if (!enrollment.length) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بالوصول لهذا المخيم",
      });
    }

    // جلب بيانات المخيم
    const [campData] = await db.query(
      "SELECT * FROM quran_camps WHERE id = ?",
      [campId]
    );

    // جلب جميع الملاحظات والتدبرات
    const [notes] = await db.query(
      `SELECT 
        ctp.id,
        ctp.task_id,
        ctp.journal_entry as reflection,
        ctp.notes as benefits,
        ctp.completed_at,
        cdt.day_number,
        cdt.task_type,
        cdt.title as task_title,
        cdt.description as task_description
      FROM camp_task_progress ctp
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      WHERE ctp.enrollment_id = ? AND ctp.completed = 1
      ORDER BY cdt.day_number, ctp.completed_at`,
      [enrollment[0].id]
    );

    // إنشاء HTML content
    let htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>ملاحظات مخيم ${campData[0].name}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
            body {
                font-family: 'Amiri', 'Arial', sans-serif;
                margin: 40px;
                line-height: 1.8;
                color: #333;
                direction: rtl;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                padding: 20px;
                background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                color: white;
                border-radius: 10px;
                font-family: 'Amiri', serif;
            }
            .info {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-right: 4px solid #8b5cf6;
                font-family: 'Amiri', serif;
            }
            .note-item {
                margin-bottom: 30px;
                padding: 20px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background: #fafafa;
            }
            .note-title {
                color: #8b5cf6;
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
                font-family: 'Amiri', serif;
            }
            .note-description {
                color: #666;
                margin-bottom: 15px;
                font-style: italic;
                font-family: 'Amiri', serif;
            }
            .reflection {
                background: #f0f9ff;
                padding: 15px;
                border-radius: 6px;
                border-right: 3px solid #3b82f6;
                margin-bottom: 15px;
                font-family: 'Amiri', serif;
            }
            .benefits {
                background: #f0fdf4;
                padding: 15px;
                border-radius: 6px;
                border-right: 3px solid #10b981;
                margin-bottom: 15px;
                font-family: 'Amiri', serif;
            }
            .completed-date {
                color: #999;
                font-size: 12px;
                text-align: left;
                font-family: 'Amiri', serif;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding: 20px;
                color: #666;
                border-top: 1px solid #e5e7eb;
                font-family: 'Amiri', serif;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>ملاحظات مخيم ${campData[0].name}</h1>
        </div>
        
        <div class="info">
            <p><strong>المشترك:</strong> ${req.user.username}</p>
            <p><strong>تاريخ التصدير:</strong> ${new Date().toLocaleDateString(
              "ar-SA"
            )}</p>
            <p><strong>عدد المهام المكتملة:</strong> ${notes.length}</p>
        </div>
    `;

    // إضافة الملاحظات
    notes.forEach((note) => {
      htmlContent += `
        <div class="note-item">
            <div class="note-title">اليوم ${note.day_number} - ${
        note.task_title
      }</div>
            ${
              note.task_description
                ? `<div class="note-description">${note.task_description}</div>`
                : ""
            }
            ${
              note.reflection
                ? `<div class="reflection"><strong>التدبر:</strong><br>${note.reflection}</div>`
                : ""
            }
            ${
              note.benefits
                ? `<div class="benefits"><strong>الفوائد المستخرجة:</strong><br>${note.benefits}</div>`
                : ""
            }
            <div class="completed-date">تاريخ الإكمال: ${new Date(
              note.completed_at
            ).toLocaleDateString("ar-SA")}</div>
        </div>
      `;
    });

    htmlContent += `
        <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة مشكاة الأحاديث</p>
            <p>www.hadith-shareef.com</p>
        </div>
    </body>
    </html>
    `;

    // إعداد response
    res.setHeader("Content-Type", "application/msword");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="camp_notes_${campData[0].id}.doc"`
    );
    res.send(htmlContent);
  } catch (error) {
    console.error("Error generating Word document:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إنشاء ملف Word",
    });
  }
});

// جلب إحصائيات الملاحظات
router.get("/camp/:campId/notes/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { campId } = req.params;

    // التحقق من أن المستخدم مسجل في المخيم
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ?",
      [userId, campId]
    );

    if (!enrollment.length) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بالوصول لهذا المخيم",
      });
    }

    // جلب إحصائيات الملاحظات
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_notes,
        COUNT(CASE WHEN journal_entry IS NOT NULL AND journal_entry != '' THEN 1 END) as notes_with_reflection,
        COUNT(CASE WHEN notes IS NOT NULL AND notes != '' THEN 1 END) as notes_with_benefits,
        AVG(LENGTH(journal_entry)) as avg_reflection_length,
        AVG(LENGTH(notes)) as avg_benefits_length
      FROM camp_task_progress ctp
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      WHERE ctp.enrollment_id = ? AND ctp.completed = 1`,
      [enrollment[0].id]
    );

    res.json({
      success: true,
      data: {
        totalNotes: stats[0].total_notes || 0,
        notesWithReflection: stats[0].notes_with_reflection || 0,
        notesWithBenefits: stats[0].notes_with_benefits || 0,
        avgReflectionLength: Math.round(stats[0].avg_reflection_length || 0),
        avgBenefitsLength: Math.round(stats[0].avg_benefits_length || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching notes stats:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب إحصائيات الملاحظات",
    });
  }
});

// جلب جميع الملاحظات لعرضها في الواجهة
router.get("/camp/:campId/notes/all", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { campId } = req.params;

    // التحقق من أن المستخدم مسجل في المخيم
    const [enrollment] = await db.query(
      "SELECT * FROM camp_enrollments WHERE user_id = ? AND camp_id = ?",
      [userId, campId]
    );

    if (!enrollment.length) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بالوصول لهذا المخيم",
      });
    }

    // جلب جميع الملاحظات والتدبرات للمستخدم في هذا المخيم
    const [notes] = await db.query(
      `SELECT 
        ctp.id,
        ctp.task_id,
        ctp.journal_entry as reflection,
        ctp.notes as benefits,
        ctp.completed_at,
        cdt.day_number,
        cdt.task_type,
        cdt.title as task_title,
        cdt.description as task_description
      FROM camp_task_progress ctp
      JOIN camp_daily_tasks cdt ON ctp.task_id = cdt.id
      WHERE ctp.enrollment_id = ? AND ctp.completed = 1
      ORDER BY cdt.day_number, ctp.completed_at`,
      [enrollment[0].id]
    );

    res.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error("Error fetching all notes:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الملاحظات",
    });
  }
});

module.exports = router;
