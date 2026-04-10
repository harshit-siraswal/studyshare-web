import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandLoader from "@/components/BrandLoader";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading, isBanned } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-hero">
        <div className="rounded-3xl border border-border/50 bg-card/80 px-8 py-6 shadow-card backdrop-blur-xl">
          <BrandLoader label="Opening your study space..." />
        </div>
      </div>
    );
  }

  if (!user || isBanned) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
