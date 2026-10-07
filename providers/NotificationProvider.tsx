"use client";

import { Alert, Snackbar, type AlertColor } from "@mui/material";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { getErrorMessage } from "@/lib/api/errors";

interface Notification {
  key: number;
  message: string;
  severity: AlertColor;
}

interface NotificationApi {
  notify: (message: string, severity?: AlertColor) => void;
  success: (message: string) => void;
  info: (message: string) => void;
  /** Shows an error; accepts any thrown value and extracts a readable message. */
  error: (error: unknown) => void;
}

const NotificationContext = createContext<NotificationApi | null>(null);

export default function NotificationProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Notification | null>(null);
  const [open, setOpen] = useState(false);

  const notify = useCallback((message: string, severity: AlertColor = "success") => {
    setCurrent({ key: Date.now(), message, severity });
    setOpen(true);
  }, []);

  const api = useMemo<NotificationApi>(
    () => ({
      notify,
      success: (message) => notify(message, "success"),
      info: (message) => notify(message, "info"),
      error: (error) => notify(typeof error === "string" ? error : getErrorMessage(error), "error"),
    }),
    [notify],
  );

  return (
    <NotificationContext.Provider value={api}>
      {children}
      <Snackbar
        key={current?.key}
        open={open}
        autoHideDuration={current?.severity === "error" ? 6000 : 3500}
        onClose={(_, reason) => reason !== "clickaway" && setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={current?.severity ?? "success"}
          variant="filled"
          sx={{ width: "100%", maxWidth: 420, alignItems: "center" }}
        >
          {current?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotify(): NotificationApi {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotify must be used inside NotificationProvider");
  return context;
}
