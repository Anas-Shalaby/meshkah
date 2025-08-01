import { motion } from "framer-motion";

const StatCard = ({ icon, title, value, change }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50"
    >
      <div className="flex items-center justify-between md:flex-row flex-col">
        <div className="p-3 rounded-lg bg-[#7440E9]/10 text-[#7440E9]">
          {icon}
        </div>
        <div className="md:text-right text-center">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-sm text-[#7440E9]">{change}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
