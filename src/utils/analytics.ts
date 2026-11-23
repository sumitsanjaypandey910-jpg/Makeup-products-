import type {
  Appointment,
  Customer,
  CustomerSegment,
  Invoice,
  InvoiceLineItem,
  StaffProfile,
  TenantRole,
} from '../types/beauty';

export function formatCurrency(amount: number, currency = '₹'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${currency}${safe.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function calculateInvoiceTotals(
  items: InvoiceLineItem[],
  discountAmount: number,
  taxRatePercent: number
): { subtotal: number; discount: number; taxAmount: number; total: number } {
  const subtotal = items.reduce((sum, item) => {
    const qty = Math.max(0, Number(item.qty) || 0);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    return sum + qty * price;
  }, 0);

  const clampedDiscount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  const taxableBase = Math.max(0, subtotal - clampedDiscount);
  const safeTaxRate = Math.min(40, Math.max(0, Number(taxRatePercent) || 0));
  const taxAmount = Math.round((taxableBase * safeTaxRate) / 100);
  const total = taxableBase + taxAmount;

  return {
    subtotal,
    discount: clampedDiscount,
    taxAmount,
    total,
  };
}

export function filterCustomers(
  customers: Customer[],
  searchQuery: string,
  segmentFilter: CustomerSegment | 'All'
): Customer[] {
  const q = searchQuery.trim().toLowerCase();
  return customers.filter((customer) => {
    const matchesSegment = segmentFilter === 'All' || customer.segment === segmentFilter;
    if (!matchesSegment) return false;
    if (!q) return true;
    return (
      customer.fullName.toLowerCase().includes(q) ||
      customer.phone.toLowerCase().includes(q) ||
      customer.email.toLowerCase().includes(q) ||
      customer.preferences.toLowerCase().includes(q)
    );
  });
}

export interface DashboardMetrics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  returningCustomers: number;
  todaysAppointments: number;
  monthlyRevenue: number;
  pendingPayments: number;
  retentionRate: number;
  popularTreatments: { name: string; count: number; revenue: number }[];
  revenueByServiceCategory: { category: string; revenue: number; count: number }[];
}

export function computeDashboardMetrics(
  customers: Customer[],
  appointments: Appointment[],
  invoices: Invoice[],
  todayDate: string,
  currentMonthPrefix: string
): DashboardMetrics {
  const totalCustomers = customers.length;
  const newCustomersThisMonth = customers.filter((c) =>
    c.registeredAt.startsWith(currentMonthPrefix)
  ).length;
  const returningCustomers = customers.filter((c) => c.visitCount > 1).length;

  const todaysAppointments = appointments.filter(
    (a) => a.date === todayDate && a.status !== 'Cancelled'
  ).length;

  const monthlyRevenue = invoices
    .filter((inv) => inv.issuedAt.startsWith(currentMonthPrefix) && inv.paymentStatus === 'Paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const pendingPayments = invoices
    .filter((inv) => inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Partial')
    .reduce((sum, inv) => sum + inv.total, 0);

  const retentionRate =
    totalCustomers > 0 ? Math.round((returningCustomers / totalCustomers) * 100) : 0;

  const treatmentMap = new Map<string, { count: number; revenue: number }>();
  for (const appt of appointments) {
    if (appt.status === 'Cancelled') continue;
    const prev = treatmentMap.get(appt.serviceName) ?? { count: 0, revenue: 0 };
    treatmentMap.set(appt.serviceName, {
      count: prev.count + 1,
      revenue: prev.revenue + appt.price,
    });
  }

  const popularTreatments = Array.from(treatmentMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
    .slice(0, 5);

  const revenueByServiceCategory = popularTreatments.map((t) => ({
    category: t.name,
    revenue: t.revenue,
    count: t.count,
  }));

  return {
    totalCustomers,
    newCustomersThisMonth,
    returningCustomers,
    todaysAppointments,
    monthlyRevenue,
    pendingPayments,
    retentionRate,
    popularTreatments,
    revenueByServiceCategory,
  };
}

export function computeStaffLeaderboard(
  staffList: StaffProfile[],
  appointments: Appointment[]
): StaffProfile[] {
  return staffList
    .map((member) => {
      const assigned = appointments.filter((a) => a.staffId === member.id && a.status !== 'Cancelled').length;
      const completedInSession = appointments.filter(
        (a) => a.staffId === member.id && a.status === 'Completed'
      ).length;
      return {
        ...member,
        assignedAppointments: Math.max(member.assignedAppointments, assigned),
        completedCount: Math.max(member.completedCount, completedInSession),
      };
    })
    .sort((a, b) => b.revenueGenerated - a.revenueGenerated);
}

export type ProtectedAction =
  | 'delete_customer'
  | 'manage_services'
  | 'manage_staff'
  | 'view_all_tenants'
  | 'create_tenant'
  | 'book_appointment'
  | 'create_invoice';

export function canPerformRoleAction(role: TenantRole, action: ProtectedAction): boolean {
  if (role === 'super_admin') return true;
  if (role === 'owner') {
    return action !== 'view_all_tenants' && action !== 'create_tenant';
  }
  // Staff permissions
  return action === 'book_appointment' || action === 'create_invoice';
}

export function validateWhatsappDispatch(
  customer: Pick<Customer, 'whatsappConsent' | 'phone' | 'fullName'>,
  message: string
): { allowed: boolean; reason?: string } {
  if (!customer.whatsappConsent) {
    return {
      allowed: false,
      reason: `${customer.fullName} has not granted WhatsApp communication consent.`,
    };
  }
  if (!customer.phone.trim()) {
    return { allowed: false, reason: 'Customer phone number is missing.' };
  }
  if (!message.trim()) {
    return { allowed: false, reason: 'Message text cannot be empty.' };
  }
  return { allowed: true };
}
