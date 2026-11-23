import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateInvoiceTotals,
  canPerformRoleAction,
  computeDashboardMetrics,
  filterCustomers,
  validateWhatsappDispatch,
} from './analytics';
import type { Appointment, Customer, Invoice } from '../types/beauty';

test('calculateInvoiceTotals handles services, products, discount clamping, and GST tax', () => {
  const result = calculateInvoiceTotals(
    [
      { id: '1', label: 'Hydra Botanical Facial', kind: 'Service', qty: 1, unitPrice: 3200 },
      { id: '2', label: 'Barrier Recovery Serum', kind: 'Product', qty: 2, unitPrice: 1400 },
    ],
    500,
    18
  );
  assert.equal(result.subtotal, 6000);
  assert.equal(result.discount, 500);
  assert.equal(result.taxAmount, 990); // 18% of 5500
  assert.equal(result.total, 6490);

  // Discount cannot exceed subtotal
  const clamped = calculateInvoiceTotals(
    [{ id: '1', label: 'Cleanup', kind: 'Service', qty: 1, unitPrice: 1000 }],
    5000,
    10
  );
  assert.equal(clamped.discount, 1000);
  assert.equal(clamped.total, 0);
});

test('computeDashboardMetrics aggregates revenue, pending payments, and retention rate accurately', () => {
  const customers: Customer[] = [
    {
      id: 'c1',
      parlourId: 'p1',
      fullName: 'Ananya Sharma',
      phone: '+91 98201 11223',
      email: 'ananya@example.com',
      dob: '1994-05-12',
      registeredAt: '2026-11-02',
      segment: 'New',
      preferences: 'Fragrance-free',
      staffNotes: '',
      whatsappConsent: true,
      treatmentHistory: [],
      productPurchases: [],
      totalSpent: 3200,
      visitCount: 1,
      lastVisitDate: '2026-11-18',
    },
    {
      id: 'c2',
      parlourId: 'p1',
      fullName: 'Meera Kapoor',
      phone: '+91 98201 44556',
      email: 'meera@example.com',
      dob: '1990-09-20',
      registeredAt: '2025-08-10',
      segment: 'VIP',
      preferences: 'Gentle exfoliation',
      staffNotes: '',
      whatsappConsent: true,
      treatmentHistory: [],
      productPurchases: [],
      totalSpent: 18500,
      visitCount: 6,
      lastVisitDate: '2026-11-21',
    },
  ];

  const appointments: Appointment[] = [
    {
      id: 'a1',
      parlourId: 'p1',
      customerId: 'c1',
      customerName: 'Ananya Sharma',
      serviceId: 's1',
      serviceName: 'Luminous Glass Skin Facial',
      staffId: 'st1',
      staffName: 'Dr.Kavya Nair',
      date: '2026-11-22',
      time: '11:00',
      durationMin: 60,
      price: 3500,
      status: 'Confirmed',
    },
    {
      id: 'a2',
      parlourId: 'p1',
      customerId: 'c2',
      customerName: 'Meera Kapoor',
      serviceId: 's1',
      serviceName: 'Luminous Glass Skin Facial',
      staffId: 'st1',
      staffName: 'Dr.Kavya Nair',
      date: '2026-11-22',
      time: '14:00',
      durationMin: 60,
      price: 3500,
      status: 'Cancelled',
    },
  ];

  const invoices: Invoice[] = [
    {
      id: 'i1',
      parlourId: 'p1',
      invoiceNumber: 'INV-101',
      customerId: 'c2',
      customerName: 'Meera Kapoor',
      items: [],
      subtotal: 4000,
      discount: 0,
      taxAmount: 720,
      total: 4720,
      paymentMethod: 'UPI',
      paymentStatus: 'Paid',
      issuedAt: '2026-11-21',
    },
    {
      id: 'i2',
      parlourId: 'p1',
      invoiceNumber: 'INV-102',
      customerId: 'c1',
      customerName: 'Ananya Sharma',
      items: [],
      subtotal: 2000,
      discount: 0,
      taxAmount: 360,
      total: 2360,
      paymentMethod: 'Card',
      paymentStatus: 'Pending',
      issuedAt: '2026-11-22',
    },
  ];

  const metrics = computeDashboardMetrics(customers, appointments, invoices, '2026-11-22', '2026-11');
  assert.equal(metrics.totalCustomers, 2);
  assert.equal(metrics.newCustomersThisMonth, 1);
  assert.equal(metrics.returningCustomers, 1);
  assert.equal(metrics.todaysAppointments, 1); // Cancelled excluded
  assert.equal(metrics.monthlyRevenue, 4720);
  assert.equal(metrics.pendingPayments, 2360);
  assert.equal(metrics.retentionRate, 50);
  assert.equal(metrics.popularTreatments[0]?.name, 'Luminous Glass Skin Facial');
});

test('filterCustomers matches query and segment accurately', () => {
  const sample: Customer[] = [
    {
      id: '1',
      parlourId: 'p1',
      fullName: 'Riya Verma',
      phone: '9990011223',
      email: 'riya@mail.com',
      dob: '1996-01-01',
      registeredAt: '2026-01-01',
      segment: 'VIP',
      preferences: 'Rosewater mist',
      staffNotes: '',
      whatsappConsent: true,
      treatmentHistory: [],
      productPurchases: [],
      totalSpent: 9000,
      visitCount: 4,
      lastVisitDate: '2026-11-10',
    },
    {
      id: '2',
      parlourId: 'p1',
      fullName: 'Sanya Malhotra',
      phone: '8880022334',
      email: 'sanya@mail.com',
      dob: '1993-04-12',
      registeredAt: '2026-11-05',
      segment: 'New',
      preferences: 'Sensitive skin',
      staffNotes: '',
      whatsappConsent: false,
      treatmentHistory: [],
      productPurchases: [],
      totalSpent: 1500,
      visitCount: 1,
      lastVisitDate: '2026-11-05',
    },
  ];

  assert.equal(filterCustomers(sample, 'riya', 'All').length, 1);
  assert.equal(filterCustomers(sample, '', 'VIP').length, 1);
  assert.equal(filterCustomers(sample, 'sanya', 'VIP').length, 0);
});

test('RBAC role permissions and WhatsApp consent enforcement work strictly', () => {
  assert.equal(canPerformRoleAction('super_admin', 'create_tenant'), true);
  assert.equal(canPerformRoleAction('owner', 'create_tenant'), false);
  assert.equal(canPerformRoleAction('owner', 'delete_customer'), true);
  assert.equal(canPerformRoleAction('staff', 'delete_customer'), false);
  assert.equal(canPerformRoleAction('staff', 'book_appointment'), true);

  const blocked = validateWhatsappDispatch(
    { fullName: 'Sanya', phone: '9876543210', whatsappConsent: false },
    'Hello Sanya'
  );
  assert.equal(blocked.allowed, false);

  const allowed = validateWhatsappDispatch(
    { fullName: 'Riya', phone: '9876543210', whatsappConsent: true },
    'Your appointment is confirmed.'
  );
  assert.equal(allowed.allowed, true);
});
