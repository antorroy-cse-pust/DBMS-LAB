# University Medical Center System

A full-stack web application for managing university healthcare services. Built with **Flask**, **React**, and **MySQL**.

## Features

- **Multi-role authentication** — Admin, Doctor, Student, Teacher, Staff
- **Appointment booking** — Real-time slot availability, 9 AM–10 PM, Friday holiday enforced
- **Doctor leave management** — Apply → Admin approves → Slots auto-blocked
- **Medical records & prescriptions** — PDF generation, patient history
- **Pharmacy management** — Medicine inventory with low-stock alerts
- **Emergency alert system** — Campus-wide emergency notifications
- **Health campaigns** — Admin broadcasts health awareness messages
- **Admin dashboard** — Real-time stats and system overview

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Backend | Python, Flask, Flask-JWT-Extended |
| Database | MySQL, PyMySQL |
| Auth | JWT tokens, bcrypt password hashing |
| PDF | ReportLab |

## Project Structure

```
university-medical-system/
├── backend/
│   ├── app.py          # All Flask routes and API logic
│   ├── config.py       # App configuration
│   └── requirements.txt
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/ # Layout, PrivateRoute, etc.
│       ├── context/    # Auth context (JWT handling)
│       ├── pages/      # All page components
│       └── services/   # Axios API service
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 16+
- MySQL 8.0+

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/university-medical-system.git
cd university-medical-system
```

### 2. Database setup
- Create a MySQL database named `university_medical_system`
- Import the schema (run the app once — tables are auto-created on first run)
- Update `backend/config.py` with your MySQL credentials

### 3. Backend setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```
Backend runs at `http://localhost:5000`

### 4. Frontend setup
```bash
cd frontend
npm install
npm start
```
Frontend runs at `http://localhost:3000`

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@university.edu | admin123 |
| Doctor | dr.smith@university.edu | doctor123 |
| Student | john.doe@student.edu | student123 |

> **Note:** Change these credentials before any real deployment.

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | New user registration |
| GET | `/api/appointments` | Get user appointments |
| POST | `/api/appointments` | Book appointment |
| GET | `/api/doctor/leaves` | Get doctor leave requests |
| POST | `/api/doctor/leaves` | Apply for leave |
| PUT | `/api/admin/leaves/<id>/approve` | Admin approves leave |
| GET | `/api/pharmacy/medicines` | Get medicine list |
| GET | `/api/dashboard/stats` | Dashboard statistics |

## Appointment Rules

- Available **Saturday to Thursday**, 9:00 AM – 10:00 PM
- **Friday** is the weekly holiday — booking is blocked
- Past time slots are automatically disabled for today's date
- If a doctor has an approved leave, all their slots are blocked for those dates

## Screenshots

> Add screenshots of your dashboard, booking page, and admin panel here.

## Course Information

**Course:** CSE3100 — Software Project 1  
**University:** [Your University Name]  
**Semester:** 3rd Year, 1st Semester

## License

This project was developed for academic purposes.