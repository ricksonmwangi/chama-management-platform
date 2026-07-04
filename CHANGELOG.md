# Changelog

All notable changes to this project will be documented here.

---

## v0.1.0 - Initial Backend

### Added

- JWT Authentication
- Role-Based Authorization
- Member Management
- Contributions Module
- Meetings Module
- Loans Module
- Loan Eligibility Checks
- Loan Approval
- Loan Rejection
- Loan Repayment Module
- Outstanding Balance Calculation
- Dashboard Statistics
- Audit Logging
- M-Pesa Daraja Integration

---

## Planned for v0.2.0

- Backend Security Hardening
- Input Validation
- Rate Limiting
- Better Error Handling
- Database Connection Pooling

### Added
- JWT authentication and authorization.
- Admin middleware for role-based access control.
- Audit logging middleware.
- Member management module (CRUD).
- Contribution management module.
- Loan management module with:
  - Member validation
  - Loan eligibility checks
  - Prevention of multiple active approved loans
  - Approval and rejection workflow
- Loan repayment module.
- Dashboard statistics endpoints.
- Meeting management module (CRUD).
- Audit log retrieval.
- M-Pesa Daraja Sandbox integration:
  - OAuth access token generation
  - STK Push
  - Callback endpoint
  - Duplicate callback prevention
  - Transaction persistence

### Security
- Password hashing using bcrypt.
- JWT authentication.
- Helmet security headers.
- Configurable CORS.
- Environment variable configuration.
- MySQL connection pooling.
- Parameterized SQL queries to mitigate SQL injection.
- Global error handling.
- Input validation across controllers.

### Infrastructure
- Express backend architecture.
- MySQL database integration.
- Production-ready REST API.
- Git repository connected to GitHub.
- `.env.example` added for environment configuration.

### Tested
- Authentication workflow.
- Member management.
- Contributions.
- Loans.
- Repayments.
- Meetings.
- Dashboard.
- Audit logs.
- End-to-end M-Pesa STK Push and callback processing.