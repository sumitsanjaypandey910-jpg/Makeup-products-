export type TenantRole = 'super_admin' | 'owner' | 'staff';

export type NavTab =
  | 'dashboard'
  | 'customers'
  | 'skin_scanner'
  | 'skin_progress'
  | 'ai_assistant'
  | 'appointments'
  | 'services'
  | 'billing'
  | 'communication'
  | 'staff'
  | 'reports'
  | 'tenants';

export type CustomerSegment = 'VIP' | 'Regular' | 'New' | 'At Risk';

export type ServiceCategory =
  | 'Facial Treatments'
  | 'Hair Treatments'
  | 'Cleanup Services'
  | 'Bridal Packages'
  | 'Skin-Care Packages'
  | 'Beauty Consultations'
  | 'Custom';

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export type PaymentMethod = 'Card' | 'UPI' | 'Cash' | 'Wallet';
export type PaymentStatus = 'Paid' | 'Pending' | 'Partial';

export type StaffRole =
  | 'Parlour Owner'
  | 'Lead Aesthetician'
  | 'Hair Specialist'
  | 'Makeup & Bridal Artist'
  | 'Front Desk Coordinator';

export type AttendanceStatus = 'Clocked In' | 'On Break' | 'Off Duty';

export interface ParlourTenant {
  id: string;
  name: string;
  city: string;
  plan: 'Boutique' | 'Studio Pro' | 'Enterprise';
  ownerUid: string;
  ownerEmail: string;
  memberUids: string[];
  phone: string;
  currency: string;
  taxRate: number;
  status: 'active' | 'trial' | 'suspended';
  monthlyRevenueTarget: number;
}

export interface ProductPurchase {
  id: string;
  productName: string;
  date: string;
  amount: number;
}

export interface Customer {
  id: string;
  parlourId: string;
  fullName: string;
  phone: string;
  email: string;
  dob: string;
  photoUrl?: string;
  registeredAt: string;
  segment: CustomerSegment;
  preferences: string;
  staffNotes: string;
  whatsappConsent: boolean;
  treatmentHistory: string[];
  productPurchases: ProductPurchase[];
  totalSpent: number;
  visitCount: number;
  lastVisitDate: string;
}

export interface ServiceItem {
  id: string;
  parlourId: string;
  name: string;
  description: string;
  category: ServiceCategory;
  price: number;
  durationMin: number;
  availableStaffIds: string[];
  active: boolean;
}

export interface Appointment {
  id: string;
  parlourId: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMin: number;
  price: number;
  status: AppointmentStatus;
  notes?: string;
  reminderQueued?: boolean;
}

export interface StaffProfile {
  id: string;
  parlourId: string;
  name: string;
  role: StaffRole;
  phone: string;
  email: string;
  avatarUrl?: string;
  attendanceStatus: AttendanceStatus;
  lastClockIn: string;
  assignedAppointments: number;
  completedCount: number;
  revenueGenerated: number;
  rating: number;
  permissions: string[];
}

export interface InvoiceLineItem {
  id: string;
  label: string;
  kind: 'Service' | 'Product';
  qty: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  parlourId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  issuedAt: string;
}

export interface SkinCharacteristic {
  key: string;
  label: string;
  level: string;
  confidence: string;
  observation: string;
}

export interface SkinZoneObservation {
  zone: string;
  focus: string;
  observation: string;
  intensity: string;
}

export interface SkinAnalysisResult {
  disclaimer: string;
  faceDetectedNote: string;
  summary: string;
  skinAppearanceType: string;
  characteristics: SkinCharacteristic[];
  zones: SkinZoneObservation[];
  skincareSuggestions: string[];
  recommendedSalonCategories: string[];
  suggestedFollowUpDays: number;
}

export interface SkinScanRecord {
  id: string;
  parlourId: string;
  customerId: string;
  customerName: string;
  scanDate: string;
  photoDataUrl: string;
  lightingCondition: string;
  summary: string;
  suggestedFollowUpDate: string;
  staffObservations: string;
  treatmentsReceived: string;
  productsUsed: string;
  analysis: SkinAnalysisResult;
}

export interface CommunicationLog {
  id: string;
  parlourId: string;
  customerId: string;
  customerName: string;
  phone: string;
  channel: 'WhatsApp' | 'SMS' | 'Email';
  campaignType: 'Follow-up' | 'Appointment Reminder' | 'Birthday' | 'Promotion' | 'Feedback';
  message: string;
  consentVerified: boolean;
  sentAt: string;
  feedbackRating?: number;
  feedbackComment?: string;
}
