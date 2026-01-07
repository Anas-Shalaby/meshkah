/**
 * SEO Helper Functions
 * Utility functions for consistent SEO handling across the application
 */

/**
 * Normalize URL by removing query parameters and hash
 * This ensures canonical URLs don't include query params to avoid duplicate content
 * @param {string} url - The URL to normalize
 * @returns {string} - Normalized URL without query params and hash
 */
export const normalizeCanonicalUrl = (url) => {
  if (!url) return "";
  
  try {
    // Remove query parameters and hash
    const urlObj = new URL(url);
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch (e) {
    // If URL parsing fails, try simple string manipulation
    return url.split("?")[0].split("#")[0];
  }
};

/**
 * Get canonical URL for a page
 * @param {string} pathname - The pathname (e.g., "/islamic-library")
 * @param {string} origin - The origin (defaults to window.location.origin)
 * @returns {string} - Canonical URL
 */
export const getCanonicalUrl = (pathname, origin = null) => {
  const baseOrigin = origin || (typeof window !== "undefined" ? window.location.origin : "");
  return normalizeCanonicalUrl(`${baseOrigin}${pathname}`);
};

/**
 * Check if a page should be indexed
 * Private pages (profile, journey, etc.) should have noindex
 * @param {string} pathname - The pathname
 * @returns {boolean} - true if should be indexed, false otherwise
 */
export const shouldIndexPage = (pathname) => {
  const privatePaths = [
    "/profile",
    "/my-camp-journey",
    "/my-camp-journal",
    "/camp-summary",
    "/camp-content",
    "/saved",
  ];
  
  return !privatePaths.some((path) => pathname.startsWith(path));
};

