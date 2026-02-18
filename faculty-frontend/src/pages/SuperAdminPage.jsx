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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [defaultPassword, setDefaultPassword] = useState("");

  const addFaculty = async (event) => {
    event.preventDefault();
    setLoading(true);
    setDefaultPassword("");
    try {
      facultyStorage.set(facultyStorage.keys.superAdminToken, token.trim());
      const data = await facultyApi.addFaculty(token.trim(), {
        name: name.trim(),
        email: email.toLowerCase().trim(),
      });
      setDefaultPassword(data.defaultPassword);
      setName("");
      setEmail("");
      pushToast("success", "Faculty added successfully");
    } catch (apiError) {
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
      <section className="card form-card">
        <h2>Add Faculty</h2>
        <form className="form-grid" onSubmit={addFaculty}>
          <label>
            Super Admin JWT
            <textarea
              rows="3"
              required
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
          </label>
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
          <p className="warning-text">Default Password: {defaultPassword}</p>
        ) : null}
      </section>
    </PageShell>
  );
}

export default SuperAdminPage;
