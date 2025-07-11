import React, { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useFlashMessage } from "../components/FlashMessageContext"; // Updated path
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Layout.css";

const Layout: React.FC = () => {
  const { setFlashMessage } = useFlashMessage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser || !currentUser.phoneNumber) {
        setUser(null);
        navigate("/login");
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
      await signOut(auth);

      sessionStorage.setItem(
        "logoutMessage",
        JSON.stringify({
          type: "success",
          message: "Logged out successfully!",
        })
      );

      navigate("/login", { replace: true });
    } catch {
      setFlashMessage({ type: "danger", message: "Logout failed." });
    }
  };

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/configurations":
        return "Configurations";
      case "/dashboard":
        return "Dashboard";
    }
  };

  // Hide layout if not logged in
  if (!user) return null;

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <button
            id="sidebar-toggle"
            className="btn btn-outline-light me-3"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            ☰
          </button>
          <span className="text-white fs-5 fw-semibold">
            {getPageTitle(location.pathname)}
          </span>
        </div>

        {/* User Dropdown */}
        <div
          className="position-relative d-flex align-items-center"
          ref={dropdownRef}
        >
          <button
            className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: "40px", height: "40px", fontWeight: "bold" }}
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            {user?.phoneNumber?.charAt(1) || "U"}
          </button>

          <i
            className={`fas fa-chevron-down ms-2`}
            style={{
              fontSize: "0.85rem",
              color: "#fff",
              transition: "transform 0.3s ease",
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              cursor: "pointer",
            }}
            onClick={() => setDropdownOpen((prev) => !prev)}
          ></i>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="dropdown-menu dropdown-menu-end show shadow"
              style={{
                position: "absolute",
                top: "calc(100% + 12px)",
                right: 0,
                minWidth: "12rem",
                borderRadius: "0.5rem",
                zIndex: 1000,
              }}
            >
              <div className="px-3 py-2 text-muted small">
                {user.phoneNumber}
              </div>
              <hr className="my-1" />
              <button className="dropdown-item py-2" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-2 text-danger"></i> Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar */}
      <div id="sidebar" className={sidebarOpen ? "active" : ""}>
        <button
          className="btn btn-light mb-2 w-100"
          onClick={() => {
            setSidebarOpen(false);
            navigate("/dashboard");
          }}
        >
          Dashboard
        </button>
        <button
          className="btn btn-light mb-2 w-100"
          onClick={() => {
            setSidebarOpen(false);
            navigate("/configurations");
          }}
        >
          Configurations
        </button>
      </div>

      {/* Main Content */}
      <div
        id="main-content"
        className={`bg-light p-4 ${sidebarOpen ? "shifted" : ""}`}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
