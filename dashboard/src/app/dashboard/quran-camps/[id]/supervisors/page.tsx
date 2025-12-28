"use client";

// @ts-nocheck
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  Search,
  UserPlus,
  Mail,
  Calendar,
  GraduationCap,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { dashboardService } from "@/services/api";
import { ActionToolbar } from "@/components/ui/action-toolbar";
import { ChipPill } from "@/components/ui/chip-pill";
import { CampNavigation } from "@/components/quran-camps/CampNavigation";

type Supervisor = {
  id: number;
  user_id: number;
  username: string;
  email: string;
  avatar_url?: string;
  cohort_number: number | null;
  created_at: string;
  created_by_username?: string;
};

type Camp = {
  id: number;
  name: string;
};

export default function SupervisorsPage() {
  const params = useParams();
  const router = useRouter();
  const rawCampId = params?.id;
  const campId = Array.isArray(rawCampId) ? rawCampId[0] : rawCampId || "";

  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [camp, setCamp] = useState<Camp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cohortFilter, setCohortFilter] = useState<number | "all" | "general">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (campId) {
      loadSupervisors();
      loadCampDetails();
    }
  }, [campId, cohortFilter]);

  const loadCampDetails = async () => {
    try {
      const response = await dashboardService.getCampDetailsForAdmin(campId);
      setCamp(response.data.camp);
    } catch (err) {
      console.error("Error loading camp:", err);
    }
  };

  const loadSupervisors = async () => {
    try {
      setLoading(true);
      const cohortNumber =
        cohortFilter === "all" || cohortFilter === "general"
          ? undefined
          : cohortFilter;

      const response = await dashboardService.getCampSupervisors(
        campId,
        cohortNumber === undefined && cohortFilter === "general"
          ? undefined
          : cohortNumber
      );

      if (response.success) {
        let filtered = response.data || [];

        // Filter by cohort if needed
        if (cohortFilter === "general") {
          filtered = filtered.filter(
            (s: Supervisor) => s.cohort_number === null
          );
        } else if (cohortFilter !== "all" && typeof cohortFilter === "number") {
          filtered = filtered.filter(
            (s: Supervisor) => s.cohort_number === cohortFilter
          );
        }

        setSupervisors(filtered);
        setError(null);
      } else {
        setError(response.message || "حدث خطأ في جلب المشرفين");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "حدث خطأ في الاتصال");
      console.error("Error loading supervisors:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSupervisor = async (
    userId: number,
    cohortNumber: number | null
  ) => {
    if (!confirm("هل أنت متأكد من إزالة هذا المشرف؟")) {
      return;
    }

    try {
      await dashboardService.removeCampSupervisor(
        campId,
        userId,
        cohortNumber || undefined
      );
      loadSupervisors();
    } catch (err: any) {
      alert(err?.response?.data?.message || "حدث خطأ في إزالة المشرف");
      console.error("Error removing supervisor:", err);
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    loadSupervisors();
  };

  const filteredSupervisors = supervisors.filter((supervisor) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      supervisor.username.toLowerCase().includes(query) ||
      supervisor.email.toLowerCase().includes(query)
    );
  });

  // Get unique cohort numbers from supervisors
  const cohortNumbers = Array.from(
    new Set(
      supervisors
        .map((s) => s.cohort_number)
        .filter((num): num is number => num !== null)
    )
  ).sort((a, b) => b - a);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/quran-camps/${campId}`}
              className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                إدارة المشرفين
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {camp?.name || "جاري التحميل..."}
              </p>
            </div>
          </div>
        </div>

        <CampNavigation campId={campId} />

        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-100 mb-2">
                قائمة المشرفين
              </h2>
              <p className="text-sm text-slate-400">
                المشرفون لديهم صلاحيات كاملة في إدارة المخيم (مخفيين عن
                المستخدمين)
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary/30 hover:border-primary/60"
            >
              <UserPlus className="h-4 w-4" />
              إضافة مشرف
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو البريد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCohortFilter("all")}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  cohortFilter === "all"
                    ? "border-primary/60 bg-primary/20 text-primary-100"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setCohortFilter("general")}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  cohortFilter === "general"
                    ? "border-primary/60 bg-primary/20 text-primary-100"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                مشرفون عامون
              </button>
              {cohortNumbers.map((cohortNum) => (
                <button
                  key={cohortNum}
                  onClick={() => setCohortFilter(cohortNum)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    cohortFilter === cohortNum
                      ? "border-primary/60 bg-primary/20 text-primary-100"
                      : "border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  فوج {cohortNum}
                </button>
              ))}
            </div>
          </div>

          {/* Supervisors List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-red-200">
              {error}
            </div>
          ) : filteredSupervisors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-slate-600" />
              <p className="text-slate-400">
                {searchQuery ? "لا توجد نتائج للبحث" : "لا يوجد مشرفين حالياً"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-sm text-primary-100 hover:text-primary-50"
                >
                  إضافة مشرف جديد
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSupervisors.map((supervisor) => (
                <div
                  key={`${supervisor.user_id}-${
                    supervisor.cohort_number || "general"
                  }`}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-900 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40">
                        {supervisor.avatar_url ? (
                          <img
                            src={supervisor.avatar_url}
                            alt={supervisor.username}
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-primary-100" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-100">
                            {supervisor.username}
                          </h3>
                          {supervisor.cohort_number ? (
                            <ChipPill
                              variant="default"
                              className="text-xs border-purple-500/40 bg-purple-900/30 text-purple-200"
                            >
                              <GraduationCap className="h-3 w-3" />
                              فوج {supervisor.cohort_number}
                            </ChipPill>
                          ) : (
                            <ChipPill
                              variant="default"
                              className="text-xs border-blue-500/40 bg-blue-900/30 text-blue-200"
                            >
                              مشرف عام
                            </ChipPill>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{supervisor.email}</span>
                          </div>
                          {supervisor.created_by_username && (
                            <div className="flex items-center gap-1">
                              <UserPlus className="h-3 w-3" />
                              <span>
                                أضافه: {supervisor.created_by_username}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(
                                supervisor.created_at
                              ).toLocaleDateString("ar-SA")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleRemoveSupervisor(
                          supervisor.user_id,
                          supervisor.cohort_number
                        )
                      }
                      className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-200 transition hover:bg-red-500/20 hover:border-red-500/50"
                      title="إزالة المشرف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Supervisor Modal */}
      {showAddModal && (
        <AddSupervisorModal
          campId={campId}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          existingSupervisors={supervisors}
        />
      )}
    </DashboardLayout>
  );
}

// Add Supervisor Modal Component
type AddSupervisorModalProps = {
  campId: string;
  onClose: () => void;
  onSuccess: () => void;
  existingSupervisors: Supervisor[];
};

function AddSupervisorModal({
  campId,
  onClose,
  onSuccess,
  existingSupervisors,
}: AddSupervisorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [cohortNumber, setCohortNumber] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [cohorts, setCohorts] = useState<any[]>([]);

  useEffect(() => {
    loadCohorts();
  }, []);

  const loadCohorts = async () => {
    try {
      const response = await dashboardService.getCampCohorts(campId);
      if (response.success) {
        setCohorts(response.data || []);
      }
    } catch (err) {
      console.error("Error loading cohorts:", err);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      // Use admin users API to search - fetch multiple pages if needed
      const response = await dashboardService.getUsers(1, 50);

      if (response?.data?.users) {
        // Filter by search query and existing supervisors
        const existingUserIds = new Set(
          existingSupervisors.map((s) => s.user_id)
        );
        const query = searchQuery.toLowerCase();
        const filtered = response.data.users.filter(
          (user: any) =>
            !existingUserIds.has(user.id) &&
            (user.username?.toLowerCase().includes(query) ||
              user.email?.toLowerCase().includes(query))
        );
        setSearchResults(filtered.slice(0, 20)); // Limit to 20 results
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error searching users:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleAdd = async () => {
    if (!selectedUser) return;
    try {
      setAdding(true);
      await dashboardService.addCampSupervisor(campId, {
        userId: selectedUser.id,
        cohortNumber: cohortNumber || undefined,
      });
      onSuccess();
    } catch (err: any) {
      alert(err?.response?.data?.message || "حدث خطأ في إضافة المشرف");
      console.error("Error adding supervisor:", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">إضافة مشرف</h2>
            <p className="text-sm text-slate-400 mt-1">
              ابحث عن مستخدم وأضفه كمشرف على المخيم
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              البحث عن مستخدم
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Search Results */}
          {searching && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}

          {!searching && searchQuery && searchResults.length === 0 && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center text-slate-400">
              <Users className="mx-auto mb-2 h-8 w-8 text-slate-600" />
              <p>لا توجد نتائج</p>
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                اختر مستخدم:
              </label>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`rounded-lg border p-3 cursor-pointer transition ${
                    selectedUser?.id === user.id
                      ? "border-primary/60 bg-primary/20"
                      : "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <Users className="h-5 w-5 text-primary-100" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-100">
                        {user.username}
                      </p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                    {selectedUser?.id === user.id && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cohort Selection */}
          {selectedUser && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                نوع المشرف
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3 cursor-pointer hover:bg-slate-800 transition">
                  <input
                    type="radio"
                    name="cohortType"
                    checked={cohortNumber === null}
                    onChange={() => setCohortNumber(null)}
                    className="text-primary"
                  />
                  <div>
                    <p className="font-medium text-slate-100">مشرف عام</p>
                    <p className="text-xs text-slate-400">
                      مشرف على جميع الأفواج
                    </p>
                  </div>
                </label>
                {cohorts.map((cohort) => (
                  <label
                    key={cohort.cohort_number}
                    className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3 cursor-pointer hover:bg-slate-800 transition"
                  >
                    <input
                      type="radio"
                      name="cohortType"
                      checked={cohortNumber === cohort.cohort_number}
                      onChange={() => setCohortNumber(cohort.cohort_number)}
                      className="text-primary"
                    />
                    <div>
                      <p className="font-medium text-slate-100">
                        فوج {cohort.cohort_number}
                        {cohort.name && ` - ${cohort.name}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        مشرف على هذا الفوج فقط
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            إلغاء
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedUser || adding}
            className="rounded-lg border border-primary/40 bg-primary/20 px-4 py-2 text-sm font-medium text-primary-100 transition hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? "جاري الإضافة..." : "إضافة مشرف"}
          </button>
        </div>
      </div>
    </div>
  );
}
