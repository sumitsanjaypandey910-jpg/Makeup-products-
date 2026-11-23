import React from 'react';
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
      <div>
        <h1 className="font-display text-3xl font-semibold text-[#1E1916]">
          Business Reports &amp; Retention Analytics
        </h1>
        <p className="text-sm text-[#6E645D] mt-1">
          Track monthly performance, customer acquisition, repeat visit frequency, service revenue,
          and specialist output for {parlour.name}.
        </p>
      </div>

      {/* Key Analytical Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8E0D8] rounded-2xl p-5">
          <span className="text-xs text-[#6E645D]">Customer Retention Rate</span>
          <p className="font-display text-3xl font-semibold text-[#1E1916] tabular-nums mt-2">
            {metrics.retentionRate}%
          </p>
          <p className="text-xs text-[#6E645D] mt-1">
            {metrics.returningCustomers} of {metrics.totalCustomers} clients returned
          </p>
        </div>
        <div className="bg-white border border-[#E8E0D8] rounded-2xl p-5">
          <span className="text-xs text-[#6E645D]">Repeat Revenue Share</span>
          <p className="font-display text-3xl font-semibold text-[#1E1916] tabular-nums mt-2">
            {repeatRevenuePct}%
          </p>
          <p className="text-xs text-[#6E645D] mt-1">Revenue from returning clientele</p>
        </div>
        <div className="bg-white border border-[#E8E0D8] rounded-2xl p-5">
          <span className="text-xs text-[#6E645D]">Avg. Visit Frequency</span>
          <p className="font-display text-3xl font-semibold text-[#1E1916] tabular-nums mt-2">
            {avgVisits}
          </p>
          <p className="text-xs text-[#6E645D] mt-1">Visits per registered client</p>
        </div>
        <div className="bg-white border border-[#E8E0D8] rounded-2xl p-5">
          <span className="text-xs text-[#6E645D]">New Client Acquisition</span>
          <p className="font-display text-3xl font-semibold text-[#1E1916] tabular-nums mt-2">
            {metrics.newCustomersThisMonth}
          </p>
          <p className="text-xs text-[#6E645D] mt-1">Registered in November 2026</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E8E0D8] rounded-2xl p-6">
          <h2 className="font-display text-2xl font-semibold text-[#1E1916] mb-1">
            Monthly Business Performance
          </h2>
          <p className="text-xs text-[#6E645D] mb-4">
            6-month revenue trajectory paired with total bookings
          </p>
          <RevenueAppointmentsChart
            data={MONTHLY_PERFORMANCE_SERIES}
            currency={parlour.currency}
          />
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E8E0D8] rounded-2xl p-6">
          <h2 className="font-display text-2xl font-semibold text-[#1E1916] mb-1">
            Revenue by Service
          </h2>
          <p className="text-xs text-[#6E645D] mb-4">
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
        <div className="lg:col-span-6 bg-white border border-[#E8E0D8] rounded-2xl p-6">
          <h2 className="font-display text-2xl font-semibold text-[#1E1916] mb-4">
            Staff Performance Report
          </h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAE3DC] text-[#6E645D]">
                <th className="py-2">Specialist</th>
                <th className="py-2 text-right">Completed</th>
                <th className="py-2 text-right">Rating</th>
                <th className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3DC]">
              {leaderboard.map((st) => (
                <tr key={st.id}>
                  <td className="py-2.5 font-medium text-[#1E1916]">
                    {st.name}
                    <span className="block text-[11px] font-normal text-[#6E645D]">{st.role}</span>
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {st.completedCount}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {st.rating.toFixed(1)}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums font-medium">
                    {formatCurrency(st.revenueGenerated, parlour.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-6 bg-white border border-[#E8E0D8] rounded-2xl p-6">
          <h2 className="font-display text-2xl font-semibold text-[#1E1916] mb-4">
            Repeat Customer &amp; Visit Frequency Analysis
          </h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAE3DC] text-[#6E645D]">
                <th className="py-2">Client</th>
                <th className="py-2">Segment</th>
                <th className="py-2 text-right">Visits</th>
                <th className="py-2 text-right">Total Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3DC]">
              {customers
                .slice()
                .sort((a, b) => b.visitCount - a.visitCount)
                .map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 font-medium text-[#1E1916]">{c.fullName}</td>
                    <td className="py-2.5 text-[#6E645D]">{c.segment}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums">{c.visitCount}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums font-medium">
                      {formatCurrency(c.totalSpent, parlour.currency)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
