import React, { useState } from 'react';
import { Plus, Check, X, Receipt } from 'lucide-react';
import type {
  Customer,
  Invoice,
  InvoiceLineItem,
  ParlourTenant,
  PaymentMethod,
  PaymentStatus,
  ServiceItem,
} from '../types/beauty';
import { calculateInvoiceTotals, formatCurrency } from '../utils/analytics';

interface BillingViewProps {
  parlour: ParlourTenant;
  invoices: Invoice[];
  customers: Customer[];
  services: ServiceItem[];
  onCreateInvoice: (invoice: Invoice) => void;
  onMarkInvoicePaid: (invoiceId: string) => void;
}

const RETAIL_PRODUCTS = [
  { name: 'Ceramide Cloud Recovery Cream 50ml', price: 2450 },
  { name: 'Mineral Dew SPF 50 Fluid', price: 1650 },
  { name: 'Rosehip & Squalane Elixir', price: 1950 },
  { name: 'Oat Amino Gentle Cleanser', price: 1200 },
];

export const BillingView: React.FC<BillingViewProps> = ({
  parlour,
  invoices,
  customers,
  services,
  onCreateInvoice,
  onMarkInvoicePaid,
}) => {
  const [periodView, setPeriodView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [modalOpen, setModalOpen] = useState(false);

  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? '');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');

  const today = '2026-11-22';
  const filteredInvoices = invoices.filter((inv) => {
    if (periodView === 'daily') return inv.issuedAt === today;
    if (periodView === 'weekly') return inv.issuedAt >= '2026-11-16';
    return inv.issuedAt.startsWith('2026-11');
  });

  const collectedTotal = filteredInvoices
    .filter((i) => i.paymentStatus === 'Paid')
    .reduce((s, i) => s + i.total, 0);
  const pendingTotal = filteredInvoices
    .filter((i) => i.paymentStatus !== 'Paid')
    .reduce((s, i) => s + i.total, 0);

  const buildDraftItems = (): InvoiceLineItem[] => {
    const items: InvoiceLineItem[] = [];
    const srv = services.find((s) => s.id === selectedServiceId);
    if (srv) {
      items.push({
        id: `li_${srv.id}`,
        label: srv.name,
        kind: 'Service',
        qty: 1,
        unitPrice: srv.price,
      });
    }
    const prod = RETAIL_PRODUCTS.find((p) => p.name === selectedProduct);
    if (prod) {
      items.push({
        id: `li_prod_${Date.now()}`,
        label: prod.name,
        kind: 'Product',
        qty: 1,
        unitPrice: prod.price,
      });
    }
    return items;
  };

  const draftItems = buildDraftItems();
  const totals = calculateInvoiceTotals(draftItems, discount, parlour.taxRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    if (!cust || draftItems.length === 0) return;

    const invoice: Invoice = {
      id: `inv_${Date.now()}`,
      parlourId: parlour.id,
      invoiceNumber: `INV-2026-${Math.floor(2100 + Math.random() * 800)}`,
      customerId: cust.id,
      customerName: cust.fullName,
      items: draftItems,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxAmount: totals.taxAmount,
      total: totals.total,
      paymentMethod,
      paymentStatus,
      issuedAt: today,
    };

    onCreateInvoice(invoice);
    setModalOpen(false);
    setDiscount(0);
    setSelectedProduct('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#10B981] text-white flex items-center justify-center shadow-sm shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827]">
              Billing, Invoices &amp; Payments
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Generate itemised service and retail invoices with GST/tax calculation and payment
              reconciliation.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D91A6B] text-white text-sm font-semibold hover:bg-[#BD145B] whitespace-nowrap shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      {/* Period Summary Strip */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_4px_18px_rgba(15,23,42,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F3F4F8] rounded-xl w-fit">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodView(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                periodView === p
                  ? 'bg-white text-[#D91A6B] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {p} Revenue
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div>
            <span className="text-[#6B7280] block">Collected ({periodView})</span>
            <span className="font-mono text-lg font-bold text-emerald-600 tabular-nums">
              {formatCurrency(collectedTotal, parlour.currency)}
            </span>
          </div>
          <div>
            <span className="text-[#6B7280] block">Pending Collection</span>
            <span className="font-mono text-lg font-bold text-[#F97316] tabular-nums">
              {formatCurrency(pendingTotal, parlour.currency)}
            </span>
          </div>
          <div>
            <span className="text-[#6B7280] block">Studio Tax Rate</span>
            <span className="font-mono text-lg font-bold text-[#111827] tabular-nums">
              {parlour.taxRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F5F9] text-xs font-semibold text-[#6B7280] bg-[#F8FAFC]">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-3">Date</th>
                <th className="py-3.5 px-3">Method</th>
                <th className="py-3.5 px-3 text-right">Total</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-sm">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3.5 px-4 font-mono text-xs text-[#111827] font-medium">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#111827]">{inv.customerName}</td>
                  <td className="py-3.5 px-4 text-xs text-[#6B7280] max-w-xs truncate">
                    {inv.items.map((i) => `${i.label} (×${i.qty})`).join(', ')}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-xs text-[#6B7280] tabular-nums">
                    {inv.issuedAt}
                  </td>
                  <td className="py-3.5 px-3 text-xs text-[#111827]">{inv.paymentMethod}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-semibold text-[#111827] tabular-nums">
                    {formatCurrency(inv.total, parlour.currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {inv.paymentStatus === 'Paid' ? (
                      <span className="text-xs font-semibold text-emerald-600">Paid</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onMarkInvoicePaid(inv.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FDF0F6] text-[#D91A6B] text-xs font-semibold hover:bg-[#FCE7F3] whitespace-nowrap"
                      >
                        <Check className="w-3 h-3" />
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-modal-title"
        >
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="invoice-modal-title"
                className="font-display text-xl font-bold text-[#111827]"
              >
                Create Customer Invoice
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close invoice modal"
                className="p-1.5 rounded-xl text-[#6B7280] hover:bg-[#F3F4F8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="inv-client"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  Customer
                </label>
                <select
                  id="inv-client"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
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
                  htmlFor="inv-service"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  Service Charge
                </label>
                <select
                  id="inv-service"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatCurrency(s.price, parlour.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="inv-product"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  Add Retail Product (Optional)
                </label>
                <select
                  id="inv-product"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                >
                  <option value="">None</option>
                  {RETAIL_PRODUCTS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} — {formatCurrency(p.price, parlour.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="inv-discount"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Discount ({parlour.currency})
                  </label>
                  <input
                    id="inv-discount"
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="inv-method"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Method
                  </label>
                  <select
                    id="inv-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Wallet">Wallet</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="inv-status"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Status
                  </label>
                  <select
                    id="inv-status"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-3.5 text-xs space-y-1">
                <div className="flex justify-between text-[#6B7280]">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(totals.subtotal, parlour.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrency(totals.discount, parlour.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Tax ({parlour.taxRate}%)</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(totals.taxAmount, parlour.currency)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-[#111827] pt-1.5 border-t border-[#E5E7EB]">
                  <span>Total Payable</span>
                  <span className="font-mono tabular-nums text-[#D91A6B]">
                    {formatCurrency(totals.total, parlour.currency)}
                  </span>
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
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
