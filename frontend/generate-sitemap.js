import fs from "fs";
import axios from "axios";
import { SitemapStream, streamToPromise } from "sitemap";
import { createGzip } from "zlib";

// Configuration for your website
const SITE_URL = "https://hadith-shareef.com";
const API_BASE_URL = "https://hadeethenc.com/api/v1";
const HADITH_API_BASE_URL = "https://api.hadith.gading.dev";

// Fetch categories
async function fetchCategories() {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories/list/`, {
      params: { language: "ar" },
    });
    return response.data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Fetch hadiths for a specific category
async function fetchHadithsByCategory(categoryId, page = 1) {
  try {
    const response = await axios.get(`${API_BASE_URL}/hadeeths/list/`, {
      params: {
        language: "ar",
        category_id: categoryId,
        page: page,
        per_page: 1000,
      },
    });
    return response.data || [];
  } catch (error) {
    console.error(`Error fetching hadiths for category ${categoryId}:`, error);
    return [];
  }
}

// Fetch books
async function fetchBooks() {
  try {
    const response = await axios.get(`${HADITH_API_BASE_URL}/books`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
}

async function generateSitemap() {
  // Create a writable stream
  const sitemapStream = new SitemapStream({
    hostname: SITE_URL,
  });
  const writeStream = fs.createWriteStream("./public/sitemap.xml");
  const pipeline = sitemapStream.pipe(writeStream);

  try {
    // Fetch different types of content
    const [categories, books] = await Promise.all([
      fetchCategories(),
      fetchBooks(),
    ]);

    // Static Pages
    const staticPages = [
      { url: "/", priority: 1.0, changefreq: "daily" },
      { url: "/hadiths", priority: 0.9, changefreq: "daily" },
      { url: "/islamic-library", priority: 0.9, changefreq: "weekly" },
      { url: "/islamic-bookmarks", priority: 0.8, changefreq: "daily" },
      { url: "/saved", priority: 0.8, changefreq: "daily" },
      { url: "/daily-hadith", priority: 0.8, changefreq: "daily" },
      { url: "/fasting", priority: 0.6, changefreq: "weekly" },
      { url: "/sahabi-ai", priority: 0.7, changefreq: "weekly" },
      { url: "/achievements", priority: 0.5, changefreq: "weekly" },
      { url: "/notifications", priority: 0.5, changefreq: "daily" },
      { url: "/print-requests", priority: 0.4, changefreq: "weekly" },
      { url: "/profile", priority: 0.4, changefreq: "weekly" },
      { url: "/about", priority: 0.6, changefreq: "monthly" },
      { url: "/contact", priority: 0.5, changefreq: "monthly" },
      { url: "/islamic-library/help-support", priority: 0.4, changefreq: "monthly" },
      { url: "/login", priority: 0.3, changefreq: "monthly" },
      { url: "/register", priority: 0.3, changefreq: "monthly" },
    ];

    // Add static pages to sitemap with language alternates
    staticPages.forEach((page) => {
      sitemapStream.write({
        url: page.url,
        changefreq: page.changefreq,
        priority: page.priority,
        links: [
          { lang: "ar", url: `${page.url}?lang=ar` },
          { lang: "en", url: `${page.url}?lang=en` },
          { lang: "x-default", url: page.url },
        ],
      });
    });

    // Dynamic Category Routes with Hadiths
    for (const category of categories) {
      // Category page
      sitemapStream.write({
        url: `/hadiths/${category.id}/page/1`,
        changefreq: "weekly",
        priority: 0.7,
        links: [
          { lang: "ar", url: `/hadiths/${category.id}/page/1?lang=ar` },
          { lang: "en", url: `/hadiths/${category.id}/page/1?lang=en` },
          { lang: "x-default", url: `/hadiths/${category.id}/page/1` },
        ],
      });

      // Fetch hadiths for this category
      const hadiths = await fetchHadithsByCategory(category.id);

      // Individual Hadith Routes
      // Check if hadiths is an array or an object with an array
      const hadithList = Array.isArray(hadiths)
        ? hadiths
        : hadiths.data || hadiths.hadiths || [];

      hadithList.slice(0, 50).forEach((hadith, index) => {
        // Use hadith.id or a fallback
        const hadithId = hadith.id || hadith._id || index + 1;
        sitemapStream.write({
          url: `/hadiths/hadith/${hadithId}`,
          changefreq: "weekly",
          priority: 0.6,
          links: [
            { lang: "ar", url: `/hadiths/hadith/${hadithId}?lang=ar` },
            { lang: "en", url: `/hadiths/hadith/${hadithId}?lang=en` },
            { lang: "x-default", url: `/hadiths/hadith/${hadithId}` },
          ],
        });
      });
    }

    // Language Alternatives
    sitemapStream.write({
      url: "/",
      links: [
        { lang: "ar", url: "/ar" },
        { lang: "en", url: "/en" },
      ],
    });

    // End the stream
    sitemapStream.end();

    // Wait for the pipeline to finish
    await new Promise((resolve, reject) => {
      pipeline.on("finish", resolve);
      pipeline.on("error", reject);
    });

    console.log("Sitemap generated successfully!");
  } catch (error) {
    console.error("Error generating sitemap:", error);
    console.error("Detailed error:", error.stack);
  }
}

// Run the sitemap generation
generateSitemap();
