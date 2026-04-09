import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchProjects, getApiErrorMessage, updateProject } from "../api/client";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";
import styles from "./PageStyles.module.css";

function EvaluateProjectPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { notifyError, notifySuccess } = useToast();
  const { role, profile } = useAuth();

  const isAdmin = role === "admin";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(location.state?.project || null);
  const [form, setForm] = useState({ marks: "", feedback: "" });

  useEffect(() => {
    let active = true;

    async function loadProject() {
      if (project) {
        setForm({
          marks: project.marks ?? project.evaluation?.marks ?? "",
          feedback: project.feedback ?? project.evaluation?.feedback ?? "",
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const projects = await fetchProjects();
        const nextProject = projects.find((item) => String(item.id) === String(projectId)) || null;
        if (!active) {
          return;
        }
        setProject(nextProject);
        setForm({
          marks: nextProject?.marks ?? nextProject?.evaluation?.marks ?? "",
          feedback: nextProject?.feedback ?? nextProject?.evaluation?.feedback ?? "",
        });
      } catch (error) {
        if (active) {
          notifyError("Load failed", getApiErrorMessage(error, "Could not load submission"));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      active = false;
    };
  }, [notifyError, project, projectId]);

  const subtitle = useMemo(() => {
    if (!project) {
      return "Select a student submission to add marks and feedback.";
    }
    return `Evaluating ${project.title || project.name || "Untitled project"}`;
  }, [project]);

  const onSave = async (event) => {
    event.preventDefault();
    if (!project) {
      notifyError("Missing submission", "Unable to evaluate a submission that was not found.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...project,
        marks: form.marks === "" ? null : Number(form.marks),
        feedback: form.feedback.trim(),
        evaluatedBy: profile?.name || profile?.email || "Admin",
        evaluatedAt: form.marks || form.feedback ? new Date().toISOString() : null,
      };

      await updateProject(project.id, payload);
      notifySuccess("Saved", "Marks and feedback updated successfully.");
      navigate("/projects", { replace: true });
    } catch (error) {
      notifyError("Save failed", getApiErrorMessage(error, "Could not save evaluation"));
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <section className={styles.card}>
          <h2 className={styles.title}>Admin Access Required</h2>
          <p className={styles.subtitle}>Only admin users can evaluate submissions.</p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <h2 className={styles.title}>Evaluate Submission</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <div className={styles.btnRow}>
          <button type="button" className={`${styles.btn} ${styles.btnNeutral}`} onClick={() => navigate("/projects", { replace: true })}>
            Back
          </button>
        </div>
      </div>

      {loading ? (
        <section className={styles.card}>
          <p className={styles.empty}>Loading submission...</p>
        </section>
      ) : !project ? (
        <section className={styles.card}>
          <p className={styles.empty}>Submission not found.</p>
        </section>
      ) : (
        <section className={styles.grid2}>
          <article className={styles.card}>
            <h3 className={styles.title}>Submission Details</h3>
            <p className={styles.subtitle}><strong>Title:</strong> {project.title || project.name || "Untitled"}</p>
            <p className={styles.subtitle}><strong>Owner:</strong> {project.user?.name || project.ownerName || "Unassigned"}</p>
            <p className={styles.subtitle}><strong>Status:</strong> {project.status || "PLANNED"}</p>
            <p className={styles.subtitle}><strong>Milestone:</strong> {project.milestoneDate || project.milestone || "Not set"}</p>
            <p className={styles.subtitle}><strong>Description:</strong> {project.description || "No description available."}</p>
            <p className={styles.subtitle}><strong>Current Marks:</strong> {project.marks ?? "Pending"}</p>
            <p className={styles.subtitle}><strong>Current Feedback:</strong> {project.feedback || "No feedback yet."}</p>
          </article>

          <article className={styles.card}>
            <h3 className={styles.title}>Add Marks & Feedback</h3>
            <form onSubmit={onSave}>
              <div className={styles.field}>
                <label htmlFor="evaluation-marks">Marks</label>
                <input
                  id="evaluation-marks"
                  type="number"
                  min="0"
                  max="100"
                  className={styles.input}
                  value={form.marks}
                  onChange={(event) => setForm((prev) => ({ ...prev, marks: event.target.value }))}
                  placeholder="Enter marks out of 100"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="evaluation-feedback">Feedback</label>
                <textarea
                  id="evaluation-feedback"
                  className={styles.textarea}
                  value={form.feedback}
                  onChange={(event) => setForm((prev) => ({ ...prev, feedback: event.target.value }))}
                  placeholder="Write feedback for the student"
                />
              </div>

              <div className={styles.btnRow}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
                  {saving ? "Saving..." : "Save Evaluation"}
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnNeutral}`} onClick={() => navigate("/projects", { replace: true })}>
                  Cancel
                </button>
              </div>
            </form>
          </article>
        </section>
      )}
    </div>
  );
}

export default EvaluateProjectPage;