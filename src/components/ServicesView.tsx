import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X, Scissors } from 'lucide-react';
import type {
  ParlourTenant,
  ServiceCategory,
  ServiceItem,
  StaffProfile,
  TenantRole,
} from '../types/beauty';
import { canPerformRoleAction, formatCurrency } from '../utils/analytics';

interface ServicesViewProps {
  parlour: ParlourTenant;
  role: TenantRole;
  services: ServiceItem[];
  staff: StaffProfile[];
  onSaveService: (service: ServiceItem, isNew: boolean) => void;
  onDeleteService: (serviceId: string) => void;
}

const CATEGORIES: (ServiceCategory | 'All')[] = [
  'All',
  'Facial Treatments',
  'Hair Treatments',
  'Cleanup Services',
  'Bridal Packages',
  'Skin-Care Packages',
  'Beauty Consultations',
  'Custom',
];

const CATEGORY_DOT: Record<ServiceCategory, string> = {
  'Facial Treatments': 'bg-[#D91A6B]',
  'Hair Treatments': 'bg-[#F59E0B]',
  'Cleanup Services': 'bg-[#0D9488]',
  'Bridal Packages': 'bg-[#8B5CF6]',
  'Skin-Care Packages': 'bg-[#2563EB]',
  'Beauty Consultations': 'bg-[#10B981]',
  Custom: 'bg-[#F97316]',
};

export const ServicesView: React.FC<ServicesViewProps> = ({
  parlour,
  role,
  services,
  staff,
  onSaveService,
  onDeleteService,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'All'>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('Facial Treatments');
  const [price, setPrice] = useState(2500);
  const [durationMin, setDurationMin] = useState(60);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const canManage = canPerformRoleAction(role, 'manage_services');
  const filtered = services.filter(
    (s) => categoryFilter === 'All' || s.category === categoryFilter
  );

  const openModal = (item?: ServiceItem) => {
    if (item) {
      setEditing(item);
      setName(item.name);
      setDescription(item.description);
      setCategory(item.category);
      setPrice(item.price);
      setDurationMin(item.durationMin);
      setSelectedStaffIds(item.availableStaffIds);
    } else {
      setEditing(null);
      setName('');
      setDescription('');
      setCategory('Facial Treatments');
      setPrice(2500);
      setDurationMin(60);
      setSelectedStaffIds(staff.slice(0, 1).map((s) => s.id));
    }
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const next: ServiceItem = editing
      ? {
          ...editing,
          name: name.trim(),
          description: description.trim(),
          category,
          price: Number(price) || 0,
          durationMin: Number(durationMin) || 30,
          availableStaffIds: selectedStaffIds,
        }
      : {
          id: `srv_${Date.now()}`,
          parlourId: parlour.id,
          name: name.trim(),
          description: description.trim(),
          category,
          price: Number(price) || 0,
          durationMin: Number(durationMin) || 30,
          availableStaffIds: selectedStaffIds,
          active: true,
        };
    onSaveService(next, !editing);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center shadow-sm shrink-0">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827]">
              Services &amp; Treatment Packages
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Curate facials, hair rituals, cleanups, bridal suites, and skin-care series with
              assigned specialists.
            </p>
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D91A6B] text-white text-sm font-semibold hover:bg-[#BD145B] whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-[#E5E7EB] rounded-xl w-fit shadow-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              categoryFilter === cat
                ? 'bg-[#D91A6B] text-white'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((service) => {
          const assignedNames = staff
            .filter((st) => service.availableStaffIds.includes(st.id))
            .map((st) => st.name)
            .join(', ');
          const accentBar = CATEGORY_DOT[service.category] ?? 'bg-[#D91A6B]';
          return (
            <div
              key={service.id}
              className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-[0_4px_18px_rgba(15,23,42,0.03)] hover:border-[#D91A6B]/30 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${accentBar}`} aria-hidden="true" />
                    <span className="text-xs text-[#6B7280] font-semibold">{service.category}</span>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openModal(service)}
                        aria-label={`Edit ${service.name}`}
                        className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F4F8]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteService(service.id)}
                        aria-label={`Delete ${service.name}`}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <h2 className="font-display text-lg font-bold text-[#111827] mt-1.5">
                  {service.name}
                </h2>
                <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="border-t border-[#F1F5F9] pt-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#6B7280] block">
                    {service.durationMin} mins · {assignedNames || 'All Specialists'}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-[#D91A6B] tabular-nums shrink-0">
                  {formatCurrency(service.price, parlour.currency)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
        >
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="service-modal-title"
                className="font-display text-xl font-bold text-[#111827]"
              >
                {editing ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close service modal"
                className="p-1.5 rounded-xl text-[#6B7280] hover:bg-[#F3F4F8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="srv-name"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  Service Name *
                </label>
                <input
                  id="srv-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label
                  htmlFor="srv-cat"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  Category
                </label>
                <select
                  id="srv-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="srv-price"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Price ({parlour.currency})
                  </label>
                  <input
                    id="srv-price"
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="srv-duration"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Duration (mins)
                  </label>
                  <input
                    id="srv-duration"
                    type="number"
                    min={5}
                    step={5}
                    value={durationMin}
                    onChange={(e) => setDurationMin(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="srv-desc"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  Description
                </label>
                <textarea
                  id="srv-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Available Specialists
                </span>
                <div className="flex flex-wrap gap-2">
                  {staff.map((st) => {
                    const checked = selectedStaffIds.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className="inline-flex items-center gap-1.5 text-xs text-[#111827]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStaffIds((prev) => [...prev, st.id]);
                            } else {
                              setSelectedStaffIds((prev) => prev.filter((id) => id !== st.id));
                            }
                          }}
                          className="accent-[#D91A6B]"
                        />
                        {st.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D91A6B] text-white text-sm font-semibold hover:bg-[#BD145B]"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
