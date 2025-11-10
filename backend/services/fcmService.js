const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccount = require("../serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase initialized with serviceAccountKey.json");
  } catch (error) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log("✅ Firebase initialized with Application Default Credentials");
  }
}

class FCMService {
  /**
   * Send notification to a topic
   * @param {string} topic - FCM topic
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {object} data - Additional data payload (optional)
   * @returns {Promise<object>} - FCM response
   */
  static async sendToTopic(topic, title, body, data = {}) {
    try {
      const message = {
        topic: topic,
        notification: {
          title: title,
          body: body,
        },
        data: data,
        android: {
          priority: "high",
          notification: {
            sound: "default",
            clickAction: "FLUTTER_NOTIFICATION_CLICK",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log("Successfully sent message to topic:", response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error("Error sending message to topic:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = FCMService;
