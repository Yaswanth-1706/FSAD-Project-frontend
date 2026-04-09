const KEY = "spms-project-media";

export function loadMediaMap() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveMediaMap(map) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function saveProjectMedia(projectId, fileDataUrl) {
  if (!projectId || !fileDataUrl) {
    return;
  }

  const existing = loadMediaMap();
  const next = { ...existing, [projectId]: fileDataUrl };
  saveMediaMap(next);
}

export function getProjectMedia(projectId) {
  const data = loadMediaMap();
  return data[projectId] || "";
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
