# GlobeTrotter — Smart Multi-City Trip Planner & Guide Marketplace

<div align="center">

![GlobeTrotter Banner](https://img.shields.io/badge/GlobeTrotter-NextGen%20Trip%20Planner-0ea5e9?style=for-the-badge&logo=compass&logoColor=white)
![Build Status](https://img.shields.io/badge/Build-Passing-10b981?style=for-the-badge)
![Next.js 16](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-Express%20%2B%20TypeScript-339933?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20Prisma-4169E1?style=for-the-badge&logo=postgresql)

<br/>

**A multi-city trip planner and verified local guide booking platform.** Plan multi-stop journeys across top global destinations, dynamically track real-time budgets with automated cost derivation, and hire verified local experts seamlessly.

</div>

---

## 👥 Team Quantum Coders

This project is built and maintained by **Team Quantum Coders**:

| Name | Role | Responsibilities |
| :--- | :--- | :--- |
| 👑 **Dax Patel** | **Team Leader & Full-Stack Architect** | Project Architecture, Core Backend APIs, Database Design, System Integration |
| 💻 **Hilag Shah** | **Core Developer** | Frontend Interfaces, Interactive Trip Planning, State Management |
| ⚡ **Siddhanth Singh** | **Core Developer** | Backend Services, Authentication & Role-Based Access Control, API Optimization |
| 🛡️ **Sukal Gautam** | **Core Developer** | Guide Booking Engine, Conflict Detection, Admin Console & Quality Assurance |

---

## 🌟 Key Platform Capabilities

### 1. 🗺️ Intelligent Multi-City Trip Planning
- **Multi-Stop Itineraries**: Plan complex trips with sequential city stays, automatic date chaining, and customizable duration.
- **Dynamic Re-flow**: Reorder stops with seamless automatic date re-alignment while preserving planned activity schedules.
- **Activity Attachment**: Discover and attach city-scoped activities with customizable custom expense overrides.
- **Public Trip Sharing**: Share view-only, sanitized itinerary links using high-entropy random slugs (no authentication required).

### 2. 💰 Derived Live Budget Engine
- **Calculated on-the-fly**: Zero static total-cost columns; aggregated in real-time across accommodations, transit, and activities via high-efficiency SQL joins.
- **Visual Analytics**: Interactive cost breakdown charts and per-city spending distributions.

### 3. 🧭 Local Guide Marketplace & Hiring System
- **Verified Guide Directory**: Filter and discover professional local guides by city, languages, pricing, and ratings.
- **Anti-Double-Booking Protection**: Inclusive calendar conflict engine preventing guide or traveller scheduling collisions at the database level.
- **Snapshot Pricing**: Daily rates are immutably captured at booking time to protect both travellers and guides from rate fluctuations.
- **Privacy-First Contacts**: Traveler and guide contact info (phone/email) are securely withheld until a booking is explicitly `CONFIRMED`.

### 4. 🔐 Robust Multi-Role Ecosystem
- **Role-Based Access Control (RBAC)**: Unified users schema with strict `USER`, `GUIDE`, and `ADMIN` authorization.
- **Dedicated Workspaces**:
  - 🎒 **Traveller Workspace (`/dashboard`, `/trips`, `/guides`, `/bookings`)**: Trip itinerary builder, booking tracking, and budget dashboard.
  - 🧭 **Guide Portal (`/guide`, `/guide/profile`)**: Manage assignments, accept/decline booking requests, update rates and specialties.
  - 🛡️ **Admin Command Center (`/admin`)**: Global booking reassignments with date-conflict overrides, user role management, and guide verification.

---

## 🏗️ Architecture & Technology Stack

```
OddoxLDCE/
├── backend/                  # REST API Service
│   ├── prisma/               # Schema & Migrations
│   │   ├── schema.prisma     # 8 Relational Tables (PostgreSQL)
│   │   └── seed.js           # 32 Cities, 143 Activities, Seeded Guides & Demo Trips
│   └── src/
│       ├── controllers/      # Request handlers (Auth, Trip, Stop, Guide, Admin, Booking)
│       ├── services/         # Core business logic (Budget SQL, Guide Engine, Itinerary)
│       ├── middleware/       # JWT Auth, RBAC guards, Zod validation, Rate limiting
│       └── validators/       # Strict Zod schemas
├── frontend/                 # Web Application
│   ├── src/
│   │   ├── app/              # Next.js App Router (App, Auth, Admin, Guide, Bookings)
│   │   ├── components/       # Reusable UI & modern design system
│   │   ├── hooks/            # TanStack Query & data mutation hooks
│   │   └── lib/              # API clients, auth context, types
│   └── proxy.ts              # Edge session role proxy
├── docs/                     # Documentation
│   └── API.md                # Complete REST API specification
```

### Tech Stack Details:
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL.
- **Security & Validation**: JSON Web Tokens (JWT), Bcrypt password hashing, Zod schema validation, Helmet security headers, CORS protection.

---

## ⚡ Quickstart & Local Setup

### Prerequisites
- Node.js (v18.0 or higher)
- PostgreSQL running locally or in the cloud
- npm or yarn

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Configure DATABASE_URL and JWT_SECRET in .env

# Create database and apply migrations
npm run db:migrate

# Seed database with cities, activities, demo guides, and initial trips
npm run db:seed

# Start backend server
npm run dev
# Server running at: http://localhost:4000
```

### 2. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
# Application accessible at: http://localhost:3000
```

---

## 🔑 Demo Credentials

The database seed provides ready-to-test accounts for every role:

| Role | Email | Password | Landing Page | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Traveller** | `demo@globetrotter.app` | `demo1234` | `/dashboard` | Preloaded with Europe 2026 trip & Paris guide booking |
| **Guide** | `amelie@guides.globetrotter.app` | `guide1234` | `/guide` | Preloaded with incoming booking assignments |
| **Admin** | `admin@globetrotter.app` | `admin1234` | `/admin` | Full control over users, guides, and booking overrides |

---

## 📊 Database Schema Overview

```
users ──< trips ──< trip_stops >── cities
  │                     │              │
  │                     └──< stop_activities >── activities
  │
  ├──< guide_profiles >── cities
  └──< guide_bookings >── guide_profiles
```

---

## 📖 API Documentation

For the full endpoint specification with request/response schemas, refer to [docs/API.md](file:///Users/daxpatel/Desktop/OddoxLDCE/docs/API.md).

---

## 📄 License & Team Credits

Developed with ❤️ by **Quantum Coders** — Dax Patel, Hilag Shah, Siddhanth Singh, Sukal Gautam.
All rights reserved.
