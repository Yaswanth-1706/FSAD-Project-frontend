import React, { useCallback, useEffect, useMemo, useState } from "react";
import { deleteProject, fetchProjects, getApiErrorMessage } from "../api/client";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "./PageStyles.module.css";

function isStudentSubmission(project) {
  return (
    String(project?.ownerRole || "").toLowerCase() === "student" ||
    Boolean(project?.studentCreated) ||
    Boolean(project?.submittedBy) ||
    String(project?.user?.role || "").toLowerCase() === "student"
  );
}

function normalizeStatus(status) {
  if (!status) {
    return "PLANNED";
  }
  return String(status).toUpperCase();
}

function statusClass(status) {
  const value = normalizeStatus(status);
  if (value === "COMPLETED") {
    return `${styles.status} ${styles.statusCompleted}`;
  }
  if (value === "IN_PROGRESS") {
    return `${styles.status} ${styles.statusInProgress}`;
  }
  return `${styles.status} ${styles.statusPlanned}`;
}

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const { notifyError, notifySuccess } = useToast();
  const { role } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const projectList = await fetchProjects();
      setProjects(projectList.filter(isStudentSubmission));
    } catch (error) {
      const message = getApiErrorMessage(error, "Request failed");
      const isBackendUnavailable =
        message.includes("Network Error") ||
        message.includes("Failed to fetch") ||
        message.includes("HTTP 404");

      if (!isBackendUnavailable) {
        notifyError("Unable to load projects", message);
      }

      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, [loadData]);

  const onDelete = async (project) => {
    const ok = window.confirm(`Delete student submission "${project.title || project.name || "Untitled"}"?`);
    if (!ok) {
      return;
    }

    try {
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((item) => item.id !== project.id));
      notifySuccess("Deleted", "Student submission removed.");
    } catch (error) {
      notifyError("Delete failed", getApiErrorMessage(error, "Could not delete project"));
    }
  };

  const total = useMemo(() => projects.length, [projects]);

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <section className={styles.card}>
          <h2 className={styles.title}>Admin Access Required</h2>
          <p className={styles.subtitle}>Project evaluation is available only for admin users.</p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <h2 className={styles.title}>Project Evaluation Panel</h2>
          <p className={styles.subtitle}>Review all projects, assign marks, and give students feedback.</p>
        </div>
        <div className={styles.btnRow}>
          <button type="button" className={`${styles.btn} ${styles.btnNeutral}`} onClick={loadData}>
            Reload
          </button>
        </div>
      </div>

      <section className={styles.card}>
        <p className={styles.subtitle}>Total student submissions: {total}</p>
        {loading ? (
          <p className={styles.empty}>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className={styles.empty}>No student submissions found.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Milestone</th>
                  <th>Owner</th>
                  <th>Marks</th>
                  <th>Feedback</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id || project.name}>
                    <td>{project.title || project.name || "Untitled"}</td>
                    <td>
                      <span className={statusClass(project.status)}>{normalizeStatus(project.status).replace("_", " ")}</span>
                    </td>
                    <td>{project.milestoneDate || project.milestone || "Not set"}</td>
                    <td>{project.user?.name || "Unassigned"}</td>
                    <td>{project.marks ?? "Pending"}</td>
                    <td>{project.feedback || "No feedback"}</td>
                    <td>
                      <div className={styles.btnRow}>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          onClick={() => navigate(`/projects/${project.id}/evaluate`, { state: { project } })}
                        >
                          Evaluate
                        </button>
                        <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={() => onDelete(project)}>
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
      </section>
    </div>
  );
}

export default ProjectsPage;
