import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Clock, Send, CheckCircle } from "lucide-react";
import { getTranslation } from "../../utils/translations";
import { toast } from "react-hot-toast";
import PropTypes from "prop-types";

const ContactSupport = ({ language = "ar" }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general",
    priority: "medium",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/support/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsSubmitting(false);
        setSubmitted(true);
        toast.success(getTranslation(language, "messageSentSuccess"));
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          category: "general",
          priority: "medium",
        });
      } else {
        throw new Error(data.message || "حدث خطأ أثناء إرسال الرسالة");
      }
    } catch (error) {
      setIsSubmitting(false);
      toast.error(error.message || "حدث خطأ أثناء إرسال الرسالة");
    }
  };

  const contactMethods = [
    {
      id: "email",
      title: getTranslation(language, "emailSupport"),
      titleEn: "Email Support",
      description: getTranslation(language, "emailSupportDesc"),
      descriptionEn: "Send us an email and we'll respond within 24 hours",
      icon: Mail,
      color: "from-blue-500 to-blue-600",
      action: "Meshkah@hadith-shareef.com",
      actionType: "email",
    },
    {
      id: "phone",
      title: getTranslation(language, "phoneSupport"),
      titleEn: "Phone Support",
      description: getTranslation(language, "phoneSupportDesc"),
      descriptionEn: "Call us during business hours",
      icon: Phone,
      color: "from-purple-500 to-purple-600",
      action: "+201011188416",
      actionType: "phone",
    },
  ];

  const supportHours = [
    {
      day: getTranslation(language, "sunday"),
      dayEn: "Sunday",
      hours: "9:00 AM - 6:00 PM",
    },
    {
      day: getTranslation(language, "monday"),
      dayEn: "Monday",
      hours: "9:00 AM - 6:00 PM",
    },
    {
      day: getTranslation(language, "tuesday"),
      dayEn: "Tuesday",
      hours: "9:00 AM - 6:00 PM",
    },
    {
      day: getTranslation(language, "wednesday"),
      dayEn: "Wednesday",
      hours: "9:00 AM - 6:00 PM",
    },
    {
      day: getTranslation(language, "thursday"),
      dayEn: "Thursday",
      hours: "9:00 AM - 6:00 PM",
    },
    {
      day: getTranslation(language, "friday"),
      dayEn: "Friday",
      hours: "10:00 AM - 2:00 PM",
    },
    {
      day: getTranslation(language, "saturday"),
      dayEn: "Saturday",
      hours: "9:00 AM - 6:00 PM",
    },
  ];

  const categories = [
    {
      value: "general",
      label: getTranslation(language, "generalInquiry"),
      labelEn: "General Inquiry",
    },
    {
      value: "technical",
      label: getTranslation(language, "technicalIssue"),
      labelEn: "Technical Issue",
    },
    {
      value: "feature",
      label: getTranslation(language, "featureRequest"),
      labelEn: "Feature Request",
    },
    {
      value: "bug",
      label: getTranslation(language, "bugReport"),
      labelEn: "Bug Report",
    },
    {
      value: "account",
      label: getTranslation(language, "accountIssue"),
      labelEn: "Account Issue",
    },
  ];

  const priorities = [
    {
      value: "low",
      label: getTranslation(language, "lowPriority"),
      labelEn: "Low Priority",
    },
    {
      value: "medium",
      label: getTranslation(language, "mediumPriority"),
      labelEn: "Medium Priority",
    },
    {
      value: "high",
      label: getTranslation(language, "highPriority"),
      labelEn: "High Priority",
    },
    {
      value: "urgent",
      label: getTranslation(language, "urgentPriority"),
      labelEn: "Urgent",
    },
  ];

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {getTranslation(language, "messageSent")}
        </h3>
        <p className="text-gray-600 mb-6">
          {getTranslation(language, "messageSentDescription")}
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-blue-700 transition-all duration-200"
        >
          {getTranslation(language, "sendAnotherMessage")}
        </button>
      </motion.div>
    );
  }

  return (
    <div
      className="space-y-8"
      style={{
        direction: `${language === "ar" ? "rtl" : "ltr"}`,
      }}
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {getTranslation(language, "contactSupport")}
        </h2>
        <p className="text-gray-600">
          {getTranslation(language, "contactSupportDescription")}
        </p>
      </div>

      {/* Contact Methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {contactMethods.map((method, index) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50"
          >
            <div
              className={`w-12 h-12 bg-gradient-to-br ${method.color} rounded-xl flex items-center justify-center mb-4`}
            >
              <method.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {language === "ar" ? method.title : method.titleEn}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {language === "ar" ? method.description : method.descriptionEn}
            </p>
            {method.actionType === "email" ? (
              <a
                href={`mailto:${method.action}`}
                className="inline-flex items-center space-x-2 space-x-reverse text-purple-600 hover:text-purple-700 font-medium"
              >
                <Mail className="w-4 h-4" />
                <span>{method.action}</span>
              </a>
            ) : method.actionType === "phone" ? (
              <a
                href={`tel:${method.action}`}
                className="inline-flex text-left items-center space-x-2 space-x-reverse text-purple-600 hover:text-purple-700 font-medium"
              >
                <Phone className="w-4 h-4" />
                <span>{method.action}</span>
              </a>
            ) : null}
          </motion.div>
        ))}
      </motion.div>

      {/* Contact Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {getTranslation(language, "sendMessage")}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getTranslation(language, "fullName")}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={getTranslation(language, "enterYourName")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getTranslation(language, "emailAddress")}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={getTranslation(language, "enterYourEmail")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getTranslation(language, "category")}
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {language === "ar" ? category.label : category.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getTranslation(language, "priority")}
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {language === "ar" ? priority.label : priority.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getTranslation(language, "subject")}
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={getTranslation(language, "enterSubject")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getTranslation(language, "message")}
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder={getTranslation(language, "enterYourMessage")}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{getTranslation(language, "sending")}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>{getTranslation(language, "sendMessage")}</span>
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Support Hours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          direction: `${language === "ar" ? "rtl" : "ltr"}`,
        }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200"
      >
        <div className="flex items-center space-x-3 space-x-reverse mb-4">
          <Clock className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {getTranslation(language, "supportHours")}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {supportHours.map((day, index) => (
            <div key={index} className="text-center">
              <div className="font-medium text-gray-900">
                {language === "ar" ? day.day : day.dayEn}
              </div>
              <div className="text-sm text-gray-600">{day.hours}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

ContactSupport.propTypes = {
  language: PropTypes.string,
};

export default ContactSupport;
