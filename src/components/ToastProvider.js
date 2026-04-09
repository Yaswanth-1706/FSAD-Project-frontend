import React, { createContext, useContext, useMemo, useState } from "react";
import styles from "./ToastProvider.module.css";

const ToastContext = createContext({
  notifySuccess: () => {},
  notifyError: () => {},
  notifyInfo: () => {},
});

function ToastItem({ toast, onClose }) {
  return (
    <div className={`${styles.toast} ${styles[toast.type]}`} role="status" aria-live="polite">
      <div>
        <strong>{toast.title}</strong>
        <p>{toast.message}</p>
      </div>
      <button type="button" onClick={() => onClose(toast.id)} aria-label="Close notification">
        x
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const pushToast = (type, title, message) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  };

  const value = useMemo(
    () => ({
      notifySuccess: (title, message) => pushToast("success", title, message),
      notifyError: (title, message) => pushToast("error", title, message),
      notifyInfo: (title, message) => pushToast("info", title, message),
    }),
    []
  );

  const closeToast = (id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.container}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={closeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
