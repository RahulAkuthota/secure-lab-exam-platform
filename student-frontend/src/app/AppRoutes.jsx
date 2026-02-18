import { Navigate, Route, Routes } from "react-router-dom";
import { studentStorage } from "../storage";
import StudentEntryPage from "../pages/StudentEntryPage";
import ActiveExamsPage from "../pages/ActiveExamsPage";
import ExamPage from "../pages/ExamPage";
import SummaryPage from "../pages/SummaryPage";

function ProtectedRoute({ children }) {
  const token = studentStorage.get(studentStorage.keys.token);
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes({ pushToast }) {
  return (
    <Routes>
      <Route path="/" element={<StudentEntryPage pushToast={pushToast} />} />
      <Route
        path="/exams"
        element={
          <ProtectedRoute>
            <ActiveExamsPage pushToast={pushToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam"
        element={
          <ProtectedRoute>
            <ExamPage pushToast={pushToast} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/summary"
        element={
          <ProtectedRoute>
            <SummaryPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
