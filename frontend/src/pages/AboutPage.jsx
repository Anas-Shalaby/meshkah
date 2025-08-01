import { Helmet } from "react-helmet-async";

const AboutPage = () => {
  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{`عنا - مشكاة الأحاديث`}</title>
        <meta name="description" content={`عن مشكاة الأحاديث`} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`عنا - مشكاة الأحاديث`} />
        <meta property="og:description" content={`عن مشكاة الأحاديث`} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`عنا - مشكاة الأحاديث`} />
        <meta name="twitter:description" content={`عن مشكاة الأحاديث`} />

        {/* Structured Data - JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `عنا - مشكاة الأحاديث`,
            description: `عن مشكاة الأحاديث`,
            publisher: {
              "@type": "Organization",
              name: "مشكاة الأحاديث",
              logo: {
                "@type": "ImageObject",
                url: "https://hadith-shareef.com/favicon.png",
              },
            },
            datePublished: new Date().toISOString(),
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://hadith-shareef.com/about`,
            },
          })}
        </script>
      </Helmet>
      <div
        className="min-h-screen bg-gradient-to-br from-white via-[#f8f7fa] to-[#f3edff] py-16 px-4 font-cairo"
        dir="rtl"
      >
        <div className="max-w-3xl mx-auto w-full">
          <h1 className="text-4xl font-extrabold mb-12 text-center text-[#7440E9]">
            نبذة عنا
          </h1>
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-right text-[#7440E9]">
              من نحن
            </h2>
            <p className="text-right leading-relaxed text-gray-800">
              مشروع متخصص في نشر العلوم الإسلامية والحديثية بأسلوب معاصر وسلس.
              نهدف إلى تقريب تراث الإسلام وعلومه للمسلمين والمهتمين بطريقة سهلة
              وموثوقة.
            </p>
          </section>
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-right text-[#7440E9]">
                رسالتنا
              </h2>
              <p className="text-right leading-relaxed text-gray-800">
                توفير مصادر علمية دقيقة للأحاديث النبوية وشروحها، مع الحرص على
                الوضوح والدقة العلمية.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-right text-[#7440E9]">
                رؤيتنا
              </h2>
              <p className="text-right leading-relaxed text-gray-800">
                أن نكون المرجع الأول والأكثر موثوقية في تقديم العلوم الحديثية
                بشكل سهل ومفهوم للجميع.
              </p>
            </section>
          </div>
          <section>
            <h2 className="text-2xl font-bold mb-4 text-right text-[#7440E9]">
              قيمنا
            </h2>
            <ul className="list-disc list-inside text-right space-y-2 text-gray-800">
              <li>الدقة العلمية والموضوعية</li>
              <li>الوضوح والبساطة في العرض</li>
              <li>الاحترام والتسامح</li>
              <li>خدمة المجتمع ونشر العلم النافع</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
