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
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#1E1916]">
            Multi-Tenant SaaS &amp; Role Governance
          </h1>
          <p className="text-sm text-[#6E645D] mt-1">
            Switch between Super Admin, Parlour Owner, and Staff dashboards with strict per-tenant
            data isolation and Firestore authentication.
          </p>
        </div>
        {activeRole === 'super_admin' && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B85C6F] text-white text-sm font-medium hover:bg-[#A34D5F] whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Onboard New Parlour
          </button>
        )}
      </div>

      {/* Firebase Authentication & Cloud Sync Card */}
      <section className="bg-white border border-[#E8E0D8] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#6E645D]">
            <ShieldCheck className="w-4 h-4 text-[#B08B4F]" />
            <span>
              Firestore Database:{' '}
              <strong className="text-[#1E1916]">
                {cloudConnected ? 'Connected' : 'Preview Mode'}
              </strong>
            </span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-[#1E1916]">
            {firebaseUser
              ? `Signed in as ${firebaseUser.displayName || firebaseUser.email}`
              : 'Sign in with Google for Live Multi-Tenant Cloud Persistence'}
          </h2>
          <p className="text-xs text-[#6E645D] max-w-2xl">
            {firebaseUser
              ? 'Your mutations synchronize to Firestore under strict tenant membership security rules.'
              : 'Currently running in seeded studio workspace preview. Sign in with Google to provision and persist your parlour tenant in Firestore.'}
          </p>
          {syncMessage && (
            <p className="text-xs font-medium text-[#B85C6F] pt-1">{syncMessage}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {firebaseUser ? (
            <>
              <button
                type="button"
                onClick={handleCloudProvision}
                disabled={syncing}
                className="px-4 py-2 rounded-lg bg-[#B85C6F] text-white text-xs font-medium hover:bg-[#A34D5F] disabled:opacity-50 whitespace-nowrap"
              >
                {syncing ? 'Syncing...' : 'Sync Active Parlour to Firestore'}
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8E0D8] text-xs font-medium text-[#1E1916] hover:bg-[#FAF8F6] whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onSignInGoogle}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B85C6F] text-white text-xs font-medium hover:bg-[#A34D5F] whitespace-nowrap"
            >
              <LogIn className="w-4 h-4" />
              Sign in with Google
            </button>
          )}
        </div>
      </section>

      {/* Active Role Switcher */}
      <section className="bg-white border border-[#E8E0D8] rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#1E1916]">
            Active Role Perspective
          </h2>
          <p className="text-xs text-[#6E645D] mt-0.5">
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
                    ? 'border-[#B85C6F] bg-[#F9EFF1]/60'
                    : 'border-[#E8E0D8] bg-[#FAF8F6] hover:bg-[#F4EFEA]'
                }`}
              >
                <p className="text-sm font-semibold text-[#1E1916]">{item.title}</p>
                <p className="text-xs text-[#6E645D] mt-1 leading-relaxed">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Isolated Parlour Tenants Directory */}
      <section className="bg-white border border-[#E8E0D8] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#1E1916]">
              Isolated Parlour Workspaces
            </h2>
            <p className="text-xs text-[#6E645D]">
              Each parlour owns an isolated customer directory, calendar, staff roster, and ledger.
            </p>
          </div>
          <span className="text-xs font-mono text-[#6E645D]">{parlours.length} tenants</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parlours.map((p) => {
            const isCurrent = p.id === activeParlourId;
            const lockedForNonSuper = activeRole !== 'super_admin' && !isCurrent;
            return (
              <div
                key={p.id}
                className={`p-5 rounded-xl border flex flex-col justify-between gap-4 ${
                  isCurrent
                    ? 'border-[#B85C6F] bg-[#F9EFF1]/40'
                    : 'border-[#E8E0D8] bg-[#FAF8F6]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#B08B4F] font-medium">
                      <Building2 className="w-3.5 h-3.5" />
                      {p.plan} · {p.status}
                    </span>
                    <span className="font-mono text-[11px] text-[#6E645D]">{p.id}</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#1E1916] mt-1">
                    {p.name}
                  </h3>
                  <p className="text-xs text-[#6E645D]">
                    {p.city} · Owner: {p.ownerEmail}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#EAE3DC]">
                  <span className="text-xs text-[#6E645D] font-mono">{p.phone}</span>
                  {isCurrent ? (
                    <span className="text-xs font-semibold text-[#B85C6F]">Active Workspace</span>
                  ) : (
                    <button
                      type="button"
                      disabled={lockedForNonSuper}
                      onClick={() => onSelectParlour(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#E8E0D8] text-xs font-medium text-[#1E1916] hover:bg-[#F4EFEA] disabled:opacity-45"
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
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tenant-modal-title"
        >
          <div className="bg-white border border-[#E8E0D8] rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="tenant-modal-title"
                className="font-display text-2xl font-semibold text-[#1E1916]"
              >
                Onboard New Parlour Tenant
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close tenant modal"
                className="p-1.5 rounded-lg text-[#6E645D] hover:bg-[#F4EFEA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label
                  htmlFor="ten-name"
                  className="block text-xs font-medium text-[#1E1916] mb-1"
                >
                  Parlour / Studio Name *
                </label>
                <input
                  id="ten-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                />
              </div>
              <div>
                <label
                  htmlFor="ten-city"
                  className="block text-xs font-medium text-[#1E1916] mb-1"
                >
                  City &amp; Neighbourhood *
                </label>
                <input
                  id="ten-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="ten-plan"
                    className="block text-xs font-medium text-[#1E1916] mb-1"
                  >
                    SaaS Plan
                  </label>
                  <select
                    id="ten-plan"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as ParlourTenant['plan'])}
                    className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                  >
                    <option value="Boutique">Boutique</option>
                    <option value="Studio Pro">Studio Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="ten-phone"
                    className="block text-xs font-medium text-[#1E1916] mb-1"
                  >
                    Contact Phone
                  </label>
                  <input
                    id="ten-phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                  />
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
