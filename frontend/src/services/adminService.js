import axios from "axios";

const API_BASE_URL = "http://localhost:4000/api";
class AdminService {
  // Get all users with pagination
  async getAllUsers(page = 1, limit = 10) {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        params: { page, limit },
        headers: { "x-auth-token": token },
      });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats() {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users/stats`, {
        headers: { "x-auth-token": token },
      });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  }

  // Update user
  async updateUser(id, userData) {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/admin/users/${id}`,
        userData,
        {
          headers: { "x-auth-token": token },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(id) {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${id}`, {
        headers: { "x-auth-token": token },
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  // Get content statistics
  async getContentStats() {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/content/stats`, {
        headers: { "x-auth-token": token },
      });
      return response.data.data;
    } catch (error) {
      console.error("Error fetching content stats:", error);
      throw error;
    }
  }
  // Get dashboard analytics
  async getDashboardAnalytics() {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/analytics/dashboard`,
        {
          headers: { "x-auth-token": token },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      throw error;
    }
  }
}

export default new AdminService();
