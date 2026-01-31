import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { StudentProvider } from "./context/StudentContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StudentProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StudentProvider>
  </React.StrictMode>
);
