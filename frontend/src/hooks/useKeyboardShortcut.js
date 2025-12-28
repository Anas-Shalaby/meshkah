import { useEffect } from "react";

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Object with key combinations as keys and callbacks as values
 * @param {Array} dependencies - Dependencies array for the effect
 *
 * @example
 * useKeyboardShortcut({
 *   "ctrl+k": () => setSearchOpen(true),
 *   "escape": () => setModalOpen(false),
 *   "j": () => navigateToNext(),
 *   "k": () => navigateToPrev(),
 * });
 */
export const useKeyboardShortcut = (shortcuts, dependencies = []) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Build key combination string
      const parts = [];
      if (event.ctrlKey || event.metaKey) parts.push("ctrl");
      if (event.shiftKey) parts.push("shift");
      if (event.altKey) parts.push("alt");

      // Add the main key (lowercase for consistency)
      const key = event.key.toLowerCase();
      if (
        key !== "control" &&
        key !== "meta" &&
        key !== "shift" &&
        key !== "alt"
      ) {
        parts.push(key);
      }

      const combination = parts.join("+");

      // Check if this combination is registered
      if (shortcuts[combination]) {
        event.preventDefault();
        event.stopPropagation();
        shortcuts[combination](event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, ...dependencies]);
};
