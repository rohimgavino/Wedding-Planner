"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Workspace, BudgetItem, TaskItem, GuestItem } from "@/types";
import { DEFAULT_BUDGET_CATEGORIES, INITIAL_KUA_AND_TIMELINE_TASKS } from "@/lib/seed-data";

interface WorkspaceContextType {
  workspace: Workspace | null;
  budgets: BudgetItem[];
  tasks: TaskItem[];
  guests: GuestItem[];
  inviteToken: string;
  isLoaded: boolean;
  createWorkspace: (params: {
    groom_name: string;
    bride_name: string;
    wedding_date: string;
    target_budget: number;
    target_savings: number;
  }) => void;
  addBudget: (item: {
    category: string;
    title: string;
    allocated_amount: number;
    spent_amount: number;
    payment_status: BudgetItem["payment_status"];
    notes?: string;
  }) => void;
  updateBudget: (id: string, updates: Partial<BudgetItem>) => void;
  deleteBudget: (id: string) => void;
  toggleTask: (id: string) => void;
  addTask: (item: {
    title: string;
    phase: TaskItem["phase"];
    pic: TaskItem["pic"];
    due_date?: string;
  }) => void;
  deleteTask: (id: string) => void;
  addGuest: (item: {
    name: string;
    category: GuestItem["category"];
    pax: number;
    phone?: string;
    rsvp_status: GuestItem["rsvp_status"];
    notes?: string;
  }) => void;
  updateGuest: (id: string, updates: Partial<GuestItem>) => void;
  deleteGuest: (id: string) => void;
  resetData: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const STORAGE_KEY = "wedding_planner_workspace_clean_v2";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [inviteToken, setInviteToken] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount (Kosongan secara default)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setWorkspace(data.workspace || null);
        setBudgets(data.budgets || []);
        setTasks(data.tasks || []);
        setGuests(data.guests || []);
        setInviteToken(data.inviteToken || "");
      } else {
        // Kosongan secara default: belum ada dummy Rian & Dina
        setWorkspace(null);
        setBudgets([]);
        setTasks([]);
        setGuests([]);
        setInviteToken("");
      }
    } catch (e) {
      console.error("Failed to load workspace data:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const dataToSave = {
        workspace,
        budgets,
        tasks,
        guests,
        inviteToken,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error("Failed to save workspace data:", e);
    }
  }, [workspace, budgets, tasks, guests, inviteToken, isLoaded]);

  const createWorkspace = (params: {
    groom_name: string;
    bride_name: string;
    wedding_date: string;
    target_budget: number;
    target_savings: number;
  }) => {
    const wsId = "ws-" + Date.now();
    const newWs: Workspace = {
      id: wsId,
      title: `Pernikahan ${params.groom_name} & ${params.bride_name}`,
      wedding_date: params.wedding_date,
      target_budget: params.target_budget,
      target_savings: params.target_savings,
      created_at: new Date().toISOString(),
    };

    const initialBudgets: BudgetItem[] = DEFAULT_BUDGET_CATEGORIES.map((c, i) => ({
      id: `b-${wsId}-${i}`,
      workspace_id: wsId,
      category: c.category,
      title: c.title,
      allocated_amount: c.allocated,
      spent_amount: 0,
      payment_status: "unpaid",
    }));

    const initialTasks: TaskItem[] = INITIAL_KUA_AND_TIMELINE_TASKS.map((t, i) => ({
      id: `t-${wsId}-${i}`,
      workspace_id: wsId,
      title: t.title,
      phase: t.phase,
      pic: t.pic,
      is_completed: false,
    }));

    const token = "WEDD-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    setWorkspace(newWs);
    setBudgets(initialBudgets);
    setTasks(initialTasks);
    setGuests([]);
    setInviteToken(token);
  };

  const addBudget = (item: {
    category: string;
    title: string;
    allocated_amount: number;
    spent_amount: number;
    payment_status: BudgetItem["payment_status"];
    notes?: string;
  }) => {
    if (!workspace) return;
    const newBudget: BudgetItem = {
      id: "b-" + Date.now(),
      workspace_id: workspace.id,
      ...item,
    };
    setBudgets((prev) => [newBudget, ...prev]);
  };

  const updateBudget = (id: string, updates: Partial<BudgetItem>) => {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_completed: !t.is_completed } : t))
    );
  };

  const addTask = (item: {
    title: string;
    phase: TaskItem["phase"];
    pic: TaskItem["pic"];
    due_date?: string;
  }) => {
    if (!workspace) return;
    const newTask: TaskItem = {
      id: "t-" + Date.now(),
      workspace_id: workspace.id,
      title: item.title,
      phase: item.phase,
      pic: item.pic,
      is_completed: false,
      due_date: item.due_date,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addGuest = (item: {
    name: string;
    category: GuestItem["category"];
    pax: number;
    phone?: string;
    rsvp_status: GuestItem["rsvp_status"];
    notes?: string;
  }) => {
    if (!workspace) return;
    const newGuest: GuestItem = {
      id: "g-" + Date.now(),
      workspace_id: workspace.id,
      ...item,
    };
    setGuests((prev) => [newGuest, ...prev]);
  };

  const updateGuest = (id: string, updates: Partial<GuestItem>) => {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const deleteGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  const resetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        budgets,
        tasks,
        guests,
        inviteToken,
        isLoaded,
        createWorkspace,
        addBudget,
        updateBudget,
        deleteBudget,
        toggleTask,
        addTask,
        deleteTask,
        addGuest,
        updateGuest,
        deleteGuest,
        resetData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
