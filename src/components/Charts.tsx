import React, { useState } from 'react';
import { formatCurrency } from '../utils/analytics';

interface MonthlyPoint {
  month: string;
  revenue: number;
  appointments: number;
}

export const RevenueAppointmentsChart: React.FC<{
  data: MonthlyPoint[];
  currency?: string;
}> = ({ data, currency = '₹' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const maxAppt = Math.max(...data.map((d) => d.appointments), 1);

  const width = 640;
  const height = 220;
  const padL = 56;
  const padR = 20;
  const padT = 18;
  const padB = 34;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const barStep = plotW / Math.max(data.length, 1);

  const linePoints = data
    .map((d, i) => {
      const x = padL + i * barStep + barStep / 2;
      const y = padT + plotH - (d.appointments / maxAppt) * (plotH * 0.85);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 text-xs text-[#6E645D]">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#B85C6F] inline-block" />
            Monthly Revenue
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#B08B4F] inline-block" />
            Appointments
          </span>
        </div>
        {hoveredIdx !== null && data[hoveredIdx] ? (
          <span className="font-mono tabular-nums text-[#1E1916]">
            {data[hoveredIdx].month}: {formatCurrency(data[hoveredIdx].revenue, currency)} ·{' '}
            {data[hoveredIdx].appointments} visits
          </span>
        ) : (
          <span className="tabular-nums">6-Month Trend</span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-56 overflow-visible"
        role="img"
        aria-label="Monthly revenue and appointment volume chart"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padT + plotH * (1 - t);
          const val = Math.round((maxRev * t) / 1000);
          return (
            <g key={t}>
              <line
                x1={padL}
                x2={width - padR}
                y1={y}
                y2={y}
                stroke="#EAE3DC"
                strokeDasharray={t === 0 ? undefined : '3 3'}
              />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-[#6E645D] text-[10px] font-mono"
              >
                {val}k
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barW = Math.min(34, barStep * 0.48);
          const barH = (d.revenue / maxRev) * plotH;
          const x = padL + i * barStep + (barStep - barW) / 2;
          const y = padT + plotH - barH;
          const isHovered = hoveredIdx === i;
          return (
            <g
              key={d.month}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(barH, 4)}
                rx={5}
                fill={isHovered ? '#A34D5F' : '#D48C9B'}
              />
              <text
                x={padL + i * barStep + barStep / 2}
                y={height - 10}
                textAnchor="middle"
                className="fill-[#6E645D] text-[11px]"
              >
                {d.month}
              </text>
            </g>
          );
        })}

        {data.length > 1 && (
          <polyline
            fill="none"
            stroke="#B08B4F"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={linePoints}
          />
        )}

        {data.map((d, i) => {
          const x = padL + i * barStep + barStep / 2;
          const y = padT + plotH - (d.appointments / maxAppt) * (plotH * 0.85);
          return (
            <circle
              key={`pt-${d.month}`}
              cx={x}
              cy={y}
              r={hoveredIdx === i ? 4.5 : 3.2}
              fill="#FAF8F6"
              stroke="#B08B4F"
              strokeWidth={2}
            />
          );
        })}
      </svg>
    </div>
  );
};

export const HorizontalBarBreakdown: React.FC<{
  items: { label: string; value: number; sublabel?: string }[];
  currency?: string;
}> = ({ items, currency = '₹' }) => {
  const maxVal = Math.max(...items.map((i) => i.value), 1);

  if (items.length === 0) {
    return (
      <p className="text-sm text-[#6E645D] py-6 text-center">
        No service revenue recorded for this period yet.
      </p>
    );
  }

  return (
    <div className="space-y-3.5">
      {items.map((item) => {
        const pct = Math.max(6, Math.round((item.value / maxVal) * 100));
        return (
          <div key={item.label}>
            <div className="flex items-baseline justify-between text-xs mb-1.5 gap-2">
              <span className="font-medium text-[#1E1916] truncate">{item.label}</span>
              <span className="font-mono tabular-nums text-[#6E645D] shrink-0">
                {formatCurrency(item.value, currency)}
                {item.sublabel ? ` · ${item.sublabel}` : ''}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#F4EFEA] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#B85C6F] transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
