import os
from flask import Flask, render_template, request, redirect, url_for, session, flash
from pymongo import MongoClient
from bson.objectid import ObjectId
import bcrypt
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-fallback-key")

# MongoDB connection - make sure MongoDB is running before starting the app
client = MongoClient(os.environ.get("MONGO_URI", "mongodb://localhost:27017/"))
db     = client[os.environ.get("DB_NAME", "fire_management_db")]

users     = db["users"]
incidents = db["incidents"]
equipment = db["equipment"]
staff     = db["staff"]


# ── Helper: check if logged in ────────────────────────────────
def logged_in():
    return "user" in session


# ─────────────────────────────────────────────────────────────
#  HOME
# ─────────────────────────────────────────────────────────────
@app.route("/")
def home():
    if logged_in():
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


# ─────────────────────────────────────────────────────────────
#  REGISTER
# ─────────────────────────────────────────────────────────────
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name     = request.form["name"].strip()
        email    = request.form["email"].strip().lower()
        password = request.form["password"]
        role     = request.form["role"]

        if users.find_one({"email": email}):
            flash("Email already registered. Please login.", "error")
            return redirect(url_for("register"))

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        users.insert_one({
            "name":     name,
            "email":    email,
            "password": hashed,
            "role":     role,
            "joined":   datetime.now().strftime("%Y-%m-%d")
        })
        flash("Account created! Please login.", "success")
        return redirect(url_for("login"))

    return render_template("register.html")


# ─────────────────────────────────────────────────────────────
#  LOGIN
# ─────────────────────────────────────────────────────────────
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email    = request.form["email"].strip().lower()
        password = request.form["password"]

        user = users.find_one({"email": email})
        if user and bcrypt.checkpw(password.encode(), user["password"]):
            session["user"]  = str(user["_id"])
            session["name"]  = user["name"]
            session["role"]  = user["role"]
            session["email"] = user["email"]
            return redirect(url_for("dashboard"))
        else:
            flash("Wrong email or password.", "error")

    return render_template("login.html")


# ─────────────────────────────────────────────────────────────
#  LOGOUT
# ─────────────────────────────────────────────────────────────
@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out successfully.", "success")
    return redirect(url_for("login"))


# ─────────────────────────────────────────────────────────────
#  DASHBOARD
# ─────────────────────────────────────────────────────────────
@app.route("/dashboard")
def dashboard():
    if not logged_in():
        return redirect(url_for("login"))

    total_incidents  = incidents.count_documents({})
    active_incidents = incidents.count_documents({"status": "Active"})
    resolved         = incidents.count_documents({"status": "Resolved"})
    total_staff      = staff.count_documents({})
    total_equipment  = equipment.count_documents({})
    critical         = incidents.count_documents({"severity": "Critical"})

    recent = list(incidents.find().sort("date", -1).limit(5))

    stats = {
        "total_incidents":  total_incidents,
        "active_incidents": active_incidents,
        "resolved":         resolved,
        "total_staff":      total_staff,
        "total_equipment":  total_equipment,
        "critical":         critical,
    }
    return render_template("dashboard.html", stats=stats, recent=recent)


# ─────────────────────────────────────────────────────────────
#  INCIDENTS — List
# ─────────────────────────────────────────────────────────────
@app.route("/incidents")
def incident_list():
    if not logged_in():
        return redirect(url_for("login"))

    search   = request.args.get("search", "")
    severity = request.args.get("severity", "")
    status   = request.args.get("status", "")

    query = {}
    if search:
        query["$or"] = [
            {"title":    {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
        ]
    if severity:
        query["severity"] = severity
    if status:
        query["status"] = status

    all_incidents = list(incidents.find(query).sort("date", -1))
    return render_template("incidents.html", incidents=all_incidents,
                           search=search, severity=severity, status=status)


# ─────────────────────────────────────────────────────────────
#  INCIDENTS — Add
# ─────────────────────────────────────────────────────────────
@app.route("/incidents/add", methods=["GET", "POST"])
def add_incident():
    if not logged_in():
        return redirect(url_for("login"))

    if request.method == "POST":
        incidents.insert_one({
            "title":       request.form["title"].strip(),
            "location":    request.form["location"].strip(),
            "date":        request.form["date"],
            "time":        request.form["time"],
            "severity":    request.form["severity"],
            "status":      request.form["status"],
            "description": request.form["description"].strip(),
            "reported_by": session["name"],
            "created_at":  datetime.now().strftime("%Y-%m-%d %H:%M")
        })
        flash("Incident reported successfully!", "success")
        return redirect(url_for("incident_list"))

    return render_template("add_incident.html")


# ─────────────────────────────────────────────────────────────
#  INCIDENTS — Edit
# ─────────────────────────────────────────────────────────────
@app.route("/incidents/edit/<id>", methods=["GET", "POST"])
def edit_incident(id):
    if not logged_in():
        return redirect(url_for("login"))

    inc = incidents.find_one({"_id": ObjectId(id)})
    if not inc:
        flash("Incident not found.", "error")
        return redirect(url_for("incident_list"))

    if request.method == "POST":
        incidents.update_one({"_id": ObjectId(id)}, {"$set": {
            "title":       request.form["title"].strip(),
            "location":    request.form["location"].strip(),
            "date":        request.form["date"],
            "time":        request.form["time"],
            "severity":    request.form["severity"],
            "status":      request.form["status"],
            "description": request.form["description"].strip(),
            "updated_at":  datetime.now().strftime("%Y-%m-%d %H:%M")
        }})
        flash("Incident updated!", "success")
        return redirect(url_for("incident_list"))

    return render_template("edit_incident.html", inc=inc)


# ─────────────────────────────────────────────────────────────
#  INCIDENTS — Delete
# ─────────────────────────────────────────────────────────────
@app.route("/incidents/delete/<id>")
def delete_incident(id):
    if not logged_in():
        return redirect(url_for("login"))
    incidents.delete_one({"_id": ObjectId(id)})
    flash("Incident deleted.", "success")
    return redirect(url_for("incident_list"))


# ─────────────────────────────────────────────────────────────
#  STAFF — List
# ─────────────────────────────────────────────────────────────
@app.route("/staff")
def staff_list():
    if not logged_in():
        return redirect(url_for("login"))
    search = request.args.get("search", "")
    query  = {}
    if search:
        query["$or"] = [
            {"name":       {"$regex": search, "$options": "i"}},
            {"department": {"$regex": search, "$options": "i"}},
        ]
    all_staff = list(staff.find(query).sort("name", 1))
    return render_template("staff.html", staff=all_staff, search=search)


# ─────────────────────────────────────────────────────────────
#  STAFF — Add
# ─────────────────────────────────────────────────────────────
@app.route("/staff/add", methods=["GET", "POST"])
def add_staff():
    if not logged_in():
        return redirect(url_for("login"))
    if request.method == "POST":
        staff.insert_one({
            "name":       request.form["name"].strip(),
            "id_number":  request.form["id_number"].strip(),
            "department": request.form["department"].strip(),
            "position":   request.form["position"].strip(),
            "phone":      request.form["phone"].strip(),
            "email":      request.form["email"].strip(),
            "status":     request.form["status"],
            "added_at":   datetime.now().strftime("%Y-%m-%d")
        })
        flash("Staff member added!", "success")
        return redirect(url_for("staff_list"))
    return render_template("add_staff.html")


# ─────────────────────────────────────────────────────────────
#  STAFF — Edit
# ─────────────────────────────────────────────────────────────
@app.route("/staff/edit/<id>", methods=["GET", "POST"])
def edit_staff(id):
    if not logged_in():
        return redirect(url_for("login"))
    member = staff.find_one({"_id": ObjectId(id)})
    if not member:
        flash("Staff not found.", "error")
        return redirect(url_for("staff_list"))
    if request.method == "POST":
        staff.update_one({"_id": ObjectId(id)}, {"$set": {
            "name":       request.form["name"].strip(),
            "id_number":  request.form["id_number"].strip(),
            "department": request.form["department"].strip(),
            "position":   request.form["position"].strip(),
            "phone":      request.form["phone"].strip(),
            "email":      request.form["email"].strip(),
            "status":     request.form["status"],
        }})
        flash("Staff updated!", "success")
        return redirect(url_for("staff_list"))
    return render_template("edit_staff.html", member=member)


# ─────────────────────────────────────────────────────────────
#  STAFF — Delete
# ─────────────────────────────────────────────────────────────
@app.route("/staff/delete/<id>")
def delete_staff(id):
    if not logged_in():
        return redirect(url_for("login"))
    staff.delete_one({"_id": ObjectId(id)})
    flash("Staff removed.", "success")
    return redirect(url_for("staff_list"))


# ─────────────────────────────────────────────────────────────
#  EQUIPMENT — List
# ─────────────────────────────────────────────────────────────
@app.route("/equipment")
def equipment_list():
    if not logged_in():
        return redirect(url_for("login"))
    search = request.args.get("search", "")
    query  = {}
    if search:
        query["$or"] = [
            {"name":     {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
        ]
    all_eq = list(equipment.find(query).sort("name", 1))
    return render_template("equipment.html", equipment=all_eq, search=search)


# ─────────────────────────────────────────────────────────────
#  EQUIPMENT — Add
# ─────────────────────────────────────────────────────────────
@app.route("/equipment/add", methods=["GET", "POST"])
def add_equipment():
    if not logged_in():
        return redirect(url_for("login"))
    if request.method == "POST":
        equipment.insert_one({
            "name":         request.form["name"].strip(),
            "type":         request.form["type"].strip(),
            "quantity":     int(request.form["quantity"]),
            "location":     request.form["location"].strip(),
            "condition":    request.form["condition"],
            "last_checked": request.form["last_checked"],
            "added_at":     datetime.now().strftime("%Y-%m-%d")
        })
        flash("Equipment added!", "success")
        return redirect(url_for("equipment_list"))
    return render_template("add_equipment.html")


# ─────────────────────────────────────────────────────────────
#  EQUIPMENT — Edit
# ─────────────────────────────────────────────────────────────
@app.route("/equipment/edit/<id>", methods=["GET", "POST"])
def edit_equipment(id):
    if not logged_in():
        return redirect(url_for("login"))
    item = equipment.find_one({"_id": ObjectId(id)})
    if not item:
        flash("Equipment not found.", "error")
        return redirect(url_for("equipment_list"))
    if request.method == "POST":
        equipment.update_one({"_id": ObjectId(id)}, {"$set": {
            "name":         request.form["name"].strip(),
            "type":         request.form["type"].strip(),
            "quantity":     int(request.form["quantity"]),
            "location":     request.form["location"].strip(),
            "condition":    request.form["condition"],
            "last_checked": request.form["last_checked"],
        }})
        flash("Equipment updated!", "success")
        return redirect(url_for("equipment_list"))
    return render_template("edit_equipment.html", item=item)


# ─────────────────────────────────────────────────────────────
#  EQUIPMENT — Delete
# ─────────────────────────────────────────────────────────────
@app.route("/equipment/delete/<id>")
def delete_equipment(id):
    if not logged_in():
        return redirect(url_for("login"))
    equipment.delete_one({"_id": ObjectId(id)})
    flash("Equipment removed.", "success")
    return redirect(url_for("equipment_list"))


# ─────────────────────────────────────────────────────────────
#  RUN
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True)
