import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/ThemeContext";
import { getDashboardTheme } from "./dashboardTheme";

const CampThumbnail = ({ camp, enrolled = false }) => {
  const { isNight } = useTheme();
  const t = getDashboardTheme(isNight);
  const [imgError, setImgError] = useState(false);
  const name = (camp.title || camp.name || "مخيم").trim();
  const href = enrolled ? `/my-camp-journey/${camp.id}` : `/quran-camps/${camp.id}`;
  const showImage = camp.banner_image && !imgError;

  return (
    <Link
      to={href}
      className="group flex w-[5.5rem] shrink-0 flex-col items-center gap-2 sm:w-24"
      title={name}
    >
      <motion.div
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`relative h-[5.5rem] w-[5.5rem] overflow-hidden rounded-2xl bg-gradient-to-br sm:h-24 sm:w-24 ${t.thumbBorder} ${t.thumbBg} shadow-sm transition-colors group-hover:shadow-md`}
      >
        {showImage ? (
          <img
            src={camp.banner_image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${isNight ? "from-[#34343a] to-[#2c2c31]" : "from-[#7440E9]/15 to-indigo-100"}`}
          >
            <GraduationCap
              className={`h-8 w-8 ${isNight ? "text-zinc-500" : "text-[#7440E9]/70"}`}
            />
          </div>
        )}
        {enrolled && camp.is_enrolled !== false && (
          <span
            className={`absolute bottom-1 right-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white ${isNight ? "bg-[#5b4d6f]" : "bg-[#7440E9]/90"}`}
          >
            مشترك
          </span>
        )}
      </motion.div>
      <span
        className={`w-full text-center text-[10px] font-semibold leading-tight line-clamp-2 transition-colors sm:text-[11px] ${t.thumbName}`}
      >
        {name}
      </span>
    </Link>
  );
};

CampThumbnail.propTypes = {
  camp: PropTypes.object.isRequired,
  enrolled: PropTypes.bool,
};

export default CampThumbnail;
