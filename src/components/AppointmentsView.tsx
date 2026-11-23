import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, X, Clock, Bell } from 'lucide-react';
import type {
  Appointment,
  AppointmentStatus,
  Customer,
  ParlourTenant,
  ServiceItem,
  StaffProfile,
} from '../types/beauty';
import { formatCurrency } from '../utils/analytics';

interface AppointmentsViewProps {
  parlour: ParlourTenant;
  appointments: Appointment[];
  customers: Customer[];
  services: ServiceItem[];
  staff: StaffProfile[];
  onSaveAppointment: (appt: Appointment, isNew: boolean) => void;
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
}

const WEEK_DATES = [
  '2026-11-22',
  '2026-11-23',
  '2026-11-24',
  '2026-11-25',
  '2026-11-26',
  '2026-11-27',
  '2026-11-28',
];

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  parlour,
  appointments,
  customers,
  services,
  staff,
  onSaveAppointment,
  onUpdateStatus,
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState('2026-11-22');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'All'>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);

  // Booking / Reschedule state
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [staffId, setStaffId] = useState(staff[0]?.id ?? '');
  const [date, setDate] = useState('2026-11-22');
  const [time, setTime] = useState('11:00');
  const [notes, setNotes] = useState('');
  const [reminder24h, setReminder24h] = useState(true);
  const [reminder2h, setReminder2h] = useState(true);

  const visibleAppointments = appointments.filter((a) => {
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    if (!matchesStatus) return false;
    if (viewMode === 'daily') return a.date === selectedDate;
    return WEEK_DATES.includes(a.date);
  });

  const openNewBooking = () => {
    setReschedulingAppt(null);
    setCustomerId(customers[0]?.id ?? '');
    setServiceId(services[0]?.id ?? '');
    setStaffId(staff[0]?.id ?? '');
    setDate(selectedDate);
    setTime('11:00');
    setNotes('');
    setModalOpen(true);
  };

  const openReschedule = (appt: Appointment) => {
    setReschedulingAppt(appt);
    setCustomerId(appt.customerId);
    setServiceId(appt.serviceId);
    setStaffId(appt.staffId);
    setDate(appt.date);
    setTime(appt.time);
    setNotes(appt.notes ?? '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    const srv = services.find((s) => s.id === serviceId);
    const stf = staff.find((s) => s.id === staffId);
    if (!cust || !srv || !stf) return;

    const next: Appointment = reschedulingAppt
      ? {
          ...reschedulingAppt,
          customerId: cust.id,
          customerName: cust.fullName,
          serviceId: srv.id,
          serviceName: srv.name,
          staffId: stf.id,
          staffName: stf.name,
          date,
          time,
          durationMin: srv.durationMin,
          price: srv.price,
          notes: notes.trim(),
        }
      : {
          id: `appt_${Date.now()}`,
          parlourId: parlour.id,
          customerId: cust.id,
          customerName: cust.fullName,
          serviceId: srv.id,
          serviceName: srv.name,
          staffId: stf.id,
          staffName: stf.name,
          date,
          time,
          durationMin: srv.durationMin,
          price: srv.price,
          status: 'Pending',
          notes: notes.trim(),
          reminderQueued: true,
        };

    onSaveAppointment(next, !reschedulingAppt);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#1E1916]">
            Appointments &amp; Studio Calendar
          </h1>
          <p className="text-sm text-[#6E645D] mt-1">
            Schedule treatments, assign specialists, manage confirmations, and reschedule bookings.
          </p>
        </div>
        <button
          type="button"
          onClick={openNewBooking}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B85C6F] text-white text-sm font-medium hover:bg-[#A34D5F] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Book Appointment
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-[#E8E0D8] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#F4EFEA] rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'daily'
                  ? 'bg-white text-[#1E1916]'
                  : 'text-[#6E645D] hover:text-[#1E1916]'
              }`}
            >
              Daily View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'weekly'
                  ? 'bg-white text-[#1E1916]'
                  : 'text-[#6E645D] hover:text-[#1E1916]'
              }`}
            >
              Weekly Calendar
            </button>
          </div>

          {viewMode === 'daily' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Select appointment date"
              className="px-3 py-1.5 text-xs font-mono border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F4EFEA] rounded-lg">
          {(['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-[#1E1916]'
                  : 'text-[#6E645D] hover:text-[#1E1916]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Calendar Strip or Daily Schedule */}
      {viewMode === 'weekly' ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {WEEK_DATES.map((d) => {
            const dayAppts = visibleAppointments
              .filter((a) => a.date === d)
              .sort((a, b) => a.time.localeCompare(b.time));
            return (
              <div
                key={d}
                className="bg-white border border-[#E8E0D8] rounded-2xl p-3.5 flex flex-col min-h-[260px]"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(d);
                    setViewMode('daily');
                  }}
                  className="text-left border-b border-[#EAE3DC] pb-2 mb-3 hover:text-[#B85C6F]"
                >
                  <span className="text-xs font-mono font-semibold text-[#1E1916]">{d}</span>
                  <span className="block text-[11px] text-[#6E645D]">
                    {dayAppts.length} bookings
                  </span>
                </button>
                <div className="space-y-2.5 flex-1">
                  {dayAppts.length === 0 ? (
                    <p className="text-[11px] text-[#8A7F77] italic">Open day</p>
                  ) : (
                    dayAppts.map((a) => (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-xl bg-[#FAF8F6] border border-[#E8E0D8] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span>{a.time}</span>
                          <span className="text-[#B85C6F]">{a.status}</span>
                        </div>
                        <p className="font-medium text-[#1E1916] truncate">{a.customerName}</p>
                        <p className="text-[11px] text-[#6E645D] truncate">{a.serviceName}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#E8E0D8] rounded-2xl overflow-hidden">
          {visibleAppointments.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarIcon className="w-8 h-8 text-[#B08B4F] mx-auto mb-2" />
              <p className="text-sm text-[#6E645D]">
                No appointments found for {selectedDate} with the selected status.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EAE3DC]">
              {visibleAppointments
                .slice()
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appt) => (
                  <div
                    key={appt.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="px-3 py-2 rounded-xl bg-[#F4EFEA] text-center shrink-0">
                        <span className="block font-mono text-sm font-semibold text-[#1E1916] tabular-nums">
                          {appt.time}
                        </span>
                        <span className="block text-[11px] text-[#6E645D] tabular-nums">
                          {appt.durationMin}m
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1E1916]">
                          {appt.customerName}
                        </p>
                        <p className="text-xs text-[#6E645D] mt-0.5">
                          {appt.serviceName} · Specialist: {appt.staffName} ·{' '}
                          <span className="font-mono">
                            {formatCurrency(appt.price, parlour.currency)}
                          </span>
                        </p>
                        {appt.notes && (
                          <p className="text-xs text-[#8A7F77] mt-1">{appt.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        aria-label={`Change status for ${appt.customerName}`}
                        value={appt.status}
                        onChange={(e) =>
                          onUpdateStatus(appt.id, e.target.value as AppointmentStatus)
                        }
                        className="px-3 py-1.5 text-xs font-medium border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => openReschedule(appt)}
                        className="px-3 py-1.5 text-xs font-medium border border-[#E8E0D8] rounded-lg text-[#1E1916] hover:bg-[#FAF8F6] whitespace-nowrap"
                      >
                        Reschedule
                      </button>

                      {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(appt.id, 'Cancelled')}
                          className="px-3 py-1.5 text-xs font-medium border border-rose-200 rounded-lg text-rose-700 hover:bg-rose-50 whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Future-Ready Automated Reminder Module */}
      <section className="bg-white border border-[#E8E0D8] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-[#B08B4F] shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-xl font-semibold text-[#1E1916]">
              Automated Reminder Schedule (Gateway Setup Required)
            </h2>
            <p className="text-xs text-[#6E645D] mt-0.5 leading-relaxed">
              Configure automated dispatch windows below. External WhatsApp Business Cloud API /
              SMS webhook credentials are not yet connected in this workspace — reminders are
              queued for manual dispatch in the Communication hub.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs shrink-0">
          <label className="inline-flex items-center gap-2 text-[#1E1916]">
            <input
              type="checkbox"
              checked={reminder24h}
              onChange={(e) => setReminder24h(e.target.checked)}
              className="rounded border-[#E8E0D8]"
            />
            <Clock className="w-3.5 h-3.5 text-[#6E645D]" />
            24h before visit
          </label>
          <label className="inline-flex items-center gap-2 text-[#1E1916]">
            <input
              type="checkbox"
              checked={reminder2h}
              onChange={(e) => setReminder2h(e.target.checked)}
              className="rounded border-[#E8E0D8]"
            />
            <Clock className="w-3.5 h-3.5 text-[#6E645D]" />
            2h before visit
          </label>
        </div>
      </section>

      {/* Book / Reschedule Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="appt-modal-title"
        >
          <div className="bg-white border border-[#E8E0D8] rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="appt-modal-title"
                className="font-display text-2xl font-semibold text-[#1E1916]"
              >
                {reschedulingAppt ? 'Reschedule Appointment' : 'Book New Appointment'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close appointment modal"
                className="p-1.5 rounded-lg text-[#6E645D] hover:bg-[#F4EFEA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  htmlFor="appt-client"
                  className="block text-xs font-medium text-[#1E1916] mb-1"
                >
                  Customer
                </label>
                <select
                  id="appt-client"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="appt-service"
                  className="block text-xs font-medium text-[#1E1916] mb-1"
                >
                  Service / Package
                </label>
                <select
                  id="appt-service"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMin}m · {formatCurrency(s.price, parlour.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="appt-staff"
                  className="block text-xs font-medium text-[#1E1916] mb-1"
                >
                  Assigned Specialist
                </label>
                <select
                  id="appt-staff"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                >
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="appt-date"
                    className="block text-xs font-medium text-[#1E1916] mb-1"
                  >
                    Date
                  </label>
                  <input
                    id="appt-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="appt-time"
                    className="block text-xs font-medium text-[#1E1916] mb-1"
                  >
                    Time
                  </label>
                  <input
                    id="appt-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="appt-notes"
                  className="block text-xs font-medium text-[#1E1916] mb-1"
                >
                  Consultation / Booking Notes
                </label>
                <textarea
                  id="appt-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8E0D8] text-sm text-[#1E1916]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#B85C6F] text-white text-sm font-medium hover:bg-[#A34D5F]"
                >
                  {reschedulingAppt ? 'Update Booking' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
