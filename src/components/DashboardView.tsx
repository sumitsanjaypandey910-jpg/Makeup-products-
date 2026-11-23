import React from 'react';
import { Calendar, ArrowUpRight, Sparkles, UserPlus } from 'lucide-react';
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
import { MONTHLY_PERFORMANCE_SERIES, GENERATED_ASSETS } from '../data/seedData';
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

  const kpis = [
    {
      label: 'Total Customers',
      value: String(metrics.totalCustomers),
      detail: `${metrics.returningCustomers} returning · ${metrics.newCustomersThisMonth} new this month`,
    },
    {
      label: "Today's Appointments",
      value: String(metrics.todaysAppointments),
      detail: `${todaysList.filter((a) => a.status === 'Confirmed').length} confirmed · ${todaysList.filter((a) => a.status === 'Pending').length} pending`,
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(metrics.monthlyRevenue, parlour.currency),
      detail: `Target ${formatCurrency(parlour.monthlyRevenueTarget, parlour.currency)}`,
    },
    {
      label: 'Pending Payments',
      value: formatCurrency(metrics.pendingPayments, parlour.currency),
      detail: `${metrics.retentionRate}% retention rate`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Editorial Studio Welcome Strip */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white border border-[#E8E0D8] rounded-2xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <p className="text-xs text-[#6E645D] mb-2">
              {parlour.city} · {parlour.plan} Plan
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1E1916] tracking-tight leading-tight text-balance">
              {parlour.name} Overview
            </h1>
            <p className="text-sm text-[#6E645D] mt-2 max-w-2xl leading-relaxed">
              Manage appointments, client skincare journeys, cosmetic facial scans, and studio
              revenue in one calm workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              type="button"
              onClick={onOpenNewAppointment}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B85C6F] text-white text-sm font-medium hover:bg-[#A34D5F] transition-colors whitespace-nowrap shrink-0"
            >
              <Calendar className="w-4 h-4" />
              Book Appointment
            </button>
            <button
              type="button"
              onClick={() => onNavigate('skin_scanner')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F4EFEA] text-[#1E1916] text-sm font-medium hover:bg-[#EAE1D8] transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4 text-[#B08B4F]" />
              Launch AI Skin Scan
            </button>
            <button
              type="button"
              onClick={onOpenNewCustomer}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E8E0D8] text-[#1E1916] text-sm font-medium hover:bg-[#FAF8F6] transition-colors whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-4 h-4 text-[#6E645D]" />
              Add Customer
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 relative rounded-2xl overflow-hidden border border-[#E8E0D8] min-h-[210px] bg-[#F4EFEA]">
          <img
            src={GENERATED_ASSETS.salonSuite}
            alt="Atelier treatment suite interior"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover lg:absolute lg:inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent flex flex-col justify-end p-5 text-white">
            <p className="text-xs text-white/80">Latest Skin Scans · {skinScans.length} saved</p>
            <p className="font-display text-xl font-medium mt-0.5">
              Cosmetic Skin Intelligence
            </p>
            <button
              type="button"
              onClick={() => onNavigate('skin_progress')}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-white underline underline-offset-4 hover:text-[#F7E6CA] w-fit whitespace-nowrap"
            >
              View Progress Timeline
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4-Column KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-[#E8E0D8] rounded-2xl p-5 flex flex-col justify-between"
          >
            <span className="text-xs font-medium text-[#6E645D]">{kpi.label}</span>
            <p className="font-display text-3xl font-semibold text-[#1E1916] tabular-nums mt-2">
              {kpi.value}
            </p>
            <p className="text-xs text-[#6E645D] tabular-nums mt-2">{kpi.detail}</p>
          </div>
        ))}
      </section>

      {/* Secondary KPI Summary Bar (New / Returning / Retention / Popular) */}
      <section className="bg-white border border-[#E8E0D8] rounded-2xl px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#EAE3DC]">
        <div className="pt-1 md:pt-0">
          <p className="text-xs text-[#6E645D]">New Customers (Month)</p>
          <p className="text-lg font-semibold text-[#1E1916] font-mono tabular-nums mt-0.5">
            {metrics.newCustomersThisMonth}
          </p>
        </div>
        <div className="pt-3 md:pt-0 md:pl-5">
          <p className="text-xs text-[#6E645D]">Returning Customers</p>
          <p className="text-lg font-semibold text-[#1E1916] font-mono tabular-nums mt-0.5">
            {metrics.returningCustomers}
          </p>
        </div>
        <div className="pt-3 md:pt-0 md:pl-5">
          <p className="text-xs text-[#6E645D]">Customer Retention Rate</p>
          <p className="text-lg font-semibold text-[#1E1916] font-mono tabular-nums mt-0.5">
            {metrics.retentionRate}%
          </p>
        </div>
        <div className="pt-3 md:pt-0 md:pl-5">
          <p className="text-xs text-[#6E645D]">Top Popular Treatment</p>
          <p className="text-sm font-semibold text-[#1E1916] truncate mt-1">
            {metrics.popularTreatments[0]?.name ?? 'No treatments yet'}
          </p>
        </div>
      </section>

      {/* Revenue & Appointments Chart + Popular Treatments */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E8E0D8] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#1E1916]">
                Revenue &amp; Visit Volume
              </h2>
              <p className="text-xs text-[#6E645D]">
                Monthly collected revenue alongside completed salon bookings
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="text-xs font-medium text-[#B85C6F] hover:underline whitespace-nowrap shrink-0"
            >
              Full Analytics
            </button>
          </div>
          <RevenueAppointmentsChart
            data={MONTHLY_PERFORMANCE_SERIES}
            currency={parlour.currency}
          />
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E8E0D8] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#1E1916]">
                Popular Treatments
              </h2>
              <p className="text-xs text-[#6E645D]">Ranked by booking value and frequency</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="text-xs font-medium text-[#B85C6F] hover:underline whitespace-nowrap shrink-0"
            >
              Service Catalog
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

      {/* Today's Schedule & Recent Customer Activity + Staff Performance */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E8E0D8] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-semibold text-[#1E1916]">
              Today&apos;s Appointments &amp; Activity
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('appointments')}
              className="text-xs font-medium text-[#B85C6F] hover:underline whitespace-nowrap shrink-0"
            >
              Open Calendar
            </button>
          </div>
          {todaysList.length === 0 ? (
            <p className="text-sm text-[#6E645D] py-8 text-center">
              No appointments scheduled for today.
            </p>
          ) : (
            <div className="divide-y divide-[#EAE3DC]">
              {todaysList.map((appt) => (
                <div
                  key={appt.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1E1916] truncate">
                      {appt.customerName}
                    </p>
                    <p className="text-xs text-[#6E645D] truncate">
                      {appt.serviceName} · Specialist: {appt.staffName}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs tabular-nums shrink-0">
                    <span className="font-mono text-[#1E1916]">{appt.time}</span>
                    <span className="font-mono text-[#6E645D]">
                      {formatCurrency(appt.price, parlour.currency)}
                    </span>
                    <span
                      className={`font-medium ${
                        appt.status === 'Confirmed'
                          ? 'text-emerald-700'
                          : appt.status === 'Completed'
                          ? 'text-[#1E1916]'
                          : appt.status === 'Cancelled'
                          ? 'text-rose-700'
                          : 'text-amber-700'
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

        <div className="lg:col-span-5 bg-white border border-[#E8E0D8] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-semibold text-[#1E1916]">
              Specialist Performance
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('staff')}
              className="text-xs font-medium text-[#B85C6F] hover:underline whitespace-nowrap shrink-0"
            >
              Manage Staff
            </button>
          </div>
          <div className="divide-y divide-[#EAE3DC]">
            {leaderboard.map((member) => (
              <div key={member.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1E1916] truncate">{member.name}</p>
                  <p className="text-xs text-[#6E645D] truncate">
                    {member.role} · {member.attendanceStatus}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono font-medium text-[#1E1916] tabular-nums">
                    {formatCurrency(member.revenueGenerated, parlour.currency)}
                  </p>
                  <p className="text-xs text-[#6E645D] tabular-nums">
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
