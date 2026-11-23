import React, { useState } from 'react';
import { Building2, ShieldCheck, Plus, LogIn, LogOut, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { ParlourTenant, TenantRole } from '../types/beauty';

interface TenantsViewProps {
  parlours: ParlourTenant[];
  activeParlourId: string;
  activeRole: TenantRole;
  firebaseUser: User | null;
  cloudConnected: boolean;
  onSelectParlour: (parlourId: string) => void;
  onChangeRole: (role: TenantRole) => void;
  onCreateParlour: (tenant: ParlourTenant) => void;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  onSyncActiveParlourToCloud: () => Promise<void>;
}

export const TenantsView: React.FC<TenantsViewProps> = ({
  parlours,
  activeParlourId,
  activeRole,
  firebaseUser,
  cloudConnected,
  onSelectParlour,
  onChangeRole,
  onCreateParlour,
  onSignInGoogle,
  onSignOut,
  onSyncActiveParlourToCloud,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [plan, setPlan] = useState<ParlourTenant['plan']>('Studio Pro');
  const [phone, setPhone] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) return;
    const id = `parlour_${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')}_${Date.now().toString().slice(-4)}`;
    onCreateParlour({
      id,
      name: name.trim(),
      city: city.trim(),
      plan,
      ownerUid: firebaseUser?.uid || 'demo_owner',
      ownerEmail: firebaseUser?.email || 'owner@studio.in',
      memberUids: [firebaseUser?.uid || 'demo_owner'],
      phone: phone.trim() || '+91 98200 00000',
      currency: '₹',
      taxRate: 18,
      status: 'active',
      monthlyRevenueTarget: 350000,
    });
    setModalOpen(false);
    setName('');
    setCity('');
    setPhone('');
  };

  const handleCloudProvision = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      await onSyncActiveParlourToCloud();
      setSyncMessage('Active parlour tenant & records synced to Firestore successfully.');
    } catch (err) {
      setSyncMessage(
        err instanceof Error ? err.message : 'Unable to sync parlour to Firestore.'
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#D91A6B] text-white flex items-center justify-center shadow-sm shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827]">
              Multi-Tenant SaaS &amp; Role Governance
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Switch between Super Admin, Parlour Owner, and Staff dashboards with strict per-tenant
              data isolation and Firestore authentication.
            </p>
          </div>
        </div>
        {activeRole === 'super_admin' && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D91A6B] text-white text-sm font-semibold hover:bg-[#BD145B] transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Onboard New Parlour
          </button>
        )}
      </div>

      {/* Firebase Authentication & Cloud Sync Card */}
      <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_18px_rgba(15,23,42,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>
              Firestore Database:{' '}
              <strong className="text-[#111827]">
                {cloudConnected ? 'Connected' : 'Preview Mode'}
              </strong>
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#111827]">
            {firebaseUser
              ? `Signed in as ${firebaseUser.displayName || firebaseUser.email}`
              : 'Sign in with Google for Live Multi-Tenant Cloud Persistence'}
          </h2>
          <p className="text-xs text-[#6B7280] max-w-2xl">
            {firebaseUser
              ? 'Your mutations synchronize to Firestore under strict tenant membership security rules.'
              : 'Currently running in seeded studio workspace preview. Sign in with Google to provision and persist your parlour tenant in Firestore.'}
          </p>
          {syncMessage && (
            <p className="text-xs font-medium text-[#D91A6B] pt-1">{syncMessage}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {firebaseUser ? (
            <>
              <button
                type="button"
                onClick={handleCloudProvision}
                disabled={syncing}
                className="px-4 py-2 rounded-xl bg-[#D91A6B] text-white text-xs font-semibold hover:bg-[#BD145B] disabled:opacity-50 whitespace-nowrap shadow-xs"
              >
                {syncing ? 'Syncing...' : 'Sync Active Parlour to Firestore'}
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#111827] hover:bg-[#F8FAFC] whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onSignInGoogle}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D91A6B] text-white text-xs font-semibold hover:bg-[#BD145B] whitespace-nowrap shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              Sign in with Google
            </button>
          )}
        </div>
      </section>

      {/* Active Role Switcher */}
      <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_18px_rgba(15,23,42,0.03)] space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-[#111827]">
            Active Role Perspective
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Verify role-based permissions across Super Admin, Parlour Owner, and Staff levels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              {
                role: 'super_admin' as TenantRole,
                title: 'Super Admin Dashboard',
                desc: 'Cross-tenant governance, onboard new parlour studios, and switch between isolated tenant accounts.',
              },
              {
                role: 'owner' as TenantRole,
                title: 'Parlour Owner Dashboard',
                desc: 'Full control of single-parlour customers, financial reports, services, billing, and staff management.',
              },
              {
                role: 'staff' as TenantRole,
                title: 'Staff Specialist Dashboard',
                desc: 'Focused daily workflow for appointments, AI skin scans, and POS invoices. Restricted from deleting records or editing catalog.',
              },
            ] as const
          ).map((item) => {
            const active = activeRole === item.role;
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => onChangeRole(item.role)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  active
                    ? 'border-[#D91A6B] bg-[#FDF0F6]'
                    : 'border-[#E5E7EB] bg-[#F8FAFC] hover:bg-[#F3F4F8]'
                }`}
              >
                <p className={`text-sm font-semibold ${active ? 'text-[#D91A6B]' : 'text-[#111827]'}`}>
                  {item.title}
                </p>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Isolated Parlour Tenants Directory */}
      <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_4px_18px_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[#111827]">
              Isolated Parlour Workspaces
            </h2>
            <p className="text-xs text-[#6B7280]">
              Each parlour owns an isolated customer directory, calendar, staff roster, and ledger.
            </p>
          </div>
          <span className="text-xs font-mono text-[#6B7280]">{parlours.length} tenants</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parlours.map((p) => {
            const isCurrent = p.id === activeParlourId;
            const lockedForNonSuper = activeRole !== 'super_admin' && !isCurrent;
            return (
              <div
                key={p.id}
                className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-colors ${
                  isCurrent
                    ? 'border-[#D91A6B] bg-[#FDF0F6]/50'
                    : 'border-[#E5E7EB] bg-[#F8FAFC]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#D91A6B] font-semibold">
                      <Building2 className="w-3.5 h-3.5" />
                      {p.plan} · {p.status}
                    </span>
                    <span className="font-mono text-[11px] text-[#6B7280]">{p.id}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#111827] mt-1">
                    {p.name}
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    {p.city} · Owner: {p.ownerEmail}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                  <span className="text-xs text-[#6B7280] font-mono">{p.phone}</span>
                  {isCurrent ? (
                    <span className="text-xs font-semibold text-[#D91A6B]">Active Workspace</span>
                  ) : (
                    <button
                      type="button"
                      disabled={lockedForNonSuper}
                      onClick={() => onSelectParlour(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#111827] hover:bg-[#F3F4F8] disabled:opacity-45 whitespace-nowrap"
                    >
                      {lockedForNonSuper ? 'Super Admin Only' : 'Switch Tenant'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tenant-modal-title"
        >
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="tenant-modal-title"
                className="font-display text-2xl font-bold text-[#111827]"
              >
                Onboard New Parlour Tenant
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close tenant modal"
                className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F4F8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label
                  htmlFor="ten-name"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  Parlour / Studio Name *
                </label>
                <input
                  id="ten-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D91A6B]/25 focus:border-[#D91A6B]"
                />
              </div>
              <div>
                <label
                  htmlFor="ten-city"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  City &amp; Neighbourhood *
                </label>
                <input
                  id="ten-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D91A6B]/25 focus:border-[#D91A6B]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="ten-plan"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    SaaS Plan
                  </label>
                  <select
                    id="ten-plan"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as ParlourTenant['plan'])}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D91A6B]/25 focus:border-[#D91A6B]"
                  >
                    <option value="Boutique">Boutique</option>
                    <option value="Studio Pro">Studio Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="ten-phone"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Contact Phone
                  </label>
                  <input
                    id="ten-phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                  Create Parlour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
