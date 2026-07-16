-- University Medical Center System - Database Schema
-- Run this file to set up the MySQL database

CREATE DATABASE IF NOT EXISTS university_medical_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE university_medical_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'doctor', 'student', 'teacher', 'staff') NOT NULL DEFAULT 'student',
    phone VARCHAR(20),
    department VARCHAR(100),
    student_id VARCHAR(50),
    profile_image VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Doctor Profiles Table
CREATE TABLE IF NOT EXISTS doctor_profiles (
    profile_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    specialization VARCHAR(100),
    qualifications TEXT,
    experience_years INT DEFAULT 0,
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    available_days VARCHAR(100) DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday',
    bio TEXT,
    hospital_affiliation VARCHAR(200),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    meeting_type ENUM('Online', 'Offline') DEFAULT 'Offline',
    meeting_link VARCHAR(500),
    status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
    chief_complaint TEXT,
    symptoms TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Medical Records Table
CREATE TABLE IF NOT EXISTS medical_records (
    record_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_id INT,
    record_date DATE NOT NULL,
    diagnosis TEXT,
    prescription TEXT,
    prescription_pdf VARCHAR(500),
    doctor_notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL
);

-- Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
    medicine_id INT PRIMARY KEY AUTO_INCREMENT,
    generic_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    category VARCHAR(100),
    current_stock INT DEFAULT 0,
    minimum_stock INT DEFAULT 10,
    unit VARCHAR(50) DEFAULT 'tablets',
    selling_price DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    university_name VARCHAR(200) DEFAULT 'University Medical Center',
    university_logo VARCHAR(500),
    university_address TEXT,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    dark_mode BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Emergency Alerts Table
CREATE TABLE IF NOT EXISTS emergency_alerts (
    alert_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    symptoms TEXT,
    location VARCHAR(255),
    status ENUM('Active', 'Responded', 'Resolved') DEFAULT 'Active',
    response_notes TEXT,
    alert_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (patient_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    campaign_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Counseling Requests Table
CREATE TABLE IF NOT EXISTS counseling_requests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    message TEXT NOT NULL,
    status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_emergency_status ON emergency_alerts(status);

-- =====================
-- SEED DATA
-- =====================

-- Default System Settings
INSERT INTO system_settings (university_name, university_address, contact_phone, contact_email) 
VALUES ('University Medical Center', '123 University Avenue, Campus District', '+1-555-0100', 'medical@university.edu');

-- Admin User (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role, phone, is_active) VALUES
('admin', 'admin@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/KeYvjUkJ8YoqBVkDO', 'System Administrator', 'admin', '+1-555-0001', TRUE);

-- Sample Doctors (password: doctor123)
INSERT INTO users (username, email, password_hash, full_name, role, phone, is_active) VALUES
('dr_smith', 'dr.smith@university.edu', '$2b$12$8K1p/a0dL1LXMIgoEMO5EuGxO3/B5RJoEqhZVfOPw6v7J5JkM2kJa', 'Dr. James Smith', 'doctor', '+1-555-0002', TRUE),
('dr_johnson', 'dr.johnson@university.edu', '$2b$12$8K1p/a0dL1LXMIgoEMO5EuGxO3/B5RJoEqhZVfOPw6v7J5JkM2kJa', 'Dr. Sarah Johnson', 'doctor', '+1-555-0003', TRUE),
('dr_patel', 'dr.patel@university.edu', '$2b$12$8K1p/a0dL1LXMIgoEMO5EuGxO3/B5RJoEqhZVfOPw6v7J5JkM2kJa', 'Dr. Raj Patel', 'doctor', '+1-555-0004', TRUE);

-- Doctor Profiles
INSERT INTO doctor_profiles (user_id, specialization, qualifications, experience_years, consultation_fee, available_days, bio) VALUES
(2, 'General Medicine', 'MBBS, MD (Internal Medicine)', 12, 50.00, 'Monday,Tuesday,Wednesday,Thursday,Friday', 'Experienced general physician with focus on preventive healthcare.'),
(3, 'Psychiatry & Mental Health', 'MBBS, MD (Psychiatry), Fellowship in Cognitive Therapy', 8, 75.00, 'Monday,Wednesday,Friday', 'Specialized in student mental health and anxiety management.'),
(4, 'Dermatology', 'MBBS, MD (Dermatology)', 10, 60.00, 'Tuesday,Thursday,Friday', 'Expert in skin conditions and dermatological treatments.');

-- Sample Students (password: student123)
INSERT INTO users (username, email, password_hash, full_name, role, phone, department, student_id, is_active) VALUES
('john_doe', 'john.doe@student.edu', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Doe', 'student', '+1-555-0010', 'Computer Science', 'CS2021001', TRUE),
('jane_smith', 'jane.smith@student.edu', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Smith', 'student', '+1-555-0011', 'Biology', 'BIO2021002', TRUE),
('prof_wilson', 'prof.wilson@university.edu', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Prof. Robert Wilson', 'teacher', '+1-555-0012', 'Physics', NULL, TRUE);

-- Sample Medicines
INSERT INTO medicines (generic_name, brand_name, category, current_stock, minimum_stock, unit, selling_price, description) VALUES
('Paracetamol', 'Tylenol', 'Analgesic', 500, 50, 'tablets', 0.50, 'Pain reliever and fever reducer'),
('Ibuprofen', 'Advil', 'Anti-inflammatory', 300, 30, 'tablets', 0.75, 'Pain, fever, and inflammation relief'),
('Amoxicillin', 'Amoxil', 'Antibiotic', 150, 20, 'capsules', 1.50, 'Broad-spectrum antibiotic'),
('Cetirizine', 'Zyrtec', 'Antihistamine', 200, 25, 'tablets', 0.80, 'Allergy relief'),
('Omeprazole', 'Prilosec', 'Antacid', 100, 15, 'capsules', 1.20, 'Acid reflux and heartburn'),
('Metformin', 'Glucophage', 'Antidiabetic', 80, 10, 'tablets', 0.60, 'Type 2 diabetes management'),
('Atorvastatin', 'Lipitor', 'Statin', 120, 15, 'tablets', 1.80, 'Cholesterol management'),
('Vitamin C', 'Ascorbic Acid', 'Supplement', 400, 50, 'tablets', 0.30, 'Immune system support'),
('Multivitamin', 'Centrum', 'Supplement', 250, 30, 'tablets', 0.90, 'Daily nutritional supplement'),
('Azithromycin', 'Zithromax', 'Antibiotic', 5, 20, 'tablets', 2.50, 'Bacterial infection treatment');

-- Sample Campaigns
INSERT INTO campaigns (title, description, campaign_type, start_date, end_date, location, is_active, created_by) VALUES
('Annual Health Checkup Drive', 'Free annual health checkups for all students and staff', 'Health Screening', '2025-01-15', '2025-01-31', 'University Health Center - Room 101', TRUE, 1),
('Mental Health Awareness Week', 'Workshops and counseling sessions for mental wellbeing', 'Awareness', '2025-02-01', '2025-02-07', 'Student Union Building', TRUE, 1),
('COVID-19 Booster Vaccination', 'Booster dose vaccination camp for university community', 'Vaccination', '2025-01-20', '2025-01-25', 'Sports Complex Hall A', TRUE, 1),
('Dental Health Camp', 'Free dental checkups and awareness', 'Health Screening', '2024-12-01', '2024-12-05', 'Dental Clinic - Building C', FALSE, 1);

-- Sample Appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, meeting_type, status, chief_complaint, symptoms) VALUES
(5, 2, CURDATE(), '10:00:00', 'Offline', 'Pending', 'Headache and fever', 'Persistent headache for 2 days, mild fever'),
(6, 3, CURDATE(), '14:00:00', 'Online', 'Confirmed', 'Stress and anxiety', 'Exam stress, difficulty sleeping'),
(5, 4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 'Offline', 'Pending', 'Skin rash', 'Rash on arms since 3 days'),
(7, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '09:00:00', 'Offline', 'Completed', 'Regular checkup', 'Routine health checkup');

-- Update meeting link for confirmed appointment
UPDATE appointments SET meeting_link = 'https://meet.jit.si/UMC-20250115-143022-6f8a2b' WHERE appointment_id = 2;

-- Sample Medical Record
INSERT INTO medical_records (patient_id, doctor_id, appointment_id, record_date, diagnosis, prescription, doctor_notes, follow_up_date) VALUES
(7, 2, 4, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Healthy - No abnormalities found', 'Vitamin C 500mg daily\nMultivitamin tablet daily', 'Patient is in good health. Advised to maintain healthy diet and regular exercise.', DATE_ADD(CURDATE(), INTERVAL 30 DAY));

-- Sample Emergency Alert
INSERT INTO emergency_alerts (patient_id, symptoms, location, status) VALUES
(5, 'Severe chest pain and difficulty breathing', 'Library Building - 2nd Floor', 'Resolved');
