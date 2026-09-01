import sqlite3
from werkzeug.security import generate_password_hash

DB_FILE = 'database.db'

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    
    # Create leads table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create offers table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS offers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            subtitle TEXT,
            badge TEXT,
            badge_type TEXT,
            single_price TEXT,
            multi_price TEXT,
            note TEXT,
            validity TEXT,
            cta_text TEXT
        )
    ''')
    
    # Create admins table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # Seed admin user if no admins exist
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM admins')
    if cur.fetchone()[0] == 0:
        password_hash = generate_password_hash('admin123')
        conn.execute('INSERT INTO admins (username, password) VALUES (?, ?)', ('admin', password_hash))
        print("Seed admin created: username='admin', password='admin123'")

    # Seed default offer if no offers exist
    cur.execute('SELECT COUNT(*) FROM offers')
    if cur.fetchone()[0] == 0:
        conn.execute('''
            INSERT INTO offers (title, subtitle, badge, badge_type, single_price, multi_price, note, validity, cta_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            "Migrate Tally ERP9 to TallyPrime — Act Now!",
            "TSS Pricing valid till 30th June, 2026",
            "🔥 HOT DEAL",
            "hot",
            "₹4,500",
            "₹13,500",
            "⚠️ Price hike effective 1st July, 2026. TSS won't be applicable on Tally ERP9 after July 1st!",
            "Offer valid till 30th June, 2026",
            "Get This Deal"
        ))
        print("Seed offer created.")

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully.")
