import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const HadithAnalysis = ({ hadith }) => {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeHadith = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/ai/analyze-hadith`,
        { hadith },
        {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }
      );
      setAnalysis(response.data);
      toast.success("تم تحليل الحديث بنجاح");
    } catch (error) {
      toast.error(error.response?.data?.error || "حدث خطأ أثناء تحليل الحديث");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center py-8 font-cairo">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold mb-6 text-right text-gray-800 dark:text-gray-100">
          تحليل الحديث
        </h2>
        <button
          onClick={analyzeHadith}
          disabled={isLoading}
          className="w-full py-2 bg-purple-400 hover:bg-purple-500 dark:bg-purple-600 dark:hover:bg-purple-500 text-white rounded-lg font-medium text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-6"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              جاري التحليل...
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            "تحليل الحديث"
          )}
        </button>
        {analysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="text-right text-gray-700 dark:text-gray-200 space-y-4 text-base leading-relaxed">
              {analysis.analysis.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

HadithAnalysis.propTypes = {
  hadith: PropTypes.shape({
    hadeeth: PropTypes.string,
    attribution: PropTypes.string,
    grade: PropTypes.string,
    reference: PropTypes.string,
  }).isRequired,
};

export default HadithAnalysis;
