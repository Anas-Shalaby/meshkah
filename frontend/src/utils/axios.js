import axios from "axios";
import toast from "react-hot-toast";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

// Add x-auth-token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response || error.code === "ERR_NETWORK") {
      toast.error("خطأ في الاتصال بالشبكة");
    } else if (error.response.status === 404) {
      toast.error("لم يتم العثور على المحتوى المطلوب");
    } else if (error.response.status === 500) {
      toast.error("خطأ في الخادم، يرجى المحاولة لاحقاً");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
