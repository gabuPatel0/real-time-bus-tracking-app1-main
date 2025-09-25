import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/**
 * SmartRedirect component that checks user authentication and role
 * to redirect to the appropriate dashboard or login page
 */
export default function SmartRedirect() {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, redirect based on their role
  if (user.role === "driver") {
    return <Navigate to="/driver" replace />;
  } else if (user.role === "user") {
    return <Navigate to="/user" replace />;
  }

  // Fallback to login if role is not recognized
  return <Navigate to="/login" replace />;
}
