import React from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./App.jsx";
import "./styles.css";
import { BrowserRouter } from "react-router-dom";
import { EmailProvider } from "./EmailContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <EmailProvider>
        <AppRoutes />
      </EmailProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
