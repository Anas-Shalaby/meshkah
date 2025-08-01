import React from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const CardHeader = ({ card, isOwner }) => {
  const user = card?.metadata?.created_by;
  const createdAt = card?.card?.created_at;
  const isVerified = user?.is_verified;
  return (
    <div className="relative bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 rounded-t-2xl p-4 flex flex-col sm:flex-row items-center sm:items-end gap-4 shadow-lg">
      <div className="relative">
        <img
          src={user?.avatar_url || "https://hadith-shareef.com/default.jpg"}
          className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
          alt={user?.username}
        />
        {isVerified && (
          <span className="absolute bottom-1 right-1 w-5 h-5 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </div>
      <div className="flex-1 w-full flex flex-col items-center sm:items-start">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {user?.username}
          </span>
        </div>
        <span className="text-xs text-gray-500 mt-1">
          {createdAt
            ? formatDistanceToNow(new Date(createdAt), {
                addSuffix: true,
                locale: ar,
              })
            : null}
        </span>
        {!isOwner && (
          <button className="mt-2 px-4 py-1 rounded-full bg-indigo-500 text-white font-semibold shadow hover:bg-indigo-600 transition">
            متابعة
          </button>
        )}
      </div>
    </div>
  );
};

export default CardHeader;
