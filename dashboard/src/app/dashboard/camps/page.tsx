// Unified `/dashboard/camps` route alias for the multi-type camps system.
// Renders the same listing as `/dashboard/quran-camps` (which already lists
// all rows from the `quran_camps` table regardless of `camp_type`).
//
// Backward compatibility: the legacy URL still works; sidebar items now
// point to this canonical path.

export { default } from "../quran-camps/page";
