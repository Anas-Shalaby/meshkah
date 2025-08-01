import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { HelmetProvider } from "react-helmet-async";
import { optimizeWebVitals } from "./utils/performanceOptimization";
import "./index.css";
import "./styles/image-optimization.css";
import { BrowserRouter } from "react-router-dom";
import { initGA } from "./utils/analytics";

// Initialize Google Analytics
initGA("G-EYHDQH6SDS");

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </BrowserRouter>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        type: "module",
      })
      .then((registration) => {
        console.log("SW registered:", registration.scope);
      })
      .catch((error) => {
        console.error("SW registration failed:", error);
      });
  });
}

const reportWebVitals = optimizeWebVitals();
