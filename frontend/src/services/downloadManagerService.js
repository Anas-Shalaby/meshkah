// Download Manager Service for Islamic Books
// Handles downloading books, chapters, and hadiths for offline reading

import offlineStorageService from "./offlineStorageService";

class DownloadManagerService {
  constructor() {
    this.isDownloading = false;
    this.currentDownload = null;
    this.downloadProgress = 0;
    this.downloadCallbacks = new Map();
  }

  // Download a complete book for offline use
  async downloadBook(
    bookSlug,
    onProgress = null,
    onComplete = null,
    onError = null
  ) {
    if (this.isDownloading) {
      throw new Error("Another download is in progress");
    }

    try {
      this.isDownloading = true;
      this.currentDownload = bookSlug;
      this.downloadProgress = 0;

      // Add to download queue
      await offlineStorageService.addToDownloadQueue(bookSlug, "high");

      // Update queue status
      const queue = await offlineStorageService.getDownloadQueue();
      const queueItem = queue.find((item) => item.bookSlug === bookSlug);
      if (queueItem) {
        await offlineStorageService.updateQueueItemStatus(
          queueItem.id,
          "downloading"
        );
      }

      // Step 1: Download book metadata and chapters (30%)
      this.updateProgress(10, onProgress);
      const bookData = await this.fetchBookData(bookSlug);
      const chapters = await this.fetchChapters(bookSlug);

      // Add chapters to book data
      bookData.chapters = chapters;
      await offlineStorageService.saveBook(bookData);

      // Step 2: Download hadiths (70%)
      this.updateProgress(30, onProgress);
      const hadiths = await this.fetchAllHadiths(bookSlug, onProgress);
      await offlineStorageService.saveHadiths(hadiths, bookSlug);

      // Step 4: Complete download (100%)
      this.updateProgress(100, onProgress);

      // Update queue status to completed
      if (queueItem) {
        await offlineStorageService.updateQueueItemStatus(
          queueItem.id,
          "completed"
        );
      }

      // Remove from queue
      if (queueItem) {
        await offlineStorageService.removeFromQueue(queueItem.id);
      }

      this.isDownloading = false;
      this.currentDownload = null;

      if (onComplete) {
        onComplete({
          bookSlug,
          totalHadiths: hadiths.length,
          totalChapters: chapters.length,
        });
      }

      return {
        success: true,
        bookSlug,
        totalHadiths: hadiths.length,
        totalChapters: chapters.length,
      };
    } catch (error) {
      console.error("Download failed:", error);

      // Update queue status to failed
      const queue = await offlineStorageService.getDownloadQueue();
      const queueItem = queue.find((item) => item.bookSlug === bookSlug);
      if (queueItem) {
        await offlineStorageService.updateQueueItemStatus(
          queueItem.id,
          "failed",
          error.message
        );
      }

      this.isDownloading = false;
      this.currentDownload = null;

      if (onError) {
        onError(error);
      }

      throw error;
    }
  }

  // Fetch book metadata from API
  async fetchBookData(bookSlug) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/islamic-library/books`
      );
      const data = await response.json();

      if (data.status === 200) {
        const book = data.allBooks.find((b) => b.bookSlug === bookSlug);
        if (book) {
          return book;
        }
      }

      throw new Error("Book not found");
    } catch (error) {
      throw new Error(`Failed to fetch book data: ${error.message}`);
    }
  }

  // Fetch chapters for a book
  async fetchChapters(bookSlug) {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/islamic-library/books/${bookSlug}/chapters`
      );
      const data = await response.json();

      if (data.status === 200) {
        return data.chapters || [];
      }

      throw new Error("Failed to fetch chapters");
    } catch (error) {
      throw new Error(`Failed to fetch chapters: ${error.message}`);
    }
  }

  // Fetch all hadiths for a book with progress updates
  async fetchAllHadiths(bookSlug, onProgress = null) {
    try {
      const chapters = await this.fetchChapters(bookSlug);
      const allHadiths = [];

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];

        // Fetch hadiths for this chapter
        const hadiths = await this.fetchHadithsForChapter(
          bookSlug,
          chapter.chapterNumber
        );

        // Assign the correct chapterId to each hadith
        const hadithsWithChapterId = hadiths.map((hadith) => ({
          ...hadith,
          chapterId: chapter.id,
        }));

        allHadiths.push(...hadithsWithChapterId);

        // Update progress (30% to 90%)
        const progress = 30 + (i / chapters.length) * 60;
        this.updateProgress(progress, onProgress);
      }

      return allHadiths;
    } catch (error) {
      throw new Error(`Failed to fetch hadiths: ${error.message}`);
    }
  }

  // Fetch hadiths for a specific chapter
  async fetchHadithsForChapter(bookSlug, chapterId) {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/islamic-library/books/${bookSlug}/chapters/${chapterId}/hadiths?paginate=1000`
      );
      const data = await response.json();

      if (data.status === 200) {
        return data.hadiths.data || [];
      }

      return [];
    } catch (error) {
      console.error(`Failed to fetch hadiths for chapter ${chapterId}:`, error);
      return [];
    }
  }

  // Update download progress
  updateProgress(progress, onProgress) {
    this.downloadProgress = progress;
    if (onProgress) {
      onProgress(progress);
    }
  }

  // Get current download status
  getDownloadStatus() {
    return {
      isDownloading: this.isDownloading,
      currentDownload: this.currentDownload,
      progress: this.downloadProgress,
    };
  }

  // Cancel current download
  async cancelDownload() {
    if (this.isDownloading && this.currentDownload) {
      // Update queue status to cancelled
      const queue = await offlineStorageService.getDownloadQueue();
      const queueItem = queue.find(
        (item) => item.bookSlug === this.currentDownload
      );
      if (queueItem) {
        await offlineStorageService.updateQueueItemStatus(
          queueItem.id,
          "cancelled"
        );
      }

      this.isDownloading = false;
      this.currentDownload = null;
      this.downloadProgress = 0;

      return true;
    }
    return false;
  }

  // Batch download multiple books
  async batchDownload(
    bookSlugs,
    onProgress = null,
    onComplete = null,
    onError = null
  ) {
    const results = [];
    const total = bookSlugs.length;

    for (let i = 0; i < bookSlugs.length; i++) {
      const bookSlug = bookSlugs[i];

      try {
        if (onProgress) {
          onProgress({
            current: i + 1,
            total,
            bookSlug,
            percentage: ((i + 1) / total) * 100,
          });
        }

        const result = await this.downloadBook(bookSlug);
        results.push({ bookSlug, success: true, ...result });
      } catch (error) {
        results.push({ bookSlug, success: false, error: error.message });

        if (onError) {
          onError({ bookSlug, error: error.message });
        }
      }
    }

    if (onComplete) {
      onComplete(results);
    }

    return results;
  }

  // Check if book is already downloaded
  async isBookDownloaded(bookSlug) {
    return await offlineStorageService.isBookDownloaded(bookSlug);
  }

  // Get download queue
  async getDownloadQueue() {
    return await offlineStorageService.getDownloadQueue();
  }

  // Retry failed downloads
  async retryFailedDownloads(
    onProgress = null,
    onComplete = null,
    onError = null
  ) {
    const queue = await offlineStorageService.getDownloadQueue();
    const failedItems = queue.filter(
      (item) => item.status === "failed" && item.attempts < 3
    );

    if (failedItems.length === 0) {
      return [];
    }

    const bookSlugs = failedItems.map((item) => item.bookSlug);
    return await this.batchDownload(bookSlugs, onProgress, onComplete, onError);
  }

  // Get storage usage information
  async getStorageInfo() {
    const usage = await offlineStorageService.getStorageUsage();
    const downloadedCount =
      await offlineStorageService.getDownloadedBooksCount();

    return {
      ...usage,
      downloadedBooksCount: downloadedCount,
      totalSizeMB: (usage.totalSize / (1024 * 1024)).toFixed(2),
    };
  }

  // Clear all downloaded data
  async clearAllData() {
    await offlineStorageService.clearAllData();
  }

  // Update downloaded books (check for updates)
  async updateDownloadedBooks(onProgress = null) {
    const downloadedBooks = await offlineStorageService.getAllBooks();
    const results = [];

    for (let i = 0; i < downloadedBooks.length; i++) {
      const book = downloadedBooks[i];

      try {
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: downloadedBooks.length,
            bookSlug: book.bookSlug,
            percentage: ((i + 1) / downloadedBooks.length) * 100,
          });
        }

        // Check if book needs update (simplified - could be more sophisticated)
        const onlineBook = await this.fetchBookData(book.bookSlug);
        const needsUpdate = onlineBook.lastUpdated !== book.lastUpdated;

        if (needsUpdate) {
          await this.downloadBook(book.bookSlug);
          results.push({ bookSlug: book.bookSlug, updated: true });
        } else {
          results.push({ bookSlug: book.bookSlug, updated: false });
        }
      } catch (error) {
        results.push({
          bookSlug: book.bookSlug,
          updated: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}

// Create singleton instance
const downloadManagerService = new DownloadManagerService();

export default downloadManagerService;
