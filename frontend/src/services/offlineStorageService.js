class OfflineStorageService {
  constructor() {
    this.dbName = "IslamicLibraryDB";
    this.dbVersion = 1;
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error("Failed to open IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("IndexedDB opened successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains("books")) {
          const bookStore = db.createObjectStore("books", {
            keyPath: "bookSlug",
          });
          bookStore.createIndex("category", "category", { unique: false });
          bookStore.createIndex("downloadDate", "downloadDate", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains("chapters")) {
          const chapterStore = db.createObjectStore("chapters", {
            keyPath: "id",
          });
          chapterStore.createIndex("bookSlug", "bookSlug", { unique: false });
        }

        if (!db.objectStoreNames.contains("hadiths")) {
          const hadithStore = db.createObjectStore("hadiths", {
            keyPath: "id",
          });
          hadithStore.createIndex("bookSlug", "bookSlug", { unique: false });
          hadithStore.createIndex("chapterId", "chapterId", { unique: false });
        }

        if (!db.objectStoreNames.contains("downloadQueue")) {
          const queueStore = db.createObjectStore("downloadQueue", {
            keyPath: "id",
            autoIncrement: true,
          });
          queueStore.createIndex("bookSlug", "bookSlug", { unique: false });
          queueStore.createIndex("status", "status", { unique: false });
        }

        console.log("IndexedDB schema created successfully");
      };
    });
  }

  // Book Management
  async saveBook(bookData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["books"], "readwrite");
      const store = transaction.objectStore("books");

      const book = {
        ...bookData,
        downloadDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        isDownloaded: true,
      };

      const request = store.put(book);

      request.onsuccess = () => resolve(book);
      request.onerror = () => reject(request.error);
    });
  }

  async getBook(bookSlug) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["books"], "readonly");
      const store = transaction.objectStore("books");
      const request = store.get(bookSlug);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllBooks() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["books"], "readonly");
      const store = transaction.objectStore("books");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBook(bookSlug) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        ["books", "chapters", "hadiths"],
        "readwrite"
      );
      const bookStore = transaction.objectStore("books");
      const chapterStore = transaction.objectStore("chapters");
      const hadithStore = transaction.objectStore("hadiths");

      // Delete book
      const bookRequest = bookStore.delete(bookSlug);

      // Delete all chapters for this book
      const chapterIndex = chapterStore.index("bookSlug");
      const chapterRequest = chapterIndex.getAllKeys(bookSlug);

      chapterRequest.onsuccess = () => {
        chapterRequest.result.forEach((key) => {
          chapterStore.delete(key);
        });
      };

      // Delete all hadiths for this book
      const hadithIndex = hadithStore.index("bookSlug");
      const hadithRequest = hadithIndex.getAllKeys(bookSlug);

      hadithRequest.onsuccess = () => {
        hadithRequest.result.forEach((key) => {
          hadithStore.delete(key);
        });
      };

      bookRequest.onsuccess = () => resolve();
      bookRequest.onerror = () => reject(bookRequest.error);
    });
  }

  // Chapter Management
  async saveChapters(chapters, bookSlug) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["chapters"], "readwrite");
      const store = transaction.objectStore("chapters");

      const requests = chapters.map((chapter) => {
        const chapterData = {
          ...chapter,
          bookSlug,
          downloadDate: new Date().toISOString(),
        };
        return store.put(chapterData);
      });

      Promise.all(requests)
        .then(() => resolve(chapters))
        .catch(reject);
    });
  }

  async getChapters(bookSlug) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["chapters"], "readonly");
      const store = transaction.objectStore("chapters");
      const index = store.index("bookSlug");
      const request = index.getAll(bookSlug);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Hadith Management
  async saveHadiths(hadiths, bookSlug) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["hadiths"], "readwrite");
      const store = transaction.objectStore("hadiths");

      const requests = hadiths.map((hadith) => {
        const hadithData = {
          ...hadith,
          bookSlug,
          downloadDate: new Date().toISOString(),
        };
        return store.put(hadithData);
      });

      Promise.all(requests)
        .then(() => resolve(hadiths))
        .catch(reject);
    });
  }

  async getHadiths(bookSlug, chapterId = null) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["hadiths"], "readonly");
      const store = transaction.objectStore("hadiths");
      const index = store.index("bookSlug");
      const request = index.getAll(bookSlug);

      request.onsuccess = () => {
        let hadiths = request.result;
        console.log(
          "All hadiths for book:",
          bookSlug,
          "count:",
          hadiths.length
        );
        console.log("Sample hadith chapterId:", hadiths[0]?.chapterId);
        console.log("Requested chapterId:", chapterId);

        if (chapterId !== null) {
          // Try exact match first
          let filteredHadiths = hadiths.filter(
            (hadith) => hadith.chapterId === chapterId
          );

          // If no matches and chapterId is 0, return all hadiths (fallback for old data)
          if (filteredHadiths.length === 0 && chapterId === 0) {
            filteredHadiths = hadiths;
            console.log(
              "Using fallback: returning all hadiths for chapterId 0"
            );
          }

          hadiths = filteredHadiths;
          console.log("Filtered hadiths count:", hadiths.length);
        }
        resolve(hadiths);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Download Queue Management
  async addToDownloadQueue(bookSlug, priority = "normal") {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["downloadQueue"], "readwrite");
      const store = transaction.objectStore("downloadQueue");

      const queueItem = {
        bookSlug,
        priority,
        status: "pending",
        addedDate: new Date().toISOString(),
        attempts: 0,
      };

      const request = store.add(queueItem);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getDownloadQueue() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["downloadQueue"], "readonly");
      const store = transaction.objectStore("downloadQueue");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateQueueItemStatus(id, status, error = null) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["downloadQueue"], "readwrite");
      const store = transaction.objectStore("downloadQueue");

      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.status = status;
          item.lastUpdated = new Date().toISOString();
          if (error) item.error = error;
          if (status === "failed") item.attempts = (item.attempts || 0) + 1;

          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve(item);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error("Queue item not found"));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async removeFromQueue(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["downloadQueue"], "readwrite");
      const store = transaction.objectStore("downloadQueue");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Utility Methods
  async isBookDownloaded(bookSlug) {
    const book = await this.getBook(bookSlug);
    return book && book.isDownloaded;
  }

  async getDownloadedBooksCount() {
    const books = await this.getAllBooks();
    return books.filter((book) => book.isDownloaded).length;
  }

  async getStorageUsage() {
    if (!this.db) await this.init();

    return new Promise((resolve) => {
      const transaction = this.db.transaction(
        ["books", "chapters", "hadiths"],
        "readonly"
      );
      const bookStore = transaction.objectStore("books");
      const chapterStore = transaction.objectStore("chapters");
      const hadithStore = transaction.objectStore("hadiths");

      const bookRequest = bookStore.getAll();
      const chapterRequest = chapterStore.getAll();
      const hadithRequest = hadithStore.getAll();

      Promise.all([bookRequest, chapterRequest, hadithRequest])
        .then(([books, chapters, hadiths]) => {
          const totalSize =
            JSON.stringify(books).length +
            JSON.stringify(chapters).length +
            JSON.stringify(hadiths).length;

          resolve({
            totalSize,
            booksCount: books.length,
            chaptersCount: chapters.length,
            hadithsCount: hadiths.length,
          });
        })
        .catch(() =>
          resolve({
            totalSize: 0,
            booksCount: 0,
            chaptersCount: 0,
            hadithsCount: 0,
          })
        );
    });
  }

  async clearAllData() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        ["books", "chapters", "hadiths", "downloadQueue"],
        "readwrite"
      );
      const bookStore = transaction.objectStore("books");
      const chapterStore = transaction.objectStore("chapters");
      const hadithStore = transaction.objectStore("hadiths");
      const queueStore = transaction.objectStore("downloadQueue");

      const bookRequest = bookStore.clear();
      const chapterRequest = chapterStore.clear();
      const hadithRequest = hadithStore.clear();
      const queueRequest = queueStore.clear();

      Promise.all([bookRequest, chapterRequest, hadithRequest, queueRequest])
        .then(() => resolve())
        .catch(reject);
    });
  }

  // Migration function to fix chapterId issues in existing data
  async migrateChapterIds() {
    if (!this.db) await this.init();

    try {
      console.log("Starting chapterId migration...");

      // Get all books
      const books = await this.getAllBooks();

      for (const book of books) {
        console.log(`Migrating book: ${book.bookSlug}`);

        // Get chapters for this book
        const chapters = await this.getChapters(book.bookSlug);
        console.log(`Found ${chapters.length} chapters for ${book.bookSlug}`);

        // Get all hadiths for this book
        const allHadiths = await this.getHadiths(book.bookSlug, null);
        console.log(`Found ${allHadiths.length} hadiths for ${book.bookSlug}`);

        // Create a mapping of chapter numbers to chapter IDs
        const chapterMapping = {};
        chapters.forEach((chapter) => {
          chapterMapping[chapter.chapterNumber] = chapter.id;
        });

        console.log("Chapter mapping:", chapterMapping);

        // Update hadiths with correct chapterId
        let updatedCount = 0;
        for (const hadith of allHadiths) {
          // Try to find the correct chapter based on hadith properties
          let correctChapterId = null;

          // Method 1: Try to match by chapter number if available
          if (hadith.chapterNumber && chapterMapping[hadith.chapterNumber]) {
            correctChapterId = chapterMapping[hadith.chapterNumber];
          }
          // Method 2: If no chapter number, assign to first chapter as fallback
          else if (chapters.length > 0) {
            correctChapterId = chapters[0].id;
          }

          if (correctChapterId && hadith.chapterId !== correctChapterId) {
            // Update the hadith with correct chapterId
            const updatedHadith = { ...hadith, chapterId: correctChapterId };
            await this.saveHadith(updatedHadith, book.bookSlug);
            updatedCount++;
          }
        }

        console.log(`Updated ${updatedCount} hadiths for ${book.bookSlug}`);
      }

      console.log("ChapterId migration completed successfully!");
      return true;
    } catch (error) {
      console.error("Error during chapterId migration:", error);
      return false;
    }
  }

  // Helper function to save a single hadith
  async saveHadith(hadith, bookSlug) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["hadiths"], "readwrite");
      const store = transaction.objectStore("hadiths");

      // Add bookSlug to hadith if not present
      const hadithWithBookSlug = { ...hadith, bookSlug };

      const request = store.put(hadithWithBookSlug);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Create singleton instance
const offlineStorageService = new OfflineStorageService();

export default offlineStorageService;
