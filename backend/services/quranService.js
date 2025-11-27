const axios = require("axios");
const db = require("../config/database");

class QuranService {
  /**
   * Get verses from a surah
   * @param {number} surahNumber - Surah number (1-114)
   * @param {number} from - Starting verse number
   * @param {number} to - Ending verse number
   * @param {string} reciter - Reciter identifier (ar.minshawi or ar.alafasy)
   * @returns {Promise<Array>} Array of verses
   */
  static async getVerses(surahNumber, from, to, reciter = "ar.minshawi") {
    // Only allow ar.minshawi or ar.alafasy
    if (reciter !== "ar.minshawi" && reciter !== "ar.alafasy") {
      reciter = "ar.minshawi";
    }

    try {
      // Validate inputs
      if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
        throw new Error("رقم السورة غير صحيح");
      }

      if (!from || from < 1) {
        throw new Error("رقم الآية غير صحيح");
      }

      if (to && to < from) {
        throw new Error(
          "رقم الآية النهائية يجب أن يكون أكبر من أو يساوي رقم الآية الأولى"
        );
      }

      const verses = [];
      const toVerse = to || from;

      // Fetch each verse individually to get the global verse number
      for (let verseNumber = from; verseNumber <= toVerse; verseNumber++) {
        try {
          // Use ar.asad edition to get verse data (it's the standard edition)
          const apiUrl = `https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/ar.asad`;

          const response = await axios.get(apiUrl, {
            timeout: 10000,
          });

          if (response.data && response.data.data) {
            const ayah = response.data.data;
            const globalVerseNumber = ayah.number; // Global verse number (1-6236)

            // Build audio URL using global verse number
            const audioUrl = `https://cdn.islamic.network/quran/audio/128/${reciter}/${globalVerseNumber}.mp3`;

            verses.push({
              number: ayah.numberInSurah,
              globalNumber: globalVerseNumber,
              text: ayah.text,
              translation: null,
              audio_url: audioUrl,
              juz: ayah.juz || null,
              page: ayah.page || null,
              ruku: ayah.ruku || null,
              manzil: ayah.manzil || null,
            });
          }
        } catch (verseError) {
          console.error(
            `Error fetching verse ${surahNumber}:${verseNumber}:`,
            verseError.message
          );
          // Continue to next verse even if one fails
        }
      }

      if (verses.length === 0) {
        throw new Error("لم يتم العثور على أي آيات");
      }

      return verses;
    } catch (error) {
      console.error("Error in QuranService.getVerses:", error);
      throw error;
    }
  }

  /**
   * Get surah information
   * @param {number} surahNumber - Surah number (1-114)
   * @returns {Promise<Object>} Surah information
   */
  static async getSurahInfo(surahNumber) {
    try {
      if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
        throw new Error("رقم السورة غير صحيح");
      }

      const apiUrl = `https://api.alquran.cloud/v1/surah/${surahNumber}`;

      try {
        const response = await axios.get(apiUrl, {
          timeout: 10000,
        });

        if (response.data && response.data.data) {
          const surah = response.data.data;
          return {
            number: surah.number,
            name: surah.name,
            englishName: surah.englishName,
            englishNameTranslation: surah.englishNameTranslation,
            numberOfAyahs: surah.numberOfAyahs,
            revelationType: surah.revelationType,
          };
        }
      } catch (apiError) {
        console.error("Error fetching surah info:", apiError);
        return null;
      }

      return null;
    } catch (error) {
      console.error("Error in QuranService.getSurahInfo:", error);
      throw error;
    }
  }

  /**
   * Search in Quran verses
   * @param {string} searchTerm - Search term
   * @param {number} surahNumber - Optional: limit to specific surah
   * @returns {Promise<Array>} Array of matching verses
   */
  static async searchVerses(searchTerm, surahNumber = null) {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        throw new Error("مصطلح البحث يجب أن يكون على الأقل حرفين");
      }

      // This would require a more comprehensive search
      // For now, we'll return a basic structure
      // In production, you might want to use a dedicated Quran search API
      // or implement full-text search in your database

      return [];
    } catch (error) {
      console.error("Error in QuranService.searchVerses:", error);
      throw error;
    }
  }

  /**
   * Get tafseer for specific verses using the new tafsir API
   * @param {number} surahNumber
   * @param {number} from
   * @param {number} to
   * @param {string} tafsirId
   * @returns {Promise<Array>}
   */
  static async getTafseer(surahNumber, from, to, tafsirId = 1) {
    try {
      if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
        throw new Error("رقم السورة غير صحيح");
      }

      if (!from || from < 1) {
        throw new Error("رقم الآية غير صحيح");
      }

      if (to && to < from) {
        throw new Error(
          "رقم الآية النهائية يجب أن يكون أكبر من أو يساوي رقم الآية الأولى"
        );
      }

      // Map old tafsir IDs to new edition slugs from the tafsir API
      const TAFSIR_EDITION_MAP = {
        1: {
          name: "التفسير الميسر",
          slug: "ar-tafsir-muyassar",
          language: "ar",
        },
        2: { name: "الجلالين", slug: "ar-tafsir-al-wasit", language: "ar" }, // Using Al-Wasit as Arabic Al-Jalalayn not available
        3: {
          name: "تفسير السعدي",
          slug: "ar-tafseer-al-saddi",
          language: "ar",
        },
        4: {
          name: "تفسير ابن كثير",
          slug: "ar-tafsir-ibn-kathir",
          language: "ar",
        },
        5: { name: "تفسير الوسيط", slug: "ar-tafsir-al-wasit", language: "ar" },
        6: {
          name: "تفسير البغوي",
          slug: "ar-tafsir-al-baghawi",
          language: "ar",
        },
        7: {
          name: "تفسير القرطبي",
          slug: "ar-tafseer-al-qurtubi",
          language: "ar",
        },
        8: {
          name: "تفسير الطبري",
          slug: "ar-tafsir-al-tabari",
          language: "ar",
        },
      };

      let tafsirNumericId = parseInt(tafsirId, 10);
      if (!TAFSIR_EDITION_MAP[tafsirNumericId]) {
        tafsirNumericId = 1;
      }

      const editionInfo = TAFSIR_EDITION_MAP[tafsirNumericId];
      const editionSlug = editionInfo.slug;
      const apiBaseUrl =
        "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir";

      const tafseerResults = [];
      const toVerse = to || from;
      let verseMap = new Map();

      // Get verse text for context
      try {
        const versesData = await this.getVerses(
          surahNumber,
          from,
          toVerse,
          "ar.minshawi"
        );

        versesData.forEach((verse) => {
          verseMap.set(verse.number, verse);
        });
      } catch (verseError) {
        console.warn(
          "Unable to fetch verse text for tafseer:",
          verseError.message
        );
      }

      // Fetch tafseer for each verse using the new API
      for (let verseNumber = from; verseNumber <= toVerse; verseNumber++) {
        try {
          // Use the endpoint: /editions/{editionSlug}/{surahNumber}/{ayahNumber}
          const apiUrl = `${apiBaseUrl}/${editionSlug}/${surahNumber}/${verseNumber}.json`;

          const response = await axios.get(apiUrl, {
            timeout: 15000,
            headers: {
              Accept: "application/json",
            },
          });

          if (response.data && response.data.text) {
            const verseInfo = verseMap.get(verseNumber);
            tafseerResults.push({
              surah: surahNumber,
              verse: verseNumber,
              globalVerse: verseInfo?.globalNumber || verseInfo?.number || null,
              tafsir: response.data.text,
              tafsir_id: tafsirNumericId,
              tafsir_name: editionInfo.name,
              surahName: null, // Will be derived from verseInfo if needed
              verseText: verseInfo?.text || null,
              verseAudio: verseInfo?.audio_url || null,
            });
          } else {
            throw new Error("No tafsir text returned");
          }
        } catch (error) {
          console.error(
            `Error fetching tafseer for ${surahNumber}:${verseNumber} from ${editionSlug}:`,
            error.message
          );

          // If individual verse fails, try fetching the whole surah and extract the verse
          try {
            const surahApiUrl = `${apiBaseUrl}/${editionSlug}/${surahNumber}.json`;
            const surahResponse = await axios.get(surahApiUrl, {
              timeout: 15000,
            });

            // Handle both array format and object with ayahs array
            let ayahsArray = null;
            if (Array.isArray(surahResponse.data)) {
              ayahsArray = surahResponse.data;
            } else if (
              surahResponse.data &&
              Array.isArray(surahResponse.data.ayahs)
            ) {
              ayahsArray = surahResponse.data.ayahs;
            }

            if (ayahsArray) {
              const verseData = ayahsArray.find(
                (item) => item.ayah === verseNumber
              );

              if (verseData && verseData.text) {
                const verseInfo = verseMap.get(verseNumber);
                tafseerResults.push({
                  surah: surahNumber,
                  verse: verseNumber,
                  globalVerse:
                    verseInfo?.globalNumber || verseInfo?.number || null,
                  tafsir: verseData.text,
                  tafsir_id: tafsirNumericId,
                  tafsir_name: editionInfo.name,
                  surahName: null,
                  verseText: verseInfo?.text || null,
                  verseAudio: verseInfo?.audio_url || null,
                });
              } else {
                throw new Error(`Verse ${verseNumber} not found in surah data`);
              }
            } else {
              throw new Error("Invalid surah data format");
            }
          } catch (fallbackError) {
            console.error(
              `Fallback fetch also failed for ${surahNumber}:${verseNumber}:`,
              fallbackError.message
            );
            const verseInfo = verseMap.get(verseNumber);
            tafseerResults.push({
              surah: surahNumber,
              verse: verseNumber,
              tafsir: "حدث خطأ أثناء جلب التفسير لهذه الآية.",
              tafsir_id: tafsirNumericId,
              tafsir_name: editionInfo.name,
              isFallback: true,
              verseText: verseInfo?.text || null,
              verseAudio: verseInfo?.audio_url || null,
            });
          }
        }
      }

      return tafseerResults;
    } catch (error) {
      console.error("Error in QuranService.getTafseer:", error);
      throw error;
    }
  }
}

module.exports = QuranService;
