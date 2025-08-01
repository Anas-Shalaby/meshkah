const nodemailer = require("nodemailer");

require("dotenv").config();
class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "serv50.onlink4it.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async completeHadithPlan(userEmail, planName) {
    try {
      const subject = "🎉 تم اكمال الخطة بنجاح!";
      const text = `مرحباً، نود إعلامك بتم اكمال الخطة بنجاح: ${planName}.`;
      const html = this.completeHadithPlanTemp(planName);

      return await this.transporter.sendMail({
        from: "Meshkah@hadith-shareef.com",
        to: userEmail,
        subject: subject,
        html: html,
      });
    } catch (error) {
      console.error("Error sending announcement email:", error);
      throw error;
    }
  }

  async sendSuccessfullySubscribeEmail(userEmail, planName) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "🎉 مرحباً بك في رحلة الحفظ مع مشكاة",
      html: `
        <div dir="rtl" style="
          font-family: 'Arabic Typography', Arial, sans-serif; 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        ">
          <!-- Header -->
          <div style="background-color: #7440EA; padding: 30px; text-align: center;">
            <img src="https://hadith-shareef.com/assets/icons/180×180.png" alt="Meshkah Logo" style="width: 120px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">مرحباً بك في رحلة الحفظ 🌟</h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #2c3e50; margin-bottom: 15px; font-size: 20px;">
                تم اشتراكك بنجاح في خطة: <span style="color: #7440EA;">${planName}</span>
              </h2>
              <p style="color: #666; line-height: 1.6; font-size: 16px;">
                نرحب بك في رحلة حفظ الأحاديث النبوية الشريفة. نحن هنا لمساعدتك في تحقيق هدفك
              </p>
            </div>

            <!-- Features Section -->
            <div style="
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
            ">
              <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 18px; text-align: center;">
                مميزات الخطة
              </h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                  <span style="color: #4CAF50; font-size: 20px;">✓</span>
                  <span style="color: #666;">متابعة يومية لحفظك</span>
                </li>
                <li style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                  <span style="color: #4CAF50; font-size: 20px;">✓</span>
                  <span style="color: #666;">اختبارات دورية للتقييم</span>
                </li>
                <li style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                  <span style="color: #4CAF50; font-size: 20px;">✓</span>
                  <span style="color: #666;">شهادات إتمام لكل مرحلة</span>
                </li>
              </ul>
            </div>

            <!-- Next Steps -->
            <div style="text-align: center; margin: 30px 0;">
              <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 18px;">
                الخطوات التالية
              </h3>
              <p style="color: #666; line-height: 1.6; font-size: 16px;">
                قم بزيارة لوحة التحكم الخاصة بك للبدء في رحلة الحفظ
              </p>
              <a href="https://hadith-shareef.com/memorization" style="
                display: inline-block;
                background-color: #7440EA;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                margin-top: 20px;
                transition: background-color 0.3s ease;
              ">
                الذهاب إلى لوحة التحكم
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #eee;
          ">
            <p style="color: #666; margin: 0; font-size: 14px;">
              © 2025 مشكاة - جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPlanCompletionEmail(userEmail, planName, quizLink) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "🎉 تهانينا! لقد أكملت خطة الحفظ بنجاح",
      html: `
        <div dir="rtl" style="
          font-family: 'Arabic Typography', Arial, sans-serif; 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        ">
          <!-- Header -->
          <div style="background-color: #7440EA; padding: 30px; text-align: center;">
            <img src="https://hadith-shareef.com/assets/icons/180×180.png" alt="Meshkah Logo" style="width: 120px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">تهانينا! 🎉</h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #2c3e50; margin-bottom: 15px; font-size: 20px;">
                لقد أكملت بنجاح خطة: <span style="color: #7440EA;">${planName}</span>
              </h2>
              <p style="color: #666; line-height: 1.6; font-size: 16px;">
                نحن فخورون بإنجازك! لتقييم مدى استفادتك من الخطة، نرجو منك إكمال هذا الاختبار القصير
              </p>
            </div>

            <!-- Quiz Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${quizLink}" style="
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                font-size: 16px;
                transition: background-color 0.3s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              ">
                ابدأ الاختبار الآن
              </a>
            </div>

            <!-- Achievement Section -->
            <div style="
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
              text-align: center;
            ">
              <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 18px;">
                إنجازاتك في هذه الخطة
              </h3>
              <div style="
                display: flex;
                justify-content: space-around;
                margin-top: 20px;
              ">
                <div>
                  <div style="
                    background-color: #7440EA;
                    color: white;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 10px;
                    font-size: 24px;
                  ">
                    📚
                  </div>
                  <p style="color: #666; margin: 0;">الأحاديث المحفوظة</p>
                </div>
                <div>
                  <div style="
                    background-color: #4CAF50;
                    color: white;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 10px;
                    font-size: 24px;
                  ">
                    ⭐
                  </div>
                  <p style="color: #666; margin: 0;">النقاط المكتسبة</p>
                </div>
              </div>
            </div>

            <!-- Next Steps -->
            <div style="text-align: center; margin: 30px 0;">
              <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 18px;">
                الخطوات التالية
              </h3>
              <p style="color: #666; line-height: 1.6; font-size: 16px;">
                يمكنك الآن:
              </p>
              <ul style="list-style: none; padding: 0; margin: 20px 0;">
                <li style="margin-bottom: 10px; color: #666;">• الحصول على شهادة إتمام الخطة</li>
                <li style="margin-bottom: 10px; color: #666;">• البدء في خطة حفظ جديدة</li>
                <li style="margin-bottom: 10px; color: #666;">• مشاركة إنجازك مع الأصدقاء</li>
              </ul>
            </div>

           
          </div>

          <!-- Footer -->
          <div style="
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #eee;
          ">
            <p style="color: #666; margin: 0; font-size: 14px;">
              © 2025 مشكاة - جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPublicCardAnnouncement(userEmail, username) {
    try {
      const subject = "🎉 أطلقنا البطاقات الدعوية في مشكاة!";
      const text = `مرحباً ${username}، نود إعلامك بإطلاق خدمة البطاقات الدعوية في مشكاة.`;
      const html = this.sendPublicCardAnnouncementTemp(username);

      return await this.transporter.sendMail({
        from: "Meshkah@hadith-shareef.com",
        to: userEmail,
        subject: subject,
        html: html,
      });
    } catch (error) {
      console.error("Error sending announcement email:", error);
      throw error;
    }
  }

  sendSuccessfullySubscribeEmailTemp = function (planName) {
    return `
      <div dir="rtl" style="
        font-family: 'Arabic Typography', Arial, sans-serif; 
        max-width: 600px; 
        margin: 0 auto; 
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      ">
        <!-- Header -->
        <div style="background-color: #7440EA; padding: 30px; text-align: center;">
          <img src="https://hadith-shareef.com/assets/icons/180×180.png" alt="مشكاة" style="width: 120px; margin-bottom: 20px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">بطاقات مشكاة الدعوية 🌟</h1>
        </div>
  
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333333;">مرحباً، نود إعلامك بتم اختيار الخطة بنجاح: ${planName}.</p>
        </div>
  
        <!-- Footer -->
        <div style="background-color: #f2f2f2; padding: 20px; text-align: center;">
          <p style="font-size: 14px; color: #777777;">&copy; 2023 مشكاة الدعوية. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    `;
  };

  completeHadithPlanTemp = function (planName) {
    return `
      <div dir="rtl" style="
        font-family: 'Arabic Typography', Arial, sans-serif; 
        max-width: 600px; 
        margin: 0 auto; 
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      ">
        <!-- Header -->
        <div style="background-color: #7440EA; padding: 30px; text-align: center;">
          <img src="https://hadith-shareef.com/assets/icons/180×180.png" alt="مشكاة" style="width: 120px; margin-bottom: 20px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">بطاقات مشكاة الدعوية 🌟</h1>
        </div>
  
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333333;">مرحباً، نود إعلامك بتم الإنتهاء من الخطة بنجاح: ${planName}.</p>
        </div>

        <div>
        </div>
  
        <!-- Footer -->
        <div style="background-color: #f2f2f2; padding: 20px; text-align: center;">
          <p style="font-size: 14px; color: #777777;">&copy; 2025 مشكاة الدعوية. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    `;
  };
  sendPublicCardAnnouncementTemp = function (username) {
    return `
      <div dir="rtl" style="
        font-family: 'Arabic Typography', Arial, sans-serif; 
        max-width: 600px; 
        margin: 0 auto; 
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      ">
        <!-- Header -->
        <div style="background-color: #7440EA; padding: 30px; text-align: center;">
          <img src="https://hadith-shareef.com/assets/icons/180×180.png" alt="مشكاة" style="width: 120px; margin-bottom: 20px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">بطاقات مشكاة الدعوية 🌟</h1>
        </div>
  
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">
            السلام عليكم ورحمة الله وبركاته
            <br>
            أهلاً بك ${username}
          </h2>
  
          <p style="color: #34495e; line-height: 1.8; margin-bottom: 25px; font-size: 18px;text-align: justify;">
            يسعدنا أن نعلن عن إطلاق خدمة البطاقات الدعوية في مشكاة! الآن يمكنك مشاركة الأحاديث النبوية الشريفة بتصاميم جميلة ومميزة على جميع منصات التواصل الاجتماعي.
          </p>
  
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">✨ مميزات البطاقات الدعوية:</h3>
            <ul style="color: #34495e; line-height: 1.8; padding-right: 20px;">
              <li>تصاميم عصرية وجذابة</li>
              <li>سهولة المشاركة على جميع المنصات</li>
              <li>خيارات متعددة للتصميم</li>
              <li>إمكانية تخصيص البطاقات</li>
            </ul>
          </div>

          <!-- QR Code Section -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">امسح الرمز للوصول السريع</h3>
            <div style="
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              display: inline-block;
            ">
              <img src="https://hadith-shareef.com/assets/icons/qr-code.png" alt="QR Code" style="
                width: 150px;
                height: 180px;
                display: block;
                margin: 0 auto;
              ">
            </div>
          </div>
  
          <div style="text-align: center; margin-bottom: 30px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">تابعونا على منصات التواصل الاجتماعي</h3>
            <div style="
              display: flex; 
              flex-direction: column; 
              gap: 10px; 
              max-width: 450px; 
              margin: 0 auto;
              padding: 0 15px;
            ">
              <div style="
                display: flex;
                gap: 15px;
                width: 100%;
                max-width: 300px;
                margin: 0 auto;
              ">
                <a href="https://x.com/mishkahcom1" style="
                  padding: 12px;
                  border-radius: 50%;
                  text-align: center;
                  width: 45px;
                  height: 45px;
                  line-height: 45px;
                ">
                  <img src="https://hadith-shareef.com/assets/icons/x.png" alt="Twitter" style="width: 20px; height: 20px; vertical-align: middle;">
                </a>
                <a href="https://facebook.com/mishkahcom1" style="
                  padding: 12px;
                  border-radius: 50%;
                  text-align: center;
                  width: 45px;
                  height: 45px;
                  line-height: 45px;
                ">
                  <img src="https://hadith-shareef.com/assets/icons/facebook.png" alt="Facebook" style="width: 20px; height: 20px; vertical-align: middle;">
                </a>
                <a href="https://whatsapp.com/channel/0029VazdI4N84OmAWA8h4S2F" style="
                  padding: 12px;
                  border-radius: 50%;
                  text-align: center;
                  width: 45px;
                  height: 45px;
                  line-height: 45px;
                ">
                  <img src="https://hadith-shareef.com/assets/icons/whatsapp.png" alt="WhatsApp" style="width: 20px; height: 20px; vertical-align: middle;">
                </a>
                <a href="https://t.me/mishkahcom1" style="
                  padding: 12px;
                  border-radius: 50%;
                  text-align: center;
                  width: 45px;
                  height: 45px;
                  line-height: 45px;
                ">
                  <img src="https://hadith-shareef.com/assets/icons/telegram.png" alt="Telegram" style="width: 20px; height: 20px; vertical-align: middle;">
                </a>
                <a href="https://instagram.com/mishkahcom1" style="
                  padding: 12px;
                 
                  border-radius: 50%;
                  text-align: center;
                  width: 45px;
                  height: 45px;
                  line-height: 45px;
                ">
                  <img src="https://hadith-shareef.com/assets/icons/instagram.png" alt="Instagram" style="width: 20px; height: 20px; vertical-align: middle;">
                </a>
              </div>
            </div>
          </div>
  
          <!-- CTA Button -->
          <div style="text-align: center;">
            <a href="https://hadith-shareef.com/public-cards" style="
              display: inline-block;
              padding: 15px 30px;
              background-color: #7440EA;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin-top: 20px;
            ">جرّب البطاقات الآن</a>
          </div>
        </div>
  
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            © 2024 مشكاة - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    `;
  };

  welcomeMessageArabic = function (username) {
    return `
    <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <h1 style="color: #2c3e50; text-align: center;">مرحبًا بك في مشكاة الحديث الشريف 🌟 أهلا يا ${username}</h1>
        
        <p style="color: #333; line-height: 1.6;">السلام عليكم ورحمة الله وبركاته،</p>
        
        <p style="color: #333; line-height: 1.6;">نرحب بك بحفاوة في منصة مشكاة، حيث تفتح لك أبواب العلم والمعرفة من خلال كنوز الحديث النبوي الشريف. هنا، ستجد مجموعة غنية ومتنوعة من الأحاديث التي ستلهمك وترشدك في رحلتك الدينية والعلمية.</p>
        
        <p style="color: #333; line-height: 1.6;">نتمنى لك رحلة مليئة بالتعلم والإلهام، وأن تجد في مشكاة ما يغني علمك ويزيد من إيمانك.</p>
        
        <p style="color: #333; line-height: 1.6;">كن على بركة الله، وبالتوفيق! 🕌📖</p>
        
        <p style="color: #2c3e50; font-weight: bold; text-align: center;">فريق مشكاة الحديث الشريف</p>
    </div>
    `;
  };

  sendFastingMessage = function (username) {
    return `
    <div dir="rtl" style="
      font-family: 'Arabic Typography', Arial, sans-serif; 
      text-align: right; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
      background-color: #f9fafb; 
      line-height: 1.6;
    ">
      <div style="
        background-color: #ffffff; 
        border: 1px solid #e5e7eb; 
        border-radius: 8px; 
        padding: 30px;
      ">
        <h2 style="
          color: #111827; 
          margin-bottom: 20px; 
          font-size: 20px;
          font-weight: 600;
        ">
          السلام عليكم، ${username}
        </h2>
  
        <p style="
          color: #4b5563; 
          margin-bottom: 15px;
          font-size: 16px;
        ">
          تذكير بصيام أيام البيض (13، 14، 15) من الشهر الهجري
        </p>
  
        <div style="
          background-color: #f3f4f6; 
          border-radius: 6px; 
          padding: 15px; 
          margin-bottom: 15px;
          font-size: 15px;
          color: #2c3e50;
          font-style: italic;
        ">
          عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ قَالَ: أَوْصَانِي خَلِيلِي صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ بِثَلاَثٍ: صِيَامِ ثَلاَثَةِ أَيَّامٍ مِنْ كُلِّ شَهْرٍ، وَرَكْعَتَيِ الضُّحَى، وَأَنْ أُوتِرَ قَبْلَ أَنْ أَنَامَ.
        </div>
  
        <p style="
          color: #4b5563; 
          margin-bottom: 15px;
          font-size: 16px;
        ">
          نسأل الله أن يتقبل صيامك ويجعله خالصًا لوجهه الكريم
        </p>
  
        <div style="
          background-color: #f3f4f6; 
          border-radius: 6px; 
          padding: 15px; 
          margin-top: 20px;
          text-align: center;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <a href="https://hadith-shareef.com/profile" style="
            display: inline-block;
            text-decoration: none;
            color: #1f2937;
            font-weight: 600;
            border: 1px solid #d1d5db;
            padding: 10px 20px;
            border-radius: 6px;
            transition: background-color 0.3s ease;
          ">
            سجل صيامك الآن
          </a>
          <a href="https://hadith-shareef.com/hadiths/137/hadith/4538" style="
            display: inline-block;
            text-decoration: none;
            color:#007bff;
            font-weight: 600;
            border: 1px solid #d1d5db;
            padding: 10px 20px;
            border-radius: 6px;
            transition: background-color 0.3s ease;
          ">
            مصدر الحديث
          </a>
        </div>
  
        <p style="
          color: #6b7280; 
          margin-top: 20px; 
          font-size: 14px;
          text-align: center;
        ">
          © 2024 مشكاة. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
    `;
  };

  sendUpdateMessage = function (username) {
    return `
    <div dir="rtl" style="font-family: 'Arabic Typesetting', Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; text-align: right;">
      <img src="https://hadith-shareef.com/file.png" alt="مشكاة الأحاديث" style="max-width: 200px; margin: 20px auto; display: block;">
      
      <h1 style="color: #2c3e50; text-align: center;">مرحبًا بكم في عالم جديد من المعرفة 📚</h1>
      
      <p style="line-height: 1.6; color: #34495e;">
        أعزائنا الأحبة في مشكاة الأحاديث،
      </p>
      
      <p style="line-height: 1.6; color: #34495e;">
        نسعد بإعلامكم بتحديثات رائعة في منصتنا:
      </p>
      
      <div style="background-color: #f7f9fc; padding: 15px; border-radius: 10px; margin: 20px 0;">
        <h2 style="color: #2980b9; margin-bottom: 10px;">✨ التحديثات الجديدة:</h2>
        
        <ul style="color: #2c3e50; line-height: 1.8;">
          <li>🎨 تصميم جديد وأنيق للواجهة</li>
          <li>🔖 نظام إشارات مطور للأحاديث المحفوظة</li>
          <li>🔍 تحسينات في البحث والاستكشاف</li>
          <li>📱 تجربة مستخدم متجاوبة على جميع الأجهزة</li>
        </ul>
      </div>
      
      <p style="line-height: 1.6; color: #34495e;">
        ميزة الإشارات الجديدة تتيح لك:
        <br>• حفظ الأحاديث بسهولة
        • إنشاء مجموعات خاصة بك
        • تتبع تقدمك في الدراسة
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://hadith-shareef.com" style="
          background-color: #3498db; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 25px; 
          display: inline-block;
          font-weight: bold;
        ">
          استكشف التحديثات الآن
        </a>
      </div>
      
      <p style="color: #7f8c8d; font-size: 0.9em; text-align: center;">
        بارك الله فيكم ورعاكم
        <br>
        فريق مشكاة الأحاديث
      </p>
    </div>
  `;
  };

  async sendMail(to, subject, text, html = null) {
    try {
      const mailOptions = {
        from: "Meshkah@hadith-shareef.com",
        to: to,
        subject: subject,
        text: text,
        html: html || text,
      };

      console.log(mailOptions);
      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
  async sendUpdateNewsletter(userEmail, username) {
    const subject =
      "تحديثات مشكاة الأحاديث: تجربة مستخدم محسّنة وميزات جديدة! 🌟";
    const text = `مرحبًا ${username}، نرحب بك في منصة مشكاة للحديث الشريف. نتمنى لك رحلة مليئة بالعلم والمعرفة.`;

    return this.sendMail(
      userEmail,
      subject,
      text,
      this.sendUpdateMessage(username)
    );
  }

  // Welcome email method
  async sendWelcomeEmail(userEmail, username) {
    const subject = "مرحبًا بك في مشكاة الحديث الشريف";
    const text = `مرحبًا ${username}، نرحب بك في منصة مشكاة للحديث الشريف. نتمنى لك رحلة مليئة بالعلم والمعرفة.`;

    return this.sendMail(
      userEmail,
      subject,
      text,
      this.welcomeMessageArabic(username)
    );
  }

  // Additional methods can be added for different types of emails
  async sendPasswordResetEmail(userEmail, resetLink) {
    const subject = "إعادة تعيين كلمة المرور";
    const text = `لقد طلبت إعادة تعيين كلمة المرور. انقر على الرابط التالي: ${resetLink}`;
    const html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
            <h2>إعادة تعيين كلمة المرور</h2>
            <p>لقد طلبت إعادة تعيين كلمة المرور. انقر على الرابط التالي للمتابعة:</p>
            <a href="${resetLink}">إعادة تعيين كلمة المرور</a>
        </div>
        `;

    return this.sendMail(userEmail, subject, text, html);
  }

  convertToArabicNumerals(arabicIndicNumber) {
    const arabicIndicToArabic = {
      "٠": "0",
      "١": "1",
      "٢": "2",
      "٣": "3",
      "٤": "4",
      "٥": "5",
      "٦": "6",
      "٧": "7",
      "٨": "8",
      "٩": "9",
    };

    return arabicIndicNumber
      .split("")
      .map((char) => arabicIndicToArabic[char] || char)
      .join("");
  }
  async sendFastingReminderToAllUsers() {
    try {
      // Get current Hijri date
      const today = moment().format("YYYY-MM-DD");

      const hijriDate = moment(today).format("iD");

      // Convert Arabic-Indic numerals to standard Arabic numerals
      let convertedHijriDate = hijriDate
        .split("")
        .map((char) => convertToArabicNumerals(char) || char)
        .join("");
      convertedHijriDate = convertedHijriDate.replace("i", "");

      // Check if current date is 13, 14, or 15 of Hijri month
      if ([13, 14, 15].includes(parseInt(convertedHijriDate))) {
        // Fetch subscribed users
        const [users] = await db.query(
          `SELECT id, email, username 
           FROM users 
           WHERE white_days_fasting_subscription = TRUE`
        );

        // Send reminder emails to each user
        for (const user of users) {
          await this.sendFastingReminderMail(user.email, user.username);
        }

        console.log(
          `Sent fasting reminders to ${users.length} subscribed users`
        );
      }
    } catch (error) {
      console.error("Error sending fasting reminders:", error);
    }
  }

  async sendFastingReminderMail(email, username) {
    const subject = "تذكير بالسنن اليومية - مشكاة الحديث الشريف";
    const trackingLink = `https://hadith-shareef.com/profile`;
    const text = `مرحبًا ${username}, تذكير بصيام الأيام البيض. يمكنك تتبع صيامك من خلال: ${trackingLink}`;

    return this.sendMail(
      email,
      subject,
      text,
      this.sendFastingMessage(username)
    );
  }

  async sendDailyHadithEmail(email, hadith) {
    try {
      const mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: email,
        subject: "الحديث اليومي من مشكاة",
        html: `
        <div dir="rtl" style="font-family: 'Tajawal', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #333;">الحديث اليومي 📖</h1>
            <p style="margin-top: 10px; color: #6c757d; font-size: 14px;">من مشكاة الحديث الشريف</p>
          </div>
          
          <div style="padding: 25px;">
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-bottom: 10px; font-size: 18px; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">عنوان الحديث</h3>
              <p style="color: #495057; font-weight: bold; line-height: 1.6;">${hadith.title_ar}</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-bottom: 10px; font-size: 18px; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">نص الحديث</h3>
              <p style="color: #495057; line-height: 1.8; font-size: 16px;">${hadith.hadith_text_ar}</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; width: 48%;">
                <h3 style="color: #333; margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">درجة الحديث</h3>
                <p style="color: #495057; font-weight: bold;">${hadith.grade_ar}</p>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; width: 48%;">
                <h3 style="color: #333; margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">رابط الحديث</h3>
                <a href='https://hadith-shareef.com/hadiths/1/hadith/${hadith.id}' style="color: #007bff; text-decoration: none; font-weight: bold;">اضغط للمزيد</a>
              </div>
            </div>
            
            <div style="text-align: center; background-color: #f8f9fa; padding: 15px; border-radius: 6px;">
              <p style="color: #333; margin: 0; font-size: 14px;">
                🌟 تأمل في الحديث، وتدبر معانيه، واجعله منهجًا في حياتك 🌟
              </p>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; color: #6c757d; text-align: center; padding: 15px; font-size: 12px; border-top: 1px solid #e0e0e0;">
            © 2024 مشكاة الحديث. كل الحقوق محفوظة.
          </div>
        </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Daily hadith email sent to ${email}`);
    } catch (error) {
      console.error("Error sending daily hadith email:", error);
    }
  }

  async sendTaskReminderEmail(userEmail, username, overdueTasks) {
    const subject = "تذكير بالمهام المتأخرة - مشكاة الحديث الشريف";
    const text = `مرحباً ${username}، لديك مهام متأخرة تحتاج إلى إكمالها.`;
    const html = `
      <div dir="rtl" style="
        font-family: 'Arabic Typography', Arial, sans-serif; 
        max-width: 600px; 
        margin: 0 auto; 
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      ">
        <!-- Header -->
        <div style="background-color: #7440EA; padding: 30px; text-align: center;">
          <img src="https://hadith-shareef.com/assets/icons/180×180.png" alt="Meshkah Logo" style="width: 120px; margin-bottom: 20px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">تذكير بالمهام المتأخرة 📚</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #2c3e50; margin-bottom: 15px; font-size: 20px;">
              مرحباً ${username}
            </h2>
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              لديك مهام متأخرة تحتاج إلى إكمالها. نرجو منك مراجعتها وإكمالها في أقرب وقت ممكن.
            </p>
          </div>

          <!-- Tasks Section -->
          <div style="
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
          ">
            <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 18px; text-align: center;">
              المهام المتأخرة
            </h3>
            ${overdueTasks
              .map(
                (task) => `
              <div style="
                background-color: #fff;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                border: 1px solid #e9ecef;
              ">
                <h4 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 16px;">
                  ${task.title_ar}
                </h4>
                <p style="color: #666; margin: 0; font-size: 14px;">
                  تاريخ الاستحقاق: ${new Date(
                    task.scheduled_date
                  ).toLocaleDateString("ar-SA")}
                </p>
              </div>
            `
              )
              .join("")}
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://hadith-shareef.com/memorization" style="
              display: inline-block;
              background-color: #7440EA;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              margin-top: 20px;
              transition: background-color 0.3s ease;
            ">
              الذهاب إلى المهام
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #eee;
        ">
          <p style="color: #666; margin: 0; font-size: 14px;">
            © 2024 مشكاة - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    `;

    return await this.sendMail(userEmail, subject, text, html);
  }
}

module.exports = new MailService();
