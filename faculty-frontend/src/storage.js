const KEYS = {
  facultyToken: "faculty_token",
  superAdminToken: "super_admin_token",
};

export const facultyStorage = {
  keys: KEYS,
  get(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error(`Error parsing storage key ${key}:`, e);
      return null;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  clearFaculty() {
    localStorage.removeItem(KEYS.facultyToken);
  },
};
