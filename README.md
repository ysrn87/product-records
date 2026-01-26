# Product Stock Management System

A comprehensive product stock management system built with Next.js 15, TypeScript, Prisma, and Tailwind CSS 4.

## Features

### User Management
- Role-based access control (PRIVILEGE, ADMIN, SALES, WAREHOUSE)
- User creation with role permissions
- Password reset functionality
- User status management (active/inactive)

### Product Management
- Product catalog with categories
- Multi-level variant system (e.g., Flavor × Size)
- SKU management
- Purchase and selling price tracking
- Product status control

### Stock Management
- Stock entry/receiving system
- Supplier tracking
- Automatic stock level updates
- Stock entry cancellation with reversal

### Sales
- POS-style sales interface
- Customer search and creation
- Cart management with item-level discounts
- Multiple payment methods
- Invoice generation
- Sale cancellation with stock restoration

### Reports
- Dashboard with KPIs
- Today's sales summary
- Monthly sales with growth tracking
- Low stock alerts
- Stock level overview

## Tech Stack

- **Frontend**: Next.js 15.1, React, TypeScript 5.7
- **Styling**: Tailwind CSS 4.0
- **Database**: PostgreSQL 18 with Prisma 6.2 ORM
- **Authentication**: NextAuth v5 (Auth.js)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

### Installation

1. **Extract the project**
   ```bash
   unzip product-stock-management.zip
   cd product-stock-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your database URL and auth secret:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/stock_management"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Seed the database**
   ```bash
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | privilege@example.com | password123 |
| Admin | admin@example.com | password123 |
| Sales | sales@example.com | password123 |
| Warehouse | warehouse@example.com | password123 |

## Project Structure

```
product-stock-management/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
├── src/
│   ├── actions/            # Server actions
│   │   ├── customers.ts
│   │   ├── products.ts
│   │   ├── sales.ts
│   │   ├── settings.ts
│   │   ├── stock.ts
│   │   └── users.ts
│   ├── app/
│   │   ├── api/auth/       # NextAuth API route
│   │   ├── dashboard/      # Protected dashboard pages
│   │   │   ├── customers/
│   │   │   ├── products/
│   │   │   ├── reports/
│   │   │   ├── sales/
│   │   │   ├── settings/
│   │   │   ├── stock-in/
│   │   │   ├── stock-levels/
│   │   │   └── users/
│   │   └── login/
│   ├── components/
│   │   └── layout/
│   │       └── Sidebar.tsx
│   ├── lib/
│   │   ├── auth.ts         # NextAuth configuration
│   │   ├── prisma.ts       # Prisma client
│   │   └── utils.ts        # Utility functions
│   └── types/
│       └── next-auth.d.ts  # NextAuth type extensions
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## User Roles & Permissions

| Feature | PRIVILEGE | ADMIN | SALES | WAREHOUSE |
|---------|-----------|-------|-------|-----------|
| User Management | ✅ All | ✅ SALES/WAREHOUSE only | ❌ | ❌ |
| Product Management | ✅ | ✅ | ❌ | ❌ |
| Stock Entry | ✅ | ✅ | ❌ | ✅ |
| Sales | ✅ | ✅ | ✅ Own | ❌ |
| Customer Management | ✅ | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ✅ Limited | ❌ |
| Settings | ✅ | ✅ | ❌ | ❌ |
| Activity Logs | ✅ | ❌ | ❌ | ❌ |

## Key Features Implemented

- ✅ Role-based authentication and authorization
- ✅ Product catalog with multi-level variants
- ✅ Stock entry system with automatic inventory updates
- ✅ POS-style sales interface with customer management
- ✅ Real-time stock validation (prevent overselling)
- ✅ Transaction rollback on cancellation
- ✅ Activity logging for audit trail
- ✅ Dashboard with KPIs and alerts
- ✅ Search and filtering across all modules
- ✅ Responsive design with Tailwind v4
- ✅ Invoice generation and printing

## License

MIT License
