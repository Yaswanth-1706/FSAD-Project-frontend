import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./AppLayout.module.css";

function AppLayout({ children }) {
  const [open, setOpen] = useState(false);
  const { logout, role, profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";

  const navItems = isAdmin
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/projects", label: "Projects" },
        { to: "/portfolio", label: "Portfolio" },
        { to: "/users", label: "Users" },
      ]
    : [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/portfolio", label: "Portfolio" },
      ];

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <button className={styles.menuBtn} type="button" onClick={() => setOpen((value) => !value)}>
          Menu
        </button>
        <h1>Student Project Management System</h1>
        <div className={styles.userMeta}>
          <span className={styles.roleBadge}>{isAdmin ? "Admin" : "Student"}</span>
          <span className={styles.userName}>{profile?.name || profile?.email || "Local session"}</span>
        </div>
        <button className={styles.logoutBtn} type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>SPMS Panel</div>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}

export default AppLayout;
