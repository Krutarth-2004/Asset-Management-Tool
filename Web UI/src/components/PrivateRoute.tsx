// src/components/PrivateRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";

const PrivateRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user?.phoneNumber);
    });

    return () => unsubscribe();
  }, []);

  // Wait for Firebase to initialize
  if (isAuthenticated === null) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    sessionStorage.setItem(
      "redirectMessage",
      JSON.stringify({
        type: "info",
        message: "Please log in to access the dashboard.",
      })
    );
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default PrivateRoute;
