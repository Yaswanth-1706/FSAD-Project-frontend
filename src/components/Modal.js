import React from "react";
import styles from "./Modal.module.css";

function Modal({ title, isOpen, onClose, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div className={styles.modal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <h3>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close modal">
            x
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
