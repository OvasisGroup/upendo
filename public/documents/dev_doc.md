# SACCO Management System

## 1. Executive Overview
The SACCO Management System is a **governance-driven, multi-branch, financial management platform** designed to digitize and automate SACCO operations while enforcing regulatory compliance, transparency, and accountability. The solution supports role-based access control, maker–checker approval workflows, loan lifecycle management, repayments with amortization, MPESA integration, notifications, and full auditability.

This document is a **single-source, development-ready specification** for implementation using **Next.js, Prisma ORM, and PostgreSQL**.

---

## 2. Core Objectives
- Enforce SACCO governance through structured approvals
- Automate member, loan, and repayment management
- Support multi-branch and multi-SACCO scalability
- Maintain immutable audit trails
- Integrate digital payments (MPESA)
- Provide role-specific dashboards and workflows

---

## 3. User Roles & Governance Model

### 3.1 Roles
- **Chairman** – System oversight, approvals, member creation
- **Secretary** – Records oversight and approvals
- **Treasurer** – Financial control, approvals, disbursements, repayments
- **Administrator (Maker)** – Operational data entry and loan application creation
- **Member** – Self-service access to personal loans and repayments

### 3.2 Governance Enforcement
- All loans follow a **maker–checker model**
- Loans require approvals from **Chairman, Secretary, and Treasurer**
- Approval quorum is configurable at system level

---

## 4. Authentication & Authorization

### Authentication
- Email / Phone + Password
- Optional MFA (OTP)
- Secure hashing (bcrypt / argon2)

### Authorization
- Role-Based Access Control (RBAC)
- Route and API-level guards
- Automatic role-based dashboard routing

---

## 5. High-Level Architecture

### Technology Stack
- **Frontend:** Next.js (App Router) + TypeScript
- **Backend:** Next.js API Routes
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Payments:** MPESA (STK Push & C2B)
- **Notifications:** SMS, Email, In-App

---

## 6. Functional Modules

### 6.1 SACCO & Branch Management
- Support multiple SACCOs in one system
- Each SACCO can have multiple branches
- Branch-level member and loan reporting

### 6.2 Member Management
- Member onboarding and lifecycle management
- Zone/Branch assignment
- Member status tracking

### 6.3 Product Management
- Loan and savings products
- Interest configuration
- Repayment period and percentage setup

### 6.4 Loan Management

#### Loan Lifecycle
```text
Draft → Submitted → Approved → Disbursed → Completed / Defaulted
```

#### Loan Features
- Product-based loan rules
- Document uploads
- Approval quorum enforcement
- Disbursement tracking

### 6.5 Approval Engine (Maker–Checker)
- Parallel approvals by governance roles
- Configurable quorum logic
- Immutable approval records

### 6.6 Loan Repayment & Amortization
- Auto-generated repayment schedules
- Principal and interest separation
- Balance roll-forward
- Default detection

### 6.7 Payments & MPESA Integration
- Payment ledger for all transactions
- MPESA raw response storage
- Reconciliation and retries

### 6.8 Notifications
- SMS, Email, and In-App alerts
- Event-driven triggers
- Delivery status tracking

### 6.9 Audit Trail
- System-wide immutable logs
- User activity tracking
- Compliance-ready reporting

---

## 7. Dashboards

| Role | Dashboard Capabilities |
|----|----|
| Chairman | Global oversight, approvals, analytics |
| Secretary | Approvals, member records |
| Treasurer | Financial summaries, disbursements |
| Administrator | Data entry, loan creation |
| Member | Loans, repayments, notifications |

---

## 8. Non-Functional Requirements
- High availability
- Secure data storage
- Regulatory compliance
- Horizontal scalability
- Backup and disaster recovery

---

## 9. Prisma Database Schema

The following Prisma schema defines the **complete database structure** for this SACCO Management System.

```prisma
// prisma/schema.prisma

 generator client {
  provider = "prisma-client-js"
 }

 datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
 }

 enum Role { CHAIRMAN SECRETARY TREASURER ADMINISTRATOR MEMBER }
 enum LoanStatus { DRAFT SUBMITTED APPROVED DISBURSED COMPLETED DEFAULTED }
 enum ApprovalStatus { PENDING APPROVED REJECTED }
 enum ProductType { LOAN SAVINGS }
 enum NotificationType { SMS EMAIL IN_APP }
 enum NotificationStatus { PENDING SENT FAILED }
 enum PaymentMethod { MPESA BANK CASH }
 enum PaymentStatus { INITIATED SUCCESS FAILED }

 model Sacco {
  id        String   @id @default(uuid())
  name      String
  code      String   @unique
  branches  Branch[]
  createdAt DateTime @default(now())
 }

 model Branch {
  id        String   @id @default(uuid())
  saccoId   String
  name      String
  code      String   @unique
  sacco     Sacco    @relation(fields: [saccoId], references: [id])
  members   Member[]
  createdAt DateTime @default(now())
 }

 model User {
  id        String   @id @default(uuid())
  email     String   @unique
  phone     String?  @unique
  password  String
  role      Role
  isActive  Boolean  @default(true)
  member    Member?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
 }

 model Member {
  id         String   @id @default(uuid())
  userId     String   @unique
  branchId   String?
  fullName   String
  nationalId String   @unique
  phone      String
  status     String   @default("ACTIVE")
  user       User     @relation(fields: [userId], references: [id])
  branch     Branch?  @relation(fields: [branchId], references: [id])
  loans      Loan[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
 }

 model Product {
  id               String      @id @default(uuid())
  name             String
  type             ProductType
  interestRate     Float
  repaymentPeriod  Int
  repaymentPercent Float
  loans            Loan[]
  createdAt        DateTime    @default(now())
 }

 model Loan {
  id           String      @id @default(uuid())
  memberId     String
  productId    String
  principal    Float
  interestRate Float
  repaymentPct Float
  status       LoanStatus @default(DRAFT)
  member       Member     @relation(fields: [memberId], references: [id])
  product      Product    @relation(fields: [productId], references: [id])
  approvals    LoanApproval[]
  repayments   Repayment[]
  schedule     RepaymentSchedule[]
  createdAt    DateTime @default(now())
 }

 model LoanApproval {
  id         String          @id @default(uuid())
  loanId     String
  approverId String
  role       Role
  status     ApprovalStatus @default(PENDING)
  loan       Loan            @relation(fields: [loanId], references: [id])
 }

 model RepaymentSchedule {
  id            String   @id @default(uuid())
  loanId        String
  installmentNo Int
  dueDate       DateTime
  principal     Float
  interest      Float
  totalDue      Float
  isPaid        Boolean  @default(false)
  loan          Loan     @relation(fields: [loanId], references: [id])
 }

 model Repayment {
  id           String   @id @default(uuid())
  loanId       String
  amountPaid   Float
  balanceAfter Float
  paymentDate  DateTime
  loan         Loan     @relation(fields: [loanId], references: [id])
 }

 model PaymentTransaction {
  id          String         @id @default(uuid())
  memberId    String
  loanId      String?
  amount      Float
  method      PaymentMethod
  reference   String         @unique
  status      PaymentStatus
  rawResponse Json?
  createdAt   DateTime @default(now())
 }

 model Notification {
  id        String              @id @default(uuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  status    NotificationStatus @default(PENDING)
  createdAt DateTime            @default(now())
 }

 model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String
  entity    String
  entityId  String?
  createdAt DateTime @default(now())
 }

 model SystemSetting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  createdAt DateTime @default(now())
 }

 model ApprovalQuorum {
  id            String   @id @default(uuid())
  entity        String
  requiredRoles Role[]
  minApprovals  Int
  createdAt     DateTime @default(now())
 }
```

---

## 10. Conclusion
This SACCO Management System design provides a **robust, scalable, and regulator-ready foundation** for modern SACCO operations. It is engineered to support governance, financial integrity, and digital transformation while remaining flexible for future enhancements.

**End of Document**
