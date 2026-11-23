import React from 'react';
import {
  Users,
  UserPlus,
  Calendar,
  ScanFace,
  History,
  Sparkles,
  Scissors,
  Receipt,
  MessageSquare,
  BarChart3,
  Clock,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import type {
  Appointment,
  Customer,
  Invoice,
  NavTab,
  ParlourTenant,
  SkinScanRecord,
  StaffProfile,
} from '../types/beauty';
import {
  computeDashboardMetrics,
  computeStaffLeaderboard,
  formatCurrency,
} from '../utils/analytics';
import { MONTHLY_PERFORMANCE_SERIES } from '../data/seedData';
import { HorizontalBarBreakdown, RevenueAppointmentsChart } from './Charts';

interface DashboardViewProps {
  parlour: ParlourTenant;
  customers: Customer[];
  appointments: Appointment[];
  invoices: Invoice[];
  staff: StaffProfile[];
  skinScans: SkinScanRecord[];
  onNavigate: (tab: NavTab) => void;
  onOpenNewAppointment: () => void;
  onOpenNewCustomer: () => void;
}

function LotusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <path
        d="M18 6C15.5 11.2 14 15.8 14 20.2C14 23.8 15.8 26.5 18 28C20.2 26.5 22 23.8 22 20.2C22 15.8 20.5 11.2 18 6Z"
        fill="currentColor"
      />
      <path
        d="M11.6 13.5C9.2 15.2 7.2 18.4 7.5 22.1C7.8 25.4 10.6 27.6 14.5 28C12.8 24.4 12.1 19.6 11.6 13.5Z"
        fill="currentColor"
        fillOpacity="0.88"
      />
      <path
        d="M24.4 13.5C26.8 15.2 28.8 18.4 28.5 22.1C28.2 25.4 25.4 27.6 21.5 28C23.2 24.4 23.9 19.6 24.4 13.5Z"
        fill="currentColor"
        fillOpacity="0.88"
      />
    </svg>
  );
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  parlour,
  customers,
  appointments,
  invoices,
  staff,
  skinScans,
  onNavigate,
  onOpenNewAppointment,
  onOpenNewCustomer,
}) => {
  const today = '2026-11-22';
  const monthPrefix = '2026-11';
  const metrics = computeDashboardMetrics(customers, appointments, invoices, today, monthPrefix);
  const leaderboard = computeStaffLeaderboard(staff, appointments);
  const todaysList = appointments.filter((a) => a.date === today);
  const unpaidCount = invoices.filter((i) => i.paymentStatus !== 'Paid').length;

  const kpis = [
    {
      label: 'Active Customers',
      value: String(metrics.totalCustomers),
      subtext: `↑ +${metrics.newCustomersThisMonth} this month`,
      subTone: 'text-emerald-600 font-medium',
      tileBg: 'bg-[#5B4CE6]',
      icon: Users,
      onClick: () => onNavigate('customers'),
    },
    {
      label: "Today's Bookings",
      value: String(metrics.todaysAppointments),
      subtext: `${todaysList.filter((a) => a.status === 'Confirmed').length} confirmed · ${todaysList.filter((a) => a.status === 'Pending').length} pending`,
      subTone: 'text-[#6B7280]',
      tileBg: 'bg-[#F59E0B]',
      icon: Calendar,
      onClick: () => onNavigate('appointments'),
    },
    {
      label: 'Skin Observations',
      value: String(skinScans.length),
      subtext: `${metrics.retentionRate}% retention rate`,
      subTone: 'text-[#6B7280]',
      tileBg: 'bg-[#EF4444]',
      icon: ScanFace,
      onClick: () => onNavigate('skin_progress'),
    },
    {
      label: 'Paid Revenue',
      value: formatCurrency(metrics.monthlyRevenue, parlour.currency),
      subtext: `Target ${formatCurrency(parlour.monthlyRevenueTarget, parlour.currency)}`,
      subTone: 'text-[#6B7280]',
      tileBg: 'bg-[#10B981]',
      icon: Wallet,
      onClick: () => onNavigate('billing'),
    },
    {
      label: 'Pending Invoices',
      value: formatCurrency(metrics.pendingPayments, parlour.currency),
      subtext: `${unpaidCount} awaiting collection`,
      subTone: metrics.pendingPayments > 0 ? 'text-rose-600 font-medium' : 'text-[#6B7280]',
      tileBg: 'bg-[#F97316]',
      icon: AlertTriangle,
      onClick: () => onNavigate('billing'),
    },
  ];

  const shortcuts = [
    {
      title: 'Customers',
      subtitle: 'Manage client profiles',
      tileBg: 'bg-[#5B4CE6]',
      icon: Users,
      action: () => onNavigate('customers'),
    },
    {
      title: 'New Customer',
      subtitle: 'Add client profile',
      tileBg: 'bg-[#8B5CF6]',
      icon: UserPlus,
      action: onOpenNewCustomer,
    },
    {
      title: 'Appointments',
      subtitle: 'Studio calendar view',
      tileBg: 'bg-[#2563EB]',
      icon: Clock,
      action: onOpenNewAppointment,
    },
    {
      title: 'AI Face Scanner',
      subtitle: 'Cosmetic skin scan',
      tileBg: 'bg-[#EC4899]',
      icon: ScanFace,
      action: () => onNavigate('skin_scanner'),
    },
    {
      title: 'Skin Progress',
      subtitle: 'Before & after timeline',
      tileBg: 'bg-[#0D9488]',
      icon: History,
      action: () => onNavigate('skin_progress'),
    },
    {
      title: 'Beauty Assistant',
      subtitle: 'AI care suggestions',
      tileBg: 'bg-[#3B82F6]',
      icon: Sparkles,
      action: () => onNavigate('ai_assistant'),
    },
    {
      title: 'Services',
      subtitle: 'Catalog & packages',
      tileBg: 'bg-[#F59E0B]',
      icon: Scissors,
      action: () => onNavigate('services'),
    },
    {
      title: 'Billing & POS',
      subtitle: 'Invoices & payments',
      tileBg: 'bg-[#10B981]',
      icon: Receipt,
      action: () => onNavigate('billing'),
    },
    {
      title: 'WhatsApp Care',
      subtitle: 'Reminders & feedback',
      tileBg: 'bg-[#F97316]',
      icon: MessageSquare,
      action: () => onNavigate('communication'),
    },
    {
      title: 'Reports',
      subtitle: 'Retention & growth',
      tileBg: 'bg-[#EF4444]',
      icon: BarChart3,
      action: () => onNavigate('reports'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Vibrant Gradient Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#D91A6B] via-[#EC2F81] to-[#F25596] px-6 py-6 sm:px-8 sm:py-7 text-white shadow-[0_12px_30px_rgba(217,26,107,0.22)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium text-white/80">
              {parlour.city} · {parlour.plan} Plan
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
              Welcome back, {parlour.name}
            </h1>
            <p className="text-sm text-white/90 max-w-2xl">
              Manage appointments, cosmetic skin scans, billing, and client retention from one
              studio command center.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('skin_scanner')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#D91A6B] text-xs font-semibold shadow-sm hover:bg-white/95 transition-colors whitespace-nowrap"
            >
              <ScanFace className="w-4 h-4" />
              Launch Skin Scan
            </button>
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm items-center justify-center shrink-0">
              <LotusMark className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* 5-Column KPI Stat Cards Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={kpi.onClick}
              className="text-left bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_18px_rgba(15,23,42,0.035)] hover:border-[#D91A6B]/35 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div
                className={`w-11 h-11 rounded-xl ${kpi.tileBg} text-white flex items-center justify-center shadow-sm`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="mt-4">
                <p className="font-display text-2xl sm:text-3xl font-bold text-[#111827] tabular-nums">
                  {kpi.value}
                </p>
                <p className="text-xs font-medium text-[#4B5563] mt-1">{kpi.label}</p>
                <p className={`text-xs tabular-nums mt-1.5 ${kpi.subTone}`}>{kpi.subtext}</p>
              </div>
            </button>
          );
        })}
      </section>

      {/* Quick Shortcuts 2x5 Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#111827]">Quick Shortcuts</h2>
          <span className="text-xs text-[#6B7280]">
            {metrics.newCustomersThisMonth} new · {metrics.returningCustomers} returning ·{' '}
            {metrics.popularTreatments[0]?.name ?? 'Studio Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={item.action}
                className="group bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.025)] hover:border-[#D91A6B]/40 hover:shadow-md transition-all flex items-center gap-3 text-left"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${item.tileBg} text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{item.title}</p>
                  <p className="text-xs text-[#6B7280] truncate">{item.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Revenue & Appointments Chart + Popular Treatments */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-[#111827]">
                Revenue &amp; Visit Volume
              </h2>
              <p className="text-xs text-[#6B7280]">
                Monthly collected revenue alongside completed salon bookings
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D91A6B] hover:underline whitespace-nowrap shrink-0"
            >
              Full Analytics
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <RevenueAppointmentsChart
            data={MONTHLY_PERFORMANCE_SERIES}
            currency={parlour.currency}
          />
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-[#111827]">Popular Treatments</h2>
              <p className="text-xs text-[#6B7280]">Ranked by booking value and frequency</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D91A6B] hover:underline whitespace-nowrap shrink-0"
            >
              Service Catalog
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <HorizontalBarBreakdown
            currency={parlour.currency}
            items={metrics.popularTreatments.map((t) => ({
              label: t.name,
              value: t.revenue,
              sublabel: `${t.count} ${t.count === 1 ? 'booking' : 'bookings'}`,
            }))}
          />
        </div>
      </section>

      {/* Today's Schedule & Recent Customer Activity + Specialist Performance */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-[#111827]">
              Today&apos;s Appointments &amp; Activity
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('appointments')}
              className="text-xs font-semibold text-[#D91A6B] hover:underline whitespace-nowrap shrink-0"
            >
              Open Calendar
            </button>
          </div>
          {todaysList.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">
              No appointments scheduled for today.
            </p>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {todaysList.map((appt) => (
                <div
                  key={appt.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111827] truncate">
                      {appt.customerName}
                    </p>
                    <p className="text-xs text-[#6B7280] truncate">
                      {appt.serviceName} · Specialist: {appt.staffName}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs tabular-nums shrink-0">
                    <span className="font-mono text-[#111827] font-medium">{appt.time}</span>
                    <span className="font-mono text-[#6B7280]">
                      {formatCurrency(appt.price, parlour.currency)}
                    </span>
                    <span
                      className={`font-semibold ${
                        appt.status === 'Confirmed'
                          ? 'text-emerald-600'
                          : appt.status === 'Completed'
                          ? 'text-[#5B4CE6]'
                          : appt.status === 'Cancelled'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-[#111827]">
              Specialist Performance
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('staff')}
              className="text-xs font-semibold text-[#D91A6B] hover:underline whitespace-nowrap shrink-0"
            >
              Manage Staff
            </button>
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {leaderboard.map((member) => (
              <div key={member.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{member.name}</p>
                  <p className="text-xs text-[#6B7280] truncate">
                    {member.role} · {member.attendanceStatus}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono font-semibold text-[#111827] tabular-nums">
                    {formatCurrency(member.revenueGenerated, parlour.currency)}
                  </p>
                  <p className="text-xs text-[#6B7280] tabular-nums">
                    {member.completedCount} services · {member.rating.toFixed(1)} ★
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
