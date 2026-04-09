import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
  timeout: 10000,
});

const LOCAL_PROJECTS_KEY = "spms-projects";
const LOCAL_USERS_KEY = "spms-users";

api.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  nextConfig.headers = {
    ...(config.headers || {}),
    "Content-Type": "application/json",
  };

  // Add authorization token if available
  const token = localStorage.getItem("authToken");
  if (token) {
    nextConfig.headers.Authorization = `Bearer ${token}`;
  }

  return nextConfig;
});

function isBackendUnavailable(error) {
  return (
    !error?.response ||
    error?.response?.status === 404 ||
    error?.message?.includes("Network Error") ||
    error?.message?.includes("Failed to fetch")
  );
}

function readLocalCollection(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalCollection(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function nextLocalId(items) {
  return items.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1;
}

function hydrateProject(project, users = []) {
  const userId = project.userId ?? project.user?.id ?? null;
  const user = project.user || users.find((item) => String(item.id) === String(userId)) || null;
  const ownerName = project.ownerName || user?.name || project.evaluatedBy || "";
  const ownerEmail = project.ownerEmail || user?.email || "";

  return {
    ...project,
    userId,
    user,
    ownerName,
    ownerEmail,
  };
}

export function getApiErrorMessage(error, fallbackMessage) {
  const status = error?.response?.status;
  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (typeof error?.response?.data === "string" ? error.response.data : "");

  if (status) {
    return `${fallbackMessage} (HTTP ${status})${serverMessage ? `: ${serverMessage}` : ""}`;
  }

  return `${fallbackMessage}: ${error.message || "Unexpected network error."}`;
}

export async function fetchUsers() {
  try {
    const response = await api.get("/api/users");
    return response.data || [];
  } catch (error) {
    if (!isBackendUnavailable(error)) {
      throw error;
    }
    return readLocalCollection(LOCAL_USERS_KEY);
  }
}

export async function createUser(payload) {
  try {
    const response = await api.post("/api/users", payload);
    return response.data;
  } catch (error) {
    if (!isBackendUnavailable(error)) {
      throw error;
    }

    const users = readLocalCollection(LOCAL_USERS_KEY);
    const nextUser = {
      id: nextLocalId(users),
      ...payload,
    };
    const nextUsers = [...users, nextUser];
    writeLocalCollection(LOCAL_USERS_KEY, nextUsers);
    return nextUser;
  }
}

export async function deleteUser(id) {
  try {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  } catch (error) {
    if (!isBackendUnavailable(error)) {
      throw error;
    }

    const users = readLocalCollection(LOCAL_USERS_KEY);
    writeLocalCollection(
      LOCAL_USERS_KEY,
      users.filter((user) => String(user.id) !== String(id))
    );

    const projects = readLocalCollection(LOCAL_PROJECTS_KEY);
    const nextProjects = projects.map((project) =>
      String(project.userId) === String(id)
        ? {
            ...project,
            userId: null,
            user: null,
          }
        : project
    );
    writeLocalCollection(LOCAL_PROJECTS_KEY, nextProjects);

    return { success: true };
  }
}

export async function fetchProjects() {
  try {
    const response = await api.get("/api/projects");
    return response.data || [];
  } catch (error) {
    if (!isBackendUnavailable(error)) {
      throw error;
    }

    const users = readLocalCollection(LOCAL_USERS_KEY);
    return readLocalCollection(LOCAL_PROJECTS_KEY).map((project) => hydrateProject(project, users));
  }
}

export async function createProject(payload) {
  try {
    const response = await api.post("/api/projects", payload);
    return response.data;
  } catch (error) {
    if (!isBackendUnavailable(error)) {
      throw error;
    }

    const projects = readLocalCollection(LOCAL_PROJECTS_KEY);
    const users = readLocalCollection(LOCAL_USERS_KEY);
    const nextProject = hydrateProject(
      {
        id: nextLocalId(projects),
        ...payload,
      },
      users
    );

    writeLocalCollection(LOCAL_PROJECTS_KEY, [...projects, nextProject]);
    return nextProject;
  }
}

export async function updateProject(id, payload) {
  try {
    const response = await api.put(`/api/projects/${id}`, payload);
    return response.data;
  } catch (error) {
    if (!isBackendUnavailable(error)) {
      throw error;
    }

    const projects = readLocalCollection(LOCAL_PROJECTS_KEY);
    const users = readLocalCollection(LOCAL_USERS_KEY);
    const nextProjects = projects.map((project) =>
      String(project.id) === String(id)
        ? hydrateProject(
            {
              ...project,
              ...payload,
              id: project.id,
            },
            users
          )
        : project
    );

    writeLocalCollection(LOCAL_PROJECTS_KEY, nextProjects);
    return nextProjects.find((project) => String(project.id) === String(id));
  }
}

export async function deleteProject(id) {
  try {
    const response = await api.delete(`/api/projects/${id}`);
    return response.data;
  } catch (error) {
    if (!isBackendUnavailable(error)) {
      throw error;
    }

    const projects = readLocalCollection(LOCAL_PROJECTS_KEY);
    writeLocalCollection(
      LOCAL_PROJECTS_KEY,
      projects.filter((project) => String(project.id) !== String(id))
    );
    return { success: true };
  }
}

export async function login(payload) {
  const paths = ["/api/auth/login", "/auth/login"];
  let lastError;

  for (const path of paths) {
    try {
      const response = await api.post(path, payload);
      return response.data;
    } catch (error) {
      lastError = error;
      if (error?.response?.status === 404) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

export async function signup(payload) {
  const paths = ["/api/auth/signup", "/auth/signup"];
  let lastError;

  for (const path of paths) {
    try {
      const response = await api.post(path, payload);
      return response.data;
    } catch (error) {
      lastError = error;
      if (error?.response?.status === 404) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

export default api;
