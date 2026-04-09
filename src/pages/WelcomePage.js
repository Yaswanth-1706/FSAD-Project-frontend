import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./WelcomePage.module.css";

function WelcomePage() {
  const navigate = useNavigate();

  const onRoleSelect = (role) => {
    navigate("/auth", { state: { role } });
  };

  return (
    <div className={styles.welcomePage}>
      <section className={styles.heroCard}>
        <p className={styles.badge}>Student Portfolio Platform</p>
        <h1 className={styles.title}>Welcome to Student Portfolio Website</h1>
        <p className={styles.subtitle}>
          Choose your portal to continue. You will be asked to authenticate in the next step.
        </p>

        <div className={styles.roleRow}>
          <button type="button" className={`${styles.roleBtn} ${styles.studentBtn}`} onClick={() => onRoleSelect("student")}>
            Continue as Student
          </button>
          <button type="button" className={`${styles.roleBtn} ${styles.adminBtn}`} onClick={() => onRoleSelect("admin")}>
            Continue as Admin
          </button>
        </div>
      </section>
    </div>
  );
}

export default WelcomePage;
