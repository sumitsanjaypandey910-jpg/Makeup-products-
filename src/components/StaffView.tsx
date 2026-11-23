import React, { useState } from 'react';
import { Plus, UserCheck, X } from 'lucide-react';
import type {
  Appointment,
  AttendanceStatus,
  ParlourTenant,
  StaffProfile,
  StaffRole,
  TenantRole,
} from '../types/beauty';
import {
  canPerformRoleAction,
  computeStaffLeaderboard,
  formatCurrency,
} from '../utils/analytics';

interface StaffViewProps {
  parlour: ParlourTenant;
  role: TenantRole;
  staff: StaffProfile[];
  appointments: Appointment[];
  onSaveStaff: (member: StaffProfile, isNew: boolean) => void;
  onUpdateAttendance: (staffId: string, status: AttendanceStatus) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  parlour,
  role,
  staff,
  appointments,
  onSaveStaff,
  onUpdateAttendance,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRole>('Lead Aesthetician');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const canManage = canPerformRoleAction(role, 'manage_staff');
  const enrichedStaff = computeStaffLeaderboard(staff, appointments);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveStaff(
      {
        id: `staff_${Date.now()}`,
        parlourId: parlour.id,
        name: name.trim(),
        role: staffRole,
        phone: phone.trim() || '+91 98200 00000',
        email: email.trim(),
        attendanceStatus: 'Clocked In',
        lastClockIn: '10:00 AM',
        assignedAppointments: 0,
        completedCount: 0,
        revenueGenerated: 0,
        rating: 4.8,
        permissions: staffRole === 'Parlour Owner' ? ['Full Access'] : ['Appointments', 'CRM'],
      },
      true
    );
    setModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#EC4899] text-white flex items-center justify-center shadow-sm shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827]">
              Staff, Attendance &amp; Performance
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Track daily specialist attendance, role permissions, assigned bookings, and service
              revenue.
            </p>
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D91A6B] text-white text-sm font-semibold hover:bg-[#BD145B] transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Specialist
          </button>
        )}
      </div>

      {/* Staff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {enrichedStaff.map((member) => (
          <div
            key={member.id}
            className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-[0_4px_18px_rgba(15,23,42,0.03)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#FDF0F6] border border-[#F5C6DB] flex items-center justify-center font-display text-base font-bold text-[#D91A6B] shrink-0">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold text-[#111827] truncate">
                    {member.name}
                  </h2>
                  <p className="text-xs text-[#6B7280] truncate">{member.role}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-amber-600 shrink-0">
                {member.rating.toFixed(1)} ★
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs border-y border-[#F1F5F9] py-3">
              <div>
                <span className="text-[#6B7280] block">Assigned</span>
                <span className="font-mono font-semibold text-[#111827] tabular-nums">
                  {member.assignedAppointments}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Completed</span>
                <span className="font-mono font-semibold text-[#111827] tabular-nums">
                  {member.completedCount}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Revenue</span>
                <span className="font-mono font-semibold text-[#111827] tabular-nums">
                  {formatCurrency(member.revenueGenerated, parlour.currency)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <span className="text-[#6B7280] block truncate">
                  Attendance · {member.lastClockIn}
                </span>
                <span className="text-[#111827] block truncate">
                  Access: {member.permissions.join(' · ')}
                </span>
              </div>
              <select
                aria-label={`Attendance status for ${member.name}`}
                value={member.attendanceStatus}
                onChange={(e) =>
                  onUpdateAttendance(member.id, e.target.value as AttendanceStatus)
                }
                className="px-2.5 py-1.5 text-xs border border-[#E5E7EB] rounded-lg bg-[#F8FAFC] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D91A6B]/25 focus:border-[#D91A6B] shrink-0"
              >
                <option value="Clocked In">Clocked In</option>
                <option value="On Break">On Break</option>
                <option value="Off Duty">Off Duty</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-modal-title"
        >
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="staff-modal-title"
                className="font-display text-2xl font-bold text-[#111827]"
              >
                Add Staff Specialist
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close staff modal"
                className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F4F8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="st-name"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="st-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D91A6B]/25 focus:border-[#D91A6B]"
                />
              </div>
              <div>
                <label
                  htmlFor="st-role"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  Role
                </label>
                <select
                  id="st-role"
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D91A6B]/25 focus:border-[#D91A6B]"
                >
                  <option value="Lead Aesthetician">Lead Aesthetician</option>
                  <option value="Hair Specialist">Hair Specialist</option>
                  <option value="Makeup & Bridal Artist">Makeup &amp; Bridal Artist</option>
                  <option value="Front Desk Coordinator">Front Desk Coordinator</option>
                  <option value="Parlour Owner">Parlour Owner</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="st-phone"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Phone
                  </label>
                  <input
                    id="st-phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D91A6B]/25 focus:border-[#D91A6B]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="st-email"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="st-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D91A6B]/25 focus:border-[#D91A6B]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#111827] hover:bg-[#F8FAFC] whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D91A6B] text-white text-sm font-semibold hover:bg-[#BD145B] whitespace-nowrap"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
