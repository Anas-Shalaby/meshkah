import React from 'react';
// Advanced Performance Optimization
export const lazyLoadImages = (ref) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  }, { 
    threshold: 0.1,
    rootMargin: '50px 0px' 
  });

  if (ref.current) {
    const lazyImages = ref.current.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => observer.observe(img));
  }
};

export const trackPagePerformance = () => {
  if (window.performance) {
    const metrics = {
      loadTime: performance.now(),
      timeToInteractive: null,
      resourceLoadTimes: {}
    };

    // Capture resource load times
    performance.getEntriesByType('resource').forEach(resource => {
      metrics.resourceLoadTimes[resource.name] = resource.duration;
    });

    // Measure Time to Interactive
    if (performance.getEntriesByName('first-contentful-paint').length) {
      metrics.timeToInteractive = performance.getEntriesByName('first-contentful-paint')[0].startTime;
    }

    // Send to analytics or log
    // console.log('Performance Metrics:', metrics);
    // Optionally: sendToAnalytics(metrics)
  }
};

export const optimizeWebVitals = () => {
  // Core Web Vitals tracking
  const reportWebVitals = (metric) => {
    // Send to an analytics endpoint
    console.log(metric);
  };

  // Cumulative Layout Shift prevention
  const preventCLS = () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.complete) {
        img.style.height = 'auto';
        img.style.width = '100%';
      } else {
        img.onload = () => {
          img.style.height = 'auto';
          img.style.width = '100%';
        };
      }
    });
  };

  // First Input Delay optimization
  const optimizeFID = () => {
    // Defer non-critical JavaScript
    const scripts = document.querySelectorAll('script[data-defer]');
    scripts.forEach(script => {
      script.defer = true;
    });
  };

  preventCLS();
  optimizeFID();
  return reportWebVitals;
};

// Code Splitting Utility
export const createLazyComponent = (importFn) => {
  return React.lazy(() => {
    return new Promise((resolve) => {
      const modulePromise = importFn();
      modulePromise.then((module) => {
        // Add a loading delay to simulate network conditions
        setTimeout(() => resolve(module), 300);
      });
    });
  });
};