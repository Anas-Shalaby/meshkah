import React from "react";
import {
  ExternalLink,
  FileText,
  Video,
  BookOpen,
  Link as LinkIcon,
  Globe,
  Play,
  Library,
} from "lucide-react";

const TaskLinks = ({ links, tafsirLink = null }) => {
  // Handle different data formats
  let processedLinks = links;

  // If it's a string, try to parse it
  if (typeof links === "string" && links.trim()) {
    try {
      processedLinks = JSON.parse(links);
    } catch (e) {
      console.error("Error parsing links string:", e);
      processedLinks = [];
    }
  }

  // Ensure it's an array
  if (!processedLinks || !Array.isArray(processedLinks)) {
    processedLinks = [];
  }

  // Filter out invalid links
  const validLinks = processedLinks.filter(
    (link) => link && link.url && link.url.trim()
  );

  // Get icon based on link type and title
  const getIcon = (link) => {
    const type = link.type?.toLowerCase() || "";
    const title = link.title?.toLowerCase() || "";

    // Check for specific resource types in title
    if (
      title.includes("تفسير") ||
      title.includes("explanation") ||
      type === "explanation" ||
      link.isTafsir
    ) {
      return <Play className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />;
    }
    if (
      title.includes("كتاب الله") ||
      title.includes("book of allah") ||
      type === "quran"
    ) {
      return <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />;
    }
    if (
      title.includes("كتاب") ||
      title.includes("beautiful book") ||
      type === "book"
    ) {
      return <Library className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />;
    }

    // Fallback to type-based icons
    switch (type) {
      case "article":
      case "مقال":
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />;
      case "video":
      case "فيديو":
        return <Video className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />;
      case "book":
      case "كتاب":
        return <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />;
      case "resource":
      case "مصدر":
        return <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />;
      default:
        return <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />;
    }
  };

  // Prepare all links including tafsir
  const allLinks = [];

  // Add tafsir link first if exists
  if (tafsirLink) {
    allLinks.push({
      url: tafsirLink,
      title: "رابط التفسير",
      isTafsir: true,
      isMain: true,
    });
  }

  // Add other links
  allLinks.push(...validLinks);

  if (allLinks.length === 0) {
    return null;
  }

  return (
    <>
      {allLinks.map((link, index) => {
        if (!link || !link.url) return null;

        return (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-[#F7F6FB] hover:border-[#7440E9]/30 hover:text-[#7440E9] hover:shadow-md rounded-full transition-all duration-200 font-medium cursor-pointer shadow-sm"
          >
            {/* Icon */}
            <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
              {getIcon(link)}
            </div>
            {/* Title */}
            <span className="text-xs sm:text-sm whitespace-nowrap">
              {link.title || link.url}
            </span>
          </a>
        );
      })}
    </>
  );
};

export default TaskLinks;
