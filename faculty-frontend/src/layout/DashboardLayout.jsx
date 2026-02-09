import { NavLink, useNavigate } from "react-router-dom";
import PageShell from "./PageShell";
import { facultyStorage } from "../storage";

function DashboardLayout({ title, subtitle, children, onRefresh }) {
  const navigate = useNavigate();

  return (
    <PageShell
      title={title}
      subtitle={subtitle}
      rightAction={
        <div className="header-actions">
          {onRefresh ? (
            <button className="ghost-btn" onClick={onRefresh}>
              Refresh
            </button>
          ) : null}
          <button
            className="ghost-btn danger"
            onClick={() => {
              facultyStorage.clearFaculty();
              navigate("/login", { replace: true });
            }}
          >
            Logout
          </button>
        </div>
      }
    >
      <nav className="route-nav">
        <NavLink to="/dashboard" end>
          Overview
        </NavLink>
        <NavLink to="/dashboard/create-exam">Create Exam</NavLink>
        <NavLink to="/dashboard/manage-exams">Manage Exams</NavLink>
      </nav>
      {children}
    </PageShell>
  );
}

export default DashboardLayout;
