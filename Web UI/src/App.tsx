import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import {
  FlashMessageProvider,
  useFlashMessage,
} from "./components/FlashMessageContext";
import AlertMessage from "./components/AlertMessage";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CreateJobPage from "./pages/CreateJobPage";
import CreateConfigurationPage from "./pages/CreateConfigurationPage";
import JobInfoPage from "./pages/JobInfoPage";
import ConfigurationInfoPage from "./pages/ConfigurationInfoPage";
import EditConfigurationPage from "./pages/EditConfigurationPage";
import ConfigurationsPage from "./pages/ConfigurationsPage";

const FlashMessageWrapper = () => {
  const { flashMessage, setFlashMessage } = useFlashMessage();

  return (
    <>
      {flashMessage && (
        <AlertMessage
          type={flashMessage.type}
          message={flashMessage.message}
          onClose={() => setFlashMessage(null)}
        />
      )}
    </>
  );
};

function App() {
  return (
    <FlashMessageProvider>
      <BrowserRouter>
        <FlashMessageWrapper />
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/create-job" element={<CreateJobPage />} />
              <Route
                path="/create-configuration"
                element={<CreateConfigurationPage />}
              />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/configurations" element={<ConfigurationsPage />} />
              <Route
                path="/configurations/:id/info"
                element={<ConfigurationInfoPage />}
              />
              <Route
                path="/configurations/:id/edit"
                element={<EditConfigurationPage />}
              />
              <Route path="/jobs/:id/info" element={<JobInfoPage />} />
            </Route>
          </Route>

          {/* Redirect any unknown route to login */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </FlashMessageProvider>
  );
}

export default App;
