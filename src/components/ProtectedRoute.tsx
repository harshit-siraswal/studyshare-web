import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading, isBanned } = useAuth();

  if (loading) return null;

  if (!user || isBanned) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
