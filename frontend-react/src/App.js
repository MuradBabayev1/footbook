import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import UserLogin from "./pages/UserLogin";
import UserSignup from "./pages/UserSignup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/user-login" replace />} />
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/user-signup" element={<UserSignup />} />
        <Route path="*" element={<Navigate to="/user-login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
