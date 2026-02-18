const KEYS = {
  facultyToken: "faculty_token",
  superAdminToken: "super_admin_token",
};

export const facultyStorage = {
  keys: KEYS,
  get(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  clearFaculty() {
    localStorage.removeItem(KEYS.facultyToken);
  },
};
