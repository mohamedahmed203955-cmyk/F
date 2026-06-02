/**
 * OperationsRoom.tsx - Live Operations Command Center
 * 
 * SAP-style Dashboard:
 * ✅ Live KPI Cards (no refresh needed)
 * ✅ Real-time data updates every 5s
 * ✅ Clean grid layout (3-4 cards per row)
 * ✅ Charts that animate smoothly
 * ✅ No page refresh - smooth transitions
 * ✅ Arabic RTL layout
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useCommandCenterData } from "./hooks/useCommandCenterData";

import {
  Activity, AlertTriangle, TrendingUp, TrendingDown,
  DollarSign, Users, Package, Smartphone, Clock,
  Wifi, Settings, Bell, Eye, MoreVertical, ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────── */
const N = (n?: number | null) => (n == null ? "—" : n.toLocaleString("en-GB"));
const M = (n?: number | null) =>
  n == null ? "—" : n.toLocaleString("en-GB", { maximumFractionDigits: 0 }) + " ج.م";

/* ═══════════════════════════════════════════════════════════════════════
   KPI CARD COMPONENT
═══════════════════════════════════════════════════════════════════════ */

interface KPICardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  size?: "small" | "medium" | "large";
}

function KPICard({ title, value, subtext, trend, icon, color, onClick, size = "medium" }: KPICardProps) {
  const sizeClasses = {
    small: "p-4 min-h-[140px]",
    medium: "p-6 min-h-[160px]",
    large: "p-6 min-h-[180px]",
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        rounded-2xl border border-slate-200 bg-white hover:shadow-xl
        transition-all duration-300 hover:-translate-y-1 cursor-pointer
        text-right flex flex-col justify-between group
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-600 line-clamp-2">{title}</h3>
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{ background: color + "15" }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>

      {/* Value */}
      <div className="space-y-1">
        <div
          className="text-3xl font-black leading-none"
          style={{ color }}
        >
          {value}
        </div>
        {subtext && (
          <p className="text-xs text-slate-500">{subtext}</p>
        )}
      </div>

      {/* Trend */}
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2 text-xs font-bold">
          {trend > 0 ? (
            <>
              <TrendingUp className="h-3 w-3 text-red-500" />
              <span className="text-red-500">+{trend}%</span>
            </>
          ) : trend < 0 ? (
            <>
              <TrendingDown className="h-3 w-3 text-green-500" />
              <span className="text-green-500">{trend}%</span>
            </>
          ) : null}
        </div>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HEADER
═══════════════════════════════════════════════════════════════════════ */

function PageHeader() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white border-b border-slate-200 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">غرفة العمليات</h1>
          <p className="text-sm text-slate-500 mt-1">مراقبة فورية لخط الإصلاح والعمليات</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200">
            <Wifi className="h-4 w-4 text-green-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700">متصل • {timeStr}</span>
          </div>

          <button className="p-2 hover:bg-slate-100 rounded-lg transition">
            <Bell className="h-5 w-5 text-slate-600" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition">
            <Settings className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CHART COMPONENT
═══════════════════════════════════════════════════════════════════════ */

function BarChart({ stages }: { stages: any[] }) {
  const total = stages.reduce((sum, s) => sum + (s.count || 0), 0);
  const maxCount = Math.max(...stages.map((s) => s.count || 0), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6" dir="rtl">
      <h2 className="text-lg font-bold text-slate-900 mb-4">خط الإنتاج (Pipeline)</h2>

      <div className="flex items-end justify-around h-64 gap-2">
        {stages.map((stage: any) => {
          const barH = ((stage.count / maxCount) * 200) || 10;
          const pct = total > 0 ? ((stage.count / total) * 100).toFixed(0) : 0;

          return (
            <div key={stage.key} className="flex flex-col items-center gap-2">
              {/* Bar */}
              <div
                className="w-16 rounded-t-lg transition-all duration-500 group hover:shadow-lg hover:scale-105"
                style={{
                  height: `${barH}px`,
                  background: stage.color || "#3b82f6",
                  boxShadow: `0 0 15px ${stage.color}40`,
                }}
              />

              {/* Count & Label */}
              <div className="text-center">
                <div className="text-lg font-black" style={{ color: stage.color }}>
                  {N(stage.count)}
                </div>
                <div className="text-[11px] font-bold text-slate-500">{stage.label_ar}</div>
                <div className="text-[10px] text-slate-400">{pct}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TECHNICIAN TABLE
═══════════════════════════════════════════════════════════════════════ */

function TechnicianTable({ technicians }: { technicians: any[] }) {
  if (!technicians || technicians.length === 0) return null;

  const maxLoad = Math.max(...technicians.map((t) => t.active || 0), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 col-span-2" dir="rtl">
      <h2 className="text-lg font-bold text-slate-900 mb-4">أداء الفنيين</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" dir="rtl">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-right font-bold text-slate-600">#</th>
              <th className="px-4 py-3 text-right font-bold text-slate-600">الفني</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">أجهزة نشطة</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">منجزة</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">متأخرة</th>
              <th className="px-4 py-3 text-center font-bold text-slate-600">الحِمل</th>
            </tr>
          </thead>
          <tbody>
            {technicians.slice(0, 8).map((tech, idx) => {
              const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
              const loadPct = (tech.active / maxLoad) * 100;
              const loadColor = loadPct > 90 ? "#ef4444" : loadPct > 75 ? "#f97316" : "#3b82f6";

              return (
                <tr key={tech.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-center font-bold">{medal || `${idx + 1}`}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{tech.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-sm">
                      {N(tech.active)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-green-600 font-bold">
                    {tech.completed_today || 0}
                  </td>
                  <td className="px-4 py-3 text-center text-red-600 font-bold">
                    {tech.overdue || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${loadPct}%`, background: loadColor }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500 w-8 text-left">
                        {Math.round(loadPct)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ALERTS TABLE
═══════════════════════════════════════════════════════════════════════ */

function AlertsTable({ alerts }: { alerts: any[] }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 flex items-center justify-center">
        <p className="text-sm text-slate-500">✓ لا توجد تنبيهات</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6" dir="rtl">
      <h2 className="text-lg font-bold text-slate-900 mb-4">التنبيهات</h2>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.slice(0, 10).map((alert, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg border"
            style={{
              background: alert.color + "05",
              borderColor: alert.color + "30",
            }}
          >
            <div
              className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0"
              style={{ background: alert.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm">{alert.title}</p>
              <p className="text-xs text-slate-600 mt-0.5">{alert.description}</p>
            </div>
            <div className="text-lg font-black flex-shrink-0" style={{ color: alert.color }}>
              {N(alert.count)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════ */

export default function OperationsRoom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { snapshot, financeSummary, inventoryAlerts, loading } = useCommandCenterData();

  // Build alerts
  const alerts = [];
  if ((snapshot?.overview?.sla_violations || 0) > 0) {
    alerts.push({
      title: "أجهزة متأخرة SLA",
      description: "أجهزة تجاوزت مهلة الإصلاح",
      count: snapshot.overview.sla_violations,
      color: "#ef4444",
    });
  }
  if ((inventoryAlerts?.filter((a) => a.severity === "critical").length || 0) > 0) {
    alerts.push({
      title: "قطع غيار حرجة",
      description: "مخزون منخفض جداً",
      count: inventoryAlerts.filter((a) => a.severity === "critical").length,
      color: "#f97316",
    });
  }
  if ((financeSummary?.collections_due_count || 0) > 0) {
    alerts.push({
      title: "مستحقات تحصيل",
      description: "فواتير بانتظار السداد",
      count: financeSummary.collections_due_count,
      color: "#f59e0b",
    });
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <PageHeader />

        {/* Main Content */}
        <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
          {/* KPI Cards Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="أجهزة اليوم"
              value={N(snapshot?.overview?.received_today || 0)}
              icon={<Smartphone className="h-5 w-5" />}
              color="#3b82f6"
              onClick={() => navigate("/devices?status=received")}
            />
            <KPICard
              title="مع الفنيين"
              value={N(snapshot?.overview?.with_technicians || 0)}
              icon={<Users className="h-5 w-5" />}
              color="#8b5cf6"
              onClick={() => navigate("/devices?status=accepted_by_technician")}
            />
            <KPICard
              title="تحت الجودة"
              value={N(snapshot?.overview?.in_qc || 0)}
              icon={<Eye className="h-5 w-5" />}
              color="#06b6d4"
              onClick={() => navigate("/devices?status=ready_for_testing")}
            />
            <KPICard
              title="جاهز للتسليم"
              value={N(snapshot?.overview?.ready_for_delivery || 0)}
              icon={<Smartphone className="h-5 w-5" />}
              color="#10b981"
              onClick={() => navigate("/devices?status=ready")}
            />
          </div>

          {/* KPI Cards Row 2 - Finance */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="تحصيل اليوم"
              value={M(financeSummary?.revenue_today || 0)}
              icon={<DollarSign className="h-5 w-5" />}
              color="#10b981"
              onClick={() => navigate("/collections")}
              trend={5}
            />
            <KPICard
              title="مستحقات"
              value={M(financeSummary?.collections_due || 0)}
              icon={<AlertTriangle className="h-5 w-5" />}
              color="#ef4444"
              onClick={() => navigate("/collections")}
              trend={-3}
            />
            <KPICard
              title="رصيد الخزنة"
              value={M(financeSummary?.cash_balance || 0)}
              icon={<DollarSign className="h-5 w-5" />}
              color="#f59e0b"
            />
            <KPICard
              title="متأخرات"
              value={N(snapshot?.overview?.sla_violations || 0)}
              icon={<Clock className="h-5 w-5" />}
              color="#ef4444"
              onClick={() => navigate("/devices?status=overdue")}
            />
          </div>

          {/* KPI Cards Row 3 - Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="قطع حرجة"
              value={N(inventoryAlerts?.filter((a) => a.severity === "critical").length || 0)}
              icon={<Package className="h-5 w-5" />}
              color="#ef4444"
              onClick={() => navigate("/inventory")}
            />
            <KPICard
              title="قطع منخفضة"
              value={N(inventoryAlerts?.filter((a) => a.severity === "high").length || 0)}
              icon={<Package className="h-5 w-5" />}
              color="#f97316"
              onClick={() => navigate("/inventory")}
            />
            <KPICard
              title="مُسلّم"
              value={N(snapshot?.overview?.delivered_today || 0)}
              icon={<Activity className="h-5 w-5" />}
              color="#3b82f6"
            />
            <KPICard
              title="مستخدمين نشطين"
              value={N(snapshot?.online_users || 0)}
              icon={<Users className="h-5 w-5" />}
              color="#6366f1"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <BarChart stages={snapshot?.pipeline?.stages || []} />
            </div>
            <div>
              <AlertsTable alerts={alerts} />
            </div>
          </div>

          {/* Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TechnicianTable technicians={snapshot?.technicians || []} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
