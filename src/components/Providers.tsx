"use client";

import React from "react";
import { AuthProvider } from "@/context/auth-context";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider><WorkspaceProvider>
      {children}
      <InstallPwaBanner />
    </WorkspaceProvider></AuthProvider>
  );
}
