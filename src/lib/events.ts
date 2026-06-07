/**
 * Event layer for the dashboard.
 *
 * Every live update — whether invented locally for the demo or pushed by a real
 * agent backend — flows through a single {@link DashboardEventSource}. The UI
 * never talks to a socket directly; it subscribes to this interface. That means
 * swapping the mock for a production WebSocket is a one-line change in
 * {@link createEventSource} and requires **zero** UI changes.
 *
 *   mock (default)            → MockEventSource     (invents plausible events)
 *   NEXT_PUBLIC_WS_URL set    → WebSocketEventSource (relays a real backend)
 */
import { agents as seedAgents } from "@/data/agents";
import type { AgentEvent, AgentStatus, ConnectionStatus, LogEntry } from "@/types";

export interface DashboardEventSource {
  /** Begin producing events / open the connection. Safe to call once. */
  start(): void;
  /** Stop and release all resources (timers, sockets, listeners). */
  stop(): void;
  /** Subscribe to events. Returns an unsubscribe function. */
  subscribe(handler: (event: AgentEvent) => void): () => void;
  /** Subscribe to connection-status changes. Returns an unsubscribe function. */
  onStatusChange(handler: (status: ConnectionStatus) => void): () => void;
  /** Current connection status. */
  getStatus(): ConnectionStatus;
}

/** Shared subscriber bookkeeping for both source implementations. */
abstract class BaseEventSource implements DashboardEventSource {
  private eventHandlers = new Set<(event: AgentEvent) => void>();
  private statusHandlers = new Set<(status: ConnectionStatus) => void>();
  protected status: ConnectionStatus = "connecting";

  abstract start(): void;
  abstract stop(): void;

  subscribe(handler: (event: AgentEvent) => void) {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  onStatusChange(handler: (status: ConnectionStatus) => void) {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  getStatus() {
    return this.status;
  }

  protected emit(event: AgentEvent) {
    this.eventHandlers.forEach((h) => h(event));
  }

  protected setStatus(status: ConnectionStatus) {
    if (status === this.status) return;
    this.status = status;
    this.statusHandlers.forEach((h) => h(status));
  }

  protected clearHandlers() {
    this.eventHandlers.clear();
    this.statusHandlers.clear();
  }
}

/* -------------------------------------------------------------------------- */
/*  Mock source — invents a believable production day                          */
/* -------------------------------------------------------------------------- */

const now = () => new Date().toISOString();
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const chance = (p: number) => Math.random() < p;

interface RuntimeAgent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  progress: number;
}

/** Log-line templates keyed by the transition that produced them. */
const logLine = (a: RuntimeAgent, kind: "pickup" | "start" | "progress" | "review" | "done" | "error" | "wait"): {
  level: LogEntry["level"];
  message: string;
} => {
  switch (kind) {
    case "pickup":
      return { level: "debug", message: `${a.name} รับงานใหม่เข้ามาดำเนินการ` };
    case "start":
      return { level: "info", message: `${a.name} เริ่มทำงานแล้ว — กำลังดำเนินการ` };
    case "progress":
      return { level: "info", message: `${a.name} คืบหน้า ${a.progress}% ของงานปัจจุบัน` };
    case "review":
      return { level: "info", message: `${a.name} กำลังตรวจทานผลลัพธ์ก่อนส่งต่อ` };
    case "done":
      return { level: "success", message: `${a.name} ทำงานเสร็จและส่งต่อให้ขั้นตอนถัดไปแล้ว` };
    case "wait":
      return { level: "warning", message: `${a.name} กำลังรอผลจากขั้นตอนก่อนหน้า` };
    case "error":
      return {
        level: "error",
        message: pick([
          `${a.name} พบข้อผิดพลาด — กำลังลองใหม่`,
          `${a.name} ตรวจสอบไม่ผ่านและทำเครื่องหมายงานไว้`,
          `${a.name} พบข้อขัดข้องชั่วคราว`,
        ]),
      };
  }
};

export class MockEventSource extends BaseEventSource {
  private timer: ReturnType<typeof setInterval> | null = null;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private runtime: RuntimeAgent[];

  constructor(private readonly tickMs = 2200) {
    super();
    // Seed from the static roster so the simulation starts where the UI starts.
    this.runtime = seedAgents.map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      status: a.status,
      progress: a.progress,
    }));
  }

  start() {
    if (this.timer) return;
    this.setStatus("connecting");
    // Simulate a brief connection handshake, then go live and start ticking.
    this.connectTimer = setTimeout(() => {
      this.setStatus("live");
      this.timer = setInterval(() => this.tick(), this.tickMs);
    }, 600);
  }

  stop() {
    if (this.connectTimer) clearTimeout(this.connectTimer);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.connectTimer = null;
    this.setStatus("offline");
    this.clearHandlers();
  }

  /** Advance a random subset of agents one step through the lifecycle. */
  private tick() {
    // Always nudge whoever is actively working so progress bars feel alive...
    this.runtime.filter((a) => a.status === "working").forEach((a) => this.advance(a));
    // ...plus a couple of random agents to trigger state transitions.
    for (let i = 0; i < 2; i++) {
      const a = pick(this.runtime);
      if (a.status !== "working") this.advance(a);
    }
  }

  private advance(a: RuntimeAgent) {
    const at = now();
    switch (a.status) {
      case "idle":
        if (chance(0.55)) this.transition(a, "thinking", "pickup", at);
        break;
      case "thinking":
        a.progress = 0;
        this.transition(a, "working", "start", at);
        break;
      case "working": {
        a.progress = Math.min(100, a.progress + rand(6, 16));
        this.emit({ type: "progress", agentId: a.id, at, progress: a.progress });
        if (chance(0.05)) {
          this.transition(a, "error", "error", at);
        } else if (a.progress >= 100) {
          this.transition(a, "reviewing", "review", at);
        } else if (chance(0.08)) {
          this.transition(a, "waiting", "wait", at);
        }
        break;
      }
      case "waiting":
        if (chance(0.5)) this.transition(a, "working", "start", at);
        break;
      case "reviewing":
        if (chance(0.7)) {
          a.progress = 100;
          this.transition(a, "done", "done", at);
        } else if (chance(0.15)) {
          this.transition(a, "error", "error", at);
        }
        break;
      case "error":
        // Self-heal so the demo keeps flowing (monitor-only — no human retry).
        if (chance(0.5)) {
          a.progress = rand(0, 30);
          this.transition(a, "working", "start", at);
        }
        break;
      case "done":
        if (chance(0.3)) this.transition(a, "idle", "pickup", at);
        break;
    }
  }

  private transition(
    a: RuntimeAgent,
    status: AgentStatus,
    logKind: Parameters<typeof logLine>[1],
    at: string
  ) {
    a.status = status;
    this.emit({ type: "status", agentId: a.id, at, status });
    const line = logLine(a, logKind);
    this.emit({ type: "log", agentId: a.id, at, level: line.level, message: line.message });
  }
}

/* -------------------------------------------------------------------------- */
/*  WebSocket source — relays a real backend (no extra dependency)             */
/* -------------------------------------------------------------------------- */

/**
 * Connects to a backend that pushes newline-free JSON frames, each one an
 * {@link AgentEvent}. Reconnects with linear backoff. Drop-in for the mock once
 * a real agent runtime exists — just set `NEXT_PUBLIC_WS_URL`.
 */
export class WebSocketEventSource extends BaseEventSource {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private attempts = 0;
  private closedByUs = false;

  constructor(private readonly url: string) {
    super();
  }

  start() {
    this.closedByUs = false;
    this.connect();
  }

  stop() {
    this.closedByUs = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.setStatus("offline");
    this.clearHandlers();
  }

  private connect() {
    this.setStatus(this.attempts === 0 ? "connecting" : "reconnecting");
    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.attempts = 0;
      this.setStatus("live");
    };

    this.ws.onmessage = (msg) => {
      const event = this.parse(msg.data);
      if (event) this.emit(event);
    };

    this.ws.onclose = () => {
      if (!this.closedByUs) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect() {
    this.attempts += 1;
    this.setStatus("reconnecting");
    const delay = Math.min(10_000, this.attempts * 1500);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  /** Validate an incoming frame is a known event shape before emitting it. */
  private parse(data: unknown): AgentEvent | null {
    if (typeof data !== "string") return null;
    try {
      const obj = JSON.parse(data);
      if (obj && (obj.type === "status" || obj.type === "progress" || obj.type === "log") && typeof obj.agentId === "string") {
        return obj as AgentEvent;
      }
    } catch {
      /* ignore malformed frames */
    }
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Factory                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Returns the live event source for the current environment. Set
 * `NEXT_PUBLIC_WS_URL` to point the dashboard at a real backend; otherwise the
 * mock source runs the simulated office.
 */
export function createEventSource(): DashboardEventSource {
  const url = process.env.NEXT_PUBLIC_WS_URL;
  return url ? new WebSocketEventSource(url) : new MockEventSource();
}
