import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { useFacultyExams } from "../utils/useFacultyExams";

function DashboardOverviewPage({ pushToast }) {
  const navigate = useNavigate();
  const { stats, loading, loadExams } = useFacultyExams(pushToast);

  return (
    <DashboardLayout
      title="Faculty Dashboard"
      subtitle="Clean route-based experience for exam and question management."
      onRefresh={loadExams}
    >
      <section className="stats-grid">
        <article className="stat-card">
          <p>Total Exams</p>
          <h3>{loading ? "..." : stats.total}</h3>
        </article>
        <article className="stat-card">
          <p>Active</p>
          <h3>{loading ? "..." : stats.active}</h3>
        </article>
        <article className="stat-card">
          <p>Inactive</p>
          <h3>{loading ? "..." : stats.inactive}</h3>
        </article>
      </section>

      <section className="card quick-actions">
        <h2>Quick Actions</h2>
        <div className="row-actions">
          <button className="primary-btn" onClick={() => navigate("/dashboard/create-exam")}>
            Create New Exam
          </button>
          <button className="ghost-btn" onClick={() => navigate("/dashboard/manage-exams")}>
            Manage Existing Exams
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default DashboardOverviewPage;
