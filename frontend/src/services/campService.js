const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { "x-auth-token": token }),
  };
};

// ==================== CAMP RESOURCES ====================

export const getCampResources = async (campId) => {
  const response = await fetch(
    `${API_BASE_URL}/quran-camps/${campId}/resources`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.json();
};

// ==================== CAMP Q&A ====================

export const getCampQandA = async (campId) => {
  const response = await fetch(`${API_BASE_URL}/quran-camps/${campId}/qanda`, {
    headers: getAuthHeaders(),
  });
  return response.json();
};

export const askCampQuestion = async (campId, question) => {
  const response = await fetch(`${API_BASE_URL}/quran-camps/${campId}/qanda`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ question }),
  });
  return response.json();
};

// ==================== TASK GROUPS ====================

export const getCampTaskGroups = async (campId) => {
  const response = await fetch(
    `${API_BASE_URL}/quran-camps/${campId}/task-groups`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.json();
};

export const createTaskGroup = async (campId, data) => {
  const response = await fetch(
    `${API_BASE_URL}/quran-camps/admin/${campId}/task-groups`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const updateTaskGroup = async (groupId, data) => {
  const response = await fetch(
    `${API_BASE_URL}/quran-camps/admin/task-groups/${groupId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const deleteTaskGroup = async (groupId) => {
  const response = await fetch(
    `${API_BASE_URL}/quran-camps/admin/task-groups/${groupId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );
  return response.json();
};

// ==================== DAILY DASHBOARD ====================

export const getDailyDashboard = async (campId) => {
  const response = await fetch(
    `${API_BASE_URL}/quran-camps/${campId}/daily-dashboard`,
    {
      headers: getAuthHeaders(),
    }
  );
  return response.json();
};
