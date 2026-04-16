import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import UserLogin from "./pages/UserLogin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/user-login" replace />} />
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="*" element={<Navigate to="/user-login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
