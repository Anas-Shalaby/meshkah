const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// Email configuration
const transporter = nodemailer.createTransport({
  host: "serv50.onlink4it.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

// Support contact endpoint
router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message, category, priority } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "جميع الحقول مطلوبة",
      });
    }

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
      to: "Meshkah@hadith-shareef.com",
      subject: `طلب دعم جديد - ${subject}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #4f46e5; margin-bottom: 20px; text-align: center;">طلب دعم جديد</h2>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #374151; margin-bottom: 10px;">معلومات المرسل:</h3>
              <p><strong>الاسم:</strong> ${name}</p>
              <p><strong>البريد الإلكتروني:</strong> ${email}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #374151; margin-bottom: 10px;">تفاصيل الطلب:</h3>
              <p><strong>الموضوع:</strong> ${subject}</p>
              <p><strong>الفئة:</strong> ${category}</p>
              <p><strong>الأولوية:</strong> ${priority}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #374151; margin-bottom: 10px;">الرسالة:</h3>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; border-right: 4px solid #4f46e5;">
                <p style="margin: 0; line-height: 1.6;">${message}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                تم إرسال هذا الطلب من موقع مشكاة للحديث الشريف
              </p>
            </div>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Send confirmation email to user
    const confirmationMailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
      to: email,
      subject: "تأكيد استلام طلب الدعم - مشكاة",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #4f46e5; margin-bottom: 20px; text-align: center;">تم استلام طلبك بنجاح</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
             مرحبا بك يا <strong>${name}</strong>،
            </p>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              شكراً لك على التواصل معنا. لقد تم استلام طلب الدعم الخاص بك وسيتم الرد عليك في أقرب وقت ممكن.
            </p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h3 style="color: #374151; margin-bottom: 10px;">تفاصيل طلبك:</h3>
              <p><strong>الموضوع:</strong> ${subject}</p>
              <p><strong>الفئة:</strong> ${category}</p>
              <p><strong>الأولوية:</strong> ${priority}</p>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              إذا كان لديك أي استفسار إضافي، لا تتردد في التواصل معنا مرة أخرى.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                مع تحيات فريق مشكاة للحديث الشريف
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(confirmationMailOptions);

    res.json({
      success: true,
      message: "تم إرسال رسالتك بنجاح",
    });
  } catch (error) {
    console.error("Error sending support email:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إرسال الرسالة",
    });
  }
});

module.exports = router;
