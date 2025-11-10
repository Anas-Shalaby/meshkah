import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Edit3, ChevronDown } from "lucide-react";

// مكون فرعي صغير للمهمة
const TaskItem = ({ task, onTaskClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-between pl-4 pr-2 py-2 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
    >
      <div className="flex items-center gap-2 flex-1">
        {task.is_completed ? (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
        )}
        <span
          className={`text-sm font-medium flex-1 text-right ${
            task.is_completed ? "text-gray-500 line-through" : "text-gray-800"
          }`}
        >
          {task.title}
        </span>
      </div>
      <button
        onClick={() => onTaskClick(task)}
        className="p-2 rounded-md bg-gray-100 text-purple-600 hover:bg-purple-100 text-xs font-semibold transition-colors flex-shrink-0 mr-2"
      >
        <Edit3 className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// المكون الرئيسي للمجالس
const CouncilList = ({ councils, directTasks, onTaskClick }) => {
  const [expandedCouncilId, setExpandedCouncilId] = useState(null);

  const handleCouncilClick = (councilId) => {
    setExpandedCouncilId((prevId) => (prevId === councilId ? null : councilId));
  };

  return (
    <div className="space-y-1">
      {/* عرض المجالس */}
      {councils && councils.length > 0 && (
        <>
          {councils.map((council, index) => {
            const isExpanded = expandedCouncilId === council.id;
            return (
              <motion.div
                key={council.id}
                layout
                className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
              >
                {/* --- زر "المجلس" (قابل للضغط) --- */}
                <button
                  onClick={() => handleCouncilClick(council.id)}
                  className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-100 transition-colors"
                >
                  <h4 className="text-base font-bold text-gray-700">
                    🏛️ {council.title}
                  </h4>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* --- حاوية "المهام" (المتداخلة) --- */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      layout
                      key={`tasks-for-${council.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-4 pb-4 space-y-2 overflow-hidden flex items-center justify-between"
                    >
                      {council.tasks && council.tasks.length > 0 ? (
                        council.tasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onTaskClick={() =>
                              onTaskClick(task, council.id, council.title)
                            }
                          />
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          لا توجد مهام في هذا المجلس
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </>
      )}

      {/* عرض المهام المباشرة */}
      {directTasks && directTasks.length > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h4 className="text-base font-bold text-blue-700 mb-3">
            مهام مباشرة
          </h4>
          <div className="space-y-2">
            {directTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onTaskClick={() => onTaskClick(task, null, null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* رسالة إذا لم يكن هناك محتوى */}
      {(!councils || councils.length === 0) &&
        (!directTasks || directTasks.length === 0) && (
          <p className="text-sm text-gray-500 text-center py-4">
            لا توجد مهام في هذا المحور
          </p>
        )}
    </div>
  );
};

export default CouncilList;
