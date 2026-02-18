const KEYS = {
  token: "student_token",
  profile: "student_profile",
  exam: "student_exam",
  submission: "student_submission",
  questions: "student_questions",
  examSession: "student_exam_session",
};

export const studentStorage = {
  keys: KEYS,
  get(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  clear() {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  },
};
