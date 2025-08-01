import React, { useState } from "react";
import PropTypes from "prop-types";

const Tabs = ({ tabs, initial = 0, className = "" }) => {
  const [active, setActive] = useState(initial);
  return (
    <div className={`w-full ${className}`} dir="rtl">
      <div className="flex border-b border-purple-200 mb-4 gap-2 flex-row-reverse">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            onClick={() => setActive(idx)}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors duration-200 focus:outline-none
              ${
                active === idx
                  ? "bg-white border-x border-t border-purple-300 text-purple-700 -mb-px shadow"
                  : "bg-purple-50 text-purple-500 hover:bg-purple-100"
              }
            `}
            style={{ zIndex: active === idx ? 2 : 1 }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-b-xl border border-purple-200 p-4 min-h-[80px] shadow-sm animate-fadeIn">
        {tabs[active]?.content}
      </div>
    </div>
  );
};

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      content: PropTypes.node.isRequired,
    })
  ).isRequired,
  initial: PropTypes.number,
  className: PropTypes.string,
};

export default Tabs;
