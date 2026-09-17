# VISHWANEED — CODEX DEVELOPMENT RULES

## 1. READ BEFORE CODING

Before implementing any feature, read:

1. docs/PROJECT_CONTEXT.md
2. docs/BUSINESS_RULES.md
3. docs/PRODUCTION_RULES.md
4. docs/API_SPEC.md if available
5. docs/requirements.pdf if readable
6. docs/prototype.pdf if readable
7. AGENTS.md

Also inspect the existing repository.

Never assume the repository is empty.

Never assume a technology is installed until checking package.json/configuration.

---

# 2. SOURCE OF TRUTH

Use the following priority:

1. Explicit project/business decisions
2. docs/BUSINESS_RULES.md
3. docs/PROJECT_CONTEXT.md
4. docs/PRODUCTION_RULES.md
5. docs/API_SPEC.md
6. requirements/prototype documentation
7. Existing implementation
8. Developer assumption

If information conflicts, do not silently choose an assumption.

Report the conflict.

---

# 3. DO NOT INVENT BUSINESS RULES

If a business rule is unclear:

DO NOT silently invent it.

Instead:

- Identify the ambiguity
- Implement a configurable abstraction if possible
- Document the assumption
- Report it to the Project Manager

---

# 4. BACKEND IS SOURCE OF TRUTH

Never trust frontend values for:

- Price
- Stock
- Shipping
- GST
- Discounts
- Order totals
- Commission
- Refunds
- Settlement

Frontend may display calculations for UX, but backend values are authoritative.

---

# 5. MULTI-VENDOR MARKETPLACE

Multi-vendor functionality is a core requirement.

One customer checkout may contain multiple vendors.

Required structure:

MASTER ORDER
    |
    +-- VENDOR ORDER
    |      |
    |      +-- ORDER ITEM
    |
    +-- VENDOR ORDER
           |
           +-- ORDER ITEM

Do not implement the marketplace as a single-vendor order system.

---

# 6. VENDOR DATA ISOLATION

Vendor can access only their own:

- Products
- Inventory
- Orders
- Shipments
- Reviews
- Complaints
- Ledger
- Settlements
- Documents

Always enforce ownership on the backend.

---

# 7. SECURITY

Never commit:

- Passwords
- API secrets
- JWT secrets
- Razorpay secrets
- Shiprocket credentials
- Interakt credentials
- Production environment files
- Private KYC documents

---

# 8. PAYMENT

Never mark a payment successful based only on frontend response.

Verify payment server-side.

Support:

- Razorpay
- Razorpay Route
- COD
- Webhooks
- Refunds
- Idempotency

---

# 9. EXTERNAL PROVIDER ABSTRACTION

Use:

PaymentService
→ RazorpayPaymentProvider

ShippingService
→ ShiprocketShippingProvider

NotificationService
→ InteraktWhatsAppProvider

Business logic must depend on interfaces/services, not provider-specific implementation.

---

# 10. COMMISSION

Commission:

Raw/Commodity = 14%
Value-added = 18%

These values must be configurable.

Never hardcode them in controllers/components.

Commission is vendor-order/item based.

---

# 11. SETTLEMENT

Settlement is NOT weekly.

Settlement is NOT monthly.

Default settlement eligibility:

7 days after delivery.

Store:

- deliveredAt
- settlementEligibleAt
- settlementStatus
- settledAt
- settlementAmount

Settlement calculation must be backend controlled.

---

# 12. SHIPPING

Customer pays shipping separately.

Shipping is vendor-wise.

Initial provider:

Shiprocket

Store:

- Provider shipment ID
- AWB
- Tracking URL
- Shipment status

Do not trust frontend shipping values.

---

# 13. GST

Customer-facing prices are GST-inclusive.

Do not add GST twice.

Keep tax information for invoice/accounting/reporting.

---

# 14. KYC

Required:

- PAN
- Aadhaar
- GST certificate
- FSSAI license
- Bank details
- Cancelled cheque
- Business registration proof

FSSAI is mandatory for food vendors.

KYC documents must have restricted access.

---

# 15. VENDOR APPROVAL

Workflow:

Registration
→ Documents
→ Verification
→ Physical inspection
→ Checklist
→ Approved/Pending/Rejected

---

# 16. PRODUCT APPROVAL

Vendor creates product.

Admin approves product.

Only approved products can become publicly purchasable.

---

# 17. ORDER STATUS

Use controlled status transitions.

Typical lifecycle:

PENDING
→ CONFIRMED
→ PROCESSING
→ PACKED
→ SHIPPED
→ DELIVERED

Other states:

CANCELLED
RETURN_REQUESTED
RETURNED
REFUND_PENDING
REFUNDED
REPLACEMENT_REQUESTED
REPLACED

Do not allow arbitrary status changes.

---

# 18. PARTIAL CANCELLATION

A vendor may cancel individual items when stock is unavailable.

Do not cancel the entire master order unnecessarily.

---

# 19. PARTIAL REFUND

Only the affected cancelled/returned item should be refunded unless business rules explicitly require otherwise.

Never refund more than the refundable amount.

---

# 20. RETURNS

Return window:

7 days after delivery.

Backend must calculate eligibility.

---

# 21. REPLACEMENT

For quality issues:

Customer can choose:

Replacement
or
Refund

---

# 22. DATABASE

Use PostgreSQL + Prisma.

Use:

- Foreign keys
- Indexes
- Unique constraints
- Transactions
- Proper relation design

Critical marketplace operations must use database transactions.

---

# 23. INVENTORY

Protect against overselling.

Inventory changes should be traceable.

Use InventoryTransaction.

---

# 24. API VALIDATION

Validate every API request.

Use DTO validation.

Validate:

- Body
- Params
- Query
- Files
- IDs
- Quantities
- Amounts

---

# 25. API RESPONSE

Use consistent response format.

Success:

{
  "success": true,
  "data": {},
  "message": "Success",
  "meta": {}
}

Error:

{
  "success": false,
  "data": null,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}

---

# 26. FRONTEND

Frontend must handle:

- Loading
- Error
- Empty state
- Network errors
- Authentication expiry
- Validation errors
- API failures
- Responsive layouts

---

# 27. CUSTOMER FRONTEND OWNERSHIP

Developer 1 owns:

- Customer website
- Customer UI
- Customer flows
- Customer API integration

Do not modify backend unnecessarily.

---

# 28. PLATFORM OWNERSHIP

Developer 2 owns:

- Backend
- Database
- API
- Vendor panel
- Admin panel
- Marketplace engine
- Payment
- Shipping
- Commission
- Ledger
- Settlement
- Refund
- Return
- Replacement
- Notification infrastructure

---

# 29. CROSS-TEAM CHANGES

If Developer 1 requires a backend API:

Document:

- Endpoint
- Method
- Request
- Response
- Authentication
- Errors

Do not create random duplicate APIs.

---

# 30. EXISTING CODE

Before creating a new component/service/module:

Search the repository.

Reuse existing functionality where appropriate.

Do not duplicate existing utilities.

---

# 31. DO NOT OVER-ENGINEER

The project is initially a modular monolith.

Do not introduce:

- Microservices
- Kubernetes
- Event-driven infrastructure
- Complex distributed systems

unless explicitly required.

---

# 32. DO NOT FAKE PRODUCTION FEATURES

Do not create fake:

- Payment success
- Shipping success
- Refund success
- Settlement success

If credentials are unavailable:

Use a clearly named development adapter/mock.

Keep the real provider interface ready.

---

# 33. TESTING

Before completing a task:

Run relevant:

- Unit tests
- Integration tests
- Typecheck
- Lint
- Build

Fix issues caused by your changes.

---

# 34. CRITICAL E2E TEST

The system must eventually support:

Vendor A:
Raw product ₹1,000

Vendor B:
Value-added product ₹1,000

Customer:

Add both
→ Checkout
→ Payment/COD
→ Master Order
→ Vendor Order A
→ Vendor Order B
→ Separate shipments

Commission:

Vendor A:
₹1,000 × 14% = ₹140

Vendor B:
₹1,000 × 18% = ₹180

Total:

₹320

After delivery:

Settlement eligibility:

Delivery date + 7 days

---

# 35. FILE CHANGES

Avoid modifying unrelated files.

Keep commits/tasks focused.

Before modifying another developer's area:

Coordinate.

---

# 36. DOCUMENTATION

If an architectural decision changes:

Update the appropriate documentation.

Possible files:

- PROJECT_CONTEXT.md
- BUSINESS_RULES.md
- PRODUCTION_RULES.md
- API_SPEC.md

---

# 37. TASK COMPLETION REPORT

At the end of every task report:

## Implemented

What was completed.

## Files Changed

List important files.

## APIs

APIs added/modified.

## Database

Models/migrations changed.

## Tests

Tests added and executed.

## Validation

Lint/typecheck/build status.

## Blockers

Anything preventing completion.

## Business Decisions

Any decision required from Project Manager.

---

# 38. FINAL RULE    

Do not optimize for "number of files written."

Optimize for:

Correctness
Security
Maintainability
Testability
Business-rule accuracy
End-to-end functionality

The goal is a production-quality marketplace foundation, not a collection of disconnected screens.