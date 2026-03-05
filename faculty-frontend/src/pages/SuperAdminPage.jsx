import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../layout/PageShell";
import { facultyApi } from "../api";
import { facultyStorage } from "../storage";

function SuperAdminPage({ pushToast }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(
    facultyStorage.get(facultyStorage.keys.superAdminToken) || ""
  );
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [defaultPassword, setDefaultPassword] = useState("");

  const loginAdmin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await facultyApi.adminLogin({
        email: adminEmail.toLowerCase().trim(),
        password: adminPassword.trim(),
      });
      setToken(data.token);
      facultyStorage.set(facultyStorage.keys.superAdminToken, data.token);
      pushToast("success", "Super Admin logged in");
    } catch (apiError) {
      pushToast("error", apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const addFaculty = async (event) => {
    event.preventDefault();
    setLoading(true);
    setDefaultPassword("");
    try {
      const data = await facultyApi.addFaculty(token.trim(), {
        name: name.trim(),
        email: email.toLowerCase().trim(),
      });
      setDefaultPassword(data.defaultPassword);
      setName("");
      setEmail("");
      pushToast("success", "Faculty added successfully");
    } catch (apiError) {
      if (apiError.status === 401 || apiError.status === 403) {
        setToken("");
        facultyStorage.remove(facultyStorage.keys.superAdminToken);
      }
      pushToast("error", apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Super Admin"
      subtitle="Create faculty accounts and share temporary credentials."
      rightAction={
        <button className="ghost-btn" onClick={() => navigate("/login")}>
          Back To Login
        </button>
      }
    >
      {!token ? (
        <section className="card form-card">
          <h2>Super Admin Login</h2>
          <form className="form-grid" onSubmit={loginAdmin}>
            <label>
              Email
              <input
                required
                type="email"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
              />
            </label>
            <button className="primary-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </section>
      ) : (
        <section className="card form-card">
          <div className="flex justify-between items-center mb-6">
            <h2>Add Faculty</h2>
            <button
              className="ghost-btn"
              onClick={() => {
                setToken("");
                facultyStorage.remove(facultyStorage.keys.superAdminToken);
              }}
            >
              Logout Admin
            </button>
          </div>
          <form className="form-grid" onSubmit={addFaculty}>
            <label>
              Name
              <input required value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button className="primary-btn" disabled={loading}>
              {loading ? "Adding..." : "Add Faculty"}
            </button>
          </form>
          {defaultPassword ? (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-bold text-yellow-800">Faculty Created!</p>
              <p className="text-yellow-700">Temporary Password: <strong>{defaultPassword}</strong></p>
              <p className="text-sm text-yellow-600 mt-2">Please share this password with the faculty member. They will use their email to login.</p>
            </div>
          ) : null}
        </section>
      )}
    </PageShell>
  );
}

export default SuperAdminPage;
