import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProject,
  deleteProject,
  fetchProjects,
  getApiErrorMessage,
  updateProject,
} from "../api/client";
import Modal from "../components/Modal";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { readFileAsDataUrl, saveProjectMedia } from "../utils/mediaStore";
import styles from "./PageStyles.module.css";

const defaultForm = {
  id: null,
  title: "",
  description: "",
  status: "PLANNED",
  milestoneDate: "",
  mediaFile: null,
};

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

function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const { notifyError, notifyInfo } = useToast();
  const { role, profile } = useAuth();

  const normalizedRole = role === "admin" ? "admin" : "student";
  const isAdmin = normalizedRole === "admin";

  const getOwnership = useCallback(() => {
    const name = profile?.name?.trim() || profile?.email?.trim() || "Student";
    const email = profile?.email?.trim() || profile?.name?.trim() || "";
    return { ownerName: name, ownerEmail: email };
  }, [profile]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (error) {
      const message = error?.message || "Unable to load dashboard data.";
      if (message.includes("Network Error") || message.includes("Failed to fetch")) {
        setProjects([]);
      } else {
        notifyError("Projects fetch failed", message);
      }
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleProjects = useMemo(() => {
    if (isAdmin) {
      return projects;
    }

    const profileName = profile?.name?.trim().toLowerCase();
    const profileEmail = profile?.email?.trim().toLowerCase();
    const matched = projects.filter((project) => {
      const ownerName = project.user?.name?.trim().toLowerCase() || project.ownerName?.trim().toLowerCase();
      const ownerEmail = project.user?.email?.trim().toLowerCase() || project.ownerEmail?.trim().toLowerCase();
      return (
        (profileName && (ownerName === profileName || project.title?.trim().toLowerCase().includes(profileName))) ||
        (profileEmail && ownerEmail === profileEmail)
      );
    });

    return matched;
  }, [isAdmin, profile, projects]);

  const myProjects = visibleProjects;

  const metrics = useMemo(() => {
    const total = visibleProjects.length;
    const completed = visibleProjects.filter((item) => normalizeStatus(item.status) === "COMPLETED").length;
    const inProgress = visibleProjects.filter((item) => normalizeStatus(item.status) === "IN_PROGRESS").length;
    const planned = total - completed - inProgress;
    return { total, completed, inProgress, planned };
  }, [visibleProjects]);

  const evaluatedProjects = useMemo(
    () => visibleProjects.filter((project) => project.marks !== undefined && project.marks !== null && project.marks !== ""),
    [visibleProjects]
  );

  const openCreate = () => {
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  const openEdit = (project) => {
    setForm({
      id: project.id,
      title: project.title || project.name || "",
      description: project.description || "",
      status: normalizeStatus(project.status),
      milestoneDate: project.milestoneDate || project.milestone || "",
      mediaFile: null,
    });
    setIsModalOpen(true);
  };

  const onSave = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      notifyError("Validation", "Project title is required.");
      return;
    }

    const { ownerName, ownerEmail } = getOwnership();
    const payload = {
      title: form.title.trim(),
      description: form.description,
      status: form.status,
      milestoneDate: form.milestoneDate,
      ownerName,
      ownerEmail,
      ownerRole: normalizedRole,
      studentCreated: true,
      submittedBy: profile?.email || profile?.name || "",
    };

    setSaving(true);
    try {
      const data = form.id ? await updateProject(form.id, payload) : await createProject(payload);
      const projectId = data?.id || form.id;

      if (projectId && form.mediaFile) {
        const mediaDataUrl = await readFileAsDataUrl(form.mediaFile);
        saveProjectMedia(projectId, mediaDataUrl);
      }

      notifyInfo("Saved", form.id ? "Submission updated successfully." : "Submission created successfully.");
      setIsModalOpen(false);
      setForm(defaultForm);
      await load();
    } catch (error) {
      notifyError("Save failed", getApiErrorMessage(error, "Failed to save submission"));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (project) => {
    const ok = window.confirm(`Delete submission "${project.title || project.name || "Untitled"}"?`);
    if (!ok) {
      return;
    }

    try {
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((item) => String(item.id) !== String(project.id)));
      notifyInfo("Deleted", "Your submission was removed.");
    } catch (error) {
      notifyError("Delete failed", getApiErrorMessage(error, "Could not delete submission"));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <h2 className={styles.title}>{isAdmin ? "Admin Dashboard" : "Student Dashboard"}</h2>
          <p className={styles.subtitle}>
            {isAdmin
              ? "Review every project, assign marks, and leave feedback for students."
              : "Add your submissions, edit them, delete them, and see admin marks and feedback."}
          </p>
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={load}>
          Refresh Data
        </button>
      </div>

      <section className={styles.grid3}>
        <article className={styles.card}>
          <p className={styles.kpiLabel}>{isAdmin ? "All Projects" : "My Submissions"}</p>
          <p className={styles.kpiValue}>{metrics.total}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.kpiLabel}>In Progress</p>
          <p className={styles.kpiValue}>{metrics.inProgress}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.kpiLabel}>Evaluated</p>
          <p className={styles.kpiValue}>{evaluatedProjects.length}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.kpiLabel}>Completed</p>
          <p className={styles.kpiValue}>{metrics.completed}</p>
        </article>
      </section>

      {!isAdmin && (
        <section className={styles.card}>
          <div className={styles.titleRow}>
            <div>
              <h3 className={styles.title}>My Submissions</h3>
              <p className={styles.subtitle}>Manage your own projects from here.</p>
            </div>
            <div className={styles.btnRow}>
              <button type="button" className={`${styles.btn} ${styles.btnNeutral}`} onClick={load}>
                Reload
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>
                Add Project
              </button>
            </div>
          </div>

          {loading ? (
            <p className={styles.empty}>Loading projects...</p>
          ) : myProjects.length === 0 ? (
            <p className={styles.empty}>No submissions found yet.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Milestone Date</th>
                    <th>Marks</th>
                    <th>Feedback</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myProjects.map((project) => (
                    <tr key={project.id || project.name}>
                      <td>{project.title || project.name || "Unnamed project"}</td>
                      <td>
                        <span className={statusClass(project.status)}>{normalizeStatus(project.status).replace("_", " ")}</span>
                      </td>
                      <td>{project.milestoneDate || project.milestone || "Not set"}</td>
                      <td>{project.marks ?? "Pending"}</td>
                      <td>{project.feedback || "No feedback yet"}</td>
                      <td>
                        <div className={styles.btnRow}>
                          <button type="button" className={`${styles.btn} ${styles.btnNeutral}`} onClick={() => openEdit(project)}>
                            Edit
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
      )}

      {isAdmin && (
        <section className={styles.card}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>Project Evaluation Overview</h3>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnNeutral}`}
              onClick={() => notifyInfo("Tip", "Use Projects page to assign marks and feedback.")}
            >
              Help
            </button>
          </div>

          {loading ? (
            <p className={styles.empty}>Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className={styles.empty}>No projects available yet.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Milestone Date</th>
                    <th>Owner</th>
                    <th>Marks</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProjects.map((project) => (
                    <tr key={project.id || project.name}>
                      <td>{project.title || project.name || "Unnamed project"}</td>
                      <td>
                        <span className={statusClass(project.status)}>{normalizeStatus(project.status).replace("_", " ")}</span>
                      </td>
                      <td>{project.milestoneDate || project.milestone || "Not set"}</td>
                      <td>{project.user?.name || project.ownerName || "Unassigned"}</td>
                      <td>{project.marks ?? "Pending"}</td>
                      <td>{project.feedback || "No feedback yet"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {!isAdmin && (
        <Modal title={form.id ? "Edit Submission" : "Create Submission"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={onSave}>
            <div className={styles.field}>
              <label htmlFor="student-project-name">Project Title</label>
              <input
                id="student-project-name"
                className={styles.input}
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="student-project-description">Description</label>
              <textarea
                id="student-project-description"
                className={styles.textarea}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label htmlFor="student-project-status">Status</label>
                <select
                  id="student-project-status"
                  className={styles.select}
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="PLANNED">PLANNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="student-project-date">Milestone Date</label>
                <input
                  id="student-project-date"
                  type="date"
                  className={styles.input}
                  value={form.milestoneDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, milestoneDate: event.target.value }))}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="student-project-media">Project Media</label>
              <input
                id="student-project-media"
                type="file"
                className={styles.input}
                accept="image/*"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    mediaFile: event.target.files?.[0] || null,
                  }))
                }
              />
            </div>

            <div className={styles.btnRow}>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
                {saving ? "Saving..." : "Save Submission"}
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnNeutral}`} onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default DashboardPage;
