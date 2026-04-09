import React, { useCallback, useEffect, useState } from "react";
import { createUser, deleteUser, fetchUsers, getApiErrorMessage } from "../api/client";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";
import styles from "./PageStyles.module.css";

const defaultUser = { name: "", role: "STUDENT" };

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(defaultUser);
  const { notifyError, notifySuccess } = useToast();
  const { profile } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not load users");
      const isBackendUnavailable =
        message.includes("Network Error") ||
        message.includes("Failed to fetch") ||
        message.includes("HTTP 404");

      if (!isBackendUnavailable) {
        notifyError("Users fetch failed", message);
      }

      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      notifyError("Validation", "Name is required.");
      return;
    }

    try {
      const data = await createUser(form);
      setUsers((prev) => [...prev, data]);
      setForm(defaultUser);
      notifySuccess("User created", "New user added successfully.");
    } catch (error) {
      notifyError("Create failed", getApiErrorMessage(error, "Could not create user"));
    }
  };

  const onDelete = async (user) => {
    const ok = window.confirm(`Delete user "${user.name}"?`);
    if (!ok) {
      return;
    }

    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((item) => String(item.id) !== String(user.id)));
      notifySuccess("User deleted", "The user and their direct assignment were removed.");
    } catch (error) {
      notifyError("Delete failed", getApiErrorMessage(error, "Could not delete user"));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <h2 className={styles.title}>User Management</h2>
          <p className={styles.subtitle}>Admin panel to list and create users.</p>
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnNeutral}`} onClick={load}>
          Refresh
        </button>
      </div>

      <section className={styles.grid2}>
        <article className={styles.card}>
          <h3 className={styles.title}>Users</h3>
          {loading ? (
            <p className={styles.empty}>Loading users...</p>
          ) : users.length === 0 ? (
            <p className={styles.empty}>No users found.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Role</th>
                      <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id || user.name}>
                      <td>{user.id || "-"}</td>
                      <td>{user.name}</td>
                      <td>{user.role || "-"}</td>
                        <td>
                          <div className={styles.btnRow}>
                            <button
                              type="button"
                              className={`${styles.btn} ${styles.btnDanger}`}
                              onClick={() => onDelete(user)}
                              disabled={String(user.email || user.name).toLowerCase() === String(profile?.email || profile?.name || "").toLowerCase()}
                              title={
                                String(user.email || user.name).toLowerCase() ===
                                String(profile?.email || profile?.name || "").toLowerCase()
                                  ? "You cannot delete your own active account"
                                  : "Delete this user"
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className={styles.card}>
          <h3 className={styles.title}>Create User</h3>
          <form onSubmit={onCreate}>
            <div className={styles.field}>
              <label htmlFor="user-name">Name</label>
              <input
                id="user-name"
                className={styles.input}
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Enter full name"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="user-role">Role</label>
              <select
                id="user-role"
                className={styles.select}
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              >
                <option value="STUDENT">STUDENT</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
              Save User
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}

export default UsersPage;
