"use client";

/**
 * Holds the live dashboard state and feeds it from a {@link DashboardEventSource}.
 * Everything below this provider reads agents/logs/connection through the hooks
 * here instead of importing the static `@/data` arrays, so the UI updates in
 * real time as events arrive (mock today, real WebSocket later).
 */
import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { createEventSource } from "@/lib/events";
import { dashboardReducer, initDashboardState } from "@/lib/dashboardReducer";
import type { Agent, ConnectionStatus, LogEntry } from "@/types";

interface DashboardContextValue {
  agents: Agent[];
  logs: LogEntry[];
  connection: ConnectionStatus;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, undefined, initDashboardState);
  const [connection, setConnection] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    const source = createEventSource();
    const unsubscribeEvents = source.subscribe(dispatch);
    const unsubscribeStatus = source.onStatusChange(setConnection);
    setConnection(source.getStatus());
    source.start();

    return () => {
      unsubscribeEvents();
      unsubscribeStatus();
      source.stop();
    };
  }, []);

  const value = useMemo<DashboardContextValue>(
    () => ({ agents: state.agents, logs: state.logs, connection }),
    [state.agents, state.logs, connection]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within a <DashboardProvider>");
  return ctx;
}

export const useAgents = () => useDashboard().agents;
export const useAgent = (id: string | null | undefined) =>
  useDashboard().agents.find((a) => a.id === id) ?? null;
export const useLogs = () => useDashboard().logs;
export const useLogsForAgent = (agentId: string) =>
  useDashboard().logs.filter((l) => l.agentId === agentId);
export const useConnection = () => useDashboard().connection;
