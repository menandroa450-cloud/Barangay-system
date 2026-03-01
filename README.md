 🏢 Barangay Attendance Monitoring System

A modern full-stack Web-Based Attendance Monitoring System developed for
barangay personnel to replace manual logbook attendance tracking.

Built using Next.js, TypeScript, Prisma ORM, and PostgreSQL.

------------------------------------------------------------------------

## 🚀 Features

-   🔐 Secure Authentication System
-   👤 Role-Based Access Control (Admin & Employee)
-   🕒 Time In / Time Out Recording
-   📊 Attendance Monitoring Dashboard
-   📄 PDF Report Generation
-   📈 Excel Report Export
-   🛡 Middleware Route Protection
-   🗄 Database Management using Prisma ORM

------------------------------------------------------------------------

## 🛠 Tech Stack

### Frontend

-   React
-   Next.js (App Router)
-   TypeScript
-   CSS

### Backend

-   Node.js
-   Next.js API Routes
-   Prisma ORM

### Database

-   PostgreSQL

------------------------------------------------------------------------

## 🏗 System Architecture

The system follows a Three-Tier Architecture:

1.  Presentation Layer (React + Next.js)
2.  Application Layer (Node.js API + Prisma)
3.  Data Layer (PostgreSQL Database)

------------------------------------------------------------------------

## ⚙️ Installation Guide

### 1. Clone the Repository

git clone https://github.com/your-username/barangay-attendance.git cd
barangay-attendance

### 2. Install Dependencies

npm install

### 3. Setup Environment Variables

Create a .env file:

DATABASE_URL="postgresql://username:password@localhost:5432/barangay_db"

### 4. Run Prisma Migration

npx prisma migrate dev

### 5. Run Development Server

npm run dev

Open: http://localhost:3000

------------------------------------------------------------------------

## 👥 User Roles

### Admin

-   Manage employees
-   View attendance records
-   Generate reports

### Employee

-   Login
-   Time In / Time Out
-   View attendance history

------------------------------------------------------------------------

## 🔒 Security Features

-   Password hashing
-   Role-based authorization
-   Middleware route protection
-   Secure API endpoints

------------------------------------------------------------------------

## 📊 Database Design

User (1) → (Many) Attendance

------------------------------------------------------------------------

## 📌 Future Improvements

-   Biometric integration
-   Mobile application version
-   SMS/Email notifications
-   Cloud backup

------------------------------------------------------------------------
## Group Members
-   ARMENION, CARL MICAHEL S.
-   BACAY, ANGELO S.
-   GA, JERWIN F.
-   JALLORES, JOSE MAURICIO A.
-   VALEROSO, ANGELICA M.
-   CO, ANNE DOMINIQUE A.
-   PAJAROJA, MICHAEL LYN C.
-   ESTOPASE, KZEL Y.
-   BANEZ, FAITH ANNE E.
-   AGUILAR, MENANDRO JR. S
------------------------------------------------------------------------

## 📄 License

This project is for educational purposes.
