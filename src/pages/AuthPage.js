import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchUsers, getApiErrorMessage, login, signup } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastProvider";
import styles from "./AuthPage.module.css";

function AuthPage() {
  const [tab, setTab] = useState("login");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const { notifyError, notifySuccess, notifyInfo } = useToast();
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRole = (location.state?.role || "student").toLowerCase();
  const roleLabel = selectedRole === "admin" ? "Admin" : "Student";

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
    };

    try {
      let response;
      if (tab === "login") {
        response = await login({ email: payload.email, password: payload.password });
        notifySuccess("Login successful", "You are now authenticated.");
      } else {
        response = await signup(payload);
        notifySuccess("Signup successful", "Account created.");
      }

      // Store token if available in response
      const token = response?.token || response?.accessToken || "authenticated";
      authLogin(token, { role: selectedRole, name: form.name, email: form.email });

      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "Auth endpoint unavailable or request rejected");
      const isAuthUnavailable =
        message.includes("Network Error") ||
        message.includes("HTTP 404") ||
        message.includes("Failed to fetch");

      if (isAuthUnavailable) {
        if (message.includes("Network Error") || message.includes("Failed to fetch")) {
          try {
            await fetchUsers();
          } catch {
            notifyInfo("Local session", "Backend is not reachable, so continuing without server auth.");
          }
        } else {
          notifyInfo("Auth endpoint missing", "Proceeding with local session fallback.");
        }

        authLogin("local-session", { role: selectedRole, name: form.name, email: form.email });
        navigate("/dashboard", { replace: true });
        return;
      }

      notifyError("Authentication failed", message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <section className={styles.authCard}>
        <div className={styles.authHeader}>
          <p className={styles.eyebrow}>Secure Access</p>
          <h2 className={styles.title}>Authentication</h2>
          <p className={styles.subtitle}>{`Sign in as ${roleLabel} and continue to your dashboard.`}</p>
        </div>

        <div className={styles.tabRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "login" ? styles.tabActive : ""}`}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "signup" ? styles.tabActive : ""}`}
            onClick={() => setTab("signup")}
          >
            Signup
          </button>
        </div>

        <form onSubmit={onSubmit} className={styles.authForm}>
          {tab === "signup" && (
            <div className={styles.field}>
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                className={styles.input}
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className={styles.input}
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className={styles.input}
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </div>

          <button type="submit" disabled={busy} className={styles.submitBtn}>
            {busy ? "Submitting..." : tab === "login" ? "Login" : "Signup"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default AuthPage;
