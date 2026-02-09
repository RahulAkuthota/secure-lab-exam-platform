const baseUrl = (
  import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000`
).replace(/\/+$/, "");

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const studentApi = {
  health() {
    return request("/health");
  },
  enter(payload) {
    return request("/auth/student/enter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  activeExams(token) {
    return request("/student/active-exams", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  startExam(token, examId) {
    return request("/student/start-exam", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ examId }),
    });
  },
  submitExam(token, payload) {
    return request("/student/submit-exam", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  },
};
