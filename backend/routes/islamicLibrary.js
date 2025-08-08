const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

// API Configuration for Islamic Library
const ISLAMIC_LIBRARY_API_BASE = "https://hadithapi.com/api";
const ISLAMIC_LIBRARY_API_KEY =
  "$2y$10$skZv03NLUYXxtYAfGkDxnOuGyYG5BvLk443nXbMMm2OIM88zp73Qy";

// Excluded books from API
const EXCLUDED_BOOKS = ["Musnad Ahmad", "Al-Silsila Sahiha"];

// Helper function to normalize Arabic text (remove tashkeel)
const normalizeArabicText = (text) => {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '') // Remove tashkeel
    .replace(/[أإآ]/g, 'ا') // Normalize alef variations
    .replace(/[يى]/g, 'ي') // Normalize yaa variations
    .replace(/[ةه]/g, 'ه') // Normalize taa marbouta and haa
    .replace(/[ؤئ]/g, 'و') // Normalize waw variations
    .trim();
};

// Book categories configuration
const BOOK_CATEGORIES = {
  kutub_tisaa: {
    id: "kutub_tisaa",
    name: "كتب الأحاديث الكبيرة",
    nameEn: "Major Hadith Books",
    nameUr: "بڑی حدیث کی کتابیں",
    description: "أهم كتب الحديث المعتمدة والمشهورة",
    descriptionEn: "The most important and well-known hadith collections",
    descriptionUr: "سب سے اہم اور مشہور حدیث کی کتابیں",
    books: [
      "sahih-bukhari",
      "sahih-muslim",
      "al-tirmidhi",
      "abu-dawood",
      "ibn-e-majah",
      "sunan-nasai",
      "mishkat",
      "riyad_assalihin",
      "malik",
      "darimi",
      "bulugh_al_maram",
    ],
  },
  arbaain: {
    id: "arbaain",
    name: "كتب الأربعينيات",
    nameEn: "Forty Hadith Collections",
    nameUr: "چالیس حدیث کی کتابیں",
    description: "مجموعات مختارة من الأحاديث المهمة",
    descriptionEn: "Selected collections of important hadiths",
    descriptionUr: "اہم احادیث کے منتخب مجموعے",
    books: ["nawawi40", "qudsi40", "shahwaliullah40"],
  },
  adab: {
    id: "adab",
    name: "كتب الأدب والآداب",
    nameEn: "Books of Etiquette and Manners",
    nameUr: "آداب و اخلاق کی کتابیں",
    description: "كتب في الآداب الإسلامية والأخلاق",
    descriptionEn: "Books on Islamic etiquette and manners",
    descriptionUr: "اسلامی آداب و اخلاق کی کتابیں",
    books: ["aladab_almufrad", "shamail_muhammadiyah", "hisnul_muslim"],
  },
};

// Local books configuration
const LOCAL_BOOKS = {
  nawawi40: {
    id: 10,
    bookName: "الأربعون النووية",
    bookNameEn: "The Forty Hadith of Imam Nawawi",
    bookNameUr: "The Forty Hadith of Imam Nawawi",
    writerName: "الإمام يحيى بن شرف النووي",
    writerNameEn: "Imam Yahya ibn Sharaf al-Nawawi",
    writerNameUr: "Imam Yahya ibn Sharaf al-Nawawi",
    bookSlug: "nawawi40",
    hadiths_count: "42",
    chapters_count: "1",
    status: "available",
    isLocal: true,
    category: "arbaain",
    filePath: "nawawi40.json",
  },
  qudsi40: {
    id: 11,
    bookName: "الأربعون القدسية",
    bookNameEn: "The Forty Hadith Qudsi",
    bookNameUr: "The Forty Hadith Qudsi",
    writerName: "مجموعة من العلماء",
    writerNameEn: "Collection of Scholars",
    writerNameUr: "Collection of Scholars",
    bookSlug: "qudsi40",
    hadiths_count: "40",
    chapters_count: "1",
    status: "available",
    isLocal: true,
    category: "arbaain",
    filePath: "qudsi40.json",
  },
  aladab_almufrad: {
    id: 12,
    bookName: "الأدب المفرد",
    bookNameEn: "Al-Adab Al-Mufrad",
    bookNameUr: "Al-Adab Al-Mufrad",
    writerName: "الإمام البخاري",
    writerNameEn: "Imam Al-Bukhari",
    writerNameUr: "Imam Al-Bukhari",
    bookSlug: "aladab_almufrad",
    hadiths_count: "1322",
    chapters_count: "57",
    status: "available",
    isLocal: true,
    category: "adab",
    filePath: "aladab_almufrad.json",
  },
  riyad_assalihin: {
    id: 13,
    bookName: "رياض الصالحين",
    bookNameEn: "Riyad al-Salihin",
    bookNameUr: "Riyad al-Salihin",
    writerName: "الإمام يحيى بن شرف النووي",
    writerNameEn: "Imam Yahya ibn Sharaf al-Nawawi",
    writerNameUr: "Imam Yahya ibn Sharaf al-Nawawi",
    bookSlug: "riyad_assalihin",
    hadiths_count: "1896",
    chapters_count: "20",
    status: "available",
    isLocal: true,
    category: "adab",
    filePath: "riyad_assalihin.json",
  },
  malik: {
    id: 7,
    bookName: "موطأ مالك",
    bookNameEn: "Muwatta Malik",
    bookNameUr: "موطأ مالك",
    writerName: "الإمام مالك بن أنس",
    writerNameEn: "Imam Malik ibn Anas",
    writerNameUr: "مالك بن أنس",
    bookSlug: "malik",
    hadiths_count: "1985",
    chapters_count: "61",
    status: "available",
    isLocal: true,
    category: "kutub_tisaa",
    filePath: "malik.json",
  },
  darimi: {
    id: 9,
    bookName: "سنن الدارمي",
    bookNameEn: "Sunan al-Darimi",
    bookNameUr: "سنن الدارمی",
    writerName: "الإمام أبو محمد عبد الرحمن بن عبد الله بن الدارمي",
    writerNameEn: "Imam Abu Muhammad Abd al-Rahman ibn Abd Allah ibn al-Darimi",
    writerNameUr: "الدارمي السمرقندي",
    bookSlug: "darimi",
    hadiths_count: "3406",
    chapters_count: "24",
    status: "available",
    isLocal: true,
    category: "kutub_tisaa",
    filePath: "darimi.json",
  },
  shamail_muhammadiyah: {
    id: 16,
    bookName: "الشمائل المحمدية",
    bookNameEn: "Shama'il Muhammadiyah",
    bookNameUr: "الشمائل المحمدیہ",
    writerName: "الإمام الترمذي",
    writerNameEn: "Imam Tirmidhi",
    writerNameUr: "الترمذی",
    bookSlug: "shamail_muhammadiyah",
    hadiths_count: "402",
    chapters_count: "56",
    status: "available",
    isLocal: true,
    category: "adab",
    filePath: "shamail_muhammadiyah.json",
  },
  bulugh_al_maram: {
    id: 17,
    bookName: "بلوغ المرام",
    bookNameEn: "Bulugh al-Maram",
    bookNameUr: "بلوغ المرام",
    writerName: "الإمام ابن حجر العسقلاني",
    writerNameEn: "Imam Ibn Hajar al-Asqalani",
    writerNameUr: "بلوغ المرام",
    bookSlug: "bulugh_al_maram",
    hadiths_count: "1767",
    chapters_count: "16",
    status: "available",
    isLocal: true,
    category: "kutub_tisaa",
    filePath: "bulugh_almaram.json",
  },
  hisnul_muslim: {
    id: 18,
    bookName: "حصن المسلم",
    bookNameEn: "Hisnul Muslim",
    bookNameUr: "حصن المسلم",
    writerName: "سعيد بن علي بن وهف القحطاني",
    writerNameEn: "Sa'id bin Ali bin Wahf Al-Qahtani",
    writerNameUr: "سعيد بن علي بن وهف القحطاني",
    bookSlug: "hisnul_muslim",
    hadiths_count: "268",
    chapters_count: "132",
    status: "available",
    isLocal: true,
    category: "adab",
    filePath: "hisnulmuslim.json",
  },
  shahwaliullah40: {
    id: 19,
    bookName: "أربعون ولي الله الدهلوي",
    bookNameEn: "The Forty Hadith of Shahwaliullah",
    bookNameUr: "أربعون ولی اللہ الدهلوی",
    writerName: "الشاه ولي الدين الدهلوي",
    writerNameEn: "Shahwaliullah",
    writerNameUr: "الشاه ولي الدين الدهلوي",
    bookSlug: "shahwaliullah40",
    hadiths_count: "40",
    chapters_count: "1",
    status: "available",
    isLocal: true,
    category: "arbaain",
    filePath: "shahwaliullah40.json",
  },
};

// Load local book data
const loadLocalBook = async (bookSlug) => {
  try {
    const bookConfig = LOCAL_BOOKS[bookSlug];
    if (bookConfig) {
      const filePath = path.join(__dirname, "../public", bookConfig.filePath);
      const data = await fs.readFile(filePath, "utf8");
      return { ...JSON.parse(data), config: bookConfig };
    }
    return null;
  } catch (error) {
    console.error("Error loading local book:", error);
    return null;
  }
};

// Get all Islamic books organized by categories
router.get("/books", async (req, res) => {
  try {
    const response = await axios.get(
      `${ISLAMIC_LIBRARY_API_BASE}/books?apiKey=${ISLAMIC_LIBRARY_API_KEY}`
    );

    // Filter out unwanted books
    const filteredBooks = response.data.books.filter(
      (book) => !EXCLUDED_BOOKS.includes(book.bookName)
    );

    // Add local books to the list
    const localBooksList = Object.values(LOCAL_BOOKS);

    // Combine regular books with local books
    const allBooks = [...filteredBooks, ...localBooksList];

    // Organize books by categories
    const categorizedBooks = {};

    Object.keys(BOOK_CATEGORIES).forEach((categoryId) => {
      const category = BOOK_CATEGORIES[categoryId];
      categorizedBooks[categoryId] = {
        ...category,
        books: allBooks.filter((book) => {
          // Check if book is in this category
          return category.books.includes(book.bookSlug || book.bookName);
        }),
      };
    });

    res.json({
      status: 200,
      categories: categorizedBooks,
      allBooks: allBooks,
    });
  } catch (error) {
    console.error("Error fetching Islamic books:", error);
    res.status(500).json({ message: "Error fetching Islamic books" });
  }
});

// Get book categories
router.get("/categories", async (req, res) => {
  try {
    res.json({
      status: 200,
      categories: BOOK_CATEGORIES,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
});

// Get books by category
router.get("/categories/:categoryId/books", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = BOOK_CATEGORIES[categoryId];

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const response = await axios.get(
      `${ISLAMIC_LIBRARY_API_BASE}/books?apiKey=${ISLAMIC_LIBRARY_API_KEY}`
    );

    const filteredBooks = response.data.books.filter(
      (book) => !EXCLUDED_BOOKS.includes(book.bookName)
    );

    const localBooksList = Object.values(LOCAL_BOOKS);
    const allBooks = [...filteredBooks, ...localBooksList];

    const categoryBooks = allBooks.filter((book) => {
      return category.books.includes(book.bookSlug || book.bookName);
    });

    res.json({
      status: 200,
      category: category,
      books: categoryBooks,
    });
  } catch (error) {
    console.error("Error fetching category books:", error);
    res.status(500).json({ message: "Error fetching category books" });
  }
});

// Get specific local book details
router.get("/local-books/:bookSlug", async (req, res) => {
  try {
    const { bookSlug } = req.params;
    const bookConfig = LOCAL_BOOKS[bookSlug];

    if (!bookConfig) {
      return res.status(404).json({ message: "Book not found" });
    }

    const bookData = await loadLocalBook(bookSlug);
    if (!bookData) {
      return res.status(404).json({ message: "Book data not found" });
    }

    res.json({
      status: 200,
      book: {
        ...bookConfig,
        metadata: bookData.metadata,
        hadiths: bookData.hadiths,
      },
    });
  } catch (error) {
    console.error("Error fetching local book:", error);
    res.status(500).json({ message: "Error fetching local book" });
  }
});

// Get hadiths from local book
router.get("/local-books/:bookSlug/hadiths", async (req, res) => {
  try {
    const { bookSlug } = req.params;
    const { page = 1, paginate = 25, search } = req.query;

    const bookData = await loadLocalBook(bookSlug);
    if (!bookData) {
      return res.status(404).json({ message: "Book not found" });
    }

    let filteredHadiths = bookData.hadiths;

    // Sort hadiths by chapterId first, then by idInBook within each chapter
    filteredHadiths.sort((a, b) => {
      // First sort by chapterId
      if (a.chapterId !== b.chapterId) {
        return a.chapterId - b.chapterId;
      }
      // Then sort by idInBook within the same chapter
      return a.idInBook - b.idInBook;
    });

    // Apply search filter
    if (search) {
      filteredHadiths = filteredHadiths.filter(
        (h) =>
          h.arabic.toLowerCase().includes(search.toLowerCase()) ||
          h.english.text.toLowerCase().includes(search.toLowerCase()) ||
          h.english.narrator.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * paginate;
    const endIndex = startIndex + parseInt(paginate);
    const paginatedHadiths = filteredHadiths.slice(startIndex, endIndex);

    res.json({
      status: 200,
      hadiths: {
        data: paginatedHadiths,
        current_page: parseInt(page),
        last_page: Math.ceil(filteredHadiths.length / paginate),
        per_page: parseInt(paginate),
        total: filteredHadiths.length,
      },
    });
  } catch (error) {
    console.error("Error fetching local book hadiths:", error);
    res.status(500).json({ message: "Error fetching hadiths" });
  }
});

// Get specific hadith from local book
router.get("/local-books/:bookSlug/hadiths/:hadithId", async (req, res) => {
  try {
    const { bookSlug, hadithId } = req.params;

    const bookData = await loadLocalBook(bookSlug);
    if (!bookData) {
      return res.status(404).json({ message: "Book not found" });
    }

    const hadith = bookData.hadiths.find((h) => h.id.toString() === hadithId);
    if (!hadith) {
      return res.status(404).json({ message: "Hadith not found" });
    }
    const bookChapter = bookData.chapters.find(
      (chapter) => chapter.id === hadith.chapterId
    );
    res.json({
      status: 200,
      hadith: {
        ...hadith,
        hadithArabic: hadith.arabic,
        hadithEnglish: hadith.english.text,
        hadithUrdu: hadith.english.text, // Fallback to English
        englishNarrator: hadith.english.narrator,
        book: {
          bookName: bookData.metadata.arabic.title,
          bookNameEn: bookData.metadata.english.title,
          bookSlug: bookSlug,
          isLocal: true,
        },
        chapter: {
          chapterNumber: bookChapter.id,
          chapterArabic: bookChapter.arabic,
          chapterEnglish: bookChapter.english,
          chapterUrdu: bookChapter.english,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching local book hadith:", error);
    res.status(500).json({ message: "Error fetching hadith" });
  }
});

// Get specific hadith from small book (legacy endpoint)
router.get("/small-books/:bookSlug/hadiths/:hadithId", async (req, res) => {
  try {
    const { bookSlug, hadithId } = req.params;

    const bookData = await loadSmallBook(bookSlug);
    if (!bookData) {
      return res.status(404).json({ message: "Book not found" });
    }

    const hadith = bookData.hadiths.find((h) => h.id.toString() === hadithId);
    if (!hadith) {
      return res.status(404).json({ message: "Hadith not found" });
    }

    res.json({
      status: 200,
      hadith: {
        ...hadith,
        hadithArabic: hadith.arabic,
        hadithEnglish: hadith.english.text,
        hadithUrdu: hadith.english.text, // Fallback to English
        englishNarrator: hadith.english.narrator,
        book: {
          bookName: bookData.metadata.arabic.title,
          bookNameEn: bookData.metadata.english.title,
          bookSlug: bookSlug,
        },
        chapter: bookData.chapters[0],
      },
    });
  } catch (error) {
    console.error("Error fetching small book hadith:", error);
    res.status(500).json({ message: "Error fetching hadith" });
  }
});



// Get chapters of a specific book (for regular books)
router.get("/books/:bookSlug/chapters", async (req, res) => {
  try {
    const { bookSlug } = req.params;

    // Check if it's a local book
    if (LOCAL_BOOKS[bookSlug]) {
      const bookData = await loadLocalBook(bookSlug);
      if (bookData) {
        const bookConfig = LOCAL_BOOKS[bookSlug];

        // Check if the book has multiple chapters
        if (parseInt(bookConfig.chapters_count) > 1) {
          // Get chapters from bookData.chapters and sort them by id
          const chapters = bookData.chapters
            .map((chapter) => {
              const chapterHadiths = bookData.hadiths.filter(
                (h) => h.chapterId === chapter.id
              );
              return {
                chapterNumber: chapter.id,
                chapterArabic: chapter.arabic,
                chapterEnglish: chapter.english,
                chapterUrdu: chapter.english, // Fallback to English
                hadiths_count: chapterHadiths.length,
              };
            })
            .sort((a, b) => a.chapterNumber - b.chapterNumber);

          return res.json({
            status: 200,
            chapters: chapters,
          });
        } else {
          // For books with single chapter, return a single chapter with all hadiths
          return res.json({
            status: 200,
            chapters: [
              {
                chapterNumber: 1,
                chapterArabic: "جميع الأحاديث",
                chapterEnglish: "All Hadiths",
                chapterUrdu: "تمام احادیث",
                hadiths_count: bookData.hadiths.length,
              },
            ],
          });
        }
      }
    }

    // Check if the requested book is in the excluded list
    const excludedBooks = ["Musnad Ahmad", "Al-Silsila Sahiha"];
    if (excludedBooks.includes(bookSlug)) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Fallback to API for regular books
    const response = await axios.get(
      `${ISLAMIC_LIBRARY_API_BASE}/${bookSlug}/chapters?apiKey=${ISLAMIC_LIBRARY_API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching book chapters:", error);
    res.status(500).json({ message: "Error fetching book chapters" });
  }
});

// Get hadiths with search and filters (for regular books)
router.get("/hadiths", async (req, res) => {
  try {
    const {
      hadithEnglish,
      hadithUrdu,
      hadithArabic,
      hadithNumber,
      book,
      chapter,
      status,
      paginate = 25,
      page = 1,
    } = req.query;

    // Check if it's a local book
    if (book && LOCAL_BOOKS[book]) {
      const bookData = await loadLocalBook(book);
      if (bookData) {
        let filteredHadiths = bookData.hadiths;

        // Sort hadiths by chapterId first, then by idInBook within each chapter
        filteredHadiths.sort((a, b) => {
          // First sort by chapterId
          if (a.chapterId !== b.chapterId) {
            return a.chapterId - b.chapterId;
          }
          // Then sort by idInBook within the same chapter
          return a.idInBook - b.idInBook;
        });

        // Apply filters
        if (hadithArabic) {
          filteredHadiths = filteredHadiths.filter((h) =>
            h.arabic.toLowerCase().includes(hadithArabic.toLowerCase())
          );
        }
        if (hadithEnglish) {
          filteredHadiths = filteredHadiths.filter((h) =>
            h.english.text.toLowerCase().includes(hadithEnglish.toLowerCase())
          );
        }
        if (hadithNumber) {
          filteredHadiths = filteredHadiths.filter((h) =>
            h.idInBook.toString().includes(hadithNumber)
          );
        }

        // Apply pagination
        const startIndex = (page - 1) * paginate;
        const endIndex = startIndex + parseInt(paginate);
        const paginatedHadiths = filteredHadiths.slice(startIndex, endIndex);

        return res.json({
          status: 200,
          hadiths: {
            data: paginatedHadiths,
            current_page: parseInt(page),
            last_page: Math.ceil(filteredHadiths.length / paginate),
            per_page: parseInt(paginate),
            total: filteredHadiths.length,
          },
        });
      }
    }

    // Fallback to API for regular books
    // Check if the requested book is in the excluded list
    const excludedBooks = ["Musnad Ahmad", "Al-Silsila Sahiha"];
    if (book && excludedBooks.includes(book)) {
      return res.json({
        status: 200,
        hadiths: { data: [] },
        message: "Book not available",
      });
    }

    // Build query string manually to ensure proper encoding
    let queryString = `apiKey=${ISLAMIC_LIBRARY_API_KEY}&paginate=${paginate}&page=${page}`;

    // Add optional parameters if provided
    if (hadithEnglish)
      queryString += `&hadithEnglish=${encodeURIComponent(hadithEnglish)}`;
    if (hadithUrdu)
      queryString += `&hadithUrdu=${encodeURIComponent(hadithUrdu)}`;
    if (hadithArabic)
      queryString += `&hadithArabic=${encodeURIComponent(hadithArabic)}`;
    if (hadithNumber)
      queryString += `&hadithNumber=${encodeURIComponent(hadithNumber)}`;
    if (book) queryString += `&book=${encodeURIComponent(book)}`;
    if (chapter) queryString += `&chapter=${encodeURIComponent(chapter)}`;
    if (status) queryString += `&status=${encodeURIComponent(status)}`;

    const response = await axios.get(
      `${ISLAMIC_LIBRARY_API_BASE}/hadiths?${queryString}`
    );

    // Check if the API returned a 404 status
    if (response.data.status === 404) {
      return res.status(404).json({
        status: 404,
        message: "Hadiths not found.",
        hadiths: { data: [] },
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching hadiths:",
      error.response?.data || error.message
    );

    // If it's a 404 error from the external API, return a proper response
    if (error.response?.status === 404) {
      return res.status(404).json({
        status: 404,
        message: "Hadiths not found.",
        hadiths: { data: [] },
      });
    }

    res.status(500).json({
      message: "Error fetching hadiths",
      error: error.response?.data || error.message,
      details: error.response?.status,
    });
  }
});

// Get hadiths by book and chapter (for regular books and local books)
router.get("/books/:bookSlug/chapters/:chapterId/hadiths", async (req, res) => {
  try {
    const { bookSlug, chapterId } = req.params;
    const { page = 1, paginate = 25 } = req.query;

    // Check if it's a local book
    if (LOCAL_BOOKS[bookSlug]) {
      const bookData = await loadLocalBook(bookSlug);
      if (bookData) {
        let hadiths = bookData.hadiths.filter(
          (h) => String(h.chapterId) === String(chapterId)
        );

        // Sort hadiths by idInBook within the chapter
        hadiths.sort((a, b) => a.idInBook - b.idInBook);

        // Apply pagination
        const startIndex = (page - 1) * paginate;
        const endIndex = startIndex + parseInt(paginate);
        const paginatedHadiths = hadiths.slice(startIndex, endIndex);

        return res.json({
          status: 200,
          hadiths: {
            data: paginatedHadiths,
            current_page: parseInt(page),
            last_page: Math.ceil(hadiths.length / paginate),
            per_page: parseInt(paginate),
            total: hadiths.length,
          },
        });
      }
    }

    // Check if the requested book is in the excluded list
    const excludedBooks = ["Musnad Ahmad", "Al-Silsila Sahiha"];
    if (excludedBooks.includes(bookSlug)) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Fallback to API for regular books
    const params = {
      book: bookSlug,
      chapter: chapterId,
      paginate,
      page,
    };

    const response = await axios.get(
      `${ISLAMIC_LIBRARY_API_BASE}/hadiths?apiKey=${ISLAMIC_LIBRARY_API_KEY}`,
      {
        params,
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching chapter hadiths:", error);
    res.status(500).json({ message: "Error fetching chapter hadiths" });
  }
});

// Get hadiths by book and chapter for local books (alternative endpoint)
router.get(
  "/local-books/:bookSlug/chapters/:chapterId/hadiths",
  async (req, res) => {
    try {
      const { bookSlug, chapterId } = req.params;
      const { page = 1, paginate = 25 } = req.query;

      // Check if it's a local book
      if (LOCAL_BOOKS[bookSlug]) {
        const bookData = await loadLocalBook(bookSlug);
        if (bookData) {
          const bookConfig = LOCAL_BOOKS[bookSlug];

          // For books with single chapter, handle chapterId 0
          let hadiths;
          if (parseInt(bookConfig.chapters_count) === 1) {
            // For single chapter books, return all hadiths regardless of chapterId
            hadiths = bookData.hadiths;
          } else {
            // For multi-chapter books, filter by chapterId
            hadiths = bookData.hadiths.filter(
              (h) => String(h.chapterId) === String(chapterId)
            );
          }

          // Sort hadiths by idInBook within the chapter
          hadiths.sort((a, b) => a.idInBook - b.idInBook);

          // Apply pagination
          const startIndex = (page - 1) * paginate;
          const endIndex = startIndex + parseInt(paginate);
          const paginatedHadiths = hadiths.slice(startIndex, endIndex);

          return res.json({
            status: 200,
            hadiths: {
              data: paginatedHadiths,
              current_page: parseInt(page),
              last_page: Math.ceil(hadiths.length / paginate),
              per_page: parseInt(paginate),
              total: hadiths.length,
            },
          });
        }
      }

      return res.status(404).json({ message: "Book not found" });
    } catch (error) {
      console.error("Error fetching local chapter hadiths:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Error fetching chapter hadiths" });
    }
  }
);

router.get("/books/:bookSlug/chapter/:chapterNumber/hadith/:hadithNumber/navigation" , async(req ,res) => {
 try {
  const { bookSlug, chapterNumber , hadithNumber} = req.params;
  const bookData = await axios.get(`${ISLAMIC_LIBRARY_API_BASE}/hadiths/?apiKey=${ISLAMIC_LIBRARY_API_KEY}` , {
    params : {
      book : bookSlug,
      chapter : chapterNumber
    }
  });
  if (!bookData) {
    return res.status(404).json({ message: "Book data not found" });
  }
  const hadith = bookData.data.hadiths.data.find(h => h.hadithNumber.toString() === hadithNumber.toString());
  const nextHadith = bookData.data.hadiths.data.find(h => h.hadithNumber.toString() === (parseInt(hadithNumber) + 1).toString());
  const prevHadith =bookData.data.hadiths.data.find(h => h.hadithNumber.toString() === (parseInt(hadithNumber) - 1).toString());
  if (!hadith) {
    return res.status(404).json({ message: "Hadith not found" });
  }
  res.json({
    status: 200,
    nextHadith: nextHadith ? {
      id: nextHadith.hadithNumber,
      title: nextHadith.hadithArabic,
      titleEn: nextHadith.hadithEnglish
    } : null,
    prevHadith: prevHadith ? {
      id: prevHadith.hadithNumber,
      title: prevHadith.hadithArabic,
      titleEn: prevHadith.hadithEnglish
    } : null,
    currentHadithNumber : hadith.hadithNumber,
    totalHadiths : bookData.data.hadiths.total
  });
   
 } catch (error) {
  console.error("Error fetching local book hadith navigation:", error);
  res.status(500).json({ message: "Error fetching local book hadith navigation" });
 }
    
})

router.get("/local-books/:bookSlug/hadiths/:hadithNumber/navigation" , async(req ,res) => {
  try {
    const { bookSlug, hadithNumber } = req.params;
    const bookData = await loadLocalBook(bookSlug);
    if (!bookData) {
      return res.status(404).json({ message: "Book data not found" });
    }
    const hadith = bookData.hadiths.find(h => h.id.toString() === hadithNumber.toString());
    const nextHadith = bookData.hadiths.find(h => h.id.toString() === (parseInt(hadithNumber) + 1).toString());
    const prevHadith = bookData.hadiths.find(h => h.id.toString() === (parseInt(hadithNumber) - 1).toString());
    if (!hadith) {
      return res.status(404).json({ message: "Hadith not found" });
    }
    res.json({
      status: 200,
      book: {
        bookName: bookData.metadata.arabic.title,
        bookNameEn: bookData.metadata.english.title,
      },
      nextHadith: nextHadith ? {
        id: nextHadith.id,
        title: nextHadith.arabic,
        titleEn: nextHadith.english
      } : null,
      prevHadith: prevHadith ? {
        id: prevHadith.id,
        title: prevHadith.arabic,
        titleEn: prevHadith.english
      } : null,
      currentHadithNumber : hadith.idInBook,
      totalHadiths : bookData.hadiths.length
    });
  } catch (error) {
    console.error("Error fetching local book hadith:", error);
    res.status(500).json({ message: "Error fetching local book hadith" });
  }
})


// Get specific hadith by ID (for regular books)
router.get(
  "/book/:bookSlug/chapter/:chapterId/hadith/:hadithNumber",
  async (req, res) => {
    try {
      const { hadithNumber, bookSlug, chapterId } = req.params;

      // Check if the requested book is in the excluded list
      const excludedBooks = ["Musnad Ahmad", "Al-Silsila Sahiha"];
      if (excludedBooks.includes(bookSlug)) {
        return res.status(404).json({ message: "Book not found" });
      }

      // Check if it's a local book hadith
      for (const [bookSlug, bookConfig] of Object.entries(LOCAL_BOOKS)) {
        const bookData = await loadLocalBook(bookSlug);
        if (bookData) {
          const hadith = bookData.hadiths.find(
            (h) => h.id.toString() === hadithNumber
          );

          if (hadith) {
            return res.json({
              status: 200,
              hadith: {
                ...hadith,
                hadithArabic: hadith.arabic,
                hadithEnglish: hadith.english.text,
                hadithUrdu: hadith.english.text, // Fallback to English
                englishNarrator: hadith.english.narrator,
                book: {
                  bookName: bookData.metadata.arabic.title,
                  bookNameEn: bookData.metadata.english.title,
                },
                chapter: {
                  chapterNumber: bookData.chapters[0].id,
                  chapterArabic: bookData.chapters[0].arabic,
                  chapterEnglish: bookData.chapters[0].english,
                  chapterUrdu: bookData.chapters[0].english,
                },
              },
            });
          }
        }
      }
      // Check if the requested book is in the excluded list
      if (EXCLUDED_BOOKS.includes(bookSlug)) {
        return res.status(404).json({ message: "Book not found" });
      }

      const params = {
        apiKey: ISLAMIC_LIBRARY_API_KEY,
        book: bookSlug,
        chapter: chapterId,
        hadithNumber: hadithNumber,
      };
      // Fallback to API for regular books
      const response = await axios.get(`${ISLAMIC_LIBRARY_API_BASE}/hadiths/`, {
        params,
      });
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching hadith" });
    }
  }
);

router.get("/statistics", async (req, res) => {
  try {
    // Get all books from API
    const response = await axios.get(
      `${ISLAMIC_LIBRARY_API_BASE}/books?apiKey=${ISLAMIC_LIBRARY_API_KEY}`
    );

    // Filter out unwanted books
    const filteredBooks = response.data.books.filter(
      (book) => !EXCLUDED_BOOKS.includes(book.bookName)
    );

    // Add local books to the list
    const localBooksList = Object.values(LOCAL_BOOKS);

    // Combine regular books with local books
    const allBooks = [...filteredBooks, ...localBooksList];

    // Calculate statistics
    const totalBooks = allBooks.length;
    const totalHadiths = allBooks.reduce((sum, book) => {
      return sum + (parseInt(book.hadiths_count) || 0);
    }, 0);
    const totalChapters = allBooks.reduce((sum, book) => {
      return sum + (parseInt(book.chapters_count) || 0);
    }, 0);

    // Calculate books by category
    const booksByCategory = {};
    Object.keys(BOOK_CATEGORIES).forEach((categoryId) => {
      const category = BOOK_CATEGORIES[categoryId];
      const categoryBooks = allBooks.filter((book) => {
        return category.books.includes(book.bookSlug || book.bookName);
      });
      booksByCategory[categoryId] = {
        name: category.name,
        nameEn: category.nameEn,
        nameUr: category.nameUr,
        count: categoryBooks.length,
        hadiths: categoryBooks.reduce((sum, book) => {
          return sum + (parseInt(book.hadiths_count) || 0);
        }, 0),
      };
    });

    // Calculate top books by hadith count
    const topBooks = allBooks
      .sort(
        (a, b) =>
          (parseInt(b.hadiths_count) || 0) - (parseInt(a.hadiths_count) || 0)
      )
      .slice(0, 5)
      .map((book) => ({
        name: book.bookName,
        nameEn: book.bookNameEn,
        nameUr: book.bookNameUr,
        hadiths: parseInt(book.hadiths_count) || 0,
        chapters: parseInt(book.chapters_count) || 0,
      }));

    res.json({
      status: 200,
      statistics: {
        totalBooks,
        totalHadiths,
        totalChapters,
        booksByCategory,
        topBooks,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching Islamic library statistics:", error);
    res
      .status(500)
      .json({ message: "Error fetching Islamic library statistics" });
  }
});

// Get chapter navigation with next/previous
router.get("/local-books/:bookSlug/chapters/:chapterId/navigation", async (req, res) => {
  try {
    const { bookSlug, chapterId } = req.params;
    const bookConfig = LOCAL_BOOKS[bookSlug];

    if (!bookConfig) {
      return res.status(404).json({ message: "Book not found" });
    }

    const bookData = await loadLocalBook(bookSlug);
    if (!bookData) {
      return res.status(404).json({ message: "Book data not found" });
    }

    const chapters = bookData.chapters || [];
    const currentChapterIndex = chapters.findIndex(ch => ch.id.toString() === chapterId.toString());
    
    if (currentChapterIndex === -1) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const currentChapter = chapters[currentChapterIndex];
    const prevChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
    const nextChapter = currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;

    // Get hadiths for current chapter
    const chapterHadiths = bookData.hadiths.filter(h => h.chapterId.toString() === chapterId.toString());
    const totalHadiths = chapterHadiths.length;

    res.json({
      status: 200,
      navigation: {
        current: {
          id: currentChapter.id,
          title: currentChapter.arabic,
          titleEn: currentChapter.english,
          hadithsCount: totalHadiths
        },
        previous: prevChapter ? {
          id: prevChapter.id,
          title: prevChapter.arabic,
          titleEn: prevChapter.english
        } : null,
        next: nextChapter ? {
          id: nextChapter.id,
          title: nextChapter.arabic,
          titleEn: nextChapter.english
        } : null,
        totalChapters: chapters.length,
        currentChapterIndex: currentChapterIndex + 1
      }
    });
  } catch (error) {
    console.error("Error fetching chapter navigation:", error);
    res.status(500).json({ message: "Error fetching chapter navigation" });
  }
});


// Get chapter navigation with next/previous
router.get("/books/:bookSlug/chapters/:chapterId/navigation", async (req, res) => {
  try {
    const { bookSlug, chapterId } = req.params;

    const response = await axios.get(`${ISLAMIC_LIBRARY_API_BASE}/${bookSlug}/chapters?apiKey=${ISLAMIC_LIBRARY_API_KEY}`);
    const bookData = response.data;
    console.log(bookData);
    if (!bookData) {
      return res.status(404).json({ message: "Book data not found" });
    }

    const chapters = bookData.chapters || [];
    const currentChapter = chapters.find(ch => ch.chapterNumber.toString() === chapterId.toString());
    const prevChapter = chapters.find(ch => ch.chapterNumber.toString() === (parseInt(chapterId) - 1).toString());
    const nextChapter = chapters.find(ch => ch.chapterNumber.toString() === (parseInt(chapterId) + 1).toString());
    if (!currentChapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const chapterHadiths  = await axios.get(`${ISLAMIC_LIBRARY_API_BASE}/hadiths?apiKey=${ISLAMIC_LIBRARY_API_KEY}&book=${bookSlug}&chapter=${chapterId}`);
    const totalHadiths = chapterHadiths.data.hadiths.length;
    res.json({
      status: 200,
      navigation: {
        current: {
          id: currentChapter.chapterNumber,
          title: currentChapter.chapterArabic,
          titleEn: currentChapter.chapterEnglish,
          hadithsCount: totalHadiths
        },
        previous: prevChapter ? {
          id: prevChapter.chapterNumber,
          title: prevChapter.chapterArabic,
          titleEn: prevChapter.chapterEnglish
        } : null,
        next: nextChapter ? {
          id: nextChapter.chapterNumber,
          title: nextChapter.chapterArabic,
          titleEn: nextChapter.chapterEnglish
        } : null,
        totalChapters: chapters.length,
        currentChapterIndex: currentChapter.chapterNumber
      }
    });
  } catch (error) {
    console.error("Error fetching chapter navigation:", error);
    res.status(500).json({ message: "Error fetching chapter navigation" });
  }
});
// Advanced search endpoint with enhanced capabilities
router.get("/search", async (req, res) => {
  try {
    const {
      q, // Main search query
      book,
      category,
      narrator,
      status,
      chapter,
      sort = "relevance", // relevance, book, chapter, hadithNumber
      order = "desc", // asc, desc
      paginate = 25,
      page = 1,
      includeLocal = "true", // Whether to include local books
      includeAPI = "true", // Whether to include API books
    } = req.query;

    if (!q && !book && !category && !narrator) {
      return res.status(400).json({
        status: 400,
        message: "At least one search parameter is required",
      });
    }

    const results = [];
    const searchTerms = q ? q.toLowerCase().split(/\s+/) : [];

    // Search in local books
    if (includeLocal === "true") {
      for (const [bookSlug, bookConfig] of Object.entries(LOCAL_BOOKS)) {
        // Skip if book filter is applied and doesn't match
        if (book && bookSlug !== book) {
          continue;
        }

        // Skip if category filter is applied and book doesn't match
        if (category && bookConfig.category !== category) {
          continue;
        }

        const bookData = await loadLocalBook(bookSlug);
        if (bookData && bookData.hadiths) {
          const matchingHadiths = bookData.hadiths.filter((hadith) => {
            let matches = true;

            // Search in main query
            if (q) {
              const normalizedSearch = normalizeArabicText(q);
              const normalizedHadithArabic = normalizeArabicText(hadith.arabic || '');
              const hadithText = `${normalizedHadithArabic} ${hadith.english.text} ${hadith.english.narrator}`.toLowerCase();
              matches = matches && searchTerms.every(term => {
                const normalizedTerm = normalizeArabicText(term);
                return hadithText.includes(normalizedTerm.toLowerCase());
              });
            }

            // Filter by narrator
            if (narrator) {
              matches = matches && hadith.english.narrator.toLowerCase().includes(narrator.toLowerCase());
            }

            // Filter by chapter
            if (chapter) {
              matches = matches && hadith.chapterId.toString().includes(chapter);
            }

            return matches;
          });

          // Transform and add to results with relevance score
          matchingHadiths.forEach((hadith) => {
            let relevanceScore = 0;
            
            if (q) {
              const normalizedSearch = normalizeArabicText(q);
              const normalizedHadithArabic = normalizeArabicText(hadith.arabic || '');
              searchTerms.forEach(term => {
                const normalizedTerm = normalizeArabicText(term);
                if (normalizedHadithArabic.toLowerCase().includes(normalizedTerm.toLowerCase())) relevanceScore += 3;
                if (hadith.english.text.toLowerCase().includes(term)) relevanceScore += 2;
                if (hadith.english.narrator.toLowerCase().includes(term)) relevanceScore += 1;
              });
            }

            results.push({
              id: hadith.id,
              hadithNumber: hadith.idInBook.toString(),
              englishNarrator: hadith.english.narrator || "",
              hadithEnglish: hadith.english.text || "",
              hadithUrdu: "",
              urduNarrator: "",
              hadithArabic: hadith.arabic || "",
              headingArabic: null,
              headingUrdu: null,
              headingEnglish: null,
              chapterId: hadith.chapterId.toString(),
              bookSlug: bookSlug,
              volume: "1",
              status: "sahih",
              relevanceScore,
              book: {
                id: bookConfig.id,
                bookName: bookConfig.bookName,
                writerName: bookConfig.writerName,
                aboutWriter: null,
                writerDeath: "",
                bookSlug: bookSlug,
              },
              chapter: {
                id: hadith.chapterId,
                chapterNumber: hadith.chapterId.toString(),
                chapterEnglish: `Chapter ${hadith.chapterId}`,
                chapterUrdu: `باب ${hadith.chapterId}`,
                chapterArabic: `باب ${hadith.chapterId}`,
                bookSlug: bookSlug,
              },
            });
          });
        }
      }
    }

    // Search in API books
    if (includeAPI === "true") {
      try {
        let queryString = `apiKey=${ISLAMIC_LIBRARY_API_KEY}&paginate=100&page=1`;

        if (q) queryString += `&hadithEnglish=${encodeURIComponent(q)}`;
        if (book) queryString += `&book=${encodeURIComponent(book)}`;
        if (narrator) queryString += `&narrator=${encodeURIComponent(narrator)}`;
        if (status) queryString += `&status=${encodeURIComponent(status)}`;
        if (chapter) queryString += `&chapter=${encodeURIComponent(chapter)}`;

        const response = await axios.get(
          `${ISLAMIC_LIBRARY_API_BASE}/hadiths?${queryString}`
        );

        if (response.data.status === 200 && response.data.hadiths.data) {
          // Add relevance scores to API results
          const apiResults = response.data.hadiths.data.map(hadith => {
            let relevanceScore = 0;
            
            if (q) {
              const normalizedSearch = normalizeArabicText(q);
              const normalizedHadithArabic = normalizeArabicText(hadith.hadithArabic || '');
              searchTerms.forEach(term => {
                const normalizedTerm = normalizeArabicText(term);
                if (normalizedHadithArabic.toLowerCase().includes(normalizedTerm.toLowerCase())) relevanceScore += 3;
                if (hadith.hadithEnglish.toLowerCase().includes(term)) relevanceScore += 2;
                if (hadith.englishNarrator.toLowerCase().includes(term)) relevanceScore += 1;
              });
            }

            return {
              ...hadith,
              relevanceScore,
            };
          });

          results.push(...apiResults);
        }
      } catch (error) {
        console.error("Error searching API books:", error);
      }
    }

    // Sort results
    results.sort((a, b) => {
      if (sort === "relevance") {
        if (order === "desc") {
          return b.relevanceScore - a.relevanceScore;
        } else {
          return a.relevanceScore - b.relevanceScore;
        }
      } else if (sort === "book") {
        const comparison = a.book.bookName.localeCompare(b.book.bookName);
        return order === "desc" ? -comparison : comparison;
      } else if (sort === "chapter") {
        const comparison = a.chapterId.localeCompare(b.chapterId);
        return order === "desc" ? -comparison : comparison;
      } else if (sort === "hadithNumber") {
        const comparison = parseInt(a.hadithNumber) - parseInt(b.hadithNumber);
        return order === "desc" ? -comparison : comparison;
      }
      return 0;
    });

    // Apply pagination
    const startIndex = (page - 1) * paginate;
    const endIndex = startIndex + parseInt(paginate);
    const paginatedResults = results.slice(startIndex, endIndex);

    // Remove relevanceScore from final results
    const finalResults = paginatedResults.map(({ relevanceScore, ...hadith }) => hadith);

    return res.json({
      status: 200,
      message: "Search completed successfully",
      search: {
        query: q,
        filters: {
          book,
          category,
          narrator,
          status,
          chapter,
        },
        sort: {
          field: sort,
          order,
        },
        results: {
          data: finalResults,
          current_page: parseInt(page),
          last_page: Math.ceil(results.length / paginate),
          per_page: parseInt(paginate),
          total: results.length,
          from: results.length > 0 ? startIndex + 1 : 0,
          to: Math.min(endIndex, results.length),
          next_page_url: page < Math.ceil(results.length / paginate) 
            ? `/api/islamic-library/search?page=${parseInt(page) + 1}&q=${encodeURIComponent(q || '')}` 
            : null,
          prev_page_url: page > 1 
            ? `/api/islamic-library/search?page=${parseInt(page) - 1}&q=${encodeURIComponent(q || '')}` 
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Error in advanced search:", error);
    res.status(500).json({
      status: 500,
      message: "Error performing search",
      error: error.message,
    });
  }
});

// Get search suggestions and autocomplete
router.get("/suggestions", async (req, res) => {
  try {
    const { q, type = "all" } = req.query; // type: all, narrators, books, chapters

    if (!q || q.length < 2) {
      return res.json({
        status: 200,
        suggestions: [],
      });
    }

    const suggestions = [];
    const query = q.toLowerCase();
    const normalizedQuery = normalizeArabicText(q);

    if (type === "all" || type === "narrators") {
      // Get narrator suggestions from local books
      for (const [bookSlug, bookConfig] of Object.entries(LOCAL_BOOKS)) {
        const bookData = await loadLocalBook(bookSlug);
        if (bookData && bookData.hadiths) {
          const narrators = new Set();
          bookData.hadiths.forEach(hadith => {
            if (hadith.english.narrator && 
                (hadith.english.narrator.toLowerCase().includes(query) ||
                 normalizeArabicText(hadith.english.narrator).toLowerCase().includes(normalizedQuery.toLowerCase()))) {
              narrators.add(hadith.english.narrator);
            }
          });
          
          narrators.forEach(narrator => {
            suggestions.push({
              type: "narrator",
              value: narrator,
              book: bookConfig.bookNameEn,
              bookSlug: bookSlug,
            });
          });
        }
      }
    }

    if (type === "all" || type === "books") {
      // Book suggestions
      Object.values(LOCAL_BOOKS).forEach(book => {
        const normalizedBookName = normalizeArabicText(book.bookName);
        const normalizedBookNameEn = normalizeArabicText(book.bookNameEn);
        
        if (book.bookNameEn.toLowerCase().includes(query) ||
            book.bookName.toLowerCase().includes(query) ||
            normalizedBookNameEn.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
            normalizedBookName.toLowerCase().includes(normalizedQuery.toLowerCase())) {
          suggestions.push({
            type: "book",
            value: book.bookNameEn,
            bookSlug: book.bookSlug,
            category: book.category,
          });
        }
      });
    }

    if (type === "all" || type === "chapters") {
      // Chapter suggestions from local books
      for (const [bookSlug, bookConfig] of Object.entries(LOCAL_BOOKS)) {
        const bookData = await loadLocalBook(bookSlug);
        if (bookData && bookData.hadiths) {
          const chapters = new Set();
          bookData.hadiths.forEach(hadith => {
            chapters.add(hadith.chapterId);
          });
          
          chapters.forEach(chapterId => {
            if (chapterId.toString().includes(query)) {
              suggestions.push({
                type: "chapter",
                value: `Chapter ${chapterId}`,
                chapterId: chapterId.toString(),
                book: bookConfig.bookNameEn,
                bookSlug: bookSlug,
              });
            }
          });
        }
      }
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.value === suggestion.value && s.type === suggestion.type)
    );

    return res.json({
      status: 200,
      suggestions: uniqueSuggestions.slice(0, 20), // Limit to 20 suggestions
    });
  } catch (error) {
    console.error("Error getting suggestions:", error);
    res.status(500).json({
      status: 500,
      message: "Error getting suggestions",
      error: error.message,
    });
  }
});

// Get search statistics and analytics
router.get("/search-stats", async (req, res) => {
  try {
    const stats = {
      totalBooks: Object.keys(LOCAL_BOOKS).length,
      totalHadiths: 0,
      categories: {},
      books: [],
    };

    // Calculate statistics for local books
    for (const [bookSlug, bookConfig] of Object.entries(LOCAL_BOOKS)) {
      const bookData = await loadLocalBook(bookSlug);
      if (bookData && bookData.hadiths) {
        const hadithCount = bookData.hadiths.length;
        stats.totalHadiths += hadithCount;
        
        stats.books.push({
          slug: bookSlug,
          name: bookConfig.bookNameEn,
          hadithCount,
          category: bookConfig.category,
        });

        // Category statistics
        if (!stats.categories[bookConfig.category]) {
          stats.categories[bookConfig.category] = {
            name: BOOK_CATEGORIES[bookConfig.category]?.nameEn || bookConfig.category,
            bookCount: 0,
            hadithCount: 0,
          };
        }
        stats.categories[bookConfig.category].bookCount++;
        stats.categories[bookConfig.category].hadithCount += hadithCount;
      }
    }

    return res.json({
      status: 200,
      stats,
    });
  } catch (error) {
    console.error("Error getting search stats:", error);
    res.status(500).json({
      status: 500,
      message: "Error getting search statistics",
      error: error.message,
    });
  }
});
module.exports = router;
