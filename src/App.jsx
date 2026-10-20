import {  Navigate, Route, Routes } from "react-router-dom";
//import App from "./App.jsx";
import Contest from "./contest.jsx";
import LoginPanel from "./LoginPanel.jsx";
import Mybooks from "./Mybooks.jsx";
import Admin from "./Admin.jsx";

export default function AppRoutes() {
  return (
    
      <Routes>
         {/* <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<App />} />  */}
        <Route path="/login" element={<LoginPanel />} />
        <Route path="/mybooks" element={<Mybooks />} />
        <Route path="/support" element={<Contest />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    
  );
}
