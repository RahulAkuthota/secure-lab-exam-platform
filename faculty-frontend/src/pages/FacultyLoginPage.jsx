import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../layout/PageShell";
import { facultyApi } from "../api";
import { facultyStorage } from "../storage";

function FacultyLoginPage({ pushToast }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await facultyApi.login({
        email: email.toLowerCase().trim(),
        password: password.trim(),
      });
      facultyStorage.set(facultyStorage.keys.facultyToken, data.token);
      pushToast("success", "Login successful");
      navigate("/dashboard", { replace: true });
    } catch (apiError) {
      setError(apiError.message);
      pushToast("error", apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Faculty Console"
      subtitle="Professional workflow for exam management in secure labs."
      rightAction={
        <button className="ghost-btn" onClick={() => navigate("/super-admin")}>
          Super Admin
        </button>
      }
    >
      <section className="card form-card">
        <h2>Sign In</h2>
        <form className="form-grid" onSubmit={login}>
          <label>
            Faculty Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="primary-btn" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </PageShell>
  );
}

export default FacultyLoginPage;
