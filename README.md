# Chama Management Platform

A full-stack Chama (Savings Group) Management Platform built with **Node.js**, **Express**, **MySQL**, and **React**.

The platform enables Chama administrators to manage members, contributions, loans, repayments, meetings, audit logs, and M-Pesa payments through a secure REST API.

---

# Features

- JWT Authentication
- Role-Based Authorization
- Member Management
- Contribution Management
- Loan Management
- Loan Repayment Tracking
- Meeting Management
- Dashboard Statistics
- Audit Logging
- M-Pesa STK Push Integration
- Secure REST API
- Production-ready Backend

---

# Technology Stack

## Backend

- Node.js
- Express.js
- MySQL
- mysql2
- JWT
- bcrypt
- Helmet
- CORS
- Axios

## Frontend

- React (In Progress)

---

# Project Structure

```
chama-system/
│
├── config/
├── controllers/
├── middleware/
├── routes/
├── database/
├── .env
├── .env.example
├── server.js
├── package.json
├── README.md
└── CHANGELOG.md
```

---

# Installation

Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/chama-system.git
```

Move into the project

```bash
cd chama-system
```

Install dependencies

```bash
npm install
```

Create your environment file

```bash
cp .env.example .env
```

Update the values inside `.env`.

Start the server

```bash
npm start
```

---

# Environment Variables

The application requires the following variables.

```
PORT=
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=

CLIENT_URL=

MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
```

---

# API Modules

Authentication

```
/auth
```

Members

```
/members
```

Contributions

```
/contributions
```

Loans

```
/loans
```

Repayments

```
/repayments
```

Dashboard

```
/dashboard
```

Meetings

```
/meetings
```

Audit Logs

```
/audit
```

M-Pesa

```
/mpesa
```

---

# Security

The API includes:

- JWT Authentication
- Password hashing using bcrypt
- Helmet security headers
- CORS protection
- Input validation
- Parameterized SQL queries
- Environment variable configuration
- MySQL connection pooling
- Global error handling

---

# M-Pesa Integration

The project integrates with the Safaricom Daraja Sandbox.

Implemented features include:

- OAuth Access Token Generation
- STK Push
- Callback Processing
- Duplicate Callback Prevention
- Transaction Persistence

---

# Current Status

## Backend

✅ Complete

## Frontend

🚧 In Progress

## Deployment

🚧 Planned

---

# Roadmap

- Build React Admin Dashboard
- Connect Frontend to Backend
- End-to-End Testing
- Production Deployment
- Production M-Pesa Integration

---

---

# Author

**Rickson Mwangi**

Software Developer

GitHub: https://github.com/ricksonmwangi

Email: your.email@example.com

---

*"Building secure, scalable, and production-ready software solutions."*