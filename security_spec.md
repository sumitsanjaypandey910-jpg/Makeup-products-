# BeautyOS Firestore Security Specification

## 1. Data Invariants
1. **Strict Tenant Isolation**: Every customer, appointment, service, invoice, staff profile, skin scan, and communication log under `/parlours/{parlourId}/...` can ONLY be read or written by an authenticated, email-verified member of that exact `parlourId` (`/parlours/{parlourId}/members/{request.auth.uid}` with `status == 'active'`) or a verified Super Admin.
2. **No Cross-Tenant Leakage**: A member of Parlour A cannot read, list, create, update, or delete any document in Parlour B.
3. **Role-Based Access Control (RBAC)**:
   - Only a Super Admin or Parlour Owner can modify parlour settings, delete customer/invoice records, or manage `/members/{memberUid}`.
   - Active Staff members can create/update appointments, customers, skin scans, invoices, and communications within their assigned parlour.
   - Paid/Completed terminal state locking on invoices (`paymentStatus == 'Paid'`) and appointments (`status == 'Completed' || status == 'Cancelled'`) prevents non-owner tampering once settled.
4. **PII Isolation**: Customer phone, email, DOB, and skin records are never publicly readable or readable via blanket `isSignedIn()` rules.
5. **Payload Integrity**: All string lengths, numeric ranges, enum fields, and document IDs are strictly validated via `isValidId()` and `isValid*()` helpers, with `keys().hasAll()` + `keys().hasOnly()` and `affectedKeys().hasOnly()`.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Cross-Tenant Customer Read**: Authenticated user in `parlour_a` attempts `get` on `/parlours/parlour_b/customers/cust_1`.
2. **Unauthenticated Appointment List**: Anonymous request attempts `list` on `/parlours/parlour_a/appointments`.
3. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts `create` on `/parlours/parlour_a/customers/cust_99`.
4. **Shadow Field Injection (Ghost Field)**: Active staff creates a customer with extra field `isAdmin: true` or `vipOverride: true`.
5. **Role Escalation via Self-Membership**: Staff user updates `/parlours/parlour_a/members/{ownUid}` to set `role: 'owner'`.
6. **Tenant Mismatch Spoofing**: Staff in `parlour_a` writes customer into `/parlours/parlour_a/customers/c1` with `parlourId: 'parlour_b'`.
7. **1MB ID Poisoning**: User attempts `create` at `/parlours/parlour_a/customers/${'x'.repeat(500)}`.
8. **Type Poisoning on Update**: Staff updates appointment `status` to boolean `true` instead of enum string.
9. **Terminal State Tampering**: Non-owner staff attempts to reduce `total` on an invoice whose `paymentStatus == 'Paid'`.
10. **Consent Bypass on Communication**: Staff attempts to log a WhatsApp message with `consentVerified: 'yes'` (wrong type) or missing `consentVerified`.
11. **Orphaned Parlour Owner Spoof**: User creates `/parlours/p_new` setting `ownerUid` to someone else's UID.
12. **Blanket Parlours List Scrape**: Non-SuperAdmin user attempts `list` on `/parlours` to enumerate all tenants.
