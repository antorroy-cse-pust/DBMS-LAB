# University Fire Management System

A full-stack web application for managing fire incidents, staff, and equipment at a university, built with Flask and MongoDB.

## Features

- User registration, login, and logout with hashed passwords (bcrypt)
- Dashboard with live statistics (total incidents, active/resolved, staff, equipment, critical cases)
- Fire incident tracking — add, edit, delete, search, and filter by severity/status
- Staff management — add, edit, delete, and search
- Equipment management — add, edit, delete, and search
- Flash messages for user feedback on every action

## Tech Stack

- **Backend:** Flask (Python)
- **Database:** MongoDB
- **Frontend:** HTML, CSS, Jinja2 templates
- **Auth:** bcrypt password hashing, Flask sessions

## Project Structure

```
fire_management/
├── app.py                 # Flask application and routes
├── requirements.txt        # Python dependencies
├── .env.example             # Sample environment variables
├── static/
│   └── css/
│       └── style.css
└── templates/
    ├── base.html
    ├── login.html
    ├── register.html
    ├── dashboard.html
    ├── incidents.html
    ├── add_incident.html
    ├── edit_incident.html
    ├── staff.html
    ├── add_staff.html
    ├── edit_staff.html
    ├── equipment.html
    ├── add_equipment.html
    └── edit_equipment.html
```

## Getting Started

### Prerequisites

- Python 3.10+
- MongoDB (running locally, or a connection string to a hosted instance)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/<your-username>/fire-management-system.git
   cd fire-management-system
   ```

2. Create a virtual environment (recommended)
   ```
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   ```

3. Install dependencies
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables
   ```
   cp .env.example .env
   ```
   Then edit `.env` and set your own `SECRET_KEY` and `MONGO_URI`.

5. Make sure MongoDB is running, then start the app
   ```
   python app.py
   ```

6. Open your browser at `http://127.0.0.1:5000`

## Usage

1. Register a new account with your name, email, password, and role
2. Log in
3. Use the dashboard to get an overview, and the Incidents, Staff, and Equipment pages to manage records

## License

This project is open source and available under the [MIT License](LICENSE).
