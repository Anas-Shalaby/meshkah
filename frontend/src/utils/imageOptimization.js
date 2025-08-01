/**
 * Image Optimization Utilities
 */

// Check if WebP is supported
export const isWebPSupported = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
};

// Get optimized image URL
export const getOptimizedImageUrl = (
  originalUrl,
  width = 200,
  height = 300
) => {
  // If WebP is supported, try to use WebP version
  if (isWebPSupported()) {
    const webpUrl = originalUrl.replace(/\.(jpeg|jpg|png)$/i, ".jpeg");
    return webpUrl;
  }

  // Fallback to original URL
  return originalUrl;
};

// Preload important images
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Batch preload images
export const preloadImages = async (imageUrls) => {
  const promises = imageUrls.map((url) => preloadImage(url));
  return Promise.allSettled(promises);
};

// Generate low-quality image placeholder
export const generateImagePlaceholder = (width, height) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Create a simple gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#667eea");
  gradient.addColorStop(1, "#764ba2");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.1);
};

// Debounce function for image loading
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: "50px",
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// Optimize image loading with intersection observer
export const optimizeImageLoading = (imageElement, imageUrl) => {
  const observer = createIntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = imageUrl;
        img.classList.add("image-loaded");
        observer.unobserve(img);
      }
    });
  });

  observer.observe(imageElement);
  return observer;
};
