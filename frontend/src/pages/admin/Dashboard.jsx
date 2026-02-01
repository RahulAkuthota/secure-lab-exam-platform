import { useNavigate } from "react-router-dom";
import "../../styles/admin.css";

function Dashboard() {
    const navigate = useNavigate();

    return (
        <div className="admin-page">
            <h1 className="admin-heading">Faculty Dashboard</h1>
            <p className="admin-subheading">
                Secure Lab Examination Platform
            </p>

            <div className="admin-grid">
                {/* Create Question */}
                <div
                    className="admin-card clickable"
                    onClick={() => navigate("/admin/questions/create")}
                >
                    <h3>➕ Create Question</h3>
                    <p>Add coding questions with public & private test cases</p>
                </div>

                {/* Manage Exams */}
                <div className="admin-card">
                    <h3>📝 Manage Exam</h3>
                    <p>Start / Stop exam sessions</p>

                    <div className="admin-actions">
                        <button className="admin-btn primary">Start Exam</button>
                        <button className="admin-btn danger">End Exam</button>
                    </div>
                </div>

                {/* Results */}
                <div
                    className="admin-card clickable"
                    onClick={() => navigate("/admin/results")}
                >
                    <h3>📊 Results</h3>
                    <p>View student submissions and scores</p>
                </div>

                {/* Question Bank */}
                <div
                    className="admin-card clickable"
                    onClick={() => navigate("/admin/questions")}
                >
                    <h3>📚 Question Bank</h3>
                    <p>View and manage all questions</p>
                </div>

                <button
                    className="admin-btn"
                    onClick={() => navigate("/admin/exam/attach-questions")}
                >
                    📎 Attach Questions
                </button>

                <button
  className="admin-btn primary"
  onClick={() => navigate("/admin/exam/settings")}
>
  📝 Create Exam
</button>



            </div>
        </div>
    );
}

export default Dashboard;
