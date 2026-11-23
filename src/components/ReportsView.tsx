import React from 'react';
import { BarChart3, Repeat, TrendingUp, UserPlus, Users } from 'lucide-react';
import type {
  Appointment,
  Customer,
  Invoice,
  ParlourTenant,
  StaffProfile,
} from '../types/beauty';
import {
  computeDashboardMetrics,
  computeStaffLeaderboard,
  formatCurrency,
} from '../utils/analytics';
import { MONTHLY_PERFORMANCE_SERIES } from '../data/seedData';
import { HorizontalBarBreakdown, RevenueAppointmentsChart } from './Charts';

interface ReportsViewProps {
  parlour: ParlourTenant;
  customers: Customer[];
  appointments: Appointment[];
  invoices: Invoice[];
  staff: StaffProfile[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  parlour,
  customers,
  appointments,
  invoices,
  staff,
}) => {
  const metrics = computeDashboardMetrics(customers, appointments, invoices, '2026-11-22', '2026-11');
  const leaderboard = computeStaffLeaderboard(staff, appointments);

  const avgVisits =
    customers.length > 0
      ? (customers.reduce((sum, c) => sum + c.visitCount, 0) / customers.length).toFixed(1)
      : '0.0';

  const repeatSpendShare = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const vipAndRepeatSpend = customers
    .filter((c) => c.visitCount > 1)
    .reduce((sum, c) => sum + c.totalSpent, 0);
  const repeatRevenuePct =
    repeatSpendShare > 0 ? Math.round((vipAndRepeatSpend / repeatSpendShare) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-[#EF4444] text-white flex items-center justify-center shadow-sm shrink-0">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827]">
            Business Reports &amp; Retention Analytics
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Track monthly performance, customer acquisition, repeat visit frequency, service revenue,
            and specialist output for {parlour.name}.
          </p>
        </div>
      </div>

      {/* Key Analytical Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
          <div className="w-10 h-10 rounded-xl bg-[#5B4CE6] text-white flex items-center justify-center shadow-xs mb-3">
            <Users className="w-5 h-5" />
          </div>
          <p className="font-display text-3xl font-bold text-[#111827] tabular-nums">
            {metrics.retentionRate}%
          </p>
          <span className="text-xs font-medium text-[#6B7280] block mt-1">
            Customer Retention Rate
          </span>
          <p className="text-xs text-[#6B7280] mt-1">
            {metrics.returningCustomers} of {metrics.totalCustomers} clients returned
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
          <div className="w-10 h-10 rounded-xl bg-[#10B981] text-white flex items-center justify-center shadow-xs mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="font-display text-3xl font-bold text-[#111827] tabular-nums">
            {repeatRevenuePct}%
          </p>
          <span className="text-xs font-medium text-[#6B7280] block mt-1">
            Repeat Revenue Share
          </span>
          <p className="text-xs text-[#6B7280] mt-1">Revenue from returning clientele</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center shadow-xs mb-3">
            <Repeat className="w-5 h-5" />
          </div>
          <p className="font-display text-3xl font-bold text-[#111827] tabular-nums">{avgVisits}</p>
          <span className="text-xs font-medium text-[#6B7280] block mt-1">
            Avg. Visit Frequency
          </span>
          <p className="text-xs text-[#6B7280] mt-1">Visits per registered client</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
          <div className="w-10 h-10 rounded-xl bg-[#D91A6B] text-white flex items-center justify-center shadow-xs mb-3">
            <UserPlus className="w-5 h-5" />
          </div>
          <p className="font-display text-3xl font-bold text-[#111827] tabular-nums">
            {metrics.newCustomersThisMonth}
          </p>
          <span className="text-xs font-medium text-[#6B7280] block mt-1">
            New Client Acquisition
          </span>
          <p className="text-xs text-[#6B7280] mt-1">Registered in November 2026</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
          <h2 className="font-display text-xl font-bold text-[#111827] mb-1">
            Monthly Business Performance
          </h2>
          <p className="text-xs text-[#6B7280] mb-4">
            6-month revenue trajectory paired with total bookings
          </p>
          <RevenueAppointmentsChart
            data={MONTHLY_PERFORMANCE_SERIES}
            currency={parlour.currency}
          />
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
          <h2 className="font-display text-xl font-bold text-[#111827] mb-1">
            Revenue by Service
          </h2>
          <p className="text-xs text-[#6B7280] mb-4">
            Most popular treatments ranked by total booking value
          </p>
          <HorizontalBarBreakdown
            currency={parlour.currency}
            items={metrics.revenueByServiceCategory.map((r) => ({
              label: r.category,
              value: r.revenue,
              sublabel: `${r.count} sessions`,
            }))}
          />
        </div>
      </div>

      {/* Staff Performance & Repeat Client Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
          <h2 className="font-display text-xl font-bold text-[#111827] mb-4">
            Staff Performance Report
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F1F5F9] text-[#6B7280]">
                  <th className="py-2 font-semibold">Specialist</th>
                  <th className="py-2 text-right font-semibold">Completed</th>
                  <th className="py-2 text-right font-semibold">Rating</th>
                  <th className="py-2 text-right font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {leaderboard.map((st) => (
                  <tr key={st.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-2.5 font-medium text-[#111827]">
                      {st.name}
                      <span className="block text-[11px] font-normal text-[#6B7280]">{st.role}</span>
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-[#111827]">
                      {st.completedCount}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-amber-600 font-semibold">
                      {st.rating.toFixed(1)}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-[#111827]">
                      {formatCurrency(st.revenueGenerated, parlour.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
          <h2 className="font-display text-xl font-bold text-[#111827] mb-4">
            Repeat Customer &amp; Visit Frequency Analysis
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F1F5F9] text-[#6B7280]">
                  <th className="py-2 font-semibold">Client</th>
                  <th className="py-2 font-semibold">Segment</th>
                  <th className="py-2 text-right font-semibold">Visits</th>
                  <th className="py-2 text-right font-semibold">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {customers
                  .slice()
                  .sort((a, b) => b.visitCount - a.visitCount)
                  .map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-2.5 font-medium text-[#111827]">{c.fullName}</td>
                      <td className="py-2.5 text-[#6B7280]">{c.segment}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-[#111827]">
                        {c.visitCount}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-[#111827]">
                        {formatCurrency(c.totalSpent, parlour.currency)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
