import React from "react";
import ReactDOM from "react-dom/client";
import Router from "./routes/route";
import { GlobalStyle } from "./styles/style";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotificationProvider>
      <AuthProvider>
        <GlobalStyle />
        <Router />
      </AuthProvider>
    </NotificationProvider>
  </React.StrictMode>
);