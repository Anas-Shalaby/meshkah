/** أصناف Tailwind للـ dashboard حسب الثيم */
export function getDashboardTheme(isNight) {
  if (!isNight) {
    return {
      page: "min-h-screen bg-gradient-to-br from-[#F7F6FB] via-[#F3EDFF] to-[#E9E4F5]",
      card: "rounded-2xl border border-purple-200/50 bg-white/95 backdrop-blur-sm shadow-sm",
      cardInnerGlow:
        "pointer-events-none absolute top-0 left-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-200/30 blur-3xl",
      iconBtn:
        "flex h-10 w-10 items-center justify-center rounded-xl border border-purple-200/80 bg-white text-[#7440E9] shadow-sm transition-all hover:bg-purple-50 hover:scale-105",
      textAccent: "text-[#7440E9]",
      textHeading: "text-gray-900",
      textBody: "text-gray-600",
      textMuted: "text-gray-500",
      textSubtle: "text-gray-500",
      link: "text-[#7440E9] hover:underline",
      statCard:
        "rounded-xl border border-purple-100/80 bg-gradient-to-br from-purple-50 to-indigo-50 p-3 text-center",
      statValue: "text-lg font-bold text-[#7440E9]",
      statLabel: "mt-0.5 text-xs text-gray-600",
      primaryBtn:
        "inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-[#7440E9] to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-shadow hover:shadow-lg",
      avatarBorder: "border-2 border-[#7440E9]",
      logoBox: "bg-gradient-to-br from-[#7440E9] to-indigo-600",
      emptyText: "text-sm text-gray-500",
      sectionIcon: "text-[#7440E9]",
      thumbBorder: "border-2 border-purple-100 group-hover:border-[#7440E9]/60",
      thumbBg: "from-purple-50 to-indigo-50",
      thumbName: "text-gray-700 group-hover:text-[#7440E9]",
      socialCard:
        "overflow-hidden rounded-2xl border border-purple-200/60 bg-white/90 p-5 shadow-sm backdrop-blur-sm",
      socialFollow:
        "flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors",
      playStoreBtn:
        "flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800",
      loader: "text-[#7440E9]",
      cardSolid:
        "rounded-xl sm:rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-6 lg:p-8",
      cardInner:
        "rounded-xl sm:rounded-2xl border border-purple-200/50 bg-gradient-to-br from-white/80 to-purple-50/80 p-4 shadow-inner sm:rounded-2xl sm:p-6 md:p-8",
      panel:
        "rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-6 lg:p-8",
      innerPanel:
        "rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6",
      input:
        "w-full rounded-xl border border-purple-200/50 bg-white/80 text-gray-800 shadow-lg backdrop-blur-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500",
      textarea:
        "w-full resize-none rounded-2xl border-2 border-gray-200 px-6 py-4 text-right text-base leading-relaxed placeholder-gray-400 transition-all duration-300 hover:border-[#7440E9]/50 focus:border-[#7440E9] focus:ring-0 sm:text-lg",
      modal: "rounded-2xl bg-white p-6 shadow-2xl",
      modalOverlay:
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm",
      chip: "rounded-lg border border-purple-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-gray-700 transition-all duration-300 hover:bg-purple-50",
      chipActive:
        "rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg",
      ghostBtn:
        "rounded-xl border border-purple-200/50 bg-white/80 px-4 py-2 text-purple-700 shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-white",
      iconBox: "bg-gradient-to-br from-purple-500 to-indigo-600",
      heroTitle:
        "bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent",
      heroBg:
        "bg-gradient-to-br from-purple-100/30 via-blue-100/20 to-indigo-100/30",
      decorBlur:
        "bg-gradient-to-br from-purple-200 to-indigo-200 opacity-20 blur-3xl",
      divider: "border-gray-100",
      searchInput:
        "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-black focus:border-purple-500 focus:ring-2 focus:ring-purple-500 sm:rounded-2xl sm:py-4 sm:text-lg",
      suggestDropdown:
        "absolute top-full right-0 left-0 z-[9999] mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl",
    };
  }

  return {
    page: "min-h-screen bg-[#414149] bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(255,255,255,0.08),transparent_50%)]",
    card: "rounded-2xl border border-white/[0.1] bg-[#34343a]/95 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]",
    cardInnerGlow:
      "pointer-events-none absolute top-0 left-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03] blur-3xl",
    iconBtn:
      "flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#3b3b42] text-zinc-300 transition-all hover:border-white/15 hover:bg-[#46464e] hover:text-zinc-100 hover:scale-105",
    textAccent: "text-[#a89bb8]",
    textHeading: "text-zinc-100",
    textBody: "text-zinc-400",
    textMuted: "text-zinc-500",
    textSubtle: "text-zinc-500",
    link: "text-[#a89bb8] hover:text-zinc-200 hover:underline",
    statCard:
      "rounded-xl border border-white/[0.1] bg-[#3b3b42] p-3 text-center",
    statValue: "text-lg font-bold text-zinc-200",
    statLabel: "mt-0.5 text-xs text-zinc-500",
    primaryBtn:
      "inline-flex items-center gap-2 rounded-xl bg-[#5b4d6f] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#6a5a7f] hover:shadow-lg",
    avatarBorder: "border-2 border-white/20",
    logoBox: "bg-gradient-to-br from-[#5b4d6f] to-[#4a4058]",
    emptyText: "text-sm text-zinc-500",
    sectionIcon: "text-[#a89bb8]",
    thumbBorder: "border-2 border-white/10 group-hover:border-white/20",
    thumbBg: "from-[#3b3b42] to-[#34343a]",
    thumbName: "text-zinc-400 group-hover:text-zinc-200",
    socialCard:
      "overflow-hidden rounded-2xl border border-white/[0.1] bg-[#34343a]/95 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.16)] backdrop-blur-xl",
    socialFollow:
      "flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#3b3b42] px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/15 hover:bg-[#46464e]",
    playStoreBtn:
      "flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#46464e] py-3 text-sm font-semibold text-zinc-100 shadow-md transition-all hover:bg-[#505058]",
    loader: "text-[#a89bb8]",
    cardSolid:
      "rounded-xl sm:rounded-2xl border border-white/[0.1] bg-[#34343a] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.18)] sm:p-6 lg:p-8",
    cardInner:
      "rounded-xl sm:rounded-2xl border border-white/10 bg-[#3b3b42] p-4 sm:p-6 md:p-8",
    panel:
      "rounded-2xl border border-white/[0.1] bg-[#34343a]/95 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:rounded-3xl sm:p-6 lg:p-8",
    innerPanel: "rounded-2xl border border-white/10 bg-[#3b3b42] p-6",
    input:
      "w-full rounded-xl border border-white/10 bg-[#3b3b42] text-zinc-100 shadow-lg backdrop-blur-xl placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500",
    textarea:
      "w-full resize-none rounded-2xl border-2 border-white/10 bg-[#3b3b42] px-6 py-4 text-right text-base leading-relaxed text-zinc-100 placeholder-zinc-500 transition-all duration-300 hover:border-white/20 focus:border-white/25 focus:ring-0 sm:text-lg",
    modal: "rounded-2xl bg-[#34343a] p-6 shadow-2xl border border-white/[0.1]",
    modalOverlay:
      "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm",
    chip: "rounded-lg border border-white/10 bg-[#3b3b42] px-3 py-1.5 text-sm font-medium text-zinc-400 transition-all duration-300 hover:bg-[#46464e] hover:text-zinc-200",
    chipActive:
      "rounded-lg bg-[#5b4d6f] px-3 py-1.5 text-sm font-medium text-white shadow-lg",
    ghostBtn:
      "rounded-xl border border-white/10 bg-[#3b3b42] px-4 py-2 text-zinc-300 shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-[#46464e]",
    iconBox: "bg-gradient-to-br from-[#5b4d6f] to-[#4a4058]",
    heroTitle: "text-zinc-100",
    heroBg: "bg-[#34343a]/50",
    decorBlur: "bg-white/[0.03] blur-3xl",
    divider: "border-white/10",
    searchInput:
      "w-full rounded-xl border border-white/10 bg-[#3b3b42] px-4 py-3 text-base text-zinc-100 focus:border-white/20 focus:ring-2 focus:ring-zinc-500 sm:rounded-2xl sm:py-4 sm:text-lg",
    suggestDropdown:
      "absolute top-full right-0 left-0 z-[9999] mt-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#34343a] shadow-2xl",
  };
}
