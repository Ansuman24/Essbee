from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import jwt
from werkzeug.security import check_password_hash
from database import get_db_connection, init_db
import os
import datetime
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText

load_dotenv()

app = Flask(__name__)
CORS(app)

SECRET_KEY = os.getenv('SECRET_KEY', 'super-secret-jwt-key')
SMTP_EMAIL = os.getenv('SMTP_EMAIL')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL')

@app.route('/')
def index():
    return send_from_directory(app.root_path, 'index.html')

ALLOWED_DIRS = ['css', 'js', 'assets']
ALLOWED_FILES = ['index.html']

@app.route('/<path:path>')
def serve_static(path):
    if path in ALLOWED_FILES:
        return send_from_directory(app.root_path, path)
    
    for d in ALLOWED_DIRS:
        if path.startswith(d + '/'):
            return send_from_directory(app.root_path, path)
            
    return jsonify({'error': 'Access Denied'}), 403

def send_notification_email(name, email, phone, message):
    if not SMTP_EMAIL or not SMTP_PASSWORD or not ADMIN_EMAIL:
        print("Email configuration missing. Skipping email notification.")
        return

    subject = f"New Lead from {name} on Essbee Website"
    body = f"New lead received:\n\nName: {name}\nEmail: {email}\nPhone: {phone}\n\nMessage:\n{message}"
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = SMTP_EMAIL
    msg['To'] = ADMIN_EMAIL

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Notification email sent to {ADMIN_EMAIL}")
    except Exception as e:
        print(f"Failed to send email: {e}")

@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone', '')
    message = data.get('message', '')

    if not name or not email:
        return jsonify({'error': 'Name and email are required'}), 400

    conn = get_db_connection()
    conn.execute('INSERT INTO leads (name, email, phone, message) VALUES (?, ?, ?, ?)',
                 (name, email, phone, message))
    conn.commit()
    conn.close()

    # Send email notification asynchronously or synchronously
    send_notification_email(name, email, phone, message)

    return jsonify({'message': 'Message sent successfully'})

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    conn = get_db_connection()
    admin = conn.execute('SELECT * FROM admins WHERE username = ?', (username,)).fetchone()
    conn.close()

    if admin and check_password_hash(admin['password'], password):
        token = jwt.encode({
            'user': username,
            'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm='HS256')
        return jsonify({'token': token})

    return jsonify({'error': 'Invalid credentials'}), 401

def token_required(f):
    def decorator(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'Token is missing'}), 401
        
        token = token.split(' ')[1]
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except Exception as e:
            return jsonify({'error': 'Token is invalid'}), 401
            
        return f(*args, **kwargs)
    decorator.__name__ = f.__name__
    return decorator

@app.route('/api/admin/leads', methods=['GET'])
@token_required
def get_leads():
    conn = get_db_connection()
    leads = conn.execute('SELECT * FROM leads ORDER BY created_at DESC').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in leads])

@app.route('/api/admin/leads/<int:lead_id>', methods=['DELETE'])
@token_required
def delete_lead(lead_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM leads WHERE id = ?', (lead_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Lead deleted successfully'})

@app.route('/api/offers', methods=['GET'])
def get_offers():
    conn = get_db_connection()
    offers = conn.execute('SELECT * FROM offers ORDER BY id DESC').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in offers])

@app.route('/api/admin/offers', methods=['POST'])
@token_required
def add_offer():
    data = request.json
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO offers (title, subtitle, badge, badge_type, single_price, multi_price, note, validity, cta_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('title'), data.get('subtitle'), data.get('badge'), data.get('badgeType'),
        data.get('singlePrice'), data.get('multiPrice'), data.get('note'), data.get('validity'), data.get('ctaText')
    ))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Offer added successfully'})

@app.route('/api/admin/offers/<int:offer_id>', methods=['DELETE'])
@token_required
def delete_offer(offer_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM offers WHERE id = ?', (offer_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Offer deleted successfully'})

if __name__ == '__main__':
    # Initialize DB if it doesn't exist
    if not os.path.exists('database.db'):
        init_db()
    app.run(debug=True, port=5000)
