import React from "react";

const IslamicPattern = ({ className = "", variant = "light", children }) => {
  const baseClasses = "ramadan-pattern-overlay";

  const variantClasses = {
    light: "",
    gold: "ramadan-pattern-gold",
    moroccan: "ramadan-pattern-moroccan",
    geometric: "ramadan-pattern-geometric",
    animated: "ramadan-pattern-animated",
  };

  const combinedClasses = `${baseClasses} ${
    variantClasses[variant] || ""
  } ${className}`;

  return <div className={combinedClasses}>{children}</div>;
};

export default IslamicPattern;
