import axios from 'axios';
import toast from 'react-hot-toast';

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response || error.code === 'ERR_NETWORK') {
      toast.error('خطأ في الاتصال بالشبكة');
    } else if (error.response.status === 404) {
      toast.error('لم يتم العثور على المحتوى المطلوب');
    } else if (error.response.status === 500) {
      toast.error('خطأ في الخادم، يرجى المحاولة لاحقاً');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;