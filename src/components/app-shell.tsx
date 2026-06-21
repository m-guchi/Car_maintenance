"use client";

import { createContext, useCallback, useContext, useState } from "react";

import { AppBottomNav } from "@/components/app-bottom-nav";
import { AppSidebar } from "@/components/app-sidebar";

type SidebarContextValue = {
  openSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within AppShell");
  }
  return context;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <SidebarContext.Provider value={{ openSidebar }}>
      <div className="flex min-h-full">
        <AppSidebar open={sidebarOpen} onClose={closeSidebar} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        <AppBottomNav />
      </div>
    </SidebarContext.Provider>
  );
}
