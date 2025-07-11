import { useEffect } from "react";

interface AlertMessageProps {
  type: "success" | "danger" | "info";
  message: string;
  onClose?: () => void;
}

const AlertMessage = ({ type, message, onClose }: AlertMessageProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeStyles = {
    success: {
      icon: "✅",
      bg: "bg-success-subtle",
      text: "text-success-emphasis",
      border: "border-success-subtle",
    },
    danger: {
      icon: "❌",
      bg: "bg-danger-subtle",
      text: "text-danger-emphasis",
      border: "border-danger-subtle",
    },
    info: {
      icon: "ℹ️",
      bg: "bg-info-subtle",
      text: "text-info-emphasis",
      border: "border-info-subtle",
    },
  }[type];

  return (
    <div
      className="toast-container position-fixed top-0 end-0 p-3"
      style={{ zIndex: 9999 }}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div
        className={`toast show ${typeStyles.bg} ${typeStyles.text} ${typeStyles.border} border rounded-3 shadow-sm`}
        style={{ minWidth: "280px" }}
      >
        <div className="d-flex justify-content-between align-items-center p-3">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: "1.2rem" }}>{typeStyles.icon}</span>
            <span className="fw-semibold">{message}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close alert"
            onClick={onClose}
          ></button>
        </div>
      </div>
    </div>
  );
};

export default AlertMessage;
