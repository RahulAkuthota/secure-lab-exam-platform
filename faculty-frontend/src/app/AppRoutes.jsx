import { Navigate, Route, Routes } from "react-router-dom";
import { facultyStorage } from "../storage";
import FacultyLoginPage from "../pages/FacultyLoginPage";
import SuperAdminPage from "../pages/SuperAdminPage";
import DashboardOverviewPage from "../pages/DashboardOverviewPage";
import CreateExamPage from "../pages/CreateExamPage";
import ManageExamsPage from "../pages/ManageExamsPage";
import QuestionEditorPage from "../pages/QuestionEditorPage";
import EditExamPage from "../pages/EditExamPage";

function ProtectedRoute({ children }) {
  const token = facultyStorage.get(facultyStorage.keys.facultyToken);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes({ pushToast }) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<FacultyLoginPage pushToast={pushToast} />} />
      <Route path="/super-admin" element={<SuperAdminPage pushToast={pushToast} />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardOverviewPage pushToast={pushToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/create-exam"
        element={
          <ProtectedRoute>
            <CreateExamPage pushToast={pushToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/exams"
        element={
          <ProtectedRoute>
            <ManageExamsPage pushToast={pushToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/manage-exams"
        element={
          <ProtectedRoute>
            <ManageExamsPage pushToast={pushToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/exams/:examId/questions"
        element={
          <ProtectedRoute>
            <QuestionEditorPage pushToast={pushToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/exams/:examId/edit"
        element={
          <ProtectedRoute>
            <EditExamPage pushToast={pushToast} />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
