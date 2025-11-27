import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers["x-auth-token"] = `${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("token");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post("/auth/login", { email, password });
    const { token, user } = response.data;
    Cookies.set("token", token, { expires: 1 }); // Expires in 1 day
    return user;
  },

  logout() {
    Cookies.remove("token");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  async getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

export const dashboardService = {
  getStats: () => api.get("/admin/stats").then((res) => res.data),
  getUsers: (page = 1, limit = 10) =>
    api
      .get("/admin/users", {
        params: { page, limit },
      })
      .then((res) => res.data),
  getPrintRequests: () =>
    api.get("/admin/print-requests").then((res) => res.data),
  getPrintRequest: (id: string) =>
    api.get(`/print-requests/${id}`).then((res) => res.data),
  getPlanUsers: (planId: number) =>
    api.get(`/memorization/plans/${planId}/users`),
  updatePrintRequestStatus: (id: number, status: string) =>
    api
      .put(`/admin/print-requests/${id}/status`, { status })
      .then((res) => res.data),
  getCampDetailsForAdmin: (id: string) =>
    api.get(`/quran-camps/${id}/admin`).then((res) => res.data),
  removeUserFromCamp: (campId: string, userId: number) =>
    api
      .delete(`/quran-camps/${campId}/participants/${userId}`)
      .then((res) => res.data),
  getUserDetails: (id: number) =>
    api.get(`/quran-camps/users/${id}`).then((res) => res.data),
  getUserCampProgress: (campId: string, userId: number) =>
    api
      .get(`/quran-camps/${campId}/participants/${userId}/progress`)
      .then((res) => res.data),

  updateUser: (id: number, data: any) =>
    api.put(`/admin/users/${id}`, data).then((res) => res.data),
  deleteUser: (id: number) =>
    api.delete(`/admin/users/${id}`).then((res) => res.data),
  // Memorization Plan Management
  getMemorizationPlans: () =>
    api.get("/admin/memorization/plans").then((res) => res.data),
  getMemorizationPlan: (planId: number) =>
    api.get(`/admin/memorization/plan/${planId}`).then((res) => res.data),
  createMemorizationPlan: (data: any) =>
    api.post("/admin/memorization/plans", data).then((res) => res.data),
  updateMemorizationPlan: (id: number, data: any) =>
    api.put(`/admin/memorization/plans/${id}`, data).then((res) => res.data),
  deleteMemorizationPlan: (id: number) =>
    api.delete(`/admin/memorization/plans/${id}`).then((res) => res.data),
  getAvailableHadiths: () =>
    api.get("/admin/memorization/available-hadiths").then((res) => res.data),
  assignPlanToUser: (planId: number, userId: number) =>
    api
      .post(`/admin/memorization/plans/${planId}/assign`, { userId })
      .then((res) => res.data),
  getHadithById: (hadithId: number) =>
    api.get("/hadith", { params: { id: hadithId } }),
  // Plan Management
  duplicatePlan: async (planId: number) => {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/memorization/plans/${planId}/duplicate`,
      {},
      {
        headers: { "x-auth-token": localStorage.getItem("token") },
      }
    );
    return response.data;
  },
  updatePlanStatus: async (planId: number, status: "active" | "archived") => {
    const response = await axios.patch(
      `${process.env.NEXT_PUBLIC_API_URL}/memorization/plans/${planId}/status`,
      { status },
      {
        headers: { "x-auth-token": localStorage.getItem("token") },
      }
    );
    return response.data;
  },
  getPlanAnalytics: async (planId: number) => {
    const response = await api.get(
      `/admin/memorization/plans/${planId}/analytics`,
      {
        headers: { "x-auth-token": localStorage.getItem("token") },
      }
    );
    return response.data;
  },
  getPlanStats: async () => {
    return await api.get("/memorization/plans/stats");
  },

  // Quran Camps Management
  getQuranCamps: () => api.get("/quran-camps"),
  getQuranCampDetails: (id: string) => api.get(`/quran-camps/${id}`),
  createQuranCamp: (data: any) =>
    api.post("/quran-camps/admin/create", data).then((res) => res.data),
  updateQuranCamp: (id: string, data: any) =>
    api.put(`/quran-camps/admin/${id}`, data).then((res) => res.data),
  // Templates System (Admin)
  getCampTemplates: () =>
    api.get("/quran-camps/admin/templates").then((res) => res.data),
  createCampFromTemplate: (templateId: number, newCampName: string) =>
    api
      .post(`/quran-camps/admin/camps/create-from-template`, {
        templateId,
        newCampName,
      })
      .then((res) => res.data),
  saveCampAsTemplate: (id: string) =>
    api
      .put(`/quran-camps/admin/camps/${id}/save-as-template`)
      .then((res) => res.data),
  addDailyTasks: (id: string, tasks: any[]) =>
    api
      .post(`/quran-camps/admin/${id}/daily-tasks`, { tasks })
      .then((res) => res.data),
  updateDailyTask: (taskId: string, data: any) =>
    api.put(`/quran-camps/admin/tasks/${taskId}`, data).then((res) => res.data),
  getCampDayChallenges: (id: string) =>
    api.get(`/quran-camps/admin/${id}/day-challenges`).then((res) => res.data),
  saveCampDayChallenge: (
    id: string,
    payload: { day_number: number; title: string; description: string }
  ) =>
    api
      .post(`/quran-camps/admin/${id}/day-challenges`, payload)
      .then((res) => res.data),
  deleteCampDayChallenge: (id: string, dayNumber: number) =>
    api
      .delete(`/quran-camps/admin/${id}/day-challenges/${dayNumber}`)
      .then((res) => res.data),
  uploadTaskAttachment: (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append("attachment", file);
    return api
      .post(`/quran-camps/admin/tasks/${taskId}/upload-attachment`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => res.data);
  },
  deleteDailyTask: (taskId: string) =>
    api.delete(`/quran-camps/admin/tasks/${taskId}`).then((res) => res.data),

  getCampInteractions: (id: string) =>
    api.get(`/quran-camps/${id}/interactions`).then((res) => res.data),

  updateCampStatus: (id: string, status: string) =>
    api.put(`/quran-camps/admin/${id}`, { status }).then((res) => res.data),
  getCampStats: (id: string) => api.get(`/quran-camps/admin/stats`),
  getCampDailyTasks: (id: string) => api.get(`/quran-camps/${id}/daily-tasks`),
  getCampParticipants: (id: string) =>
    api.get(`/quran-camps/${id}/participants`),
  getCampAnalytics: (id: string) => api.get(`/quran-camps/${id}/analytics`),
  updateCampStatusAdmin: (id: string, status: string) =>
    api.put(`/quran-camps/${id}/status`, { status }).then((res) => res.data),

  startNewCohort: (
    id: string,
    data?: { start_date?: string; status?: string }
  ) =>
    api
      .post(`/quran-camps/admin/${id}/cohorts/start`, data || {})
      .then((res) => res.data),

  deleteCamp: (id: string) =>
    api.delete(`/quran-camps/${id}`).then((res) => res.data),

  // Settings (user-level per camp)
  getCampSettings: (id: string) => api.get(`/quran-camps/${id}/settings`),
  updateCampSettings: (id: string, data: any) =>
    api.put(`/quran-camps/${id}/settings`, data).then((res) => res.data),

  // Admin Camp Settings (admin-level camp settings)
  getAdminCampSettings: (id: string) =>
    api.get(`/quran-camps/${id}/admin/settings`).then((res) => res.data),
  updateAdminCampSettings: (id: string, data: any) =>
    api.put(`/quran-camps/${id}/admin/settings`, data).then((res) => res.data),

  // Send notification to camp participants (admin only)
  sendCampNotification: (id: string, data: any) =>
    api
      .post(`/quran-camps/${id}/admin/notifications/send`, data)
      .then((res) => res.data),

  // Camp Resources Management
  getCampResources: (id: string) =>
    api.get(`/quran-camps/${id}/resources`).then((res) => res.data),
  createCampResource: (id: string, data: any) =>
    api
      .post(`/quran-camps/admin/${id}/resources`, data)
      .then((res) => res.data),
  updateCampResource: (resourceId: string, data: any) =>
    api
      .put(`/quran-camps/admin/resources/${resourceId}`, data)
      .then((res) => res.data),
  deleteCampResource: (resourceId: string) =>
    api
      .delete(`/quran-camps/admin/resources/${resourceId}`)
      .then((res) => res.data),

  // Camp Resource Categories Management
  getCampResourceCategories: (id: string) =>
    api
      .get(`/quran-camps/admin/${id}/resource-categories`)
      .then((res) => res.data),
  createCampResourceCategory: (id: string, title: string) =>
    api
      .post(`/quran-camps/admin/${id}/resource-categories`, { title })
      .then((res) => res.data),
  updateCampResourceCategory: (categoryId: string, title: string) =>
    api
      .put(`/quran-camps/admin/resource-categories/${categoryId}`, { title })
      .then((res) => res.data),
  deleteCampResourceCategory: (categoryId: string) =>
    api
      .delete(`/quran-camps/admin/resource-categories/${categoryId}`)
      .then((res) => res.data),
  updateCategoryOrder: (id: string, categoryIds: number[]) =>
    api
      .put(`/quran-camps/admin/${id}/resource-categories/order`, {
        categoryIds,
      })
      .then((res) => res.data),
  updateResourceOrder: (categoryId: string | null, resourceIds: number[]) =>
    api
      .put(`/quran-camps/admin/resources/order`, {
        categoryId: categoryId || null,
        resourceIds,
      })
      .then((res) => res.data),

  // Camp Q&A Management
  getCampQandA: (id: string) =>
    api.get(`/quran-camps/${id}/qanda`).then((res) => res.data),
  answerCampQuestion: (questionId: string, answer: string) =>
    api
      .post(`/quran-camps/admin/qanda/${questionId}/answer`, { answer })
      .then((res) => res.data),
  deleteCampQuestion: (questionId: string) =>
    api.delete(`/quran-camps/qanda/${questionId}`).then((res) => res.data),

  // Help System Management
  getCampHelpArticles: (id: string, params?: any) =>
    api
      .get(`/quran-camps/${id}/admin/help-articles`, { params })
      .then((res) => res.data),
  createCampHelpArticle: (id: string, data: any) =>
    api
      .post(`/quran-camps/${id}/admin/help-articles`, data)
      .then((res) => res.data),
  updateCampHelpArticle: (id: string, articleId: string, data: any) =>
    api
      .put(`/quran-camps/${id}/admin/help-articles/${articleId}`, data)
      .then((res) => res.data),
  deleteCampHelpArticle: (id: string, articleId: string) =>
    api
      .delete(`/quran-camps/${id}/admin/help-articles/${articleId}`)
      .then((res) => res.data),
  getCampHelpFAQ: (id: string, params?: any) =>
    api
      .get(`/quran-camps/${id}/admin/help-faq`, { params })
      .then((res) => res.data),
  createCampHelpFAQ: (id: string, data: any) =>
    api.post(`/quran-camps/${id}/admin/help-faq`, data).then((res) => res.data),
  updateCampHelpFAQ: (id: string, faqId: string, data: any) =>
    api
      .put(`/quran-camps/${id}/admin/help-faq/${faqId}`, data)
      .then((res) => res.data),
  deleteCampHelpFAQ: (id: string, faqId: string) =>
    api
      .delete(`/quran-camps/${id}/admin/help-faq/${faqId}`)
      .then((res) => res.data),

  // Task Groups
  getCampTaskGroups: (id: string) =>
    api.get(`/quran-camps/${id}/task-groups`).then((res) => res.data),
  createTaskGroup: (id: string, data: any) =>
    api
      .post(`/quran-camps/admin/${id}/task-groups`, data)
      .then((res) => res.data),
  updateTaskGroup: (groupId: string, data: any) =>
    api
      .put(`/quran-camps/admin/task-groups/${groupId}`, data)
      .then((res) => res.data),
  deleteTaskGroup: (groupId: string) =>
    api
      .delete(`/quran-camps/admin/task-groups/${groupId}`)
      .then((res) => res.data),

  // Study Hall Content Management (Admin)
  getAdminStudyHallContent: (id: string, params?: any) =>
    api
      .get(`/quran-camps/admin/${id}/study-hall`, { params })
      .then((res) => res.data),
  updateStudyHallContent: (progressId: string, data: any) =>
    api
      .put(`/quran-camps/admin/study-hall/${progressId}`, data)
      .then((res) => res.data),
  deleteStudyHallContent: (progressId: string, type: string, reason: string) =>
    api
      .delete(`/quran-camps/admin/study-hall/${progressId}`, {
        data: { type, reason },
      })
      .then((res) => res.data),

  // Export camp data
  exportCampData: (id: string, type: string = "participants") => {
    return api.get(`/quran-camps/admin/${id}/export`, {
      params: { type },
      responseType: "blob",
    });
  },
  duplicateCamp: (id: string, data?: any) =>
    api
      .post(`/quran-camps/${id}/duplicate`, data || {})
      .then((res) => res.data),

  // Daily Messages
  getCampDailyMessages: (id: string) =>
    api.get(`/quran-camps/admin/${id}/daily-messages`).then((res) => res.data),
  createDailyMessage: (id: string, data: any) =>
    api
      .post(`/quran-camps/admin/${id}/daily-messages`, data)
      .then((res) => res.data),
  updateDailyMessage: (messageId: string, data: any) =>
    api
      .put(`/quran-camps/admin/daily-messages/${messageId}`, data)
      .then((res) => res.data),
  deleteDailyMessage: (messageId: string) =>
    api
      .delete(`/quran-camps/admin/daily-messages/${messageId}`)
      .then((res) => res.data),

  // Tasks Import/Export
  exportCampTasks: (id: string, format: string = "json") => {
    const exportFormat = format || "json";
    return api
      .get(`/quran-camps/admin/${id}/tasks/export`, {
        params: { format: exportFormat },
        responseType: exportFormat === "csv" ? "blob" : "json",
      })
      .then((res) => {
        if (exportFormat === "csv") {
          // Download CSV file
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement("a");
          link.href = url;
          const contentDisposition = res.headers["content-disposition"];
          if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch) {
              link.setAttribute("download", fileNameMatch[1]);
            }
          } else {
            link.setAttribute(
              "download",
              `camp-${id}-tasks-${new Date().toISOString().split("T")[0]}.csv`
            );
          }
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          return { success: true, message: "تم التصدير بنجاح" };
        }
        return res.data;
      });
  },
  importCampTasks: (id: string, tasks: any[], replace: boolean = false) =>
    api
      .post(`/quran-camps/admin/${id}/tasks/import`, {
        tasks,
        replace,
      })
      .then((res) => res.data),
  importCampTasksFile: (id: string, formData: FormData) =>
    api
      .post(`/quran-camps/admin/${id}/tasks/import`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => res.data),
};

export const notificationService = {
  sendNotification: (data: any) =>
    api.post("/notifications/send", data).then((res) => res.data),
  getTopics: () => api.get("/notifications/topics").then((res) => res.data),
  subscribeToTopic: (tokens: string[], topic: string) =>
    api
      .post("/notifications/subscribe", { tokens, topic })
      .then((res) => res.data),
  unsubscribeFromTopic: (tokens: string[], topic: string) =>
    api
      .post("/notifications/unsubscribe", { tokens, topic })
      .then((res) => res.data),
  validateToken: (token: string) =>
    api
      .post("/notifications/validate-token", { token })
      .then((res) => res.data),
};

export default api;
