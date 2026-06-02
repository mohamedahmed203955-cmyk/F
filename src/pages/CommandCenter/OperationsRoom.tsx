/**
 * OperationsRoom.tsx — Real-Time Command Center for 17-19" Screens
 * 
 * غرفة العمليات الحقيقية - محسّنة للشاشات العريضة
 * 
 * ✅ Live Kanban Pipeline (7 مراحل)
 * ✅ Real-time Alerts Banner
 * ✅ Shipment Tracker
 * ✅ Technician Load Monitor
 * ✅ Finance Cockpit
 * ✅ Inventory Risk Radar
 * ✅ Zero Mock Data
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import {
  useCommandCenterData,
  type PipelineStage,
  type TechnicianLoad,
  type InventoryAlert,
  type LiveEvent,
  type FinanceSummary,
} from "./hooks/useCommandCenterData";

import {
  Activity, AlertTriangle, CheckCircle, RefreshCw, Wifi, WifiOff,
  Clock, Smartphone, Wrench, Package, Truck, DollarSign, Users,
  TrendingUp, TrendingDown, ChevronRight, Zap, Building2, Eye,
  Plus, Settings, Star, Flame, ChevronDown, Calendar,
  Bell, AlertCircle, CheckCircle2, Send, ArrowRight, MapPin, Timer,
  Radio, MessageSquare, Droplets, Gauge, LogOut, LogIn, Box, BarChart3,
  MoreVertical, Search, Filter, Download, Share2, Lightbulb,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────── */
/* FORMATTING HELPERS */
/* ─────────────────────────────────────────────────────────────────── */

const N = (n?: number | null) => (n == null ? "—" : n.toLocaleString("en-GB"));
const M = (n?: number | null) =>
  n == null ? "—" : n.toLocaleString("en-GB", { maximumFractionDigits: 0 }) + " ج.م";

function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return `${d}s`;
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   HERO HEADER - الرأس الرئيسي
═══════════════════════════════════════════════════════════════════════ */

function HeroHeader({ loading, error, lastUpdated, onRefresh }: any) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border-b border-slate-700/50 sticky top-0 z-40" dir="rtl">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="h-6 w-6 text-blue-400 animate-pulse" />
            <div className="absolute inset-0 animate-ping opacity-75">
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">غرفة العمليات</h1>
            <p className="text-xs text-slate-400">مراقبة فورية لخط الإصلاح</p>
          </div>
        </div>

        {/* Status + Time */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-100">{timeStr}</div>
            <div className="text-xs text-slate-400">{dateStr}</div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/30 border border-slate-600/50">
            {error ? (
              <>
                <WifiOff className="h-4 w-4 text-red-400" />
                <span className="text-xs font-bold text-red-400">قطع الاتصال</span>
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 text-green-400 animate-pulse" />
                <span className="text-xs font-bold text-green-400">متصل</span>
              </>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 text-slate-300 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Last Update */}
          {lastUpdated && (
            <div className="text-xs text-slate-400 ml-2">
              آخر تحديث: {timeAgo(lastUpdated.toISOString())}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CRITICAL ALERTS BANNER - تنبيهات حرجة
═══════════════════════════════════════════════════════════════════════ */

interface CriticalAlert {
  type: string;
  count: number;
  label: string;
  color: string;
  icon: React.ElementType;
}

function CriticalAlertsBanner({ alerts }: { alerts: CriticalAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-950/40 to-orange-950/40 border-b border-red-700/30 px-6 py-3">
      <div className="flex items-center gap-3">
        <Flame className="h-5 w-5 text-red-500 flex-shrink-0 animate-pulse" />
        <span className="text-sm font-black text-red-600">⚠️ تنبيهات حرجة:</span>
        <div className="flex gap-2 flex-wrap">
          {alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <button
                key={alert.type}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white hover:shadow-lg transition"
                style={{ background: alert.color }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{N(alert.count)}</span>
                <span>{alert.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN KANBAN PIPELINE - خط الإنتاج الرئيسي
═══════════════════════════════════════════════════════════════════════ */

function KanbanPipeline({ stages, loading }: { stages: PipelineStage[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-slate-500 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-slate-400">جاري التحديث...</p>
        </div>
      </div>
    );
  }

  const total = stages.reduce((sum, s) => sum + s.count, 0) || 1;
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
      <div className="bg-slate-700/30 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-black text-white">خط الإنتاج</h2>
        </div>
        <span className="text-xs text-slate-400 font-bold">
          إجمالي: {N(total)} جهاز
        </span>
      </div>

      <div className="p-6 flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const pct = (stage.count / total) * 100;
          const barHeight = Math.max((stage.count / maxCount) * 200, 30);

          return (
            <div key={stage.key} className="flex flex-col items-center gap-3 flex-shrink-0">
              {/* Count */}
              <div className="text-2xl font-black text-white">{N(stage.count)}</div>

              {/* Bar */}
              <div
                className="w-20 rounded-t-lg transition-all duration-500 hover:shadow-2xl"
                style={{
                  height: `${barHeight}px`,
                  background: stage.color || "#3b82f6",
                  opacity: 0.8 + (pct / 100) * 0.2,
                  boxShadow: `0 0 16px ${stage.color || "#3b82f6"}40`,
                }}
              />

              {/* Label */}
              <div className="text-center">
                <p className="text-xs font-bold text-slate-200">{stage.label_ar}</p>
                <p className="text-[10px] text-slate-500">{pct.toFixed(0)}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TECHNICIAN LOAD MONITOR - مراقبة الفنيين
═══════════════════════════════════════════════════════════════════════ */

function TechnicianMonitor({ technicians }: { technicians: TechnicianLoad[] }) {
  if (!technicians || technicians.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 flex items-center justify-center min-h-[250px]">
        <p className="text-sm text-slate-400">لا توجد بيانات فنيين</p>
      </div>
    );
  }

  const maxLoad = Math.max(...technicians.map((t) => t.active), 1);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
      <div className="bg-slate-700/30 border-b border-slate-700 px-6 py-3 flex items-center gap-2">
        <Users className="h-5 w-5 text-purple-400" />
        <h2 className="text-lg font-black text-white">حِمل الفنيين</h2>
      </div>

      <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
        {technicians.slice(0, 12).map((tech, idx) => {
          const loadPct = (tech.active / maxLoad) * 100;
          const isOverloaded = loadPct > 75;
          const isFull = loadPct > 90;
          const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;

          return (
            <div key={tech.id} className="space-y-1.5">
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-bold">{medal || `${idx + 1}.`}</span>
                  <span className="text-sm font-bold text-white">{tech.name}</span>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-xs font-black text-white"
                  style={{
                    background: isFull ? "#ef4444" : isOverloaded ? "#f97316" : "#3b82f6",
                  }}
                >
                  {tech.active}
                </span>
              </div>

              {/* Load Bar */}
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(loadPct, 100)}%`,
                    background: isFull ? "#ef4444" : isOverloaded ? "#f97316" : "#3b82f6",
                  }}
                />
              </div>

              {/* Stats */}
              <div className="flex gap-2 text-[10px] text-slate-400">
                <span>✓ {tech.completed_today || 0}</span>
                {tech.overdue > 0 && <span className="text-red-500">⚠️ {tech.overdue} متأخر</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FINANCE COCKPIT - لوحة المالية
═══════════════════════════════════════════════════════════════════════ */

function FinanceCockpit({ finance }: { finance: FinanceSummary | null }) {
  if (!finance) return null;

  const metrics = [
    {
      label: "تحصيل اليوم",
      value: finance.revenue_today,
      color: "#10b981",
      icon: TrendingUp,
    },
    {
      label: "مستحقات",
      value: finance.collections_due,
      color: "#ef4444",
      icon: AlertTriangle,
      urgent: finance.collections_due > 0,
    },
    {
      label: "المصروفات",
      value: finance.expenses_today || 0,
      color: "#f97316",
      icon: TrendingDown,
    },
    {
      label: "الربح الصافي",
      value: (finance.revenue_today || 0) - (finance.expenses_today || 0),
      color: "#3b82f6",
      icon: BarChart3,
    },
  ];

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
      <div className="bg-slate-700/30 border-b border-slate-700 px-6 py-3 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-green-400" />
        <h2 className="text-lg font-black text-white">المالية</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 p-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="p-3 rounded-lg border border-slate-600/30"
              style={{
                background: m.urgent ? `${m.color}15` : "rgba(0,0,0,0.2)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <Icon className="h-4 w-4 flex-shrink-0" style={{ color: m.color }} />
                <div className="text-right flex-1">
                  <p className="text-xs text-slate-400">{m.label}</p>
                  <p className="text-lg font-black" style={{ color: m.color }}>
                    {M(m.value)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SHIPMENT TRACKER - متتبع الشحنات
═══════════════════════════════════════════════════════════════════════ */

function ShipmentTracker({ shipments }: { shipments: any[] }) {
  if (!shipments || shipments.length === 0) return null;

  const statusColors: Record<string, string> = {
    pending: "#f59e0b",
    in_transit: "#3b82f6",
    delayed: "#ef4444",
    delivered: "#10b981",
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
      <div className="bg-slate-700/30 border-b border-slate-700 px-6 py-3 flex items-center gap-2">
        <Truck className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-black text-white">الشحنات</h2>
      </div>

      <div className="p-6 space-y-2 max-h-[300px] overflow-y-auto">
        {shipments.slice(0, 8).map((ship) => {
          const status = ship.status || "pending";
          const color = statusColors[status] || "#6b7280";

          return (
            <div key={ship.id} className="p-3 rounded-lg border border-slate-600/30 bg-slate-700/20">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-white">{ship.reference}</span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                  style={{ background: color }}
                >
                  {
                    {
                      pending: "قيد الانتظار",
                      in_transit: "قيد التوصيل",
                      delayed: "متأخرة",
                      delivered: "مُسلّمة",
                    }[status] || status
                  }
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                <MapPin className="h-3 w-3 inline mr-1" />
                {ship.destination}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   INVENTORY ALERTS - تنبيهات المخزون
═══════════════════════════════════════════════════════════════════════ */

function InventoryAlerts({ alerts }: { alerts: InventoryAlert[] | null }) {
  if (!alerts || alerts.length === 0)
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 flex items-center justify-center min-h-[250px]">
        <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
        <p className="text-sm text-slate-300">المخزون كافٍ ✓</p>
      </div>
    );

  const critical = alerts.filter((a) => a.severity === "critical").length;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
      <div className="bg-slate-700/30 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-400" />
          <h2 className="text-lg font-black text-white">المخزون</h2>
        </div>
        {critical > 0 && (
          <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
            {critical} حرج
          </span>
        )}
      </div>

      <div className="p-6 space-y-2 max-h-[300px] overflow-y-auto">
        {alerts.slice(0, 10).map((alert) => {
          const pct = alert.min > 0 ? (alert.stock / alert.min) * 100 : 0;
          const color =
            alert.stock === 0
              ? "#ef4444"
              : alert.severity === "critical"
                ? "#ef4444"
                : "#f97316";

          return (
            <div key={alert.id} className="p-2 rounded-lg border border-slate-600/30">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-slate-200">{alert.name}</span>
                <span className="text-xs font-bold text-slate-400">
                  {N(alert.stock)} / {N(alert.min)}
                </span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(pct, 100)}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   LIVE FEED - بث مباشر
═══════════════════════════════════════════════════════════════════════ */

function LiveFeed({ events }: { events: LiveEvent[] }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
      <div className="bg-slate-700/30 border-b border-slate-700 px-6 py-3 flex items-center gap-2">
        <Radio className="h-5 w-5 text-green-400 animate-pulse" />
        <h2 className="text-lg font-black text-white">البث المباشر</h2>
      </div>

      <div className="p-6 space-y-2 max-h-[300px] overflow-y-auto">
        {events.slice(0, 15).map((evt) => (
          <div key={evt.id} className="p-2 rounded text-xs border-l-2" style={{ borderColor: evt.color }}>
            <div className="font-bold text-slate-100">{evt.label}</div>
            <div className="text-slate-400">{evt.description}</div>
            <div className="text-[10px] text-slate-500 mt-1">{fmtDate(evt.ts)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT - غرفة العمليات الرئيسية
═══════════════════════════════════════════════════════════════════════ */

export default function OperationsRoom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { snapshot, events, financeSummary, inventoryAlerts, shipments, loading, error, lastUpdated, refresh } =
    useCommandCenterData();

  // Build critical alerts
  const criticalAlerts: CriticalAlert[] = [];

  if (snapshot?.overview) {
    if ((snapshot.overview.sla_violations ?? 0) > 0) {
      criticalAlerts.push({
        type: "sla_violations",
        count: snapshot.overview.sla_violations,
        label: "متأخرة عن الموعد",
        color: "#ef4444",
        icon: AlertTriangle,
      });
    }

    if ((snapshot.overview.no_updates ?? 0) > 0) {
      criticalAlerts.push({
        type: "no_updates",
        count: snapshot.overview.no_updates,
        label: "بدون تحديثات",
        color: "#f97316",
        icon: Eye,
      });
    }
  }

  const criticalInv = inventoryAlerts?.filter((a) => a.severity === "critical").length ?? 0;
  if (criticalInv > 0) {
    criticalAlerts.push({
      type: "inventory_critical",
      count: criticalInv,
      label: "قطع حرجة",
      color: "#f59e0b",
      icon: Package,
    });
  }

  if ((financeSummary?.collections_due_count ?? 0) > 0) {
    criticalAlerts.push({
      type: "collections_due",
      count: financeSummary?.collections_due_count ?? 0,
      label: "مستحقات معلقة",
      color: "#f97316",
      icon: DollarSign,
    });
  }

  const delayedShipments = shipments?.filter((s) => s.status === "delayed").length ?? 0;
  if (delayedShipments > 0) {
    criticalAlerts.push({
      type: "delayed_shipments",
      count: delayedShipments,
      label: "شحنات متأخرة",
      color: "#ef4444",
      icon: Truck,
    });
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        {/* Header */}
        <HeroHeader loading={loading} error={error} lastUpdated={lastUpdated} onRefresh={refresh} />

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && <CriticalAlertsBanner alerts={criticalAlerts} />}

        {/* Main Content - 3 Row Layout */}
        <div className="p-6 space-y-6" dir="rtl">
          {/* ROW 1: Main Pipeline (2/3 width) + Finance (1/3) */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8">
              <KanbanPipeline stages={snapshot?.pipeline?.stages ?? []} loading={loading} />
            </div>
            <div className="col-span-4">
              <FinanceCockpit finance={financeSummary} />
            </div>
          </div>

          {/* ROW 2: Technicians (1/3) + Shipments (1/3) + Inventory (1/3) */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-4">
              <TechnicianMonitor technicians={snapshot?.technicians ?? []} />
            </div>
            <div className="col-span-4">
              <ShipmentTracker shipments={shipments ?? []} />
            </div>
            <div className="col-span-4">
              <InventoryAlerts alerts={inventoryAlerts} />
            </div>
          </div>

          {/* ROW 3: Live Feed (Full Width) */}
          <div className="grid grid-cols-1">
            <LiveFeed events={events ?? []} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
