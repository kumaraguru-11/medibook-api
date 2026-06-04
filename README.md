# MediBook API

RESTful API for a doctor appointment booking platform built using **Express.js** and **PostgreSQL**. The API supports secure authentication, doctor availability management, appointment scheduling, and role-based access control.

---

## 🚀 Features

### Authentication & Authorization

- JWT-based authentication
- Access Token and Refresh Token implementation
- Secure password hashing using bcrypt
- Role-based authorization
- Protected API routes

### Appointment Management

- Create appointments
- View appointment history
- Manage appointment status
- Prevent booking appointments in the past
- Prevent overlapping appointment slots

### Doctor Management

- Doctor profile management
- Doctor availability scheduling
- Time slot management
- Appointment tracking

### Security

- Password hashing with bcrypt
- JWT token validation
- Secure route protection
- Helmet security middleware
- CORS configuration

---

## 🏗️ Architecture

The API follows a modular, domain-driven architecture for high maintainability, separation of concerns, and scalability.

### Key Highlights

- RESTful API design
- JWT Authentication
- Refresh Token Flow
- Role-Based Access Control
- PostgreSQL Database
- SQL Migration System
- Input Validation
- Error Handling Middleware

---

## 🛠️ Tech Stack

### Backend

- Node.js
- Express.js

### Database

- PostgreSQL
- pg

### Authentication

- JWT (jsonwebtoken)
- bcrypt

### Security

- Helmet
- CORS

### Development Tools

- Nodemon
- Dotenv

---

## 📂 Project Structure

```text
medibook-api
├── config/         # App configurations
├── middleware/     # Global express middlewares
├── migrations/     # Database schemas & migrations
├── modules/        # Domain-driven features (auth, doctor, appointment, etc.)
└── utils/          # Shared utility functions
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

DATABASE_URL=

FRONTEND_URL=
```

### Environment Variable Description

| Variable | Description |
|-----------|-------------|
| PORT | Server Port |
| JWT_ACCESS_SECRET | Access Token Secret |
| JWT_REFRESH_SECRET | Refresh Token Secret |
| DATABASE_URL | PostgreSQL Connection String |
| FRONTEND_URL | Frontend URL for CORS |

---

## 📦 Installation

### Clone Repository

```bash
git clone https://github.com/kumaraguru-11/medibook-api.git
```

### Navigate to Project Directory

```bash
cd medibook-api
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create the `.env` file and add the required values.

### Run Database Migrations

```bash
npm run migrate
```

### Start Development Server

```bash
npm start
```

Server will run on:

```text
http://localhost:5000
```

---

## 🗄️ Database Migrations

Run migrations:

```bash
npm run migrate
```

This command creates the required database tables and schema for the application.



## 🔗 Related Repository

### Frontend Repository

https://github.com/kumaraguru-11/medibook-ui.git

---

## 🌐 Live Demo

### Frontend

https://medibook-ui-eight.vercel.app

### Backend

https://medibook-api.vercel.app/api

---

## 🎯 Project Highlights

- JWT Authentication
- Refresh Token Implementation
- Role-Based Authorization
- PostgreSQL Integration
- Appointment Scheduling System
- Doctor Availability Management
- Appointment Conflict Prevention
- SQL Migration System
- RESTful API Design
- Security Best Practices

---

## 👨‍💻 Author

**Kumaraguru S**

- LinkedIn: https://www.linkedin.com/in/kumaraguru403
- GitHub: https://github.com/kumaraguru-11