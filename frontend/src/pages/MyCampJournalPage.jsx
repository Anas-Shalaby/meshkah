import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Star,
  Heart,
  Clock,
  Target,
  TrendingUp,
  Award,
  FileText,
  Download as DownloadIcon,
  Share2,
  Bookmark,
} from "lucide-react";
import SEO from "../components/SEO";

const MyCampJournalPage = () => {
  const { id } = useParams();
  const [camp, setCamp] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchCampAndJournal = async () => {
      try {
        // Fetch camp details
        const campResponse = await fetch(`/api/quran-camps/${id}`, {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        });
        const campData = await campResponse.json();
        if (campData.success) {
          setCamp(campData.data);
        }

        // Fetch user progress with journal entries
        const progressResponse = await fetch(
          `/api/quran-camps/${id}/my-progress`,
          {
            headers: {
              "x-auth-token": localStorage.getItem("token"),
            },
          }
        );
        const progressData = await progressResponse.json();
        if (progressData.success) {
          // Extract journal entries from tasks
          const entries = progressData.data.tasks
            .filter(
              (task) => task.completed && (task.journal_entry || task.notes)
            )
            .map((task) => ({
              id: task.id,
              taskId: task.id,
              title: task.title,
              dayNumber: task.day_number,
              taskType: task.task_type,
              completedAt: task.completed_at,
              journalEntry: task.journal_entry,
              notes: task.notes,
              benefits: task.notes?.includes("الفوائد المستخرجة:")
                ? task.notes
                    .split("الفوائد المستخرجة:")[1]
                    ?.split("\n\n")[0]
                    ?.trim()
                : null,
              additionalNotes: task.notes?.includes("\n\n")
                ? task.notes.split("\n\n")[1]?.trim()
                : null,
            }));

          setJournalEntries(entries);
        }
      } catch (err) {
        setError("حدث خطأ أثناء تحميل اليوميات");
        console.error("Error fetching journal:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampAndJournal();
  }, [id]);

  const filteredEntries = journalEntries
    .filter((entry) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          entry.title.toLowerCase().includes(query) ||
          entry.journalEntry?.toLowerCase().includes(query) ||
          entry.benefits?.toLowerCase().includes(query) ||
          entry.additionalNotes?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .filter((entry) => {
      // Type filter
      if (filterType === "benefits" && !entry.benefits) return false;
      if (filterType === "journal" && !entry.journalEntry) return false;
      if (filterType === "notes" && !entry.additionalNotes) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.completedAt) - new Date(a.completedAt);
        case "oldest":
          return new Date(a.completedAt) - new Date(b.completedAt);
        case "day":
          return a.dayNumber - b.dayNumber;
        default:
          return 0;
      }
    });

  const getTaskTypeIcon = (taskType) => {
    switch (taskType) {
      case "read_quran":
        return <BookOpen className="w-5 h-5" />;
      case "memorize_quran":
        return <Heart className="w-5 h-5" />;
      case "pray_with_quran":
        return <Target className="w-5 h-5" />;
      case "read_tafseer":
        return <FileText className="w-5 h-5" />;
      case "listen_tafseer":
        return <Award className="w-5 h-5" />;
      case "journal_entry":
        return <Edit className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getTaskTypeColor = (taskType) => {
    switch (taskType) {
      case "read_quran":
        return "text-green-600 bg-green-100";
      case "memorize_quran":
        return "text-purple-600 bg-purple-100";
      case "pray_with_quran":
        return "text-blue-600 bg-blue-100";
      case "read_tafseer":
        return "text-orange-600 bg-orange-100";
      case "listen_tafseer":
        return "text-red-600 bg-red-100";
      case "journal_entry":
        return "text-indigo-600 bg-indigo-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTaskTypeText = (taskType) => {
    switch (taskType) {
      case "read_quran":
        return "قراءة القرآن";
      case "memorize_quran":
        return "حفظ القرآن";
      case "pray_with_quran":
        return "الصلاة بالقرآن";
      case "read_tafseer":
        return "قراءة التفسير";
      case "listen_tafseer":
        return "الاستماع للتفسير";
      case "journal_entry":
        return "يوميات";
      default:
        return "مهمة أخرى";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportToPDF = () => {
    // Simple PDF export functionality
    const content = journalEntries
      .map(
        (entry) =>
          `اليوم ${entry.dayNumber} - ${entry.title}\n${
            entry.journalEntry || ""
          }\n${entry.benefits || ""}\n${entry.additionalNotes || ""}\n\n`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `يوميات-${camp?.name || "المخيم"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p className="text-xl font-semibold mb-2">حدث خطأ</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <SEO
        title={`يومياتي - ${camp?.name || "المخيم"} - مشكاة الأحاديث`}
        description="مراجعة وتتبع يومياتك وتدبرك في المخيم القرآني"
        keywords="يوميات، تدبر، مخيم قرآني، مراجعة"
      />

      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to={`/my-camp-journey/${id}`}
                className="flex items-center text-gray-600 hover:text-purple-600 transition-colors mr-6"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                العودة للرحلة
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={exportToPDF}
                className="flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl font-black text-lg transform hover:scale-105"
              >
                <DownloadIcon className="w-6 h-6 mr-3" />
                تصدير اليوميات
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-8">
            <Link
              to={`/my-camp-journey/${id}`}
              className="flex items-center px-6 py-4 text-gray-600 hover:text-purple-600 transition-colors border-b-2 border-transparent hover:border-purple-500"
            >
              <Calendar className="w-5 h-5 mr-2" />
              رحلتي
            </Link>
            <Link
              to={`/my-camp-journal/${id}`}
              className="flex items-center px-6 py-4 text-purple-600 border-b-2 border-purple-500 font-semibold"
            >
              <FileText className="w-5 h-5 mr-2" />
              يومياتي
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* Search */}
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث في يومياتك..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              >
                <option value="all">جميع المحتوى</option>
                <option value="benefits">الفوائد فقط</option>
                <option value="journal">اليوميات فقط</option>
                <option value="notes">الملاحظات فقط</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              >
                <option value="newest">الأحدث</option>
                <option value="oldest">الأقدم</option>
                <option value="day">حسب اليوم</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 rounded-3xl p-8 shadow-2xl border-2 border-purple-200 hover:shadow-3xl transition-all duration-500 group transform hover:scale-105">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
            <p className="text-5xl font-black text-purple-900 mb-2">
              {journalEntries.length}
            </p>
            <p className="text-purple-700 font-bold text-lg mb-3">إدخال</p>
            <div className="text-sm text-purple-600 font-medium bg-purple-100 rounded-full px-4 py-2">
              إجمالي اليوميات
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50 rounded-3xl p-8 shadow-2xl border-2 border-green-200 hover:shadow-3xl transition-all duration-500 group transform hover:scale-105">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Star className="w-8 h-8 text-white" />
              </div>
            </div>
            <p className="text-5xl font-black text-green-900 mb-2">
              {journalEntries.filter((e) => e.benefits).length}
            </p>
            <p className="text-green-700 font-bold text-lg mb-3">فوائد</p>
            <div className="text-sm text-green-600 font-medium bg-green-100 rounded-full px-4 py-2">
              مستخرجة
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 rounded-3xl p-8 shadow-2xl border-2 border-blue-200 hover:shadow-3xl transition-all duration-500 group transform hover:scale-105">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Edit className="w-8 h-8 text-white" />
              </div>
            </div>
            <p className="text-5xl font-black text-blue-900 mb-2">
              {journalEntries.filter((e) => e.journalEntry).length}
            </p>
            <p className="text-blue-700 font-bold text-lg mb-3">يوميات</p>
            <div className="text-sm text-blue-600 font-medium bg-blue-100 rounded-full px-4 py-2">
              مكتوبة
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 via-amber-100 to-yellow-50 rounded-3xl p-8 shadow-2xl border-2 border-orange-200 hover:shadow-3xl transition-all duration-500 group transform hover:scale-105">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
            <p className="text-5xl font-black text-orange-900 mb-2">
              {Math.round(
                (journalEntries.length / (camp?.duration_days || 1)) * 100
              )}
              %
            </p>
            <p className="text-orange-700 font-bold text-lg mb-3">التفاعل</p>
            <div className="text-sm text-orange-600 font-medium bg-orange-100 rounded-full px-4 py-2">
              نسبة المشاركة
            </div>
          </div>
        </div>

        {/* Enhanced Journal Entries */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-white via-purple-50 to-blue-50 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-2 border-purple-200 max-w-lg mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <FileText className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">
                لا توجد يوميات
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg font-medium">
                {searchQuery
                  ? "لم يتم العثور على نتائج للبحث"
                  : "ابدأ بكتابة يومياتك في المهام المكتملة"}
              </p>
              <Link
                to={`/my-camp-journey/${id}`}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl font-black text-lg transform hover:scale-105"
              >
                <ArrowLeft className="w-6 h-6 mr-3" />
                العودة للرحلة
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group"
              >
                {/* Entry Header */}
                <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 p-8 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div
                        className={`p-4 rounded-2xl mr-6 shadow-lg ${getTaskTypeColor(
                          entry.taskType
                        )}`}
                      >
                        {getTaskTypeIcon(entry.taskType)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {entry.title}
                        </h3>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <span className="flex items-center bg-white/80 px-3 py-1 rounded-full">
                            <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                            اليوم {entry.dayNumber}
                          </span>
                          <span className="flex items-center bg-white/80 px-3 py-1 rounded-full">
                            <Clock className="w-4 h-4 mr-2 text-blue-600" />
                            {formatDate(entry.completedAt)}
                          </span>
                          <span
                            className={`px-4 py-2 rounded-full text-xs font-bold ${getTaskTypeColor(
                              entry.taskType
                            )} shadow-sm`}
                          >
                            {getTaskTypeText(entry.taskType)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Entry Content */}
                <div className="p-8">
                  <div className="space-y-8">
                    {/* Benefits Section */}
                    {entry.benefits && (
                      <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-yellow-200 shadow-lg">
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-yellow-200 rounded-lg mr-3">
                            <Star className="w-5 h-5 text-yellow-700" />
                          </div>
                          <h4 className="text-lg font-bold text-yellow-800">
                            الفوائد المستخرجة
                          </h4>
                        </div>
                        <p className="text-yellow-800 leading-relaxed whitespace-pre-wrap text-base">
                          {entry.benefits}
                        </p>
                      </div>
                    )}

                    {/* Journal Entry */}
                    {entry.journalEntry && (
                      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-blue-200 rounded-lg mr-3">
                            <Edit className="w-5 h-5 text-blue-700" />
                          </div>
                          <h4 className="text-lg font-bold text-blue-800">
                            اليوميات
                          </h4>
                        </div>
                        <p className="text-blue-800 leading-relaxed whitespace-pre-wrap text-base">
                          {entry.journalEntry}
                        </p>
                      </div>
                    )}

                    {/* Additional Notes */}
                    {entry.additionalNotes && (
                      <div className="bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-gray-200 rounded-lg mr-3">
                            <FileText className="w-5 h-5 text-gray-700" />
                          </div>
                          <h4 className="text-lg font-bold text-gray-800">
                            ملاحظات إضافية
                          </h4>
                        </div>
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base">
                          {entry.additionalNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCampJournalPage;
