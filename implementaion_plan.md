# Pharmaceutical Distribution ERP - Sudan

## Overview
نظام إدارة وتوزيع أدوية لشركة تعمل داخل السودان، يعتمد على مستودع رئيسي في أمدرمان ويغطي جميع الولايات.

---

## Core Objective
- إدارة المخزون الدوائي بدقة عالية (Batch Tracking)
- دعم التوزيع لكل ولايات السودان
- إدارة المبيعات والمشتريات
- تتبع الصلاحيات والحسابات
- دعم الربحية الحقيقية

---

## Tech Stack

### Frontend
- React (Vite)
- TypeScript
- TailwindCSS
- React Query
- Zustand

### Backend
- Node.js (NestJS)

### Database
- PostgreSQL (Neon)
- Prisma ORM

### Deployment
- Render (Backend + Frontend)
- Neon (Database)

---

## System Architecture

React Frontend → Node API → Prisma → PostgreSQL (Neon)

---

## Warehouse Model

Main Warehouse:
- Omdurman (Khartoum)

Coverage:
- جميع ولايات السودان

---

## Batch Management (Critical)

كل منتج يتم تتبعه عبر Batch:

- Batch Number
- Manufacturing Date
- Expiry Date
- Quantity
- Cost Price

Rule:
FEFO = First Expired First Out

---

## Database Schema

### Users
- id
- name
- phone
- password
- role

Roles:
- ADMIN
- SALES
- WAREHOUSE
- ACCOUNTANT

---

### Products
- id
- name
- scientific name
- barcode
- category
- unit

---

### Batches
- id
- batchNumber
- productId
- qty
- costPrice
- expiryDate
- manufactureDate

---

### Customers
- id
- name
- type (pharmacy / hospital / distributor)
- state
- phone
- creditLimit

---

### Sales
- id
- customerId
- total
- paid
- status
- createdAt

---

### Sale Items
- id
- saleId
- productId
- batchId
- qty
- price

---

### Stock Movement
- id
- batchId
- type (IN / OUT)
- qty
- reason

---

### Delivery Orders
- id
- saleId
- state
- city
- status
- driverName

---

## Business Workflow

### Purchase Flow
Supplier → Purchase Order → Receive → Batch Creation → Stock Update

---

### Sales Flow
Customer Order → FEFO Batch Selection → Invoice → Deduct Stock

---

### Return Flow
Return → Restore Batch → Adjust Invoice

---

## Key Modules

### Inventory
- Batch tracking
- Expiry alerts
- Stock valuation

### Sales
- Invoices
- Credit sales
- Payments

### Purchase
- Suppliers
- Orders
- Receiving

### Distribution
- Delivery per state
- Status tracking

### Finance
- Profit tracking
- Customer debts
- Expenses

---

## Sudan-Specific Considerations

- ضعف الإنترنت → دعم PWA
- عملة أساسية SDG
- دعم USD للمشتريات
- نقل يدوي بين الولايات

---

## Security

- JWT Authentication
- RBAC Roles
- Audit Logs

---

## Reporting

- Daily sales
- Expiry report
- Profit analysis
- Customer debts
- Inventory value

---

## Future Enhancements

- Mobile app for sales reps
- Barcode scanning
- WhatsApp ordering system
- AI demand forecasting
- Multi-warehouse support