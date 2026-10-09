"use client";

import React from "react";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { InstallPwaBanner } from "@/components/InstallPwaBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      {children}
      <InstallPwaBanner />
    </WorkspaceProvider>
  );
}
