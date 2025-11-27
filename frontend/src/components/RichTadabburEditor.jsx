import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import Link from "@tiptap/extension-link";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Link as LinkIcon,
  Edit,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import HadithSuggestionList from "./HadithSuggestionList";

// --- إعداد "Slash Command" (باستخدام Mention) ---
// هذه هي الدالة التي تضبط إعدادات "الاقتراحات"
const suggestionOptions = {
  char: "/", // (الحرف الذي يستدعي الأمر)
  allowedPrefixes: [" ", "\n"], // السماح بكتابة / بعد مسافة أو سطر جديد
  allowSpaces: true, // السماح بالمسافات في الـ query
  // إضافة debounce لتقليل عدد الطلبات
  debounce: 300, // انتظر 300ms بعد توقف الكتابة قبل البحث

  // الدالة التي تجلب البيانات من الـ API
  items: async ({ query }) => {
    // إزالة أي مسافات في البداية والنهاية فقط، لكن نحتفظ بالمسافات الوسطى
    const cleanQuery = query.trim();

    // إذا كان النص فارغ أو أقل من حرف واحد، لا تبحث
    if (cleanQuery.length < 1) {
      return [];
    }

    try {
      // (استخدم الـ API Endpoint الصحيح)
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/quran-camps/mishkat/search-hadith?q=${encodeURIComponent(
          cleanQuery
        )}`,
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      // (يفترض أن data.data هو array الأحاديث [{id, text}, ...])
      const results = data.success && Array.isArray(data.data) ? data.data : [];

      // استخراج نص الحديث فقط من كل نتيجة
      const extractedResults = results.map((item) => {
        const originalText = item.text || "";
        const extractedText = suggestionOptions.extractHadithText(originalText);
        return {
          ...item,
          text: extractedText,
        };
      });

      return extractedResults;
    } catch (error) {
      return [];
    }
  },

  // دالة لاستخراج نص الحديث فقط (بعد علامة <<)
  extractHadithText: (fullText) => {
    if (!fullText) return fullText;

    // البحث عن النص بعد علامة << (حتى نهاية النص أو حتى علامة >>)
    // يستخدم non-greedy match لالتقاط النص حتى >> أو نهاية النص
    const afterAngleBracketMatch = fullText.match(/<<(.+?)(?:>>|$)/);
    if (afterAngleBracketMatch && afterAngleBracketMatch[1]) {
      return afterAngleBracketMatch[1].trim();
    }

    // إذا لم يتم العثور على <<، نعيد النص الأصلي
    return fullText.trim();
  },

  // الدالة التي تنفذ الأمر عند اختيار حديث
  command: ({ editor, range, props }) => {
    // (ماذا يحدث عند اختيار الحديث)
    const hadithUrl = `https://hadith-shareef.com/hadiths/hadith/${props.id}`;

    // استخراج نص الحديث فقط (بين علامات التنصيص أو <<...>>)
    const fullText = props.text || "";
    const extractedText = suggestionOptions.extractHadithText(fullText);

    // إدراج الحديث كـ link باستخدام JSON structure للتأكد من الحفظ الصحيح
    editor
      .chain()
      .focus()
      .deleteRange(range) // (احذف الأمر /حديث)
      .insertContent({
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [
              {
                type: "link",
                attrs: {
                  href: hadithUrl,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  class:
                    "hadith-link editable-link text-purple-600 hover:text-purple-800 hover:underline font-medium",
                },
              },
            ],
            text: extractedText,
          },
        ],
      })
      .run();
  },

  // الدالة التي تعرض "قائمة الاقتراحات"
  render: () => {
    let component;
    let popup;
    let tippyElement;
    let isLoadingState = false;
    let searchTimeout = null;
    let currentQuery = "";
    let lastSearchedQuery = ""; // تتبع آخر query تم البحث عنه

    return {
      onStart: (props) => {
        isLoadingState = true;
        currentQuery = "";
        lastSearchedQuery = "";
        component = new ReactRenderer(HadithSuggestionList, {
          props: { ...props, isLoading: true, items: [] },
          editor: props.editor,
        });

        // إنشاء عنصر مؤقت للـ tippy
        tippyElement = document.createElement("div");
        document.body.appendChild(tippyElement);

        popup = tippy(tippyElement, {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          zIndex: 9999,
          theme: "light",
          arrow: false,
        });
      },

      onUpdate: (props) => {
        const queryChanged = props.query !== currentQuery;

        // إذا تغير الـ query، نعرض loading
        if (queryChanged) {
          currentQuery = props.query || "";
          lastSearchedQuery = ""; // إعادة تعيين لأن الـ query تغير

          // إلغاء أي timeout سابق
          if (searchTimeout) {
            clearTimeout(searchTimeout);
            searchTimeout = null;
          }

          // إذا كان هناك query (أكثر من حرف واحد)، نعرض loading
          if (currentQuery.trim().length >= 1) {
            isLoadingState = true;
            if (component) {
              component.updateProps({
                ...props,
                isLoading: true,
                items: [],
              });
            }

            // بعد 3 ثوانٍ، إذا لم تأت النتائج، نخفي loading
            searchTimeout = setTimeout(() => {
              if (isLoadingState && lastSearchedQuery !== currentQuery) {
                isLoadingState = false;
                lastSearchedQuery = currentQuery;
                if (component) {
                  component.updateProps({
                    ...props,
                    isLoading: false,
                  });
                }
              }
            }, 3000);
          } else {
            isLoadingState = false;
            if (component) {
              component.updateProps({
                ...props,
                isLoading: false,
              });
            }
          }
        }

        // تحديث الـ component عند وجود props.items
        if (component && props.items !== undefined && props.items !== null) {
          const hasResults =
            Array.isArray(props.items) && props.items.length > 0;

          // إذا كانت هناك نتائج فعلية، نخفي loading
          if (hasResults && isLoadingState) {
            isLoadingState = false;
            lastSearchedQuery = currentQuery;
            if (searchTimeout) {
              clearTimeout(searchTimeout);
              searchTimeout = null;
            }
            component.updateProps({
              ...props,
              isLoading: false,
            });
          }
          // إذا كانت النتائج فارغة لكن الـ query لم يتغير منذ آخر مرة، يعني البحث انتهى
          else if (
            props.items.length === 0 &&
            currentQuery === lastSearchedQuery &&
            isLoadingState
          ) {
            isLoadingState = false;
            if (searchTimeout) {
              clearTimeout(searchTimeout);
              searchTimeout = null;
            }
            component.updateProps({
              ...props,
              isLoading: false,
            });
          }
          // إذا كان لدينا نتائج ولسنا في حالة loading، فقط حدث الـ component
          else if (hasResults && !isLoadingState) {
            component.updateProps({
              ...props,
              isLoading: false,
            });
          }
          // إذا كنا في حالة loading والنتائج لم تأت بعد، تأكد من إظهار loading
          else if (isLoadingState && currentQuery.trim().length > 0) {
            component.updateProps({
              ...props,
              isLoading: true,
              items: [],
            });
          }
        } else if (
          component &&
          isLoadingState &&
          currentQuery.trim().length > 0
        ) {
          // إذا كان في حالة loading ولم تأت النتائج بعد، تأكد من تحديث الـ component بـ loading = true
          component.updateProps({
            ...props,
            isLoading: true,
            items: [],
          });
        }

        // تأكد من إظهار الـ popup
        if (popup && popup[0]) {
          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          });
          if (!popup[0].state.isShown) {
            popup[0].show();
          }
        }
      },

      onKeyDown: (props) => {
        if (props.event.key === "Escape") {
          if (popup && popup[0]) {
            popup[0].hide();
          }
          return true;
        }
        return component?.ref?.onKeyDown(props);
      },

      onExit: () => {
        isLoadingState = false;
        currentQuery = "";
        if (searchTimeout) {
          clearTimeout(searchTimeout);
          searchTimeout = null;
        }
        if (popup && popup[0]) {
          popup[0].destroy();
        }
        if (component) {
          component.destroy();
        }
        if (tippyElement && tippyElement.parentNode) {
          tippyElement.parentNode.removeChild(tippyElement);
        }
      },
    };
  },
};

// --- مكون إضافة/تعديل رابط مع نص مختصر ---
const LinkModal = ({
  isOpen,
  onClose,
  onInsert,
  onUpdate,
  initialUrl = "",
  initialText = "",
  isEdit = false,
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);

  // تحديث القيم عند فتح الـ modal
  React.useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setText(initialText);
    }
  }, [isOpen, initialUrl, initialText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim() && text.trim()) {
      if (isEdit && onUpdate) {
        onUpdate(url.trim(), text.trim());
      } else {
        onInsert(url.trim(), text.trim());
      }
      setUrl("");
      setText("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md rtl">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          {isEdit ? "تعديل رابط" : "إضافة رابط"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الرابط
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              النص المختصر
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="النص الذي سيظهر بدلاً من الرابط"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              {isEdit ? "حفظ" : "إضافة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- شريط الأدوات ---
const MenuBar = ({ editor, onLinkUpdate }) => {
  const [showLinkModal, setShowLinkModal] = useState(false);

  if (!editor) {
    return null;
  }

  const handleInsertLink = (url, text) => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: url,
              target: "_blank",
              rel: "noopener noreferrer",
              class: "text-purple-600 hover:text-purple-800 hover:underline",
            },
          },
        ],
        text: text,
      })
      .run();
  };

  const handleEditLink = () => {
    const { from, to } = editor.state.selection;
    const linkMark = editor.getAttributes("link");
    if (linkMark.href) {
      const selectedText = editor.state.doc.textBetween(from, to);
      onLinkUpdate(linkMark.href, selectedText, from, to);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-white rounded-t-lg">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded transition-colors ${
          editor.isActive("bold")
            ? "bg-purple-100 text-purple-700"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        title="عريض (Ctrl+B)"
      >
        <Bold size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded transition-colors ${
          editor.isActive("italic")
            ? "bg-purple-100 text-purple-700"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        title="مائل (Ctrl+I)"
      >
        <Italic size={16} />
      </button>

      <div className="w-px h-5 bg-gray-300 mx-0.5" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded transition-colors ${
          editor.isActive("bulletList")
            ? "bg-purple-100 text-purple-700"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        title="قائمة نقطية"
      >
        <List size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded transition-colors ${
          editor.isActive("orderedList")
            ? "bg-purple-100 text-purple-700"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        title="قائمة مرقمة"
      >
        <ListOrdered size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded transition-colors ${
          editor.isActive("blockquote")
            ? "bg-purple-100 text-purple-700"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        title="اقتباس"
      >
        <Quote size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded transition-colors ${
          editor.isActive("codeBlock")
            ? "bg-purple-100 text-purple-700"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        title="كود"
      >
        <Code size={16} />
      </button>

      <div className="w-px h-5 bg-gray-300 mx-0.5" />

      <button
        onClick={() => setShowLinkModal(true)}
        className={`p-1.5 rounded transition-colors ${
          editor.isActive("link")
            ? "bg-purple-100 text-purple-700"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        title="إضافة رابط"
      >
        <LinkIcon size={16} />
      </button>

      <div className="w-px h-5 bg-gray-300 mx-0.5" />

      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="تراجع (Ctrl+Z)"
      >
        <Undo size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="إعادة (Ctrl+Y)"
      >
        <Redo size={16} />
      </button>

      <div className="flex-1" />

      <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-50">
        اكتب <span className="font-semibold text-purple-600">/حديث</span> للبحث
      </span>

      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onInsert={handleInsertLink}
      />
    </div>
  );
};

// --- المكون الرئيسي للمحرر ---
const RichTadabburEditor = ({
  initialContent,
  onChange,
  placeholder,
  onJSONChange,
  taskId, // معرف المهمة للحفظ التلقائي
}) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkEditData, setLinkEditData] = useState({
    url: "",
    text: "",
    from: null,
    to: null,
  });
  const editorRef = useRef(null);
  const linkEditDataRef = useRef({ url: "", text: "", from: null, to: null });

  // حالة الحفظ التلقائي
  const [saveStatus, setSaveStatus] = useState("saved"); // "saving", "saved", "unsaved"
  const autoSaveTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef("");

  // دالة للحصول على مفتاح localStorage
  const getStorageKey = () => {
    if (!taskId) return null;
    return `tadabbur_draft_${taskId}`;
  };

  // حفظ تلقائي في localStorage
  const autoSave = (content) => {
    const storageKey = getStorageKey();
    if (!storageKey || !content) return;

    try {
      const draftData = {
        content,
        timestamp: new Date().toISOString(),
        taskId,
      };
      localStorage.setItem(storageKey, JSON.stringify(draftData));
      lastSavedContentRef.current = content;
      setSaveStatus("saved");
    } catch (error) {
      console.error("Error saving draft:", error);
      setSaveStatus("unsaved");
    }
  };

  // استعادة المسودة من localStorage (قبل إنشاء المحرر)
  const getDraftContent = () => {
    const storageKey = getStorageKey();
    if (!storageKey) return null;

    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        // التحقق من أن المسودة ليست قديمة جداً (أكثر من 30 يوم)
        const draftDate = new Date(draftData.timestamp);
        const daysDiff = (new Date() - draftDate) / (1000 * 60 * 60 * 24);

        if (daysDiff < 30 && draftData.content) {
          return draftData.content;
        } else {
          // حذف المسودة القديمة
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error("Error restoring draft:", error);
    }

    return null;
  };

  // حذف المسودة بعد الحفظ النهائي
  const clearDraft = () => {
    const storageKey = getStorageKey();
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
        lastSavedContentRef.current = "";
      } catch (error) {
        console.error("Error clearing draft:", error);
      }
    }
  };

  // الحصول على المحتوى الأولي (من prop أو من المسودة)
  const getInitialContent = () => {
    if (initialContent) return initialContent;
    if (taskId) {
      const draftContent = getDraftContent();
      if (draftContent) return draftContent;
    }
    return "";
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || "اكتب تدبرك هنا...",
      }),
      // إضافة Link extension لدعم الروابط
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "hadith-link editable-link",
          rel: "noopener noreferrer",
        },
      }),
      // (إضافة الميزة الجديدة)
      Mention.configure({
        HTMLAttributes: { class: "hadith-mention" },
        suggestion: suggestionOptions,
        renderLabel({ node }) {
          return `@${node.attrs.id}`;
        },
      }),
    ],
    content: getInitialContent(),
    // (إرسال المحتوى كـ HTML عند كل تحديث)
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      onChange(htmlContent);
      // إذا كان هناك معالج للتغييرات JSON
      if (onJSONChange) {
        onJSONChange(editor.getJSON());
      }

      // حفظ تلقائي مع debounce
      if (taskId) {
        setSaveStatus("saving");

        // إلغاء أي timeout سابق
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }

        // حفظ بعد 1 ثانية من آخر تعديل
        autoSaveTimeoutRef.current = setTimeout(() => {
          autoSave(htmlContent);
        }, 1000);
      }
    },
    // (تنسيق المحرر نفسه)
    editorProps: {
      attributes: {
        class:
          "focus:outline-none focus:ring-0 focus:border-0 min-h-[200px] rtl text-right p-4 prose prose-sm max-w-none cursor-text",
      },
    },
  });

  // تحديث الـ refs عند تغيير state
  useEffect(() => {
    editorRef.current = editor;
    linkEditDataRef.current = linkEditData;
  }, [editor, linkEditData]);

  // تنظيف عند إلغاء التحميل
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // تنبيه عند محاولة الخروج بدون حفظ
  useEffect(() => {
    if (!taskId) return;

    const handleBeforeUnload = (e) => {
      const storageKey = getStorageKey();
      if (storageKey) {
        const savedDraft = localStorage.getItem(storageKey);
        if (savedDraft && editor) {
          const currentContent = editor.getHTML();
          const draftData = JSON.parse(savedDraft);

          // إذا كان المحتوى الحالي مختلف عن المحفوظ
          if (
            currentContent !== draftData.content &&
            currentContent.trim() !== ""
          ) {
            // حفظ فوري قبل الخروج
            autoSave(currentContent);
          }
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [taskId, editor]);

  // دالة لحذف المسودة (يمكن استدعاؤها بعد الحفظ النهائي)
  useEffect(() => {
    // تصدير دالة clearDraft للاستخدام الخارجي
    if (onChange && typeof onChange === "function") {
      // يمكن إضافة callback للحفظ النهائي
    }
  }, []);

  // إضافة event listeners للروابط عند التمرير عليها
  useEffect(() => {
    if (!editor) return;

    const handleMouseOver = (event) => {
      const target = event.target;
      // البحث عن رابط في العنصر أو العنصر نفسه
      const linkElement =
        target.closest("a") || (target.tagName === "A" ? target : null);

      if (
        linkElement &&
        linkElement.href &&
        !linkElement.dataset.tooltipAdded
      ) {
        linkElement.dataset.tooltipAdded = "true";

        // تأخير صغير للتأكد من أن الـ tooltip يظهر بعد التمرير
        setTimeout(() => {
          // التحقق مرة أخرى من أن الرابط لا يزال موجوداً
          if (!linkElement.dataset.tooltipAdded) return;

          // إنشاء tooltip
          const tooltip = document.createElement("div");
          tooltip.className =
            "link-tooltip bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-2 rtl";
          tooltip.style.cssText =
            "position: fixed; z-index: 10000; pointer-events: auto; min-width: 120px;";

          const editButton = document.createElement("button");
          editButton.className =
            "flex items-center gap-1 px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded transition-colors whitespace-nowrap";
          editButton.innerHTML =
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> تعديل النص';

          editButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const href = linkElement.getAttribute("href");
            const text = linkElement.textContent || linkElement.innerText;

            // العثور على موضع الرابط في المحرر
            let linkFrom = null;
            let linkTo = null;

            const view = editor.view;
            view.state.doc.descendants((node, pos) => {
              if (node.type.name === "text" && node.marks) {
                const linkMark = node.marks.find(
                  (mark) => mark.type.name === "link"
                );
                if (linkMark && linkMark.attrs.href === href) {
                  if (linkFrom === null) {
                    linkFrom = pos;
                  }
                  linkTo = pos + node.nodeSize;
                }
              }
            });

            if (linkFrom !== null && linkTo !== null) {
              // استخدام setTimeout للتأكد من أن state update يحدث بعد إزالة tooltip
              setTimeout(() => {
                setLinkEditData({
                  url: href,
                  text: text,
                  from: linkFrom,
                  to: linkTo,
                });
                setShowLinkModal(true);
              }, 0);
            }

            if (tooltip.parentNode) {
              tooltip.remove();
            }
            linkElement.dataset.tooltipAdded = "";
          };

          tooltip.appendChild(editButton);
          document.body.appendChild(tooltip);

          // حساب موضع الـ tooltip
          const rect = linkElement.getBoundingClientRect();
          const tooltipRect = tooltip.getBoundingClientRect();
          tooltip.style.top = `${rect.top - tooltipRect.height - 5}px`;
          tooltip.style.left = `${
            rect.left + rect.width / 2 - tooltipRect.width / 2
          }px`;

          let hoverTimeout = null;
          let isHoveringTooltip = false;

          const removeTooltip = () => {
            if (tooltip.parentNode && !isHoveringTooltip) {
              tooltip.remove();
            }
            linkElement.dataset.tooltipAdded = "";
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              hoverTimeout = null;
            }
          };

          // إزالة tooltip عند إزالة الماوس من الرابط والـ tooltip مع تأخير
          linkElement.addEventListener("mouseleave", () => {
            hoverTimeout = setTimeout(() => {
              if (!isHoveringTooltip) {
                removeTooltip();
              }
            }, 300); // تأخير 300ms قبل الإزالة
          });

          // عند دخول الماوس إلى الـ tooltip، إلغاء الإزالة
          tooltip.addEventListener("mouseenter", () => {
            isHoveringTooltip = true;
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              hoverTimeout = null;
            }
          });

          // عند إزالة الماوس من الـ tooltip، إزالة الـ tooltip
          tooltip.addEventListener("mouseleave", () => {
            isHoveringTooltip = false;
            removeTooltip();
          });
        }, 300); // تأخير 300ms لضمان ظهور tooltip
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener("mouseover", handleMouseOver, true); // استخدام capture phase

    return () => {
      editorElement.removeEventListener("mouseover", handleMouseOver, true);
    };
  }, [editor]);

  const handleUpdateLink = (url, text) => {
    if (editor && linkEditData.from !== null && linkEditData.to !== null) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: linkEditData.from, to: linkEditData.to })
        .insertContent({
          type: "text",
          marks: [
            {
              type: "link",
              attrs: {
                href: url,
                target: "_blank",
                rel: "noopener noreferrer",
                class:
                  "hadith-link editable-link text-purple-600 hover:text-purple-800 hover:underline font-medium",
              },
            },
          ],
          text: text,
        })
        .run();

      setLinkEditData({ url: "", text: "", from: null, to: null });
    }
  };

  const handleInsertLink = (url, text) => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          marks: [
            {
              type: "link",
              attrs: {
                href: url,
                target: "_blank",
                rel: "noopener noreferrer",
                class: "text-purple-600 hover:text-purple-800 hover:underline",
              },
            },
          ],
          text: text,
        })
        .run();
    }
  };

  return (
    <div className="editor-container bg-white border border-gray-300 rounded-lg shadow-sm focus-within:border-purple-500 focus-within:shadow-md transition-all">
      <MenuBar
        editor={editor}
        onLinkUpdate={(url, text, from, to) => {
          setLinkEditData({ url, text, from, to });
          setShowLinkModal(true);
        }}
      />
      <div className="min-h-[200px] bg-white rounded-b-lg relative">
        <EditorContent editor={editor} />

        {/* مؤشر حالة الحفظ */}
        {taskId && (
          <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs">
            {saveStatus === "saving" && (
              <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <Save className="w-3 h-3 animate-pulse" />
                <span>جاري الحفظ...</span>
              </div>
            )}
            {saveStatus === "saved" && (
              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">
                <CheckCircle className="w-3 h-3" />
                <span>تم الحفظ</span>
              </div>
            )}
            {saveStatus === "unsaved" && (
              <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded">
                <AlertCircle className="w-3 h-3" />
                <span>غير محفوظ</span>
              </div>
            )}
          </div>
        )}
      </div>

      <LinkModal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setLinkEditData({ url: "", text: "", from: null, to: null });
        }}
        onInsert={handleInsertLink}
        onUpdate={handleUpdateLink}
        initialUrl={linkEditData.url}
        initialText={linkEditData.text}
        isEdit={linkEditData.from !== null}
      />

      {/* تصدير دالة clearDraft للاستخدام الخارجي */}
      {taskId && editor && (
        <div style={{ display: "none" }}>
          {/* يمكن إضافة ref أو callback هنا إذا لزم الأمر */}
        </div>
      )}
    </div>
  );
};

// تصدير دالة مساعدة لحذف المسودة
export const clearTadabburDraft = (taskId) => {
  if (!taskId) return;
  try {
    const storageKey = `tadabbur_draft_${taskId}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Error clearing draft:", error);
  }
};

export default RichTadabburEditor;
