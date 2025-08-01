const db = require("../config/database");
const { google } = require("googleapis");
const axios = require("axios");
// Helper function to update Google Calendar event
async function updateGoogleCalendarEvent(eventId, updatedData, oauthTokens) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oAuth2Client.setCredentials(oauthTokens);

  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    resource: updatedData,
  });
}

// Helper function to create Google Calendar event
async function createGoogleCalendarEvent(eventData, oauthTokens) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oAuth2Client.setCredentials(oauthTokens);

  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: eventData,
  });

  return response.data.id; // Return the event ID
}

// Helper function to refresh Google access token
async function refreshGoogleToken(refreshToken) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oAuth2Client.refreshAccessToken();
  return credentials;
}

// Add a new sunnah plan
exports.addSunnahPlan = async (req, res) => {
  try {
    const { hadithId, startDate, repeatType, note } = req.body;
    const userId = req.user.id;

    if (!hadithId || !startDate || !repeatType) {
      return res.status(400).json({ message: "جميع الحقول مطلوبة" });
    }

    const hadith = await axios.get(
      "https://hadeethenc.com/api/v1/hadeeths/one/",
      {
        params: {
          language: "ar",
          id: hadithId,
        },
      }
    );
    if (!hadith) {
      return res.status(404).json({ message: "الحديث غير موجود" });
    }

    // تحويل startDate من ISO إلى MySQL DATETIME إذا لزم الأمر
    let mysqlDate = startDate;
    if (startDate && startDate.includes("T")) {
      mysqlDate = startDate.replace("T", " ").replace("Z", "").split(".")[0];
    }

    // إضافة السنّة في قاعدة البيانات أولاً
    const [result] = await db.query(
      `INSERT INTO sunnah_plans (user_id, hadith_id, start_datetime, repeat_type, note) VALUES (?, ?, ?, ?, ?)`,
      [userId, hadithId, mysqlDate, repeatType, note || null]
    );

    const planId = result.insertId;
    let googleEventId = null;

    // محاولة إضافة الحدث في Google Calendar
    try {
      // جلب توكنات Google للمستخدم
      const [users] = await db.query(
        "SELECT google_access_token, google_refresh_token, google_token_expiry FROM users WHERE id = ?",
        [userId]
      );

      if (
        users.length > 0 &&
        users[0].google_access_token &&
        users[0].google_refresh_token
      ) {
        let accessToken = users[0].google_access_token;
        let refreshToken = users[0].google_refresh_token;

        // التحقق من انتهاء صلاحية التوكن
        if (
          users[0].google_token_expiry &&
          new Date() > new Date(users[0].google_token_expiry)
        ) {
          // تجديد التوكن
          const newCredentials = await refreshGoogleToken(refreshToken);
          accessToken = newCredentials.access_token;

          // تحديث التوكنات في قاعدة البيانات
          await db.query(
            "UPDATE users SET google_access_token = ?, google_token_expiry = ? WHERE id = ?",
            [accessToken, newCredentials.expiry_date, userId]
          );
        }

        // إنشاء بيانات الحدث
        const eventData = {
          summary: note || "سنة من سنن النبي ﷺ",
          description: hadith.data.hadeeth || "سنة من سنن النبي ﷺ",
          start: {
            dateTime: new Date(startDate).toISOString(),
            timeZone: "Asia/Riyadh",
          },
          end: {
            dateTime: new Date(
              new Date(startDate).getTime() + 30 * 60 * 1000
            ).toISOString(), // +30 دقيقة
            timeZone: "Asia/Riyadh",
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "popup", minutes: 15 },
              { method: "email", minutes: 60 },
            ],
          },
        };

        // إضافة تكرار إذا كان مطلوب
        if (repeatType !== "once") {
          eventData.recurrence = [
            repeatType === "daily"
              ? "RRULE:FREQ=DAILY"
              : repeatType === "weekly"
              ? "RRULE:FREQ=WEEKLY"
              : repeatType === "monthly"
              ? "RRULE:FREQ=MONTHLY"
              : "",
          ];
        }

        // إنشاء الحدث في Google Calendar
        googleEventId = await createGoogleCalendarEvent(eventData, {
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        // تحديث السنّة بالـ event ID
        await db.query(
          "UPDATE sunnah_plans SET google_event_id = ? WHERE id = ?",
          [googleEventId, planId]
        );
      }
    } catch (googleError) {
      console.error("Google Calendar error:", googleError);
      // لا نوقف العملية إذا فشل Google Calendar، السنّة تم حفظها في قاعدة البيانات
    }

    res.status(201).json({
      success: true,
      id: planId,
      googleEventId: googleEventId,
      message: googleEventId
        ? "تم إضافة السنّة وربطها بجوجل كالندر"
        : "تم إضافة السنّة بنجاح",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في إضافة السنّة" });
  }
};

// Get all sunnah plans for the logged-in user
exports.getSunnahPlans = async (req, res) => {
  try {
    const userId = req.user.id;
    const [plans] = await db.query(
      `SELECT sp.*, h.hadith_text_ar AS hadith, h.title_ar AS hadith_title FROM sunnah_plans sp JOIN hadiths h ON sp.hadith_id = h.id WHERE sp.user_id = ? ORDER BY sp.start_datetime DESC`,
      [userId]
    );
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في جلب السنن" });
  }
};

// Update status (done/pending)
exports.updateSunnahPlanStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;
    if (!["pending", "done"].includes(status)) {
      return res.status(400).json({ message: "حالة غير صالحة" });
    }
    const [result] = await db.query(
      `UPDATE sunnah_plans SET status = ? WHERE id = ? AND user_id = ?`,
      [status, id, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "لم يتم العثور على السنّة" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في تحديث الحالة" });
  }
};

// edit sunnah
exports.editSunnahPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { hadithId, startDate, repeatType, note } = req.body;

    // تحقق من وجود السنّة
    const [plans] = await db.query(
      "SELECT * FROM sunnah_plans WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (plans.length === 0) {
      return res.status(404).json({ message: "لم يتم العثور على السنّة" });
    }

    // تحويل startDate من ISO إلى MySQL DATETIME إذا لزم الأمر
    let mysqlDate = startDate;
    if (startDate && startDate.includes("T")) {
      mysqlDate = startDate.replace("T", " ").replace("Z", "").split(".")[0];
    }

    // التعديل في قاعدة البيانات
    await db.query(
      `UPDATE sunnah_plans SET hadith_id = ?, start_datetime = ?, repeat_type = ?, note = ? WHERE id = ? AND user_id = ?`,
      [hadithId, mysqlDate, repeatType, note || null, id, userId]
    );
    const hadith = await axios.get(
      "https://hadeethenc.com/api/v1/hadeeths/one/",
      {
        params: {
          language: "ar",
          id: hadithId,
        },
      }
    );
    if (!hadith) {
      return res.status(404).json({ message: "الحديث غير موجود" });
    }
    // تحديث الحدث في Google Calendar إذا كان مرتبط
    const plan = plans[0];
    if (plan.google_event_id) {
      try {
        // جلب توكنات Google للمستخدم
        const [users] = await db.query(
          "SELECT google_access_token, google_refresh_token, google_token_expiry FROM users WHERE id = ?",
          [userId]
        );

        if (
          users.length > 0 &&
          users[0].google_access_token &&
          users[0].google_refresh_token
        ) {
          let accessToken = users[0].google_access_token;
          let refreshToken = users[0].google_refresh_token;

          // التحقق من انتهاء صلاحية التوكن
          if (
            users[0].google_token_expiry &&
            new Date() > new Date(users[0].google_token_expiry)
          ) {
            const newCredentials = await refreshGoogleToken(refreshToken);
            accessToken = newCredentials.access_token;

            await db.query(
              "UPDATE users SET google_access_token = ?, google_token_expiry = ? WHERE id = ?",
              [accessToken, newCredentials.expiry_date, userId]
            );
          }

          // بيانات الحدث المحدثة
          const updatedEvent = {
            summary: note || "سنة من سنن النبي ﷺ",
            description: hadith.data.hadeeth || "سنة من سنن النبي ﷺ",
            start: {
              dateTime: new Date(startDate).toISOString(),
              timeZone: "Asia/Riyadh",
            },
            end: {
              dateTime: new Date(
                new Date(startDate).getTime() + 30 * 60 * 1000
              ).toISOString(),
              timeZone: "Asia/Riyadh",
            },
            reminders: {
              useDefault: false,
              overrides: [
                { method: "popup", minutes: 15 },
                { method: "email", minutes: 60 },
              ],
            },
          };

          // إضافة تكرار إذا كان مطلوب
          if (repeatType !== "once") {
            updatedEvent.recurrence = [
              repeatType === "daily"
                ? "RRULE:FREQ=DAILY"
                : repeatType === "weekly"
                ? "RRULE:FREQ=WEEKLY"
                : repeatType === "monthly"
                ? "RRULE:FREQ=MONTHLY"
                : "",
            ];
          }

          await updateGoogleCalendarEvent(plan.google_event_id, updatedEvent, {
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      } catch (googleError) {
        console.error("Google Calendar update error:", googleError);
        // لا نوقف العملية إذا فشل Google Calendar
      }
    }

    res.json({ success: true, message: "تم تعديل السنّة بنجاح" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء التعديل" });
  }
};

// Delete a sunnah plan
exports.deleteSunnahPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // جلب معلومات السنّة قبل الحذف
    const [plans] = await db.query(
      "SELECT google_event_id FROM sunnah_plans WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (plans.length === 0) {
      return res.status(404).json({ message: "لم يتم العثور على السنّة" });
    }

    // حذف الحدث من Google Calendar إذا كان مرتبط
    if (plans[0].google_event_id) {
      try {
        const [users] = await db.query(
          "SELECT google_access_token, google_refresh_token, google_token_expiry FROM users WHERE id = ?",
          [userId]
        );

        if (
          users.length > 0 &&
          users[0].google_access_token &&
          users[0].google_refresh_token
        ) {
          let accessToken = users[0].google_access_token;
          let refreshToken = users[0].google_refresh_token;

          // التحقق من انتهاء صلاحية التوكن
          if (
            users[0].google_token_expiry &&
            new Date() > new Date(users[0].google_token_expiry)
          ) {
            const newCredentials = await refreshGoogleToken(refreshToken);
            accessToken = newCredentials.access_token;

            await db.query(
              "UPDATE users SET google_access_token = ?, google_token_expiry = ? WHERE id = ?",
              [accessToken, newCredentials.expiry_date, userId]
            );
          }

          const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
          );
          oAuth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          const calendar = google.calendar({
            version: "v3",
            auth: oAuth2Client,
          });

          await calendar.events.delete({
            calendarId: "primary",
            eventId: plans[0].google_event_id,
          });
        }
      } catch (googleError) {
        console.error("Google Calendar delete error:", googleError);
        // لا نوقف العملية إذا فشل Google Calendar
      }
    }

    // حذف السنّة من قاعدة البيانات
    const [result] = await db.query(
      `DELETE FROM sunnah_plans WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "لم يتم العثور على السنّة" });
    }

    res.json({ success: true, message: "تم حذف السنّة بنجاح" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في حذف السنّة" });
  }
};
