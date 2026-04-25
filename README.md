# Bon Goût - Full-Stack Food Ordering Platform

Bon Goût is a professional, full-stack food ordering application built with **React.js** and **Django**. It features a modern, responsive UI, secure user authentication, real-time cart management, and integrated Razorpay payments.

## 🚀 Features

- **User Authentication**: Secure signup and login using JWT tokens and OTP verification.
- **Role-Based Access**: Distinct views for Customers, Employees, and Admins.
- **Menu Management**: Browse categories, search menu items, and view item details.
- **Cart System**: Add/remove items, update quantities, and calculate totals in real-time.
- **Order Tracking**: Customers can view their order history and current status.
- **Admin Dashboard**: Manage staff accounts, menu items, and view system logs.
- **Responsive UI**: Built with Tailwind CSS for a seamless experience across all devices.
- **Payment Integration**: Secure online payments via Razorpay.

## 🛠 Tech Stack

### Frontend
- **React.js**: Functional components and Hooks.
- **Tailwind CSS**: Modern styling and responsive design.
- **Axios**: API communication with interceptors for token management.
- **React Context API**: Global state management (Auth, Cart, Theme).
- **Lucide React & React Icons**: Professional iconography.

### Backend
- **Django**: Robust Python web framework (The primary server-side logic).
- **Node.js**: Used for the frontend development environment, package management (NPM), and the React build process.
- **Django REST Framework (DRF)**: Powerful toolkit for building Web APIs.
- **SimpleJWT**: Secure JSON Web Token authentication.
- **MySQL**: Relational database for structured data management.
- **Whitenoise**: Efficient static file serving for production.

## 📂 Project Structure

```text
reactfn/
├── backend/                # Django Backend
│   ├── bon_gout/           # Project configuration (settings, urls)
│   ├── restaurant/         # Main app (Menu, Orders, Payments)
│   ├── users/              # User management (Auth, OTP, Profiles)
│   ├── manage.py           # Django CLI
│   └── requirements.txt    # Python dependencies
├── bon-gout/               # React Frontend
│   ├── public/             # Static assets
│   ├── src/                
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Global state providers
│   │   ├── pages/          # Full page views
│   │   ├── services/       # API configuration (Axios)
│   │   └── utils/          # Helper functions
│   ├── package.json        # Node.js dependencies
│   └── tailwind.config.js  # Styling configuration
└── .gitignore              # Git ignore rules
```

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.x
- Node.js (v16+)
- MySQL (or SQLite for local dev)

### Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables (see below).
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd bon-gout
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (see below).
4. Start the React app:
   ```bash
   npm start
   ```

## 🔑 Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
DEBUG=True
SECRET_KEY=your_django_secret_key
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
ADMIN_SECRET_CODE=your_admin_signup_code
```

### Frontend (`bon-gout/.env`)
Create a `.env` file in the `bon-gout/` directory:
```env
REACT_APP_API_URL=http://127.0.0.1:8000/api/
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_id
```

## 📡 API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/users/register/` | POST | Public user registration |
| `/api/users/login/` | POST | JWT Login (returns tokens) |
| `/api/restaurant/menu/` | GET | List all menu items |
| `/api/restaurant/orders/` | POST | Place a new order |
| `/api/users/profile/` | GET | Get logged-in user profile |

## 🚀 How to Run
1. Ensure your MySQL database is running.
2. Start the Django backend (`python manage.py runserver`).
3. Start the React frontend (`npm start`).
4. Access the app at `http://localhost:3000`.

## ✍️ Author
**[NANDEESHWAR REDDY]**
- GitHub: [@Vikkyreddy08](https://github.com/Vikkyreddy08)
- Role: Full Stack Developer

---
*Created with ❤️ as part of the Bon Goût project.*
