// src/components/HadithListWrapper.jsx
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useHadithCategories } from "../hooks/useHadithCategories";
import HadithList from "./HadithList";

const HadithListWrapper = () => {
  const { categoryId } = useParams();
  const { categories, loading, error } = useHadithCategories();

  // If no categoryId is provided, use the first category
  const selectedCategory = categoryId
    ? categories.find((cat) => cat.id === Number(categoryId))
    : categories[0];

  return (
    <HadithList
      categories={categories}
      error={error}
      initialCategory={selectedCategory}
    />
  );
};

export default HadithListWrapper;
