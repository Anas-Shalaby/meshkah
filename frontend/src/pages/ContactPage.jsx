import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/contact-us`,
        form
      );
      setSubmitted(true);
      setForm({ name: "", email: "", message: "" });
      setTimeout(() => setSubmitted(false), 3000);
      toast.success("تم ارسال الرسالة بنجاح");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "حدث خطأ أثناء إرسال الرسالة، حاول مرة أخرى."
      );
      toast.error(
        err.response?.data?.message ||
          "حدث خطأ أثناء إرسال الرسالة، حاول مرة أخرى."
      );
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-white via-[#f8f7fa] to-[#f3edff] py-12 px-4 font-cairo"
      dir="rtl"
    >
      <div className="max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-[#7440E9] mb-2 text-right">
          تواصل معنا
        </h1>
        <p className="text-gray-600 mb-8 text-right">
          يسعدنا تواصلك معنا لأي استفسار أو اقتراح. يرجى تعبئة النموذج أدناه أو
          التواصل عبر البريد الإلكتروني أو الواتساب.
        </p>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-transparent p-0 shadow-none border-none"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block mb-1 text-right text-gray-700 font-medium"
              >
                الاسم
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-3 text-black rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#7440E9] focus:border-[#7440E9] bg-gray-50 text-right"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block mb-1 text-right text-gray-700 font-medium"
              >
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded text-black border border-gray-200 focus:ring-2 focus:ring-[#7440E9] focus:border-[#7440E9] bg-gray-50 text-right"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="message"
              className="block mb-1 text-right text-gray-700 font-medium"
            >
              الرسالة
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              value={form.message}
              onChange={handleChange}
              className="w-full px-4 py-3 text-black rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#7440E9] focus:border-[#7440E9] bg-gray-50 text-right resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded bg-[#7440E9] text-white font-semibold text-lg shadow transition-all duration-200 hover:bg-[#5a2fc2] focus:outline-none focus:ring-2 focus:ring-[#7440E9] focus:ring-offset-2"
          >
            أرسل الرسالة
          </button>
          {submitted && (
            <div className="text-green-600 text-center mt-2">
              تم إرسال رسالتك بنجاح!
            </div>
          )}
          {error && (
            <div className="text-red-600 text-center mt-2">{error}</div>
          )}
        </form>
        <div className="mt-10 pt-4 text-right">
          <div className="mb-2">
            <span className="font-semibold text-[#7440E9]">
              البريد الإلكتروني:
            </span>
            <a
              href="mailto:Meshkah@hadith-shareef.com"
              className="ml-2 text-[#7440E9] hover:underline"
            >
              Meshkah@hadith-shareef.com
            </a>
          </div>
          <div>
            <span className="font-semibold text-[#7440E9]">واتساب:</span>
            <a
              href="https://wa.me/201011188416"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-[#7440E9] hover:underline ltr:mr-2"
            >
              +20 010 1118 8416
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
