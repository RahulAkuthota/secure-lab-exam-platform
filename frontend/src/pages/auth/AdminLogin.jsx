import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";

function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  function handleLogin(e) {
    e.preventDefault();

    // UI only – no backend
    if (form.username && form.password) {
      navigate("/admin/dashboard");
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleLogin}>
        <h2 className="auth-title">Faculty Login</h2>

        <input
          type="text"
          placeholder="Faculty Username"
          value={form.username}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          required
        />

        <button className="auth-btn primary" type="submit">
          Login
        </button>

        <p className="auth-hint">
          Only authorized faculty can access this panel
        </p>
      </form>
    </div>
  );
}

export default AdminLogin;
