import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit3, X, Camera, MessageSquare, Users } from 'lucide-react';
import type {
  Appointment,
  Customer,
  CustomerSegment,
  NavTab,
  ParlourTenant,
  SkinScanRecord,
  TenantRole,
} from '../types/beauty';
import { canPerformRoleAction, filterCustomers, formatCurrency } from '../utils/analytics';

interface CustomersViewProps {
  parlour: ParlourTenant;
  role: TenantRole;
  customers: Customer[];
  appointments: Appointment[];
  skinScans: SkinScanRecord[];
  onSaveCustomer: (customer: Customer, isNew: boolean) => void;
  onDeleteCustomer: (customerId: string) => void;
  onSelectCustomerForScan: (customerId: string) => void;
  onSelectCustomerForMessage: (customerId: string) => void;
  onNavigate: (tab: NavTab) => void;
  externalCreateTrigger?: number;
}

const SEGMENTS: (CustomerSegment | 'All')[] = ['All', 'VIP', 'Regular', 'New', 'At Risk'];

export const CustomersView: React.FC<CustomersViewProps> = ({
  parlour,
  role,
  customers,
  appointments,
  skinScans,
  onSaveCustomer,
  onDeleteCustomer,
  onSelectCustomerForScan,
  onSelectCustomerForMessage,
  onNavigate,
  externalCreateTrigger,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | 'All'>('All');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    customers[0]?.id ?? null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formError, setFormError] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [segment, setSegment] = useState<CustomerSegment>('New');
  const [preferences, setPreferences] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(true);

  const filtered = filterCustomers(customers, searchQuery, segmentFilter);
  const activeCustomer =
    customers.find((c) => c.id === selectedCustomerId) ?? filtered[0] ?? null;

  const canDelete = canPerformRoleAction(role, 'delete_customer');

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setDob('');
    setSegment('New');
    setPreferences('');
    setStaffNotes('');
    setWhatsappConsent(true);
    setFormError('');
    setModalOpen(true);
  };

  useEffect(() => {
    if (externalCreateTrigger && externalCreateTrigger > 0) {
      openCreateModal();
    }
  }, [externalCreateTrigger]);

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFullName(customer.fullName);
    setPhone(customer.phone);
    setEmail(customer.email);
    setDob(customer.dob);
    setSegment(customer.segment);
    setPreferences(customer.preferences);
    setStaffNotes(customer.staffNotes);
    setWhatsappConsent(customer.whatsappConsent);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError('Please enter the customer full name (at least 2 characters).');
      return;
    }
    if (!phone.trim() || phone.trim().length < 5) {
      setFormError('Please enter a valid phone number.');
      return;
    }

    const todayStr = '2026-11-22';
    const nextCustomer: Customer = editingCustomer
      ? {
          ...editingCustomer,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          dob: dob.trim(),
          segment,
          preferences: preferences.trim(),
          staffNotes: staffNotes.trim(),
          whatsappConsent,
        }
      : {
          id: `cust_${Date.now()}`,
          parlourId: parlour.id,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          dob: dob.trim(),
          registeredAt: todayStr,
          segment,
          preferences: preferences.trim(),
          staffNotes: staffNotes.trim(),
          whatsappConsent,
          treatmentHistory: [],
          productPurchases: [],
          totalSpent: 0,
          visitCount: 1,
          lastVisitDate: todayStr,
        };

    onSaveCustomer(nextCustomer, !editingCustomer);
    setSelectedCustomerId(nextCustomer.id);
    setModalOpen(false);
  };

  const customerAppointments = activeCustomer
    ? appointments.filter((a) => a.customerId === activeCustomer.id)
    : [];
  const customerScans = activeCustomer
    ? skinScans.filter((s) => s.customerId === activeCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#5B4CE6] text-white flex items-center justify-center shadow-sm shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827]">
              Customer Directory &amp; CRM
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Manage client profiles, skincare preferences, treatment history, and consent records.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D91A6B] text-white text-sm font-semibold hover:bg-[#BD145B] transition-colors whitespace-nowrap shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Search & Segmentation Controls */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-[0_4px_18px_rgba(15,23,42,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email, or preference..."
            aria-label="Search customers"
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D91A6B]/25 focus:border-[#D91A6B]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3F4F8] rounded-xl">
          {SEGMENTS.map((seg) => (
            <button
              key={seg}
              type="button"
              onClick={() => setSegmentFilter(seg)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                segmentFilter === seg
                  ? 'bg-white text-[#D91A6B] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      {/* Split Workspace: Customer List + Detailed Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
          <div className="px-5 py-3.5 border-b border-[#F1F5F9] flex items-center justify-between text-xs text-[#6B7280]">
            <span>Showing {filtered.length} clients</span>
            <span>Click a client to inspect full dossier</span>
          </div>
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-[#6B7280] mb-3">
                No customer profiles match your current filter.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-[#D91A6B] text-white text-xs font-semibold hover:bg-[#BD145B]"
              >
                Create Customer Profile
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-xs font-semibold text-[#6B7280] bg-[#F8FAFC]">
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-3">Segment</th>
                    <th className="py-3 px-3 text-right">Visits</th>
                    <th className="py-3 px-4 text-right">Lifetime Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-sm">
                  {filtered.map((customer) => {
                    const isSelected = activeCustomer?.id === customer.id;
                    return (
                      <tr
                        key={customer.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-[#FDF0F6]' : 'hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerId(customer.id)}
                            className="text-left w-full focus:outline-none"
                          >
                            <p className="font-semibold text-[#111827]">{customer.fullName}</p>
                            <p className="text-xs text-[#6B7280] font-mono">{customer.phone}</p>
                          </button>
                        </td>
                        <td className="py-3 px-3 text-xs font-medium text-[#4B5563]">
                          {customer.segment}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-[#111827]">
                          {customer.visitCount}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-[#111827]">
                          {formatCurrency(customer.totalSpent, parlour.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Customer Dossier Panel */}
        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
          {!activeCustomer ? (
            <p className="text-sm text-[#6B7280] py-12 text-center">
              Select a customer from the directory to view their profile.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  {activeCustomer.photoUrl ? (
                    <img
                      src={activeCustomer.photoUrl}
                      alt={activeCustomer.fullName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-[#E5E7EB] shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#FDF0F6] border border-[#FBCFE8] flex items-center justify-center font-display text-lg font-bold text-[#D91A6B] shrink-0">
                      {activeCustomer.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-bold text-[#111827] truncate">
                      {activeCustomer.fullName}
                    </h2>
                    <p className="text-xs text-[#6B7280] truncate">
                      {activeCustomer.segment} · Registered {activeCustomer.registeredAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(activeCustomer)}
                    aria-label={`Edit ${activeCustomer.fullName}`}
                    className="p-2 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteCustomer(activeCustomer.id);
                        setSelectedCustomerId(null);
                      }}
                      aria-label={`Delete ${activeCustomer.fullName}`}
                      className="p-2 rounded-xl border border-[#E5E7EB] text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectCustomerForScan(activeCustomer.id);
                    onNavigate('skin_scanner');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FDF0F6] text-[#D91A6B] text-xs font-semibold hover:bg-[#FCE7F3] whitespace-nowrap"
                >
                  <Camera className="w-3.5 h-3.5" />
                  New Skin Scan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCustomerForMessage(activeCustomer.id);
                    onNavigate('communication');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-[#111827] text-xs font-semibold hover:bg-[#F8FAFC] whitespace-nowrap"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#5B4CE6]" />
                  WhatsApp Message
                </button>
              </div>

              <div className="border-t border-[#F1F5F9] pt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#6B7280] block">Phone</span>
                  <span className="font-mono text-[#111827] font-medium">
                    {activeCustomer.phone}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">Email</span>
                  <span className="text-[#111827] break-all">
                    {activeCustomer.email || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">Date of Birth</span>
                  <span className="font-mono text-[#111827]">
                    {activeCustomer.dob || 'Not recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">WhatsApp Consent</span>
                  <span
                    className={`font-semibold ${
                      activeCustomer.whatsappConsent ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {activeCustomer.whatsappConsent ? 'Opted In' : 'Opted Out'}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#F1F5F9] pt-4 space-y-2 text-xs">
                <div>
                  <span className="text-[#6B7280] font-semibold block mb-0.5">
                    Personal Preferences
                  </span>
                  <p className="text-[#111827] leading-relaxed">
                    {activeCustomer.preferences || 'No preferences recorded yet.'}
                  </p>
                </div>
                <div>
                  <span className="text-[#6B7280] font-semibold block mb-0.5">
                    Internal Staff Notes
                  </span>
                  <p className="text-[#111827] leading-relaxed">
                    {activeCustomer.staffNotes || 'No internal notes yet.'}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#F1F5F9] pt-4 space-y-2 text-xs">
                <span className="text-[#6B7280] font-semibold block">
                  Appointments ({customerAppointments.length}) &amp; Skin Scans ({customerScans.length})
                </span>
                {customerAppointments.slice(0, 3).map((appt) => (
                  <div key={appt.id} className="flex justify-between text-[#111827] py-1">
                    <span className="truncate">{appt.serviceName}</span>
                    <span className="font-mono text-[#6B7280] shrink-0">
                      {appt.date} · {appt.status}
                    </span>
                  </div>
                ))}
                {activeCustomer.treatmentHistory.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[#6B7280] font-semibold block mb-1">
                      Past Treatments
                    </span>
                    <ul className="space-y-1 text-[#111827]">
                      {activeCustomer.treatmentHistory.map((item) => (
                        <li key={item}>· {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeCustomer.productPurchases.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[#6B7280] font-semibold block mb-1">
                      Product Purchase History
                    </span>
                    {activeCustomer.productPurchases.map((p) => (
                      <div key={p.id} className="flex justify-between text-[#111827] py-0.5">
                        <span className="truncate">{p.productName}</span>
                        <span className="font-mono tabular-nums shrink-0">
                          {formatCurrency(p.amount, parlour.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-modal-title"
        >
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="customer-modal-title"
                className="font-display text-xl font-bold text-[#111827]"
              >
                {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close customer modal"
                className="p-1.5 rounded-xl text-[#6B7280] hover:bg-[#F3F4F8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="cust-name"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="cust-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="cust-phone"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Phone Number *
                  </label>
                  <input
                    id="cust-phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cust-email"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="cust-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="cust-dob"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Date of Birth
                  </label>
                  <input
                    id="cust-dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cust-segment"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Customer Segment
                  </label>
                  <select
                    id="cust-segment"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value as CustomerSegment)}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                  >
                    <option value="New">New</option>
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                    <option value="At Risk">At Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="cust-prefs"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  Personal Preferences
                </label>
                <textarea
                  id="cust-prefs"
                  rows={2}
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label
                  htmlFor="cust-notes"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  Internal Staff Notes
                </label>
                <textarea
                  id="cust-notes"
                  rows={2}
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[#111827]">
                <input
                  type="checkbox"
                  checked={whatsappConsent}
                  onChange={(e) => setWhatsappConsent(e.target.checked)}
                  className="rounded border-[#E5E7EB] accent-[#D91A6B]"
                />
                Customer consented to WhatsApp appointment &amp; skincare reminders
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#111827] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D91A6B] text-white text-sm font-semibold hover:bg-[#BD145B]"
                >
                  {editingCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
