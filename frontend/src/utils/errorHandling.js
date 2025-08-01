/**
 * Formats API error response with proper error messages
 * @param {Error} error - The error object from axios
 * @returns {Object} Formatted error object
 */
export const formatApiError = (error) => {
  // Handle specific API error codes
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 404:
        return {
          message: "The requested resource was not found",
          status: 404,
        };
      case 429:
        return {
          message: "Too many requests. Please try again later",
          status: 429,
        };
      case 500:
        return {
          message: "Server error. Please try again later",
          status: 500,
        };
      default:
        return {
          message: data?.message || "An unexpected error occurred",
          status: status || 500,
        };
    }
  }

  // Handle network errors
  if (error.request) {
    return {
      message: "Network error. Please check your connection",
      status: 0,
    };
  }

  // Handle other errors
  return {
    message: error.message || "An unexpected error occurred",
    status: 500,
  };
};
