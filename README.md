# SuShop - Full-Stack Supershop & Admin Panel

A modern, enterprise-ready full-stack e-commerce web platform featuring both a customer-facing storefront and a comprehensive 12-module back-office administrator control panel.

---

## 🛠️ Tech Stack
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, SQLite (with automatic MySQL fallback), JWT Authentication, Bcrypt, Pytest.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Context API.
- **Database**: SQLite (`backend/supershop.db`, fully pre-seeded with products, categories, users, orders, and settings).

---

## 🚀 Quick Start (Running on Localhost)

### 1. Requirements
Ensure the following are installed on your machine:
- **Python 3.10+**: [python.org](https://www.python.org/)
- **Node.js 18+ & npm**: [nodejs.org](https://nodejs.org/)

---

### 2. Easiest 1-Click Launch (Windows)
Simply double-click:
```
run_fullstack.bat
```
This automatically starts both the FastAPI Backend and the React Frontend in two command windows and launches the application.

---

### 3. Manual Startup (Any OS / Terminal)

#### Step 1: Start Backend
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API is running at: `http://127.0.0.1:8000`
- Interactive Swagger API Documentation: `http://127.0.0.1:8000/docs`

#### Step 2: Start Frontend
Open a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
- Storefront & Admin are running at: `http://localhost:5173`

---

## 🔑 Login Credentials

| Role | Email | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@sushop.com` | `admin123` | Full access to Back-Office Admin Panel (`/admin`), PIM, Inventory, Orders, CRM, Analytics |
| **Fulfillment Operator**| `operator@sushop.com` | `operator123` | Order processing, picking, packing, and dispatch with PII masking |
| **Customer** | `customer@sushop.com` | `customer123` | Storefront browsing, cart, checkout, order history & live tracking, GDPR privacy tools |
| **Wholesale / B2B** | `wholesale@sushop.com` | `wholesale123` | B2B bulk tiered volume pricing |

---

## 🧪 Running Automated Tests
```bash
python -m pytest backend/test_api.py -v
```
All 10 unit and integration tests will verify the state machine, inventory reservation, coupon engine, PII masking, and analytics.
