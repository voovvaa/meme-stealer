import * as React from "react";
import { cn } from "@/lib/utils";

const ToastContext = React.createContext<{
  toasts: Array<{ id: string; title?: string; description?: string; variant?: "default" | "destructive" }>;
  dismiss: (id: string) => void;
}>({
  toasts: [],
  dismiss: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<
    Array<{ id: string; title?: string; description?: string; variant?: "default" | "destructive" }>
  >([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, dismiss }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 w-full max-w-md p-4 space-y-4">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function Toast({
  id,
  title,
  description,
  variant = "default",
  onDismiss,
}: {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  onDismiss: () => void;
}) {
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        "pointer-events-auto w-full overflow-hidden rounded-lg shadow-lg ring-1",
        variant === "destructive"
          ? "bg-red-50 ring-red-200"
          : "bg-white ring-gray-200"
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-1">
            {title && (
              <p
                className={cn(
                  "text-sm font-semibold",
                  variant === "destructive" ? "text-red-900" : "text-gray-900"
                )}
              >
                {title}
              </p>
            )}
            {description && (
              <p
                className={cn(
                  "mt-1 text-sm",
                  variant === "destructive" ? "text-red-700" : "text-gray-600"
                )}
              >
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onDismiss}
            className={cn(
              "ml-4 inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2",
              variant === "destructive"
                ? "text-red-500 hover:bg-red-100 focus:ring-red-600"
                : "text-gray-400 hover:bg-gray-100 focus:ring-gray-600"
            )}
          >
            <span className="sr-only">Закрыть</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function Toaster() {
  const { toasts, dismiss } = React.useContext(ToastContext);

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full max-w-md p-4 space-y-4 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}
