import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import CampPublicCard from "../CampPublicCard";

const RecommendationsSection = ({ camps, currentCampId }) => {
  // Filter out current camp and get similar camps
  const similarCamps = camps
    .filter((camp) => camp.id !== currentCampId)
    .slice(0, 3);

  if (similarCamps.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Sparkles className="w-5 h-5 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">مخيمات مشابهة</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarCamps.map((camp, index) => (
          <CampPublicCard key={camp.id} camp={camp} index={index} />
        ))}
      </div>
    </section>
  );
};

export default RecommendationsSection;
