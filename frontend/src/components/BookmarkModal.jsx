import { useState } from "react";
import PropTypes from "prop-types";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import {
  PlusIcon,
  FolderPlusIcon,
  CheckIcon,
  BookmarkIcon as BookmarkOutlineIcon,
} from "@heroicons/react/24/outline";
import { getTranslation } from "../utils/translations";

const BookmarkModal = ({
  isOpen,
  onClose,
  onSubmit,
  existingCollections = [],
  language = "ar",
  itemType = "hadith", // "book", "chapter", "hadith"
  itemTitle = "",
}) => {
  const [collectionName, setCollectionName] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [notes, setNotes] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    const collectionToSubmit =
      collectionName.trim() ||
      (selectedCollection && selectedCollection.trim()) ||
      "Default";
    onSubmit({
      collection: collectionToSubmit,
      notes: notes.trim(),
    });
    setCollectionName("");
    setSelectedCollection("");
    setNotes("");
    setIsCreatingNew(false);
    onClose();
  };

  const resetModal = () => {
    setCollectionName("");
    setSelectedCollection("");
    setNotes("");
    setIsCreatingNew(false);
    onClose();
  };

  const handleCollectionSelect = (collection) => {
    setSelectedCollection(collection);
    setCollectionName("");
    setNotes("");
    setIsCreatingNew(false);
    // Submit immediately when selecting existing collection
    onSubmit({
      collection: collection,
      notes: notes.trim(),
    });
    onClose();
  };
  return (
    <Dialog
      open={isOpen}
      onClose={resetModal}
      className="fixed font-cairo inset-0 z-[9999] overflow-y-auto p-4 pt-[10vh]"
    >
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-2 sm:p-4">
        <Dialog.Panel
          as={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-full max-w-md transform rounded-xl sm:rounded-2xl bg-white p-3 sm:p-6 shadow-xl transition-all"
        >
          <Dialog.Title className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 flex items-center gap-2 justify-center">
            <BookmarkOutlineIcon className="w-6 h-6 text-purple-600" />
            <span>{getTranslation(language, "addBookmark")}</span>
          </Dialog.Title>

          {itemTitle && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">
                {getTranslation(
                  language,
                  `bookmark${
                    itemType.charAt(0).toUpperCase() + itemType.slice(1)
                  }`
                )}
                :
              </p>
              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                {itemTitle}
              </p>
            </div>
          )}
          {!isCreatingNew && existingCollections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label
                htmlFor="collection-select"
                className="block mb-2 text-sm font-medium text-gray-700 text-center"
              >
                {getTranslation(language, "bookmarkCollection")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                {existingCollections.map((collection) => (
                  <motion.button
                    key={collection}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCollectionSelect(collection)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-semibold transition-all border-2 ${
                      selectedCollection === collection
                        ? "bg-purple-700 text-white border-purple-700 shadow"
                        : "bg-gray-50  text-purple-700 border-gray-200  hover:bg-purple-50 "
                    }`}
                  >
                    <BookmarkOutlineIcon
                      className={`w-5 h-5 ${
                        selectedCollection === collection
                          ? "text-white"
                          : "text-purple-500"
                      }`}
                    />
                    <span>
                      {collection === "Default" ? "افتراضي" : collection}
                    </span>
                    {selectedCollection === collection && (
                      <CheckIcon className="w-5 h-5 ml-1 text-white" />
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-center mt-2 sm:mt-4">
                <motion.button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 text-purple-700  hover:bg-purple-50  px-4 py-2 rounded-xl text-base font-semibold transition-all"
                >
                  <PlusIcon className="w-5 h-5 text-purple-500" />
                  <span>إنشاء مجموعة جديدة</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {(isCreatingNew || existingCollections.length === 0) && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="new-collection"
                  className="block mb-2 text-sm font-medium text-gray-700 text-center"
                >
                  اسم المجموعة الجديدة
                </label>
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <input
                    id="new-collection"
                    type="text"
                    value={collectionName}
                    onChange={(e) => {
                      setCollectionName(e.target.value);
                      setSelectedCollection("");
                    }}
                    placeholder="أدخل اسم المجموعة"
                    className="flex-grow px-4 py-2 border bg-white text-black border-purple-300  rounded-xl focus:ring-2 focus:ring-purple-500   text-base"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={!collectionName.trim()}
                    className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-base font-semibold shadow"
                  >
                    <FolderPlusIcon className="w-5 h-5 text-white" />
                    <span>إنشاء</span>
                  </motion.button>
                </div>
              </div>

              {/* Notes Field */}
              <div className="mt-4">
                <label
                  htmlFor="notes"
                  className="block mb-2 text-sm font-medium text-gray-700 text-center"
                >
                  {getTranslation(language, "bookmarkNotes")} (اختياري)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={getTranslation(language, "bookmarkNotes")}
                  rows="3"
                  className="w-full px-4 py-2 border bg-white text-black border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-base resize-none"
                />
              </div>
            </motion.form>
          )}

          <div className="mt-4 flex justify-center">
            <motion.button
              type="button"
              onClick={resetModal}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800  hover:bg-purple-200  px-6 py-2 rounded-xl text-base font-semibold transition-all shadow"
            >
              إلغاء
            </motion.button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

BookmarkModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  existingCollections: PropTypes.array,
  language: PropTypes.string,
  itemType: PropTypes.string,
  itemTitle: PropTypes.string,
};

export default BookmarkModal;
