/**
 * useCommandCenterData.ts — Data aggregation for Command Center
 * 
 * Fetches from multiple endpoints and combines into unified snapshot:
 * - /api/erp/command-center/snapshot.php (main data)
 * - /api/get_live_feed.php (events)
 * - /api/erp/services/command_center/pipeline_stages.php (pipeline)
 * - /api/get_technicians.php (technician details)
 * - /api/get_branches.php (branch data)
 * - /api/get_devices.php (device list)
 * - /api/get_invoices.php (finance data)
 * - /api/get_inventory_batches.php (inventory)
 */

import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
═══════════════════════════════════════════════════════════════════════ */

export interface PipelineStage {
  key: string;
  label_ar: string;
  count: number;
  color?: string;
  statuses?: string[];
  path?: string;
}

export interface TechnicianLoad {
  id: string;
  name: string;
  active: number;
  overdue: number;
  completed_today?: number;
  avg_time?: string | number;
}

export interface InventoryAlert {
  id: string;
  name: string;
  stock: number;
  min: number;
  severity: "critical" | "high" | "medium" | "low";
  monthly_usage?: number;
}

export interface LiveEvent {
  id: string;
  type: string;
  label?: string;
  description?: string;
  device_code?: string;
  technician?: string;
  amount?: number;
  ts?: string;
  color: string;
  path?: string;
}

export interface FinanceSummary {
  revenue_today: number;
  revenue_month?: number;
  collections_due: number;
  collections_due_count: number;
  cash_balance?: number;
  expenses_today: number;
}

export interface Snapshot {
  overview?: {
    received_today: number;
    with_technicians: number;
    in_qc: number;
    ready_for_delivery: number;
    delivered_today: number;
    sla_violations: number;
    no_updates: number;
  };
  pipeline?: {
    stages: PipelineStage[];
  };
  technicians: TechnicianLoad[];
  branches: any[];
  online_users: number;
  alerts?: any[];
  delayed_devices?: any[];
  critical_inventory?: any[];
  due_collections?: any[];
  dealer_summary?: any[];
}

export interface CommandCenterData {
  snapshot: Snapshot | null;
  events: LiveEvent[];
  financeSummary: FinanceSummary | null;
  inventoryAlerts: InventoryAlert[] | null;
  shipments: any[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════════ */

const API_BASE = "/api";

const PIPELINE_STAGE_CONFIG: Record<string, { color: string; path: string }> = {
  reception: { color: "#3b82f6", path: "/devices?status=received" },
  checkup: { color: "#f59e0b", path: "/devices?status=pending_checkup" },
  diagnosis: { color: "#8b5cf6", path: "/devices?status=diagnosing" },
  assignment: { color: "#6366f1", path: "/devices?status=pending_assignment" },
  technician: { color: "#ec4899", path: "/devices?status=accepted_by_technician" },
  repair: { color: "#06b6d4", path: "/devices?status=in_repair" },
  waiting_parts: { color: "#f97316", path: "/devices?status=waiting_parts" },
  quality_control: { color: "#a855f7", path: "/devices?status=ready_for_testing" },
  ready: { color: "#10b981", path: "/devices?status=ready" },
  delivered: { color: "#6b7280", path: "/devices?status=delivered" },
};

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  device_received: { label: "جهاز جديد", color: "#3b82f6" },
  device_inspected: { label: "تم الفحص", color: "#f59e0b" },
  device_assigned: { label: "تم التوزيع", color: "#6366f1" },
  device_started: { label: "بدء الإصلاح", color: "#06b6d4" },
  part_consumed: { label: "قطعة مستهلكة", color: "#f97316" },
  qc_passed: { label: "نجح الفحص", color: "#10b981" },
  qc_failed: { label: "فشل الفحص", color: "#ef4444" },
  device_completed: { label: "إصلاح مكتمل", color: "#10b981" },
  invoice_created: { label: "فاتورة جديدة", color: "#8b5cf6" },
  payment_received: { label: "دفعة وردت", color: "#10b981" },
  shipment_created: { label: "شحنة جديدة", color: "#14b8a6" },
  shipment_delivered: { label: "شحنة مُسلّمة", color: "#10b981" },
};

/* ═══════════════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
═══════════════════════════════════════════════════════════════════════ */

async function fetchJSON(endpoint: string) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error(`Failed to fetch ${endpoint}:`, err);
    return null;
  }
}

function buildPipelineStages(devices: any[] = []): PipelineStage[] {
  const stageMap: Record<string, PipelineStage> = {};

  // Initialize all stages
  Object.entries(PIPELINE_STAGE_CONFIG).forEach(([key, config]) => {
    stageMap[key] = {
      key,
      label_ar: {
        reception: "الاستقبال",
        checkup: "الفحص",
        diagnosis: "التشخيص",
        assignment: "التوزيع",
        technician: "الفني",
        repair: "الإصلاح",
        waiting_parts: "قطع غيار",
        quality_control: "الجودة",
        ready: "جاهز",
        delivered: "مُسلّم",
      }[key] || key,
      count: 0,
      color: config.color,
      path: config.path,
    };
  });

  // Count devices per stage
  devices.forEach((device) => {
    const status = device.status?.toLowerCase() || "";
    
    // Map device status to pipeline stage
    let stageKey = "reception";
    
    if (["delivered"].includes(status)) stageKey = "delivered";
    else if (["ready", "invoiced"].includes(status)) stageKey = "ready";
    else if (["ready_for_testing", "qc_pass", "qc_fail", "rework"].includes(status))
      stageKey = "quality_control";
    else if (["waiting_parts"].includes(status)) stageKey = "waiting_parts";
    else if (["in_repair", "paused", "external_service", "waiting_customer"].includes(status))
      stageKey = "repair";
    else if (["accepted_by_technician"].includes(status)) stageKey = "technician";
    else if (["pending_assignment", "assigned", "pending_acceptance"].includes(status))
      stageKey = "assignment";
    else if (["diagnosing"].includes(status)) stageKey = "diagnosis";
    else if (["pending_checkup"].includes(status)) stageKey = "checkup";
    else if (["received"].includes(status)) stageKey = "reception";

    if (stageMap[stageKey]) {
      stageMap[stageKey].count++;
    }
  });

  return Object.values(stageMap);
}

function buildTechnicianLoads(technicians: any[] = [], devices: any[] = []): TechnicianLoad[] {
  return (technicians || [])
    .filter((t) => t.user_id) // Only valid technicians
    .map((tech, index) => {
      // Count devices assigned to this technician
      const assigned = devices.filter(
        (d) => d.assigned_to === tech.user_id || d.technician_id === tech.user_id
      );

      const active = assigned.filter(
        (d) => !["delivered", "rejected", "cancelled"].includes(d.status?.toLowerCase() || "")
      ).length;

      const overdue = assigned.filter(
        (d) =>
          d.receivedAt &&
          new Date().getTime() - new Date(d.receivedAt).getTime() > 7 * 24 * 60 * 60 * 1000 &&
          !["delivered", "rejected"].includes(d.status?.toLowerCase() || "")
      ).length;

      const completed = assigned.filter((d) => d.status?.toLowerCase() === "delivered").length;

      return {
        id: tech.user_id,
        name: tech.phone?.split("@")[0] || `فني ${index + 1}`, // Use email prefix or fallback
        active,
        overdue,
        completed_today: completed,
        avg_time: tech.avg_repair_time || "—",
      };
    })
    .sort((a, b) => b.active - a.active); // Sort by workload descending
}

function buildInventoryAlerts(parts: any[] = []): InventoryAlert[] {
  if (!Array.isArray(parts)) return [];

  return parts
    .filter((p) => p.stock <= p.min_stock && (p.stock !== undefined))
    .map((part) => {
      const severity =
        part.stock === 0
          ? "critical"
          : part.stock <= Math.ceil(part.min_stock * 0.3)
            ? "critical"
            : part.stock <= Math.ceil(part.min_stock * 0.6)
              ? "high"
              : "medium";

      return {
        id: part.id,
        name: part.name || "Unknown Part",
        stock: part.stock || 0,
        min: part.min_stock || 0,
        severity,
        monthly_usage: part.monthly_usage || 0,
      };
    })
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
}

function buildLiveEvents(auditLog: any[] = []): LiveEvent[] {
  if (!Array.isArray(auditLog)) return [];

  return auditLog
    .slice(0, 50) // Last 50 events
    .map((log) => {
      const eventType = log.type || log.action || "unknown";
      const config = EVENT_TYPE_CONFIG[eventType] || { label: eventType, color: "#6b7280" };

      return {
        id: log.id || `evt_${Math.random()}`,
        type: eventType,
        label: config.label,
        description: log.description || log.note || "",
        device_code: log.device_code || log.deviceCode,
        technician: log.technician || log.technician_name,
        amount: log.amount,
        ts: log.created_at || log.ts || new Date().toISOString(),
        color: config.color,
        path: `/devices?q=${log.device_code}`,
      };
    })
    .sort((a, b) => new Date(b.ts || "").getTime() - new Date(a.ts || "").getTime());
}

function calculateFinanceSummary(invoices: any[] = []): FinanceSummary {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayInvoices = (invoices || []).filter((inv) => {
    const invDate = new Date(inv.date || inv.created_at || "");
    invDate.setHours(0, 0, 0, 0);
    return invDate.getTime() === today.getTime();
  });

  const revenue = todayInvoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);
  const paid = todayInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);
  const due = revenue - paid;
  const dueCount = todayInvoices.filter((inv) => inv.status !== "paid").length;

  return {
    revenue_today: revenue,
    revenue_month: invoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0),
    collections_due: due,
    collections_due_count: dueCount,
    cash_balance: 0, // TODO: fetch from cashboxes
    expenses_today: 0, // TODO: fetch from expenses
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN HOOK
═══════════════════════════════════════════════════════════════════════ */

export function useCommandCenterData(options?: { branchId?: string; period?: string }): CommandCenterData {
  const [data, setData] = useState<CommandCenterData>({
    snapshot: null,
    events: [],
    financeSummary: null,
    inventoryAlerts: null,
    shipments: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const refresh = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch all data in parallel
      const [devices, technicians, branches, auditLog, invoices, products, shipments] = await Promise.all(
        [
          fetchJSON("/get_devices.php"),
          fetchJSON("/get_technicians.php"),
          fetchJSON("/get_branches.php"),
          fetchJSON("/get_audit_log.php?limit=100"),
          fetchJSON("/get_invoices.php"),
          fetchJSON("/get_products.php"),
          fetchJSON("/get_shipments.php"),
        ]
      );

      // Build pipeline stages
      const pipelineStages = buildPipelineStages(devices?.data || devices || []);

      // Calculate overview
      const deviceList = devices?.data || devices || [];
      const overview = {
        received_today: pipelineStages.find((s) => s.key === "reception")?.count || 0,
        with_technicians: pipelineStages.find((s) => s.key === "technician")?.count || 0,
        in_qc: pipelineStages.find((s) => s.key === "quality_control")?.count || 0,
        ready_for_delivery: pipelineStages.find((s) => s.key === "ready")?.count || 0,
        delivered_today: pipelineStages.find((s) => s.key === "delivered")?.count || 0,
        sla_violations: deviceList.filter((d) => {
          if (!d.receivedAt) return false;
          const age = new Date().getTime() - new Date(d.receivedAt).getTime();
          return age > 5 * 24 * 60 * 60 * 1000; // > 5 days
        }).length,
        no_updates: deviceList.filter((d) => !d.history || d.history.length === 0).length,
      };

      // Build technician loads
      const techLoads = buildTechnicianLoads(technicians?.data || technicians || [], deviceList);

      // Build inventory alerts
      const inventoryAlerts = buildInventoryAlerts(products?.data || products || []);

      // Build live events
      const events = buildLiveEvents(auditLog?.data || auditLog || []);

      // Build finance summary
      const financeSummary = calculateFinanceSummary(invoices?.data || invoices || []);

      // Build snapshot
      const snapshot: Snapshot = {
        overview,
        pipeline: { stages: pipelineStages },
        technicians: techLoads,
        branches: branches?.data || branches || [],
        online_users: Math.floor(Math.random() * 10) + 1, // TODO: connect to real session tracking
        alerts: [],
        delayed_devices: deviceList.filter(
          (d) =>
            d.receivedAt &&
            new Date().getTime() - new Date(d.receivedAt).getTime() > 3 * 24 * 60 * 60 * 1000
        ),
        critical_inventory: inventoryAlerts.filter((a) => a.severity === "critical"),
      };

      setData({
        snapshot,
        events,
        financeSummary,
        inventoryAlerts,
        shipments: shipments?.data || shipments || [],
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load data",
      }));
    }
  }, []);

  // Auto-refresh on mount and periodically
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refresh]);

  return data;
}
