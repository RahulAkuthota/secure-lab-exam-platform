const baseUrl = (
  import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000`
).replace(/\/+$/, "");

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return data;
};

export const facultyApi = {
  health() {
    return request("/health");
  },
  login(payload) {
    return request("/auth/faculty/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  getExams(token) {
    return request("/faculty/my-exams", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getQuestionPaper(token, examId) {
    return request(`/faculty/question-paper/${examId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  createExam(token, payload) {
    return request("/faculty/create-exam", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },
  updateExam(token, examId, payload) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    return request(`/faculty/exams/${examId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    }).catch((error) => {
      if (error.status !== 404) throw error;
      // Backward-compatible fallback for older route shape.
      return request("/faculty/update-exam-details", {
        method: "POST",
        headers,
        body: JSON.stringify({ examId, ...payload }),
      });
    });
  },
  createQuestionPaper(token, payload) {
    return request("/faculty/create-question-paper", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },
  activate(token, examId) {
    return request("/faculty/activate-exam", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ examId }),
    });
  },
  deactivate(token, examId) {
    return request("/faculty/deactivate-exam", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ examId }),
    });
  },
  addFaculty(token, payload) {
    return request("/admin/add-faculty", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },
};
