import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ScanFace,
  History,
  Sparkles,
  Calendar,
  Scissors,
  Receipt,
  MessageSquare,
  UserCheck,
  BarChart3,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  auth,
  deleteRecordFromFirestore,
  ensureParlourInFirestore,
  signInWithGoogle,
  signOutFirebase,
  syncRecordToFirestore,
  testConnection,
} from './lib/firebase';
import {
  SEED_APPOINTMENTS,
  SEED_COMMUNICATIONS,
  SEED_CUSTOMERS,
  SEED_INVOICES,
  SEED_PARLOURS,
  SEED_SERVICES,
  SEED_SKIN_SCANS,
  SEED_STAFF,
} from './data/seedData';
import type {
  Appointment,
  AppointmentStatus,
  AttendanceStatus,
  CommunicationLog,
  Customer,
  Invoice,
  NavTab,
  ParlourTenant,
  ServiceItem,
  SkinScanRecord,
  StaffProfile,
  TenantRole,
} from './types/beauty';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { SkinScannerView } from './components/SkinScannerView';
import { SkinProgressView } from './components/SkinProgressView';
import { AiAssistantView } from './components/AiAssistantView';
import { AppointmentsView } from './components/AppointmentsView';
import { ServicesView } from './components/ServicesView';
import { BillingView } from './components/BillingView';
import { CommunicationView } from './components/CommunicationView';
import { StaffView } from './components/StaffView';
import { ReportsView } from './components/ReportsView';
import { TenantsView } from './components/TenantsView';

const NAV_ITEMS: { id: NavTab; label: string; group: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Overview', group: 'Studio', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers CRM', group: 'Studio', icon: Users },
  { id: 'appointments', label: 'Appointments', group: 'Studio', icon: Calendar },
  { id: 'skin_scanner', label: 'AI Face Scanner', group: 'Skin Intelligence', icon: ScanFace },
  { id: 'skin_progress', label: 'Skin Progress', group: 'Skin Intelligence', icon: History },
  { id: 'ai_assistant', label: 'Beauty Assistant', group: 'Skin Intelligence', icon: Sparkles },
  { id: 'services', label: 'Services & Packages', group: 'Operations', icon: Scissors },
  { id: 'billing', label: 'Billing & POS', group: 'Operations', icon: Receipt },
  { id: 'communication', label: 'WhatsApp Care', group: 'Operations', icon: MessageSquare },
  { id: 'staff', label: 'Staff & Attendance', group: 'Management', icon: UserCheck },
  { id: 'reports', label: 'Reports & Analytics', group: 'Management', icon: BarChart3 },
  { id: 'tenants', label: 'Tenants & Roles', group: 'Management', icon: Building2 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firebase Auth & Firestore connectivity
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [cloudConnected, setCloudConnected] = useState(false);

  // Multi-tenant state (strictly isolated by activeParlourId in all views)
  const [parlours, setParlours] = useState<ParlourTenant[]>(SEED_PARLOURS);
  const [activeParlourId, setActiveParlourId] = useState<string>(SEED_PARLOURS[0].id);
  const [activeRole, setActiveRole] = useState<TenantRole>('owner');

  const [customers, setCustomers] = useState<Customer[]>(SEED_CUSTOMERS);
  const [services, setServices] = useState<ServiceItem[]>(SEED_SERVICES);
  const [appointments, setAppointments] = useState<Appointment[]>(SEED_APPOINTMENTS);
  const [staff, setStaff] = useState<StaffProfile[]>(SEED_STAFF);
  const [invoices, setInvoices] = useState<Invoice[]>(SEED_INVOICES);
  const [skinScans, setSkinScans] = useState<SkinScanRecord[]>(SEED_SKIN_SCANS);
  const [communications, setCommunications] = useState<CommunicationLog[]>(SEED_COMMUNICATIONS);

  const [preselectedScanCustomerId, setPreselectedScanCustomerId] = useState<string>('');
  const [preselectedMsgCustomerId, setPreselectedMsgCustomerId] = useState<string>('');
  const [authNotice, setAuthNotice] = useState<string>('');

  useEffect(() => {
    testConnection().then(setCloudConnected);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  const activeParlour = parlours.find((p) => p.id === activeParlourId) ?? parlours[0];

  // Tenant-isolated filtered slices
  const tenantCustomers = customers.filter((c) => c.parlourId === activeParlour.id);
  const tenantServices = services.filter((s) => s.parlourId === activeParlour.id);
  const tenantAppointments = appointments.filter((a) => a.parlourId === activeParlour.id);
  const tenantStaff = staff.filter((st) => st.parlourId === activeParlour.id);
  const tenantInvoices = invoices.filter((i) => i.parlourId === activeParlour.id);
  const tenantScans = skinScans.filter((sc) => sc.parlourId === activeParlour.id);
  const tenantComms = communications.filter((cm) => cm.parlourId === activeParlour.id);

  // Cloud sync helper when authenticated
  const getCloudMeta = () => ({
    ownerUid: firebaseUser?.uid || activeParlour.ownerUid,
    memberUids: [firebaseUser?.uid || activeParlour.ownerUid],
  });

  const handleSaveCustomer = (customer: Customer, isNew: boolean) => {
    setCustomers((prev) =>
      isNew ? [customer, ...prev] : prev.map((c) => (c.id === customer.id ? customer : c))
    );
    if (firebaseUser) {
      const meta = getCloudMeta();
      syncRecordToFirestore(
        activeParlour.id,
        'customers',
        customer.id,
        {
          parlourId: activeParlour.id,
          ownerUid: meta.ownerUid,
          memberUids: meta.memberUids,
          fullName: customer.fullName.slice(0, 120),
          phone: customer.phone.slice(0, 32),
          email: customer.email.slice(0, 160),
          dob: customer.dob.slice(0, 20),
          segment: customer.segment,
          preferences: customer.preferences.slice(0, 500),
          staffNotes: customer.staffNotes.slice(0, 1000),
          whatsappConsent: customer.whatsappConsent,
          registeredAt: customer.registeredAt,
          createdByUid: firebaseUser.uid,
        },
        isNew
      ).catch(console.error);
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    if (firebaseUser) {
      deleteRecordFromFirestore(activeParlour.id, 'customers', customerId).catch(console.error);
    }
  };

  const handleSaveAppointment = (appt: Appointment, isNew: boolean) => {
    setAppointments((prev) =>
      isNew ? [appt, ...prev] : prev.map((a) => (a.id === appt.id ? appt : a))
    );
    if (firebaseUser) {
      const meta = getCloudMeta();
      syncRecordToFirestore(
        activeParlour.id,
        'appointments',
        appt.id,
        {
          parlourId: activeParlour.id,
          ownerUid: meta.ownerUid,
          memberUids: meta.memberUids,
          customerId: appt.customerId,
          customerName: appt.customerName.slice(0, 120),
          serviceId: appt.serviceId,
          serviceName: appt.serviceName.slice(0, 120),
          staffId: appt.staffId,
          staffName: appt.staffName.slice(0, 100),
          date: appt.date,
          time: appt.time,
          durationMin: appt.durationMin,
          price: appt.price,
          status: appt.status,
          notes: (appt.notes ?? '').slice(0, 500),
        },
        isNew
      ).catch(console.error);
    }
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status } : a))
    );
    if (firebaseUser) {
      syncRecordToFirestore(
        activeParlour.id,
        'appointments',
        appointmentId,
        { status },
        false
      ).catch(console.error);
    }
  };

  const handleSaveService = (service: ServiceItem, isNew: boolean) => {
    setServices((prev) =>
      isNew ? [service, ...prev] : prev.map((s) => (s.id === service.id ? service : s))
    );
    if (firebaseUser) {
      const meta = getCloudMeta();
      syncRecordToFirestore(
        activeParlour.id,
        'services',
        service.id,
        {
          parlourId: activeParlour.id,
          ownerUid: meta.ownerUid,
          memberUids: meta.memberUids,
          name: service.name.slice(0, 120),
          description: service.description.slice(0, 500),
          category: service.category,
          price: service.price,
          durationMin: service.durationMin,
          active: service.active,
        },
        isNew
      ).catch(console.error);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    if (firebaseUser) {
      deleteRecordFromFirestore(activeParlour.id, 'services', serviceId).catch(console.error);
    }
  };

  const handleCreateInvoice = (invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
    if (firebaseUser) {
      const meta = getCloudMeta();
      syncRecordToFirestore(
        activeParlour.id,
        'invoices',
        invoice.id,
        {
          parlourId: activeParlour.id,
          ownerUid: meta.ownerUid,
          memberUids: meta.memberUids,
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          customerName: invoice.customerName.slice(0, 120),
          subtotal: invoice.subtotal,
          discount: invoice.discount,
          taxAmount: invoice.taxAmount,
          total: invoice.total,
          paymentMethod: invoice.paymentMethod,
          paymentStatus: invoice.paymentStatus,
          issuedAt: invoice.issuedAt,
        },
        true
      ).catch(console.error);
    }
  };

  const handleMarkInvoicePaid = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, paymentStatus: 'Paid' } : inv))
    );
    if (firebaseUser) {
      syncRecordToFirestore(
        activeParlour.id,
        'invoices',
        invoiceId,
        { paymentStatus: 'Paid' },
        false
      ).catch(console.error);
    }
  };

  const handleSaveStaff = (member: StaffProfile, isNew: boolean) => {
    setStaff((prev) =>
      isNew ? [...prev, member] : prev.map((s) => (s.id === member.id ? member : s))
    );
    if (firebaseUser) {
      const meta = getCloudMeta();
      syncRecordToFirestore(
        activeParlour.id,
        'staff',
        member.id,
        {
          parlourId: activeParlour.id,
          ownerUid: meta.ownerUid,
          memberUids: meta.memberUids,
          name: member.name.slice(0, 100),
          role: member.role,
          phone: member.phone.slice(0, 32),
          attendanceStatus: member.attendanceStatus,
          completedCount: member.completedCount,
          rating: member.rating,
        },
        isNew
      ).catch(console.error);
    }
  };

  const handleUpdateAttendance = (staffId: string, status: AttendanceStatus) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, attendanceStatus: status } : s))
    );
    if (firebaseUser) {
      syncRecordToFirestore(
        activeParlour.id,
        'staff',
        staffId,
        { attendanceStatus: status },
        false
      ).catch(console.error);
    }
  };

  const handleSaveSkinScan = (record: SkinScanRecord) => {
    setSkinScans((prev) => [...prev, record]);
    if (firebaseUser) {
      const meta = getCloudMeta();
      syncRecordToFirestore(
        activeParlour.id,
        'skinScans',
        record.id,
        {
          parlourId: activeParlour.id,
          ownerUid: meta.ownerUid,
          memberUids: meta.memberUids,
          customerId: record.customerId,
          customerName: record.customerName.slice(0, 120),
          scanDate: record.scanDate,
          lightingCondition: record.lightingCondition.slice(0, 120),
          summary: record.summary.slice(0, 2000),
          suggestedFollowUpDate: record.suggestedFollowUpDate,
          staffObservations: record.staffObservations.slice(0, 1000),
          treatmentsReceived: record.treatmentsReceived.slice(0, 500),
          productsUsed: record.productsUsed.slice(0, 500),
        },
        true
      ).catch(console.error);
    }
  };

  const handleLogCommunication = (entry: CommunicationLog) => {
    setCommunications((prev) => [entry, ...prev]);
    if (firebaseUser) {
      const meta = getCloudMeta();
      syncRecordToFirestore(
        activeParlour.id,
        'communications',
        entry.id,
        {
          parlourId: activeParlour.id,
          ownerUid: meta.ownerUid,
          memberUids: meta.memberUids,
          customerId: entry.customerId,
          customerName: entry.customerName.slice(0, 120),
          channel: entry.channel,
          campaignType: entry.campaignType,
          message: entry.message.slice(0, 1500),
          consentVerified: entry.consentVerified,
          sentAt: entry.sentAt,
        },
        true
      ).catch(console.error);
    }
  };

  const handleCreateParlour = (tenant: ParlourTenant) => {
    setParlours((prev) => [...prev, tenant]);
    setActiveParlourId(tenant.id);
    if (firebaseUser) {
      ensureParlourInFirestore(
        tenant,
        firebaseUser.uid,
        firebaseUser.email || '',
        firebaseUser.displayName || 'Studio Owner'
      ).catch(console.error);
    }
  };

  const handleSyncActiveParlour = async () => {
    if (!firebaseUser) return;
    await ensureParlourInFirestore(
      activeParlour,
      firebaseUser.uid,
      firebaseUser.email || '',
      firebaseUser.displayName || 'Studio Owner'
    );
    for (const c of tenantCustomers) {
      await syncRecordToFirestore(
        activeParlour.id,
        'customers',
        c.id,
        {
          parlourId: activeParlour.id,
          ownerUid: firebaseUser.uid,
          memberUids: [firebaseUser.uid],
          fullName: c.fullName.slice(0, 120),
          phone: c.phone.slice(0, 32),
          email: c.email.slice(0, 160),
          dob: c.dob.slice(0, 20),
          segment: c.segment,
          preferences: c.preferences.slice(0, 500),
          staffNotes: c.staffNotes.slice(0, 1000),
          whatsappConsent: c.whatsappConsent,
          registeredAt: c.registeredAt,
          createdByUid: firebaseUser.uid,
        },
        true
      );
    }
  };

  const handleSignIn = async () => {
    setAuthNotice('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthNotice(err instanceof Error ? err.message : 'Google sign-in popup was closed.');
    }
  };

  const navigateTo = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const groups = ['Studio', 'Skin Intelligence', 'Operations', 'Management'];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#FAF8F6] text-[#1E1916] flex flex-col lg:flex-row">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white border-r border-[#E8E0D8] min-h-screen sticky top-0 h-screen">
          <div className="px-6 py-5 border-b border-[#EAE3DC]">
            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="font-display text-2xl font-semibold tracking-tight text-[#1E1916] whitespace-nowrap"
            >
              BeautyOS
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Studio modules">
            {groups.map((grp) => (
              <div key={grp}>
                <p className="px-3 text-[11px] font-semibold text-[#8A7F77] mb-1.5">{grp}</p>
                <div className="space-y-0.5">
                  {NAV_ITEMS.filter((item) => item.group === grp).map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateTo(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-[#F9EFF1] text-[#B85C6F]'
                            : 'text-[#6E645D] hover:bg-[#FAF8F6] hover:text-[#1E1916]'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Tenant & Role Footer Summary */}
          <div className="p-4 border-t border-[#EAE3DC] bg-[#FAF8F6] space-y-1.5 text-xs">
            <p className="font-medium text-[#1E1916] truncate">{activeParlour.name}</p>
            <p className="text-[11px] text-[#6E645D] truncate">
              Role:{' '}
              {activeRole === 'super_admin'
                ? 'Super Admin'
                : activeRole === 'owner'
                ? 'Parlour Owner'
                : 'Staff Specialist'}
            </p>
            <button
              type="button"
              onClick={() => navigateTo('tenants')}
              className="text-[11px] font-medium text-[#B85C6F] hover:underline"
            >
              {firebaseUser ? 'Cloud Sync Active' : 'Manage Tenants & Cloud'}
            </button>
          </div>
        </aside>

        {/* Main Shell */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 3-Zone Top Header Bar */}
          <header className="bg-white border-b border-[#E8E0D8] px-4 sm:px-8 h-16 flex items-center justify-between gap-8 sticky top-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 rounded-lg border border-[#E8E0D8] text-[#1E1916] min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <Menu className="w-4 h-4" />
              </button>
              <span className="font-display text-xl font-semibold text-[#1E1916] whitespace-nowrap shrink-0 lg:hidden">
                BeautyOS
              </span>
              <span className="hidden lg:inline text-sm font-medium text-[#1E1916] whitespace-nowrap truncate">
                {activeParlour.name}
              </span>
            </div>

            <nav
              className="hidden md:flex items-center gap-6 text-sm font-medium text-[#6E645D]"
              aria-label="Primary shortcuts"
            >
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className={`hover:text-[#1E1916] whitespace-nowrap shrink-0 ${
                  activeTab === 'dashboard' ? 'text-[#1E1916] underline underline-offset-4' : ''
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => navigateTo('customers')}
                className={`hover:text-[#1E1916] whitespace-nowrap shrink-0 ${
                  activeTab === 'customers' ? 'text-[#1E1916] underline underline-offset-4' : ''
                }`}
              >
                Clients
              </button>
              <button
                type="button"
                onClick={() => navigateTo('skin_scanner')}
                className={`hover:text-[#1E1916] whitespace-nowrap shrink-0 ${
                  activeTab === 'skin_scanner' ? 'text-[#1E1916] underline underline-offset-4' : ''
                }`}
              >
                AI Skin Scan
              </button>
              <button
                type="button"
                onClick={() => navigateTo('billing')}
                className={`hover:text-[#1E1916] whitespace-nowrap shrink-0 ${
                  activeTab === 'billing' ? 'text-[#1E1916] underline underline-offset-4' : ''
                }`}
              >
                Billing
              </button>
            </nav>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => navigateTo('appointments')}
                className="px-4 py-2 rounded-lg bg-[#B85C6F] text-white text-xs font-medium hover:bg-[#A34D5F] transition-colors whitespace-nowrap shrink-0"
              >
                Book Visit
              </button>
            </div>
          </header>

          {authNotice && (
            <div className="mx-4 sm:mx-8 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <span>{authNotice}</span>
              <button
                type="button"
                onClick={() => setAuthNotice('')}
                className="underline font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Main Content Viewport */}
          <main className="flex-1 p-4 sm:p-8 max-w-[1320px] w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                parlour={activeParlour}
                customers={tenantCustomers}
                appointments={tenantAppointments}
                invoices={tenantInvoices}
                staff={tenantStaff}
                skinScans={tenantScans}
                onNavigate={navigateTo}
                onOpenNewAppointment={() => navigateTo('appointments')}
                onOpenNewCustomer={() => navigateTo('customers')}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView
                parlour={activeParlour}
                role={activeRole}
                customers={tenantCustomers}
                appointments={tenantAppointments}
                skinScans={tenantScans}
                onSaveCustomer={handleSaveCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onSelectCustomerForScan={(id) => setPreselectedScanCustomerId(id)}
                onSelectCustomerForMessage={(id) => setPreselectedMsgCustomerId(id)}
                onNavigate={navigateTo}
              />
            )}

            {activeTab === 'skin_scanner' && (
              <SkinScannerView
                parlour={activeParlour}
                customers={tenantCustomers}
                services={tenantServices}
                preselectedCustomerId={preselectedScanCustomerId}
                onSaveSkinScan={handleSaveSkinScan}
              />
            )}

            {activeTab === 'skin_progress' && (
              <SkinProgressView customers={tenantCustomers} skinScans={tenantScans} />
            )}

            {activeTab === 'ai_assistant' && (
              <AiAssistantView customers={tenantCustomers} skinScans={tenantScans} />
            )}

            {activeTab === 'appointments' && (
              <AppointmentsView
                parlour={activeParlour}
                appointments={tenantAppointments}
                customers={tenantCustomers}
                services={tenantServices}
                staff={tenantStaff}
                onSaveAppointment={handleSaveAppointment}
                onUpdateStatus={handleUpdateAppointmentStatus}
              />
            )}

            {activeTab === 'services' && (
              <ServicesView
                parlour={activeParlour}
                role={activeRole}
                services={tenantServices}
                staff={tenantStaff}
                onSaveService={handleSaveService}
                onDeleteService={handleDeleteService}
              />
            )}

            {activeTab === 'billing' && (
              <BillingView
                parlour={activeParlour}
                invoices={tenantInvoices}
                customers={tenantCustomers}
                services={tenantServices}
                onCreateInvoice={handleCreateInvoice}
                onMarkInvoicePaid={handleMarkInvoicePaid}
              />
            )}

            {activeTab === 'communication' && (
              <CommunicationView
                parlour={activeParlour}
                customers={tenantCustomers}
                communications={tenantComms}
                preselectedCustomerId={preselectedMsgCustomerId}
                onLogCommunication={handleLogCommunication}
              />
            )}

            {activeTab === 'staff' && (
              <StaffView
                parlour={activeParlour}
                role={activeRole}
                staff={tenantStaff}
                appointments={tenantAppointments}
                onSaveStaff={handleSaveStaff}
                onUpdateAttendance={handleUpdateAttendance}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                parlour={activeParlour}
                customers={tenantCustomers}
                appointments={tenantAppointments}
                invoices={tenantInvoices}
                staff={tenantStaff}
              />
            )}

            {activeTab === 'tenants' && (
              <TenantsView
                parlours={parlours}
                activeParlourId={activeParlour.id}
                activeRole={activeRole}
                firebaseUser={firebaseUser}
                cloudConnected={cloudConnected}
                onSelectParlour={(id) => setActiveParlourId(id)}
                onChangeRole={(r) => setActiveRole(r)}
                onCreateParlour={handleCreateParlour}
                onSignInGoogle={handleSignIn}
                onSignOut={signOutFirebase}
                onSyncActiveParlourToCloud={handleSyncActiveParlour}
              />
            )}
          </main>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-white h-full border-r border-[#E8E0D8] flex flex-col z-10">
              <div className="px-5 py-4 border-b border-[#EAE3DC] flex items-center justify-between">
                <span className="font-display text-2xl font-semibold text-[#1E1916]">
                  BeautyOS
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-2 rounded-lg text-[#6E645D]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                        active ? 'bg-[#F9EFF1] text-[#B85C6F]' : 'text-[#1E1916]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
