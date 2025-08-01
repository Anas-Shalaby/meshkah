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
  deleteUser: (id: number) =>
    api.delete(`/admin/users/${id}`).then((res) => res.data),
  updateUser: (id: number, data: any) =>
    api.put(`/admin/users/${id}`, data).then((res) => res.data),
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
};

export default api;
