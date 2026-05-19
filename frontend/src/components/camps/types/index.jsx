import QuranContentRenderer from "./QuranContentRenderer";
import HadithContentRenderer from "./HadithContentRenderer";

/**
 * Pick the right task content renderer based on the camp type.
 * Falls back to the Quran renderer for unknown types.
 */
const CampTaskContentRenderer = ({ campType, task }) => {
  switch (campType) {
    case "hadith":
      return <HadithContentRenderer task={task} />;
    case "quran":
    default:
      return <QuranContentRenderer task={task} />;
  }
};

export { QuranContentRenderer, HadithContentRenderer };
export default CampTaskContentRenderer;
