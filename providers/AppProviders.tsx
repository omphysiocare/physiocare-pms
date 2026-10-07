"use client";

import type { ReactNode } from "react";

import AuthProvider from "./AuthProvider";
import BranchProvider from "./BranchProvider";
import NotificationProvider from "./NotificationProvider";
import PrintProvider from "./PrintProvider";
import QueryProvider from "./QueryProvider";
import ThemeProvider from "./ThemeProvider";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <BranchProvider>
            <NotificationProvider>
              <PrintProvider>{children}</PrintProvider>
            </NotificationProvider>
          </BranchProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
