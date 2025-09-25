import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import DriverDashboard from "./components/driver/DriverDashboard";
import UserDashboard from "./components/user/UserDashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SmartRedirect from "./components/auth/SmartRedirect";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <AuthProvider>
        <LocationProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route 
                path="/driver" 
                element={
                  <ProtectedRoute role="driver">
                    <DriverDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/user" 
                element={
                  <ProtectedRoute role="user">
                    <UserDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<SmartRedirect />} />
            </Routes>
          </Router>
          <Toaster />
        </LocationProvider>
      </AuthProvider>
    </div>
  );
}
