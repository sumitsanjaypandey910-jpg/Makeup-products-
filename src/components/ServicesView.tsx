import React, { useState } from 'react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
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
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#1E1916]">
            Services &amp; Treatment Packages
          </h1>
          <p className="text-sm text-[#6E645D] mt-1">
            Curate facials, hair rituals, cleanups, bridal suites, and skin-care series with
            assigned specialists.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B85C6F] text-white text-sm font-medium hover:bg-[#A34D5F] whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F4EFEA] rounded-xl w-fit">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              categoryFilter === cat
                ? 'bg-white text-[#1E1916]'
                : 'text-[#6E645D] hover:text-[#1E1916]'
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
          return (
            <div
              key={service.id}
              className="bg-white border border-[#E8E0D8] rounded-2xl p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-[#B08B4F] font-medium">{service.category}</span>
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openModal(service)}
                        aria-label={`Edit ${service.name}`}
                        className="p-1.5 rounded-lg text-[#6E645D] hover:bg-[#FAF8F6]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteService(service.id)}
                        aria-label={`Delete ${service.name}`}
                        className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <h2 className="font-display text-xl font-semibold text-[#1E1916] mt-1">
                  {service.name}
                </h2>
                <p className="text-xs text-[#6E645D] mt-1.5 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="border-t border-[#EAE3DC] pt-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#6E645D] block">
                    {service.durationMin} mins · {assignedNames || 'All Specialists'}
                  </span>
                </div>
                <span className="font-mono text-sm font-semibold text-[#1E1916] tabular-nums shrink-0">
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
          <div className="bg-white border border-[#E8E0D8] rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="service-modal-title"
                className="font-display text-2xl font-semibold text-[#1E1916]"
              >
                {editing ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close service modal"
                className="p-1.5 rounded-lg text-[#6E645D] hover:bg-[#F4EFEA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="srv-name"
                  className="block text-xs font-medium text-[#1E1916] mb-1"
                >
                  Service Name *
                </label>
                <input
                  id="srv-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                />
              </div>

              <div>
                <label
                  htmlFor="srv-cat"
                  className="block text-xs font-medium text-[#1E1916] mb-1"
                >
                  Category
                </label>
                <select
                  id="srv-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                  className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
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
                    className="block text-xs font-medium text-[#1E1916] mb-1"
                  >
                    Price ({parlour.currency})
                  </label>
                  <input
                    id="srv-price"
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="srv-duration"
                    className="block text-xs font-medium text-[#1E1916] mb-1"
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
                    className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="srv-desc"
                  className="block text-xs font-medium text-[#1E1916] mb-1"
                >
                  Description
                </label>
                <textarea
                  id="srv-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-[#1E1916] mb-1.5">
                  Available Specialists
                </span>
                <div className="flex flex-wrap gap-2">
                  {staff.map((st) => {
                    const checked = selectedStaffIds.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className="inline-flex items-center gap-1.5 text-xs text-[#1E1916]"
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
                  className="px-4 py-2 rounded-lg border border-[#E8E0D8] text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#B85C6F] text-white text-sm font-medium hover:bg-[#A34D5F]"
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
