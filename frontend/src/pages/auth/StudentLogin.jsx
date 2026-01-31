import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudent } from "../../context/StudentContext";

function StudentLogin() {
  const navigate = useNavigate();
  const { setStudent } = useStudent();

  const [form, setForm] = useState({
    name: "",
    studentId: "",
    className: ""
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.name || !form.studentId || !form.className) {
      alert("Please fill all details");
      return;
    }

    setStudent(form);
    navigate("/instructions");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Secure Exam Platform</h1>
        <p className="login-subtitle">Student Verification</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Student Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter Full Name"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Student ID</label>
            <input
              type="text"
              name="studentId"
              placeholder="Enter Your ID"
              value={form.studentId}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Class / Section</label>
            <input
              type="text"
              name="className"
              placeholder="Eg: CSE-C2"
              value={form.className}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="primary-btn">
            Take Test
          </button>
        </form>

        <p className="footer-text">
          Authorized students only • LAN Examination System
        </p>
      </div>
    </div>
  );
}

export default StudentLogin;
