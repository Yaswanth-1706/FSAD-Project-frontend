import React, { useCallback, useEffect, useState } from "react";
import { fetchProjects, getApiErrorMessage } from "../api/client";
import { useToast } from "../components/ToastProvider";
import { getProjectMedia } from "../utils/mediaStore";
import styles from "./PageStyles.module.css";

function PortfolioPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const { notifyError } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (error) {
      notifyError("Portfolio load failed", getApiErrorMessage(error, "Could not fetch projects"));
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <h2 className={styles.title}>Project Portfolio</h2>
          <p className={styles.subtitle}>Visual overview of project details and media.</p>
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnNeutral}`} onClick={load}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className={styles.card}>
          <p className={styles.empty}>Loading portfolio...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className={styles.card}>
          <p className={styles.empty}>No projects available.</p>
        </div>
      ) : (
        <section className={styles.grid3}>
          {projects.map((project) => {
            const media = getProjectMedia(project.id) || project.mediaUrl || "";
            return (
              <article className={styles.card} key={project.id || project.name}>
                {media ? (
                  <img className={styles.media} src={media} alt={project.title || project.name || "Project media"} />
                ) : (
                  <div className={styles.media} />
                )}
                <h3 className={styles.title}>{project.title || project.name || "Untitled Project"}</h3>
                <p className={styles.subtitle}>{project.description || "No description available."}</p>
                <p>
                  <strong>Status:</strong> {project.status || "PLANNED"}
                </p>
                <p>
                  <strong>Milestone:</strong> {project.milestoneDate || project.milestone || "Not set"}
                </p>
                <p>
                  <strong>Owner:</strong> {project.user?.name || "Unassigned"}
                </p>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default PortfolioPage;
