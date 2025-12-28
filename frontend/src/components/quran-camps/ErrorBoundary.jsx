import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // You can log to an error reporting service here
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-xl p-6 sm:p-8 max-w-2xl mx-auto"
        >
          <div className="flex items-start gap-4 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-900 mb-2">
                حدث خطأ غير متوقع
              </h2>
              <p className="text-red-800 mb-4">
                {this.props.fallbackMessage ||
                  "حدث خطأ أثناء تحميل المحتوى. يرجى المحاولة مرة أخرى."}
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4">
                  <summary className="text-sm text-red-700 cursor-pointer mb-2">
                    تفاصيل الخطأ (للتطوير فقط)
                  </summary>
                  <pre className="text-xs bg-red-100 p-3 rounded overflow-auto max-h-48">
                    {this.state.error.toString()}
                    {this.state.error.stack && `\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
            </div>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </button>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

