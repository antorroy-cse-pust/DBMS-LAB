"""
University Medical Center System - Flask Backend
Run: python app.py
Default Admin: admin@university.edu / admin123
"""

import os
import uuid
import bcrypt
import pymysql
import json
import decimal
from datetime import datetime, date, timedelta
from functools import wraps
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)
from werkzeug.utils import secure_filename
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# CORS
CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

# JWT
jwt = JWTManager(app)

# Create upload directories
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(Config.PDF_FOLDER, exist_ok=True)


# DATABASE


def get_db():
    return pymysql.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
        charset='utf8mb4'
    )

def query_db(sql, args=(), one=False, commit=False):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute(sql, args)
            if commit:
                conn.commit()
                return cursor.lastrowid if cursor.lastrowid else cursor.rowcount
            result = cursor.fetchone() if one else cursor.fetchall()
            return result
    finally:
        conn.close()

# HELPERS


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def serialize_date(obj):
    """JSON serializer for dates, decimals, and timedeltas."""
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, decimal.Decimal):
        return float(obj)
    if isinstance(obj, timedelta):
        total_seconds = int(obj.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    raise TypeError(f"Type {type(obj)} not serializable")

def jsonify_data(data):
    return app.response_class(
        response=json.dumps(data, default=serialize_date),
        status=200,
        mimetype='application/json'
    )

def success_response(data=None, message="Success", status=200):
    resp = {"success": True, "message": message}
    if data is not None:
        resp["data"] = data
    return app.response_class(
        response=json.dumps(resp, default=serialize_date),
        status=status,
        mimetype='application/json'
    )

def error_response(message="Error", status=400):
    return jsonify({"success": False, "message": message}), status

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role', '')
            if user_role not in roles:
                return error_response("Insufficient permissions", 403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# AUTH


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    required = ['username', 'email', 'password', 'full_name', 'role']
    for field in required:
        if not data.get(field):
            return error_response(f"Field '{field}' is required")

    role = data['role']
    if role not in ['student', 'teacher', 'staff']:
        return error_response("Invalid role. Must be student, teacher, or staff")

    existing = query_db("SELECT user_id FROM users WHERE email=%s OR username=%s",
                        (data['email'], data['username']), one=True)
    if existing:
        return error_response("Email or username already exists")

    pw_hash = hash_password(data['password'])
    user_id = query_db(
        """INSERT INTO users (username, email, password_hash, full_name, role, phone, department, student_id)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (data['username'], data['email'], pw_hash, data['full_name'], role,
         data.get('phone', ''), data.get('department', ''), data.get('student_id', '')),
        commit=True
    )

    user = query_db("SELECT user_id, username, email, full_name, role, is_active FROM users WHERE user_id=%s",
                    (user_id,), one=True)
    token = create_access_token(
        identity=str(user_id),
        additional_claims={'role': role, 'full_name': data['full_name']}
    )
    return success_response({"user": user, "token": token}, "Registration successful", 201)


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    if not data.get('email') or not data.get('password'):
        return error_response("Email and password required")

    user = query_db("SELECT * FROM users WHERE email=%s", (data['email'],), one=True)
    if not user:
        return error_response("Invalid credentials", 401)
    if not user['is_active']:
        return error_response("Account is blocked. Contact administrator.", 403)
    if not check_password(data['password'], user['password_hash']):
        return error_response("Invalid credentials", 401)

    doctor_profile = None
    if user['role'] == 'doctor':
        doctor_profile = query_db(
            "SELECT * FROM doctor_profiles WHERE user_id=%s", (user['user_id'],), one=True
        )

    token = create_access_token(
        identity=str(user['user_id']),
        additional_claims={'role': user['role'], 'full_name': user['full_name']}
    )

    user_data = {k: v for k, v in user.items() if k != 'password_hash'}
    if doctor_profile:
        user_data['doctor_profile'] = doctor_profile

    return success_response({"user": user_data, "token": token}, "Login successful")


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = query_db(
        "SELECT user_id, username, email, full_name, role, phone, department, student_id, profile_image, is_active, created_at FROM users WHERE user_id=%s",
        (user_id,), one=True
    )
    if not user:
        return error_response("User not found", 404)

    if user['role'] == 'doctor':
        doctor_profile = query_db(
            "SELECT * FROM doctor_profiles WHERE user_id=%s", (user['user_id'],), one=True
        )
        if doctor_profile:
            user['doctor_profile'] = doctor_profile

    return success_response(user)


# USER / PROFILE


@app.route('/api/users/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.json
    query_db(
        "UPDATE users SET full_name=%s, phone=%s, department=%s, student_id=%s WHERE user_id=%s",
        (data.get('full_name'), data.get('phone'), data.get('department'), data.get('student_id'), user_id),
        commit=True
    )

    claims = get_jwt()
    if claims.get('role') == 'doctor' and data.get('doctor_profile'):
        dp = data['doctor_profile']
        existing = query_db("SELECT profile_id FROM doctor_profiles WHERE user_id=%s", (user_id,), one=True)
        if existing:
            query_db(
                """UPDATE doctor_profiles SET specialization=%s, qualifications=%s, experience_years=%s,
                   consultation_fee=%s, available_days=%s, bio=%s, hospital_affiliation=%s WHERE user_id=%s""",
                (dp.get('specialization'), dp.get('qualifications'), dp.get('experience_years'),
                 dp.get('consultation_fee'), dp.get('available_days'), dp.get('bio'),
                 dp.get('hospital_affiliation'), user_id),
                commit=True
            )
        else:
            query_db(
                """INSERT INTO doctor_profiles (user_id, specialization, qualifications, experience_years,
                   consultation_fee, available_days, bio, hospital_affiliation)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (user_id, dp.get('specialization'), dp.get('qualifications'), dp.get('experience_years'),
                 dp.get('consultation_fee'), dp.get('available_days'), dp.get('bio'),
                 dp.get('hospital_affiliation')),
                commit=True
            )

    user = query_db(
        "SELECT user_id, username, email, full_name, role, phone, department, student_id, profile_image FROM users WHERE user_id=%s",
        (user_id,), one=True
    )
    return success_response(user, "Profile updated successfully")


@app.route('/api/users/upload-image', methods=['POST'])
@jwt_required()
def upload_image():
    user_id = get_jwt_identity()
    if 'image' not in request.files:
        return error_response("No image file provided")

    file = request.files['image']
    if file.filename == '':
        return error_response("No file selected")
    if not allowed_file(file.filename):
        return error_response("Invalid file type")

    filename = f"profile_{user_id}_{uuid.uuid4().hex[:8]}.{file.filename.rsplit('.', 1)[1].lower()}"
    filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
    file.save(filepath)

    image_url = f"/uploads/{filename}"
    query_db("UPDATE users SET profile_image=%s WHERE user_id=%s", (image_url, user_id), commit=True)
    return success_response({"image_url": image_url}, "Image uploaded successfully")


@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(Config.UPLOAD_FOLDER, filename)


# DOCTORS


@app.route('/api/doctors', methods=['GET'])
@jwt_required()
def get_doctors():
    doctors = query_db(
        """SELECT u.user_id, u.full_name, u.email, u.phone, u.profile_image,
                  dp.specialization, dp.qualifications, dp.experience_years,
                  dp.consultation_fee, dp.available_days, dp.bio, dp.hospital_affiliation
           FROM users u
           LEFT JOIN doctor_profiles dp ON u.user_id = dp.user_id
           WHERE u.role='doctor' AND u.is_active=TRUE"""
    )
    return success_response(doctors)


@app.route('/api/doctors/<int:doctor_id>', methods=['GET'])
@jwt_required()
def get_doctor(doctor_id):
    doctor = query_db(
        """SELECT u.user_id, u.full_name, u.email, u.phone, u.profile_image,
                  dp.specialization, dp.qualifications, dp.experience_years,
                  dp.consultation_fee, dp.available_days, dp.bio, dp.hospital_affiliation
           FROM users u
           LEFT JOIN doctor_profiles dp ON u.user_id = dp.user_id
           WHERE u.user_id=%s AND u.role='doctor'""",
        (doctor_id,), one=True
    )
    if not doctor:
        return error_response("Doctor not found", 404)
    return success_response(doctor)


@app.route('/api/admin/doctors', methods=['POST'])
@role_required('admin')
def create_doctor():
    data = request.json
    required = ['username', 'email', 'password', 'full_name']
    for field in required:
        if not data.get(field):
            return error_response(f"Field '{field}' is required")

    existing = query_db("SELECT user_id FROM users WHERE email=%s OR username=%s",
                        (data['email'], data['username']), one=True)
    if existing:
        return error_response("Email or username already exists")

    pw_hash = hash_password(data['password'])
    user_id = query_db(
        "INSERT INTO users (username, email, password_hash, full_name, role, phone) VALUES (%s,%s,%s,%s,'doctor',%s)",
        (data['username'], data['email'], pw_hash, data['full_name'], data.get('phone', '')),
        commit=True
    )

    dp = data.get('doctor_profile', {})
    query_db(
        """INSERT INTO doctor_profiles (user_id, specialization, qualifications, experience_years,
           consultation_fee, available_days, bio, hospital_affiliation)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
        (user_id, dp.get('specialization', ''), dp.get('qualifications', ''),
         dp.get('experience_years', 0), dp.get('consultation_fee', 0),
         dp.get('available_days', 'Monday,Tuesday,Wednesday,Thursday,Friday'),
         dp.get('bio', ''), dp.get('hospital_affiliation', '')),
        commit=True
    )
    return success_response({"user_id": user_id}, "Doctor created successfully", 201)


# APPOINTMENTS


@app.route('/api/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')

    if role == 'admin':
        appointments = query_db(
            """SELECT a.*,
                      p.full_name as patient_name, p.email as patient_email, p.profile_image as patient_image,
                      d.full_name as doctor_name, dp.specialization
               FROM appointments a
               JOIN users p ON a.patient_id = p.user_id
               JOIN users d ON a.doctor_id = d.user_id
               LEFT JOIN doctor_profiles dp ON d.user_id = dp.user_id
               ORDER BY a.created_at DESC"""
        )
    elif role == 'doctor':
        appointments = query_db(
            """SELECT a.*,
                      p.full_name as patient_name, p.email as patient_email, p.phone as patient_phone,
                      p.profile_image as patient_image
               FROM appointments a
               JOIN users p ON a.patient_id = p.user_id
               WHERE a.doctor_id=%s
               ORDER BY a.appointment_date DESC, a.appointment_time DESC""",
            (user_id,)
        )
    else:
        appointments = query_db(
            """SELECT a.*,
                      d.full_name as doctor_name, d.email as doctor_email, d.profile_image as doctor_image,
                      dp.specialization
               FROM appointments a
               JOIN users d ON a.doctor_id = d.user_id
               LEFT JOIN doctor_profiles dp ON d.user_id = dp.user_id
               WHERE a.patient_id=%s
               ORDER BY a.created_at DESC""",
            (user_id,)
        )
    return success_response(appointments)


@app.route('/api/appointments', methods=['POST'])
@jwt_required()
def book_appointment():
    user_id = get_jwt_identity()
    claims = get_jwt()
    if claims.get('role') == 'doctor':
        return error_response("Doctors cannot book appointments")

    data = request.json
    required = ['doctor_id', 'appointment_date', 'appointment_time']
    for field in required:
        if not data.get(field):
            return error_response(f"Field '{field}' is required")

    doctor = query_db(
        """SELECT u.user_id, u.full_name, dp.specialization
           FROM users u LEFT JOIN doctor_profiles dp ON u.user_id=dp.user_id
           WHERE u.user_id=%s AND u.role='doctor'""",
        (data['doctor_id'],), one=True
    )
    if not doctor:
        return error_response("Doctor not found")

    # ── Friday check (weekday 4 = Friday in Python) ──
    try:
        appt_date_obj = datetime.strptime(data['appointment_date'], '%Y-%m-%d').date()
    except ValueError:
        return error_response("Invalid date format")

    if appt_date_obj.weekday() == 4:   # Friday
        return error_response("Friday is a weekly holiday. Please select another date.")

    # ── Clinic hours check (09:00 – 22:00) ──
    try:
        appt_time_str = data['appointment_time'][:5]   # "HH:MM"
        appt_hour, appt_min = map(int, appt_time_str.split(':'))
        appt_minutes = appt_hour * 60 + appt_min
    except Exception:
        return error_response("Invalid time format")

    if appt_minutes < 9 * 60 or appt_minutes >= 22 * 60:
        return error_response("Appointments are only available between 9:00 AM and 10:00 PM.")

    # ── Past date/time check ──
    now = datetime.now()
    if appt_date_obj < now.date():
        return error_response("Cannot book an appointment in the past. Please select a future date.")
    if appt_date_obj == now.date():
        current_minutes = now.hour * 60 + now.minute
        if appt_minutes <= current_minutes:
            return error_response("This time slot has already passed today. Please select a later time.")

    # ── Doctor approved-leave check ──
    on_leave = query_db(
        """SELECT leave_id, leave_start, leave_end FROM doctor_leaves
           WHERE doctor_id=%s AND status='approved'
           AND %s BETWEEN leave_start AND leave_end""",
        (data['doctor_id'], data['appointment_date']), one=True
    )
    if on_leave:
        leave_start = on_leave['leave_start']
        leave_end   = on_leave['leave_end']
        if isinstance(leave_start, date):
            leave_start = leave_start.strftime('%d %b %Y')
            leave_end   = leave_end.strftime('%d %b %Y')
        return error_response(
            f"Dr. {doctor['full_name']} is on approved leave from {leave_start} to {leave_end}. "
            f"Please choose a different date or select another doctor."
        )

    # ── Duplicate slot check ──
    conflict = query_db(
        """SELECT appointment_id FROM appointments
           WHERE doctor_id=%s AND appointment_date=%s AND appointment_time=%s
           AND status NOT IN ('Cancelled')""",
        (data['doctor_id'], data['appointment_date'], data['appointment_time']),
        one=True
    )
    if conflict:
        return error_response("This time slot is already booked. Please choose another time.")

    appt_id = query_db(
        """INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time,
           meeting_type, chief_complaint, symptoms)
           VALUES (%s,%s,%s,%s,%s,%s,%s)""",
        (user_id, data['doctor_id'], data['appointment_date'], data['appointment_time'],
         data.get('meeting_type', 'Offline'), data.get('chief_complaint', ''), data.get('symptoms', '')),
        commit=True
    )
    return success_response({"appointment_id": appt_id}, "Appointment booked successfully", 201)


@app.route('/api/appointments/<int:appt_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_appointment(appt_id):
    user_id = get_jwt_identity()
    claims = get_jwt()
    data = request.json or {}

    appt = query_db("SELECT * FROM appointments WHERE appointment_id=%s", (appt_id,), one=True)
    if not appt:
        return error_response("Appointment not found", 404)

    if claims.get('role') not in ['admin'] and str(appt['patient_id']) != str(user_id):
        return error_response("Not authorized", 403)

    query_db(
        "UPDATE appointments SET status='Cancelled', cancellation_reason=%s WHERE appointment_id=%s",
        (data.get('reason', 'Cancelled by patient'), appt_id),
        commit=True
    )
    return success_response(None, "Appointment cancelled")


# DOCTOR PANEL


@app.route('/api/doctor/appointments', methods=['GET'])
@role_required('doctor')
def doctor_appointments():
    user_id = get_jwt_identity()
    status_filter = request.args.get('status', '')
    date_filter = request.args.get('date', '')

    sql = """SELECT a.*,
                    p.full_name as patient_name, p.email as patient_email,
                    p.phone as patient_phone, p.profile_image as patient_image,
                    p.department, p.student_id
             FROM appointments a
             JOIN users p ON a.patient_id = p.user_id
             WHERE a.doctor_id=%s"""
    params = [user_id]

    if status_filter:
        sql += " AND a.status=%s"
        params.append(status_filter)
    if date_filter:
        sql += " AND a.appointment_date=%s"
        params.append(date_filter)

    sql += " ORDER BY a.appointment_date DESC, a.appointment_time ASC"
    appointments = query_db(sql, params)
    return success_response(appointments)


@app.route('/api/doctor/appointments/today', methods=['GET'])
@role_required('doctor')
def doctor_today_appointments():
    user_id = get_jwt_identity()
    today = date.today().isoformat()
    appointments = query_db(
        """SELECT a.*,
                  p.full_name as patient_name, p.email as patient_email,
                  p.phone as patient_phone, p.profile_image as patient_image
           FROM appointments a
           JOIN users p ON a.patient_id = p.user_id
           WHERE a.doctor_id=%s AND a.appointment_date=%s
           ORDER BY a.appointment_time ASC""",
        (user_id, today)
    )
    return success_response(appointments)


@app.route('/api/doctor/appointments/stats', methods=['GET'])
@role_required('doctor')
def doctor_appointment_stats():
    user_id = get_jwt_identity()
    today = date.today().isoformat()

    stats = {
        'today': query_db("SELECT COUNT(*) as c FROM appointments WHERE doctor_id=%s AND appointment_date=%s",
                          (user_id, today), one=True)['c'],
        'pending': query_db("SELECT COUNT(*) as c FROM appointments WHERE doctor_id=%s AND status='Pending'",
                            (user_id,), one=True)['c'],
        'confirmed': query_db("SELECT COUNT(*) as c FROM appointments WHERE doctor_id=%s AND status='Confirmed'",
                              (user_id,), one=True)['c'],
        'completed': query_db("SELECT COUNT(*) as c FROM appointments WHERE doctor_id=%s AND status='Completed'",
                              (user_id,), one=True)['c'],
        'cancelled': query_db("SELECT COUNT(*) as c FROM appointments WHERE doctor_id=%s AND status='Cancelled'",
                              (user_id,), one=True)['c'],
        'total': query_db("SELECT COUNT(*) as c FROM appointments WHERE doctor_id=%s",
                          (user_id,), one=True)['c'],
    }
    return success_response(stats)


@app.route('/api/doctor/appointments/<int:appt_id>/approve', methods=['PUT'])
@role_required('doctor')
def approve_appointment(appt_id):
    user_id = get_jwt_identity()
    appt = query_db("SELECT * FROM appointments WHERE appointment_id=%s AND doctor_id=%s",
                    (appt_id, user_id), one=True)
    if not appt:
        return error_response("Appointment not found", 404)

    meeting_link = None
    if appt['meeting_type'] == 'Online':
        room_id = f"UMC-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
        meeting_link = f"https://meet.jit.si/{room_id}"

    query_db(
        "UPDATE appointments SET status='Confirmed', meeting_link=%s WHERE appointment_id=%s",
        (meeting_link, appt_id), commit=True
    )
    return success_response({"meeting_link": meeting_link}, "Appointment approved")


@app.route('/api/doctor/appointments/<int:appt_id>/cancel', methods=['PUT'])
@role_required('doctor')
def doctor_cancel_appointment(appt_id):
    user_id = get_jwt_identity()
    data = request.json or {}

    if not data.get('reason'):
        return error_response("Cancellation reason is required")

    appt = query_db("SELECT * FROM appointments WHERE appointment_id=%s AND doctor_id=%s",
                    (appt_id, user_id), one=True)
    if not appt:
        return error_response("Appointment not found", 404)

    query_db(
        "UPDATE appointments SET status='Cancelled', cancellation_reason=%s WHERE appointment_id=%s",
        (data['reason'], appt_id), commit=True
    )
    return success_response(None, "Appointment cancelled")


@app.route('/api/doctor/appointments/<int:appt_id>/complete', methods=['PUT'])
@role_required('doctor')
def complete_appointment(appt_id):
    user_id = get_jwt_identity()
    appt = query_db("SELECT * FROM appointments WHERE appointment_id=%s AND doctor_id=%s",
                    (appt_id, user_id), one=True)
    if not appt:
        return error_response("Appointment not found", 404)

    query_db("UPDATE appointments SET status='Completed' WHERE appointment_id=%s", (appt_id,), commit=True)
    return success_response(None, "Appointment marked as completed")


@app.route('/api/doctor/patients', methods=['GET'])
@role_required('doctor')
def doctor_patients():
    user_id = get_jwt_identity()
    patients = query_db(
        """SELECT DISTINCT u.user_id, u.full_name, u.email, u.phone, u.department,
                  u.student_id, u.profile_image, u.role,
                  COUNT(a.appointment_id) as total_visits,
                  MAX(a.appointment_date) as last_visit
           FROM appointments a
           JOIN users u ON a.patient_id = u.user_id
           WHERE a.doctor_id=%s
           GROUP BY u.user_id
           ORDER BY last_visit DESC""",
        (user_id,)
    )
    return success_response(patients)


@app.route('/api/doctor/patients/<int:patient_id>/records', methods=['GET'])
@role_required('doctor')
def patient_records(patient_id):
    records = query_db(
        """SELECT mr.*, d.full_name as doctor_name, dp.specialization
           FROM medical_records mr
           JOIN users d ON mr.doctor_id = d.user_id
           LEFT JOIN doctor_profiles dp ON d.user_id = dp.user_id
           WHERE mr.patient_id=%s
           ORDER BY mr.record_date DESC""",
        (patient_id,)
    )
    return success_response(records)


@app.route('/api/doctor/medical-records', methods=['POST'])
@role_required('doctor')
def create_medical_record():
    user_id = get_jwt_identity()
    data = request.json
    required = ['patient_id', 'diagnosis', 'prescription']
    for field in required:
        if not data.get(field):
            return error_response(f"Field '{field}' is required")

    record_id = query_db(
        """INSERT INTO medical_records (patient_id, doctor_id, appointment_id, record_date,
           diagnosis, prescription, doctor_notes, follow_up_date)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
        (data['patient_id'], user_id, data.get('appointment_id'),
         data.get('record_date', date.today().isoformat()),
         data['diagnosis'], data['prescription'],
         data.get('doctor_notes', ''), data.get('follow_up_date')),
        commit=True
    )
    return success_response({"record_id": record_id}, "Medical record created", 201)


@app.route('/api/doctor/medical-records/<int:record_id>/pdf', methods=['GET'])
@jwt_required()
def download_prescription_pdf(record_id):
    record = query_db(
        """SELECT mr.*,
                  p.full_name as patient_name, p.email as patient_email, p.phone as patient_phone,
                  p.department, p.student_id,
                  d.full_name as doctor_name, d.email as doctor_email, d.phone as doctor_phone,
                  dp.specialization, dp.qualifications, dp.hospital_affiliation, dp.experience_years
           FROM medical_records mr
           JOIN users p ON mr.patient_id = p.user_id
           JOIN users d ON mr.doctor_id = d.user_id
           LEFT JOIN doctor_profiles dp ON d.user_id = dp.user_id
           WHERE mr.record_id=%s""",
        (record_id,), one=True
    )
    if not record:
        return error_response("Record not found", 404)

    # Always fetch CURRENT settings — so any admin change reflects immediately
    settings = query_db("SELECT * FROM system_settings LIMIT 1", one=True)
    uni_name = settings['university_name'] if settings else 'University Medical Center'
    uni_address = settings.get('university_address', '') if settings else ''
    uni_phone = settings.get('contact_phone', '') if settings else ''
    uni_email = settings.get('contact_email', 'medical@university.edu') if settings else 'medical@university.edu'
    uni_logo_path = None
    if settings and settings.get('university_logo'):
        logo_filename = settings['university_logo'].lstrip('/')
        full_logo_path = os.path.join(os.path.dirname(Config.UPLOAD_FOLDER),
                                       logo_filename.replace('uploads/', 'uploads/'))
        upload_logo_path = os.path.join(Config.UPLOAD_FOLDER,
                                         os.path.basename(settings['university_logo']))
        if os.path.exists(upload_logo_path):
            uni_logo_path = upload_logo_path

    pdf_filename = f"prescription_{record_id}_{uuid.uuid4().hex[:6]}.pdf"
    pdf_path = os.path.join(Config.PDF_FOLDER, pdf_filename)

    # Colors
    PRIMARY   = colors.HexColor('#1a3c6e')   # deep navy
    ACCENT    = colors.HexColor('#2563eb')   # blue
    LIGHT_BG  = colors.HexColor('#f0f4ff')   # very light blue
    GREEN_BG  = colors.HexColor('#ecfdf5')
    GREEN_TXT = colors.HexColor('#065f46')
    YELLOW_BG = colors.HexColor('#fffbeb')
    YELLOW_BD = colors.HexColor('#d97706')
    GREY_TXT  = colors.HexColor('#4b5563')
    DARK_TXT  = colors.HexColor('#111827')
    WHITE     = colors.white
    LIGHT_GREY = colors.HexColor('#e5e7eb')

    doc = SimpleDocTemplate(
        pdf_path, pagesize=A4,
        rightMargin=1.8*cm, leftMargin=1.8*cm,
        topMargin=1.5*cm, bottomMargin=1.8*cm
    )
    story = []

    # ── Styles ──────────────────────────────────────────────
    uni_name_style = ParagraphStyle('UniName', fontSize=18, fontName='Helvetica-Bold',
                                     textColor=PRIMARY, alignment=TA_LEFT, leading=22)
    uni_sub_style  = ParagraphStyle('UniSub', fontSize=9, fontName='Helvetica',
                                     textColor=GREY_TXT, alignment=TA_LEFT, leading=13)
    rx_title_style = ParagraphStyle('RxTitle', fontSize=22, fontName='Helvetica-Bold',
                                     textColor=WHITE, alignment=TA_CENTER, leading=26)
    label_style    = ParagraphStyle('Label', fontSize=8, fontName='Helvetica-Bold',
                                     textColor=GREY_TXT, leading=10, spaceAfter=1)
    value_style    = ParagraphStyle('Value', fontSize=10, fontName='Helvetica',
                                     textColor=DARK_TXT, leading=14, spaceAfter=2)
    value_bold     = ParagraphStyle('ValueBold', fontSize=10, fontName='Helvetica-Bold',
                                     textColor=DARK_TXT, leading=14, spaceAfter=2)
    section_style  = ParagraphStyle('Section', fontSize=9, fontName='Helvetica-Bold',
                                     textColor=ACCENT, leading=12)
    rx_item_style  = ParagraphStyle('RxItem', fontSize=10, fontName='Helvetica',
                                     textColor=DARK_TXT, leading=16, leftIndent=12, spaceAfter=4)
    note_style     = ParagraphStyle('Note', fontSize=10, fontName='Helvetica',
                                     textColor=DARK_TXT, leading=15, spaceAfter=4)
    footer_style   = ParagraphStyle('Footer', fontSize=8, fontName='Helvetica',
                                     textColor=GREY_TXT, alignment=TA_CENTER, leading=12)

    rx_date = record['record_date']
    if isinstance(rx_date, date):
        rx_date_str = rx_date.strftime('%d %B %Y')
    else:
        rx_date_str = str(rx_date)

    # ── HEADER: Logo + University Info ──────────────────────
    if uni_logo_path:
        from reportlab.platypus import Image as RLImage
        logo_img = RLImage(uni_logo_path, width=1.8*cm, height=1.8*cm)
        logo_cell = logo_img
    else:
        logo_cell = Paragraph('🏥', ParagraphStyle('Logo', fontSize=28, alignment=TA_CENTER))

    uni_info_content = [
        Paragraph(uni_name, uni_name_style),
        Paragraph('Medical Center — Health Services Division', uni_sub_style),
    ]
    if uni_address:
        uni_info_content.append(Paragraph(uni_address, uni_sub_style))
    contact_parts = []
    if uni_phone:
        contact_parts.append(f"Tel: {uni_phone}")
    if uni_email:
        contact_parts.append(f"Email: {uni_email}")
    if contact_parts:
        uni_info_content.append(Paragraph('  |  '.join(contact_parts), uni_sub_style))

    rx_number = f"Rx #{record_id:04d}"
    rx_info = Paragraph(
        f"<b>{rx_number}</b><br/>Date: {rx_date_str}",
        ParagraphStyle('RxInfo', fontSize=9, fontName='Helvetica',
                       textColor=GREY_TXT, alignment=TA_RIGHT, leading=14)
    )

    header_table = Table(
        [[logo_cell, uni_info_content, rx_info]],
        colWidths=[2*cm, 12*cm, 3.4*cm]
    )
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (0,0), 0),
        ('RIGHTPADDING', (-1,0), (-1,0), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(header_table)

    # Blue banner: MEDICAL PRESCRIPTION
    banner_data = [[Paragraph('MEDICAL PRESCRIPTION', rx_title_style)]]
    banner = Table(banner_data, colWidths=[17.4*cm])
    banner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), PRIMARY),
        ('TOPPADDING', (0,0), (0,0), 10),
        ('BOTTOMPADDING', (0,0), (0,0), 10),
        ('ROUNDEDCORNERS', [4,4,4,4]),
    ]))
    story.append(banner)
    story.append(Spacer(1, 0.4*cm))

    # ── DOCTOR + PATIENT INFO ────────────────────────────────
    doc_lines = [
        Paragraph('PRESCRIBING DOCTOR', label_style),
        Paragraph(f"Dr. {record['doctor_name']}", value_bold),
        Paragraph(record.get('specialization') or 'General Physician', value_style),
    ]
    if record.get('qualifications'):
        doc_lines.append(Paragraph(record['qualifications'], value_style))
    if record.get('hospital_affiliation'):
        doc_lines.append(Paragraph(record['hospital_affiliation'], value_style))
    if record.get('doctor_phone'):
        doc_lines.append(Paragraph(f"Contact: {record['doctor_phone']}", value_style))

    pat_lines = [
        Paragraph('PATIENT DETAILS', label_style),
        Paragraph(record['patient_name'], value_bold),
    ]
    if record.get('patient_email'):
        pat_lines.append(Paragraph(record['patient_email'], value_style))
    if record.get('patient_phone'):
        pat_lines.append(Paragraph(f"Phone: {record['patient_phone']}", value_style))
    if record.get('department'):
        pat_lines.append(Paragraph(f"Dept: {record['department']}", value_style))
    if record.get('student_id'):
        pat_lines.append(Paragraph(f"ID: {record['student_id']}", value_style))

    info_table = Table([[doc_lines, pat_lines]], colWidths=[8.5*cm, 8.9*cm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), LIGHT_BG),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#f9fafb')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('LINEAFTER', (0,0), (0,0), 1, LIGHT_GREY),
        ('BOX', (0,0), (-1,-1), 1, LIGHT_GREY),
        ('ROUNDEDCORNERS', [4,4,4,4]),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.45*cm))

    # ── DIAGNOSIS ───────────────────────────────────────────
    diag_header = Table([[Paragraph('▸  DIAGNOSIS', section_style)]], colWidths=[17.4*cm])
    diag_header.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), LIGHT_BG),
        ('TOPPADDING', (0,0), (0,0), 6),
        ('BOTTOMPADDING', (0,0), (0,0), 6),
        ('LEFTPADDING', (0,0), (0,0), 10),
        ('BOX', (0,0), (0,0), 1, LIGHT_GREY),
    ]))
    story.append(diag_header)

    diag_body = Table(
        [[Paragraph(record.get('diagnosis') or 'No diagnosis recorded', note_style)]],
        colWidths=[17.4*cm]
    )
    diag_body.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), YELLOW_BG),
        ('TOPPADDING', (0,0), (0,0), 10),
        ('BOTTOMPADDING', (0,0), (0,0), 10),
        ('LEFTPADDING', (0,0), (0,0), 14),
        ('RIGHTPADDING', (0,0), (0,0), 14),
        ('LINEBELOW', (0,0), (0,0), 2, YELLOW_BD),
        ('BOX', (0,0), (0,0), 1, LIGHT_GREY),
    ]))
    story.append(diag_body)
    story.append(Spacer(1, 0.35*cm))

    # ── PRESCRIPTION ─────────────────────────────────────────
    rx_header = Table([[Paragraph('℞  PRESCRIPTION', section_style)]], colWidths=[17.4*cm])
    rx_header.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), LIGHT_BG),
        ('TOPPADDING', (0,0), (0,0), 6),
        ('BOTTOMPADDING', (0,0), (0,0), 6),
        ('LEFTPADDING', (0,0), (0,0), 10),
        ('BOX', (0,0), (0,0), 1, LIGHT_GREY),
    ]))
    story.append(rx_header)

    rx_lines_raw = (record.get('prescription') or '').split('\n')
    rx_content = []
    for i, line in enumerate(rx_lines_raw, 1):
        if line.strip():
            rx_content.append(
                Paragraph(f"{i}.&nbsp;&nbsp;{line.strip()}", rx_item_style)
            )
    if not rx_content:
        rx_content.append(Paragraph('No prescription recorded', rx_item_style))

    rx_body = Table([[[*rx_content]]], colWidths=[17.4*cm])
    rx_body.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), WHITE),
        ('TOPPADDING', (0,0), (0,0), 8),
        ('BOTTOMPADDING', (0,0), (0,0), 8),
        ('LEFTPADDING', (0,0), (0,0), 8),
        ('RIGHTPADDING', (0,0), (0,0), 14),
        ('BOX', (0,0), (0,0), 1, LIGHT_GREY),
        ('LINEBEFORE', (0,0), (0,0), 3, ACCENT),
    ]))
    story.append(rx_body)
    story.append(Spacer(1, 0.35*cm))

    # ── DOCTOR'S NOTES ───────────────────────────────────────
    if record.get('doctor_notes'):
        notes_header = Table([[Paragraph('✎  DOCTOR\'S NOTES', section_style)]], colWidths=[17.4*cm])
        notes_header.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,0), LIGHT_BG),
            ('TOPPADDING', (0,0), (0,0), 6),
            ('BOTTOMPADDING', (0,0), (0,0), 6),
            ('LEFTPADDING', (0,0), (0,0), 10),
            ('BOX', (0,0), (0,0), 1, LIGHT_GREY),
        ]))
        story.append(notes_header)

        notes_body = Table(
            [[Paragraph(record['doctor_notes'], note_style)]],
            colWidths=[17.4*cm]
        )
        notes_body.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,0), WHITE),
            ('TOPPADDING', (0,0), (0,0), 8),
            ('BOTTOMPADDING', (0,0), (0,0), 8),
            ('LEFTPADDING', (0,0), (0,0), 8),
            ('RIGHTPADDING', (0,0), (0,0), 14),
            ('BOX', (0,0), (0,0), 1, LIGHT_GREY),
            ('LINEBEFORE', (0,0), (0,0), 3, colors.HexColor('#8b5cf6')),
        ]))
        story.append(notes_body)
        story.append(Spacer(1, 0.35*cm))

    # ── FOLLOW-UP ────────────────────────────────────────────
    if record.get('follow_up_date'):
        fu = record['follow_up_date']
        if isinstance(fu, date):
            fu = fu.strftime('%d %B %Y')
        fu_table = Table(
            [[Paragraph(f"📅  Next Follow-up Appointment: <b>{fu}</b>",
                        ParagraphStyle('FU', fontSize=10, fontName='Helvetica',
                                       textColor=GREEN_TXT, leading=14))]],
            colWidths=[17.4*cm]
        )
        fu_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,0), GREEN_BG),
            ('TOPPADDING', (0,0), (0,0), 10),
            ('BOTTOMPADDING', (0,0), (0,0), 10),
            ('LEFTPADDING', (0,0), (0,0), 14),
            ('BOX', (0,0), (0,0), 1, colors.HexColor('#6ee7b7')),
        ]))
        story.append(fu_table)
        story.append(Spacer(1, 0.35*cm))

    # ── SIGNATURE LINE ───────────────────────────────────────
    story.append(Spacer(1, 0.6*cm))
    sig_table = Table(
        [['', Paragraph(
            f"_______________________<br/><b>Dr. {record['doctor_name']}</b><br/>"
            f"{record.get('specialization') or 'General Physician'}<br/>"
            f"{uni_name}",
            ParagraphStyle('Sig', fontSize=9, fontName='Helvetica',
                           textColor=DARK_TXT, alignment=TA_CENTER, leading=14)
        )]],
        colWidths=[10*cm, 7.4*cm]
    )
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('ALIGN', (1,0), (1,0), 'CENTER'),
    ]))
    story.append(sig_table)

    # ── FOOTER ───────────────────────────────────────────────
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GREY))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        f"This prescription was issued by <b>{uni_name}</b> Medical Center on {rx_date_str}. "
        f"Prescription No: {rx_number}. "
        f"For queries contact: {uni_email}",
        footer_style
    ))
    story.append(Paragraph(
        "CONFIDENTIAL — This document contains privileged medical information intended solely for the named patient.",
        ParagraphStyle('Conf', fontSize=7, fontName='Helvetica',
                       textColor=colors.HexColor('#9ca3af'), alignment=TA_CENTER)
    ))

    doc.build(story)
    return send_file(
        pdf_path, as_attachment=True,
        download_name=f"prescription_{uni_name.replace(' ','_')}_{record_id}.pdf",
        mimetype='application/pdf'
    )


@app.route('/api/doctor/telemedicine/generate-link', methods=['POST'])
@role_required('doctor')
def generate_meeting_link():
    data = request.json or {}
    room_id = f"UMC-{data.get('patient_name', 'Patient').replace(' ', '')}-{uuid.uuid4().hex[:8]}"
    meeting_link = f"https://meet.jit.si/{room_id}"
    return success_response({"meeting_link": meeting_link})


# PHARMACY


@app.route('/api/pharmacy/medicines', methods=['GET'])
@jwt_required()
def get_medicines():
    medicines = query_db("SELECT * FROM medicines ORDER BY generic_name")
    return success_response(medicines)


@app.route('/api/admin/medicines', methods=['POST'])
@role_required('admin')
def add_medicine():
    data = request.json
    if not data.get('generic_name'):
        return error_response("Generic name is required")

    med_id = query_db(
        """INSERT INTO medicines (generic_name, brand_name, category, current_stock,
           minimum_stock, unit, selling_price, description)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
        (data['generic_name'], data.get('brand_name', ''), data.get('category', ''),
         data.get('current_stock', 0), data.get('minimum_stock', 10),
         data.get('unit', 'tablets'), data.get('selling_price', 0), data.get('description', '')),
        commit=True
    )
    return success_response({"medicine_id": med_id}, "Medicine added successfully", 201)


@app.route('/api/admin/medicines/<int:med_id>', methods=['PUT'])
@role_required('admin')
def update_medicine(med_id):
    data = request.json
    query_db(
        """UPDATE medicines SET generic_name=%s, brand_name=%s, category=%s, current_stock=%s,
           minimum_stock=%s, unit=%s, selling_price=%s, description=%s WHERE medicine_id=%s""",
        (data.get('generic_name'), data.get('brand_name'), data.get('category'),
         data.get('current_stock'), data.get('minimum_stock'), data.get('unit'),
         data.get('selling_price'), data.get('description'), med_id),
        commit=True
    )
    return success_response(None, "Medicine updated")


@app.route('/api/admin/medicines/<int:med_id>', methods=['DELETE'])
@role_required('admin')
def delete_medicine(med_id):
    query_db("DELETE FROM medicines WHERE medicine_id=%s", (med_id,), commit=True)
    return success_response(None, "Medicine deleted")


# EMERGENCY


@app.route('/api/emergency/alert', methods=['POST'])
@jwt_required()
def send_emergency():
    user_id = get_jwt_identity()
    data = request.json or {}
    alert_id = query_db(
        "INSERT INTO emergency_alerts (patient_id, symptoms, location) VALUES (%s,%s,%s)",
        (user_id, data.get('symptoms', 'Emergency - Immediate help needed'),
         data.get('location', 'Unknown location')),
        commit=True
    )
    return success_response({"alert_id": alert_id}, "Emergency alert sent! Help is on the way.", 201)


@app.route('/api/admin/emergency/alerts', methods=['GET'])
@role_required('admin')
def get_emergency_alerts():
    alerts = query_db(
        """SELECT ea.*, u.full_name as patient_name, u.email as patient_email, u.phone as patient_phone
           FROM emergency_alerts ea
           JOIN users u ON ea.patient_id = u.user_id
           ORDER BY ea.alert_time DESC"""
    )
    return success_response(alerts)


@app.route('/api/admin/emergency/alerts/<int:alert_id>/respond', methods=['PUT'])
@role_required('admin')
def respond_emergency(alert_id):
    data = request.get_json(silent=True) or {}
    query_db(
        "UPDATE emergency_alerts SET status='Responded', response_notes=%s WHERE alert_id=%s",
        (data.get('response_notes', 'Response team dispatched'), alert_id),
        commit=True
    )
    return success_response(None, "Emergency marked as responded")


@app.route('/api/admin/emergency/alerts/<int:alert_id>/resolve', methods=['PUT'])
@role_required('admin')
def resolve_emergency(alert_id):
    query_db(
        "UPDATE emergency_alerts SET status='Resolved', resolved_at=NOW() WHERE alert_id=%s",
        (alert_id,), commit=True
    )
    return success_response(None, "Emergency resolved")


# CAMPAIGNS


@app.route('/api/campaigns', methods=['GET'])
@jwt_required()
def get_campaigns():
    campaigns = query_db(
        """SELECT c.*, u.full_name as created_by_name
           FROM campaigns c
           LEFT JOIN users u ON c.created_by = u.user_id
           ORDER BY c.created_at DESC"""
    )
    return success_response(campaigns)


@app.route('/api/admin/campaigns', methods=['POST'])
@role_required('admin')
def create_campaign():
    user_id = get_jwt_identity()
    data = request.json
    if not data.get('title'):
        return error_response("Title is required")

    camp_id = query_db(
        """INSERT INTO campaigns (title, description, campaign_type, start_date, end_date, location, created_by)
           VALUES (%s,%s,%s,%s,%s,%s,%s)""",
        (data['title'], data.get('description', ''), data.get('campaign_type', ''),
         data.get('start_date'), data.get('end_date'), data.get('location', ''), user_id),
        commit=True
    )
    return success_response({"campaign_id": camp_id}, "Campaign created", 201)


@app.route('/api/admin/campaigns/<int:camp_id>', methods=['PUT'])
@role_required('admin')
def update_campaign(camp_id):
    data = request.json
    query_db(
        """UPDATE campaigns SET title=%s, description=%s, campaign_type=%s, start_date=%s,
           end_date=%s, location=%s WHERE campaign_id=%s""",
        (data.get('title'), data.get('description'), data.get('campaign_type'),
         data.get('start_date'), data.get('end_date'), data.get('location'), camp_id),
        commit=True
    )
    return success_response(None, "Campaign updated")


@app.route('/api/admin/campaigns/<int:camp_id>/toggle', methods=['PUT'])
@role_required('admin')
def toggle_campaign(camp_id):
    campaign = query_db("SELECT is_active FROM campaigns WHERE campaign_id=%s", (camp_id,), one=True)
    if not campaign:
        return error_response("Campaign not found", 404)
    new_status = not campaign['is_active']
    query_db("UPDATE campaigns SET is_active=%s WHERE campaign_id=%s", (new_status, camp_id), commit=True)
    return success_response({"is_active": new_status})


@app.route('/api/admin/campaigns/<int:camp_id>', methods=['DELETE'])
@role_required('admin')
def delete_campaign(camp_id):
    query_db("DELETE FROM campaigns WHERE campaign_id=%s", (camp_id,), commit=True)
    return success_response(None, "Campaign deleted")


# SETTINGS


@app.route('/api/settings', methods=['GET'])
def get_settings():
    settings = query_db("SELECT * FROM system_settings LIMIT 1", one=True)
    return success_response(settings)


@app.route('/api/admin/settings/upload-logo', methods=['POST'])
@role_required('admin')
def upload_logo():
    if 'logo' not in request.files:
        return error_response("No logo file provided")
    file = request.files['logo']
    if file.filename == '' or not allowed_file(file.filename):
        return error_response("Invalid file type")
    filename = f"logo_{uuid.uuid4().hex[:8]}.{file.filename.rsplit('.', 1)[1].lower()}"
    filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
    file.save(filepath)
    logo_url = f"/uploads/{filename}"
    existing = query_db("SELECT id FROM system_settings LIMIT 1", one=True)
    if existing:
        query_db("UPDATE system_settings SET university_logo=%s WHERE id=%s",
                 (logo_url, existing['id']), commit=True)
    return success_response({"logo_url": logo_url}, "Logo uploaded successfully")


@app.route('/api/admin/settings', methods=['PUT'])
@role_required('admin')
def update_settings():
    data = request.json
    existing = query_db("SELECT id FROM system_settings LIMIT 1", one=True)
    if existing:
        query_db(
            """UPDATE system_settings SET university_name=%s, university_address=%s,
               contact_phone=%s, contact_email=%s, dark_mode=%s WHERE id=%s""",
            (data.get('university_name'), data.get('university_address'),
             data.get('contact_phone'), data.get('contact_email'),
             data.get('dark_mode', False), existing['id']),
            commit=True
        )
    else:
        query_db(
            """INSERT INTO system_settings (university_name, university_address, contact_phone, contact_email)
               VALUES (%s,%s,%s,%s)""",
            (data.get('university_name'), data.get('university_address'),
             data.get('contact_phone'), data.get('contact_email')),
            commit=True
        )
    settings = query_db("SELECT * FROM system_settings LIMIT 1", one=True)
    return success_response(settings, "Settings updated")



# ADMIN


@app.route('/api/admin/users', methods=['GET'])
@role_required('admin')
def admin_get_users():
    users = query_db(
        """SELECT user_id, username, email, full_name, role, phone, department,
                  student_id, profile_image, is_active, created_at
           FROM users ORDER BY created_at DESC"""
    )
    return success_response(users)


@app.route('/api/admin/users/<int:user_id>/block', methods=['PUT'])
@role_required('admin')
def block_user(user_id):
    query_db("UPDATE users SET is_active=FALSE WHERE user_id=%s", (user_id,), commit=True)
    return success_response(None, "User blocked")


@app.route('/api/admin/users/<int:user_id>/unblock', methods=['PUT'])
@role_required('admin')
def unblock_user(user_id):
    query_db("UPDATE users SET is_active=TRUE WHERE user_id=%s", (user_id,), commit=True)
    return success_response(None, "User unblocked")


@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@role_required('admin')
def delete_user(user_id):
    query_db("DELETE FROM users WHERE user_id=%s", (user_id,), commit=True)
    return success_response(None, "User deleted")


@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def dashboard_stats():
    claims = get_jwt()
    role = claims.get('role')
    user_id = get_jwt_identity()
    today = date.today().isoformat()

    if role == 'admin':
        stats = {
            'total_users': query_db("SELECT COUNT(*) as c FROM users WHERE role != 'admin'", one=True)['c'],
            'total_doctors': query_db("SELECT COUNT(*) as c FROM users WHERE role='doctor'", one=True)['c'],
            'total_students': query_db("SELECT COUNT(*) as c FROM users WHERE role='student'", one=True)['c'],
            'total_appointments': query_db("SELECT COUNT(*) as c FROM appointments", one=True)['c'],
            'today_appointments': query_db("SELECT COUNT(*) as c FROM appointments WHERE appointment_date=%s", (today,), one=True)['c'],
            'pending_appointments': query_db("SELECT COUNT(*) as c FROM appointments WHERE status='Pending'", one=True)['c'],
            'active_emergencies': query_db("SELECT COUNT(*) as c FROM emergency_alerts WHERE status='Active'", one=True)['c'],
            'total_medicines': query_db("SELECT COUNT(*) as c FROM medicines", one=True)['c'],
            'low_stock_medicines': query_db("SELECT COUNT(*) as c FROM medicines WHERE current_stock < minimum_stock", one=True)['c'],
            'active_campaigns': query_db("SELECT COUNT(*) as c FROM campaigns WHERE is_active=TRUE", one=True)['c'],
        }
    elif role == 'doctor':
        stats = {
            'today': query_db("SELECT COUNT(*) as c FROM appointments WHERE doctor_id=%s AND appointment_date=%s", (user_id, today), one=True)['c'],
            'pending': query_db("SELECT COUNT(*) as c FROM appointments WHERE doctor_id=%s AND status='Pending'", (user_id,), one=True)['c'],
            'confirmed': query_db("SELECT COUNT(*) as c FROM appointments WHERE doctor_id=%s AND status='Confirmed'", (user_id,), one=True)['c'],
            'completed': query_db("SELECT COUNT(*) as c FROM appointments WHERE doctor_id=%s AND status='Completed'", (user_id,), one=True)['c'],
            'total_patients': query_db("SELECT COUNT(DISTINCT patient_id) as c FROM appointments WHERE doctor_id=%s", (user_id,), one=True)['c'],
        }
    else:
        stats = {
            'my_appointments': query_db("SELECT COUNT(*) as c FROM appointments WHERE patient_id=%s", (user_id,), one=True)['c'],
            'pending': query_db("SELECT COUNT(*) as c FROM appointments WHERE patient_id=%s AND status='Pending'", (user_id,), one=True)['c'],
            'upcoming': query_db("SELECT COUNT(*) as c FROM appointments WHERE patient_id=%s AND appointment_date>=%s AND status='Confirmed'", (user_id, today), one=True)['c'],
            'total_doctors': query_db("SELECT COUNT(*) as c FROM users WHERE role='doctor' AND is_active=TRUE", one=True)['c'],
            'active_campaigns': query_db("SELECT COUNT(*) as c FROM campaigns WHERE is_active=TRUE", one=True)['c'],
        }

    return success_response(stats)


@app.route('/api/medical-records', methods=['GET'])
@jwt_required()
def get_my_records():
    user_id = get_jwt_identity()
    records = query_db(
        """SELECT mr.*, d.full_name as doctor_name, dp.specialization
           FROM medical_records mr
           JOIN users d ON mr.doctor_id = d.user_id
           LEFT JOIN doctor_profiles dp ON d.user_id = dp.user_id
           WHERE mr.patient_id=%s
           ORDER BY mr.record_date DESC""",
        (user_id,)
    )
    return success_response(records)




@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@role_required('admin')
def update_user(user_id):
    data = request.get_json(silent=True) or {}
    query_db(
        """UPDATE users SET full_name=%s, email=%s, phone=%s, department=%s, student_id=%s, role=%s
           WHERE user_id=%s""",
        (data.get('full_name'), data.get('email'), data.get('phone'),
         data.get('department'), data.get('student_id'), data.get('role'), user_id),
        commit=True
    )
    if data.get('password'):
        import bcrypt as _bcrypt
        pw_hash = _bcrypt.hashpw(data['password'].encode('utf-8'), _bcrypt.gensalt()).decode('utf-8')
        query_db("UPDATE users SET password_hash=%s WHERE user_id=%s", (pw_hash, user_id), commit=True)
    if data.get('role') == 'doctor' and data.get('doctor_profile'):
        dp = data['doctor_profile']
        existing = query_db("SELECT profile_id FROM doctor_profiles WHERE user_id=%s", (user_id,), one=True)
        if existing:
            query_db(
                """UPDATE doctor_profiles SET specialization=%s, qualifications=%s, experience_years=%s,
                   consultation_fee=%s, available_days=%s, bio=%s, hospital_affiliation=%s WHERE user_id=%s""",
                (dp.get('specialization'), dp.get('qualifications'), dp.get('experience_years'),
                 dp.get('consultation_fee'), dp.get('available_days'), dp.get('bio'),
                 dp.get('hospital_affiliation'), user_id), commit=True
            )
        else:
            query_db(
                """INSERT INTO doctor_profiles (user_id, specialization, qualifications, experience_years,
                   consultation_fee, available_days, bio, hospital_affiliation)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                (user_id, dp.get('specialization'), dp.get('qualifications'), dp.get('experience_years'),
                 dp.get('consultation_fee'), dp.get('available_days'), dp.get('bio'),
                 dp.get('hospital_affiliation')), commit=True
            )
    user = query_db(
        "SELECT user_id, username, email, full_name, role, phone, department, student_id, is_active FROM users WHERE user_id=%s",
        (user_id,), one=True
    )
    return success_response(user, "User updated successfully")


@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
@role_required('admin')
def get_user(user_id):
    user = query_db(
        "SELECT user_id, username, email, full_name, role, phone, department, student_id, profile_image, is_active FROM users WHERE user_id=%s",
        (user_id,), one=True
    )
    if not user:
        return error_response("User not found", 404)
    if user['role'] == 'doctor':
        dp = query_db("SELECT * FROM doctor_profiles WHERE user_id=%s", (user_id,), one=True)
        if dp:
            user['doctor_profile'] = dp
    return success_response(user)


@app.route('/api/admin/campaigns/<int:camp_id>/edit', methods=['PUT'])
@role_required('admin')
def edit_campaign(camp_id):
    data = request.get_json(silent=True) or {}
    query_db(
        """UPDATE campaigns SET title=%s, description=%s, campaign_type=%s,
           start_date=%s, end_date=%s, location=%s WHERE campaign_id=%s""",
        (data.get('title'), data.get('description'), data.get('campaign_type'),
         data.get('start_date'), data.get('end_date'), data.get('location'), camp_id),
        commit=True
    )
    return success_response(None, "Campaign updated")


@app.route('/api/admin/notifications', methods=['GET'])
@role_required('admin')
def get_notifications():
    alerts = query_db(
        "SELECT COUNT(*) as c FROM emergency_alerts WHERE status='Active'", one=True
    )['c']
    pending_appts = query_db(
        "SELECT COUNT(*) as c FROM appointments WHERE status='Pending'", one=True
    )['c']
    low_stock = query_db(
        "SELECT COUNT(*) as c FROM medicines WHERE current_stock < minimum_stock", one=True
    )['c']
    recent_alerts = query_db(
        """SELECT ea.alert_id, u.full_name as patient_name, ea.symptoms, ea.location, ea.alert_time, ea.status
           FROM emergency_alerts ea JOIN users u ON ea.patient_id=u.user_id
           WHERE ea.status='Active' ORDER BY ea.alert_time DESC LIMIT 5"""
    )
    recent_appts = query_db(
        """SELECT a.appointment_id, p.full_name as patient_name, d.full_name as doctor_name,
                  a.appointment_date, a.appointment_time, a.status
           FROM appointments a
           JOIN users p ON a.patient_id=p.user_id
           JOIN users d ON a.doctor_id=d.user_id
           WHERE a.status='Pending'
           ORDER BY a.created_at DESC LIMIT 5"""
    )
    return success_response({
        'counts': {'emergencies': alerts, 'pending_appointments': pending_appts, 'low_stock': low_stock,
                   'total': alerts + pending_appts + low_stock},
        'emergency_alerts': recent_alerts,
        'pending_appointments': recent_appts,
    })


@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_user_notifications():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')
    notifications = []
    if role in ['student', 'teacher', 'staff']:
        appts = query_db(
            """SELECT a.appointment_id, a.status, a.appointment_date, a.appointment_time,
                      d.full_name as doctor_name, a.cancellation_reason, a.meeting_link
               FROM appointments a JOIN users d ON a.doctor_id=d.user_id
               WHERE a.patient_id=%s ORDER BY a.updated_at DESC LIMIT 10""",
            (user_id,)
        )
        for a in appts:
            if a['status'] == 'Confirmed':
                notifications.append({
                    'id': f"appt_{a['appointment_id']}",
                    'type': 'success',
                    'title': 'Appointment Confirmed',
                    'message': f"Dr. {a['doctor_name']} confirmed your appointment on {a['appointment_date']}",
                    'link': '/appointments'
                })
            elif a['status'] == 'Cancelled':
                notifications.append({
                    'id': f"appt_cancel_{a['appointment_id']}",
                    'type': 'error',
                    'title': 'Appointment Cancelled',
                    'message': f"Appointment with Dr. {a['doctor_name']} was cancelled. {a.get('cancellation_reason','') or ''}",
                    'link': '/appointments'
                })
    elif role == 'doctor':
        pending = query_db(
            """SELECT a.appointment_id, p.full_name as patient_name, a.appointment_date
               FROM appointments a JOIN users p ON a.patient_id=p.user_id
               WHERE a.doctor_id=%s AND a.status='Pending'
               ORDER BY a.created_at DESC LIMIT 10""",
            (user_id,)
        )
        for a in pending:
            notifications.append({
                'id': f"pending_{a['appointment_id']}",
                'type': 'info',
                'title': 'New Appointment Request',
                'message': f"{a['patient_name']} booked an appointment on {a['appointment_date']}",
                'link': '/doctor'
            })
    active_campaigns = query_db(
        "SELECT campaign_id, title, campaign_type FROM campaigns WHERE is_active=TRUE LIMIT 3"
    )
    for c in active_campaigns:
        notifications.append({
            'id': f"camp_{c['campaign_id']}",
            'type': 'campaign',
            'title': f"Active Campaign: {c['campaign_type'] or 'Health'}",
            'message': c['title'],
            'link': '/campaigns'
        })
    return success_response(notifications)



# EMERGENCY CONTACTS


@app.route('/api/emergency/contacts', methods=['GET'])
def get_emergency_contacts():
    contacts = query_db("SELECT * FROM emergency_contacts ORDER BY display_order ASC")
    return success_response(contacts)

@app.route('/api/admin/emergency/contacts', methods=['POST'])
@role_required('admin')
def add_emergency_contact():
    data = request.get_json(silent=True) or {}
    if not data.get('label') or not data.get('number'):
        return error_response("Label and number required")
    cid = query_db(
        "INSERT INTO emergency_contacts (label, number, icon, color, display_order) VALUES (%s,%s,%s,%s,%s)",
        (data['label'], data['number'], data.get('icon','🏥'), data.get('color','#667eea'), data.get('display_order',0)),
        commit=True
    )
    return success_response({"contact_id": cid}, "Contact added", 201)

@app.route('/api/admin/emergency/contacts/<int:cid>', methods=['PUT'])
@role_required('admin')
def update_emergency_contact(cid):
    data = request.get_json(silent=True) or {}
    query_db(
        "UPDATE emergency_contacts SET label=%s, number=%s, icon=%s, color=%s, display_order=%s WHERE contact_id=%s",
        (data.get('label'), data.get('number'), data.get('icon','🏥'), data.get('color','#667eea'), data.get('display_order',0), cid),
        commit=True
    )
    return success_response(None, "Contact updated")

@app.route('/api/admin/emergency/contacts/<int:cid>', methods=['DELETE'])
@role_required('admin')
def delete_emergency_contact(cid):
    query_db("DELETE FROM emergency_contacts WHERE contact_id=%s", (cid,), commit=True)
    return success_response(None, "Contact deleted")


# MEDICINE EDIT (quantity, name etc)


@app.route('/api/admin/medicines/<int:med_id>/stock', methods=['PUT'])
@role_required('admin')
def update_medicine_stock(med_id):
    data = request.get_json(silent=True) or {}
    query_db("UPDATE medicines SET current_stock=%s WHERE medicine_id=%s",
             (data.get('current_stock'), med_id), commit=True)
    return success_response(None, "Stock updated")


# BANNERS / NOTICES


@app.route('/api/banners', methods=['GET'])
def get_banners():
    banners = query_db("SELECT * FROM banners WHERE is_active=TRUE ORDER BY display_order ASC, created_at DESC")
    return success_response(banners)

@app.route('/api/admin/banners', methods=['POST'])
@role_required('admin')
def create_banner():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    if not data.get('message'):
        return error_response("Message required")
    bid = query_db(
        "INSERT INTO banners (message, banner_type, link, display_order, created_by) VALUES (%s,%s,%s,%s,%s)",
        (data['message'], data.get('banner_type','info'), data.get('link',''), data.get('display_order',0), user_id),
        commit=True
    )
    return success_response({"banner_id": bid}, "Banner created", 201)

@app.route('/api/admin/banners/<int:bid>', methods=['PUT'])
@role_required('admin')
def update_banner(bid):
    data = request.get_json(silent=True) or {}
    query_db(
        "UPDATE banners SET message=%s, banner_type=%s, link=%s, display_order=%s, is_active=%s WHERE banner_id=%s",
        (data.get('message'), data.get('banner_type','info'), data.get('link',''), data.get('display_order',0), data.get('is_active',True), bid),
        commit=True
    )
    return success_response(None, "Banner updated")

@app.route('/api/admin/banners/<int:bid>', methods=['DELETE'])
@role_required('admin')
def delete_banner(bid):
    query_db("DELETE FROM banners WHERE banner_id=%s", (bid,), commit=True)
    return success_response(None, "Banner deleted")


# DOCTOR REVIEWS


@app.route('/api/reviews', methods=['POST'])
@jwt_required()
def create_review():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    required = ['doctor_id', 'appointment_id', 'rating']
    for f in required:
        if not data.get(f):
            return error_response(f"Field {f} required")
    if not (1 <= int(data['rating']) <= 5):
        return error_response("Rating must be 1-5")
    existing = query_db("SELECT review_id FROM doctor_reviews WHERE appointment_id=%s", (data['appointment_id'],), one=True)
    if existing:
        return error_response("You already reviewed this appointment")
    appt = query_db("SELECT * FROM appointments WHERE appointment_id=%s AND patient_id=%s AND status='Completed'",
                    (data['appointment_id'], user_id), one=True)
    if not appt:
        return error_response("Can only review completed appointments")
    rid = query_db(
        "INSERT INTO doctor_reviews (patient_id, doctor_id, appointment_id, rating, review_text) VALUES (%s,%s,%s,%s,%s)",
        (user_id, data['doctor_id'], data['appointment_id'], data['rating'], data.get('review_text','')),
        commit=True
    )
    return success_response({"review_id": rid}, "Review submitted!", 201)

@app.route('/api/doctors/<int:doctor_id>/reviews', methods=['GET'])
def get_doctor_reviews(doctor_id):
    reviews = query_db(
        """SELECT dr.*, u.full_name as patient_name, u.profile_image as patient_image
           FROM doctor_reviews dr
           JOIN users u ON dr.patient_id=u.user_id
           WHERE dr.doctor_id=%s
           ORDER BY dr.created_at DESC""",
        (doctor_id,)
    )
    avg = query_db("SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM doctor_reviews WHERE doctor_id=%s",
                   (doctor_id,), one=True)
    return success_response({"reviews": reviews, "avg_rating": float(avg['avg_rating'] or 0), "total": avg['total']})

@app.route('/api/my/reviews', methods=['GET'])
@jwt_required()
def get_my_reviews():
    user_id = get_jwt_identity()
    reviews = query_db(
        """SELECT dr.*, d.full_name as doctor_name, dp.specialization
           FROM doctor_reviews dr
           JOIN users d ON dr.doctor_id=d.user_id
           LEFT JOIN doctor_profiles dp ON d.user_id=dp.user_id
           WHERE dr.patient_id=%s ORDER BY dr.created_at DESC""",
        (user_id,)
    )
    return success_response(reviews)


# COMPLAINTS


@app.route('/api/complaints', methods=['POST'])
@jwt_required()
def create_complaint():
    user_id = get_jwt_identity()
    if 'complaint_data' not in request.form:
        return error_response("Complaint data required")
    import json as _json
    data = _json.loads(request.form.get('complaint_data', '{}'))
    if not data.get('doctor_id') or not data.get('subject') or not data.get('description'):
        return error_response("Doctor, subject and description required")
    proof_url = None
    if 'proof' in request.files:
        file = request.files['proof']
        if file and file.filename:
            ext = file.filename.rsplit('.', 1)[-1].lower()
            allowed = {'png','jpg','jpeg','gif','webp','mp4','mp3','pdf','mov'}
            if ext in allowed:
                filename = f"complaint_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
                filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
                file.save(filepath)
                proof_url = f"/uploads/{filename}"
    cid = query_db(
        """INSERT INTO complaints (patient_id, doctor_id, appointment_id, subject, description, proof_url)
           VALUES (%s,%s,%s,%s,%s,%s)""",
        (user_id, data['doctor_id'], data.get('appointment_id'), data['subject'], data['description'], proof_url),
        commit=True
    )
    return success_response({"complaint_id": cid}, "Complaint submitted successfully", 201)

@app.route('/api/my/complaints', methods=['GET'])
@jwt_required()
def get_my_complaints():
    user_id = get_jwt_identity()
    complaints = query_db(
        """SELECT c.*, d.full_name as doctor_name, dp.specialization
           FROM complaints c
           JOIN users d ON c.doctor_id=d.user_id
           LEFT JOIN doctor_profiles dp ON d.user_id=dp.user_id
           WHERE c.patient_id=%s ORDER BY c.created_at DESC""",
        (user_id,)
    )
    return success_response(complaints)

@app.route('/api/admin/complaints', methods=['GET'])
@role_required('admin')
def admin_get_complaints():
    complaints = query_db(
        """SELECT c.*, p.full_name as patient_name, p.email as patient_email,
                  d.full_name as doctor_name, dp.specialization
           FROM complaints c
           JOIN users p ON c.patient_id=p.user_id
           JOIN users d ON c.doctor_id=d.user_id
           LEFT JOIN doctor_profiles dp ON d.user_id=dp.user_id
           ORDER BY c.created_at DESC"""
    )
    return success_response(complaints)

@app.route('/api/admin/complaints/<int:cid>', methods=['PUT'])
@role_required('admin')
def update_complaint_status(cid):
    data = request.get_json(silent=True) or {}
    query_db(
        "UPDATE complaints SET status=%s, admin_notes=%s WHERE complaint_id=%s",
        (data.get('status','Under Review'), data.get('admin_notes',''), cid),
        commit=True
    )
    return success_response(None, "Complaint updated")




# LANDING PAGE


@app.route('/api/landing', methods=['GET'])
def get_landing_data():
    """Public endpoint - no auth needed. Returns all landing page data."""
    settings = query_db("SELECT * FROM system_settings LIMIT 1", one=True)
    doctors = query_db(
        """SELECT u.user_id, u.full_name, u.profile_image,
                  dp.specialization, dp.qualifications, dp.experience_years,
                  dp.bio, dp.hospital_affiliation,
                  COALESCE(AVG(dr.rating),0) as avg_rating,
                  COUNT(dr.review_id) as total_reviews
           FROM users u
           LEFT JOIN doctor_profiles dp ON u.user_id=dp.user_id
           LEFT JOIN doctor_reviews dr ON u.user_id=dr.doctor_id
           WHERE u.role='doctor' AND u.is_active=TRUE
           GROUP BY u.user_id
           ORDER BY avg_rating DESC"""
    )
    campaigns = query_db(
        "SELECT * FROM campaigns WHERE is_active=TRUE ORDER BY start_date DESC LIMIT 6"
    )
    stats = {
        'total_doctors': query_db("SELECT COUNT(*) as c FROM users WHERE role='doctor' AND is_active=TRUE", one=True)['c'],
        'total_patients': query_db("SELECT COUNT(*) as c FROM users WHERE role IN ('student','teacher','staff') AND is_active=TRUE", one=True)['c'],
        'total_appointments': query_db("SELECT COUNT(*) as c FROM appointments WHERE status='Completed'", one=True)['c'],
        'active_campaigns': query_db("SELECT COUNT(*) as c FROM campaigns WHERE is_active=TRUE", one=True)['c'],
    }
    landing_settings = query_db("SELECT * FROM landing_settings LIMIT 1", one=True)
    return success_response({
        'settings': settings,
        'landing': landing_settings,
        'doctors': doctors,
        'campaigns': campaigns,
        'stats': stats,
    })


@app.route('/api/admin/landing', methods=['PUT'])
@role_required('admin')
def update_landing():
    data = request.get_json(silent=True) or {}
    existing = query_db("SELECT id FROM landing_settings LIMIT 1", one=True)
    if existing:
        query_db(
            """UPDATE landing_settings SET
               hero_title=%s, hero_subtitle=%s, hero_bg_url=%s,
               about_text=%s, show_doctors=%s, show_campaigns=%s,
               show_stats=%s, show_contact=%s, contact_map_url=%s,
               announcement=%s
               WHERE id=%s""",
            (data.get('hero_title'), data.get('hero_subtitle'), data.get('hero_bg_url'),
             data.get('about_text'), data.get('show_doctors', True),
             data.get('show_campaigns', True), data.get('show_stats', True),
             data.get('show_contact', True), data.get('contact_map_url', ''),
             data.get('announcement', ''), existing['id']),
            commit=True
        )
    else:
        query_db(
            """INSERT INTO landing_settings
               (hero_title, hero_subtitle, hero_bg_url, about_text,
                show_doctors, show_campaigns, show_stats, show_contact,
                contact_map_url, announcement)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (data.get('hero_title'), data.get('hero_subtitle'), data.get('hero_bg_url'),
             data.get('about_text'), True, True, True, True, '', ''),
            commit=True
        )
    return success_response(None, "Landing page updated")


@app.route('/api/admin/landing/upload-hero', methods=['POST'])
@role_required('admin')
def upload_hero_image():
    if 'image' not in request.files:
        return error_response("No image provided")
    file = request.files['image']
    if not allowed_file(file.filename):
        return error_response("Invalid file type")
    filename = f"hero_{uuid.uuid4().hex[:8]}.{file.filename.rsplit('.',1)[1].lower()}"
    filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
    file.save(filepath)
    url = f"/uploads/{filename}"
    query_db("UPDATE landing_settings SET hero_bg_url=%s WHERE id=1", (url,), commit=True)
    return success_response({"url": url}, "Hero image uploaded")


@app.route('/api/contact', methods=['POST'])
def submit_contact():
    data = request.get_json(silent=True) or {}
    if not data.get('name') or not data.get('email') or not data.get('message'):
        return error_response("Name, email and message required")
    query_db(
        "INSERT INTO contact_messages (name, email, subject, message) VALUES (%s,%s,%s,%s)",
        (data['name'], data['email'], data.get('subject','General Inquiry'), data['message']),
        commit=True
    )
    return success_response(None, "Message sent successfully!", 201)


@app.route('/api/admin/contact-messages', methods=['GET'])
@role_required('admin')
def get_contact_messages():
    msgs = query_db("SELECT * FROM contact_messages ORDER BY created_at DESC")
    return success_response(msgs)


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "University Medical Center API is running"})



# DOCTOR LEAVE SYSTEM


@app.route('/api/doctor/leaves', methods=['GET'])
@jwt_required()
def get_doctor_leaves():
    user_id = get_jwt_identity()
    claims = get_jwt()
    if claims.get('role') != 'doctor':
        return error_response("Access denied", 403)
    leaves = query_db(
        """SELECT * FROM doctor_leaves WHERE doctor_id=%s ORDER BY created_at DESC""",
        (user_id,)
    )
    return success_response(leaves)


@app.route('/api/doctor/leaves', methods=['POST'])
@jwt_required()
def apply_leave():
    user_id = get_jwt_identity()
    claims = get_jwt()
    if claims.get('role') != 'doctor':
        return error_response("Access denied", 403)
    data = request.json
    if not data.get('leave_start') or not data.get('leave_end') or not data.get('reason'):
        return error_response("Start date, end date, and reason are required")
    start = datetime.strptime(data['leave_start'], '%Y-%m-%d').date()
    end = datetime.strptime(data['leave_end'], '%Y-%m-%d').date()
    if end < start:
        return error_response("End date cannot be before start date")
    if start < date.today():
        return error_response("Leave start date cannot be in the past")
    overlap = query_db(
        """SELECT leave_id FROM doctor_leaves
           WHERE doctor_id=%s AND status IN ('pending','approved')
           AND NOT (leave_end < %s OR leave_start > %s)""",
        (user_id, data['leave_start'], data['leave_end']), one=True
    )
    if overlap:
        return error_response("You already have a leave request overlapping these dates")
    leave_id = query_db(
        """INSERT INTO doctor_leaves (doctor_id, leave_start, leave_end, reason, status)
           VALUES (%s, %s, %s, %s, 'pending')""",
        (user_id, data['leave_start'], data['leave_end'], data['reason'].strip()),
        commit=True
    )
    return success_response({"leave_id": leave_id}, "Leave application submitted successfully", 201)


@app.route('/api/doctor/leaves/<int:leave_id>', methods=['DELETE'])
@jwt_required()
def cancel_leave(leave_id):
    user_id = get_jwt_identity()
    claims = get_jwt()
    if claims.get('role') != 'doctor':
        return error_response("Access denied", 403)
    leave = query_db("SELECT * FROM doctor_leaves WHERE leave_id=%s AND doctor_id=%s",
                     (leave_id, user_id), one=True)
    if not leave:
        return error_response("Leave not found", 404)
    if leave['status'] == 'approved':
        return error_response("Cannot cancel an approved leave. Contact admin.")
    query_db("DELETE FROM doctor_leaves WHERE leave_id=%s", (leave_id,), commit=True)
    return success_response(None, "Leave application cancelled")


@app.route('/api/admin/leaves', methods=['GET'])
@jwt_required()
def admin_get_leaves():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return error_response("Access denied", 403)
    status_filter = request.args.get('status', '')
    if status_filter and status_filter != 'all':
        leaves = query_db(
            """SELECT dl.*, u.full_name as doctor_name, u.email as doctor_email,
                      dp.specialization
               FROM doctor_leaves dl
               JOIN users u ON dl.doctor_id = u.user_id
               LEFT JOIN doctor_profiles dp ON dl.doctor_id = dp.user_id
               WHERE dl.status=%s
               ORDER BY dl.created_at DESC""",
            (status_filter,)
        )
    else:
        leaves = query_db(
            """SELECT dl.*, u.full_name as doctor_name, u.email as doctor_email,
                      dp.specialization
               FROM doctor_leaves dl
               JOIN users u ON dl.doctor_id = u.user_id
               LEFT JOIN doctor_profiles dp ON dl.doctor_id = dp.user_id
               ORDER BY dl.created_at DESC"""
        )
    return success_response(leaves)


@app.route('/api/admin/leaves/<int:leave_id>/approve', methods=['PUT'])
@jwt_required()
def admin_approve_leave(leave_id):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return error_response("Access denied", 403)
    leave = query_db("SELECT * FROM doctor_leaves WHERE leave_id=%s", (leave_id,), one=True)
    if not leave:
        return error_response("Leave request not found", 404)
    if leave['status'] != 'pending':
        return error_response("This request has already been processed")
    data = request.json or {}
    query_db(
        "UPDATE doctor_leaves SET status='approved', admin_note=%s, reviewed_at=NOW() WHERE leave_id=%s",
        (data.get('admin_note', ''), leave_id), commit=True
    )
    return success_response(None, "Leave approved successfully")


@app.route('/api/admin/leaves/<int:leave_id>/reject', methods=['PUT'])
@jwt_required()
def admin_reject_leave(leave_id):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return error_response("Access denied", 403)
    leave = query_db("SELECT * FROM doctor_leaves WHERE leave_id=%s", (leave_id,), one=True)
    if not leave:
        return error_response("Leave request not found", 404)
    if leave['status'] != 'pending':
        return error_response("This request has already been processed")
    data = request.json or {}
    if not data.get('admin_note'):
        return error_response("A rejection reason is required")
    query_db(
        "UPDATE doctor_leaves SET status='rejected', admin_note=%s, reviewed_at=NOW() WHERE leave_id=%s",
        (data['admin_note'], leave_id), commit=True
    )
    return success_response(None, "Leave rejected")


@app.route('/api/doctors/<int:doctor_id>/leaves', methods=['GET'])
@jwt_required()
def get_doctor_approved_leaves(doctor_id):
    leaves = query_db(
        """SELECT leave_start, leave_end FROM doctor_leaves
           WHERE doctor_id=%s AND status='approved' AND leave_end >= CURDATE()
           ORDER BY leave_start""",
        (doctor_id,)
    )
    return success_response(leaves)


@app.route('/api/doctors/<int:doctor_id>/booked-slots', methods=['GET'])
@jwt_required()
def get_booked_slots(doctor_id):
    appt_date = request.args.get('date')
    if not appt_date:
        return error_response("Date is required")
    slots = query_db(
        """SELECT appointment_time FROM appointments
           WHERE doctor_id=%s AND appointment_date=%s AND status NOT IN ('Cancelled')""",
        (doctor_id, appt_date)
    )
    booked = [str(s['appointment_time'])[:5] for s in slots] if slots else []
    return success_response(booked)


if __name__ == '__main__':
    print("=" * 60)
    print("  University Medical Center System - Backend")
    print("=" * 60)
    print(f"  Running on: http://localhost:5000")
    print(f"  Admin Login: admin@university.edu / admin123")
    print(f"  Doctor Login: dr.smith@university.edu / doctor123")
    print(f"  Student Login: john.doe@student.edu / student123")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)