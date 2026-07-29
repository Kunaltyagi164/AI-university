const API_BASE = "http://localhost:8001/api";

// Get token helper
function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("nova_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Request failed");
  }

  return response.json();
}

export const api = {
  // Auth
  async signup(payload: any) {
    const data = await request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data.access_token) {
      localStorage.setItem("nova_token", data.access_token);
      localStorage.setItem("nova_user", JSON.stringify(data.user));
    }
    return data;
  },

  async login(payload: any) {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data.access_token) {
      localStorage.setItem("nova_token", data.access_token);
      localStorage.setItem("nova_user", JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem("nova_token");
    localStorage.removeItem("nova_user");
  },

  getCurrentUser() {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("nova_user");
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  // Onboarding
  async submitOnboarding(payload: any) {
    return request("/onboarding/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Courses
  async getDegree() {
    return request("/course/degree");
  },

  async getCourse(courseId: number) {
    return request(`/course/${courseId}`);
  },

  async getLesson(lessonId: number) {
    return request(`/course/lesson/${lessonId}`);
  },

  async completeLesson(lessonId: number) {
    return request(`/course/lesson/${lessonId}/complete`, {
      method: "POST",
    });
  },

  // AI Professor
  async chatProfessor(payload: { message: string; personality: string; history: any[] }) {
    return request("/professor/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getProfessorMemory() {
    return request("/professor/memory");
  },

  // IDE Coding Lab
  async runCode(payload: { code: string; language: string; lesson_id?: number }) {
    return request("/ide/run", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Exam Hall
  async getExam(lessonId: number) {
    return request(`/exams/generate/${lessonId}`);
  },

  async submitExam(quizId: number, payload: { answers: Record<string, string> }) {
    return request(`/exams/submit/${quizId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Research Lab
  async queryResearch(payload: { topic: string; action: string; context?: string }) {
    return request("/research/query", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Admin Telemetry
  async getAdminStats() {
    return request("/admin/stats");
  },

  async saveAdminConfig(payload: { openai_api_key?: string; gemini_api_key?: string }) {
    return request("/admin/config", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Leaderboard
  async getLeaderboard(limit: number = 50) {
    return request(`/admin/leaderboard?limit=${limit}`);
  },

  // Certificates
  async getCertificate(courseId: number) {
    return request(`/certificates/${courseId}`);
  }
};
