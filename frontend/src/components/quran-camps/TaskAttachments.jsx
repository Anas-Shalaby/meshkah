import React from "react";
import { FileText, Image, File, ExternalLink } from "lucide-react";

const TaskAttachments = ({ attachments, apiUrl }) => {
  // Handle different data formats
  let processedAttachments = attachments;

  // If it's a string, try to parse it
  if (typeof attachments === "string" && attachments.trim()) {
    try {
      processedAttachments = JSON.parse(attachments);
    } catch (e) {
      console.error("Error parsing attachments string:", e);
      return null;
    }
  }

  // Ensure it's an array
  if (
    !processedAttachments ||
    !Array.isArray(processedAttachments) ||
    processedAttachments.length === 0
  ) {
    return null;
  }

  // Get icon based on file type
  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "pdf":
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />;
      case "image":
        return <Image className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />;
      case "document":
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />;
      case "text":
        return <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />;
      default:
        return <File className="w-4 h-4 sm:w-5 sm:h-5 text-[#7440E9]" />;
    }
  };

  // Get full URL
  const getFileUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http")) return url;
    return `${apiUrl || import.meta.env.VITE_API_URL}${url}`;
  };

  return (
    <>
      {processedAttachments.map((attachment, index) => {
        if (!attachment || !attachment.url) return null;

        const fileUrl = getFileUrl(attachment.url);
        const fileName =
          attachment.filename ||
          attachment.name ||
          attachment.url.split("/").pop();

        return (
          <a
            key={index}
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-[#F7F6FB] hover:border-[#7440E9]/30 hover:text-[#7440E9] hover:shadow-md rounded-full transition-all duration-200 font-medium cursor-pointer shadow-sm"
          >
            {/* Icon */}
            <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
              {getIcon(attachment.type)}
            </div>

            {/* Title */}
            <span className="text-xs sm:text-sm whitespace-nowrap">
              {fileName}
            </span>
          </a>
        );
      })}
    </>
  );
};

export default TaskAttachments;
