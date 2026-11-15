import sqlite3

conn = sqlite3.connect('backend/supershop.db')
cur = conn.cursor()
cur.execute('PRAGMA table_info(banners)')
cols = [row[1] for row in cur.fetchall()]
print('Existing columns:', cols)

if 'name' not in cols:
    cur.execute('ALTER TABLE banners ADD COLUMN name TEXT')
    print('Added column name')

if 'button_text' not in cols:
    cur.execute("ALTER TABLE banners ADD COLUMN button_text TEXT DEFAULT 'Shop Now'")
    print('Added column button_text')

if 'created_at' not in cols:
    cur.execute('ALTER TABLE banners ADD COLUMN created_at TIMESTAMP')
    cur.execute('UPDATE banners SET created_at = datetime("now")')
    print('Added column created_at')

if 'updated_at' not in cols:
    cur.execute('ALTER TABLE banners ADD COLUMN updated_at TIMESTAMP')
    cur.execute('UPDATE banners SET updated_at = datetime("now")')
    print('Added column updated_at')

cur.execute("UPDATE banners SET name = title WHERE name IS NULL OR name = ''")
cur.execute("UPDATE banners SET button_text = 'Shop Now' WHERE button_text IS NULL OR button_text = ''")
conn.commit()

cur.execute('PRAGMA table_info(banners)')
print('Updated columns:', [row[1] for row in cur.fetchall()])
conn.close()
print('Migration completed successfully!')
