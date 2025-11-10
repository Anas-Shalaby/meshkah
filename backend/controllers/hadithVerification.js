const axios = require("axios");
const { JSDOM } = require("jsdom");
const he = require("he");

class HadithVerificationController {
  constructor() {
    this.parser = new JSDOM();
    this.cache = new Map();
  }

  // Search for hadith in different sources
  async search(text, source = "dorar") {
    switch (source) {
      case "dorar":
        return await this.searchUsingDorar(text);
      case "sunnah":
        return await this.searchUsingSunnah(text);
      default:
        throw new Error("مصدر غير مدعوم");
    }
  }

  // Search using Dorar.net
  async searchUsingDorar(text) {
    try {
      const page = 1;
      const url = `https://dorar.net/hadith/search?q=${encodeURIComponent(
        text
      )}&st=w&xclude=&rawi%5B%5D=&page=${page}`;

      // Check cache first
      if (this.cache.has(url)) {
        return this.cache.get(url);
      }

      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const html = he.decode(response.data);
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      // Extract results
      const results = Array.from(doc.querySelectorAll(".border-bottom")).map(
        (element) => {
          const hadithElement = element.children[0];
          const infoElement = element.children[1];

          const hadith = hadithElement.textContent
            .replace(/\d+\s+-/g, "")
            .trim();
          const info = this.parseHadithInfo(infoElement);

          return {
            hadith,
            ...info,
            hasSimilarHadith: !!element.querySelector('[href*="sims"]'),
            hasAlternateHadith: !!element.querySelector('[href*="alts"]'),
            hasUsulHadith: !!element.querySelector('[href*="osoul"]'),
          };
        }
      );

      const metadata = {
        totalResults: results.length,
        page: page,
        source: "dorar",
      };

      const result = { data: results, metadata };
      this.cache.set(url, result);

      return result;
    } catch (error) {
      console.error("Error searching Dorar:", error);
      throw new Error("فشل في البحث في موقع درر");
    }
  }

  // Search using Sunnah.com
  async searchUsingSunnah(text) {
    try {
      const page = 1;
      const url = `https://sunnah.com/search?q=${encodeURIComponent(
        text
      )}&page=${page}`;

      // Check cache first
      if (this.cache.has(url)) {
        return this.cache.get(url);
      }

      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const html = he.decode(response.data);
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const allHadith = doc.querySelector(".AllHadith");
      if (!allHadith) {
        return {
          data: [],
          metadata: { totalResults: 0, page, source: "sunnah" },
        };
      }

      const totalOfHadith = parseInt(
        allHadith.querySelector("span").textContent.split(" ").pop()
      );

      const results = Array.from(doc.querySelectorAll(".boh")).map(
        (element) => {
          const collection = element.querySelector(".nounderline");
          const book = element.querySelectorAll(".nounderline")[1];

          const englishHadith = element.querySelector(".english_hadith_full");
          const arabicHadith = element.querySelector(".arabic_hadith_full");

          const reference = element.querySelector(".hadith_reference");
          const hadithNumber = reference ? reference.textContent.trim() : "";

          return {
            collection: collection ? collection.textContent.trim() : "",
            book: book ? book.textContent.trim() : "",
            englishHadith: englishHadith
              ? englishHadith.textContent.trim()
              : "",
            arabicHadith: arabicHadith ? arabicHadith.textContent.trim() : "",
            hadithNumber,
            source: "sunnah",
          };
        }
      );

      const metadata = {
        totalResults: results.length,
        totalOfHadith,
        page,
        source: "sunnah",
      };

      const result = { data: results, metadata };
      this.cache.set(url, result);

      return result;
    } catch (error) {
      console.error("Error searching Sunnah:", error);
      throw new Error("فشل في البحث في موقع السنة");
    }
  }

  // Parse hadith information from Dorar with focus on grade extraction
  parseHadithInfo(infoElement) {
    const result = {
      rawi: "",
      muhaddith: "",
      book: "",
      number: "",
      grade: "",
      explainGrade: "",
      takhrij: "",
      muhaddithId: null,
      bookId: null,
      sharhId: null,
      gradeConfidence: "low",
      source: "dorar",
    };

    const labelsMap = {
      rawi: "الراوي",
      muhaddith: "المحدث",
      book: "المصدر",
      number: "الصفحة أو الرقم",
      grade: "درجة الحديث",
      explainGrade: "خلاصة حكم المحدث",
      takhrij: "التخريج",
    };

    const normalizeText = (text) => {
      return text.split(":")[0].replace(/\|/g, "").trim();
    };

    const strongElements = [...infoElement.querySelectorAll("strong")];

    for (const strong of strongElements) {
      const label = normalizeText(strong.textContent);

      for (const [key, expectedLabel] of Object.entries(labelsMap)) {
        if (label.includes(expectedLabel)) {
          const span = strong.querySelector("span");
          if (span) {
            result[key] = span.textContent.trim();
          }
        }
      }
    }

    // Extract muhaddithId
    const muhaddithLink = infoElement.querySelector('a[view-card="mhd"]');
    if (muhaddithLink) {
      result.muhaddithId =
        muhaddithLink.getAttribute("card-link")?.match(/\d+/)?.[0] || null;
    }

    // Extract bookId
    const bookLink = infoElement.querySelector('a[view-card="book"]');
    if (bookLink) {
      result.bookId =
        bookLink.getAttribute("card-link")?.match(/\d+/)?.[0] || null;
    }

    // Extract sharhId if available
    const sharhElement = infoElement.querySelector("a[xplain]");
    const sharhId = sharhElement?.getAttribute("xplain");
    result.sharhId = sharhId && sharhId !== "0" ? sharhId : null;

    // Extract grade from explainGrade if grade is not found
    if (!result.grade || !result.grade.trim()) {
      if (result.explainGrade && result.explainGrade.trim()) {
        // Extract grade from explainGrade text
        const explainText = result.explainGrade.toLowerCase();
        if (explainText.includes("صحيح")) {
          result.grade = "صحيح";
        } else if (explainText.includes("حسن")) {
          result.grade = "حسن";
        } else if (explainText.includes("ضعيف")) {
          result.grade = "ضعيف";
        } else if (
          explainText.includes("موضوع") ||
          explainText.includes("مكذوب")
        ) {
          result.grade = "موضوع";
        } else if (
          explainText.includes("واه") ||
          explainText.includes("واهي")
        ) {
          result.grade = "واهي";
        } else if (explainText.includes("قوي")) {
          result.grade = "قوي";
        }
      }
    }

    // Set grade confidence based on found grade
    if (result.grade && result.grade.trim()) {
      result.gradeConfidence = "high";
    }

    return result;
  }

  // Get similar hadith from Dorar
  async getSimilarHadith(hadithId) {
    try {
      const url = `https://dorar.net/h/${hadithId}?sims=1`;

      if (this.cache.has(url)) {
        return this.cache.get(url);
      }

      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const html = he.decode(response.data);
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const results = Array.from(doc.querySelectorAll(".border-bottom")).map(
        (element) => {
          const hadith = element.children[0].textContent
            .replace(/-\s*\:?\s*/g, "")
            .trim();

          const info = this.parseHadithInfo(element.children[1]);

          return {
            hadith,
            ...info,
          };
        }
      );

      const metadata = {
        totalResults: results.length,
        hadithId,
        source: "dorar",
      };

      const result = { data: results, metadata };
      this.cache.set(url, result);

      return result;
    } catch (error) {
      console.error("Error getting similar hadith:", error);
      throw new Error("فشل في جلب الأحاديث المشابهة");
    }
  }

  // Get alternate hadith from Dorar
  async getAlternateHadith(hadithId) {
    try {
      const url = `https://dorar.net/h/${hadithId}?alts=1`;

      if (this.cache.has(url)) {
        return this.cache.get(url);
      }

      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const html = he.decode(response.data);
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const element = doc.querySelectorAll(".border-bottom")[1];
      if (!element) {
        throw new Error("لم يتم العثور على حديث بديل");
      }

      const hadith = element.children[0].textContent
        .replace(/-\s*\:?\s*/g, "")
        .trim();

      const info = this.parseHadithInfo(element.children[1]);

      const result = {
        hadith,
        ...info,
      };

      this.cache.set(url, result);

      return { data: result };
    } catch (error) {
      console.error("Error getting alternate hadith:", error);
      throw new Error("فشل في جلب الحديث البديل");
    }
  }

  // Get usul hadith from Dorar
  async getUsulHadith(hadithId) {
    try {
      const url = `https://dorar.net/h/${hadithId}?osoul=1`;

      if (this.cache.has(url)) {
        return this.cache.get(url);
      }

      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const html = he.decode(response.data);
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const mainElement = doc.querySelector(".border-bottom");
      if (!mainElement) {
        throw new Error("لم يتم العثور على أصول الحديث");
      }

      const hadith = mainElement.children[0].textContent
        .replace(/-\s*\:?\s*/g, "")
        .trim();

      const info = this.parseHadithInfo(mainElement.children[1]);

      // Extract usul sources
      const usulSources = [];
      const articles = doc.querySelectorAll("article");

      for (let i = 1; i < articles.length; i++) {
        const article = articles[i];
        const sourceInfo = article.querySelector("h5");

        if (sourceInfo) {
          const sourceSpan = sourceInfo.querySelector(
            'span[style*="color:maroon"]'
          );
          const sourceName = sourceSpan?.textContent.trim() || "";

          const chainSpan = sourceInfo.querySelector(
            'span[style*="color:blue"]'
          );
          const chain = chainSpan?.textContent.trim() || "";

          let fullText = sourceInfo.textContent.trim();

          if (sourceName) {
            fullText = fullText.replace(sourceName, "").trim();
          }
          if (chain) {
            fullText = fullText.replace(chain, "").trim();
          }

          const hadithText = fullText.replace(/^[،,.\s]+/, "").trim();

          usulSources.push({
            source: sourceName,
            chain: chain,
            hadithText: hadithText,
          });
        }
      }

      const result = {
        hadith,
        ...info,
        usulHadith: {
          sources: usulSources,
          count: usulSources.length,
        },
      };

      const metadata = {
        usulSourcesCount: usulSources.length,
        hadithId,
        source: "dorar",
      };

      const finalResult = { data: result, metadata };
      this.cache.set(url, finalResult);

      return finalResult;
    } catch (error) {
      console.error("Error getting usul hadith:", error);
      throw new Error("فشل في جلب أصول الحديث");
    }
  }

  // Verify hadith by searching in multiple sources
  async verifyHadith(text) {
    try {
      const [dorarResult, sunnahResult] = await Promise.allSettled([
        this.searchUsingDorar(text),
        this.searchUsingSunnah(text),
      ]);

      const verification = {
        originalText: text,
        dorar: dorarResult.status === "fulfilled" ? dorarResult.value : null,
        sunnah: sunnahResult.status === "fulfilled" ? sunnahResult.value : null,
        dorarError:
          dorarResult.status === "rejected" ? dorarResult.reason.message : null,
        sunnahError:
          sunnahResult.status === "rejected"
            ? sunnahResult.reason.message
            : null,
        verificationSummary: this.generateVerificationSummary(
          dorarResult.status === "fulfilled" ? dorarResult.value : null,
          sunnahResult.status === "fulfilled" ? sunnahResult.value : null
        ),
      };

      return verification;
    } catch (error) {
      console.error("Error verifying hadith:", error);
      throw new Error("فشل في التحقق من الحديث");
    }
  }

  // Generate verification summary with focus on hadith grading
  generateVerificationSummary(dorarResult, sunnahResult) {
    const summary = {
      foundInDorar: dorarResult && dorarResult.data.length > 0,
      foundInSunnah: sunnahResult && sunnahResult.data.length > 0,
      totalMatches:
        (dorarResult ? dorarResult.data.length : 0) +
        (sunnahResult ? sunnahResult.data.length : 0),
      grades: [],
      sources: [],
      primaryGrade: "",
      gradeConfidence: "low",
      gradeAnalysis: "",
    };

    // Collect and analyze grades from Dorar
    const dorarGrades = [];
    if (dorarResult) {
      dorarResult.data.forEach((hadith) => {
        if (hadith.grade && hadith.grade.trim()) {
          dorarGrades.push({
            grade: hadith.grade,
            confidence: hadith.gradeConfidence || "medium",
            source: hadith.book || "درر",
          });
        }
        if (hadith.book && !summary.sources.includes(hadith.book)) {
          summary.sources.push(hadith.book);
        }
      });
    }

    // Collect sources from Sunnah (for context)
    if (sunnahResult) {
      sunnahResult.data.forEach((hadith) => {
        if (hadith.collection && !summary.sources.includes(hadith.collection)) {
          summary.sources.push(hadith.collection);
        }
      });
    }

    // Analyze grades and determine primary grade
    summary.grades = dorarGrades.map((g) => g.grade);

    if (dorarGrades.length > 0) {
      // Find the most confident grade
      const highConfidenceGrades = dorarGrades.filter(
        (g) => g.confidence === "high"
      );
      const mediumConfidenceGrades = dorarGrades.filter(
        (g) => g.confidence === "medium"
      );

      if (highConfidenceGrades.length > 0) {
        summary.primaryGrade = highConfidenceGrades[0].grade;
        summary.gradeConfidence = "high";
      } else if (mediumConfidenceGrades.length > 0) {
        summary.primaryGrade = mediumConfidenceGrades[0].grade;
        summary.gradeConfidence = "medium";
      } else {
        summary.primaryGrade = dorarGrades[0].grade;
        summary.gradeConfidence = "low";
      }

      // Get the first hadith data for detailed analysis
      const firstHadithData =
        dorarResult && dorarResult.data.length > 0 ? dorarResult.data[0] : null;

      // Generate grade analysis
      summary.gradeAnalysis = this.generateGradeAnalysis(
        summary.primaryGrade,
        summary.sources,
        firstHadithData
      );
    } else {
      // No grades found
      summary.gradeAnalysis = this.generateGradeAnalysis("", summary.sources);
    }

    // Determine verification status based on grade analysis
    if (summary.totalMatches === 0) {
      summary.status = "not_found";
      summary.message = "لم يتم العثور على الحديث في المصادر المتاحة";
    } else if (summary.primaryGrade) {
      summary.status = "graded";
      summary.message = `تم تحديد درجة الحديث: ${summary.primaryGrade}`;
    } else if (summary.foundInDorar && summary.foundInSunnah) {
      summary.status = "verified";
      summary.message = "تم العثور على الحديث في مصادر متعددة";
    } else {
      summary.status = "partial";
      summary.message = "تم العثور على الحديث في مصدر واحد فقط";
    }

    return summary;
  }

  // Generate analysis for hadith grade with detailed explanations
  generateGradeAnalysis(grade, sources, hadithData = null) {
    const gradeLower = grade.toLowerCase();

    // Extract scholar and source information if available
    const scholarName = hadithData?.muhaddith || "غير محدد";
    const sourceName = hadithData?.book || "غير محدد";
    const explainGrade = hadithData?.explainGrade || "";

    if (gradeLower.includes("صحيح") || gradeLower.includes("sahih")) {
      return {
        status: "صحيح",
        message: `${scholarName} قال أنه صحيح في ${sourceName}`,
        explanation:
          explainGrade ||
          "الحديث صحيح السند والمتن، يمكن الاستدلال به في الأحكام الشرعية",
        color: "green",
        icon: "✓",
        scholar: scholarName,
        source: sourceName,
        detailedGrade: `${scholarName} قال أنه صحيح في ${sourceName}`,
      };
    } else if (gradeLower.includes("حسن") || gradeLower.includes("hasan")) {
      return {
        status: "حسن",
        message: `${scholarName} قال أنه حسن في ${sourceName}`,
        explanation:
          explainGrade || "الحديث حسن السند، يمكن الاستدلال به مع بعض التحفظات",
        color: "blue",
        icon: "✓",
        scholar: scholarName,
        source: sourceName,
        detailedGrade: `${scholarName} قال أنه حسن في ${sourceName}`,
      };
    } else if (gradeLower.includes("ضعيف") || gradeLower.includes("da'if")) {
      // Extract reason for weakness if available
      const weaknessReason = this.extractWeaknessReason(explainGrade);
      return {
        status: "ضعيف",
        message: `${scholarName} قال أنه ضعيف في ${sourceName}`,
        explanation:
          weaknessReason ||
          "الحديث ضعيف السند، لا يُستدل به في الأحكام الشرعية",
        color: "yellow",
        icon: "⚠️",
        scholar: scholarName,
        source: sourceName,
        detailedGrade: `${scholarName} قال أنه ضعيف في ${sourceName}`,
        weaknessReason: weaknessReason,
      };
    } else if (gradeLower.includes("موضوع") || gradeLower.includes("مكذوب")) {
      return {
        status: "موضوع",
        message: `${scholarName} قال أنه موضوع في ${sourceName}`,
        explanation:
          explainGrade || "هذا الحديث مكذوب على النبي صلى الله عليه وسلم",
        color: "red",
        icon: "✗",
        scholar: scholarName,
        source: sourceName,
        detailedGrade: `${scholarName} قال أنه موضوع في ${sourceName}`,
      };
    } else if (gradeLower.includes("مجهول") || gradeLower.includes("majhul")) {
      return {
        status: "مجهول",
        message: `${scholarName} قال أنه مجهول في ${sourceName}`,
        explanation: explainGrade || "الحديث مجهول السند، يحتاج لمزيد من البحث",
        color: "gray",
        icon: "?",
        scholar: scholarName,
        source: sourceName,
        detailedGrade: `${scholarName} قال أنه مجهول في ${sourceName}`,
      };
    } else if (gradeLower.includes("واه") || gradeLower.includes("واهي")) {
      const weaknessReason = this.extractWeaknessReason(explainGrade);
      return {
        status: "واهي",
        message: `${scholarName} قال أنه واهي في ${sourceName}`,
        explanation:
          weaknessReason ||
          "الحديث واهي السند، لا يُستدل به في الأحكام الشرعية",
        color: "red",
        icon: "✗",
        scholar: scholarName,
        source: sourceName,
        detailedGrade: `${scholarName} قال أنه واهي في ${sourceName}`,
        weaknessReason: weaknessReason,
      };
    } else if (gradeLower.includes("قوي")) {
      return {
        status: "قوي",
        message: `${scholarName} قال أنه قوي في ${sourceName}`,
        explanation:
          explainGrade ||
          "الحديث قوي السند، يمكن الاستدلال به في الأحكام الشرعية",
        color: "green",
        icon: "✓",
        scholar: scholarName,
        source: sourceName,
        detailedGrade: `${scholarName} قال أنه قوي في ${sourceName}`,
      };
    } else if (
      sources.some((s) => s.includes("البخاري") || s.includes("مسلم"))
    ) {
      return {
        status: "موثوق",
        message: "الحديث في مصادر موثوقة",
        explanation: "الحديث موجود في مصادر موثوقة مثل صحيح البخاري أو مسلم",
        color: "green",
        icon: "✓",
        scholar: "البخاري/مسلم",
        source: "صحيح البخاري/مسلم",
        detailedGrade: "موجود في صحيح البخاري أو مسلم",
      };
    } else {
      return {
        status: "غير محدد",
        message: "درجة الحديث غير محددة",
        explanation: "الحديث موجود في المصادر ولكن يحتاج لمزيد من التحقق",
        color: "gray",
        icon: "?",
        scholar: scholarName,
        source: sourceName,
        detailedGrade: "درجة غير محددة",
      };
    }
  }

  // Extract reason for weakness from explainGrade text
  extractWeaknessReason(explainGrade) {
    if (!explainGrade) return null;

    const weaknessKeywords = [
      "سند ضعيف",
      "راوي ضعيف",
      "مجهول",
      "متروك",
      "كذاب",
      "ضعيف الحفظ",
      "اختلط",
      "فيه نظر",
      "لا يثبت",
      "لا يصح",
      "موضوع",
      "مكذوب",
      "واهي",
      "ضعيف جداً",
      "لا يعرف",
      "مجهول الحال",
    ];

    for (const keyword of weaknessKeywords) {
      if (explainGrade.includes(keyword)) {
        return `سبب التضعيف: ${explainGrade}`;
      }
    }

    return `سبب التضعيف: ${explainGrade}`;
  }
}

module.exports = new HadithVerificationController();
